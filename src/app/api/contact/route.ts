import { NextResponse } from "next/server";
import { getAcademyContact } from "@/lib/services/contact";

export async function GET() {
  const contact = await getAcademyContact();
  return NextResponse.json(
    { data: contact },
    {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    }
  );
}
