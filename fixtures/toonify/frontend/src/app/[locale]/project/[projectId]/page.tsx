'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import ProjectHome from '@/components/project/ProjectHome';
import { Character } from '@/components/project/CharacterCard';

interface Project {
    id: string;
    title: string;
    description?: string;
    style_preset: string;
    thumbnail_url?: string;
    genre_id?: string | null;
}

export default function ProjectPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params?.projectId as string;
    const [project, setProject] = useState<Project | null>(null);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [episodes, setEpisodes] = useState<any[]>([]); // Define Episode type properly if possible
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!projectId) return;

            try {
                // Fetch project details
                const projectRes = await api.get(`/projects/${projectId}`);
                setProject(projectRes.data);

                // Fetch characters
                try {
                    const charactersRes = await api.get(`/characters/?project_id=${projectId}`);
                    setCharacters(charactersRes.data);
                } catch (charErr) {
                    console.warn("Failed to fetch characters", charErr);
                    setCharacters([]);
                }

                // Fetch episodes
                try {
                    const episodesRes = await api.get(`/episodes/?project_id=${projectId}`);
                    setEpisodes(episodesRes.data);
                } catch (epErr) {
                    console.warn("Failed to fetch episodes", epErr);
                    setEpisodes([]);
                }

            } catch (err: any) {
                console.error("Failed to fetch project data", err);
                const msg = err.response?.data?.detail || err.message || "Failed to load project";
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId]);

    const handleProjectUpdate = (updatedProject: Project) => {
        setProject(updatedProject);
    };

    const handleCharacterAdd = (newCharacter: Character) => {
        setCharacters([...characters, newCharacter]);
    };

    const handleEpisodeAdd = (newEpisode: any) => {
        setEpisodes([...episodes, newEpisode]);
        // Redirect to editor using router for SPA navigation
        router.push(`/project/${projectId}/editor?episode_id=${newEpisode.id}`);
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark text-gray-900 dark:text-white">
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark text-red-500">
                <h1 className="text-2xl font-bold mb-2">Error Loading Project</h1>
                <p>{error}</p>
                <div className="mt-4 text-xs text-gray-500 font-mono text-left max-w-lg overflow-auto p-4 bg-gray-100 rounded">
                    DEBUG INFO: Project ID {projectId} <br />
                    Check console for details.
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark text-gray-900 dark:text-white">
                Project not found.
            </div>
        );
    }

    const refetchCharacters = async () => {
        try {
            const charactersRes = await api.get(`/characters/?project_id=${projectId}`);
            setCharacters(charactersRes.data);
        } catch (charErr) {
            console.warn("Failed to refetch characters", charErr);
        }
    };

    return (
        <ProjectHome
            project={project}
            characters={characters}
            episodes={episodes}
            onProjectUpdate={handleProjectUpdate}
            onCharacterAdd={handleCharacterAdd}
            onEpisodeAdd={handleEpisodeAdd}
            onRefreshCharacters={refetchCharacters}
        />
    );
}
