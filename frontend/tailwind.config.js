/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                vintage: {
                    beige: '#dcdcdc', // Slightly grayer beige for industrial look
                    dark: '#1a1a1a',
                    green: '#33ff00',
                    amber: '#ffb000',
                    red: '#ff3333',
                    panel: '#c0c0c0', // Standard Windows 95/Industrial panel gray
                }
            },
            fontFamily: {
                mono: ['"IBM Plex Mono"', 'monospace'],
            },
            boxShadow: {
                'hard': '2px 2px 0px 0px rgba(0,0,0,1)',
                'inset': 'inset 2px 2px 0px 0px rgba(0,0,0,0.5)',
            }
        },
    },
    plugins: [],
}
