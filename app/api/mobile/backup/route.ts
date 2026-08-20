import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";
import { checkFeature } from "@/lib/subscription";
import { buildBackupPayload, applyBackupPayload } from "@/lib/mobileBackup";

async function authorizedFarm(session: NonNullable<ReturnType<typeof getMobileSession>>) {
    if (!session.farmId) return null;
    return prisma.farm.findFirst({
        where: {
            id: session.farmId,
            OR: [{ userId: session.userId }, { teamMembers: { some: { userId: session.userId, status: "active" } } }],
        },
    });
}

// Pull the farm's latest cloud backup down — used to restore onto a new
// device. Free-tier users have never had anything uploaded (POST is gated
// the same way), so this just comes back empty for them rather than erroring.
export async function GET(req: NextRequest) {
    const session = getMobileSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await checkFeature(session.userId, "syncEnabled");
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Sync requires a paid plan" },
            { status: 403 },
        );
    }

    const farm = await authorizedFarm(session);
    if (!farm) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    try {
        const payload = await buildBackupPayload(farm.id);
        return NextResponse.json(payload);
    } catch (error) {
        console.error("[mobile/backup][GET]", error);
        return NextResponse.json({ error: "Could not load your backup. Please try again." }, { status: 500 });
    }
}

// Push this device's full local export up to the cloud. Safe to call
// repeatedly (e.g. nightly, or on app close) — every row is upserted by its
// own id, so re-uploading the same or an updated snapshot just reconciles.
export async function POST(req: NextRequest) {
    const session = getMobileSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await checkFeature(session.userId, "syncEnabled");
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Sync requires a paid plan" },
            { status: 403 },
        );
    }

    const farm = await authorizedFarm(session);
    if (!farm) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    let payload: Record<string, unknown>;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid backup payload" }, { status: 400 });
    }

    try {
        const counts = await applyBackupPayload(farm.id, session.userId, payload);
        return NextResponse.json({ counts, syncedAt: new Date().toISOString() });
    } catch (error) {
        console.error("[mobile/backup][POST]", error);
        return NextResponse.json({ error: "Could not save your backup. Please try again." }, { status: 500 });
    }
}
