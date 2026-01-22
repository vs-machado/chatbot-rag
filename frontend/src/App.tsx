import DocumentUpload from '@/components/DocumentUpload'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-background p-8 font-sans antialiased">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Chatbot RAG Admin</h1>
          <p className="text-muted-foreground">Gerencie a base de conhecimento do seu chatbot</p>
        </div>
        
        <DocumentUpload />
      </div>
    </div>
  )
}

export default App
