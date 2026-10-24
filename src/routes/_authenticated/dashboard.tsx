import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PackageCheck, Package, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getSharedProducts } from "@/lib/local-store";
import { EmptyState } from "@/components/EmptyState";
import { ProductGrid, type ProductCardData } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My listings · CampusKart" },
      { name: "description", content: "Manage the items you have listed on CampusKart." },
      { property: "og:title", content: "My listings · CampusKart" },
      { property: "og:description", content: "Manage the items you have listed on CampusKart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

type OwnListing = ProductCardData & { description: string };

function useMyListings(userId: string | null) {
  return useQuery({
    enabled: !!userId,
    queryKey: ["products", "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, description, price, condition, is_sold, created_at, category:categories(name), images:product_images(url)")
        .eq("seller_id", userId!)
        .order("created_at", { ascending: false })
        .limit(100);

      const remoteList = (data ?? []).map((r) => {
        const row = r as unknown as OwnListing & { category: { name: string } | null; images: { url: string }[] };
        return { ...row, category_name: row.category?.name ?? null, image_path: row.images?.[0]?.url ?? null };
      }) as OwnListing[];

      const localShared = (await getSharedProducts())
        .filter((p) => p.seller_id === userId)
        .map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: p.price,
          condition: p.condition,
          is_sold: p.is_sold,
          created_at: p.created_at,
          category_name: p.category?.name ?? "Campus Item",
          image_path: p.images?.[0]?.url ?? null,
        })) as OwnListing[];

      return [...localShared, ...remoteList];
    },
  });
}

function DashboardPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { data: listings, isPending } = useMyListings(userId);

  const active = (listings ?? []).filter((l) => !l.is_sold);
  const sold = (listings ?? []).filter((l) => l.is_sold);

  async function toggleSold(listing: OwnListing) {
    const { error } = await supabase.from("products").update({ is_sold: !listing.is_sold }).eq("id", listing.id);
    if (error) {
      toast.error("Could not update the listing.");
      return;
    }
    toast.success(listing.is_sold ? "Marked as available" : "Marked as sold");
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  async function deleteListing(listing: OwnListing) {
    const { error } = await supabase.from("products").delete().eq("id", listing.id);
    if (error) {
      toast.error("Could not delete the listing.");
      return;
    }
    toast.success("Listing deleted");
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My listings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Everything you've posted on CampusKart.</p>
        </div>
        <Button asChild>
          <Link to="/sell">Sell an item</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Summary">
        <StatCard icon={<Tag className="h-4 w-4" aria-hidden="true" />} label="Active listings" value={active.length} />
        <StatCard icon={<PackageCheck className="h-4 w-4" aria-hidden="true" />} label="Sold" value={sold.length} />
        <StatCard icon={<Package className="h-4 w-4" aria-hidden="true" />} label="Total listings" value={listings?.length ?? 0} />
      </div>

      <section className="mt-8" aria-label="All listings">
        <h2 className="text-lg font-bold tracking-tight">All listings</h2>
        {isPending ? (
          <ProductGrid className="mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </ProductGrid>
        ) : listings && listings.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3">
            {listings.map((l) => (
              <article key={l.id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{l.title}</p>
                    {l.is_sold ? <Badge variant="destructive">Sold</Badge> : <Badge variant="secondary">Active</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm font-bold text-primary">₹{l.price.toLocaleString("en-IN")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/sell/edit/$id" params={{ id: l.id }}>
                      <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleSold(l)}>
                    <PackageCheck className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                    {l.is_sold ? "Available" : "Sold"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" aria-label={`Delete ${l.title}`}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes "{l.title}" and its photos. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteListing(l)}>Delete listing</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Tag}
            title="No listings yet"
            description="When you sell something on campus, it will show up here."
            className="mt-4"
            action={
              <Button asChild>
                <Link to="/sell">Sell your first item</Link>
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
