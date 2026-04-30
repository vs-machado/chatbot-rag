import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";
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
import { getUploadJobStatus } from "@/features/DocumentUpload/services/documentService";
import type { UploadJobStatusResponse } from "@/features/DocumentUpload/types";

export function Chat() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [knowledgeBaseUploads, setKnowledgeBaseUploads] = useState<UploadJobStatusResponse[]>([]);
  const [uploadFeedbackError, setUploadFeedbackError] = useState<string | null>(null);

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

  useEffect(() => {
    const activeJobs = knowledgeBaseUploads.filter(
      (job) => job.status === "queued" || job.status === "processing"
    );

    if (activeJobs.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void Promise.allSettled(activeJobs.map((job) => getUploadJobStatus(job.job_id))).then(
        (results) => {
          setKnowledgeBaseUploads((currentJobs) => {
            const updatedJobs = new Map<string, UploadJobStatusResponse>();

            results.forEach((result, index) => {
              if (result.status === "fulfilled") {
                updatedJobs.set(activeJobs[index].job_id, result.value);
              }
            });

            return currentJobs.map((job) => updatedJobs.get(job.job_id) ?? job);
          });

          const failedResult = results.find((result) => result.status === "rejected");
          if (failedResult && failedResult.status === "rejected") {
            setUploadFeedbackError(
              failedResult.reason instanceof Error
                ? failedResult.reason.message
                : "Error checking upload status"
            );
          }
        }
      );
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [knowledgeBaseUploads]);

  const uploadSummary = useMemo(() => {
    if (knowledgeBaseUploads.length === 0) {
      return null;
    }

    const totalProgress = knowledgeBaseUploads.reduce(
      (sum, job) => sum + job.progress_percentage,
      0
    );
    const completedJobs = knowledgeBaseUploads.filter((job) => job.status === "completed").length;
    const failedJobs = knowledgeBaseUploads.filter((job) => job.status === "failed").length;
    const activeJobs = knowledgeBaseUploads.filter(
      (job) => job.status === "queued" || job.status === "processing"
    ).length;

    return {
      progress: Math.round(totalProgress / knowledgeBaseUploads.length),
      completedJobs,
      failedJobs,
      activeJobs,
    };
  }, [knowledgeBaseUploads]);

  const handleKnowledgeBaseUploadStarted = (jobs: UploadJobStatusResponse[]) => {
    setUploadFeedbackError(null);
    setKnowledgeBaseUploads((currentJobs) => {
      const nextJobs = [...currentJobs];

      jobs.forEach((job) => {
        const existingIndex = nextJobs.findIndex((candidate) => candidate.job_id === job.job_id);
        if (existingIndex >= 0) {
          nextJobs[existingIndex] = job;
        } else {
          nextJobs.push(job);
        }
      });

      return nextJobs;
    });
  };

  const handleDismissUploadFeedback = () => {
    setKnowledgeBaseUploads([]);
    setUploadFeedbackError(null);
  };

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
        models={availableModels}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
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
          models={availableModels}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
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

        <div className="shrink-0 px-4 pt-4 sm:px-6 lg:px-10">
          {uploadSummary && (
            <Alert className="border-border/70 bg-card/80 backdrop-blur-sm [&>div]:col-span-2">
              <div className="flex w-full items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 gap-3">
                  {uploadSummary.activeJobs > 0 ? (
                    <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : uploadSummary.failedJobs > 0 ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  )}
                  <div className="min-w-0 flex-1 space-y-3">
                    <AlertDescription className="space-y-2 text-sm text-foreground">
                      <p>
                        {uploadSummary.activeJobs > 0
                          ? `Processing ${uploadSummary.activeJobs} knowledge base upload(s)`
                          : uploadSummary.failedJobs > 0
                            ? `Finished with ${uploadSummary.failedJobs} failed upload(s)`
                            : `Knowledge base upload complete for ${uploadSummary.completedJobs} file(s)`}
                      </p>
                      <div className="space-y-1">
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-[width] duration-500"
                            style={{ width: `${uploadSummary.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {uploadSummary.progress}% complete
                        </p>
                      </div>
                    </AlertDescription>
                    <div className="space-y-1">
                      {knowledgeBaseUploads.map((job) => (
                        <div key={job.job_id} className="flex items-center justify-between gap-3 text-xs">
                          <span className="truncate text-muted-foreground">{job.filename}</span>
                          <span className="shrink-0 text-right text-muted-foreground">
                            {job.status === "failed"
                              ? job.error || "Processing failed"
                              : `${job.progress_percentage}%`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={handleDismissUploadFeedback}
                  aria-label="Dismiss upload status"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          )}
          {uploadFeedbackError && (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>{uploadFeedbackError}</AlertDescription>
            </Alert>
          )}
        </div>

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
        onKnowledgeBaseUploadStarted={handleKnowledgeBaseUploadStarted}
        onKnowledgeBaseUploadError={setUploadFeedbackError}
      />
    </div>
  );
}
