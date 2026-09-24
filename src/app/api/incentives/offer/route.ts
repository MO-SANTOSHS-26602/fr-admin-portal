import { NextRequest, NextResponse } from "next/server";
import { getDbClient, isDatabaseConfigured } from "../../_lib/db";

export const runtime = "nodejs";

function pickField(row: Record<string, unknown>, fieldNames: string[]) {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [
    key.toLowerCase(),
    value,
  ]);
  const normalizedRow = Object.fromEntries(normalizedEntries);

  for (const fieldName of fieldNames) {
    const value = normalizedRow[fieldName.toLowerCase()];
    if (value !== undefined && value !== null) return value;
  }

  return null;
}

function mapBrokerageSharingRow(row: Record<string, unknown>) {
  return {
    SrNo: pickField(row, ["SrNo", "sr_no", "id"]),
    frCode: pickField(row, ["frCode", "fr_code", "FRCode"]),
    raCode: pickField(row, ["raCode", "liCode", "li_code", "AgentUID"]),
    agentName: pickField(row, ["agentName", "agent_name", "AgentName"]),
    referDate: pickField(row, ["referDate", "refer_date", "created_date"]),
    upfrontIncentive: pickField(row, [
      "upfrontIncentive",
      "ac_opening_incentive",
      "acOpening",
    ]),
    revShare: pickField(row, ["revShare", "Brok_sharing", "brokerageSharing"]),
    monthlyCap: pickField(row, ["monthlyCap", "monthly_capping"]),
    Periodicity: pickField(row, ["Periodicity", "periodicity"]),
    PMS: pickField(row, ["PMS", "pms_sharing"]),
    PE: pickField(row, ["PE", "pe_sharing", "peaifSharing"]),
    FixedIncome: pickField(row, [
      "FixedIncome",
      "fixed_sharing",
      "fixedIncomeSharing",
    ]),
    MF: pickField(row, ["MF", "mf_sharing"]),
    Insurance: pickField(row, ["Insurance", "insurance_sharing"]),
  };
}

export async function GET(request: NextRequest) {
  try {
    const frCode = request.nextUrl.searchParams.get("frCode")?.trim();
    const raCode = request.nextUrl.searchParams.get("raCode")?.trim();

    if (!frCode || !raCode) {
      return NextResponse.json(
        { success: false, error: "FR Code and LI Code are required" },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Database connection is not configured" },
        { status: 500 }
      );
    }

    const { pool, sql } = await getDbClient();
    const result = await pool
      .request()
      .input("fr_code", sql.VarChar(500), frCode)
      .input("li_code", sql.VarChar(500), raCode)
      .execute("USP_Get_Brokrage_Sharing_Details_front");

    const rows = (result.recordset || []) as Record<string, unknown>[];
    const offers = rows.map(mapBrokerageSharingRow);

    return NextResponse.json({
      success: true,
      offer: offers[0] || null,
      records: offers,
      rawRecords: rows,
      sourceProcedure: "USP_Get_Brokrage_Sharing_Details_front",
    });
  } catch (error) {
    console.error("Brokerage sharing details lookup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}
