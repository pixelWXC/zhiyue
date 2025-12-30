/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/content/**/*.{ts,vue,html}",
        "./src/components/**/*.{ts,vue,html}", // Include shared components
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
