import { ALLOWED_TYPES, MAX_FILE_SIZE } from '../config'

interface DropZoneProps {
  isDragging: boolean
  selectedFile: File | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onClick: () => void
}

export function DropZone({
  isDragging,
  selectedFile,
  fileInputRef,
  onInputChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
}: DropZoneProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors duration-200
        ${isDragging 
          ? 'border-primary bg-primary/5' 
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={onInputChange}
        className="hidden"
      />
      
      <div className="space-y-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto text-muted-foreground"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
        
        <div className="text-sm text-muted-foreground">
          {selectedFile ? (
            <span className="font-medium text-foreground">{selectedFile.name}</span>
          ) : (
            <>
              <span className="font-medium text-foreground">Clique para selecionar</span>
              {' '}ou arraste e solte
            </>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          PDF, DOCX ou TXT até {MAX_FILE_SIZE / 1024 / 1024}MB
        </div>
      </div>
    </div>
  )
}
