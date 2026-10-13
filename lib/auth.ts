import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

const sql = neon(process.env.DATABASE_URL);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email or username and password",
      credentials: {
        identifier: { label: "Gmail address or username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier?.trim().toLowerCase();
        const password = credentials?.password;

        if (!identifier || !password) return null;

        const users = await sql`
          SELECT id::text AS id, email, password_hash, is_active
          FROM app_users
          WHERE email = ${identifier} OR lower(username) = ${identifier}
          ORDER BY CASE WHEN email = ${identifier} THEN 0 ELSE 1 END
          LIMIT 1
        `;
        const user = users[0];

        if (
          !user ||
          user.is_active !== true ||
          typeof user.password_hash !== "string" ||
          !(await bcrypt.compare(password, user.password_hash))
        ) {
          return null;
        }

        return { id: String(user.id), email: String(user.email) };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  secret: process.env.NEXTAUTH_SECRET,
};