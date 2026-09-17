import { NextRequest, NextResponse } from "next/server";
import { getCredibilityAssessment } from "@/lib/api";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const articleId = parseInt(id, 10);
    if (isNaN(articleId)) {
      return NextResponse.json({ error: "Invalid article ID" }, { status: 400 });
    }

    const assessment = await getCredibilityAssessment(articleId);
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error("Error fetching credibility assessment API route:", error);
    return NextResponse.json(
      { error: "Internal server error fetching assessment" },
      { status: 500 }
    );
  }
}
