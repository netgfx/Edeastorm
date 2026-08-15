/** @format */

import { NextResponse } from "next/server";
import pkg from "@/../package.json";

export async function GET() {
  try {
    const version = process.env.npm_package_version ?? pkg.version;
    const commit = process.env.VERCEL_GIT_COMMIT_SHA
      ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
      : "local";
    const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? "unknown";
    const environment =
      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";

    return NextResponse.json({
      version,
      commit,
      buildTime,
      environment,
    });
  } catch (error) {
    console.error("Error reading application version:", error);
    return NextResponse.json(
      { error: "Failed to read version" },
      { status: 500 }
    );
  }
}
