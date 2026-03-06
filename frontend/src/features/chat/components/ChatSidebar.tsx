import { useMemo, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/features/mode-toggle";
import type { ChatModelOption, ChatSession } from "../types/types";
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
  isMobile?: boolean;
  models?: ChatModelOption[];
  selectedModel?: ChatModelOption;
  onSelectModel?: (modelId: string) => void;
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
  isMobile = false,
  models = [],
  selectedModel,
  onSelectModel,
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

  const showMobilePreferences = isMobile && selectedModel && onSelectModel;

  return (
    <>
      <aside
        className={cn(
          "w-70 flex h-full shrink-0 flex-col border-r transition-all duration-300",
          isMobile
            ? "border-sidebar-border bg-sidebar text-sidebar-foreground"
            : "border-sidebar-border/80 bg-sidebar/88 backdrop-blur-xl",
          className
        )}
      >
        <div className="flex h-20 items-center border-b border-sidebar-border/80 px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-2xl shadow-lg shadow-primary/20 ring-1 ring-border/60">
              <img
                src="/chatbot_icon.png"
                alt="RAG Assistant"
                className="h-full w-full scale-150 object-cover object-center"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                RAG Assistant
              </p>
              <p className="truncate text-xs text-muted-foreground">Chat about your documents!</p>
            </div>
          </div>
        </div>

        {showMobilePreferences ? (
          <div className="space-y-3 border-b border-sidebar-border/80 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                Preferences
              </span>
              <ModeToggle />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-between gap-2 border-border/80 bg-background/80 px-3 shadow-sm shadow-primary/10"
                >
                  <span className="truncate text-sm">{selectedModel.label}</span>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 max-w-[calc(85vw-2rem)]">
                <DropdownMenuLabel>Available models</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={selectedModel.id} onValueChange={onSelectModel}>
                  {models.map((model) => (
                    <DropdownMenuRadioItem key={`${model.provider}-${model.id}`} value={model.id}>
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="truncate">{model.label}</span>
                        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {model.provider}
                        </span>
                      </div>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}

        <div className="px-3 py-4 pr-5">
          <Button
            variant="outline"
            className="h-auto w-full justify-start gap-3 overflow-hidden border-border/70 bg-background py-2 pl-3 pr-2 hover:bg-muted"
            onClick={onNewChat}
            aria-label="Create new chat"
          >
            <div className="rounded-full bg-primary/12 p-1">
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
                          "group grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1 rounded-md border border-transparent transition-colors",
                          isActive
                            ? "border-primary/10 bg-primary/10"
                            : "hover:bg-accent/60"
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
                          className="mr-1 h-7 w-7 shrink-0 opacity-0 text-muted-foreground/80 transition-[opacity,color] group-hover:opacity-100 hover:bg-transparent hover:text-destructive focus-visible:opacity-100"
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

        <div className="space-y-2 border-t border-sidebar-border/80 p-4">
          <div className="flex w-full items-center px-1 py-1">
            <Avatar className="mr-3 h-7 w-7 border border-border/70 shadow-sm shadow-primary/10">
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
