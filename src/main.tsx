import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/instrument-sans'
import '@/styles/globals.css'
import { AuthProvider } from '@/auth/AuthContext'
import { AppLayout } from '@/components/AppLayout'
import { LibraryProvider } from '@/library/LibraryContext'
import { AddPodcastPage } from '@/pages/AddPodcastPage'
import { BrowsePage } from '@/pages/BrowsePage'
import { FavoritesPage } from '@/pages/FavoritesPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaylistPage } from '@/pages/PlaylistPage'
import { PlaylistsPage } from '@/pages/PlaylistsPage'
import { ShowPage } from '@/pages/ShowPage'
import { PlayerProvider } from '@/player/PlayerContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LibraryProvider>
          <PlayerProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="browse" element={<BrowsePage />} />
                <Route path="add" element={<AddPodcastPage />} />
                <Route path="favorites" element={<FavoritesPage />} />
                <Route path="playlists" element={<PlaylistsPage />} />
                <Route path="playlists/:id" element={<PlaylistPage />} />
                <Route path="shows/:id" element={<ShowPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </PlayerProvider>
        </LibraryProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
