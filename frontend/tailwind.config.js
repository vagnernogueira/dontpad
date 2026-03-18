/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            screens: {
                'xs': '480px',
            },
            fontFamily: {
                ui: ['Fira Code', '-apple-system', 'system-ui', 'sans-serif'],
                code: ['Fira Code', 'Consolas', 'monospace'],
            },
            colors: {
                'code-bg': '#e8eef2',
            },
            spacing: {
                'btn': '7.2px',
                'btn-sm': '5.4px',
                'header': '9px',
            },
        },
    },
    plugins: [],
}
