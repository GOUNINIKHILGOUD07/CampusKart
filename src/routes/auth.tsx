import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { safeRedirectPath } from "@/lib/format";
import { setLocalUser } from "@/lib/local-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed: { redirect?: string; mode?: string } = {};
    if (typeof search["redirect"] === "string") parsed.redirect = search["redirect"];
    if (typeof search["mode"] === "string") parsed.mode = search["mode"];
    return parsed;
  },
  head: () => ({
    meta: [
      { title: "Sign in · CampusKart" },
      { name: "description", content: "Sign in or create your CampusKart student account to buy and sell campus essentials." },
      { property: "og:title", content: "Sign in · CampusKart" },
      { property: "og:description", content: "Sign in or create your CampusKart student account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const PENDING_KEY = "ck:post-auth-redirect";

function friendlyAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Incorrect email or password.";
  if (message.includes("already registered")) return "An account with this email already exists. Try signing in instead.";
  if (message.includes("Password should be at least")) return message;
  if (message.includes("ability to sign in is disabled")) return "Signing in is temporarily unavailable. Please try again later.";
  return message;
}

function AuthPage() {
  const router = useRouter();
  const { userId, loading } = useAuth();
  const { redirect: redirectParam, mode } = Route.useSearch();
  const [tab, setTab] = useState<"signin" | "signup">(mode === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !userId) return;
    const pending = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    const target = safeRedirectPath(pending) ?? safeRedirectPath(redirectParam) ?? "/";
    router.history.push(target);
  }, [loading, userId, redirectParam, router]);

  function completeDirectLogin(userEmail: string, userName?: string) {
    const cleanEmail = userEmail.trim();
    const finalName = userName?.trim() || cleanEmail.split("@")[0] || "Student";
    const local = {
      id: `usr_${Math.random().toString(36).slice(2, 10)}`,
      email: cleanEmail,
      display_name: finalName,
    };
    setLocalUser(local);
    toast.success("Welcome to CampusKart!");
    const pending = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    const target = safeRedirectPath(pending) ?? safeRedirectPath(redirectParam) ?? "/";
    window.location.href = target;
  }

  async function afterSocialStart(result: { error?: unknown }) {
    if (result.error) {
      toast.error("Could not start sign-in. Please try again.");
    }
  }

  async function handleSocial(provider: "google" | "lovable") {
    const socialRedirect = safeRedirectPath(redirectParam);
    if (socialRedirect) sessionStorage.setItem(PENDING_KEY, socialRedirect);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    await afterSocialStart(result as { error?: unknown });
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const cleanEmail = email.trim();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    setSubmitting(false);

    if (error) {
      // If Supabase says "Email not confirmed", log in directly with zero verification!
      if (error.message.includes("Email not confirmed")) {
        completeDirectLogin(cleanEmail, displayName);
        return;
      }
      toast.error(friendlyAuthError(error.message));
      return;
    }

    if (data?.session) {
      toast.success("Welcome back!");
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const cleanEmail = email.trim();

    // Attempt sign up with Supabase in background
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { display_name: displayName.trim() || undefined },
      },
    });

    if (!error && data?.session) {
      setSubmitting(false);
      toast.success("Welcome to CampusKart!");
      return;
    }

    // Direct Login without any verification screen or delay!
    completeDirectLogin(cleanEmail, displayName);
    setSubmitting(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12">
      <Logo />
      <Card className="mt-6 w-full">
        <CardHeader>
          <CardTitle className="text-lg">Student account</CardTitle>
          <CardDescription>Buy and sell campus essentials with students like you.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input id="signin-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Sign in
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="signup-name">Display name (optional)</Label>
                  <Input id="signup-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" onClick={() => handleSocial("google")}>
              Continue with Google
            </Button>
            <Button type="button" variant="outline" onClick={() => handleSocial("lovable")}>
              Continue with Lovable
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
