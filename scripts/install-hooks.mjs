import { chmodSync, copyFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const sourceHookPath = path.join(rootDir, '.githooks', 'pre-commit')
const gitHooksDir = path.join(rootDir, '.git', 'hooks')
const targetHookPath = path.join(gitHooksDir, 'pre-commit')

if (!existsSync(path.join(rootDir, '.git'))) {
  console.error('Git repository not found. Run this script from the cloned project root.')
  process.exit(1)
}

mkdirSync(gitHooksDir, { recursive: true })
copyFileSync(sourceHookPath, targetHookPath)

try {
  chmodSync(targetHookPath, 0o755)
} catch {
  // No action needed on platforms that do not support chmod.
}

console.log(`Installed pre-commit hook at ${targetHookPath}`)
