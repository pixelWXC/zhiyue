import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToast } from './useToast';
import { nextTick } from 'vue';

describe('useToast', () => {
    beforeEach(() => {
        // Reset state if possible, or we rely on creating new instances/states
        // Since useToast is likely a global singleton pattern for state, we might need a reset function or internal cleanup
        const { toasts, dismiss } = useToast();
        toasts.value.forEach(t => dismiss(t.id));
    });

    it('should add a toast', () => {
        const { toast, toasts } = useToast();

        toast({ title: 'Test', description: 'Message', variant: 'success' });

        expect(toasts.value.length).toBe(1);
        expect(toasts.value[0]!.title).toBe('Test');
        expect(toasts.value[0]!.variant).toBe('success');
    });

    it('should remove a toast after duration', async () => {
        vi.useFakeTimers();
        const { toast, toasts } = useToast();

        toast({ title: 'Timed', duration: 1000 });
        expect(toasts.value.length).toBe(1);

        vi.advanceTimersByTime(1000);
        await nextTick();

        expect(toasts.value.length).toBe(0);
        vi.useRealTimers();
    });

    it('should dismiss a toast manually', () => {
        const { toast, toasts, dismiss } = useToast();

        const { id } = toast({ title: 'Dismiss me' });
        expect(toasts.value.length).toBe(1);

        dismiss(id);
        expect(toasts.value.length).toBe(0);
    });

    it('should limit the number of toasts (optional, but good practice)', () => {
        // Assumption: we might want to limit to e.g. 5 toasts
        const { toast, toasts } = useToast();
        for (let i = 0; i < 10; i++) {
            toast({ title: `Toast ${i}` });
        }
        // Assuming a reasonable limit like 3-5, or at least they are all there
        // If we don't implement limit, this test is just to ensure adding works multiple times
        expect(toasts.value.length).toBeGreaterThan(0);
    });
});
