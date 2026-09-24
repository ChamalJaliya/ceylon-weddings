"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@ceylonweddings/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ceylonweddings/ui/components/card";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { Link } from "../i18n/navigation";

const PROMPTS = [
  { key: "aiNekath", href: "/planning/checklist" },
  { key: "aiVenue", href: "/vendors?category=VENUE" },
  { key: "aiBudget", href: "/planning/budget" },
  { key: "aiWhatsapp", href: "/vendors" },
] as const;

export function AiStub() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<(typeof PROMPTS)[number] | null>(null);

  return (
    <div className="relative">
      <Button shape="pill" onClick={() => setOpen((value) => !value)}>
        <Icon icon={Sparkles} size="sm" />
        {t("knotly.ai")}
      </Button>
      {open ? (
        <Card className="absolute right-0 z-20 mt-2 w-80">
          <CardHeader>
            <CardTitle>{t("knotly.ai")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p className="text-muted-foreground">{t("knotly.aiHelp")}</p>
            {PROMPTS.map((prompt) => (
              <Button
                key={prompt.key}
                type="button"
                variant={active?.key === prompt.key ? "default" : "outline"}
                className="h-auto justify-start whitespace-normal text-left"
                onClick={() => setActive(prompt)}
              >
                {t(`knotly.${prompt.key}`)}
              </Button>
            ))}
            {active ? (
              <>
                <p className="rounded-2xl bg-secondary p-3 text-xs leading-relaxed">{t(`knotly.${active.key}Answer`)}</p>
                <Button asChild size="sm">
                  <Link href={active.href}>{t("hub.viewAll")}</Link>
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
