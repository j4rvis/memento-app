"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failed — not critical
      });

      // Check for updates every 60 minutes
      const interval = setInterval(
        () => {
          navigator.serviceWorker.getRegistration().then((reg) => {
            reg?.update();
          });
        },
        60 * 60 * 1000
      );

      return () => clearInterval(interval);
    }
  }, []);

  return null;
}
