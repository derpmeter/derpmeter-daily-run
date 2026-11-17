'use client';

import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { SectionLabel } from '@/components/ui/section-label';
import { useTranslations } from 'next-intl';
import { stepVariants } from '../types';

interface ConceptStepProps {
  name: string;
  age: string;
  direction: number;
  onNameChange: (value: string) => void;
  onAgeChange: (value: string) => void;
}

export function ConceptStep({
  name,
  age,
  direction,
  onNameChange,
  onAgeChange,
}: ConceptStepProps) {
  const t = useTranslations('CharacterWizard');

  return (
    <motion.div
      key="concept"
      custom={direction}
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col gap-8 py-4 px-12"
    >
      <div className="space-y-6 max-w-md mx-auto w-full">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <SectionLabel className="text-[#d8b4fe]">{t('inputs.nameLabel')}</SectionLabel>
          </div>
        </div>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t('inputs.namePlaceholder')}
          size="xl"
          className="text-center"
          autoFocus
        />
      </div>

      <div className="space-y-6 max-w-md mx-auto w-full">
        <div className="space-y-3">
          <SectionLabel className="text-[#d8b4fe]">{t('inputs.ageLabel')}</SectionLabel>
          <Input
            value={age}
            onChange={(e) => onAgeChange(e.target.value)}
            placeholder={t('inputs.agePlaceholder')}
            size="xl"
            className="text-center"
          />
        </div>
      </div>
    </motion.div>
  );
}
