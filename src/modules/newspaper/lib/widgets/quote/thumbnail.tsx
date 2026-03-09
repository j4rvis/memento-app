import type { WidgetThumbnailProps } from "../types";

export function QuoteThumbnail({ config }: WidgetThumbnailProps) {
  const text = (config.text as string) || "Quote";
  return (
    <div className="h-full flex flex-col items-center justify-center p-2 text-center border-y border-current gap-1">
      <p className="text-[10px] opacity-40 font-serif text-2xl leading-none">&ldquo;</p>
      <p className="text-[9px] italic line-clamp-3 opacity-70 leading-tight">{text}</p>
    </div>
  );
}
