import type { BlastItem, BlastReport } from '../types'
import { migrationStatus, type Risk, type RiskKind } from './classify'

export type RunResult = { exitCode: number; stdout: string; stderr: string }
export type Run = (argv: string[], env?: Record<string, string>) => Promise<RunResult | null>

const MAX_ITEMS = 8
const MAX_LINES = 500

type Measured = {
  noun: string
  items: BlastItem[]
  total?: number
  totalBytes?: number
  notes?: string[]
}

// Only variables that select a target are repeated in a dry run. PATH, LD_*,
// GIT_CONFIG_* and the like can make a dry run execute model-chosen code.
const ENV_ALLOW: Record<RiskKind, readonly string[]> = {
  rm: [],
  'git-reset': [],
  'git-clean': [],
  'git-push': [],
  migration: ['DATABASE_URL', 'RAILS_ENV', 'DJANGO_SETTINGS_MODULE', 'NODE_ENV', 'APP_ENV'],
}

export async function measure(run: Run, risk: Risk, command: string): Promise<BlastReport> {
  const env = allowedEnv(risk)
  const exec: Run = argv => run(argv, env)
  const measured = await measureRisk(exec, risk)
  const { items, total = items.length, totalBytes, noun } = measured
  const notes = [...risk.notes, ...(measured.notes ?? []), ...envNote(risk)]
  const sorted = items.some(item => item.bytes !== undefined)
    ? [...items].sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0))
    : items

  return {
    command,
    noun,
    items: sorted.slice(0, MAX_ITEMS),
    total,
    ...(totalBytes === undefined ? {} : { totalBytes }),
    notes: notes.slice(0, 5),
  }
}

function allowedEnv(risk: Risk): Record<string, string> {
  return Object.fromEntries(
    Object.entries(risk.env).filter(([name]) => ENV_ALLOW[risk.kind].includes(name)),
  )
}

function envNote(risk: Risk): string[] {
  const dropped = [
    ...Object.keys(risk.env).filter(name => !ENV_ALLOW[risk.kind].includes(name)),
    ...risk.unappliedEnv,
  ]

  return dropped.length === 0 ? [] : [`env not applied: ${dropped.join(', ')}`]
}

function measureRisk(run: Run, risk: Risk): Promise<Measured> {
  if (risk.unsafe.length > 0) {
    return Promise.resolve({
      noun: 'items',
      items: [],
      notes: [`could not measure: ${risk.unsafe.join(', ')} is not repeated in a dry run`],
    })
  }
  switch (risk.kind) {
    case 'rm':
      return measureRm(run, risk)
    case 'git-reset':
      return measureGitReset(run, risk)
    case 'git-clean':
      return measureGitClean(run, risk)
    case 'git-push':
      return measureGitPush(run, risk)
    case 'migration':
      return measureMigration(run, risk)
  }
}

function lines(result: RunResult | null): string[] {
  if (result === null) return []

  return result.stdout
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
    .slice(0, MAX_LINES)
}

function failed(what: string): Measured {
  return { noun: 'items', items: [], notes: [`could not measure: ${what} failed`] }
}

async function measureRm(run: Run, risk: Risk): Promise<Measured> {
  const files: BlastItem[] = []
  const notes: string[] = []
  let totalBytes = 0
  let total = 0

  for (const target of risk.targets.slice(0, 20)) {
    if (/[*?[~$]/.test(target)) {
      notes.push(`not expanded, not measured: ${target}`)
      continue
    }
    const path = target.startsWith('-') ? `./${target}` : target
    const result = await run(['find', path, '-type', 'f', '-exec', 'du', '-k', '{}', '+'])
    if (result === null) {
      notes.push(`could not measure: ${target}`)
      continue
    }
    const found = result.stdout.split('\n').flatMap(line => {
      const match = /^(\d+)\t(.+)$/.exec(line)

      return match === null ? [] : [{ label: match[2] as string, bytes: Number(match[1]) * 1024 }]
    })
    if (found.length === 0 && result.exitCode !== 0) notes.push(`not found or unreadable: ${target}`)
    for (const file of found) {
      files.push(file)
      totalBytes += file.bytes
      total += 1
    }
  }
  if (files.length === 0 && notes.length === 0 && risk.notes.length === 0) {
    notes.push('no files found under the targets')
  }

  return { noun: total === 1 ? 'file' : 'files', items: files, total, totalBytes, notes }
}

async function measureGitReset(run: Run, risk: Risk): Promise<Measured> {
  const result = await run(['git', ...risk.prefix, 'status', '--porcelain'])
  if (result === null || result.exitCode !== 0) return failed('git status')
  const changed = lines(result).filter(line => !line.startsWith('??'))
  const notes = risk.targets[0] === undefined ? [] : [`also moves HEAD to ${risk.targets[0]}`]

  return { noun: 'changed files', items: changed.map(label => ({ label })), notes }
}

async function measureGitClean(run: Run, risk: Risk): Promise<Measured> {
  const extra = ['d', 'x', 'X'].filter(letter => risk.flags.includes(letter)).map(letter => `-${letter}`)
  const paths = risk.targets.length === 0 ? [] : ['--', ...risk.targets]
  const result = await run(['git', ...risk.prefix, 'clean', '-n', ...extra, ...risk.options, ...paths])
  if (result === null || result.exitCode !== 0) return failed('git clean -n')
  const removed = lines(result).map(line => line.replace(/^Would remove /, ''))

  return { noun: 'untracked paths', items: removed.map(label => ({ label })) }
}

function pushRef(targets: string[]): string {
  const [remote, spec] = targets
  if (remote === undefined || spec === undefined) return '@{u}'
  const destination = (spec.replace(/^\+/, '').split(':').pop() ?? spec).replace(/^refs\/heads\//, '')

  return `${remote}/${destination}`
}

async function measureGitPush(run: Run, risk: Risk): Promise<Measured> {
  const ref = pushRef(risk.targets)
  const notes = ['from local remote-tracking refs; nothing was fetched']
  if (ref.startsWith('-')) return { noun: 'remote commits', items: [], notes: ['unreadable ref', ...notes] }
  const result = await run(['git', ...risk.prefix, 'log', '--oneline', '--max-count=50', `HEAD..${ref}`])
  if (result === null || result.exitCode !== 0) return failed(`git log HEAD..${ref}`)

  return { noun: 'remote commits', items: lines(result).map(label => ({ label })), notes }
}

async function measureMigration(run: Run, risk: Risk): Promise<Measured> {
  const argv = migrationStatus(risk.argv, risk.sub)
  if (argv === null) {
    return { noun: 'lines', items: [], notes: [`no read-only listing for ${risk.sub}`] }
  }
  const result = await run(argv)
  if (result === null) return failed(argv.join(' '))
  const stdout = lines(result)
  const out = stdout.length > 0 ? stdout : result.stderr.split('\n').map(line => line.trim()).filter(Boolean)

  return {
    noun: 'status lines',
    items: out.slice(0, MAX_LINES).map(label => ({ label })),
    notes: result.exitCode === 0 ? [] : [`${argv.join(' ')} exited ${result.exitCode}`],
  }
}
