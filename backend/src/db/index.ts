import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseClient {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
  type: 'pg' | 'pglite';
}

let activeClient: DatabaseClient | null = null;

export async function getDb(): Promise<DatabaseClient> {
  if (activeClient) {
    return activeClient;
  }

  // 1. If DATABASE_URL is provided, try pg.Pool
  if (config.databaseUrl && config.databaseUrl.trim() !== '') {
    try {
      console.log('Connecting to PostgreSQL database at:', config.databaseUrl.replace(/:([^:@]+)@/, ':****@'));
      const pool = new Pool({
        connectionString: config.databaseUrl,
        connectionTimeoutMillis: 3000,
      });

      // Test connection
      await pool.query('SELECT 1');
      console.log('Successfully connected to external PostgreSQL server.');

      activeClient = {
        type: 'pg',
        async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
          const res = await pool.query(text, params);
          return {
            rows: res.rows as T[],
            rowCount: res.rowCount ?? res.rows.length,
          };
        },
        async exec(sql: string): Promise<void> {
          await pool.query(sql);
        },
        async close() {
          await pool.end();
          activeClient = null;
        },
      };

      await initializeSchema(activeClient);
      return activeClient;
    } catch (err: any) {
      console.warn(`Could not connect to external PostgreSQL (${err.message}). Falling back to embedded PostgreSQL (PGlite).`);
    }
  }

  // 2. Fallback to embedded PostgreSQL (PGlite)
  const isTest = process.env.NODE_ENV === 'test';
  let pgliteInstance: PGlite;

  if (isTest) {
    // In-memory for isolated test runs
    pgliteInstance = new PGlite();
  } else {
    // Persistent directory for development & production
    const dbDir = path.resolve(__dirname, '../../data/pgdata');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    pgliteInstance = new PGlite(dbDir);
  }

  await pgliteInstance.waitReady;
  console.log(`Initialized embedded PostgreSQL (PGlite engine) [Mode: ${isTest ? 'In-Memory' : 'Persistent Storage'}].`);

  activeClient = {
    type: 'pglite',
    async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
      const res = await pgliteInstance.query(text, params);
      return {
        rows: (res.rows || []) as T[],
        rowCount: res.affectedRows ?? (res.rows ? res.rows.length : 0),
      };
    },
    async exec(sql: string): Promise<void> {
      await pgliteInstance.exec(sql);
    },
    async close() {
      await pgliteInstance.close();
      activeClient = null;
    },
  };

  await initializeSchema(activeClient);
  return activeClient;
}

export async function initializeSchema(client: DatabaseClient): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS otps (
      id VARCHAR(36) PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      otp VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS loans (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_name VARCHAR(255) NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      due_date DATE NOT NULL,
      is_repaid BOOLEAN DEFAULT FALSE,
      repaid_at TIMESTAMP WITH TIME ZONE NULL,
      receipt_url VARCHAR(500) NULL,
      notes TEXT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);`,
    `CREATE INDEX IF NOT EXISTS idx_loans_is_repaid ON loans(is_repaid);`,
    `CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);`,
  ];

  try {
    for (const stmt of statements) {
      await client.exec(stmt);
    }
    console.log('Database schema verified & ready.');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    throw error;
  }
}
