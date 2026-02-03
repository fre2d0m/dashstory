# DashStory

**Bridging the cognitive gap between data and decision-making.**

DashStory is an AI-driven narrative platform designed to transform complex data dashboards into intuitive, narrated insights. We provide tools for developers and sales teams to align understanding across different cognitive horizons.

## Core Capabilities

- **Narrative SDK**: Embed a "Start Guided Tour" button directly into your dashboards. Let AI narrate data trends and insights tailored to the user's role.
- **Visionary Chrome Extension**: An on-the-fly analyzer for sales professionals. Screen-capture any target dashboard and generate an instant, persuasive narration.
- **Voice Clone (Identity Sync)**: Personalize the delivery. Leverage voice cloning technology so the narration sounds exactly like the account manager or technical lead.

## Tech Stack

| Component | Technology |
|-----------|------------|
| SDK | Pure JavaScript (ES6+) |
| Browser Extension | Chrome Extension Manifest V3 |
| API Service | FastAPI + uv |
| Admin Dashboard | Next.js 15 |
| Portal Website | Next.js 15 |

## Project Structure

```
dashstory/
├── sdk/                 # JavaScript SDK
│   ├── src/
│   │   ├── core/        # Panel Registry, Data Normalizer, etc.
│   │   └── ui/          # Demo Bar component
│   └── examples/        # Usage examples
│
├── extension/           # Chrome Extension
│   ├── src/
│   │   ├── background/  # Service worker
│   │   ├── content/     # Content scripts
│   │   └── popup/       # Extension popup
│   └── manifest.json
│
├── api/                 # FastAPI Backend
│   ├── app/
│   │   ├── core/        # Config, security
│   │   ├── routers/     # API endpoints
│   │   ├── schemas/     # Pydantic models
│   │   └── services/    # Business logic
│   └── pyproject.toml
│
├── admin/               # Admin Dashboard (Next.js)
│   └── src/
│       ├── app/         # App Router pages
│       └── components/  # React components
│
├── portal/              # Marketing Website (Next.js)
│   └── src/
│       ├── app/         # App Router pages
│       └── components/  # React components
│
└── docs/                # Documentation
    ├── 用户需求文档.md
    ├── 详细设计.md
    └── 开发任务文档.md
```

## Quick Start

### SDK

```bash
cd sdk
npm install
npm run build
```

Usage:
```javascript
import DashStory from '@dashstory/sdk';

const dashstory = new DashStory({
  apiKey: 'your-api-key',
  language: 'zh'
});

await dashstory.init();

dashstory.registerPanel({
  panelId: 'revenue',
  title: '月度收入',
  metricType: 'time_series',
  unit: 'USD',
  timeRange: '2025-01~2025-12',
  data: [{ t: '2025-01', v: 120000 }]
});

// Press Ctrl+Shift+D to open Demo Bar
```

### API Service

```bash
cd api
uv sync
cp .env.example .env
# Edit .env with your configuration
uv run uvicorn app.main:app --reload
```

API Docs: http://localhost:8000/docs

### Chrome Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder

### Admin Dashboard

```bash
cd admin
npm install
npm run dev
```

Open http://localhost:3001

### Portal Website

```bash
cd portal
npm install
npm run dev
```

Open http://localhost:3000

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/validate` | GET | Validate API key |
| `/api/v1/panels/batch` | POST | Batch upload panels |
| `/api/v1/narration/play` | POST | Generate narration |
| `/api/v1/vision/interpret` | POST | Interpret screenshot |
| `/api/v1/voices` | GET | List available voices |

## Vision

To move from **Information Retrieval** to **Insight Alignment**. We don't just show the numbers; we tell their story.

## License

MIT
