const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const target = url.searchParams.get("url");
    if (!target) {
      return new Response("missing url", { status: 400, headers: corsHeaders });
    }

    // Whitelist apenas CDNs do Instagram para evitar SSRF
    const allowed = /(cdninstagram\.com|fbcdn\.net)/i;
    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return new Response("invalid url", { status: 400, headers: corsHeaders });
    }
    if (!allowed.test(parsed.hostname)) {
      return new Response("host not allowed", { status: 403, headers: corsHeaders });
    }

    const upstream = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Referer: "https://www.instagram.com/",
      },
    });

    if (!upstream.ok) {
      return new Response("upstream error", { status: upstream.status, headers: corsHeaders });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const buf = await upstream.arrayBuffer();

    return new Response(buf, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "error", { status: 500, headers: corsHeaders });
  }
});