import { NextResponse } from "next/server";
import { getDbClient, isDatabaseConfigured } from "../../_lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Database connection is not configured" },
        { status: 500 }
      );
    }

    const { pool } = await getDbClient();
    const result = await pool
      .request()
      .execute("usp_GetAgentTCAcceptanceStatus");

    return NextResponse.json({
      success: true,
      records: result.recordset || [],
    });
  } catch (error) {
    console.error("T&C status lookup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}
