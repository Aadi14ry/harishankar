import { NextResponse } from "next/server";
import {
  getCloudinaryClient,
  getDocumentOwner,
  isMissingDocumentSchema,
} from "@/lib/document-services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const documentIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
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
      SELECT cloudinary_public_id, cloudinary_resource_type
      FROM user_documents
      WHERE id = ${id} AND user_id = ${owner.id}
      LIMIT 1
    `) as unknown as Array<{
      cloudinary_public_id: string;
      cloudinary_resource_type: "image" | "raw";
    }>;
    const record = records[0];
    if (!record) return NextResponse.json({ error: "Document not found." }, { status: 404 });

    const cloud = getCloudinaryClient();
    const result = await cloud.uploader.destroy(record.cloudinary_public_id, {
      resource_type: record.cloudinary_resource_type,
      type: "authenticated",
      invalidate: true,
    });
    if (result.result !== "ok" && result.result !== "not found") {
      return NextResponse.json(
        { error: "Cloudinary could not delete the document. Please try again." },
        { status: 502 },
      );
    }

    await owner.sql`
      DELETE FROM user_documents
      WHERE id = ${id} AND user_id = ${owner.id}
    `;

    return new Response(null, { status: 204 });
  } catch (error) {
    const message = isMissingDocumentSchema(error)
      ? "Document storage is not set up. Run database.sql and user.sql in Neon."
      : "The document could not be deleted. Check the database and Cloudinary configuration.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}