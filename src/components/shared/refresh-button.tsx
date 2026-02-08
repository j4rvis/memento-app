"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
    >
      <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
    </Button>
  );
}
