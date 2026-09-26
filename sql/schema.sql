CREATE TABLE reports (

    report_id BIGSERIAL PRIMARY KEY,

    photo TEXT NOT NULL,

    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,

    description TEXT NOT NULL,

    category TEXT NOT NULL,

    confidence DOUBLE PRECISION,

    severity TEXT,

    safety_risk BOOLEAN NOT NULL DEFAULT FALSE,

    possible_duplicate BOOLEAN NOT NULL DEFAULT FALSE,

    department TEXT,

    status TEXT NOT NULL DEFAULT 'REPORTED',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    status_history JSONB NOT NULL DEFAULT '[]'::jsonb
);