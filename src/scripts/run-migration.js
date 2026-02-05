const { DataSource } = require('typeorm');
const dataSource = require('../config/typeorm-cli.config.js').default || require('../config/typeorm-cli.config.js');

async function runMigrations() {
  try {
    await dataSource.initialize();
    console.log('Database connected');

    const migrations = await dataSource.runMigrations();
    console.log(`Ran ${migrations.length} migration(s)`);
    migrations.forEach((migration) => {
      console.log(`  - ${migration.name}`);
    });

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runMigrations();
