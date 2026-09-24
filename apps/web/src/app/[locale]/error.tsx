"use client";

import { useEffect } from "react";
import { Button } from "@ceylonweddings/ui/components/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 inline-flex size-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" />
      </div>
      <h1 className="mb-3 font-serif text-3xl font-semibold sm:text-4xl">Something went wrong</h1>
      <p className="mb-8 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
        An unexpected error occurred. Please try again, or go back to the homepage if the problem persists.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button shape="pill" onClick={reset}>
          Try again
        </Button>
        <Button shape="pill" variant="ghost" asChild>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">Back to home</a>
        </Button>
      </div>
    </div>
  );
}
