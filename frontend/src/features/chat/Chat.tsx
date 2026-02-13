import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatHeader } from "./components/ChatHeader";
import { ChatInput } from "./components/ChatInput";
import { ChatMessage } from "./components/ChatMessage";
import { ChatSidebar } from "./components/ChatSidebar";
import { useChat } from "./hooks/useChat";
import { NEW_CHAT_TITLE } from "./constants";

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function Chat() {
  const {
    sessions,
    activeSessionId,
    activeSession,
    activeMessages,
    isLoading,
    error,
    handleSelectSession,
    handleNewChat,
    handleSendMessage,
  } = useChat();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatSidebar
        className="hidden md:flex"
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <ChatHeader title={activeSession?.title ?? NEW_CHAT_TITLE} />

        <ScrollArea className="flex-1">
          <div className="space-y-8 px-4 pt-4 pb-32 sm:px-6 lg:px-10">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {activeMessages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={TIME_FORMAT.format(message.timestamp)}
              />
            ))}
            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-100"></div>
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <div className="pointer-events-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
