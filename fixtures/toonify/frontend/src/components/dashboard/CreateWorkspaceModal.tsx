import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useTranslations } from 'next-intl';

interface CreateWorkspaceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateWorkspaceModal({ open, onOpenChange }: CreateWorkspaceModalProps) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const { createWorkspace } = useWorkspaceStore();
    const t = useTranslations('CreateWorkspace');
    const tCommon = useTranslations('Common');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setLoading(true);
            await createWorkspace(name);
            onOpenChange(false);
            setName('');
        } catch (error) {
            console.error('Failed to create workspace', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{t('title')}</DialogTitle>
                        <DialogDescription>
                            {t('description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('nameLabel')}</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('namePlaceholder')}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {tCommon('cancel')}
                        </Button>
                        <Button type="submit" disabled={!name.trim() || loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
