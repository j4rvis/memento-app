"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveArticleFromShare } from "@/app/(app)/i/[slug]/articles/actions";

async function consumePendingShare(): Promise<{ url: string; title: string; text: string } | null> {
  return new Promise((resolve) => {
    const req = indexedDB.open("memento-share", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("pending");
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("pending")) {
        resolve(null);
        return;
      }
      const tx = db.transaction("pending", "readwrite");
      const store = tx.objectStore("pending");
      const get = store.get("share");
      get.onsuccess = () => {
        store.delete("share");
        resolve(get.result ?? null);
      };
      get.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });
}

export function PendingShareHandler({ slug }: { slug: string }) {
  const router = useRouter();

  useEffect(() => {
    consumePendingShare().then(async (share) => {
      if (!share) return;
      const url = share.url || share.text || share.title;
      if (!url) return;

      const toastId = toast.loading("Saving article…");
      try {
        const result = await saveArticleFromShare(slug, share);
        if (!result.success) {
          toast.error(result.error ?? "Failed to save article", { id: toastId });
          return;
        }
        if (result.duplicate) {
          toast.info("Already saved", { id: toastId, duration: 2000 });
        } else {
          toast.success("Article saved", { id: toastId, duration: 3000 });
        }
        router.push(`/i/${slug}/articles`);
        router.refresh();
      } catch {
        toast.error("Failed to save article", { id: toastId });
      }
    });
  }, [slug, router]);

  return null;
}
