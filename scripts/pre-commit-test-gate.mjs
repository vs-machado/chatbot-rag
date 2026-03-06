import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const isWindows = process.platform === 'win32'

function readJson(relativePath) {
  const absolutePath = path.join(rootDir, relativePath)
  return JSON.parse(readFileSync(absolutePath, 'utf8'))
}

function hasDirectory(relativePath) {
  return existsSync(path.join(rootDir, relativePath))
}

function hasScript(packageJsonPath, scriptName) {
  const packageJson = readJson(packageJsonPath)
  return Boolean(packageJson.scripts?.[scriptName])
}

function runCommand(command, args, cwd, label) {
  console.log(`\n> ${label}`)

  const result = spawnSync(command, args, {
    cwd: path.join(rootDir, cwd),
    stdio: 'inherit',
    shell: isWindows,
  })

  return result.status === 0
}

const suites = [
  {
    category: 'unit',
    label: 'Frontend unit tests',
    cwd: 'frontend',
    command: 'npm',
    args: ['run', 'test:unit'],
    available: hasScript('frontend/package.json', 'test:unit'),
    missingHint: 'Add `test:unit` to `frontend/package.json`.',
  },
  {
    category: 'integration',
    label: 'Frontend integration tests',
    cwd: 'frontend',
    command: 'npm',
    args: ['run', 'test:integration'],
    available: hasScript('frontend/package.json', 'test:integration'),
    missingHint: 'Add `test:integration` to `frontend/package.json`.',
  },
  {
    category: 'e2e',
    label: 'Frontend end-to-end tests',
    cwd: 'frontend',
    command: 'npm',
    args: ['run', 'test:e2e'],
    available: hasScript('frontend/package.json', 'test:e2e'),
    missingHint: 'Add `test:e2e` to `frontend/package.json`.',
  },
  {
    category: 'unit',
    label: 'Backend unit tests',
    cwd: 'backend',
    command: 'python',
    args: ['-m', 'pytest', 'tests/unit'],
    available: hasDirectory('backend/tests/unit'),
    missingHint: 'Create `backend/tests/unit` with pytest coverage.',
  },
  {
    category: 'integration',
    label: 'Backend integration tests',
    cwd: 'backend',
    command: 'python',
    args: ['-m', 'pytest', 'tests/integration'],
    available: hasDirectory('backend/tests/integration'),
    missingHint: 'Create `backend/tests/integration` with pytest coverage.',
  },
]

const requiredCategories = ['e2e']
const missingCategories = requiredCategories
  .map((category) => ({
    category,
    suites: suites.filter((suite) => suite.category === category),
  }))
  .filter(({ suites: categorySuites }) => !categorySuites.some((suite) => suite.available))

if (missingCategories.length > 0) {
  console.error('\nPre-commit blocked: all test categories must exist and pass before commit.')

  for (const { category, suites: categorySuites } of missingCategories) {
    console.error(`\nMissing ${category} coverage. Configure at least one of:`)
    for (const suite of categorySuites) {
      console.error(`- ${suite.missingHint}`)
    }
  }

  process.exit(1)
}

for (const suite of suites) {
  if (!suite.available) {
    continue
  }

  const passed = runCommand(suite.command, suite.args, suite.cwd, suite.label)
  if (!passed) {
    console.error(`\nPre-commit blocked: ${suite.label} failed.`)
    process.exit(1)
  }
}

console.log('\nPre-commit test gate passed.')
