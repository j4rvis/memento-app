import type { WidgetThumbnailProps } from "../types";

export function ImageThumbnail({ config }: WidgetThumbnailProps) {
  const seed = (config.keywords as string | undefined)?.replace(/[^a-zA-Z0-9]/g, "-") || "newspaper";
  const src = (config.url as string | undefined) || `https://picsum.photos/seed/${seed}/200/100`;
  return (
    <div className="h-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="w-full h-full object-cover" />
    </div>
  );
}
