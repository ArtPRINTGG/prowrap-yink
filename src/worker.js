const YINK = "https://data.yinkglobal.com";
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/ppf" || url.pathname === "/ppf/") {
      return env.ASSETS.fetch(new Request(new URL("/ppf.html", url), request));
    }
    if (url.pathname === "/yink" || url.pathname.startsWith("/yink/")) {
      const tail = url.pathname === "/yink" ? "/" : url.pathname.slice(5);
      const targetUrl = YINK + tail + url.search;
      try {
        const upstream = await fetch(targetUrl, {
          method: request.method,
          headers: { "User-Agent": "Mozilla/5.0 Prowrap-Worker/1.0", "Accept": request.headers.get("Accept") || "*/*" },
          cf: { cacheTtl: 60 },
        });
        if (upstream.status >= 500) throw new Error("Upstream " + upstream.status);
        const ctype = upstream.headers.get("Content-Type") || "application/octet-stream";
        if (/text\/html|application\/javascript|text\/javascript|application\/json|text\/css/.test(ctype)) {
          let text = await upstream.text();
          text = text.replaceAll("https://data.yinkglobal.com", "/yink");
          text = text.replaceAll("http://data.yinkglobal.com", "/yink");
          return new Response(text, { status: upstream.status, headers: { "Content-Type": ctype } });
        }
        return new Response(upstream.body, { status: upstream.status, headers: { "Content-Type": ctype } });
      } catch (e) {
        return Response.redirect(new URL("/ppf", url).href, 302);
      }
    }
    return env.ASSETS.fetch(request);
  },
};