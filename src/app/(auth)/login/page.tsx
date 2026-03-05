import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/shared/login-form";

export const metadata: Metadata = { title: "Sign in — Planora" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { callbackUrl, error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-violet-950/20 dark:to-indigo-950/20 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-2xl group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
              <span className="text-white font-black">P</span>
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-background" />
            </div>
            <span className="gradient-heading tracking-tight">Planora</span>
          </Link>
        </div>

        {/* Sign in / Sign up tabs */}
        <div className="flex rounded-xl border bg-muted/50 p-1 mb-6">
          <Link
            href="/login"
            className="flex-1 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-semibold text-center shadow-sm"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="flex-1 rounded-lg py-2.5 text-sm font-medium text-center text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign up
          </Link>
        </div>

        <div className="rounded-2xl border bg-card shadow-lg p-8">
          <LoginForm callbackUrl={callbackUrl} serverError={error} />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:underline"
            >
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
