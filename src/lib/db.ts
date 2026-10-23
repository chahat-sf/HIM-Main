import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

const globalForDb = globalThis as unknown as { himDbPool?: Pool };

function createPool(): Pool {
	const host = process.env.DB_HOST;
	const user = process.env.DB_USER;
	const password = process.env.DB_PASS;
	const database = process.env.DB_NAME;

	if (!host || !user || !password || !database) {
		throw new Error("Missing DB_HOST, DB_USER, DB_PASS, or DB_NAME env vars");
	}

	const options: PoolOptions = {
		host,
		user,
		password,
		database,
		waitForConnections: true,
		connectionLimit: 10,
		namedPlaceholders: true,
		// Keep DATE/DATETIME as strings to avoid UTC day shifts
		dateStrings: true,
	};

	return mysql.createPool(options);
}

export function getDb(): Pool {
	if (!globalForDb.himDbPool) {
		globalForDb.himDbPool = createPool();
	}
	return globalForDb.himDbPool;
}
