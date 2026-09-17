import { NextRequest, NextResponse } from "next/server";
import { getDbClient, isDatabaseConfigured } from "../_lib/db";

export const runtime = "nodejs";

// Validation function
function validateInputs(data: {
  frCode?: string;
  liCode?: string;
  acOpening?: string | number;
  monthlyCapping?: string | number;
  brokerageSharing?: string | number;
  periodicity?: string;
  pmsSharing?: string | number;
  peaifSharing?: string | number;
  mfSharing?: string | number;
  insuranceSharing?: string | number;
  fixedIncomeSharing?: string | number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate required fields
  if (!data.frCode || data.frCode.toString().trim() === "") {
    errors.push("FR Code is required");
  }
  if (!data.liCode || data.liCode.toString().trim() === "") {
    errors.push("LI Code is required");
  }
  if (data.acOpening === "" || data.acOpening === undefined || data.acOpening === null) {
    errors.push("A/C Opening Incentive is required");
  }
  if (data.monthlyCapping === "" || data.monthlyCapping === undefined || data.monthlyCapping === null) {
    errors.push("Monthly Capping is required");
  }
  if (!data.brokerageSharing || data.brokerageSharing.toString().trim() === "") {
    errors.push("Brokerage Sharing % is required");
  }
  if (!data.periodicity || data.periodicity.toString().trim() === "") {
    errors.push("Periodicity is required");
  }
  if (data.pmsSharing === "" || data.pmsSharing === undefined || data.pmsSharing === null) {
    errors.push("PMS Sharing % is required");
  }
  if (data.peaifSharing === "" || data.peaifSharing === undefined || data.peaifSharing === null) {
    errors.push("PE/AIF Sharing % is required");
  }
  if (data.mfSharing === "" || data.mfSharing === undefined || data.mfSharing === null) {
    errors.push("MF Sharing % is required");
  }
  if (data.insuranceSharing === "" || data.insuranceSharing === undefined || data.insuranceSharing === null) {
    errors.push("Insurance Sharing % is required");
  }
  if (data.fixedIncomeSharing === "" || data.fixedIncomeSharing === undefined || data.fixedIncomeSharing === null) {
    errors.push("Fixed Income Sharing % is required");
  }

  // Validate numeric fields
  const numericFields: Record<string, { min: number; max: number }> = {
    acOpening: { min: 0, max: 999999 },
    monthlyCapping: { min: 0, max: 999999 },
    brokerageSharing: { min: 0, max: 100 },
    pmsSharing: { min: 0, max: 100 },
    peaifSharing: { min: 0, max: 100 },
    mfSharing: { min: 0, max: 100 },
    insuranceSharing: { min: 0, max: 100 },
    fixedIncomeSharing: { min: 0, max: 999999 },
  };

  for (const [field, range] of Object.entries(numericFields)) {
    const value = data[field as keyof typeof data];
    if (value !== undefined && value !== null && value !== "") {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`${field} must be a valid number`);
      } else if (num < range.min || num > range.max) {
        errors.push(
          `${field} must be between ${range.min} and ${range.max}`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// Store data in-memory for demonstration (in production, use a real database)
interface IncentiveRecord {
  frCode: string;
  liCode: string;
  acOpening: number;
  monthlyCapping: number;
  brokerageSharing: number;
  periodicity: string;
  pmsSharing: number;
  peaifSharing: number;
  mfSharing: number;
  insuranceSharing: number;
  fixedIncomeSharing: number;
  timestamp: string;
}

const incentiveRecords: IncentiveRecord[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate inputs
    const validation = validateInputs(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    // Create a record object
    const record: IncentiveRecord = {
      frCode: body.frCode || "FR001",
      liCode: body.liCode || "LI001",
      acOpening: Number(body.acOpening),
      monthlyCapping: Number(body.monthlyCapping),
      brokerageSharing: Number(body.brokerageSharing),
      periodicity: body.periodicity,
      pmsSharing: Number(body.pmsSharing),
      peaifSharing: Number(body.peaifSharing),
      mfSharing: Number(body.mfSharing),
      insuranceSharing: Number(body.insuranceSharing),
      fixedIncomeSharing: Number(body.fixedIncomeSharing),
      timestamp: new Date().toISOString(),
    };

    // Store the record (in-memory for now)
    incentiveRecords.push(record);

    if (isDatabaseConfigured()) {
      const { pool, sql } = await getDbClient();
      await pool
        .request()
        .input("fr_code", sql.VarChar(50), record.frCode)
        .input("li_code", sql.VarChar(50), record.liCode)
        .input("ac_opening_incentive", sql.Decimal(18, 2), record.acOpening)
        .input("monthly_capping", sql.Decimal(18, 2), record.monthlyCapping)
        .input("Brok_sharing", sql.Decimal(5, 2), record.brokerageSharing)
        .input("periodicity", sql.VarChar(50), record.periodicity)
        .input("pms_sharing", sql.Decimal(5, 2), record.pmsSharing)
        .input("pe_sharing", sql.Decimal(5, 2), record.peaifSharing)
        .input("mf_sharing", sql.Decimal(5, 2), record.mfSharing)
        .input("insurance_sharing", sql.Decimal(5, 2), record.insuranceSharing)
        .input("fixed_sharing", sql.Decimal(18, 2), record.fixedIncomeSharing)
        .execute("usp_Insert_Brokrage_Sharing_Details");
    } else {
      console.log("Incentive data received and validated:", record);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Incentive data validated and submitted successfully",
        data: record,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve stored records (for testing/debugging)
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      records: incentiveRecords,
      message:
        "In-memory storage (for testing). To persist data, configure the MSSQL database connection.",
    },
    { status: 200 }
  );
}
