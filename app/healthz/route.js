export const dynamic = "force-static";

export async function GET() {
  return new Response("ok\n", {
    headers: { "content-type": "text/plain" },
  });
}
