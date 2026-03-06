import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { Paperclip, ArrowUp, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading?: boolean
  attachedDocuments?: Array<{ content: string; filename: string }>
  onClearAttachedDocuments?: () => void
  onRemoveAttachedDocument?: (index: number) => void
  onOpenDocumentUpload?: () => void
}

export function ChatInput({ 
  onSendMessage, 
  isLoading, 
  attachedDocuments = [], 
  onClearAttachedDocuments,
  onRemoveAttachedDocument,
  onOpenDocumentUpload,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim())
      setMessage('')
      // Reseta a altura do textarea após enviar a mensagem
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 192)}px`
  }

  return (
    <form onSubmit={handleSubmit} className="w-full bg-linear-to-t from-background via-background/95 to-transparent px-4 pt-10 pb-6">
      <div className="max-w-4xl mx-auto">
        {/* Documentos anexados */}
        {attachedDocuments.length > 0 && (
          <div className="mb-2 space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-muted-foreground">
                {attachedDocuments.length} file(s) attached
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={onClearAttachedDocuments}
              >
                Clear all
              </Button>
            </div>
            <ScrollArea className="h-20 rounded-xl border border-border/70 bg-card/70 p-2">
              <div className="space-y-1">
                {attachedDocuments.map((doc, index) => (
                  <div
                    key={`${doc.filename}-${index}`}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 p-1.5"
                  >
                    <FileText className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {doc.filename}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={() => onRemoveAttachedDocument?.(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        <div className="relative flex items-end gap-2 rounded-[1.4rem] border-2 border-border/60 bg-card/90 p-2 transition-all focus-within:border-primary focus-within:bg-primary/5">
           <Button
             type="button"
             variant="ghost"
             size="icon"
              className="shrink-0 self-center text-muted-foreground hover:bg-primary/10 hover:text-primary"
              title="Attach files"
              onClick={onOpenDocumentUpload}
            >
             <Paperclip className="h-5 w-5" />
           </Button>
            <textarea
               ref={textareaRef}
               className="max-h-48 w-full resize-none overflow-y-auto border-none bg-transparent py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:ring-0 focus-visible:outline-none sm:text-[15px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
               placeholder="Ask about your documents..."
              rows={1}
              style={{ minHeight: "48px" }}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <Button
              type="submit"
              className="h-9 w-9 shrink-0 self-center rounded-xl p-0 shadow-none"
              size="icon"
              disabled={!message.trim() || isLoading}
            >
             <ArrowUp className="h-5 w-5" />
           </Button>
        </div>
        <p className="mt-3 text-center text-xs font-light text-muted-foreground">
          RAG Assistant can make mistakes. Consider checking important information.
        </p>
      </div>
    </form>
  );
}
