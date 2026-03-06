import { ChevronDown, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ModeToggle } from '@/features/mode-toggle'
import type { ChatModelOption } from '../types/types'

interface ChatHeaderProps {
  title: string
  models: ChatModelOption[]
  selectedModel: ChatModelOption
  onSelectModel: (modelId: string) => void
  onOpenSidebar: () => void
}

export function ChatHeader({
  title,
  models,
  selectedModel,
  onSelectModel,
  onOpenSidebar,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-border/70 bg-background/72 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenSidebar}
          aria-label="Open chat sidebar"
        >
          <Menu className="h-6 w-6" strokeWidth={2.5} />
        </Button>

        <span className="block truncate text-base font-semibold tracking-tight text-foreground">{title}</span>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 max-w-48 gap-2 border-border/80 bg-card/80 px-3 shadow-sm shadow-primary/10">
              <span className="truncate text-xs sm:text-sm">{selectedModel.label}</span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
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
    </header>
  )
}
