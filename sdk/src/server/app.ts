import { randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Server } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import type {
  AppConfig,
  ResourceConfig,
  ToolConfig,
  ToolDefinition,
  ToolHandler,
  ToolResult,
  ToolContext,
  InstanceDestroyContext,
  ResourceDefinition,
  TransportSessionInfo,
} from "./types.js";
import { MIME_TYPES } from "./types.js";
import { svgToDataUri, isInitializeRequest, injectHmrClient, readHmrConfig, htmlLoader, HMR_PORT_OFFSET } from "./utils.js";
import { WebSocketManager } from "./websocket.js";
import type { WebSocketConnection } from "./types.js";

// ============================================================================
// Request Context (for passing auth headers to tool handlers)
// ============================================================================

/**
 * Request context stored in AsyncLocalStorage.
 * Allows tool handlers to access HTTP request data (e.g., Authorization header).
 */
interface RequestContext {
  authorizationHeader?: string;
}

/**
 * AsyncLocalStorage for request context.
 * Used to pass HTTP request headers to MCP tool handlers.
 */
const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Extract bearer token from Authorization header.
 */
const extractBearerToken = (authHeader: string | undefined): string | undefined => {
  if (!authHeader) return undefined;
  const trimmed = authHeader.trim();
  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice(7).trim();
  }
  return undefined;
};

// ============================================================================
// App Class
// ============================================================================

export class App {
  // ==========================================================================
  // Private Properties
  // ==========================================================================

  private config: AppConfig;
  private tools: Map<string, ToolDefinition> = new Map();
  private resources: Map<string, ResourceDefinition> = new Map();
  private transports: Map<string, StreamableHTTPServerTransport> = new Map();
  private websocketManager = new WebSocketManager();
  private instanceWebSockets = new Map<string, WebSocketConnection<unknown, unknown>>();
  private httpServer: Server | null = null;
  private isDev: boolean;
  private hmrPort: number | null = null;
  private hmrConfigChecked = false;
  private callerDir: string;
  private shutdownRegistered = false;
  private isShuttingDown = false;
  
  /** Server-side instance state, keyed by instanceId. */
  private instanceState = new Map<string, unknown>();
  
  /** Callbacks to invoke when an instance is destroyed. */
  private instanceDestroyCallbacks: Array<(ctx: InstanceDestroyContext) => void> = [];

  /** Singleton instanceIds per resourceUri (for non-multiInstance resources). */
  private singletonInstances = new Map<string, string>();

  /** Whether the connected host supports multiInstance. ChatGPT doesn't, Creature does. */
  private hostSupportsMultiInstance = false;

  /** OAuth discovery endpoint configuration. */
  private oauthDiscoveryConfig: { path: string; body: Record<string, unknown> } | null = null;

  // ==========================================================================
  // Constructor
  // ==========================================================================

  constructor(config: AppConfig, callerDir?: string) {
    this.callerDir = callerDir || process.cwd();
    this.config = config;
    this.isDev = config.dev ?? process.env.NODE_ENV === "development";
    
    if (this.isDev && config.hmrPort) {
      this.hmrPort = config.hmrPort;
    }
  }

  // ==========================================================================
  // Public API: Registration
  // ==========================================================================

  /**
   * Define a UI resource.
   */
  resource(config: ResourceConfig): this {
    if (!config.uri.startsWith("ui://")) {
      throw new Error(`Resource URI must start with "ui://": ${config.uri}`);
    }
    
    const normalizedConfig: ResourceConfig = {
      ...config,
      html: typeof config.html === "string"
        ? htmlLoader(config.html, this.getCallerDir())
        : config.html,
    };
    
    this.resources.set(config.uri, { config: normalizedConfig });
    return this;
  }

  /**
   * Define a tool.
   */
  tool<TInput extends z.ZodType>(
    name: string,
    config: ToolConfig<TInput>,
    handler: ToolHandler<z.infer<TInput>>
  ): this {
    this.tools.set(name, {
      config: config as ToolConfig,
      handler: handler as ToolHandler<unknown>,
    });
    return this;
  }

  /**
   * Serve an OAuth discovery endpoint.
   * Used by OAuth clients (like ChatGPT) to discover authorization server metadata.
   *
   * @param config.path - The endpoint path (e.g., "/.well-known/oauth-authorization-server")
   * @param config.[rest] - All other properties become the JSON response body
   *
   * @example
   * app.serveOAuthDiscovery({
   *   path: "/.well-known/oauth-authorization-server",
   *   issuer: "https://creature.run",
   *   authorization_endpoint: "https://creature.run/oauth/authorize",
   *   token_endpoint: "https://api.creature.run/apps/v1/oauth/token",
   *   response_types_supported: ["code"],
   *   grant_types_supported: ["authorization_code", "refresh_token"],
   *   code_challenge_methods_supported: ["S256"],
   * });
   */
  serveOAuthDiscovery(config: { path: string; [key: string]: unknown }): this {
    const { path, ...body } = config;
    this.oauthDiscoveryConfig = { path, body };
    return this;
  }

  // ==========================================================================
  // Public API: Server Lifecycle
  // ==========================================================================

  /**
   * Start the MCP server.
   */
  async start(): Promise<void> {
    const port = this.getPort();
    const expressApp = this.createExpressApp();

    this.httpServer = expressApp.listen(port, () => {
      console.log(`MCP server ready on port ${port}`);
    });

    // Store server reference for lazy WebSocket initialization.
    // WebSocket server is only created when first needed.
    this.websocketManager.setServer(this.httpServer);

    this.registerShutdownHandlers();
  }

  /**
   * Stop the MCP server gracefully.
   */
  async stop(): Promise<void> {
    const gracefulTimeout = this.config.gracefulShutdownTimeout ?? 5000;
    const keepAliveTimeout = this.config.keepAliveTimeout ?? 5000;

    // Call user shutdown hook
    try {
      await this.config.onShutdown?.();
    } catch (error) {
      console.error("[MCP] Error in onShutdown callback:", error);
    }

    // Destroy all instances
    for (const instanceId of this.instanceState.keys()) {
      this.destroyInstance(instanceId);
    }
    this.websocketManager.closeAll();

    // Close all MCP transports with timeout
    const transportClosePromises = [...this.transports.values()].map((transport) =>
      transport.close().catch(() => {})
    );

    await Promise.race([
      Promise.all(transportClosePromises),
      new Promise((resolve) => setTimeout(resolve, gracefulTimeout)),
    ]);

    this.transports.clear();

    // Close HTTP server
    if (this.httpServer) {
      this.httpServer.keepAliveTimeout = keepAliveTimeout;

      await new Promise<void>((resolve) => {
        const forceClose = setTimeout(resolve, gracefulTimeout);
        this.httpServer?.close(() => {
          clearTimeout(forceClose);
          resolve();
        });
      });

      this.httpServer = null;
    }

    console.log("[MCP] Shutdown complete");
  }

  // ==========================================================================
  // Public API: Instance Lifecycle
  // ==========================================================================

  /**
   * Create an instance with optional WebSocket support.
   * 
   * Most tools don't need this — the SDK creates instances automatically.
   * Only call createInstance() when you need a WebSocket URL for real-time updates.
   */
  createInstance<TServer = unknown, TClient = unknown>(
    options: { websocket?: boolean } = {}
  ): {
    instanceId: string;
    websocketUrl?: string;
    send?: (msg: TServer) => void;
    onMessage?: (handler: (msg: TClient) => void) => void;
    onConnect?: (handler: () => void) => void;
  } {
    const instanceId = this.generateInstanceId();
    
    if (options.websocket) {
      const ws = this.websocketManager.createWebSocket<TServer, TClient>(
        instanceId,
        {},
        this.getPort()
      );
      this.instanceWebSockets.set(instanceId, ws as WebSocketConnection<unknown, unknown>);
      
      return {
        instanceId,
        websocketUrl: ws.websocketUrl,
        send: ws.send,
        onMessage: ws.onMessage,
        onConnect: ws.onConnect,
      };
    }
    
    return { instanceId };
  }

  /**
   * Register a callback to be invoked when an instance is destroyed.
   */
  onInstanceDestroy(callback: (ctx: InstanceDestroyContext) => void): void {
    this.instanceDestroyCallbacks.push(callback);
  }

  /**
   * Destroy an instance and clean up its resources.
   */
  destroyInstance(instanceId: string): boolean {
    const state = this.instanceState.get(instanceId);
    const hasState = state !== undefined || this.instanceState.has(instanceId);
    const hasWebSocket = this.instanceWebSockets.has(instanceId);
    
    if (hasState || hasWebSocket) {
      // Invoke destroy callbacks
      for (const callback of this.instanceDestroyCallbacks) {
        try {
          callback({ instanceId, state });
        } catch (error) {
          console.error(`[MCP] onInstanceDestroy callback error for ${instanceId}:`, error);
        }
      }
      
      // Close WebSocket
      const ws = this.instanceWebSockets.get(instanceId);
      if (ws) {
        ws.close();
        this.instanceWebSockets.delete(instanceId);
      }
      
      // Clear state
      this.instanceState.delete(instanceId);
      console.log(`[MCP] Instance destroyed: ${instanceId}`);
      return true;
    }
    
    return false;
  }

  /**
   * Check if an instance exists.
   */
  hasInstance(instanceId: string): boolean {
    return this.instanceState.has(instanceId);
  }

  /**
   * Get instance state.
   */
  getInstanceState<T>(instanceId: string): T | undefined {
    return this.instanceState.get(instanceId) as T | undefined;
  }

  /**
   * Set instance state directly.
   */
  setInstanceState<T>(instanceId: string, state: T): void {
    this.instanceState.set(instanceId, state);
  }

  /**
   * Create a WebSocket for an existing instance.
   * 
   * Use this when you need real-time communication for an instance
   * that was created by a tool handler (which provides instanceId via context).
   */
  createWebSocketForInstance<TServer = unknown, TClient = unknown>(
    instanceId: string
  ): WebSocketConnection<TServer, TClient> | null {
    // Check if WebSocket already exists for this instance
    if (this.instanceWebSockets.has(instanceId)) {
      return this.instanceWebSockets.get(instanceId) as WebSocketConnection<TServer, TClient>;
    }
    
    const ws = this.websocketManager.createWebSocket<TServer, TClient>(
      instanceId,
      {},
      this.getPort()
    );
    this.instanceWebSockets.set(instanceId, ws as WebSocketConnection<unknown, unknown>);
    
    return ws;
  }

  // ==========================================================================
  // Public API: Transport Sessions
  // ==========================================================================

  /**
   * Get list of active transport sessions.
   */
  getTransportSessions(): TransportSessionInfo[] {
    return [...this.transports.keys()].map((id) => ({
      id,
      transport: "streamable-http" as const,
    }));
  }

  /**
   * Get the count of active transport sessions.
   */
  getTransportSessionCount(): number {
    return this.transports.size;
  }

  // ==========================================================================
  // Public API: Serverless Adapters
  // ==========================================================================

  /**
   * Get the app configuration.
   */
  getConfig(): AppConfig {
    return this.config;
  }

  /**
   * Get all tool definitions.
   */
  getToolDefinitions(): Map<string, ToolDefinition> {
    return this.tools;
  }

  /**
   * Get all resource definitions.
   */
  getResourceDefinitions(): Map<string, ResourceDefinition> {
    return this.resources;
  }

  /**
   * Create a Vercel serverless function handler.
   * Works with plain Vercel Serverless Functions - no Next.js or mcp-handler needed.
   * 
   * Usage in api/mcp.ts:
   * ```ts
   * import { app } from "../src/app";
   * export default app.toVercelFunctionHandler();
   * ```
   */
  toVercelFunctionHandler(options?: import("./types.js").VercelMcpOptions) {
    return this.createVercelHandler(options);
  }

  /**
   * Create an AWS Lambda handler.
   * 
   * Note: This returns a Lambda handler function. The implementation
   * is inline to avoid circular dependencies.
   */
  toAwsLambda(options?: import("./types.js").AwsLambdaOptions) {
    return this.createLambdaHandler(options);
  }

  /**
   * Close a specific transport session.
   */
  closeTransportSession(sessionId: string): boolean {
    const transport = this.transports.get(sessionId);
    if (transport) {
      transport.close().catch(() => {});
      this.transports.delete(sessionId);
      return true;
    }
    return false;
  }

  // ==========================================================================
  // Public API: Resource Cache
  // ==========================================================================
  // Private: Configuration Helpers
  // ==========================================================================

  private getPort(): number {
    return this.config.port || parseInt(process.env.MCP_PORT || process.env.PORT || "3000", 10);
  }

  private getCallerDir(): string {
    return this.callerDir;
  }

  // ==========================================================================
  // Private: Serverless Adapter Helpers
  // ==========================================================================

  /**
   * Create a ToolContext for serverless environments.
   * Shared between Vercel and Lambda adapters to avoid duplication.
   */
  /**
   * In-memory state for serverless when no external adapter provided.
   * Only useful for local development - won't persist across invocations in production.
   */
  private serverlessMemoryState = new Map<string, unknown>();
  private serverlessStateWarningLogged = false;
  private serverlessRealtimeWarningLogged = false;

  private createServerlessContext({
    instanceId,
    creatureToken,
    stateAdapter,
    realtimeAdapter,
  }: {
    instanceId: string;
    creatureToken?: string;
    stateAdapter?: import("./types.js").StateAdapter;
    realtimeAdapter?: import("./types.js").RealtimeAdapter;
  }): ToolContext {
    const websocketUrl = realtimeAdapter?.getWebSocketUrl?.(instanceId);
    const app = this;
    
    return {
      instanceId,
      creatureToken,
      getState: <T>() => {
        if (stateAdapter) {
          return undefined as T | undefined; // Async adapter would need different pattern
        }
        // Use in-memory fallback with warning
        if (!app.serverlessStateWarningLogged) {
          console.warn("[MCP] Using in-memory state - won't persist in production serverless");
          app.serverlessStateWarningLogged = true;
        }
        return app.serverlessMemoryState.get(instanceId) as T | undefined;
      },
      setState: <T>(state: T) => {
        if (stateAdapter) {
          stateAdapter.set(instanceId, state);
          return;
        }
        // Use in-memory fallback with warning
        if (!app.serverlessStateWarningLogged) {
          console.warn("[MCP] Using in-memory state - won't persist in production serverless");
          app.serverlessStateWarningLogged = true;
        }
        app.serverlessMemoryState.set(instanceId, state);
      },
      send: <T>(message: T) => {
        if (realtimeAdapter) {
          realtimeAdapter.send(instanceId, message);
          return;
        }
        // No-op with warning
        if (!app.serverlessRealtimeWarningLogged) {
          console.warn("[MCP] Realtime disabled - provide realtimeAdapter for production");
          app.serverlessRealtimeWarningLogged = true;
        }
      },
      onMessage: <T>(_handler: (msg: T) => void) => {
        if (realtimeAdapter) {
          realtimeAdapter.subscribe(instanceId, _handler as (msg: unknown) => void);
          return;
        }
        // No-op with warning
        if (!app.serverlessRealtimeWarningLogged) {
          console.warn("[MCP] Realtime disabled - provide realtimeAdapter for production");
          app.serverlessRealtimeWarningLogged = true;
        }
      },
      onConnect: (_handler: () => void) => {
        if (realtimeAdapter) {
          // Realtime adapter handles connection
          return;
        }
        // No-op - no warning needed, same as onMessage
      },
      websocketUrl,
    };
  }

  /**
   * Format tool result for serverless response.
   * Shared between Vercel and Lambda adapters.
   * Must include all fields that formatToolResult includes (title, inlineHeight, etc.).
   */
  private formatServerlessResult(result: ToolResult, instanceId: string, websocketUrl?: string) {
    const text = result.text || JSON.stringify(result.data || {});
    
    return {
      content: [{ type: "text", text }],
      structuredContent: {
        ...result.data,
        ...(result.title && { title: result.title }),
        ...(result.inlineHeight && { inlineHeight: result.inlineHeight }),
        instanceId,
        ...(websocketUrl && { websocketUrl }),
      },
      _meta: { "openai/widgetSessionId": instanceId },
      ...(result.isError && { isError: true }),
    };
  }

  /**
   * Create a Vercel serverless function handler.
   * Handles MCP JSON-RPC protocol directly - no mcp-handler or Next.js needed.
   */
  private createVercelHandler(options?: import("./types.js").VercelMcpOptions) {
    const { stateAdapter, realtimeAdapter } = options || {};
    const app = this;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id",
      "Content-Type": "application/json",
    };

    // Handler for Vercel serverless functions (req, res) or Edge (Request) -> Response
    return async (reqOrRequest: any, res?: any): Promise<any> => {
      // Support both Edge (Request object) and Node.js (req, res) patterns
      const isEdge = reqOrRequest instanceof Request;
      
      // Handle CORS preflight
      if (isEdge ? reqOrRequest.method === "OPTIONS" : reqOrRequest.method === "OPTIONS") {
        if (isEdge) {
          return new Response(null, { status: 204, headers: corsHeaders });
        }
        res.status(204).end();
        return;
      }

      // Handle OAuth discovery endpoint (if configured and path matches)
      if (app.oauthDiscoveryConfig) {
        const requestPath = isEdge
          ? new URL(reqOrRequest.url).pathname
          : reqOrRequest.url?.split("?")[0];
        
        if (requestPath === app.oauthDiscoveryConfig.path) {
          if (isEdge) {
            return new Response(JSON.stringify(app.oauthDiscoveryConfig.body), {
              status: 200,
              headers: corsHeaders,
            });
          }
          res.status(200).json(app.oauthDiscoveryConfig.body);
          return;
        }
      }

      // Parse body
      let body: any = {};
      try {
        if (isEdge) {
          body = await reqOrRequest.json();
        } else if (reqOrRequest.body) {
          body = typeof reqOrRequest.body === "string" ? JSON.parse(reqOrRequest.body) : reqOrRequest.body;
        }
      } catch {
        const errorResponse = { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null };
        if (isEdge) {
          return new Response(JSON.stringify(errorResponse), { status: 400, headers: corsHeaders });
        }
        res.status(400).json(errorResponse);
        return;
      }

      try {
        const result = await app.handleMcpRequest(body, { stateAdapter, realtimeAdapter });
        
        if (isEdge) {
          return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
        }
        res.status(200).json(result);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        const errorResponse = { jsonrpc: "2.0", error: { code: -32603, message: err.message }, id: body.id ?? null };
        
        if (isEdge) {
          return new Response(JSON.stringify(errorResponse), { status: 500, headers: corsHeaders });
        }
        res.status(500).json(errorResponse);
      }
    };
  }

  /**
   * Handle an MCP JSON-RPC request.
   * Shared logic for all serverless handlers.
   */
  private async handleMcpRequest(
    body: any,
    options: { stateAdapter?: import("./types.js").StateAdapter; realtimeAdapter?: import("./types.js").RealtimeAdapter }
  ): Promise<any> {
    const { stateAdapter, realtimeAdapter } = options;
    const method = body.method;
    const params = body.params;
    const id = body.id;

    // Initialize
    if (method === "initialize") {
    return {
        jsonrpc: "2.0",
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: { name: this.config.name, version: this.config.version },
          capabilities: { tools: {}, resources: {} },
          ...(this.config.instructions && { instructions: this.config.instructions }),
        },
        id,
      };
    }

    // List tools
    if (method === "tools/list") {
      const tools = [];
      for (const [name, definition] of this.tools) {
        const { config } = definition;
        const toolMeta = this.buildToolMeta(config);
        tools.push({
          name,
          description: this.buildToolDescription(config, config.input || z.object({})),
          inputSchema: config.input ? this.zodToJsonSchema(config.input) : { type: "object" },
          ...(Object.keys(toolMeta).length > 0 && { _meta: toolMeta }),
        });
      }
      return { jsonrpc: "2.0", result: { tools }, id };
    }

    // Call tool
    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments || {};
      const definition = this.tools.get(toolName);

      if (!definition) {
        return { jsonrpc: "2.0", error: { code: -32601, message: `Tool not found: ${toolName}` }, id };
      }

      const { config: toolConfig, handler } = definition;
      const creatureToken = args._creatureToken as string | undefined;
      const { _creatureToken: _, ...cleanArgs } = args;
      const input = toolConfig.input ? toolConfig.input.parse(cleanArgs) : cleanArgs;
      const instanceId = (cleanArgs.instanceId as string) || this.generateInstanceId();

      const context = this.createServerlessContext({ instanceId, creatureToken, stateAdapter, realtimeAdapter });
      const result = await handler(input, context);
      const formatted = this.formatServerlessResult(result, instanceId, context.websocketUrl);

      return { jsonrpc: "2.0", result: formatted, id };
    }

    // List resources
    if (method === "resources/list") {
      const resources = [];
      for (const [uri, { config }] of this.resources) {
        resources.push({
          uri,
          name: config.name,
          description: config.description,
          mimeType: MIME_TYPES.MCP_APPS,
          _meta: {
            ui: {
              multiInstance: config.multiInstance,
              ...(config.icon && {
                icon: {
                  data: svgToDataUri(config.icon.svg),
                  alt: config.icon.alt,
                },
              }),
            },
          },
        });
      }
      return { jsonrpc: "2.0", result: { resources }, id };
    }

    // Read resource
    if (method === "resources/read") {
      const uri = params?.uri;
      const resourceDef = this.resources.get(uri);

      if (!resourceDef) {
        return { jsonrpc: "2.0", error: { code: -32601, message: `Resource not found: ${uri}` }, id };
      }

      const { config } = resourceDef;
      let html = typeof config.html === "function" ? await config.html() : config.html;

      const mcpAppsMeta: Record<string, unknown> = {
        ui: {
          displayModes: config.displayModes,
          ...(config.icon && {
            icon: {
              data: svgToDataUri(config.icon.svg),
              alt: config.icon.alt,
            },
          }),
          ...(config.csp && { csp: config.csp }),
        },
        "openai/widgetPrefersBorder": true,
      };

      return {
        jsonrpc: "2.0",
        result: {
          contents: [
            {
              uri,
              mimeType: MIME_TYPES.MCP_APPS,
              text: html,
              _meta: mcpAppsMeta,
            },
          ],
        },
        id,
      };
    }

    return { jsonrpc: "2.0", error: { code: -32601, message: `Method not found: ${method}` }, id };
  }

  /**
   * Convert Zod schema to JSON Schema for tool definitions.
   */
  private zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
    // Simple conversion - in production you'd use zod-to-json-schema
    if ("_def" in schema) {
      const def = (schema as any)._def;
      if (def.typeName === "ZodObject") {
        const shape = def.shape?.() || {};
        const properties: Record<string, unknown> = {};
        const required: string[] = [];
        
        for (const [key, value] of Object.entries(shape)) {
          const fieldDef = (value as any)._def;
          if (fieldDef?.typeName === "ZodString") {
            properties[key] = { type: "string", description: fieldDef.description };
          } else if (fieldDef?.typeName === "ZodNumber") {
            properties[key] = { type: "number", description: fieldDef.description };
          } else if (fieldDef?.typeName === "ZodBoolean") {
            properties[key] = { type: "boolean", description: fieldDef.description };
          } else if (fieldDef?.typeName === "ZodOptional") {
            const inner = fieldDef.innerType?._def;
            if (inner?.typeName === "ZodString") {
              properties[key] = { type: "string", description: inner.description };
            } else {
              properties[key] = { type: "string" };
            }
          } else {
            properties[key] = { type: "string" };
          }
          
          if (fieldDef?.typeName !== "ZodOptional") {
            required.push(key);
          }
        }
        
        return {
          type: "object",
          properties,
          ...(required.length > 0 && { required }),
        };
      }
    }
    return { type: "object" };
  }

  /**
   * Create an AWS Lambda handler function.
   */
  private createLambdaHandler(options?: import("./types.js").AwsLambdaOptions) {
    const { stateAdapter, realtimeAdapter } = options || {};
    const app = this;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id",
      "Content-Type": "application/json",
    };

    return async (event: any, _lambdaContext: any) => {
      if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers: corsHeaders, body: "" };
      }

      let body: any = {};
      if (event.body) {
        try {
          body = JSON.parse(event.isBase64Encoded
            ? Buffer.from(event.body, "base64").toString()
            : event.body
          );
        } catch {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }),
          };
        }
      }

      try {
        const result = await app.handleMcpRequest(body, { stateAdapter, realtimeAdapter });
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(result),
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: err.message }, id: body.id ?? null }),
        };
      }
    };
  }

  /**
   * Get the HMR port for injecting the live reload client.
   * 
   * When MCP_PORT is set (by Creature), derives the HMR port deterministically
   * as MCP_PORT + HMR_PORT_OFFSET. This eliminates the race condition where
   * the hmr.json file might not exist yet when the server starts.
   * 
   * Falls back to reading hmr.json for non-Creature environments (manual npm run dev).
   */
  private getHmrPort(): number | null {
    if (!this.isDev) return null;
    if (this.hmrPort !== null) return this.hmrPort;
    
    // Derive from MCP_PORT when available (set by Creature)
    const mcpPort = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : null;
    if (mcpPort && !isNaN(mcpPort)) {
      this.hmrPort = mcpPort + HMR_PORT_OFFSET;
      return this.hmrPort;
    }
    
    // Fallback to config file for non-Creature environments
    const hmrConfig = readHmrConfig();
    if (hmrConfig) {
      this.hmrPort = hmrConfig.port;
    }
    this.hmrConfigChecked = true;
    
    return this.hmrPort;
  }

  // ==========================================================================
  // Private: Instance Helpers
  // ==========================================================================

  private generateInstanceId(): string {
    return `inst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Resolve instanceId for a tool call based on resource configuration.
   * 
   * - Singleton resources (default): Reuse same instanceId per resourceUri
   * - Multi-instance resources: Generate new instanceId (unless provided in input)
   * 
   * @param resourceUri The resource URI from tool config
   * @param inputInstanceId instanceId from tool call input args (if any)
   */
  private resolveInstanceId(resourceUri: string, inputInstanceId: unknown): string {
    // If instanceId provided in input, always use it (for both singleton and multi-instance)
    if (typeof inputInstanceId === "string") {
      return inputInstanceId;
    }

    const resource = this.resources.get(resourceUri);
    const isMultiInstance = resource?.config.multiInstance && this.hostSupportsMultiInstance;

    if (isMultiInstance) {
      // Multi-instance: always generate new
      return this.generateInstanceId();
    }

    // Singleton: reuse existing or create once
    let instanceId = this.singletonInstances.get(resourceUri);
    if (!instanceId) {
      instanceId = this.generateInstanceId();
      this.singletonInstances.set(resourceUri, instanceId);
      console.log(`[MCP] Singleton instance created for ${resourceUri}: ${instanceId}`);
    }
    return instanceId;
  }

  // ==========================================================================
  // Private: Schema Introspection
  // ==========================================================================

  /**
   * Extract the shape (properties) from a Zod schema.
   */
  private getSchemaShape(schema: z.ZodType): Record<string, unknown> | undefined {
    if ("_def" in schema && typeof (schema as any)._def?.shape === "function") {
      return (schema as any)._def.shape();
    }
    return undefined;
  }

  /**
   * Check if a field is required in a Zod schema.
   */
  private isFieldRequired(schema: z.ZodType, fieldName: string): boolean {
    const shape = this.getSchemaShape(schema);
    if (!shape || !(fieldName in shape)) return false;
    
    const field = shape[fieldName] as z.ZodType;
    if ("_def" in field && (field as any)._def?.typeName === "ZodOptional") {
      return false;
    }
    return true;
  }

  // ==========================================================================
  // Private: Express Server
  // ==========================================================================

  private createExpressApp(): express.Express {
    const app = express();
    app.use(express.json());

    // CORS middleware
    app.use((req: Request, res: Response, next: () => void) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Mcp-Session-Id");
      res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

      if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
      }
      next();
    });

    // Health check
    app.get("/health", (_req: Request, res: Response) => {
      res.json({
        status: "ok",
        server: this.config.name,
        version: this.config.version,
        activeSessions: this.transports.size,
        websockets: this.instanceWebSockets.size,
      });
    });

    // OAuth discovery endpoint
    if (this.oauthDiscoveryConfig) {
      app.get(this.oauthDiscoveryConfig.path, (_req: Request, res: Response) => {
        res.json(this.oauthDiscoveryConfig!.body);
      });
    }

    // MCP endpoints
    app.post("/mcp", (req, res) => this.handleMcpPost(req, res));
    app.get("/mcp", (req, res) => this.handleMcpGet(req, res));
    app.delete("/mcp", (req, res) => this.handleMcpDelete(req, res));

    return app;
  }

  private async handleMcpPost(req: Request, res: Response): Promise<void> {
    const transportSessionId = req.headers["mcp-session-id"] as string | undefined;
    const authorizationHeader = req.headers["authorization"] as string | undefined;

    // Run MCP handling within request context so tool handlers can access auth
    const context: RequestContext = { authorizationHeader };

    await requestContextStorage.run(context, async () => {
      try {
        let transport: StreamableHTTPServerTransport;

        if (transportSessionId && this.transports.has(transportSessionId)) {
          transport = this.transports.get(transportSessionId)!;
        } else if (!transportSessionId && isInitializeRequest(req.body)) {
          // Detect if host supports multiInstance based on client name
          // Creature clients support multiInstance, ChatGPT clients don't
          const clientName = req.body?.params?.clientInfo?.name;
          this.hostSupportsMultiInstance = clientName === "creature";
          console.log(`[MCP] Client: ${clientName}, multiInstance support: ${this.hostSupportsMultiInstance}`);

          transport = this.createTransport();
          const server = this.createMcpServer();
          await server.connect(transport);
          await transport.handleRequest(req, res, req.body);
          return;
        } else {
          res.status(400).json({
            jsonrpc: "2.0",
            error: { code: -32000, message: "Bad Request: No valid transport session ID" },
            id: null,
          });
          return;
        }

        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error("Error:", error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal server error" },
            id: null,
          });
        }
      }
    });
  }

  private async handleMcpGet(req: Request, res: Response): Promise<void> {
    const transportSessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!transportSessionId || !this.transports.has(transportSessionId)) {
      res.status(400).send("Invalid or missing transport session ID");
      return;
    }

    const transport = this.transports.get(transportSessionId)!;
    await transport.handleRequest(req, res);
  }

  private async handleMcpDelete(req: Request, res: Response): Promise<void> {
    const transportSessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!transportSessionId || !this.transports.has(transportSessionId)) {
      res.status(400).send("Invalid or missing transport session ID");
      return;
    }

    const transport = this.transports.get(transportSessionId)!;
    await transport.handleRequest(req, res);
  }

  // ==========================================================================
  // Private: MCP Server & Transport
  // ==========================================================================

  private createTransport(): StreamableHTTPServerTransport {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (newSessionId: string) => {
        this.transports.set(newSessionId, transport);
        console.log(`[MCP] Transport session created: ${newSessionId}`);
        this.config.onTransportSessionCreated?.({
          id: newSessionId,
          transport: "streamable-http",
        });
      },
    });

    transport.onerror = (error: Error) => {
      const sid = transport.sessionId || "unknown";
      console.error(`[MCP] Transport session error for ${sid}:`, error.message);
      this.config.onTransportSessionError?.(
        { id: sid, transport: "streamable-http" },
        error
      );
    };

    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) {
        console.log(`[MCP] Transport session closed: ${sid}. Client should re-initialize to continue.`);
        this.transports.delete(sid);
        this.config.onTransportSessionClosed?.({
          id: sid,
          transport: "streamable-http",
        });
      }
    };

    return transport;
  }

  private createMcpServer(): McpServer {
    const server = new McpServer(
      {
        name: this.config.name,
        version: this.config.version,
        ...(this.config.instructions && { instructions: this.config.instructions }),
      },
      { capabilities: { logging: {} } }
    );

    this.registerResources(server);
    this.registerTools(server);

    return server;
  }

  private registerResources(server: McpServer): void {
    for (const [uri, { config }] of this.resources) {
      server.registerResource(
        config.name,
        uri,
        {
          mimeType: MIME_TYPES.MCP_APPS,
          description: config.description,
          _meta: {
            ui: {
              multiInstance: config.multiInstance,
              ...(config.icon && {
                icon: {
                  data: svgToDataUri(config.icon.svg),
                  alt: config.icon.alt,
                },
              }),
            },
          },
        },
        async () => {
          let html = typeof config.html === "function" ? await config.html() : config.html;

          const hmrPort = this.getHmrPort();
          if (hmrPort) {
            html = injectHmrClient(html, hmrPort);
          }

          const mcpAppsMeta: Record<string, unknown> = {
            ui: {
              displayModes: config.displayModes,
              ...(config.icon && {
                icon: {
                  data: svgToDataUri(config.icon.svg),
                  alt: config.icon.alt,
                },
              }),
              ...(config.csp && { csp: config.csp }),
            },
            "openai/widgetPrefersBorder": true,
          };

          const chatgptMeta: Record<string, unknown> = {
            "openai/widgetPrefersBorder": true,
          };

          return {
            contents: [
              {
                uri,
                mimeType: MIME_TYPES.MCP_APPS,
                text: html,
                _meta: mcpAppsMeta,
              },
              {
                uri,
                mimeType: MIME_TYPES.CHATGPT,
                text: html,
                _meta: chatgptMeta,
              },
            ],
          };
        }
      );
    }
  }

  private registerTools(server: McpServer): void {
    for (const [name, { config, handler }] of this.tools) {
      const toolMeta = this.buildToolMeta(config);
      // Use passthrough() to allow extra keys like _creatureToken to pass through
      // MCP SDK validation. Without this, Zod strips unknown keys during validation.
      const baseSchema = config.input || z.object({});
      const inputSchema: z.ZodType = baseSchema instanceof z.ZodObject 
        ? baseSchema.passthrough() 
        : baseSchema;
      const description = this.buildToolDescription(config, inputSchema);
      const hasUi = !!config.ui;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (server.registerTool as any)(
        name,
        {
          description,
          inputSchema,
          ...(Object.keys(toolMeta).length > 0 && { _meta: toolMeta }),
        },
        async (args: Record<string, unknown>) => {
          try {
            // Extract Creature token from args (injected by Creature host)
            // or from Authorization header (OAuth bearer token from ChatGPT/other hosts)
            let creatureToken = args._creatureToken as string | undefined;
            if (!creatureToken) {
              const reqContext = requestContextStorage.getStore();
              creatureToken = extractBearerToken(reqContext?.authorizationHeader);
            }
            const { _creatureToken: _, ...cleanArgs } = args;
            
            const input = config.input ? config.input.parse(cleanArgs) : cleanArgs;
            
            // Determine instanceId for tools with UI
            let instanceId: string | undefined;
            if (hasUi && config.ui) {
              instanceId = this.resolveInstanceId(config.ui, cleanArgs.instanceId);
            }
            
            // Get resource config for WebSocket setup
            const resource = config.ui ? this.resources.get(config.ui) : undefined;
            const hasWebSocket = resource?.config.websocket === true;
            
            // Get or create WebSocket if resource has websocket: true
            let ws: WebSocketConnection<unknown, unknown> | undefined;
            let websocketUrl: string | undefined;
            if (hasWebSocket && instanceId) {
              ws = this.getOrCreateWebSocket(instanceId);
              websocketUrl = ws?.websocketUrl;
            }
            
            // Build handler context
            const context: ToolContext = {
              instanceId: instanceId || "",
              creatureToken,
              getState: <T>() => instanceId ? this.instanceState.get(instanceId) as T : undefined,
              setState: <T>(state: T) => {
                if (instanceId) {
                  this.instanceState.set(instanceId, state);
                }
              },
              send: <T>(message: T) => {
                if (ws) {
                  ws.send(message);
                }
              },
              onMessage: <T>(messageHandler: (msg: T) => void) => {
                if (ws) {
                  ws.onMessage(messageHandler as (msg: unknown) => void);
                }
              },
              onConnect: (connectHandler: () => void) => {
                if (ws) {
                  ws.onConnect(connectHandler);
                }
              },
              websocketUrl,
            };
            
            const result = await handler(input, context);
            return this.formatToolResult(result, instanceId, websocketUrl);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error(`[MCP] Tool "${name}" failed:`, err.message);
            this.config.onToolError?.(name, err, args);

            return {
              content: [{ type: "text" as const, text: err.message }],
              isError: true,
            };
          }
        }
      );
    }
  }

  /**
   * Get or create a WebSocket for an instance.
   * Used internally by registerTools when resource has websocket: true.
   */
  private getOrCreateWebSocket(instanceId: string): WebSocketConnection<unknown, unknown> {
    // Check if WebSocket already exists for this instance
    const existing = this.instanceWebSockets.get(instanceId);
    if (existing) {
      return existing;
    }
    
    // Create new WebSocket
    const ws = this.websocketManager.createWebSocket(instanceId, {}, this.getPort());
    this.instanceWebSockets.set(instanceId, ws as WebSocketConnection<unknown, unknown>);
    console.log(`[MCP] WebSocket created for instance ${instanceId}`);
    return ws as WebSocketConnection<unknown, unknown>;
  }

  private buildToolMeta(config: ToolConfig): Record<string, unknown> {
    const toolMeta: Record<string, unknown> = {};
    
    if (config.ui) {
      const visibility = config.visibility || ["model", "app"];
      toolMeta.ui = {
        resourceUri: config.ui,
        visibility,
        ...(config.displayModes && { displayModes: config.displayModes }),
        ...(config.defaultDisplayMode && { defaultDisplayMode: config.defaultDisplayMode }),
      };
      toolMeta["openai/outputTemplate"] = config.ui;
      // ChatGPT requires this to allow widget/UI to call the tool
      toolMeta["openai/widgetAccessible"] = visibility.includes("app");
    }
    
    if (config.loadingMessage) {
      toolMeta["openai/toolInvocation/invoking"] = config.loadingMessage;
    }
    if (config.completedMessage) {
      toolMeta["openai/toolInvocation/invoked"] = config.completedMessage;
    }

    // Add Creature-specific metadata if auth is configured
    if (this.config.auth?.creatureManaged) {
      toolMeta.creature = {
        auth: { managed: true },
      };
    }

    return toolMeta;
  }

  private buildToolDescription(config: ToolConfig, inputSchema: z.ZodType): string {
    let description = config.description;
    
    if (config.ui) {
      const schemaShape = this.getSchemaShape(inputSchema);
      const hasInstanceIdInSchema = schemaShape && "instanceId" in schemaShape;
      const isInstanceIdRequired = this.isFieldRequired(inputSchema, "instanceId");
      
      if (isInstanceIdRequired) {
        description += " Requires instanceId from a previous tool response.";
      } else if (hasInstanceIdInSchema) {
        description += " Returns instanceId. Pass it in subsequent calls to target the same widget.";
      } else {
        description += " Returns instanceId for the new widget.";
      }
    }

    return description;
  }

  /**
   * Format tool result for MCP protocol response.
   * 
   * SDK manages instanceId and websocketUrl automatically.
   */
  private formatToolResult(result: ToolResult, instanceId?: string, websocketUrl?: string) {
    const text = result.text || JSON.stringify(result.data || {});

    const structuredContent: Record<string, unknown> = {
      ...result.data,
      ...(result.title && { title: result.title }),
      ...(result.inlineHeight && { inlineHeight: result.inlineHeight }),
      ...(instanceId && { instanceId }),
      ...(websocketUrl && { websocketUrl }),
    };

    const meta: Record<string, unknown> = {};
    if (instanceId) {
      meta["openai/widgetSessionId"] = instanceId;
    }

    return {
      content: [{ type: "text" as const, text }],
      ...(Object.keys(structuredContent).length > 0 && { structuredContent }),
      ...(Object.keys(meta).length > 0 && { _meta: meta }),
      ...(result.isError && { isError: true }),
    };
  }

  // ==========================================================================
  // Private: Shutdown
  // ==========================================================================

  private registerShutdownHandlers(): void {
    if (this.shutdownRegistered) return;
    this.shutdownRegistered = true;

    const handleShutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      console.log(`[MCP] ${signal} received, shutting down gracefully...`);
      await this.stop();
      process.exit(0);
    };

    process.on("SIGINT", () => handleShutdown("SIGINT"));
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Detect if a file path is within the SDK package.
 */
/**
 * Checks if a filename belongs to the SDK itself.
 */
function isSDKPath(filename: string): boolean {
  return (
    filename.includes("/public/sdk/") ||
    filename.includes("\\public\\sdk\\") ||
    filename.includes("/@creature-ai/sdk/") ||
    filename.includes("\\@creature-ai\\sdk\\")
  );
}

/**
 * Get the directory of the file that called createApp().
 */
function getCallerDirectory(): string {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const err = new Error();
  const stack = err.stack as unknown as NodeJS.CallSite[];
  Error.prepareStackTrace = originalPrepareStackTrace;

  for (const frame of stack) {
    const filename = frame.getFileName();
    if (filename && !isSDKPath(filename)) {
      return filename.startsWith("file://") 
        ? path.dirname(fileURLToPath(filename))
        : path.dirname(filename);
    }
  }
  return process.cwd();
}

/**
 * Create a new MCP App.
 */
export function createApp(config: AppConfig): App {
  const callerDir = getCallerDirectory();
  return new App(config, callerDir);
}
