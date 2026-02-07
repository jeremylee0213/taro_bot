# CLAUDE.md — AI Assistant Guide for taro_bot (플랜Bot)

## Project Overview

**플랜Bot** is an AI-powered daily schedule coach and planner, built as a client-side Progressive Web App. It parses natural-language Korean schedule input, runs it through OpenAI for personalized coaching (considering ADHD/HSP traits and medication timing), and displays multi-advisor insights, energy charts, and specialist advice.

- **No backend** — everything runs in the browser; the OpenAI API key is stored in localStorage.
- **Static export** — deployed to GitHub Pages at `/taro_bot/`.
- **Korean-first UI** — all user-facing text, prompts, and advisor profiles are in Korean.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (static export, `output: 'export'`) |
| Language | TypeScript 5.7 (strict mode) |
| UI | React 18 with functional components + hooks |
| Styling | Tailwind CSS 3.4 + CSS custom properties (Apple-style theming) |
| AI | OpenAI SDK 4.77 (`dangerouslyAllowBrowser: true`) |
| Testing | Playwright (E2E) |
| PWA | Service worker (`public/sw.js`) + manifest |
| CI/CD | GitHub Actions → GitHub Pages |
| Package Manager | npm |

## Repository Structure

```
taro_bot/
├── .github/workflows/deploy.yml   # CI/CD: build + deploy to GitHub Pages
├── config/
│   └── advisor_pool.md             # 15 advisor profiles (Korean + English)
├── e2e/
│   └── planner.spec.ts             # Playwright E2E tests (14 test cases)
├── prompts/
│   ├── system_prompt.md            # AI system instructions
│   └── output_schema.json          # JSON schema for AI responses
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service worker (cache strategies)
│   └── icon-*.png                  # PWA icons
├── scripts/
│   └── generate-prompt-data.js     # Reads prompts/ + config/ → src/lib/prompt-data.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (metadata, viewport)
│   │   ├── page.tsx                # Single-page app entry
│   │   └── globals.css             # Global styles + theme CSS variables
│   ├── components/                 # 15 React components
│   │   ├── PlannerContainer.tsx    # Main orchestrator (analysis, state)
│   │   ├── QuickInput.tsx          # Schedule textarea with live parsing
│   │   ├── ScheduleTable.tsx       # Parsed schedule display
│   │   ├── ConcertaChart.tsx       # Medication PK curve (FDA-based)
│   │   ├── AdvisorPanel.tsx        # 3-advisor advice display
│   │   ├── AdvisorSettings.tsx     # Advisor selection/customization
│   │   ├── SettingsModal.tsx       # API key, model, profile settings
│   │   ├── SavedHistoryPanel.tsx   # Past analysis archive
│   │   ├── EnergyChart.tsx         # Energy level visualization
│   │   ├── DateHeader.tsx          # Date navigation
│   │   ├── BlockCalendar.tsx       # Calendar block view
│   │   ├── BriefingList.tsx        # Daily briefings
│   │   ├── ShareButton.tsx         # Share/export functionality
│   │   ├── AnalysisSkeleton.tsx    # Loading skeleton
│   │   └── ErrorBoundary.tsx       # Error boundary wrapper
│   ├── hooks/
│   │   ├── useLocalStorage.ts      # Generic localStorage hook
│   │   ├── useScheduleStore.ts     # Per-date schedule state + weekly stats
│   │   ├── useAnalysisCache.ts     # AI analysis result caching
│   │   └── useTheme.ts            # Dark/light mode toggle
│   ├── lib/
│   │   ├── openai.ts              # OpenAI client factory
│   │   ├── parse-response.ts      # JSON parsing with fallback strategies
│   │   ├── prompt-assembler.ts    # System + user message builder
│   │   ├── prompt-data.ts         # Auto-generated (DO NOT EDIT MANUALLY)
│   │   └── schedule-utils.ts      # Business logic (overload, energy tips)
│   └── types/
│       └── schedule.ts            # Core TypeScript interfaces
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── playwright.config.ts
└── package.json
```

## Development Commands

```bash
# Install dependencies
npm ci

# Start dev server (http://localhost:3000/taro_bot)
npm run dev

# Production build (static export to ./out)
npm run build

# Lint
npm run lint

# Run E2E tests (auto-starts dev server)
npx playwright test

# Regenerate prompt data after editing prompts/ or config/
node scripts/generate-prompt-data.js
```

## Key Development Workflows

### Making UI Changes
1. Components are in `src/components/`. All components use `'use client'` directive.
2. Styling uses Tailwind CSS classes combined with CSS custom properties defined in `src/app/globals.css`.
3. Theme colors follow a category system: Work (blue), Family (green), Personal (purple), Health (orange).
4. Dark/light mode is handled via CSS variables — check `globals.css` for the full theme token set.

### Modifying AI Behavior
1. Edit `prompts/system_prompt.md` for system prompt changes.
2. Edit `prompts/output_schema.json` for response format changes.
3. Edit `config/advisor_pool.md` for advisor profile changes.
4. **After editing any of the above**, run `node scripts/generate-prompt-data.js` to regenerate `src/lib/prompt-data.ts`.
5. Never edit `src/lib/prompt-data.ts` directly — it is auto-generated.

### Adding/Editing Advisors
- Advisor pool is in `config/advisor_pool.md` (15 profiles).
- Each advisor has: ID, name, style description, encouragement phrase, and a direct quote.
- The AI selects 3 advisors per analysis run.

### State Management
- No external state library — all state lives in React hooks + localStorage.
- `useLocalStorage` is the base hook; other hooks (`useScheduleStore`, `useAnalysisCache`, `useTheme`) build on it.
- localStorage keys use prefixes like `ceo-planner-` (legacy naming from pre-rebrand).

### Adding Tests
- E2E tests go in `e2e/` using Playwright.
- Tests target `http://localhost:3000/taro_bot` (base path matters).
- Use text content, aria-labels, or CSS selectors for element locators.
- Current tests cover: UI presence, real-time parsing, validation, settings modal, theme toggle.

## Architecture Notes

### Static Export Constraints
- Next.js is configured with `output: 'export'` — there are **no API routes** or server-side rendering.
- All logic runs client-side. The OpenAI API is called directly from the browser.
- Images must use `unoptimized: true` (Next.js Image optimization requires a server).
- The `basePath` is `/taro_bot` in production (GitHub Pages subdirectory).

### Medication Pharmacokinetics (ConcertaChart)
- Implements FDA-based biphasic PK modeling for Concerta OROS (IR + ER release).
- This is domain-specific code — modify with care and reference the FDA PK data in the component comments.

### PWA / Offline Support
- Service worker in `public/sw.js` uses cache-first for static assets, network-first for navigation.
- Cache version is `ceo-planner-v2` — bump when making breaking changes to cached resources.
- The manifest is at `public/manifest.json`.

### Detail Modes
- Three analysis depth levels: 짧게 (short/일반), 중간 (medium), 길게 (long/상세).
- The mode affects which fields the AI returns (e.g., `energy_chart` and `briefings` are long-mode only).
- Schema validation is in `prompts/output_schema.json`.

## Code Conventions

- **Language**: TypeScript strict mode. All new code must be type-safe.
- **Components**: Functional components with hooks. No class components.
- **Props**: Define explicit TypeScript interfaces for component props.
- **Imports**: Use the `@/*` path alias (maps to `./src/*`).
- **Commits**: Messages use Korean + emoji prefixes (e.g., `feat: 플로팅 FAB 액션 버튼`).
- **No unit tests**: The project relies on Playwright E2E tests only.
- **Client-only**: Every component/page must include `'use client'` — there is no server rendering.

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on push to `main`:
1. Checkout → Node 20 → `npm ci`
2. `npx next build` → produces `./out/`
3. Upload `./out/` artifact → deploy to GitHub Pages

## Common Pitfalls

- **Forgetting `basePath`**: All internal links and asset references must account for the `/taro_bot/` base path in production.
- **Editing prompt-data.ts directly**: This file is auto-generated. Edit the source files in `prompts/` and `config/`, then run the generate script.
- **Server-side code**: This is a static export. Do not add API routes, `getServerSideProps`, or server components.
- **localStorage key naming**: Keys use the `ceo-planner-` prefix (historical). Stay consistent when adding new keys.
- **OpenAI in browser**: The API key is stored in the user's browser. Never log or expose it beyond localStorage.

## Environment

- **No `.env` file** — the OpenAI API key and model selection are configured via the in-app settings modal and stored in localStorage.
- **No Docker** — the project is not containerized.
- **Node version**: 20 (per CI config).
