# Fix My Street — Kang Frontend

Citizen-facing React + Vite frontend for Fix My Street.

## Backend integration currently connected

The Report page now sends the citizen report to:

`POST http://localhost:5000/api/reports/analyze`

using `multipart/form-data` with these exact fields:

- `photo`
- `latitude`
- `longitude`
- `description`

The request is implemented in `src/api.js`.

### API base URL

The frontend uses:

`VITE_API_BASE_URL=http://localhost:5000`

Create a `.env` file from `.env.example` if the backend URL changes.

## Important backend response requirement

The frontend currently expects the successful response to contain:

```json
{
  "report_id": "CF-1042"
}
```

It also preserves any additional response fields for the confirmation/tracking UI.

If the backend returns the report ID under another property, update `src/App.jsx` or tell Kang the exact response shape.

## Current integration boundary

Connected:

- Report form → backend POST `/api/reports/analyze`
- Photo upload
- Latitude
- Longitude
- Description
- Backend error handling
- Loading/disabled submit state
- Backend-generated report ID → confirmation page

Not yet connected:

- Tracking page to a backend GET report endpoint
- Real status-history retrieval
- Voice endpoint
- Authentication

Those require the backend API contract.

## CORS

Because Vite normally runs on `http://localhost:5173` while the backend runs on `http://localhost:5000`, the backend must allow the frontend origin during local development.

## Run locally

```bash
npm install
npm run dev
```
