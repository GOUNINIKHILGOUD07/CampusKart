import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ListingForm, type ExistingListing } from "@/components/ListingForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/sell/edit/$id")({
  head: () => ({
    meta: [
      { title: "Edit listing · CampusKart" },
      { name: "description", content: "Edit the details and photos of your CampusKart listing." },
      { property: "og:title", content: "Edit listing · CampusKart" },
      {
        property: "og:description",
        content: "Edit the details and photos of your CampusKart listing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditListingPage,
});

function EditListingPage() {
  const { id } = Route.useParams();
  const { userId } = useAuth();

  const {
    data: listing,
    isPending,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("products")
        .select(
          "id, title, description, price, condition, category_id, seller_id, images:product_images(id, url)",
        )
        .eq("id", id)
        .maybeSingle();
      if (err) throw new Error(err.message);
      return (data ?? null) as
        | (Omit<ExistingListing, "images"> & {
            seller_id: string;
            images: { id: string; url: string }[];
          })
        | null;
    },
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!listing || listing.seller_id !== userId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">You can't edit this listing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only the seller who created it can make changes.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/dashboard">Back to my listings</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
      </div>
    );
  }

  const { seller_id: _sellerId, ...formListing } = listing;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Edit listing</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update the details or photos, then save your changes.
      </p>
      <div className="mt-6">
        <ListingForm listing={formListing} />
      </div>
    </div>
  );
}
