const YINK = "https://data.yinkglobal.com";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Proxy: /yink/* -> data.yinkglobal.com/*
    if (url.pathname === "/yink" || url.pathname.startsWith("/yink/")) {
      const tail = url.pathname === "/yink" ? "/" : url.pathname.slice(5);
      const targetUrl = YINK + tail + url.search;
      try {
        const upstream = await fetch(targetUrl, {
          method: request.method,
          headers: {
            "User-Agent": "Mozilla/5.0 Prowrap-Worker-Proxy/1.0",
            "Accept": request.headers.get("Accept") || "*/*",
            "Accept-Language": request.headers.get("Accept-Language") || "en-US,en;q=0.9",
          },
          cf: { cacheTtl: 60 },
        });
        const ctype = upstream.headers.get("Content-Type") || "application/octet-stream";
        // Rewrite YINK URLs w textowych odpowiedziach na nasz proxy
        if (/text\/html|application\/javascript|text\/javascript|application\/json|text\/css/.test(ctype)) {
          let text = await upstream.text();
          text = text.replaceAll("https://data.yinkglobal.com", "/yink");
          text = text.replaceAll("http://data.yinkglobal.com", "/yink");
          text = text.replaceAll("//data.yinkglobal.com", "/yink");
          return new Response(text, {
            status: upstream.status,
            headers: {
              "Content-Type": ctype,
              "Cache-Control": "no-cache",
              "X-Proxied-By": "prowrap-yink-worker",
            },
          });
        }
        // binary - pass through
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": ctype,
            "Cache-Control": "public, max-age=300",
            "X-Proxied-By": "prowrap-yink-worker",
          },
        });
      } catch (e) {
        return new Response(
          `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">
          <h1>YINK proxy chwilowo niedostepne</h1>
          <p>Blad: ${e.message}</p>
          <p>YINK aktualizuje swoj certyfikat SSL. Sprobuj ponownie za chwile.</p>
          <p><a href="/">&larr; Powrot do strony</a></p>
          </body></html>`,
          { status: 502, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }
    }

    // Wszystko inne -> static assets
    return env.ASSETS.fetch(request);
  },
};