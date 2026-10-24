import * as React from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { REPORT_REASONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ReportDialog({
  targetType,
  targetId,
  label = "Report",
  triggerLabel,
  signedOutLabel = "Sign in to report",
}: {
  targetType: "product" | "user" | "message";
  targetId: string;
  label?: string;
  triggerLabel?: string;
  signedOutLabel?: string;
}) {
  const { userId } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<string>("");
  const [details, setDetails] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: userId!,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit the report. Please try again.");
      return;
    }
    setOpen(false);
    setReason("");
    setDetails("");
    toast.success("Report submitted. Our moderators will review it.");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {triggerLabel ?? label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {userId ? (
          <>
            <DialogHeader>
              <DialogTitle>{label}</DialogTitle>
              <DialogDescription>
                Tell us what's wrong. Reports are private and reviewed by moderators.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="report-reason">Reason</Label>
                <Select value={reason} onValueChange={setReason} required>
                  <SelectTrigger id="report-reason"><SelectValue placeholder="Select a reason" /></SelectTrigger>
                  <SelectContent>
                    {REPORT_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="report-details">Details (optional)</Label>
                <Textarea
                  id="report-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Anything that helps us understand the issue."
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!reason || submitting}>
                  {submitting ? "Submitting…" : "Submit report"}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Sign in required</DialogTitle>
              <DialogDescription>You need a CampusKart account to submit a report.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button asChild>
                <a href="/auth">Sign in</a>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
