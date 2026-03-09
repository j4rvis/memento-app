"use client";

import { Button } from "@/components/ui/button";

export function ConnectGoogleButton({ slug }: { slug: string }) {
  return (
    <Button variant="outline" asChild>
      <a href={`/api/google/auth?slug=${slug}`}>Connect Google Account</a>
    </Button>
  );
}
