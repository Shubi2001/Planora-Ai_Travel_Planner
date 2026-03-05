import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AiChatPanel } from "@/components/chat/ai-chat-panel";

export const metadata: Metadata = { title: "AI Chat — Planora" };

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 md:p-6 max-w-3xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <div className="mb-4">
          <h1 className="text-xl md:text-2xl font-bold">AI Travel Assistant</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            I know your trips — ask about dates, stops, flights, or plan new ones
          </p>
        </div>
        <AiChatPanel />
      </div>
    </div>
  );
}
