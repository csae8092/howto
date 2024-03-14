import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { log } from "@acdh-oeaw/lib";
import type { NextRequest } from "next/server";
import { z } from "zod";

import type { Resource } from "@/lib/content/types";

const filePath = join(process.cwd(), "./public/metadata/curricula.json");

const searchParamsSchema = z.object({
	limit: z.coerce.number().int().positive().max(100).optional().default(10),
	offset: z.coerce.number().int().nonnegative().optional().default(0),
});

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;

	const result = searchParamsSchema.safeParse({
		limit: searchParams.get("limit"),
		offset: searchParams.get("offset"),
	});

	if (!result.success) {
		return Response.json({ message: "Bad request" }, { status: 400 });
	}

	const { offset, limit } = result.data;

	try {
		const curricula = await readCurricula();

		return Response.json({
			curricula: curricula.slice(offset, offset + limit),
			offset,
			limit,
			total: curricula.length,
		});
	} catch (error) {
		log.error(error);
		return Response.json({ message: "Internal server error" }, { status: 500 });
	}
}

const cache = { curricula: null as Array<Resource> | null };

async function readCurricula() {
	if (cache.curricula != null) return cache.curricula;

	const fileContent = await readFile(filePath, { encoding: "utf-8" });
	const { curricula } = JSON.parse(fileContent) as { curricula: Array<Resource> };

	// eslint-disable-next-line require-atomic-updates
	cache.curricula = curricula;

	return curricula;
}
