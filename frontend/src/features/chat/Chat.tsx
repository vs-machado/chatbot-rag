import { useEffect, useRef } from "react";
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

  // Ref para o container de mensagens para auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem quando mensagens mudam ou loading muda
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, isLoading]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatSidebar
        className="hidden md:flex"
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ChatHeader title={activeSession?.title ?? NEW_CHAT_TITLE} />

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-8 px-4 pt-4 pb-4 sm:px-6 lg:px-10">
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
            {/* Elemento âncora para auto-scroll */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        </div>

        <div className="flex-shrink-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
