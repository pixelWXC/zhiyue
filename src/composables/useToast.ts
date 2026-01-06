import { ref } from 'vue'

export type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

export interface ToastProps {
    id: string
    title?: string
    description?: string
    variant?: ToastVariant
    duration?: number
    action?: {
        label: string
        onClick: () => void
    }
}

const toasts = ref<ToastProps[]>([])

/**
 * Global Toast Composable
 */
export function useToast() {
    /**
     * Add a new toast
     */
    function toast(props: Omit<ToastProps, 'id'>) {
        const id = Math.random().toString(36).substring(2, 9)
        const duration = props.duration ?? 3000 // Default 3s

        const newToast: ToastProps = {
            id,
            ...props,
            duration
        }

        toasts.value.push(newToast)

        if (duration > 0 && duration !== Infinity) {
            setTimeout(() => {
                dismiss(id)
            }, duration)
        }

        return { id }
    }

    /**
     * Dismiss a toast by ID
     */
    function dismiss(id: string) {
        const index = toasts.value.findIndex((t) => t.id === id)
        if (index !== -1) {
            toasts.value.splice(index, 1)
        }
    }

    return {
        toasts,
        toast,
        dismiss
    }
}
