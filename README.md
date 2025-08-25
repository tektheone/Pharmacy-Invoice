# Pharmacy Invoice Validation System

A full-stack application for validating pharmacy invoices against reference drug data.

## Project Structure

```
pharmacy-invoice/
├── backend/          # Express + TypeScript API
├── frontend/         # React + TypeScript + TailwindCSS
├── shared/           # Shared types and utilities
└── docs/             # Documentation
```

## Features

- Upload invoices in multiple formats (.xlsx, .xls, .csv, .pdf)
- Validate against reference drug data from external API
- Flag discrepancies in unit price, formulation, strength, and payer
- Clean, responsive dashboard UI
- Comprehensive error handling

## Tech Stack

- **Backend**: Express + TypeScript
- **Frontend**: React + TypeScript + TailwindCSS
- **Testing**: Jest (backend) + Playwright (frontend)
- **Deployment**: Azure App Service + Azure Static Web Apps

## Getting Started

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `POST /api/upload` - Upload and validate invoice files
- `GET /api/health` - Health check endpoint

## License

MIT
