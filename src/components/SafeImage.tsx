import * as React from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Image that degrades gracefully: missing/broken sources render a calm
 * placeholder instead of a broken-image icon or endless spinner.
 */
export function SafeImage({
  src,
  alt,
  className,
  placeholderClassName,
  placeholderIcon,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  placeholderIcon?: React.ReactNode;
}) {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        aria-label={alt}
        role="img"
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className,
          placeholderClassName,
        )}
      >
        {placeholderIcon ?? <ImageOff className="h-5 w-5 opacity-50" aria-hidden="true" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
