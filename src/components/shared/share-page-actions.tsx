"use client";

import { useState } from "react";
import { Copy, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SharePageActionsProps {
  shareUrl: string;
}

export function SharePageActions({ shareUrl }: SharePageActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleCopy = async () => {
    setLoading(true);
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy");
    } finally {
      setLoading(false);
    }
  };

  const handleFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, "_blank", "width=600,height=400");
    toast.success("Opening Facebook...");
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={handleCopy} disabled={loading} className="gap-2">
        <Copy className="h-3.5 w-3.5" />
        Copy link
      </Button>
      <Button size="sm" variant="outline" onClick={handleFacebook} className="gap-2">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        Share on Facebook
      </Button>
    </div>
  );
}
