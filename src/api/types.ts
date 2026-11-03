export interface Show {
  id: string
  name: string
  description: string
  profile_img_link: string
  release_schedule: string
  studio: string
  host_name: string
  show_type: string
}

export interface Episode {
  id: string
  title: string
  description: string
  date_added: string
  duration: number | null
  show_id: string
  show_name: string
  profile: string
}

export interface RecentEpisode extends Episode {
  currentplaytime: number
}

export interface Playlist {
  id: string
  name: string
  episode_count?: number
}

export interface PlaylistDetail extends Playlist {
  episodes: Episode[]
}

export interface FieldError {
  field: string
  message: string
}
