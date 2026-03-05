"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  tripId: string;
  initialVotes: number;
}

export default function ShareVoteButton({ tripId, initialVotes }: Props) {
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/vote`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setVotes(data.data.voteCount);
        setVoted(data.data.voted);
      } else if (res.status === 401) {
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all",
        voted
          ? "bg-red-500/10 border-red-500/30 text-red-400"
          : "bg-card border-border text-muted-foreground hover:border-red-500/30 hover:text-red-400"
      )}
    >
      <motion.div
        animate={voted ? { scale: [1, 1.4, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart className={cn("h-4 w-4", voted && "fill-current")} />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.span
          key={votes}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="tabular-nums"
        >
          {votes}
        </motion.span>
      </AnimatePresence>
      {voted ? "Liked" : "Like"}
    </button>
  );
}
