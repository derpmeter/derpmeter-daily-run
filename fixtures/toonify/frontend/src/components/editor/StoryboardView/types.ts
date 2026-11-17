/**
 * Shared type definitions for StoryboardView components
 */

export interface StoryCut {
  id: string;
  cut_order: number;
  script: string;
  aspect_ratio: string;
  image_path?: string;
  dialogues: unknown[];
  appearing_characters?: string[];
  status?: string;
}

export interface DirectorOption {
  id: string;
  label: string;
  description: string;
  aspect_ratio: string;
  image_prompt: string;
}

export interface StoryboardViewProps {
  projectId: string;
  episodeId?: string;
}
