import { getSession } from "../../../../../lib/accounts/session.mjs";
import { readArtifact } from "../../../../../lib/accounts/gated.mjs";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

// Gated download for /school/forensics/assets/<file>. Requires an account.
export async function GET(_request, { params }) {
  const { file } = await params;
  const relPath = `school/forensics/assets/${file}`;

  const session = await getSession();
  if (!session) {
    return new Response(null, {
      status: 302,
      headers: {
        location: `/?signup=1&next=${encodeURIComponent("/" + relPath)}`,
      },
    });
  }

  const artifact = readArtifact(relPath);
  if (!artifact) return new Response("Not found", { status: 404 });

  return new Response(artifact.body, {
    headers: {
      "content-type": artifact.contentType,
      "content-disposition": `attachment; filename="${artifact.filename}"`,
      "cache-control": "private, no-store",
    },
  });
}
