import { useMemo, useState } from "react";
import { Bot, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ChatSession } from "../types/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DEFAULT_USER_AVATAR_FALLBACK,
  DEFAULT_USER_AVATAR_SRC,
  DEFAULT_USER_NAME,
} from "../constants";

interface ChatSidebarProps {
  className?: string;
  sessions: ChatSession[];
  activeSessionId: string;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => Promise<void>;
}

function getSessionGroupLabel(sessionDate: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sessionDay = new Date(
    sessionDate.getFullYear(),
    sessionDate.getMonth(),
    sessionDate.getDate()
  );
  const diffInDays = Math.floor(
    (today.getTime() - sessionDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays <= 0) {
    return "Today";
  }

  if (diffInDays === 1) {
    return "Yesterday";
  }

  if (diffInDays <= 7) {
    return "Previous 7 Days";
  }

  return "Older";
}

export function ChatSidebar({
  className,
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: ChatSidebarProps) {
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const groupedSessions = useMemo(() => {
    const groups: Record<string, ChatSession[]> = {};

    sessions.forEach((session) => {
      const label = getSessionGroupLabel(session.date);
      const current = groups[label] ?? [];
      groups[label] = [...current, session];
    });

    return groups;
  }, [sessions]);

  const sectionOrder = ["Today", "Yesterday", "Previous 7 Days", "Older"];
  const visibleSections = sectionOrder.filter(
    (section) => (groupedSessions[section] ?? []).length > 0
  );

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
  };

  const confirmDelete = async () => {
    if (sessionToDelete) {
      await onDeleteSession(sessionToDelete);
      setSessionToDelete(null);
    }
  };

  const sessionToDeleteTitle = useMemo(() => {
    if (!sessionToDelete) return "";
    const session = sessions.find((s) => s.id === sessionToDelete);
    return session?.title || "";
  }, [sessionToDelete, sessions]);

  return (
    <>
      <aside
        className={cn(
          "w-70 shrink-0 bg-background border-r flex flex-col h-full transition-all duration-300",
          className
        )}
      >
        <div className="flex h-20 items-center border-b px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                RAG Assistant
              </p>
              <p className="truncate text-xs text-muted-foreground">Chat about your documents!</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 px-4 py-6 bg-background hover:bg-muted border-input shadow-sm"
            onClick={onNewChat}
            aria-label="Create new chat"
          >
            <div className="bg-primary/10 p-1 rounded-full">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <span>New chat</span>
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-6 pb-4 pr-2">
            {visibleSections.map((section) => (
              <div key={section}>
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {section}
                </h3>
                <div className="space-y-1">
                  {(groupedSessions[section] ?? []).map((session) => {
                    const isActive = session.id === activeSessionId;

                    return (
                      <div
                        key={session.id}
                        className={cn(
                          "group grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1 rounded-md",
                          isActive ? "bg-primary/10" : "hover:bg-accent"
                        )}
                      >
                        <Button
                          variant="ghost"
                          className={cn(
                            "h-auto w-full min-w-0 justify-start overflow-hidden py-2 pl-3 pr-2 font-normal",
                            isActive
                              ? "text-primary hover:text-primary hover:bg-transparent"
                              : "text-muted-foreground hover:text-accent-foreground"
                          )}
                          onClick={() => onSelectSession(session.id)}
                        >
                          <span className="block truncate text-left">{session.title}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mr-1 h-7 w-7 shrink-0 text-muted-foreground/80 transition-colors hover:bg-transparent hover:text-destructive"
                          onClick={(e) => handleDeleteClick(e, session.id)}
                          aria-label={`Delete chat session: ${session.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t space-y-2">
          <div className="flex w-full items-center px-1 py-1">
            <Avatar className="h-7 w-7 mr-3 border">
              <AvatarImage src={DEFAULT_USER_AVATAR_SRC} alt={DEFAULT_USER_NAME} />
              <AvatarFallback>{DEFAULT_USER_AVATAR_FALLBACK}</AvatarFallback>
            </Avatar>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{DEFAULT_USER_NAME}</p>
            </div>
          </div>
        </div>
      </aside>

      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the chat session &quot;{sessionToDeleteTitle}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
