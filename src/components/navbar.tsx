import Link from "next/link";
import { auth, signOut } from "@/auth";
import { site } from "@/lib/site";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          {site.name}
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session?.user ? (
            <>
              {session.user.role === "ADMIN" && (
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/admin/security" />}
                >
                  Admin
                </Button>
              )}
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {session.user.name ?? session.user.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Button size="sm" render={<Link href="/sign-in" />}>
              Sign in
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
