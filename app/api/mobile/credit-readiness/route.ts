import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "reports");
  if (access.error) return access.error;

  const [fields, crops, transactions, documents, scores] = await Promise.all([
    prisma.field.count({ where: { farmId: access.session.farmId! } }),
    prisma.cropField.count({ where: { field: { farmId: access.session.farmId! } } }),
    prisma.transaction.findMany({ where: { farmId: access.session.farmId! }, select: { type: true, amount: true } }),
    prisma.farmDocument.count({ where: { farmId: access.session.farmId! } }),
    prisma.farmCreditScore.findMany({ where: { farmId: access.session.farmId! }, orderBy: { generatedAt: "desc" }, take: 1 }),
  ]);

  const income = transactions.filter((tx) => tx.type === "Income").reduce((sum, tx) => sum + tx.amount, 0);
  const expense = transactions.filter((tx) => tx.type === "Expense").reduce((sum, tx) => sum + tx.amount, 0);
  const checks = [
    { key: "fields", label: "Fields recorded", passed: fields > 0, value: fields },
    { key: "crops", label: "Crop history", passed: crops > 0, value: crops },
    { key: "transactions", label: "Finance records", passed: transactions.length >= 3, value: transactions.length },
    { key: "documents", label: "Evidence documents", passed: documents > 0, value: documents },
    { key: "profitability", label: "Positive net activity", passed: income - expense > 0, value: income - expense },
  ];
  const readinessScore = Math.round((checks.filter((check) => check.passed).length / checks.length) * 100);

  return NextResponse.json({
    latestScore: scores[0] ?? null,
    readinessScore,
    grade: readinessScore >= 80 ? "A" : readinessScore >= 60 ? "B" : readinessScore >= 40 ? "C" : "D",
    checks,
    summary: { fields, crops, transactionCount: transactions.length, documents, income, expense, net: income - expense },
    engine: { dedicatedScoringEngine: Boolean(scores[0]), source: scores[0] ? "FarmCreditScore" : "readiness summary" },
  });
}
