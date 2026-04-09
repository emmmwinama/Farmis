import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveFarmId } from "@/lib/farmContext";

export async function getSessionFarm() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return { user: null, farm: null };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });
    if (!user) return { user: null, farm: null };

    const farmId = await getActiveFarmId(user.id);
    if (!farmId) return { user, farm: null };

    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    return { user, farm };
}