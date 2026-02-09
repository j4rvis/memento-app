"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function OnlineStatus() {
  const offlineToastId = useRef<string | number | undefined>(undefined);

  useEffect(() => {
    function handleOffline() {
      offlineToastId.current = toast.warning("You are offline", {
        duration: Infinity,
        id: "offline-status",
      });
    }

    function handleOnline() {
      if (offlineToastId.current) {
        toast.dismiss(offlineToastId.current);
        offlineToastId.current = undefined;
      }
      toast.success("Back online", { duration: 3000 });
    }

    // Show toast if already offline on mount
    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
