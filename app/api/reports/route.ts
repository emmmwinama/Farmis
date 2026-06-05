import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { farm } = await getSessionFarm();
        if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const season          = searchParams.get("season");
        const includeArchived = searchParams.get("includeArchived");

        // ── Build filters ──────────────────────────────────────────────────────
        const cropWhere: any = { field: { farmId: farm.id } };
        if (season) cropWhere.season = season;
        if (includeArchived === "true")  cropWhere.isArchived = true;
        if (includeArchived === "false") cropWhere.isArchived = false;

        // ── Fetch everything ───────────────────────────────────────────────────
        const [crops, transactions, overheads, yieldsRaw] = await Promise.all([
            prisma.cropField.findMany({
                where: cropWhere,
                include: {
                    cropType: true,
                    field:    true,
                    yields:   true,
                    activities: {
                        include: {
                            inputs:        true,
                            labourRecords: true,
                            otherCosts:    true,
                        },
                    },
                },
                orderBy: { plantingDate: "desc" },
            }),
            prisma.transaction.findMany({
                where:   { farmId: farm.id, ...(season ? { season } : {}) },
                orderBy: { date: "desc" },
            }),
            // All overheads — we allocate them ourselves
            prisma.overheadExpense.findMany({
                where:   { farmId: farm.id },
                orderBy: { date: "asc" },
            }),
            prisma.harvestYield.findMany({
                where: {
                    cropField: {
                        field: { farmId: farm.id },
                        ...(season ? { season } : {}),
                        ...(includeArchived === "true"  ? { isArchived: true  } : {}),
                        ...(includeArchived === "false" ? { isArchived: false } : {}),
                    },
                },
                include: {
                    cropField: { include: { cropType: true, field: true } },
                },
                orderBy: { harvestDate: "desc" },
            }),
        ]);

        // ── Overhead allocation ────────────────────────────────────────────────
        // For each overhead expense, find which crops were "active" on that date
        // (planted before the expense date AND expected harvest after it).
        // Allocate the expense proportionally by areaPlanted among active crops.

        // Build a map: cropId → allocatedOverhead
        const overheadAllocation: Record<string, number> = {};
        let totalUnallocatedOverhead = 0;

        for (const oh of overheads) {
            const ohDate = new Date(oh.date);

            // Find crops active on this date
            const activeCrops = crops.filter((c) => {
                const planted  = c.plantingDate  ? new Date(c.plantingDate)  : null;
                const harvest  = c.expectedHarvestDate ? new Date(c.expectedHarvestDate) : null;
                if (!planted) return false;
                // Planted on or before the overhead date
                if (planted > ohDate) return false;
                // Either no expected harvest date, or harvest is after the overhead date
                if (harvest && harvest < ohDate) return false;
                return true;
            });

            if (activeCrops.length === 0) {
                // No crops were active — track as unallocated
                totalUnallocatedOverhead += oh.amount;
                continue;
            }

            const totalArea = activeCrops.reduce((s, c) => s + (c.areaPlanted ?? 0), 0);

            if (totalArea === 0) {
                // All active crops have 0 area — split equally
                const share = oh.amount / activeCrops.length;
                for (const c of activeCrops) {
                    overheadAllocation[c.id] = (overheadAllocation[c.id] ?? 0) + share;
                }
            } else {
                // Allocate proportionally by area
                for (const c of activeCrops) {
                    const share = oh.amount * ((c.areaPlanted ?? 0) / totalArea);
                    overheadAllocation[c.id] = (overheadAllocation[c.id] ?? 0) + share;
                }
            }
        }

        // Total overhead allocated to selected crops (may be subset if season filtered)
        const totalAllocatedOverhead = crops.reduce(
            (s, c) => s + (overheadAllocation[c.id] ?? 0), 0
        );
        const totalOverhead = overheads.reduce((s, o) => s + o.amount, 0);

        // ── Activity cost helper ───────────────────────────────────────────────
        function activityCosts(activities: any[]) {
            let inputCost = 0, labourCost = 0, otherCost = 0;
            const byCategory: Record<string, number> = {};
            for (const act of activities) {
                for (const inp of act.inputs ?? []) {
                    inputCost += inp.totalCost ?? 0;
                    byCategory[inp.category] = (byCategory[inp.category] ?? 0) + (inp.totalCost ?? 0);
                }
                for (const lab of act.labourRecords ?? []) {
                    labourCost += lab.totalCost ?? 0;
                    byCategory["Labour"] = (byCategory["Labour"] ?? 0) + (lab.totalCost ?? 0);
                }
                for (const oth of act.otherCosts ?? []) {
                    otherCost += oth.amount ?? 0;
                    byCategory["Other"] = (byCategory["Other"] ?? 0) + (oth.amount ?? 0);
                }
            }
            return { inputCost, labourCost, otherCost, total: inputCost + labourCost + otherCost, byCategory };
        }

        // ── Yield unit conversion ──────────────────────────────────────────────
        function toKg(quantity: number, unit: string, unitWeight: number | null): number {
            const u = (unit ?? "").toLowerCase().trim();
            if (u === "kg" || u === "kilogram" || u === "kilograms") return quantity;
            if (u === "tonne" || u === "tonnes" || u === "t") return quantity * 1000;
            if (u.startsWith("bag")) {
                if (unitWeight && unitWeight > 0) return quantity * unitWeight;
                if (u.includes("50"))  return quantity * 50;
                if (u.includes("25"))  return quantity * 25;
                if (u.includes("100")) return quantity * 100;
                return quantity * 50;
            }
            if (u === "crate" || u === "crates") return quantity * 20;
            if (unitWeight && unitWeight > 0) return quantity * unitWeight;
            return quantity;
        }

        function formatYield(quantity: number, unit: string, unitWeight: number | null) {
            const kg = toKg(quantity, unit, unitWeight);
            const u  = (unit ?? "").toLowerCase().trim();
            if (u.startsWith("bag")) {
                const wt = unitWeight ?? (u.includes("50") ? 50 : u.includes("25") ? 25 : 50);
                return { displayQty: `${quantity} bags`, displayUnit: `${wt} kg/bag`, kg };
            }
            if (u === "tonne" || u === "tonnes" || u === "t") {
                return { displayQty: `${quantity} tonnes`, displayUnit: `(${kg.toLocaleString()} kg)`, kg };
            }
            return { displayQty: `${quantity}`, displayUnit: unit, kg };
        }

        // ── Per-crop summary ───────────────────────────────────────────────────
        const incomeTransactions  = transactions.filter((t) => t.type === "Income");
        const expenseTransactions = transactions.filter((t) => t.type === "Expense");

        const perCrop = crops.map((c) => {
            const costs         = activityCosts(c.activities);
            const allocatedOH   = overheadAllocation[c.id] ?? 0;
            const totalCost     = costs.total + allocatedOH;

            const cropRevenue   = incomeTransactions
                .filter((t) => t.cropFieldId === c.id)
                .reduce((s, t) => s + t.amount, 0);

            const cropYields    = yieldsRaw.filter((y) => y.cropFieldId === c.id);
            const totalKg       = cropYields.reduce((s, y) => s + toKg(y.quantity, y.unit, y.unitWeight), 0);

            return {
                id:              c.id,
                cropTypeName:    c.cropType.name,
                fieldName:       c.field.name,
                variety:         c.variety,
                season:          c.season,
                areaPlanted:     c.areaPlanted,
                plantingDate:    c.plantingDate,
                expectedHarvestDate: c.expectedHarvestDate,
                status:          c.status,
                isArchived:      c.isArchived,
                archivedAt:      c.archivedAt,
                archivedReason:  c.archivedReason,
                yieldCount:      c.yields.length,
                activityCount:   c.activities.length,
                // Costs
                inputCost:       costs.inputCost,
                labourCost:      costs.labourCost,
                otherCost:       costs.otherCost,
                activityCost:    costs.total,
                allocatedOverhead: allocatedOH,
                totalCost,
                // Revenue & profit
                revenue:         cropRevenue,
                netProfit:       cropRevenue - totalCost,
                // Yield
                totalYieldKg:    totalKg,
                yieldPerHa:      c.areaPlanted > 0 ? totalKg / c.areaPlanted : 0,
                costPerKg:       totalKg > 0 ? totalCost / totalKg : 0,
            };
        });

        // ── Farm-wide totals ───────────────────────────────────────────────────
        const totalRevenue  = incomeTransactions.reduce((s, t) => s + t.amount, 0);
        const totalActCost  = perCrop.reduce((s, c) => s + c.activityCost, 0);
        const totalExpTx    = expenseTransactions.reduce((s, t) => s + t.amount, 0);
        const totalExpenses = totalActCost + totalAllocatedOverhead + totalExpTx;
        const totalArea     = crops.reduce((s, c) => s + (c.areaPlanted ?? 0), 0);
        const totalKgAll    = perCrop.reduce((s, c) => s + c.totalYieldKg, 0);

        // ── Expense categories (combined) ──────────────────────────────────────
        const expCatMap: Record<string, number> = {};
        for (const c of perCrop) {
            for (const [cat, amt] of Object.entries(activityCosts(crops.find((x) => x.id === c.id)!.activities).byCategory)) {
                expCatMap[cat] = (expCatMap[cat] ?? 0) + amt;
            }
        }
        if (totalAllocatedOverhead > 0) expCatMap["Overhead (allocated)"] = totalAllocatedOverhead;
        for (const t of expenseTransactions) {
            expCatMap[t.category] = (expCatMap[t.category] ?? 0) + t.amount;
        }

        const incCatMap: Record<string, number> = {};
        for (const t of incomeTransactions) {
            incCatMap[t.category] = (incCatMap[t.category] ?? 0) + t.amount;
        }

        // ── By-season breakdown ────────────────────────────────────────────────
        let bySeasonBreakdown: any[] = [];
        if (!season) {
            const allCrops = await prisma.cropField.findMany({
                where:   { field: { farmId: farm.id } },
                include: {
                    activities: { include: { inputs: true, labourRecords: true, otherCosts: true } },
                },
            });
            const allTx = await prisma.transaction.findMany({ where: { farmId: farm.id } });

            const seasonMap: Record<string, any> = {};
            for (const c of allCrops) {
                const s = c.season ?? "Unknown";
                if (!seasonMap[s]) seasonMap[s] = { season: s, cropCount: 0, area: 0, revenue: 0, expenses: 0, archivedCount: 0 };
                seasonMap[s].cropCount++;
                seasonMap[s].area += c.areaPlanted ?? 0;
                const costs = activityCosts(c.activities);
                seasonMap[s].expenses += costs.total + (overheadAllocation[c.id] ?? 0);
                if (c.isArchived) seasonMap[s].archivedCount++;
            }
            for (const t of allTx) {
                const s = t.season ?? "Unknown";
                if (!seasonMap[s]) seasonMap[s] = { season: s, cropCount: 0, area: 0, revenue: 0, expenses: 0, archivedCount: 0 };
                if (t.type === "Income")  seasonMap[s].revenue  += t.amount;
                if (t.type === "Expense") seasonMap[s].expenses += t.amount;
            }
            bySeasonBreakdown = Object.values(seasonMap).sort((a, b) => b.season.localeCompare(a.season));
        }

        // ── Format yields ──────────────────────────────────────────────────────
        const formattedYields = yieldsRaw.map((y) => {
            const d = formatYield(y.quantity, y.unit, y.unitWeight);
            return {
                id:          y.id,
                harvestDate: y.harvestDate,
                quantity:    y.quantity,
                unit:        y.unit,
                unitWeight:  y.unitWeight,
                displayQty:  d.displayQty,
                displayUnit: d.displayUnit,
                kg:          d.kg,
                notes:       y.notes,
                cropName:    y.cropField.cropType.name,
                fieldName:   y.cropField.field.name,
                season:      y.cropField.season,
                isArchived:  y.cropField.isArchived,
            };
        });

        return NextResponse.json({
            summary: {
                totalCrops:              crops.length,
                totalArea,
                totalRevenue,
                totalExpenses,
                netProfit:               totalRevenue - totalExpenses,
                activityCost:            totalActCost,
                allocatedOverhead:       totalAllocatedOverhead,
                unallocatedOverhead:     totalUnallocatedOverhead,
                totalOverhead,
                totalKgHarvested:        totalKgAll,
                avgYieldPerHa:           totalArea > 0 ? totalKgAll / totalArea : 0,
                bySeasonBreakdown,
            },
            crops:  perCrop,
            finance: {
                totalIncome:         totalRevenue,
                totalExpenses,
                netProfit:           totalRevenue - totalExpenses,
                incomeByCategory:    Object.entries(incCatMap).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total),
                expensesByCategory:  Object.entries(expCatMap).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total),
                transactions:        transactions.map((t) => ({
                    id: t.id, date: t.date, type: t.type,
                    category: t.category, description: t.description,
                    amount: t.amount, season: t.season,
                })),
            },
            yields: formattedYields,
            overheadAllocationSummary: {
                totalOverhead,
                totalAllocated:   totalAllocatedOverhead,
                totalUnallocated: totalUnallocatedOverhead,
                perCrop: perCrop.map((c) => ({
                    cropTypeName:     c.cropTypeName,
                    fieldName:        c.fieldName,
                    season:           c.season,
                    areaPlanted:      c.areaPlanted,
                    allocatedOverhead: c.allocatedOverhead,
                })).filter((c) => c.allocatedOverhead > 0),
            },
        });

    } catch (err: any) {
        console.error("Reports error:", err?.message);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}