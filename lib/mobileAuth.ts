import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { assertStrongSecret, getRequiredEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { assertSubscriptionCanRead, assertSubscriptionCanWrite } from "@/lib/subscription";

export type MobileSession = {
    userId: string;
    farmId: string | null;
    email: string;
    role: string;
};

function getMobileSecret() {
    const secret = getRequiredEnv("JWT_SECRET");
    assertStrongSecret("JWT_SECRET", secret);
    return secret;
}

export function signMobileToken(session: MobileSession) {
    return jwt.sign(session, getMobileSecret(), { expiresIn: "7d" });
}

export function getMobileSession(req: NextRequest): MobileSession | null {
    try {
        const auth = req.headers.get("Authorization") ?? "";
        if (!auth.startsWith("Bearer ")) return null;
        return jwt.verify(auth.slice(7), getMobileSecret()) as MobileSession;
    } catch {
        return null;
    }
}

type MobilePermission =
    | "fields"
    | "crops"
    | "activities"
    | "finance"
    | "employees"
    | "yields"
    | "reports"
    | "team"
    | "documents"
    | "equipment";

const ROLE_PERMISSIONS: Record<string, Record<MobilePermission, boolean>> = {
    owner: {
        fields: true, crops: true, activities: true, finance: true, employees: true,
        yields: true, reports: true, team: true, documents: true, equipment: true,
    },
    manager: {
        fields: true, crops: true, activities: true, finance: false, employees: true,
        yields: true, reports: true, team: false, documents: true, equipment: true,
    },
    agronomist: {
        fields: true, crops: true, activities: true, finance: false, employees: false,
        yields: true, reports: true, team: false, documents: true, equipment: false,
    },
    accountant: {
        fields: false, crops: false, activities: false, finance: true, employees: true,
        yields: false, reports: true, team: false, documents: true, equipment: false,
    },
    field_worker: {
        fields: false, crops: false, activities: true, finance: false, employees: false,
        yields: true, reports: false, team: false, documents: false, equipment: false,
    },
    viewer: {
        fields: true, crops: true, activities: false, finance: false, employees: false,
        yields: true, reports: true, team: false, documents: true, equipment: false,
    },
};

export async function requireMobilePermission(req: NextRequest, permission: MobilePermission) {
    const session = getMobileSession(req);
    if (!session?.farmId) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    try {
        if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
            await assertSubscriptionCanWrite(session.userId);
        } else {
            await assertSubscriptionCanRead(session.userId);
        }
    } catch (err) {
        return {
            error: NextResponse.json(
                { error: err instanceof Error ? err.message : "Subscription upgrade required" },
                { status: 403 },
            ),
        };
    }

    const farm = await prisma.farm.findUnique({ where: { id: session.farmId } });
    if (!farm) {
        return { error: NextResponse.json({ error: "Farm not found" }, { status: 404 }) };
    }

    if (farm.userId === session.userId) return { session, farm, role: "owner" };

    const member = await prisma.teamMember.findFirst({
        where: { farmId: session.farmId, userId: session.userId, status: "active" },
    });

    if (!member) {
        return { error: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
    }

    const custom = member.permissions as Record<string, boolean> | null;
    const allowed = custom?.[permission] ?? ROLE_PERMISSIONS[member.role]?.[permission] ?? false;

    if (!allowed) {
        return {
            error: NextResponse.json(
                { error: "Your role does not allow this action" },
                { status: 403 },
            ),
        };
    }

    return { session, farm, role: member.role };
}
