let dbInstance: any = null;
let isMockDb = false;

function isDbConnectionError(error: any) {
  if (!error) return false;
  const message = String(error.message || error.sqlMessage || '');
  return (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    message.includes('ECONNREFUSED') ||
    message.includes('connect ECONNREFUSED') ||
    message.includes('Connection refused')
  );
}

function createMockDbInstance() {
  isMockDb = true;
  dbInstance = {
    query: async () => [[], []],
    execute: async () => [{ insertId: null }, []],
  };
  return dbInstance;
}

async function initDb() {
  if (dbInstance) return dbInstance;

  try {
    const mysql = await import('mysql2/promise');
    dbInstance = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    isMockDb = false;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    createMockDbInstance();
  }
  return dbInstance;
}

export const db = {
  query: async (...args: any[]) => {
    const instance = await initDb();
    try {
      return await instance.query(...args);
    } catch (error) {
      if (isMockDb || isDbConnectionError(error)) {
        createMockDbInstance();
        return [[], []];
      }
      throw error;
    }
  },
  execute: async (...args: any[]) => {
    const instance = await initDb();
    try {
      return await (instance.execute?.(...args) || [{ insertId: null }, []]);
    } catch (error) {
      if (isMockDb || isDbConnectionError(error)) {
        createMockDbInstance();
        return [{ insertId: null }, []];
      }
      throw error;
    }
  },
};

export async function query<T = any>(sql: string, params: Array<any> = []): Promise<[T[], any[]]> {
  const instance = await initDb();
  try {
    return (await instance.query(sql, params)) as [T[], any[]];
  } catch (error) {
    if (isMockDb || isDbConnectionError(error)) {
      createMockDbInstance();
      return [[], []];
    }
    throw error;
  }
}

export function isDatabaseMock() {
  return isMockDb;
}
