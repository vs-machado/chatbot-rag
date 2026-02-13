import { Share, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  title: string;
}

export function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b bg-background/50 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{title}</span>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-wide">
          GPT-4
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" title="Share Chat" className="text-muted-foreground hover:text-foreground">
          <Share className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" title="Chat Details" className="text-muted-foreground hover:text-foreground">
          <Info className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
