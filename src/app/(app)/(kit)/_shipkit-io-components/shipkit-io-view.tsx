import {
  IconBrandDocker,
  IconBrandOpenai,
  IconBrandVercelFilled,
} from "@tabler/icons-react";
import {
  BrainCircuit,
  Calculator,
  CreditCard,
  Database,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  RefreshCw,
  Shield,
  Timer,
} from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Icon } from "@/components/assets/icon";
import { PricingSectionSingle } from "@/components/blocks/pricing-section-single";
import { JsonLd } from "@/components/primitives/json-ld";
import { Link } from "@/components/primitives/link";
import {
  Section,
  SectionBadge,
  SectionContent,
  SectionCopy,
  SectionHeader,
} from "@/components/primitives/section";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { BlurFade } from "@/components/ui/blur-fade";
import { buttonVariants } from "@/components/ui/button";
import { Meteors } from "@/components/ui/meteors";
import { constructMetadata } from "@/config/metadata";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { singlePlan } from "@/content/pricing/pricing-content";
import { cn } from "@/lib/utils";
import { AiDemoSection } from "@/app/(app)/(kit)/_shipkit-io-components/ai-demo-section";
import { FAQ } from "@/app/(app)/(kit)/_shipkit-io-components/faq";
import { ParticlesHero } from "@/app/(app)/(kit)/_shipkit-io-components/particles-hero";
import PrimaryCta from "@/app/(app)/(kit)/_shipkit-io-components/primary-cta";
import { ROICalculator } from "@/app/(app)/(kit)/_shipkit-io-components/roi-calculator";
import { SocialProof } from "@/app/(app)/(kit)/_shipkit-io-components/social-proof";

const headings = ["Ship your Next.js app this week"];

export const metadata: Metadata = constructMetadata({
  title: `${siteConfig.name} - Launch Your SaaS in Days`,
  description: "The complete Next.js stack with auth, payments, database, CMS, AI, and 100+ components. $249, lifetime updates.",
});

export function ShipkitIoView() {
  return (
    <>
      <JsonLd organization website />
      <div className="flex flex-col gap-16 overflow-hidden">
        <ParticlesHero quantity={50} speed={80}>
          <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl" aria-hidden="true">
            <div
              className="aspect-[1155/678] w-[72.1875rem] animate-galaxy-shimmer bg-gradient-to-tr from-[#ff80b5] via-[#9089fc] to-[#ff80b5] opacity-0"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            />
          </div>
          <div className="flex min-h-[calc(100vh-16rem)] flex-col items-center justify-center mt-header">
            <div className="relative mx-auto flex min-h-64 max-w-[80rem] flex-col items-center justify-center gap-4 px-6 text-center md:px-8">
              <BlurFade delay={1} duration={1}>
                <div className="flex flex-col items-center gap-4">
                  <AnimatedGradientText className="bg-primary-foreground">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Icon className="h-5 w-5" />
                        <hr className="mx-2 h-4 w-px shrink-0 bg-gray-300" />
                        <span className="text-sm font-medium">Introducing Shipkit</span>
                      </div>
                    </div>
                  </AnimatedGradientText>
                </div>
              </BlurFade>

              <BlurFade delay={0.5} duration={0.5}>
                <h1 className="max-w-4xl mx-auto text-balance bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text py-6 text-5xl font-medium leading-none tracking-tighter text-transparent dark:from-white dark:to-white/40 sm:text-6xl md:text-7xl lg:text-8xl">
                  {headings[0]}
                </h1>
              </BlurFade>

              <BlurFade delay={1} duration={1}>
                <div className="mb-8 max-w-2xl text-balance text-lg tracking-tight text-muted-foreground md:text-xl">
                  The production stack you'd build yourself if you had three months.
                  Auth, payments, database, CMS, AI. Already wired.
                </div>
              </BlurFade>

              <BlurFade delay={2.5} duration={1}>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-col-reverse sm:flex-row justify-center flex-wrap gap-4">
                    <PrimaryCta />
                  </div>
                </div>
              </BlurFade>
            </div>

            <Meteors number={2} />
          </div>
        </ParticlesHero>

        <Section className="relative">
          <BlurFade delay={0.5} duration={1} inView>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                  <IconBrandVercelFilled className="h-5 w-5" />
                </div>
                <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                  <IconBrandDocker className="h-5 w-5" />
                </div>
                <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                  <IconBrandOpenai className="h-5 w-5" />
                </div>
              </div>
              <span className="text-sm text-muted-foreground">Built with tools you love</span>
            </div>
          </BlurFade>
          <BlurFade delay={0.5} duration={1} inView>
            <SectionHeader>Everything except your idea</SectionHeader>
          </BlurFade>

          <BlurFade delay={1} duration={1} inView>
            <SectionCopy>
              You don't need to build auth again. Or wire up payments. Or configure a CMS. Or set up email templates. Shipkit handles the first three months of infrastructure work so you can focus on the part that actually matters.
            </SectionCopy>
          </BlurFade>
        </Section>

        {/* What's Included */}
        <Section>
          <SectionContent>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3">
              {[
                { icon: LockKeyhole, label: "Auth", detail: "OAuth, magic link, RBAC" },
                { icon: CreditCard, label: "Payments", detail: "Stripe, Lemon Squeezy, Polar" },
                { icon: Database, label: "Database", detail: "Postgres + Drizzle ORM" },
                { icon: FileText, label: "CMS", detail: "Payload CMS + MDX" },
                { icon: BrainCircuit, label: "AI", detail: "OpenAI, Anthropic, RAG" },
                { icon: LayoutDashboard, label: "100+ Components", detail: "Shadcn/Radix, ready to ship" },
              ].map(({ icon: ItemIcon, label, detail }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/50 bg-muted/50">
                    <ItemIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionContent>
        </Section>

        <Suspense fallback={<SuspenseFallback />}>
          <BlurFade inView>
            <SocialProof />
          </BlurFade>

          <div className="hidden lg:block">
            <BlurFade inView>
              <AiDemoSection />
            </BlurFade>
          </div>

          {/* ROI Calculator */}
          <Section>
            <SectionBadge>
              <Calculator className="h-4 w-4" />
              Time Saved
            </SectionBadge>
            <SectionHeader>How long would this take to build yourself?</SectionHeader>
            <SectionContent>
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <p className="text-lg text-muted-foreground">
                    Auth setup, payment integration, CMS, email system, dashboard UI, AI hooks. That's 2-3 months of plumbing before you write a single line of product code.
                  </p>
                </div>
                <ROICalculator />
              </div>
            </SectionContent>
          </Section>

          <Section>
            <BlurFade inView>
              <SectionHeader>One price. Everything included.</SectionHeader>
            </BlurFade>
            <BlurFade inView>
              <SectionCopy>
                No tiers. No feature gates. $249 for the full stack. Updates forever.
              </SectionCopy>
            </BlurFade>

            <BlurFade inView>
              <PricingSectionSingle plan={singlePlan}>
                <div className="border-border pt-8 text-center text-sm text-muted-foreground">
                  <p>
                    Prefer to build it yourself?{" "}
                    <Link
                      href={routes.external.bones}
                      className={cn(buttonVariants({ variant: "link" }), "px-1")}
                    >
                      Shipkit Bones is always free
                    </Link>
                  </p>
                </div>
              </PricingSectionSingle>
            </BlurFade>

            <BlurFade inView>
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Everything included: Next.js 15, TypeScript, Authentication, Database, UI
                  Components, and more
                </p>
                <div className="flex items-center justify-center gap-8">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-green-500" />
                    <span className="text-sm">30-Day Refund</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Instant Access</span>
                  </div>
                </div>
              </div>
            </BlurFade>
          </Section>

          <Section className="max-w-3xl">
            <BlurFade inView>
              <SectionBadge>FAQ</SectionBadge>
              <SectionHeader>Common Questions</SectionHeader>
              <SectionCopy>
                Can't find what you're looking for? Reach out on
                <Link
                  className={cn(buttonVariants({ variant: "link", size: "lg" }), "px-1")}
                  href={routes.external.email}
                >
                  email
                </Link>
                <Link
                  className={cn(buttonVariants({ variant: "link", size: "lg" }), "px-1")}
                  href={routes.external.x_follow}
                >
                  or X
                </Link>
              </SectionCopy>
              <SectionContent>
                <FAQ />
              </SectionContent>
              <SectionCopy className="text-sm text-muted-foreground">
                Have a special requirement?{" "}
                <Link
                  href={routes.external.email}
                  className={cn(buttonVariants({ variant: "link", size: "sm" }), "px-1")}
                >
                  Let's chat
                </Link>
              </SectionCopy>
            </BlurFade>
          </Section>
        </Suspense>
      </div>
    </>
  );
}
