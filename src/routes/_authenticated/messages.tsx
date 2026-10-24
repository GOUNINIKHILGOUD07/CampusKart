import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSignedImageUrls } from "@/hooks/use-image-urls";
import { SafeImage } from "@/components/SafeImage";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { useRealtimeConversations } from "@/hooks/use-realtime";

type ConversationRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  product: { id: string; title: string; images: { url: string }[] } | null;
  buyer: { display_name: string } | null;
  seller: { display_name: string } | null;
  messages: { body: string; created_at: string; sender_id: string; read_at: string | null }[];
};

export const Route = createFileRoute("/_authenticated/messages")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Messages · CampusKart" },
      { name: "description", content: "Chat with buyers and sellers on CampusKart." },
      { property: "og:title", content: "Messages · CampusKart" },
      { property: "og:description", content: "Chat with buyers and sellers on CampusKart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { userId } = useAuth();
  useRealtimeConversations(userId);

  const { data: conversations, isPending } = useQuery({
    enabled: !!userId,
    queryKey: ["conversations", "list", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          "id, buyer_id, seller_id, product:products(id, title, images:product_images(url)), buyer:profiles!conversations_buyer_id_fkey(display_name), seller:profiles!conversations_seller_id_fkey(display_name), messages(body, created_at, sender_id, read_at)",
        )
        .or(`buyer_id.eq.${userId!},seller_id.eq.${userId!}`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ConversationRow[];
    },
  });

  const coverPaths = (conversations ?? [])
    .map((c) => c.product?.images?.[0]?.url ?? "")
    .filter(Boolean);
  const urlMap = useSignedImageUrls(coverPaths);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Chats about items you're buying or selling.
      </p>

      <section className="mt-6 flex flex-col gap-2" aria-label="Conversations">
        {isPending ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))
        ) : conversations && conversations.length > 0 ? (
          conversations.map((c) => {
            const isBuyer = c.buyer_id === userId;
            const other = isBuyer ? c.seller : c.buyer;
            const msgs = [...(c.messages ?? [])].sort((a, b) =>
              a.created_at.localeCompare(b.created_at),
            );
            const last = msgs[msgs.length - 1];
            const unread = msgs.filter((m) => m.sender_id !== userId && !m.read_at).length;
            const coverPath = c.product?.images?.[0]?.url ?? null;
            return (
              <Link
                key={c.id}
                to="/messages/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-shadow hover:shadow-md"
              >
                {coverPath ? (
                  <SafeImage
                    src={urlMap[coverPath] ?? null}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-md bg-secondary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {c.product?.title ?? "A listing"}
                    <span className="ml-1 font-normal text-muted-foreground">
                      · with {other?.display_name ?? "a student"}
                    </span>
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {last ? last.body : "No messages yet — say hello!"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">
                    {last ? timeAgo(last.created_at) : ""}
                  </span>
                  {unread > 0 && <Badge>{unread} new</Badge>}
                </div>
              </Link>
            );
          })
        ) : (
          <EmptyState
            icon={MessagesSquare}
            title="No conversations yet"
            description="Message a seller from any listing to start a chat."
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
