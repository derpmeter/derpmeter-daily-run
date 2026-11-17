'use client';

import { Button } from "@/components/ui/button"
import { ReactNode, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    variant?: 'default' | 'destructive';
    trigger?: ReactNode;
    icon?: ReactNode;
    verificationText?: string;
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    variant = 'default',
    trigger,
    icon,
    verificationText
}: ConfirmationDialogProps) {
    const isDestructive = variant === 'destructive';
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        if (open) setInputValue("");
    }, [open]);

    const isConfirmDisabled = verificationText ? inputValue !== verificationText : false;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="bg-[#0f0f16] border-slate-800 text-white sm:max-w-[400px] rounded-2xl p-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-20" />

                <div className="flex flex-col items-center text-center gap-4 py-2">
                    {icon || (isDestructive ? (
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2 ring-4 ring-red-500/5">
                            <AlertTriangle size={24} />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2 ring-4 ring-blue-500/5">
                            <AlertTriangle size={24} />
                        </div>
                    ))}

                    <DialogHeader className="space-y-2 w-full">
                        <DialogTitle className="text-xl font-bold tracking-tight text-white">{title}</DialogTitle>
                        <DialogDescription className="text-slate-400 text-sm leading-relaxed">
                            {description}
                        </DialogDescription>

                        {verificationText && (
                            <div className="mt-4 text-left w-full">
                                <p className="text-xs text-slate-500 mb-2 text-center">
                                    Type <span className="font-bold text-white select-all">{verificationText}</span> to confirm.
                                </p>
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={verificationText}
                                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 text-center"
                                />
                            </div>
                        )}
                    </DialogHeader>
                </div>

                <DialogFooter className="mt-6 flex flex-row gap-3 sm:justify-center">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            if (onCancel) onCancel();
                            onOpenChange(false);
                        }}
                        className="flex-1 bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all rounded-xl"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={isDestructive ? 'destructive' : 'default'}
                        onClick={() => {
                            if (!isConfirmDisabled) {
                                onConfirm();
                                onOpenChange(false);
                            }
                        }}
                        disabled={isConfirmDisabled}
                        className={`flex-1 font-bold rounded-xl shadow-lg transition-all ${isDestructive ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                            } ${isConfirmDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
