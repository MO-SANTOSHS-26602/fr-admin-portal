import { NextRequest, NextResponse } from "next/server";
import { getDbClient, isDatabaseConfigured } from "../../_lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const frCode = request.nextUrl.searchParams.get("frCode")?.trim();

    if (!frCode) {
      return NextResponse.json(
        { success: false, error: "FR Code is required" },
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
      .input("frcode", sql.VarChar(20), frCode)
      .query("EXEC usp_GetRADropdownByFrCode @frcode");

    const rows = result.recordset || [];
    const agentUid = rows[0]?.AgentUID?.toString() || "";

    return NextResponse.json({
      success: true,
      liCode: agentUid,
      records: rows,
    });
  } catch (error) {
    console.error("LI Code lookup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}
