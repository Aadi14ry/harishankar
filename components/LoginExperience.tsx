"use client";

import Image from "next/image";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginExperience() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });

      if (result?.error) {
        setMessage("Email or password is incorrect.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setMessage("Unable to sign in. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f6f4] text-[#30303e] lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative isolate h-[38vh] min-h-[280px] max-h-[420px] overflow-hidden bg-[#30303e] lg:h-screen lg:max-h-none">
        <Image
          src="/pp.png"
          alt="Harishankar Chaudhary"
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 54vw"
          className="-z-20 object-cover object-[center_20%]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#191922]/35" />
        <div className="absolute left-7 top-7 flex items-center gap-3 sm:left-10 sm:top-10">
          <span className="flex h-10 w-10 items-center justify-center border border-white/50 text-sm font-black text-white">
            HC
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-white">
            Personal portal
          </span>
        </div>
        <div className="absolute bottom-8 left-7 right-7 text-white sm:bottom-12 sm:left-10 sm:right-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ffb0a6]">
            Welcome
          </p>
          <h1 className="max-w-xl text-3xl font-light leading-tight sm:text-4xl lg:text-5xl">
            Harishankar
            <br />
            <span className="font-extrabold">Chaudhary</span>
          </h1>
          <div className="mt-5 h-[3px] w-14 bg-[#ff9589]" />
        </div>
      </section>

      <section className="flex min-h-[62vh] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-screen lg:px-12 xl:px-20">
        <div className="w-full max-w-[420px]">
          <div className="mb-10">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#db7169]">
              Member access
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#74747e]">
              Sign in with your email and password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-[#30303e]"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#888892]"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="name@example.com"
                  required
                  className="h-12 w-full rounded-md border border-[#dedde0] bg-white pl-11 pr-4 text-sm text-[#30303e] outline-none transition placeholder:text-[#a3a2aa] focus:border-[#db7169] focus:ring-2 focus:ring-[#ff9589]/25"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-[#30303e]"
              >
                Password
              </label>
              <div className="relative">
                <LockKeyhole
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#888892]"
                />
                <input
                  id="password"
                  name="password"
                  type={passwordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  className="h-12 w-full rounded-md border border-[#dedde0] bg-white pl-11 pr-12 text-sm text-[#30303e] outline-none transition placeholder:text-[#a3a2aa] focus:border-[#db7169] focus:ring-2 focus:ring-[#ff9589]/25"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[#74747e] transition hover:bg-[#f2f0ef] hover:text-[#30303e] focus:outline-none focus:ring-2 focus:ring-[#ff9589]"
                >
                  {passwordVisible ? (
                    <EyeOff aria-hidden="true" className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye aria-hidden="true" className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() =>
                  setMessage("Please contact the site administrator to reset your password.")
                }
                className="text-sm font-semibold text-[#bd5e57] underline-offset-4 transition hover:underline focus:outline-none focus:ring-2 focus:ring-[#ff9589]"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#30303e] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(48,48,62,0.16)] transition hover:bg-[#252532] focus:outline-none focus:ring-2 focus:ring-[#ff9589] focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
              {!isSubmitting && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
            </button>

            {message && (
              <p
                role="status"
                className="border-l-2 border-[#db7169] bg-white px-4 py-3 text-sm leading-5 text-[#555560]"
              >
                {message}
              </p>
            )}
          </form>

          <p className="mt-10 border-t border-[#e5e3e2] pt-5 text-xs text-[#888892]">
            © {new Date().getFullYear()} Harishankar Chaudhary
          </p>
        </div>
      </section>
    </main>
  );
}