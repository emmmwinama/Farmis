import { NextRequest, NextResponse } from "next/server";
import { requireMobilePermission } from "@/lib/mobileAuth";

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "reports");
  if (access.error) return access.error;

  return NextResponse.json({
    graphs: [
      { key: "cashflowByMonth", title: "Cashflow by month", type: "bar", endpoint: "/api/mobile/reports", dataPath: "financeSummary" },
      { key: "yieldPerHaBySeason", title: "Yield per hectare by season", type: "line", endpoint: "/api/mobile/reports", dataPath: "yieldsReport.byType" },
      { key: "costPerHaBySeason", title: "Cost of production per hectare", type: "line", endpoint: "/api/mobile/seasons", dataPath: "seasons" },
      { key: "costPerKgProduced", title: "Cost per kg produced", type: "line", endpoint: "/api/mobile/seasons", dataPath: "seasons" },
      { key: "revenueVsExpensesBySeason", title: "Revenue vs expenses by season", type: "bar", endpoint: "/api/mobile/seasons", dataPath: "seasons" },
      { key: "expenseBreakdownBySeason", title: "Expense breakdown by season", type: "stacked-bar", endpoint: "/api/mobile/seasons", dataPath: "seasons" },
      { key: "fieldMap", title: "Farm map", type: "map", endpoint: "/api/mobile/field-map", dataPath: "fields" },
      { key: "seasonComparison", title: "Season comparison", type: "comparison-table", endpoint: "/api/mobile/seasons/compare", dataPath: "comparison" },
      { key: "cropPerformance", title: "Crop performance trends", type: "status-list", endpoint: "/api/mobile/reports", dataPath: "cropReport" },
    ],
    status: {
      dedicatedLiveWidgetsForAllGraphs: false,
      note: "This catalog gives the mobile app a stable graph registry while chart widgets are implemented incrementally.",
    },
  });
}
