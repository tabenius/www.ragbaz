import { htmlPage } from "../../../lib/accounts/http.mjs";
import { peekToken, confirmSubscriber } from "../../../lib/accounts/store.mjs";

export const dynamic = "force-dynamic";

// Landing for a confirmation link. Peeks (does not consume) the token so the
// set-password POST can consume it. Marks the newsletter subscription confirmed
// immediately; account creation happens when the user sets a password.
export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";

  const valid =
    (await peekToken(token, "confirm_subscribe")) ||
    (await peekToken(token, "confirm_account"));

  if (!valid) {
    return htmlPage(
      "confirm",
      `<h1>link expired</h1><p class="msg err">This confirmation link is invalid or has expired. Try subscribing again from the homepage.</p><p><a href="/">↩ ragbaz.cc</a></p>`,
    );
  }

  await confirmSubscriber(valid.email).catch(() => {});

  const safeToken = token.replace(/[^A-Za-z0-9_-]/g, "");
  return htmlPage(
    "confirm",
    `<h1>email confirmed</h1>
<p>Thanks — <strong style="color:var(--fg-1,#f6d7a7)">${escapeHtml(valid.email)}</strong> is confirmed for ragbaz updates.</p>
<p>Want an account too? Set a password to be able to download ${"`"}/school${"`"} artifacts. Optional — you can close this page and stay on the newsletter only.</p>
<form id="pwform">
  <input type="hidden" id="token" value="${safeToken}"/>
  <label for="pw">set a password</label>
  <input type="password" id="pw" minlength="8" placeholder="at least 8 characters" autocomplete="new-password"/>
  <button type="submit">create account</button>
</form>
<p id="msg" class="msg"></p>
<script>
  const f=document.getElementById('pwform'),m=document.getElementById('msg');
  f.addEventListener('submit',async(e)=>{e.preventDefault();
    const password=document.getElementById('pw').value;
    m.textContent='';m.className='msg';
    if(password.length<8){m.textContent='password must be at least 8 characters';m.className='msg err';return;}
    const r=await fetch('/api/account/set-password',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({token:document.getElementById('token').value,password})});
    const d=await r.json().catch(()=>({}));
    if(r.ok&&d.ok){m.textContent='account created — you are signed in. redirecting…';m.className='msg ok';
      setTimeout(()=>location.href='/',1200);}
    else{m.textContent=d.error||'could not create account';m.className='msg err';}
  });
</script>`,
  );
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
