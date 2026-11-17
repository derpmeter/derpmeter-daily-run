'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Plus } from 'lucide-react';

interface Template {
    id: string;
    title: string;
    description: string;
    style_preset: string;
    category: string;
    is_premium: boolean;
    image_url?: string; // Assume backend provides this or we use placeholder
}

export default function TemplateList({ onSelect }: { onSelect: (template: Template | null) => void }) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/templates');
            setTemplates(res.data);
        } catch (err) {
            console.error(err);
            // Fallback mock data if API fails or is empty for demo
            setTemplates([
                { id: '1', title: '4-Cut Webtoon', description: 'Short, shareable comic strips', style_preset: 'webtoon_4cut', category: 'General', is_premium: false },
                { id: '2', title: 'Instagram Story Toon', description: 'Optimized for vertical stories', style_preset: 'insta_toon', category: 'Social', is_premium: false },
                { id: '3', title: 'Vertical Scroll Episode', description: 'Classic long-form format', style_preset: 'vertical_scroll', category: 'Webtoon', is_premium: true },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleStartScratch = () => {
        onSelect(null); // Null implies scratch
    };

    if (loading) return <div>Loading templates...</div>;

    // Placeholders for demo visuals if image_url missing
    const getPlaceholder = (id: string) => {
        const placeholders = [
            "https://lh3.googleusercontent.com/aida-public/AB6AXuC5unUUBklmleZaINqKPihiMZABdrDFVaalD2Xr5_WK6qMhp429XJ6mTMmx43i5lJHLJsvZ6nMWeafFmiuN4T_0T6T4Dzod9VBNG52SSa4f-8eU2lSiQnb7kYWMi_yH3yzZ9gOO-Y78kV25BagaLAtlZoq8XKid_1s4B1qXV-XBXmREmelhMI2TFbhphgwH6H1VrYO9_ARV_CqqfvhKmaNSggqe3T1fi_OCGhqBRSrsvkjq_yVQyZHldwKef6E96OTm5IwybcWbmeA",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAd6YB98qgZSeKLbb0R9jo9kKtqYuijNs0wSJjmPCUTqWCitmEO-lZqyIrRfj1sV0UEwj6afnvIHxkCYwXSHKff_mMU0fF0bJsoIsBEqACS-H7KcEeHjIzZ68XOVjKyUwQxY3fJUWs5lRboKsfH8DWiY68kEI1nEAOmgskN8POzb1Xo0q_fjiINIYAmn7qTo1JQsV-4PnQxSFsf3Xr-heSV1yVUx_51Yhu2AMHiJiyT3CTkxCmPUhZQBzcGTV8E1P7OpppDlQaqRak",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuArRgh4FppyC7ycoSM423Ewa5EFKujgv9fmaJGbvnRO-SQJT76GZ6BO9Eu4vT7UlyfhhzEHn_sCEHyvQ6SMWltpm18GHqrGDul59FGDjw3upIpo1aPlWg55zKTMIfz5HgAtr1RbckI9_XRvEGMq9eSQ0kR3JG-Fgyt7QZ6LpQDC14Zwap1NIK9zmB0JpsPpkJzAzH2bKt-8nxzIJtoYvDqOJYPRiynfxjonQ2nvzW7AU499qlSof4utONlzOh3D0f_eAhuyFT79brQ"
        ];
        return placeholders[parseInt(id) % placeholders.length] || placeholders[0];
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Start from Scratch Card */}
            <div
                onClick={handleStartScratch}
                className="flex flex-col items-center justify-center p-6 gap-4 border-2 border-dashed border-gray-800 dark:border-gray-800 rounded-xl bg-[#0F0F12] dark:bg-[#0F0F12] hover:border-primary hover:bg-[#15151A] dark:hover:bg-[#15151A] cursor-pointer transition-colors h-full min-h-[220px]"
            >
                <div className="flex items-center justify-center size-16 bg-primary/20 dark:bg-primary/30 text-primary rounded-full mb-1">
                    <Plus size={32} />
                </div>
                <div className="text-center">
                    <p className="text-gray-900 dark:text-white text-base font-semibold leading-normal">Start from Scratch</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">Begin with a blank canvas</p>
                </div>
            </div>

            {/* Template Cards */}
            {templates.map((template, idx) => (
                <div
                    key={template.id}
                    onClick={() => onSelect(template)}
                    className="group cursor-pointer flex flex-col h-full"
                >
                    <div className="overflow-hidden rounded-xl mb-3 flex-1 min-h-[160px]">
                        <img
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            src={template.image_url || getPlaceholder(template.id)}
                            alt={template.title}
                        />
                    </div>
                    <div>
                        <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">{template.title}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal line-clamp-2">{template.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
