let baseUrl = '';

// Development: React dev server on :3000, Express on :5050 — need absolute URL
if (window.location.hostname === 'localhost' && window.location.port === '3000') {
    baseUrl = 'http://localhost:5050';
}

// Detached frontend: static files hosted on GitHub Pages or Cloudflare Pages
// Backend lives on musicsheets.site — need absolute URL with CORS
else if (window.location.hostname.includes('github.io')) {
    baseUrl = 'https://musicsheets.site';
} else if (window.location.hostname.includes('pages.dev')) {
    baseUrl = 'https://musicsheets.site';
}

// All other cases: same origin (relative URL)
// Works for: localhost:5050, musicsheets.site, *.cfargotunnel.com, *.trycloudflare.com, *.workers.dev

export { baseUrl };