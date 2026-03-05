"use client";

import { useState } from "react";
import { Share2, Copy, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSocialPreferences } from "@/hooks/use-social-preferences";

interface ShareTripMenuProps {
  tripId: string;
  tripTitle: string;
  destination: string;
  variant?: "button" | "icon";
  className?: string;
}

export function ShareTripMenu({
  tripId,
  tripTitle,
  destination,
  variant = "icon",
  className,
}: ShareTripMenuProps) {
  const { facebookShareEnabled } = useSocialPreferences();
  const [loading, setLoading] = useState(false);

  const getShareUrl = async (): Promise<string | null> => {
    try {
      const res = await fetch(`/api/trips/${tripId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: true }),
      });
      const json = await res.json();
      return json.data?.shareUrl ?? null;
    } catch {
      return null;
    }
  };

  const handleCopyLink = async () => {
    setLoading(true);
    try {
      const url = await getShareUrl();
      if (url) {
        await navigator.clipboard.writeText(url);
        toast.success("Share link copied!");
      } else {
        toast.error("Failed to create share link");
      }
    } catch {
      toast.error("Failed to copy link");
    } finally {
      setLoading(false);
    }
  };

  const handleShareFacebook = async () => {
    setLoading(true);
    try {
      const url = await getShareUrl();
      if (url) {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(fbUrl, "_blank", "width=600,height=400,scrollbars=yes");
        toast.success("Opening Facebook share...");
      } else {
        toast.error("Failed to create share link");
      }
    } catch {
      toast.error("Failed to share on Facebook");
    } finally {
      setLoading(false);
    }
  };

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      title="Share"
      disabled={loading}
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleCopyLink} disabled={loading}>
          <Copy className="h-4 w-4 mr-2" />
          Copy share link
        </DropdownMenuItem>
        {facebookShareEnabled && (
          <DropdownMenuItem onClick={handleShareFacebook} disabled={loading}>
            <Facebook className="h-4 w-4 mr-2" />
            Share on Facebook
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
