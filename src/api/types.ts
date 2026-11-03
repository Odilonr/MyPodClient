export interface Show {
  id: string
  name: string
  description: string
  profile_img_link: string
  release_schedule: string
  studio: string
  host_name: string
  show_type: string
  // Set when a user imported this show from an RSS feed.
  owner_id?: string | null
  source_link?: string | null
  episode_count?: number
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
  audio_link?: string
  media_type?: 'audio' | 'video'
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

export interface FeedPreview {
  show: {
    name: string
    description: string
    author: string | null
    image: string | null
    link: string | null
    category: string
  }
  episodeCount: number
  episodes: { title: string, duration: number | null, publishedAt: string }[]
}

export interface FieldError {
  field: string
  message: string
}
