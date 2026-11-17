'use client';

import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SectionLabel } from '@/components/ui/section-label';
import type { Project } from './types';

interface WorldviewSectionProps {
  project: Project;
}

export function WorldviewSection({ project }: WorldviewSectionProps) {
  const t = useTranslations('Project.Home');

  if (!project.worldview?.key_features || !Array.isArray(project.worldview.key_features) || project.worldview.key_features.length === 0) {
    return null;
  }

  return (
    <section className="mb-4">
      <SectionLabel icon={<Sparkles size={12} />} className="mb-3 text-gray-400">{t('keyFeatures')}</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {project.worldview.key_features.map((feature: string, idx: number) => (
          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-[#0F0F12] border border-gray-800">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
            <span className="text-sm text-gray-300 leading-relaxed">{feature}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
