"use client";

import { useEffect, useState } from "react";
import { api } from "@ceylonweddings/web";
import type { MineWedding } from "@ceylonweddings/contracts";
import { Link } from "../i18n/navigation";

export function useWedding() {
  const [data, setData] = useState<MineWedding | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.wedding
      .mine()
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return { data, error, reload: () => api.wedding.mine().then(setData) };
}

export function SignInPrompt({ error }: { error: string | null }) {
  if (!error) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  return (
    <p className="text-sm">
      {error}.{" "}
      <Link href="/login" className="underline">
        Sign in
      </Link>
    </p>
  );
}
