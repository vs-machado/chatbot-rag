import { Plus, MessageSquare, Trash2, FileUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  className?: string;
}

export function ChatSidebar({ className }: ChatSidebarProps) {
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
        >
          <div className="bg-primary/10 p-1 rounded-full">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <span>New chat</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 pb-4">
          <div>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Today
            </h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-2 h-auto font-normal bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary relative group"
              >
                <MessageSquare className="h-4 w-4 mr-3 opacity-70" />
                <span className="truncate flex-1 text-left">Python Web Scraper</span>
                <Trash2 className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ml-2" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-2 h-auto font-normal hover:bg-muted text-muted-foreground relative group"
              >
                <MessageSquare className="h-4 w-4 mr-3 opacity-70" />
                <span className="truncate flex-1 text-left">React Component Ideas</span>
              </Button>
            </div>
          </div>

          <div>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Yesterday
            </h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-2 h-auto font-normal hover:bg-muted text-muted-foreground relative group"
              >
                <MessageSquare className="h-4 w-4 mr-3 opacity-70" />
                <span className="truncate flex-1 text-left">Debugging Dockerfile</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-2 h-auto font-normal hover:bg-muted text-muted-foreground relative group"
              >
                <MessageSquare className="h-4 w-4 mr-3 opacity-70" />
                <span className="truncate flex-1 text-left">Marketing Copy Drafts</span>
              </Button>
            </div>
          </div>

          <div>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Previous 7 Days
            </h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-2 h-auto font-normal hover:bg-muted text-muted-foreground relative group"
              >
                <MessageSquare className="h-4 w-4 mr-3 opacity-70" />
                <span className="truncate flex-1 text-left">SQL Query Optimization</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-2 h-auto font-normal hover:bg-muted text-muted-foreground relative group"
              >
                <MessageSquare className="h-4 w-4 mr-3 opacity-70" />
                <span className="truncate flex-1 text-left">Gift Ideas for Mom</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-2 h-auto font-normal hover:bg-muted text-muted-foreground relative group"
              >
                <MessageSquare className="h-4 w-4 mr-3 opacity-70" />
                <span className="truncate flex-1 text-left">Explain Quantum Physics</span>
              </Button>
            </div>
          </div>
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
