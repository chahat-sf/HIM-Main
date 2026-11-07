import { promises as fs } from "fs";
import path from "path";
import { getSiteUrl } from "@/lib/site-url";

export type EmailInlineAttachment = {
	filename: string;
	content: Buffer;
	contentType: string;
	cid: string;
};

function contentTypeFor(filePath: string): string {
	const ext = path.extname(filePath).toLowerCase();
	if (ext === ".png") return "image/png";
	if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
	if (ext === ".gif") return "image/gif";
	if (ext === ".webp") return "image/webp";
	return "application/octet-stream";
}

/** Prefer a concrete product photo over card `signature.webp` for emails. */
export function emailProductImagePath(src: string): string {
	if (!src) return "";
	if (/\/signature\.webp$/i.test(src)) {
		return src.replace(/\/signature\.webp$/i, "/1.webp");
	}
	return src;
}

async function readPublicFile(relPath: string): Promise<Buffer | null> {
	const clean = relPath.replace(/^\/+/, "");
	try {
		return await fs.readFile(path.join(process.cwd(), "public", clean));
	} catch {
		return null;
	}
}

async function fetchPublicFile(relPath: string): Promise<Buffer | null> {
	const clean = relPath.startsWith("/") ? relPath : `/${relPath}`;
	try {
		const res = await fetch(`${getSiteUrl()}${clean}`);
		if (!res.ok) return null;
		return Buffer.from(await res.arrayBuffer());
	} catch {
		return null;
	}
}

/** Load a public asset for CID embedding (fs first, then site URL fetch). */
export async function loadEmailAsset(
	relPath: string,
	cid: string,
): Promise<EmailInlineAttachment | null> {
	const clean = relPath.replace(/^\/+/, "");
	const content =
		(await readPublicFile(clean)) || (await fetchPublicFile(clean));
	if (!content) return null;
	return {
		filename: path.basename(clean),
		content,
		contentType: contentTypeFor(clean),
		cid,
	};
}
