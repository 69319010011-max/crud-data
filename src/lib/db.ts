import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';

function getDbConfig(): PoolConfig {
  const envConfig: Record<string, string> = {};
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [k, ...v] = trimmed.split('=');
          if (k) envConfig[k.trim()] = v.join('=').trim();
        }
      });
    }
  } catch {
    // fallback
  }

  if (envConfig.DATABASE_URL || process.env.DATABASE_URL) {
    return {
      connectionString: envConfig.DATABASE_URL || process.env.DATABASE_URL,
    };
  }

  return {
    host: envConfig.PGHOST || process.env.PGHOST || 'localhost',
    port: parseInt(envConfig.PGPORT || process.env.PGPORT || '5432', 10),
    user: envConfig.PGUSER || process.env.PGUSER || 'rytc',
    password: envConfig.PGPASSWORD || process.env.PGPASSWORD || '',
    database: envConfig.PGDATABASE || process.env.PGDATABASE || 'rytc',
  };
}

let activePool: Pool | null = null;
let activeConfigKey = '';

export function getPool(): Pool {
  const config = getDbConfig();
  const key = JSON.stringify(config);
  if (!activePool || activeConfigKey !== key) {
    if (activePool) {
      activePool.end().catch(() => {});
    }
    activePool = new Pool(config);
    activeConfigKey = key;
  }
  return activePool;
}

const pool = {
  query<R extends QueryResultRow = any, I extends any[] = any[]>(
    text: string,
    params?: I
  ): Promise<QueryResult<R>> {
    return getPool().query<R>(text, params as any);
  },
};

export default pool;
