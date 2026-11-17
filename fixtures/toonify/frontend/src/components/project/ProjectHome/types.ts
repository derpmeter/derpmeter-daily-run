/**
 * Shared type definitions for ProjectHome components
 */

export interface Character {
  id?: string;
  name: string;
  description?: string;
  profile_image_url?: string;
  default_mood?: string | string[];
  sheet_status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface Suggestion {
  id: string;
  name: string;
  role?: string;
  theme_color?: string;
  bio?: string;
  personality?: string;
  stats?: Record<string, number>;
  visual_keywords?: string[];
  age?: string;
  personality_tags?: string[];
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  style_preset: string;
  thumbnail_url?: string;
  cover_image_status?: string | null;
  subtitle?: string;
  genre?: string;
  genre_id?: string | null;
  genres?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  worldview?: any;
  art_style?: string;
  style_reference_url?: string;
  suggestions_status?: string;
}

export interface Episode {
  id: string;
  title: string;
  episode_order?: number;
  thumbnail_url?: string;
  first_cut_image?: string;
  created_at?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ProjectHomeProps {
  project: Project;
  characters: Character[];
  episodes: Episode[];
  onProjectUpdate: (p: Project) => void;
  onCharacterAdd: (c: Character) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEpisodeAdd: (e: any) => void;
  onRefreshCharacters?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface HeroAction {
  label: string;
  Icon: React.ComponentType<{ className?: string; size?: number }> | null;
  onClick: () => void;
  variant?: 'primary' | 'magic';
  disabled?: boolean;
  description?: string;
  isLoader?: boolean;
}
