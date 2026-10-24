import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  MessageSquare,
  Trash2,
  Pencil,
  PackageCheck,
  Package,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSignedImageUrls } from "@/hooks/use-image-urls";
import { formatINR, formatDate } from "@/lib/format";
import { getSharedProductById } from "@/lib/local-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SafeImage } from "@/components/SafeImage";
import { ReportDialog } from "@/components/ReportDialog";
import { ProductCard, ProductGrid, type ProductCardData } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/product/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Product · CampusKart" },
      { name: "description", content: "View this listing on CampusKart, the student marketplace." },
      { property: "og:title", content: "Product listing · CampusKart" },
      {
        property: "og:description",
        content: "View this listing on CampusKart, the student marketplace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: params?.id ? "noindex" : "noindex" },
    ],
  }),
  component: ProductPage,
});

type ProductDetail = {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  is_sold: boolean;
  created_at: string;
  updated_at: string;
  seller_id: string;
  category_id: string;
  category: { name: string; slug: string } | null;
  seller: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    college: string | null;
    created_at: string;
  } | null;
  images: { id: string; url: string; position: number }[];
};

function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const local = await getSharedProductById(id);
      if (local) {
        return {
          id: local.id,
          title: local.title,
          description: local.description,
          price: local.price,
          condition: local.condition,
          is_sold: local.is_sold,
          created_at: local.created_at,
          updated_at: local.updated_at,
          seller_id: local.seller_id,
          category_id: local.category_id,
          category: local.category ?? { name: "Campus Item", slug: "other" },
          seller: local.seller ?? {
            id: local.seller_id,
            display_name: "Student Seller",
            avatar_url: null,
            college: "Campus Member",
            created_at: local.created_at,
          },
          images: local.images,
        } as ProductDetail;
      }

      const { data, error } = await supabase
        .from("products")
        .select(
          "id, title, description, price, condition, is_sold, created_at, updated_at, seller_id, category_id, category:categories(name, slug), seller:profiles!products_seller_id_fkey(id, display_name, avatar_url, college, created_at), images:product_images(id, url, position)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as ProductDetail | null;
    },
  });
}

function useIsWishlisted(productId: string | undefined) {
  const { userId } = useAuth();
  return useQuery({
    enabled: !!userId && !!productId,
    queryKey: ["wishlist", "check", userId, productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("wishlist")
        .select("product_id")
        .eq("user_id", userId!)
        .eq("product_id", productId!)
        .maybeSingle();
      return !!data;
    },
  });
}

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId, loading: authLoading } = useAuth();
  const { data: product, isPending } = useProduct(id);
  const { data: wishlisted } = useIsWishlisted(product?.id);
  const [activeImage, setActiveImage] = useState(0);

  const imagePaths = useMemo(() => (product?.images ?? []).map((i) => i.url), [product]);
  const urlMap = useSignedImageUrls(imagePaths);

  useEffect(() => {
    setActiveImage(0);
  }, [id]);

  const isOwner = !!userId && userId === product?.seller_id;

  async function toggleWishlist() {
    if (!product) return;
    if (!userId) {
      navigate({ to: "/auth", search: { redirect: `/product/${product.id}` } });
      return;
    }
    if (wishlisted) {
      await supabase.from("wishlist").delete().eq("user_id", userId).eq("product_id", product.id);
      toast.success("Removed from wishlist");
    } else {
      const { error } = await supabase
        .from("wishlist")
        .insert({ user_id: userId, product_id: product.id });
      if (error) {
        toast.error("Could not save to wishlist");
        return;
      }
      toast.success("Saved to wishlist");
    }
    queryClient.invalidateQueries({ queryKey: ["wishlist"] });
  }

  async function startConversation() {
    if (!product) return;
    if (!userId) {
      navigate({ to: "/auth", search: { redirect: `/product/${product.id}` } });
      return;
    }
    const existing = await supabase
      .from("conversations")
      .select("id")
      .eq("product_id", product.id)
      .eq("buyer_id", userId)
      .maybeSingle();
    if (existing.data?.id) {
      navigate({ to: "/messages/$id", params: { id: existing.data.id } });
      return;
    }
    const { data, error } = await supabase
      .from("conversations")
      .insert({ product_id: product.id, buyer_id: userId, seller_id: product.seller_id })
      .select("id")
      .single();
    if (error || !data) {
      toast.error("Could not start the conversation. Please try again.");
      return;
    }
    navigate({ to: "/messages/$id", params: { id: data.id } });
  }

  async function toggleSold() {
    if (!product) return;
    const { error } = await supabase
      .from("products")
      .update({ is_sold: !product.is_sold })
      .eq("id", product.id);
    if (error) {
      toast.error("Could not update the listing.");
      return;
    }
    toast.success(product.is_sold ? "Marked as available" : "Marked as sold");
    queryClient.invalidateQueries({ queryKey: ["product", product.id] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  async function deleteListing() {
    if (!product) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      toast.error("Could not delete the listing.");
      return;
    }
    toast.success("Listing deleted");
    queryClient.invalidateQueries({ queryKey: ["products"] });
    navigate({ to: "/dashboard" });
  }

  if (isPending) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">This listing doesn't exist</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted by its seller.
        </p>
        <Button asChild className="mt-4">
          <Link to="/browse">Browse products</Link>
        </Button>
      </div>
    );
  }

  const activeUrl = product.images[activeImage] ? urlMap[product.images[activeImage].url] : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-4">
        <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" /> Back
      </Button>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-label="Product photos">
          <div className="overflow-hidden rounded-lg border bg-muted">
            <SafeImage
              src={activeUrl}
              alt={product.title}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View photo ${i + 1}`}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${i === activeImage ? "border-primary" : "border-transparent"}`}
                >
                  <SafeImage src={urlMap[img.url]} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section aria-label="Product information">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{product.condition}</Badge>
            {product.category && (
              <Link
                to="/browse"
                search={{ category: product.category.slug }}
                className="text-sm text-primary hover:underline"
              >
                {product.category.name}
              </Link>
            )}
            {product.is_sold && <Badge variant="destructive">Sold</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{product.title}</h1>
          <p className="mt-1 text-2xl font-bold text-primary">{formatINR(product.price)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Listed on {formatDate(product.created_at)}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {!isOwner && !product.is_sold && (
              <Button onClick={startConversation} disabled={authLoading}>
                <MessageSquare className="mr-1.5 h-4 w-4" aria-hidden="true" /> Message seller
              </Button>
            )}
            {!isOwner && (
              <Button variant="outline" onClick={toggleWishlist}>
                <Heart
                  className={`mr-1.5 h-4 w-4 ${wishlisted ? "fill-primary text-primary" : ""}`}
                  aria-hidden="true"
                />
                {wishlisted ? "Saved" : "Save to wishlist"}
              </Button>
            )}
            {isOwner && (
              <>
                <Button asChild variant="outline">
                  <Link to="/sell/edit/$id" params={{ id: product.id }}>
                    <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" /> Edit
                  </Link>
                </Button>
                <Button variant="outline" onClick={toggleSold}>
                  {product.is_sold ? (
                    <>
                      <Package className="mr-1.5 h-4 w-4" aria-hidden="true" /> Mark as available
                    </>
                  ) : (
                    <>
                      <PackageCheck className="mr-1.5 h-4 w-4" aria-hidden="true" /> Mark as sold
                    </>
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="mr-0">
                      <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes "{product.title}" and its photos. This cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteListing}>Delete listing</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>

          <Separator className="my-6" />
          <h2 className="text-sm font-semibold">Description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {product.description || "The seller hasn't added a description."}
          </p>

          <Separator className="my-6" />
          <h2 className="text-sm font-semibold">Seller</h2>
          <div className="mt-3 flex items-center gap-3 rounded-lg border bg-card p-3">
            <Avatar className="h-10 w-10">
              {product.seller?.avatar_url && (
                <AvatarImage src={product.seller.avatar_url} alt={product.seller.display_name} />
              )}
              <AvatarFallback className="bg-secondary text-xs font-semibold">
                {product.seller?.display_name.slice(0, 2).toUpperCase() ?? "S"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {product.seller?.display_name ?? "Unknown seller"}
              </p>
              <p className="text-xs text-muted-foreground">
                {product.seller?.college ? `${product.seller.college} · ` : ""}
                Member since {product.seller ? formatDate(product.seller.created_at) : "—"}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/seller/$id" params={{ id: product.seller_id }}>
                View profile
              </Link>
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <ReportDialog targetType="product" targetId={product.id} label="Report this listing" />
          </div>
        </section>
      </div>

      <section className="mt-12" aria-label="Similar listings">
        <h2 className="text-lg font-bold tracking-tight">
          More in {product.category?.name ?? "this category"}
        </h2>
        <SimilarProducts categoryId={product.category_id} excludeId={product.id} />
      </section>
    </div>
  );
}

function SimilarProducts({ categoryId, excludeId }: { categoryId: string; excludeId: string }) {
  const { data } = useQuery({
    queryKey: ["products", "similar", categoryId, excludeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(
          "id, title, price, condition, is_sold, created_at, category:categories(name), images:product_images(url)",
        )
        .eq("category_id", categoryId)
        .eq("is_sold", false)
        .neq("id", excludeId)
        .order("created_at", { ascending: false })
        .limit(4);
      return (data ?? []).map((r) => {
        const row = r as unknown as ProductCardData & {
          category: { name: string } | null;
          images: { url: string }[];
        };
        return {
          ...row,
          category_name: row.category?.name ?? null,
          image_path: row.images?.[0]?.url ?? null,
        };
      }) as ProductCardData[];
    },
  });
  if (!data || data.length === 0) return null;
  return (
    <ProductGrid className="mt-4">
      {data.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ProductGrid>
  );
}
