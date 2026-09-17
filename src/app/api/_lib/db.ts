import { createRequire } from "module";

type SqlDriver = {
  connect: (config: string | object) => Promise<unknown>;
  VarChar: (length?: number) => unknown;
  Decimal: (precision?: number, scale?: number) => unknown;
};

const require = createRequire(import.meta.url);
const sqlPackageName = "mssql";

const dbConnectionString = process.env.MSSQL_CONNECTION_STRING;
const dbConfig =
  process.env.MSSQL_SERVER &&
  process.env.MSSQL_DATABASE &&
  process.env.MSSQL_USER &&
  process.env.MSSQL_PASSWORD
    ? {
        server: process.env.MSSQL_SERVER,
        database: process.env.MSSQL_DATABASE,
        user: process.env.MSSQL_USER,
        password: process.env.MSSQL_PASSWORD,
        port: process.env.MSSQL_PORT ? Number(process.env.MSSQL_PORT) : 1433,
        options: {
          encrypt: process.env.MSSQL_ENCRYPT !== "false",
          trustServerCertificate:
            process.env.MSSQL_TRUST_SERVER_CERTIFICATE === "true",
        },
      }
    : null;

let dbClientPromise: Promise<{ pool: any; sql: SqlDriver }> | null = null;

export function isDatabaseConfigured() {
  return Boolean(dbConnectionString || dbConfig);
}

function loadSqlDriver() {
  try {
    return require(sqlPackageName) as SqlDriver;
  } catch {
    throw new Error(
      "MSSQL database is configured, but the 'mssql' package is not installed. Run npm install before using database persistence."
    );
  }
}

export function getDbClient() {
  if (!dbClientPromise) {
    const sql = loadSqlDriver();
    dbClientPromise = sql
      .connect(dbConnectionString || dbConfig!)
      .then((pool) => ({ pool, sql }));
  }

  return dbClientPromise;
}
