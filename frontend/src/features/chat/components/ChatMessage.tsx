import { useState } from "react";
import { Bot, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DEFAULT_USER_AVATAR_FALLBACK,
  DEFAULT_USER_AVATAR_SRC,
} from "../constants";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // TODO: Adicionar sanitização de HTML para remover tags ao copiar
      // O conteúdo atual pode conter elementos HTML que aparecem no texto copiado
      await navigator.clipboard.writeText(content);
      setCopied(true);
      // Reseta o estado após 2 segundos
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar para a área de transferência:", err);
    }
  };

  return (
    <div className={cn("flex gap-4 max-w-4xl mx-auto", isUser && "flex-row-reverse")}>
      <Avatar className={cn("h-7 w-7 mt-1", !isUser && "bg-green-500")}>
        {!isUser ? (
          <AvatarFallback className="bg-transparent text-white">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage src={DEFAULT_USER_AVATAR_SRC} alt="Default User" />
            <AvatarFallback>{DEFAULT_USER_AVATAR_FALLBACK}</AvatarFallback>
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
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-7 text-xs gap-1 transition-colors",
                  copied 
                    ? "text-green-600 hover:text-green-700" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
