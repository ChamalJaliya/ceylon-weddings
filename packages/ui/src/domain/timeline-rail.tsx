"use client";

import { Badge } from "../components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/card";
import type { BadgeIntent } from "../contracts/badge";
import { cn } from "../lib/utils";
import { motion, useReducedMotion, Stagger, StaggerItem } from "./motion";
import { SPRING_SMOOTH, SPRING_SNAPPY } from "../motion/tokens";

export type TimelineItem = {
  title: string;
  meta: string;
  status: string;
  intent?: BadgeIntent;
};

export function TimelineRail({
  title,
  items,
}: {
  title: string;
  items: TimelineItem[];
}) {
  const reduce = useReducedMotion();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Stagger
          trigger="inView"
          stagger={0.08}
          className="grid gap-4"
        >
          {items.map((item, index) => (
            <StaggerItem
              key={`${item.title}-${index}`}
              direction="left"
              distance={18}
              className="flex gap-3"
            >
              {/* Dot + connector rail */}
              <div className="flex flex-col items-center self-stretch">
                <motion.span
                  className={cn(
                    "mt-1 size-2.5 rounded-full",
                    item.intent === "success" ? "bg-success" : "bg-primary",
                  )}
                  initial={reduce ? false : { scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "0px 0px -4% 0px" }}
                  transition={{ ...SPRING_SNAPPY, delay: index * 0.07 }}
                />
                {index < items.length - 1 ? (
                  <motion.span
                    className="mt-1 w-px flex-1 origin-top bg-border"
                    initial={reduce ? false : { scaleY: 0, opacity: 0 }}
                    whileInView={{ scaleY: 1, opacity: 1 }}
                    viewport={{ once: true, margin: "0px 0px -4% 0px" }}
                    transition={{ ...SPRING_SMOOTH, delay: index * 0.07 + 0.12 }}
                  />
                ) : null}
              </div>

              {/* Content */}
              <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pb-1">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.meta}</p>
                </div>
                <Badge intent={item.intent ?? "default"}>{item.status}</Badge>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </CardContent>
    </Card>
  );
}
