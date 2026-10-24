import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, HeartOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ProductCard, ProductGrid, type ProductCardData } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist · CampusKart" },
      { name: "description", content: "Items you saved on CampusKart, the student marketplace." },
      { property: "og:title", content: "Wishlist · CampusKart" },
      {
        property: "og:description",
        content: "Items you saved on CampusKart, the student marketplace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { data: items, isPending } = useQuery({
    enabled: !!userId,
    queryKey: ["wishlist", "list", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist")
        .select(
          "product_id, created_at, product:products(id, title, price, condition, is_sold, created_at, category:categories(name), images:product_images(url))",
        )
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw new Error(error.message);
      return (data ?? [])
        .map((r) => {
          const row = r as unknown as {
            product_id: string;
            product:
              | (ProductCardData & { category: { name: string } | null; images: { url: string }[] })
              | null;
          };
          if (!row.product) return null;
          return {
            wishlistProductId: row.product_id,
            card: {
              ...row.product,
              category_name: row.product.category?.name ?? null,
              image_path: row.product.images?.[0]?.url ?? null,
            } as ProductCardData,
          };
        })
        .filter((x): x is { wishlistProductId: string; card: ProductCardData } => !!x);
    },
  });

  async function removeFromWishlist(productId: string) {
    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", userId!)
      .eq("product_id", productId);
    if (error) {
      toast.error("Could not remove the item.");
      return;
    }
    toast.success("Removed from wishlist");
    queryClient.invalidateQueries({ queryKey: ["wishlist"] });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Wishlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">Items you saved while browsing.</p>

      <section className="mt-6" aria-label="Saved items">
        {isPending ? (
          <ProductGrid>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </ProductGrid>
        ) : items && items.length > 0 ? (
          <ProductGrid>
            {items.map(({ wishlistProductId, card }) => (
              <div key={wishlistProductId} className="relative">
                <ProductCard product={card} />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => removeFromWishlist(card.id)}
                >
                  <HeartOff className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Remove
                </Button>
              </div>
            ))}
          </ProductGrid>
        ) : (
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            description="Tap the heart on any listing to keep an eye on it."
            className="mt-4"
            action={
              <Button asChild>
                <Link to="/browse">Browse products</Link>
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}
