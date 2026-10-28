import mysql, {
	type FieldPacket,
	type Pool,
	type PoolOptions,
	type QueryResult,
	type ResultSetHeader,
	type RowDataPacket,
} from "mysql2/promise";

const globalForDb = globalThis as unknown as {
	himDbPool?: Pool;
	himDbReset?: Promise<void> | null;
};

const TRANSIENT_CODES = new Set([
	"ECONNRESET",
	"ECONNREFUSED",
	"PROTOCOL_CONNECTION_LOST",
	"ETIMEDOUT",
	"EPIPE",
	"ER_CLIENT_INTERACTION_TIMEOUT",
	"PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR",
]);

function isTransientDbError(err: unknown): boolean {
	if (!err || typeof err !== "object") return false;
	const e = err as { code?: string; fatal?: boolean };
	return e.fatal === true || (e.code != null && TRANSIENT_CODES.has(e.code));
}

async function resetPool(): Promise<void> {
	if (globalForDb.himDbReset) return globalForDb.himDbReset;

	globalForDb.himDbReset = (async () => {
		const existing = globalForDb.himDbPool;
		globalForDb.himDbPool = undefined;
		if (!existing) return;
		try {
			await existing.end();
		} catch {
			/* pool may already be dead */
		}
	})().finally(() => {
		globalForDb.himDbReset = null;
	});

	return globalForDb.himDbReset;
}

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
		// Evict idle sockets before the server (or a middlebox) kills them.
		maxIdle: 5,
		idleTimeout: 20_000,
		enableKeepAlive: true,
		keepAliveInitialDelay: 10_000,
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

type ExecuteValues = Parameters<Pool["execute"]>[1];

/**
 * Pool execute with one reconnect+retry on dropped / reset connections.
 * Prefer this over getDb().execute for request paths that surface to users.
 */
export async function dbExecute<
	T extends QueryResult = RowDataPacket[] | RowDataPacket[][] | ResultSetHeader,
>(sql: string, values?: ExecuteValues): Promise<[T, FieldPacket[]]> {
	try {
		return await getDb().execute<T>(sql, values);
	} catch (err) {
		if (!isTransientDbError(err)) throw err;
		await resetPool();
		return await getDb().execute<T>(sql, values);
	}
}
