import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star, ShieldCheck, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, timeAgo } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard, ProductGrid, type ProductCardData } from "@/components/ProductCard";
import { ReportDialog } from "@/components/ReportDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/seller/$id")({
  head: () => ({
    meta: [
      { title: "Seller profile · CampusKart" },
      {
        name: "description",
        content: "View this seller's active listings and reviews on CampusKart.",
      },
      { property: "og:title", content: "Seller profile · CampusKart" },
      {
        property: "og:description",
        content: "View this seller's active listings and reviews on CampusKart.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SellerPage,
});

type SellerProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  college: string | null;
  created_at: string;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: { id: string; display_name: string; avatar_url: string | null } | null;
};

function SellerPage() {
  const { id } = Route.useParams();

  const { data: profile, isPending } = useQuery({
    queryKey: ["seller", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, college, created_at")
        .eq("id", id)
        .maybeSingle();
      return (data ?? null) as SellerProfile | null;
    },
  });

  const { data: listings } = useQuery({
    enabled: !!profile,
    queryKey: ["seller-listings", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(
          "id, title, price, condition, is_sold, created_at, category:categories(name), images:product_images(url)",
        )
        .eq("seller_id", id)
        .order("created_at", { ascending: false })
        .limit(24);
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

  const { data: reviews } = useQuery({
    enabled: !!profile,
    queryKey: ["seller-reviews", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select(
          "id, rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(id, display_name, avatar_url)",
        )
        .eq("seller_id", id)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as unknown as ReviewRow[];
    },
  });

  const { data: verified } = useQuery({
    enabled: !!profile,
    queryKey: ["seller-verified", id],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data } = await supabase.rpc("is_email_verified", { _user_id: id });
      return !!data;
    },
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">This profile doesn't exist</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The student may have deleted their account.
        </p>
        <Link
          to="/browse"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="flex flex-wrap items-start gap-4 rounded-lg border bg-card p-5">
        <Avatar className="h-16 w-16">
          {profile.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
          )}
          <AvatarFallback className="bg-secondary text-lg font-semibold">
            {profile.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">{profile.display_name}</h1>
            {verified === true && (
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Email verified
              </Badge>
            )}
            {verified === false && (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" /> Email not verified
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.college ? `${profile.college} · ` : ""}Member since{" "}
            {formatDate(profile.created_at)}
          </p>
          {profile.bio && <p className="mt-2 text-sm text-foreground/90">{profile.bio}</p>}
          {avgRating != null && (
            <p className="mt-2 flex items-center gap-1 text-sm font-medium">
              <Star className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
              {avgRating.toFixed(1)} ({reviews?.length ?? 0} review
              {(reviews?.length ?? 0) === 1 ? "" : "s"})
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ReportDialog targetType="user" targetId={profile.id} label="Report this user" />
        </div>
      </header>

      <section className="mt-8" aria-label="Listings by this seller">
        <h2 className="text-lg font-bold tracking-tight">Listings</h2>
        {listings && listings.length > 0 ? (
          <ProductGrid className="mt-4">
            {listings.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        ) : (
          <EmptyState
            icon={Star}
            title="No listings right now"
            description="This student hasn't listed anything yet, or everything has sold."
            className="mt-4"
          />
        )}
      </section>

      <section className="mt-8" aria-label="Reviews of this seller">
        <h2 className="text-lg font-bold tracking-tight">Reviews</h2>
        {reviews && reviews.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3">
            {reviews.map((r) => (
              <article key={r.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    {r.reviewer?.avatar_url && (
                      <AvatarImage src={r.reviewer.avatar_url} alt={r.reviewer.display_name} />
                    )}
                    <AvatarFallback className="bg-secondary text-[10px] font-semibold">
                      {r.reviewer?.display_name.slice(0, 2).toUpperCase() ?? "S"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">{r.reviewer?.display_name ?? "A student"}</p>
                  <span
                    className="ml-auto flex items-center gap-0.5"
                    aria-label={`${r.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
                </div>
                {r.comment && <p className="mt-2 text-sm text-foreground/90">{r.comment}</p>}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No reviews yet. Reviews come only from students who messaged this seller.
          </p>
        )}
      </section>
    </div>
  );
}
