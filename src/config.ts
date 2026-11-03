const apiUrl = import.meta.env.VITE_API_URL as string | undefined

if (!apiUrl) {
  throw new Error('VITE_API_URL is not set. Copy .env.example to .env and set it.')
}

export const API_URL = apiUrl.replace(/\/$/, '')

export const uploadsEnabled = () => import.meta.env.VITE_UPLOADS_ENABLED === 'true'
