import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatHeader } from "./components/ChatHeader";
import { ChatInput } from "./components/ChatInput";
import { ChatMessage } from "./components/ChatMessage";
import { ChatSidebar } from "./components/ChatSidebar";
import { CHAT_MESSAGES } from "./constants";

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function Chat() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatSidebar className="hidden md:flex" />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <ChatHeader />

        <ScrollArea className="flex-1">
          <div className="space-y-8 px-4 pt-4 pb-32 sm:px-6 lg:px-10">
            {CHAT_MESSAGES.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={TIME_FORMAT.format(message.timestamp)}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <div className="pointer-events-auto">
            <ChatInput />
          </div>
        </div>
      </main>
    </div>
  );
}
