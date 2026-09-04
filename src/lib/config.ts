/**
 * Centralized configuration for the application.
 * Reads from environment variables with safe defaults for local development.
 */

// Port for the FastAPI backend (used by Caddy XTransformPort routing in the client)
export const NEXT_PUBLIC_FASTAPI_PORT = process.env.NEXT_PUBLIC_FASTAPI_PORT ?? "8000";

// Full URL for the FastAPI backend (used by Next.js server-side API routes)
export const FASTAPI_URL = process.env.FASTAPI_URL ?? `http://localhost:${NEXT_PUBLIC_FASTAPI_PORT}`;
