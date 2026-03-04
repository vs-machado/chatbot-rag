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
    <form onSubmit={handleSubmit} className="w-full bg-linear-to-t from-background via-background to-transparent pt-10 pb-6 px-4">
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
            <ScrollArea className="h-20 border rounded-lg p-2 bg-muted/30">
              <div className="space-y-1">
                {attachedDocuments.map((doc, index) => (
                  <div
                    key={`${doc.filename}-${index}`}
                    className="flex items-center gap-2 p-1.5 bg-background rounded border"
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
        <div className="relative bg-background rounded-xl border shadow-xl shadow-muted/20 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all flex items-end p-2 gap-2">
           <Button
             type="button"
             variant="ghost"
             size="icon"
             className="text-muted-foreground hover:text-foreground shrink-0 mb-1"
             title="Attach files"
             onClick={onOpenDocumentUpload}
           >
             <Paperclip className="h-5 w-5" />
           </Button>
           <textarea
              ref={textareaRef}
              className="w-full bg-transparent border-none py-3 text-[15px] leading-relaxed text-foreground placeholder-muted-foreground focus:ring-0 focus-visible:outline-none resize-none max-h-48 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              placeholder="Message RAG Assistant..."
              rows={1}
              style={{ minHeight: "48px" }}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
           <Button
             type="submit"
             className="rounded-lg shadow-md mb-1 h-9 w-9 p-0 shrink-0"
             size="icon"
             disabled={!message.trim() || isLoading}
           >
             <ArrowUp className="h-5 w-5" />
           </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3 font-light">
          RAG Assistant can make mistakes. Consider checking important information.
        </p>
      </div>
    </form>
  );
}
