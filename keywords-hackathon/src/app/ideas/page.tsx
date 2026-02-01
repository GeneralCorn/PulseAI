"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Trash2, ExternalLink, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LandingBackground } from "@/components/landing/LandingBackground";

interface IdeaWithDetails {
  id: string;
  title: string;
  description: string;
  created_at: string;
  credit_usage: number;
  simulations: { id: string }[];
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<IdeaWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/");
      return;
    }

    const { data, error } = await supabase
      .from("ideas")
      .select(
        `
        id,
        title,
        description,
        created_at,
        credit_usage,
        simulations (
          id
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setIdeas(data as unknown as IdeaWithDetails[]);
    }
    setLoading(false);
  };

  const handleDeleteClick = (ideaId: string) => {
    setIdeaToDelete(ideaId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ideaToDelete) return;

    setDeleting(true);
    const { error } = await supabase.from("ideas").delete().eq("id", ideaToDelete);

    if (!error) {
      setIdeas(ideas.filter((idea) => idea.id !== ideaToDelete));
    } else {
      console.error("Failed to delete idea:", error);
    }

    setDeleting(false);
    setDeleteDialogOpen(false);
    setIdeaToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <LandingBackground />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <LandingBackground />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Your Ideas
            <span className="ml-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
              Portfolio
            </span>
          </h1>
          <p className="text-muted-foreground">
            Manage all your simulated ideas and their results
          </p>
        </motion.div>

        {/* Ideas Grid */}
        {ideas.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-background/20 backdrop-blur-xl border-white/10 shadow-2xl ring-1 ring-white/10">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground text-center mb-4">
                  No ideas yet. Create your first simulation to get started!
                </p>
                <Link href="/">
                  <Button className="bg-zinc-800 hover:bg-zinc-700 text-white">
                    Create New Idea
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea, index) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-background/20 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300 shadow-xl ring-1 ring-white/5 hover:ring-white/10 h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-foreground text-lg line-clamp-2">
                      {idea.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      {formatDate(idea.created_at)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-1">
                      {idea.description}
                    </p>

                    <div className="flex items-center justify-between mb-4 px-3 py-2 bg-background/50 rounded-lg border border-border/50">
                      <div className="text-xs text-muted-foreground">
                        Credit usage
                      </div>
                      <div className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                        ${(idea.credit_usage || 0).toFixed(4)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {idea.simulations?.[0]?.id ? (
                        <Link
                          href={`/run/${idea.simulations[0].id}`}
                          className="flex-1"
                        >
                          <Button
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
                            size="sm"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          className="flex-1"
                          size="sm"
                          disabled
                          variant="outline"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          No simulation
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleDeleteClick(idea.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-700 border-red-500/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-white/20 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Idea
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this idea? This will also delete all
              associated simulations and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-background/50 text-foreground hover:bg-background/80 border-border"
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
