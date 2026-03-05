import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap } from "lucide-react";
interface UsageMeterProps {
  subscription: {
    plan: string;
    status: string;
    aiCallsLimit: number;
    aiCallsUsed: number;
    tripsLimit?: number;
  } | null;
}

export function UsageMeter({ subscription }: UsageMeterProps) {
  if (!subscription) return null;

  const isUnlimited = subscription.aiCallsLimit === -1;
  const used = subscription.aiCallsUsed;
  const limit = subscription.aiCallsLimit;
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isPro = subscription.plan === "PRO";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          AI Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">This month</span>
            <span className="font-medium">
              {used} / {isUnlimited ? "∞" : limit}
            </span>
          </div>

          {!isUnlimited && (
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  percentage > 80
                    ? "bg-destructive"
                    : percentage > 50
                    ? "bg-amber-500"
                    : "bg-violet-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          )}
        </div>

        {!isPro && (
          <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 p-3 border border-indigo-100 dark:border-indigo-900">
            <p className="text-xs font-medium text-indigo-900 dark:text-indigo-100 mb-1">
              Upgrade to Pro
            </p>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-2">
              Get unlimited AI generations, collaboration, and more.
            </p>
            <Button asChild size="sm" variant="gradient" className="w-full h-7 text-xs gap-1">
              <Link href="/billing">
                <Zap className="h-3 w-3" />
                Upgrade now
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
