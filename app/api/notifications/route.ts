import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const { user, farm } = await getSessionFarm();
    if (!farm || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    // Auto-generate notifications from farm data
    await generateNotifications(user.id, farm.id);

    const notifications = await prisma.notification.findMany({
        where: {
            userId: user.id,
            farmId: farm.id,
            ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    const count = await prisma.notification.count({
        where: { userId: user.id, farmId: farm.id, isRead: false },
    });

    return NextResponse.json({ notifications, count });
}

export async function PATCH(req: Request) {
    const { user, farm } = await getSessionFarm();
    if (!farm || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
        await prisma.notification.updateMany({
            where: { userId: user.id, farmId: farm.id, isRead: false },
            data: { isRead: true },
        });
    } else if (id) {
        await prisma.notification.update({ where: { id }, data: { isRead: true } });
    }

    return NextResponse.json({ success: true });
}

async function generateNotifications(userId: string, farmId: string) {
    const fields = await prisma.field.findMany({
        where: { farmId },
        include: {
            cropFields: {
                include: {
                    cropType: true,
                    activities: { orderBy: { date: "desc" }, take: 1 },
                    yields: true,
                },
            },
        },
    });

    const allCropFields = fields.flatMap((f) => f.cropFields);
    const now = new Date();
    const notifs: Array<{
        userId: string; farmId: string; type: string;
        title: string; message: string; link: string;
    }> = [];

    for (const cf of allCropFields) {
        if (cf.status !== "Active") continue;

        const harvestDate = new Date(cf.expectedHarvestDate);
        const daysToHarvest = Math.ceil((harvestDate.getTime() - now.getTime()) / 86400000);

        // Harvest due within 14 days
        if (daysToHarvest >= 0 && daysToHarvest <= 14) {
            const existing = await prisma.notification.findFirst({
                where: { userId, farmId, type: "harvest_due", link: `/dashboard/crops` },
            });
            if (!existing) {
                notifs.push({
                    userId, farmId, type: "harvest_due",
                    title: `${cf.cropType.name} harvest due`,
                    message: `${cf.cropType.name} (${cf.variety}) is due for harvest ${daysToHarvest === 0 ? "today" : `in ${daysToHarvest} day${daysToHarvest !== 1 ? "s" : ""}`}`,
                    link: `/dashboard/yields`,
                });
            }
        }

        // No activity in 21+ days
        const lastActivity = cf.activities[0];
        if (lastActivity) {
            const daysSince = Math.floor((now.getTime() - new Date(lastActivity.date).getTime()) / 86400000);
            if (daysSince >= 21) {
                const existing = await prisma.notification.findFirst({
                    where: { userId, farmId, type: "no_activity", title: { contains: cf.cropType.name } },
                });
                if (!existing) {
                    notifs.push({
                        userId, farmId, type: "no_activity",
                        title: `No activity: ${cf.cropType.name}`,
                        message: `No activities logged for ${cf.cropType.name} (${cf.variety}) in ${daysSince} days`,
                        link: `/dashboard/activities/new`,
                    });
                }
            }
        }
    }

    // Low inventory (sold > 80%)
    const inventoryItems = await prisma.inventoryItem.findMany({
        where: { farmId },
        include: { sales: true },
    });

    for (const item of inventoryItems) {
        const totalSold = item.sales.reduce((s, sale) => s + sale.quantitySold, 0);
        const originalQty = item.quantity + totalSold;
        if (originalQty > 0 && (item.quantity / originalQty) < 0.2 && item.quantity > 0) {
            const existing = await prisma.notification.findFirst({
                where: { userId, farmId, type: "low_inventory", title: { contains: item.name } },
            });
            if (!existing) {
                notifs.push({
                    userId, farmId, type: "low_inventory",
                    title: `Low inventory: ${item.name}`,
                    message: `Only ${item.quantity} ${item.unit} of ${item.name} remaining (${Math.round((item.quantity / originalQty) * 100)}% left)`,
                    link: `/dashboard/inventory`,
                });
            }
        }
    }

    if (notifs.length > 0) {
        await prisma.notification.createMany({ data: notifs, skipDuplicates: true });
    }
}