import { Link } from "@tanstack/react-router";
import { useSignedImageUrls } from "@/hooks/use-image-urls";
import { SafeImage } from "@/components/SafeImage";
import { Badge } from "@/components/ui/badge";
import { formatINR, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ProductCardData {
  id: string;
  title: string;
  price: number;
  condition: string;
  is_sold: boolean;
  created_at: string;
  category_name?: string | null;
  image_path?: string | null;
}

export function ProductCard({
  product,
  className,
}: {
  product: ProductCardData;
  className?: string;
}) {
  const urlMap = useSignedImageUrls(product.image_path ? [product.image_path] : []);
  const imageUrl = product.image_path ? (urlMap[product.image_path] ?? null) : null;

  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className={cn(
        "group block overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <SafeImage
          src={imageUrl}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />
        {product.is_sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <span className="rounded-md bg-foreground px-3 py-1 text-xs font-bold uppercase tracking-wide text-background">
              Sold
            </span>
          </div>
        )}
        {!product.is_sold && (
          <Badge variant="secondary" className="absolute left-2 top-2 border bg-card/90">
            {product.condition}
          </Badge>
        )}
      </div>
      <div className="p-3">
        <p className="text-base font-bold text-foreground">{formatINR(product.price)}</p>
        <h3 className="mt-0.5 line-clamp-1 text-sm font-medium text-foreground">{product.title}</h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {product.category_name ? `${product.category_name} · ` : ""}
          {timeAgo(product.created_at)}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}
