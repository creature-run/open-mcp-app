/**
 * Local Development Entry Point
 *
 * This file exists to run the MCP server locally WITHOUT Next.js.
 * It's faster for development because:
 * 1. No Next.js cold start overhead
 * 2. Direct Express server with hot reload via nodemon
 * 3. Creature connects directly to localhost:PORT/api/mcp
 *
 * For production (Vercel), requests go through:
 *   api/mcp.ts (serverless function)
 */
import { app } from "./app.js";
app.start();
