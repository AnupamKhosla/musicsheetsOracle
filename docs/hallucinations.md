# Hallucinations & Common Pitfalls

This file tracks recurring mistakes, false claims, and hallucinations made by the AI agent. It must be checked before repeating any of these claims.

## Claim: "OpenCode is archived / obsolete / replaced by Crush"
- **Status**: FALSE
- **Reality**: The user has `opencode-ai@1.14.33` installed globally via npm and is actively using it.
- **Process**: `/Users/anupamkhosla/.nvm/versions/node/v24.15.0/lib/node_modules/opencode-ai/bin/.opencode`
- **When it happened**: May 3, 2026 — user had to correct me multiple times.
- **Root cause**: Confused GitHub repo archival status (`opencode-ai/opencode`) with the actively installed npm package (`opencode-ai`).
- **Correction**: The GitHub repo being archived does not invalidate installed working software. Stop mentioning Crush unless the user asks about it.

## Claim: "Cloudflare named tunnels provide a free permanent URL without a domain"
- **Status**: FALSE
- **Reality**: Named tunnels require a hostname configured in Cloudflare Zero Trust, which must reference a domain in the user's Cloudflare account. Without a domain, there is no public URL. Quick tunnels (`*.trycloudflare.com`) give temporary URLs that change on every restart.
- **When it happened**: May 9-17, 2026 — the agent based the entire backup architecture on this false premise.
- **Root cause**: Agent (DeepSeek V4) was trained on pre-2025 data and hallucinated tunnel URL behavior. Confused internal tunnel connectivity with public URL availability.
- **Correction**: Tailscale Funnel is the correct free permanent URL solution. It provides `hostname.tailnet.ts.net` URLs tied to machine cryptographic identity, surviving reboots with no domain dependency. Also viable: Ngrok (free tier, with interstitial warning), GitHub Pages, Firebase Hosting.

## Claim: "Cloudflare Workers can reach tunnels without a Zero Trust hostname"
- **Status**: UNVERIFIED / LIKELY FALSE
- **Reality**: The agent claimed Workers (being inside Cloudflare's network) could fetch tunnels directly via internal endpoints without a public hostname. This was never verified against Cloudflare documentation and is likely another hallucination.
