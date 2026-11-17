'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import CharacterCastingWizard from '@/components/project/CharacterCastingWizard';
import { Button } from '@/components/ui/button';

export default function CastingPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.projectId as string;
    const [project, setProject] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) {
            setLoading(false);
            return;
        }
        const fetchProject = async () => {
            try {
                const res = await api.get(`/projects/${projectId}`);
                setProject(res.data);
            } catch (err) {
                console.error("Failed to fetch project", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [projectId]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#13111C] text-white">
                Loading...
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#13111C] text-white flex-col gap-4">
                <p>Project not found.</p>
                <Button onClick={() => router.push('/dashboard')}>Go Home</Button>
            </div>
        );
    }

    return (
        <>
            <CharacterCastingWizard
                projectId={projectId}
                projectTitle={project.title}
                projectGenre={project.genre}
            />
        </>
    );
}
