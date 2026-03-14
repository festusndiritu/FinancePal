import { NextResponse } from "next/server";

async function resolveAuthHandlers() {
	if (!process.env.MONGODB_URI || !process.env.NEXTAUTH_SECRET) {
		return null;
	}

	const { handlers } = await import("@/auth");
	return handlers;
}

function missingConfigResponse() {
	return NextResponse.json(
		{
			error:
				"Auth is not configured. Set MONGODB_URI and NEXTAUTH_SECRET in your environment.",
		},
		{ status: 503 },
	);
}

export async function GET(request: Request) {
	const handlers = await resolveAuthHandlers();

	if (!handlers) {
		return missingConfigResponse();
	}

	return handlers.GET(request);
}

export async function POST(request: Request) {
	const handlers = await resolveAuthHandlers();

	if (!handlers) {
		return missingConfigResponse();
	}

	return handlers.POST(request);
}
