import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Convert a Blob to Base64 string
 * @param blob Image blob
 * @returns Promise resolving to base64 string (without data:image/... prefix)
 */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            const result = reader.result as string
            // Remove the data:image/xxx;base64, prefix
            const parts = result.split(',')
            const base64 = (parts.length > 1 ? parts[1] : parts[0]) ?? ''
            resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

/**
 * Get MIME type from Blob
 * @param blob Image blob
 * @returns MIME type string
 */
export function getMimeType(blob: Blob): string {
    return blob.type || 'image/jpeg' // Default to jpeg if type is unknown
}
