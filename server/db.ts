import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Validate database URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const databaseUrl = process.env.DATABASE_URL;

// Configure connection pool for production
const poolConfig = {
  connectionString: databaseUrl,
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    ca: process.env.DATABASE_CA_CERT || undefined,
  } : false,
  // Additional RDS-specific settings
  application_name: 'collegesafe-app',
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
};

// Create connection pool with error handling
export const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(-1);
  }
});

// Handle pool connection events
pool.on('connect', (client) => {
  console.log('New database connection established');
});

pool.on('acquire', (client) => {
  console.log('Client acquired from pool');
});

pool.on('release', (client) => {
  console.log('Client released back to pool');
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Closing database pool...');
  try {
    await pool.end();
    console.log('Database pool closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error closing database pool:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT. Closing database pool...');
  try {
    await pool.end();
    console.log('Database pool closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error closing database pool:', error);
    process.exit(1);
  }
});