'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SectionLabel } from '@/components/ui/section-label';
import { SelectionCard } from '@/components/ui/selection-card';
import { RadarChart } from '@/components/ui/radar-chart';
import { useTranslations } from 'next-intl';
import { stepVariants, Archetype } from '../types';

interface RoleStepProps {
  archetypes: Archetype[];
  selectedRole: string;
  roleDescription: string;
  characterStats: Record<string, number> | null;
  age: string;
  direction: number;
  onRoleSelect: (roleId: string, description: string) => void;
  onStatsReset: () => void;
}

export function RoleStep({
  archetypes,
  selectedRole,
  roleDescription,
  characterStats,
  age,
  direction,
  onRoleSelect,
  onStatsReset,
}: RoleStepProps) {
  const tRoles = useTranslations('CharacterWizard.roles');
  
  const currentArchetype = archetypes.find(a => a.id === selectedRole) || archetypes[0];

  return (
    <motion.div
      key="role"
      custom={direction}
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex gap-6 h-full w-full px-4"
    >
      {/* Left Sidebar: Roles List */}
      <div className="w-1/3 flex flex-col gap-3 pr-2 overflow-y-auto custom-scrollbar">
        <SectionLabel className="mb-2 text-gray-500">{tRoles('selectRole')}</SectionLabel>
        {archetypes.map((arch) => (
          <SelectionCard
            key={arch.id}
            selected={selectedRole === arch.id}
            onClick={() => {
              onRoleSelect(arch.id, arch.description);
              onStatsReset();
            }}
            className="flex flex-col items-start"
          >
            <h4 className={cn("font-bold text-sm mb-2", selectedRole === arch.id ? "text-white" : "text-gray-400")}>
              {arch.title}
            </h4>
            <div className="flex gap-1.5 flex-wrap">
              {arch.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-black/40 text-[10px] px-1.5 py-0.5 text-gray-500 border border-white/5">
                  {tag}
                </Badge>
              ))}
            </div>
          </SelectionCard>
        ))}
      </div>

      {/* Right Panel: Details */}
      <div className="flex-1 bg-[#0B0d12] border border-[#2a2f3a] rounded-xl p-6 flex flex-col gap-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start z-10">
          <div>
            <div className="text-purple-400 text-xs font-mono font-bold tracking-wider mb-1">{currentArchetype.subtitle}</div>
            <h2 className="text-2xl font-bold text-white">{currentArchetype.title}</h2>
          </div>
          {age && <Badge variant="outline" className="text-gray-400 border-white/10">{age} yrs</Badge>}
        </div>

        {/* Description Box */}
        <div className="space-y-2 z-10">
          <div className="flex justify-between items-center">
            <SectionLabel className="text-gray-500">{tRoles('profile')}</SectionLabel>
          </div>
          <div className="bg-[#151921] rounded-lg p-4 text-gray-300 text-sm leading-relaxed border border-white/5 min-h-[80px]">
            {roleDescription}
          </div>
        </div>

        {/* Stats Radar Chart */}
        <div className="flex-1 flex items-center justify-center -mt-4 relative z-20">
          <RadarChart
            data={Object.entries(characterStats || currentArchetype.stats).map(([k, v]) => ({ label: k, value: (v as number) }))}
            size={220}
            color="#a855f7"
          />
        </div>

        {/* Background Decoration */}
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none"></div>
      </div>
    </motion.div>
  );
}
