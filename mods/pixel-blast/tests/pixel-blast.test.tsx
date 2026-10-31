import { expect, test } from 'claude-code/testing'

const FIND_OUT = '400\tbuild/app.js\n88\tbuild/app.css\n4\tbuild/index.html\n'

type Stub = (argv: readonly string[], env?: Record<string, string>) => { exitCode: number; stdout: string }

function stubEngine(on: any, stub: Stub, isPlaced = true) {
  const state = { opened: 0 }
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('ui.open', () => {
    state.opened += 1

    return { value: { isPlaced } }
  })
  on('ui.close', () => ({ value: undefined }))
  on('tool.call', () => ({ result: {} }))
  on('ui.render', ($: any, e: any) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })
  on('process.run', async (_: unknown, e: { argv: readonly string[]; init?: { env?: Record<string, string> } }) => {
    // A real sleep: an instant stub would spin the hold loop without ever
    // yielding to the test's own awaits.
    if (e.argv[0] === 'sleep') {
      await new Promise(done => setTimeout(done, 5))

      return { value: { exitCode: 0, stdout: '', stderr: '' } }
    }
    const out = stub(e.argv, e.init?.env)

    return { value: { exitCode: out.exitCode, stdout: out.stdout, stderr: '' } }
  })

  return state
}

const rmStub: Stub = argv =>
  argv[0] === 'find' ? { exitCode: 0, stdout: FIND_OUT } : { exitCode: 0, stdout: '' }

function pane(surface: string, bodyColumns = 120) {
  return {
    plugin: 'pixel-blast',
    surface,
    component: 'Pane',
    requestId: 'pixel-blast',
    props: {
      title: 'Blast Radius',
      isFocused: true,
      bodyColumns,
      placement: 'dock',
      scroll: { offset: 0, bodyRows: 20 },
      view: {},
    },
  } as any
}

async function until<T>(read: () => Promise<T | undefined>): Promise<T> {
  for (let i = 0; i < 200; i += 1) {
    const found = await read()
    if (found !== undefined) return found
  }
  throw new Error('never drawn')
}

test('commands outside the five held kinds run untouched and open nothing', async ($, on) => {
  const state = stubEngine(on, rmStub)
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)

  for (const command of ['ls -la', 'git status', 'git push origin main', 'rm notes.txt', 'docker system prune -af', 'terraform destroy', 'kubectl delete pod web']) {
    const ran = await $.tool.call({ tool: 'Bash', command } as any)
    expect((ran as any).deny).toBeUndefined()
  }
  expect(state.opened).toBe(0)
})

test('rm -rf is held, listed, and runs once proceed is pressed', async ($, on) => {
  const state = stubEngine(on, rmStub)
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(pane('terminal'))

  const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as any)
  expect(await until(() => ui.find({ type: 'Text', text: /3 files \(492K\)/ }))).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /build\/app\.js/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /rm -rf build/ })).toBeDefined()
  await ui.press({ key: 'proceed' })
  const ran = await call

  expect((ran as any).deny).toBeUndefined()
  expect(state.opened).toBe(1)
  await ui.unmount()
})

test('cancel refuses the call and says what it would have touched', async ($, on) => {
  stubEngine(on, rmStub)
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(pane('terminal'))

  const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as any)
  await until(() => ui.find({ type: 'Text', text: /3 files/ }))
  await ui.press({ key: 'cancel' })
  const ran = await call

  expect((ran as any).deny).toMatch(/pressed Cancel/)
  expect((ran as any).deny).toMatch(/3 files/)
  await ui.unmount()
})

test('a failed dry run still holds the call and says it could not measure', async ($, on) => {
  stubEngine(on, () => ({ exitCode: 1, stdout: '' }))
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(pane('terminal'))

  const call = $.tool.call({ tool: 'Bash', command: 'git reset --hard' } as any)
  expect(await until(() => ui.find({ type: 'Text', text: /could not measure/ }))).toBeDefined()
  await ui.press({ key: 'cancel' })
  expect((await call as any).deny).toBeDefined()
  await ui.unmount()
})

test('each risky class is held and refused on cancel', async ($, on) => {
  stubEngine(on, argv => {
    return { exitCode: 0, stdout: 'a\nb\n' }
  })
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(pane('terminal'))

  for (const command of [
    'git reset --hard HEAD~1',
    'git clean -fdx',
    'git push --force-with-lease origin main',
    'npx prisma migrate deploy',
    'python manage.py migrate',
    'cd app && sudo rm -rf ./dist',
    'bash -c "git reset --hard"',
    'sudo -u root rm -rf /srv/data',
    'env -u FOO rm -rf build',
    'timeout 60 rm -rf build',
    'nice -n 5 rm -rf build',
    'eval "rm -rf build"',
    'bash -e -c "rm -rf build"',
    'if true; then rm -rf build; fi',
    '{ rm -rf build; }',
    '! rm -rf build',
    'git --git-dir .git --work-tree . reset --hard',
    'git push origin +main',
    'git push --mirror',
    'find . | xargs --max-args 1 rm -rf',
    'env -S "rm -rf build"',
  ]) {
    const call = $.tool.call({ tool: 'Bash', command } as any)
    await until(async () => {
      try {
        return await ui.press({ key: 'cancel' }) ?? undefined
      } catch {
        return undefined
      }
    })
    const ran = await call
    expect((ran as any).deny, command).toMatch(/pixel-blast held/)
  }
  await ui.unmount()
})

test('when no pane can be placed the report draws above the prompt', async ($, on) => {
  stubEngine(on, rmStub, false)
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount({
    plugin: 'pixel-blast',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100 },
  } as any)

  const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as any)
  expect(await until(() => ui.find({ type: 'Text', text: /3 files/ }))).toBeDefined()
  await ui.press({ key: 'cancel' })
  expect((await call as any).deny).toBeDefined()
  await ui.unmount()
})

test('narrow panes drop the size bars and other surfaces draw plain text', async ($, on) => {
  stubEngine(on, rmStub)
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)

  for (const [surface, columns] of [['terminal', 30], ['desktop', 120]] as const) {
    const ui = await $.ui.mount(pane(surface, columns))
    const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as any)
    expect(await until(() => ui.find({ type: 'Text', text: /3 files/ }))).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /■/ })).toBeUndefined()
    await ui.press({ key: 'cancel' })
    await call
    await ui.unmount()
  }
})

test('more than eight items show how many are hidden', async ($, on) => {
  const many = Array.from({ length: 12 }, (_, i) => `${(i + 1) * 4}\tbuild/f${i}.js`).join('\n')
  stubEngine(on, argv => (argv[0] === 'find' ? { exitCode: 0, stdout: many } : { exitCode: 0, stdout: '' }))
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(pane('terminal'))

  const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as any)
  expect(await until(() => ui.find({ type: 'Text', text: /…4 more/ }))).toBeDefined()
  await ui.press({ key: 'cancel' })
  await call
  await ui.unmount()
})

test('git clean mirrors its flags in the dry run, and dry or plain forms pass', async ($, on) => {
  const seen: string[] = []
  const state = stubEngine(on, argv => {
    seen.push(argv.join(' '))

    return { exitCode: 0, stdout: 'Would remove tmp/\n' }
  })
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(pane('terminal'))

  const call = $.tool.call({ tool: 'Bash', command: 'git clean -fdx' } as any)
  await until(() => ui.find({ type: 'Text', text: /tmp\// }))
  await ui.press({ key: 'cancel' })
  await call
  expect(seen).toContain('git clean -n -d -x')

  for (const command of ['git clean -n', 'git clean -nfd', 'git reset --soft HEAD~1']) {
    await $.tool.call({ tool: 'Bash', command } as any)
  }
  expect(state.opened).toBe(1)
  await ui.unmount()
})

async function holdAndCancel($: any, ui: any, command: string) {
  const call = $.tool.call({ tool: 'Bash', command } as any)
  await until(async () => {
    try {
      return (await ui.press({ key: 'cancel' })) ?? undefined
    } catch {
      return undefined
    }
  })

  return call
}

test('a dry run never replays model-written code', async ($, on) => {
  const seen: string[][] = []
  stubEngine(on, argv => {
    seen.push([...argv])

    return { exitCode: 0, stdout: '' }
  })
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(pane('terminal'))

  await holdAndCancel($, ui, "python -c 'import os' manage.py migrate")
  await holdAndCancel($, ui, 'npx prisma migrate deploy')

  const all = seen.flat()
  expect(all).not.toContain('-c')
  expect(seen.some(argv => argv.join(' ') === 'npx --no-install prisma migrate status')).toBe(true)
  await ui.unmount()
})

test('only variables that pick a target reach a dry run', async ($, on) => {
  const calls: { argv: readonly string[]; env?: Record<string, string> }[] = []
  stubEngine(on, (argv, env) => {
    calls.push({ argv, ...(env === undefined ? {} : { env }) })

    return { exitCode: 0, stdout: 'a\n' }
  })
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(pane('terminal'))

  await holdAndCancel($, ui, 'GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.fsmonitor GIT_CONFIG_VALUE_0=x git reset --hard')
  await holdAndCancel($, ui, 'PATH=/x:$PATH LD_PRELOAD=/y.so rm -rf build')
  await holdAndCancel($, ui, 'DATABASE_URL=postgres://x npx prisma migrate deploy')

  const names = calls.flatMap(call => Object.keys(call.env ?? {}))
  expect(names).toContain('DATABASE_URL')
  for (const banned of ['PATH', 'LD_PRELOAD', 'GIT_CONFIG_COUNT', 'GIT_CONFIG_KEY_0']) {
    expect(names).not.toContain(banned)
  }
  await ui.unmount()
})

test('options that point at another repository are not repeated in a dry run', async ($, on) => {
  const seen: string[][] = []
  stubEngine(on, argv => {
    seen.push([...argv])

    return { exitCode: 0, stdout: '' }
  })
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(pane('terminal'))

  const call = $.tool.call({ tool: 'Bash', command: 'git --git-dir /x reset --hard' } as any)
  expect(await until(() => ui.find({ type: 'Text', text: /is not repeated in a dry run/ }))).toBeDefined()
  await ui.press({ key: 'cancel' })
  await call

  const all = seen.map(argv => argv.join(' ')).join('\n')
  expect(all).not.toMatch(/--git-dir/)
  await ui.unmount()
})

test('django status repeats a plain interpreter only, offline under uv', async ($, on) => {
  const seen: string[] = []
  stubEngine(on, argv => {
    seen.push(argv.join(' '))

    return { exitCode: 0, stdout: '' }
  })
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(pane('terminal'))

  await holdAndCancel($, ui, 'uv run python manage.py migrate')
  await holdAndCancel($, ui, 'python ../elsewhere/manage.py migrate')
  await holdAndCancel($, ui, 'python manage.py migrate')

  expect(seen).toContain('uv run --no-sync --offline python manage.py showmigrations --plan')
  expect(seen).toContain('python manage.py showmigrations --plan')
  expect(seen.some(line => line.includes('elsewhere'))).toBe(false)
  await ui.unmount()
})

test('commands that redirect or hide their target are held but not measured', async ($, on) => {
  const seen: string[] = []
  stubEngine(on, argv => {
    seen.push(argv.join(' '))

    return { exitCode: 0, stdout: argv[1] === 'config' ? 'dev\n' : '' }
  })
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(pane('terminal'))

  for (const command of [
    'GIT_DIR=/other/.git git reset --hard',
    'git -C /tmp/evil reset --hard',
    'git -C ../other clean -fd',
    'env -S "rm -rf" build',
    "env -S'rm -rf build'",
  ]) {
    const ran = await holdAndCancel($, ui, command)
    expect((ran as any).deny, command).toMatch(/pixel-blast held/)
  }
  const all = seen.join('\n')
  expect(all).not.toMatch(/git (-C|status|clean)/)
  await ui.unmount()
})

test('a risky command behind xargs is held, and extra context is reported', async ($, on) => {
  const seen: string[] = []
  stubEngine(on, argv => {
    seen.push(argv.join(' '))

    return { exitCode: 0, stdout: argv[0] === 'find' ? FIND_OUT : '' }
  })
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(pane('terminal'))

  let call = $.tool.call({ tool: 'Bash', command: 'ls | xargs -n 1 rm -rf' } as any)
  expect(await until(() => ui.find({ type: 'Text', text: /come from stdin/ }))).toBeDefined()
  await ui.press({ key: 'cancel' })
  expect((await call as any).deny).toMatch(/pixel-blast held.*come from stdin/)

  call = $.tool.call({ tool: 'Bash', command: 'rm -rf build && git reset --hard' } as any)
  expect(await until(() => ui.find({ type: 'Text', text: /also held, not measured: git reset --hard/ }))).toBeDefined()
  await ui.press({ key: 'cancel' })
  await call

  call = $.tool.call({ tool: 'Bash', command: 'env -C ../other git reset --hard' } as any)
  expect(await until(() => ui.find({ type: 'Text', text: /a changed directory is not repeated/ }))).toBeDefined()
  await ui.press({ key: 'cancel' })
  await call

  call = $.tool.call({ tool: 'Bash', command: 'eval cd ../other && git reset --hard' } as any)
  expect(await until(() => ui.find({ type: 'Text', text: /an earlier cd is not repeated/ }))).toBeDefined()
  await ui.press({ key: 'cancel' })
  await call

  call = $.tool.call({ tool: 'Bash', command: 'cd ../other && git reset --hard' } as any)
  expect(await until(() => ui.find({ type: 'Text', text: /an earlier cd is not repeated/ }))).toBeDefined()
  await ui.press({ key: 'cancel' })
  await call
  expect(seen.some(line => line.startsWith('git status'))).toBe(false)
  await ui.unmount()
})
