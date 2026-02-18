import 'reflect-metadata';

import { register } from 'ts-node';
register({
  project: 'tsconfig.node.json',
  transpileOnly: true,
  files: true,
  ignore: ['\\.js$'],
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    skipLibCheck: true,
  },
});
import 'tsconfig-paths/register';

import { execSync } from 'child_process';
import { resolve } from 'path';

const migrationPath =
  process.argv[2] || 'src/database/migrations/InitialSchema';
const fullPath = resolve(migrationPath);

console.log(`Generating migration at: ${fullPath}`);

const nodeOptions = [
  '-r',
  'reflect-metadata',
  '-r',
  'ts-node/register',
  '-r',
  'tsconfig-paths/register',
].join(' ');

const env = {
  ...process.env,
  NODE_OPTIONS: nodeOptions,
};

const command = `node ./node_modules/typeorm/cli.js migration:generate -d src/config/typeorm.config.ts ${fullPath}`;

try {
  execSync(command, { stdio: 'inherit', cwd: process.cwd(), env });
  console.log('Migration generated successfully!');
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to generate migration:', error.message);
  } else {
    console.error('Failed to generate migration:', error);
  }
  process.exit(1);
}