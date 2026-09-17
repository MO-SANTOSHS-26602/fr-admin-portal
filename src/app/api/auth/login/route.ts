import { NextRequest, NextResponse } from "next/server";
import { getDbClient, isDatabaseConfigured } from "../../_lib/db";
import { encryptionCode } from "../../../../utils/encryption";

export const runtime = "nodejs";

function isSuccessfulLogin(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return false;

  const firstRow = rows[0];
  const values = Object.values(firstRow);
  const normalizedKeys = Object.fromEntries(
    Object.entries(firstRow).map(([key, value]) => [key.toLowerCase(), value])
  );

  for (const key of ["success", "isvalid", "is_valid", "valid", "status"]) {
    const value = normalizedKeys[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      return ["1", "true", "success", "valid", "y", "yes"].includes(
        value.trim().toLowerCase()
      );
    }
  }

  if (typeof normalizedKeys.message === "string") {
    return !/invalid|failed|incorrect|not found/i.test(normalizedKeys.message);
  }

  return values.some((value) => value !== null && value !== undefined);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = body.username?.toString().trim();
    const password = body.password?.toString();
    console.log("Received login request:", { username });

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Database connection is not configured" },
        { status: 500 }
      );
    }

    const encryptedPassword = encryptionCode(password);
    console.log("Encrypted password:", encryptedPassword);
    const { pool, sql } = await getDbClient();
    const result = await pool
      .request()
      .input("user_name", sql.VarChar(100), username)
      .input("password", sql.VarChar(500), encryptedPassword)
      .query(
        "EXEC USP_Validate_Admin_Login @user_name = @user_name, @password = @password"
      );

    const rows = (result.recordset || []) as Record<string, unknown>[];
    const authenticated = isSuccessfulLogin(rows);
      console.log("Authentication result:", { authenticated, rows });
    if (!authenticated) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, username });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}
