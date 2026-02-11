const fs = require('fs');
const path = require('path');

function ok(msg) {
  console.log('\x1b[32m%s\x1b[0m', msg);
}
function warn(msg) {
  console.warn('\x1b[33m%s\x1b[0m', msg);
}
function err(msg) {
  console.error('\x1b[31m%s\x1b[0m', msg);
}

const root = process.cwd();
const nodeModules = path.join(root, 'node_modules');

ok('Project doctor — quick checks');

if (!fs.existsSync(nodeModules)) {
  warn('node_modules is missing. Run:');
  console.log('  npm ci');
} else {
  ok('node_modules found');
}

const missingEnv = [];
if (!process.env.DB_HOST && !process.env.DATABASE_URL)
  missingEnv.push('DB_HOST or DATABASE_URL');
if (!process.env.DB_NAME) missingEnv.push('DB_NAME');

if (missingEnv.length) {
  warn('Missing DB environment variables: ' + missingEnv.join(', '));
  console.log(
    'To run e2e/tests with a real database, set the environment variables or use a test container.',
  );
  console.log('Example (Windows PowerShell):');
  console.log(
    '  $env:DB_HOST = "localhost"; $env:DB_PORT = "5432"; $env:DB_USERNAME = "postgres"; $env:DB_PASSWORD = "password"; $env:DB_NAME = "codecircle_test"',
  );
} else {
  ok('Database environment variables appear set');
}

try {
  require.resolve('typeorm');
  ok('typeorm module is installed');
} catch (e) {
  err('typeorm module not found. Run:');
  console.log('  npm ci');
}

console.log(
  '\nIf you see build errors about missing modules, run `npm ci` or `npm install`.',
);
