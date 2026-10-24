import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)} aria-label="CampusKart home">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
        <GraduationCap className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-lg font-bold tracking-tight text-foreground">
          Campus<span className="text-primary">Kart</span>
        </span>
      )}
    </Link>
  );
}
