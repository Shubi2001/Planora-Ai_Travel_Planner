import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Map, FileText } from "lucide-react";

const ACTIONS = [
  {
    icon: Sparkles,
    label: "Generate with AI",
    description: "Create a trip with AI",
    href: "/trips/new",
    variant: "gradient" as const,
  },
  {
    icon: Plus,
    label: "Blank Trip",
    description: "Start from scratch",
    href: "/trips/new?mode=blank",
    variant: "outline" as const,
  },
  {
    icon: Map,
    label: "Explore Destinations",
    description: "Get inspired",
    href: "/explore",
    variant: "outline" as const,
  },
  {
    icon: FileText,
    label: "Export PDF",
    description: "Download your trips",
    href: "/trips",
    variant: "outline" as const,
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ACTIONS.map((action) => (
          <Button
            key={action.label}
            asChild
            variant={action.variant}
            className="w-full justify-start gap-3 h-auto py-3"
          >
            <Link href={action.href}>
              <action.icon className="h-4 w-4 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium leading-none">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-normal">
                  {action.description}
                </p>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
