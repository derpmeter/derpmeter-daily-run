import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

const selectionCardVariants = cva(
    "cursor-pointer rounded-xl border transition-all duration-200 relative group overflow-hidden text-left",
    {
        variants: {
            variant: {
                default: "bg-[#0B0d12] border-[#2a2f3a] hover:bg-white/5 hover:border-white/10",
                filled: "bg-[#0B0d12] border-white/5 text-gray-400 hover:text-white hover:bg-white/5",
                outline: "bg-transparent border-dashed border-gray-700 hover:border-gray-500 hover:bg-white/5"
            },
            selected: {
                true: "z-10",
                false: ""
            },
            size: {
                default: "p-4",
                sm: "p-3",
                lg: "p-6",
            }
        },
        compoundVariants: [
            // Default + Selected = Purple Glow
            { 
                variant: "default", 
                selected: true, 
                class: "bg-[#1c162e] border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.15)] ring-1 ring-purple-500/20" 
            },
            // Filled + Selected = Solid Color (Defaults to Primary/Purple, overrideable)
            {
                variant: "filled",
                selected: true,
                class: "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(147,51,234,0.4)]"
            }
        ],
        defaultVariants: {
            variant: "default",
            size: "default",
            selected: false,
        },
    }
)

export interface SelectionCardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof selectionCardVariants> {
    showCheck?: boolean
}

const SelectionCard = React.forwardRef<HTMLDivElement, SelectionCardProps>(
    ({ className, variant, size, selected, showCheck, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(selectionCardVariants({ variant, size, selected, className }))}
                aria-selected={!!selected}
                {...props}
            >
                {children}
                {selected && showCheck && (
                    <div className="absolute top-2 right-2 text-primary-foreground/80">
                        <Check className="w-4 h-4 shadow-sm" />
                    </div>
                )}
            </div>
        )
    }
)
SelectionCard.displayName = "SelectionCard"

export { SelectionCard, selectionCardVariants }
