import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo />
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              The student marketplace for textbooks, notes, lab records, stationery and
              electronics.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Footer">
            <Link to="/help" className="text-muted-foreground hover:text-foreground">
              Help
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground">
              Contact
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
        <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} CampusKart · Built for students, by design.
        </p>
      </div>
    </footer>
  );
}
