import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";
import { validateDocumentInput } from "@/lib/documentValidation";
import { assertSubscriptionCanWrite } from "@/lib/subscription";

async function handleItem(session: NonNullable<ReturnType<typeof getMobileSession>>, item: any) {
  const type = item.type;
  const payload = item.payload ?? {};

  if (type === "activity") {
    const duplicate = await prisma.farmActivity.findFirst({
      where: {
        fieldId: payload.fieldId,
        cropFieldId: payload.cropFieldId ?? null,
        activityType: payload.activityType,
        date: new Date(payload.date),
        createdById: session.userId,
      },
    });
    if (duplicate) return { clientId: item.clientId, status: "duplicate", id: duplicate.id };

    const activity = await prisma.farmActivity.create({
      data: {
        fieldId: payload.fieldId,
        cropFieldId: payload.cropFieldId ?? null,
        activityType: payload.activityType,
        date: new Date(payload.date),
        notes: payload.notes ?? "",
        createdById: session.userId,
        inputs: {
          create: (payload.inputs ?? []).map((input: any) => ({
            inputName: input.inputName,
            category: input.category,
            quantity: parseFloat(input.quantity) || 0,
            unit: input.unit,
            unitCost: parseFloat(input.unitCost) || 0,
            totalCost: (parseFloat(input.quantity) || 0) * (parseFloat(input.unitCost) || 0),
          })),
        },
      },
    });
    return { clientId: item.clientId, status: "created", id: activity.id };
  }

  if (type === "finance") {
    const tx = await prisma.transaction.create({
      data: {
        farmId: session.farmId!,
        type: payload.type,
        category: payload.category,
        amount: parseFloat(payload.amount),
        date: new Date(payload.date),
        description: payload.description,
        season: payload.season ?? null,
        fieldId: payload.fieldId ?? null,
        cropFieldId: payload.cropFieldId ?? null,
      },
    });
    return { clientId: item.clientId, status: "created", id: tx.id };
  }

  if (type === "document") {
    const validated = validateDocumentInput(payload);
    if (!validated.ok) return { clientId: item.clientId, status: "failed", error: validated.error };

    const doc = await prisma.farmDocument.create({
      data: {
        farmId: session.farmId!,
        name: validated.name,
        type: validated.type,
        url: validated.url,
        size: validated.size,
        linkedTo: payload.linkedTo ?? null,
        linkedType: payload.linkedType ?? null,
        notes: payload.notes ?? "",
      },
    });
    return { clientId: item.clientId, status: "created", id: doc.id };
  }

  return { clientId: item.clientId, status: "unsupported", error: `Unsupported sync type: ${type}` };
}

export async function POST(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await assertSubscriptionCanWrite(session.userId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Subscription upgrade required" },
      { status: 403 },
    );
  }

  const farm = await prisma.farm.findFirst({ where: { id: session.farmId, OR: [{ userId: session.userId }, { teamMembers: { some: { userId: session.userId, status: "active" } } }] } });
  if (!farm) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const body = await req.json();
  const queue = Array.isArray(body.queue) ? body.queue : [];
  const results = [];

  for (const item of queue) {
    try {
      results.push(await handleItem(session, item));
    } catch (error: any) {
      results.push({ clientId: item.clientId, status: "failed", error: error?.message ?? "Sync failed" });
    }
  }

  const [fields, activities, documents, inventory] = await Promise.all([
    prisma.field.count({ where: { farmId: session.farmId } }),
    prisma.farmActivity.count({ where: { field: { farmId: session.farmId } } }),
    prisma.farmDocument.count({ where: { farmId: session.farmId } }),
    prisma.inventoryItem.count({ where: { farmId: session.farmId } }),
  ]);

  return NextResponse.json({
    results,
    snapshot: { fields, activities, documents, inventory, syncedAt: new Date().toISOString() },
  });
}
