import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET() {
  const { user } = await getSessionFarm();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.teamMember.findMany({
    where: { userId: user.id, status: "active" },
    select: { farmId: true },
  });
  const farmIds = [...new Set([...(await prisma.farm.findMany({ where: { userId: user.id }, select: { id: true } })).map((farm) => farm.id), ...memberships.map((member) => member.farmId)])];

  const farms = await prisma.farm.findMany({
    where: { id: { in: farmIds } },
    include: {
      fields: {
        include: {
          cropFields: {
            include: {
              cropType: true,
              yields: true,
              activities: true,
              transactions: true,
            },
          },
        },
      },
      transactions: true,
      creditScores: { orderBy: { generatedAt: "desc" }, take: 1 },
      documents: true,
    },
  });

  const portfolio = farms.map((farm) => {
    const crops = farm.fields.flatMap((field) => field.cropFields);
    const activities = crops.flatMap((crop) => crop.activities);
    const yields = crops.flatMap((crop) => crop.yields);
    const income = farm.transactions.filter((tx) => tx.type === "Income").reduce((sum, tx) => sum + tx.amount, 0);
    const expense = farm.transactions.filter((tx) => tx.type === "Expense").reduce((sum, tx) => sum + tx.amount, 0);
    const score = farm.creditScores[0]?.score ?? null;
    const recordCompleteness = Math.round(([
      farm.fields.length > 0,
      crops.length > 0,
      activities.length > 0,
      yields.length > 0,
      farm.transactions.length > 0,
      farm.documents.length > 0,
    ].filter(Boolean).length / 6) * 100);

    return {
      id: farm.id,
      name: farm.name,
      location: farm.location,
      fields: farm.fields.length,
      crops: crops.length,
      activities: activities.length,
      harvests: yields.length,
      documents: farm.documents.length,
      income,
      expense,
      net: income - expense,
      creditScore: score,
      recordCompleteness,
      risk: recordCompleteness < 50 || income - expense < 0 ? "High" : recordCompleteness < 80 ? "Medium" : "Low",
    };
  });

  return NextResponse.json({
    totals: {
      farms: portfolio.length,
      fields: portfolio.reduce((sum, farm) => sum + farm.fields, 0),
      crops: portfolio.reduce((sum, farm) => sum + farm.crops, 0),
      activities: portfolio.reduce((sum, farm) => sum + farm.activities, 0),
      harvests: portfolio.reduce((sum, farm) => sum + farm.harvests, 0),
      documents: portfolio.reduce((sum, farm) => sum + farm.documents, 0),
      net: portfolio.reduce((sum, farm) => sum + farm.net, 0),
      highRisk: portfolio.filter((farm) => farm.risk === "High").length,
      averageCompleteness: portfolio.length ? Math.round(portfolio.reduce((sum, farm) => sum + farm.recordCompleteness, 0) / portfolio.length) : 0,
    },
    portfolio,
  });
}
