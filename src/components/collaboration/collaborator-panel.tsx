"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserPlus, Crown, Edit2, Eye, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { TripCollaborator, User } from "@prisma/client";

type CollaboratorWithUser = TripCollaborator & {
  user: Pick<User, "id" | "name" | "email" | "image">;
};

interface CollaboratorPanelProps {
  tripId: string;
  collaborators: CollaboratorWithUser[];
}

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["EDITOR", "VIEWER"]),
});

type InviteInput = z.infer<typeof inviteSchema>;

const ROLE_ICONS = {
  OWNER: Crown,
  EDITOR: Edit2,
  VIEWER: Eye,
};

const ROLE_COLORS = {
  OWNER: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
  EDITOR: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  VIEWER: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200",
};

export function CollaboratorPanel({ tripId, collaborators }: CollaboratorPanelProps) {
  const [list, setList] = useState(collaborators);
  const [isInviting, setIsInviting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "VIEWER" },
  });

  const onInvite = async (data: InviteInput) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to send invite");
        return;
      }

      toast.success(`Invitation sent to ${data.email}`);
      reset();
      setIsInviting(false);
    } catch {
      toast.error("Failed to send invitation");
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await fetch(`/api/trips/${tripId}/collaborators?userId=${userId}`, {
        method: "DELETE",
      });
      setList((prev) => prev.filter((c) => c.userId !== userId));
      toast.success("Collaborator removed");
    } catch {
      toast.error("Failed to remove collaborator");
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Collaborators ({list.length})</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsInviting(true)}
          className="gap-1.5"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Invite
        </Button>
      </div>

      {/* Invite form */}
      {isInviting && (
        <div className="rounded-xl border bg-muted/50 p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Send invitation
          </h4>
          <form onSubmit={handleSubmit(onInvite as Parameters<typeof handleSubmit>[0])} className="space-y-3">
            <Input
              type="email"
              placeholder="colleague@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <div className="flex gap-2 items-center">
              <select
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm flex-1"
                {...register("role")}
              >
                <option value="EDITOR">Editor — can modify</option>
                <option value="VIEWER">Viewer — read only</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" variant="gradient" loading={isSubmitting} className="flex-1">
                Send invite
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setIsInviting(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Collaborator list */}
      <div className="space-y-2">
        {list.map((collab) => {
          const role = collab.role as keyof typeof ROLE_ICONS;
          const RoleIcon = ROLE_ICONS[role] ?? Eye;
          return (
            <div
              key={collab.id}
              className="flex items-center gap-3 rounded-xl border bg-card p-3"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {collab.user.name?.[0]?.toUpperCase() ?? collab.inviteEmail?.[0]?.toUpperCase() ?? "?"}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {collab.user.name ?? collab.inviteEmail ?? "Pending invite"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {collab.user.email ?? collab.inviteEmail}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_COLORS[role] ?? ROLE_COLORS.VIEWER}`}>
                  <RoleIcon className="h-3 w-3" />
                  {collab.role.toLowerCase()}
                </span>

                {collab.role !== "OWNER" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(collab.userId)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {list.length === 0 && !isInviting && (
        <div className="text-center py-8">
          <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No collaborators yet. Invite your travel companions!
          </p>
        </div>
      )}
    </div>
  );
}

function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
