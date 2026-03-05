"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, Plus, X, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

interface PollOption { id: string; text: string; votes: number; }
interface Poll { id: string; question: string; options: PollOption[]; myVote: string | null; createdAt: string; }

function getPolls(tripId: string): Poll[] {
  try { return JSON.parse(localStorage.getItem(`polls_${tripId}`) ?? "[]"); } catch { return []; }
}
function savePolls(tripId: string, polls: Poll[]) {
  try { localStorage.setItem(`polls_${tripId}`, JSON.stringify(polls)); } catch { /* ignore */ }
}

export default function PollsPanel({ tripId }: { tripId: string }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [creating, setCreating] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  useEffect(() => { setPolls(getPolls(tripId)); }, [tripId]);

  const createPoll = () => {
    const validOpts = options.filter((o) => o.trim());
    if (!question.trim() || validOpts.length < 2) {
      toast.error("Add a question and at least 2 options");
      return;
    }
    const poll: Poll = {
      id: Date.now().toString(),
      question: question.trim(),
      options: validOpts.map((o, i) => ({ id: `opt_${i}`, text: o.trim(), votes: 0 })),
      myVote: null,
      createdAt: new Date().toISOString(),
    };
    const updated = [poll, ...polls];
    setPolls(updated);
    savePolls(tripId, updated);
    setCreating(false);
    setQuestion("");
    setOptions(["", ""]);
    toast.success("Poll created!");
  };

  const vote = (pollId: string, optionId: string) => {
    const updated = polls.map((p) => {
      if (p.id !== pollId) return p;
      // Remove previous vote
      const unvoted = p.options.map((o) =>
        o.id === p.myVote ? { ...o, votes: Math.max(0, o.votes - 1) } : o
      );
      // Add new vote
      const voted = unvoted.map((o) =>
        o.id === optionId ? { ...o, votes: o.votes + 1 } : o
      );
      return { ...p, options: voted, myVote: p.myVote === optionId ? null : optionId };
    });
    setPolls(updated);
    savePolls(tripId, updated);
  };

  const deletePoll = (pollId: string) => {
    const updated = polls.filter((p) => p.id !== pollId);
    setPolls(updated);
    savePolls(tripId, updated);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-violet-400" /> Trip Polls
          </h3>
          <p className="text-xs text-muted-foreground">Vote on group decisions</p>
        </div>
        <Button size="sm" variant="gradient" className="gap-1.5 h-7 text-xs" onClick={() => setCreating(true)}>
          <Plus className="h-3.5 w-3.5" /> New Poll
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Create poll form */}
        <AnimatePresence>
          {creating && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border bg-card p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Create Poll</p>
                <button onClick={() => setCreating(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Input placeholder='e.g. "Which hotel should we book?"' value={question} onChange={(e) => setQuestion(e.target.value)} className="text-sm" />
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Option ${i + 1}…`}
                      value={opt}
                      onChange={(e) => setOptions((prev) => prev.map((o, j) => j === i ? e.target.value : o))}
                      className="text-sm"
                    />
                    {options.length > 2 && (
                      <button onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-red-400">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setOptions((prev) => [...prev, ""])}>
                  <Plus className="h-3 w-3" /> Add option
                </Button>
                <Button size="sm" variant="gradient" className="text-xs" onClick={createPoll}>
                  Create Poll
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Polls list */}
        {polls.length === 0 && !creating ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
            <BarChart2 className="h-8 w-8 opacity-30" />
            <p className="text-sm">No polls yet</p>
            <p className="text-xs">Create a poll to decide hotels, activities, or dates</p>
          </div>
        ) : (
          polls.map((poll) => {
            const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
            const winner = poll.options.reduce((a, b) => (a.votes > b.votes ? a : b));
            return (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{poll.question}</p>
                  <button onClick={() => deletePoll(poll.id)}
                    className="text-muted-foreground hover:text-red-400 transition-colors shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {poll.options.map((opt) => {
                    const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                    const isWinner = totalVotes > 0 && opt.id === winner.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => vote(poll.id, opt.id)}
                        className="w-full group"
                      >
                        <div className={cn(
                          "relative rounded-lg border overflow-hidden transition-all",
                          poll.myVote === opt.id
                            ? "border-violet-500/60 bg-violet-500/10"
                            : "border-input hover:border-violet-500/30 bg-muted/20"
                        )}>
                          {/* Progress bar */}
                          <div
                            className={cn("absolute inset-0 transition-all duration-500",
                              isWinner ? "bg-violet-500/10" : "bg-muted/20"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                          <div className="relative flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-2">
                              {poll.myVote === opt.id && <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />}
                              <span className="text-sm">{opt.text}</span>
                              {isWinner && totalVotes > 0 && <span className="text-[10px] text-violet-400">← leading</span>}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {pct}% ({opt.votes})
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground">{totalVotes} vote{totalVotes !== 1 ? "s" : ""} · Click to vote</p>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
