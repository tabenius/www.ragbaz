export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers || {}) },
  });
}

export function clientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0"
  );
}

export function htmlPage(title, body) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title} — ragbaz</title>
<link rel="icon" href="/assets/logo-mark.svg"/>
<link rel="stylesheet" href="/colors_and_type.css?v=2"/>
<style>
  body{margin:0;background:var(--bg-0,#0a0908);color:var(--fg-2,#d8c29d);
    font-family:"Noto Sans",system-ui,sans-serif;min-height:100vh;display:flex;
    align-items:center;justify-content:center;padding:1.5rem;}
  .card{width:100%;max-width:420px;border:1px solid var(--border-2,#2a2a2a);
    border-radius:10px;background:var(--bg-2,#121212);padding:1.6rem 1.6rem 1.8rem;}
  h1{font-family:"Intel One Mono",monospace;font-size:1.05rem;color:var(--fg-1,#f6d7a7);
    margin:0 0 .3rem;letter-spacing:.02em;}
  h1::before{content:"// ";color:var(--orange-1,#f3c46c);}
  p{font-size:.92rem;line-height:1.6;color:var(--fg-3,#d4c19a);}
  label{display:block;font-family:"Intel One Mono",monospace;font-size:.74rem;
    text-transform:uppercase;letter-spacing:.06em;color:var(--fg-4,#9f9f9f);margin:1rem 0 .3rem;}
  input{width:100%;box-sizing:border-box;padding:.6rem .7rem;border-radius:8px;
    border:1px solid var(--border-3,#2d2d2d);background:var(--bg-4,#181818);
    color:var(--fg-1,#f6d7a7);font-size:.95rem;font-family:inherit;}
  button{margin-top:1.2rem;width:100%;font-family:"Intel One Mono",monospace;font-size:.9rem;
    border-radius:8px;padding:.65rem 1rem;border:1px solid var(--orange-3,#ff9900);
    background:var(--orange-3,#ff9900);color:var(--fg-on-warm,#1a1208);font-weight:600;cursor:pointer;}
  button:hover{background:var(--orange-1,#f3c46c);border-color:var(--orange-1,#f3c46c);}
  a{color:var(--orange-1,#f3c46c);}
  .msg{margin-top:.8rem;font-size:.85rem;}
  .err{color:var(--red-1,#fb4934);}
  .ok{color:var(--green-1,#b8bb26);}
</style></head><body><div class="card">${body}</div></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
