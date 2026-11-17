'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function HowItWorksSection() {
    const t = useTranslations('Landing.HowItWorks');

    const steps = [
        {
            num: '01',
            title: t('step1Title'),
            desc: t('step1Desc'),
        },
        {
            num: '02',
            title: t('step2Title'),
            desc: t('step2Desc'),
        },
        {
            num: '03',
            title: t('step3Title'),
            desc: t('step3Desc'),
        },
    ];

    return (
        <section className="relative py-24 sm:py-48 bg-[#0a0a0a]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-12 sm:mb-24">
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                        {t('title')}
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-8 sm:gap-12 md:grid-cols-3">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={step.num}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.2 }}
                            className="relative flex flex-col items-center text-center"
                        >
                            <div className="mb-4 sm:mb-6 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-indigo-500 bg-indigo-500/10 text-lg sm:text-xl font-bold text-indigo-400">
                                {step.num}
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                                {step.title}
                            </h3>
                            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                                {step.desc}
                            </p>

                            {/* Connector Line for Desktop */}
                            {idx !== steps.length - 1 && (
                                <div className="hidden md:block absolute top-7 sm:top-8 left-1/2 w-full h-[2px] bg-gradient-to-r from-indigo-500/50 to-transparent -z-10 translate-x-[50px]" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
