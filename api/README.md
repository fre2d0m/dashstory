# DashStory API

AI-powered dashboard narration backend service built with FastAPI.

## Tech Stack

- **Framework**: FastAPI
- **Package Manager**: uv
- **Database**: PostgreSQL (async with asyncpg)
- **Cache**: Redis
- **AI**: OpenAI GPT-4 Vision + TTS

## Quick Start

### Prerequisites

- Python 3.11+
- uv package manager
- PostgreSQL
- Redis

### Installation

```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Running the Server

```bash
# Development mode
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `GET /api/v1/auth/validate` - Validate API key
- `POST /api/v1/auth/api-keys` - Create API key
- `DELETE /api/v1/auth/api-keys/{key_id}` - Revoke API key

### Panels
- `POST /api/v1/panels/batch` - Batch upload panels
- `GET /api/v1/panels/{panel_id}` - Get panel
- `DELETE /api/v1/panels/{panel_id}` - Delete panel

### Narration
- `POST /api/v1/narration/play` - Generate narration
- `GET /api/v1/narration/status/{job_id}` - Get status

### Vision
- `POST /api/v1/vision/interpret` - Interpret screenshot

### Voices
- `GET /api/v1/voices` - List available voices
- `GET /api/v1/voices/{voice_id}` - Get voice details

### Telemetry
- `POST /api/v1/telemetry` - Record telemetry events

## Development

```bash
# Run tests
uv run pytest

# Run linting
uv run ruff check .

# Run type checking
uv run mypy .

# Format code
uv run black .
```

## Project Structure

```
api/
├── app/
│   ├── core/           # Core utilities (config, security)
│   ├── models/         # Database models
│   ├── routers/        # API routes
│   ├── schemas/        # Pydantic schemas
│   ├── services/       # Business logic
│   └── main.py         # Application entry
├── tests/              # Test files
├── pyproject.toml      # Project configuration
└── .env.example        # Environment template
```
