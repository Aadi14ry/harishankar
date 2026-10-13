import "server-only";

import { neon } from "@neondatabase/serverless";
import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const maxDocumentSize = 10 * 1024 * 1024;
type DocumentSql = ReturnType<typeof neon>;

let databaseClient: DocumentSql | undefined;
let cloudinaryConfigured = false;

export function getDocumentSql(): DocumentSql {
  if (!databaseClient) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not configured.");
    databaseClient = neon(connectionString);
  }
  return databaseClient;
}

export function getCloudinaryClient() {
  if (!cloudinaryConfigured) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary server credentials are not configured.");
    }
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    cloudinaryConfigured = true;
  }
  return cloudinary;
}

export async function getDocumentOwner() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;

  const sql = getDocumentSql();
  const users = (await sql`
    SELECT id::text AS id, email
    FROM app_users
    WHERE lower(email) = ${email} AND is_active = TRUE
    LIMIT 1
  `) as unknown as Array<{ id: string; email: string }>;
  const user = users[0];
  if (!user) return null;

  return { id: String(user.id), email: String(user.email), sql };
}

export function isMissingDocumentSchema(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "42P01"
  );
}

export function getDocumentMimeType(buffer: Buffer): string | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))
  ) {
    return "image/gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export { maxDocumentSize };