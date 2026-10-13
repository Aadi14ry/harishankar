"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center gap-2 rounded-md border border-[#dedde0] bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#30303e] transition hover:border-[#ff9589] hover:bg-[#fff9f8] focus:outline-none focus:ring-2 focus:ring-[#ff9589]"
    >
      <LogOut aria-hidden="true" className="h-4 w-4" />
      Sign out
    </button>
  );
}