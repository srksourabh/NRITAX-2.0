import { CirclePlay, Mail, MessageCircle, Network } from "lucide-react";

export function Footer() {
  return (
    <footer id="contact" className="bg-brand-navy px-6 py-8 text-white sm:py-10 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-6 border-b border-white/10 pb-6 md:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
          <div>
            <p className="font-heading text-card text-white">NRITAX 2.0</p>
            <p className="mt-2 max-w-sm text-caption text-white/68">
              Premium NRI income tax filing built for clarity, security, CA review, and future official filing integrations.
            </p>
          </div>

          <FooterColumn
            title="Platform"
            links={[
              ["Product", "#features"],
              ["Workflow", "#how-it-works"],
              ["Security", "#trust"],
              ["Onboarding", "#onboarding"]
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              ["Privacy", "#trust"],
              ["Terms", "#faq"],
              ["Compliance", "#trust"],
              ["Contact", "#contact"]
            ]}
          />
          <div>
            <p className="text-caption uppercase tracking-wide text-white/50">Contact</p>
            <a href="mailto:hello@nritax.com" className="mt-3 flex items-center gap-2 text-body text-white/72 hover:text-white">
              <Mail className="size-4" strokeWidth={1.8} aria-hidden="true" />
              <span>hello@nritax.com</span>
            </a>
            <div className="mt-4 flex gap-3" aria-label="Social links">
              <SocialLink label="X" icon={MessageCircle} />
              <SocialLink label="LinkedIn" icon={Network} />
              <SocialLink label="YouTube" icon={CirclePlay} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-5 text-caption text-white/56 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 NRITAX 2.0. All rights reserved.</p>
          <p>Built for NRIs, founders, investors, CAs, and enterprise tax teams.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <nav aria-label={title}>
      <p className="text-caption uppercase tracking-wide text-white/50">{title}</p>
      <div className="mt-2 grid gap-1.5">
        {links.map(([label, href]) => (
          <a key={label} href={href} className="text-body text-white/68 hover:text-white">
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function SocialLink({ label, icon: Icon }: { label: string; icon: typeof MessageCircle }) {
  return (
    <a
      href="#contact"
      aria-label={label}
      className="grid size-10 place-items-center rounded-lg border border-white/15 bg-white/[0.06] text-caption font-semibold text-white/72 hover:bg-white/10 hover:text-white"
    >
      <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
    </a>
  );
}
