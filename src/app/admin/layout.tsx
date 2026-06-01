import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";

// Page-level access guard for the whole /admin segment. Authorization lives in the
// server layer (not the proxy) — see AGENTS.md.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");
  if (session.user.role !== "ADMIN") redirect("/");

  return <div className="mx-auto max-w-4xl px-4 py-10">{children}</div>;
}
