'use client';

import { AnimatePresence } from 'framer-motion';
import { useRouter } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MoveLeft, MoveRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ProcessingOverlay } from '@/components/ui/processing-overlay';

import { StepIndicator } from './StepIndicator';
import { ConceptStep, StyleStep, RoleStep } from './steps';
import { useCharacterWizard } from './hooks';
import type { CharacterCastingWizardProps, Archetype } from './types';

export default function CharacterCastingWizard({ 
  projectId, 
  projectTitle, 
  projectGenre 
}: CharacterCastingWizardProps) {
  const router = useRouter();
  const t = useTranslations('CharacterWizard');

  // Build archetypes data
  const archetypes: Archetype[] = [
    {
      id: 'protagonist',
      title: t('archetypes.protagonist.title'),
      subtitle: t('archetypes.protagonist.subtitle'),
      tags: t.raw('archetypes.protagonist.tags') as string[],
      description: t('archetypes.protagonist.description'),
      stats: { strength: 70, intelligence: 60, charisma: 85, luck: 80, empathy: 75, leadership: 80 }
    },
    {
      id: 'antagonist',
      title: t('archetypes.antagonist.title'),
      subtitle: t('archetypes.antagonist.subtitle'),
      tags: t.raw('archetypes.antagonist.tags') as string[],
      description: t('archetypes.antagonist.description'),
      stats: { strength: 85, intelligence: 90, charisma: 90, luck: 40, empathy: 20, leadership: 85 }
    },
    {
      id: 'second_lead',
      title: t('archetypes.second_lead.title'),
      subtitle: t('archetypes.second_lead.subtitle'),
      tags: t.raw('archetypes.second_lead.tags') as string[],
      description: t('archetypes.second_lead.description'),
      stats: { strength: 60, intelligence: 70, charisma: 75, luck: 50, empathy: 90, leadership: 60 }
    },
    {
      id: 'scene_stealer',
      title: t('archetypes.scene_stealer.title'),
      subtitle: t('archetypes.scene_stealer.subtitle'),
      tags: t.raw('archetypes.scene_stealer.tags') as string[],
      description: t('archetypes.scene_stealer.description'),
      stats: { strength: 40, intelligence: 50, charisma: 95, luck: 90, empathy: 60, leadership: 30 }
    }
  ];

  const {
    step,
    direction,
    name,
    setName,
    age,
    setAge,
    visualKeywords,
    setVisualKeywords,
    currentKeyword,
    setCurrentKeyword,
    themeColor,
    setThemeColor,
    personalityTypes,
    setPersonalityTypes,
    selectedRole,
    setSelectedRole,
    roleDescription,
    setRoleDescription,
    characterStats,
    setCharacterStats,
    isGenerating,
    handleNextStep,
    handlePrevStep,
    handleAddKeyword,
    handleFinalize,
    getStepNumber,
    currentArchetype,
  } = useCharacterWizard({ projectId, archetypes });

  // Step navigation handlers
  const handleConceptSubmit = () => {
    if (name.trim()) handleNextStep('style');
  };

  const handleStyleSubmit = () => {
    handleNextStep('analyzing');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 font-sans selection:bg-purple-500/30">
      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors cursor-pointer" onClick={() => router.push(`/project/${projectId}`)}>
          <MoveLeft className="w-5 h-5" />
          <span className="font-medium">{t('buttons.backToProject')}</span>
        </div>

        {/* Project Metadata Header */}
        <div className="flex flex-col items-center gap-1 justify-center">
          {projectTitle && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-lg tracking-tight">{projectTitle}</span>
              {projectGenre && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 py-0 border-white/10 bg-white/5 text-gray-400 font-normal">
                  {projectGenre}
                </Badge>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="w-full max-w-5xl relative z-10 flex flex-col gap-8 mt-16">
        {/* Title Section */}
        <div className="text-center space-y-2 mb-4">
          {step === 'concept' && (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-white/90">{t('headers.concept')}</h1>
              <p className="text-gray-500 text-sm">{t('headers.conceptDesc', { world_context: 'world_context' })}</p>
            </>
          )}
          {step === 'style' && (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-white/90">{t('headers.style')}</h1>
              <p className="text-gray-500 text-sm">{t('headers.styleDesc', { world_context: 'world_context' })}</p>
            </>
          )}
          {step === 'role' && (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-white/90">{t('headers.role')}</h1>
              <p className="text-gray-500 text-sm">{t('headers.roleDesc')}</p>
            </>
          )}
          {step === 'analyzing' && (<div className='h-16'></div>)}
        </div>

        {/* Main Card */}
        <div className="bg-[#0f0b15] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col">

          {/* Inner Content Padding */}
          <div className="p-8 pb-32 flex-1 flex flex-col">

            {step !== 'analyzing' && (
              <StepIndicator currentStep={getStepNumber(step)} totalSteps={3} />
            )}

            <div className="flex-1 flex flex-col justify-center relative">
              <AnimatePresence custom={direction} mode="wait">
                {step === 'concept' && (
                  <ConceptStep
                    name={name}
                    age={age}
                    direction={direction}
                    onNameChange={setName}
                    onAgeChange={setAge}
                  />
                )}
                {step === 'style' && (
                  <StyleStep
                    visualKeywords={visualKeywords}
                    currentKeyword={currentKeyword}
                    themeColor={themeColor}
                    personalityTypes={personalityTypes}
                    direction={direction}
                    onAddKeyword={handleAddKeyword}
                    onRemoveKeyword={(i) => setVisualKeywords(visualKeywords.filter((_, idx) => idx !== i))}
                    onCurrentKeywordChange={setCurrentKeyword}
                    onThemeColorChange={setThemeColor}
                    onPersonalityToggle={(pType) => {
                      if (personalityTypes.includes(pType)) {
                        setPersonalityTypes(personalityTypes.filter(t => t !== pType));
                      } else {
                        setPersonalityTypes([...personalityTypes, pType]);
                      }
                    }}
                  />
                )}
                {step === 'analyzing' && (
                  <ProcessingOverlay
                    isVisible={true}
                    title={t('headers.analyzing')}
                    description={t('headers.analyzingDesc', { name })}
                  />
                )}
                {step === 'role' && (
                  <RoleStep
                    archetypes={archetypes}
                    selectedRole={selectedRole}
                    roleDescription={roleDescription}
                    characterStats={characterStats}
                    age={age}
                    direction={direction}
                    onRoleSelect={(roleId, description) => {
                      setSelectedRole(roleId);
                      setRoleDescription(description);
                    }}
                    onStatsReset={() => setCharacterStats(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <ProcessingOverlay
            isVisible={isGenerating}
            title={t('toasts.createdTitle')}
            description={t('toasts.createdDesc', { name, role: currentArchetype?.title })}
          />

          {/* Footer / Actions */}
          {step !== 'analyzing' && (
            <div className="absolute bottom-0 left-0 right-0 p-8 border-t border-white/5 bg-[#0f0b15]/50 backdrop-blur-sm flex justify-between items-center">
              {/* Back Button */}
              <div>
                {step !== 'concept' && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (step === 'style') handlePrevStep('concept');
                      if (step === 'role') handlePrevStep('style');
                    }}
                    className="text-gray-400 hover:text-white hover:bg-white/5 gap-2 pl-0 hover:pl-2 transition-all"
                  >
                    <MoveLeft size={16} /> {t('buttons.back')}
                  </Button>
                )}
              </div>

              {/* Next Button */}
              <div>
                {step === 'concept' && (
                  <Button
                    onClick={handleConceptSubmit}
                    disabled={!name.trim()}
                    variant="dark"
                    size="xl"
                    className="w-32"
                  >
                    Next <MoveRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
                {step === 'style' && (
                  <Button
                    onClick={handleStyleSubmit}
                    disabled={personalityTypes.length === 0}
                    variant="glow"
                    size="xl"
                    className="w-32"
                  >
                    Next <MoveRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
                {step === 'role' && (
                  <Button
                    onClick={handleFinalize}
                    disabled={isGenerating}
                    variant="glow"
                    size="xl"
                  >
                    {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 w-4 h-4" />}
                    {t('buttons.create')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
