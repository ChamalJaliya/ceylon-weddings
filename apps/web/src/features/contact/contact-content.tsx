"use client";

import { useState, type FormEvent } from "react";
import { CalendarClock, Check, Mail, MapPin, MessageCircle, Phone, Send, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from "@ceylonweddings/web";
import { Button } from "@ceylonweddings/ui/components/button";
import { Input } from "@ceylonweddings/ui/components/input";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import {
  AnimatePresence,
  Reveal,
  Stagger,
  StaggerItem,
  motion,
  useReducedMotion,
} from "@ceylonweddings/ui/domain/motion";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/page-hero";
import { SpotlightCard } from "@/components/spotlight-card";

export type ContactContentProps = {
  contactEmail?: string;
  contactPhone?: string;
  whatsapp?: string;
  heroTitle?: string;
  heroSub?: string;
};

export function ContactContent({
  contactEmail = "hello@ceylonweddings.com",
  contactPhone = "+94 11 234 5678",
  whatsapp = "+94771234567",
  heroTitle,
  heroSub,
}: ContactContentProps) {
  const t = useTranslations();
  const reduce = useReducedMotion();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const whatsappDigits = whatsapp.replace(/\D/g, "");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      await api.contact.send({ name, email, message });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that message. Please try email instead.");
    } finally {
      setSending(false);
    }
  };

  const methods: {
    icon: LucideIcon;
    title: string;
    detail: string;
    note?: string;
    href?: string;
    external?: boolean;
  }[] = [
    { icon: Mail, title: "General enquiries", detail: contactEmail, href: `mailto:${contactEmail}` },
    { icon: Phone, title: "Phone", detail: contactPhone, href: `tel:${contactPhone}` },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      detail: whatsapp,
      note: "Replies within 2 hours during business hours",
      href: `https://wa.me/${whatsappDigits}`,
      external: true,
    },
    { icon: MapPin, title: "Location", detail: "Colombo, Sri Lanka" },
  ];

  return (
    <div className="pb-20">
      <PageHero
        image={6}
        icon={<MessageCircle className="size-6" />}
        eyebrow="Contact"
        title={heroTitle ?? "We'd love to hear from you"}
        sub={
          heroSub ?? "Whether you're a couple with a question or a vendor needing help with your listing, we're here."
        }
      />

      <main className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-5 lg:gap-12">
        <div className="grid content-start gap-4 lg:col-span-2">
          <Reveal>
            <p className="mb-2 inline-flex items-center gap-2 text-label font-medium tracking-eyebrow text-primary uppercase">
              <span className="h-px w-8 bg-primary/50" /> Reach the team
            </p>
            <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">Pick whatever&apos;s easiest</h2>
          </Reveal>
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1" stagger={0.07}>
            {methods.map((method) => {
              const inner = (
                <SpotlightCard className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:rotate-6 group-hover:bg-primary group-hover:text-primary-foreground">
                      <method.icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-label tracking-eyebrow text-muted-foreground uppercase">{method.title}</p>
                      <p className="mt-0.5 truncate font-medium group-hover:text-primary">{method.detail}</p>
                      {method.note ? <p className="mt-1 text-xs text-muted-foreground">{method.note}</p> : null}
                    </div>
                  </div>
                </SpotlightCard>
              );
              return (
                <StaggerItem key={method.title} className="h-full">
                  {method.href ? (
                    <a
                      href={method.href}
                      target={method.external ? "_blank" : undefined}
                      rel={method.external ? "noreferrer" : undefined}
                      className="block h-full"
                    >
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </StaggerItem>
              );
            })}
          </Stagger>
          <Reveal delay={0.2}>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-primary/25 bg-primary/5 p-5">
              <p className="text-sm text-foreground">{t("consultation.contactCta")}</p>
              <Button asChild shape="pill" size="sm" iconLeft={CalendarClock}>
                <Link href="/consultation">{t("nav.consultation")}</Link>
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="lg:col-span-3">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-raised sm:p-10">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary/10 blur-3xl"
            />
            <AnimatePresence mode="wait" initial={false}>
              {submitted ? (
                <motion.div
                  key="done"
                  initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative flex min-h-96 flex-col items-center justify-center gap-4 text-center"
                >
                  <motion.span
                    initial={reduce ? false : { scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                    className="grid size-16 place-items-center rounded-full bg-success text-success-foreground shadow-md"
                  >
                    <Check className="size-8" />
                  </motion.span>
                  <h3 className="font-serif text-3xl text-foreground">Thank you!</h3>
                  <p className="max-w-sm text-muted-foreground">We&apos;ll get back to you within one working day.</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  exit={reduce ? undefined : { opacity: 0, y: -12 }}
                  onSubmit={(event) => void handleSubmit(event)}
                  className="relative grid gap-5"
                >
                  <div>
                    <h2 className="font-serif text-3xl font-medium tracking-tight">Send a message</h2>
                    <p className="mt-1 text-sm text-muted-foreground">We usually reply within a working day.</p>
                  </div>
                  {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label htmlFor="name" className="text-sm font-medium text-foreground">
                        Name
                      </label>
                      <Input
                        id="name"
                        required
                        placeholder="Your name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="message" className="text-sm font-medium text-foreground">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      required
                      placeholder="How can we help?"
                      className="min-h-40"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                    />
                  </div>
                  <Button type="submit" className="group w-full" shape="pill" size="lg" disabled={sending}>
                    <span className="inline-flex items-center gap-2">
                      {sending ? "Sending…" : "Send message"}
                      {sending ? null : (
                        <Send className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                      )}
                    </span>
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </main>
    </div>
  );
}
