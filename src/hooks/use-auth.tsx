import * as React from "react";
import { useRouter, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getLocalUser, setLocalUser } from "@/lib/local-store";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextValue {
  userId: string | null;
  profile: Profile | null;
  isAdmin: boolean;
  /** True until the first session lookup completes. */
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  onSessionChange,
}: {
  children: React.ReactNode;
  onSessionChange?: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const loadForUser = React.useCallback(async (uid: string | null) => {
    const localUser = getLocalUser();
    const effectiveUid = uid || localUser?.id || null;

    setUserId(effectiveUid);
    if (!effectiveUid) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }

    if (localUser && (!uid || localUser.id === effectiveUid)) {
      setProfile({
        id: localUser.id,
        display_name: localUser.display_name,
        avatar_url: null,
        bio: null,
        college: "Campus Member",
        created_at: new Date().toISOString(),
        is_banned: false,
        updated_at: new Date().toISOString(),
      });
      setIsAdmin(false);
      return;
    }

    const [{ data: profileData }, { data: roleData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid!).maybeSingle(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid!)
        .eq("role", "admin")
        .maybeSingle(),
    ]);

    let resolvedProfile = profileData ?? null;
    if (!resolvedProfile) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const fallbackName =
        user?.user_metadata?.["display_name"] || user?.email?.split("@")[0] || "Student";
      const { data: createdProfile } = await supabase
        .from("profiles")
        .upsert({ id: uid!, display_name: fallbackName })
        .select("*")
        .maybeSingle();
      if (createdProfile) {
        resolvedProfile = createdProfile;
      }
    }

    setProfile(resolvedProfile);
    setIsAdmin(!!roleData);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const localUser = getLocalUser();
    if (localUser) {
      loadForUser(localUser.id);
      setLoading(false);
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!cancelled) {
          const remoteUid = data.session?.user?.id ?? null;
          if (remoteUid) {
            loadForUser(remoteUid);
          } else if (localUser) {
            loadForUser(localUser.id);
          } else {
            loadForUser(null);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      const uid = session?.user?.id ?? null;
      loadForUser(uid);
      onSessionChange?.();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadForUser, onSessionChange, queryClient]);

  const signOut = React.useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    setLocalUser(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUserId(null);
    setProfile(null);
    setIsAdmin(false);
    navigate({ to: "/auth", replace: true });
  }, [navigate, queryClient]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      userId,
      profile,
      isAdmin,
      loading,
      refreshProfile: () => loadForUser(userId),
      signOut,
    }),
    [userId, profile, isAdmin, loading, loadForUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type { Profile };
