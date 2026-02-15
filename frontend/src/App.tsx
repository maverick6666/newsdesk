import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainPage from '@/pages/MainPage'
import ClusterDetailPage from '@/pages/ClusterDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/cluster/:id" element={<ClusterDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}
