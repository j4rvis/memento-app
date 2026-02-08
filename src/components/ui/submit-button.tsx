"use client";

import { useFormStatus } from "react-dom";
import { Button, type buttonVariants } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

interface SubmitButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  pendingText?: string;
}

export function SubmitButton({
  children,
  pendingText,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
