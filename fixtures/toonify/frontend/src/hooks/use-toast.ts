import { toast as toastFunction } from "@/components/ui/toaster"

export const useToast = () => {
    return {
        toast: toastFunction,
    }
}
