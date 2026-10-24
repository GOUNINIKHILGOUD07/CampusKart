import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageSquareText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact us · CampusKart" },
      { name: "description", content: "Get in touch with the CampusKart team about your account, a listing or a bug." },
      { property: "og:title", content: "Contact us · CampusKart" },
      { property: "og:description", content: "Get in touch with the CampusKart team about your account, a listing or a bug." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

const TOPICS = ["Account help", "Problem with a listing", "Bug report", "Suggest an idea", "Something else"] as const;

function ContactPage() {
  const { userId } = useAuth();
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("Account help");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      toast.error("Please write a little more so we can help.");
      return;
    }
    const replyTo = email.trim() || (userId ? "signed-in-user" : "");
    if (!replyTo) {
      toast.error("Add an email so we can reply to you.");
      return;
    }
    setSending(true);
    // The support table is created with the schema; the generated client types
    // don't include it yet, so go through a narrow local type.
    const from = supabase.from as unknown as (
      table: string,
    ) => { insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
    const inbox = from("support_messages");
    const { error } = await inbox.insert({
      user_id: userId ?? undefined,
      topic,
      reply_email: email.trim() || null,
      message: trimmed,
    });
    setSending(false);
    if (error) {
      toast.error("Message could not be sent. Please try again.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex flex-col items-center text-center">
        <div className="rounded-full bg-secondary p-3">
          <MessageSquareText className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Contact us</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Questions about your account, a listing, or a bug? Write to us and we'll get back to you.
        </p>
      </div>

      {sent ? (
        <div className="mt-8 rounded-lg border bg-card p-6 text-center">
          <Mail className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
          <p className="mt-2 font-semibold">Message sent!</p>
          <p className="mt-1 text-sm text-muted-foreground">Thanks for reaching out — we usually reply within a day or two.</p>
        </div>
      ) : (
        <form onSubmit={send} className="mt-8 flex flex-col gap-5 rounded-lg border bg-card p-6" aria-label="Contact form">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-topic">What's it about?</Label>
            <Select value={topic} onValueChange={(v) => setTopic(v as (typeof TOPICS)[number])}>
              <SelectTrigger id="contact-topic">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-email">Email {userId && <span className="font-normal text-muted-foreground">(optional — we have yours)</span>}</Label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Tell us what happened, or what you need help with…"
              required
            />
          </div>
          <div>
            <Button type="submit" disabled={sending}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Send message
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
