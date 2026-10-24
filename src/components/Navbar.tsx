import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Bell,
  Heart,
  MessageSquare,
  LogOut,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  Menu,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

function NavbarSearch({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  return (
    <form
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        navigate({ to: "/browse", search: q ? { q } : {} });
        onDone?.();
      }}
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search textbooks, notes, gadgets…"
        className="h-10 pl-9"
        aria-label="Search products"
      />
    </form>
  );
}

function useUnreadNotificationCount() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`navbar-notif-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const query = useQuery({
    enabled: !!userId,
    queryKey: ["notifications", "unread-count", userId],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId!)
        .eq("is_read", false);
      return count ?? 0;
    },
    refetchInterval: 60000,
  });
  return query.data ?? 0;
}

function NotificationsBell() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const unread = useUnreadNotificationCount();
  const [open, setOpen] = useState(false);

  const { data: recent } = useQuery({
    enabled: !!userId && open,
    queryKey: ["notifications", "recent", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, body, link, is_read, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as NotificationRow[];
    },
  });

  if (!userId) return null;

  async function markRead(n: NotificationRow) {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    setOpen(false);
    if (n.link) navigate({ to: n.link });
    else navigate({ to: "/notifications" });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications (${unread} unread)`}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <p className="text-sm font-semibold">Notifications</p>
          <Link
            to="/notifications"
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => setOpen(false)}
          >
            View all
          </Link>
        </div>
        {recent && recent.length > 0 ? (
          <div className="flex flex-col">
            {recent.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n)}
                className={cn(
                  "rounded-md px-2 py-2 text-left hover:bg-accent",
                  !n.is_read && "bg-secondary/60",
                )}
              >
                <p className="text-sm font-medium leading-snug">{n.title}</p>
                {n.body && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function UserMenu() {
  const { profile, isAdmin, signOut } = useAuth();
  const displayName = profile?.display_name ?? "Student";
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          <Avatar className="h-8 w-8">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
            <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
              {initials || "S"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">Student account</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Seller dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/wishlist" className="flex items-center gap-2">
            <Heart className="h-4 w-4" aria-hidden="true" /> Wishlist
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" aria-hidden="true" /> Messages
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" aria-hidden="true" /> Profile settings
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Admin dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavbarSignOut({ onDone }: { onDone?: () => void }) {
  const { signOut } = useAuth();
  return (
    <Button
      variant="ghost"
      onClick={() => {
        onDone?.();
        void signOut();
      }}
      className="justify-start"
    >
      <span className="flex items-center gap-2">
        <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
      </span>
    </Button>
  );
}

const MAIN_LINKS = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse" },
] as const;

export function Navbar() {
  const { userId, loading } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = (path: string) =>
    cn(
      "text-sm font-medium transition-colors hover:text-foreground",
      location.pathname === path ? "text-primary" : "text-muted-foreground",
    );

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Logo className="shrink-0" />

        <nav className="hidden items-center gap-5 md:flex" aria-label="Main navigation">
          {MAIN_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={linkClass(l.to)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden max-w-md flex-1 md:block">
          <NavbarSearch />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" aria-hidden="true" />
          ) : userId ? (
            <>
              <NotificationsBell />
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/sell" className="flex items-center gap-1.5">
                  <Plus className="h-4 w-4" aria-hidden="true" /> Sell an Item
                </Link>
              </Button>
              <UserMenu />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Sign up
                </Link>
              </Button>
            </>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4">
                <NavbarSearch onDone={() => setMobileOpen(false)} />
                <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                  {MAIN_LINKS.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>
                <div className="border-t pt-3">
                  {userId ? (
                    <div className="flex flex-col gap-1">
                      <Button asChild size="sm" className="justify-start">
                        <Link
                          to="/sell"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-1.5"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" /> Sell an Item
                        </Link>
                      </Button>
                      <Link
                        to="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
                      >
                        Seller dashboard
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
                      >
                        Wishlist
                      </Link>
                      <Link
                        to="/messages"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
                      >
                        Messages
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
                      >
                        Profile settings
                      </Link>
                      <NavbarSignOut onDone={() => setMobileOpen(false)} />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button asChild variant="outline">
                        <Link to="/auth" onClick={() => setMobileOpen(false)}>
                          Log in
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link
                          to="/auth"
                          search={{ mode: "signup" }}
                          onClick={() => setMobileOpen(false)}
                        >
                          Sign up
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
