/**
 * Local Development Entry Point
 *
 * This file exists to run the MCP server locally WITHOUT serverless functions.
 * It's faster for development because:
 * 1. No serverless cold start overhead
 * 2. Direct Express server with hot reload via nodemon
 * 3. Creature connects directly to localhost:PORT/mcp
 */
import { app } from "./app.js";
app.start();
