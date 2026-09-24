"use client";

import { Link } from "../../../i18n/navigation";
import { Button } from "@ceylonweddings/ui/components/button";
import { Card } from "@ceylonweddings/ui/components/card";
import { Reveal, Stagger, StaggerItem } from "@ceylonweddings/ui/domain/motion";
import { Icon } from "@ceylonweddings/ui/components/icon";
import {
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  Heart,
  Search,
  Users,
  Settings,
  Smartphone,
  LayoutDashboard,
  Share2,
} from "lucide-react";

export function HowItWorksContent() {
  return (
    <div className="min-h-screen pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 cw-section">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background/20 z-[-1]" />
        
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Reveal>
            <span className="mb-6 inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium tracking-wide text-primary">
              Simple &amp; free
            </span>
          </Reveal>
          
          <Reveal delay={0.1}>
            <h1 className="font-serif text-5xl md:text-7xl font-medium tracking-tight text-foreground mb-6">
              How Ceylon Weddings works
            </h1>
          </Reveal>
          
          <Reveal delay={0.2}>
            <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed mb-10">
              Everything you need to plan a Sri Lankan wedding — or grow your wedding business — in one place.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/register">Start planning</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8 border-border hover:bg-muted">
                <Link href="/register?role=VENDOR">List your business</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* For Couples Section */}
      <section className="mx-auto max-w-6xl px-6 py-16 cw-section">
        <div className="mb-16 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4">For couples</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your end-to-end planning hub, designed specifically for Sri Lankan traditions.
          </p>
        </div>

        <Stagger className="space-y-8">
          {/* Step 1 */}
          <StaggerItem>
            <Card className="shadow-card border-none rounded-3xl overflow-hidden group hover:shadow-card-hover transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/3 bg-muted/30 p-10 flex items-center justify-center border-r border-border/50 h-full">
                  <div className="text-9xl font-serif text-primary/20 group-hover:text-primary/30 transition-colors">01</div>
                </div>
                <div className="md:w-2/3 p-10 md:p-14">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Icon icon={Heart} size="lg" className="text-primary" animateOnView />
                  </div>
                  <h3 className="font-serif text-2xl font-medium mb-4">Create your profile</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Add partner names, city, guest estimate, budget band, and your ceremony types — poruwa, church, nikah, walima, homecoming.
                  </p>
                </div>
              </div>
            </Card>
          </StaggerItem>

          {/* Step 2 */}
          <StaggerItem>
            <Card className="shadow-card border-none rounded-3xl overflow-hidden group hover:shadow-card-hover transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/3 bg-muted/30 p-10 flex items-center justify-center border-r border-border/50 h-full order-1 md:order-2">
                  <div className="text-9xl font-serif text-primary/20 group-hover:text-primary/30 transition-colors">02</div>
                </div>
                <div className="md:w-2/3 p-10 md:p-14 order-2 md:order-1">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Icon icon={Search} size="lg" className="text-primary" animateOnView />
                  </div>
                  <h3 className="font-serif text-2xl font-medium mb-4">Browse the marketplace</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Filter by category, city, district, price, and rating. See verified badges and featured picks.
                  </p>
                </div>
              </div>
            </Card>
          </StaggerItem>

          {/* Step 3 */}
          <StaggerItem>
            <Card className="shadow-card border-none rounded-3xl overflow-hidden group hover:shadow-card-hover transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/3 bg-muted/30 p-10 flex items-center justify-center border-r border-border/50 h-full">
                  <div className="text-9xl font-serif text-primary/20 group-hover:text-primary/30 transition-colors">03</div>
                </div>
                <div className="md:w-2/3 p-10 md:p-14">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Icon icon={MessageCircle} size="lg" className="text-primary" animateOnView />
                  </div>
                  <h3 className="font-serif text-2xl font-medium mb-4">Inquire on WhatsApp</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Hit 'Inquire' on any vendor. We log it and open WhatsApp — the conversation stays where it already lives.
                  </p>
                </div>
              </div>
            </Card>
          </StaggerItem>

          {/* Step 4 */}
          <StaggerItem>
            <Card className="shadow-card border-none rounded-3xl overflow-hidden group hover:shadow-card-hover transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/3 bg-muted/30 p-10 flex items-center justify-center border-r border-border/50 h-full order-1 md:order-2">
                  <div className="text-9xl font-serif text-primary/20 group-hover:text-primary/30 transition-colors">04</div>
                </div>
                <div className="md:w-2/3 p-10 md:p-14 order-2 md:order-1">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Icon icon={Settings} size="lg" className="text-primary" animateOnView />
                  </div>
                  <h3 className="font-serif text-2xl font-medium mb-4">Manage your planning</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Checklist tasks follow Sri Lankan ceremony logic. Budget tracks LKR across bride family, groom family, and couple.
                  </p>
                </div>
              </div>
            </Card>
          </StaggerItem>

          {/* Step 5 */}
          <StaggerItem>
            <Card className="shadow-card border-none rounded-3xl overflow-hidden group hover:shadow-card-hover transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/3 bg-muted/30 p-10 flex items-center justify-center border-r border-border/50 h-full">
                  <div className="text-9xl font-serif text-primary/20 group-hover:text-primary/30 transition-colors">05</div>
                </div>
                <div className="md:w-2/3 p-10 md:p-14">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Icon icon={Share2} size="lg" className="text-primary" animateOnView />
                  </div>
                  <h3 className="font-serif text-2xl font-medium mb-4">Share your wedding website</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    A free public page for guests — RSVP, schedule, story.
                  </p>
                </div>
              </div>
            </Card>
          </StaggerItem>
        </Stagger>
      </section>

      <div className="py-8"></div>

      {/* For Vendors Section */}
      <section className="mx-auto max-w-6xl px-6 py-16 cw-section">
        <div className="mb-16 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4">For vendors</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Showcase your services directly to couples without middlemen or commissions.
          </p>
        </div>

        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StaggerItem>
            <Card className="h-full shadow-card border-none rounded-3xl overflow-hidden group hover:shadow-card-hover transition-all duration-300 p-8 relative">
              <div className="absolute top-0 right-0 p-6 text-6xl font-serif text-primary/10 group-hover:text-primary/20 transition-colors">01</div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-8 relative z-10">
                <Icon icon={LayoutDashboard} size="lg" className="text-primary" animateOnView />
              </div>
              <h3 className="font-serif text-2xl font-medium mb-4 relative z-10">Create a free listing</h3>
              <p className="text-muted-foreground leading-relaxed relative z-10">
                Photos, description, categories, pricing, city, WhatsApp number. No subscription required.
              </p>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="h-full shadow-card border-none rounded-3xl overflow-hidden group hover:shadow-card-hover transition-all duration-300 p-8 relative">
              <div className="absolute top-0 right-0 p-6 text-6xl font-serif text-primary/10 group-hover:text-primary/20 transition-colors">02</div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-8 relative z-10">
                <Icon icon={Users} size="lg" className="text-primary" animateOnView />
              </div>
              <h3 className="font-serif text-2xl font-medium mb-4 relative z-10">Get discovered</h3>
              <p className="text-muted-foreground leading-relaxed relative z-10">
                Couples browse by category and city. Featured vendors appear on the homepage.
              </p>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="h-full shadow-card border-none rounded-3xl overflow-hidden group hover:shadow-card-hover transition-all duration-300 p-8 relative">
              <div className="absolute top-0 right-0 p-6 text-6xl font-serif text-primary/10 group-hover:text-primary/20 transition-colors">03</div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-8 relative z-10">
                <Icon icon={Smartphone} size="lg" className="text-primary" animateOnView />
              </div>
              <h3 className="font-serif text-2xl font-medium mb-4 relative z-10">Connect & convert</h3>
              <p className="text-muted-foreground leading-relaxed relative z-10">
                Couples inquire — you get a WhatsApp message and a lead in your dashboard. No middleman, no commission.
              </p>
            </Card>
          </StaggerItem>
        </Stagger>
      </section>

      {/* FAQ Teaser */}
      <section className="mx-auto max-w-4xl px-6 py-20 cw-section">
        <Reveal>
          <div className="bg-muted/30 rounded-3xl p-8 md:p-12 border border-border/50">
            <h2 className="font-serif text-3xl font-medium mb-8 text-center">Common questions</h2>
            
            <div className="space-y-6">
              <div className="pb-6 border-b border-border/50">
                <h4 className="text-lg font-medium mb-2 flex items-center">
                  <Icon icon={CheckCircle2} size="md" className="mr-3 text-primary" animateOnView />
                  Is it free?
                </h4>
                <p className="text-muted-foreground pl-8">
                  Yes! All planning tools for couples and basic listings for vendors are completely free.
                </p>
              </div>
              <div className="pb-6 border-b border-border/50">
                <h4 className="text-lg font-medium mb-2 flex items-center">
                  <Icon icon={CheckCircle2} size="md" className="mr-3 text-primary" animateOnView />
                  How does WhatsApp inquire work?
                </h4>
                <p className="text-muted-foreground pl-8">
                  When you tap Inquire on a vendor, we log the lead and open WhatsApp pre-filled with your wedding details. The conversation continues directly on WhatsApp.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-2 flex items-center">
                  <Icon icon={CheckCircle2} size="md" className="mr-3 text-primary" animateOnView />
                  Can I have multiple ceremonies?
                </h4>
                <p className="text-muted-foreground pl-8">
                  Yes, add as many ceremonies as you need (Poruwa, church, nikah, walima, homecoming, etc.) and our checklist will adapt accordingly.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button variant="ghost" asChild className="text-primary hover:text-primary/80 hover:bg-primary/5">
                <Link href="/faq">
                  Read all FAQs
                  <Icon icon={ChevronRight} size="sm" className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16 text-center cw-section">
        <Reveal>
          <h2 className="font-serif text-4xl md:text-5xl font-medium mb-8">Ready to get started?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]">
              <Link href="/register">Start planning</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 border-border hover:bg-muted min-w-[200px]">
              <Link href="/register?role=VENDOR">List your business</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
