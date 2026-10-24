import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSignedImageUrls } from "@/hooks/use-image-urls";
import { SafeImage } from "@/components/SafeImage";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Chat · CampusKart" },
      { name: "description", content: "Your conversation on CampusKart, the student marketplace." },
      { property: "og:title", content: "Chat · CampusKart" },
      { property: "og:description", content: "Your conversation on CampusKart, the student marketplace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConversationPage,
});

type ConversationDetail = {
  id: string;
  buyer_id: string;
  seller_id: string;
  product: { id: string; title: string; price: number; images: { url: string }[] } | null;
  buyer: { display_name: string } | null;
  seller: { display_name: string } | null;
};

type MessageRow = {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  read_at: string | null;
};

function ConversationPage() {
  const { id } = Route.useParams();
  const { userId, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isPending, error } = useQuery({
    enabled: !!userId,
    queryKey: ["conversation", id, userId],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("conversations")
        .select(
          "id, buyer_id, seller_id, product:products(id, title, price, images:product_images(url)), buyer:profiles!conversations_buyer_id_fkey(display_name), seller:profiles!conversations_seller_id_fkey(display_name)",
        )
        .eq("id", id)
        .maybeSingle();
      if (err) throw new Error(err.message);
      return (data ?? null) as ConversationDetail | null;
    },
  });

  const { data: messages } = useQuery({
    enabled: !!userId && !!conversation,
    queryKey: ["messages", id],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("messages")
        .select("id, body, created_at, sender_id, read_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true })
        .limit(200);
      if (err) throw new Error(err.message);
      return (data ?? []) as MessageRow[];
    },
  });

  const coverPath = conversation?.product?.images?.[0]?.url ?? null;
  const urlMap = useSignedImageUrls(coverPath ? [coverPath] : []);
  const coverUrl = coverPath ? urlMap[coverPath] ?? null : null;

  const isParticipant = !!conversation && (conversation.buyer_id === userId || conversation.seller_id === userId);
  const otherName = useMemo(() => {
    if (!conversation) return "";
    return (conversation.buyer_id === userId ? conversation.seller : conversation.buyer)?.display_name ?? "a student";
  }, [conversation, userId]);

  // Realtime: append new messages to the thread without a refresh.
  useEffect(() => {
    if (!isParticipant) return;
    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", id] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, isParticipant, queryClient]);

  // Mark incoming messages as read.
  useEffect(() => {
    if (!userId || !isParticipant) return;
    const unreadIds = (messages ?? [])
      .filter((m) => m.sender_id !== userId && !m.read_at)
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    void supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
  }, [messages, userId, isParticipant]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !userId || sending) return;
    setSending(true);
    const { error: err } = await supabase
      .from("messages")
      .insert({ conversation_id: id, sender_id: userId, body });
    setSending(false);
    if (err) {
      toast.error("Message could not be sent. Please try again.");
      return;
    }
    setDraft("");
    queryClient.invalidateQueries({ queryKey: ["messages", id] });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }

  if (isPending || authLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-8">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!conversation || !isParticipant) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">This conversation isn't available</h1>
        <p className="mt-2 text-sm text-muted-foreground">It may have been removed, or it isn't yours.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/messages">Back to messages</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-6" style={{ height: "calc(100vh - 8rem)" }}>
      <header className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <Button asChild variant="ghost" size="icon" aria-label="Back to messages">
          <Link to="/messages">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        {coverUrl ? (
          <SafeImage src={coverUrl} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
        ) : (
          <div className="h-10 w-10 shrink-0 rounded-md bg-secondary" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{conversation.product?.title ?? "A listing"}</p>
          <p className="text-xs text-muted-foreground">Chat with {otherName}</p>
        </div>
        {conversation.product && (
          <Button asChild variant="outline" size="sm">
            <Link to="/product/$id" params={{ id: conversation.product.id }}>
              View listing
            </Link>
          </Button>
        )}
      </header>

      <div className="mt-3 flex flex-1 flex-col gap-2 overflow-y-auto rounded-lg border bg-muted/30 p-3">
        {(messages ?? []).length === 0 && (
          <p className="my-auto text-center text-sm text-muted-foreground">
            No messages yet — say hello to {otherName}!
          </p>
        )}
        {(messages ?? []).map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex items-center gap-2" aria-label="Send a message">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${otherName}…`}
          maxLength={2000}
          aria-label="Message text"
        />
        <Button type="submit" size="icon" disabled={sending || draft.trim() === ""} aria-label="Send message">
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
