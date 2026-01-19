import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Interface for external state storage.
 * Implementations can use Redis, DynamoDB, MongoDB, etc.
 */
interface StateAdapter {
    /**
     * Get state for an instance.
     */
    get<T>(instanceId: string): Promise<T | undefined>;
    /**
     * Set state for an instance.
     */
    set<T>(instanceId: string, state: T): Promise<void>;
    /**
     * Delete state for an instance.
     */
    delete(instanceId: string): Promise<void>;
}
/**
 * Interface for external realtime communication.
 * Implementations can use Pusher, Ably, Redis pub/sub, etc.
 */
interface RealtimeAdapter {
    /**
     * Send a message to all clients subscribed to an instance.
     */
    send<T>(instanceId: string, message: T): Promise<void>;
    /**
     * Subscribe to messages for an instance.
     */
    subscribe(instanceId: string, handler: (message: unknown) => void): () => void;
    /**
     * Get the WebSocket/channel URL for clients to connect.
     */
    getWebSocketUrl(instanceId: string): string;
}
/**
 * Options for configuring adapters.
 */
interface AdapterOptions {
    /** External state adapter (for stateful features in serverless). */
    stateAdapter?: StateAdapter;
    /** External realtime adapter (for WebSocket-like features in serverless). */
    realtimeAdapter?: RealtimeAdapter;
}
/**
 * Options for Vercel serverless handler.
 */
interface VercelMcpOptions extends AdapterOptions {
}
/**
 * Options for awsLambda adapter.
 */
interface AwsLambdaOptions extends AdapterOptions {
}
/**
 * MIME types for cross-platform compatibility.
 */
declare const MIME_TYPES: {
    readonly MCP_APPS: "text/html;profile=mcp-app";
    readonly CHATGPT: "text/html+skybridge";
};
/**
 * Display modes for UI resources.
 */
type DisplayMode = "pip" | "inline" | "fullscreen";
/**
 * Visibility options for tools.
 * - "model": AI/Agent can call the tool
 * - "app": UI can call the tool
 */
type ToolVisibility = "model" | "app";
/**
 * Icon configuration for UI resources.
 */
interface IconConfig {
    /** SVG string (must use currentColor for theming) */
    svg: string;
    /** Alt text for accessibility */
    alt: string;
}
/**
 * Resource configuration.
 */
interface ResourceConfig {
    /** Display name shown in UI */
    name: string;
    /** Resource URI (must start with ui://) */
    uri: string;
    /** Optional description */
    description?: string;
    /** Supported display modes */
    displayModes: DisplayMode[];
    /**
     * HTML content for the resource.
     *
     * Accepts three formats:
     * 1. **File path** (local development): `"ui/main.html"` - loaded from filesystem
     * 2. **Raw HTML** (serverless-safe): `"<!DOCTYPE html>..."` - used directly
     * 3. **Function** (lazy loading): `() => htmlContent` - called when needed
     *
     * The SDK auto-detects HTML content (starts with `<`) vs file paths.
     * For serverless (Vercel, Lambda), use raw HTML or a function.
     *
     * @example
     * // Local development - file path
     * html: "ui/main.html"
     *
     * @example
     * // Serverless - bundled HTML (import at build time)
     * import { BUNDLED_HTML } from "./ui-bundle.js";
     * html: BUNDLED_HTML
     *
     * @example
     * // Serverless - function (lazy)
     * html: () => fs.readFileSync("./dist/ui/main.html", "utf-8")
     */
    html: string | (() => string | Promise<string>);
    /** Optional icon for pips */
    icon?: IconConfig;
    /** CSP configuration for external API access */
    csp?: {
        connectDomains?: string[];
        resourceDomains?: string[];
    };
    /**
     * Allow multiple instances of this resource.
     * Default: false (singleton - all tools share one instance per resourceUri)
     *
     * - false: Singleton. SDK reuses the same instanceId for all tool calls.
     * - true: Multi-instance. SDK generates new instanceId each time (unless provided in input).
     *
     * Note: multiInstance is only supported on Creature. On ChatGPT, resources always behave as singleton.
     */
    multiInstance?: boolean;
    /**
     * Enable WebSocket for real-time communication with the UI.
     * When true, SDK automatically manages WebSocket lifecycle and provides
     * `context.send()` and `context.onMessage()` in tool handlers.
     */
    websocket?: boolean;
}
/**
 * Internal resource definition.
 */
interface ResourceDefinition {
    config: ResourceConfig;
}
/**
 * Tool configuration.
 */
interface ToolConfig<TInput extends z.ZodType = z.ZodType> {
    /** Tool description (shown to AI) */
    description: string;
    /** Zod schema for input validation */
    input?: TInput;
    /** Resource URI to link this tool to a UI */
    ui?: string;
    /** Who can call this tool */
    visibility?: ToolVisibility[];
    /** Supported display modes for this tool */
    displayModes?: DisplayMode[];
    /** Preferred display mode */
    defaultDisplayMode?: DisplayMode;
    /** Loading message shown while tool is running (used by ChatGPT) */
    loadingMessage?: string;
    /** Completion message shown when tool finishes (used by ChatGPT) */
    completedMessage?: string;
}
/**
 * Tool result returned from handler.
 */
interface ToolResult {
    /** Structured data for UI rendering */
    data?: Record<string, unknown>;
    /** Text content for AI context */
    text?: string;
    /** Title for panel/widget */
    title?: string;
    /** Height hint for inline widgets (60-300px) */
    inlineHeight?: number;
    /** Whether this is an error result */
    isError?: boolean;
    /**
     * Skip widget creation for this tool call.
     * When true, no PIP/panel is created even if the tool has a `ui` configured.
     * Use for read-only operations (read, list, delete) that shouldn't open UI.
     */
    noWidget?: boolean;
}
/**
 * Tool handler function type.
 */
type ToolHandler<TInput> = (input: TInput, context: ToolContext) => ToolResult | Promise<ToolResult>;
/**
 * Context passed to tool handlers.
 * Provides access to instanceId, state management, and WebSocket communication.
 */
interface ToolContext {
    /**
     * The instance ID for this tool call.
     * Generated before handler runs. Use for server-side state keying.
     * Automatically attached to tool result for UI routing.
     */
    instanceId: string;
    /**
     * Creature App Token for identity retrieval.
     * ONLY present when:
     * 1. App opted into Creature-managed auth (`auth: { creatureManaged: true }`)
     * 2. Tool call originated from Creature host
     *
     * Use `getIdentity(context.creatureToken)` to retrieve user identity
     * for multi-tenant data access.
     *
     * @example
     * ```typescript
     * app.tool("save_note", { ... }, async ({ content }, context) => {
     *   if (!context.creatureToken) {
     *     return { error: "Authentication required" };
     *   }
     *   const identity = await getIdentity(context.creatureToken);
     *   await db.notes.insert({
     *     user_id: identity.user.id,
     *     content,
     *   });
     * });
     * ```
     */
    creatureToken?: string;
    /**
     * Get server-side state for this instance.
     * State is NOT sent to UI — use for PIDs, connections, handles.
     */
    getState: <T>() => T | undefined;
    /**
     * Set server-side state for this instance.
     * State is NOT sent to UI — use for PIDs, connections, handles.
     */
    setState: <T>(state: T) => void;
    /**
     * Send a message to the UI via WebSocket.
     * Only available if the resource has `websocket: true`.
     * For singleton resources, sends to the single shared WebSocket.
     * For multi-instance resources, sends to this instance's WebSocket.
     */
    send: <T>(message: T) => void;
    /**
     * Register a handler for messages from the UI.
     * Only available if the resource has `websocket: true`.
     */
    onMessage: <T>(handler: (message: T) => void) => void;
    /**
     * Register a handler called when a UI client connects to the WebSocket.
     * Useful for sending buffered data when a client connects.
     * Only available if the resource has `websocket: true`.
     */
    onConnect: (handler: () => void) => void;
    /**
     * WebSocket URL for the UI to connect to.
     * Only available if the resource has `websocket: true`.
     * Automatically included in tool result's structuredContent.
     */
    websocketUrl: string | undefined;
}
/**
 * Internal tool definition with handler.
 */
interface ToolDefinition<TInput = unknown> {
    config: ToolConfig;
    handler: ToolHandler<TInput>;
}
/**
 * Context passed to onInstanceDestroy callback.
 */
interface InstanceDestroyContext {
    /** The instanceId being destroyed */
    instanceId: string;
    /** Last server-side state for this instance (from setState calls) */
    state: unknown;
}
/**
 * Supported MCP transport types.
 * Currently only StreamableHTTP is supported by the SDK server.
 * Stdio may be added in the future.
 */
type TransportType = "streamable-http" | "stdio";
/**
 * Information about a transport session.
 * Provides details about an active MCP protocol connection.
 */
interface TransportSessionInfo {
    /** Unique session identifier */
    id: string;
    /** The transport type for this session */
    transport: TransportType;
}
/**
 * Creature-managed authentication configuration.
 * When enabled, Creature provides user identity and tokens to your app.
 */
interface CreatureAuthConfig {
    /**
     * Enable Creature-managed authentication.
     * When true, your app receives user identity (id, email, name) and
     * organization/project context via hostContext.creature.
     *
     * Apps can use this for:
     * - Auto-registering users without login screens
     * - Scoping data to users/orgs/projects
     * - Backend API calls with verified identity
     *
     * @default false
     */
    creatureManaged?: boolean;
}
/**
 * App configuration.
 */
interface AppConfig {
    /** App name (used in protocol handshake) */
    name: string;
    /** App version */
    version: string;
    /**
     * Authentication configuration.
     * Enable Creature-managed auth to receive user identity automatically.
     *
     * @example
     * auth: { creatureManaged: true }
     */
    auth?: CreatureAuthConfig;
    /**
     * High-level instructions for using this MCP.
     * Sent to the model during initialization to provide context about
     * how to use the MCP's tools effectively.
     *
     * @example
     * instructions: `This MCP manages markdown notes.
     * When editing an existing note, ALWAYS use action:"read" first to get current content,
     * then apply your changes with action:"save" to avoid overwriting user edits.`
     */
    instructions?: string;
    /** Port for HTTP transport (default: 3000 or MCP_PORT env) */
    port?: number;
    /** Enable dev mode with HMR support (default: auto-detect from NODE_ENV) */
    dev?: boolean;
    /** HMR port override (default: auto-detect from Vite config or 5173) */
    hmrPort?: number;
    /**
     * Called when a new transport session is created.
     * Transport sessions are MCP protocol connections (not instances).
     */
    onTransportSessionCreated?: (info: TransportSessionInfo) => void;
    /**
     * Called when a transport session is closed.
     * Clients should re-initialize to continue.
     */
    onTransportSessionClosed?: (info: TransportSessionInfo) => void;
    /**
     * Called when a transport session error occurs.
     * Useful for logging and monitoring connection health.
     */
    onTransportSessionError?: (info: TransportSessionInfo, error: Error) => void;
    /**
     * Called when a tool handler throws an error.
     * The error is still returned to the client as an MCP error.
     */
    onToolError?: (toolName: string, error: Error, args: unknown) => void;
    /**
     * Called during graceful shutdown, before closing connections.
     * Use this to clean up resources (e.g., close database connections).
     */
    onShutdown?: () => Promise<void> | void;
    /**
     * Timeout for graceful shutdown in milliseconds (default: 5000).
     * After this timeout, remaining connections are force-closed.
     */
    gracefulShutdownTimeout?: number;
    /**
     * HTTP keep-alive timeout during shutdown in milliseconds (default: 5000).
     * Controls how long to wait for in-flight requests to complete.
     */
    keepAliveTimeout?: number;
}
/**
 * WebSocket connection for an instance.
 *
 * Provides real-time bidirectional communication between the server
 * and all UI clients connected to a particular instance.
 */
interface WebSocketConnection<TServer = unknown, TClient = unknown> {
    /** The instance ID this WebSocket belongs to */
    instanceId: string;
    /** WebSocket URL for clients to connect */
    websocketUrl: string;
    /** Send a message to all connected clients */
    send: (message: TServer) => void;
    /** Register a handler for incoming client messages */
    onMessage: (handler: (message: TClient) => void) => void;
    /** Register a handler called when a new client connects */
    onConnect: (handler: () => void) => void;
    /** Close the WebSocket and disconnect all clients */
    close: () => void;
    /** Number of connected clients */
    readonly clientCount: number;
}

declare class App {
    private config;
    private tools;
    private resources;
    private transports;
    private websocketManager;
    private instanceWebSockets;
    private httpServer;
    private isDev;
    private hmrPort;
    private hmrConfigChecked;
    private callerDir;
    private shutdownRegistered;
    private isShuttingDown;
    /** Server-side instance state, keyed by instanceId. */
    private instanceState;
    /** Callbacks to invoke when an instance is destroyed. */
    private instanceDestroyCallbacks;
    /** Singleton instanceIds per resourceUri (for non-multiInstance resources). */
    private singletonInstances;
    /** Whether the connected host supports multiInstance. ChatGPT doesn't, Creature does. */
    private hostSupportsMultiInstance;
    constructor(config: AppConfig, callerDir?: string);
    /**
     * Define a UI resource.
     */
    resource(config: ResourceConfig): this;
    /**
     * Define a tool.
     */
    tool<TInput extends z.ZodType>(name: string, config: ToolConfig<TInput>, handler: ToolHandler<z.infer<TInput>>): this;
    /**
     * Start the MCP server.
     */
    start(): Promise<void>;
    /**
     * Stop the MCP server gracefully.
     */
    stop(): Promise<void>;
    /**
     * Create an instance with optional WebSocket support.
     *
     * Most tools don't need this — the SDK creates instances automatically.
     * Only call createInstance() when you need a WebSocket URL for real-time updates.
     */
    createInstance<TServer = unknown, TClient = unknown>(options?: {
        websocket?: boolean;
    }): {
        instanceId: string;
        websocketUrl?: string;
        send?: (msg: TServer) => void;
        onMessage?: (handler: (msg: TClient) => void) => void;
        onConnect?: (handler: () => void) => void;
    };
    /**
     * Register a callback to be invoked when an instance is destroyed.
     */
    onInstanceDestroy(callback: (ctx: InstanceDestroyContext) => void): void;
    /**
     * Destroy an instance and clean up its resources.
     */
    destroyInstance(instanceId: string): boolean;
    /**
     * Check if an instance exists.
     */
    hasInstance(instanceId: string): boolean;
    /**
     * Get instance state.
     */
    getInstanceState<T>(instanceId: string): T | undefined;
    /**
     * Set instance state directly.
     */
    setInstanceState<T>(instanceId: string, state: T): void;
    /**
     * Create a WebSocket for an existing instance.
     *
     * Use this when you need real-time communication for an instance
     * that was created by a tool handler (which provides instanceId via context).
     */
    createWebSocketForInstance<TServer = unknown, TClient = unknown>(instanceId: string): WebSocketConnection<TServer, TClient> | null;
    /**
     * Get list of active transport sessions.
     */
    getTransportSessions(): TransportSessionInfo[];
    /**
     * Get the count of active transport sessions.
     */
    getTransportSessionCount(): number;
    /**
     * Get the app configuration.
     */
    getConfig(): AppConfig;
    /**
     * Get all tool definitions.
     */
    getToolDefinitions(): Map<string, ToolDefinition>;
    /**
     * Get all resource definitions.
     */
    getResourceDefinitions(): Map<string, ResourceDefinition>;
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
    toVercelFunctionHandler(options?: VercelMcpOptions): (reqOrRequest: any, res?: any) => Promise<any>;
    /**
     * Create an AWS Lambda handler.
     *
     * Note: This returns a Lambda handler function. The implementation
     * is inline to avoid circular dependencies.
     */
    toAwsLambda(options?: AwsLambdaOptions): (event: any, _lambdaContext: any) => Promise<{
        statusCode: number;
        headers: {
            "Access-Control-Allow-Origin": string;
            "Access-Control-Allow-Methods": string;
            "Access-Control-Allow-Headers": string;
            "Content-Type": string;
        };
        body: string;
    }>;
    /**
     * Close a specific transport session.
     */
    closeTransportSession(sessionId: string): boolean;
    private getPort;
    private getCallerDir;
    /**
     * Create a ToolContext for serverless environments.
     * Shared between Vercel and Lambda adapters to avoid duplication.
     */
    /**
     * In-memory state for serverless when no external adapter provided.
     * Only useful for local development - won't persist across invocations in production.
     */
    private serverlessMemoryState;
    private serverlessStateWarningLogged;
    private serverlessRealtimeWarningLogged;
    private createServerlessContext;
    /**
     * Format tool result for serverless response.
     * Shared between Vercel and Lambda adapters.
     * Must include all fields that formatToolResult includes (title, inlineHeight, etc.).
     */
    private formatServerlessResult;
    /**
     * Create a Vercel serverless function handler.
     * Handles MCP JSON-RPC protocol directly - no mcp-handler or Next.js needed.
     */
    private createVercelHandler;
    /**
     * Handle an MCP JSON-RPC request.
     * Shared logic for all serverless handlers.
     */
    private handleMcpRequest;
    /**
     * Convert Zod schema to JSON Schema for tool definitions.
     */
    private zodToJsonSchema;
    /**
     * Create an AWS Lambda handler function.
     */
    private createLambdaHandler;
    private getHmrPort;
    private generateInstanceId;
    /**
     * Resolve instanceId for a tool call based on resource configuration.
     *
     * - Singleton resources (default): Reuse same instanceId per resourceUri
     * - Multi-instance resources: Generate new instanceId (unless provided in input)
     *
     * @param resourceUri The resource URI from tool config
     * @param inputInstanceId instanceId from tool call input args (if any)
     */
    private resolveInstanceId;
    /**
     * Extract the shape (properties) from a Zod schema.
     */
    private getSchemaShape;
    /**
     * Check if a field is required in a Zod schema.
     */
    private isFieldRequired;
    private createExpressApp;
    private handleMcpPost;
    private handleMcpGet;
    private handleMcpDelete;
    private createTransport;
    private createMcpServer;
    private registerResources;
    private registerTools;
    /**
     * Get or create a WebSocket for an instance.
     * Used internally by registerTools when resource has websocket: true.
     */
    private getOrCreateWebSocket;
    private buildToolMeta;
    private buildToolDescription;
    /**
     * Format tool result for MCP protocol response.
     *
     * SDK manages instanceId and websocketUrl automatically.
     */
    private formatToolResult;
    private registerShutdownHandlers;
}
/**
 * Create a new MCP App.
 */
declare function createApp(config: AppConfig): App;

declare function svgToDataUri(svg: string): string;
/**
 * Load HTML from a file path.
 * Automatically resolves paths like "ui/main.html" to "dist/ui/main.html"
 * regardless of whether running from src/ or dist/.
 */
declare function loadHtml(filePath: string, basePath?: string): string;
/**
 * Check if a string is HTML content (vs a file path).
 *
 * HTML content detection:
 * - Starts with `<` (with optional whitespace/BOM)
 * - Starts with `<!DOCTYPE` (case-insensitive)
 *
 * This enables serverless deployments where HTML is bundled at build time
 * and passed directly as a string, rather than loaded from the filesystem.
 */
declare function isHtmlContent(str: string): boolean;
/**
 * Create an HTML loader function for a file path or HTML content.
 *
 * For serverless environments (Vercel, Lambda), developers can:
 * 1. Pass HTML content directly: `html: "<!DOCTYPE html>..."`
 * 2. Use a function: `html: () => BUNDLED_HTML`
 * 3. Import bundled HTML: `html: await import("./ui-bundle.js").then(m => m.HTML)`
 *
 * The SDK automatically detects whether the string is:
 * - HTML content (starts with `<`) → returns as-is
 * - File path → loads via filesystem (local dev only)
 */
declare function htmlLoader(htmlOrPath: string, basePath?: string): () => string;

/**
 * Middleware for adding cross-platform compatibility to the official MCP SDK.
 *
 * Wrap your McpServer to automatically output dual formats for both
 * MCP Apps (Creature) and ChatGPT Apps SDK.
 *
 * @example
 * ```ts
 * import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
 * import { wrapServer } from "@creature-ai/sdk/server";
 *
 * const server = wrapServer(new McpServer({ name: "my-app", version: "1.0.0" }));
 *
 * // Use the standard MCP SDK API - dual format is automatic
 * server.registerResource("Panel", "ui://app/panel", { ... }, handler);
 * server.registerTool("search", { ... }, handler);
 * ```
 */

/**
 * Wrap an McpServer to automatically add dual-format support.
 *
 * This intercepts `registerResource` and `registerTool` calls to automatically
 * include both MCP Apps and ChatGPT metadata/MIME types.
 *
 * @param server - An McpServer instance from @modelcontextprotocol/sdk
 * @returns The same server with intercepted registration methods
 *
 * @example
 * ```ts
 * import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
 * import { wrapServer } from "@creature-ai/sdk/server";
 *
 * const server = wrapServer(new McpServer({ name: "my-app", version: "1.0.0" }));
 *
 * // Register resources normally - dual MIME types added automatically
 * server.registerResource("Panel", "ui://app/panel", {
 *   mimeType: "text/html",
 *   description: "My panel",
 * }, async () => ({
 *   contents: [{ uri: "ui://app/panel", mimeType: "text/html", text: html }],
 * }));
 *
 * // Register tools normally - dual metadata added automatically
 * server.registerTool("search", {
 *   description: "Search",
 *   inputSchema: z.object({ query: z.string() }),
 *   _meta: {
 *     ui: { resourceUri: "ui://app/panel", displayModes: ["pip"] },
 *     loadingMessage: "Searching...",  // Will become openai/toolInvocation/invoking
 *   },
 * }, handler);
 * ```
 */
declare function wrapServer<T extends McpServer>(server: T): T;

/**
 * User identity from a Creature token.
 */
interface CreatureUser {
    /** Unique, stable user identifier */
    id: string;
    /** User's email address */
    email: string;
    /** User's display name (may be undefined) */
    name?: string;
}
/**
 * Organization context from a Creature token.
 */
interface CreatureOrganization {
    /** Unique organization identifier */
    id: string;
    /** Organization display name */
    name: string;
    /** URL-safe organization slug */
    slug: string;
}
/**
 * Project context from a Creature token.
 */
interface CreatureProject {
    /** Unique project identifier */
    id: string;
    /** Project display name */
    name: string;
}
/**
 * Session context from a Creature token.
 */
interface CreatureSession {
    /** Unique session identifier */
    id: string;
}
/**
 * Identity claims from a Creature App Token.
 * Returned by getIdentity() on successful retrieval.
 */
interface CreatureIdentity {
    /** User identity (always present for valid tokens) */
    user: CreatureUser;
    /** Organization context (present if user was in an org context) */
    organization?: CreatureOrganization;
    /** Project context (present if user was in a project context) */
    project?: CreatureProject;
    /** Session context */
    session?: CreatureSession;
    /** Token expiration time (ISO 8601 string) */
    expiresAt: string;
}
/**
 * Error thrown when identity retrieval fails.
 */
declare class CreatureIdentityError extends Error {
    /** Error code from the identity API */
    code: string;
    constructor({ code, message }: {
        code: string;
        message: string;
    });
}
/**
 * Configuration for the Creature identity API.
 */
interface IdentityConfig {
    /**
     * Base URL for the Creature API.
     * Defaults to https://api.creature.run
     * Can be overridden for testing or custom deployments.
     */
    apiUrl?: string;
}
/**
 * Retrieves user identity from a Creature App Token.
 *
 * Use this in your MCP App tool handlers to get the authenticated user's
 * identity. The token is provided via `context.creatureToken` when you
 * opt into Creature-managed auth.
 *
 * @param creatureToken - The App Token from context.creatureToken
 * @param config - Optional configuration (e.g., custom API URL)
 * @returns The identity claims (user, organization, project, session)
 * @throws {CreatureIdentityError} If the token is invalid, expired, or malformed
 *
 * @example
 * ```typescript
 * import { getIdentity } from "@creature-ai/sdk/server";
 *
 * app.tool("save_note", { ... }, async ({ content }, context) => {
 *   if (!context.creatureToken) {
 *     return { text: "Authentication required", isError: true };
 *   }
 *
 *   try {
 *     const identity = await getIdentity(context.creatureToken);
 *
 *     // Use identity to scope data access
 *     await db.notes.insert({
 *       user_id: identity.user.id,
 *       org_id: identity.organization?.id,
 *       content,
 *     });
 *
 *     return { text: "Note saved" };
 *   } catch (err) {
 *     if (err instanceof CreatureIdentityError) {
 *       return { text: err.message, isError: true };
 *     }
 *     throw err;
 *   }
 * });
 * ```
 */
declare const getIdentity: (creatureToken: string | undefined | null, config?: IdentityConfig) => Promise<CreatureIdentity>;

export { type AdapterOptions, App, type AppConfig, type AwsLambdaOptions, type CreatureIdentity, CreatureIdentityError, type CreatureOrganization, type CreatureProject, type CreatureSession, type CreatureUser, type DisplayMode, type IconConfig, type InstanceDestroyContext, MIME_TYPES, type RealtimeAdapter, type ResourceConfig, type StateAdapter, type ToolConfig, type ToolContext, type ToolHandler, type ToolResult, type ToolVisibility, type TransportSessionInfo, type TransportType, type VercelMcpOptions, type WebSocketConnection, createApp, getIdentity, htmlLoader, isHtmlContent, loadHtml, svgToDataUri, wrapServer };
