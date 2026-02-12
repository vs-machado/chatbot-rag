import { Routes, Route } from 'react-router'
import { Layout, HomePage, DocumentUploadPage } from '@/pages'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="documentos" element={<DocumentUploadPage />} />
      </Route>
    </Routes>
  )
}

export default App
