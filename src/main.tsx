import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './components/AppShell'
import { HomePage } from './pages/HomePage'
import { PlayPage } from './pages/PlayPage'
import { LibraryPage } from './pages/LibraryPage'
import { StatsPage } from './pages/StatsPage'
import { QuizHomePage } from './pages/QuizHomePage'
import { QuizPlayPage } from './pages/QuizPlayPage'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 10_000 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="play/:puzzleId" element={<PlayPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="quiz" element={<QuizHomePage />} />
            <Route path="quiz/:sessionId" element={<QuizPlayPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
