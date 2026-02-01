"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lightbulb, LogOut, Loader2, LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface IdeaWithRun {
  id: string;
  title: string;
  created_at: string;
  credit_usage: number;
  simulations: { id: string }[];
}

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<IdeaWithRun[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);

      if (user) {
        fetchIdeas(user.id);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchIdeas(session.user.id);
      } else {
        setIdeas([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const fetchIdeas = async (userId: string) => {
    setIdeasLoading(true);
    const { data, error } = await supabase
      .from("ideas")
      .select(
        `
        id,
        title,
        created_at,
        credit_usage,
        simulations (
          id
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setIdeas(data as unknown as IdeaWithRun[]);
    }
    setIdeasLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    return null;
  }

  // Get initials or use a default
  const initials = user.user_metadata?.name
    ? user.user_metadata.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() || "U";

  // Calculate total credits used
  const totalCredits = ideas.reduce((sum, idea) => sum + (idea.credit_usage || 0), 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none rounded-full ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar>
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata?.name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Lightbulb className="mr-2 h-4 w-4" />
              <span>Ideas</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              {ideasLoading ? (
                <DropdownMenuItem disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </DropdownMenuItem>
              ) : ideas.length === 0 ? (
                <DropdownMenuItem disabled>
                  <span>No ideas yet</span>
                </DropdownMenuItem>
              ) : (
                <>
                  {ideas.slice(0, 3).map((idea) => (
                    <Link
                      key={idea.id}
                      href={
                        idea.simulations?.[0]?.id
                          ? `/run/${idea.simulations[0].id}`
                          : "#"
                      }
                      passHref
                    >
                      <DropdownMenuItem className="cursor-pointer flex items-center justify-between gap-2">
                        <span className="truncate flex-1">{idea.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ${(idea.credit_usage || 0).toFixed(3)}
                        </span>
                      </DropdownMenuItem>
                    </Link>
                  ))}
                  {ideas.length > 3 && (
                    <>
                      <DropdownMenuSeparator />
                      <Link href="/ideas" passHref>
                        <DropdownMenuItem className="cursor-pointer">
                          <LayoutGrid className="mr-2 h-4 w-4" />
                          <span>Show all ({ideas.length})</span>
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          <div className="text-xs text-muted-foreground">
            Total Credits Used
          </div>
          <div className="text-sm font-semibold text-primary">
            ${totalCredits.toFixed(4)}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
