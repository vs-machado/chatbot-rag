import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Paperclip, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading?: boolean
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim())
      setMessage('')
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
    <form onSubmit={handleSubmit} className="w-full bg-gradient-to-t from-background via-background to-transparent pt-10 pb-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-background rounded-xl border shadow-xl shadow-muted/20 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all flex items-end p-2 gap-2">
           <Button
             type="button"
             variant="ghost"
             size="icon"
             className="text-muted-foreground hover:text-foreground flex-shrink-0 mb-1"
             title="Attach files"
           >
             <Paperclip className="h-5 w-5" />
           </Button>
           <textarea
             className="w-full bg-transparent border-none py-3 text-[15px] leading-relaxed text-foreground placeholder-muted-foreground focus:ring-0 focus-visible:outline-none resize-none max-h-48 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
             placeholder="Message ChatGPT..."
             rows={1}
             style={{ minHeight: "48px" }}
             value={message}
             onChange={handleChange}
             onKeyDown={handleKeyDown}
             disabled={isLoading}
           />
           <Button
             type="submit"
             className="rounded-lg shadow-md mb-1 h-9 w-9 p-0 flex-shrink-0"
             size="icon"
             disabled={!message.trim() || isLoading}
           >
             <ArrowUp className="h-5 w-5" />
           </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3 font-light">
          ChatGPT can make mistakes. Consider checking important information.
        </p>
      </div>
    </form>
  );
}
