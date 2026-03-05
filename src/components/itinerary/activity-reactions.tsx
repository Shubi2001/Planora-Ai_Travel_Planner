"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, X, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatDistanceToNow } from "date-fns";

interface Comment { id: string; author: string; text: string; createdAt: string; }

// Persist votes + comments in localStorage (no DB changes needed)
function getVotes(activityId: string): { up: number; down: number; mine: "up" | "down" | null } {
  try {
    const raw = localStorage.getItem(`vote_${activityId}`);
    return raw ? JSON.parse(raw) : { up: 0, down: 0, mine: null };
  } catch { return { up: 0, down: 0, mine: null }; }
}

function saveVotes(activityId: string, votes: { up: number; down: number; mine: "up" | "down" | null }) {
  try { localStorage.setItem(`vote_${activityId}`, JSON.stringify(votes)); } catch { /* ignore */ }
}

function getComments(activityId: string): Comment[] {
  try {
    const raw = localStorage.getItem(`comments_${activityId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveComments(activityId: string, comments: Comment[]) {
  try { localStorage.setItem(`comments_${activityId}`, JSON.stringify(comments)); } catch { /* ignore */ }
}

interface Props {
  activityId: string;
  activityTitle: string;
  userName?: string;
}

export default function ActivityReactions({ activityId, activityTitle, userName = "You" }: Props) {
  const [votes, setVotes] = useState({ up: 0, down: 0, mine: null as "up" | "down" | null });
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setVotes(getVotes(activityId));
    setComments(getComments(activityId));
  }, [activityId]);

  const vote = (type: "up" | "down") => {
    setVotes((prev) => {
      let updated: typeof prev;
      if (prev.mine === type) {
        // toggle off
        updated = { ...prev, [type]: Math.max(0, prev[type] - 1), mine: null };
      } else {
        const undoPrev = prev.mine ? { [prev.mine]: Math.max(0, prev[prev.mine as "up" | "down"] - 1) } : {};
        updated = { ...prev, ...undoPrev, [type]: prev[type] + 1, mine: type };
      }
      saveVotes(activityId, updated);
      return updated;
    });
  };

  const postComment = () => {
    if (!newComment.trim()) return;
    setPosting(true);
    const comment: Comment = {
      id: Date.now().toString(),
      author: userName,
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...comments, comment];
    setComments(updated);
    saveComments(activityId, updated);
    setNewComment("");
    setTimeout(() => setPosting(false), 200);
  };

  const deleteComment = (id: string) => {
    const updated = comments.filter((c) => c.id !== id);
    setComments(updated);
    saveComments(activityId, updated);
  };

  return (
    <div className="mt-2 space-y-1">
      {/* Vote + comment toggle row */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => vote("up")}
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-all",
            votes.mine === "up"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-muted/40 text-muted-foreground hover:bg-green-500/10 hover:text-green-400"
          )}
        >
          <ThumbsUp className="h-3 w-3" />
          {votes.up > 0 && <span>{votes.up}</span>}
        </button>

        <button
          onClick={() => vote("down")}
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-all",
            votes.mine === "down"
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-muted/40 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
          )}
        >
          <ThumbsDown className="h-3 w-3" />
          {votes.down > 0 && <span>{votes.down}</span>}
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-all",
            showComments
              ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
              : "bg-muted/40 text-muted-foreground hover:bg-violet-500/10 hover:text-violet-400"
          )}
        >
          <MessageSquare className="h-3 w-3" />
          {comments.length > 0 ? comments.length : "Add note"}
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border bg-muted/20 p-3 space-y-2">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Notes on: {activityTitle}
              </p>

              {/* Existing comments */}
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2 group">
                  <div className="h-5 w-5 rounded-full bg-violet-500/30 text-violet-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                    {c.author[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] font-medium">{c.author}</span>
                      <span className="text-[9px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.text}</p>
                  </div>
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* New comment input */}
              <div className="flex gap-2 mt-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && postComment()}
                  placeholder="Add a note…"
                  className="flex-1 bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <button
                  onClick={postComment}
                  disabled={!newComment.trim() || posting}
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-violet-500 text-white disabled:opacity-40 hover:bg-violet-600 transition-colors"
                >
                  {posting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
