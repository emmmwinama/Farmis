import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await prisma.farm.findMany({ where: { userId: session.userId }, select: { id: true } });
  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.userId, status: "active" },
    select: { farmId: true },
  });
  const farmIds = [...new Set([...owned.map((farm) => farm.id), ...memberships.map((member) => member.farmId)])];

  const farms = await prisma.farm.findMany({
    where: { id: { in: farmIds } },
    include: {
      fields: { include: { cropFields: { include: { yields: true, activities: true } } } },
      transactions: true,
      documents: true,
    },
  });

  const portfolio = farms.map((farm) => {
    const crops = farm.fields.flatMap((field) => field.cropFields);
    const activities = crops.flatMap((crop) => crop.activities);
    const harvests = crops.flatMap((crop) => crop.yields);
    const income = farm.transactions.filter((tx) => tx.type === "Income").reduce((sum, tx) => sum + tx.amount, 0);
    const expense = farm.transactions.filter((tx) => tx.type === "Expense").reduce((sum, tx) => sum + tx.amount, 0);
    const completeness = Math.round(([farm.fields.length > 0, crops.length > 0, activities.length > 0, harvests.length > 0, farm.transactions.length > 0, farm.documents.length > 0].filter(Boolean).length / 6) * 100);
    return {
      id: farm.id,
      name: farm.name,
      location: farm.location,
      fields: farm.fields.length,
      crops: crops.length,
      activities: activities.length,
      harvests: harvests.length,
      documents: farm.documents.length,
      net: income - expense,
      recordCompleteness: completeness,
      risk: completeness < 50 || income - expense < 0 ? "High" : completeness < 80 ? "Medium" : "Low",
    };
  });

  return NextResponse.json({
    totals: {
      farms: portfolio.length,
      highRisk: portfolio.filter((farm) => farm.risk === "High").length,
      averageCompleteness: portfolio.length ? Math.round(portfolio.reduce((sum, farm) => sum + farm.recordCompleteness, 0) / portfolio.length) : 0,
    },
    portfolio,
  });
}
