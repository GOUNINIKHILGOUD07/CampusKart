import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · CampusKart" },
      { name: "description", content: "New messages, listings and account updates on CampusKart." },
      { property: "og:title", content: "Notifications · CampusKart" },
      {
        property: "og:description",
        content: "New messages, listings and account updates on CampusKart.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

function NotificationsPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notifications, isPending } = useQuery({
    enabled: !!userId,
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, type, link, is_read, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return (data ?? []) as NotificationRow[];
    },
  });

  const unread = (notifications ?? []).filter((n) => !n.is_read);

  async function markAllRead() {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId!)
      .eq("is_read", false);
    if (error) {
      toast.error("Could not mark notifications as read.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function open(n: NotificationRow) {
    if (!n.is_read) {
      void supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    if (n.link) router.history.push(n.link);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Updates about your chats and listings.
          </p>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Mark all read
          </Button>
        )}
      </div>

      <section className="mt-6 flex flex-col gap-2" aria-label="Notifications">
        {isPending ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))
        ) : notifications && notifications.length > 0 ? (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => open(n)}
              className={cn(
                "rounded-lg border bg-card p-3 text-left transition-colors hover:bg-secondary",
                !n.is_read && "border-l-4 border-l-primary",
              )}
            >
              <p className="text-sm font-semibold">{n.title}</p>
              {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
            </button>
          ))
        ) : (
          <EmptyState
            icon={notifications === undefined ? Bell : BellOff}
            title="You're all caught up"
            description="New messages and listing activity will appear here."
            className="mt-4"
            action={
              <Button asChild variant="outline">
                <Link to="/browse">Browse products</Link>
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}
