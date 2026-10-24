import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & FAQ · CampusKart" },
      {
        name: "description",
        content: "Answers to common questions about buying and selling on CampusKart.",
      },
      { property: "og:title", content: "Help & FAQ · CampusKart" },
      {
        property: "og:description",
        content: "Answers to common questions about buying and selling on CampusKart.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpPage,
});

const FAQS = [
  {
    q: "What is CampusKart?",
    a: "CampusKart is a student marketplace. You can sell textbooks, notes, gadgets, cycles and more to students on your own campus, and buy them at student prices.",
  },
  {
    q: "How do I sell an item?",
    a: "Sign in, tap Sell, add a clear title, photos, the condition and a fair price, then publish. Your listing goes live instantly for students browsing your campus.",
  },
  {
    q: "How do I buy something?",
    a: "Browse products or search for what you need, open a listing, and tap Message seller. Agree on a time and meet on campus — pay cash or UPI in person.",
  },
  {
    q: "How does payment work?",
    a: "Payments happen in person when you meet: cash or UPI, whatever you both prefer. CampusKart never asks for your card details or bank information.",
  },
  {
    q: "How do I stay safe?",
    a: "Meet in public campus spots during the day, inspect the item before paying, and report anything suspicious with the Report button on a listing. Accounts can be banned by moderators.",
  },
  {
    q: "Why can't I see a listing?",
    a: "Sold listings are hidden from search. If you saved something on your wishlist and it disappeared, it was likely marked as sold.",
  },
  {
    q: "How do I edit or delete my listing?",
    a: "Open My listings from the navigation, then use Edit, mark it Sold, or delete it entirely.",
  },
  {
    q: "I have a different question",
    a: "Send us a message from the contact page and we'll get back to you.",
  },
];

function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-col items-center text-center">
        <div className="rounded-full bg-secondary p-3">
          <HelpCircle className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Help & FAQ</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Everything you need to know about buying and selling on CampusKart.
        </p>
      </div>

      <Accordion type="single" collapsible className="mt-8">
        {FAQS.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-sm font-semibold">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-8 text-center">
        <Button asChild variant="outline">
          <Link to="/contact">Still stuck? Contact us</Link>
        </Button>
      </div>
    </div>
  );
}
