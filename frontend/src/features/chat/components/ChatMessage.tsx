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
    <div className={cn("mx-auto flex max-w-4xl gap-4", isUser && "flex-row-reverse")}>
      <Avatar className={cn("mt-1 h-7 w-7 ring-1 ring-border/70", !isUser && "bg-primary text-primary-foreground")}>
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

      <div className={cn("min-w-0 flex-1 space-y-2", isUser && "text-right")}>
        <div className={cn("flex items-baseline justify-between", isUser && "justify-end gap-2")}>
          {!isUser && <span className="text-sm font-semibold">Assistant</span>}
          <span className="text-xs text-muted-foreground">{timestamp}</span>
          {isUser && <span className="text-sm font-semibold">You</span>}
        </div>

        {isUser ? (
          <div className="inline-block rounded-3xl rounded-tr-sm border border-primary/15 bg-primary px-5 py-3 text-left text-primary-foreground">
            <p className="text-[15px] whitespace-pre-wrap">{content}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div
              className="max-w-none rounded-3xl rounded-tl-sm border border-border/60 bg-card/80 px-5 py-4 text-[15px] leading-relaxed text-foreground [&_p]:my-0 [&_p:not(:first-child)]:mt-3 [&_pre]:mt-3 [&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-emerald-950/70 [&_pre]:bg-emerald-950 [&_pre]:p-4 [&_code]:font-mono [&_code]:text-sm [&_pre_code]:text-emerald-50"
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
