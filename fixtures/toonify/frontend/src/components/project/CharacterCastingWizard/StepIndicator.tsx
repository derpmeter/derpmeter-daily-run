'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const stepKeys = ['concept', 'style', 'role'] as const;

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const t = useTranslations('CharacterWizard.steps');

  return (
    <div className="w-full relative mb-8 px-4 flex justify-center">
      <div className="relative w-full max-w-lg">
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10 -translate-y-1/2 z-0"></div>
        <motion.div
          className="absolute top-1/2 left-0 h-[1px] bg-primary -translate-y-1/2 z-1 shadow-[0_0_10px_rgba(55,19,236,0.6)]"
          initial={{ width: '0%' }}
          animate={{ width: `${Math.max(0, ((currentStep - 1) / (totalSteps - 1))) * 100}%` }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex justify-between w-full">
          {stepKeys.map((key, index) => {
            const stepNum = index + 1;
            const isActive = stepNum <= currentStep;
            const isCurrent = stepNum === currentStep;
            const label = t(key).toUpperCase();

            return (
              <div key={index} className="flex flex-col items-center gap-3 relative group cursor-default">
                <div
                  className={cn(
                    "w-4 h-4 rounded-full transition-all duration-300 border-2 box-content",
                    isActive ? "bg-primary border-primary shadow-[0_0_10px_rgba(168,85,247,0.8)]" : "bg-[#0f0a1e] border-white/20",
                    isCurrent && "ring-4 ring-primary/20 bg-primary border-white"
                  )}
                ></div>
                <span className={cn(
                  "text-[10px] uppercase tracking-widest font-bold transition-all duration-300 absolute top-8 w-24 text-center select-none",
                  isActive ? "text-purple-300/90" : "text-gray-600"
                )}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
