import { createFileRoute } from "@tanstack/react-router";
import { ListingForm } from "@/components/ListingForm";

export const Route = createFileRoute("/_authenticated/sell")({
  head: () => ({
    meta: [
      { title: "Sell an item · CampusKart" },
      { name: "description", content: "List textbooks, notes, gadgets and more for students on your campus." },
      { property: "og:title", content: "Sell an item · CampusKart" },
      { property: "og:description", content: "List textbooks, notes, gadgets and more for students on your campus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Sell an item</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill in the details, add clear photos, and your listing goes live for students on your campus.
      </p>
      <div className="mt-6">
        <ListingForm />
      </div>
    </div>
  );
}
