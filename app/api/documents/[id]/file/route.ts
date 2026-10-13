import { NextResponse } from "next/server";
import {
  getCloudinaryClient,
  getDocumentOwner,
  isMissingDocumentSchema,
} from "@/lib/document-services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const documentIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const owner = await getDocumentOwner();
    if (!owner) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const { id } = await context.params;
    if (!documentIdPattern.test(id)) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const records = (await owner.sql`
      SELECT cloudinary_public_id, cloudinary_resource_type, cloudinary_format,
             file_name, mime_type
      FROM user_documents
      WHERE id = ${id} AND user_id = ${owner.id}
      LIMIT 1
    `) as unknown as Array<{
      cloudinary_public_id: string;
      cloudinary_resource_type: "image" | "raw";
      cloudinary_format: string;
      file_name: string;
      mime_type: string;
    }>;
    const document = records[0];
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });

    const shouldDownload = new URL(request.url).searchParams.get("download") === "1";
    const cloud = getCloudinaryClient();
    const signedUrl = cloud.utils.private_download_url(
      document.cloudinary_public_id,
      document.cloudinary_format,
      {
        resource_type: document.cloudinary_resource_type,
        type: "authenticated",
        expires_at: Math.floor(Date.now() / 1000) + 120,
        attachment: shouldDownload,
      },
    );
    const asset = await fetch(signedUrl, { cache: "no-store" });
    if (!asset.ok || !asset.body) {
      return NextResponse.json({ error: "The stored file could not be retrieved." }, { status: 502 });
    }

    const safeName = String(document.file_name).replace(/[\r\n"\\]/g, "_");
    const disposition = shouldDownload ? "attachment" : "inline";
    return new Response(asset.body, {
      headers: {
        "Content-Type": String(document.mime_type),
        "Content-Disposition": `${disposition}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(String(document.file_name))}`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (error) {
    const message = isMissingDocumentSchema(error)
      ? "Document storage is not set up. Run database.sql and user.sql in Neon."
      : "The stored file could not be retrieved. Check the database and Cloudinary configuration.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}