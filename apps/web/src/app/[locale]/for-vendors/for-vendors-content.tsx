"use client";

import { Link } from "../../../i18n/navigation";
import { RATES_TO_LKR, usePreferenceStore } from "@ceylonweddings/web";
import { Button } from "@ceylonweddings/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@ceylonweddings/ui/components/card";
import { CheckCircle2, MessageSquare, BadgeCheck, Star, Users, Store, ArrowRight, Wallet } from "lucide-react";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { Pricing } from "@ceylonweddings/ui/domain/pricing";
import { Reveal, Stagger, StaggerItem } from "@ceylonweddings/ui/domain/motion";

const stats = [
  { icon: Users, value: "1,200+", label: "Couples" },
  { icon: Store, value: "250+", label: "Vendors" },
  { icon: Star, value: "4.9★", label: "Average rating" },
  { icon: CheckCircle2, value: "Free", label: "To list" },
];

const categories = [
  "Venues", "Photo & Video", "Poruwa specialists", "Bridal wear",
  "Florist & decor", "Catering", "Cake", "Wedding cars",
  "Hair & makeup", "Entertainment", "Mehndi", "Astrology/Nekath",
  "Invitations", "Planners",
];

export function ForVendorsContent() {
  const currency = usePreferenceStore((state) => state.currency);
  const rate = RATES_TO_LKR[currency] ?? 1;

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="mx-auto max-w-6xl px-6 relative z-10 text-center">
          <Reveal y={20}>
            <span className="mb-6 inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary">
              Vendor Partners
            </span>
          </Reveal>
          <Reveal delay={0.1} y={20}>
            <h1 className="font-serif text-5xl tracking-tight lg:text-7xl mb-6 max-w-4xl mx-auto">
              Reach couples planning their <span className="text-primary italic">Sri Lankan</span> wedding
            </h1>
          </Reveal>
          <Reveal delay={0.2} y={20}>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join the fastest-growing platform for Sri Lankan weddings. Free listing, zero commissions, and direct WhatsApp inquiries from high-intent couples.
            </p>
          </Reveal>
          <Reveal delay={0.3} y={20}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" shape="pill" className="h-14 px-8 text-base">
                <Link href="/register?role=VENDOR">List your business for free</Link>
              </Button>
              <Button asChild size="lg" shape="pill" variant="ghost" className="h-14 px-8 text-base">
                <Link href="#pricing">See pricing</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-12 border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50">
            {stats.map((stat, i) => (
              <StaggerItem key={i} className="flex flex-col items-center justify-center text-center px-4 first:pl-0 last:pr-0 border-l-0 first:border-none">
                <div className="mb-3 text-primary/80 bg-primary/10 p-3 rounded-full">
                  <Icon icon={stat.icon} size="md" animateOnView />
                </div>
                <div className="text-3xl font-serif font-medium mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="text-center mb-16">
            <h2 className="font-serif text-4xl mb-4">Why list with Ceylon Weddings?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">We built our platform to solve the biggest pain points for local vendors.</p>
          </Reveal>

          <Stagger className="grid md:grid-cols-3 gap-8">
            <StaggerItem>
              <Card className="h-full rounded-3xl shadow-sm hover:shadow-md transition-shadow border-primary/10">
                <CardHeader>
                  <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
                    <Icon icon={Wallet} size="lg" animateOnView />
                  </div>
                  <CardTitle className="text-2xl font-serif">Free listing forever</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-base">
                  No subscription fees, no booking commissions, and no hidden charges. Create your profile, upload your portfolio, and start receiving leads instantly.
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="h-full rounded-3xl shadow-sm hover:shadow-md transition-shadow border-primary/10">
                <CardHeader>
                  <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
                    <Icon icon={MessageSquare} size="lg" animateOnView />
                  </div>
                  <CardTitle className="text-2xl font-serif">WhatsApp-native leads</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-base">
                  Couples message you directly on WhatsApp through your listing. We don&apos;t get in the middle of your conversations or hide contact details.
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="h-full rounded-3xl shadow-sm hover:shadow-md transition-shadow border-primary/10">
                <CardHeader>
                  <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
                    <Icon icon={BadgeCheck} size="lg" animateOnView />
                  </div>
                  <CardTitle className="text-2xl font-serif">Verified badge</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-base">
                  Build trust instantly. Complete our verification process to get a green verified tick, making your profile stand out to high-intent couples.
                </CardContent>
              </Card>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      <section id="pricing" className="overflow-visible py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Pricing
            currency={currency}
            defaultAnnual
            annualSavingsLabel="Save 25%"
            title="Vendor membership"
            description={"List for free, then upgrade when you want ranking, galleries, and analytics.\nAnnual billing saves 25% on Pro."}
            linkAs={Link}
            plans={[
              {
                name: "Standard Partner",
                price: 0,
                yearlyPrice: 0,
                period: "first 3 months",
                priceLabel: "Free",
                features: [
                  "Standard directory listing",
                  "Up to 3 portfolio photos",
                  "WhatsApp inquiries from couples",
                  "No booking commissions",
                ],
                description: "Basic listing for emerging professionals starting their wedding portfolio.",
                buttonText: "List your business",
                href: "/register?role=VENDOR",
                isPopular: false,
              },
              {
                name: "Ceylon Weddings Pro",
                price: 4900 / rate,
                yearlyPrice: 45000 / 12 / rate,
                period: "month",
                features: [
                  "Direct WhatsApp couple inquiries with verified lead alerts",
                  "High-resolution media projects, galleries, and showcase videos",
                  "Ranking priority in district and category search",
                  "Reviews, analytics, and featured candidate queues",
                ],
                description: "Full visibility across Sri Lanka and diaspora couples planning weddings.",
                buttonText: "Get Pro",
                href: "/pro/billing",
                isPopular: true,
              },
              {
                name: "Spotlight",
                price: 0,
                yearlyPrice: 0,
                period: "campaign",
                priceLabel: "Custom",
                features: [
                  "Catalog top and home pick placements",
                  "District and category targeting",
                  "Creative studio with completeness checklist",
                  "Pay only when you want extra visibility",
                ],
                description: "Boost a campaign on top of Pro when you have dates to fill.",
                buttonText: "Create a campaign",
                href: "/pro/promote",
                isPopular: false,
              },
            ]}
          />
        </div>
      </section>

      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-16">
            <h2 className="font-serif text-4xl mb-4">How it works</h2>
            <p className="text-muted-foreground max-w-2xl">Start getting inquiries in three simple steps.</p>
          </Reveal>

          <Stagger className="space-y-12">
            {[
              { num: "01", title: "Create your listing", desc: "Sign up as a vendor, add your business details, and upload your best work. Showcase your services, pricing, and availability." },
              { num: "02", title: "Get discovered by couples", desc: "Couples browsing for vendors in your category and location will see your profile. We match you with couples looking for your exact services." },
              { num: "03", title: "Connect on WhatsApp", desc: "Interested couples click the 'Message' button to chat with you directly on WhatsApp. Close the booking on your own terms." },
            ].map((step, i) => (
              <StaggerItem key={i} className="flex gap-8 items-start group">
                <div className="font-serif text-6xl text-primary/30 group-hover:text-primary transition-colors leading-none pt-1">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-serif text-2xl mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-lg">{step.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-12">
            <h2 className="font-serif text-3xl mb-4">Categories we cover</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat, i) => (
                <div key={i} className="px-5 py-3 rounded-full border bg-card text-card-foreground shadow-sm hover:border-primary/50 transition-colors cursor-default">
                  {cat}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-24 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <QuoteIcon className="h-12 w-12 mx-auto mb-8 opacity-50" />
            <blockquote className="font-serif text-3xl md:text-5xl leading-tight mb-8">
              &ldquo;Ceylon Weddings connected us with the right couples. We get WhatsApp inquiries within hours of updating our listing.&rdquo;
            </blockquote>
            <cite className="not-italic flex items-center justify-center gap-3 text-lg">
              <span className="font-medium">Amara Studios</span>
              <span className="opacity-70 text-sm border-l border-primary-foreground/30 pl-3">Colombo</span>
            </cite>
          </Reveal>
        </div>
      </section>

      <section className="py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal y={20}>
            <h2 className="font-serif text-5xl mb-6">Ready to list your business?</h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join 250+ other premium Sri Lankan wedding vendors already getting leads on Ceylon Weddings.
            </p>
            <Button asChild size="lg" shape="pill" className="h-14 px-10 text-lg group">
              <Link href="/register?role=VENDOR">
                Create free account <Icon icon={ArrowRight} size="md" className="ml-2" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function QuoteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  );
}
