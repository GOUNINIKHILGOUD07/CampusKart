import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSignedImageUrl } from "@/hooks/use-image-urls";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings · CampusKart" },
      { name: "description", content: "Update your CampusKart profile and avatar." },
      { property: "og:title", content: "Settings · CampusKart" },
      { property: "og:description", content: "Update your CampusKart profile and avatar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { userId, profile, loading } = useAuth();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [college, setCollege] = useState(profile?.college ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const avatarUrl = useSignedImageUrl(profile?.avatar_url ?? null);

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  async function handleAvatarChange(files: FileList | null) {
    const file = files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Avatar must be under 4 MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      toast.error("Could not upload the avatar. Please try again.");
      setUploading(false);
      return;
    }
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: `avatars/${path}` })
      .eq("id", userId);
    setUploading(false);
    if (updateError) {
      toast.error("Could not save the avatar. Please try again.");
      return;
    }
    toast.success("Avatar updated");
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const name = displayName.trim();
    if (name.length < 2 || name.length > 60) {
      toast.error("Name must be 2–60 characters");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name,
        college: college.trim() || null,
        bio: bio.trim() || null,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error("Could not save your profile. Please try again.");
      return;
    }
    toast.success("Profile saved");
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">How buyers and sellers see you on CampusKart.</p>

      <div className="mt-6 flex items-center gap-4 rounded-lg border bg-card p-4">
        <Avatar className="h-16 w-16">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={profile.display_name} />}
          <AvatarFallback className="bg-secondary text-lg font-semibold">
            {profile.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleAvatarChange(e.target.files);
              e.target.value = "";
            }}
          />
          <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Change avatar
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">Square images look best, up to 4 MB.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-6 flex flex-col gap-5" aria-label="Profile details">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-name">Display name</Label>
          <Input
            id="settings-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-college">College</Label>
          <Input
            id="settings-college"
            value={college ?? ""}
            onChange={(e) => setCollege(e.target.value)}
            placeholder="e.g. IIT Bombay"
            maxLength={80}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-bio">Bio</Label>
          <Textarea
            id="settings-bio"
            value={bio ?? ""}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="A line or two about yourself. Buyers see this on your profile."
            maxLength={300}
          />
        </div>
        <div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Save profile
          </Button>
        </div>
      </form>
    </div>
  );
}
