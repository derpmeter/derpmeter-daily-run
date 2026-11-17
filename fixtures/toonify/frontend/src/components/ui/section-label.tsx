import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export interface SectionLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
    icon?: React.ReactNode
}

const SectionLabel = React.forwardRef<React.ElementRef<typeof Label>, SectionLabelProps>(
    ({ className, children, icon, ...props }, ref) => {
        return (
            <Label
                ref={ref}
                className={cn(
                    "text-xs font-bold font-mono tracking-wider uppercase flex items-center gap-2",
                    "text-gray-400", // Default color
                    className
                )}
                {...props}
            >
                {icon && <span className="w-3 h-3 flex items-center justify-center">{icon}</span>}
                {children}
            </Label>
        )
    }
)
SectionLabel.displayName = "SectionLabel"

export { SectionLabel }
