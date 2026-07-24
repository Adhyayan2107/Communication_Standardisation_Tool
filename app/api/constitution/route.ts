import { NextResponse } from "next/server";
import { CONSTITUTION } from "@/lib/constitution";

// Serves the SSOT itself so the download link never drifts from a copy.
export function GET() {
  return NextResponse.json(CONSTITUTION, {
    headers: {
      "Content-Disposition": 'attachment; filename="brand_constitution.json"',
    },
  });
}
