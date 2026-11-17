import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
    "flex w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-[#0B0d12] border-[#2a2f3a] text-white placeholder:text-white/20 focus-visible:ring-purple-500",
                ghost: "border-none bg-transparent shadow-none focus-visible:ring-0",
                outline: "border-input bg-background",
            },
            size: {
                default: "h-10 py-2",
                sm: "h-9 px-3",
                lg: "h-12 px-4 text-base",
                xl: "h-14 px-4 text-lg rounded-lg",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface InputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, variant, size, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(inputVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input, inputVariants }
