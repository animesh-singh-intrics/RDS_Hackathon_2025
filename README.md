# RDS Hackathon 2025 – AI Co-Pilot Toolkit

A production-ready, end-to-end workspace built for the RDS Hackathon 2025 challenge. The toolkit pairs a React 19 + Tailwind UI with a TypeScript Express proxy so product, engineering, and operations teams can experiment with multi-agent workflows powered by OpenRouter models.

> **Need an OpenRouter API key?** Contact **Animesh Singh** (project author) for access credentials before you begin.

---

## Table of Contents

1. [About the Project](#about-the-project)
2. [Feature Catalogue](#feature-catalogue)
3. [System Architecture](#system-architecture)
4. [Tech Stack & Dependencies](#tech-stack--dependencies)
5. [Quick Start](#quick-start)
6. [Environment Configuration](#environment-configuration)
7. [Running the Apps](#running-the-apps)
8. [User Manual](#user-manual)
9. [Sample Data & Resources](#sample-data--resources)
10. [Quality & Tooling](#quality--tooling)
11. [Troubleshooting](#troubleshooting)
12. [Contributing](#contributing)
13. [License](#license)
14. [Maintainer](#maintainer)

---

## About the Project

The **AI Co-Pilot Toolkit** consolidates multiple productivity accelerators—bug triage, meeting minutes, sentiment analytics, stock-risk dashboards, and more—behind a unified interface. Each tool delegates specialised prompts to OpenRouter models using a shared proxy, ensuring safe API usage and consistent error handling.

The repository is split into:

- `client/`: React SPA (Vite, TypeScript, Tailwind) hosting the interactive dashboards and tools.
- `server/`: Express + TypeScript service that forwards chat completions to OpenRouter, normalises headers, and surfaces clear error messages to the UI.

---

## Feature Catalogue

| Tool | What it does | Typical output |
| --- | --- | --- |
| **Smart Responser** | Generates polished email replies in selectable tones (professional, casual, funny, concise, normalized). Accepts conversation threads plus extra guidance. | Copy-paste ready reply text. |
| **Bug Hunter** | Analyses bug reports, optional code snippets, or uploaded files to identify likely causes and remediation steps. | Structured incident notes with probable root causes. |
| **Minute Maker** | Converts raw meeting transcripts into minutes, action items, next steps, and attendee summaries. | JSON-backed minutes rendered in the UI with export support. |
| **Sentiment Sorter** | Ingests CSV feedback, performs batch sentiment scoring, and visualises breakdowns with charts. | Per-review sentiment labels, key themes, recommendations. |
| **StockGuard & Dashboard** | Combines LLM commentary with existing metrics to flag market risk, compare tickers, and surface mitigation tips. | Rich dashboard with auto-generated briefings. |
| **Code Commenter Tool** | Drafts documentation-quality code comments given a snippet or file upload. | Suggested inline comments and function summaries. |
| **DataViz Pro** (experimental) | Renders charts from CSV uploads or generated summaries using a safe HTML sandbox. | Embeddable dashboards for presentations. |

Every feature consumes the shared OpenRouter model catalogue defined in `client/src/constants/openRouterModels.ts`, so upgrades cascade across the suite.

---

## System Architecture

```text
root
├── client/                  # React 19 + Vite UI
│   ├── src/components/      # Feature surfaces (SmartResponser, BugHunter, etc.)
│   ├── src/tools/           # Modular tool frameworks (e.g., DataViz Pro)
│   ├── src/services/        # Axios client with auth & error interceptors
│   └── src/constants/       # Centralised OpenRouter model registry
└── server/                  # Express proxy & supporting services
    ├── src/controllers/     # ChatController forwards requests to OpenRouter
    ├── src/middleware/      # Error handling, auth scaffolding
    ├── src/routes/          # REST endpoints (chat, auth, health)
    └── src/utils/           # Custom errors, helpers
```

Communication flow:

1. The UI gathers prompts, selected models, and an OpenRouter API key from the user.
2. `client/src/services/apiClient.ts` posts the payload to `POST /api/chat`.
3. The Express backend enriches headers (`OPENROUTER_SITE_URL`, `OPENROUTER_APP_NAME`) and relays the request to OpenRouter.
4. Responses (or detailed error messages) are surfaced back to the tool context for display.

---

## Tech Stack & Dependencies

| Layer | Core libraries |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS, Axios, Chart.js (`react-chartjs-2`), Recharts |
| **Backend** | Node 18+, Express 4, TypeScript, `node-fetch` (via global fetch in Node 18) |
| **Tooling** | ESLint, Prettier, Husky, Commitlint, Vitest, Jest, tsx, concurrently |

**System requirements**

- Node.js **18.0.0+** (tested on 18.x and 20.x)
- npm **8.0.0+** (ships with Node 18)
- Git for version control
- macOS, Linux, or Windows (developed on Windows 11 / WSL compatibility verified)

---

## Quick Start

```bash
# 1. Clone the public repository
git clone https://github.com/animesh-singh-intrics/RDS_Hackathon_2025.git
cd RDS_Hackathon_2025

# 2. Install workspace tooling (root, client, server)
npm install
npm run install:all

# 3. (First time only) enable Git hooks
npm run prepare
```

> The repository uses npm workspaces, so running `npm install` at the root keeps dependency graphs in sync.

---

## Environment Configuration

1. Duplicate sample environment files:
   ```bash
   copy .env.example .env
   copy client\.env.example client\.env
   ```
   *(Replace `copy` with `cp` on macOS/Linux.)*

2. Populate values according to your environment:

   ```env
   # Root .env
   NODE_ENV=development
   PORT=5000
   OPENROUTER_SITE_URL=http://localhost:3000
   OPENROUTER_APP_NAME=Hackathon Toolkit
   ```

   ```env
   # client/.env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. **OpenRouter access**
   - Request an API key from **Animesh Singh**.
   - Provide the key inside each tool’s UI when prompted (the key is not stored server-side by default).
   - Optionally export `OPENROUTER_API_KEY` if you plan to proxy requests entirely from the server—update `ChatController` accordingly.

> 🔐 **Security tip**: Never commit API keys to Git. Use `.env` files or run-time injection only.

---

## Running the Apps

### All-in-one development mode

```bash
npm run dev
```

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:5000>
- Health check: <http://localhost:5000/api/health>

### Individual services

```bash
npm run dev:client   # Vite dev server
npm run dev:server   # Express dev server (tsx watch)
```

### Production build & serve

```bash
npm run build        # Build client + server
npm start            # Launch compiled server (serves API only)
```

---

## User Manual

### 1. Smart Responser
- Paste an email thread (optional) plus extra instructions.
- Select a response tone and your preferred OpenRouter model.
- Enter the OpenRouter API key provided by Animesh.
- Click **Generate Response** to receive a ready-to-send reply; use **Copy Response** for quick transfer.

### 2. Bug Hunter
- Describe the bug and optionally paste code or upload a file.
- Choose a model and supply the API key.
- Start analysis to receive probable causes, risky lines, and recommended fixes.

### 3. Minute Maker
- Upload or paste a meeting transcript (TXT/Doc text).
- Provide your OpenRouter key and model selection.
- Trigger **Generate Meeting Minutes**; export the results as a `.txt` summary once satisfied.

### 4. Sentiment Sorter
- Upload a CSV of customer feedback (headers such as `review`, `rating`, `product`).
- Set a product name (optional) to improve context.
- Provide your API key, pick a model, and run the analysis to see per-item sentiments, overall score, and insights visualised as charts.

### 5. StockGuard & Dashboard
- Navigate to the StockGuard dashboard to monitor tickers.
- Enter relevant prompts or data (e.g., ticker symbols, market context).
- Generate AI-driven summaries of risk factors, mitigation plans, and cross-ticker comparisons.

### 6. Code Commenter Tool
- Paste a code snippet or upload a file.
- Select a model and add your key.
- Receive well-structured docstring/comment suggestions aligned with best practices.

### 7. DataViz Pro (Experimental)
- Upload CSV data to build quick charts.
- Use the generated HTML safely rendered via the sandboxed `SecureHTMLRenderer` component.

All tools share consistent UI patterns (model dropdown, API key input, progress indicator, error messages) thanks to the `OPENROUTER_MODEL_OPTIONS` registry and the enhanced error parsing in `server/src/controllers/ChatController.ts`.

---

## Sample Data & Resources

| File | Purpose |
| --- | --- |
| `sample-data.csv` | Demo dataset for DataViz Pro or StockGuard scenarios. |
| `sample-reviews.csv` | Example reviews for Sentiment Sorter. |
| `test_data.csv` | Additional CSV for load-testing sentiment workflows. |
| `docs/` | Prompt templates, coding guidelines, UI redesign notes. |

Use these assets to simulate real-world flows before connecting production systems.

---

## Quality & Tooling

Ensure code health before committing or deploying:

```bash
npm run lint             # ESLint across client + server
npm run lint:fix         # Auto-fix lint issues
npm run typecheck        # TypeScript project-wide check
npm run test             # Vitest (client) + Jest (server)
npm run format           # Prettier formatting sweep
```

Pre-commit hooks (Husky + lint-staged) enforce formatting and linting for staged files.

---

## Troubleshooting

| Issue | Resolution |
| --- | --- |
| **HTTP 404: No endpoints found for `<model>`** | The chosen model is not available in OpenRouter under your key. Pick another model from the dropdown or ask Animesh for access. |
| **`401 Unauthorized`** | API key missing/invalid. Double-check the key or request a new one from Animesh Singh. |
| **Port conflicts (3000/5000)** | Free ports with `npx kill-port 3000 5000` (or equivalent) before running dev servers. |
| **TypeScript compilation errors** | Run `npm run typecheck`, inspect highlighted files, and ensure imports/params are used. |
| **Large CSV uploads timeout** | Break files into smaller batches or increase timeouts in the relevant component before re-running. |

---

## Contributing

1. Read the detailed [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md).
2. Fork the repository and create a feature branch (`git checkout -b feature/amazing-idea`).
3. Follow the existing coding standards and naming conventions.
4. Run `npm run lint`, `npm run typecheck`, and `npm run test` before opening a PR.
5. Use [Conventional Commits](https://www.conventionalcommits.org/) (enforced via Commitlint).

---

## License

This project is released under the [MIT License](./LICENSE) unless otherwise noted.

---

## Maintainer

**Animesh Singh**  
- GitHub: [@animesh-singh-intrics](https://github.com/animesh-singh-intrics)  
- Contact for OpenRouter API access and feature support.

---

Happy building! 🚀