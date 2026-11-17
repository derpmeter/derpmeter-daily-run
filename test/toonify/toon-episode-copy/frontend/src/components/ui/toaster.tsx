'use client';

import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

// Global event emmiter for toast to work outside of components if needed, 
// but primarily we will use a Context or a simple global state if we want strictly hook based.
// For now, let's stick to a simple custom hook implementation that we can simply import and use 
// paired with a Toaster component that listens to a global store or custom event.
// Actually, to make "useToast" work anywhere, it usually needs a Context provider or a global store.
// Let's implement a simple event-based system for simplicity to avoid wrapping everything in a new Context 
// if we don't strictly need to, OR we can use the standard one if the user prefers.
// Given strict "Use standardized UI elements", a proper Context based solution is better.

// Re-writing use-toast.ts to be a real hook with event emitter to avoid Context nesting hell if possible,
// or just standard context. Let's go with a simple custom event based approach for "toast()" to be importable anywhere.

const TOAST_EVENT = 'toast-event';

type ToastProps = { title?: string; description?: string; variant?: 'default' | 'destructive'; action?: { label: string; onClick: () => void } };

export function toast(props: ToastProps) {
    const event = new CustomEvent(TOAST_EVENT, { detail: props });
    window.dispatchEvent(event);
}

export function Toaster() {
    const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

    useEffect(() => {
        const handleToast = (event: Event) => {
            const customEvent = event as CustomEvent;
            const id = Math.random().toString(36).substr(2, 9);
            setToasts((prev) => [...prev, { id, ...customEvent.detail }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 5000); // 5 seconds duration
        };

        window.addEventListener(TOAST_EVENT, handleToast);
        return () => window.removeEventListener(TOAST_EVENT, handleToast);
    }, []);

    return (
        <div className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 max-w-[420px] w-full">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={cn(
                        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
                        t.variant === 'destructive'
                            ? "destructive group border-red-900 bg-red-950 text-red-50"
                            : "border-gray-800 bg-gray-950 text-gray-50 bg-opacity-95 backdrop-blur-sm"
                    )}
                >
                    <div className="grid gap-1">
                        {t.title && <div className={cn("text-sm font-semibold", t.variant === 'destructive' && "text-red-200")}>{t.title}</div>}
                        {t.description && <div className={cn("text-sm opacity-90", t.variant === 'destructive' && "text-red-300")}>{t.description}</div>}
                    </div>
                    {t.action && (
                        <button
                            onClick={() => { t.action?.onClick(); setToasts((prev) => prev.filter((item) => item.id !== t.id)); }}
                            className="rounded-md border border-gray-700 px-3 py-1 text-sm font-medium hover:bg-gray-800"
                        >
                            {t.action.label}
                        </button>
                    )}
                    <button
                        onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                        className={cn("absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
                            t.variant === 'destructive' ? "text-red-300 hover:text-red-50" : "text-gray-400 hover:text-gray-50"
                        )}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}
