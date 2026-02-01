import Link from "next/link";
import { UserProfile } from "@/components/UserProfile";
import { Activity } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/50 backdrop-blur-sm border-b border-border/10">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground/90">
          Pulse
        </span>
      </div>
      
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Solutions</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Enterprise</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Pricing</Link>
        </nav>
        <UserProfile />
      </div>
    </header>
  );
}
