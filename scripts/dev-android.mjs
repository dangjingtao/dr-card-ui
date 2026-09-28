#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const adbCommand = process.platform === 'win32' ? 'adb.exe' : 'adb'

const reverse = spawnSync(adbCommand, ['reverse', 'tcp:5175', 'tcp:5175'], {
  stdio: 'inherit',
})

if (reverse.status !== 0) {
  process.exit(reverse.status ?? 1)
}

const dev = spawn(npmCommand, ['run', 'dev:5175'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_BRIDGE_MODE: 'native',
  },
})

dev.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 1)
})
