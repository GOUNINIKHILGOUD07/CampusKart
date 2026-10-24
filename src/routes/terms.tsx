import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of use · CampusKart" },
      { name: "description", content: "The rules for buying and selling on CampusKart." },
      { property: "og:title", content: "Terms of use · CampusKart" },
      { property: "og:description", content: "The rules for buying and selling on CampusKart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Terms of use</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: January 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold tracking-tight">1. Who can use CampusKart</h2>
          <p className="mt-2 text-muted-foreground">
            CampusKart is for students buying and selling within their campus community. By signing up you confirm the
            information you provide is accurate, and you agree to these rules.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight">2. What you may list</h2>
          <p className="mt-2 text-muted-foreground">
            List things you actually own and can hand over in person: textbooks, notes, electronics, cycles, furniture
            and similar student items. You may not list anything illegal, dangerous, counterfeit, academic-work-for-hire
            (assignments, projects or papers), or anything else prohibited by your college's rules.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight">3. Honest listings</h2>
          <p className="mt-2 text-muted-foreground">
            Describe items accurately, including defects, and use photos of the actual item. Mark listings as sold once
            they're gone, and keep prices in Indian rupees.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight">4. Dealing with other students</h2>
          <p className="mt-2 text-muted-foreground">
            CampusKart connects students; it is never a party to a sale. Payments happen in person (cash or UPI).
            Inspect items before paying, meet in public campus spots, and treat others respectfully in chats — no spam,
            harassment, or off-platform contact info in bulk messages.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight">5. Reports and bans</h2>
          <p className="mt-2 text-muted-foreground">
            Use the report button on any listing that breaks these rules. Moderators review reports and may remove
            listings or ban accounts. Bans are final at moderators' discretion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight">6. Your account</h2>
          <p className="mt-2 text-muted-foreground">
            Keep your sign-in secure and don't share your account. You're responsible for activity under it. You may
            delete your own listings at any time and request account deletion by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight">7. Changes</h2>
          <p className="mt-2 text-muted-foreground">
            These terms may be updated as the marketplace evolves; the date above always reflects the latest version.
          </p>
        </section>
      </div>
    </div>
  );
}
