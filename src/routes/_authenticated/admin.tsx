import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert, ShieldCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin · CampusKart" },
      { name: "description", content: "CampusKart moderation console: reports, listings and accounts." },
      { property: "og:title", content: "Admin · CampusKart" },
      { property: "og:description", content: "CampusKart moderation console: reports, listings and accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type ProfileRow = {
  id: string;
  display_name: string;
  college: string | null;
  is_banned: boolean;
};

function AdminPage() {
  const { userId, isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles, isPending } = useQuery({
    enabled: !!isAdmin,
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, college, is_banned")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return (data ?? []) as ProfileRow[];
    },
  });

  const { data: openReports } = useQuery({
    enabled: !!isAdmin,
    queryKey: ["admin", "reports", "open"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "open");
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  });

  const { data: activeListings } = useQuery({
    enabled: !!isAdmin,
    queryKey: ["admin", "listings", "active"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_sold", false);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  });

  async function toggleBan(p: ProfileRow) {
    const { error } = await supabase.from("profiles").update({ is_banned: !p.is_banned }).eq("id", p.id);
    if (error) {
      toast.error("Could not update the account.");
      return;
    }
    toast.success(p.is_banned ? "Account unbanned" : "Account banned");
    queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={ShieldAlert}
          title="Admins only"
          description="This console is restricted to CampusKart moderators."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold tracking-tight">Admin console</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as a moderator. Actions apply immediately and are logged in the audit trail.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Open reports" value={openReports ?? 0} />
        <StatCard label="Active listings" value={activeListings ?? 0} />
        <StatCard label="Members" value={profiles?.length ?? 0} />
      </div>

      <section className="mt-8" aria-label="Accounts">
        <h2 className="text-lg font-bold tracking-tight">Accounts</h2>
        {isPending ? (
          <div className="mt-3 flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : profiles && profiles.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2">
            {profiles.map((p) => (
              <article key={p.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold">
                    {p.display_name}
                    {p.id === userId && <Badge variant="secondary">You</Badge>}
                    {p.is_banned && <Badge variant="destructive">Banned</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.college ?? "No college set"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">Banned</span>
                  <Switch checked={p.is_banned} onCheckedChange={() => toggleBan(p)} aria-label={`Ban ${p.display_name}`} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon={UserX} title="No members yet" description="New sign-ups will appear here." className="mt-3" />
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
