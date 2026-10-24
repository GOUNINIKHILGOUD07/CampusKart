import { createFileRoute } from "@tanstack/react-router";


export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy · CampusKart" },
      { name: "description", content: "How CampusKart handles your personal information." },
      { property: "og:title", content: "Privacy policy · CampusKart" },
      { property: "og:description", content: "How CampusKart handles your personal information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: January 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold tracking-tight">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Your sign-in details from the provider you choose (name and email).</li>
            <li>The profile information you add: display name, college, bio, and avatar.</li>
            <li>The listings, photos and messages you create on CampusKart.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight">How we use it</h2>
          <p className="mt-2 text-muted-foreground">
            Your details are used to show your profile to other students, run your listings, deliver messages between
            buyers and sellers, and keep the marketplace safe. We do not sell your data, and we do not run ads.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight">Who can see what</h2>
          <p className="mt-2 text-muted-foreground">
            Your display name, college, bio and listings are visible to everyone browsing CampusKart. Your email stays
            private — other students never see it. Chats are visible only to the two people in the conversation.
            Moderators may view reports to resolve disputes and can ban accounts that break the rules.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight">Photos</h2>
          <p className="mt-2 text-muted-foreground">
            Listing photos and avatars are stored securely and delivered only through expiring access links, so they
            can't be scraped or hotlinked from outside CampusKart.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight">Deleting your data</h2>
          <p className="mt-2 text-muted-foreground">
            You can edit your profile in Settings at any time. To delete your account and its data entirely, contact us
            and we will remove it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight">Payments</h2>
          <p className="mt-2 text-muted-foreground">
            CampusKart never handles payments. Buyers and sellers settle in person with cash or UPI, so we never see or
            store any card or bank details.
          </p>
        </section>
      </div>
    </div>
  );
}
