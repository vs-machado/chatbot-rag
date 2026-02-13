import { Bot, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-4 max-w-4xl mx-auto", isUser && "flex-row-reverse")}>
      <Avatar className={cn("h-8 w-8 mt-1", !isUser && "bg-green-500")}>
        {!isUser ? (
          <AvatarFallback className="bg-transparent text-white">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzjaOl4iSy2ljx5wB4cWw0OHQqCo8fbJUElpLOgNwDg6arDpdugX_-Eauy1AUlGsxK5ubhAWvEFbYVkrojqFctmwtS3xUsn8mRqnrfYmdpkun04kKbo-SskoXR4kxUCI1OfZuW2VrIUbxXCD7CgoEsXEffin81wn8jjH9iH-nnc9EZrfZH59TOXGeRHo7UBDYBkrhwxhlHgmsqj54bBpL3aQRcVx8u-pG342pX9IWOaSCsJgyNl_QweM2izthL34crWLwpBj4C" />
            <AvatarFallback>Me</AvatarFallback>
          </>
        )}
      </Avatar>

      <div className={cn("flex-1 space-y-2 min-w-0", isUser && "text-right")}>
        <div className={cn("flex items-baseline justify-between", isUser && "justify-end gap-2")}>
          {!isUser && <span className="text-sm font-semibold">Assistant</span>}
          <span className="text-xs text-muted-foreground">{timestamp}</span>
          {isUser && <span className="text-sm font-semibold">You</span>}
        </div>

        {isUser ? (
          <div className="inline-block bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-5 py-3 text-left shadow-lg shadow-primary/20">
            <p className="text-[15px] whitespace-pre-wrap">{content}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div
              className="max-w-none text-foreground text-[15px] leading-relaxed [&_p]:my-0 [&_p:not(:first-child)]:mt-3 [&_pre]:mt-3 [&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-slate-700 [&_pre]:bg-slate-950 [&_pre]:p-4 [&_code]:font-mono [&_code]:text-sm [&_pre_code]:text-slate-100"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            <div className="flex items-center gap-2 pt-1">
              <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-foreground text-xs gap-1">
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
