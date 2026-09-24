"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../components/card";
import { motion, useReducedMotion, SPRING_SMOOTH, AnimatedCounter } from "./motion";

export type BudgetCategory = {
  label: string;
  spent: string;
  percent: number;
};

export function BudgetMeter({
  title,
  usedLabel,
  remainingLabel,
  percent,
  categories,
}: {
  title: string;
  usedLabel: string;
  remainingLabel: string;
  percent: number;
  categories: BudgetCategory[];
}) {
  const reduce = useReducedMotion();
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>{usedLabel}</span>
            <span className="text-muted-foreground">{remainingLabel}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={reduce ? { width: `${clamped}%` } : { width: "0%" }}
              animate={{ width: `${clamped}%` }}
              transition={SPRING_SMOOTH}
            />
          </div>
        </div>
        <ul className="grid gap-2">
          {categories.map((category, index) => (
            <motion.li
              key={category.label}
              initial={reduce ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">{category.label}</span>
              <span className="font-medium">{category.spent}</span>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

