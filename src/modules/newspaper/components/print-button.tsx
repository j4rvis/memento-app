"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  async function handlePrint() {
    // Wait for all fonts (Playfair Display, EB Garamond) to finish loading
    // before triggering print — otherwise the PDF falls back to system serif.
    if (document.fonts) {
      await document.fonts.ready;
    }
    window.print();
  }

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}
