import type { BlastItem, BlastLevel, BlastReport } from '../types'
import { isLiteral, isLocalPath, migrationStatus, type Risk, type RiskKind } from './classify'

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
  level?: BlastLevel
}

export async function measure(run: Run, risk: Risk, command: string): Promise<BlastReport | null> {
  const env = allowedEnv(risk)
  const exec: Run = argv => run(argv, env)
  const measured = await measureRisk(exec, risk, run)
  if (measured === null) return null
  const { items, total = items.length, totalBytes, noun } = measured
  const notes = [...(measured.notes ?? []), ...envNote(risk)]
  const sorted = items.some(item => item.bytes !== undefined)
    ? [...items].sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0))
    : items

  return {
    command,
    level: measured.level ?? risk.level,
    noun,
    items: sorted.slice(0, MAX_ITEMS),
    total,
    ...(totalBytes === undefined ? {} : { totalBytes }),
    notes: notes.slice(0, 4),
  }
}

// Only variables that select a target are repeated in a dry run. PATH, LD_*,
// GIT_CONFIG_* and the like can make a dry run execute model-chosen code.
const ENV_ALLOW: Record<RiskKind, readonly string[]> = {
  rm: [],
  'git-reset': [],
  'git-clean': [],
  'git-push': [],
  migration: ['DATABASE_URL', 'RAILS_ENV', 'DJANGO_SETTINGS_MODULE', 'NODE_ENV', 'APP_ENV'],
  docker: ['DOCKER_CONTEXT', 'COMPOSE_FILE', 'COMPOSE_PROJECT_NAME', 'COMPOSE_PROFILES'],
  terraform: ['TF_WORKSPACE', 'TF_DATA_DIR'],
  kubectl: ['KUBECONFIG'],
}

function allowedEnv(risk: Risk): Record<string, string> {
  return Object.fromEntries(Object.entries(risk.env).filter(([name]) => ENV_ALLOW[risk.kind].includes(name)))
}

function envNote(risk: Risk): string[] {
  const dropped = [
    ...Object.keys(risk.env).filter(name => !ENV_ALLOW[risk.kind].includes(name)),
    ...risk.unappliedEnv,
  ]

  return dropped.length === 0 ? [] : [`env not applied: ${dropped.join(', ')}`]
}

function measureRisk(run: Run, risk: Risk, bareRun: Run): Promise<Measured | null> {
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
    case 'docker':
      return measureDocker(run, risk)
    case 'terraform':
      return measureTerraform(run, risk)
    case 'kubectl':
      return measureKubectl(run, risk, bareRun)
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
  if (files.length === 0 && notes.length === 0) notes.push('no files found under the targets')

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

type VolumeSizes = Map<string, number>

const DOCKER_SIZE_UNITS: Record<string, number> = { B: 1, kB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 }

function parseDockerSize(text: string): number | undefined {
  const match = /^([\d.]+)\s*([kMGT]?B)$/.exec(text)
  const unit = DOCKER_SIZE_UNITS[match?.[2] ?? '']

  return match === null || unit === undefined ? undefined : Math.round(Number(match[1]) * unit)
}

async function volumeSizes(run: Run, options: string[]): Promise<VolumeSizes> {
  const sizes: VolumeSizes = new Map()
  const result = await run(['docker', ...options, 'system', 'df', '-v', '--format', '{{json .Volumes}}'])
  if (result === null || result.exitCode !== 0) return sizes
  try {
    const volumes: unknown = JSON.parse(result.stdout)
    if (!Array.isArray(volumes)) return sizes
    for (const volume of volumes as { Name?: string; Size?: string }[]) {
      const bytes = parseDockerSize(volume.Size ?? '')
      if (volume.Name !== undefined && bytes !== undefined) sizes.set(volume.Name, bytes)
    }
  } catch {
    return sizes
  }

  return sizes
}

function volumeItems(names: string[], sizes: VolumeSizes): { items: BlastItem[]; totalBytes?: number } {
  const items = names.map((label): BlastItem => {
    const bytes = sizes.get(label)

    return bytes === undefined ? { label } : { label, bytes }
  })
  const known = items.filter(item => item.bytes !== undefined)
  if (known.length === 0) return { items }

  return { items, totalBytes: known.reduce((sum, item) => sum + (item.bytes ?? 0), 0) }
}

// The real names of the volumes `down -v` removes: compose resolves them to
// `<project>_<name>` and leaves external ones alone.
async function composeVolumeNames(run: Run, risk: Risk): Promise<string[] | null> {
  const head = risk.bin === 'docker-compose' ? ['docker-compose'] : ['docker', ...risk.options, 'compose']
  const result = await run([...head, ...risk.prefix, 'config', '--format', 'json'])
  if (result === null || result.exitCode !== 0) return null
  try {
    const config = JSON.parse(result.stdout) as {
      volumes?: Record<string, { name?: string; external?: boolean } | null>
    }

    return Object.entries(config.volumes ?? {}).flatMap(([key, volume]) =>
      volume?.external === true ? [] : [volume?.name ?? key],
    )
  } catch {
    return null
  }
}

async function measureDocker(run: Run, risk: Risk): Promise<Measured> {
  if (risk.sub === 'system-prune') {
    const result = await run(['docker', ...risk.options, 'system', 'df', '--format', '{{.Type}}: {{.Reclaimable}} reclaimable'])
    if (result === null || result.exitCode !== 0) return failed('docker system df')

    return {
      noun: 'resource kinds',
      items: lines(result).map(label => ({ label })),
      notes: ['also removes stopped containers and unused networks'],
    }
  }
  if (risk.sub === 'volume-rm') {
    const sizes = await volumeSizes(run, risk.options)
    const missing = sizes.size > 0 ? risk.targets.filter(name => !sizes.has(name)) : []
    const { items, totalBytes } = volumeItems(risk.targets, sizes)

    return {
      noun: 'volumes',
      items,
      ...(totalBytes === undefined ? {} : { totalBytes }),
      notes: missing.length > 0 ? [`not found: ${missing.join(', ')}`] : [],
    }
  }
  let names: string[]
  if (risk.sub === 'volume-prune') {
    const result = await run(['docker', ...risk.options, 'volume', 'ls', '-q', '-f', 'dangling=true'])
    if (result === null || result.exitCode !== 0) return failed('docker volume ls')
    names = lines(result)
  } else {
    const composed = await composeVolumeNames(run, risk)
    if (composed === null) return failed('docker compose config')
    names = composed
  }
  const { items, totalBytes } = volumeItems(names, await volumeSizes(run, risk.options))

  return { noun: 'volumes', items, ...(totalBytes === undefined ? {} : { totalBytes }) }
}

async function measureTerraform(run: Run, risk: Risk): Promise<Measured> {
  const binary = risk.bin === 'tofu' ? 'tofu' : 'terraform'
  const chdir = risk.argv.filter(token => token.startsWith('-chdir='))
  if (risk.sub === 'apply' && risk.level !== 'critical') {
    const result = await run([binary, ...chdir, 'workspace', 'show'])
    if (result === null || result.exitCode !== 0) return failed(`${binary} workspace show`)

    return {
      noun: 'workspace',
      items: [{ label: `workspace: ${lines(result)[0] ?? 'unknown'}` }],
      notes: ['no plan was run'],
    }
  }
  const result = await run([binary, ...chdir, 'state', 'list'])
  if (result === null || result.exitCode !== 0) return failed(`${binary} state list`)

  return { noun: 'resources', items: lines(result).map(label => ({ label })) }
}

const KUBECTL_SAFE_VALUE_FLAGS = new Set(['-n', '--namespace', '-l', '--selector', '-f', '--filename', '--field-selector'])
const KUBECTL_SAFE_BOOLEAN_FLAGS = new Set(['--all', '-A', '--all-namespaces', '-R', '--recursive', '--ignore-not-found'])
const KUBECTL_PREFIX_FLAGS = new Set(['--context', '--kubeconfig'])

const isFileFlag = (flag: string) => flag === '-f' || flag === '--filename'
// A URL or a path outside the project would make kubectl read or fetch it before approval.
const isLocalFile = (value: string) => !value.includes('://') && isLocalPath(value)

// A dry run is built from the flags known to be harmless, never by replaying
// the command: anything else (`--`, `--server`, an unknown flag) is not measured.
function kubectlDeleteArgv(risk: Risk): string[] | null {
  const tokens = risk.argv.slice(1)
  const verbAt = tokens.indexOf('delete')
  if (verbAt < 0) return null
  const kept: string[] = []
  const rest = [...tokens.slice(0, verbAt), ...tokens.slice(verbAt + 1)]
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i] as string
    const [flag = token] = token.split('=')
    if (KUBECTL_PREFIX_FLAGS.has(token)) {
      i += 1
    } else if (KUBECTL_PREFIX_FLAGS.has(flag)) {
      continue
    } else if (KUBECTL_SAFE_VALUE_FLAGS.has(token) && rest[i + 1] !== undefined) {
      if (isFileFlag(token) && !isLocalFile(rest[i + 1] as string)) return null
      kept.push(token, rest[i + 1] as string)
      i += 1
    } else if (token.includes('=') && KUBECTL_SAFE_VALUE_FLAGS.has(flag)) {
      if (isFileFlag(flag) && !isLocalFile(token.slice(flag.length + 1))) return null
      kept.push(token)
    } else if (KUBECTL_SAFE_BOOLEAN_FLAGS.has(token)) {
      kept.push(token)
    } else if (token.startsWith('-')) {
      return null
    } else {
      kept.push(token)
    }
  }

  const context = risk.prefix.filter((token, at) => token.startsWith('--context=') || token === '--context' || risk.prefix[at - 1] === '--context')

  return [risk.bin, ...context, 'delete', '--dry-run=client', '-o', 'name', ...kept]
}

async function measureKubectl(run: Run, risk: Risk, bareRun: Run): Promise<Measured | null> {
  const binary = risk.bin === 'oc' ? 'oc' : 'kubectl'
  const flagAt = risk.prefix.indexOf('--context')
  const given =
    flagAt >= 0
      ? risk.prefix[flagAt + 1]
      : risk.prefix.find(token => token.startsWith('--context='))?.slice('--context='.length)
  // A context or kubeconfig that needs shell expansion cannot be read as typed: the
  // call is held as an unknown context rather than judged against the wrong cluster.
  const kubeconfigValues = risk.prefix.flatMap((token, at) =>
    token === '--kubeconfig' ? [risk.prefix[at + 1] ?? ''] : token.startsWith('--kubeconfig=') ? [token.slice(13)] : [],
  )
  const isUnreadable =
    risk.unappliedEnv.includes('KUBECONFIG') ||
    kubeconfigValues.some(value => !isLiteral(value)) ||
    (given !== undefined && !isLiteral(given))
  const current = isUnreadable
    ? undefined
    : given ?? lines(await run([binary, ...risk.prefix, 'config', 'current-context']))[0]
  const isProd = current !== undefined && /prod/i.test(current)
  const level: BlastLevel = isProd ? 'critical' : risk.level
  const notes = [`context: ${current ?? 'unknown'}`]

  if (risk.sub !== 'delete') {
    if (current !== undefined && !isProd) return null
    if (current === undefined) notes.push('could not read the context')

    return { noun: 'change', items: [{ label: `${risk.sub} on ${current ?? 'unknown context'}` }], level, notes }
  }
  // Only reading the context may use a kubeconfig the command named: a delete dry
  // run talks to the cluster with its credentials, so it needs the user's own.
  const hasCustomConfig = isUnreadable || kubeconfigValues.length > 0 || 'KUBECONFIG' in risk.env
  const argv = hasCustomConfig ? null : kubectlDeleteArgv(risk)
  if (argv === null) {
    return { noun: 'objects', items: [], level, notes: [...notes, hasCustomConfig ? 'could not measure: a custom kubeconfig is not used for the dry run' : 'could not measure: unsupported kubectl flags'] }
  }
  const result = await bareRun(argv)
  if (result === null || result.exitCode !== 0) {
    return { noun: 'objects', items: [], level, notes: [...notes, `could not measure: ${binary} dry run failed`] }
  }

  return { noun: 'objects', items: lines(result).map(label => ({ label })), level, notes }
}
