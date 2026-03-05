"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { User, Mail, Shield, Trash2, Share2, Facebook } from "lucide-react";
import { useSocialPreferences } from "@/hooks/use-social-preferences";
import type { Session } from "next-auth";

const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
});

type SettingsInput = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  user: Session["user"];
}

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const [avatarPreview] = useState(user.image);
  const {
    facebookLoginEnabled,
    facebookShareEnabled,
    setFacebookLoginEnabled,
    setFacebookShareEnabled,
  } = useSocialPreferences();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user.name ?? "",
      email: user.email ?? "",
    },
  });

  const onSubmit = async (data: SettingsInput) => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error ?? "Update failed");
        return;
      }

      toast.success("Profile updated successfully!");
      router.refresh(); // Refresh server components to reflect new name
    } catch {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4 pb-2">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden ring-2 ring-offset-2 ring-violet-500/30">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  user.name?.[0]?.toUpperCase() ?? "U"
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.image ? "Profile picture from OAuth" : "No profile picture"}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> Full name
              </label>
              <Input
                placeholder="Your name"
                error={errors.name?.message}
                {...register("name")}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register("email")}
              />
              <p className="text-xs text-muted-foreground">
                Changing email requires re-verification.
              </p>
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!isDirty}
              className="w-full sm:w-auto"
            >
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Social & Sharing */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Share2 className="h-5 w-5 text-blue-500" />
          </div>
          <CardTitle className="text-base">Social & Sharing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="fb-login" className="text-sm font-medium flex items-center gap-2">
                <Facebook className="h-4 w-4" /> Facebook login
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Show &quot;Continue with Facebook&quot; on login and sign up pages
              </p>
            </div>
            <Switch
              id="fb-login"
              checked={facebookLoginEnabled}
              onCheckedChange={setFacebookLoginEnabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="fb-share" className="text-sm font-medium flex items-center gap-2">
                <Share2 className="h-4 w-4" /> Share to Facebook
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Show &quot;Share on Facebook&quot; when sharing trips
              </p>
            </div>
            <Switch
              id="fb-share"
              checked={facebookShareEnabled}
              onCheckedChange={setFacebookShareEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-blue-500" />
          </div>
          <CardTitle className="text-base">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user.image ? "Managed by OAuth provider" : "Last changed: unknown"}
              </p>
            </div>
            <Button variant="outline" size="sm" disabled={!!user.image}>
              Change password
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-factor authentication</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Coming soon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently delete your account and all trip data. This cannot be undone.
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
