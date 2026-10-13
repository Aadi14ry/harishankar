import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getCloudinaryClient,
  getDocumentMimeType,
  getDocumentOwner,
  isMissingDocumentSchema,
  maxDocumentSize,
} from "@/lib/document-services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schemaSetupMessage = "Document storage is not set up. Run database.sql and user.sql in Neon.";

export async function GET() {
  try {
    const owner = await getDocumentOwner();
    if (!owner) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const documents = await owner.sql`
      SELECT
        id::text AS id,
        file_name AS name,
        mime_type AS "mimeType",
        file_size_bytes::text AS "fileSizeBytes",
        created_at::text AS "createdAt"
      FROM user_documents
      WHERE user_id = ${owner.id}
      ORDER BY created_at DESC
      LIMIT 200
    `;

    return NextResponse.json({ documents });
  } catch (error) {
    const message = isMissingDocumentSchema(error)
      ? schemaSetupMessage
      : "Documents could not be loaded. Check the database configuration.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let uploadedAsset: {
    publicId: string;
    resourceType: "image" | "raw";
  } | null = null;

  try {
    const owner = await getDocumentOwner();
    if (!owner) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    }
    if (file.size === 0 || file.size > maxDocumentSize) {
      return NextResponse.json({ error: "Files must be smaller than 10 MB." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = getDocumentMimeType(buffer);
    if (!mimeType) {
      return NextResponse.json(
        { error: "Supported file types are PDF, JPEG, PNG, GIF, and WebP." },
        { status: 415 },
      );
    }

    const cloud = getCloudinaryClient();
    const resourceType = mimeType === "application/pdf" ? "raw" : "image";
    const publicId = `${owner.id}/${randomUUID()}`;
    const uploadResult = await new Promise<{
      public_id: string;
      resource_type: "image" | "raw";
      format: string;
      bytes: number;
    }>((resolve, reject) => {
      const stream = cloud.uploader.upload_stream(
        {
          folder: "harishankar-private-documents",
          public_id: publicId,
          resource_type: resourceType,
          type: "authenticated",
          access_mode: "authenticated",
          overwrite: false,
          unique_filename: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary did not return an upload result."));
            return;
          }
          resolve({
            public_id: result.public_id,
            resource_type: result.resource_type as "image" | "raw",
            format: result.format,
            bytes: result.bytes,
          });
        },
      );
      stream.end(buffer);
    });
    uploadedAsset = {
      publicId: uploadResult.public_id,
      resourceType: uploadResult.resource_type,
    };

    const safeName = file.name
      .replace(/\\/g, "/")
      .split("/")
      .pop()
      ?.replace(/[\u0000-\u001f\u007f]/g, "")
      .slice(0, 255) || "document";

    const documents = (await owner.sql`
      INSERT INTO user_documents (
        user_id,
        cloudinary_public_id,
        cloudinary_resource_type,
        cloudinary_format,
        file_name,
        mime_type,
        file_size_bytes
      )
      VALUES (
        ${owner.id},
        ${uploadResult.public_id},
        ${uploadResult.resource_type},
        ${uploadResult.format},
        ${safeName},
        ${mimeType},
        ${uploadResult.bytes}
      )
      RETURNING
        id::text AS id,
        file_name AS name,
        mime_type AS "mimeType",
        file_size_bytes::text AS "fileSizeBytes",
        created_at::text AS "createdAt"
      `) as unknown as Array<Record<string, string>>;

    uploadedAsset = null;
    return NextResponse.json({ document: documents[0] }, { status: 201 });
  } catch (error) {
    if (uploadedAsset) {
      try {
        await getCloudinaryClient().uploader.destroy(uploadedAsset.publicId, {
          resource_type: uploadedAsset.resourceType,
          type: "authenticated",
        });
      } catch {
        // Keep the API response generic; never expose Cloudinary credentials or URLs.
      }
    }

    const message = isMissingDocumentSchema(error)
      ? schemaSetupMessage
      : "The document could not be saved. Check Neon and Cloudinary configuration.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}