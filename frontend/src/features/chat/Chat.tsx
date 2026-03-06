import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatHeader } from "./components/ChatHeader";
import { ChatInput } from "./components/ChatInput";
import { ChatMessage } from "./components/ChatMessage";
import { ChatSidebar } from "./components/ChatSidebar";
import { DocumentUploadDialog } from "./components/DocumentUploadDialog";
import { useChat } from "./hooks/useChat";
import { NEW_CHAT_TITLE } from "./constants";
import { formatTime } from "@/lib/time";

export function Chat() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const {
    sessions,
    activeSessionId,
    activeSession,
    activeMessages,
    availableModels,
    selectedModel,
    isLoading,
    error,
    attachedDocuments,
    handleSelectSession,
    handleSelectModel,
    handleNewChat,
    handleSendMessage,
    handleDeleteSession,
    handleAttachDocuments,
    handleClearAttachedDocuments,
    handleRemoveAttachedDocument,
  } = useChat();

  // Ref para o container de mensagens para auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem quando mensagens mudam ou loading muda
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, isLoading]);

  const handleOpenMobileSidebar = () => setMobileSidebarOpen(true);

  const handleCloseMobileSidebar = () => setMobileSidebarOpen(false);

  const handleSelectSessionWithClose = (sessionId: string) => {
    handleSelectSession(sessionId);
    handleCloseMobileSidebar();
  };

  const handleNewChatWithClose = () => {
    handleNewChat();
    handleCloseMobileSidebar();
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <ChatSidebar
        className="hidden md:flex"
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      <div
        className={`fixed inset-y-0 right-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          mobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ left: "min(20rem, 85vw)" }}
        onClick={handleCloseMobileSidebar}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[min(20rem,85vw)] transition-transform duration-300 md:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute right-3 top-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleCloseMobileSidebar}
            aria-label="Close chat sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ChatSidebar
          className="flex w-full"
          isMobile
          sessions={sessions}
          activeSessionId={activeSessionId}
          onNewChat={handleNewChatWithClose}
          onSelectSession={handleSelectSessionWithClose}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <ChatHeader
          title={activeSession?.title ?? NEW_CHAT_TITLE}
          models={availableModels}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          onOpenSidebar={handleOpenMobileSidebar}
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-8 px-4 pt-6 pb-4 sm:px-6 lg:px-10">
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
                 timestamp={formatTime(message.timestamp)}
                  responseSource={message.responseSource}
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

        <div className="shrink-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            attachedDocuments={attachedDocuments}
            onClearAttachedDocuments={handleClearAttachedDocuments}
            onRemoveAttachedDocument={handleRemoveAttachedDocument}
            onOpenDocumentUpload={() => setUploadDialogOpen(true)}
          />
        </div>
      </main>

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onDocumentsProcessed={handleAttachDocuments}
      />
    </div>
  );
}
