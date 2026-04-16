import { NextRequest, NextResponse } from "next/server";
import { initializeData, isDataInitialized } from "@/lib/init-data";
import { runApi } from "@/lib/api/run-api";

export async function POST(req: NextRequest) {
  return runApi(req, "POST", "/api/init", async () => {
    const alreadyInitialized = await isDataInitialized();

    if (alreadyInitialized) {
      return NextResponse.json({
        success: true,
        message: "Data already initialized",
      });
    }

    const success = await initializeData();

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Data initialized successfully",
      });
    }

    return NextResponse.json(
      { success: false, message: "Failed to initialize data" },
      { status: 500 },
    );
  });
}

export async function GET(req: NextRequest) {
  return runApi(req, "GET", "/api/init", async () => {
    const initialized = await isDataInitialized();
    return NextResponse.json({
      initialized,
      message: initialized ? "Data is initialized" : "Data not initialized",
    });
  });
}
