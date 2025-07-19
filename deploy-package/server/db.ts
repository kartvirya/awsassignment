import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Validate database URL
if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is required in production');
  }
  console.warn('⚠️  DATABASE_URL not set, using mock database for development');
}

const databaseUrl = process.env.DATABASE_URL || 'postgresql://mock:mock@localhost:5432/mock';

// Configure connection pool
const poolConfig = {
  connectionString: databaseUrl,
  max: process.env.NODE_ENV === 'production' ? 20 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.includes('ssl=true') ? {
    rejectUnauthorized: true,
    ca: process.env.DATABASE_CA_CERT,
  } : false,
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