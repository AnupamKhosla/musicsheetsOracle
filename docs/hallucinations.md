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

## Claim: "Cross-beat hold brackets can be safely removed entirely"
- **Status**: FALSE
- **Reality**: Removing the old vertical-bar `crossBeatHold` markers was right (user disliked them), but removing the *concept* of cross-beat holding was wrong. A held note that spans multiple beats still needs a visual `⌣` smiley-bracket continuation across cell boundaries. The user explicitly verified this on Kenek-kenek Ode (`/post/6a49f36e32c43ef5e06381d7`) — three consecutive `<note>` elements with the same pitch (C, dur=2 each) should render as a single sustained Sa with a spanning bracket, not three independent beats with no hold marker.
- **When it happened**: July 18, 2026 — overcorrected while replacing crossBeatHold with chordLinks.
- **Root cause**: Conflated "remove the vertical-bar renderer" with "remove the cross-beat hold concept entirely". Within-beat holds (single `NoteInstance` with `reps > 1`) still worked, but cross-beat cases (adjacent `<note>`s with same pitch, or a tie chain across beats) lost their hold marker.
- **Correction**: Collapse adjacent same-pitch same-voice NoteInstances into one logical held note; the smiley bracket should visually continue across cell boundaries.

## Claim: "`export const dynamic = 'force-dynamic'` in root layout is the fix for Next.js 16 maintenance mode"
- **Status**: FALSE
- **Reality**: Adding `export const dynamic = 'force-dynamic'` to `src/app/layout.tsx` converts ALL pages to dynamic rendering (`ƒ` in build output) instead of just making the layout re-read the MAINTENANCE flag on every request. Static prerendering for `/`, `/search`, `/create` is lost.
- **When it happened**: June 14, 2026 — the VPS maintenance page was stuck showing even after `MAINTENANCE=0`, and the agent claimed `force-dynamic` was previously committed (it never was — confirmed via `git log -p`).
- **Root cause**: Next.js 16 Cache Components treats `fs.readFileSync` as a deterministic operation, baking it into the static HTML shell at build time. The root layout wrapping all pages means `force-dynamic` cascades to every route.
- **Correct solution (pending)**: Next.js middleware — runs on every request, can check the flag file synchronously, and skip asset/API routes via matcher config. Does not affect page-level static generation. Alternative: `deploy.sh` does two `pm2 reload`s (one after setting flag to 1, one after setting flag to 0) so the process restarts fresh each time and re-reads the flag — no caching issue.
