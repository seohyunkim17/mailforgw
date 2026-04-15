import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const ALLOWED_HOSTS = [
  "pbs.twimg.com",
  "abs.twimg.com",
  "images.unsplash.com",
  "i.imgur.com",
];

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src");
  if (!src) {
    return NextResponse.json({ error: "missing src" }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(url.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(url.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 mailforgw-fax-proxy" },
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `upstream ${upstream.status}` },
        { status: 502 }
      );
    }
    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buf = await upstream.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "fetch failed" },
      { status: 500 }
    );
  }
}
