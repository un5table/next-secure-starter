import Link from "next/link";
import { ShieldCheck, KeyRound, Gauge, ScrollText } from "lucide-react";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: KeyRound,
    title: "Auth.js v5",
    body: "OAuth + email/password (argon2id), JWT sessions, role-based access, invite & reset flows.",
  },
  {
    icon: ShieldCheck,
    title: "Security spine",
    body: "CSP with per-request nonce, security headers, ownership tokens, and authz in handlers.",
  },
  {
    icon: Gauge,
    title: "Rate limiting",
    body: "Upstash sliding-window limits on every guest-facing write, keyed by IP and email.",
  },
  {
    icon: ScrollText,
    title: "Audit logging",
    body: "Fire-and-forget AuditLog for CSP violations, rate-limit hits, and auth events.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {site.name}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{site.description}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button render={<Link href="/sign-in" />}>Get started</Button>
          <Button
            variant="outline"
            render={
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            View the docs
          </Button>
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="size-5 text-muted-foreground" aria-hidden />
              <CardTitle className="mt-2">{title}</CardTitle>
              <CardDescription>{body}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </section>
    </div>
  );
}
