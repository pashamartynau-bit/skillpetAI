import { NextResponse } from "next/server";

import { askGrokGuide, isGuideTurnList } from "@/lib/grok-guide";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages?: unknown };

    if (!isGuideTurnList(body.messages) || body.messages.at(-1)?.role !== "user") {
      return NextResponse.json(
        { error: "Send a short conversation that ends with your question." },
        { status: 400 },
      );
    }

    const reply = await askGrokGuide(body.messages);
    return NextResponse.json(reply);
  } catch (error) {
    console.error("Omni Guide request failed:", error);
    const message = error instanceof Error ? error.message : "Unable to reach Grok.";
    return NextResponse.json(
      { error: message },
      { status: message === "Missing XAI_API_KEY." ? 500 : 502 },
    );
  }
}
