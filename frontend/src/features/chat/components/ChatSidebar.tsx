import { useMemo } from "react";
import { Plus, MessageSquare, FileUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ChatSession } from "../types/types";

interface ChatSidebarProps {
  className?: string;
  sessions: ChatSession[];
  activeSessionId: string;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
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
}: ChatSidebarProps) {
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

  return (
    <aside
      className={cn(
        "w-[280px] flex-shrink-0 bg-background border-r flex flex-col h-full transition-all duration-300",
        className
      )}
    >
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 px-4 py-6 bg-background hover:bg-muted border-input shadow-sm"
          onClick={onNewChat}
        >
          <div className="bg-primary/10 p-1 rounded-full">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <span>New chat</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 pb-4">
          {visibleSections.map((section) => (
            <div key={section}>
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section}
              </h3>
              <div className="space-y-1">
                {(groupedSessions[section] ?? []).map((session) => {
                  const isActive = session.id === activeSessionId;

                  return (
                    <Button
                      key={session.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start px-3 py-2 h-auto font-normal relative group",
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                      onClick={() => onSelectSession(session.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-3 opacity-70" />
                      <span className="truncate flex-1 text-left">{session.title}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="px-4 pb-2 mt-auto">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 px-4 py-2 bg-muted/50 border-border hover:bg-muted shadow-sm"
        >
          <FileUp className="h-4 w-4 text-primary" />
          <span>Add documents</span>
        </Button>
      </div>

      <div className="p-4 border-t space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start px-2 py-6 h-auto hover:bg-muted group"
        >
          <Avatar className="h-8 w-8 mr-3 border">
            <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQD5UnORwz1VbrJnNxbbEgOuT7KMEzzr-XTaFy39tTf1L-hhpKXfvqFzRnj0xeu0OG_nlQfO2qo5ZO4TtPnXKPKJLSAS-8oMaS5BQ2cCGo5mgZ4jmKjRSU_D6C7p8P_AXUmPFqdj2-ixMPkTjSf6qaIfDiPxdVe1Yl20xRw0Qh41Pz3m0XHVsThRSFsD0EFiokVS0h83kupoOKFRS53EFEs28HjxZor73lvnbs8Yqp32jCgWTWxT3x21uyFR4NBaL46V7TBH8h" alt="User Avatar" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Alex Designer</p>
            <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        </Button>
      </div>
    </aside>
  );
}
