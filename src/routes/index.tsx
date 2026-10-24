import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Handshake,
  IndianRupee,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusKart — Buy & sell on your campus" },
      {
        name: "description",
        content:
          "CampusKart is the student marketplace for textbooks, notes, lab records, electronics and more — sold by students on your campus, at student prices.",
      },
      { property: "og:title", content: "CampusKart — Buy & sell on your campus" },
      {
        property: "og:description",
        content:
          "The student marketplace for textbooks, notes, lab records, electronics and more — sold by students on your campus, at student prices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const CATEGORY_TILES = [
  { icon: BookOpen, name: "Textbooks", blurb: "Syllabus books from seniors at half the price" },
  { icon: GraduationCap, name: "Notes & Lab Records", blurb: "Handouts, assignments and record files" },
  { icon: Sparkles, name: "Electronics", blurb: "Calculators, speakers, kindles and more" },
  { icon: Handshake, name: "Hostel Essentials", blurb: "Table fans, lamps, storage — pre-loved" },
  { icon: Tag, name: "Cycles & Transport", blurb: "Cycles and scooters staying on campus" },
  { icon: IndianRupee, name: "…and everything else", blurb: "Stationery, sports gear, furniture" },
];

const STEPS = [
  {
    icon: Tag,
    title: "List what you're done with",
    body: "Snap a couple of photos, set a fair price, and your listing is live for students on your campus in under a minute.",
  },
  {
    icon: MessageCircle,
    title: "Chat with real students",
    body: "Interested buyers message you directly. Agree on a time and a spot — no strangers, no shipping, no delivery fees.",
  },
  {
    icon: Handshake,
    title: "Meet and hand it over",
    body: "Meet on campus, inspect the item, pay by cash or UPI. Mark it sold and get on with your semester.",
  },
];

function Index() {
  const { userId, loading } = useAuth();
  const signedIn = !loading && !!userId;

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-secondary/60 to-background">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-20">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> For students, by students
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Your campus has everything you need —{" "}
            <span className="text-primary">someone's already selling it</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            CampusKart is the student marketplace for your college. Buy second-hand textbooks, notes, lab records and
            electronics from seniors who are done with them — and sell yours to juniors when you're done.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {signedIn ? (
              <>
                <Button asChild size="lg">
                  <Link to="/sell">
                    Sell an item <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/browse">
                    <Search className="mr-1.5 h-4 w-4" aria-hidden="true" /> Browse products
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/auth">
                    Get started — it's free <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/browse">
                    <Search className="mr-1.5 h-4 w-4" aria-hidden="true" /> Browse products
                  </Link>
                </Button>
              </>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Sign in with email or Google · meet buyers on campus · pay cash or UPI
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-14" aria-label="How CampusKart works">
        <h2 className="text-center text-2xl font-bold tracking-tight">How CampusKart works</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
          Three steps from a dusty shelf to a happy junior — all within your campus.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative rounded-xl border bg-card p-6">
              <span className="absolute right-5 top-5 text-3xl font-extrabold text-secondary-foreground/20" aria-hidden="true">
                {i + 1}
              </span>
              <div className="w-fit rounded-lg bg-secondary p-2.5">
                <s.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-bold tracking-tight">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="border-y bg-secondary/30" aria-label="What you can buy and sell">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold tracking-tight">What changes hands on CampusKart</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            The things every student needs at the start of a semester — at prices every student can afford.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_TILES.map((c) => (
              <Link
                key={c.name}
                to="/browse"
                className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="rounded-lg bg-secondary p-2.5 transition-colors group-hover:bg-accent">
                  <c.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight">{c.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Safety + money */}
      <section className="mx-auto max-w-5xl px-4 py-14" aria-label="Why CampusKart is safe">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <div className="w-fit rounded-lg bg-secondary p-2.5">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-bold tracking-tight">A marketplace you can trust</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              You deal only with students on your campus. Every listing can be reported to moderators, and accounts
              that break the rules are banned. No middlemen, no hidden charges.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="w-fit rounded-lg bg-secondary p-2.5">
              <IndianRupee className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-bold tracking-tight">Zero fees, real savings</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              CampusKart never takes a cut. Sellers pocket the full price, buyers pay student prices, and payments
              happen in person — cash or UPI, your choice.
            </p>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t bg-primary py-14 text-primary-foreground" aria-label="Get started">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to clear that shelf?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/80 sm:text-base">
            Join your campusmates on CampusKart. Post your first listing today, or find the textbook you've been
            hunting for — from a senior who used it last semester.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {signedIn ? (
              <Button asChild size="lg" variant="secondary">
                <Link to="/sell">
                  Sell an item <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth">
                  Sign up free <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/browse">Browse first</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
