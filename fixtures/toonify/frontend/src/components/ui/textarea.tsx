import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-[#0B0d12] border-[#2a2f3a] text-white placeholder:text-white/20 focus-visible:ring-purple-500",
                ghost: "border-none bg-transparent shadow-none focus-visible:ring-0",
                outline: "border-input bg-background",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, variant, ...props }, ref) => {
        return (
            <textarea
                className={cn(textareaVariants({ variant, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
