import { prisma } from "@/lib/prisma";

export async function getUserSubscription(userId: string) {
    const sub = await prisma.subscription.findUnique({
        where: { userId },
        include: { tier: true },
    });
    return sub;
}

function isUsableSubscription(sub: Awaited<ReturnType<typeof getUserSubscription>>) {
    if (!sub) return false;

    const now = new Date();
    if (sub.status === "active") return !sub.endDate || sub.endDate > now;
    if (sub.status === "trial") {
        const trialEnd = sub.trialEndsAt ?? sub.endDate;
        return !!trialEnd && trialEnd > now;
    }

    return false;
}

export async function checkLimit(
    userId: string,
    resource: "Fields" | "Crops" | "Activities" | "Transactions" | "Employees" | "Farms"
) {
    const sub = await getUserSubscription(userId);
    if (!sub || !isUsableSubscription(sub)) {
        throw new Error("No active subscription found. Please start a trial or upgrade your plan.");
    }

    const limitKey = `max${resource}` as keyof typeof sub.tier;
    const limit = sub.tier[limitKey] as number;
    if (limit === -1) return; // unlimited

    const farmIds = (
        await prisma.farm.findMany({ where: { userId }, select: { id: true } })
    ).map((f) => f.id);

    let count = 0;

    if (resource === "Fields") {
        count = await prisma.field.count({ where: { farmId: { in: farmIds } } });
    } else if (resource === "Crops") {
        const fieldIds = (
            await prisma.field.findMany({
                where: { farmId: { in: farmIds } },
                select: { id: true },
            })
        ).map((f) => f.id);
        count = await prisma.cropField.count({ where: { fieldId: { in: fieldIds } } });
    } else if (resource === "Activities") {
        const fieldIds = (
            await prisma.field.findMany({
                where: { farmId: { in: farmIds } },
                select: { id: true },
            })
        ).map((f) => f.id);
        count = await prisma.farmActivity.count({ where: { fieldId: { in: fieldIds } } });
    } else if (resource === "Transactions") {
        count = await prisma.transaction.count({ where: { farmId: { in: farmIds } } });
    } else if (resource === "Employees") {
        count = await prisma.employee.count({ where: { farmId: { in: farmIds } } });
    } else if (resource === "Farms") {
        count = await prisma.farm.count({ where: { userId } });
    }

    if (count >= limit) {
        throw new Error(
            `Your ${sub.tier.name} plan allows a maximum of ${limit} ${resource.toLowerCase()}. Please upgrade to add more.`
        );
    }
}

export async function checkFeature(
    userId: string,
    feature:
        | "seasonAnalytics"
        | "yieldSuggestions"
        | "costPerHectare"
        | "payrollTracking"
        | "multipleFarms"
        | "teamAccounts"
        | "customReports"
        | "apiAccess"
) {
    const sub = await getUserSubscription(userId);
    if (!sub || !isUsableSubscription(sub)) {
        throw new Error("No active subscription found.");
    }

    const allowed = sub.tier[feature] as boolean;
    if (!allowed) {
        throw new Error(
            `This feature is not available on your ${sub.tier.name} plan. Please upgrade.`
        );
    }
}

export async function getSubscriptionStatus(userId: string) {
    const sub = await getUserSubscription(userId);
    if (!sub) return { active: false, tier: null, daysRemaining: null };

    const now = new Date();
    const active = isUsableSubscription(sub);

    const endDate = sub.status === "trial" ? sub.trialEndsAt ?? sub.endDate : sub.endDate;
    const daysRemaining = endDate
        ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000))
        : null;

    return { active, tier: sub.tier, daysRemaining, status: sub.status };
}
