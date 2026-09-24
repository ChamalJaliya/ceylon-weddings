"use client";

import { useState, type FormEvent } from "react";
import { CalendarClock } from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from "@ceylonweddings/web";
import { Button } from "@ceylonweddings/ui/components/button";
import { Input } from "@ceylonweddings/ui/components/input";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { Card, CardContent } from "@ceylonweddings/ui/components/card";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Link } from "../../../i18n/navigation";

export type ContactContentProps = {
  contactEmail?: string;
  contactPhone?: string;
  whatsapp?: string;
};

export function ContactContent({
  contactEmail = "hello@ceylonweddings.com",
  contactPhone = "+94 11 234 5678",
  whatsapp = "+94771234567",
}: ContactContentProps) {
  const t = useTranslations();
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

  return (
    <main className="cw-section mx-auto max-w-6xl px-6 py-8">
      <div className="grid grid-cols-1 gap-20 lg:grid-cols-2">
        <div className="space-y-8">
          <div>
            <h2 className="mb-6 font-serif text-4xl tracking-tight text-foreground md:text-5xl">
              Reach the team
            </h2>
            <p className="text-lg text-muted-foreground">
              Whether you are a couple with a question or a vendor needing help with your listing, we are
              here.
            </p>
          </div>

          <div className="space-y-4">
            <Card className="rounded-3xl border-muted/50 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <h3 className="mb-1 font-medium text-foreground">General enquiries</h3>
                <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">
                  {contactEmail}
                </a>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-muted/50 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <h3 className="mb-1 font-medium text-foreground">Phone</h3>
                <a href={`tel:${contactPhone}`} className="text-primary hover:underline">
                  {contactPhone}
                </a>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-muted/50 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="flex items-start gap-4 p-6">
                <div>
                  <h3 className="mb-1 font-medium text-foreground">WhatsApp</h3>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Response within 2 hours during business hours
                  </p>
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    className="font-medium text-primary hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {whatsapp}
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-muted/50 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <h3 className="mb-1 font-medium text-foreground">Location</h3>
                <p className="text-muted-foreground">Located in Colombo, Sri Lanka</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-primary/25 bg-primary/5 shadow-sm">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
                <p className="text-sm text-foreground">{t("consultation.contactCta")}</p>
                <Button asChild shape="pill" size="sm" iconLeft={CalendarClock}>
                  <Link href="/consultation">{t("nav.consultation")}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
          {submitted ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 py-12 text-center">
              <h3 className="font-serif text-2xl text-foreground">Thank you!</h3>
              <p className="text-muted-foreground">We will get back to you within one working day.</p>
            </div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
              <h2 className="mb-6 font-serif text-2xl text-foreground">Send a message</h2>
              {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
              <div className="space-y-2">
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
              <div className="space-y-2">
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
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">
                  Message
                </label>
                <Textarea
                  id="message"
                  required
                  placeholder="How can we help?"
                  className="min-h-[120px]"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" shape="pill" size="lg" disabled={sending}>
                {sending ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
