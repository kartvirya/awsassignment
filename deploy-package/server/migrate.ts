import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.includes('ssl=true') ? {
    rejectUnauthorized: true,
  } : false,
});
console.log(process.env.DATABASE_URL);
// Migration tracking table
const MIGRATION_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT NOW()
  );
`;

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migrations...');
    
    // Create migrations table if it doesn't exist
    await client.query(MIGRATION_TABLE);
    
    // Get applied migrations
    const { rows: appliedMigrations } = await client.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    
    const appliedVersions = new Set(appliedMigrations.map(row => row.version));
    
    // Define migrations
    const migrations = [
      {
        version: '0001_initial_schema',
        file: '0001_initial_schema.sql',
        description: 'Create initial database schema'
      }
    ];
    
    let appliedCount = 0;
    
    for (const migration of migrations) {
      if (appliedVersions.has(migration.version)) {
        console.log(`⏩ Skipping migration ${migration.version} (already applied)`);
        continue;
      }
      
      console.log(`📝 Applying migration ${migration.version}: ${migration.description}`);
      
      // Read migration file
      const migrationPath = join(__dirname, '..', 'migrations', migration.file);
      const migrationSQL = readFileSync(migrationPath, 'utf8');
      
      // Execute migration
      await client.query(migrationSQL);
      
      // Record migration as applied
      await client.query(
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        [migration.version]
      );
      
      appliedCount++;
      console.log(`✅ Migration ${migration.version} applied successfully`);
    }
    
    if (appliedCount === 0) {
      console.log('📄 No new migrations to apply');
    } else {
      console.log(`🎉 Applied ${appliedCount} migration(s) successfully`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Health check function
async function healthCheck() {
  const client = await pool.connect();
  
  try {
    await client.query('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    client.release();
  }
}

// Command line interface
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      await runMigrations();
      break;
    case 'health':
      const healthy = await healthCheck();
      process.exit(healthy ? 0 : 1);
      break;
    default:
      console.log('Usage: tsx server/migrate.ts [migrate|health]');
      console.log('  migrate - Run database migrations');
      console.log('  health  - Check database connectivity');
      process.exit(1);
  }
  
  await pool.end();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

export { runMigrations, healthCheck };
