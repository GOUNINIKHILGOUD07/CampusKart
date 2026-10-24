import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SearchX, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CONDITIONS } from "@/lib/constants";
import { getSharedProducts } from "@/lib/local-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard, ProductGrid, type ProductCardData } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed: {
      q?: string;
      category?: string;
      min?: number;
      max?: number;
      condition?: string;
      sold?: "1";
      sort?: string;
    } = {};
    if (typeof search["q"] === "string") parsed.q = search["q"];
    if (typeof search["category"] === "string") parsed.category = search["category"];
    if (typeof search["min"] === "string" && search["min"] !== "") parsed.min = Number(search["min"]);
    if (typeof search["max"] === "string" && search["max"] !== "") parsed.max = Number(search["max"]);
    if (typeof search["condition"] === "string") parsed.condition = search["condition"];
    if (search["sold"] === "1") parsed.sold = "1";
    if (typeof search["sort"] === "string") parsed.sort = search["sort"];
    return parsed;
  },
  head: () => ({
    meta: [
      { title: "Browse products · CampusKart" },
      { name: "description", content: "Search textbooks, notes, lab records, stationery and electronics listed by students." },
      { property: "og:title", content: "Browse products · CampusKart" },
      { property: "og:description", content: "Find affordable campus essentials listed by students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BrowsePage,
});

type CategoryRow = { id: string; slug: string; name: string };

function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, slug, name").order("position");
      return (data ?? []) as CategoryRow[];
    },
  });
}

function useProducts(search: ReturnType<typeof Route.useSearch>) {
  const filtersKey = JSON.stringify(search);
  return useQuery({
    queryKey: ["products", "browse", filtersKey],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id, title, price, condition, is_sold, created_at, category:categories(name), images:product_images(url)")
        .order(search.sort === "price-asc" || search.sort === "price-desc" ? "price" : "created_at", {
          ascending: search.sort !== "price-desc",
        })
        .limit(60);

      if (search.sort === "price-asc" || search.sort === "price-desc") {
        query = query.order("created_at", { ascending: false });
      }
      if (!search.sold) query = query.eq("is_sold", false);
      if (search.q) query = query.or(`title.ilike.%${search.q}%,description.ilike.%${search.q}%`);
      if (search.category) {
        const cat = await supabase.from("categories").select("id").eq("slug", search.category).maybeSingle();
        query = query.eq("category_id", cat.data?.id ?? "00000000-0000-0000-0000-000000000000");
      }
      if (typeof search.min === "number" && !Number.isNaN(search.min)) query = query.gte("price", search.min);
      if (typeof search.max === "number" && !Number.isNaN(search.max)) query = query.lte("price", search.max);
      if (search.condition) {
        const list = search.condition.split(",").filter((c: string) => (CONDITIONS as readonly string[]).includes(c));
        if (list.length > 0) query = query.in("condition", list);
      }

      const { data, error } = await query;
      const remoteList = error ? [] : (data ?? []).map((row) => {
        const r = row as unknown as {
          id: string; title: string; price: number; condition: string; is_sold: boolean; created_at: string;
          category: { name: string } | null;
          images: { url: string }[];
        };
        return {
          id: r.id,
          title: r.title,
          price: r.price,
          condition: r.condition,
          is_sold: r.is_sold,
          created_at: r.created_at,
          category_name: r.category?.name ?? null,
          image_path: r.images?.[0]?.url ?? null,
        } satisfies ProductCardData;
      });

      const localList = (await getSharedProducts()).map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        condition: p.condition,
        is_sold: p.is_sold,
        created_at: p.created_at,
        category_name: p.category?.name ?? "Campus Item",
        image_path: p.images?.[0]?.url ?? null,
      }));

      return [...localList, ...remoteList];
    },
  });
}

function BrowsePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: categories } = useCategories();
  const { data: products, isPending } = useProducts(search);

  const [minInput, setMinInput] = useState(search.min != null ? String(search.min) : "");
  const [maxInput, setMaxInput] = useState(search.max != null ? String(search.max) : "");
  const hasFilters = useMemo(
    () => !!(search.q || search.category || search.condition || search.min != null || search.max != null || search.sold || search.sort),
    [search],
  );

  function patch(patchObj: Record<string, string | number | undefined>) {
    navigate({ search: (prev) => ({ ...prev, ...patchObj }) as typeof prev });
  }

  function reset() {
    setMinInput("");
    setMaxInput("");
    navigate({ search: {} });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Browse products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPending ? "Loading listings…" : `${products?.length ?? 0} listing${(products?.length ?? 0) === 1 ? "" : "s"} found`}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-4 rounded-lg border bg-card p-4" aria-label="Filters">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Filters</h2>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={reset} className="h-7 px-2 text-xs">
                <RotateCcw className="mr-1 h-3 w-3" aria-hidden="true" /> Reset
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-category">Category</Label>
            <Select
              value={search.category ?? "all"}
              onValueChange={(v) => patch({ category: v === "all" ? undefined : v })}
            >
              <SelectTrigger id="filter-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-condition">Condition</Label>
            <Select
              value={search.condition ?? "all"}
              onValueChange={(v) => patch({ condition: v === "all" ? undefined : v })}
            >
              <SelectTrigger id="filter-condition"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any condition</SelectItem>
                {CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Price (₹)</Label>
            <div className="flex items-center gap-2">
              <Input id="filter-min" type="number" min={0} placeholder="Min" value={minInput}
                onChange={(e) => setMinInput(e.target.value)}
                onBlur={() => patch({ min: minInput === "" ? undefined : Math.max(0, Number(minInput)) })} />
              <span className="text-muted-foreground">–</span>
              <Input id="filter-max" type="number" min={0} placeholder="Max" value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                onBlur={() => patch({ max: maxInput === "" ? undefined : Math.max(0, Number(maxInput)) })} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-sold"
              checked={search.sold === "1"}
              onCheckedChange={(v) => patch({ sold: v ? "1" : undefined })}
            />
            <Label htmlFor="filter-sold" className="text-sm font-normal">Include sold items</Label>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-sort">Sort by</Label>
            <Select value={search.sort ?? "newest"} onValueChange={(v) => patch({ sort: v === "newest" ? undefined : v })}>
              <SelectTrigger id="filter-sort"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest listings</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </aside>

        <section aria-label="Results">
          {isPending ? (
            <ProductGrid>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </ProductGrid>
          ) : products && products.length > 0 ? (
            <ProductGrid>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </ProductGrid>
          ) : (
            <EmptyState
              icon={SearchX}
              title={search.q ? "No matches found" : "No listings yet"}
              description={
                search.q
                  ? "Try different keywords or remove some filters."
                  : "Nothing has been listed in this category yet. Check back soon — or sell something yourself."
              }
              action={
                <div className="flex gap-2">
                  {hasFilters && <Button variant="outline" onClick={reset}>Clear filters</Button>}
                  <Button asChild>
                    <Link to="/sell">Sell an Item</Link>
                  </Button>
                </div>
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
