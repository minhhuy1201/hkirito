import type { BlastLevel } from '../types'

export type RiskKind =
  | 'rm'
  | 'git-reset'
  | 'git-clean'
  | 'git-push'
  | 'migration'
  | 'docker'
  | 'terraform'
  | 'kubectl'

export type Risk = {
  kind: RiskKind
  sub: string
  level: BlastLevel
  argv: string[]
  targets: string[]
  bin: string
  prefix: string[]
  options: string[]
  env: Record<string, string>
  unappliedEnv: string[]
  // Options a dry run must not repeat (docker --config, git --git-dir): they point at
  // files that can load code.
  unsafe: string[]
  flags: string
}

const LEVEL_RANK: Record<BlastLevel, number> = { medium: 1, high: 2, critical: 3 }
const WRAPPER_VALUE_FLAGS = new Map<string, ReadonlySet<string>>([
  ['sudo', new Set(['-u', '-g', '-h', '-p', '-C', '-D', '-r', '-t', '-U', '-R', '-T'])],
  ['doas', new Set(['-u', '-C'])],
  ['env', new Set(['-u', '-C', '-S'])],
  ['timeout', new Set(['-s', '-k', '--signal', '--kill-after'])],
  ['nice', new Set(['-n', '--adjustment'])],
  ['ionice', new Set(['-c', '-n', '-p', '--class', '--classdata'])],
  ['stdbuf', new Set(['-i', '-o', '-e'])],
  ['exec', new Set(['-a'])],
  ['command', new Set()],
  ['time', new Set()],
  ['nohup', new Set()],
])
const RESERVED_WORDS = new Set(['then', 'do', 'else', 'elif', 'if', 'while', 'until', '{', '!'])
const NO_FLAG_VALUES: ReadonlySet<string> = new Set()
const GIT_VALUE_GLOBALS = new Set(['--namespace', '--config-env'])
const GIT_UNSAFE_GLOBALS = new Set(['--git-dir', '--work-tree'])
const DOCKER_VALUE_GLOBALS = new Set([
  '--context', '-c', '-H', '--host', '--config', '-l', '--log-level',
  '--tlscacert', '--tlscert', '--tlskey',
])
const DOCKER_FORWARDED_GLOBALS = new Set(['--context', '-c'])
const DOCKER_UNSAFE_GLOBALS = new Set(['-H', '--host', '--config'])
// Variables that redirect a command to another daemon or repository: a dry run
// without them would measure the wrong target, and with them it can run code.
const UNSAFE_ENV = ['DOCKER_HOST', 'DOCKER_CONFIG', 'GIT_DIR', 'GIT_WORK_TREE']
const KUBECTL_FORWARDED_FLAGS = new Set(['--context', '--kubeconfig'])
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash'])
const WIDE_TARGETS = new Set(['/', '/*', '~', '~/', '$HOME', '.', '..', '*'])
const KUBECTL_MUTATING = new Set([
  'apply', 'delete', 'patch', 'scale', 'rollout', 'edit', 'replace', 'set',
  'drain', 'cordon', 'uncordon', 'taint', 'label', 'annotate', 'create', 'run',
  'expose', 'autoscale',
])
const KUBECTL_VALUE_FLAGS = new Set([
  '-n', '--namespace', '-s', '--server', '--cluster', '--user', '--request-timeout',
  '-o', '--output', '-c', '--container',
])

export function classify(command: string): Risk | null {
  let best: Risk | null = null

  for (const tokens of splitSegments(command)) {
    const risk = classifyTokens(tokens)
    if (risk === null) continue
    if (best === null || LEVEL_RANK[risk.level] > LEVEL_RANK[best.level]) best = risk
  }

  return best
}

function splitSegments(command: string): string[][] {
  const segments: string[][] = []
  let tokens: string[] = []
  let current = ''
  let hasCurrent = false
  let quote: string | null = null

  const flush = () => {
    if (!hasCurrent) return
    tokens.push(current)
    current = ''
    hasCurrent = false
  }
  const end = () => {
    flush()
    if (tokens.length === 0) return
    segments.push(stripRedirects(tokens))
    tokens = []
  }

  for (let i = 0; i < command.length; i += 1) {
    const ch = command[i] as string
    if (quote !== null) {
      if (ch === quote) quote = null
      else if (quote === '"' && ch === '\\' && i + 1 < command.length) current += command[++i]
      else current += ch
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      hasCurrent = true
      continue
    }
    if (ch === '\\' && i + 1 < command.length) {
      current += command[++i]
      hasCurrent = true
      continue
    }
    if (ch === '\n') {
      end()
      continue
    }
    if (/\s/.test(ch)) {
      flush()
      continue
    }
    if (';|&()'.includes(ch)) {
      end()
      continue
    }
    current += ch
    hasCurrent = true
  }
  end()

  return segments
}

function stripRedirects(tokens: string[]): string[] {
  const kept: string[] = []
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i] as string
    if (!/^\d*[<>]/.test(token)) {
      kept.push(token)
      continue
    }
    if (/^\d*(>>?|<)$/.test(token)) i += 1
  }

  return kept
}

function basename(path: string): string {
  return path.split('/').pop() ?? path
}

type Unwrapped = { tokens: string[]; env: Record<string, string>; unapplied: string[] }

// A path that stays inside the working directory; the only kind a dry run may use.
export function isLocalPath(path: string): boolean {
  return !(path.startsWith('/') || path.startsWith('~') || path.split('/').includes('..'))
}

export function isLiteral(value: string): boolean {
  return !(/[$`]/.test(value) || value.startsWith('~'))
}

// `env -S 'cmd args' operands` runs the string as a command line, operands appended.
function envSplitString(rest: string[]): string[] | null {
  const flag = rest[0] as string
  let value: string | undefined
  let operands = rest.slice(1)
  if (flag === '-S' || flag === '--split-string') {
    value = rest[1]
    operands = rest.slice(2)
  } else if (flag.startsWith('--split-string=')) value = flag.slice('--split-string='.length)
  else if (flag.startsWith('-S')) value = flag.slice(2)
  if (value === undefined) return null

  return [...(splitSegments(value)[0] ?? []), ...operands]
}

function unwrap(tokens: string[]): Unwrapped {
  const env: Record<string, string> = {}
  const unapplied: string[] = []
  let rest = tokens
  for (;;) {
    const head = rest[0]
    if (head === undefined) break
    if (RESERVED_WORDS.has(head)) {
      rest = rest.slice(1)
      continue
    }
    const assignment = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(head)
    if (assignment !== null) {
      const [, name = '', value = ''] = assignment
      if (isLiteral(value)) env[name] = value
      else unapplied.push(name)
      rest = rest.slice(1)
      continue
    }
    const name = basename(head)
    const valueFlags = WRAPPER_VALUE_FLAGS.get(name)
    if (valueFlags === undefined) break
    rest = rest.slice(1)
    while (rest[0]?.startsWith('-')) {
      const split = name === 'env' ? envSplitString(rest) : null
      if (split !== null) {
        rest = split
        break
      }
      rest = rest.slice(valueFlags.has(rest[0]) ? 2 : 1)
    }
    if (name === 'timeout') rest = rest.slice(1)
  }

  return { tokens: rest, env, unapplied }
}

function shellCommand(tokens: string[]): string | undefined {
  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i] as string
    if (token === '-o' || token === '+o') {
      i += 1
      continue
    }
    if (/^-[A-Za-z]*c[A-Za-z]*$/.test(token)) return tokens[i + 1]
    if (!token.startsWith('-') && !token.startsWith('+')) return undefined
  }

  return undefined
}

function classifyTokens(raw: string[]): Risk | null {
  const { tokens, env, unapplied } = unwrap(raw)
  const risk = classifyUnwrapped(tokens)
  if (risk === null) return null

  const isRedirectable = risk.kind === 'docker' || risk.kind.startsWith('git-')
  const redirected = isRedirectable ? UNSAFE_ENV.filter(name => name in env || unapplied.includes(name)) : []

  return {
    ...risk,
    env: { ...env, ...risk.env },
    unappliedEnv: [...unapplied, ...risk.unappliedEnv],
    unsafe: [...risk.unsafe, ...redirected],
  }
}

function classifyUnwrapped(tokens: string[]): Risk | null {
  const head = tokens[0]
  if (head === undefined) return null
  const name = basename(head)

  if (SHELLS.has(name)) {
    const inner = shellCommand(tokens)

    return inner === undefined ? null : classify(inner)
  }
  if (name === 'eval') return tokens.length > 1 ? classify(tokens.slice(1).join(' ')) : null
  if (name === 'rm') return classifyRm(tokens)
  if (name === 'git') return classifyGit(tokens)
  if (name === 'docker' || name === 'docker-compose') return classifyDocker(tokens, name)
  if (name === 'terraform' || name === 'tofu') return classifyTerraform(tokens)
  if (name === 'kubectl' || name === 'oc') return classifyKubectl(tokens)

  return classifyMigration(tokens)
}

function make(kind: RiskKind, sub: string, level: BlastLevel, argv: string[], extra: Partial<Risk> = {}): Risk {
  return {
    kind,
    sub,
    level,
    argv,
    targets: [],
    bin: basename(argv[0] ?? ''),
    prefix: [],
    options: [],
    env: {},
    unappliedEnv: [],
    unsafe: [],
    flags: '',
    ...extra,
  }
}

function splitArgs(
  args: string[],
  valueFlags: ReadonlySet<string> = NO_FLAG_VALUES,
): { flags: string[]; targets: string[]; taken: string[] } {
  const flags: string[] = []
  const targets: string[] = []
  const taken: string[] = []
  let isRest = false
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] as string
    if (isRest) targets.push(arg)
    else if (arg === '--') isRest = true
    else if (valueFlags.has(arg) && args[i + 1] !== undefined) {
      taken.push(arg, args[i + 1] as string)
      i += 1
    } else if (arg.startsWith('-') && arg.length > 1) flags.push(arg)
    else targets.push(arg)
  }

  return { flags, targets, taken }
}

function shortLetters(flags: string[]): string {
  return flags
    .filter(flag => /^-[A-Za-z]+$/.test(flag))
    .map(flag => flag.slice(1))
    .join('')
}

function classifyRm(tokens: string[]): Risk | null {
  const { flags, targets } = splitArgs(tokens.slice(1))
  const isRecursive = flags.includes('--recursive') || /[rR]/.test(shortLetters(flags))
  if (!isRecursive || targets.length === 0) return null
  const level = targets.some(target => WIDE_TARGETS.has(target)) ? 'high' : 'medium'

  return make('rm', 'rm', level, tokens, { targets })
}

const GIT_CLEAN_VALUE_FLAGS = new Set(['-e', '--exclude'])
const GIT_PUSH_VALUE_FLAGS = new Set(['-o', '--push-option', '--repo', '--receive-pack', '--exec'])

function classifyGit(tokens: string[]): Risk | null {
  let i = 1
  const prefix: string[] = []
  const unsafe: string[] = []
  while (tokens[i]?.startsWith('-')) {
    const token = tokens[i] as string
    const value = tokens[i + 1]
    if (token === '-C' && value !== undefined) {
      // A directory outside the project has a .git/config that can name a program to run.
      if (isLocalPath(value)) prefix.push(token, value)
      else unsafe.push(token)
      i += 2
    } else if (GIT_UNSAFE_GLOBALS.has(token) && value !== undefined) {
      unsafe.push(token)
      i += 2
    } else if (/^--(git-dir|work-tree)=/.test(token)) {
      unsafe.push(token.split('=')[0] as string)
      i += 1
    } else if (token === '-c' || GIT_VALUE_GLOBALS.has(token)) {
      // `-c key=value` is never repeated in a dry run: it can name a program to run.
      i += 2
    } else i += 1
  }
  const sub = tokens[i]
  const rest = tokens.slice(i + 1)

  if (sub === 'reset') {
    const { flags, targets } = splitArgs(rest)
    if (!flags.includes('--hard')) return null

    return make('git-reset', sub, 'high', tokens, { prefix, targets, unsafe })
  }
  if (sub === 'clean') {
    const { flags, targets, taken } = splitArgs(rest, GIT_CLEAN_VALUE_FLAGS)
    const letters = shortLetters(flags)
    const isDry = letters.includes('n') || flags.includes('--dry-run')
    const isForced = letters.includes('f') || flags.includes('--force')
    if (isDry || !isForced) return null
    const options = [...taken, ...flags.filter(flag => flag.startsWith('--exclude='))]

    return make('git-clean', sub, 'medium', tokens, { prefix, targets, options, unsafe, flags: letters })
  }
  if (sub === 'push') {
    const { flags, targets } = splitArgs(rest, GIT_PUSH_VALUE_FLAGS)
    const isForce =
      shortLetters(flags).includes('f') ||
      flags.some(flag => flag.startsWith('--force')) ||
      flags.includes('--mirror') ||
      targets.slice(1).some(target => target.startsWith('+'))
    if (!isForce) return null

    return make('git-push', sub, 'high', tokens, { prefix, targets, unsafe })
  }

  return null
}

function classifyDocker(tokens: string[], name: string): Risk | null {
  let i = 1
  const options: string[] = []
  const unsafe: string[] = []
  while (name === 'docker' && tokens[i]?.startsWith('-')) {
    const token = tokens[i] as string
    const value = tokens[i + 1]
    if (DOCKER_VALUE_GLOBALS.has(token) && value !== undefined) {
      if (DOCKER_FORWARDED_GLOBALS.has(token)) options.push(token, value)
      else if (DOCKER_UNSAFE_GLOBALS.has(token)) unsafe.push(token)
      i += 2
    } else {
      if (/^--context=/.test(token)) options.push(token)
      else if (/^--(host|config)=/.test(token)) unsafe.push(token.split('=')[0] as string)
      i += 1
    }
  }
  const rest = tokens.slice(i)
  const prefix: string[] = []

  if (name === 'docker' && rest[0] === 'system' && rest[1] === 'prune') {
    return make('docker', 'system-prune', 'high', tokens, { options, unsafe })
  }
  if (name === 'docker' && rest[0] === 'volume') {
    const verb = rest[1]
    if (verb === 'prune') return make('docker', 'volume-prune', 'high', tokens, { options, unsafe })
    if (verb === 'rm' || verb === 'remove') {
      const { targets } = splitArgs(rest.slice(2))

      return make('docker', 'volume-rm', 'high', tokens, { targets, options, unsafe })
    }

    return null
  }

  const compose = name === 'docker-compose' ? rest : rest[0] === 'compose' ? rest.slice(1) : null
  if (compose === null) return null
  for (let j = 0; j < compose.length; j += 1) {
    if ((compose[j] === '-f' || compose[j] === '-p') && compose[j + 1] !== undefined) {
      prefix.push(compose[j] as string, compose[j + 1] as string)
    }
  }
  const down = compose.indexOf('down')
  if (down < 0) return null
  const { flags } = splitArgs(compose.slice(down + 1))
  const isVolumes = flags.includes('--volumes') || shortLetters(flags).includes('v')
  if (!isVolumes) return null

  return make('docker', 'compose-down', 'high', tokens, { prefix, options, unsafe })
}

function classifyTerraform(tokens: string[]): Risk | null {
  const sub = tokens.slice(1).find(token => !token.startsWith('-'))
  if (sub === 'destroy') return make('terraform', 'destroy', 'critical', tokens)
  if (sub === 'apply') {
    const level = tokens.includes('-destroy') ? 'critical' : 'high'

    return make('terraform', 'apply', level, tokens)
  }

  return null
}

function classifyKubectl(tokens: string[]): Risk | null {
  const prefix: string[] = []
  let verb: string | undefined
  let after: string | undefined
  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i] as string
    if (KUBECTL_FORWARDED_FLAGS.has(token) && tokens[i + 1] !== undefined) {
      prefix.push(token, tokens[i + 1] as string)
      i += 1
      continue
    }
    if (/^--(context|kubeconfig)=/.test(token)) {
      prefix.push(token)
      continue
    }
    if (KUBECTL_VALUE_FLAGS.has(token)) {
      i += 1
      continue
    }
    if (token.startsWith('-')) continue
    if (verb === undefined) verb = token
    else if (after === undefined) after = token
  }
  if (verb === undefined || !KUBECTL_MUTATING.has(verb)) return null
  if (verb === 'rollout' && (after === 'status' || after === 'history')) return null
  const level = verb === 'delete' ? 'high' : 'medium'

  return make('kubectl', verb, level, tokens, { prefix })
}

type Migration = {
  tool: string
  match: (tokens: string[]) => boolean
  status: (tokens: string[]) => string[] | null
}

// `names` are looked for in the first tokens (so `npx knex ...` and `bundle
// exec rails ...` match) and each `alts` list must be met in order after it.
function follows(tokens: string[], names: string[], ...alts: string[][]): boolean {
  const window = tokens.slice(0, 5).map(basename)
  const at = window.findIndex(token => names.includes(token))
  if (at < 0) return false
  let from = at + 1
  for (const alt of alts) {
    const found = tokens.slice(from, from + 4).findIndex(token => alt.includes(token))
    if (found < 0) return false
    from += found + 1
  }

  return true
}

const MIGRATIONS: Migration[] = [
  {
    tool: 'prisma',
    match: t =>
      follows(t, ['prisma'], ['migrate'], ['deploy', 'dev', 'reset']) ||
      follows(t, ['prisma'], ['db'], ['push']),
    status: () => ['npx', '--no-install', 'prisma', 'migrate', 'status'],
  },
  {
    tool: 'rails',
    match: t =>
      follows(t, ['rails', 'rake'], ['db:migrate', 'db:rollback', 'db:reset', 'db:drop', 'db:schema:load']),
    status: t => [basename(t.find(x => ['rails', 'rake'].includes(basename(x))) ?? 'rails'), 'db:migrate:status'],
  },
  {
    tool: 'alembic',
    match: t => follows(t, ['alembic'], ['upgrade', 'downgrade']),
    status: () => ['alembic', 'current'],
  },
  {
    tool: 'flyway',
    match: t => follows(t, ['flyway'], ['migrate', 'clean', 'repair']),
    status: () => ['flyway', 'info'],
  },
  {
    tool: 'knex',
    match: t =>
      follows(t, ['knex'], ['migrate:latest', 'migrate:up', 'migrate:down', 'migrate:rollback']),
    status: () => ['npx', '--no-install', 'knex', 'migrate:list'],
  },
  {
    tool: 'sequelize',
    match: t =>
      follows(t, ['sequelize', 'sequelize-cli'], ['db:migrate', 'db:migrate:undo', 'db:migrate:undo:all']),
    status: () => ['npx', '--no-install', 'sequelize-cli', 'db:migrate:status'],
  },
  {
    tool: 'django',
    match: t => follows(t, ['manage.py', 'django-admin'], ['migrate']),
    // Only a bare interpreter may precede manage.py: anything else (`python -c ...`)
    // would run model-written code as part of a dry run. Paths must stay inside the
    // project, and `uv run` is repeated offline and without syncing the venv.
    status: t => {
      const at = t.findIndex(token => ['manage.py', 'django-admin'].includes(basename(token)))
      if (at < 0) return null
      const before = t.slice(0, at)
      const isPython = (token: string | undefined) => /^python[0-9.]*$/.test(basename(token ?? ''))
      if (!t.slice(0, at + 1).every(isLocalPath)) return null
      if (before.length === 0 || (before.length === 1 && isPython(before[0]))) {
        return [...t.slice(0, at + 1), 'showmigrations', '--plan']
      }
      if (before.length === 3 && before[0] === 'uv' && before[1] === 'run' && isPython(before[2])) {
        return ['uv', 'run', '--no-sync', '--offline', before[2] as string, t[at] as string, 'showmigrations', '--plan']
      }

      return null
    },
  },
  {
    tool: 'typeorm',
    match: t => follows(t, ['typeorm'], ['migration:run', 'migration:revert']),
    status: () => ['npx', '--no-install', 'typeorm', 'migration:show'],
  },
  {
    tool: 'drizzle',
    match: t => follows(t, ['drizzle-kit'], ['migrate', 'push']),
    status: () => null,
  },
  {
    tool: 'goose',
    match: t => follows(t, ['goose'], ['up', 'down', 'reset', 'redo', 'up-by-one']),
    status: () => ['goose', 'status'],
  },
  {
    tool: 'dbmate',
    match: t => follows(t, ['dbmate'], ['up', 'migrate', 'rollback', 'down']),
    status: () => ['dbmate', 'status'],
  },
]

function classifyMigration(tokens: string[]): Risk | null {
  const found = MIGRATIONS.find(migration => migration.match(tokens))

  return found === undefined ? null : make('migration', found.tool, 'high', tokens)
}

export function migrationStatus(tokens: string[], tool: string): string[] | null {
  return MIGRATIONS.find(migration => migration.tool === tool)?.status(tokens) ?? null
}
