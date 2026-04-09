import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function getActiveFarmId(userId: string): Promise<string | null> {
    const cookieStore = cookies();
    const cookieFarmId = cookieStore.get(`active_farm_${userId}`)?.value;

    if (cookieFarmId) {
        // Verify user has access to this farm
        const ownsFarm = await prisma.farm.findFirst({
            where: { id: cookieFarmId, userId },
        });
        if (ownsFarm) return cookieFarmId;

        const isMember = await prisma.teamMember.findFirst({
            where: { farmId: cookieFarmId, userId, status: "active" },
        });
        if (isMember) return cookieFarmId;
    }

    // Default: user's own first farm
    const ownFarm = await prisma.farm.findFirst({ where: { userId } });
    if (ownFarm) return ownFarm.id;

    // Fallback: first team membership
    const membership = await prisma.teamMember.findFirst({
        where: { userId, status: "active" },
        include: { farm: true },
    });
    if (membership) return membership.farmId;

    return null;
}

export async function getActiveFarm(userId: string) {
    const farmId = await getActiveFarmId(userId);
    if (!farmId) return null;

    return prisma.farm.findUnique({
        where: { id: farmId },
        include: { user: { select: { id: true, name: true, email: true } } },
    });
}

export async function getAllAccessibleFarms(userId: string) {
    const [ownFarms, memberships] = await Promise.all([
        prisma.farm.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
        prisma.teamMember.findMany({
            where: { userId, status: "active" },
            include: { farm: { include: { user: { select: { name: true } } } } },
        }),
    ]);

    const memberFarms = memberships.map((m) => ({
        ...m.farm,
        role: m.role,
        isOwned: false,
    }));

    const owned = ownFarms.map((f) => ({ ...f, role: "owner", isOwned: true }));

    // Deduplicate
    const seen = new Set(owned.map((f) => f.id));
    const combined = [...owned];
    for (const f of memberFarms) {
        if (!seen.has(f.id)) { combined.push(f); seen.add(f.id); }
    }

    return combined;
}