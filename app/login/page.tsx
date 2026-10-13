import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import LoginExperience from "@/components/LoginExperience";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign In | Harishankar Chaudhary",
  description: "Sign in to the Harishankar Chaudhary portal.",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  return <LoginExperience />;
}