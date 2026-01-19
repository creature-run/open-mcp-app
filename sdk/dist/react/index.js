// src/react/useHost.ts
import { useSyncExternalStore, useEffect, useRef, useMemo } from "react";

// ../../../node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-compat.js
import * as z3rt from "zod/v3";
import * as z4mini from "zod/v4-mini";
function isZ4Schema(s2) {
  const schema = s2;
  return !!schema._zod;
}
function safeParse2(schema, data) {
  if (isZ4Schema(schema)) {
    const result2 = z4mini.safeParse(schema, data);
    return result2;
  }
  const v3Schema = schema;
  const result = v3Schema.safeParse(data);
  return result;
}
function getObjectShape(schema) {
  if (!schema)
    return void 0;
  let rawShape;
  if (isZ4Schema(schema)) {
    const v4Schema = schema;
    rawShape = v4Schema._zod?.def?.shape;
  } else {
    const v3Schema = schema;
    rawShape = v3Schema.shape;
  }
  if (!rawShape)
    return void 0;
  if (typeof rawShape === "function") {
    try {
      return rawShape();
    } catch {
      return void 0;
    }
  }
  return rawShape;
}
function getLiteralValue(schema) {
  if (isZ4Schema(schema)) {
    const v4Schema = schema;
    const def2 = v4Schema._zod?.def;
    if (def2) {
      if (def2.value !== void 0)
        return def2.value;
      if (Array.isArray(def2.values) && def2.values.length > 0) {
        return def2.values[0];
      }
    }
  }
  const v3Schema = schema;
  const def = v3Schema._def;
  if (def) {
    if (def.value !== void 0)
      return def.value;
    if (Array.isArray(def.values) && def.values.length > 0) {
      return def.values[0];
    }
  }
  const directValue = schema.value;
  if (directValue !== void 0)
    return directValue;
  return void 0;
}

// ../../../node_modules/@modelcontextprotocol/sdk/dist/esm/types.js
import * as z from "zod/v4";
var RELATED_TASK_META_KEY = "io.modelcontextprotocol/related-task";
var JSONRPC_VERSION = "2.0";
var AssertObjectSchema = z.custom((v) => v !== null && (typeof v === "object" || typeof v === "function"));
var ProgressTokenSchema = z.union([z.string(), z.number().int()]);
var CursorSchema = z.string();
var TaskCreationParamsSchema = z.looseObject({
  /**
   * Time in milliseconds to keep task results available after completion.
   * If null, the task has unlimited lifetime until manually cleaned up.
   */
  ttl: z.union([z.number(), z.null()]).optional(),
  /**
   * Time in milliseconds to wait between task status requests.
   */
  pollInterval: z.number().optional()
});
var TaskMetadataSchema = z.object({
  ttl: z.number().optional()
});
var RelatedTaskMetadataSchema = z.object({
  taskId: z.string()
});
var RequestMetaSchema = z.looseObject({
  /**
   * If specified, the caller is requesting out-of-band progress notifications for this request (as represented by notifications/progress). The value of this parameter is an opaque token that will be attached to any subsequent notifications. The receiver is not obligated to provide these notifications.
   */
  progressToken: ProgressTokenSchema.optional(),
  /**
   * If specified, this request is related to the provided task.
   */
  [RELATED_TASK_META_KEY]: RelatedTaskMetadataSchema.optional()
});
var BaseRequestParamsSchema = z.object({
  /**
   * See [General fields: `_meta`](/specification/draft/basic/index#meta) for notes on `_meta` usage.
   */
  _meta: RequestMetaSchema.optional()
});
var TaskAugmentedRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * If specified, the caller is requesting task-augmented execution for this request.
   * The request will return a CreateTaskResult immediately, and the actual result can be
   * retrieved later via tasks/result.
   *
   * Task augmentation is subject to capability negotiation - receivers MUST declare support
   * for task augmentation of specific request types in their capabilities.
   */
  task: TaskMetadataSchema.optional()
});
var isTaskAugmentedRequestParams = (value) => TaskAugmentedRequestParamsSchema.safeParse(value).success;
var RequestSchema = z.object({
  method: z.string(),
  params: BaseRequestParamsSchema.loose().optional()
});
var NotificationsParamsSchema = z.object({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: RequestMetaSchema.optional()
});
var NotificationSchema = z.object({
  method: z.string(),
  params: NotificationsParamsSchema.loose().optional()
});
var ResultSchema = z.looseObject({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: RequestMetaSchema.optional()
});
var RequestIdSchema = z.union([z.string(), z.number().int()]);
var JSONRPCRequestSchema = z.object({
  jsonrpc: z.literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  ...RequestSchema.shape
}).strict();
var isJSONRPCRequest = (value) => JSONRPCRequestSchema.safeParse(value).success;
var JSONRPCNotificationSchema = z.object({
  jsonrpc: z.literal(JSONRPC_VERSION),
  ...NotificationSchema.shape
}).strict();
var isJSONRPCNotification = (value) => JSONRPCNotificationSchema.safeParse(value).success;
var JSONRPCResultResponseSchema = z.object({
  jsonrpc: z.literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  result: ResultSchema
}).strict();
var isJSONRPCResultResponse = (value) => JSONRPCResultResponseSchema.safeParse(value).success;
var ErrorCode;
(function(ErrorCode2) {
  ErrorCode2[ErrorCode2["ConnectionClosed"] = -32e3] = "ConnectionClosed";
  ErrorCode2[ErrorCode2["RequestTimeout"] = -32001] = "RequestTimeout";
  ErrorCode2[ErrorCode2["ParseError"] = -32700] = "ParseError";
  ErrorCode2[ErrorCode2["InvalidRequest"] = -32600] = "InvalidRequest";
  ErrorCode2[ErrorCode2["MethodNotFound"] = -32601] = "MethodNotFound";
  ErrorCode2[ErrorCode2["InvalidParams"] = -32602] = "InvalidParams";
  ErrorCode2[ErrorCode2["InternalError"] = -32603] = "InternalError";
  ErrorCode2[ErrorCode2["UrlElicitationRequired"] = -32042] = "UrlElicitationRequired";
})(ErrorCode || (ErrorCode = {}));
var JSONRPCErrorResponseSchema = z.object({
  jsonrpc: z.literal(JSONRPC_VERSION),
  id: RequestIdSchema.optional(),
  error: z.object({
    /**
     * The error type that occurred.
     */
    code: z.number().int(),
    /**
     * A short description of the error. The message SHOULD be limited to a concise single sentence.
     */
    message: z.string(),
    /**
     * Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.).
     */
    data: z.unknown().optional()
  })
}).strict();
var isJSONRPCErrorResponse = (value) => JSONRPCErrorResponseSchema.safeParse(value).success;
var JSONRPCMessageSchema = z.union([
  JSONRPCRequestSchema,
  JSONRPCNotificationSchema,
  JSONRPCResultResponseSchema,
  JSONRPCErrorResponseSchema
]);
var JSONRPCResponseSchema = z.union([JSONRPCResultResponseSchema, JSONRPCErrorResponseSchema]);
var EmptyResultSchema = ResultSchema.strict();
var CancelledNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The ID of the request to cancel.
   *
   * This MUST correspond to the ID of a request previously issued in the same direction.
   */
  requestId: RequestIdSchema.optional(),
  /**
   * An optional string describing the reason for the cancellation. This MAY be logged or presented to the user.
   */
  reason: z.string().optional()
});
var CancelledNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/cancelled"),
  params: CancelledNotificationParamsSchema
});
var IconSchema = z.object({
  /**
   * URL or data URI for the icon.
   */
  src: z.string(),
  /**
   * Optional MIME type for the icon.
   */
  mimeType: z.string().optional(),
  /**
   * Optional array of strings that specify sizes at which the icon can be used.
   * Each string should be in WxH format (e.g., `"48x48"`, `"96x96"`) or `"any"` for scalable formats like SVG.
   *
   * If not provided, the client should assume that the icon can be used at any size.
   */
  sizes: z.array(z.string()).optional(),
  /**
   * Optional specifier for the theme this icon is designed for. `light` indicates
   * the icon is designed to be used with a light background, and `dark` indicates
   * the icon is designed to be used with a dark background.
   *
   * If not provided, the client should assume the icon can be used with any theme.
   */
  theme: z.enum(["light", "dark"]).optional()
});
var IconsSchema = z.object({
  /**
   * Optional set of sized icons that the client can display in a user interface.
   *
   * Clients that support rendering icons MUST support at least the following MIME types:
   * - `image/png` - PNG images (safe, universal compatibility)
   * - `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)
   *
   * Clients that support rendering icons SHOULD also support:
   * - `image/svg+xml` - SVG images (scalable but requires security precautions)
   * - `image/webp` - WebP images (modern, efficient format)
   */
  icons: z.array(IconSchema).optional()
});
var BaseMetadataSchema = z.object({
  /** Intended for programmatic or logical use, but used as a display name in past specs or fallback */
  name: z.string(),
  /**
   * Intended for UI and end-user contexts — optimized to be human-readable and easily understood,
   * even by those unfamiliar with domain-specific terminology.
   *
   * If not provided, the name should be used for display (except for Tool,
   * where `annotations.title` should be given precedence over using `name`,
   * if present).
   */
  title: z.string().optional()
});
var ImplementationSchema = BaseMetadataSchema.extend({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  version: z.string(),
  /**
   * An optional URL of the website for this implementation.
   */
  websiteUrl: z.string().optional(),
  /**
   * An optional human-readable description of what this implementation does.
   *
   * This can be used by clients or servers to provide context about their purpose
   * and capabilities. For example, a server might describe the types of resources
   * or tools it provides, while a client might describe its intended use case.
   */
  description: z.string().optional()
});
var FormElicitationCapabilitySchema = z.intersection(z.object({
  applyDefaults: z.boolean().optional()
}), z.record(z.string(), z.unknown()));
var ElicitationCapabilitySchema = z.preprocess((value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (Object.keys(value).length === 0) {
      return { form: {} };
    }
  }
  return value;
}, z.intersection(z.object({
  form: FormElicitationCapabilitySchema.optional(),
  url: AssertObjectSchema.optional()
}), z.record(z.string(), z.unknown()).optional()));
var ClientTasksCapabilitySchema = z.looseObject({
  /**
   * Present if the client supports listing tasks.
   */
  list: AssertObjectSchema.optional(),
  /**
   * Present if the client supports cancelling tasks.
   */
  cancel: AssertObjectSchema.optional(),
  /**
   * Capabilities for task creation on specific request types.
   */
  requests: z.looseObject({
    /**
     * Task support for sampling requests.
     */
    sampling: z.looseObject({
      createMessage: AssertObjectSchema.optional()
    }).optional(),
    /**
     * Task support for elicitation requests.
     */
    elicitation: z.looseObject({
      create: AssertObjectSchema.optional()
    }).optional()
  }).optional()
});
var ServerTasksCapabilitySchema = z.looseObject({
  /**
   * Present if the server supports listing tasks.
   */
  list: AssertObjectSchema.optional(),
  /**
   * Present if the server supports cancelling tasks.
   */
  cancel: AssertObjectSchema.optional(),
  /**
   * Capabilities for task creation on specific request types.
   */
  requests: z.looseObject({
    /**
     * Task support for tool requests.
     */
    tools: z.looseObject({
      call: AssertObjectSchema.optional()
    }).optional()
  }).optional()
});
var ClientCapabilitiesSchema = z.object({
  /**
   * Experimental, non-standard capabilities that the client supports.
   */
  experimental: z.record(z.string(), AssertObjectSchema).optional(),
  /**
   * Present if the client supports sampling from an LLM.
   */
  sampling: z.object({
    /**
     * Present if the client supports context inclusion via includeContext parameter.
     * If not declared, servers SHOULD only use `includeContext: "none"` (or omit it).
     */
    context: AssertObjectSchema.optional(),
    /**
     * Present if the client supports tool use via tools and toolChoice parameters.
     */
    tools: AssertObjectSchema.optional()
  }).optional(),
  /**
   * Present if the client supports eliciting user input.
   */
  elicitation: ElicitationCapabilitySchema.optional(),
  /**
   * Present if the client supports listing roots.
   */
  roots: z.object({
    /**
     * Whether the client supports issuing notifications for changes to the roots list.
     */
    listChanged: z.boolean().optional()
  }).optional(),
  /**
   * Present if the client supports task creation.
   */
  tasks: ClientTasksCapabilitySchema.optional()
});
var InitializeRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The latest version of the Model Context Protocol that the client supports. The client MAY decide to support older versions as well.
   */
  protocolVersion: z.string(),
  capabilities: ClientCapabilitiesSchema,
  clientInfo: ImplementationSchema
});
var InitializeRequestSchema = RequestSchema.extend({
  method: z.literal("initialize"),
  params: InitializeRequestParamsSchema
});
var ServerCapabilitiesSchema = z.object({
  /**
   * Experimental, non-standard capabilities that the server supports.
   */
  experimental: z.record(z.string(), AssertObjectSchema).optional(),
  /**
   * Present if the server supports sending log messages to the client.
   */
  logging: AssertObjectSchema.optional(),
  /**
   * Present if the server supports sending completions to the client.
   */
  completions: AssertObjectSchema.optional(),
  /**
   * Present if the server offers any prompt templates.
   */
  prompts: z.object({
    /**
     * Whether this server supports issuing notifications for changes to the prompt list.
     */
    listChanged: z.boolean().optional()
  }).optional(),
  /**
   * Present if the server offers any resources to read.
   */
  resources: z.object({
    /**
     * Whether this server supports clients subscribing to resource updates.
     */
    subscribe: z.boolean().optional(),
    /**
     * Whether this server supports issuing notifications for changes to the resource list.
     */
    listChanged: z.boolean().optional()
  }).optional(),
  /**
   * Present if the server offers any tools to call.
   */
  tools: z.object({
    /**
     * Whether this server supports issuing notifications for changes to the tool list.
     */
    listChanged: z.boolean().optional()
  }).optional(),
  /**
   * Present if the server supports task creation.
   */
  tasks: ServerTasksCapabilitySchema.optional()
});
var InitializeResultSchema = ResultSchema.extend({
  /**
   * The version of the Model Context Protocol that the server wants to use. This may not match the version that the client requested. If the client cannot support this version, it MUST disconnect.
   */
  protocolVersion: z.string(),
  capabilities: ServerCapabilitiesSchema,
  serverInfo: ImplementationSchema,
  /**
   * Instructions describing how to use the server and its features.
   *
   * This can be used by clients to improve the LLM's understanding of available tools, resources, etc. It can be thought of like a "hint" to the model. For example, this information MAY be added to the system prompt.
   */
  instructions: z.string().optional()
});
var InitializedNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/initialized"),
  params: NotificationsParamsSchema.optional()
});
var PingRequestSchema = RequestSchema.extend({
  method: z.literal("ping"),
  params: BaseRequestParamsSchema.optional()
});
var ProgressSchema = z.object({
  /**
   * The progress thus far. This should increase every time progress is made, even if the total is unknown.
   */
  progress: z.number(),
  /**
   * Total number of items to process (or total progress required), if known.
   */
  total: z.optional(z.number()),
  /**
   * An optional message describing the current progress.
   */
  message: z.optional(z.string())
});
var ProgressNotificationParamsSchema = z.object({
  ...NotificationsParamsSchema.shape,
  ...ProgressSchema.shape,
  /**
   * The progress token which was given in the initial request, used to associate this notification with the request that is proceeding.
   */
  progressToken: ProgressTokenSchema
});
var ProgressNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/progress"),
  params: ProgressNotificationParamsSchema
});
var PaginatedRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * An opaque token representing the current pagination position.
   * If provided, the server should return results starting after this cursor.
   */
  cursor: CursorSchema.optional()
});
var PaginatedRequestSchema = RequestSchema.extend({
  params: PaginatedRequestParamsSchema.optional()
});
var PaginatedResultSchema = ResultSchema.extend({
  /**
   * An opaque token representing the pagination position after the last returned result.
   * If present, there may be more results available.
   */
  nextCursor: CursorSchema.optional()
});
var TaskStatusSchema = z.enum(["working", "input_required", "completed", "failed", "cancelled"]);
var TaskSchema = z.object({
  taskId: z.string(),
  status: TaskStatusSchema,
  /**
   * Time in milliseconds to keep task results available after completion.
   * If null, the task has unlimited lifetime until manually cleaned up.
   */
  ttl: z.union([z.number(), z.null()]),
  /**
   * ISO 8601 timestamp when the task was created.
   */
  createdAt: z.string(),
  /**
   * ISO 8601 timestamp when the task was last updated.
   */
  lastUpdatedAt: z.string(),
  pollInterval: z.optional(z.number()),
  /**
   * Optional diagnostic message for failed tasks or other status information.
   */
  statusMessage: z.optional(z.string())
});
var CreateTaskResultSchema = ResultSchema.extend({
  task: TaskSchema
});
var TaskStatusNotificationParamsSchema = NotificationsParamsSchema.merge(TaskSchema);
var TaskStatusNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/tasks/status"),
  params: TaskStatusNotificationParamsSchema
});
var GetTaskRequestSchema = RequestSchema.extend({
  method: z.literal("tasks/get"),
  params: BaseRequestParamsSchema.extend({
    taskId: z.string()
  })
});
var GetTaskResultSchema = ResultSchema.merge(TaskSchema);
var GetTaskPayloadRequestSchema = RequestSchema.extend({
  method: z.literal("tasks/result"),
  params: BaseRequestParamsSchema.extend({
    taskId: z.string()
  })
});
var GetTaskPayloadResultSchema = ResultSchema.loose();
var ListTasksRequestSchema = PaginatedRequestSchema.extend({
  method: z.literal("tasks/list")
});
var ListTasksResultSchema = PaginatedResultSchema.extend({
  tasks: z.array(TaskSchema)
});
var CancelTaskRequestSchema = RequestSchema.extend({
  method: z.literal("tasks/cancel"),
  params: BaseRequestParamsSchema.extend({
    taskId: z.string()
  })
});
var CancelTaskResultSchema = ResultSchema.merge(TaskSchema);
var ResourceContentsSchema = z.object({
  /**
   * The URI of this resource.
   */
  uri: z.string(),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: z.optional(z.string()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: z.record(z.string(), z.unknown()).optional()
});
var TextResourceContentsSchema = ResourceContentsSchema.extend({
  /**
   * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
   */
  text: z.string()
});
var Base64Schema = z.string().refine((val) => {
  try {
    atob(val);
    return true;
  } catch {
    return false;
  }
}, { message: "Invalid Base64 string" });
var BlobResourceContentsSchema = ResourceContentsSchema.extend({
  /**
   * A base64-encoded string representing the binary data of the item.
   */
  blob: Base64Schema
});
var RoleSchema = z.enum(["user", "assistant"]);
var AnnotationsSchema = z.object({
  /**
   * Intended audience(s) for the resource.
   */
  audience: z.array(RoleSchema).optional(),
  /**
   * Importance hint for the resource, from 0 (least) to 1 (most).
   */
  priority: z.number().min(0).max(1).optional(),
  /**
   * ISO 8601 timestamp for the most recent modification.
   */
  lastModified: z.iso.datetime({ offset: true }).optional()
});
var ResourceSchema = z.object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * The URI of this resource.
   */
  uri: z.string(),
  /**
   * A description of what this resource represents.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: z.optional(z.string()),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: z.optional(z.string()),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: z.optional(z.looseObject({}))
});
var ResourceTemplateSchema = z.object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * A URI template (according to RFC 6570) that can be used to construct resource URIs.
   */
  uriTemplate: z.string(),
  /**
   * A description of what this template is for.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: z.optional(z.string()),
  /**
   * The MIME type for all resources that match this template. This should only be included if all resources matching this template have the same type.
   */
  mimeType: z.optional(z.string()),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: z.optional(z.looseObject({}))
});
var ListResourcesRequestSchema = PaginatedRequestSchema.extend({
  method: z.literal("resources/list")
});
var ListResourcesResultSchema = PaginatedResultSchema.extend({
  resources: z.array(ResourceSchema)
});
var ListResourceTemplatesRequestSchema = PaginatedRequestSchema.extend({
  method: z.literal("resources/templates/list")
});
var ListResourceTemplatesResultSchema = PaginatedResultSchema.extend({
  resourceTemplates: z.array(ResourceTemplateSchema)
});
var ResourceRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The URI of the resource to read. The URI can use any protocol; it is up to the server how to interpret it.
   *
   * @format uri
   */
  uri: z.string()
});
var ReadResourceRequestParamsSchema = ResourceRequestParamsSchema;
var ReadResourceRequestSchema = RequestSchema.extend({
  method: z.literal("resources/read"),
  params: ReadResourceRequestParamsSchema
});
var ReadResourceResultSchema = ResultSchema.extend({
  contents: z.array(z.union([TextResourceContentsSchema, BlobResourceContentsSchema]))
});
var ResourceListChangedNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/resources/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var SubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var SubscribeRequestSchema = RequestSchema.extend({
  method: z.literal("resources/subscribe"),
  params: SubscribeRequestParamsSchema
});
var UnsubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var UnsubscribeRequestSchema = RequestSchema.extend({
  method: z.literal("resources/unsubscribe"),
  params: UnsubscribeRequestParamsSchema
});
var ResourceUpdatedNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The URI of the resource that has been updated. This might be a sub-resource of the one that the client actually subscribed to.
   */
  uri: z.string()
});
var ResourceUpdatedNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/resources/updated"),
  params: ResourceUpdatedNotificationParamsSchema
});
var PromptArgumentSchema = z.object({
  /**
   * The name of the argument.
   */
  name: z.string(),
  /**
   * A human-readable description of the argument.
   */
  description: z.optional(z.string()),
  /**
   * Whether this argument must be provided.
   */
  required: z.optional(z.boolean())
});
var PromptSchema = z.object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * An optional description of what this prompt provides
   */
  description: z.optional(z.string()),
  /**
   * A list of arguments to use for templating the prompt.
   */
  arguments: z.optional(z.array(PromptArgumentSchema)),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: z.optional(z.looseObject({}))
});
var ListPromptsRequestSchema = PaginatedRequestSchema.extend({
  method: z.literal("prompts/list")
});
var ListPromptsResultSchema = PaginatedResultSchema.extend({
  prompts: z.array(PromptSchema)
});
var GetPromptRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The name of the prompt or prompt template.
   */
  name: z.string(),
  /**
   * Arguments to use for templating the prompt.
   */
  arguments: z.record(z.string(), z.string()).optional()
});
var GetPromptRequestSchema = RequestSchema.extend({
  method: z.literal("prompts/get"),
  params: GetPromptRequestParamsSchema
});
var TextContentSchema = z.object({
  type: z.literal("text"),
  /**
   * The text content of the message.
   */
  text: z.string(),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: z.record(z.string(), z.unknown()).optional()
});
var ImageContentSchema = z.object({
  type: z.literal("image"),
  /**
   * The base64-encoded image data.
   */
  data: Base64Schema,
  /**
   * The MIME type of the image. Different providers may support different image types.
   */
  mimeType: z.string(),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: z.record(z.string(), z.unknown()).optional()
});
var AudioContentSchema = z.object({
  type: z.literal("audio"),
  /**
   * The base64-encoded audio data.
   */
  data: Base64Schema,
  /**
   * The MIME type of the audio. Different providers may support different audio types.
   */
  mimeType: z.string(),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: z.record(z.string(), z.unknown()).optional()
});
var ToolUseContentSchema = z.object({
  type: z.literal("tool_use"),
  /**
   * The name of the tool to invoke.
   * Must match a tool name from the request's tools array.
   */
  name: z.string(),
  /**
   * Unique identifier for this tool call.
   * Used to correlate with ToolResultContent in subsequent messages.
   */
  id: z.string(),
  /**
   * Arguments to pass to the tool.
   * Must conform to the tool's inputSchema.
   */
  input: z.record(z.string(), z.unknown()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: z.record(z.string(), z.unknown()).optional()
});
var EmbeddedResourceSchema = z.object({
  type: z.literal("resource"),
  resource: z.union([TextResourceContentsSchema, BlobResourceContentsSchema]),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: z.record(z.string(), z.unknown()).optional()
});
var ResourceLinkSchema = ResourceSchema.extend({
  type: z.literal("resource_link")
});
var ContentBlockSchema = z.union([
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ResourceLinkSchema,
  EmbeddedResourceSchema
]);
var PromptMessageSchema = z.object({
  role: RoleSchema,
  content: ContentBlockSchema
});
var GetPromptResultSchema = ResultSchema.extend({
  /**
   * An optional description for the prompt.
   */
  description: z.string().optional(),
  messages: z.array(PromptMessageSchema)
});
var PromptListChangedNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/prompts/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ToolAnnotationsSchema = z.object({
  /**
   * A human-readable title for the tool.
   */
  title: z.string().optional(),
  /**
   * If true, the tool does not modify its environment.
   *
   * Default: false
   */
  readOnlyHint: z.boolean().optional(),
  /**
   * If true, the tool may perform destructive updates to its environment.
   * If false, the tool performs only additive updates.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: true
   */
  destructiveHint: z.boolean().optional(),
  /**
   * If true, calling the tool repeatedly with the same arguments
   * will have no additional effect on the its environment.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: false
   */
  idempotentHint: z.boolean().optional(),
  /**
   * If true, this tool may interact with an "open world" of external
   * entities. If false, the tool's domain of interaction is closed.
   * For example, the world of a web search tool is open, whereas that
   * of a memory tool is not.
   *
   * Default: true
   */
  openWorldHint: z.boolean().optional()
});
var ToolExecutionSchema = z.object({
  /**
   * Indicates the tool's preference for task-augmented execution.
   * - "required": Clients MUST invoke the tool as a task
   * - "optional": Clients MAY invoke the tool as a task or normal request
   * - "forbidden": Clients MUST NOT attempt to invoke the tool as a task
   *
   * If not present, defaults to "forbidden".
   */
  taskSupport: z.enum(["required", "optional", "forbidden"]).optional()
});
var ToolSchema = z.object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * A human-readable description of the tool.
   */
  description: z.string().optional(),
  /**
   * A JSON Schema 2020-12 object defining the expected parameters for the tool.
   * Must have type: 'object' at the root level per MCP spec.
   */
  inputSchema: z.object({
    type: z.literal("object"),
    properties: z.record(z.string(), AssertObjectSchema).optional(),
    required: z.array(z.string()).optional()
  }).catchall(z.unknown()),
  /**
   * An optional JSON Schema 2020-12 object defining the structure of the tool's output
   * returned in the structuredContent field of a CallToolResult.
   * Must have type: 'object' at the root level per MCP spec.
   */
  outputSchema: z.object({
    type: z.literal("object"),
    properties: z.record(z.string(), AssertObjectSchema).optional(),
    required: z.array(z.string()).optional()
  }).catchall(z.unknown()).optional(),
  /**
   * Optional additional tool information.
   */
  annotations: ToolAnnotationsSchema.optional(),
  /**
   * Execution-related properties for this tool.
   */
  execution: ToolExecutionSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: z.record(z.string(), z.unknown()).optional()
});
var ListToolsRequestSchema = PaginatedRequestSchema.extend({
  method: z.literal("tools/list")
});
var ListToolsResultSchema = PaginatedResultSchema.extend({
  tools: z.array(ToolSchema)
});
var CallToolResultSchema = ResultSchema.extend({
  /**
   * A list of content objects that represent the result of the tool call.
   *
   * If the Tool does not define an outputSchema, this field MUST be present in the result.
   * For backwards compatibility, this field is always present, but it may be empty.
   */
  content: z.array(ContentBlockSchema).default([]),
  /**
   * An object containing structured tool output.
   *
   * If the Tool defines an outputSchema, this field MUST be present in the result, and contain a JSON object that matches the schema.
   */
  structuredContent: z.record(z.string(), z.unknown()).optional(),
  /**
   * Whether the tool call ended in an error.
   *
   * If not set, this is assumed to be false (the call was successful).
   *
   * Any errors that originate from the tool SHOULD be reported inside the result
   * object, with `isError` set to true, _not_ as an MCP protocol-level error
   * response. Otherwise, the LLM would not be able to see that an error occurred
   * and self-correct.
   *
   * However, any errors in _finding_ the tool, an error indicating that the
   * server does not support tool calls, or any other exceptional conditions,
   * should be reported as an MCP error response.
   */
  isError: z.boolean().optional()
});
var CompatibilityCallToolResultSchema = CallToolResultSchema.or(ResultSchema.extend({
  toolResult: z.unknown()
}));
var CallToolRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  /**
   * The name of the tool to call.
   */
  name: z.string(),
  /**
   * Arguments to pass to the tool.
   */
  arguments: z.record(z.string(), z.unknown()).optional()
});
var CallToolRequestSchema = RequestSchema.extend({
  method: z.literal("tools/call"),
  params: CallToolRequestParamsSchema
});
var ToolListChangedNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/tools/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ListChangedOptionsBaseSchema = z.object({
  /**
   * If true, the list will be refreshed automatically when a list changed notification is received.
   * The callback will be called with the updated list.
   *
   * If false, the callback will be called with null items, allowing manual refresh.
   *
   * @default true
   */
  autoRefresh: z.boolean().default(true),
  /**
   * Debounce time in milliseconds for list changed notification processing.
   *
   * Multiple notifications received within this timeframe will only trigger one refresh.
   * Set to 0 to disable debouncing.
   *
   * @default 300
   */
  debounceMs: z.number().int().nonnegative().default(300)
});
var LoggingLevelSchema = z.enum(["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"]);
var SetLevelRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The level of logging that the client wants to receive from the server. The server should send all logs at this level and higher (i.e., more severe) to the client as notifications/logging/message.
   */
  level: LoggingLevelSchema
});
var SetLevelRequestSchema = RequestSchema.extend({
  method: z.literal("logging/setLevel"),
  params: SetLevelRequestParamsSchema
});
var LoggingMessageNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The severity of this log message.
   */
  level: LoggingLevelSchema,
  /**
   * An optional name of the logger issuing this message.
   */
  logger: z.string().optional(),
  /**
   * The data to be logged, such as a string message or an object. Any JSON serializable type is allowed here.
   */
  data: z.unknown()
});
var LoggingMessageNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/message"),
  params: LoggingMessageNotificationParamsSchema
});
var ModelHintSchema = z.object({
  /**
   * A hint for a model name.
   */
  name: z.string().optional()
});
var ModelPreferencesSchema = z.object({
  /**
   * Optional hints to use for model selection.
   */
  hints: z.array(ModelHintSchema).optional(),
  /**
   * How much to prioritize cost when selecting a model.
   */
  costPriority: z.number().min(0).max(1).optional(),
  /**
   * How much to prioritize sampling speed (latency) when selecting a model.
   */
  speedPriority: z.number().min(0).max(1).optional(),
  /**
   * How much to prioritize intelligence and capabilities when selecting a model.
   */
  intelligencePriority: z.number().min(0).max(1).optional()
});
var ToolChoiceSchema = z.object({
  /**
   * Controls when tools are used:
   * - "auto": Model decides whether to use tools (default)
   * - "required": Model MUST use at least one tool before completing
   * - "none": Model MUST NOT use any tools
   */
  mode: z.enum(["auto", "required", "none"]).optional()
});
var ToolResultContentSchema = z.object({
  type: z.literal("tool_result"),
  toolUseId: z.string().describe("The unique identifier for the corresponding tool call."),
  content: z.array(ContentBlockSchema).default([]),
  structuredContent: z.object({}).loose().optional(),
  isError: z.boolean().optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: z.record(z.string(), z.unknown()).optional()
});
var SamplingContentSchema = z.discriminatedUnion("type", [TextContentSchema, ImageContentSchema, AudioContentSchema]);
var SamplingMessageContentBlockSchema = z.discriminatedUnion("type", [
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ToolUseContentSchema,
  ToolResultContentSchema
]);
var SamplingMessageSchema = z.object({
  role: RoleSchema,
  content: z.union([SamplingMessageContentBlockSchema, z.array(SamplingMessageContentBlockSchema)]),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: z.record(z.string(), z.unknown()).optional()
});
var CreateMessageRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  messages: z.array(SamplingMessageSchema),
  /**
   * The server's preferences for which model to select. The client MAY modify or omit this request.
   */
  modelPreferences: ModelPreferencesSchema.optional(),
  /**
   * An optional system prompt the server wants to use for sampling. The client MAY modify or omit this prompt.
   */
  systemPrompt: z.string().optional(),
  /**
   * A request to include context from one or more MCP servers (including the caller), to be attached to the prompt.
   * The client MAY ignore this request.
   *
   * Default is "none". Values "thisServer" and "allServers" are soft-deprecated. Servers SHOULD only use these values if the client
   * declares ClientCapabilities.sampling.context. These values may be removed in future spec releases.
   */
  includeContext: z.enum(["none", "thisServer", "allServers"]).optional(),
  temperature: z.number().optional(),
  /**
   * The requested maximum number of tokens to sample (to prevent runaway completions).
   *
   * The client MAY choose to sample fewer tokens than the requested maximum.
   */
  maxTokens: z.number().int(),
  stopSequences: z.array(z.string()).optional(),
  /**
   * Optional metadata to pass through to the LLM provider. The format of this metadata is provider-specific.
   */
  metadata: AssertObjectSchema.optional(),
  /**
   * Tools that the model may use during generation.
   * The client MUST return an error if this field is provided but ClientCapabilities.sampling.tools is not declared.
   */
  tools: z.array(ToolSchema).optional(),
  /**
   * Controls how the model uses tools.
   * The client MUST return an error if this field is provided but ClientCapabilities.sampling.tools is not declared.
   * Default is `{ mode: "auto" }`.
   */
  toolChoice: ToolChoiceSchema.optional()
});
var CreateMessageRequestSchema = RequestSchema.extend({
  method: z.literal("sampling/createMessage"),
  params: CreateMessageRequestParamsSchema
});
var CreateMessageResultSchema = ResultSchema.extend({
  /**
   * The name of the model that generated the message.
   */
  model: z.string(),
  /**
   * The reason why sampling stopped, if known.
   *
   * Standard values:
   * - "endTurn": Natural end of the assistant's turn
   * - "stopSequence": A stop sequence was encountered
   * - "maxTokens": Maximum token limit was reached
   *
   * This field is an open string to allow for provider-specific stop reasons.
   */
  stopReason: z.optional(z.enum(["endTurn", "stopSequence", "maxTokens"]).or(z.string())),
  role: RoleSchema,
  /**
   * Response content. Single content block (text, image, or audio).
   */
  content: SamplingContentSchema
});
var CreateMessageResultWithToolsSchema = ResultSchema.extend({
  /**
   * The name of the model that generated the message.
   */
  model: z.string(),
  /**
   * The reason why sampling stopped, if known.
   *
   * Standard values:
   * - "endTurn": Natural end of the assistant's turn
   * - "stopSequence": A stop sequence was encountered
   * - "maxTokens": Maximum token limit was reached
   * - "toolUse": The model wants to use one or more tools
   *
   * This field is an open string to allow for provider-specific stop reasons.
   */
  stopReason: z.optional(z.enum(["endTurn", "stopSequence", "maxTokens", "toolUse"]).or(z.string())),
  role: RoleSchema,
  /**
   * Response content. May be a single block or array. May include ToolUseContent if stopReason is "toolUse".
   */
  content: z.union([SamplingMessageContentBlockSchema, z.array(SamplingMessageContentBlockSchema)])
});
var BooleanSchemaSchema = z.object({
  type: z.literal("boolean"),
  title: z.string().optional(),
  description: z.string().optional(),
  default: z.boolean().optional()
});
var StringSchemaSchema = z.object({
  type: z.literal("string"),
  title: z.string().optional(),
  description: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  format: z.enum(["email", "uri", "date", "date-time"]).optional(),
  default: z.string().optional()
});
var NumberSchemaSchema = z.object({
  type: z.enum(["number", "integer"]),
  title: z.string().optional(),
  description: z.string().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  default: z.number().optional()
});
var UntitledSingleSelectEnumSchemaSchema = z.object({
  type: z.literal("string"),
  title: z.string().optional(),
  description: z.string().optional(),
  enum: z.array(z.string()),
  default: z.string().optional()
});
var TitledSingleSelectEnumSchemaSchema = z.object({
  type: z.literal("string"),
  title: z.string().optional(),
  description: z.string().optional(),
  oneOf: z.array(z.object({
    const: z.string(),
    title: z.string()
  })),
  default: z.string().optional()
});
var LegacyTitledEnumSchemaSchema = z.object({
  type: z.literal("string"),
  title: z.string().optional(),
  description: z.string().optional(),
  enum: z.array(z.string()),
  enumNames: z.array(z.string()).optional(),
  default: z.string().optional()
});
var SingleSelectEnumSchemaSchema = z.union([UntitledSingleSelectEnumSchemaSchema, TitledSingleSelectEnumSchemaSchema]);
var UntitledMultiSelectEnumSchemaSchema = z.object({
  type: z.literal("array"),
  title: z.string().optional(),
  description: z.string().optional(),
  minItems: z.number().optional(),
  maxItems: z.number().optional(),
  items: z.object({
    type: z.literal("string"),
    enum: z.array(z.string())
  }),
  default: z.array(z.string()).optional()
});
var TitledMultiSelectEnumSchemaSchema = z.object({
  type: z.literal("array"),
  title: z.string().optional(),
  description: z.string().optional(),
  minItems: z.number().optional(),
  maxItems: z.number().optional(),
  items: z.object({
    anyOf: z.array(z.object({
      const: z.string(),
      title: z.string()
    }))
  }),
  default: z.array(z.string()).optional()
});
var MultiSelectEnumSchemaSchema = z.union([UntitledMultiSelectEnumSchemaSchema, TitledMultiSelectEnumSchemaSchema]);
var EnumSchemaSchema = z.union([LegacyTitledEnumSchemaSchema, SingleSelectEnumSchemaSchema, MultiSelectEnumSchemaSchema]);
var PrimitiveSchemaDefinitionSchema = z.union([EnumSchemaSchema, BooleanSchemaSchema, StringSchemaSchema, NumberSchemaSchema]);
var ElicitRequestFormParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  /**
   * The elicitation mode.
   *
   * Optional for backward compatibility. Clients MUST treat missing mode as "form".
   */
  mode: z.literal("form").optional(),
  /**
   * The message to present to the user describing what information is being requested.
   */
  message: z.string(),
  /**
   * A restricted subset of JSON Schema.
   * Only top-level properties are allowed, without nesting.
   */
  requestedSchema: z.object({
    type: z.literal("object"),
    properties: z.record(z.string(), PrimitiveSchemaDefinitionSchema),
    required: z.array(z.string()).optional()
  })
});
var ElicitRequestURLParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  /**
   * The elicitation mode.
   */
  mode: z.literal("url"),
  /**
   * The message to present to the user explaining why the interaction is needed.
   */
  message: z.string(),
  /**
   * The ID of the elicitation, which must be unique within the context of the server.
   * The client MUST treat this ID as an opaque value.
   */
  elicitationId: z.string(),
  /**
   * The URL that the user should navigate to.
   */
  url: z.string().url()
});
var ElicitRequestParamsSchema = z.union([ElicitRequestFormParamsSchema, ElicitRequestURLParamsSchema]);
var ElicitRequestSchema = RequestSchema.extend({
  method: z.literal("elicitation/create"),
  params: ElicitRequestParamsSchema
});
var ElicitationCompleteNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The ID of the elicitation that completed.
   */
  elicitationId: z.string()
});
var ElicitationCompleteNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/elicitation/complete"),
  params: ElicitationCompleteNotificationParamsSchema
});
var ElicitResultSchema = ResultSchema.extend({
  /**
   * The user action in response to the elicitation.
   * - "accept": User submitted the form/confirmed the action
   * - "decline": User explicitly decline the action
   * - "cancel": User dismissed without making an explicit choice
   */
  action: z.enum(["accept", "decline", "cancel"]),
  /**
   * The submitted form data, only present when action is "accept".
   * Contains values matching the requested schema.
   * Per MCP spec, content is "typically omitted" for decline/cancel actions.
   * We normalize null to undefined for leniency while maintaining type compatibility.
   */
  content: z.preprocess((val) => val === null ? void 0 : val, z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional())
});
var ResourceTemplateReferenceSchema = z.object({
  type: z.literal("ref/resource"),
  /**
   * The URI or URI template of the resource.
   */
  uri: z.string()
});
var PromptReferenceSchema = z.object({
  type: z.literal("ref/prompt"),
  /**
   * The name of the prompt or prompt template
   */
  name: z.string()
});
var CompleteRequestParamsSchema = BaseRequestParamsSchema.extend({
  ref: z.union([PromptReferenceSchema, ResourceTemplateReferenceSchema]),
  /**
   * The argument's information
   */
  argument: z.object({
    /**
     * The name of the argument
     */
    name: z.string(),
    /**
     * The value of the argument to use for completion matching.
     */
    value: z.string()
  }),
  context: z.object({
    /**
     * Previously-resolved variables in a URI template or prompt.
     */
    arguments: z.record(z.string(), z.string()).optional()
  }).optional()
});
var CompleteRequestSchema = RequestSchema.extend({
  method: z.literal("completion/complete"),
  params: CompleteRequestParamsSchema
});
var CompleteResultSchema = ResultSchema.extend({
  completion: z.looseObject({
    /**
     * An array of completion values. Must not exceed 100 items.
     */
    values: z.array(z.string()).max(100),
    /**
     * The total number of completion options available. This can exceed the number of values actually sent in the response.
     */
    total: z.optional(z.number().int()),
    /**
     * Indicates whether there are additional completion options beyond those provided in the current response, even if the exact total is unknown.
     */
    hasMore: z.optional(z.boolean())
  })
});
var RootSchema = z.object({
  /**
   * The URI identifying the root. This *must* start with file:// for now.
   */
  uri: z.string().startsWith("file://"),
  /**
   * An optional name for the root.
   */
  name: z.string().optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: z.record(z.string(), z.unknown()).optional()
});
var ListRootsRequestSchema = RequestSchema.extend({
  method: z.literal("roots/list"),
  params: BaseRequestParamsSchema.optional()
});
var ListRootsResultSchema = ResultSchema.extend({
  roots: z.array(RootSchema)
});
var RootsListChangedNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/roots/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ClientRequestSchema = z.union([
  PingRequestSchema,
  InitializeRequestSchema,
  CompleteRequestSchema,
  SetLevelRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetTaskRequestSchema,
  GetTaskPayloadRequestSchema,
  ListTasksRequestSchema,
  CancelTaskRequestSchema
]);
var ClientNotificationSchema = z.union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema,
  TaskStatusNotificationSchema
]);
var ClientResultSchema = z.union([
  EmptyResultSchema,
  CreateMessageResultSchema,
  CreateMessageResultWithToolsSchema,
  ElicitResultSchema,
  ListRootsResultSchema,
  GetTaskResultSchema,
  ListTasksResultSchema,
  CreateTaskResultSchema
]);
var ServerRequestSchema = z.union([
  PingRequestSchema,
  CreateMessageRequestSchema,
  ElicitRequestSchema,
  ListRootsRequestSchema,
  GetTaskRequestSchema,
  GetTaskPayloadRequestSchema,
  ListTasksRequestSchema,
  CancelTaskRequestSchema
]);
var ServerNotificationSchema = z.union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  LoggingMessageNotificationSchema,
  ResourceUpdatedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
  TaskStatusNotificationSchema,
  ElicitationCompleteNotificationSchema
]);
var ServerResultSchema = z.union([
  EmptyResultSchema,
  InitializeResultSchema,
  CompleteResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  ReadResourceResultSchema,
  CallToolResultSchema,
  ListToolsResultSchema,
  GetTaskResultSchema,
  ListTasksResultSchema,
  CreateTaskResultSchema
]);
var McpError = class _McpError extends Error {
  constructor(code, message, data) {
    super(`MCP error ${code}: ${message}`);
    this.code = code;
    this.data = data;
    this.name = "McpError";
  }
  /**
   * Factory method to create the appropriate error type based on the error code and data
   */
  static fromError(code, message, data) {
    if (code === ErrorCode.UrlElicitationRequired && data) {
      const errorData = data;
      if (errorData.elicitations) {
        return new UrlElicitationRequiredError(errorData.elicitations, message);
      }
    }
    return new _McpError(code, message, data);
  }
};
var UrlElicitationRequiredError = class extends McpError {
  constructor(elicitations, message = `URL elicitation${elicitations.length > 1 ? "s" : ""} required`) {
    super(ErrorCode.UrlElicitationRequired, message, {
      elicitations
    });
  }
  get elicitations() {
    return this.data?.elicitations ?? [];
  }
};

// ../../../node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/interfaces.js
function isTerminal(status) {
  return status === "completed" || status === "failed" || status === "cancelled";
}

// ../../../node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-json-schema-compat.js
import * as z4mini2 from "zod/v4-mini";

// ../../../node_modules/zod-to-json-schema/dist/esm/selectParser.js
import { ZodFirstPartyTypeKind as ZodFirstPartyTypeKind3 } from "zod/v3";

// ../../../node_modules/zod-to-json-schema/dist/esm/parsers/array.js
import { ZodFirstPartyTypeKind } from "zod/v3";

// ../../../node_modules/zod-to-json-schema/dist/esm/parsers/record.js
import { ZodFirstPartyTypeKind as ZodFirstPartyTypeKind2 } from "zod/v3";

// ../../../node_modules/zod-to-json-schema/dist/esm/parsers/string.js
var ALPHA_NUMERIC = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");

// ../../../node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-json-schema-compat.js
function getMethodLiteral(schema) {
  const shape = getObjectShape(schema);
  const methodSchema = shape?.method;
  if (!methodSchema) {
    throw new Error("Schema is missing a method literal");
  }
  const value = getLiteralValue(methodSchema);
  if (typeof value !== "string") {
    throw new Error("Schema method literal must be a string");
  }
  return value;
}
function parseWithCompat(schema, data) {
  const result = safeParse2(schema, data);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

// ../../../node_modules/@modelcontextprotocol/sdk/dist/esm/shared/protocol.js
var DEFAULT_REQUEST_TIMEOUT_MSEC = 6e4;
var Protocol = class {
  constructor(_options) {
    this._options = _options;
    this._requestMessageId = 0;
    this._requestHandlers = /* @__PURE__ */ new Map();
    this._requestHandlerAbortControllers = /* @__PURE__ */ new Map();
    this._notificationHandlers = /* @__PURE__ */ new Map();
    this._responseHandlers = /* @__PURE__ */ new Map();
    this._progressHandlers = /* @__PURE__ */ new Map();
    this._timeoutInfo = /* @__PURE__ */ new Map();
    this._pendingDebouncedNotifications = /* @__PURE__ */ new Set();
    this._taskProgressTokens = /* @__PURE__ */ new Map();
    this._requestResolvers = /* @__PURE__ */ new Map();
    this.setNotificationHandler(CancelledNotificationSchema, (notification) => {
      this._oncancel(notification);
    });
    this.setNotificationHandler(ProgressNotificationSchema, (notification) => {
      this._onprogress(notification);
    });
    this.setRequestHandler(
      PingRequestSchema,
      // Automatic pong by default.
      (_request) => ({})
    );
    this._taskStore = _options?.taskStore;
    this._taskMessageQueue = _options?.taskMessageQueue;
    if (this._taskStore) {
      this.setRequestHandler(GetTaskRequestSchema, async (request, extra) => {
        const task = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, "Failed to retrieve task: Task not found");
        }
        return {
          ...task
        };
      });
      this.setRequestHandler(GetTaskPayloadRequestSchema, async (request, extra) => {
        const handleTaskResult = async () => {
          const taskId = request.params.taskId;
          if (this._taskMessageQueue) {
            let queuedMessage;
            while (queuedMessage = await this._taskMessageQueue.dequeue(taskId, extra.sessionId)) {
              if (queuedMessage.type === "response" || queuedMessage.type === "error") {
                const message = queuedMessage.message;
                const requestId = message.id;
                const resolver = this._requestResolvers.get(requestId);
                if (resolver) {
                  this._requestResolvers.delete(requestId);
                  if (queuedMessage.type === "response") {
                    resolver(message);
                  } else {
                    const errorMessage = message;
                    const error = new McpError(errorMessage.error.code, errorMessage.error.message, errorMessage.error.data);
                    resolver(error);
                  }
                } else {
                  const messageType = queuedMessage.type === "response" ? "Response" : "Error";
                  this._onerror(new Error(`${messageType} handler missing for request ${requestId}`));
                }
                continue;
              }
              await this._transport?.send(queuedMessage.message, { relatedRequestId: extra.requestId });
            }
          }
          const task = await this._taskStore.getTask(taskId, extra.sessionId);
          if (!task) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found: ${taskId}`);
          }
          if (!isTerminal(task.status)) {
            await this._waitForTaskUpdate(taskId, extra.signal);
            return await handleTaskResult();
          }
          if (isTerminal(task.status)) {
            const result = await this._taskStore.getTaskResult(taskId, extra.sessionId);
            this._clearTaskQueue(taskId);
            return {
              ...result,
              _meta: {
                ...result._meta,
                [RELATED_TASK_META_KEY]: {
                  taskId
                }
              }
            };
          }
          return await handleTaskResult();
        };
        return await handleTaskResult();
      });
      this.setRequestHandler(ListTasksRequestSchema, async (request, extra) => {
        try {
          const { tasks, nextCursor } = await this._taskStore.listTasks(request.params?.cursor, extra.sessionId);
          return {
            tasks,
            nextCursor,
            _meta: {}
          };
        } catch (error) {
          throw new McpError(ErrorCode.InvalidParams, `Failed to list tasks: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
      this.setRequestHandler(CancelTaskRequestSchema, async (request, extra) => {
        try {
          const task = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
          if (!task) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found: ${request.params.taskId}`);
          }
          if (isTerminal(task.status)) {
            throw new McpError(ErrorCode.InvalidParams, `Cannot cancel task in terminal status: ${task.status}`);
          }
          await this._taskStore.updateTaskStatus(request.params.taskId, "cancelled", "Client cancelled task execution.", extra.sessionId);
          this._clearTaskQueue(request.params.taskId);
          const cancelledTask = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
          if (!cancelledTask) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found after cancellation: ${request.params.taskId}`);
          }
          return {
            _meta: {},
            ...cancelledTask
          };
        } catch (error) {
          if (error instanceof McpError) {
            throw error;
          }
          throw new McpError(ErrorCode.InvalidRequest, `Failed to cancel task: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    }
  }
  async _oncancel(notification) {
    if (!notification.params.requestId) {
      return;
    }
    const controller = this._requestHandlerAbortControllers.get(notification.params.requestId);
    controller?.abort(notification.params.reason);
  }
  _setupTimeout(messageId, timeout, maxTotalTimeout, onTimeout, resetTimeoutOnProgress = false) {
    this._timeoutInfo.set(messageId, {
      timeoutId: setTimeout(onTimeout, timeout),
      startTime: Date.now(),
      timeout,
      maxTotalTimeout,
      resetTimeoutOnProgress,
      onTimeout
    });
  }
  _resetTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (!info)
      return false;
    const totalElapsed = Date.now() - info.startTime;
    if (info.maxTotalTimeout && totalElapsed >= info.maxTotalTimeout) {
      this._timeoutInfo.delete(messageId);
      throw McpError.fromError(ErrorCode.RequestTimeout, "Maximum total timeout exceeded", {
        maxTotalTimeout: info.maxTotalTimeout,
        totalElapsed
      });
    }
    clearTimeout(info.timeoutId);
    info.timeoutId = setTimeout(info.onTimeout, info.timeout);
    return true;
  }
  _cleanupTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (info) {
      clearTimeout(info.timeoutId);
      this._timeoutInfo.delete(messageId);
    }
  }
  /**
   * Attaches to the given transport, starts it, and starts listening for messages.
   *
   * The Protocol object assumes ownership of the Transport, replacing any callbacks that have already been set, and expects that it is the only user of the Transport instance going forward.
   */
  async connect(transport) {
    this._transport = transport;
    const _onclose = this.transport?.onclose;
    this._transport.onclose = () => {
      _onclose?.();
      this._onclose();
    };
    const _onerror = this.transport?.onerror;
    this._transport.onerror = (error) => {
      _onerror?.(error);
      this._onerror(error);
    };
    const _onmessage = this._transport?.onmessage;
    this._transport.onmessage = (message, extra) => {
      _onmessage?.(message, extra);
      if (isJSONRPCResultResponse(message) || isJSONRPCErrorResponse(message)) {
        this._onresponse(message);
      } else if (isJSONRPCRequest(message)) {
        this._onrequest(message, extra);
      } else if (isJSONRPCNotification(message)) {
        this._onnotification(message);
      } else {
        this._onerror(new Error(`Unknown message type: ${JSON.stringify(message)}`));
      }
    };
    await this._transport.start();
  }
  _onclose() {
    const responseHandlers = this._responseHandlers;
    this._responseHandlers = /* @__PURE__ */ new Map();
    this._progressHandlers.clear();
    this._taskProgressTokens.clear();
    this._pendingDebouncedNotifications.clear();
    const error = McpError.fromError(ErrorCode.ConnectionClosed, "Connection closed");
    this._transport = void 0;
    this.onclose?.();
    for (const handler of responseHandlers.values()) {
      handler(error);
    }
  }
  _onerror(error) {
    this.onerror?.(error);
  }
  _onnotification(notification) {
    const handler = this._notificationHandlers.get(notification.method) ?? this.fallbackNotificationHandler;
    if (handler === void 0) {
      return;
    }
    Promise.resolve().then(() => handler(notification)).catch((error) => this._onerror(new Error(`Uncaught error in notification handler: ${error}`)));
  }
  _onrequest(request, extra) {
    const handler = this._requestHandlers.get(request.method) ?? this.fallbackRequestHandler;
    const capturedTransport = this._transport;
    const relatedTaskId = request.params?._meta?.[RELATED_TASK_META_KEY]?.taskId;
    if (handler === void 0) {
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: ErrorCode.MethodNotFound,
          message: "Method not found"
        }
      };
      if (relatedTaskId && this._taskMessageQueue) {
        this._enqueueTaskMessage(relatedTaskId, {
          type: "error",
          message: errorResponse,
          timestamp: Date.now()
        }, capturedTransport?.sessionId).catch((error) => this._onerror(new Error(`Failed to enqueue error response: ${error}`)));
      } else {
        capturedTransport?.send(errorResponse).catch((error) => this._onerror(new Error(`Failed to send an error response: ${error}`)));
      }
      return;
    }
    const abortController = new AbortController();
    this._requestHandlerAbortControllers.set(request.id, abortController);
    const taskCreationParams = isTaskAugmentedRequestParams(request.params) ? request.params.task : void 0;
    const taskStore = this._taskStore ? this.requestTaskStore(request, capturedTransport?.sessionId) : void 0;
    const fullExtra = {
      signal: abortController.signal,
      sessionId: capturedTransport?.sessionId,
      _meta: request.params?._meta,
      sendNotification: async (notification) => {
        const notificationOptions = { relatedRequestId: request.id };
        if (relatedTaskId) {
          notificationOptions.relatedTask = { taskId: relatedTaskId };
        }
        await this.notification(notification, notificationOptions);
      },
      sendRequest: async (r, resultSchema, options) => {
        const requestOptions = { ...options, relatedRequestId: request.id };
        if (relatedTaskId && !requestOptions.relatedTask) {
          requestOptions.relatedTask = { taskId: relatedTaskId };
        }
        const effectiveTaskId = requestOptions.relatedTask?.taskId ?? relatedTaskId;
        if (effectiveTaskId && taskStore) {
          await taskStore.updateTaskStatus(effectiveTaskId, "input_required");
        }
        return await this.request(r, resultSchema, requestOptions);
      },
      authInfo: extra?.authInfo,
      requestId: request.id,
      requestInfo: extra?.requestInfo,
      taskId: relatedTaskId,
      taskStore,
      taskRequestedTtl: taskCreationParams?.ttl,
      closeSSEStream: extra?.closeSSEStream,
      closeStandaloneSSEStream: extra?.closeStandaloneSSEStream
    };
    Promise.resolve().then(() => {
      if (taskCreationParams) {
        this.assertTaskHandlerCapability(request.method);
      }
    }).then(() => handler(request, fullExtra)).then(async (result) => {
      if (abortController.signal.aborted) {
        return;
      }
      const response = {
        result,
        jsonrpc: "2.0",
        id: request.id
      };
      if (relatedTaskId && this._taskMessageQueue) {
        await this._enqueueTaskMessage(relatedTaskId, {
          type: "response",
          message: response,
          timestamp: Date.now()
        }, capturedTransport?.sessionId);
      } else {
        await capturedTransport?.send(response);
      }
    }, async (error) => {
      if (abortController.signal.aborted) {
        return;
      }
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: Number.isSafeInteger(error["code"]) ? error["code"] : ErrorCode.InternalError,
          message: error.message ?? "Internal error",
          ...error["data"] !== void 0 && { data: error["data"] }
        }
      };
      if (relatedTaskId && this._taskMessageQueue) {
        await this._enqueueTaskMessage(relatedTaskId, {
          type: "error",
          message: errorResponse,
          timestamp: Date.now()
        }, capturedTransport?.sessionId);
      } else {
        await capturedTransport?.send(errorResponse);
      }
    }).catch((error) => this._onerror(new Error(`Failed to send response: ${error}`))).finally(() => {
      this._requestHandlerAbortControllers.delete(request.id);
    });
  }
  _onprogress(notification) {
    const { progressToken, ...params } = notification.params;
    const messageId = Number(progressToken);
    const handler = this._progressHandlers.get(messageId);
    if (!handler) {
      this._onerror(new Error(`Received a progress notification for an unknown token: ${JSON.stringify(notification)}`));
      return;
    }
    const responseHandler = this._responseHandlers.get(messageId);
    const timeoutInfo = this._timeoutInfo.get(messageId);
    if (timeoutInfo && responseHandler && timeoutInfo.resetTimeoutOnProgress) {
      try {
        this._resetTimeout(messageId);
      } catch (error) {
        this._responseHandlers.delete(messageId);
        this._progressHandlers.delete(messageId);
        this._cleanupTimeout(messageId);
        responseHandler(error);
        return;
      }
    }
    handler(params);
  }
  _onresponse(response) {
    const messageId = Number(response.id);
    const resolver = this._requestResolvers.get(messageId);
    if (resolver) {
      this._requestResolvers.delete(messageId);
      if (isJSONRPCResultResponse(response)) {
        resolver(response);
      } else {
        const error = new McpError(response.error.code, response.error.message, response.error.data);
        resolver(error);
      }
      return;
    }
    const handler = this._responseHandlers.get(messageId);
    if (handler === void 0) {
      this._onerror(new Error(`Received a response for an unknown message ID: ${JSON.stringify(response)}`));
      return;
    }
    this._responseHandlers.delete(messageId);
    this._cleanupTimeout(messageId);
    let isTaskResponse = false;
    if (isJSONRPCResultResponse(response) && response.result && typeof response.result === "object") {
      const result = response.result;
      if (result.task && typeof result.task === "object") {
        const task = result.task;
        if (typeof task.taskId === "string") {
          isTaskResponse = true;
          this._taskProgressTokens.set(task.taskId, messageId);
        }
      }
    }
    if (!isTaskResponse) {
      this._progressHandlers.delete(messageId);
    }
    if (isJSONRPCResultResponse(response)) {
      handler(response);
    } else {
      const error = McpError.fromError(response.error.code, response.error.message, response.error.data);
      handler(error);
    }
  }
  get transport() {
    return this._transport;
  }
  /**
   * Closes the connection.
   */
  async close() {
    await this._transport?.close();
  }
  /**
   * Sends a request and returns an AsyncGenerator that yields response messages.
   * The generator is guaranteed to end with either a 'result' or 'error' message.
   *
   * @example
   * ```typescript
   * const stream = protocol.requestStream(request, resultSchema, options);
   * for await (const message of stream) {
   *   switch (message.type) {
   *     case 'taskCreated':
   *       console.log('Task created:', message.task.taskId);
   *       break;
   *     case 'taskStatus':
   *       console.log('Task status:', message.task.status);
   *       break;
   *     case 'result':
   *       console.log('Final result:', message.result);
   *       break;
   *     case 'error':
   *       console.error('Error:', message.error);
   *       break;
   *   }
   * }
   * ```
   *
   * @experimental Use `client.experimental.tasks.requestStream()` to access this method.
   */
  async *requestStream(request, resultSchema, options) {
    const { task } = options ?? {};
    if (!task) {
      try {
        const result = await this.request(request, resultSchema, options);
        yield { type: "result", result };
      } catch (error) {
        yield {
          type: "error",
          error: error instanceof McpError ? error : new McpError(ErrorCode.InternalError, String(error))
        };
      }
      return;
    }
    let taskId;
    try {
      const createResult = await this.request(request, CreateTaskResultSchema, options);
      if (createResult.task) {
        taskId = createResult.task.taskId;
        yield { type: "taskCreated", task: createResult.task };
      } else {
        throw new McpError(ErrorCode.InternalError, "Task creation did not return a task");
      }
      while (true) {
        const task2 = await this.getTask({ taskId }, options);
        yield { type: "taskStatus", task: task2 };
        if (isTerminal(task2.status)) {
          if (task2.status === "completed") {
            const result = await this.getTaskResult({ taskId }, resultSchema, options);
            yield { type: "result", result };
          } else if (task2.status === "failed") {
            yield {
              type: "error",
              error: new McpError(ErrorCode.InternalError, `Task ${taskId} failed`)
            };
          } else if (task2.status === "cancelled") {
            yield {
              type: "error",
              error: new McpError(ErrorCode.InternalError, `Task ${taskId} was cancelled`)
            };
          }
          return;
        }
        if (task2.status === "input_required") {
          const result = await this.getTaskResult({ taskId }, resultSchema, options);
          yield { type: "result", result };
          return;
        }
        const pollInterval = task2.pollInterval ?? this._options?.defaultTaskPollInterval ?? 1e3;
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        options?.signal?.throwIfAborted();
      }
    } catch (error) {
      yield {
        type: "error",
        error: error instanceof McpError ? error : new McpError(ErrorCode.InternalError, String(error))
      };
    }
  }
  /**
   * Sends a request and waits for a response.
   *
   * Do not use this method to emit notifications! Use notification() instead.
   */
  request(request, resultSchema, options) {
    const { relatedRequestId, resumptionToken, onresumptiontoken, task, relatedTask } = options ?? {};
    return new Promise((resolve, reject) => {
      const earlyReject = (error) => {
        reject(error);
      };
      if (!this._transport) {
        earlyReject(new Error("Not connected"));
        return;
      }
      if (this._options?.enforceStrictCapabilities === true) {
        try {
          this.assertCapabilityForMethod(request.method);
          if (task) {
            this.assertTaskCapability(request.method);
          }
        } catch (e2) {
          earlyReject(e2);
          return;
        }
      }
      options?.signal?.throwIfAborted();
      const messageId = this._requestMessageId++;
      const jsonrpcRequest = {
        ...request,
        jsonrpc: "2.0",
        id: messageId
      };
      if (options?.onprogress) {
        this._progressHandlers.set(messageId, options.onprogress);
        jsonrpcRequest.params = {
          ...request.params,
          _meta: {
            ...request.params?._meta || {},
            progressToken: messageId
          }
        };
      }
      if (task) {
        jsonrpcRequest.params = {
          ...jsonrpcRequest.params,
          task
        };
      }
      if (relatedTask) {
        jsonrpcRequest.params = {
          ...jsonrpcRequest.params,
          _meta: {
            ...jsonrpcRequest.params?._meta || {},
            [RELATED_TASK_META_KEY]: relatedTask
          }
        };
      }
      const cancel = (reason) => {
        this._responseHandlers.delete(messageId);
        this._progressHandlers.delete(messageId);
        this._cleanupTimeout(messageId);
        this._transport?.send({
          jsonrpc: "2.0",
          method: "notifications/cancelled",
          params: {
            requestId: messageId,
            reason: String(reason)
          }
        }, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error2) => this._onerror(new Error(`Failed to send cancellation: ${error2}`)));
        const error = reason instanceof McpError ? reason : new McpError(ErrorCode.RequestTimeout, String(reason));
        reject(error);
      };
      this._responseHandlers.set(messageId, (response) => {
        if (options?.signal?.aborted) {
          return;
        }
        if (response instanceof Error) {
          return reject(response);
        }
        try {
          const parseResult = safeParse2(resultSchema, response.result);
          if (!parseResult.success) {
            reject(parseResult.error);
          } else {
            resolve(parseResult.data);
          }
        } catch (error) {
          reject(error);
        }
      });
      options?.signal?.addEventListener("abort", () => {
        cancel(options?.signal?.reason);
      });
      const timeout = options?.timeout ?? DEFAULT_REQUEST_TIMEOUT_MSEC;
      const timeoutHandler = () => cancel(McpError.fromError(ErrorCode.RequestTimeout, "Request timed out", { timeout }));
      this._setupTimeout(messageId, timeout, options?.maxTotalTimeout, timeoutHandler, options?.resetTimeoutOnProgress ?? false);
      const relatedTaskId = relatedTask?.taskId;
      if (relatedTaskId) {
        const responseResolver = (response) => {
          const handler = this._responseHandlers.get(messageId);
          if (handler) {
            handler(response);
          } else {
            this._onerror(new Error(`Response handler missing for side-channeled request ${messageId}`));
          }
        };
        this._requestResolvers.set(messageId, responseResolver);
        this._enqueueTaskMessage(relatedTaskId, {
          type: "request",
          message: jsonrpcRequest,
          timestamp: Date.now()
        }).catch((error) => {
          this._cleanupTimeout(messageId);
          reject(error);
        });
      } else {
        this._transport.send(jsonrpcRequest, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error) => {
          this._cleanupTimeout(messageId);
          reject(error);
        });
      }
    });
  }
  /**
   * Gets the current status of a task.
   *
   * @experimental Use `client.experimental.tasks.getTask()` to access this method.
   */
  async getTask(params, options) {
    return this.request({ method: "tasks/get", params }, GetTaskResultSchema, options);
  }
  /**
   * Retrieves the result of a completed task.
   *
   * @experimental Use `client.experimental.tasks.getTaskResult()` to access this method.
   */
  async getTaskResult(params, resultSchema, options) {
    return this.request({ method: "tasks/result", params }, resultSchema, options);
  }
  /**
   * Lists tasks, optionally starting from a pagination cursor.
   *
   * @experimental Use `client.experimental.tasks.listTasks()` to access this method.
   */
  async listTasks(params, options) {
    return this.request({ method: "tasks/list", params }, ListTasksResultSchema, options);
  }
  /**
   * Cancels a specific task.
   *
   * @experimental Use `client.experimental.tasks.cancelTask()` to access this method.
   */
  async cancelTask(params, options) {
    return this.request({ method: "tasks/cancel", params }, CancelTaskResultSchema, options);
  }
  /**
   * Emits a notification, which is a one-way message that does not expect a response.
   */
  async notification(notification, options) {
    if (!this._transport) {
      throw new Error("Not connected");
    }
    this.assertNotificationCapability(notification.method);
    const relatedTaskId = options?.relatedTask?.taskId;
    if (relatedTaskId) {
      const jsonrpcNotification2 = {
        ...notification,
        jsonrpc: "2.0",
        params: {
          ...notification.params,
          _meta: {
            ...notification.params?._meta || {},
            [RELATED_TASK_META_KEY]: options.relatedTask
          }
        }
      };
      await this._enqueueTaskMessage(relatedTaskId, {
        type: "notification",
        message: jsonrpcNotification2,
        timestamp: Date.now()
      });
      return;
    }
    const debouncedMethods = this._options?.debouncedNotificationMethods ?? [];
    const canDebounce = debouncedMethods.includes(notification.method) && !notification.params && !options?.relatedRequestId && !options?.relatedTask;
    if (canDebounce) {
      if (this._pendingDebouncedNotifications.has(notification.method)) {
        return;
      }
      this._pendingDebouncedNotifications.add(notification.method);
      Promise.resolve().then(() => {
        this._pendingDebouncedNotifications.delete(notification.method);
        if (!this._transport) {
          return;
        }
        let jsonrpcNotification2 = {
          ...notification,
          jsonrpc: "2.0"
        };
        if (options?.relatedTask) {
          jsonrpcNotification2 = {
            ...jsonrpcNotification2,
            params: {
              ...jsonrpcNotification2.params,
              _meta: {
                ...jsonrpcNotification2.params?._meta || {},
                [RELATED_TASK_META_KEY]: options.relatedTask
              }
            }
          };
        }
        this._transport?.send(jsonrpcNotification2, options).catch((error) => this._onerror(error));
      });
      return;
    }
    let jsonrpcNotification = {
      ...notification,
      jsonrpc: "2.0"
    };
    if (options?.relatedTask) {
      jsonrpcNotification = {
        ...jsonrpcNotification,
        params: {
          ...jsonrpcNotification.params,
          _meta: {
            ...jsonrpcNotification.params?._meta || {},
            [RELATED_TASK_META_KEY]: options.relatedTask
          }
        }
      };
    }
    await this._transport.send(jsonrpcNotification, options);
  }
  /**
   * Registers a handler to invoke when this protocol object receives a request with the given method.
   *
   * Note that this will replace any previous request handler for the same method.
   */
  setRequestHandler(requestSchema, handler) {
    const method = getMethodLiteral(requestSchema);
    this.assertRequestHandlerCapability(method);
    this._requestHandlers.set(method, (request, extra) => {
      const parsed = parseWithCompat(requestSchema, request);
      return Promise.resolve(handler(parsed, extra));
    });
  }
  /**
   * Removes the request handler for the given method.
   */
  removeRequestHandler(method) {
    this._requestHandlers.delete(method);
  }
  /**
   * Asserts that a request handler has not already been set for the given method, in preparation for a new one being automatically installed.
   */
  assertCanSetRequestHandler(method) {
    if (this._requestHandlers.has(method)) {
      throw new Error(`A request handler for ${method} already exists, which would be overridden`);
    }
  }
  /**
   * Registers a handler to invoke when this protocol object receives a notification with the given method.
   *
   * Note that this will replace any previous notification handler for the same method.
   */
  setNotificationHandler(notificationSchema, handler) {
    const method = getMethodLiteral(notificationSchema);
    this._notificationHandlers.set(method, (notification) => {
      const parsed = parseWithCompat(notificationSchema, notification);
      return Promise.resolve(handler(parsed));
    });
  }
  /**
   * Removes the notification handler for the given method.
   */
  removeNotificationHandler(method) {
    this._notificationHandlers.delete(method);
  }
  /**
   * Cleans up the progress handler associated with a task.
   * This should be called when a task reaches a terminal status.
   */
  _cleanupTaskProgressHandler(taskId) {
    const progressToken = this._taskProgressTokens.get(taskId);
    if (progressToken !== void 0) {
      this._progressHandlers.delete(progressToken);
      this._taskProgressTokens.delete(taskId);
    }
  }
  /**
   * Enqueues a task-related message for side-channel delivery via tasks/result.
   * @param taskId The task ID to associate the message with
   * @param message The message to enqueue
   * @param sessionId Optional session ID for binding the operation to a specific session
   * @throws Error if taskStore is not configured or if enqueue fails (e.g., queue overflow)
   *
   * Note: If enqueue fails, it's the TaskMessageQueue implementation's responsibility to handle
   * the error appropriately (e.g., by failing the task, logging, etc.). The Protocol layer
   * simply propagates the error.
   */
  async _enqueueTaskMessage(taskId, message, sessionId) {
    if (!this._taskStore || !this._taskMessageQueue) {
      throw new Error("Cannot enqueue task message: taskStore and taskMessageQueue are not configured");
    }
    const maxQueueSize = this._options?.maxTaskQueueSize;
    await this._taskMessageQueue.enqueue(taskId, message, sessionId, maxQueueSize);
  }
  /**
   * Clears the message queue for a task and rejects any pending request resolvers.
   * @param taskId The task ID whose queue should be cleared
   * @param sessionId Optional session ID for binding the operation to a specific session
   */
  async _clearTaskQueue(taskId, sessionId) {
    if (this._taskMessageQueue) {
      const messages = await this._taskMessageQueue.dequeueAll(taskId, sessionId);
      for (const message of messages) {
        if (message.type === "request" && isJSONRPCRequest(message.message)) {
          const requestId = message.message.id;
          const resolver = this._requestResolvers.get(requestId);
          if (resolver) {
            resolver(new McpError(ErrorCode.InternalError, "Task cancelled or completed"));
            this._requestResolvers.delete(requestId);
          } else {
            this._onerror(new Error(`Resolver missing for request ${requestId} during task ${taskId} cleanup`));
          }
        }
      }
    }
  }
  /**
   * Waits for a task update (new messages or status change) with abort signal support.
   * Uses polling to check for updates at the task's configured poll interval.
   * @param taskId The task ID to wait for
   * @param signal Abort signal to cancel the wait
   * @returns Promise that resolves when an update occurs or rejects if aborted
   */
  async _waitForTaskUpdate(taskId, signal) {
    let interval = this._options?.defaultTaskPollInterval ?? 1e3;
    try {
      const task = await this._taskStore?.getTask(taskId);
      if (task?.pollInterval) {
        interval = task.pollInterval;
      }
    } catch {
    }
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new McpError(ErrorCode.InvalidRequest, "Request cancelled"));
        return;
      }
      const timeoutId = setTimeout(resolve, interval);
      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        reject(new McpError(ErrorCode.InvalidRequest, "Request cancelled"));
      }, { once: true });
    });
  }
  requestTaskStore(request, sessionId) {
    const taskStore = this._taskStore;
    if (!taskStore) {
      throw new Error("No task store configured");
    }
    return {
      createTask: async (taskParams) => {
        if (!request) {
          throw new Error("No request provided");
        }
        return await taskStore.createTask(taskParams, request.id, {
          method: request.method,
          params: request.params
        }, sessionId);
      },
      getTask: async (taskId) => {
        const task = await taskStore.getTask(taskId, sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, "Failed to retrieve task: Task not found");
        }
        return task;
      },
      storeTaskResult: async (taskId, status, result) => {
        await taskStore.storeTaskResult(taskId, status, result, sessionId);
        const task = await taskStore.getTask(taskId, sessionId);
        if (task) {
          const notification = TaskStatusNotificationSchema.parse({
            method: "notifications/tasks/status",
            params: task
          });
          await this.notification(notification);
          if (isTerminal(task.status)) {
            this._cleanupTaskProgressHandler(taskId);
          }
        }
      },
      getTaskResult: (taskId) => {
        return taskStore.getTaskResult(taskId, sessionId);
      },
      updateTaskStatus: async (taskId, status, statusMessage) => {
        const task = await taskStore.getTask(taskId, sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, `Task "${taskId}" not found - it may have been cleaned up`);
        }
        if (isTerminal(task.status)) {
          throw new McpError(ErrorCode.InvalidParams, `Cannot update task "${taskId}" from terminal status "${task.status}" to "${status}". Terminal states (completed, failed, cancelled) cannot transition to other states.`);
        }
        await taskStore.updateTaskStatus(taskId, status, statusMessage, sessionId);
        const updatedTask = await taskStore.getTask(taskId, sessionId);
        if (updatedTask) {
          const notification = TaskStatusNotificationSchema.parse({
            method: "notifications/tasks/status",
            params: updatedTask
          });
          await this.notification(notification);
          if (isTerminal(updatedTask.status)) {
            this._cleanupTaskProgressHandler(taskId);
          }
        }
      },
      listTasks: (cursor) => {
        return taskStore.listTasks(cursor, sessionId);
      }
    };
  }
};

// ../../../node_modules/@modelcontextprotocol/ext-apps/dist/src/app.js
var S4 = Object.defineProperty;
var d = (r, v) => {
  for (var o in v) S4(r, o, { get: v[o], enumerable: true, configurable: true, set: ($) => v[o] = () => $ });
};
var Yn = class {
  eventTarget;
  eventSource;
  messageListener;
  constructor(r = window.parent, v) {
    this.eventTarget = r;
    this.eventSource = v;
    this.messageListener = (o) => {
      if (v && o.source !== this.eventSource) {
        console.error("Ignoring message from unknown source", o);
        return;
      }
      let $ = JSONRPCMessageSchema.safeParse(o.data);
      if ($.success) console.debug("Parsed message", $.data), this.onmessage?.($.data);
      else console.error("Failed to parse message", $.error.message, o), this.onerror?.(Error("Invalid JSON-RPC message received: " + $.error.message));
    };
  }
  async start() {
    window.addEventListener("message", this.messageListener);
  }
  async send(r, v) {
    console.debug("Sending message", r), this.eventTarget.postMessage(r, "*");
  }
  async close() {
    window.removeEventListener("message", this.messageListener), this.onclose?.();
  }
  onclose;
  onerror;
  onmessage;
  sessionId;
  setProtocolVersion;
};
var Uo = "2025-11-21";
var t = {};
d(t, { xor: () => TI, xid: () => tI, void: () => qI, uuidv7: () => nI, uuidv6: () => rI, uuidv4: () => st, uuid: () => at, util: () => k, url: () => vI, uppercase: () => Xr, unknown: () => kr, union: () => uo, undefined: () => YI, ulid: () => bI, uint64: () => KI, uint32: () => GI, tuple: () => Kb, trim: () => Br, treeifyError: () => Jo, transform: () => io, toUpperCase: () => Mr, toLowerCase: () => Hr, toJSONSchema: () => Vv, templateLiteral: () => sI, symbol: () => VI, superRefine: () => nt, success: () => dI, stringbool: () => g4, stringFormat: () => jI, string: () => Mv, strictObject: () => FI, startsWith: () => Vr, slugify: () => Fr, size: () => Lr, setErrorMap: () => $U, set: () => CI, safeParseAsync: () => ub, safeParse: () => ob, safeEncodeAsync: () => lb, safeEncode: () => tb, safeDecodeAsync: () => Ub, safeDecode: () => Ib, registry: () => ov, regexes: () => Z, regex: () => Gr, refine: () => rt, record: () => Vb, readonly: () => hb, property: () => Wv, promise: () => r4, prettifyError: () => Eo, preprocess: () => t4, prefault: () => zb, positive: () => Jv, pipe: () => An, partialRecord: () => ZI, parseAsync: () => vb, parse: () => nb, overwrite: () => e, optional: () => Pn, object: () => MI, number: () => wb, nullish: () => yI, nullable: () => Sn, null: () => Db, normalize: () => qr, nonpositive: () => Lv, nonoptional: () => Zb, nonnegative: () => Gv, never: () => oo, negative: () => Ev, nativeEnum: () => xI, nanoid: () => $I, nan: () => pI, multipleOf: () => ur, minSize: () => $r, minLength: () => p, mime: () => Qr, meta: () => $4, maxSize: () => _r, maxLength: () => wr, map: () => mI, mac: () => UI, lte: () => R, lt: () => x, lowercase: () => Wr, looseRecord: () => eI, looseObject: () => RI, locales: () => kn, literal: () => fI, length: () => Nr, lazy: () => pb, ksuid: () => II, keyof: () => HI, jwt: () => DI, json: () => b4, iso: () => zr, ipv6: () => _I, ipv4: () => lI, intersection: () => Wb, int64: () => XI, int32: () => LI, int: () => Fv, instanceof: () => i4, includes: () => Kr, httpUrl: () => oI, hostname: () => PI, hex: () => SI, hash: () => AI, guid: () => pt, gte: () => Q, gt: () => f, globalRegistry: () => Y, getErrorMap: () => iU, function: () => n4, fromJSONSchema: () => l4, formatError: () => un, float64: () => EI, float32: () => JI, flattenError: () => on, file: () => hI, enum: () => $o, endsWith: () => Yr, encodeAsync: () => gb, encode: () => $b, emoji: () => uI, email: () => dt, e164: () => cI, discriminatedUnion: () => zI, describe: () => u4, decodeAsync: () => bb, decode: () => ib, date: () => BI, custom: () => o4, cuid2: () => gI, cuid: () => iI, core: () => a, config: () => X, coerce: () => ot, codec: () => aI, clone: () => V, cidrv6: () => NI, cidrv4: () => wI, check: () => v4, catch: () => Cb, boolean: () => Nb, bigint: () => WI, base64url: () => OI, base64: () => kI, array: () => Ln, any: () => QI, _function: () => n4, _default: () => Rb, _ZodString: () => Rv, ZodXor: () => Eb, ZodXID: () => xv, ZodVoid: () => Ab, ZodUnknown: () => Pb, ZodUnion: () => Wn, ZodUndefined: () => Ob, ZodUUID: () => h, ZodURL: () => Jn, ZodULID: () => Cv, ZodType: () => S, ZodTuple: () => Xb, ZodTransform: () => Hb, ZodTemplateLiteral: () => yb, ZodSymbol: () => kb, ZodSuccess: () => eb, ZodStringFormat: () => G, ZodString: () => er, ZodSet: () => Qb, ZodRecord: () => Xn, ZodRealError: () => M, ZodReadonly: () => fb, ZodPromise: () => ab, ZodPrefault: () => Tb, ZodPipe: () => to, ZodOptional: () => go, ZodObject: () => Gn, ZodNumberFormat: () => Or, ZodNumber: () => Cr, ZodNullable: () => Mb, ZodNull: () => cb, ZodNonOptional: () => bo, ZodNever: () => Sb, ZodNanoID: () => Zv, ZodNaN: () => xb, ZodMap: () => Yb, ZodMAC: () => _b, ZodLiteral: () => qb, ZodLazy: () => db, ZodKSUID: () => fv, ZodJWT: () => no, ZodIssueCode: () => uU, ZodIntersection: () => Gb, ZodISOTime: () => Bv, ZodISODuration: () => Hv, ZodISODateTime: () => Qv, ZodISODate: () => qv, ZodIPv6: () => yv, ZodIPv4: () => hv, ZodGUID: () => jn, ZodFunction: () => sb, ZodFirstPartyTypeKind: () => vt, ZodFile: () => Bb, ZodError: () => vU, ZodEnum: () => Zr, ZodEmoji: () => zv, ZodEmail: () => Tv, ZodE164: () => ro, ZodDiscriminatedUnion: () => Lb, ZodDefault: () => Fb, ZodDate: () => En, ZodCustomStringFormat: () => mr, ZodCustom: () => Kn, ZodCodec: () => Io, ZodCatch: () => mb, ZodCUID2: () => mv, ZodCUID: () => ev, ZodCIDRv6: () => pv, ZodCIDRv4: () => dv, ZodBoolean: () => xr, ZodBigIntFormat: () => vo, ZodBigInt: () => fr, ZodBase64URL: () => sv, ZodBase64: () => av, ZodArray: () => Jb, ZodAny: () => jb, TimePrecision: () => Xi, NEVER: () => _o, $output: () => Ai, $input: () => Ji, $brand: () => wo });
var a = {};
d(a, { version: () => Su, util: () => k, treeifyError: () => Jo, toJSONSchema: () => Vv, toDotPath: () => jt, safeParseAsync: () => Go, safeParse: () => Lo, safeEncodeAsync: () => v6, safeEncode: () => r6, safeDecodeAsync: () => o6, safeDecode: () => n6, registry: () => ov, regexes: () => Z, process: () => E, prettifyError: () => Eo, parseAsync: () => Hn, parse: () => Bn, meta: () => tg, locales: () => kn, isValidJWT: () => Rt, isValidBase64URL: () => Ft, isValidBase64: () => mu, initializeContext: () => ir, globalRegistry: () => Y, globalConfig: () => yr, formatError: () => un, flattenError: () => on, finalize: () => br, extractDefs: () => gr, encodeAsync: () => a4, encode: () => d4, describe: () => bg, decodeAsync: () => s4, decode: () => p4, createToJSONSchemaMethod: () => lg, createStandardJSONSchemaMethod: () => Tr, config: () => X, clone: () => V, _xor: () => Yl, _xid: () => wv, _void: () => si, _uuidv7: () => bv, _uuidv6: () => gv, _uuidv4: () => iv, _uuid: () => $v, _url: () => cn, _uppercase: () => Xr, _unknown: () => pi, _union: () => Vl, _undefined: () => hi, _ulid: () => _v, _uint64: () => xi, _uint32: () => Ti, _tuple: () => Bl, _trim: () => Br, _transform: () => Zl, _toUpperCase: () => Mr, _toLowerCase: () => Hr, _templateLiteral: () => pl, _symbol: () => fi, _superRefine: () => gg, _success: () => fl, _stringbool: () => Ig, _stringFormat: () => Rr, _string: () => Li, _startsWith: () => Vr, _slugify: () => Fr, _size: () => Lr, _set: () => Fl, _safeParseAsync: () => Jr, _safeParse: () => Ar, _safeEncodeAsync: () => en, _safeEncode: () => zn, _safeDecodeAsync: () => mn, _safeDecode: () => Zn, _regex: () => Gr, _refine: () => ig, _record: () => Hl, _readonly: () => dl, _property: () => Wv, _promise: () => sl, _positive: () => Jv, _pipe: () => yl, _parseAsync: () => Sr, _parse: () => Pr, _overwrite: () => e, _optional: () => el, _number: () => qi, _nullable: () => ml, _null: () => yi, _normalize: () => qr, _nonpositive: () => Lv, _nonoptional: () => xl, _nonnegative: () => Gv, _never: () => ai, _negative: () => Ev, _nativeEnum: () => Tl, _nanoid: () => Iv, _nan: () => vg, _multipleOf: () => ur, _minSize: () => $r, _minLength: () => p, _min: () => Q, _mime: () => Qr, _maxSize: () => _r, _maxLength: () => wr, _max: () => R, _map: () => Ml, _mac: () => Wi, _lte: () => R, _lt: () => x, _lowercase: () => Wr, _literal: () => zl, _length: () => Nr, _lazy: () => al, _ksuid: () => Nv, _jwt: () => Av, _isoTime: () => Yi, _isoDuration: () => Qi, _isoDateTime: () => Ki, _isoDate: () => Vi, _ipv6: () => Ov, _ipv4: () => kv, _intersection: () => ql, _int64: () => Ci, _int32: () => Ri, _int: () => Hi, _includes: () => Kr, _guid: () => On, _gte: () => Q, _gt: () => f, _float64: () => Fi, _float32: () => Mi, _file: () => ug, _enum: () => Rl, _endsWith: () => Yr, _encodeAsync: () => Rn, _encode: () => Mn, _emoji: () => tv, _email: () => uv, _e164: () => Sv, _discriminatedUnion: () => Ql, _default: () => Cl, _decodeAsync: () => Tn, _decode: () => Fn, _date: () => rg, _custom: () => $g, _cuid2: () => Uv, _cuid: () => lv, _coercedString: () => Gi, _coercedNumber: () => Bi, _coercedDate: () => ng, _coercedBoolean: () => Zi, _coercedBigint: () => mi, _cidrv6: () => Dv, _cidrv4: () => cv, _check: () => ft, _catch: () => hl, _boolean: () => zi, _bigint: () => ei, _base64url: () => Pv, _base64: () => jv, _array: () => og, _any: () => di, TimePrecision: () => Xi, NEVER: () => _o, JSONSchemaGenerator: () => dg, JSONSchema: () => ht, Doc: () => hn, $output: () => Ai, $input: () => Ji, $constructor: () => l, $brand: () => wo, $ZodXor: () => b$, $ZodXID: () => Qu, $ZodVoid: () => u$, $ZodUnknown: () => v$, $ZodUnion: () => tn, $ZodUndefined: () => su, $ZodUUID: () => Eu, $ZodURL: () => Gu, $ZodULID: () => Yu, $ZodType: () => P, $ZodTuple: () => vv, $ZodTransform: () => O$, $ZodTemplateLiteral: () => W$, $ZodSymbol: () => au, $ZodSuccess: () => A$, $ZodStringFormat: () => L, $ZodString: () => Ur, $ZodSet: () => _$, $ZodRegistry: () => Ei, $ZodRecord: () => l$, $ZodRealError: () => H, $ZodReadonly: () => G$, $ZodPromise: () => K$, $ZodPrefault: () => P$, $ZodPipe: () => L$, $ZodOptional: () => c$, $ZodObjectJIT: () => g$, $ZodObject: () => Zt, $ZodNumberFormat: () => du, $ZodNumber: () => rv, $ZodNullable: () => D$, $ZodNull: () => r$, $ZodNonOptional: () => S$, $ZodNever: () => o$, $ZodNanoID: () => Xu, $ZodNaN: () => E$, $ZodMap: () => U$, $ZodMAC: () => zu, $ZodLiteral: () => N$, $ZodLazy: () => V$, $ZodKSUID: () => qu, $ZodJWT: () => hu, $ZodIntersection: () => I$, $ZodISOTime: () => Mu, $ZodISODuration: () => Fu, $ZodISODateTime: () => Bu, $ZodISODate: () => Hu, $ZodIPv6: () => Tu, $ZodIPv4: () => Ru, $ZodGUID: () => Ju, $ZodFunction: () => X$, $ZodFile: () => k$, $ZodError: () => vn, $ZodEnum: () => w$, $ZodEncodeError: () => tr, $ZodEmoji: () => Wu, $ZodEmail: () => Lu, $ZodE164: () => fu, $ZodDiscriminatedUnion: () => t$, $ZodDefault: () => j$, $ZodDate: () => $$, $ZodCustomStringFormat: () => yu, $ZodCustom: () => Y$, $ZodCodec: () => In, $ZodCheckUpperCase: () => Nu, $ZodCheckStringFormat: () => Er, $ZodCheckStartsWith: () => Ou, $ZodCheckSizeEquals: () => tu, $ZodCheckRegex: () => _u, $ZodCheckProperty: () => Du, $ZodCheckOverwrite: () => Pu, $ZodCheckNumberFormat: () => $u, $ZodCheckMultipleOf: () => uu, $ZodCheckMinSize: () => bu, $ZodCheckMinLength: () => lu, $ZodCheckMimeType: () => ju, $ZodCheckMaxSize: () => gu, $ZodCheckMaxLength: () => Iu, $ZodCheckLowerCase: () => wu, $ZodCheckLessThan: () => xn, $ZodCheckLengthEquals: () => Uu, $ZodCheckIncludes: () => ku, $ZodCheckGreaterThan: () => fn, $ZodCheckEndsWith: () => cu, $ZodCheckBigIntFormat: () => iu, $ZodCheck: () => W, $ZodCatch: () => J$, $ZodCUID2: () => Vu, $ZodCUID: () => Ku, $ZodCIDRv6: () => eu, $ZodCIDRv4: () => Zu, $ZodBoolean: () => bn, $ZodBigIntFormat: () => pu, $ZodBigInt: () => nv, $ZodBase64URL: () => xu, $ZodBase64: () => Cu, $ZodAsyncError: () => C, $ZodArray: () => i$, $ZodAny: () => n$ });
var _o = Object.freeze({ status: "aborted" });
function l(r, v, o) {
  function $(g, I) {
    if (!g._zod) Object.defineProperty(g, "_zod", { value: { def: I, constr: i, traits: /* @__PURE__ */ new Set() }, enumerable: false });
    if (g._zod.traits.has(r)) return;
    g._zod.traits.add(r), v(g, I);
    let b = i.prototype, U = Object.keys(b);
    for (let w = 0; w < U.length; w++) {
      let D = U[w];
      if (!(D in g)) g[D] = b[D].bind(g);
    }
  }
  let n = o?.Parent ?? Object;
  class u extends n {
  }
  Object.defineProperty(u, "name", { value: r });
  function i(g) {
    var I;
    let b = o?.Parent ? new u() : this;
    $(b, g), (I = b._zod).deferred ?? (I.deferred = []);
    for (let U of b._zod.deferred) U();
    return b;
  }
  return Object.defineProperty(i, "init", { value: $ }), Object.defineProperty(i, Symbol.hasInstance, { value: (g) => {
    if (o?.Parent && g instanceof o.Parent) return true;
    return g?._zod?.traits?.has(r);
  } }), Object.defineProperty(i, "name", { value: r }), i;
}
var wo = /* @__PURE__ */ Symbol("zod_brand");
var C = class extends Error {
  constructor() {
    super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
  }
};
var tr = class extends Error {
  constructor(r) {
    super(`Encountered unidirectional transform during encode: ${r}`);
    this.name = "ZodEncodeError";
  }
};
var yr = {};
function X(r) {
  if (r) Object.assign(yr, r);
  return yr;
}
var k = {};
d(k, { unwrapMessage: () => dr, uint8ArrayToHex: () => h4, uint8ArrayToBase64url: () => x4, uint8ArrayToBase64: () => Ot, stringifyPrimitive: () => N, slugify: () => Oo, shallowClone: () => Do, safeExtend: () => T4, required: () => e4, randomString: () => Q4, propertyKeyTypes: () => sr, promiseAllObject: () => Y4, primitiveTypes: () => jo, prefixIssues: () => F, pick: () => M4, partial: () => Z4, optionalKeys: () => Po, omit: () => F4, objectClone: () => X4, numKeys: () => q4, nullish: () => s, normalizeParams: () => O, mergeDefs: () => nr, merge: () => z4, jsonStringifyReplacer: () => cr, joinValues: () => _, issue: () => jr, isPlainObject: () => vr, isObject: () => Ir, hexToUint8Array: () => f4, getSizableOrigin: () => rn, getParsedType: () => B4, getLengthableOrigin: () => nn, getEnumValues: () => pr, getElementAtPath: () => V4, floatSafeRemainder: () => ko, finalizeIssue: () => B, extend: () => R4, escapeRegex: () => z2, esc: () => Qn, defineLazy: () => A, createTransparentProxy: () => H4, cloneDef: () => K4, clone: () => V, cleanRegex: () => ar, cleanEnum: () => m4, captureStackTrace: () => qn, cached: () => Dr, base64urlToUint8Array: () => C4, base64ToUint8Array: () => kt, assignProp: () => rr, assertNotEqual: () => E4, assertNever: () => G4, assertIs: () => L4, assertEqual: () => J4, assert: () => W4, allowsEval: () => co, aborted: () => or, NUMBER_FORMAT_RANGES: () => So, Class: () => ct, BIGINT_FORMAT_RANGES: () => Ao });
function J4(r) {
  return r;
}
function E4(r) {
  return r;
}
function L4(r) {
}
function G4(r) {
  throw Error("Unexpected value in exhaustive check");
}
function W4(r) {
}
function pr(r) {
  let v = Object.values(r).filter(($) => typeof $ === "number");
  return Object.entries(r).filter(([$, n]) => v.indexOf(+$) === -1).map(([$, n]) => n);
}
function _(r, v = "|") {
  return r.map((o) => N(o)).join(v);
}
function cr(r, v) {
  if (typeof v === "bigint") return v.toString();
  return v;
}
function Dr(r) {
  return { get value() {
    {
      let o = r();
      return Object.defineProperty(this, "value", { value: o }), o;
    }
    throw Error("cached value already set");
  } };
}
function s(r) {
  return r === null || r === void 0;
}
function ar(r) {
  let v = r.startsWith("^") ? 1 : 0, o = r.endsWith("$") ? r.length - 1 : r.length;
  return r.slice(v, o);
}
function ko(r, v) {
  let o = (r.toString().split(".")[1] || "").length, $ = v.toString(), n = ($.split(".")[1] || "").length;
  if (n === 0 && /\d?e-\d?/.test($)) {
    let I = $.match(/\d?e-(\d?)/);
    if (I?.[1]) n = Number.parseInt(I[1]);
  }
  let u = o > n ? o : n, i = Number.parseInt(r.toFixed(u).replace(".", "")), g = Number.parseInt(v.toFixed(u).replace(".", ""));
  return i % g / 10 ** u;
}
var Nt = /* @__PURE__ */ Symbol("evaluating");
function A(r, v, o) {
  let $ = void 0;
  Object.defineProperty(r, v, { get() {
    if ($ === Nt) return;
    if ($ === void 0) $ = Nt, $ = o();
    return $;
  }, set(n) {
    Object.defineProperty(r, v, { value: n });
  }, configurable: true });
}
function X4(r) {
  return Object.create(Object.getPrototypeOf(r), Object.getOwnPropertyDescriptors(r));
}
function rr(r, v, o) {
  Object.defineProperty(r, v, { value: o, writable: true, enumerable: true, configurable: true });
}
function nr(...r) {
  let v = {};
  for (let o of r) {
    let $ = Object.getOwnPropertyDescriptors(o);
    Object.assign(v, $);
  }
  return Object.defineProperties({}, v);
}
function K4(r) {
  return nr(r._zod.def);
}
function V4(r, v) {
  if (!v) return r;
  return v.reduce((o, $) => o?.[$], r);
}
function Y4(r) {
  let v = Object.keys(r), o = v.map(($) => r[$]);
  return Promise.all(o).then(($) => {
    let n = {};
    for (let u = 0; u < v.length; u++) n[v[u]] = $[u];
    return n;
  });
}
function Q4(r = 10) {
  let o = "";
  for (let $ = 0; $ < r; $++) o += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  return o;
}
function Qn(r) {
  return JSON.stringify(r);
}
function Oo(r) {
  return r.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var qn = "captureStackTrace" in Error ? Error.captureStackTrace : (...r) => {
};
function Ir(r) {
  return typeof r === "object" && r !== null && !Array.isArray(r);
}
var co = Dr(() => {
  if (typeof navigator < "u" && navigator?.userAgent?.includes("Cloudflare")) return false;
  try {
    return new Function(""), true;
  } catch (r) {
    return false;
  }
});
function vr(r) {
  if (Ir(r) === false) return false;
  let v = r.constructor;
  if (v === void 0) return true;
  if (typeof v !== "function") return true;
  let o = v.prototype;
  if (Ir(o) === false) return false;
  if (Object.prototype.hasOwnProperty.call(o, "isPrototypeOf") === false) return false;
  return true;
}
function Do(r) {
  if (vr(r)) return { ...r };
  if (Array.isArray(r)) return [...r];
  return r;
}
function q4(r) {
  let v = 0;
  for (let o in r) if (Object.prototype.hasOwnProperty.call(r, o)) v++;
  return v;
}
var B4 = (r) => {
  let v = typeof r;
  switch (v) {
    case "undefined":
      return "undefined";
    case "string":
      return "string";
    case "number":
      return Number.isNaN(r) ? "nan" : "number";
    case "boolean":
      return "boolean";
    case "function":
      return "function";
    case "bigint":
      return "bigint";
    case "symbol":
      return "symbol";
    case "object":
      if (Array.isArray(r)) return "array";
      if (r === null) return "null";
      if (r.then && typeof r.then === "function" && r.catch && typeof r.catch === "function") return "promise";
      if (typeof Map < "u" && r instanceof Map) return "map";
      if (typeof Set < "u" && r instanceof Set) return "set";
      if (typeof Date < "u" && r instanceof Date) return "date";
      if (typeof File < "u" && r instanceof File) return "file";
      return "object";
    default:
      throw Error(`Unknown data type: ${v}`);
  }
};
var sr = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
var jo = /* @__PURE__ */ new Set(["string", "number", "bigint", "boolean", "symbol", "undefined"]);
function z2(r) {
  return r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function V(r, v, o) {
  let $ = new r._zod.constr(v ?? r._zod.def);
  if (!v || o?.parent) $._zod.parent = r;
  return $;
}
function O(r) {
  let v = r;
  if (!v) return {};
  if (typeof v === "string") return { error: () => v };
  if (v?.message !== void 0) {
    if (v?.error !== void 0) throw Error("Cannot specify both `message` and `error` params");
    v.error = v.message;
  }
  if (delete v.message, typeof v.error === "string") return { ...v, error: () => v.error };
  return v;
}
function H4(r) {
  let v;
  return new Proxy({}, { get(o, $, n) {
    return v ?? (v = r()), Reflect.get(v, $, n);
  }, set(o, $, n, u) {
    return v ?? (v = r()), Reflect.set(v, $, n, u);
  }, has(o, $) {
    return v ?? (v = r()), Reflect.has(v, $);
  }, deleteProperty(o, $) {
    return v ?? (v = r()), Reflect.deleteProperty(v, $);
  }, ownKeys(o) {
    return v ?? (v = r()), Reflect.ownKeys(v);
  }, getOwnPropertyDescriptor(o, $) {
    return v ?? (v = r()), Reflect.getOwnPropertyDescriptor(v, $);
  }, defineProperty(o, $, n) {
    return v ?? (v = r()), Reflect.defineProperty(v, $, n);
  } });
}
function N(r) {
  if (typeof r === "bigint") return r.toString() + "n";
  if (typeof r === "string") return `"${r}"`;
  return `${r}`;
}
function Po(r) {
  return Object.keys(r).filter((v) => {
    return r[v]._zod.optin === "optional" && r[v]._zod.optout === "optional";
  });
}
var So = { safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER], int32: [-2147483648, 2147483647], uint32: [0, 4294967295], float32: [-34028234663852886e22, 34028234663852886e22], float64: [-Number.MAX_VALUE, Number.MAX_VALUE] };
var Ao = { int64: [BigInt("-9223372036854775808"), BigInt("9223372036854775807")], uint64: [BigInt(0), BigInt("18446744073709551615")] };
function M4(r, v) {
  let o = r._zod.def, $ = nr(r._zod.def, { get shape() {
    let n = {};
    for (let u in v) {
      if (!(u in o.shape)) throw Error(`Unrecognized key: "${u}"`);
      if (!v[u]) continue;
      n[u] = o.shape[u];
    }
    return rr(this, "shape", n), n;
  }, checks: [] });
  return V(r, $);
}
function F4(r, v) {
  let o = r._zod.def, $ = nr(r._zod.def, { get shape() {
    let n = { ...r._zod.def.shape };
    for (let u in v) {
      if (!(u in o.shape)) throw Error(`Unrecognized key: "${u}"`);
      if (!v[u]) continue;
      delete n[u];
    }
    return rr(this, "shape", n), n;
  }, checks: [] });
  return V(r, $);
}
function R4(r, v) {
  if (!vr(v)) throw Error("Invalid input to extend: expected a plain object");
  let o = r._zod.def.checks;
  if (o && o.length > 0) throw Error("Object schemas containing refinements cannot be extended. Use `.safeExtend()` instead.");
  let n = nr(r._zod.def, { get shape() {
    let u = { ...r._zod.def.shape, ...v };
    return rr(this, "shape", u), u;
  }, checks: [] });
  return V(r, n);
}
function T4(r, v) {
  if (!vr(v)) throw Error("Invalid input to safeExtend: expected a plain object");
  let o = { ...r._zod.def, get shape() {
    let $ = { ...r._zod.def.shape, ...v };
    return rr(this, "shape", $), $;
  }, checks: r._zod.def.checks };
  return V(r, o);
}
function z4(r, v) {
  let o = nr(r._zod.def, { get shape() {
    let $ = { ...r._zod.def.shape, ...v._zod.def.shape };
    return rr(this, "shape", $), $;
  }, get catchall() {
    return v._zod.def.catchall;
  }, checks: [] });
  return V(r, o);
}
function Z4(r, v, o) {
  let $ = nr(v._zod.def, { get shape() {
    let n = v._zod.def.shape, u = { ...n };
    if (o) for (let i in o) {
      if (!(i in n)) throw Error(`Unrecognized key: "${i}"`);
      if (!o[i]) continue;
      u[i] = r ? new r({ type: "optional", innerType: n[i] }) : n[i];
    }
    else for (let i in n) u[i] = r ? new r({ type: "optional", innerType: n[i] }) : n[i];
    return rr(this, "shape", u), u;
  }, checks: [] });
  return V(v, $);
}
function e4(r, v, o) {
  let $ = nr(v._zod.def, { get shape() {
    let n = v._zod.def.shape, u = { ...n };
    if (o) for (let i in o) {
      if (!(i in u)) throw Error(`Unrecognized key: "${i}"`);
      if (!o[i]) continue;
      u[i] = new r({ type: "nonoptional", innerType: n[i] });
    }
    else for (let i in n) u[i] = new r({ type: "nonoptional", innerType: n[i] });
    return rr(this, "shape", u), u;
  }, checks: [] });
  return V(v, $);
}
function or(r, v = 0) {
  if (r.aborted === true) return true;
  for (let o = v; o < r.issues.length; o++) if (r.issues[o]?.continue !== true) return true;
  return false;
}
function F(r, v) {
  return v.map((o) => {
    var $;
    return ($ = o).path ?? ($.path = []), o.path.unshift(r), o;
  });
}
function dr(r) {
  return typeof r === "string" ? r : r?.message;
}
function B(r, v, o) {
  let $ = { ...r, path: r.path ?? [] };
  if (!r.message) {
    let n = dr(r.inst?._zod.def?.error?.(r)) ?? dr(v?.error?.(r)) ?? dr(o.customError?.(r)) ?? dr(o.localeError?.(r)) ?? "Invalid input";
    $.message = n;
  }
  if (delete $.inst, delete $.continue, !v?.reportInput) delete $.input;
  return $;
}
function rn(r) {
  if (r instanceof Set) return "set";
  if (r instanceof Map) return "map";
  if (r instanceof File) return "file";
  return "unknown";
}
function nn(r) {
  if (Array.isArray(r)) return "array";
  if (typeof r === "string") return "string";
  return "unknown";
}
function jr(...r) {
  let [v, o, $] = r;
  if (typeof v === "string") return { message: v, code: "custom", input: o, inst: $ };
  return { ...v };
}
function m4(r) {
  return Object.entries(r).filter(([v, o]) => {
    return Number.isNaN(Number.parseInt(v, 10));
  }).map((v) => v[1]);
}
function kt(r) {
  let v = atob(r), o = new Uint8Array(v.length);
  for (let $ = 0; $ < v.length; $++) o[$] = v.charCodeAt($);
  return o;
}
function Ot(r) {
  let v = "";
  for (let o = 0; o < r.length; o++) v += String.fromCharCode(r[o]);
  return btoa(v);
}
function C4(r) {
  let v = r.replace(/-/g, "+").replace(/_/g, "/"), o = "=".repeat((4 - v.length % 4) % 4);
  return kt(v + o);
}
function x4(r) {
  return Ot(r).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function f4(r) {
  let v = r.replace(/^0x/, "");
  if (v.length % 2 !== 0) throw Error("Invalid hex string length");
  let o = new Uint8Array(v.length / 2);
  for (let $ = 0; $ < v.length; $ += 2) o[$ / 2] = Number.parseInt(v.slice($, $ + 2), 16);
  return o;
}
function h4(r) {
  return Array.from(r).map((v) => v.toString(16).padStart(2, "0")).join("");
}
var ct = class {
  constructor(...r) {
  }
};
var Dt = (r, v) => {
  r.name = "$ZodError", Object.defineProperty(r, "_zod", { value: r._zod, enumerable: false }), Object.defineProperty(r, "issues", { value: v, enumerable: false }), r.message = JSON.stringify(v, cr, 2), Object.defineProperty(r, "toString", { value: () => r.message, enumerable: false });
};
var vn = l("$ZodError", Dt);
var H = l("$ZodError", Dt, { Parent: Error });
function on(r, v = (o) => o.message) {
  let o = {}, $ = [];
  for (let n of r.issues) if (n.path.length > 0) o[n.path[0]] = o[n.path[0]] || [], o[n.path[0]].push(v(n));
  else $.push(v(n));
  return { formErrors: $, fieldErrors: o };
}
function un(r, v = (o) => o.message) {
  let o = { _errors: [] }, $ = (n) => {
    for (let u of n.issues) if (u.code === "invalid_union" && u.errors.length) u.errors.map((i) => $({ issues: i }));
    else if (u.code === "invalid_key") $({ issues: u.issues });
    else if (u.code === "invalid_element") $({ issues: u.issues });
    else if (u.path.length === 0) o._errors.push(v(u));
    else {
      let i = o, g = 0;
      while (g < u.path.length) {
        let I = u.path[g];
        if (g !== u.path.length - 1) i[I] = i[I] || { _errors: [] };
        else i[I] = i[I] || { _errors: [] }, i[I]._errors.push(v(u));
        i = i[I], g++;
      }
    }
  };
  return $(r), o;
}
function Jo(r, v = (o) => o.message) {
  let o = { errors: [] }, $ = (n, u = []) => {
    var i, g;
    for (let I of n.issues) if (I.code === "invalid_union" && I.errors.length) I.errors.map((b) => $({ issues: b }, I.path));
    else if (I.code === "invalid_key") $({ issues: I.issues }, I.path);
    else if (I.code === "invalid_element") $({ issues: I.issues }, I.path);
    else {
      let b = [...u, ...I.path];
      if (b.length === 0) {
        o.errors.push(v(I));
        continue;
      }
      let U = o, w = 0;
      while (w < b.length) {
        let D = b[w], j = w === b.length - 1;
        if (typeof D === "string") U.properties ?? (U.properties = {}), (i = U.properties)[D] ?? (i[D] = { errors: [] }), U = U.properties[D];
        else U.items ?? (U.items = []), (g = U.items)[D] ?? (g[D] = { errors: [] }), U = U.items[D];
        if (j) U.errors.push(v(I));
        w++;
      }
    }
  };
  return $(r), o;
}
function jt(r) {
  let v = [], o = r.map(($) => typeof $ === "object" ? $.key : $);
  for (let $ of o) if (typeof $ === "number") v.push(`[${$}]`);
  else if (typeof $ === "symbol") v.push(`[${JSON.stringify(String($))}]`);
  else if (/[^\w$]/.test($)) v.push(`[${JSON.stringify($)}]`);
  else {
    if (v.length) v.push(".");
    v.push($);
  }
  return v.join("");
}
function Eo(r) {
  let v = [], o = [...r.issues].sort(($, n) => ($.path ?? []).length - (n.path ?? []).length);
  for (let $ of o) if (v.push(`\u2716 ${$.message}`), $.path?.length) v.push(`  \u2192 at ${jt($.path)}`);
  return v.join(`
`);
}
var Pr = (r) => (v, o, $, n) => {
  let u = $ ? Object.assign($, { async: false }) : { async: false }, i = v._zod.run({ value: o, issues: [] }, u);
  if (i instanceof Promise) throw new C();
  if (i.issues.length) {
    let g = new (n?.Err ?? r)(i.issues.map((I) => B(I, u, X())));
    throw qn(g, n?.callee), g;
  }
  return i.value;
};
var Bn = Pr(H);
var Sr = (r) => async (v, o, $, n) => {
  let u = $ ? Object.assign($, { async: true }) : { async: true }, i = v._zod.run({ value: o, issues: [] }, u);
  if (i instanceof Promise) i = await i;
  if (i.issues.length) {
    let g = new (n?.Err ?? r)(i.issues.map((I) => B(I, u, X())));
    throw qn(g, n?.callee), g;
  }
  return i.value;
};
var Hn = Sr(H);
var Ar = (r) => (v, o, $) => {
  let n = $ ? { ...$, async: false } : { async: false }, u = v._zod.run({ value: o, issues: [] }, n);
  if (u instanceof Promise) throw new C();
  return u.issues.length ? { success: false, error: new (r ?? vn)(u.issues.map((i) => B(i, n, X()))) } : { success: true, data: u.value };
};
var Lo = Ar(H);
var Jr = (r) => async (v, o, $) => {
  let n = $ ? Object.assign($, { async: true }) : { async: true }, u = v._zod.run({ value: o, issues: [] }, n);
  if (u instanceof Promise) u = await u;
  return u.issues.length ? { success: false, error: new r(u.issues.map((i) => B(i, n, X()))) } : { success: true, data: u.value };
};
var Go = Jr(H);
var Mn = (r) => (v, o, $) => {
  let n = $ ? Object.assign($, { direction: "backward" }) : { direction: "backward" };
  return Pr(r)(v, o, n);
};
var d4 = Mn(H);
var Fn = (r) => (v, o, $) => {
  return Pr(r)(v, o, $);
};
var p4 = Fn(H);
var Rn = (r) => async (v, o, $) => {
  let n = $ ? Object.assign($, { direction: "backward" }) : { direction: "backward" };
  return Sr(r)(v, o, n);
};
var a4 = Rn(H);
var Tn = (r) => async (v, o, $) => {
  return Sr(r)(v, o, $);
};
var s4 = Tn(H);
var zn = (r) => (v, o, $) => {
  let n = $ ? Object.assign($, { direction: "backward" }) : { direction: "backward" };
  return Ar(r)(v, o, n);
};
var r6 = zn(H);
var Zn = (r) => (v, o, $) => {
  return Ar(r)(v, o, $);
};
var n6 = Zn(H);
var en = (r) => async (v, o, $) => {
  let n = $ ? Object.assign($, { direction: "backward" }) : { direction: "backward" };
  return Jr(r)(v, o, n);
};
var v6 = en(H);
var mn = (r) => async (v, o, $) => {
  return Jr(r)(v, o, $);
};
var o6 = mn(H);
var Z = {};
d(Z, { xid: () => Vo, uuid7: () => g6, uuid6: () => i6, uuid4: () => $6, uuid: () => lr, uppercase: () => ou, unicodeEmail: () => Pt, undefined: () => nu, ulid: () => Ko, time: () => xo, string: () => ho, sha512_hex: () => W6, sha512_base64url: () => K6, sha512_base64: () => X6, sha384_hex: () => E6, sha384_base64url: () => G6, sha384_base64: () => L6, sha256_hex: () => S6, sha256_base64url: () => J6, sha256_base64: () => A6, sha1_hex: () => D6, sha1_base64url: () => P6, sha1_base64: () => j6, rfc5322Email: () => t6, number: () => ao, null: () => ru, nanoid: () => Qo, md5_hex: () => k6, md5_base64url: () => c6, md5_base64: () => O6, mac: () => To, lowercase: () => vu, ksuid: () => Yo, ipv6: () => Ro, ipv4: () => Fo, integer: () => po, idnEmail: () => I6, html5Email: () => b6, hostname: () => _6, hex: () => N6, guid: () => Bo, extendedDuration: () => u6, emoji: () => Mo, email: () => Ho, e164: () => mo, duration: () => qo, domain: () => w6, datetime: () => fo, date: () => Co, cuid2: () => Xo, cuid: () => Wo, cidrv6: () => Zo, cidrv4: () => zo, browserEmail: () => l6, boolean: () => so, bigint: () => yo, base64url: () => Cn, base64: () => eo });
var Wo = /^[cC][^\s-]{8,}$/;
var Xo = /^[0-9a-z]+$/;
var Ko = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
var Vo = /^[0-9a-vA-V]{20}$/;
var Yo = /^[A-Za-z0-9]{27}$/;
var Qo = /^[a-zA-Z0-9_-]{21}$/;
var qo = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var u6 = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var Bo = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var lr = (r) => {
  if (!r) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${r}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
var $6 = lr(4);
var i6 = lr(6);
var g6 = lr(7);
var Ho = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var b6 = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
var t6 = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var Pt = /^[^\s@"]{1,64}@[^\s@]{1,255}$/u;
var I6 = Pt;
var l6 = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
var U6 = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
function Mo() {
  return new RegExp(U6, "u");
}
var Fo = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var Ro = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var To = (r) => {
  let v = z2(r ?? ":");
  return new RegExp(`^(?:[0-9A-F]{2}${v}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${v}){5}[0-9a-f]{2}$`);
};
var zo = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var Zo = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var eo = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var Cn = /^[A-Za-z0-9_-]*$/;
var _6 = /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/;
var w6 = /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
var mo = /^\+(?:[0-9]){6,14}[0-9]$/;
var St = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))";
var Co = new RegExp(`^${St}$`);
function At(r) {
  return typeof r.precision === "number" ? r.precision === -1 ? "(?:[01]\\d|2[0-3]):[0-5]\\d" : r.precision === 0 ? "(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d" : `(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d\\.\\d{${r.precision}}` : "(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?";
}
function xo(r) {
  return new RegExp(`^${At(r)}$`);
}
function fo(r) {
  let v = At({ precision: r.precision }), o = ["Z"];
  if (r.local) o.push("");
  if (r.offset) o.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");
  let $ = `${v}(?:${o.join("|")})`;
  return new RegExp(`^${St}T(?:${$})$`);
}
var ho = (r) => {
  let v = r ? `[\\s\\S]{${r?.minimum ?? 0},${r?.maximum ?? ""}}` : "[\\s\\S]*";
  return new RegExp(`^${v}$`);
};
var yo = /^-?\d+n?$/;
var po = /^-?\d+$/;
var ao = /^-?\d+(?:\.\d+)?/;
var so = /^(?:true|false)$/i;
var ru = /^null$/i;
var nu = /^undefined$/i;
var vu = /^[^A-Z]*$/;
var ou = /^[^a-z]*$/;
var N6 = /^[0-9a-fA-F]*$/;
function $n(r, v) {
  return new RegExp(`^[A-Za-z0-9+/]{${r}}${v}$`);
}
function gn(r) {
  return new RegExp(`^[A-Za-z0-9_-]{${r}}$`);
}
var k6 = /^[0-9a-fA-F]{32}$/;
var O6 = $n(22, "==");
var c6 = gn(22);
var D6 = /^[0-9a-fA-F]{40}$/;
var j6 = $n(27, "=");
var P6 = gn(27);
var S6 = /^[0-9a-fA-F]{64}$/;
var A6 = $n(43, "=");
var J6 = gn(43);
var E6 = /^[0-9a-fA-F]{96}$/;
var L6 = $n(64, "");
var G6 = gn(64);
var W6 = /^[0-9a-fA-F]{128}$/;
var X6 = $n(86, "==");
var K6 = gn(86);
var W = l("$ZodCheck", (r, v) => {
  var o;
  r._zod ?? (r._zod = {}), r._zod.def = v, (o = r._zod).onattach ?? (o.onattach = []);
});
var Et = { number: "number", bigint: "bigint", object: "date" };
var xn = l("$ZodCheckLessThan", (r, v) => {
  W.init(r, v);
  let o = Et[typeof v.value];
  r._zod.onattach.push(($) => {
    let n = $._zod.bag, u = (v.inclusive ? n.maximum : n.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    if (v.value < u) if (v.inclusive) n.maximum = v.value;
    else n.exclusiveMaximum = v.value;
  }), r._zod.check = ($) => {
    if (v.inclusive ? $.value <= v.value : $.value < v.value) return;
    $.issues.push({ origin: o, code: "too_big", maximum: v.value, input: $.value, inclusive: v.inclusive, inst: r, continue: !v.abort });
  };
});
var fn = l("$ZodCheckGreaterThan", (r, v) => {
  W.init(r, v);
  let o = Et[typeof v.value];
  r._zod.onattach.push(($) => {
    let n = $._zod.bag, u = (v.inclusive ? n.minimum : n.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    if (v.value > u) if (v.inclusive) n.minimum = v.value;
    else n.exclusiveMinimum = v.value;
  }), r._zod.check = ($) => {
    if (v.inclusive ? $.value >= v.value : $.value > v.value) return;
    $.issues.push({ origin: o, code: "too_small", minimum: v.value, input: $.value, inclusive: v.inclusive, inst: r, continue: !v.abort });
  };
});
var uu = l("$ZodCheckMultipleOf", (r, v) => {
  W.init(r, v), r._zod.onattach.push((o) => {
    var $;
    ($ = o._zod.bag).multipleOf ?? ($.multipleOf = v.value);
  }), r._zod.check = (o) => {
    if (typeof o.value !== typeof v.value) throw Error("Cannot mix number and bigint in multiple_of check.");
    if (typeof o.value === "bigint" ? o.value % v.value === BigInt(0) : ko(o.value, v.value) === 0) return;
    o.issues.push({ origin: typeof o.value, code: "not_multiple_of", divisor: v.value, input: o.value, inst: r, continue: !v.abort });
  };
});
var $u = l("$ZodCheckNumberFormat", (r, v) => {
  W.init(r, v), v.format = v.format || "float64";
  let o = v.format?.includes("int"), $ = o ? "int" : "number", [n, u] = So[v.format];
  r._zod.onattach.push((i) => {
    let g = i._zod.bag;
    if (g.format = v.format, g.minimum = n, g.maximum = u, o) g.pattern = po;
  }), r._zod.check = (i) => {
    let g = i.value;
    if (o) {
      if (!Number.isInteger(g)) {
        i.issues.push({ expected: $, format: v.format, code: "invalid_type", continue: false, input: g, inst: r });
        return;
      }
      if (!Number.isSafeInteger(g)) {
        if (g > 0) i.issues.push({ input: g, code: "too_big", maximum: Number.MAX_SAFE_INTEGER, note: "Integers must be within the safe integer range.", inst: r, origin: $, continue: !v.abort });
        else i.issues.push({ input: g, code: "too_small", minimum: Number.MIN_SAFE_INTEGER, note: "Integers must be within the safe integer range.", inst: r, origin: $, continue: !v.abort });
        return;
      }
    }
    if (g < n) i.issues.push({ origin: "number", input: g, code: "too_small", minimum: n, inclusive: true, inst: r, continue: !v.abort });
    if (g > u) i.issues.push({ origin: "number", input: g, code: "too_big", maximum: u, inst: r });
  };
});
var iu = l("$ZodCheckBigIntFormat", (r, v) => {
  W.init(r, v);
  let [o, $] = Ao[v.format];
  r._zod.onattach.push((n) => {
    let u = n._zod.bag;
    u.format = v.format, u.minimum = o, u.maximum = $;
  }), r._zod.check = (n) => {
    let u = n.value;
    if (u < o) n.issues.push({ origin: "bigint", input: u, code: "too_small", minimum: o, inclusive: true, inst: r, continue: !v.abort });
    if (u > $) n.issues.push({ origin: "bigint", input: u, code: "too_big", maximum: $, inst: r });
  };
});
var gu = l("$ZodCheckMaxSize", (r, v) => {
  var o;
  W.init(r, v), (o = r._zod.def).when ?? (o.when = ($) => {
    let n = $.value;
    return !s(n) && n.size !== void 0;
  }), r._zod.onattach.push(($) => {
    let n = $._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (v.maximum < n) $._zod.bag.maximum = v.maximum;
  }), r._zod.check = ($) => {
    let n = $.value;
    if (n.size <= v.maximum) return;
    $.issues.push({ origin: rn(n), code: "too_big", maximum: v.maximum, inclusive: true, input: n, inst: r, continue: !v.abort });
  };
});
var bu = l("$ZodCheckMinSize", (r, v) => {
  var o;
  W.init(r, v), (o = r._zod.def).when ?? (o.when = ($) => {
    let n = $.value;
    return !s(n) && n.size !== void 0;
  }), r._zod.onattach.push(($) => {
    let n = $._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (v.minimum > n) $._zod.bag.minimum = v.minimum;
  }), r._zod.check = ($) => {
    let n = $.value;
    if (n.size >= v.minimum) return;
    $.issues.push({ origin: rn(n), code: "too_small", minimum: v.minimum, inclusive: true, input: n, inst: r, continue: !v.abort });
  };
});
var tu = l("$ZodCheckSizeEquals", (r, v) => {
  var o;
  W.init(r, v), (o = r._zod.def).when ?? (o.when = ($) => {
    let n = $.value;
    return !s(n) && n.size !== void 0;
  }), r._zod.onattach.push(($) => {
    let n = $._zod.bag;
    n.minimum = v.size, n.maximum = v.size, n.size = v.size;
  }), r._zod.check = ($) => {
    let n = $.value, u = n.size;
    if (u === v.size) return;
    let i = u > v.size;
    $.issues.push({ origin: rn(n), ...i ? { code: "too_big", maximum: v.size } : { code: "too_small", minimum: v.size }, inclusive: true, exact: true, input: $.value, inst: r, continue: !v.abort });
  };
});
var Iu = l("$ZodCheckMaxLength", (r, v) => {
  var o;
  W.init(r, v), (o = r._zod.def).when ?? (o.when = ($) => {
    let n = $.value;
    return !s(n) && n.length !== void 0;
  }), r._zod.onattach.push(($) => {
    let n = $._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (v.maximum < n) $._zod.bag.maximum = v.maximum;
  }), r._zod.check = ($) => {
    let n = $.value;
    if (n.length <= v.maximum) return;
    let i = nn(n);
    $.issues.push({ origin: i, code: "too_big", maximum: v.maximum, inclusive: true, input: n, inst: r, continue: !v.abort });
  };
});
var lu = l("$ZodCheckMinLength", (r, v) => {
  var o;
  W.init(r, v), (o = r._zod.def).when ?? (o.when = ($) => {
    let n = $.value;
    return !s(n) && n.length !== void 0;
  }), r._zod.onattach.push(($) => {
    let n = $._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (v.minimum > n) $._zod.bag.minimum = v.minimum;
  }), r._zod.check = ($) => {
    let n = $.value;
    if (n.length >= v.minimum) return;
    let i = nn(n);
    $.issues.push({ origin: i, code: "too_small", minimum: v.minimum, inclusive: true, input: n, inst: r, continue: !v.abort });
  };
});
var Uu = l("$ZodCheckLengthEquals", (r, v) => {
  var o;
  W.init(r, v), (o = r._zod.def).when ?? (o.when = ($) => {
    let n = $.value;
    return !s(n) && n.length !== void 0;
  }), r._zod.onattach.push(($) => {
    let n = $._zod.bag;
    n.minimum = v.length, n.maximum = v.length, n.length = v.length;
  }), r._zod.check = ($) => {
    let n = $.value, u = n.length;
    if (u === v.length) return;
    let i = nn(n), g = u > v.length;
    $.issues.push({ origin: i, ...g ? { code: "too_big", maximum: v.length } : { code: "too_small", minimum: v.length }, inclusive: true, exact: true, input: $.value, inst: r, continue: !v.abort });
  };
});
var Er = l("$ZodCheckStringFormat", (r, v) => {
  var o, $;
  if (W.init(r, v), r._zod.onattach.push((n) => {
    let u = n._zod.bag;
    if (u.format = v.format, v.pattern) u.patterns ?? (u.patterns = /* @__PURE__ */ new Set()), u.patterns.add(v.pattern);
  }), v.pattern) (o = r._zod).check ?? (o.check = (n) => {
    if (v.pattern.lastIndex = 0, v.pattern.test(n.value)) return;
    n.issues.push({ origin: "string", code: "invalid_format", format: v.format, input: n.value, ...v.pattern ? { pattern: v.pattern.toString() } : {}, inst: r, continue: !v.abort });
  });
  else ($ = r._zod).check ?? ($.check = () => {
  });
});
var _u = l("$ZodCheckRegex", (r, v) => {
  Er.init(r, v), r._zod.check = (o) => {
    if (v.pattern.lastIndex = 0, v.pattern.test(o.value)) return;
    o.issues.push({ origin: "string", code: "invalid_format", format: "regex", input: o.value, pattern: v.pattern.toString(), inst: r, continue: !v.abort });
  };
});
var wu = l("$ZodCheckLowerCase", (r, v) => {
  v.pattern ?? (v.pattern = vu), Er.init(r, v);
});
var Nu = l("$ZodCheckUpperCase", (r, v) => {
  v.pattern ?? (v.pattern = ou), Er.init(r, v);
});
var ku = l("$ZodCheckIncludes", (r, v) => {
  W.init(r, v);
  let o = z2(v.includes), $ = new RegExp(typeof v.position === "number" ? `^.{${v.position}}${o}` : o);
  v.pattern = $, r._zod.onattach.push((n) => {
    let u = n._zod.bag;
    u.patterns ?? (u.patterns = /* @__PURE__ */ new Set()), u.patterns.add($);
  }), r._zod.check = (n) => {
    if (n.value.includes(v.includes, v.position)) return;
    n.issues.push({ origin: "string", code: "invalid_format", format: "includes", includes: v.includes, input: n.value, inst: r, continue: !v.abort });
  };
});
var Ou = l("$ZodCheckStartsWith", (r, v) => {
  W.init(r, v);
  let o = new RegExp(`^${z2(v.prefix)}.*`);
  v.pattern ?? (v.pattern = o), r._zod.onattach.push(($) => {
    let n = $._zod.bag;
    n.patterns ?? (n.patterns = /* @__PURE__ */ new Set()), n.patterns.add(o);
  }), r._zod.check = ($) => {
    if ($.value.startsWith(v.prefix)) return;
    $.issues.push({ origin: "string", code: "invalid_format", format: "starts_with", prefix: v.prefix, input: $.value, inst: r, continue: !v.abort });
  };
});
var cu = l("$ZodCheckEndsWith", (r, v) => {
  W.init(r, v);
  let o = new RegExp(`.*${z2(v.suffix)}$`);
  v.pattern ?? (v.pattern = o), r._zod.onattach.push(($) => {
    let n = $._zod.bag;
    n.patterns ?? (n.patterns = /* @__PURE__ */ new Set()), n.patterns.add(o);
  }), r._zod.check = ($) => {
    if ($.value.endsWith(v.suffix)) return;
    $.issues.push({ origin: "string", code: "invalid_format", format: "ends_with", suffix: v.suffix, input: $.value, inst: r, continue: !v.abort });
  };
});
function Jt(r, v, o) {
  if (r.issues.length) v.issues.push(...F(o, r.issues));
}
var Du = l("$ZodCheckProperty", (r, v) => {
  W.init(r, v), r._zod.check = (o) => {
    let $ = v.schema._zod.run({ value: o.value[v.property], issues: [] }, {});
    if ($ instanceof Promise) return $.then((n) => Jt(n, o, v.property));
    Jt($, o, v.property);
    return;
  };
});
var ju = l("$ZodCheckMimeType", (r, v) => {
  W.init(r, v);
  let o = new Set(v.mime);
  r._zod.onattach.push(($) => {
    $._zod.bag.mime = v.mime;
  }), r._zod.check = ($) => {
    if (o.has($.value.type)) return;
    $.issues.push({ code: "invalid_value", values: v.mime, input: $.value.type, inst: r, continue: !v.abort });
  };
});
var Pu = l("$ZodCheckOverwrite", (r, v) => {
  W.init(r, v), r._zod.check = (o) => {
    o.value = v.tx(o.value);
  };
});
var hn = class {
  constructor(r = []) {
    if (this.content = [], this.indent = 0, this) this.args = r;
  }
  indented(r) {
    this.indent += 1, r(this), this.indent -= 1;
  }
  write(r) {
    if (typeof r === "function") {
      r(this, { execution: "sync" }), r(this, { execution: "async" });
      return;
    }
    let o = r.split(`
`).filter((u) => u), $ = Math.min(...o.map((u) => u.length - u.trimStart().length)), n = o.map((u) => u.slice($)).map((u) => " ".repeat(this.indent * 2) + u);
    for (let u of n) this.content.push(u);
  }
  compile() {
    let r = Function, v = this?.args, $ = [...(this?.content ?? [""]).map((n) => `  ${n}`)];
    return new r(...v, $.join(`
`));
  }
};
var Su = { major: 4, minor: 2, patch: 1 };
var P = l("$ZodType", (r, v) => {
  var o;
  r ?? (r = {}), r._zod.def = v, r._zod.bag = r._zod.bag || {}, r._zod.version = Su;
  let $ = [...r._zod.def.checks ?? []];
  if (r._zod.traits.has("$ZodCheck")) $.unshift(r);
  for (let n of $) for (let u of n._zod.onattach) u(r);
  if ($.length === 0) (o = r._zod).deferred ?? (o.deferred = []), r._zod.deferred?.push(() => {
    r._zod.run = r._zod.parse;
  });
  else {
    let n = (i, g, I) => {
      let b = or(i), U;
      for (let w of g) {
        if (w._zod.def.when) {
          if (!w._zod.def.when(i)) continue;
        } else if (b) continue;
        let D = i.issues.length, j = w._zod.check(i);
        if (j instanceof Promise && I?.async === false) throw new C();
        if (U || j instanceof Promise) U = (U ?? Promise.resolve()).then(async () => {
          if (await j, i.issues.length === D) return;
          if (!b) b = or(i, D);
        });
        else {
          if (i.issues.length === D) continue;
          if (!b) b = or(i, D);
        }
      }
      if (U) return U.then(() => {
        return i;
      });
      return i;
    }, u = (i, g, I) => {
      if (or(i)) return i.aborted = true, i;
      let b = n(g, $, I);
      if (b instanceof Promise) {
        if (I.async === false) throw new C();
        return b.then((U) => r._zod.parse(U, I));
      }
      return r._zod.parse(b, I);
    };
    r._zod.run = (i, g) => {
      if (g.skipChecks) return r._zod.parse(i, g);
      if (g.direction === "backward") {
        let b = r._zod.parse({ value: i.value, issues: [] }, { ...g, skipChecks: true });
        if (b instanceof Promise) return b.then((U) => {
          return u(U, i, g);
        });
        return u(b, i, g);
      }
      let I = r._zod.parse(i, g);
      if (I instanceof Promise) {
        if (g.async === false) throw new C();
        return I.then((b) => n(b, $, g));
      }
      return n(I, $, g);
    };
  }
  r["~standard"] = { validate: (n) => {
    try {
      let u = Lo(r, n);
      return u.success ? { value: u.data } : { issues: u.error?.issues };
    } catch (u) {
      return Go(r, n).then((i) => i.success ? { value: i.data } : { issues: i.error?.issues });
    }
  }, vendor: "zod", version: 1 };
});
var Ur = l("$ZodString", (r, v) => {
  P.init(r, v), r._zod.pattern = [...r?._zod.bag?.patterns ?? []].pop() ?? ho(r._zod.bag), r._zod.parse = (o, $) => {
    if (v.coerce) try {
      o.value = String(o.value);
    } catch (n) {
    }
    if (typeof o.value === "string") return o;
    return o.issues.push({ expected: "string", code: "invalid_type", input: o.value, inst: r }), o;
  };
});
var L = l("$ZodStringFormat", (r, v) => {
  Er.init(r, v), Ur.init(r, v);
});
var Ju = l("$ZodGUID", (r, v) => {
  v.pattern ?? (v.pattern = Bo), L.init(r, v);
});
var Eu = l("$ZodUUID", (r, v) => {
  if (v.version) {
    let $ = { v1: 1, v2: 2, v3: 3, v4: 4, v5: 5, v6: 6, v7: 7, v8: 8 }[v.version];
    if ($ === void 0) throw Error(`Invalid UUID version: "${v.version}"`);
    v.pattern ?? (v.pattern = lr($));
  } else v.pattern ?? (v.pattern = lr());
  L.init(r, v);
});
var Lu = l("$ZodEmail", (r, v) => {
  v.pattern ?? (v.pattern = Ho), L.init(r, v);
});
var Gu = l("$ZodURL", (r, v) => {
  L.init(r, v), r._zod.check = (o) => {
    try {
      let $ = o.value.trim(), n = new URL($);
      if (v.hostname) {
        if (v.hostname.lastIndex = 0, !v.hostname.test(n.hostname)) o.issues.push({ code: "invalid_format", format: "url", note: "Invalid hostname", pattern: v.hostname.source, input: o.value, inst: r, continue: !v.abort });
      }
      if (v.protocol) {
        if (v.protocol.lastIndex = 0, !v.protocol.test(n.protocol.endsWith(":") ? n.protocol.slice(0, -1) : n.protocol)) o.issues.push({ code: "invalid_format", format: "url", note: "Invalid protocol", pattern: v.protocol.source, input: o.value, inst: r, continue: !v.abort });
      }
      if (v.normalize) o.value = n.href;
      else o.value = $;
      return;
    } catch ($) {
      o.issues.push({ code: "invalid_format", format: "url", input: o.value, inst: r, continue: !v.abort });
    }
  };
});
var Wu = l("$ZodEmoji", (r, v) => {
  v.pattern ?? (v.pattern = Mo()), L.init(r, v);
});
var Xu = l("$ZodNanoID", (r, v) => {
  v.pattern ?? (v.pattern = Qo), L.init(r, v);
});
var Ku = l("$ZodCUID", (r, v) => {
  v.pattern ?? (v.pattern = Wo), L.init(r, v);
});
var Vu = l("$ZodCUID2", (r, v) => {
  v.pattern ?? (v.pattern = Xo), L.init(r, v);
});
var Yu = l("$ZodULID", (r, v) => {
  v.pattern ?? (v.pattern = Ko), L.init(r, v);
});
var Qu = l("$ZodXID", (r, v) => {
  v.pattern ?? (v.pattern = Vo), L.init(r, v);
});
var qu = l("$ZodKSUID", (r, v) => {
  v.pattern ?? (v.pattern = Yo), L.init(r, v);
});
var Bu = l("$ZodISODateTime", (r, v) => {
  v.pattern ?? (v.pattern = fo(v)), L.init(r, v);
});
var Hu = l("$ZodISODate", (r, v) => {
  v.pattern ?? (v.pattern = Co), L.init(r, v);
});
var Mu = l("$ZodISOTime", (r, v) => {
  v.pattern ?? (v.pattern = xo(v)), L.init(r, v);
});
var Fu = l("$ZodISODuration", (r, v) => {
  v.pattern ?? (v.pattern = qo), L.init(r, v);
});
var Ru = l("$ZodIPv4", (r, v) => {
  v.pattern ?? (v.pattern = Fo), L.init(r, v), r._zod.bag.format = "ipv4";
});
var Tu = l("$ZodIPv6", (r, v) => {
  v.pattern ?? (v.pattern = Ro), L.init(r, v), r._zod.bag.format = "ipv6", r._zod.check = (o) => {
    try {
      new URL(`http://[${o.value}]`);
    } catch {
      o.issues.push({ code: "invalid_format", format: "ipv6", input: o.value, inst: r, continue: !v.abort });
    }
  };
});
var zu = l("$ZodMAC", (r, v) => {
  v.pattern ?? (v.pattern = To(v.delimiter)), L.init(r, v), r._zod.bag.format = "mac";
});
var Zu = l("$ZodCIDRv4", (r, v) => {
  v.pattern ?? (v.pattern = zo), L.init(r, v);
});
var eu = l("$ZodCIDRv6", (r, v) => {
  v.pattern ?? (v.pattern = Zo), L.init(r, v), r._zod.check = (o) => {
    let $ = o.value.split("/");
    try {
      if ($.length !== 2) throw Error();
      let [n, u] = $;
      if (!u) throw Error();
      let i = Number(u);
      if (`${i}` !== u) throw Error();
      if (i < 0 || i > 128) throw Error();
      new URL(`http://[${n}]`);
    } catch {
      o.issues.push({ code: "invalid_format", format: "cidrv6", input: o.value, inst: r, continue: !v.abort });
    }
  };
});
function mu(r) {
  if (r === "") return true;
  if (r.length % 4 !== 0) return false;
  try {
    return atob(r), true;
  } catch {
    return false;
  }
}
var Cu = l("$ZodBase64", (r, v) => {
  v.pattern ?? (v.pattern = eo), L.init(r, v), r._zod.bag.contentEncoding = "base64", r._zod.check = (o) => {
    if (mu(o.value)) return;
    o.issues.push({ code: "invalid_format", format: "base64", input: o.value, inst: r, continue: !v.abort });
  };
});
function Ft(r) {
  if (!Cn.test(r)) return false;
  let v = r.replace(/[-_]/g, ($) => $ === "-" ? "+" : "/"), o = v.padEnd(Math.ceil(v.length / 4) * 4, "=");
  return mu(o);
}
var xu = l("$ZodBase64URL", (r, v) => {
  v.pattern ?? (v.pattern = Cn), L.init(r, v), r._zod.bag.contentEncoding = "base64url", r._zod.check = (o) => {
    if (Ft(o.value)) return;
    o.issues.push({ code: "invalid_format", format: "base64url", input: o.value, inst: r, continue: !v.abort });
  };
});
var fu = l("$ZodE164", (r, v) => {
  v.pattern ?? (v.pattern = mo), L.init(r, v);
});
function Rt(r, v = null) {
  try {
    let o = r.split(".");
    if (o.length !== 3) return false;
    let [$] = o;
    if (!$) return false;
    let n = JSON.parse(atob($));
    if ("typ" in n && n?.typ !== "JWT") return false;
    if (!n.alg) return false;
    if (v && (!("alg" in n) || n.alg !== v)) return false;
    return true;
  } catch {
    return false;
  }
}
var hu = l("$ZodJWT", (r, v) => {
  L.init(r, v), r._zod.check = (o) => {
    if (Rt(o.value, v.alg)) return;
    o.issues.push({ code: "invalid_format", format: "jwt", input: o.value, inst: r, continue: !v.abort });
  };
});
var yu = l("$ZodCustomStringFormat", (r, v) => {
  L.init(r, v), r._zod.check = (o) => {
    if (v.fn(o.value)) return;
    o.issues.push({ code: "invalid_format", format: v.format, input: o.value, inst: r, continue: !v.abort });
  };
});
var rv = l("$ZodNumber", (r, v) => {
  P.init(r, v), r._zod.pattern = r._zod.bag.pattern ?? ao, r._zod.parse = (o, $) => {
    if (v.coerce) try {
      o.value = Number(o.value);
    } catch (i) {
    }
    let n = o.value;
    if (typeof n === "number" && !Number.isNaN(n) && Number.isFinite(n)) return o;
    let u = typeof n === "number" ? Number.isNaN(n) ? "NaN" : !Number.isFinite(n) ? "Infinity" : void 0 : void 0;
    return o.issues.push({ expected: "number", code: "invalid_type", input: n, inst: r, ...u ? { received: u } : {} }), o;
  };
});
var du = l("$ZodNumberFormat", (r, v) => {
  $u.init(r, v), rv.init(r, v);
});
var bn = l("$ZodBoolean", (r, v) => {
  P.init(r, v), r._zod.pattern = so, r._zod.parse = (o, $) => {
    if (v.coerce) try {
      o.value = Boolean(o.value);
    } catch (u) {
    }
    let n = o.value;
    if (typeof n === "boolean") return o;
    return o.issues.push({ expected: "boolean", code: "invalid_type", input: n, inst: r }), o;
  };
});
var nv = l("$ZodBigInt", (r, v) => {
  P.init(r, v), r._zod.pattern = yo, r._zod.parse = (o, $) => {
    if (v.coerce) try {
      o.value = BigInt(o.value);
    } catch (n) {
    }
    if (typeof o.value === "bigint") return o;
    return o.issues.push({ expected: "bigint", code: "invalid_type", input: o.value, inst: r }), o;
  };
});
var pu = l("$ZodBigIntFormat", (r, v) => {
  iu.init(r, v), nv.init(r, v);
});
var au = l("$ZodSymbol", (r, v) => {
  P.init(r, v), r._zod.parse = (o, $) => {
    let n = o.value;
    if (typeof n === "symbol") return o;
    return o.issues.push({ expected: "symbol", code: "invalid_type", input: n, inst: r }), o;
  };
});
var su = l("$ZodUndefined", (r, v) => {
  P.init(r, v), r._zod.pattern = nu, r._zod.values = /* @__PURE__ */ new Set([void 0]), r._zod.optin = "optional", r._zod.optout = "optional", r._zod.parse = (o, $) => {
    let n = o.value;
    if (typeof n > "u") return o;
    return o.issues.push({ expected: "undefined", code: "invalid_type", input: n, inst: r }), o;
  };
});
var r$ = l("$ZodNull", (r, v) => {
  P.init(r, v), r._zod.pattern = ru, r._zod.values = /* @__PURE__ */ new Set([null]), r._zod.parse = (o, $) => {
    let n = o.value;
    if (n === null) return o;
    return o.issues.push({ expected: "null", code: "invalid_type", input: n, inst: r }), o;
  };
});
var n$ = l("$ZodAny", (r, v) => {
  P.init(r, v), r._zod.parse = (o) => o;
});
var v$ = l("$ZodUnknown", (r, v) => {
  P.init(r, v), r._zod.parse = (o) => o;
});
var o$ = l("$ZodNever", (r, v) => {
  P.init(r, v), r._zod.parse = (o, $) => {
    return o.issues.push({ expected: "never", code: "invalid_type", input: o.value, inst: r }), o;
  };
});
var u$ = l("$ZodVoid", (r, v) => {
  P.init(r, v), r._zod.parse = (o, $) => {
    let n = o.value;
    if (typeof n > "u") return o;
    return o.issues.push({ expected: "void", code: "invalid_type", input: n, inst: r }), o;
  };
});
var $$ = l("$ZodDate", (r, v) => {
  P.init(r, v), r._zod.parse = (o, $) => {
    if (v.coerce) try {
      o.value = new Date(o.value);
    } catch (g) {
    }
    let n = o.value, u = n instanceof Date;
    if (u && !Number.isNaN(n.getTime())) return o;
    return o.issues.push({ expected: "date", code: "invalid_type", input: n, ...u ? { received: "Invalid Date" } : {}, inst: r }), o;
  };
});
function Gt(r, v, o) {
  if (r.issues.length) v.issues.push(...F(o, r.issues));
  v.value[o] = r.value;
}
var i$ = l("$ZodArray", (r, v) => {
  P.init(r, v), r._zod.parse = (o, $) => {
    let n = o.value;
    if (!Array.isArray(n)) return o.issues.push({ expected: "array", code: "invalid_type", input: n, inst: r }), o;
    o.value = Array(n.length);
    let u = [];
    for (let i = 0; i < n.length; i++) {
      let g = n[i], I = v.element._zod.run({ value: g, issues: [] }, $);
      if (I instanceof Promise) u.push(I.then((b) => Gt(b, o, i)));
      else Gt(I, o, i);
    }
    if (u.length) return Promise.all(u).then(() => o);
    return o;
  };
});
function sn(r, v, o, $) {
  if (r.issues.length) v.issues.push(...F(o, r.issues));
  if (r.value === void 0) {
    if (o in $) v.value[o] = void 0;
  } else v.value[o] = r.value;
}
function Tt(r) {
  let v = Object.keys(r.shape);
  for (let $ of v) if (!r.shape?.[$]?._zod?.traits?.has("$ZodType")) throw Error(`Invalid element at key "${$}": expected a Zod schema`);
  let o = Po(r.shape);
  return { ...r, keys: v, keySet: new Set(v), numKeys: v.length, optionalKeys: new Set(o) };
}
function zt(r, v, o, $, n, u) {
  let i = [], g = n.keySet, I = n.catchall._zod, b = I.def.type;
  for (let U in v) {
    if (g.has(U)) continue;
    if (b === "never") {
      i.push(U);
      continue;
    }
    let w = I.run({ value: v[U], issues: [] }, $);
    if (w instanceof Promise) r.push(w.then((D) => sn(D, o, U, v)));
    else sn(w, o, U, v);
  }
  if (i.length) o.issues.push({ code: "unrecognized_keys", keys: i, input: v, inst: u });
  if (!r.length) return o;
  return Promise.all(r).then(() => {
    return o;
  });
}
var Zt = l("$ZodObject", (r, v) => {
  if (P.init(r, v), !Object.getOwnPropertyDescriptor(v, "shape")?.get) {
    let g = v.shape;
    Object.defineProperty(v, "shape", { get: () => {
      let I = { ...g };
      return Object.defineProperty(v, "shape", { value: I }), I;
    } });
  }
  let $ = Dr(() => Tt(v));
  A(r._zod, "propValues", () => {
    let g = v.shape, I = {};
    for (let b in g) {
      let U = g[b]._zod;
      if (U.values) {
        I[b] ?? (I[b] = /* @__PURE__ */ new Set());
        for (let w of U.values) I[b].add(w);
      }
    }
    return I;
  });
  let n = Ir, u = v.catchall, i;
  r._zod.parse = (g, I) => {
    i ?? (i = $.value);
    let b = g.value;
    if (!n(b)) return g.issues.push({ expected: "object", code: "invalid_type", input: b, inst: r }), g;
    g.value = {};
    let U = [], w = i.shape;
    for (let D of i.keys) {
      let J = w[D]._zod.run({ value: b[D], issues: [] }, I);
      if (J instanceof Promise) U.push(J.then((T) => sn(T, g, D, b)));
      else sn(J, g, D, b);
    }
    if (!u) return U.length ? Promise.all(U).then(() => g) : g;
    return zt(U, b, g, I, $.value, r);
  };
});
var g$ = l("$ZodObjectJIT", (r, v) => {
  Zt.init(r, v);
  let o = r._zod.parse, $ = Dr(() => Tt(v)), n = (D) => {
    let j = new hn(["shape", "payload", "ctx"]), J = $.value, T = (y) => {
      let m = Qn(y);
      return `shape[${m}]._zod.run({ value: input[${m}], issues: [] }, ctx)`;
    };
    j.write("const input = payload.value;");
    let Vn = /* @__PURE__ */ Object.create(null), j4 = 0;
    for (let y of J.keys) Vn[y] = `key_${j4++}`;
    j.write("const newResult = {};");
    for (let y of J.keys) {
      let m = Vn[y], hr = Qn(y);
      j.write(`const ${m} = ${T(y)};`), j.write(`
        if (${m}.issues.length) {
          payload.issues = payload.issues.concat(${m}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${hr}, ...iss.path] : [${hr}]
          })));
        }
        
        
        if (${m}.value === undefined) {
          if (${hr} in input) {
            newResult[${hr}] = undefined;
          }
        } else {
          newResult[${hr}] = ${m}.value;
        }
        
      `);
    }
    j.write("payload.value = newResult;"), j.write("return payload;");
    let P4 = j.compile();
    return (y, m) => P4(D, y, m);
  }, u, i = Ir, g = !yr.jitless, b = g && co.value, U = v.catchall, w;
  r._zod.parse = (D, j) => {
    w ?? (w = $.value);
    let J = D.value;
    if (!i(J)) return D.issues.push({ expected: "object", code: "invalid_type", input: J, inst: r }), D;
    if (g && b && j?.async === false && j.jitless !== true) {
      if (!u) u = n(v.shape);
      if (D = u(D, j), !U) return D;
      return zt([], J, D, j, w, r);
    }
    return o(D, j);
  };
});
function Wt(r, v, o, $) {
  for (let u of r) if (u.issues.length === 0) return v.value = u.value, v;
  let n = r.filter((u) => !or(u));
  if (n.length === 1) return v.value = n[0].value, n[0];
  return v.issues.push({ code: "invalid_union", input: v.value, inst: o, errors: r.map((u) => u.issues.map((i) => B(i, $, X()))) }), v;
}
var tn = l("$ZodUnion", (r, v) => {
  P.init(r, v), A(r._zod, "optin", () => v.options.some((n) => n._zod.optin === "optional") ? "optional" : void 0), A(r._zod, "optout", () => v.options.some((n) => n._zod.optout === "optional") ? "optional" : void 0), A(r._zod, "values", () => {
    if (v.options.every((n) => n._zod.values)) return new Set(v.options.flatMap((n) => Array.from(n._zod.values)));
    return;
  }), A(r._zod, "pattern", () => {
    if (v.options.every((n) => n._zod.pattern)) {
      let n = v.options.map((u) => u._zod.pattern);
      return new RegExp(`^(${n.map((u) => ar(u.source)).join("|")})$`);
    }
    return;
  });
  let o = v.options.length === 1, $ = v.options[0]._zod.run;
  r._zod.parse = (n, u) => {
    if (o) return $(n, u);
    let i = false, g = [];
    for (let I of v.options) {
      let b = I._zod.run({ value: n.value, issues: [] }, u);
      if (b instanceof Promise) g.push(b), i = true;
      else {
        if (b.issues.length === 0) return b;
        g.push(b);
      }
    }
    if (!i) return Wt(g, n, r, u);
    return Promise.all(g).then((I) => {
      return Wt(I, n, r, u);
    });
  };
});
function Xt(r, v, o, $) {
  let n = r.filter((u) => u.issues.length === 0);
  if (n.length === 1) return v.value = n[0].value, v;
  if (n.length === 0) v.issues.push({ code: "invalid_union", input: v.value, inst: o, errors: r.map((u) => u.issues.map((i) => B(i, $, X()))) });
  else v.issues.push({ code: "invalid_union", input: v.value, inst: o, errors: [], inclusive: false });
  return v;
}
var b$ = l("$ZodXor", (r, v) => {
  tn.init(r, v), v.inclusive = false;
  let o = v.options.length === 1, $ = v.options[0]._zod.run;
  r._zod.parse = (n, u) => {
    if (o) return $(n, u);
    let i = false, g = [];
    for (let I of v.options) {
      let b = I._zod.run({ value: n.value, issues: [] }, u);
      if (b instanceof Promise) g.push(b), i = true;
      else g.push(b);
    }
    if (!i) return Xt(g, n, r, u);
    return Promise.all(g).then((I) => {
      return Xt(I, n, r, u);
    });
  };
});
var t$ = l("$ZodDiscriminatedUnion", (r, v) => {
  v.inclusive = false, tn.init(r, v);
  let o = r._zod.parse;
  A(r._zod, "propValues", () => {
    let n = {};
    for (let u of v.options) {
      let i = u._zod.propValues;
      if (!i || Object.keys(i).length === 0) throw Error(`Invalid discriminated union option at index "${v.options.indexOf(u)}"`);
      for (let [g, I] of Object.entries(i)) {
        if (!n[g]) n[g] = /* @__PURE__ */ new Set();
        for (let b of I) n[g].add(b);
      }
    }
    return n;
  });
  let $ = Dr(() => {
    let n = v.options, u = /* @__PURE__ */ new Map();
    for (let i of n) {
      let g = i._zod.propValues?.[v.discriminator];
      if (!g || g.size === 0) throw Error(`Invalid discriminated union option at index "${v.options.indexOf(i)}"`);
      for (let I of g) {
        if (u.has(I)) throw Error(`Duplicate discriminator value "${String(I)}"`);
        u.set(I, i);
      }
    }
    return u;
  });
  r._zod.parse = (n, u) => {
    let i = n.value;
    if (!Ir(i)) return n.issues.push({ code: "invalid_type", expected: "object", input: i, inst: r }), n;
    let g = $.value.get(i?.[v.discriminator]);
    if (g) return g._zod.run(n, u);
    if (v.unionFallback) return o(n, u);
    return n.issues.push({ code: "invalid_union", errors: [], note: "No matching discriminator", discriminator: v.discriminator, input: i, path: [v.discriminator], inst: r }), n;
  };
});
var I$ = l("$ZodIntersection", (r, v) => {
  P.init(r, v), r._zod.parse = (o, $) => {
    let n = o.value, u = v.left._zod.run({ value: n, issues: [] }, $), i = v.right._zod.run({ value: n, issues: [] }, $);
    if (u instanceof Promise || i instanceof Promise) return Promise.all([u, i]).then(([I, b]) => {
      return Kt(o, I, b);
    });
    return Kt(o, u, i);
  };
});
function Au(r, v) {
  if (r === v) return { valid: true, data: r };
  if (r instanceof Date && v instanceof Date && +r === +v) return { valid: true, data: r };
  if (vr(r) && vr(v)) {
    let o = Object.keys(v), $ = Object.keys(r).filter((u) => o.indexOf(u) !== -1), n = { ...r, ...v };
    for (let u of $) {
      let i = Au(r[u], v[u]);
      if (!i.valid) return { valid: false, mergeErrorPath: [u, ...i.mergeErrorPath] };
      n[u] = i.data;
    }
    return { valid: true, data: n };
  }
  if (Array.isArray(r) && Array.isArray(v)) {
    if (r.length !== v.length) return { valid: false, mergeErrorPath: [] };
    let o = [];
    for (let $ = 0; $ < r.length; $++) {
      let n = r[$], u = v[$], i = Au(n, u);
      if (!i.valid) return { valid: false, mergeErrorPath: [$, ...i.mergeErrorPath] };
      o.push(i.data);
    }
    return { valid: true, data: o };
  }
  return { valid: false, mergeErrorPath: [] };
}
function Kt(r, v, o) {
  if (v.issues.length) r.issues.push(...v.issues);
  if (o.issues.length) r.issues.push(...o.issues);
  if (or(r)) return r;
  let $ = Au(v.value, o.value);
  if (!$.valid) throw Error(`Unmergable intersection. Error path: ${JSON.stringify($.mergeErrorPath)}`);
  return r.value = $.data, r;
}
var vv = l("$ZodTuple", (r, v) => {
  P.init(r, v);
  let o = v.items;
  r._zod.parse = ($, n) => {
    let u = $.value;
    if (!Array.isArray(u)) return $.issues.push({ input: u, inst: r, expected: "tuple", code: "invalid_type" }), $;
    $.value = [];
    let i = [], g = [...o].reverse().findIndex((U) => U._zod.optin !== "optional"), I = g === -1 ? 0 : o.length - g;
    if (!v.rest) {
      let U = u.length > o.length, w = u.length < I - 1;
      if (U || w) return $.issues.push({ ...U ? { code: "too_big", maximum: o.length } : { code: "too_small", minimum: o.length }, input: u, inst: r, origin: "array" }), $;
    }
    let b = -1;
    for (let U of o) {
      if (b++, b >= u.length) {
        if (b >= I) continue;
      }
      let w = U._zod.run({ value: u[b], issues: [] }, n);
      if (w instanceof Promise) i.push(w.then((D) => yn(D, $, b)));
      else yn(w, $, b);
    }
    if (v.rest) {
      let U = u.slice(o.length);
      for (let w of U) {
        b++;
        let D = v.rest._zod.run({ value: w, issues: [] }, n);
        if (D instanceof Promise) i.push(D.then((j) => yn(j, $, b)));
        else yn(D, $, b);
      }
    }
    if (i.length) return Promise.all(i).then(() => $);
    return $;
  };
});
function yn(r, v, o) {
  if (r.issues.length) v.issues.push(...F(o, r.issues));
  v.value[o] = r.value;
}
var l$ = l("$ZodRecord", (r, v) => {
  P.init(r, v), r._zod.parse = (o, $) => {
    let n = o.value;
    if (!vr(n)) return o.issues.push({ expected: "record", code: "invalid_type", input: n, inst: r }), o;
    let u = [], i = v.keyType._zod.values;
    if (i) {
      o.value = {};
      let g = /* @__PURE__ */ new Set();
      for (let b of i) if (typeof b === "string" || typeof b === "number" || typeof b === "symbol") {
        g.add(typeof b === "number" ? b.toString() : b);
        let U = v.valueType._zod.run({ value: n[b], issues: [] }, $);
        if (U instanceof Promise) u.push(U.then((w) => {
          if (w.issues.length) o.issues.push(...F(b, w.issues));
          o.value[b] = w.value;
        }));
        else {
          if (U.issues.length) o.issues.push(...F(b, U.issues));
          o.value[b] = U.value;
        }
      }
      let I;
      for (let b in n) if (!g.has(b)) I = I ?? [], I.push(b);
      if (I && I.length > 0) o.issues.push({ code: "unrecognized_keys", input: n, inst: r, keys: I });
    } else {
      o.value = {};
      for (let g of Reflect.ownKeys(n)) {
        if (g === "__proto__") continue;
        let I = v.keyType._zod.run({ value: g, issues: [] }, $);
        if (I instanceof Promise) throw Error("Async schemas not supported in object keys currently");
        if (I.issues.length) {
          if (v.mode === "loose") o.value[g] = n[g];
          else o.issues.push({ code: "invalid_key", origin: "record", issues: I.issues.map((U) => B(U, $, X())), input: g, path: [g], inst: r });
          continue;
        }
        let b = v.valueType._zod.run({ value: n[g], issues: [] }, $);
        if (b instanceof Promise) u.push(b.then((U) => {
          if (U.issues.length) o.issues.push(...F(g, U.issues));
          o.value[I.value] = U.value;
        }));
        else {
          if (b.issues.length) o.issues.push(...F(g, b.issues));
          o.value[I.value] = b.value;
        }
      }
    }
    if (u.length) return Promise.all(u).then(() => o);
    return o;
  };
});
var U$ = l("$ZodMap", (r, v) => {
  P.init(r, v), r._zod.parse = (o, $) => {
    let n = o.value;
    if (!(n instanceof Map)) return o.issues.push({ expected: "map", code: "invalid_type", input: n, inst: r }), o;
    let u = [];
    o.value = /* @__PURE__ */ new Map();
    for (let [i, g] of n) {
      let I = v.keyType._zod.run({ value: i, issues: [] }, $), b = v.valueType._zod.run({ value: g, issues: [] }, $);
      if (I instanceof Promise || b instanceof Promise) u.push(Promise.all([I, b]).then(([U, w]) => {
        Vt(U, w, o, i, n, r, $);
      }));
      else Vt(I, b, o, i, n, r, $);
    }
    if (u.length) return Promise.all(u).then(() => o);
    return o;
  };
});
function Vt(r, v, o, $, n, u, i) {
  if (r.issues.length) if (sr.has(typeof $)) o.issues.push(...F($, r.issues));
  else o.issues.push({ code: "invalid_key", origin: "map", input: n, inst: u, issues: r.issues.map((g) => B(g, i, X())) });
  if (v.issues.length) if (sr.has(typeof $)) o.issues.push(...F($, v.issues));
  else o.issues.push({ origin: "map", code: "invalid_element", input: n, inst: u, key: $, issues: v.issues.map((g) => B(g, i, X())) });
  o.value.set(r.value, v.value);
}
var _$ = l("$ZodSet", (r, v) => {
  P.init(r, v), r._zod.parse = (o, $) => {
    let n = o.value;
    if (!(n instanceof Set)) return o.issues.push({ input: n, inst: r, expected: "set", code: "invalid_type" }), o;
    let u = [];
    o.value = /* @__PURE__ */ new Set();
    for (let i of n) {
      let g = v.valueType._zod.run({ value: i, issues: [] }, $);
      if (g instanceof Promise) u.push(g.then((I) => Yt(I, o)));
      else Yt(g, o);
    }
    if (u.length) return Promise.all(u).then(() => o);
    return o;
  };
});
function Yt(r, v) {
  if (r.issues.length) v.issues.push(...r.issues);
  v.value.add(r.value);
}
var w$ = l("$ZodEnum", (r, v) => {
  P.init(r, v);
  let o = pr(v.entries), $ = new Set(o);
  r._zod.values = $, r._zod.pattern = new RegExp(`^(${o.filter((n) => sr.has(typeof n)).map((n) => typeof n === "string" ? z2(n) : n.toString()).join("|")})$`), r._zod.parse = (n, u) => {
    let i = n.value;
    if ($.has(i)) return n;
    return n.issues.push({ code: "invalid_value", values: o, input: i, inst: r }), n;
  };
});
var N$ = l("$ZodLiteral", (r, v) => {
  if (P.init(r, v), v.values.length === 0) throw Error("Cannot create literal schema with no valid values");
  let o = new Set(v.values);
  r._zod.values = o, r._zod.pattern = new RegExp(`^(${v.values.map(($) => typeof $ === "string" ? z2($) : $ ? z2($.toString()) : String($)).join("|")})$`), r._zod.parse = ($, n) => {
    let u = $.value;
    if (o.has(u)) return $;
    return $.issues.push({ code: "invalid_value", values: v.values, input: u, inst: r }), $;
  };
});
var k$ = l("$ZodFile", (r, v) => {
  P.init(r, v), r._zod.parse = (o, $) => {
    let n = o.value;
    if (n instanceof File) return o;
    return o.issues.push({ expected: "file", code: "invalid_type", input: n, inst: r }), o;
  };
});
var O$ = l("$ZodTransform", (r, v) => {
  P.init(r, v), r._zod.parse = (o, $) => {
    if ($.direction === "backward") throw new tr(r.constructor.name);
    let n = v.transform(o.value, o);
    if ($.async) return (n instanceof Promise ? n : Promise.resolve(n)).then((i) => {
      return o.value = i, o;
    });
    if (n instanceof Promise) throw new C();
    return o.value = n, o;
  };
});
function Qt(r, v) {
  if (r.issues.length && v === void 0) return { issues: [], value: void 0 };
  return r;
}
var c$ = l("$ZodOptional", (r, v) => {
  P.init(r, v), r._zod.optin = "optional", r._zod.optout = "optional", A(r._zod, "values", () => {
    return v.innerType._zod.values ? /* @__PURE__ */ new Set([...v.innerType._zod.values, void 0]) : void 0;
  }), A(r._zod, "pattern", () => {
    let o = v.innerType._zod.pattern;
    return o ? new RegExp(`^(${ar(o.source)})?$`) : void 0;
  }), r._zod.parse = (o, $) => {
    if (v.innerType._zod.optin === "optional") {
      let n = v.innerType._zod.run(o, $);
      if (n instanceof Promise) return n.then((u) => Qt(u, o.value));
      return Qt(n, o.value);
    }
    if (o.value === void 0) return o;
    return v.innerType._zod.run(o, $);
  };
});
var D$ = l("$ZodNullable", (r, v) => {
  P.init(r, v), A(r._zod, "optin", () => v.innerType._zod.optin), A(r._zod, "optout", () => v.innerType._zod.optout), A(r._zod, "pattern", () => {
    let o = v.innerType._zod.pattern;
    return o ? new RegExp(`^(${ar(o.source)}|null)$`) : void 0;
  }), A(r._zod, "values", () => {
    return v.innerType._zod.values ? /* @__PURE__ */ new Set([...v.innerType._zod.values, null]) : void 0;
  }), r._zod.parse = (o, $) => {
    if (o.value === null) return o;
    return v.innerType._zod.run(o, $);
  };
});
var j$ = l("$ZodDefault", (r, v) => {
  P.init(r, v), r._zod.optin = "optional", A(r._zod, "values", () => v.innerType._zod.values), r._zod.parse = (o, $) => {
    if ($.direction === "backward") return v.innerType._zod.run(o, $);
    if (o.value === void 0) return o.value = v.defaultValue, o;
    let n = v.innerType._zod.run(o, $);
    if (n instanceof Promise) return n.then((u) => qt(u, v));
    return qt(n, v);
  };
});
function qt(r, v) {
  if (r.value === void 0) r.value = v.defaultValue;
  return r;
}
var P$ = l("$ZodPrefault", (r, v) => {
  P.init(r, v), r._zod.optin = "optional", A(r._zod, "values", () => v.innerType._zod.values), r._zod.parse = (o, $) => {
    if ($.direction === "backward") return v.innerType._zod.run(o, $);
    if (o.value === void 0) o.value = v.defaultValue;
    return v.innerType._zod.run(o, $);
  };
});
var S$ = l("$ZodNonOptional", (r, v) => {
  P.init(r, v), A(r._zod, "values", () => {
    let o = v.innerType._zod.values;
    return o ? new Set([...o].filter(($) => $ !== void 0)) : void 0;
  }), r._zod.parse = (o, $) => {
    let n = v.innerType._zod.run(o, $);
    if (n instanceof Promise) return n.then((u) => Bt(u, r));
    return Bt(n, r);
  };
});
function Bt(r, v) {
  if (!r.issues.length && r.value === void 0) r.issues.push({ code: "invalid_type", expected: "nonoptional", input: r.value, inst: v });
  return r;
}
var A$ = l("$ZodSuccess", (r, v) => {
  P.init(r, v), r._zod.parse = (o, $) => {
    if ($.direction === "backward") throw new tr("ZodSuccess");
    let n = v.innerType._zod.run(o, $);
    if (n instanceof Promise) return n.then((u) => {
      return o.value = u.issues.length === 0, o;
    });
    return o.value = n.issues.length === 0, o;
  };
});
var J$ = l("$ZodCatch", (r, v) => {
  P.init(r, v), A(r._zod, "optin", () => v.innerType._zod.optin), A(r._zod, "optout", () => v.innerType._zod.optout), A(r._zod, "values", () => v.innerType._zod.values), r._zod.parse = (o, $) => {
    if ($.direction === "backward") return v.innerType._zod.run(o, $);
    let n = v.innerType._zod.run(o, $);
    if (n instanceof Promise) return n.then((u) => {
      if (o.value = u.value, u.issues.length) o.value = v.catchValue({ ...o, error: { issues: u.issues.map((i) => B(i, $, X())) }, input: o.value }), o.issues = [];
      return o;
    });
    if (o.value = n.value, n.issues.length) o.value = v.catchValue({ ...o, error: { issues: n.issues.map((u) => B(u, $, X())) }, input: o.value }), o.issues = [];
    return o;
  };
});
var E$ = l("$ZodNaN", (r, v) => {
  P.init(r, v), r._zod.parse = (o, $) => {
    if (typeof o.value !== "number" || !Number.isNaN(o.value)) return o.issues.push({ input: o.value, inst: r, expected: "nan", code: "invalid_type" }), o;
    return o;
  };
});
var L$ = l("$ZodPipe", (r, v) => {
  P.init(r, v), A(r._zod, "values", () => v.in._zod.values), A(r._zod, "optin", () => v.in._zod.optin), A(r._zod, "optout", () => v.out._zod.optout), A(r._zod, "propValues", () => v.in._zod.propValues), r._zod.parse = (o, $) => {
    if ($.direction === "backward") {
      let u = v.out._zod.run(o, $);
      if (u instanceof Promise) return u.then((i) => dn(i, v.in, $));
      return dn(u, v.in, $);
    }
    let n = v.in._zod.run(o, $);
    if (n instanceof Promise) return n.then((u) => dn(u, v.out, $));
    return dn(n, v.out, $);
  };
});
function dn(r, v, o) {
  if (r.issues.length) return r.aborted = true, r;
  return v._zod.run({ value: r.value, issues: r.issues }, o);
}
var In = l("$ZodCodec", (r, v) => {
  P.init(r, v), A(r._zod, "values", () => v.in._zod.values), A(r._zod, "optin", () => v.in._zod.optin), A(r._zod, "optout", () => v.out._zod.optout), A(r._zod, "propValues", () => v.in._zod.propValues), r._zod.parse = (o, $) => {
    if (($.direction || "forward") === "forward") {
      let u = v.in._zod.run(o, $);
      if (u instanceof Promise) return u.then((i) => pn(i, v, $));
      return pn(u, v, $);
    } else {
      let u = v.out._zod.run(o, $);
      if (u instanceof Promise) return u.then((i) => pn(i, v, $));
      return pn(u, v, $);
    }
  };
});
function pn(r, v, o) {
  if (r.issues.length) return r.aborted = true, r;
  if ((o.direction || "forward") === "forward") {
    let n = v.transform(r.value, r);
    if (n instanceof Promise) return n.then((u) => an(r, u, v.out, o));
    return an(r, n, v.out, o);
  } else {
    let n = v.reverseTransform(r.value, r);
    if (n instanceof Promise) return n.then((u) => an(r, u, v.in, o));
    return an(r, n, v.in, o);
  }
}
function an(r, v, o, $) {
  if (r.issues.length) return r.aborted = true, r;
  return o._zod.run({ value: v, issues: r.issues }, $);
}
var G$ = l("$ZodReadonly", (r, v) => {
  P.init(r, v), A(r._zod, "propValues", () => v.innerType._zod.propValues), A(r._zod, "values", () => v.innerType._zod.values), A(r._zod, "optin", () => v.innerType?._zod?.optin), A(r._zod, "optout", () => v.innerType?._zod?.optout), r._zod.parse = (o, $) => {
    if ($.direction === "backward") return v.innerType._zod.run(o, $);
    let n = v.innerType._zod.run(o, $);
    if (n instanceof Promise) return n.then(Ht);
    return Ht(n);
  };
});
function Ht(r) {
  return r.value = Object.freeze(r.value), r;
}
var W$ = l("$ZodTemplateLiteral", (r, v) => {
  P.init(r, v);
  let o = [];
  for (let $ of v.parts) if (typeof $ === "object" && $ !== null) {
    if (!$._zod.pattern) throw Error(`Invalid template literal part, no pattern found: ${[...$._zod.traits].shift()}`);
    let n = $._zod.pattern instanceof RegExp ? $._zod.pattern.source : $._zod.pattern;
    if (!n) throw Error(`Invalid template literal part: ${$._zod.traits}`);
    let u = n.startsWith("^") ? 1 : 0, i = n.endsWith("$") ? n.length - 1 : n.length;
    o.push(n.slice(u, i));
  } else if ($ === null || jo.has(typeof $)) o.push(z2(`${$}`));
  else throw Error(`Invalid template literal part: ${$}`);
  r._zod.pattern = new RegExp(`^${o.join("")}$`), r._zod.parse = ($, n) => {
    if (typeof $.value !== "string") return $.issues.push({ input: $.value, inst: r, expected: "template_literal", code: "invalid_type" }), $;
    if (r._zod.pattern.lastIndex = 0, !r._zod.pattern.test($.value)) return $.issues.push({ input: $.value, inst: r, code: "invalid_format", format: v.format ?? "template_literal", pattern: r._zod.pattern.source }), $;
    return $;
  };
});
var X$ = l("$ZodFunction", (r, v) => {
  return P.init(r, v), r._def = v, r._zod.def = v, r.implement = (o) => {
    if (typeof o !== "function") throw Error("implement() must be called with a function");
    return function(...$) {
      let n = r._def.input ? Bn(r._def.input, $) : $, u = Reflect.apply(o, this, n);
      if (r._def.output) return Bn(r._def.output, u);
      return u;
    };
  }, r.implementAsync = (o) => {
    if (typeof o !== "function") throw Error("implementAsync() must be called with a function");
    return async function(...$) {
      let n = r._def.input ? await Hn(r._def.input, $) : $, u = await Reflect.apply(o, this, n);
      if (r._def.output) return await Hn(r._def.output, u);
      return u;
    };
  }, r._zod.parse = (o, $) => {
    if (typeof o.value !== "function") return o.issues.push({ code: "invalid_type", expected: "function", input: o.value, inst: r }), o;
    if (r._def.output && r._def.output._zod.def.type === "promise") o.value = r.implementAsync(o.value);
    else o.value = r.implement(o.value);
    return o;
  }, r.input = (...o) => {
    let $ = r.constructor;
    if (Array.isArray(o[0])) return new $({ type: "function", input: new vv({ type: "tuple", items: o[0], rest: o[1] }), output: r._def.output });
    return new $({ type: "function", input: o[0], output: r._def.output });
  }, r.output = (o) => {
    return new r.constructor({ type: "function", input: r._def.input, output: o });
  }, r;
});
var K$ = l("$ZodPromise", (r, v) => {
  P.init(r, v), r._zod.parse = (o, $) => {
    return Promise.resolve(o.value).then((n) => v.innerType._zod.run({ value: n, issues: [] }, $));
  };
});
var V$ = l("$ZodLazy", (r, v) => {
  P.init(r, v), A(r._zod, "innerType", () => v.getter()), A(r._zod, "pattern", () => r._zod.innerType?._zod?.pattern), A(r._zod, "propValues", () => r._zod.innerType?._zod?.propValues), A(r._zod, "optin", () => r._zod.innerType?._zod?.optin ?? void 0), A(r._zod, "optout", () => r._zod.innerType?._zod?.optout ?? void 0), r._zod.parse = (o, $) => {
    return r._zod.innerType._zod.run(o, $);
  };
});
var Y$ = l("$ZodCustom", (r, v) => {
  W.init(r, v), P.init(r, v), r._zod.parse = (o, $) => {
    return o;
  }, r._zod.check = (o) => {
    let $ = o.value, n = v.fn($);
    if (n instanceof Promise) return n.then((u) => Mt(u, o, $, r));
    Mt(n, o, $, r);
    return;
  };
});
function Mt(r, v, o, $) {
  if (!r) {
    let n = { code: "custom", input: o, inst: $, path: [...$._zod.def.path ?? []], continue: !$._zod.def.abort };
    if ($._zod.def.params) n.params = $._zod.def.params;
    v.issues.push(jr(n));
  }
}
var kn = {};
d(kn, { zhTW: () => Pi, zhCN: () => ji, yo: () => Si, vi: () => Di, ur: () => ci, uk: () => Nn, ua: () => Oi, tr: () => ki, th: () => Ni, ta: () => wi, sv: () => _i, sl: () => Ui, ru: () => li, pt: () => Ii, ps: () => bi, pl: () => ti, ota: () => gi, no: () => ii, nl: () => $i, ms: () => ui, mk: () => oi, lt: () => vi, ko: () => ni, km: () => Un, kh: () => ri, ka: () => s$, ja: () => a$, it: () => p$, is: () => d$, id: () => y$, hu: () => h$, he: () => f$, frCA: () => x$, fr: () => C$, fi: () => m$, fa: () => e$, es: () => Z$, eo: () => z$, en: () => ln, de: () => T$, da: () => R$, cs: () => F$, ca: () => M$, bg: () => H$, be: () => B$, az: () => q$, ar: () => Q$ });
var Y6 = () => {
  let r = { string: { unit: "\u062D\u0631\u0641", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" }, file: { unit: "\u0628\u0627\u064A\u062A", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" }, array: { unit: "\u0639\u0646\u0635\u0631", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" }, set: { unit: "\u0639\u0646\u0635\u0631", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "number";
      case "object": {
        if (Array.isArray(n)) return "array";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u0645\u062F\u062E\u0644", email: "\u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A", url: "\u0631\u0627\u0628\u0637", emoji: "\u0625\u064A\u0645\u0648\u062C\u064A", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "\u062A\u0627\u0631\u064A\u062E \u0648\u0648\u0642\u062A \u0628\u0645\u0639\u064A\u0627\u0631 ISO", date: "\u062A\u0627\u0631\u064A\u062E \u0628\u0645\u0639\u064A\u0627\u0631 ISO", time: "\u0648\u0642\u062A \u0628\u0645\u0639\u064A\u0627\u0631 ISO", duration: "\u0645\u062F\u0629 \u0628\u0645\u0639\u064A\u0627\u0631 ISO", ipv4: "\u0639\u0646\u0648\u0627\u0646 IPv4", ipv6: "\u0639\u0646\u0648\u0627\u0646 IPv6", cidrv4: "\u0645\u062F\u0649 \u0639\u0646\u0627\u0648\u064A\u0646 \u0628\u0635\u064A\u063A\u0629 IPv4", cidrv6: "\u0645\u062F\u0649 \u0639\u0646\u0627\u0648\u064A\u0646 \u0628\u0635\u064A\u063A\u0629 IPv6", base64: "\u0646\u064E\u0635 \u0628\u062A\u0631\u0645\u064A\u0632 base64-encoded", base64url: "\u0646\u064E\u0635 \u0628\u062A\u0631\u0645\u064A\u0632 base64url-encoded", json_string: "\u0646\u064E\u0635 \u0639\u0644\u0649 \u0647\u064A\u0626\u0629 JSON", e164: "\u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0628\u0645\u0639\u064A\u0627\u0631 E.164", jwt: "JWT", template_literal: "\u0645\u062F\u062E\u0644" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 ${n.expected}\u060C \u0648\u0644\u0643\u0646 \u062A\u0645 \u0625\u062F\u062E\u0627\u0644 ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 ${N(n.values[0])}`;
        return `\u0627\u062E\u062A\u064A\u0627\u0631 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062A\u0648\u0642\u0639 \u0627\u0646\u062A\u0642\u0627\u0621 \u0623\u062D\u062F \u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A: ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return ` \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0623\u0646 \u062A\u0643\u0648\u0646 ${n.origin ?? "\u0627\u0644\u0642\u064A\u0645\u0629"} ${u} ${n.maximum.toString()} ${i.unit ?? "\u0639\u0646\u0635\u0631"}`;
        return `\u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0623\u0646 \u062A\u0643\u0648\u0646 ${n.origin ?? "\u0627\u0644\u0642\u064A\u0645\u0629"} ${u} ${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `\u0623\u0635\u063A\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0644\u0640 ${n.origin} \u0623\u0646 \u064A\u0643\u0648\u0646 ${u} ${n.minimum.toString()} ${i.unit}`;
        return `\u0623\u0635\u063A\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0644\u0640 ${n.origin} \u0623\u0646 \u064A\u0643\u0648\u0646 ${u} ${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0628\u062F\u0623 \u0628\u0640 "${n.prefix}"`;
        if (u.format === "ends_with") return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0646\u062A\u0647\u064A \u0628\u0640 "${u.suffix}"`;
        if (u.format === "includes") return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u062A\u0636\u0645\u0651\u064E\u0646 "${u.includes}"`;
        if (u.format === "regex") return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0637\u0627\u0628\u0642 \u0627\u0644\u0646\u0645\u0637 ${u.pattern}`;
        return `${$[u.format] ?? n.format} \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644`;
      }
      case "not_multiple_of":
        return `\u0631\u0642\u0645 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0645\u0646 \u0645\u0636\u0627\u0639\u0641\u0627\u062A ${n.divisor}`;
      case "unrecognized_keys":
        return `\u0645\u0639\u0631\u0641${n.keys.length > 1 ? "\u0627\u062A" : ""} \u063A\u0631\u064A\u0628${n.keys.length > 1 ? "\u0629" : ""}: ${_(n.keys, "\u060C ")}`;
      case "invalid_key":
        return `\u0645\u0639\u0631\u0641 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644 \u0641\u064A ${n.origin}`;
      case "invalid_union":
        return "\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644";
      case "invalid_element":
        return `\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644 \u0641\u064A ${n.origin}`;
      default:
        return "\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644";
    }
  };
};
function Q$() {
  return { localeError: Y6() };
}
var Q6 = () => {
  let r = { string: { unit: "simvol", verb: "olmal\u0131d\u0131r" }, file: { unit: "bayt", verb: "olmal\u0131d\u0131r" }, array: { unit: "element", verb: "olmal\u0131d\u0131r" }, set: { unit: "element", verb: "olmal\u0131d\u0131r" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "number";
      case "object": {
        if (Array.isArray(n)) return "array";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "input", email: "email address", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO datetime", date: "ISO date", time: "ISO time", duration: "ISO duration", ipv4: "IPv4 address", ipv6: "IPv6 address", cidrv4: "IPv4 range", cidrv6: "IPv6 range", base64: "base64-encoded string", base64url: "base64url-encoded string", json_string: "JSON string", e164: "E.164 number", jwt: "JWT", template_literal: "input" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n ${n.expected}, daxil olan ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n ${N(n.values[0])}`;
        return `Yanl\u0131\u015F se\xE7im: a\u015Fa\u011F\u0131dak\u0131lardan biri olmal\u0131d\u0131r: ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `\xC7ox b\xF6y\xFCk: g\xF6zl\u0259nil\u0259n ${n.origin ?? "d\u0259y\u0259r"} ${u}${n.maximum.toString()} ${i.unit ?? "element"}`;
        return `\xC7ox b\xF6y\xFCk: g\xF6zl\u0259nil\u0259n ${n.origin ?? "d\u0259y\u0259r"} ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `\xC7ox ki\xE7ik: g\xF6zl\u0259nil\u0259n ${n.origin} ${u}${n.minimum.toString()} ${i.unit}`;
        return `\xC7ox ki\xE7ik: g\xF6zl\u0259nil\u0259n ${n.origin} ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Yanl\u0131\u015F m\u0259tn: "${u.prefix}" il\u0259 ba\u015Flamal\u0131d\u0131r`;
        if (u.format === "ends_with") return `Yanl\u0131\u015F m\u0259tn: "${u.suffix}" il\u0259 bitm\u0259lidir`;
        if (u.format === "includes") return `Yanl\u0131\u015F m\u0259tn: "${u.includes}" daxil olmal\u0131d\u0131r`;
        if (u.format === "regex") return `Yanl\u0131\u015F m\u0259tn: ${u.pattern} \u015Fablonuna uy\u011Fun olmal\u0131d\u0131r`;
        return `Yanl\u0131\u015F ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `Yanl\u0131\u015F \u0259d\u0259d: ${n.divisor} il\u0259 b\xF6l\xFCn\u0259 bil\u0259n olmal\u0131d\u0131r`;
      case "unrecognized_keys":
        return `Tan\u0131nmayan a\xE7ar${n.keys.length > 1 ? "lar" : ""}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `${n.origin} daxilind\u0259 yanl\u0131\u015F a\xE7ar`;
      case "invalid_union":
        return "Yanl\u0131\u015F d\u0259y\u0259r";
      case "invalid_element":
        return `${n.origin} daxilind\u0259 yanl\u0131\u015F d\u0259y\u0259r`;
      default:
        return "Yanl\u0131\u015F d\u0259y\u0259r";
    }
  };
};
function q$() {
  return { localeError: Q6() };
}
function et(r, v, o, $) {
  let n = Math.abs(r), u = n % 10, i = n % 100;
  if (i >= 11 && i <= 19) return $;
  if (u === 1) return v;
  if (u >= 2 && u <= 4) return o;
  return $;
}
var q6 = () => {
  let r = { string: { unit: { one: "\u0441\u0456\u043C\u0432\u0430\u043B", few: "\u0441\u0456\u043C\u0432\u0430\u043B\u044B", many: "\u0441\u0456\u043C\u0432\u0430\u043B\u0430\u045E" }, verb: "\u043C\u0435\u0446\u044C" }, array: { unit: { one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442", few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B", many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u045E" }, verb: "\u043C\u0435\u0446\u044C" }, set: { unit: { one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442", few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B", many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u045E" }, verb: "\u043C\u0435\u0446\u044C" }, file: { unit: { one: "\u0431\u0430\u0439\u0442", few: "\u0431\u0430\u0439\u0442\u044B", many: "\u0431\u0430\u0439\u0442\u0430\u045E" }, verb: "\u043C\u0435\u0446\u044C" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "\u043B\u0456\u043A";
      case "object": {
        if (Array.isArray(n)) return "\u043C\u0430\u0441\u0456\u045E";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u0443\u0432\u043E\u0434", email: "email \u0430\u0434\u0440\u0430\u0441", url: "URL", emoji: "\u044D\u043C\u043E\u0434\u0437\u0456", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO \u0434\u0430\u0442\u0430 \u0456 \u0447\u0430\u0441", date: "ISO \u0434\u0430\u0442\u0430", time: "ISO \u0447\u0430\u0441", duration: "ISO \u043F\u0440\u0430\u0446\u044F\u0433\u043B\u0430\u0441\u0446\u044C", ipv4: "IPv4 \u0430\u0434\u0440\u0430\u0441", ipv6: "IPv6 \u0430\u0434\u0440\u0430\u0441", cidrv4: "IPv4 \u0434\u044B\u044F\u043F\u0430\u0437\u043E\u043D", cidrv6: "IPv6 \u0434\u044B\u044F\u043F\u0430\u0437\u043E\u043D", base64: "\u0440\u0430\u0434\u043E\u043A \u0443 \u0444\u0430\u0440\u043C\u0430\u0446\u0435 base64", base64url: "\u0440\u0430\u0434\u043E\u043A \u0443 \u0444\u0430\u0440\u043C\u0430\u0446\u0435 base64url", json_string: "JSON \u0440\u0430\u0434\u043E\u043A", e164: "\u043D\u0443\u043C\u0430\u0440 E.164", jwt: "JWT", template_literal: "\u0443\u0432\u043E\u0434" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u045E\u0441\u044F ${n.expected}, \u0430\u0442\u0440\u044B\u043C\u0430\u043D\u0430 ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F ${N(n.values[0])}`;
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0432\u0430\u0440\u044B\u044F\u043D\u0442: \u0447\u0430\u043A\u0430\u045E\u0441\u044F \u0430\u0434\u0437\u0456\u043D \u0437 ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) {
          let g = Number(n.maximum), I = et(g, i.unit.one, i.unit.few, i.unit.many);
          return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u0432\u044F\u043B\u0456\u043A\u0456: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${n.origin ?? "\u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435"} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 ${i.verb} ${u}${n.maximum.toString()} ${I}`;
        }
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u0432\u044F\u043B\u0456\u043A\u0456: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${n.origin ?? "\u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435"} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 \u0431\u044B\u0446\u044C ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) {
          let g = Number(n.minimum), I = et(g, i.unit.one, i.unit.few, i.unit.many);
          return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u043C\u0430\u043B\u044B: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${n.origin} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 ${i.verb} ${u}${n.minimum.toString()} ${I}`;
        }
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u043C\u0430\u043B\u044B: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${n.origin} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 \u0431\u044B\u0446\u044C ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u043F\u0430\u0447\u044B\u043D\u0430\u0446\u0446\u0430 \u0437 "${u.prefix}"`;
        if (u.format === "ends_with") return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0437\u0430\u043A\u0430\u043D\u0447\u0432\u0430\u0446\u0446\u0430 \u043D\u0430 "${u.suffix}"`;
        if (u.format === "includes") return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0437\u043C\u044F\u0448\u0447\u0430\u0446\u044C "${u.includes}"`;
        if (u.format === "regex") return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0430\u0434\u043F\u0430\u0432\u044F\u0434\u0430\u0446\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${u.pattern}`;
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u043B\u0456\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0431\u044B\u0446\u044C \u043A\u0440\u0430\u0442\u043D\u044B\u043C ${n.divisor}`;
      case "unrecognized_keys":
        return `\u041D\u0435\u0440\u0430\u0441\u043F\u0430\u0437\u043D\u0430\u043D\u044B ${n.keys.length > 1 ? "\u043A\u043B\u044E\u0447\u044B" : "\u043A\u043B\u044E\u0447"}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u043A\u043B\u044E\u0447 \u0443 ${n.origin}`;
      case "invalid_union":
        return "\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434";
      case "invalid_element":
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u0430\u0435 \u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435 \u045E ${n.origin}`;
      default:
        return "\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434";
    }
  };
};
function B$() {
  return { localeError: q6() };
}
var B6 = (r) => {
  let v = typeof r;
  switch (v) {
    case "number":
      return Number.isNaN(r) ? "NaN" : "\u0447\u0438\u0441\u043B\u043E";
    case "object": {
      if (Array.isArray(r)) return "\u043C\u0430\u0441\u0438\u0432";
      if (r === null) return "null";
      if (Object.getPrototypeOf(r) !== Object.prototype && r.constructor) return r.constructor.name;
    }
  }
  return v;
};
var H6 = () => {
  let r = { string: { unit: "\u0441\u0438\u043C\u0432\u043E\u043B\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" }, file: { unit: "\u0431\u0430\u0439\u0442\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" }, array: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" }, set: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" } };
  function v($) {
    return r[$] ?? null;
  }
  let o = { regex: "\u0432\u0445\u043E\u0434", email: "\u0438\u043C\u0435\u0439\u043B \u0430\u0434\u0440\u0435\u0441", url: "URL", emoji: "\u0435\u043C\u043E\u0434\u0436\u0438", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO \u0432\u0440\u0435\u043C\u0435", date: "ISO \u0434\u0430\u0442\u0430", time: "ISO \u0432\u0440\u0435\u043C\u0435", duration: "ISO \u043F\u0440\u043E\u0434\u044A\u043B\u0436\u0438\u0442\u0435\u043B\u043D\u043E\u0441\u0442", ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441", ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441", cidrv4: "IPv4 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D", cidrv6: "IPv6 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D", base64: "base64-\u043A\u043E\u0434\u0438\u0440\u0430\u043D \u043D\u0438\u0437", base64url: "base64url-\u043A\u043E\u0434\u0438\u0440\u0430\u043D \u043D\u0438\u0437", json_string: "JSON \u043D\u0438\u0437", e164: "E.164 \u043D\u043E\u043C\u0435\u0440", jwt: "JWT", template_literal: "\u0432\u0445\u043E\u0434" };
  return ($) => {
    switch ($.code) {
      case "invalid_type":
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434: \u043E\u0447\u0430\u043A\u0432\u0430\u043D ${$.expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D ${B6($.input)}`;
      case "invalid_value":
        if ($.values.length === 1) return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434: \u043E\u0447\u0430\u043A\u0432\u0430\u043D ${N($.values[0])}`;
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430 \u043E\u043F\u0446\u0438\u044F: \u043E\u0447\u0430\u043A\u0432\u0430\u043D\u043E \u0435\u0434\u043D\u043E \u043E\u0442 ${_($.values, "|")}`;
      case "too_big": {
        let n = $.inclusive ? "<=" : "<", u = v($.origin);
        if (u) return `\u0422\u0432\u044A\u0440\u0434\u0435 \u0433\u043E\u043B\u044F\u043C\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${$.origin ?? "\u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442"} \u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430 ${n}${$.maximum.toString()} ${u.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430"}`;
        return `\u0422\u0432\u044A\u0440\u0434\u0435 \u0433\u043E\u043B\u044F\u043C\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${$.origin ?? "\u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442"} \u0434\u0430 \u0431\u044A\u0434\u0435 ${n}${$.maximum.toString()}`;
      }
      case "too_small": {
        let n = $.inclusive ? ">=" : ">", u = v($.origin);
        if (u) return `\u0422\u0432\u044A\u0440\u0434\u0435 \u043C\u0430\u043B\u043A\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${$.origin} \u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430 ${n}${$.minimum.toString()} ${u.unit}`;
        return `\u0422\u0432\u044A\u0440\u0434\u0435 \u043C\u0430\u043B\u043A\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${$.origin} \u0434\u0430 \u0431\u044A\u0434\u0435 ${n}${$.minimum.toString()}`;
      }
      case "invalid_format": {
        let n = $;
        if (n.format === "starts_with") return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0437\u0430\u043F\u043E\u0447\u0432\u0430 \u0441 "${n.prefix}"`;
        if (n.format === "ends_with") return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0437\u0430\u0432\u044A\u0440\u0448\u0432\u0430 \u0441 "${n.suffix}"`;
        if (n.format === "includes") return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0432\u043A\u043B\u044E\u0447\u0432\u0430 "${n.includes}"`;
        if (n.format === "regex") return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0441\u044A\u0432\u043F\u0430\u0434\u0430 \u0441 ${n.pattern}`;
        let u = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D";
        if (n.format === "emoji") u = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
        if (n.format === "datetime") u = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
        if (n.format === "date") u = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430";
        if (n.format === "time") u = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
        if (n.format === "duration") u = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430";
        return `${u} ${o[n.format] ?? $.format}`;
      }
      case "not_multiple_of":
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E \u0447\u0438\u0441\u043B\u043E: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0431\u044A\u0434\u0435 \u043A\u0440\u0430\u0442\u043D\u043E \u043D\u0430 ${$.divisor}`;
      case "unrecognized_keys":
        return `\u041D\u0435\u0440\u0430\u0437\u043F\u043E\u0437\u043D\u0430\u0442${$.keys.length > 1 ? "\u0438" : ""} \u043A\u043B\u044E\u0447${$.keys.length > 1 ? "\u043E\u0432\u0435" : ""}: ${_($.keys, ", ")}`;
      case "invalid_key":
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043A\u043B\u044E\u0447 \u0432 ${$.origin}`;
      case "invalid_union":
        return "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434";
      case "invalid_element":
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430 \u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442 \u0432 ${$.origin}`;
      default:
        return "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434";
    }
  };
};
function H$() {
  return { localeError: H6() };
}
var M6 = () => {
  let r = { string: { unit: "car\xE0cters", verb: "contenir" }, file: { unit: "bytes", verb: "contenir" }, array: { unit: "elements", verb: "contenir" }, set: { unit: "elements", verb: "contenir" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "number";
      case "object": {
        if (Array.isArray(n)) return "array";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "entrada", email: "adre\xE7a electr\xF2nica", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "data i hora ISO", date: "data ISO", time: "hora ISO", duration: "durada ISO", ipv4: "adre\xE7a IPv4", ipv6: "adre\xE7a IPv6", cidrv4: "rang IPv4", cidrv6: "rang IPv6", base64: "cadena codificada en base64", base64url: "cadena codificada en base64url", json_string: "cadena JSON", e164: "n\xFAmero E.164", jwt: "JWT", template_literal: "entrada" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Tipus inv\xE0lid: s'esperava ${n.expected}, s'ha rebut ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Valor inv\xE0lid: s'esperava ${N(n.values[0])}`;
        return `Opci\xF3 inv\xE0lida: s'esperava una de ${_(n.values, " o ")}`;
      case "too_big": {
        let u = n.inclusive ? "com a m\xE0xim" : "menys de", i = v(n.origin);
        if (i) return `Massa gran: s'esperava que ${n.origin ?? "el valor"} contingu\xE9s ${u} ${n.maximum.toString()} ${i.unit ?? "elements"}`;
        return `Massa gran: s'esperava que ${n.origin ?? "el valor"} fos ${u} ${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? "com a m\xEDnim" : "m\xE9s de", i = v(n.origin);
        if (i) return `Massa petit: s'esperava que ${n.origin} contingu\xE9s ${u} ${n.minimum.toString()} ${i.unit}`;
        return `Massa petit: s'esperava que ${n.origin} fos ${u} ${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Format inv\xE0lid: ha de comen\xE7ar amb "${u.prefix}"`;
        if (u.format === "ends_with") return `Format inv\xE0lid: ha d'acabar amb "${u.suffix}"`;
        if (u.format === "includes") return `Format inv\xE0lid: ha d'incloure "${u.includes}"`;
        if (u.format === "regex") return `Format inv\xE0lid: ha de coincidir amb el patr\xF3 ${u.pattern}`;
        return `Format inv\xE0lid per a ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `N\xFAmero inv\xE0lid: ha de ser m\xFAltiple de ${n.divisor}`;
      case "unrecognized_keys":
        return `Clau${n.keys.length > 1 ? "s" : ""} no reconeguda${n.keys.length > 1 ? "s" : ""}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Clau inv\xE0lida a ${n.origin}`;
      case "invalid_union":
        return "Entrada inv\xE0lida";
      case "invalid_element":
        return `Element inv\xE0lid a ${n.origin}`;
      default:
        return "Entrada inv\xE0lida";
    }
  };
};
function M$() {
  return { localeError: M6() };
}
var F6 = () => {
  let r = { string: { unit: "znak\u016F", verb: "m\xEDt" }, file: { unit: "bajt\u016F", verb: "m\xEDt" }, array: { unit: "prvk\u016F", verb: "m\xEDt" }, set: { unit: "prvk\u016F", verb: "m\xEDt" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "\u010D\xEDslo";
      case "string":
        return "\u0159et\u011Bzec";
      case "boolean":
        return "boolean";
      case "bigint":
        return "bigint";
      case "function":
        return "funkce";
      case "symbol":
        return "symbol";
      case "undefined":
        return "undefined";
      case "object": {
        if (Array.isArray(n)) return "pole";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "regul\xE1rn\xED v\xFDraz", email: "e-mailov\xE1 adresa", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "datum a \u010Das ve form\xE1tu ISO", date: "datum ve form\xE1tu ISO", time: "\u010Das ve form\xE1tu ISO", duration: "doba trv\xE1n\xED ISO", ipv4: "IPv4 adresa", ipv6: "IPv6 adresa", cidrv4: "rozsah IPv4", cidrv6: "rozsah IPv6", base64: "\u0159et\u011Bzec zak\xF3dovan\xFD ve form\xE1tu base64", base64url: "\u0159et\u011Bzec zak\xF3dovan\xFD ve form\xE1tu base64url", json_string: "\u0159et\u011Bzec ve form\xE1tu JSON", e164: "\u010D\xEDslo E.164", jwt: "JWT", template_literal: "vstup" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no ${n.expected}, obdr\u017Eeno ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no ${N(n.values[0])}`;
        return `Neplatn\xE1 mo\u017Enost: o\u010Dek\xE1v\xE1na jedna z hodnot ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `Hodnota je p\u0159\xEDli\u0161 velk\xE1: ${n.origin ?? "hodnota"} mus\xED m\xEDt ${u}${n.maximum.toString()} ${i.unit ?? "prvk\u016F"}`;
        return `Hodnota je p\u0159\xEDli\u0161 velk\xE1: ${n.origin ?? "hodnota"} mus\xED b\xFDt ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `Hodnota je p\u0159\xEDli\u0161 mal\xE1: ${n.origin ?? "hodnota"} mus\xED m\xEDt ${u}${n.minimum.toString()} ${i.unit ?? "prvk\u016F"}`;
        return `Hodnota je p\u0159\xEDli\u0161 mal\xE1: ${n.origin ?? "hodnota"} mus\xED b\xFDt ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Neplatn\xFD \u0159et\u011Bzec: mus\xED za\u010D\xEDnat na "${u.prefix}"`;
        if (u.format === "ends_with") return `Neplatn\xFD \u0159et\u011Bzec: mus\xED kon\u010Dit na "${u.suffix}"`;
        if (u.format === "includes") return `Neplatn\xFD \u0159et\u011Bzec: mus\xED obsahovat "${u.includes}"`;
        if (u.format === "regex") return `Neplatn\xFD \u0159et\u011Bzec: mus\xED odpov\xEDdat vzoru ${u.pattern}`;
        return `Neplatn\xFD form\xE1t ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `Neplatn\xE9 \u010D\xEDslo: mus\xED b\xFDt n\xE1sobkem ${n.divisor}`;
      case "unrecognized_keys":
        return `Nezn\xE1m\xE9 kl\xED\u010De: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Neplatn\xFD kl\xED\u010D v ${n.origin}`;
      case "invalid_union":
        return "Neplatn\xFD vstup";
      case "invalid_element":
        return `Neplatn\xE1 hodnota v ${n.origin}`;
      default:
        return "Neplatn\xFD vstup";
    }
  };
};
function F$() {
  return { localeError: F6() };
}
var R6 = () => {
  let r = { string: { unit: "tegn", verb: "havde" }, file: { unit: "bytes", verb: "havde" }, array: { unit: "elementer", verb: "indeholdt" }, set: { unit: "elementer", verb: "indeholdt" } }, v = { string: "streng", number: "tal", boolean: "boolean", array: "liste", object: "objekt", set: "s\xE6t", file: "fil" };
  function o(i) {
    return r[i] ?? null;
  }
  function $(i) {
    return v[i] ?? i;
  }
  let n = (i) => {
    let g = typeof i;
    switch (g) {
      case "number":
        return Number.isNaN(i) ? "NaN" : "tal";
      case "object": {
        if (Array.isArray(i)) return "liste";
        if (i === null) return "null";
        if (Object.getPrototypeOf(i) !== Object.prototype && i.constructor) return i.constructor.name;
        return "objekt";
      }
    }
    return g;
  }, u = { regex: "input", email: "e-mailadresse", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO dato- og klokkesl\xE6t", date: "ISO-dato", time: "ISO-klokkesl\xE6t", duration: "ISO-varighed", ipv4: "IPv4-omr\xE5de", ipv6: "IPv6-omr\xE5de", cidrv4: "IPv4-spektrum", cidrv6: "IPv6-spektrum", base64: "base64-kodet streng", base64url: "base64url-kodet streng", json_string: "JSON-streng", e164: "E.164-nummer", jwt: "JWT", template_literal: "input" };
  return (i) => {
    switch (i.code) {
      case "invalid_type":
        return `Ugyldigt input: forventede ${$(i.expected)}, fik ${$(n(i.input))}`;
      case "invalid_value":
        if (i.values.length === 1) return `Ugyldig v\xE6rdi: forventede ${N(i.values[0])}`;
        return `Ugyldigt valg: forventede en af f\xF8lgende ${_(i.values, "|")}`;
      case "too_big": {
        let g = i.inclusive ? "<=" : "<", I = o(i.origin), b = $(i.origin);
        if (I) return `For stor: forventede ${b ?? "value"} ${I.verb} ${g} ${i.maximum.toString()} ${I.unit ?? "elementer"}`;
        return `For stor: forventede ${b ?? "value"} havde ${g} ${i.maximum.toString()}`;
      }
      case "too_small": {
        let g = i.inclusive ? ">=" : ">", I = o(i.origin), b = $(i.origin);
        if (I) return `For lille: forventede ${b} ${I.verb} ${g} ${i.minimum.toString()} ${I.unit}`;
        return `For lille: forventede ${b} havde ${g} ${i.minimum.toString()}`;
      }
      case "invalid_format": {
        let g = i;
        if (g.format === "starts_with") return `Ugyldig streng: skal starte med "${g.prefix}"`;
        if (g.format === "ends_with") return `Ugyldig streng: skal ende med "${g.suffix}"`;
        if (g.format === "includes") return `Ugyldig streng: skal indeholde "${g.includes}"`;
        if (g.format === "regex") return `Ugyldig streng: skal matche m\xF8nsteret ${g.pattern}`;
        return `Ugyldig ${u[g.format] ?? i.format}`;
      }
      case "not_multiple_of":
        return `Ugyldigt tal: skal v\xE6re deleligt med ${i.divisor}`;
      case "unrecognized_keys":
        return `${i.keys.length > 1 ? "Ukendte n\xF8gler" : "Ukendt n\xF8gle"}: ${_(i.keys, ", ")}`;
      case "invalid_key":
        return `Ugyldig n\xF8gle i ${i.origin}`;
      case "invalid_union":
        return "Ugyldigt input: matcher ingen af de tilladte typer";
      case "invalid_element":
        return `Ugyldig v\xE6rdi i ${i.origin}`;
      default:
        return "Ugyldigt input";
    }
  };
};
function R$() {
  return { localeError: R6() };
}
var T6 = () => {
  let r = { string: { unit: "Zeichen", verb: "zu haben" }, file: { unit: "Bytes", verb: "zu haben" }, array: { unit: "Elemente", verb: "zu haben" }, set: { unit: "Elemente", verb: "zu haben" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "Zahl";
      case "object": {
        if (Array.isArray(n)) return "Array";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "Eingabe", email: "E-Mail-Adresse", url: "URL", emoji: "Emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO-Datum und -Uhrzeit", date: "ISO-Datum", time: "ISO-Uhrzeit", duration: "ISO-Dauer", ipv4: "IPv4-Adresse", ipv6: "IPv6-Adresse", cidrv4: "IPv4-Bereich", cidrv6: "IPv6-Bereich", base64: "Base64-codierter String", base64url: "Base64-URL-codierter String", json_string: "JSON-String", e164: "E.164-Nummer", jwt: "JWT", template_literal: "Eingabe" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Ung\xFCltige Eingabe: erwartet ${n.expected}, erhalten ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Ung\xFCltige Eingabe: erwartet ${N(n.values[0])}`;
        return `Ung\xFCltige Option: erwartet eine von ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `Zu gro\xDF: erwartet, dass ${n.origin ?? "Wert"} ${u}${n.maximum.toString()} ${i.unit ?? "Elemente"} hat`;
        return `Zu gro\xDF: erwartet, dass ${n.origin ?? "Wert"} ${u}${n.maximum.toString()} ist`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `Zu klein: erwartet, dass ${n.origin} ${u}${n.minimum.toString()} ${i.unit} hat`;
        return `Zu klein: erwartet, dass ${n.origin} ${u}${n.minimum.toString()} ist`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Ung\xFCltiger String: muss mit "${u.prefix}" beginnen`;
        if (u.format === "ends_with") return `Ung\xFCltiger String: muss mit "${u.suffix}" enden`;
        if (u.format === "includes") return `Ung\xFCltiger String: muss "${u.includes}" enthalten`;
        if (u.format === "regex") return `Ung\xFCltiger String: muss dem Muster ${u.pattern} entsprechen`;
        return `Ung\xFCltig: ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `Ung\xFCltige Zahl: muss ein Vielfaches von ${n.divisor} sein`;
      case "unrecognized_keys":
        return `${n.keys.length > 1 ? "Unbekannte Schl\xFCssel" : "Unbekannter Schl\xFCssel"}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Ung\xFCltiger Schl\xFCssel in ${n.origin}`;
      case "invalid_union":
        return "Ung\xFCltige Eingabe";
      case "invalid_element":
        return `Ung\xFCltiger Wert in ${n.origin}`;
      default:
        return "Ung\xFCltige Eingabe";
    }
  };
};
function T$() {
  return { localeError: T6() };
}
var z6 = (r) => {
  let v = typeof r;
  switch (v) {
    case "number":
      return Number.isNaN(r) ? "NaN" : "number";
    case "object": {
      if (Array.isArray(r)) return "array";
      if (r === null) return "null";
      if (Object.getPrototypeOf(r) !== Object.prototype && r.constructor) return r.constructor.name;
    }
  }
  return v;
};
var Z6 = () => {
  let r = { string: { unit: "characters", verb: "to have" }, file: { unit: "bytes", verb: "to have" }, array: { unit: "items", verb: "to have" }, set: { unit: "items", verb: "to have" } };
  function v($) {
    return r[$] ?? null;
  }
  let o = { regex: "input", email: "email address", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO datetime", date: "ISO date", time: "ISO time", duration: "ISO duration", ipv4: "IPv4 address", ipv6: "IPv6 address", mac: "MAC address", cidrv4: "IPv4 range", cidrv6: "IPv6 range", base64: "base64-encoded string", base64url: "base64url-encoded string", json_string: "JSON string", e164: "E.164 number", jwt: "JWT", template_literal: "input" };
  return ($) => {
    switch ($.code) {
      case "invalid_type":
        return `Invalid input: expected ${$.expected}, received ${z6($.input)}`;
      case "invalid_value":
        if ($.values.length === 1) return `Invalid input: expected ${N($.values[0])}`;
        return `Invalid option: expected one of ${_($.values, "|")}`;
      case "too_big": {
        let n = $.inclusive ? "<=" : "<", u = v($.origin);
        if (u) return `Too big: expected ${$.origin ?? "value"} to have ${n}${$.maximum.toString()} ${u.unit ?? "elements"}`;
        return `Too big: expected ${$.origin ?? "value"} to be ${n}${$.maximum.toString()}`;
      }
      case "too_small": {
        let n = $.inclusive ? ">=" : ">", u = v($.origin);
        if (u) return `Too small: expected ${$.origin} to have ${n}${$.minimum.toString()} ${u.unit}`;
        return `Too small: expected ${$.origin} to be ${n}${$.minimum.toString()}`;
      }
      case "invalid_format": {
        let n = $;
        if (n.format === "starts_with") return `Invalid string: must start with "${n.prefix}"`;
        if (n.format === "ends_with") return `Invalid string: must end with "${n.suffix}"`;
        if (n.format === "includes") return `Invalid string: must include "${n.includes}"`;
        if (n.format === "regex") return `Invalid string: must match pattern ${n.pattern}`;
        return `Invalid ${o[n.format] ?? $.format}`;
      }
      case "not_multiple_of":
        return `Invalid number: must be a multiple of ${$.divisor}`;
      case "unrecognized_keys":
        return `Unrecognized key${$.keys.length > 1 ? "s" : ""}: ${_($.keys, ", ")}`;
      case "invalid_key":
        return `Invalid key in ${$.origin}`;
      case "invalid_union":
        return "Invalid input";
      case "invalid_element":
        return `Invalid value in ${$.origin}`;
      default:
        return "Invalid input";
    }
  };
};
function ln() {
  return { localeError: Z6() };
}
var e6 = (r) => {
  let v = typeof r;
  switch (v) {
    case "number":
      return Number.isNaN(r) ? "NaN" : "nombro";
    case "object": {
      if (Array.isArray(r)) return "tabelo";
      if (r === null) return "senvalora";
      if (Object.getPrototypeOf(r) !== Object.prototype && r.constructor) return r.constructor.name;
    }
  }
  return v;
};
var m6 = () => {
  let r = { string: { unit: "karaktrojn", verb: "havi" }, file: { unit: "bajtojn", verb: "havi" }, array: { unit: "elementojn", verb: "havi" }, set: { unit: "elementojn", verb: "havi" } };
  function v($) {
    return r[$] ?? null;
  }
  let o = { regex: "enigo", email: "retadreso", url: "URL", emoji: "emo\u011Dio", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO-datotempo", date: "ISO-dato", time: "ISO-tempo", duration: "ISO-da\u016Dro", ipv4: "IPv4-adreso", ipv6: "IPv6-adreso", cidrv4: "IPv4-rango", cidrv6: "IPv6-rango", base64: "64-ume kodita karaktraro", base64url: "URL-64-ume kodita karaktraro", json_string: "JSON-karaktraro", e164: "E.164-nombro", jwt: "JWT", template_literal: "enigo" };
  return ($) => {
    switch ($.code) {
      case "invalid_type":
        return `Nevalida enigo: atendi\u011Dis ${$.expected}, ricevi\u011Dis ${e6($.input)}`;
      case "invalid_value":
        if ($.values.length === 1) return `Nevalida enigo: atendi\u011Dis ${N($.values[0])}`;
        return `Nevalida opcio: atendi\u011Dis unu el ${_($.values, "|")}`;
      case "too_big": {
        let n = $.inclusive ? "<=" : "<", u = v($.origin);
        if (u) return `Tro granda: atendi\u011Dis ke ${$.origin ?? "valoro"} havu ${n}${$.maximum.toString()} ${u.unit ?? "elementojn"}`;
        return `Tro granda: atendi\u011Dis ke ${$.origin ?? "valoro"} havu ${n}${$.maximum.toString()}`;
      }
      case "too_small": {
        let n = $.inclusive ? ">=" : ">", u = v($.origin);
        if (u) return `Tro malgranda: atendi\u011Dis ke ${$.origin} havu ${n}${$.minimum.toString()} ${u.unit}`;
        return `Tro malgranda: atendi\u011Dis ke ${$.origin} estu ${n}${$.minimum.toString()}`;
      }
      case "invalid_format": {
        let n = $;
        if (n.format === "starts_with") return `Nevalida karaktraro: devas komenci\u011Di per "${n.prefix}"`;
        if (n.format === "ends_with") return `Nevalida karaktraro: devas fini\u011Di per "${n.suffix}"`;
        if (n.format === "includes") return `Nevalida karaktraro: devas inkluzivi "${n.includes}"`;
        if (n.format === "regex") return `Nevalida karaktraro: devas kongrui kun la modelo ${n.pattern}`;
        return `Nevalida ${o[n.format] ?? $.format}`;
      }
      case "not_multiple_of":
        return `Nevalida nombro: devas esti oblo de ${$.divisor}`;
      case "unrecognized_keys":
        return `Nekonata${$.keys.length > 1 ? "j" : ""} \u015Dlosilo${$.keys.length > 1 ? "j" : ""}: ${_($.keys, ", ")}`;
      case "invalid_key":
        return `Nevalida \u015Dlosilo en ${$.origin}`;
      case "invalid_union":
        return "Nevalida enigo";
      case "invalid_element":
        return `Nevalida valoro en ${$.origin}`;
      default:
        return "Nevalida enigo";
    }
  };
};
function z$() {
  return { localeError: m6() };
}
var C6 = () => {
  let r = { string: { unit: "caracteres", verb: "tener" }, file: { unit: "bytes", verb: "tener" }, array: { unit: "elementos", verb: "tener" }, set: { unit: "elementos", verb: "tener" } }, v = { string: "texto", number: "n\xFAmero", boolean: "booleano", array: "arreglo", object: "objeto", set: "conjunto", file: "archivo", date: "fecha", bigint: "n\xFAmero grande", symbol: "s\xEDmbolo", undefined: "indefinido", null: "nulo", function: "funci\xF3n", map: "mapa", record: "registro", tuple: "tupla", enum: "enumeraci\xF3n", union: "uni\xF3n", literal: "literal", promise: "promesa", void: "vac\xEDo", never: "nunca", unknown: "desconocido", any: "cualquiera" };
  function o(i) {
    return r[i] ?? null;
  }
  function $(i) {
    return v[i] ?? i;
  }
  let n = (i) => {
    let g = typeof i;
    switch (g) {
      case "number":
        return Number.isNaN(i) ? "NaN" : "number";
      case "object": {
        if (Array.isArray(i)) return "array";
        if (i === null) return "null";
        if (Object.getPrototypeOf(i) !== Object.prototype) return i.constructor.name;
        return "object";
      }
    }
    return g;
  }, u = { regex: "entrada", email: "direcci\xF3n de correo electr\xF3nico", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "fecha y hora ISO", date: "fecha ISO", time: "hora ISO", duration: "duraci\xF3n ISO", ipv4: "direcci\xF3n IPv4", ipv6: "direcci\xF3n IPv6", cidrv4: "rango IPv4", cidrv6: "rango IPv6", base64: "cadena codificada en base64", base64url: "URL codificada en base64", json_string: "cadena JSON", e164: "n\xFAmero E.164", jwt: "JWT", template_literal: "entrada" };
  return (i) => {
    switch (i.code) {
      case "invalid_type":
        return `Entrada inv\xE1lida: se esperaba ${$(i.expected)}, recibido ${$(n(i.input))}`;
      case "invalid_value":
        if (i.values.length === 1) return `Entrada inv\xE1lida: se esperaba ${N(i.values[0])}`;
        return `Opci\xF3n inv\xE1lida: se esperaba una de ${_(i.values, "|")}`;
      case "too_big": {
        let g = i.inclusive ? "<=" : "<", I = o(i.origin), b = $(i.origin);
        if (I) return `Demasiado grande: se esperaba que ${b ?? "valor"} tuviera ${g}${i.maximum.toString()} ${I.unit ?? "elementos"}`;
        return `Demasiado grande: se esperaba que ${b ?? "valor"} fuera ${g}${i.maximum.toString()}`;
      }
      case "too_small": {
        let g = i.inclusive ? ">=" : ">", I = o(i.origin), b = $(i.origin);
        if (I) return `Demasiado peque\xF1o: se esperaba que ${b} tuviera ${g}${i.minimum.toString()} ${I.unit}`;
        return `Demasiado peque\xF1o: se esperaba que ${b} fuera ${g}${i.minimum.toString()}`;
      }
      case "invalid_format": {
        let g = i;
        if (g.format === "starts_with") return `Cadena inv\xE1lida: debe comenzar con "${g.prefix}"`;
        if (g.format === "ends_with") return `Cadena inv\xE1lida: debe terminar en "${g.suffix}"`;
        if (g.format === "includes") return `Cadena inv\xE1lida: debe incluir "${g.includes}"`;
        if (g.format === "regex") return `Cadena inv\xE1lida: debe coincidir con el patr\xF3n ${g.pattern}`;
        return `Inv\xE1lido ${u[g.format] ?? i.format}`;
      }
      case "not_multiple_of":
        return `N\xFAmero inv\xE1lido: debe ser m\xFAltiplo de ${i.divisor}`;
      case "unrecognized_keys":
        return `Llave${i.keys.length > 1 ? "s" : ""} desconocida${i.keys.length > 1 ? "s" : ""}: ${_(i.keys, ", ")}`;
      case "invalid_key":
        return `Llave inv\xE1lida en ${$(i.origin)}`;
      case "invalid_union":
        return "Entrada inv\xE1lida";
      case "invalid_element":
        return `Valor inv\xE1lido en ${$(i.origin)}`;
      default:
        return "Entrada inv\xE1lida";
    }
  };
};
function Z$() {
  return { localeError: C6() };
}
var x6 = () => {
  let r = { string: { unit: "\u06A9\u0627\u0631\u0627\u06A9\u062A\u0631", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" }, file: { unit: "\u0628\u0627\u06CC\u062A", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" }, array: { unit: "\u0622\u06CC\u062A\u0645", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" }, set: { unit: "\u0622\u06CC\u062A\u0645", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "\u0639\u062F\u062F";
      case "object": {
        if (Array.isArray(n)) return "\u0622\u0631\u0627\u06CC\u0647";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u0648\u0631\u0648\u062F\u06CC", email: "\u0622\u062F\u0631\u0633 \u0627\u06CC\u0645\u06CC\u0644", url: "URL", emoji: "\u0627\u06CC\u0645\u0648\u062C\u06CC", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "\u062A\u0627\u0631\u06CC\u062E \u0648 \u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648", date: "\u062A\u0627\u0631\u06CC\u062E \u0627\u06CC\u0632\u0648", time: "\u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648", duration: "\u0645\u062F\u062A \u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648", ipv4: "IPv4 \u0622\u062F\u0631\u0633", ipv6: "IPv6 \u0622\u062F\u0631\u0633", cidrv4: "IPv4 \u062F\u0627\u0645\u0646\u0647", cidrv6: "IPv6 \u062F\u0627\u0645\u0646\u0647", base64: "base64-encoded \u0631\u0634\u062A\u0647", base64url: "base64url-encoded \u0631\u0634\u062A\u0647", json_string: "JSON \u0631\u0634\u062A\u0647", e164: "E.164 \u0639\u062F\u062F", jwt: "JWT", template_literal: "\u0648\u0631\u0648\u062F\u06CC" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A ${n.expected} \u0645\u06CC\u200C\u0628\u0648\u062F\u060C ${o(n.input)} \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F`;
      case "invalid_value":
        if (n.values.length === 1) return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A ${N(n.values[0])} \u0645\u06CC\u200C\u0628\u0648\u062F`;
        return `\u06AF\u0632\u06CC\u0646\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A \u06CC\u06A9\u06CC \u0627\u0632 ${_(n.values, "|")} \u0645\u06CC\u200C\u0628\u0648\u062F`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `\u062E\u06CC\u0644\u06CC \u0628\u0632\u0631\u06AF: ${n.origin ?? "\u0645\u0642\u062F\u0627\u0631"} \u0628\u0627\u06CC\u062F ${u}${n.maximum.toString()} ${i.unit ?? "\u0639\u0646\u0635\u0631"} \u0628\u0627\u0634\u062F`;
        return `\u062E\u06CC\u0644\u06CC \u0628\u0632\u0631\u06AF: ${n.origin ?? "\u0645\u0642\u062F\u0627\u0631"} \u0628\u0627\u06CC\u062F ${u}${n.maximum.toString()} \u0628\u0627\u0634\u062F`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `\u062E\u06CC\u0644\u06CC \u06A9\u0648\u0686\u06A9: ${n.origin} \u0628\u0627\u06CC\u062F ${u}${n.minimum.toString()} ${i.unit} \u0628\u0627\u0634\u062F`;
        return `\u062E\u06CC\u0644\u06CC \u06A9\u0648\u0686\u06A9: ${n.origin} \u0628\u0627\u06CC\u062F ${u}${n.minimum.toString()} \u0628\u0627\u0634\u062F`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 "${u.prefix}" \u0634\u0631\u0648\u0639 \u0634\u0648\u062F`;
        if (u.format === "ends_with") return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 "${u.suffix}" \u062A\u0645\u0627\u0645 \u0634\u0648\u062F`;
        if (u.format === "includes") return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0634\u0627\u0645\u0644 "${u.includes}" \u0628\u0627\u0634\u062F`;
        if (u.format === "regex") return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 \u0627\u0644\u06AF\u0648\u06CC ${u.pattern} \u0645\u0637\u0627\u0628\u0642\u062A \u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F`;
        return `${$[u.format] ?? n.format} \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
      }
      case "not_multiple_of":
        return `\u0639\u062F\u062F \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0645\u0636\u0631\u0628 ${n.divisor} \u0628\u0627\u0634\u062F`;
      case "unrecognized_keys":
        return `\u06A9\u0644\u06CC\u062F${n.keys.length > 1 ? "\u0647\u0627\u06CC" : ""} \u0646\u0627\u0634\u0646\u0627\u0633: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `\u06A9\u0644\u06CC\u062F \u0646\u0627\u0634\u0646\u0627\u0633 \u062F\u0631 ${n.origin}`;
      case "invalid_union":
        return "\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631";
      case "invalid_element":
        return `\u0645\u0642\u062F\u0627\u0631 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u062F\u0631 ${n.origin}`;
      default:
        return "\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631";
    }
  };
};
function e$() {
  return { localeError: x6() };
}
var f6 = () => {
  let r = { string: { unit: "merkki\xE4", subject: "merkkijonon" }, file: { unit: "tavua", subject: "tiedoston" }, array: { unit: "alkiota", subject: "listan" }, set: { unit: "alkiota", subject: "joukon" }, number: { unit: "", subject: "luvun" }, bigint: { unit: "", subject: "suuren kokonaisluvun" }, int: { unit: "", subject: "kokonaisluvun" }, date: { unit: "", subject: "p\xE4iv\xE4m\xE4\xE4r\xE4n" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "number";
      case "object": {
        if (Array.isArray(n)) return "array";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "s\xE4\xE4nn\xF6llinen lauseke", email: "s\xE4hk\xF6postiosoite", url: "URL-osoite", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO-aikaleima", date: "ISO-p\xE4iv\xE4m\xE4\xE4r\xE4", time: "ISO-aika", duration: "ISO-kesto", ipv4: "IPv4-osoite", ipv6: "IPv6-osoite", cidrv4: "IPv4-alue", cidrv6: "IPv6-alue", base64: "base64-koodattu merkkijono", base64url: "base64url-koodattu merkkijono", json_string: "JSON-merkkijono", e164: "E.164-luku", jwt: "JWT", template_literal: "templaattimerkkijono" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Virheellinen tyyppi: odotettiin ${n.expected}, oli ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Virheellinen sy\xF6te: t\xE4ytyy olla ${N(n.values[0])}`;
        return `Virheellinen valinta: t\xE4ytyy olla yksi seuraavista: ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `Liian suuri: ${i.subject} t\xE4ytyy olla ${u}${n.maximum.toString()} ${i.unit}`.trim();
        return `Liian suuri: arvon t\xE4ytyy olla ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `Liian pieni: ${i.subject} t\xE4ytyy olla ${u}${n.minimum.toString()} ${i.unit}`.trim();
        return `Liian pieni: arvon t\xE4ytyy olla ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Virheellinen sy\xF6te: t\xE4ytyy alkaa "${u.prefix}"`;
        if (u.format === "ends_with") return `Virheellinen sy\xF6te: t\xE4ytyy loppua "${u.suffix}"`;
        if (u.format === "includes") return `Virheellinen sy\xF6te: t\xE4ytyy sis\xE4lt\xE4\xE4 "${u.includes}"`;
        if (u.format === "regex") return `Virheellinen sy\xF6te: t\xE4ytyy vastata s\xE4\xE4nn\xF6llist\xE4 lauseketta ${u.pattern}`;
        return `Virheellinen ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `Virheellinen luku: t\xE4ytyy olla luvun ${n.divisor} monikerta`;
      case "unrecognized_keys":
        return `${n.keys.length > 1 ? "Tuntemattomat avaimet" : "Tuntematon avain"}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return "Virheellinen avain tietueessa";
      case "invalid_union":
        return "Virheellinen unioni";
      case "invalid_element":
        return "Virheellinen arvo joukossa";
      default:
        return "Virheellinen sy\xF6te";
    }
  };
};
function m$() {
  return { localeError: f6() };
}
var h6 = () => {
  let r = { string: { unit: "caract\xE8res", verb: "avoir" }, file: { unit: "octets", verb: "avoir" }, array: { unit: "\xE9l\xE9ments", verb: "avoir" }, set: { unit: "\xE9l\xE9ments", verb: "avoir" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "nombre";
      case "object": {
        if (Array.isArray(n)) return "tableau";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "entr\xE9e", email: "adresse e-mail", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "date et heure ISO", date: "date ISO", time: "heure ISO", duration: "dur\xE9e ISO", ipv4: "adresse IPv4", ipv6: "adresse IPv6", cidrv4: "plage IPv4", cidrv6: "plage IPv6", base64: "cha\xEEne encod\xE9e en base64", base64url: "cha\xEEne encod\xE9e en base64url", json_string: "cha\xEEne JSON", e164: "num\xE9ro E.164", jwt: "JWT", template_literal: "entr\xE9e" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Entr\xE9e invalide : ${n.expected} attendu, ${o(n.input)} re\xE7u`;
      case "invalid_value":
        if (n.values.length === 1) return `Entr\xE9e invalide : ${N(n.values[0])} attendu`;
        return `Option invalide : une valeur parmi ${_(n.values, "|")} attendue`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `Trop grand : ${n.origin ?? "valeur"} doit ${i.verb} ${u}${n.maximum.toString()} ${i.unit ?? "\xE9l\xE9ment(s)"}`;
        return `Trop grand : ${n.origin ?? "valeur"} doit \xEAtre ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `Trop petit : ${n.origin} doit ${i.verb} ${u}${n.minimum.toString()} ${i.unit}`;
        return `Trop petit : ${n.origin} doit \xEAtre ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Cha\xEEne invalide : doit commencer par "${u.prefix}"`;
        if (u.format === "ends_with") return `Cha\xEEne invalide : doit se terminer par "${u.suffix}"`;
        if (u.format === "includes") return `Cha\xEEne invalide : doit inclure "${u.includes}"`;
        if (u.format === "regex") return `Cha\xEEne invalide : doit correspondre au mod\xE8le ${u.pattern}`;
        return `${$[u.format] ?? n.format} invalide`;
      }
      case "not_multiple_of":
        return `Nombre invalide : doit \xEAtre un multiple de ${n.divisor}`;
      case "unrecognized_keys":
        return `Cl\xE9${n.keys.length > 1 ? "s" : ""} non reconnue${n.keys.length > 1 ? "s" : ""} : ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Cl\xE9 invalide dans ${n.origin}`;
      case "invalid_union":
        return "Entr\xE9e invalide";
      case "invalid_element":
        return `Valeur invalide dans ${n.origin}`;
      default:
        return "Entr\xE9e invalide";
    }
  };
};
function C$() {
  return { localeError: h6() };
}
var y6 = () => {
  let r = { string: { unit: "caract\xE8res", verb: "avoir" }, file: { unit: "octets", verb: "avoir" }, array: { unit: "\xE9l\xE9ments", verb: "avoir" }, set: { unit: "\xE9l\xE9ments", verb: "avoir" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "number";
      case "object": {
        if (Array.isArray(n)) return "array";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "entr\xE9e", email: "adresse courriel", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "date-heure ISO", date: "date ISO", time: "heure ISO", duration: "dur\xE9e ISO", ipv4: "adresse IPv4", ipv6: "adresse IPv6", cidrv4: "plage IPv4", cidrv6: "plage IPv6", base64: "cha\xEEne encod\xE9e en base64", base64url: "cha\xEEne encod\xE9e en base64url", json_string: "cha\xEEne JSON", e164: "num\xE9ro E.164", jwt: "JWT", template_literal: "entr\xE9e" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Entr\xE9e invalide : attendu ${n.expected}, re\xE7u ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Entr\xE9e invalide : attendu ${N(n.values[0])}`;
        return `Option invalide : attendu l'une des valeurs suivantes ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "\u2264" : "<", i = v(n.origin);
        if (i) return `Trop grand : attendu que ${n.origin ?? "la valeur"} ait ${u}${n.maximum.toString()} ${i.unit}`;
        return `Trop grand : attendu que ${n.origin ?? "la valeur"} soit ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? "\u2265" : ">", i = v(n.origin);
        if (i) return `Trop petit : attendu que ${n.origin} ait ${u}${n.minimum.toString()} ${i.unit}`;
        return `Trop petit : attendu que ${n.origin} soit ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Cha\xEEne invalide : doit commencer par "${u.prefix}"`;
        if (u.format === "ends_with") return `Cha\xEEne invalide : doit se terminer par "${u.suffix}"`;
        if (u.format === "includes") return `Cha\xEEne invalide : doit inclure "${u.includes}"`;
        if (u.format === "regex") return `Cha\xEEne invalide : doit correspondre au motif ${u.pattern}`;
        return `${$[u.format] ?? n.format} invalide`;
      }
      case "not_multiple_of":
        return `Nombre invalide : doit \xEAtre un multiple de ${n.divisor}`;
      case "unrecognized_keys":
        return `Cl\xE9${n.keys.length > 1 ? "s" : ""} non reconnue${n.keys.length > 1 ? "s" : ""} : ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Cl\xE9 invalide dans ${n.origin}`;
      case "invalid_union":
        return "Entr\xE9e invalide";
      case "invalid_element":
        return `Valeur invalide dans ${n.origin}`;
      default:
        return "Entr\xE9e invalide";
    }
  };
};
function x$() {
  return { localeError: y6() };
}
var d6 = () => {
  let r = { string: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA", gender: "f" }, number: { label: "\u05DE\u05E1\u05E4\u05E8", gender: "m" }, boolean: { label: "\u05E2\u05E8\u05DA \u05D1\u05D5\u05DC\u05D9\u05D0\u05E0\u05D9", gender: "m" }, bigint: { label: "BigInt", gender: "m" }, date: { label: "\u05EA\u05D0\u05E8\u05D9\u05DA", gender: "m" }, array: { label: "\u05DE\u05E2\u05E8\u05DA", gender: "m" }, object: { label: "\u05D0\u05D5\u05D1\u05D9\u05D9\u05E7\u05D8", gender: "m" }, null: { label: "\u05E2\u05E8\u05DA \u05E8\u05D9\u05E7 (null)", gender: "m" }, undefined: { label: "\u05E2\u05E8\u05DA \u05DC\u05D0 \u05DE\u05D5\u05D2\u05D3\u05E8 (undefined)", gender: "m" }, symbol: { label: "\u05E1\u05D9\u05DE\u05D1\u05D5\u05DC (Symbol)", gender: "m" }, function: { label: "\u05E4\u05D5\u05E0\u05E7\u05E6\u05D9\u05D4", gender: "f" }, map: { label: "\u05DE\u05E4\u05D4 (Map)", gender: "f" }, set: { label: "\u05E7\u05D1\u05D5\u05E6\u05D4 (Set)", gender: "f" }, file: { label: "\u05E7\u05D5\u05D1\u05E5", gender: "m" }, promise: { label: "Promise", gender: "m" }, NaN: { label: "NaN", gender: "m" }, unknown: { label: "\u05E2\u05E8\u05DA \u05DC\u05D0 \u05D9\u05D3\u05D5\u05E2", gender: "m" }, value: { label: "\u05E2\u05E8\u05DA", gender: "m" } }, v = { string: { unit: "\u05EA\u05D5\u05D5\u05D9\u05DD", shortLabel: "\u05E7\u05E6\u05E8", longLabel: "\u05D0\u05E8\u05D5\u05DA" }, file: { unit: "\u05D1\u05D9\u05D9\u05D8\u05D9\u05DD", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" }, array: { unit: "\u05E4\u05E8\u05D9\u05D8\u05D9\u05DD", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" }, set: { unit: "\u05E4\u05E8\u05D9\u05D8\u05D9\u05DD", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" }, number: { unit: "", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" } }, o = (b) => b ? r[b] : void 0, $ = (b) => {
    let U = o(b);
    if (U) return U.label;
    return b ?? r.unknown.label;
  }, n = (b) => `\u05D4${$(b)}`, u = (b) => {
    return (o(b)?.gender ?? "m") === "f" ? "\u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05D9\u05D5\u05EA" : "\u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA";
  }, i = (b) => {
    if (!b) return null;
    return v[b] ?? null;
  }, g = (b) => {
    let U = typeof b;
    switch (U) {
      case "number":
        return Number.isNaN(b) ? "NaN" : "number";
      case "object": {
        if (Array.isArray(b)) return "array";
        if (b === null) return "null";
        if (Object.getPrototypeOf(b) !== Object.prototype && b.constructor) return b.constructor.name;
        return "object";
      }
      default:
        return U;
    }
  }, I = { regex: { label: "\u05E7\u05DC\u05D8", gender: "m" }, email: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D0\u05D9\u05DE\u05D9\u05D9\u05DC", gender: "f" }, url: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05E8\u05E9\u05EA", gender: "f" }, emoji: { label: "\u05D0\u05D9\u05DE\u05D5\u05D2'\u05D9", gender: "m" }, uuid: { label: "UUID", gender: "m" }, nanoid: { label: "nanoid", gender: "m" }, guid: { label: "GUID", gender: "m" }, cuid: { label: "cuid", gender: "m" }, cuid2: { label: "cuid2", gender: "m" }, ulid: { label: "ULID", gender: "m" }, xid: { label: "XID", gender: "m" }, ksuid: { label: "KSUID", gender: "m" }, datetime: { label: "\u05EA\u05D0\u05E8\u05D9\u05DA \u05D5\u05D6\u05DE\u05DF ISO", gender: "m" }, date: { label: "\u05EA\u05D0\u05E8\u05D9\u05DA ISO", gender: "m" }, time: { label: "\u05D6\u05DE\u05DF ISO", gender: "m" }, duration: { label: "\u05DE\u05E9\u05DA \u05D6\u05DE\u05DF ISO", gender: "m" }, ipv4: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA IPv4", gender: "f" }, ipv6: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA IPv6", gender: "f" }, cidrv4: { label: "\u05D8\u05D5\u05D5\u05D7 IPv4", gender: "m" }, cidrv6: { label: "\u05D8\u05D5\u05D5\u05D7 IPv6", gender: "m" }, base64: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D1\u05D1\u05E1\u05D9\u05E1 64", gender: "f" }, base64url: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D1\u05D1\u05E1\u05D9\u05E1 64 \u05DC\u05DB\u05EA\u05D5\u05D1\u05D5\u05EA \u05E8\u05E9\u05EA", gender: "f" }, json_string: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA JSON", gender: "f" }, e164: { label: "\u05DE\u05E1\u05E4\u05E8 E.164", gender: "m" }, jwt: { label: "JWT", gender: "m" }, ends_with: { label: "\u05E7\u05DC\u05D8", gender: "m" }, includes: { label: "\u05E7\u05DC\u05D8", gender: "m" }, lowercase: { label: "\u05E7\u05DC\u05D8", gender: "m" }, starts_with: { label: "\u05E7\u05DC\u05D8", gender: "m" }, uppercase: { label: "\u05E7\u05DC\u05D8", gender: "m" } };
  return (b) => {
    switch (b.code) {
      case "invalid_type": {
        let U = b.expected, w = $(U), D = g(b.input), j = r[D]?.label ?? D;
        return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${w}, \u05D4\u05EA\u05E7\u05D1\u05DC ${j}`;
      }
      case "invalid_value": {
        if (b.values.length === 1) return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05E2\u05E8\u05DA \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D9\u05D5\u05EA ${N(b.values[0])}`;
        let U = b.values.map((j) => N(j));
        if (b.values.length === 2) return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05D0\u05E4\u05E9\u05E8\u05D5\u05D9\u05D5\u05EA \u05D4\u05DE\u05EA\u05D0\u05D9\u05DE\u05D5\u05EA \u05D4\u05DF ${U[0]} \u05D0\u05D5 ${U[1]}`;
        let w = U[U.length - 1];
        return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05D0\u05E4\u05E9\u05E8\u05D5\u05D9\u05D5\u05EA \u05D4\u05DE\u05EA\u05D0\u05D9\u05DE\u05D5\u05EA \u05D4\u05DF ${U.slice(0, -1).join(", ")} \u05D0\u05D5 ${w}`;
      }
      case "too_big": {
        let U = i(b.origin), w = n(b.origin ?? "value");
        if (b.origin === "string") return `${U?.longLabel ?? "\u05D0\u05E8\u05D5\u05DA"} \u05DE\u05D3\u05D9: ${w} \u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05DB\u05D9\u05DC ${b.maximum.toString()} ${U?.unit ?? ""} ${b.inclusive ? "\u05D0\u05D5 \u05E4\u05D7\u05D5\u05EA" : "\u05DC\u05DB\u05DC \u05D4\u05D9\u05D5\u05EA\u05E8"}`.trim();
        if (b.origin === "number") {
          let J = b.inclusive ? `\u05E7\u05D8\u05DF \u05D0\u05D5 \u05E9\u05D5\u05D5\u05D4 \u05DC-${b.maximum}` : `\u05E7\u05D8\u05DF \u05DE-${b.maximum}`;
          return `\u05D2\u05D3\u05D5\u05DC \u05DE\u05D3\u05D9: ${w} \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${J}`;
        }
        if (b.origin === "array" || b.origin === "set") {
          let J = b.origin === "set" ? "\u05E6\u05E8\u05D9\u05DB\u05D4" : "\u05E6\u05E8\u05D9\u05DA", T = b.inclusive ? `${b.maximum} ${U?.unit ?? ""} \u05D0\u05D5 \u05E4\u05D7\u05D5\u05EA` : `\u05E4\u05D7\u05D5\u05EA \u05DE-${b.maximum} ${U?.unit ?? ""}`;
          return `\u05D2\u05D3\u05D5\u05DC \u05DE\u05D3\u05D9: ${w} ${J} \u05DC\u05D4\u05DB\u05D9\u05DC ${T}`.trim();
        }
        let D = b.inclusive ? "<=" : "<", j = u(b.origin ?? "value");
        if (U?.unit) return `${U.longLabel} \u05DE\u05D3\u05D9: ${w} ${j} ${D}${b.maximum.toString()} ${U.unit}`;
        return `${U?.longLabel ?? "\u05D2\u05D3\u05D5\u05DC"} \u05DE\u05D3\u05D9: ${w} ${j} ${D}${b.maximum.toString()}`;
      }
      case "too_small": {
        let U = i(b.origin), w = n(b.origin ?? "value");
        if (b.origin === "string") return `${U?.shortLabel ?? "\u05E7\u05E6\u05E8"} \u05DE\u05D3\u05D9: ${w} \u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05DB\u05D9\u05DC ${b.minimum.toString()} ${U?.unit ?? ""} ${b.inclusive ? "\u05D0\u05D5 \u05D9\u05D5\u05EA\u05E8" : "\u05DC\u05E4\u05D7\u05D5\u05EA"}`.trim();
        if (b.origin === "number") {
          let J = b.inclusive ? `\u05D2\u05D3\u05D5\u05DC \u05D0\u05D5 \u05E9\u05D5\u05D5\u05D4 \u05DC-${b.minimum}` : `\u05D2\u05D3\u05D5\u05DC \u05DE-${b.minimum}`;
          return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${w} \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${J}`;
        }
        if (b.origin === "array" || b.origin === "set") {
          let J = b.origin === "set" ? "\u05E6\u05E8\u05D9\u05DB\u05D4" : "\u05E6\u05E8\u05D9\u05DA";
          if (b.minimum === 1 && b.inclusive) {
            let Vn = b.origin === "set" ? "\u05DC\u05E4\u05D7\u05D5\u05EA \u05E4\u05E8\u05D9\u05D8 \u05D0\u05D7\u05D3" : "\u05DC\u05E4\u05D7\u05D5\u05EA \u05E4\u05E8\u05D9\u05D8 \u05D0\u05D7\u05D3";
            return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${w} ${J} \u05DC\u05D4\u05DB\u05D9\u05DC ${Vn}`;
          }
          let T = b.inclusive ? `${b.minimum} ${U?.unit ?? ""} \u05D0\u05D5 \u05D9\u05D5\u05EA\u05E8` : `\u05D9\u05D5\u05EA\u05E8 \u05DE-${b.minimum} ${U?.unit ?? ""}`;
          return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${w} ${J} \u05DC\u05D4\u05DB\u05D9\u05DC ${T}`.trim();
        }
        let D = b.inclusive ? ">=" : ">", j = u(b.origin ?? "value");
        if (U?.unit) return `${U.shortLabel} \u05DE\u05D3\u05D9: ${w} ${j} ${D}${b.minimum.toString()} ${U.unit}`;
        return `${U?.shortLabel ?? "\u05E7\u05D8\u05DF"} \u05DE\u05D3\u05D9: ${w} ${j} ${D}${b.minimum.toString()}`;
      }
      case "invalid_format": {
        let U = b;
        if (U.format === "starts_with") return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05EA\u05D7\u05D9\u05DC \u05D1 "${U.prefix}"`;
        if (U.format === "ends_with") return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05E1\u05EA\u05D9\u05D9\u05DD \u05D1 "${U.suffix}"`;
        if (U.format === "includes") return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05DB\u05DC\u05D5\u05DC "${U.includes}"`;
        if (U.format === "regex") return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05EA\u05D0\u05D9\u05DD \u05DC\u05EA\u05D1\u05E0\u05D9\u05EA ${U.pattern}`;
        let w = I[U.format], D = w?.label ?? U.format, J = (w?.gender ?? "m") === "f" ? "\u05EA\u05E7\u05D9\u05E0\u05D4" : "\u05EA\u05E7\u05D9\u05DF";
        return `${D} \u05DC\u05D0 ${J}`;
      }
      case "not_multiple_of":
        return `\u05DE\u05E1\u05E4\u05E8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D9\u05D5\u05EA \u05DE\u05DB\u05E4\u05DC\u05D4 \u05E9\u05DC ${b.divisor}`;
      case "unrecognized_keys":
        return `\u05DE\u05E4\u05EA\u05D7${b.keys.length > 1 ? "\u05D5\u05EA" : ""} \u05DC\u05D0 \u05DE\u05D6\u05D5\u05D4${b.keys.length > 1 ? "\u05D9\u05DD" : "\u05D4"}: ${_(b.keys, ", ")}`;
      case "invalid_key":
        return "\u05E9\u05D3\u05D4 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF \u05D1\u05D0\u05D5\u05D1\u05D9\u05D9\u05E7\u05D8";
      case "invalid_union":
        return "\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF";
      case "invalid_element":
        return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF \u05D1${n(b.origin ?? "array")}`;
      default:
        return "\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF";
    }
  };
};
function f$() {
  return { localeError: d6() };
}
var p6 = () => {
  let r = { string: { unit: "karakter", verb: "legyen" }, file: { unit: "byte", verb: "legyen" }, array: { unit: "elem", verb: "legyen" }, set: { unit: "elem", verb: "legyen" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "sz\xE1m";
      case "object": {
        if (Array.isArray(n)) return "t\xF6mb";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "bemenet", email: "email c\xEDm", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO id\u0151b\xE9lyeg", date: "ISO d\xE1tum", time: "ISO id\u0151", duration: "ISO id\u0151intervallum", ipv4: "IPv4 c\xEDm", ipv6: "IPv6 c\xEDm", cidrv4: "IPv4 tartom\xE1ny", cidrv6: "IPv6 tartom\xE1ny", base64: "base64-k\xF3dolt string", base64url: "base64url-k\xF3dolt string", json_string: "JSON string", e164: "E.164 sz\xE1m", jwt: "JWT", template_literal: "bemenet" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k ${n.expected}, a kapott \xE9rt\xE9k ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k ${N(n.values[0])}`;
        return `\xC9rv\xE9nytelen opci\xF3: valamelyik \xE9rt\xE9k v\xE1rt ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `T\xFAl nagy: ${n.origin ?? "\xE9rt\xE9k"} m\xE9rete t\xFAl nagy ${u}${n.maximum.toString()} ${i.unit ?? "elem"}`;
        return `T\xFAl nagy: a bemeneti \xE9rt\xE9k ${n.origin ?? "\xE9rt\xE9k"} t\xFAl nagy: ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `T\xFAl kicsi: a bemeneti \xE9rt\xE9k ${n.origin} m\xE9rete t\xFAl kicsi ${u}${n.minimum.toString()} ${i.unit}`;
        return `T\xFAl kicsi: a bemeneti \xE9rt\xE9k ${n.origin} t\xFAl kicsi ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\xC9rv\xE9nytelen string: "${u.prefix}" \xE9rt\xE9kkel kell kezd\u0151dnie`;
        if (u.format === "ends_with") return `\xC9rv\xE9nytelen string: "${u.suffix}" \xE9rt\xE9kkel kell v\xE9gz\u0151dnie`;
        if (u.format === "includes") return `\xC9rv\xE9nytelen string: "${u.includes}" \xE9rt\xE9ket kell tartalmaznia`;
        if (u.format === "regex") return `\xC9rv\xE9nytelen string: ${u.pattern} mint\xE1nak kell megfelelnie`;
        return `\xC9rv\xE9nytelen ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `\xC9rv\xE9nytelen sz\xE1m: ${n.divisor} t\xF6bbsz\xF6r\xF6s\xE9nek kell lennie`;
      case "unrecognized_keys":
        return `Ismeretlen kulcs${n.keys.length > 1 ? "s" : ""}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `\xC9rv\xE9nytelen kulcs ${n.origin}`;
      case "invalid_union":
        return "\xC9rv\xE9nytelen bemenet";
      case "invalid_element":
        return `\xC9rv\xE9nytelen \xE9rt\xE9k: ${n.origin}`;
      default:
        return "\xC9rv\xE9nytelen bemenet";
    }
  };
};
function h$() {
  return { localeError: p6() };
}
var a6 = () => {
  let r = { string: { unit: "karakter", verb: "memiliki" }, file: { unit: "byte", verb: "memiliki" }, array: { unit: "item", verb: "memiliki" }, set: { unit: "item", verb: "memiliki" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "number";
      case "object": {
        if (Array.isArray(n)) return "array";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "input", email: "alamat email", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "tanggal dan waktu format ISO", date: "tanggal format ISO", time: "jam format ISO", duration: "durasi format ISO", ipv4: "alamat IPv4", ipv6: "alamat IPv6", cidrv4: "rentang alamat IPv4", cidrv6: "rentang alamat IPv6", base64: "string dengan enkode base64", base64url: "string dengan enkode base64url", json_string: "string JSON", e164: "angka E.164", jwt: "JWT", template_literal: "input" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Input tidak valid: diharapkan ${n.expected}, diterima ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Input tidak valid: diharapkan ${N(n.values[0])}`;
        return `Pilihan tidak valid: diharapkan salah satu dari ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `Terlalu besar: diharapkan ${n.origin ?? "value"} memiliki ${u}${n.maximum.toString()} ${i.unit ?? "elemen"}`;
        return `Terlalu besar: diharapkan ${n.origin ?? "value"} menjadi ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `Terlalu kecil: diharapkan ${n.origin} memiliki ${u}${n.minimum.toString()} ${i.unit}`;
        return `Terlalu kecil: diharapkan ${n.origin} menjadi ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `String tidak valid: harus dimulai dengan "${u.prefix}"`;
        if (u.format === "ends_with") return `String tidak valid: harus berakhir dengan "${u.suffix}"`;
        if (u.format === "includes") return `String tidak valid: harus menyertakan "${u.includes}"`;
        if (u.format === "regex") return `String tidak valid: harus sesuai pola ${u.pattern}`;
        return `${$[u.format] ?? n.format} tidak valid`;
      }
      case "not_multiple_of":
        return `Angka tidak valid: harus kelipatan dari ${n.divisor}`;
      case "unrecognized_keys":
        return `Kunci tidak dikenali ${n.keys.length > 1 ? "s" : ""}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Kunci tidak valid di ${n.origin}`;
      case "invalid_union":
        return "Input tidak valid";
      case "invalid_element":
        return `Nilai tidak valid di ${n.origin}`;
      default:
        return "Input tidak valid";
    }
  };
};
function y$() {
  return { localeError: a6() };
}
var s6 = (r) => {
  let v = typeof r;
  switch (v) {
    case "number":
      return Number.isNaN(r) ? "NaN" : "n\xFAmer";
    case "object": {
      if (Array.isArray(r)) return "fylki";
      if (r === null) return "null";
      if (Object.getPrototypeOf(r) !== Object.prototype && r.constructor) return r.constructor.name;
    }
  }
  return v;
};
var rl = () => {
  let r = { string: { unit: "stafi", verb: "a\xF0 hafa" }, file: { unit: "b\xE6ti", verb: "a\xF0 hafa" }, array: { unit: "hluti", verb: "a\xF0 hafa" }, set: { unit: "hluti", verb: "a\xF0 hafa" } };
  function v($) {
    return r[$] ?? null;
  }
  let o = { regex: "gildi", email: "netfang", url: "vefsl\xF3\xF0", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO dagsetning og t\xEDmi", date: "ISO dagsetning", time: "ISO t\xEDmi", duration: "ISO t\xEDmalengd", ipv4: "IPv4 address", ipv6: "IPv6 address", cidrv4: "IPv4 range", cidrv6: "IPv6 range", base64: "base64-encoded strengur", base64url: "base64url-encoded strengur", json_string: "JSON strengur", e164: "E.164 t\xF6lugildi", jwt: "JWT", template_literal: "gildi" };
  return ($) => {
    switch ($.code) {
      case "invalid_type":
        return `Rangt gildi: \xDE\xFA sl\xF3st inn ${s6($.input)} \xFEar sem \xE1 a\xF0 vera ${$.expected}`;
      case "invalid_value":
        if ($.values.length === 1) return `Rangt gildi: gert r\xE1\xF0 fyrir ${N($.values[0])}`;
        return `\xD3gilt val: m\xE1 vera eitt af eftirfarandi ${_($.values, "|")}`;
      case "too_big": {
        let n = $.inclusive ? "<=" : "<", u = v($.origin);
        if (u) return `Of st\xF3rt: gert er r\xE1\xF0 fyrir a\xF0 ${$.origin ?? "gildi"} hafi ${n}${$.maximum.toString()} ${u.unit ?? "hluti"}`;
        return `Of st\xF3rt: gert er r\xE1\xF0 fyrir a\xF0 ${$.origin ?? "gildi"} s\xE9 ${n}${$.maximum.toString()}`;
      }
      case "too_small": {
        let n = $.inclusive ? ">=" : ">", u = v($.origin);
        if (u) return `Of l\xEDti\xF0: gert er r\xE1\xF0 fyrir a\xF0 ${$.origin} hafi ${n}${$.minimum.toString()} ${u.unit}`;
        return `Of l\xEDti\xF0: gert er r\xE1\xF0 fyrir a\xF0 ${$.origin} s\xE9 ${n}${$.minimum.toString()}`;
      }
      case "invalid_format": {
        let n = $;
        if (n.format === "starts_with") return `\xD3gildur strengur: ver\xF0ur a\xF0 byrja \xE1 "${n.prefix}"`;
        if (n.format === "ends_with") return `\xD3gildur strengur: ver\xF0ur a\xF0 enda \xE1 "${n.suffix}"`;
        if (n.format === "includes") return `\xD3gildur strengur: ver\xF0ur a\xF0 innihalda "${n.includes}"`;
        if (n.format === "regex") return `\xD3gildur strengur: ver\xF0ur a\xF0 fylgja mynstri ${n.pattern}`;
        return `Rangt ${o[n.format] ?? $.format}`;
      }
      case "not_multiple_of":
        return `R\xF6ng tala: ver\xF0ur a\xF0 vera margfeldi af ${$.divisor}`;
      case "unrecognized_keys":
        return `\xD3\xFEekkt ${$.keys.length > 1 ? "ir lyklar" : "ur lykill"}: ${_($.keys, ", ")}`;
      case "invalid_key":
        return `Rangur lykill \xED ${$.origin}`;
      case "invalid_union":
        return "Rangt gildi";
      case "invalid_element":
        return `Rangt gildi \xED ${$.origin}`;
      default:
        return "Rangt gildi";
    }
  };
};
function d$() {
  return { localeError: rl() };
}
var nl = () => {
  let r = { string: { unit: "caratteri", verb: "avere" }, file: { unit: "byte", verb: "avere" }, array: { unit: "elementi", verb: "avere" }, set: { unit: "elementi", verb: "avere" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "numero";
      case "object": {
        if (Array.isArray(n)) return "vettore";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "input", email: "indirizzo email", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "data e ora ISO", date: "data ISO", time: "ora ISO", duration: "durata ISO", ipv4: "indirizzo IPv4", ipv6: "indirizzo IPv6", cidrv4: "intervallo IPv4", cidrv6: "intervallo IPv6", base64: "stringa codificata in base64", base64url: "URL codificata in base64", json_string: "stringa JSON", e164: "numero E.164", jwt: "JWT", template_literal: "input" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Input non valido: atteso ${n.expected}, ricevuto ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Input non valido: atteso ${N(n.values[0])}`;
        return `Opzione non valida: atteso uno tra ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `Troppo grande: ${n.origin ?? "valore"} deve avere ${u}${n.maximum.toString()} ${i.unit ?? "elementi"}`;
        return `Troppo grande: ${n.origin ?? "valore"} deve essere ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `Troppo piccolo: ${n.origin} deve avere ${u}${n.minimum.toString()} ${i.unit}`;
        return `Troppo piccolo: ${n.origin} deve essere ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Stringa non valida: deve iniziare con "${u.prefix}"`;
        if (u.format === "ends_with") return `Stringa non valida: deve terminare con "${u.suffix}"`;
        if (u.format === "includes") return `Stringa non valida: deve includere "${u.includes}"`;
        if (u.format === "regex") return `Stringa non valida: deve corrispondere al pattern ${u.pattern}`;
        return `Invalid ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `Numero non valido: deve essere un multiplo di ${n.divisor}`;
      case "unrecognized_keys":
        return `Chiav${n.keys.length > 1 ? "i" : "e"} non riconosciut${n.keys.length > 1 ? "e" : "a"}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Chiave non valida in ${n.origin}`;
      case "invalid_union":
        return "Input non valido";
      case "invalid_element":
        return `Valore non valido in ${n.origin}`;
      default:
        return "Input non valido";
    }
  };
};
function p$() {
  return { localeError: nl() };
}
var vl = () => {
  let r = { string: { unit: "\u6587\u5B57", verb: "\u3067\u3042\u308B" }, file: { unit: "\u30D0\u30A4\u30C8", verb: "\u3067\u3042\u308B" }, array: { unit: "\u8981\u7D20", verb: "\u3067\u3042\u308B" }, set: { unit: "\u8981\u7D20", verb: "\u3067\u3042\u308B" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "\u6570\u5024";
      case "object": {
        if (Array.isArray(n)) return "\u914D\u5217";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u5165\u529B\u5024", email: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9", url: "URL", emoji: "\u7D75\u6587\u5B57", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO\u65E5\u6642", date: "ISO\u65E5\u4ED8", time: "ISO\u6642\u523B", duration: "ISO\u671F\u9593", ipv4: "IPv4\u30A2\u30C9\u30EC\u30B9", ipv6: "IPv6\u30A2\u30C9\u30EC\u30B9", cidrv4: "IPv4\u7BC4\u56F2", cidrv6: "IPv6\u7BC4\u56F2", base64: "base64\u30A8\u30F3\u30B3\u30FC\u30C9\u6587\u5B57\u5217", base64url: "base64url\u30A8\u30F3\u30B3\u30FC\u30C9\u6587\u5B57\u5217", json_string: "JSON\u6587\u5B57\u5217", e164: "E.164\u756A\u53F7", jwt: "JWT", template_literal: "\u5165\u529B\u5024" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u7121\u52B9\u306A\u5165\u529B: ${n.expected}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F\u304C\u3001${o(n.input)}\u304C\u5165\u529B\u3055\u308C\u307E\u3057\u305F`;
      case "invalid_value":
        if (n.values.length === 1) return `\u7121\u52B9\u306A\u5165\u529B: ${N(n.values[0])}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F`;
        return `\u7121\u52B9\u306A\u9078\u629E: ${_(n.values, "\u3001")}\u306E\u3044\u305A\u308C\u304B\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      case "too_big": {
        let u = n.inclusive ? "\u4EE5\u4E0B\u3067\u3042\u308B" : "\u3088\u308A\u5C0F\u3055\u3044", i = v(n.origin);
        if (i) return `\u5927\u304D\u3059\u304E\u308B\u5024: ${n.origin ?? "\u5024"}\u306F${n.maximum.toString()}${i.unit ?? "\u8981\u7D20"}${u}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        return `\u5927\u304D\u3059\u304E\u308B\u5024: ${n.origin ?? "\u5024"}\u306F${n.maximum.toString()}${u}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      }
      case "too_small": {
        let u = n.inclusive ? "\u4EE5\u4E0A\u3067\u3042\u308B" : "\u3088\u308A\u5927\u304D\u3044", i = v(n.origin);
        if (i) return `\u5C0F\u3055\u3059\u304E\u308B\u5024: ${n.origin}\u306F${n.minimum.toString()}${i.unit}${u}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        return `\u5C0F\u3055\u3059\u304E\u308B\u5024: ${n.origin}\u306F${n.minimum.toString()}${u}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${u.prefix}"\u3067\u59CB\u307E\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        if (u.format === "ends_with") return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${u.suffix}"\u3067\u7D42\u308F\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        if (u.format === "includes") return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${u.includes}"\u3092\u542B\u3080\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        if (u.format === "regex") return `\u7121\u52B9\u306A\u6587\u5B57\u5217: \u30D1\u30BF\u30FC\u30F3${u.pattern}\u306B\u4E00\u81F4\u3059\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        return `\u7121\u52B9\u306A${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `\u7121\u52B9\u306A\u6570\u5024: ${n.divisor}\u306E\u500D\u6570\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      case "unrecognized_keys":
        return `\u8A8D\u8B58\u3055\u308C\u3066\u3044\u306A\u3044\u30AD\u30FC${n.keys.length > 1 ? "\u7FA4" : ""}: ${_(n.keys, "\u3001")}`;
      case "invalid_key":
        return `${n.origin}\u5185\u306E\u7121\u52B9\u306A\u30AD\u30FC`;
      case "invalid_union":
        return "\u7121\u52B9\u306A\u5165\u529B";
      case "invalid_element":
        return `${n.origin}\u5185\u306E\u7121\u52B9\u306A\u5024`;
      default:
        return "\u7121\u52B9\u306A\u5165\u529B";
    }
  };
};
function a$() {
  return { localeError: vl() };
}
var ol = (r) => {
  let v = typeof r;
  switch (v) {
    case "number":
      return Number.isNaN(r) ? "NaN" : "\u10E0\u10D8\u10EA\u10EE\u10D5\u10D8";
    case "object": {
      if (Array.isArray(r)) return "\u10DB\u10D0\u10E1\u10D8\u10D5\u10D8";
      if (r === null) return "null";
      if (Object.getPrototypeOf(r) !== Object.prototype && r.constructor) return r.constructor.name;
    }
  }
  return { string: "\u10E1\u10E2\u10E0\u10D8\u10DC\u10D2\u10D8", boolean: "\u10D1\u10E3\u10DA\u10D4\u10D0\u10DC\u10D8", undefined: "undefined", bigint: "bigint", symbol: "symbol", function: "\u10E4\u10E3\u10DC\u10E5\u10EA\u10D8\u10D0" }[v] ?? v;
};
var ul = () => {
  let r = { string: { unit: "\u10E1\u10D8\u10DB\u10D1\u10DD\u10DA\u10DD", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" }, file: { unit: "\u10D1\u10D0\u10D8\u10E2\u10D8", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" }, array: { unit: "\u10D4\u10DA\u10D4\u10DB\u10D4\u10DC\u10E2\u10D8", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" }, set: { unit: "\u10D4\u10DA\u10D4\u10DB\u10D4\u10DC\u10E2\u10D8", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" } };
  function v($) {
    return r[$] ?? null;
  }
  let o = { regex: "\u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0", email: "\u10D4\u10DA-\u10E4\u10DD\u10E1\u10E2\u10D8\u10E1 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8", url: "URL", emoji: "\u10D4\u10DB\u10DD\u10EF\u10D8", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8-\u10D3\u10E0\u10DD", date: "\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8", time: "\u10D3\u10E0\u10DD", duration: "\u10EE\u10D0\u10DC\u10D2\u10E0\u10EB\u10DA\u10D8\u10D5\u10DD\u10D1\u10D0", ipv4: "IPv4 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8", ipv6: "IPv6 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8", cidrv4: "IPv4 \u10D3\u10D8\u10D0\u10DE\u10D0\u10D6\u10DD\u10DC\u10D8", cidrv6: "IPv6 \u10D3\u10D8\u10D0\u10DE\u10D0\u10D6\u10DD\u10DC\u10D8", base64: "base64-\u10D9\u10DD\u10D3\u10D8\u10E0\u10D4\u10D1\u10E3\u10DA\u10D8 \u10E1\u10E2\u10E0\u10D8\u10DC\u10D2\u10D8", base64url: "base64url-\u10D9\u10DD\u10D3\u10D8\u10E0\u10D4\u10D1\u10E3\u10DA\u10D8 \u10E1\u10E2\u10E0\u10D8\u10DC\u10D2\u10D8", json_string: "JSON \u10E1\u10E2\u10E0\u10D8\u10DC\u10D2\u10D8", e164: "E.164 \u10DC\u10DD\u10DB\u10D4\u10E0\u10D8", jwt: "JWT", template_literal: "\u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0" };
  return ($) => {
    switch ($.code) {
      case "invalid_type":
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${$.expected}, \u10DB\u10D8\u10E6\u10D4\u10D1\u10E3\u10DA\u10D8 ${ol($.input)}`;
      case "invalid_value":
        if ($.values.length === 1) return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${N($.values[0])}`;
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D0\u10E0\u10D8\u10D0\u10DC\u10E2\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8\u10D0 \u10D4\u10E0\u10D7-\u10D4\u10E0\u10D7\u10D8 ${_($.values, "|")}-\u10D3\u10D0\u10DC`;
      case "too_big": {
        let n = $.inclusive ? "<=" : "<", u = v($.origin);
        if (u) return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10D3\u10D8\u10D3\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${$.origin ?? "\u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0"} ${u.verb} ${n}${$.maximum.toString()} ${u.unit}`;
        return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10D3\u10D8\u10D3\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${$.origin ?? "\u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0"} \u10D8\u10E7\u10DD\u10E1 ${n}${$.maximum.toString()}`;
      }
      case "too_small": {
        let n = $.inclusive ? ">=" : ">", u = v($.origin);
        if (u) return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10DE\u10D0\u10E2\u10D0\u10E0\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${$.origin} ${u.verb} ${n}${$.minimum.toString()} ${u.unit}`;
        return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10DE\u10D0\u10E2\u10D0\u10E0\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${$.origin} \u10D8\u10E7\u10DD\u10E1 ${n}${$.minimum.toString()}`;
      }
      case "invalid_format": {
        let n = $;
        if (n.format === "starts_with") return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E1\u10E2\u10E0\u10D8\u10DC\u10D2\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10D8\u10EC\u10E7\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 "${n.prefix}"-\u10D8\u10D7`;
        if (n.format === "ends_with") return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E1\u10E2\u10E0\u10D8\u10DC\u10D2\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10DB\u10D7\u10D0\u10D5\u10E0\u10D3\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 "${n.suffix}"-\u10D8\u10D7`;
        if (n.format === "includes") return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E1\u10E2\u10E0\u10D8\u10DC\u10D2\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1 "${n.includes}"-\u10E1`;
        if (n.format === "regex") return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E1\u10E2\u10E0\u10D8\u10DC\u10D2\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D4\u10E1\u10D0\u10D1\u10D0\u10DB\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 \u10E8\u10D0\u10D1\u10DA\u10DD\u10DC\u10E1 ${n.pattern}`;
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 ${o[n.format] ?? $.format}`;
      }
      case "not_multiple_of":
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E0\u10D8\u10EA\u10EE\u10D5\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10D8\u10E7\u10DD\u10E1 ${$.divisor}-\u10D8\u10E1 \u10EF\u10D4\u10E0\u10D0\u10D3\u10D8`;
      case "unrecognized_keys":
        return `\u10E3\u10EA\u10DC\u10DD\u10D1\u10D8 \u10D2\u10D0\u10E1\u10D0\u10E6\u10D4\u10D1${$.keys.length > 1 ? "\u10D4\u10D1\u10D8" : "\u10D8"}: ${_($.keys, ", ")}`;
      case "invalid_key":
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D2\u10D0\u10E1\u10D0\u10E6\u10D4\u10D1\u10D8 ${$.origin}-\u10E8\u10D8`;
      case "invalid_union":
        return "\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0";
      case "invalid_element":
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0 ${$.origin}-\u10E8\u10D8`;
      default:
        return "\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0";
    }
  };
};
function s$() {
  return { localeError: ul() };
}
var $l = () => {
  let r = { string: { unit: "\u178F\u17BD\u17A2\u1780\u17D2\u179F\u179A", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" }, file: { unit: "\u1794\u17C3", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" }, array: { unit: "\u1792\u17B6\u178F\u17BB", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" }, set: { unit: "\u1792\u17B6\u178F\u17BB", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "\u1798\u17B7\u1793\u1798\u17C2\u1793\u1787\u17B6\u179B\u17C1\u1781 (NaN)" : "\u179B\u17C1\u1781";
      case "object": {
        if (Array.isArray(n)) return "\u17A2\u17B6\u179A\u17C1 (Array)";
        if (n === null) return "\u1782\u17D2\u1798\u17B6\u1793\u178F\u1798\u17D2\u179B\u17C3 (null)";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B", email: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793\u17A2\u17CA\u17B8\u1798\u17C2\u179B", url: "URL", emoji: "\u179F\u1789\u17D2\u1789\u17B6\u17A2\u17B6\u179A\u1798\u17D2\u1798\u178E\u17CD", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "\u1780\u17B6\u179B\u1794\u179A\u17B7\u1785\u17D2\u1786\u17C1\u1791 \u1793\u17B7\u1784\u1798\u17C9\u17C4\u1784 ISO", date: "\u1780\u17B6\u179B\u1794\u179A\u17B7\u1785\u17D2\u1786\u17C1\u1791 ISO", time: "\u1798\u17C9\u17C4\u1784 ISO", duration: "\u179A\u1799\u17C8\u1796\u17C1\u179B ISO", ipv4: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv4", ipv6: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv6", cidrv4: "\u178A\u17C2\u1793\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv4", cidrv6: "\u178A\u17C2\u1793\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv6", base64: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u17A2\u17CA\u17B7\u1780\u17BC\u178A base64", base64url: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u17A2\u17CA\u17B7\u1780\u17BC\u178A base64url", json_string: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A JSON", e164: "\u179B\u17C1\u1781 E.164", jwt: "JWT", template_literal: "\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${n.expected} \u1794\u17C9\u17BB\u1793\u17D2\u178F\u17C2\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793 ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${N(n.values[0])}`;
        return `\u1787\u1798\u17D2\u179A\u17BE\u179F\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1787\u17B6\u1798\u17BD\u1799\u1780\u17D2\u1793\u17BB\u1784\u1785\u17C6\u178E\u17C4\u1798 ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `\u1792\u17C6\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${n.origin ?? "\u178F\u1798\u17D2\u179B\u17C3"} ${u} ${n.maximum.toString()} ${i.unit ?? "\u1792\u17B6\u178F\u17BB"}`;
        return `\u1792\u17C6\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${n.origin ?? "\u178F\u1798\u17D2\u179B\u17C3"} ${u} ${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `\u178F\u17BC\u1785\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${n.origin} ${u} ${n.minimum.toString()} ${i.unit}`;
        return `\u178F\u17BC\u1785\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${n.origin} ${u} ${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1785\u17B6\u1794\u17CB\u1795\u17D2\u178F\u17BE\u1798\u178A\u17C4\u1799 "${u.prefix}"`;
        if (u.format === "ends_with") return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1794\u1789\u17D2\u1785\u1794\u17CB\u178A\u17C4\u1799 "${u.suffix}"`;
        if (u.format === "includes") return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1798\u17B6\u1793 "${u.includes}"`;
        if (u.format === "regex") return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u178F\u17C2\u1795\u17D2\u1782\u17BC\u1795\u17D2\u1782\u1784\u1793\u17B9\u1784\u1791\u1798\u17D2\u179A\u1784\u17CB\u178A\u17C2\u179B\u1794\u17B6\u1793\u1780\u17C6\u178E\u178F\u17CB ${u.pattern}`;
        return `\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `\u179B\u17C1\u1781\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u178F\u17C2\u1787\u17B6\u1796\u17A0\u17BB\u1782\u17BB\u178E\u1793\u17C3 ${n.divisor}`;
      case "unrecognized_keys":
        return `\u179A\u1780\u1783\u17BE\u1789\u179F\u17C4\u1798\u17B7\u1793\u179F\u17D2\u1782\u17B6\u179B\u17CB\u17D6 ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `\u179F\u17C4\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u1793\u17C5\u1780\u17D2\u1793\u17BB\u1784 ${n.origin}`;
      case "invalid_union":
        return "\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C";
      case "invalid_element":
        return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u1793\u17C5\u1780\u17D2\u1793\u17BB\u1784 ${n.origin}`;
      default:
        return "\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C";
    }
  };
};
function Un() {
  return { localeError: $l() };
}
function ri() {
  return Un();
}
var il = () => {
  let r = { string: { unit: "\uBB38\uC790", verb: "to have" }, file: { unit: "\uBC14\uC774\uD2B8", verb: "to have" }, array: { unit: "\uAC1C", verb: "to have" }, set: { unit: "\uAC1C", verb: "to have" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "number";
      case "object": {
        if (Array.isArray(n)) return "array";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\uC785\uB825", email: "\uC774\uBA54\uC77C \uC8FC\uC18C", url: "URL", emoji: "\uC774\uBAA8\uC9C0", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO \uB0A0\uC9DC\uC2DC\uAC04", date: "ISO \uB0A0\uC9DC", time: "ISO \uC2DC\uAC04", duration: "ISO \uAE30\uAC04", ipv4: "IPv4 \uC8FC\uC18C", ipv6: "IPv6 \uC8FC\uC18C", cidrv4: "IPv4 \uBC94\uC704", cidrv6: "IPv6 \uBC94\uC704", base64: "base64 \uC778\uCF54\uB529 \uBB38\uC790\uC5F4", base64url: "base64url \uC778\uCF54\uB529 \uBB38\uC790\uC5F4", json_string: "JSON \uBB38\uC790\uC5F4", e164: "E.164 \uBC88\uD638", jwt: "JWT", template_literal: "\uC785\uB825" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\uC798\uBABB\uB41C \uC785\uB825: \uC608\uC0C1 \uD0C0\uC785\uC740 ${n.expected}, \uBC1B\uC740 \uD0C0\uC785\uC740 ${o(n.input)}\uC785\uB2C8\uB2E4`;
      case "invalid_value":
        if (n.values.length === 1) return `\uC798\uBABB\uB41C \uC785\uB825: \uAC12\uC740 ${N(n.values[0])} \uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4`;
        return `\uC798\uBABB\uB41C \uC635\uC158: ${_(n.values, "\uB610\uB294 ")} \uC911 \uD558\uB098\uC5EC\uC57C \uD569\uB2C8\uB2E4`;
      case "too_big": {
        let u = n.inclusive ? "\uC774\uD558" : "\uBBF8\uB9CC", i = u === "\uBBF8\uB9CC" ? "\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4" : "\uC5EC\uC57C \uD569\uB2C8\uB2E4", g = v(n.origin), I = g?.unit ?? "\uC694\uC18C";
        if (g) return `${n.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4: ${n.maximum.toString()}${I} ${u}${i}`;
        return `${n.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4: ${n.maximum.toString()} ${u}${i}`;
      }
      case "too_small": {
        let u = n.inclusive ? "\uC774\uC0C1" : "\uCD08\uACFC", i = u === "\uC774\uC0C1" ? "\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4" : "\uC5EC\uC57C \uD569\uB2C8\uB2E4", g = v(n.origin), I = g?.unit ?? "\uC694\uC18C";
        if (g) return `${n.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uC791\uC2B5\uB2C8\uB2E4: ${n.minimum.toString()}${I} ${u}${i}`;
        return `${n.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uC791\uC2B5\uB2C8\uB2E4: ${n.minimum.toString()} ${u}${i}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${u.prefix}"(\uC73C)\uB85C \uC2DC\uC791\uD574\uC57C \uD569\uB2C8\uB2E4`;
        if (u.format === "ends_with") return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${u.suffix}"(\uC73C)\uB85C \uB05D\uB098\uC57C \uD569\uB2C8\uB2E4`;
        if (u.format === "includes") return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${u.includes}"\uC744(\uB97C) \uD3EC\uD568\uD574\uC57C \uD569\uB2C8\uB2E4`;
        if (u.format === "regex") return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: \uC815\uADDC\uC2DD ${u.pattern} \uD328\uD134\uACFC \uC77C\uCE58\uD574\uC57C \uD569\uB2C8\uB2E4`;
        return `\uC798\uBABB\uB41C ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `\uC798\uBABB\uB41C \uC22B\uC790: ${n.divisor}\uC758 \uBC30\uC218\uC5EC\uC57C \uD569\uB2C8\uB2E4`;
      case "unrecognized_keys":
        return `\uC778\uC2DD\uD560 \uC218 \uC5C6\uB294 \uD0A4: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `\uC798\uBABB\uB41C \uD0A4: ${n.origin}`;
      case "invalid_union":
        return "\uC798\uBABB\uB41C \uC785\uB825";
      case "invalid_element":
        return `\uC798\uBABB\uB41C \uAC12: ${n.origin}`;
      default:
        return "\uC798\uBABB\uB41C \uC785\uB825";
    }
  };
};
function ni() {
  return { localeError: il() };
}
var gl = (r) => {
  return wn(typeof r, r);
};
var wn = (r, v = void 0) => {
  switch (r) {
    case "number":
      return Number.isNaN(v) ? "NaN" : "skai\u010Dius";
    case "bigint":
      return "sveikasis skai\u010Dius";
    case "string":
      return "eilut\u0117";
    case "boolean":
      return "login\u0117 reik\u0161m\u0117";
    case "undefined":
    case "void":
      return "neapibr\u0117\u017Eta reik\u0161m\u0117";
    case "function":
      return "funkcija";
    case "symbol":
      return "simbolis";
    case "object": {
      if (v === void 0) return "ne\u017Einomas objektas";
      if (v === null) return "nulin\u0117 reik\u0161m\u0117";
      if (Array.isArray(v)) return "masyvas";
      if (Object.getPrototypeOf(v) !== Object.prototype && v.constructor) return v.constructor.name;
      return "objektas";
    }
    case "null":
      return "nulin\u0117 reik\u0161m\u0117";
  }
  return r;
};
var _n = (r) => {
  return r.charAt(0).toUpperCase() + r.slice(1);
};
function mt(r) {
  let v = Math.abs(r), o = v % 10, $ = v % 100;
  if ($ >= 11 && $ <= 19 || o === 0) return "many";
  if (o === 1) return "one";
  return "few";
}
var bl = () => {
  let r = { string: { unit: { one: "simbolis", few: "simboliai", many: "simboli\u0173" }, verb: { smaller: { inclusive: "turi b\u016Bti ne ilgesn\u0117 kaip", notInclusive: "turi b\u016Bti trumpesn\u0117 kaip" }, bigger: { inclusive: "turi b\u016Bti ne trumpesn\u0117 kaip", notInclusive: "turi b\u016Bti ilgesn\u0117 kaip" } } }, file: { unit: { one: "baitas", few: "baitai", many: "bait\u0173" }, verb: { smaller: { inclusive: "turi b\u016Bti ne didesnis kaip", notInclusive: "turi b\u016Bti ma\u017Eesnis kaip" }, bigger: { inclusive: "turi b\u016Bti ne ma\u017Eesnis kaip", notInclusive: "turi b\u016Bti didesnis kaip" } } }, array: { unit: { one: "element\u0105", few: "elementus", many: "element\u0173" }, verb: { smaller: { inclusive: "turi tur\u0117ti ne daugiau kaip", notInclusive: "turi tur\u0117ti ma\u017Eiau kaip" }, bigger: { inclusive: "turi tur\u0117ti ne ma\u017Eiau kaip", notInclusive: "turi tur\u0117ti daugiau kaip" } } }, set: { unit: { one: "element\u0105", few: "elementus", many: "element\u0173" }, verb: { smaller: { inclusive: "turi tur\u0117ti ne daugiau kaip", notInclusive: "turi tur\u0117ti ma\u017Eiau kaip" }, bigger: { inclusive: "turi tur\u0117ti ne ma\u017Eiau kaip", notInclusive: "turi tur\u0117ti daugiau kaip" } } } };
  function v($, n, u, i) {
    let g = r[$] ?? null;
    if (g === null) return g;
    return { unit: g.unit[n], verb: g.verb[i][u ? "inclusive" : "notInclusive"] };
  }
  let o = { regex: "\u012Fvestis", email: "el. pa\u0161to adresas", url: "URL", emoji: "jaustukas", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO data ir laikas", date: "ISO data", time: "ISO laikas", duration: "ISO trukm\u0117", ipv4: "IPv4 adresas", ipv6: "IPv6 adresas", cidrv4: "IPv4 tinklo prefiksas (CIDR)", cidrv6: "IPv6 tinklo prefiksas (CIDR)", base64: "base64 u\u017Ekoduota eilut\u0117", base64url: "base64url u\u017Ekoduota eilut\u0117", json_string: "JSON eilut\u0117", e164: "E.164 numeris", jwt: "JWT", template_literal: "\u012Fvestis" };
  return ($) => {
    switch ($.code) {
      case "invalid_type":
        return `Gautas tipas ${gl($.input)}, o tik\u0117tasi - ${wn($.expected)}`;
      case "invalid_value":
        if ($.values.length === 1) return `Privalo b\u016Bti ${N($.values[0])}`;
        return `Privalo b\u016Bti vienas i\u0161 ${_($.values, "|")} pasirinkim\u0173`;
      case "too_big": {
        let n = wn($.origin), u = v($.origin, mt(Number($.maximum)), $.inclusive ?? false, "smaller");
        if (u?.verb) return `${_n(n ?? $.origin ?? "reik\u0161m\u0117")} ${u.verb} ${$.maximum.toString()} ${u.unit ?? "element\u0173"}`;
        let i = $.inclusive ? "ne didesnis kaip" : "ma\u017Eesnis kaip";
        return `${_n(n ?? $.origin ?? "reik\u0161m\u0117")} turi b\u016Bti ${i} ${$.maximum.toString()} ${u?.unit}`;
      }
      case "too_small": {
        let n = wn($.origin), u = v($.origin, mt(Number($.minimum)), $.inclusive ?? false, "bigger");
        if (u?.verb) return `${_n(n ?? $.origin ?? "reik\u0161m\u0117")} ${u.verb} ${$.minimum.toString()} ${u.unit ?? "element\u0173"}`;
        let i = $.inclusive ? "ne ma\u017Eesnis kaip" : "didesnis kaip";
        return `${_n(n ?? $.origin ?? "reik\u0161m\u0117")} turi b\u016Bti ${i} ${$.minimum.toString()} ${u?.unit}`;
      }
      case "invalid_format": {
        let n = $;
        if (n.format === "starts_with") return `Eilut\u0117 privalo prasid\u0117ti "${n.prefix}"`;
        if (n.format === "ends_with") return `Eilut\u0117 privalo pasibaigti "${n.suffix}"`;
        if (n.format === "includes") return `Eilut\u0117 privalo \u012Ftraukti "${n.includes}"`;
        if (n.format === "regex") return `Eilut\u0117 privalo atitikti ${n.pattern}`;
        return `Neteisingas ${o[n.format] ?? $.format}`;
      }
      case "not_multiple_of":
        return `Skai\u010Dius privalo b\u016Bti ${$.divisor} kartotinis.`;
      case "unrecognized_keys":
        return `Neatpa\u017Eint${$.keys.length > 1 ? "i" : "as"} rakt${$.keys.length > 1 ? "ai" : "as"}: ${_($.keys, ", ")}`;
      case "invalid_key":
        return "Rastas klaidingas raktas";
      case "invalid_union":
        return "Klaidinga \u012Fvestis";
      case "invalid_element": {
        let n = wn($.origin);
        return `${_n(n ?? $.origin ?? "reik\u0161m\u0117")} turi klaiding\u0105 \u012Fvest\u012F`;
      }
      default:
        return "Klaidinga \u012Fvestis";
    }
  };
};
function vi() {
  return { localeError: bl() };
}
var tl = () => {
  let r = { string: { unit: "\u0437\u043D\u0430\u0446\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" }, file: { unit: "\u0431\u0430\u0458\u0442\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" }, array: { unit: "\u0441\u0442\u0430\u0432\u043A\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" }, set: { unit: "\u0441\u0442\u0430\u0432\u043A\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "\u0431\u0440\u043E\u0458";
      case "object": {
        if (Array.isArray(n)) return "\u043D\u0438\u0437\u0430";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u0432\u043D\u0435\u0441", email: "\u0430\u0434\u0440\u0435\u0441\u0430 \u043D\u0430 \u0435-\u043F\u043E\u0448\u0442\u0430", url: "URL", emoji: "\u0435\u043C\u043E\u045F\u0438", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO \u0434\u0430\u0442\u0443\u043C \u0438 \u0432\u0440\u0435\u043C\u0435", date: "ISO \u0434\u0430\u0442\u0443\u043C", time: "ISO \u0432\u0440\u0435\u043C\u0435", duration: "ISO \u0432\u0440\u0435\u043C\u0435\u0442\u0440\u0430\u0435\u045A\u0435", ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441\u0430", ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441\u0430", cidrv4: "IPv4 \u043E\u043F\u0441\u0435\u0433", cidrv6: "IPv6 \u043E\u043F\u0441\u0435\u0433", base64: "base64-\u0435\u043D\u043A\u043E\u0434\u0438\u0440\u0430\u043D\u0430 \u043D\u0438\u0437\u0430", base64url: "base64url-\u0435\u043D\u043A\u043E\u0434\u0438\u0440\u0430\u043D\u0430 \u043D\u0438\u0437\u0430", json_string: "JSON \u043D\u0438\u0437\u0430", e164: "E.164 \u0431\u0440\u043E\u0458", jwt: "JWT", template_literal: "\u0432\u043D\u0435\u0441" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${n.expected}, \u043F\u0440\u0438\u043C\u0435\u043D\u043E ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Invalid input: expected ${N(n.values[0])}`;
        return `\u0413\u0440\u0435\u0448\u0430\u043D\u0430 \u043E\u043F\u0446\u0438\u0458\u0430: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 \u0435\u0434\u043D\u0430 ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u0433\u043E\u043B\u0435\u043C: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${n.origin ?? "\u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442\u0430"} \u0434\u0430 \u0438\u043C\u0430 ${u}${n.maximum.toString()} ${i.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0438"}`;
        return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u0433\u043E\u043B\u0435\u043C: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${n.origin ?? "\u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442\u0430"} \u0434\u0430 \u0431\u0438\u0434\u0435 ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u043C\u0430\u043B: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${n.origin} \u0434\u0430 \u0438\u043C\u0430 ${u}${n.minimum.toString()} ${i.unit}`;
        return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u043C\u0430\u043B: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${n.origin} \u0434\u0430 \u0431\u0438\u0434\u0435 ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0437\u0430\u043F\u043E\u0447\u043D\u0443\u0432\u0430 \u0441\u043E "${u.prefix}"`;
        if (u.format === "ends_with") return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0437\u0430\u0432\u0440\u0448\u0443\u0432\u0430 \u0441\u043E "${u.suffix}"`;
        if (u.format === "includes") return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0432\u043A\u043B\u0443\u0447\u0443\u0432\u0430 "${u.includes}"`;
        if (u.format === "regex") return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u043E\u0434\u0433\u043E\u0430\u0440\u0430 \u043D\u0430 \u043F\u0430\u0442\u0435\u0440\u043D\u043E\u0442 ${u.pattern}`;
        return `Invalid ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u0431\u0440\u043E\u0458: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0431\u0438\u0434\u0435 \u0434\u0435\u043B\u0438\u0432 \u0441\u043E ${n.divisor}`;
      case "unrecognized_keys":
        return `${n.keys.length > 1 ? "\u041D\u0435\u043F\u0440\u0435\u043F\u043E\u0437\u043D\u0430\u0435\u043D\u0438 \u043A\u043B\u0443\u0447\u0435\u0432\u0438" : "\u041D\u0435\u043F\u0440\u0435\u043F\u043E\u0437\u043D\u0430\u0435\u043D \u043A\u043B\u0443\u0447"}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u043A\u043B\u0443\u0447 \u0432\u043E ${n.origin}`;
      case "invalid_union":
        return "\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441";
      case "invalid_element":
        return `\u0413\u0440\u0435\u0448\u043D\u0430 \u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442 \u0432\u043E ${n.origin}`;
      default:
        return "\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441";
    }
  };
};
function oi() {
  return { localeError: tl() };
}
var Il = () => {
  let r = { string: { unit: "aksara", verb: "mempunyai" }, file: { unit: "bait", verb: "mempunyai" }, array: { unit: "elemen", verb: "mempunyai" }, set: { unit: "elemen", verb: "mempunyai" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "nombor";
      case "object": {
        if (Array.isArray(n)) return "array";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "input", email: "alamat e-mel", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "tarikh masa ISO", date: "tarikh ISO", time: "masa ISO", duration: "tempoh ISO", ipv4: "alamat IPv4", ipv6: "alamat IPv6", cidrv4: "julat IPv4", cidrv6: "julat IPv6", base64: "string dikodkan base64", base64url: "string dikodkan base64url", json_string: "string JSON", e164: "nombor E.164", jwt: "JWT", template_literal: "input" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Input tidak sah: dijangka ${n.expected}, diterima ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Input tidak sah: dijangka ${N(n.values[0])}`;
        return `Pilihan tidak sah: dijangka salah satu daripada ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `Terlalu besar: dijangka ${n.origin ?? "nilai"} ${i.verb} ${u}${n.maximum.toString()} ${i.unit ?? "elemen"}`;
        return `Terlalu besar: dijangka ${n.origin ?? "nilai"} adalah ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `Terlalu kecil: dijangka ${n.origin} ${i.verb} ${u}${n.minimum.toString()} ${i.unit}`;
        return `Terlalu kecil: dijangka ${n.origin} adalah ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `String tidak sah: mesti bermula dengan "${u.prefix}"`;
        if (u.format === "ends_with") return `String tidak sah: mesti berakhir dengan "${u.suffix}"`;
        if (u.format === "includes") return `String tidak sah: mesti mengandungi "${u.includes}"`;
        if (u.format === "regex") return `String tidak sah: mesti sepadan dengan corak ${u.pattern}`;
        return `${$[u.format] ?? n.format} tidak sah`;
      }
      case "not_multiple_of":
        return `Nombor tidak sah: perlu gandaan ${n.divisor}`;
      case "unrecognized_keys":
        return `Kunci tidak dikenali: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Kunci tidak sah dalam ${n.origin}`;
      case "invalid_union":
        return "Input tidak sah";
      case "invalid_element":
        return `Nilai tidak sah dalam ${n.origin}`;
      default:
        return "Input tidak sah";
    }
  };
};
function ui() {
  return { localeError: Il() };
}
var ll = () => {
  let r = { string: { unit: "tekens", verb: "te hebben" }, file: { unit: "bytes", verb: "te hebben" }, array: { unit: "elementen", verb: "te hebben" }, set: { unit: "elementen", verb: "te hebben" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "getal";
      case "object": {
        if (Array.isArray(n)) return "array";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "invoer", email: "emailadres", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO datum en tijd", date: "ISO datum", time: "ISO tijd", duration: "ISO duur", ipv4: "IPv4-adres", ipv6: "IPv6-adres", cidrv4: "IPv4-bereik", cidrv6: "IPv6-bereik", base64: "base64-gecodeerde tekst", base64url: "base64 URL-gecodeerde tekst", json_string: "JSON string", e164: "E.164-nummer", jwt: "JWT", template_literal: "invoer" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Ongeldige invoer: verwacht ${n.expected}, ontving ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Ongeldige invoer: verwacht ${N(n.values[0])}`;
        return `Ongeldige optie: verwacht \xE9\xE9n van ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `Te groot: verwacht dat ${n.origin ?? "waarde"} ${i.verb} ${u}${n.maximum.toString()} ${i.unit ?? "elementen"}`;
        return `Te groot: verwacht dat ${n.origin ?? "waarde"} ${u}${n.maximum.toString()} is`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `Te klein: verwacht dat ${n.origin} ${i.verb} ${u}${n.minimum.toString()} ${i.unit}`;
        return `Te klein: verwacht dat ${n.origin} ${u}${n.minimum.toString()} is`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Ongeldige tekst: moet met "${u.prefix}" beginnen`;
        if (u.format === "ends_with") return `Ongeldige tekst: moet op "${u.suffix}" eindigen`;
        if (u.format === "includes") return `Ongeldige tekst: moet "${u.includes}" bevatten`;
        if (u.format === "regex") return `Ongeldige tekst: moet overeenkomen met patroon ${u.pattern}`;
        return `Ongeldig: ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `Ongeldig getal: moet een veelvoud van ${n.divisor} zijn`;
      case "unrecognized_keys":
        return `Onbekende key${n.keys.length > 1 ? "s" : ""}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Ongeldige key in ${n.origin}`;
      case "invalid_union":
        return "Ongeldige invoer";
      case "invalid_element":
        return `Ongeldige waarde in ${n.origin}`;
      default:
        return "Ongeldige invoer";
    }
  };
};
function $i() {
  return { localeError: ll() };
}
var Ul = () => {
  let r = { string: { unit: "tegn", verb: "\xE5 ha" }, file: { unit: "bytes", verb: "\xE5 ha" }, array: { unit: "elementer", verb: "\xE5 inneholde" }, set: { unit: "elementer", verb: "\xE5 inneholde" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "tall";
      case "object": {
        if (Array.isArray(n)) return "liste";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "input", email: "e-postadresse", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO dato- og klokkeslett", date: "ISO-dato", time: "ISO-klokkeslett", duration: "ISO-varighet", ipv4: "IPv4-omr\xE5de", ipv6: "IPv6-omr\xE5de", cidrv4: "IPv4-spekter", cidrv6: "IPv6-spekter", base64: "base64-enkodet streng", base64url: "base64url-enkodet streng", json_string: "JSON-streng", e164: "E.164-nummer", jwt: "JWT", template_literal: "input" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Ugyldig input: forventet ${n.expected}, fikk ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Ugyldig verdi: forventet ${N(n.values[0])}`;
        return `Ugyldig valg: forventet en av ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `For stor(t): forventet ${n.origin ?? "value"} til \xE5 ha ${u}${n.maximum.toString()} ${i.unit ?? "elementer"}`;
        return `For stor(t): forventet ${n.origin ?? "value"} til \xE5 ha ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `For lite(n): forventet ${n.origin} til \xE5 ha ${u}${n.minimum.toString()} ${i.unit}`;
        return `For lite(n): forventet ${n.origin} til \xE5 ha ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Ugyldig streng: m\xE5 starte med "${u.prefix}"`;
        if (u.format === "ends_with") return `Ugyldig streng: m\xE5 ende med "${u.suffix}"`;
        if (u.format === "includes") return `Ugyldig streng: m\xE5 inneholde "${u.includes}"`;
        if (u.format === "regex") return `Ugyldig streng: m\xE5 matche m\xF8nsteret ${u.pattern}`;
        return `Ugyldig ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `Ugyldig tall: m\xE5 v\xE6re et multiplum av ${n.divisor}`;
      case "unrecognized_keys":
        return `${n.keys.length > 1 ? "Ukjente n\xF8kler" : "Ukjent n\xF8kkel"}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Ugyldig n\xF8kkel i ${n.origin}`;
      case "invalid_union":
        return "Ugyldig input";
      case "invalid_element":
        return `Ugyldig verdi i ${n.origin}`;
      default:
        return "Ugyldig input";
    }
  };
};
function ii() {
  return { localeError: Ul() };
}
var _l = () => {
  let r = { string: { unit: "harf", verb: "olmal\u0131d\u0131r" }, file: { unit: "bayt", verb: "olmal\u0131d\u0131r" }, array: { unit: "unsur", verb: "olmal\u0131d\u0131r" }, set: { unit: "unsur", verb: "olmal\u0131d\u0131r" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "numara";
      case "object": {
        if (Array.isArray(n)) return "saf";
        if (n === null) return "gayb";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "giren", email: "epostag\xE2h", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO heng\xE2m\u0131", date: "ISO tarihi", time: "ISO zaman\u0131", duration: "ISO m\xFCddeti", ipv4: "IPv4 ni\u015F\xE2n\u0131", ipv6: "IPv6 ni\u015F\xE2n\u0131", cidrv4: "IPv4 menzili", cidrv6: "IPv6 menzili", base64: "base64-\u015Fifreli metin", base64url: "base64url-\u015Fifreli metin", json_string: "JSON metin", e164: "E.164 say\u0131s\u0131", jwt: "JWT", template_literal: "giren" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `F\xE2sit giren: umulan ${n.expected}, al\u0131nan ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `F\xE2sit giren: umulan ${N(n.values[0])}`;
        return `F\xE2sit tercih: m\xFBteberler ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `Fazla b\xFCy\xFCk: ${n.origin ?? "value"}, ${u}${n.maximum.toString()} ${i.unit ?? "elements"} sahip olmal\u0131yd\u0131.`;
        return `Fazla b\xFCy\xFCk: ${n.origin ?? "value"}, ${u}${n.maximum.toString()} olmal\u0131yd\u0131.`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `Fazla k\xFC\xE7\xFCk: ${n.origin}, ${u}${n.minimum.toString()} ${i.unit} sahip olmal\u0131yd\u0131.`;
        return `Fazla k\xFC\xE7\xFCk: ${n.origin}, ${u}${n.minimum.toString()} olmal\u0131yd\u0131.`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `F\xE2sit metin: "${u.prefix}" ile ba\u015Flamal\u0131.`;
        if (u.format === "ends_with") return `F\xE2sit metin: "${u.suffix}" ile bitmeli.`;
        if (u.format === "includes") return `F\xE2sit metin: "${u.includes}" ihtiv\xE2 etmeli.`;
        if (u.format === "regex") return `F\xE2sit metin: ${u.pattern} nak\u015F\u0131na uymal\u0131.`;
        return `F\xE2sit ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `F\xE2sit say\u0131: ${n.divisor} kat\u0131 olmal\u0131yd\u0131.`;
      case "unrecognized_keys":
        return `Tan\u0131nmayan anahtar ${n.keys.length > 1 ? "s" : ""}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `${n.origin} i\xE7in tan\u0131nmayan anahtar var.`;
      case "invalid_union":
        return "Giren tan\u0131namad\u0131.";
      case "invalid_element":
        return `${n.origin} i\xE7in tan\u0131nmayan k\u0131ymet var.`;
      default:
        return "K\u0131ymet tan\u0131namad\u0131.";
    }
  };
};
function gi() {
  return { localeError: _l() };
}
var wl = () => {
  let r = { string: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" }, file: { unit: "\u0628\u0627\u06CC\u067C\u0633", verb: "\u0648\u0644\u0631\u064A" }, array: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" }, set: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "\u0639\u062F\u062F";
      case "object": {
        if (Array.isArray(n)) return "\u0627\u0631\u06D0";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u0648\u0631\u0648\u062F\u064A", email: "\u0628\u0631\u06CC\u069A\u0646\u0627\u0644\u06CC\u06A9", url: "\u06CC\u0648 \u0622\u0631 \u0627\u0644", emoji: "\u0627\u06CC\u0645\u0648\u062C\u064A", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "\u0646\u06CC\u067C\u0647 \u0627\u0648 \u0648\u062E\u062A", date: "\u0646\u06D0\u067C\u0647", time: "\u0648\u062E\u062A", duration: "\u0645\u0648\u062F\u0647", ipv4: "\u062F IPv4 \u067E\u062A\u0647", ipv6: "\u062F IPv6 \u067E\u062A\u0647", cidrv4: "\u062F IPv4 \u0633\u0627\u062D\u0647", cidrv6: "\u062F IPv6 \u0633\u0627\u062D\u0647", base64: "base64-encoded \u0645\u062A\u0646", base64url: "base64url-encoded \u0645\u062A\u0646", json_string: "JSON \u0645\u062A\u0646", e164: "\u062F E.164 \u0634\u0645\u06D0\u0631\u0647", jwt: "JWT", template_literal: "\u0648\u0631\u0648\u062F\u064A" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F ${n.expected} \u0648\u0627\u06CC, \u0645\u06AB\u0631 ${o(n.input)} \u062A\u0631\u0644\u0627\u0633\u0647 \u0634\u0648`;
      case "invalid_value":
        if (n.values.length === 1) return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F ${N(n.values[0])} \u0648\u0627\u06CC`;
        return `\u0646\u0627\u0633\u0645 \u0627\u0646\u062A\u062E\u0627\u0628: \u0628\u0627\u06CC\u062F \u06CC\u0648 \u0644\u0647 ${_(n.values, "|")} \u0685\u062E\u0647 \u0648\u0627\u06CC`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `\u0689\u06CC\u0631 \u0644\u0648\u06CC: ${n.origin ?? "\u0627\u0631\u0632\u069A\u062A"} \u0628\u0627\u06CC\u062F ${u}${n.maximum.toString()} ${i.unit ?? "\u0639\u0646\u0635\u0631\u0648\u0646\u0647"} \u0648\u0644\u0631\u064A`;
        return `\u0689\u06CC\u0631 \u0644\u0648\u06CC: ${n.origin ?? "\u0627\u0631\u0632\u069A\u062A"} \u0628\u0627\u06CC\u062F ${u}${n.maximum.toString()} \u0648\u064A`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `\u0689\u06CC\u0631 \u06A9\u0648\u0686\u0646\u06CC: ${n.origin} \u0628\u0627\u06CC\u062F ${u}${n.minimum.toString()} ${i.unit} \u0648\u0644\u0631\u064A`;
        return `\u0689\u06CC\u0631 \u06A9\u0648\u0686\u0646\u06CC: ${n.origin} \u0628\u0627\u06CC\u062F ${u}${n.minimum.toString()} \u0648\u064A`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F "${u.prefix}" \u0633\u0631\u0647 \u067E\u06CC\u0644 \u0634\u064A`;
        if (u.format === "ends_with") return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F "${u.suffix}" \u0633\u0631\u0647 \u067E\u0627\u06CC \u062A\u0647 \u0648\u0631\u0633\u064A\u0696\u064A`;
        if (u.format === "includes") return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F "${u.includes}" \u0648\u0644\u0631\u064A`;
        if (u.format === "regex") return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F ${u.pattern} \u0633\u0631\u0647 \u0645\u0637\u0627\u0628\u0642\u062A \u0648\u0644\u0631\u064A`;
        return `${$[u.format] ?? n.format} \u0646\u0627\u0633\u0645 \u062F\u06CC`;
      }
      case "not_multiple_of":
        return `\u0646\u0627\u0633\u0645 \u0639\u062F\u062F: \u0628\u0627\u06CC\u062F \u062F ${n.divisor} \u0645\u0636\u0631\u0628 \u0648\u064A`;
      case "unrecognized_keys":
        return `\u0646\u0627\u0633\u0645 ${n.keys.length > 1 ? "\u06A9\u0644\u06CC\u0689\u0648\u0646\u0647" : "\u06A9\u0644\u06CC\u0689"}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `\u0646\u0627\u0633\u0645 \u06A9\u0644\u06CC\u0689 \u067E\u0647 ${n.origin} \u06A9\u06D0`;
      case "invalid_union":
        return "\u0646\u0627\u0633\u0645\u0647 \u0648\u0631\u0648\u062F\u064A";
      case "invalid_element":
        return `\u0646\u0627\u0633\u0645 \u0639\u0646\u0635\u0631 \u067E\u0647 ${n.origin} \u06A9\u06D0`;
      default:
        return "\u0646\u0627\u0633\u0645\u0647 \u0648\u0631\u0648\u062F\u064A";
    }
  };
};
function bi() {
  return { localeError: wl() };
}
var Nl = () => {
  let r = { string: { unit: "znak\xF3w", verb: "mie\u0107" }, file: { unit: "bajt\xF3w", verb: "mie\u0107" }, array: { unit: "element\xF3w", verb: "mie\u0107" }, set: { unit: "element\xF3w", verb: "mie\u0107" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "liczba";
      case "object": {
        if (Array.isArray(n)) return "tablica";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "wyra\u017Cenie", email: "adres email", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "data i godzina w formacie ISO", date: "data w formacie ISO", time: "godzina w formacie ISO", duration: "czas trwania ISO", ipv4: "adres IPv4", ipv6: "adres IPv6", cidrv4: "zakres IPv4", cidrv6: "zakres IPv6", base64: "ci\u0105g znak\xF3w zakodowany w formacie base64", base64url: "ci\u0105g znak\xF3w zakodowany w formacie base64url", json_string: "ci\u0105g znak\xF3w w formacie JSON", e164: "liczba E.164", jwt: "JWT", template_literal: "wej\u015Bcie" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano ${n.expected}, otrzymano ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano ${N(n.values[0])}`;
        return `Nieprawid\u0142owa opcja: oczekiwano jednej z warto\u015Bci ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `Za du\u017Ca warto\u015B\u0107: oczekiwano, \u017Ce ${n.origin ?? "warto\u015B\u0107"} b\u0119dzie mie\u0107 ${u}${n.maximum.toString()} ${i.unit ?? "element\xF3w"}`;
        return `Zbyt du\u017C(y/a/e): oczekiwano, \u017Ce ${n.origin ?? "warto\u015B\u0107"} b\u0119dzie wynosi\u0107 ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `Za ma\u0142a warto\u015B\u0107: oczekiwano, \u017Ce ${n.origin ?? "warto\u015B\u0107"} b\u0119dzie mie\u0107 ${u}${n.minimum.toString()} ${i.unit ?? "element\xF3w"}`;
        return `Zbyt ma\u0142(y/a/e): oczekiwano, \u017Ce ${n.origin ?? "warto\u015B\u0107"} b\u0119dzie wynosi\u0107 ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi zaczyna\u0107 si\u0119 od "${u.prefix}"`;
        if (u.format === "ends_with") return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi ko\u0144czy\u0107 si\u0119 na "${u.suffix}"`;
        if (u.format === "includes") return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi zawiera\u0107 "${u.includes}"`;
        if (u.format === "regex") return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi odpowiada\u0107 wzorcowi ${u.pattern}`;
        return `Nieprawid\u0142ow(y/a/e) ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `Nieprawid\u0142owa liczba: musi by\u0107 wielokrotno\u015Bci\u0105 ${n.divisor}`;
      case "unrecognized_keys":
        return `Nierozpoznane klucze${n.keys.length > 1 ? "s" : ""}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Nieprawid\u0142owy klucz w ${n.origin}`;
      case "invalid_union":
        return "Nieprawid\u0142owe dane wej\u015Bciowe";
      case "invalid_element":
        return `Nieprawid\u0142owa warto\u015B\u0107 w ${n.origin}`;
      default:
        return "Nieprawid\u0142owe dane wej\u015Bciowe";
    }
  };
};
function ti() {
  return { localeError: Nl() };
}
var kl = () => {
  let r = { string: { unit: "caracteres", verb: "ter" }, file: { unit: "bytes", verb: "ter" }, array: { unit: "itens", verb: "ter" }, set: { unit: "itens", verb: "ter" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "n\xFAmero";
      case "object": {
        if (Array.isArray(n)) return "array";
        if (n === null) return "nulo";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "padr\xE3o", email: "endere\xE7o de e-mail", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "data e hora ISO", date: "data ISO", time: "hora ISO", duration: "dura\xE7\xE3o ISO", ipv4: "endere\xE7o IPv4", ipv6: "endere\xE7o IPv6", cidrv4: "faixa de IPv4", cidrv6: "faixa de IPv6", base64: "texto codificado em base64", base64url: "URL codificada em base64", json_string: "texto JSON", e164: "n\xFAmero E.164", jwt: "JWT", template_literal: "entrada" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Tipo inv\xE1lido: esperado ${n.expected}, recebido ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Entrada inv\xE1lida: esperado ${N(n.values[0])}`;
        return `Op\xE7\xE3o inv\xE1lida: esperada uma das ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `Muito grande: esperado que ${n.origin ?? "valor"} tivesse ${u}${n.maximum.toString()} ${i.unit ?? "elementos"}`;
        return `Muito grande: esperado que ${n.origin ?? "valor"} fosse ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `Muito pequeno: esperado que ${n.origin} tivesse ${u}${n.minimum.toString()} ${i.unit}`;
        return `Muito pequeno: esperado que ${n.origin} fosse ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Texto inv\xE1lido: deve come\xE7ar com "${u.prefix}"`;
        if (u.format === "ends_with") return `Texto inv\xE1lido: deve terminar com "${u.suffix}"`;
        if (u.format === "includes") return `Texto inv\xE1lido: deve incluir "${u.includes}"`;
        if (u.format === "regex") return `Texto inv\xE1lido: deve corresponder ao padr\xE3o ${u.pattern}`;
        return `${$[u.format] ?? n.format} inv\xE1lido`;
      }
      case "not_multiple_of":
        return `N\xFAmero inv\xE1lido: deve ser m\xFAltiplo de ${n.divisor}`;
      case "unrecognized_keys":
        return `Chave${n.keys.length > 1 ? "s" : ""} desconhecida${n.keys.length > 1 ? "s" : ""}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Chave inv\xE1lida em ${n.origin}`;
      case "invalid_union":
        return "Entrada inv\xE1lida";
      case "invalid_element":
        return `Valor inv\xE1lido em ${n.origin}`;
      default:
        return "Campo inv\xE1lido";
    }
  };
};
function Ii() {
  return { localeError: kl() };
}
function Ct(r, v, o, $) {
  let n = Math.abs(r), u = n % 10, i = n % 100;
  if (i >= 11 && i <= 19) return $;
  if (u === 1) return v;
  if (u >= 2 && u <= 4) return o;
  return $;
}
var Ol = () => {
  let r = { string: { unit: { one: "\u0441\u0438\u043C\u0432\u043E\u043B", few: "\u0441\u0438\u043C\u0432\u043E\u043B\u0430", many: "\u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432" }, verb: "\u0438\u043C\u0435\u0442\u044C" }, file: { unit: { one: "\u0431\u0430\u0439\u0442", few: "\u0431\u0430\u0439\u0442\u0430", many: "\u0431\u0430\u0439\u0442" }, verb: "\u0438\u043C\u0435\u0442\u044C" }, array: { unit: { one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442", few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430", many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432" }, verb: "\u0438\u043C\u0435\u0442\u044C" }, set: { unit: { one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442", few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430", many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432" }, verb: "\u0438\u043C\u0435\u0442\u044C" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "\u0447\u0438\u0441\u043B\u043E";
      case "object": {
        if (Array.isArray(n)) return "\u043C\u0430\u0441\u0441\u0438\u0432";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u0432\u0432\u043E\u0434", email: "email \u0430\u0434\u0440\u0435\u0441", url: "URL", emoji: "\u044D\u043C\u043E\u0434\u0437\u0438", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO \u0434\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F", date: "ISO \u0434\u0430\u0442\u0430", time: "ISO \u0432\u0440\u0435\u043C\u044F", duration: "ISO \u0434\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C", ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441", ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441", cidrv4: "IPv4 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D", cidrv6: "IPv6 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D", base64: "\u0441\u0442\u0440\u043E\u043A\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 base64", base64url: "\u0441\u0442\u0440\u043E\u043A\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 base64url", json_string: "JSON \u0441\u0442\u0440\u043E\u043A\u0430", e164: "\u043D\u043E\u043C\u0435\u0440 E.164", jwt: "JWT", template_literal: "\u0432\u0432\u043E\u0434" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C ${n.expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C ${N(n.values[0])}`;
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0434\u043D\u043E \u0438\u0437 ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) {
          let g = Number(n.maximum), I = Ct(g, i.unit.one, i.unit.few, i.unit.many);
          return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${n.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435"} \u0431\u0443\u0434\u0435\u0442 \u0438\u043C\u0435\u0442\u044C ${u}${n.maximum.toString()} ${I}`;
        }
        return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${n.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435"} \u0431\u0443\u0434\u0435\u0442 ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) {
          let g = Number(n.minimum), I = Ct(g, i.unit.one, i.unit.few, i.unit.many);
          return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${n.origin} \u0431\u0443\u0434\u0435\u0442 \u0438\u043C\u0435\u0442\u044C ${u}${n.minimum.toString()} ${I}`;
        }
        return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${n.origin} \u0431\u0443\u0434\u0435\u0442 ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u043D\u0430\u0447\u0438\u043D\u0430\u0442\u044C\u0441\u044F \u0441 "${u.prefix}"`;
        if (u.format === "ends_with") return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0437\u0430\u043A\u0430\u043D\u0447\u0438\u0432\u0430\u0442\u044C\u0441\u044F \u043D\u0430 "${u.suffix}"`;
        if (u.format === "includes") return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C "${u.includes}"`;
        if (u.format === "regex") return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${u.pattern}`;
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0447\u0438\u0441\u043B\u043E: \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043A\u0440\u0430\u0442\u043D\u044B\u043C ${n.divisor}`;
      case "unrecognized_keys":
        return `\u041D\u0435\u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D\u043D${n.keys.length > 1 ? "\u044B\u0435" : "\u044B\u0439"} \u043A\u043B\u044E\u0447${n.keys.length > 1 ? "\u0438" : ""}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043A\u043B\u044E\u0447 \u0432 ${n.origin}`;
      case "invalid_union":
        return "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u0432\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435";
      case "invalid_element":
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0432 ${n.origin}`;
      default:
        return "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u0432\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435";
    }
  };
};
function li() {
  return { localeError: Ol() };
}
var cl = () => {
  let r = { string: { unit: "znakov", verb: "imeti" }, file: { unit: "bajtov", verb: "imeti" }, array: { unit: "elementov", verb: "imeti" }, set: { unit: "elementov", verb: "imeti" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "\u0161tevilo";
      case "object": {
        if (Array.isArray(n)) return "tabela";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "vnos", email: "e-po\u0161tni naslov", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO datum in \u010Das", date: "ISO datum", time: "ISO \u010Das", duration: "ISO trajanje", ipv4: "IPv4 naslov", ipv6: "IPv6 naslov", cidrv4: "obseg IPv4", cidrv6: "obseg IPv6", base64: "base64 kodiran niz", base64url: "base64url kodiran niz", json_string: "JSON niz", e164: "E.164 \u0161tevilka", jwt: "JWT", template_literal: "vnos" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Neveljaven vnos: pri\u010Dakovano ${n.expected}, prejeto ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Neveljaven vnos: pri\u010Dakovano ${N(n.values[0])}`;
        return `Neveljavna mo\u017Enost: pri\u010Dakovano eno izmed ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `Preveliko: pri\u010Dakovano, da bo ${n.origin ?? "vrednost"} imelo ${u}${n.maximum.toString()} ${i.unit ?? "elementov"}`;
        return `Preveliko: pri\u010Dakovano, da bo ${n.origin ?? "vrednost"} ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `Premajhno: pri\u010Dakovano, da bo ${n.origin} imelo ${u}${n.minimum.toString()} ${i.unit}`;
        return `Premajhno: pri\u010Dakovano, da bo ${n.origin} ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Neveljaven niz: mora se za\u010Deti z "${u.prefix}"`;
        if (u.format === "ends_with") return `Neveljaven niz: mora se kon\u010Dati z "${u.suffix}"`;
        if (u.format === "includes") return `Neveljaven niz: mora vsebovati "${u.includes}"`;
        if (u.format === "regex") return `Neveljaven niz: mora ustrezati vzorcu ${u.pattern}`;
        return `Neveljaven ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `Neveljavno \u0161tevilo: mora biti ve\u010Dkratnik ${n.divisor}`;
      case "unrecognized_keys":
        return `Neprepoznan${n.keys.length > 1 ? "i klju\u010Di" : " klju\u010D"}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Neveljaven klju\u010D v ${n.origin}`;
      case "invalid_union":
        return "Neveljaven vnos";
      case "invalid_element":
        return `Neveljavna vrednost v ${n.origin}`;
      default:
        return "Neveljaven vnos";
    }
  };
};
function Ui() {
  return { localeError: cl() };
}
var Dl = () => {
  let r = { string: { unit: "tecken", verb: "att ha" }, file: { unit: "bytes", verb: "att ha" }, array: { unit: "objekt", verb: "att inneh\xE5lla" }, set: { unit: "objekt", verb: "att inneh\xE5lla" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "antal";
      case "object": {
        if (Array.isArray(n)) return "lista";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "regulj\xE4rt uttryck", email: "e-postadress", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO-datum och tid", date: "ISO-datum", time: "ISO-tid", duration: "ISO-varaktighet", ipv4: "IPv4-intervall", ipv6: "IPv6-intervall", cidrv4: "IPv4-spektrum", cidrv6: "IPv6-spektrum", base64: "base64-kodad str\xE4ng", base64url: "base64url-kodad str\xE4ng", json_string: "JSON-str\xE4ng", e164: "E.164-nummer", jwt: "JWT", template_literal: "mall-literal" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `Ogiltig inmatning: f\xF6rv\xE4ntat ${n.expected}, fick ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `Ogiltig inmatning: f\xF6rv\xE4ntat ${N(n.values[0])}`;
        return `Ogiltigt val: f\xF6rv\xE4ntade en av ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `F\xF6r stor(t): f\xF6rv\xE4ntade ${n.origin ?? "v\xE4rdet"} att ha ${u}${n.maximum.toString()} ${i.unit ?? "element"}`;
        return `F\xF6r stor(t): f\xF6rv\xE4ntat ${n.origin ?? "v\xE4rdet"} att ha ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `F\xF6r lite(t): f\xF6rv\xE4ntade ${n.origin ?? "v\xE4rdet"} att ha ${u}${n.minimum.toString()} ${i.unit}`;
        return `F\xF6r lite(t): f\xF6rv\xE4ntade ${n.origin ?? "v\xE4rdet"} att ha ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Ogiltig str\xE4ng: m\xE5ste b\xF6rja med "${u.prefix}"`;
        if (u.format === "ends_with") return `Ogiltig str\xE4ng: m\xE5ste sluta med "${u.suffix}"`;
        if (u.format === "includes") return `Ogiltig str\xE4ng: m\xE5ste inneh\xE5lla "${u.includes}"`;
        if (u.format === "regex") return `Ogiltig str\xE4ng: m\xE5ste matcha m\xF6nstret "${u.pattern}"`;
        return `Ogiltig(t) ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `Ogiltigt tal: m\xE5ste vara en multipel av ${n.divisor}`;
      case "unrecognized_keys":
        return `${n.keys.length > 1 ? "Ok\xE4nda nycklar" : "Ok\xE4nd nyckel"}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Ogiltig nyckel i ${n.origin ?? "v\xE4rdet"}`;
      case "invalid_union":
        return "Ogiltig input";
      case "invalid_element":
        return `Ogiltigt v\xE4rde i ${n.origin ?? "v\xE4rdet"}`;
      default:
        return "Ogiltig input";
    }
  };
};
function _i() {
  return { localeError: Dl() };
}
var jl = () => {
  let r = { string: { unit: "\u0B8E\u0BB4\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1\u0B95\u0BCD\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" }, file: { unit: "\u0BAA\u0BC8\u0B9F\u0BCD\u0B9F\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" }, array: { unit: "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" }, set: { unit: "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "\u0B8E\u0BA3\u0BCD \u0B85\u0BB2\u0BCD\u0BB2\u0BBE\u0BA4\u0BA4\u0BC1" : "\u0B8E\u0BA3\u0BCD";
      case "object": {
        if (Array.isArray(n)) return "\u0B85\u0BA3\u0BBF";
        if (n === null) return "\u0BB5\u0BC6\u0BB1\u0BC1\u0BAE\u0BC8";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1", email: "\u0BAE\u0BBF\u0BA9\u0BCD\u0BA9\u0B9E\u0BCD\u0B9A\u0BB2\u0BCD \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO \u0BA4\u0BC7\u0BA4\u0BBF \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD", date: "ISO \u0BA4\u0BC7\u0BA4\u0BBF", time: "ISO \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD", duration: "ISO \u0B95\u0BBE\u0BB2 \u0B85\u0BB3\u0BB5\u0BC1", ipv4: "IPv4 \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF", ipv6: "IPv6 \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF", cidrv4: "IPv4 \u0BB5\u0BB0\u0BAE\u0BCD\u0BAA\u0BC1", cidrv6: "IPv6 \u0BB5\u0BB0\u0BAE\u0BCD\u0BAA\u0BC1", base64: "base64-encoded \u0B9A\u0BB0\u0BAE\u0BCD", base64url: "base64url-encoded \u0B9A\u0BB0\u0BAE\u0BCD", json_string: "JSON \u0B9A\u0BB0\u0BAE\u0BCD", e164: "E.164 \u0B8E\u0BA3\u0BCD", jwt: "JWT", template_literal: "input" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${n.expected}, \u0BAA\u0BC6\u0BB1\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${N(n.values[0])}`;
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BB5\u0BBF\u0BB0\u0BC1\u0BAA\u0BCD\u0BAA\u0BAE\u0BCD: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${_(n.values, "|")} \u0B87\u0BB2\u0BCD \u0B92\u0BA9\u0BCD\u0BB1\u0BC1`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `\u0BAE\u0BBF\u0B95 \u0BAA\u0BC6\u0BB0\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${n.origin ?? "\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1"} ${u}${n.maximum.toString()} ${i.unit ?? "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD"} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        return `\u0BAE\u0BBF\u0B95 \u0BAA\u0BC6\u0BB0\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${n.origin ?? "\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1"} ${u}${n.maximum.toString()} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `\u0BAE\u0BBF\u0B95\u0B9A\u0BCD \u0B9A\u0BBF\u0BB1\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${n.origin} ${u}${n.minimum.toString()} ${i.unit} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        return `\u0BAE\u0BBF\u0B95\u0B9A\u0BCD \u0B9A\u0BBF\u0BB1\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${n.origin} ${u}${n.minimum.toString()} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${u.prefix}" \u0B87\u0BB2\u0BCD \u0BA4\u0BCA\u0B9F\u0B99\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        if (u.format === "ends_with") return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${u.suffix}" \u0B87\u0BB2\u0BCD \u0BAE\u0BC1\u0B9F\u0BBF\u0BB5\u0B9F\u0BC8\u0BAF \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        if (u.format === "includes") return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${u.includes}" \u0B90 \u0B89\u0BB3\u0BCD\u0BB3\u0B9F\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        if (u.format === "regex") return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: ${u.pattern} \u0BAE\u0BC1\u0BB1\u0BC8\u0BAA\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1\u0B9F\u0BA9\u0BCD \u0BAA\u0BCA\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B8E\u0BA3\u0BCD: ${n.divisor} \u0B87\u0BA9\u0BCD \u0BAA\u0BB2\u0BAE\u0BBE\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
      case "unrecognized_keys":
        return `\u0B85\u0B9F\u0BC8\u0BAF\u0BBE\u0BB3\u0BAE\u0BCD \u0BA4\u0BC6\u0BB0\u0BBF\u0BAF\u0BBE\u0BA4 \u0BB5\u0BBF\u0B9A\u0BC8${n.keys.length > 1 ? "\u0B95\u0BB3\u0BCD" : ""}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `${n.origin} \u0B87\u0BB2\u0BCD \u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BB5\u0BBF\u0B9A\u0BC8`;
      case "invalid_union":
        return "\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1";
      case "invalid_element":
        return `${n.origin} \u0B87\u0BB2\u0BCD \u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1`;
      default:
        return "\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1";
    }
  };
};
function wi() {
  return { localeError: jl() };
}
var Pl = () => {
  let r = { string: { unit: "\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" }, file: { unit: "\u0E44\u0E1A\u0E15\u0E4C", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" }, array: { unit: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" }, set: { unit: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 (NaN)" : "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02";
      case "object": {
        if (Array.isArray(n)) return "\u0E2D\u0E32\u0E23\u0E4C\u0E40\u0E23\u0E22\u0E4C (Array)";
        if (n === null) return "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E48\u0E32 (null)";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1B\u0E49\u0E2D\u0E19", email: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E2D\u0E35\u0E40\u0E21\u0E25", url: "URL", emoji: "\u0E2D\u0E34\u0E42\u0E21\u0E08\u0E34", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO", date: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E41\u0E1A\u0E1A ISO", time: "\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO", duration: "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO", ipv4: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 IPv4", ipv6: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 IPv6", cidrv4: "\u0E0A\u0E48\u0E27\u0E07 IP \u0E41\u0E1A\u0E1A IPv4", cidrv6: "\u0E0A\u0E48\u0E27\u0E07 IP \u0E41\u0E1A\u0E1A IPv6", base64: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A Base64", base64url: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A Base64 \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A URL", json_string: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A JSON", e164: "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E17\u0E28 (E.164)", jwt: "\u0E42\u0E17\u0E40\u0E04\u0E19 JWT", template_literal: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1B\u0E49\u0E2D\u0E19" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 ${n.expected} \u0E41\u0E15\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `\u0E04\u0E48\u0E32\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 ${N(n.values[0])}`;
        return `\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E43\u0E19 ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19" : "\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32", i = v(n.origin);
        if (i) return `\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14: ${n.origin ?? "\u0E04\u0E48\u0E32"} \u0E04\u0E27\u0E23\u0E21\u0E35${u} ${n.maximum.toString()} ${i.unit ?? "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"}`;
        return `\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14: ${n.origin ?? "\u0E04\u0E48\u0E32"} \u0E04\u0E27\u0E23\u0E21\u0E35${u} ${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? "\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22" : "\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32", i = v(n.origin);
        if (i) return `\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E01\u0E33\u0E2B\u0E19\u0E14: ${n.origin} \u0E04\u0E27\u0E23\u0E21\u0E35${u} ${n.minimum.toString()} ${i.unit}`;
        return `\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E01\u0E33\u0E2B\u0E19\u0E14: ${n.origin} \u0E04\u0E27\u0E23\u0E21\u0E35${u} ${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E02\u0E36\u0E49\u0E19\u0E15\u0E49\u0E19\u0E14\u0E49\u0E27\u0E22 "${u.prefix}"`;
        if (u.format === "ends_with") return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E25\u0E07\u0E17\u0E49\u0E32\u0E22\u0E14\u0E49\u0E27\u0E22 "${u.suffix}"`;
        if (u.format === "includes") return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35 "${u.includes}" \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21`;
        if (u.format === "regex") return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14 ${u.pattern}`;
        return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E33\u0E19\u0E27\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E32\u0E23\u0E14\u0E49\u0E27\u0E22 ${n.divisor} \u0E44\u0E14\u0E49\u0E25\u0E07\u0E15\u0E31\u0E27`;
      case "unrecognized_keys":
        return `\u0E1E\u0E1A\u0E04\u0E35\u0E22\u0E4C\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E23\u0E39\u0E49\u0E08\u0E31\u0E01: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `\u0E04\u0E35\u0E22\u0E4C\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E19 ${n.origin}`;
      case "invalid_union":
        return "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E22\u0E39\u0E40\u0E19\u0E35\u0E22\u0E19\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E44\u0E27\u0E49";
      case "invalid_element":
        return `\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E19 ${n.origin}`;
      default:
        return "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07";
    }
  };
};
function Ni() {
  return { localeError: Pl() };
}
var Sl = (r) => {
  let v = typeof r;
  switch (v) {
    case "number":
      return Number.isNaN(r) ? "NaN" : "number";
    case "object": {
      if (Array.isArray(r)) return "array";
      if (r === null) return "null";
      if (Object.getPrototypeOf(r) !== Object.prototype && r.constructor) return r.constructor.name;
    }
  }
  return v;
};
var Al = () => {
  let r = { string: { unit: "karakter", verb: "olmal\u0131" }, file: { unit: "bayt", verb: "olmal\u0131" }, array: { unit: "\xF6\u011Fe", verb: "olmal\u0131" }, set: { unit: "\xF6\u011Fe", verb: "olmal\u0131" } };
  function v($) {
    return r[$] ?? null;
  }
  let o = { regex: "girdi", email: "e-posta adresi", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO tarih ve saat", date: "ISO tarih", time: "ISO saat", duration: "ISO s\xFCre", ipv4: "IPv4 adresi", ipv6: "IPv6 adresi", cidrv4: "IPv4 aral\u0131\u011F\u0131", cidrv6: "IPv6 aral\u0131\u011F\u0131", base64: "base64 ile \u015Fifrelenmi\u015F metin", base64url: "base64url ile \u015Fifrelenmi\u015F metin", json_string: "JSON dizesi", e164: "E.164 say\u0131s\u0131", jwt: "JWT", template_literal: "\u015Eablon dizesi" };
  return ($) => {
    switch ($.code) {
      case "invalid_type":
        return `Ge\xE7ersiz de\u011Fer: beklenen ${$.expected}, al\u0131nan ${Sl($.input)}`;
      case "invalid_value":
        if ($.values.length === 1) return `Ge\xE7ersiz de\u011Fer: beklenen ${N($.values[0])}`;
        return `Ge\xE7ersiz se\xE7enek: a\u015Fa\u011F\u0131dakilerden biri olmal\u0131: ${_($.values, "|")}`;
      case "too_big": {
        let n = $.inclusive ? "<=" : "<", u = v($.origin);
        if (u) return `\xC7ok b\xFCy\xFCk: beklenen ${$.origin ?? "de\u011Fer"} ${n}${$.maximum.toString()} ${u.unit ?? "\xF6\u011Fe"}`;
        return `\xC7ok b\xFCy\xFCk: beklenen ${$.origin ?? "de\u011Fer"} ${n}${$.maximum.toString()}`;
      }
      case "too_small": {
        let n = $.inclusive ? ">=" : ">", u = v($.origin);
        if (u) return `\xC7ok k\xFC\xE7\xFCk: beklenen ${$.origin} ${n}${$.minimum.toString()} ${u.unit}`;
        return `\xC7ok k\xFC\xE7\xFCk: beklenen ${$.origin} ${n}${$.minimum.toString()}`;
      }
      case "invalid_format": {
        let n = $;
        if (n.format === "starts_with") return `Ge\xE7ersiz metin: "${n.prefix}" ile ba\u015Flamal\u0131`;
        if (n.format === "ends_with") return `Ge\xE7ersiz metin: "${n.suffix}" ile bitmeli`;
        if (n.format === "includes") return `Ge\xE7ersiz metin: "${n.includes}" i\xE7ermeli`;
        if (n.format === "regex") return `Ge\xE7ersiz metin: ${n.pattern} desenine uymal\u0131`;
        return `Ge\xE7ersiz ${o[n.format] ?? $.format}`;
      }
      case "not_multiple_of":
        return `Ge\xE7ersiz say\u0131: ${$.divisor} ile tam b\xF6l\xFCnebilmeli`;
      case "unrecognized_keys":
        return `Tan\u0131nmayan anahtar${$.keys.length > 1 ? "lar" : ""}: ${_($.keys, ", ")}`;
      case "invalid_key":
        return `${$.origin} i\xE7inde ge\xE7ersiz anahtar`;
      case "invalid_union":
        return "Ge\xE7ersiz de\u011Fer";
      case "invalid_element":
        return `${$.origin} i\xE7inde ge\xE7ersiz de\u011Fer`;
      default:
        return "Ge\xE7ersiz de\u011Fer";
    }
  };
};
function ki() {
  return { localeError: Al() };
}
var Jl = () => {
  let r = { string: { unit: "\u0441\u0438\u043C\u0432\u043E\u043B\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" }, file: { unit: "\u0431\u0430\u0439\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" }, array: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" }, set: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "\u0447\u0438\u0441\u043B\u043E";
      case "object": {
        if (Array.isArray(n)) return "\u043C\u0430\u0441\u0438\u0432";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456", email: "\u0430\u0434\u0440\u0435\u0441\u0430 \u0435\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0457 \u043F\u043E\u0448\u0442\u0438", url: "URL", emoji: "\u0435\u043C\u043E\u0434\u0437\u0456", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "\u0434\u0430\u0442\u0430 \u0442\u0430 \u0447\u0430\u0441 ISO", date: "\u0434\u0430\u0442\u0430 ISO", time: "\u0447\u0430\u0441 ISO", duration: "\u0442\u0440\u0438\u0432\u0430\u043B\u0456\u0441\u0442\u044C ISO", ipv4: "\u0430\u0434\u0440\u0435\u0441\u0430 IPv4", ipv6: "\u0430\u0434\u0440\u0435\u0441\u0430 IPv6", cidrv4: "\u0434\u0456\u0430\u043F\u0430\u0437\u043E\u043D IPv4", cidrv6: "\u0434\u0456\u0430\u043F\u0430\u0437\u043E\u043D IPv6", base64: "\u0440\u044F\u0434\u043E\u043A \u0443 \u043A\u043E\u0434\u0443\u0432\u0430\u043D\u043D\u0456 base64", base64url: "\u0440\u044F\u0434\u043E\u043A \u0443 \u043A\u043E\u0434\u0443\u0432\u0430\u043D\u043D\u0456 base64url", json_string: "\u0440\u044F\u0434\u043E\u043A JSON", e164: "\u043D\u043E\u043C\u0435\u0440 E.164", jwt: "JWT", template_literal: "\u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F ${n.expected}, \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F ${N(n.values[0])}`;
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0430 \u043E\u043F\u0446\u0456\u044F: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u043D\u0435 \u0437 ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u0432\u0435\u043B\u0438\u043A\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${n.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F"} ${i.verb} ${u}${n.maximum.toString()} ${i.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432"}`;
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u0432\u0435\u043B\u0438\u043A\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${n.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F"} \u0431\u0443\u0434\u0435 ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u043C\u0430\u043B\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${n.origin} ${i.verb} ${u}${n.minimum.toString()} ${i.unit}`;
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u043C\u0430\u043B\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${n.origin} \u0431\u0443\u0434\u0435 ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043F\u043E\u0447\u0438\u043D\u0430\u0442\u0438\u0441\u044F \u0437 "${u.prefix}"`;
        if (u.format === "ends_with") return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u0437\u0430\u043A\u0456\u043D\u0447\u0443\u0432\u0430\u0442\u0438\u0441\u044F \u043D\u0430 "${u.suffix}"`;
        if (u.format === "includes") return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043C\u0456\u0441\u0442\u0438\u0442\u0438 "${u.includes}"`;
        if (u.format === "regex") return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0442\u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${u.pattern}`;
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0435 \u0447\u0438\u0441\u043B\u043E: \u043F\u043E\u0432\u0438\u043D\u043D\u043E \u0431\u0443\u0442\u0438 \u043A\u0440\u0430\u0442\u043D\u0438\u043C ${n.divisor}`;
      case "unrecognized_keys":
        return `\u041D\u0435\u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u043D\u0438\u0439 \u043A\u043B\u044E\u0447${n.keys.length > 1 ? "\u0456" : ""}: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u043A\u043B\u044E\u0447 \u0443 ${n.origin}`;
      case "invalid_union":
        return "\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456";
      case "invalid_element":
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0443 ${n.origin}`;
      default:
        return "\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456";
    }
  };
};
function Nn() {
  return { localeError: Jl() };
}
function Oi() {
  return Nn();
}
var El = () => {
  let r = { string: { unit: "\u062D\u0631\u0648\u0641", verb: "\u06C1\u0648\u0646\u0627" }, file: { unit: "\u0628\u0627\u0626\u0679\u0633", verb: "\u06C1\u0648\u0646\u0627" }, array: { unit: "\u0622\u0626\u0679\u0645\u0632", verb: "\u06C1\u0648\u0646\u0627" }, set: { unit: "\u0622\u0626\u0679\u0645\u0632", verb: "\u06C1\u0648\u0646\u0627" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "\u0646\u0645\u0628\u0631";
      case "object": {
        if (Array.isArray(n)) return "\u0622\u0631\u06D2";
        if (n === null) return "\u0646\u0644";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u0627\u0646 \u067E\u0679", email: "\u0627\u06CC \u0645\u06CC\u0644 \u0627\u06CC\u0688\u0631\u06CC\u0633", url: "\u06CC\u0648 \u0622\u0631 \u0627\u06CC\u0644", emoji: "\u0627\u06CC\u0645\u0648\u062C\u06CC", uuid: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC", uuidv4: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC \u0648\u06CC 4", uuidv6: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC \u0648\u06CC 6", nanoid: "\u0646\u06CC\u0646\u0648 \u0622\u0626\u06CC \u0688\u06CC", guid: "\u062C\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC", cuid: "\u0633\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC", cuid2: "\u0633\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC 2", ulid: "\u06CC\u0648 \u0627\u06CC\u0644 \u0622\u0626\u06CC \u0688\u06CC", xid: "\u0627\u06CC\u06A9\u0633 \u0622\u0626\u06CC \u0688\u06CC", ksuid: "\u06A9\u06D2 \u0627\u06CC\u0633 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC", datetime: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0688\u06CC\u0679 \u0679\u0627\u0626\u0645", date: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u062A\u0627\u0631\u06CC\u062E", time: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0648\u0642\u062A", duration: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0645\u062F\u062A", ipv4: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 4 \u0627\u06CC\u0688\u0631\u06CC\u0633", ipv6: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 6 \u0627\u06CC\u0688\u0631\u06CC\u0633", cidrv4: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 4 \u0631\u06CC\u0646\u062C", cidrv6: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 6 \u0631\u06CC\u0646\u062C", base64: "\u0628\u06CC\u0633 64 \u0627\u0646 \u06A9\u0648\u0688\u0688 \u0633\u0679\u0631\u0646\u06AF", base64url: "\u0628\u06CC\u0633 64 \u06CC\u0648 \u0622\u0631 \u0627\u06CC\u0644 \u0627\u0646 \u06A9\u0648\u0688\u0688 \u0633\u0679\u0631\u0646\u06AF", json_string: "\u062C\u06D2 \u0627\u06CC\u0633 \u0627\u0648 \u0627\u06CC\u0646 \u0633\u0679\u0631\u0646\u06AF", e164: "\u0627\u06CC 164 \u0646\u0645\u0628\u0631", jwt: "\u062C\u06D2 \u0688\u0628\u0644\u06CC\u0648 \u0679\u06CC", template_literal: "\u0627\u0646 \u067E\u0679" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: ${n.expected} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627\u060C ${o(n.input)} \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648\u0627`;
      case "invalid_value":
        if (n.values.length === 1) return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: ${N(n.values[0])} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
        return `\u063A\u0644\u0637 \u0622\u067E\u0634\u0646: ${_(n.values, "|")} \u0645\u06CC\u06BA \u0633\u06D2 \u0627\u06CC\u06A9 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `\u0628\u06C1\u062A \u0628\u0691\u0627: ${n.origin ?? "\u0648\u06CC\u0644\u06CC\u0648"} \u06A9\u06D2 ${u}${n.maximum.toString()} ${i.unit ?? "\u0639\u0646\u0627\u0635\u0631"} \u06C1\u0648\u0646\u06D2 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u06D2`;
        return `\u0628\u06C1\u062A \u0628\u0691\u0627: ${n.origin ?? "\u0648\u06CC\u0644\u06CC\u0648"} \u06A9\u0627 ${u}${n.maximum.toString()} \u06C1\u0648\u0646\u0627 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `\u0628\u06C1\u062A \u0686\u06BE\u0648\u0679\u0627: ${n.origin} \u06A9\u06D2 ${u}${n.minimum.toString()} ${i.unit} \u06C1\u0648\u0646\u06D2 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u06D2`;
        return `\u0628\u06C1\u062A \u0686\u06BE\u0648\u0679\u0627: ${n.origin} \u06A9\u0627 ${u}${n.minimum.toString()} \u06C1\u0648\u0646\u0627 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${u.prefix}" \u0633\u06D2 \u0634\u0631\u0648\u0639 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        if (u.format === "ends_with") return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${u.suffix}" \u067E\u0631 \u062E\u062A\u0645 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        if (u.format === "includes") return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${u.includes}" \u0634\u0627\u0645\u0644 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        if (u.format === "regex") return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: \u067E\u06CC\u0679\u0631\u0646 ${u.pattern} \u0633\u06D2 \u0645\u06CC\u0686 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        return `\u063A\u0644\u0637 ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `\u063A\u0644\u0637 \u0646\u0645\u0628\u0631: ${n.divisor} \u06A9\u0627 \u0645\u0636\u0627\u0639\u0641 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
      case "unrecognized_keys":
        return `\u063A\u06CC\u0631 \u062A\u0633\u0644\u06CC\u0645 \u0634\u062F\u06C1 \u06A9\u06CC${n.keys.length > 1 ? "\u0632" : ""}: ${_(n.keys, "\u060C ")}`;
      case "invalid_key":
        return `${n.origin} \u0645\u06CC\u06BA \u063A\u0644\u0637 \u06A9\u06CC`;
      case "invalid_union":
        return "\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679";
      case "invalid_element":
        return `${n.origin} \u0645\u06CC\u06BA \u063A\u0644\u0637 \u0648\u06CC\u0644\u06CC\u0648`;
      default:
        return "\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679";
    }
  };
};
function ci() {
  return { localeError: El() };
}
var Ll = () => {
  let r = { string: { unit: "k\xFD t\u1EF1", verb: "c\xF3" }, file: { unit: "byte", verb: "c\xF3" }, array: { unit: "ph\u1EA7n t\u1EED", verb: "c\xF3" }, set: { unit: "ph\u1EA7n t\u1EED", verb: "c\xF3" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "s\u1ED1";
      case "object": {
        if (Array.isArray(n)) return "m\u1EA3ng";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u0111\u1EA7u v\xE0o", email: "\u0111\u1ECBa ch\u1EC9 email", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ng\xE0y gi\u1EDD ISO", date: "ng\xE0y ISO", time: "gi\u1EDD ISO", duration: "kho\u1EA3ng th\u1EDDi gian ISO", ipv4: "\u0111\u1ECBa ch\u1EC9 IPv4", ipv6: "\u0111\u1ECBa ch\u1EC9 IPv6", cidrv4: "d\u1EA3i IPv4", cidrv6: "d\u1EA3i IPv6", base64: "chu\u1ED7i m\xE3 h\xF3a base64", base64url: "chu\u1ED7i m\xE3 h\xF3a base64url", json_string: "chu\u1ED7i JSON", e164: "s\u1ED1 E.164", jwt: "JWT", template_literal: "\u0111\u1EA7u v\xE0o" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i ${n.expected}, nh\u1EADn \u0111\u01B0\u1EE3c ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i ${N(n.values[0])}`;
        return `T\xF9y ch\u1ECDn kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i m\u1ED9t trong c\xE1c gi\xE1 tr\u1ECB ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `Qu\xE1 l\u1EDBn: mong \u0111\u1EE3i ${n.origin ?? "gi\xE1 tr\u1ECB"} ${i.verb} ${u}${n.maximum.toString()} ${i.unit ?? "ph\u1EA7n t\u1EED"}`;
        return `Qu\xE1 l\u1EDBn: mong \u0111\u1EE3i ${n.origin ?? "gi\xE1 tr\u1ECB"} ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `Qu\xE1 nh\u1ECF: mong \u0111\u1EE3i ${n.origin} ${i.verb} ${u}${n.minimum.toString()} ${i.unit}`;
        return `Qu\xE1 nh\u1ECF: mong \u0111\u1EE3i ${n.origin} ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i b\u1EAFt \u0111\u1EA7u b\u1EB1ng "${u.prefix}"`;
        if (u.format === "ends_with") return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i k\u1EBFt th\xFAc b\u1EB1ng "${u.suffix}"`;
        if (u.format === "includes") return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i bao g\u1ED3m "${u.includes}"`;
        if (u.format === "regex") return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i kh\u1EDBp v\u1EDBi m\u1EABu ${u.pattern}`;
        return `${$[u.format] ?? n.format} kh\xF4ng h\u1EE3p l\u1EC7`;
      }
      case "not_multiple_of":
        return `S\u1ED1 kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i l\xE0 b\u1ED9i s\u1ED1 c\u1EE7a ${n.divisor}`;
      case "unrecognized_keys":
        return `Kh\xF3a kh\xF4ng \u0111\u01B0\u1EE3c nh\u1EADn d\u1EA1ng: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `Kh\xF3a kh\xF4ng h\u1EE3p l\u1EC7 trong ${n.origin}`;
      case "invalid_union":
        return "\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7";
      case "invalid_element":
        return `Gi\xE1 tr\u1ECB kh\xF4ng h\u1EE3p l\u1EC7 trong ${n.origin}`;
      default:
        return "\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7";
    }
  };
};
function Di() {
  return { localeError: Ll() };
}
var Gl = () => {
  let r = { string: { unit: "\u5B57\u7B26", verb: "\u5305\u542B" }, file: { unit: "\u5B57\u8282", verb: "\u5305\u542B" }, array: { unit: "\u9879", verb: "\u5305\u542B" }, set: { unit: "\u9879", verb: "\u5305\u542B" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "\u975E\u6570\u5B57(NaN)" : "\u6570\u5B57";
      case "object": {
        if (Array.isArray(n)) return "\u6570\u7EC4";
        if (n === null) return "\u7A7A\u503C(null)";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u8F93\u5165", email: "\u7535\u5B50\u90AE\u4EF6", url: "URL", emoji: "\u8868\u60C5\u7B26\u53F7", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO\u65E5\u671F\u65F6\u95F4", date: "ISO\u65E5\u671F", time: "ISO\u65F6\u95F4", duration: "ISO\u65F6\u957F", ipv4: "IPv4\u5730\u5740", ipv6: "IPv6\u5730\u5740", cidrv4: "IPv4\u7F51\u6BB5", cidrv6: "IPv6\u7F51\u6BB5", base64: "base64\u7F16\u7801\u5B57\u7B26\u4E32", base64url: "base64url\u7F16\u7801\u5B57\u7B26\u4E32", json_string: "JSON\u5B57\u7B26\u4E32", e164: "E.164\u53F7\u7801", jwt: "JWT", template_literal: "\u8F93\u5165" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B ${n.expected}\uFF0C\u5B9E\u9645\u63A5\u6536 ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B ${N(n.values[0])}`;
        return `\u65E0\u6548\u9009\u9879\uFF1A\u671F\u671B\u4EE5\u4E0B\u4E4B\u4E00 ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `\u6570\u503C\u8FC7\u5927\uFF1A\u671F\u671B ${n.origin ?? "\u503C"} ${u}${n.maximum.toString()} ${i.unit ?? "\u4E2A\u5143\u7D20"}`;
        return `\u6570\u503C\u8FC7\u5927\uFF1A\u671F\u671B ${n.origin ?? "\u503C"} ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `\u6570\u503C\u8FC7\u5C0F\uFF1A\u671F\u671B ${n.origin} ${u}${n.minimum.toString()} ${i.unit}`;
        return `\u6570\u503C\u8FC7\u5C0F\uFF1A\u671F\u671B ${n.origin} ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u4EE5 "${u.prefix}" \u5F00\u5934`;
        if (u.format === "ends_with") return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u4EE5 "${u.suffix}" \u7ED3\u5C3E`;
        if (u.format === "includes") return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u5305\u542B "${u.includes}"`;
        if (u.format === "regex") return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u6EE1\u8DB3\u6B63\u5219\u8868\u8FBE\u5F0F ${u.pattern}`;
        return `\u65E0\u6548${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `\u65E0\u6548\u6570\u5B57\uFF1A\u5FC5\u987B\u662F ${n.divisor} \u7684\u500D\u6570`;
      case "unrecognized_keys":
        return `\u51FA\u73B0\u672A\u77E5\u7684\u952E(key): ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `${n.origin} \u4E2D\u7684\u952E(key)\u65E0\u6548`;
      case "invalid_union":
        return "\u65E0\u6548\u8F93\u5165";
      case "invalid_element":
        return `${n.origin} \u4E2D\u5305\u542B\u65E0\u6548\u503C(value)`;
      default:
        return "\u65E0\u6548\u8F93\u5165";
    }
  };
};
function ji() {
  return { localeError: Gl() };
}
var Wl = () => {
  let r = { string: { unit: "\u5B57\u5143", verb: "\u64C1\u6709" }, file: { unit: "\u4F4D\u5143\u7D44", verb: "\u64C1\u6709" }, array: { unit: "\u9805\u76EE", verb: "\u64C1\u6709" }, set: { unit: "\u9805\u76EE", verb: "\u64C1\u6709" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "number";
      case "object": {
        if (Array.isArray(n)) return "array";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u8F38\u5165", email: "\u90F5\u4EF6\u5730\u5740", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO \u65E5\u671F\u6642\u9593", date: "ISO \u65E5\u671F", time: "ISO \u6642\u9593", duration: "ISO \u671F\u9593", ipv4: "IPv4 \u4F4D\u5740", ipv6: "IPv6 \u4F4D\u5740", cidrv4: "IPv4 \u7BC4\u570D", cidrv6: "IPv6 \u7BC4\u570D", base64: "base64 \u7DE8\u78BC\u5B57\u4E32", base64url: "base64url \u7DE8\u78BC\u5B57\u4E32", json_string: "JSON \u5B57\u4E32", e164: "E.164 \u6578\u503C", jwt: "JWT", template_literal: "\u8F38\u5165" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA ${n.expected}\uFF0C\u4F46\u6536\u5230 ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA ${N(n.values[0])}`;
        return `\u7121\u6548\u7684\u9078\u9805\uFF1A\u9810\u671F\u70BA\u4EE5\u4E0B\u5176\u4E2D\u4E4B\u4E00 ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `\u6578\u503C\u904E\u5927\uFF1A\u9810\u671F ${n.origin ?? "\u503C"} \u61C9\u70BA ${u}${n.maximum.toString()} ${i.unit ?? "\u500B\u5143\u7D20"}`;
        return `\u6578\u503C\u904E\u5927\uFF1A\u9810\u671F ${n.origin ?? "\u503C"} \u61C9\u70BA ${u}${n.maximum.toString()}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `\u6578\u503C\u904E\u5C0F\uFF1A\u9810\u671F ${n.origin} \u61C9\u70BA ${u}${n.minimum.toString()} ${i.unit}`;
        return `\u6578\u503C\u904E\u5C0F\uFF1A\u9810\u671F ${n.origin} \u61C9\u70BA ${u}${n.minimum.toString()}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u4EE5 "${u.prefix}" \u958B\u982D`;
        if (u.format === "ends_with") return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u4EE5 "${u.suffix}" \u7D50\u5C3E`;
        if (u.format === "includes") return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u5305\u542B "${u.includes}"`;
        if (u.format === "regex") return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u7B26\u5408\u683C\u5F0F ${u.pattern}`;
        return `\u7121\u6548\u7684 ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `\u7121\u6548\u7684\u6578\u5B57\uFF1A\u5FC5\u9808\u70BA ${n.divisor} \u7684\u500D\u6578`;
      case "unrecognized_keys":
        return `\u7121\u6CD5\u8B58\u5225\u7684\u9375\u503C${n.keys.length > 1 ? "\u5011" : ""}\uFF1A${_(n.keys, "\u3001")}`;
      case "invalid_key":
        return `${n.origin} \u4E2D\u6709\u7121\u6548\u7684\u9375\u503C`;
      case "invalid_union":
        return "\u7121\u6548\u7684\u8F38\u5165\u503C";
      case "invalid_element":
        return `${n.origin} \u4E2D\u6709\u7121\u6548\u7684\u503C`;
      default:
        return "\u7121\u6548\u7684\u8F38\u5165\u503C";
    }
  };
};
function Pi() {
  return { localeError: Wl() };
}
var Xl = () => {
  let r = { string: { unit: "\xE0mi", verb: "n\xED" }, file: { unit: "bytes", verb: "n\xED" }, array: { unit: "nkan", verb: "n\xED" }, set: { unit: "nkan", verb: "n\xED" } };
  function v(n) {
    return r[n] ?? null;
  }
  let o = (n) => {
    let u = typeof n;
    switch (u) {
      case "number":
        return Number.isNaN(n) ? "NaN" : "n\u1ECD\u0301mb\xE0";
      case "object": {
        if (Array.isArray(n)) return "akop\u1ECD";
        if (n === null) return "null";
        if (Object.getPrototypeOf(n) !== Object.prototype && n.constructor) return n.constructor.name;
      }
    }
    return u;
  }, $ = { regex: "\u1EB9\u0300r\u1ECD \xECb\xE1w\u1ECDl\xE9", email: "\xE0d\xEDr\u1EB9\u0301s\xEC \xECm\u1EB9\u0301l\xEC", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "\xE0k\xF3k\xF2 ISO", date: "\u1ECDj\u1ECD\u0301 ISO", time: "\xE0k\xF3k\xF2 ISO", duration: "\xE0k\xF3k\xF2 t\xF3 p\xE9 ISO", ipv4: "\xE0d\xEDr\u1EB9\u0301s\xEC IPv4", ipv6: "\xE0d\xEDr\u1EB9\u0301s\xEC IPv6", cidrv4: "\xE0gb\xE8gb\xE8 IPv4", cidrv6: "\xE0gb\xE8gb\xE8 IPv6", base64: "\u1ECD\u0300r\u1ECD\u0300 t\xED a k\u1ECD\u0301 n\xED base64", base64url: "\u1ECD\u0300r\u1ECD\u0300 base64url", json_string: "\u1ECD\u0300r\u1ECD\u0300 JSON", e164: "n\u1ECD\u0301mb\xE0 E.164", jwt: "JWT", template_literal: "\u1EB9\u0300r\u1ECD \xECb\xE1w\u1ECDl\xE9" };
  return (n) => {
    switch (n.code) {
      case "invalid_type":
        return `\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e: a n\xED l\xE1ti fi ${n.expected}, \xE0m\u1ECD\u0300 a r\xED ${o(n.input)}`;
      case "invalid_value":
        if (n.values.length === 1) return `\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e: a n\xED l\xE1ti fi ${N(n.values[0])}`;
        return `\xC0\u1E63\xE0y\xE0n a\u1E63\xEC\u1E63e: yan \u1ECD\u0300kan l\xE1ra ${_(n.values, "|")}`;
      case "too_big": {
        let u = n.inclusive ? "<=" : "<", i = v(n.origin);
        if (i) return `T\xF3 p\u1ECD\u0300 j\xF9: a n\xED l\xE1ti j\u1EB9\u0301 p\xE9 ${n.origin ?? "iye"} ${i.verb} ${u}${n.maximum} ${i.unit}`;
        return `T\xF3 p\u1ECD\u0300 j\xF9: a n\xED l\xE1ti j\u1EB9\u0301 ${u}${n.maximum}`;
      }
      case "too_small": {
        let u = n.inclusive ? ">=" : ">", i = v(n.origin);
        if (i) return `K\xE9r\xE9 ju: a n\xED l\xE1ti j\u1EB9\u0301 p\xE9 ${n.origin} ${i.verb} ${u}${n.minimum} ${i.unit}`;
        return `K\xE9r\xE9 ju: a n\xED l\xE1ti j\u1EB9\u0301 ${u}${n.minimum}`;
      }
      case "invalid_format": {
        let u = n;
        if (u.format === "starts_with") return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 b\u1EB9\u0300r\u1EB9\u0300 p\u1EB9\u0300l\xFA "${u.prefix}"`;
        if (u.format === "ends_with") return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 par\xED p\u1EB9\u0300l\xFA "${u.suffix}"`;
        if (u.format === "includes") return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 n\xED "${u.includes}"`;
        if (u.format === "regex") return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 b\xE1 \xE0p\u1EB9\u1EB9r\u1EB9 mu ${u.pattern}`;
        return `A\u1E63\xEC\u1E63e: ${$[u.format] ?? n.format}`;
      }
      case "not_multiple_of":
        return `N\u1ECD\u0301mb\xE0 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 j\u1EB9\u0301 \xE8y\xE0 p\xEDp\xEDn ti ${n.divisor}`;
      case "unrecognized_keys":
        return `B\u1ECDt\xECn\xEC \xE0\xECm\u1ECD\u0300: ${_(n.keys, ", ")}`;
      case "invalid_key":
        return `B\u1ECDt\xECn\xEC a\u1E63\xEC\u1E63e n\xEDn\xFA ${n.origin}`;
      case "invalid_union":
        return "\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e";
      case "invalid_element":
        return `Iye a\u1E63\xEC\u1E63e n\xEDn\xFA ${n.origin}`;
      default:
        return "\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e";
    }
  };
};
function Si() {
  return { localeError: Xl() };
}
var xt;
var Ai = /* @__PURE__ */ Symbol("ZodOutput");
var Ji = /* @__PURE__ */ Symbol("ZodInput");
var Ei = class {
  constructor() {
    this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map();
  }
  add(r, ...v) {
    let o = v[0];
    if (this._map.set(r, o), o && typeof o === "object" && "id" in o) {
      if (this._idmap.has(o.id)) throw Error(`ID ${o.id} already exists in the registry`);
      this._idmap.set(o.id, r);
    }
    return this;
  }
  clear() {
    return this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map(), this;
  }
  remove(r) {
    let v = this._map.get(r);
    if (v && typeof v === "object" && "id" in v) this._idmap.delete(v.id);
    return this._map.delete(r), this;
  }
  get(r) {
    let v = r._zod.parent;
    if (v) {
      let o = { ...this.get(v) ?? {} };
      delete o.id;
      let $ = { ...o, ...this._map.get(r) };
      return Object.keys($).length ? $ : void 0;
    }
    return this._map.get(r);
  }
  has(r) {
    return this._map.has(r);
  }
};
function ov() {
  return new Ei();
}
(xt = globalThis).__zod_globalRegistry ?? (xt.__zod_globalRegistry = ov());
var Y = globalThis.__zod_globalRegistry;
function Li(r, v) {
  return new r({ type: "string", ...O(v) });
}
function Gi(r, v) {
  return new r({ type: "string", coerce: true, ...O(v) });
}
function uv(r, v) {
  return new r({ type: "string", format: "email", check: "string_format", abort: false, ...O(v) });
}
function On(r, v) {
  return new r({ type: "string", format: "guid", check: "string_format", abort: false, ...O(v) });
}
function $v(r, v) {
  return new r({ type: "string", format: "uuid", check: "string_format", abort: false, ...O(v) });
}
function iv(r, v) {
  return new r({ type: "string", format: "uuid", check: "string_format", abort: false, version: "v4", ...O(v) });
}
function gv(r, v) {
  return new r({ type: "string", format: "uuid", check: "string_format", abort: false, version: "v6", ...O(v) });
}
function bv(r, v) {
  return new r({ type: "string", format: "uuid", check: "string_format", abort: false, version: "v7", ...O(v) });
}
function cn(r, v) {
  return new r({ type: "string", format: "url", check: "string_format", abort: false, ...O(v) });
}
function tv(r, v) {
  return new r({ type: "string", format: "emoji", check: "string_format", abort: false, ...O(v) });
}
function Iv(r, v) {
  return new r({ type: "string", format: "nanoid", check: "string_format", abort: false, ...O(v) });
}
function lv(r, v) {
  return new r({ type: "string", format: "cuid", check: "string_format", abort: false, ...O(v) });
}
function Uv(r, v) {
  return new r({ type: "string", format: "cuid2", check: "string_format", abort: false, ...O(v) });
}
function _v(r, v) {
  return new r({ type: "string", format: "ulid", check: "string_format", abort: false, ...O(v) });
}
function wv(r, v) {
  return new r({ type: "string", format: "xid", check: "string_format", abort: false, ...O(v) });
}
function Nv(r, v) {
  return new r({ type: "string", format: "ksuid", check: "string_format", abort: false, ...O(v) });
}
function kv(r, v) {
  return new r({ type: "string", format: "ipv4", check: "string_format", abort: false, ...O(v) });
}
function Ov(r, v) {
  return new r({ type: "string", format: "ipv6", check: "string_format", abort: false, ...O(v) });
}
function Wi(r, v) {
  return new r({ type: "string", format: "mac", check: "string_format", abort: false, ...O(v) });
}
function cv(r, v) {
  return new r({ type: "string", format: "cidrv4", check: "string_format", abort: false, ...O(v) });
}
function Dv(r, v) {
  return new r({ type: "string", format: "cidrv6", check: "string_format", abort: false, ...O(v) });
}
function jv(r, v) {
  return new r({ type: "string", format: "base64", check: "string_format", abort: false, ...O(v) });
}
function Pv(r, v) {
  return new r({ type: "string", format: "base64url", check: "string_format", abort: false, ...O(v) });
}
function Sv(r, v) {
  return new r({ type: "string", format: "e164", check: "string_format", abort: false, ...O(v) });
}
function Av(r, v) {
  return new r({ type: "string", format: "jwt", check: "string_format", abort: false, ...O(v) });
}
var Xi = { Any: null, Minute: -1, Second: 0, Millisecond: 3, Microsecond: 6 };
function Ki(r, v) {
  return new r({ type: "string", format: "datetime", check: "string_format", offset: false, local: false, precision: null, ...O(v) });
}
function Vi(r, v) {
  return new r({ type: "string", format: "date", check: "string_format", ...O(v) });
}
function Yi(r, v) {
  return new r({ type: "string", format: "time", check: "string_format", precision: null, ...O(v) });
}
function Qi(r, v) {
  return new r({ type: "string", format: "duration", check: "string_format", ...O(v) });
}
function qi(r, v) {
  return new r({ type: "number", checks: [], ...O(v) });
}
function Bi(r, v) {
  return new r({ type: "number", coerce: true, checks: [], ...O(v) });
}
function Hi(r, v) {
  return new r({ type: "number", check: "number_format", abort: false, format: "safeint", ...O(v) });
}
function Mi(r, v) {
  return new r({ type: "number", check: "number_format", abort: false, format: "float32", ...O(v) });
}
function Fi(r, v) {
  return new r({ type: "number", check: "number_format", abort: false, format: "float64", ...O(v) });
}
function Ri(r, v) {
  return new r({ type: "number", check: "number_format", abort: false, format: "int32", ...O(v) });
}
function Ti(r, v) {
  return new r({ type: "number", check: "number_format", abort: false, format: "uint32", ...O(v) });
}
function zi(r, v) {
  return new r({ type: "boolean", ...O(v) });
}
function Zi(r, v) {
  return new r({ type: "boolean", coerce: true, ...O(v) });
}
function ei(r, v) {
  return new r({ type: "bigint", ...O(v) });
}
function mi(r, v) {
  return new r({ type: "bigint", coerce: true, ...O(v) });
}
function Ci(r, v) {
  return new r({ type: "bigint", check: "bigint_format", abort: false, format: "int64", ...O(v) });
}
function xi(r, v) {
  return new r({ type: "bigint", check: "bigint_format", abort: false, format: "uint64", ...O(v) });
}
function fi(r, v) {
  return new r({ type: "symbol", ...O(v) });
}
function hi(r, v) {
  return new r({ type: "undefined", ...O(v) });
}
function yi(r, v) {
  return new r({ type: "null", ...O(v) });
}
function di(r) {
  return new r({ type: "any" });
}
function pi(r) {
  return new r({ type: "unknown" });
}
function ai(r, v) {
  return new r({ type: "never", ...O(v) });
}
function si(r, v) {
  return new r({ type: "void", ...O(v) });
}
function rg(r, v) {
  return new r({ type: "date", ...O(v) });
}
function ng(r, v) {
  return new r({ type: "date", coerce: true, ...O(v) });
}
function vg(r, v) {
  return new r({ type: "nan", ...O(v) });
}
function x(r, v) {
  return new xn({ check: "less_than", ...O(v), value: r, inclusive: false });
}
function R(r, v) {
  return new xn({ check: "less_than", ...O(v), value: r, inclusive: true });
}
function f(r, v) {
  return new fn({ check: "greater_than", ...O(v), value: r, inclusive: false });
}
function Q(r, v) {
  return new fn({ check: "greater_than", ...O(v), value: r, inclusive: true });
}
function Jv(r) {
  return f(0, r);
}
function Ev(r) {
  return x(0, r);
}
function Lv(r) {
  return R(0, r);
}
function Gv(r) {
  return Q(0, r);
}
function ur(r, v) {
  return new uu({ check: "multiple_of", ...O(v), value: r });
}
function _r(r, v) {
  return new gu({ check: "max_size", ...O(v), maximum: r });
}
function $r(r, v) {
  return new bu({ check: "min_size", ...O(v), minimum: r });
}
function Lr(r, v) {
  return new tu({ check: "size_equals", ...O(v), size: r });
}
function wr(r, v) {
  return new Iu({ check: "max_length", ...O(v), maximum: r });
}
function p(r, v) {
  return new lu({ check: "min_length", ...O(v), minimum: r });
}
function Nr(r, v) {
  return new Uu({ check: "length_equals", ...O(v), length: r });
}
function Gr(r, v) {
  return new _u({ check: "string_format", format: "regex", ...O(v), pattern: r });
}
function Wr(r) {
  return new wu({ check: "string_format", format: "lowercase", ...O(r) });
}
function Xr(r) {
  return new Nu({ check: "string_format", format: "uppercase", ...O(r) });
}
function Kr(r, v) {
  return new ku({ check: "string_format", format: "includes", ...O(v), includes: r });
}
function Vr(r, v) {
  return new Ou({ check: "string_format", format: "starts_with", ...O(v), prefix: r });
}
function Yr(r, v) {
  return new cu({ check: "string_format", format: "ends_with", ...O(v), suffix: r });
}
function Wv(r, v, o) {
  return new Du({ check: "property", property: r, schema: v, ...O(o) });
}
function Qr(r, v) {
  return new ju({ check: "mime_type", mime: r, ...O(v) });
}
function e(r) {
  return new Pu({ check: "overwrite", tx: r });
}
function qr(r) {
  return e((v) => v.normalize(r));
}
function Br() {
  return e((r) => r.trim());
}
function Hr() {
  return e((r) => r.toLowerCase());
}
function Mr() {
  return e((r) => r.toUpperCase());
}
function Fr() {
  return e((r) => Oo(r));
}
function og(r, v, o) {
  return new r({ type: "array", element: v, ...O(o) });
}
function Vl(r, v, o) {
  return new r({ type: "union", options: v, ...O(o) });
}
function Yl(r, v, o) {
  return new r({ type: "union", options: v, inclusive: false, ...O(o) });
}
function Ql(r, v, o, $) {
  return new r({ type: "union", options: o, discriminator: v, ...O($) });
}
function ql(r, v, o) {
  return new r({ type: "intersection", left: v, right: o });
}
function Bl(r, v, o, $) {
  let n = o instanceof P;
  return new r({ type: "tuple", items: v, rest: n ? o : null, ...O(n ? $ : o) });
}
function Hl(r, v, o, $) {
  return new r({ type: "record", keyType: v, valueType: o, ...O($) });
}
function Ml(r, v, o, $) {
  return new r({ type: "map", keyType: v, valueType: o, ...O($) });
}
function Fl(r, v, o) {
  return new r({ type: "set", valueType: v, ...O(o) });
}
function Rl(r, v, o) {
  let $ = Array.isArray(v) ? Object.fromEntries(v.map((n) => [n, n])) : v;
  return new r({ type: "enum", entries: $, ...O(o) });
}
function Tl(r, v, o) {
  return new r({ type: "enum", entries: v, ...O(o) });
}
function zl(r, v, o) {
  return new r({ type: "literal", values: Array.isArray(v) ? v : [v], ...O(o) });
}
function ug(r, v) {
  return new r({ type: "file", ...O(v) });
}
function Zl(r, v) {
  return new r({ type: "transform", transform: v });
}
function el(r, v) {
  return new r({ type: "optional", innerType: v });
}
function ml(r, v) {
  return new r({ type: "nullable", innerType: v });
}
function Cl(r, v, o) {
  return new r({ type: "default", innerType: v, get defaultValue() {
    return typeof o === "function" ? o() : Do(o);
  } });
}
function xl(r, v, o) {
  return new r({ type: "nonoptional", innerType: v, ...O(o) });
}
function fl(r, v) {
  return new r({ type: "success", innerType: v });
}
function hl(r, v, o) {
  return new r({ type: "catch", innerType: v, catchValue: typeof o === "function" ? o : () => o });
}
function yl(r, v, o) {
  return new r({ type: "pipe", in: v, out: o });
}
function dl(r, v) {
  return new r({ type: "readonly", innerType: v });
}
function pl(r, v, o) {
  return new r({ type: "template_literal", parts: v, ...O(o) });
}
function al(r, v) {
  return new r({ type: "lazy", getter: v });
}
function sl(r, v) {
  return new r({ type: "promise", innerType: v });
}
function $g(r, v, o) {
  let $ = O(o);
  return $.abort ?? ($.abort = true), new r({ type: "custom", check: "custom", fn: v, ...$ });
}
function ig(r, v, o) {
  return new r({ type: "custom", check: "custom", fn: v, ...O(o) });
}
function gg(r) {
  let v = ft((o) => {
    return o.addIssue = ($) => {
      if (typeof $ === "string") o.issues.push(jr($, o.value, v._zod.def));
      else {
        let n = $;
        if (n.fatal) n.continue = false;
        n.code ?? (n.code = "custom"), n.input ?? (n.input = o.value), n.inst ?? (n.inst = v), n.continue ?? (n.continue = !v._zod.def.abort), o.issues.push(jr(n));
      }
    }, r(o.value, o);
  });
  return v;
}
function ft(r, v) {
  let o = new W({ check: "custom", ...O(v) });
  return o._zod.check = r, o;
}
function bg(r) {
  let v = new W({ check: "describe" });
  return v._zod.onattach = [(o) => {
    let $ = Y.get(o) ?? {};
    Y.add(o, { ...$, description: r });
  }], v._zod.check = () => {
  }, v;
}
function tg(r) {
  let v = new W({ check: "meta" });
  return v._zod.onattach = [(o) => {
    let $ = Y.get(o) ?? {};
    Y.add(o, { ...$, ...r });
  }], v._zod.check = () => {
  }, v;
}
function Ig(r, v) {
  let o = O(v), $ = o.truthy ?? ["true", "1", "yes", "on", "y", "enabled"], n = o.falsy ?? ["false", "0", "no", "off", "n", "disabled"];
  if (o.case !== "sensitive") $ = $.map((j) => typeof j === "string" ? j.toLowerCase() : j), n = n.map((j) => typeof j === "string" ? j.toLowerCase() : j);
  let u = new Set($), i = new Set(n), g = r.Codec ?? In, I = r.Boolean ?? bn, U = new (r.String ?? Ur)({ type: "string", error: o.error }), w = new I({ type: "boolean", error: o.error }), D = new g({ type: "pipe", in: U, out: w, transform: (j, J) => {
    let T = j;
    if (o.case !== "sensitive") T = T.toLowerCase();
    if (u.has(T)) return true;
    else if (i.has(T)) return false;
    else return J.issues.push({ code: "invalid_value", expected: "stringbool", values: [...u, ...i], input: J.value, inst: D, continue: false }), {};
  }, reverseTransform: (j, J) => {
    if (j === true) return $[0] || "true";
    else return n[0] || "false";
  }, error: o.error });
  return D;
}
function Rr(r, v, o, $ = {}) {
  let n = O($), u = { ...O($), check: "string_format", type: "string", format: v, fn: typeof o === "function" ? o : (g) => o.test(g), ...n };
  if (o instanceof RegExp) u.pattern = o;
  return new r(u);
}
function ir(r) {
  let v = r?.target ?? "draft-2020-12";
  if (v === "draft-4") v = "draft-04";
  if (v === "draft-7") v = "draft-07";
  return { processors: r.processors ?? {}, metadataRegistry: r?.metadata ?? Y, target: v, unrepresentable: r?.unrepresentable ?? "throw", override: r?.override ?? (() => {
  }), io: r?.io ?? "output", counter: 0, seen: /* @__PURE__ */ new Map(), cycles: r?.cycles ?? "ref", reused: r?.reused ?? "inline", external: r?.external ?? void 0 };
}
function E(r, v, o = { path: [], schemaPath: [] }) {
  var $;
  let n = r._zod.def, u = v.seen.get(r);
  if (u) {
    if (u.count++, o.schemaPath.includes(r)) u.cycle = o.path;
    return u.schema;
  }
  let i = { schema: {}, count: 1, cycle: void 0, path: o.path };
  v.seen.set(r, i);
  let g = r._zod.toJSONSchema?.();
  if (g) i.schema = g;
  else {
    let U = { ...o, schemaPath: [...o.schemaPath, r], path: o.path }, w = r._zod.parent;
    if (w) i.ref = w, E(w, v, U), v.seen.get(w).isParent = true;
    else if (r._zod.processJSONSchema) r._zod.processJSONSchema(v, i.schema, U);
    else {
      let D = i.schema, j = v.processors[n.type];
      if (!j) throw Error(`[toJSONSchema]: Non-representable type encountered: ${n.type}`);
      j(r, v, D, U);
    }
  }
  let I = v.metadataRegistry.get(r);
  if (I) Object.assign(i.schema, I);
  if (v.io === "input" && q(r)) delete i.schema.examples, delete i.schema.default;
  if (v.io === "input" && i.schema._prefault) ($ = i.schema).default ?? ($.default = i.schema._prefault);
  return delete i.schema._prefault, v.seen.get(r).schema;
}
function gr(r, v) {
  let o = r.seen.get(v);
  if (!o) throw Error("Unprocessed schema. This is a bug in Zod.");
  let $ = (u) => {
    let i = r.target === "draft-2020-12" ? "$defs" : "definitions";
    if (r.external) {
      let U = r.external.registry.get(u[0])?.id, w = r.external.uri ?? ((j) => j);
      if (U) return { ref: w(U) };
      let D = u[1].defId ?? u[1].schema.id ?? `schema${r.counter++}`;
      return u[1].defId = D, { defId: D, ref: `${w("__shared")}#/${i}/${D}` };
    }
    if (u[1] === o) return { ref: "#" };
    let I = `${"#"}/${i}/`, b = u[1].schema.id ?? `__schema${r.counter++}`;
    return { defId: b, ref: I + b };
  }, n = (u) => {
    if (u[1].schema.$ref) return;
    let i = u[1], { ref: g, defId: I } = $(u);
    if (i.def = { ...i.schema }, I) i.defId = I;
    let b = i.schema;
    for (let U in b) delete b[U];
    b.$ref = g;
  };
  if (r.cycles === "throw") for (let u of r.seen.entries()) {
    let i = u[1];
    if (i.cycle) throw Error(`Cycle detected: #/${i.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
  }
  for (let u of r.seen.entries()) {
    let i = u[1];
    if (v === u[0]) {
      n(u);
      continue;
    }
    if (r.external) {
      let I = r.external.registry.get(u[0])?.id;
      if (v !== u[0] && I) {
        n(u);
        continue;
      }
    }
    if (r.metadataRegistry.get(u[0])?.id) {
      n(u);
      continue;
    }
    if (i.cycle) {
      n(u);
      continue;
    }
    if (i.count > 1) {
      if (r.reused === "ref") {
        n(u);
        continue;
      }
    }
  }
}
function br(r, v) {
  let o = r.seen.get(v);
  if (!o) throw Error("Unprocessed schema. This is a bug in Zod.");
  let $ = (i) => {
    let g = r.seen.get(i), I = g.def ?? g.schema, b = { ...I };
    if (g.ref === null) return;
    let U = g.ref;
    if (g.ref = null, U) {
      $(U);
      let w = r.seen.get(U).schema;
      if (w.$ref && (r.target === "draft-07" || r.target === "draft-04" || r.target === "openapi-3.0")) I.allOf = I.allOf ?? [], I.allOf.push(w);
      else Object.assign(I, w), Object.assign(I, b);
    }
    if (!g.isParent) r.override({ zodSchema: i, jsonSchema: I, path: g.path ?? [] });
  };
  for (let i of [...r.seen.entries()].reverse()) $(i[0]);
  let n = {};
  if (r.target === "draft-2020-12") n.$schema = "https://json-schema.org/draft/2020-12/schema";
  else if (r.target === "draft-07") n.$schema = "http://json-schema.org/draft-07/schema#";
  else if (r.target === "draft-04") n.$schema = "http://json-schema.org/draft-04/schema#";
  else if (r.target === "openapi-3.0") ;
  if (r.external?.uri) {
    let i = r.external.registry.get(v)?.id;
    if (!i) throw Error("Schema is missing an `id` property");
    n.$id = r.external.uri(i);
  }
  Object.assign(n, o.def ?? o.schema);
  let u = r.external?.defs ?? {};
  for (let i of r.seen.entries()) {
    let g = i[1];
    if (g.def && g.defId) u[g.defId] = g.def;
  }
  if (r.external) ;
  else if (Object.keys(u).length > 0) if (r.target === "draft-2020-12") n.$defs = u;
  else n.definitions = u;
  try {
    let i = JSON.parse(JSON.stringify(n));
    return Object.defineProperty(i, "~standard", { value: { ...v["~standard"], jsonSchema: { input: Tr(v, "input"), output: Tr(v, "output") } }, enumerable: false, writable: false }), i;
  } catch (i) {
    throw Error("Error converting schema to JSON.");
  }
}
function q(r, v) {
  let o = v ?? { seen: /* @__PURE__ */ new Set() };
  if (o.seen.has(r)) return false;
  o.seen.add(r);
  let $ = r._zod.def;
  if ($.type === "transform") return true;
  if ($.type === "array") return q($.element, o);
  if ($.type === "set") return q($.valueType, o);
  if ($.type === "lazy") return q($.getter(), o);
  if ($.type === "promise" || $.type === "optional" || $.type === "nonoptional" || $.type === "nullable" || $.type === "readonly" || $.type === "default" || $.type === "prefault") return q($.innerType, o);
  if ($.type === "intersection") return q($.left, o) || q($.right, o);
  if ($.type === "record" || $.type === "map") return q($.keyType, o) || q($.valueType, o);
  if ($.type === "pipe") return q($.in, o) || q($.out, o);
  if ($.type === "object") {
    for (let n in $.shape) if (q($.shape[n], o)) return true;
    return false;
  }
  if ($.type === "union") {
    for (let n of $.options) if (q(n, o)) return true;
    return false;
  }
  if ($.type === "tuple") {
    for (let n of $.items) if (q(n, o)) return true;
    if ($.rest && q($.rest, o)) return true;
    return false;
  }
  return false;
}
var lg = (r, v = {}) => (o) => {
  let $ = ir({ ...o, processors: v });
  return E(r, $), gr($, r), br($, r);
};
var Tr = (r, v) => (o) => {
  let { libraryOptions: $, target: n } = o ?? {}, u = ir({ ...$ ?? {}, target: n, io: v, processors: {} });
  return E(r, u), gr(u, r), br(u, r);
};
var rU = { guid: "uuid", url: "uri", datetime: "date-time", json_string: "json-string", regex: "" };
var Ug = (r, v, o, $) => {
  let n = o;
  n.type = "string";
  let { minimum: u, maximum: i, format: g, patterns: I, contentEncoding: b } = r._zod.bag;
  if (typeof u === "number") n.minLength = u;
  if (typeof i === "number") n.maxLength = i;
  if (g) {
    if (n.format = rU[g] ?? g, n.format === "") delete n.format;
  }
  if (b) n.contentEncoding = b;
  if (I && I.size > 0) {
    let U = [...I];
    if (U.length === 1) n.pattern = U[0].source;
    else if (U.length > 1) n.allOf = [...U.map((w) => ({ ...v.target === "draft-07" || v.target === "draft-04" || v.target === "openapi-3.0" ? { type: "string" } : {}, pattern: w.source }))];
  }
};
var _g = (r, v, o, $) => {
  let n = o, { minimum: u, maximum: i, format: g, multipleOf: I, exclusiveMaximum: b, exclusiveMinimum: U } = r._zod.bag;
  if (typeof g === "string" && g.includes("int")) n.type = "integer";
  else n.type = "number";
  if (typeof U === "number") if (v.target === "draft-04" || v.target === "openapi-3.0") n.minimum = U, n.exclusiveMinimum = true;
  else n.exclusiveMinimum = U;
  if (typeof u === "number") {
    if (n.minimum = u, typeof U === "number" && v.target !== "draft-04") if (U >= u) delete n.minimum;
    else delete n.exclusiveMinimum;
  }
  if (typeof b === "number") if (v.target === "draft-04" || v.target === "openapi-3.0") n.maximum = b, n.exclusiveMaximum = true;
  else n.exclusiveMaximum = b;
  if (typeof i === "number") {
    if (n.maximum = i, typeof b === "number" && v.target !== "draft-04") if (b <= i) delete n.maximum;
    else delete n.exclusiveMaximum;
  }
  if (typeof I === "number") n.multipleOf = I;
};
var wg = (r, v, o, $) => {
  o.type = "boolean";
};
var Ng = (r, v, o, $) => {
  if (v.unrepresentable === "throw") throw Error("BigInt cannot be represented in JSON Schema");
};
var kg = (r, v, o, $) => {
  if (v.unrepresentable === "throw") throw Error("Symbols cannot be represented in JSON Schema");
};
var Og = (r, v, o, $) => {
  if (v.target === "openapi-3.0") o.type = "string", o.nullable = true, o.enum = [null];
  else o.type = "null";
};
var cg = (r, v, o, $) => {
  if (v.unrepresentable === "throw") throw Error("Undefined cannot be represented in JSON Schema");
};
var Dg = (r, v, o, $) => {
  if (v.unrepresentable === "throw") throw Error("Void cannot be represented in JSON Schema");
};
var jg = (r, v, o, $) => {
  o.not = {};
};
var Pg = (r, v, o, $) => {
};
var Sg = (r, v, o, $) => {
};
var Ag = (r, v, o, $) => {
  if (v.unrepresentable === "throw") throw Error("Date cannot be represented in JSON Schema");
};
var Jg = (r, v, o, $) => {
  let n = r._zod.def, u = pr(n.entries);
  if (u.every((i) => typeof i === "number")) o.type = "number";
  if (u.every((i) => typeof i === "string")) o.type = "string";
  o.enum = u;
};
var Eg = (r, v, o, $) => {
  let n = r._zod.def, u = [];
  for (let i of n.values) if (i === void 0) {
    if (v.unrepresentable === "throw") throw Error("Literal `undefined` cannot be represented in JSON Schema");
  } else if (typeof i === "bigint") if (v.unrepresentable === "throw") throw Error("BigInt literals cannot be represented in JSON Schema");
  else u.push(Number(i));
  else u.push(i);
  if (u.length === 0) ;
  else if (u.length === 1) {
    let i = u[0];
    if (o.type = i === null ? "null" : typeof i, v.target === "draft-04" || v.target === "openapi-3.0") o.enum = [i];
    else o.const = i;
  } else {
    if (u.every((i) => typeof i === "number")) o.type = "number";
    if (u.every((i) => typeof i === "string")) o.type = "string";
    if (u.every((i) => typeof i === "boolean")) o.type = "boolean";
    if (u.every((i) => i === null)) o.type = "null";
    o.enum = u;
  }
};
var Lg = (r, v, o, $) => {
  if (v.unrepresentable === "throw") throw Error("NaN cannot be represented in JSON Schema");
};
var Gg = (r, v, o, $) => {
  let n = o, u = r._zod.pattern;
  if (!u) throw Error("Pattern not found in template literal");
  n.type = "string", n.pattern = u.source;
};
var Wg = (r, v, o, $) => {
  let n = o, u = { type: "string", format: "binary", contentEncoding: "binary" }, { minimum: i, maximum: g, mime: I } = r._zod.bag;
  if (i !== void 0) u.minLength = i;
  if (g !== void 0) u.maxLength = g;
  if (I) if (I.length === 1) u.contentMediaType = I[0], Object.assign(n, u);
  else n.anyOf = I.map((b) => {
    return { ...u, contentMediaType: b };
  });
  else Object.assign(n, u);
};
var Xg = (r, v, o, $) => {
  o.type = "boolean";
};
var Kg = (r, v, o, $) => {
  if (v.unrepresentable === "throw") throw Error("Custom types cannot be represented in JSON Schema");
};
var Vg = (r, v, o, $) => {
  if (v.unrepresentable === "throw") throw Error("Function types cannot be represented in JSON Schema");
};
var Yg = (r, v, o, $) => {
  if (v.unrepresentable === "throw") throw Error("Transforms cannot be represented in JSON Schema");
};
var Qg = (r, v, o, $) => {
  if (v.unrepresentable === "throw") throw Error("Map cannot be represented in JSON Schema");
};
var qg = (r, v, o, $) => {
  if (v.unrepresentable === "throw") throw Error("Set cannot be represented in JSON Schema");
};
var Bg = (r, v, o, $) => {
  let n = o, u = r._zod.def, { minimum: i, maximum: g } = r._zod.bag;
  if (typeof i === "number") n.minItems = i;
  if (typeof g === "number") n.maxItems = g;
  n.type = "array", n.items = E(u.element, v, { ...$, path: [...$.path, "items"] });
};
var Hg = (r, v, o, $) => {
  let n = o, u = r._zod.def;
  n.type = "object", n.properties = {};
  let i = u.shape;
  for (let b in i) n.properties[b] = E(i[b], v, { ...$, path: [...$.path, "properties", b] });
  let g = new Set(Object.keys(i)), I = new Set([...g].filter((b) => {
    let U = u.shape[b]._zod;
    if (v.io === "input") return U.optin === void 0;
    else return U.optout === void 0;
  }));
  if (I.size > 0) n.required = Array.from(I);
  if (u.catchall?._zod.def.type === "never") n.additionalProperties = false;
  else if (!u.catchall) {
    if (v.io === "output") n.additionalProperties = false;
  } else if (u.catchall) n.additionalProperties = E(u.catchall, v, { ...$, path: [...$.path, "additionalProperties"] });
};
var Kv = (r, v, o, $) => {
  let n = r._zod.def, u = n.inclusive === false, i = n.options.map((g, I) => E(g, v, { ...$, path: [...$.path, u ? "oneOf" : "anyOf", I] }));
  if (u) o.oneOf = i;
  else o.anyOf = i;
};
var Mg = (r, v, o, $) => {
  let n = r._zod.def, u = E(n.left, v, { ...$, path: [...$.path, "allOf", 0] }), i = E(n.right, v, { ...$, path: [...$.path, "allOf", 1] }), g = (b) => "allOf" in b && Object.keys(b).length === 1, I = [...g(u) ? u.allOf : [u], ...g(i) ? i.allOf : [i]];
  o.allOf = I;
};
var Fg = (r, v, o, $) => {
  let n = o, u = r._zod.def;
  n.type = "array";
  let i = v.target === "draft-2020-12" ? "prefixItems" : "items", g = v.target === "draft-2020-12" ? "items" : v.target === "openapi-3.0" ? "items" : "additionalItems", I = u.items.map((D, j) => E(D, v, { ...$, path: [...$.path, i, j] })), b = u.rest ? E(u.rest, v, { ...$, path: [...$.path, g, ...v.target === "openapi-3.0" ? [u.items.length] : []] }) : null;
  if (v.target === "draft-2020-12") {
    if (n.prefixItems = I, b) n.items = b;
  } else if (v.target === "openapi-3.0") {
    if (n.items = { anyOf: I }, b) n.items.anyOf.push(b);
    if (n.minItems = I.length, !b) n.maxItems = I.length;
  } else if (n.items = I, b) n.additionalItems = b;
  let { minimum: U, maximum: w } = r._zod.bag;
  if (typeof U === "number") n.minItems = U;
  if (typeof w === "number") n.maxItems = w;
};
var Rg = (r, v, o, $) => {
  let n = o, u = r._zod.def;
  if (n.type = "object", v.target === "draft-07" || v.target === "draft-2020-12") n.propertyNames = E(u.keyType, v, { ...$, path: [...$.path, "propertyNames"] });
  n.additionalProperties = E(u.valueType, v, { ...$, path: [...$.path, "additionalProperties"] });
};
var Tg = (r, v, o, $) => {
  let n = r._zod.def, u = E(n.innerType, v, $), i = v.seen.get(r);
  if (v.target === "openapi-3.0") i.ref = n.innerType, o.nullable = true;
  else o.anyOf = [u, { type: "null" }];
};
var zg = (r, v, o, $) => {
  let n = r._zod.def;
  E(n.innerType, v, $);
  let u = v.seen.get(r);
  u.ref = n.innerType;
};
var Zg = (r, v, o, $) => {
  let n = r._zod.def;
  E(n.innerType, v, $);
  let u = v.seen.get(r);
  u.ref = n.innerType, o.default = JSON.parse(JSON.stringify(n.defaultValue));
};
var eg = (r, v, o, $) => {
  let n = r._zod.def;
  E(n.innerType, v, $);
  let u = v.seen.get(r);
  if (u.ref = n.innerType, v.io === "input") o._prefault = JSON.parse(JSON.stringify(n.defaultValue));
};
var mg = (r, v, o, $) => {
  let n = r._zod.def;
  E(n.innerType, v, $);
  let u = v.seen.get(r);
  u.ref = n.innerType;
  let i;
  try {
    i = n.catchValue(void 0);
  } catch {
    throw Error("Dynamic catch values are not supported in JSON Schema");
  }
  o.default = i;
};
var Cg = (r, v, o, $) => {
  let n = r._zod.def, u = v.io === "input" ? n.in._zod.def.type === "transform" ? n.out : n.in : n.out;
  E(u, v, $);
  let i = v.seen.get(r);
  i.ref = u;
};
var xg = (r, v, o, $) => {
  let n = r._zod.def;
  E(n.innerType, v, $);
  let u = v.seen.get(r);
  u.ref = n.innerType, o.readOnly = true;
};
var fg = (r, v, o, $) => {
  let n = r._zod.def;
  E(n.innerType, v, $);
  let u = v.seen.get(r);
  u.ref = n.innerType;
};
var hg = (r, v, o, $) => {
  let n = r._zod.def;
  E(n.innerType, v, $);
  let u = v.seen.get(r);
  u.ref = n.innerType;
};
var yg = (r, v, o, $) => {
  let n = r._zod.innerType;
  E(n, v, $);
  let u = v.seen.get(r);
  u.ref = n;
};
var Xv = { string: Ug, number: _g, boolean: wg, bigint: Ng, symbol: kg, null: Og, undefined: cg, void: Dg, never: jg, any: Pg, unknown: Sg, date: Ag, enum: Jg, literal: Eg, nan: Lg, template_literal: Gg, file: Wg, success: Xg, custom: Kg, function: Vg, transform: Yg, map: Qg, set: qg, array: Bg, object: Hg, union: Kv, intersection: Mg, tuple: Fg, record: Rg, nullable: Tg, nonoptional: zg, default: Zg, prefault: eg, catch: mg, pipe: Cg, readonly: xg, promise: fg, optional: hg, lazy: yg };
function Vv(r, v) {
  if ("_idmap" in r) {
    let $ = r, n = ir({ ...v, processors: Xv }), u = {};
    for (let I of $._idmap.entries()) {
      let [b, U] = I;
      E(U, n);
    }
    let i = {}, g = { registry: $, uri: v?.uri, defs: u };
    n.external = g;
    for (let I of $._idmap.entries()) {
      let [b, U] = I;
      gr(n, U), i[b] = br(n, U);
    }
    if (Object.keys(u).length > 0) {
      let I = n.target === "draft-2020-12" ? "$defs" : "definitions";
      i.__shared = { [I]: u };
    }
    return { schemas: i };
  }
  let o = ir({ ...v, processors: Xv });
  return E(r, o), gr(o, r), br(o, r);
}
var dg = class {
  get metadataRegistry() {
    return this.ctx.metadataRegistry;
  }
  get target() {
    return this.ctx.target;
  }
  get unrepresentable() {
    return this.ctx.unrepresentable;
  }
  get override() {
    return this.ctx.override;
  }
  get io() {
    return this.ctx.io;
  }
  get counter() {
    return this.ctx.counter;
  }
  set counter(r) {
    this.ctx.counter = r;
  }
  get seen() {
    return this.ctx.seen;
  }
  constructor(r) {
    let v = r?.target ?? "draft-2020-12";
    if (v === "draft-4") v = "draft-04";
    if (v === "draft-7") v = "draft-07";
    this.ctx = ir({ processors: Xv, target: v, ...r?.metadata && { metadata: r.metadata }, ...r?.unrepresentable && { unrepresentable: r.unrepresentable }, ...r?.override && { override: r.override }, ...r?.io && { io: r.io } });
  }
  process(r, v = { path: [], schemaPath: [] }) {
    return E(r, this.ctx, v);
  }
  emit(r, v) {
    if (v) {
      if (v.cycles) this.ctx.cycles = v.cycles;
      if (v.reused) this.ctx.reused = v.reused;
      if (v.external) this.ctx.external = v.external;
    }
    gr(this.ctx, r);
    let o = br(this.ctx, r), { "~standard": $, ...n } = o;
    return n;
  }
};
var ht = {};
var Dn = {};
d(Dn, { xor: () => TI, xid: () => tI, void: () => qI, uuidv7: () => nI, uuidv6: () => rI, uuidv4: () => st, uuid: () => at, url: () => vI, unknown: () => kr, union: () => uo, undefined: () => YI, ulid: () => bI, uint64: () => KI, uint32: () => GI, tuple: () => Kb, transform: () => io, templateLiteral: () => sI, symbol: () => VI, superRefine: () => nt, success: () => dI, stringbool: () => g4, stringFormat: () => jI, string: () => Mv, strictObject: () => FI, set: () => CI, refine: () => rt, record: () => Vb, readonly: () => hb, promise: () => r4, preprocess: () => t4, prefault: () => zb, pipe: () => An, partialRecord: () => ZI, optional: () => Pn, object: () => MI, number: () => wb, nullish: () => yI, nullable: () => Sn, null: () => Db, nonoptional: () => Zb, never: () => oo, nativeEnum: () => xI, nanoid: () => $I, nan: () => pI, meta: () => $4, map: () => mI, mac: () => UI, looseRecord: () => eI, looseObject: () => RI, literal: () => fI, lazy: () => pb, ksuid: () => II, keyof: () => HI, jwt: () => DI, json: () => b4, ipv6: () => _I, ipv4: () => lI, intersection: () => Wb, int64: () => XI, int32: () => LI, int: () => Fv, instanceof: () => i4, httpUrl: () => oI, hostname: () => PI, hex: () => SI, hash: () => AI, guid: () => pt, function: () => n4, float64: () => EI, float32: () => JI, file: () => hI, enum: () => $o, emoji: () => uI, email: () => dt, e164: () => cI, discriminatedUnion: () => zI, describe: () => u4, date: () => BI, custom: () => o4, cuid2: () => gI, cuid: () => iI, codec: () => aI, cidrv6: () => NI, cidrv4: () => wI, check: () => v4, catch: () => Cb, boolean: () => Nb, bigint: () => WI, base64url: () => OI, base64: () => kI, array: () => Ln, any: () => QI, _function: () => n4, _default: () => Rb, _ZodString: () => Rv, ZodXor: () => Eb, ZodXID: () => xv, ZodVoid: () => Ab, ZodUnknown: () => Pb, ZodUnion: () => Wn, ZodUndefined: () => Ob, ZodUUID: () => h, ZodURL: () => Jn, ZodULID: () => Cv, ZodType: () => S, ZodTuple: () => Xb, ZodTransform: () => Hb, ZodTemplateLiteral: () => yb, ZodSymbol: () => kb, ZodSuccess: () => eb, ZodStringFormat: () => G, ZodString: () => er, ZodSet: () => Qb, ZodRecord: () => Xn, ZodReadonly: () => fb, ZodPromise: () => ab, ZodPrefault: () => Tb, ZodPipe: () => to, ZodOptional: () => go, ZodObject: () => Gn, ZodNumberFormat: () => Or, ZodNumber: () => Cr, ZodNullable: () => Mb, ZodNull: () => cb, ZodNonOptional: () => bo, ZodNever: () => Sb, ZodNanoID: () => Zv, ZodNaN: () => xb, ZodMap: () => Yb, ZodMAC: () => _b, ZodLiteral: () => qb, ZodLazy: () => db, ZodKSUID: () => fv, ZodJWT: () => no, ZodIntersection: () => Gb, ZodIPv6: () => yv, ZodIPv4: () => hv, ZodGUID: () => jn, ZodFunction: () => sb, ZodFile: () => Bb, ZodEnum: () => Zr, ZodEmoji: () => zv, ZodEmail: () => Tv, ZodE164: () => ro, ZodDiscriminatedUnion: () => Lb, ZodDefault: () => Fb, ZodDate: () => En, ZodCustomStringFormat: () => mr, ZodCustom: () => Kn, ZodCodec: () => Io, ZodCatch: () => mb, ZodCUID2: () => mv, ZodCUID: () => ev, ZodCIDRv6: () => pv, ZodCIDRv4: () => dv, ZodBoolean: () => xr, ZodBigIntFormat: () => vo, ZodBigInt: () => fr, ZodBase64URL: () => sv, ZodBase64: () => av, ZodArray: () => Jb, ZodAny: () => jb });
var Yv = {};
d(Yv, { uppercase: () => Xr, trim: () => Br, toUpperCase: () => Mr, toLowerCase: () => Hr, startsWith: () => Vr, slugify: () => Fr, size: () => Lr, regex: () => Gr, property: () => Wv, positive: () => Jv, overwrite: () => e, normalize: () => qr, nonpositive: () => Lv, nonnegative: () => Gv, negative: () => Ev, multipleOf: () => ur, minSize: () => $r, minLength: () => p, mime: () => Qr, maxSize: () => _r, maxLength: () => wr, lte: () => R, lt: () => x, lowercase: () => Wr, length: () => Nr, includes: () => Kr, gte: () => Q, gt: () => f, endsWith: () => Yr });
var zr = {};
d(zr, { time: () => sg, duration: () => rb, datetime: () => pg, date: () => ag, ZodISOTime: () => Bv, ZodISODuration: () => Hv, ZodISODateTime: () => Qv, ZodISODate: () => qv });
var Qv = l("ZodISODateTime", (r, v) => {
  Bu.init(r, v), G.init(r, v);
});
function pg(r) {
  return Ki(Qv, r);
}
var qv = l("ZodISODate", (r, v) => {
  Hu.init(r, v), G.init(r, v);
});
function ag(r) {
  return Vi(qv, r);
}
var Bv = l("ZodISOTime", (r, v) => {
  Mu.init(r, v), G.init(r, v);
});
function sg(r) {
  return Yi(Bv, r);
}
var Hv = l("ZodISODuration", (r, v) => {
  Fu.init(r, v), G.init(r, v);
});
function rb(r) {
  return Qi(Hv, r);
}
var yt = (r, v) => {
  vn.init(r, v), r.name = "ZodError", Object.defineProperties(r, { format: { value: (o) => un(r, o) }, flatten: { value: (o) => on(r, o) }, addIssue: { value: (o) => {
    r.issues.push(o), r.message = JSON.stringify(r.issues, cr, 2);
  } }, addIssues: { value: (o) => {
    r.issues.push(...o), r.message = JSON.stringify(r.issues, cr, 2);
  } }, isEmpty: { get() {
    return r.issues.length === 0;
  } } });
};
var vU = l("ZodError", yt);
var M = l("ZodError", yt, { Parent: Error });
var nb = Pr(M);
var vb = Sr(M);
var ob = Ar(M);
var ub = Jr(M);
var $b = Mn(M);
var ib = Fn(M);
var gb = Rn(M);
var bb = Tn(M);
var tb = zn(M);
var Ib = Zn(M);
var lb = en(M);
var Ub = mn(M);
var S = l("ZodType", (r, v) => {
  return P.init(r, v), Object.assign(r["~standard"], { jsonSchema: { input: Tr(r, "input"), output: Tr(r, "output") } }), r.toJSONSchema = lg(r, {}), r.def = v, r.type = v.type, Object.defineProperty(r, "_def", { value: v }), r.check = (...o) => {
    return r.clone(k.mergeDefs(v, { checks: [...v.checks ?? [], ...o.map(($) => typeof $ === "function" ? { _zod: { check: $, def: { check: "custom" }, onattach: [] } } : $)] }));
  }, r.clone = (o, $) => V(r, o, $), r.brand = () => r, r.register = (o, $) => {
    return o.add(r, $), r;
  }, r.parse = (o, $) => nb(r, o, $, { callee: r.parse }), r.safeParse = (o, $) => ob(r, o, $), r.parseAsync = async (o, $) => vb(r, o, $, { callee: r.parseAsync }), r.safeParseAsync = async (o, $) => ub(r, o, $), r.spa = r.safeParseAsync, r.encode = (o, $) => $b(r, o, $), r.decode = (o, $) => ib(r, o, $), r.encodeAsync = async (o, $) => gb(r, o, $), r.decodeAsync = async (o, $) => bb(r, o, $), r.safeEncode = (o, $) => tb(r, o, $), r.safeDecode = (o, $) => Ib(r, o, $), r.safeEncodeAsync = async (o, $) => lb(r, o, $), r.safeDecodeAsync = async (o, $) => Ub(r, o, $), r.refine = (o, $) => r.check(rt(o, $)), r.superRefine = (o) => r.check(nt(o)), r.overwrite = (o) => r.check(e(o)), r.optional = () => Pn(r), r.nullable = () => Sn(r), r.nullish = () => Pn(Sn(r)), r.nonoptional = (o) => Zb(r, o), r.array = () => Ln(r), r.or = (o) => uo([r, o]), r.and = (o) => Wb(r, o), r.transform = (o) => An(r, io(o)), r.default = (o) => Rb(r, o), r.prefault = (o) => zb(r, o), r.catch = (o) => Cb(r, o), r.pipe = (o) => An(r, o), r.readonly = () => hb(r), r.describe = (o) => {
    let $ = r.clone();
    return Y.add($, { description: o }), $;
  }, Object.defineProperty(r, "description", { get() {
    return Y.get(r)?.description;
  }, configurable: true }), r.meta = (...o) => {
    if (o.length === 0) return Y.get(r);
    let $ = r.clone();
    return Y.add($, o[0]), $;
  }, r.isOptional = () => r.safeParse(void 0).success, r.isNullable = () => r.safeParse(null).success, r;
});
var Rv = l("_ZodString", (r, v) => {
  Ur.init(r, v), S.init(r, v), r._zod.processJSONSchema = ($, n, u) => Ug(r, $, n, u);
  let o = r._zod.bag;
  r.format = o.format ?? null, r.minLength = o.minimum ?? null, r.maxLength = o.maximum ?? null, r.regex = (...$) => r.check(Gr(...$)), r.includes = (...$) => r.check(Kr(...$)), r.startsWith = (...$) => r.check(Vr(...$)), r.endsWith = (...$) => r.check(Yr(...$)), r.min = (...$) => r.check(p(...$)), r.max = (...$) => r.check(wr(...$)), r.length = (...$) => r.check(Nr(...$)), r.nonempty = (...$) => r.check(p(1, ...$)), r.lowercase = ($) => r.check(Wr($)), r.uppercase = ($) => r.check(Xr($)), r.trim = () => r.check(Br()), r.normalize = (...$) => r.check(qr(...$)), r.toLowerCase = () => r.check(Hr()), r.toUpperCase = () => r.check(Mr()), r.slugify = () => r.check(Fr());
});
var er = l("ZodString", (r, v) => {
  Ur.init(r, v), Rv.init(r, v), r.email = (o) => r.check(uv(Tv, o)), r.url = (o) => r.check(cn(Jn, o)), r.jwt = (o) => r.check(Av(no, o)), r.emoji = (o) => r.check(tv(zv, o)), r.guid = (o) => r.check(On(jn, o)), r.uuid = (o) => r.check($v(h, o)), r.uuidv4 = (o) => r.check(iv(h, o)), r.uuidv6 = (o) => r.check(gv(h, o)), r.uuidv7 = (o) => r.check(bv(h, o)), r.nanoid = (o) => r.check(Iv(Zv, o)), r.guid = (o) => r.check(On(jn, o)), r.cuid = (o) => r.check(lv(ev, o)), r.cuid2 = (o) => r.check(Uv(mv, o)), r.ulid = (o) => r.check(_v(Cv, o)), r.base64 = (o) => r.check(jv(av, o)), r.base64url = (o) => r.check(Pv(sv, o)), r.xid = (o) => r.check(wv(xv, o)), r.ksuid = (o) => r.check(Nv(fv, o)), r.ipv4 = (o) => r.check(kv(hv, o)), r.ipv6 = (o) => r.check(Ov(yv, o)), r.cidrv4 = (o) => r.check(cv(dv, o)), r.cidrv6 = (o) => r.check(Dv(pv, o)), r.e164 = (o) => r.check(Sv(ro, o)), r.datetime = (o) => r.check(pg(o)), r.date = (o) => r.check(ag(o)), r.time = (o) => r.check(sg(o)), r.duration = (o) => r.check(rb(o));
});
function Mv(r) {
  return Li(er, r);
}
var G = l("ZodStringFormat", (r, v) => {
  L.init(r, v), Rv.init(r, v);
});
var Tv = l("ZodEmail", (r, v) => {
  Lu.init(r, v), G.init(r, v);
});
function dt(r) {
  return uv(Tv, r);
}
var jn = l("ZodGUID", (r, v) => {
  Ju.init(r, v), G.init(r, v);
});
function pt(r) {
  return On(jn, r);
}
var h = l("ZodUUID", (r, v) => {
  Eu.init(r, v), G.init(r, v);
});
function at(r) {
  return $v(h, r);
}
function st(r) {
  return iv(h, r);
}
function rI(r) {
  return gv(h, r);
}
function nI(r) {
  return bv(h, r);
}
var Jn = l("ZodURL", (r, v) => {
  Gu.init(r, v), G.init(r, v);
});
function vI(r) {
  return cn(Jn, r);
}
function oI(r) {
  return cn(Jn, { protocol: /^https?$/, hostname: Z.domain, ...k.normalizeParams(r) });
}
var zv = l("ZodEmoji", (r, v) => {
  Wu.init(r, v), G.init(r, v);
});
function uI(r) {
  return tv(zv, r);
}
var Zv = l("ZodNanoID", (r, v) => {
  Xu.init(r, v), G.init(r, v);
});
function $I(r) {
  return Iv(Zv, r);
}
var ev = l("ZodCUID", (r, v) => {
  Ku.init(r, v), G.init(r, v);
});
function iI(r) {
  return lv(ev, r);
}
var mv = l("ZodCUID2", (r, v) => {
  Vu.init(r, v), G.init(r, v);
});
function gI(r) {
  return Uv(mv, r);
}
var Cv = l("ZodULID", (r, v) => {
  Yu.init(r, v), G.init(r, v);
});
function bI(r) {
  return _v(Cv, r);
}
var xv = l("ZodXID", (r, v) => {
  Qu.init(r, v), G.init(r, v);
});
function tI(r) {
  return wv(xv, r);
}
var fv = l("ZodKSUID", (r, v) => {
  qu.init(r, v), G.init(r, v);
});
function II(r) {
  return Nv(fv, r);
}
var hv = l("ZodIPv4", (r, v) => {
  Ru.init(r, v), G.init(r, v);
});
function lI(r) {
  return kv(hv, r);
}
var _b = l("ZodMAC", (r, v) => {
  zu.init(r, v), G.init(r, v);
});
function UI(r) {
  return Wi(_b, r);
}
var yv = l("ZodIPv6", (r, v) => {
  Tu.init(r, v), G.init(r, v);
});
function _I(r) {
  return Ov(yv, r);
}
var dv = l("ZodCIDRv4", (r, v) => {
  Zu.init(r, v), G.init(r, v);
});
function wI(r) {
  return cv(dv, r);
}
var pv = l("ZodCIDRv6", (r, v) => {
  eu.init(r, v), G.init(r, v);
});
function NI(r) {
  return Dv(pv, r);
}
var av = l("ZodBase64", (r, v) => {
  Cu.init(r, v), G.init(r, v);
});
function kI(r) {
  return jv(av, r);
}
var sv = l("ZodBase64URL", (r, v) => {
  xu.init(r, v), G.init(r, v);
});
function OI(r) {
  return Pv(sv, r);
}
var ro = l("ZodE164", (r, v) => {
  fu.init(r, v), G.init(r, v);
});
function cI(r) {
  return Sv(ro, r);
}
var no = l("ZodJWT", (r, v) => {
  hu.init(r, v), G.init(r, v);
});
function DI(r) {
  return Av(no, r);
}
var mr = l("ZodCustomStringFormat", (r, v) => {
  yu.init(r, v), G.init(r, v);
});
function jI(r, v, o = {}) {
  return Rr(mr, r, v, o);
}
function PI(r) {
  return Rr(mr, "hostname", Z.hostname, r);
}
function SI(r) {
  return Rr(mr, "hex", Z.hex, r);
}
function AI(r, v) {
  let o = v?.enc ?? "hex", $ = `${r}_${o}`, n = Z[$];
  if (!n) throw Error(`Unrecognized hash format: ${$}`);
  return Rr(mr, $, n, v);
}
var Cr = l("ZodNumber", (r, v) => {
  rv.init(r, v), S.init(r, v), r._zod.processJSONSchema = ($, n, u) => _g(r, $, n, u), r.gt = ($, n) => r.check(f($, n)), r.gte = ($, n) => r.check(Q($, n)), r.min = ($, n) => r.check(Q($, n)), r.lt = ($, n) => r.check(x($, n)), r.lte = ($, n) => r.check(R($, n)), r.max = ($, n) => r.check(R($, n)), r.int = ($) => r.check(Fv($)), r.safe = ($) => r.check(Fv($)), r.positive = ($) => r.check(f(0, $)), r.nonnegative = ($) => r.check(Q(0, $)), r.negative = ($) => r.check(x(0, $)), r.nonpositive = ($) => r.check(R(0, $)), r.multipleOf = ($, n) => r.check(ur($, n)), r.step = ($, n) => r.check(ur($, n)), r.finite = () => r;
  let o = r._zod.bag;
  r.minValue = Math.max(o.minimum ?? Number.NEGATIVE_INFINITY, o.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null, r.maxValue = Math.min(o.maximum ?? Number.POSITIVE_INFINITY, o.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null, r.isInt = (o.format ?? "").includes("int") || Number.isSafeInteger(o.multipleOf ?? 0.5), r.isFinite = true, r.format = o.format ?? null;
});
function wb(r) {
  return qi(Cr, r);
}
var Or = l("ZodNumberFormat", (r, v) => {
  du.init(r, v), Cr.init(r, v);
});
function Fv(r) {
  return Hi(Or, r);
}
function JI(r) {
  return Mi(Or, r);
}
function EI(r) {
  return Fi(Or, r);
}
function LI(r) {
  return Ri(Or, r);
}
function GI(r) {
  return Ti(Or, r);
}
var xr = l("ZodBoolean", (r, v) => {
  bn.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => wg(r, o, $, n);
});
function Nb(r) {
  return zi(xr, r);
}
var fr = l("ZodBigInt", (r, v) => {
  nv.init(r, v), S.init(r, v), r._zod.processJSONSchema = ($, n, u) => Ng(r, $, n, u), r.gte = ($, n) => r.check(Q($, n)), r.min = ($, n) => r.check(Q($, n)), r.gt = ($, n) => r.check(f($, n)), r.gte = ($, n) => r.check(Q($, n)), r.min = ($, n) => r.check(Q($, n)), r.lt = ($, n) => r.check(x($, n)), r.lte = ($, n) => r.check(R($, n)), r.max = ($, n) => r.check(R($, n)), r.positive = ($) => r.check(f(BigInt(0), $)), r.negative = ($) => r.check(x(BigInt(0), $)), r.nonpositive = ($) => r.check(R(BigInt(0), $)), r.nonnegative = ($) => r.check(Q(BigInt(0), $)), r.multipleOf = ($, n) => r.check(ur($, n));
  let o = r._zod.bag;
  r.minValue = o.minimum ?? null, r.maxValue = o.maximum ?? null, r.format = o.format ?? null;
});
function WI(r) {
  return ei(fr, r);
}
var vo = l("ZodBigIntFormat", (r, v) => {
  pu.init(r, v), fr.init(r, v);
});
function XI(r) {
  return Ci(vo, r);
}
function KI(r) {
  return xi(vo, r);
}
var kb = l("ZodSymbol", (r, v) => {
  au.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => kg(r, o, $, n);
});
function VI(r) {
  return fi(kb, r);
}
var Ob = l("ZodUndefined", (r, v) => {
  su.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => cg(r, o, $, n);
});
function YI(r) {
  return hi(Ob, r);
}
var cb = l("ZodNull", (r, v) => {
  r$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Og(r, o, $, n);
});
function Db(r) {
  return yi(cb, r);
}
var jb = l("ZodAny", (r, v) => {
  n$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Pg(r, o, $, n);
});
function QI() {
  return di(jb);
}
var Pb = l("ZodUnknown", (r, v) => {
  v$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Sg(r, o, $, n);
});
function kr() {
  return pi(Pb);
}
var Sb = l("ZodNever", (r, v) => {
  o$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => jg(r, o, $, n);
});
function oo(r) {
  return ai(Sb, r);
}
var Ab = l("ZodVoid", (r, v) => {
  u$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Dg(r, o, $, n);
});
function qI(r) {
  return si(Ab, r);
}
var En = l("ZodDate", (r, v) => {
  $$.init(r, v), S.init(r, v), r._zod.processJSONSchema = ($, n, u) => Ag(r, $, n, u), r.min = ($, n) => r.check(Q($, n)), r.max = ($, n) => r.check(R($, n));
  let o = r._zod.bag;
  r.minDate = o.minimum ? new Date(o.minimum) : null, r.maxDate = o.maximum ? new Date(o.maximum) : null;
});
function BI(r) {
  return rg(En, r);
}
var Jb = l("ZodArray", (r, v) => {
  i$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Bg(r, o, $, n), r.element = v.element, r.min = (o, $) => r.check(p(o, $)), r.nonempty = (o) => r.check(p(1, o)), r.max = (o, $) => r.check(wr(o, $)), r.length = (o, $) => r.check(Nr(o, $)), r.unwrap = () => r.element;
});
function Ln(r, v) {
  return og(Jb, r, v);
}
function HI(r) {
  let v = r._zod.def.shape;
  return $o(Object.keys(v));
}
var Gn = l("ZodObject", (r, v) => {
  g$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Hg(r, o, $, n), k.defineLazy(r, "shape", () => {
    return v.shape;
  }), r.keyof = () => $o(Object.keys(r._zod.def.shape)), r.catchall = (o) => r.clone({ ...r._zod.def, catchall: o }), r.passthrough = () => r.clone({ ...r._zod.def, catchall: kr() }), r.loose = () => r.clone({ ...r._zod.def, catchall: kr() }), r.strict = () => r.clone({ ...r._zod.def, catchall: oo() }), r.strip = () => r.clone({ ...r._zod.def, catchall: void 0 }), r.extend = (o) => {
    return k.extend(r, o);
  }, r.safeExtend = (o) => {
    return k.safeExtend(r, o);
  }, r.merge = (o) => k.merge(r, o), r.pick = (o) => k.pick(r, o), r.omit = (o) => k.omit(r, o), r.partial = (...o) => k.partial(go, r, o[0]), r.required = (...o) => k.required(bo, r, o[0]);
});
function MI(r, v) {
  let o = { type: "object", shape: r ?? {}, ...k.normalizeParams(v) };
  return new Gn(o);
}
function FI(r, v) {
  return new Gn({ type: "object", shape: r, catchall: oo(), ...k.normalizeParams(v) });
}
function RI(r, v) {
  return new Gn({ type: "object", shape: r, catchall: kr(), ...k.normalizeParams(v) });
}
var Wn = l("ZodUnion", (r, v) => {
  tn.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Kv(r, o, $, n), r.options = v.options;
});
function uo(r, v) {
  return new Wn({ type: "union", options: r, ...k.normalizeParams(v) });
}
var Eb = l("ZodXor", (r, v) => {
  Wn.init(r, v), b$.init(r, v), r._zod.processJSONSchema = (o, $, n) => Kv(r, o, $, n), r.options = v.options;
});
function TI(r, v) {
  return new Eb({ type: "union", options: r, inclusive: false, ...k.normalizeParams(v) });
}
var Lb = l("ZodDiscriminatedUnion", (r, v) => {
  Wn.init(r, v), t$.init(r, v);
});
function zI(r, v, o) {
  return new Lb({ type: "union", options: v, discriminator: r, ...k.normalizeParams(o) });
}
var Gb = l("ZodIntersection", (r, v) => {
  I$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Mg(r, o, $, n);
});
function Wb(r, v) {
  return new Gb({ type: "intersection", left: r, right: v });
}
var Xb = l("ZodTuple", (r, v) => {
  vv.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Fg(r, o, $, n), r.rest = (o) => r.clone({ ...r._zod.def, rest: o });
});
function Kb(r, v, o) {
  let $ = v instanceof P, n = $ ? o : v;
  return new Xb({ type: "tuple", items: r, rest: $ ? v : null, ...k.normalizeParams(n) });
}
var Xn = l("ZodRecord", (r, v) => {
  l$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Rg(r, o, $, n), r.keyType = v.keyType, r.valueType = v.valueType;
});
function Vb(r, v, o) {
  return new Xn({ type: "record", keyType: r, valueType: v, ...k.normalizeParams(o) });
}
function ZI(r, v, o) {
  let $ = V(r);
  return $._zod.values = void 0, new Xn({ type: "record", keyType: $, valueType: v, ...k.normalizeParams(o) });
}
function eI(r, v, o) {
  return new Xn({ type: "record", keyType: r, valueType: v, mode: "loose", ...k.normalizeParams(o) });
}
var Yb = l("ZodMap", (r, v) => {
  U$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Qg(r, o, $, n), r.keyType = v.keyType, r.valueType = v.valueType;
});
function mI(r, v, o) {
  return new Yb({ type: "map", keyType: r, valueType: v, ...k.normalizeParams(o) });
}
var Qb = l("ZodSet", (r, v) => {
  _$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => qg(r, o, $, n), r.min = (...o) => r.check($r(...o)), r.nonempty = (o) => r.check($r(1, o)), r.max = (...o) => r.check(_r(...o)), r.size = (...o) => r.check(Lr(...o));
});
function CI(r, v) {
  return new Qb({ type: "set", valueType: r, ...k.normalizeParams(v) });
}
var Zr = l("ZodEnum", (r, v) => {
  w$.init(r, v), S.init(r, v), r._zod.processJSONSchema = ($, n, u) => Jg(r, $, n, u), r.enum = v.entries, r.options = Object.values(v.entries);
  let o = new Set(Object.keys(v.entries));
  r.extract = ($, n) => {
    let u = {};
    for (let i of $) if (o.has(i)) u[i] = v.entries[i];
    else throw Error(`Key ${i} not found in enum`);
    return new Zr({ ...v, checks: [], ...k.normalizeParams(n), entries: u });
  }, r.exclude = ($, n) => {
    let u = { ...v.entries };
    for (let i of $) if (o.has(i)) delete u[i];
    else throw Error(`Key ${i} not found in enum`);
    return new Zr({ ...v, checks: [], ...k.normalizeParams(n), entries: u });
  };
});
function $o(r, v) {
  let o = Array.isArray(r) ? Object.fromEntries(r.map(($) => [$, $])) : r;
  return new Zr({ type: "enum", entries: o, ...k.normalizeParams(v) });
}
function xI(r, v) {
  return new Zr({ type: "enum", entries: r, ...k.normalizeParams(v) });
}
var qb = l("ZodLiteral", (r, v) => {
  N$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Eg(r, o, $, n), r.values = new Set(v.values), Object.defineProperty(r, "value", { get() {
    if (v.values.length > 1) throw Error("This schema contains multiple valid literal values. Use `.values` instead.");
    return v.values[0];
  } });
});
function fI(r, v) {
  return new qb({ type: "literal", values: Array.isArray(r) ? r : [r], ...k.normalizeParams(v) });
}
var Bb = l("ZodFile", (r, v) => {
  k$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Wg(r, o, $, n), r.min = (o, $) => r.check($r(o, $)), r.max = (o, $) => r.check(_r(o, $)), r.mime = (o, $) => r.check(Qr(Array.isArray(o) ? o : [o], $));
});
function hI(r) {
  return ug(Bb, r);
}
var Hb = l("ZodTransform", (r, v) => {
  O$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Yg(r, o, $, n), r._zod.parse = (o, $) => {
    if ($.direction === "backward") throw new tr(r.constructor.name);
    o.addIssue = (u) => {
      if (typeof u === "string") o.issues.push(k.issue(u, o.value, v));
      else {
        let i = u;
        if (i.fatal) i.continue = false;
        i.code ?? (i.code = "custom"), i.input ?? (i.input = o.value), i.inst ?? (i.inst = r), o.issues.push(k.issue(i));
      }
    };
    let n = v.transform(o.value, o);
    if (n instanceof Promise) return n.then((u) => {
      return o.value = u, o;
    });
    return o.value = n, o;
  };
});
function io(r) {
  return new Hb({ type: "transform", transform: r });
}
var go = l("ZodOptional", (r, v) => {
  c$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => hg(r, o, $, n), r.unwrap = () => r._zod.def.innerType;
});
function Pn(r) {
  return new go({ type: "optional", innerType: r });
}
var Mb = l("ZodNullable", (r, v) => {
  D$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Tg(r, o, $, n), r.unwrap = () => r._zod.def.innerType;
});
function Sn(r) {
  return new Mb({ type: "nullable", innerType: r });
}
function yI(r) {
  return Pn(Sn(r));
}
var Fb = l("ZodDefault", (r, v) => {
  j$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Zg(r, o, $, n), r.unwrap = () => r._zod.def.innerType, r.removeDefault = r.unwrap;
});
function Rb(r, v) {
  return new Fb({ type: "default", innerType: r, get defaultValue() {
    return typeof v === "function" ? v() : k.shallowClone(v);
  } });
}
var Tb = l("ZodPrefault", (r, v) => {
  P$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => eg(r, o, $, n), r.unwrap = () => r._zod.def.innerType;
});
function zb(r, v) {
  return new Tb({ type: "prefault", innerType: r, get defaultValue() {
    return typeof v === "function" ? v() : k.shallowClone(v);
  } });
}
var bo = l("ZodNonOptional", (r, v) => {
  S$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => zg(r, o, $, n), r.unwrap = () => r._zod.def.innerType;
});
function Zb(r, v) {
  return new bo({ type: "nonoptional", innerType: r, ...k.normalizeParams(v) });
}
var eb = l("ZodSuccess", (r, v) => {
  A$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Xg(r, o, $, n), r.unwrap = () => r._zod.def.innerType;
});
function dI(r) {
  return new eb({ type: "success", innerType: r });
}
var mb = l("ZodCatch", (r, v) => {
  J$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => mg(r, o, $, n), r.unwrap = () => r._zod.def.innerType, r.removeCatch = r.unwrap;
});
function Cb(r, v) {
  return new mb({ type: "catch", innerType: r, catchValue: typeof v === "function" ? v : () => v });
}
var xb = l("ZodNaN", (r, v) => {
  E$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Lg(r, o, $, n);
});
function pI(r) {
  return vg(xb, r);
}
var to = l("ZodPipe", (r, v) => {
  L$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Cg(r, o, $, n), r.in = v.in, r.out = v.out;
});
function An(r, v) {
  return new to({ type: "pipe", in: r, out: v });
}
var Io = l("ZodCodec", (r, v) => {
  to.init(r, v), In.init(r, v);
});
function aI(r, v, o) {
  return new Io({ type: "pipe", in: r, out: v, transform: o.decode, reverseTransform: o.encode });
}
var fb = l("ZodReadonly", (r, v) => {
  G$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => xg(r, o, $, n), r.unwrap = () => r._zod.def.innerType;
});
function hb(r) {
  return new fb({ type: "readonly", innerType: r });
}
var yb = l("ZodTemplateLiteral", (r, v) => {
  W$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Gg(r, o, $, n);
});
function sI(r, v) {
  return new yb({ type: "template_literal", parts: r, ...k.normalizeParams(v) });
}
var db = l("ZodLazy", (r, v) => {
  V$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => yg(r, o, $, n), r.unwrap = () => r._zod.def.getter();
});
function pb(r) {
  return new db({ type: "lazy", getter: r });
}
var ab = l("ZodPromise", (r, v) => {
  K$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => fg(r, o, $, n), r.unwrap = () => r._zod.def.innerType;
});
function r4(r) {
  return new ab({ type: "promise", innerType: r });
}
var sb = l("ZodFunction", (r, v) => {
  X$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Vg(r, o, $, n);
});
function n4(r) {
  return new sb({ type: "function", input: Array.isArray(r?.input) ? Kb(r?.input) : r?.input ?? Ln(kr()), output: r?.output ?? kr() });
}
var Kn = l("ZodCustom", (r, v) => {
  Y$.init(r, v), S.init(r, v), r._zod.processJSONSchema = (o, $, n) => Kg(r, o, $, n);
});
function v4(r) {
  let v = new W({ check: "custom" });
  return v._zod.check = r, v;
}
function o4(r, v) {
  return $g(Kn, r ?? (() => true), v);
}
function rt(r, v = {}) {
  return ig(Kn, r, v);
}
function nt(r) {
  return gg(r);
}
var u4 = bg;
var $4 = tg;
function i4(r, v = { error: `Input not instance of ${r.name}` }) {
  let o = new Kn({ type: "custom", check: "custom", fn: ($) => $ instanceof r, abort: true, ...k.normalizeParams(v) });
  return o._zod.bag.Class = r, o;
}
var g4 = (...r) => Ig({ Codec: Io, Boolean: xr, String: er }, ...r);
function b4(r) {
  let v = pb(() => {
    return uo([Mv(r), wb(), Nb(), Db(), Ln(v), Vb(Mv(), v)]);
  });
  return v;
}
function t4(r, v) {
  return An(io(r), v);
}
var uU = { invalid_type: "invalid_type", too_big: "too_big", too_small: "too_small", invalid_format: "invalid_format", not_multiple_of: "not_multiple_of", unrecognized_keys: "unrecognized_keys", invalid_union: "invalid_union", invalid_key: "invalid_key", invalid_element: "invalid_element", invalid_value: "invalid_value", custom: "custom" };
function $U(r) {
  X({ customError: r });
}
function iU() {
  return X().customError;
}
var vt;
/* @__PURE__ */ (function(r) {
})(vt || (vt = {}));
var c = { ...Dn, ...Yv, iso: zr };
function gU(r, v) {
  let o = r.$schema;
  if (o === "https://json-schema.org/draft/2020-12/schema") return "draft-2020-12";
  if (o === "http://json-schema.org/draft-07/schema#") return "draft-7";
  if (o === "http://json-schema.org/draft-04/schema#") return "draft-4";
  return v ?? "draft-2020-12";
}
function bU(r, v) {
  if (!r.startsWith("#")) throw Error("External $ref is not supported, only local refs (#/...) are allowed");
  let o = r.slice(1).split("/").filter(Boolean);
  if (o.length === 0) return v.rootSchema;
  let $ = v.version === "draft-2020-12" ? "$defs" : "definitions";
  if (o[0] === $) {
    let n = o[1];
    if (!n || !v.defs[n]) throw Error(`Reference not found: ${r}`);
    return v.defs[n];
  }
  throw Error(`Reference not found: ${r}`);
}
function I4(r, v) {
  if (r.not !== void 0) {
    if (typeof r.not === "object" && Object.keys(r.not).length === 0) return c.never();
    throw Error("not is not supported in Zod (except { not: {} } for never)");
  }
  if (r.unevaluatedItems !== void 0) throw Error("unevaluatedItems is not supported");
  if (r.unevaluatedProperties !== void 0) throw Error("unevaluatedProperties is not supported");
  if (r.if !== void 0 || r.then !== void 0 || r.else !== void 0) throw Error("Conditional schemas (if/then/else) are not supported");
  if (r.dependentSchemas !== void 0 || r.dependentRequired !== void 0) throw Error("dependentSchemas and dependentRequired are not supported");
  if (r.$ref) {
    let n = r.$ref;
    if (v.refs.has(n)) return v.refs.get(n);
    if (v.processing.has(n)) return c.lazy(() => {
      if (!v.refs.has(n)) throw Error(`Circular reference not resolved: ${n}`);
      return v.refs.get(n);
    });
    v.processing.add(n);
    let u = bU(n, v), i = K(u, v);
    return v.refs.set(n, i), v.processing.delete(n), i;
  }
  if (r.enum !== void 0) {
    let n = r.enum;
    if (v.version === "openapi-3.0" && r.nullable === true && n.length === 1 && n[0] === null) return c.null();
    if (n.length === 0) return c.never();
    if (n.length === 1) return c.literal(n[0]);
    if (n.every((i) => typeof i === "string")) return c.enum(n);
    let u = n.map((i) => c.literal(i));
    if (u.length < 2) return u[0];
    return c.union([u[0], u[1], ...u.slice(2)]);
  }
  if (r.const !== void 0) return c.literal(r.const);
  let o = r.type;
  if (Array.isArray(o)) {
    let n = o.map((u) => {
      let i = { ...r, type: u };
      return I4(i, v);
    });
    if (n.length === 0) return c.never();
    if (n.length === 1) return n[0];
    return c.union(n);
  }
  if (!o) return c.any();
  let $;
  switch (o) {
    case "string": {
      let n = c.string();
      if (r.format) {
        let u = r.format;
        if (u === "email") n = n.check(c.email());
        else if (u === "uri" || u === "uri-reference") n = n.check(c.url());
        else if (u === "uuid" || u === "guid") n = n.check(c.uuid());
        else if (u === "date-time") n = n.check(c.iso.datetime());
        else if (u === "date") n = n.check(c.iso.date());
        else if (u === "time") n = n.check(c.iso.time());
        else if (u === "duration") n = n.check(c.iso.duration());
        else if (u === "ipv4") n = n.check(c.ipv4());
        else if (u === "ipv6") n = n.check(c.ipv6());
        else if (u === "mac") n = n.check(c.mac());
        else if (u === "cidr") n = n.check(c.cidrv4());
        else if (u === "cidr-v6") n = n.check(c.cidrv6());
        else if (u === "base64") n = n.check(c.base64());
        else if (u === "base64url") n = n.check(c.base64url());
        else if (u === "e164") n = n.check(c.e164());
        else if (u === "jwt") n = n.check(c.jwt());
        else if (u === "emoji") n = n.check(c.emoji());
        else if (u === "nanoid") n = n.check(c.nanoid());
        else if (u === "cuid") n = n.check(c.cuid());
        else if (u === "cuid2") n = n.check(c.cuid2());
        else if (u === "ulid") n = n.check(c.ulid());
        else if (u === "xid") n = n.check(c.xid());
        else if (u === "ksuid") n = n.check(c.ksuid());
      }
      if (typeof r.minLength === "number") n = n.min(r.minLength);
      if (typeof r.maxLength === "number") n = n.max(r.maxLength);
      if (r.pattern) n = n.regex(new RegExp(r.pattern));
      $ = n;
      break;
    }
    case "number":
    case "integer": {
      let n = o === "integer" ? c.number().int() : c.number();
      if (typeof r.minimum === "number") n = n.min(r.minimum);
      if (typeof r.maximum === "number") n = n.max(r.maximum);
      if (typeof r.exclusiveMinimum === "number") n = n.gt(r.exclusiveMinimum);
      else if (r.exclusiveMinimum === true && typeof r.minimum === "number") n = n.gt(r.minimum);
      if (typeof r.exclusiveMaximum === "number") n = n.lt(r.exclusiveMaximum);
      else if (r.exclusiveMaximum === true && typeof r.maximum === "number") n = n.lt(r.maximum);
      if (typeof r.multipleOf === "number") n = n.multipleOf(r.multipleOf);
      $ = n;
      break;
    }
    case "boolean": {
      $ = c.boolean();
      break;
    }
    case "null": {
      $ = c.null();
      break;
    }
    case "object": {
      let n = {}, u = r.properties || {}, i = new Set(r.required || []);
      for (let [I, b] of Object.entries(u)) {
        let U = K(b, v);
        n[I] = i.has(I) ? U : U.optional();
      }
      if (r.propertyNames) {
        let I = K(r.propertyNames, v), b = r.additionalProperties && typeof r.additionalProperties === "object" ? K(r.additionalProperties, v) : c.any();
        if (Object.keys(n).length === 0) {
          $ = c.record(I, b);
          break;
        }
        let U = c.object(n).passthrough(), w = c.looseRecord(I, b);
        $ = c.intersection(U, w);
        break;
      }
      if (r.patternProperties) {
        let I = r.patternProperties, b = Object.keys(I), U = [];
        for (let D of b) {
          let j = K(I[D], v), J = c.string().regex(new RegExp(D));
          U.push(c.looseRecord(J, j));
        }
        let w = [];
        if (Object.keys(n).length > 0) w.push(c.object(n).passthrough());
        if (w.push(...U), w.length === 0) $ = c.object({}).passthrough();
        else if (w.length === 1) $ = w[0];
        else {
          let D = c.intersection(w[0], w[1]);
          for (let j = 2; j < w.length; j++) D = c.intersection(D, w[j]);
          $ = D;
        }
        break;
      }
      let g = c.object(n);
      if (r.additionalProperties === false) $ = g.strict();
      else if (typeof r.additionalProperties === "object") $ = g.catchall(K(r.additionalProperties, v));
      else $ = g.passthrough();
      break;
    }
    case "array": {
      let { prefixItems: n, items: u } = r;
      if (n && Array.isArray(n)) {
        let i = n.map((I) => K(I, v)), g = u && typeof u === "object" && !Array.isArray(u) ? K(u, v) : void 0;
        if (g) $ = c.tuple(i).rest(g);
        else $ = c.tuple(i);
        if (typeof r.minItems === "number") $ = $.check(c.minLength(r.minItems));
        if (typeof r.maxItems === "number") $ = $.check(c.maxLength(r.maxItems));
      } else if (Array.isArray(u)) {
        let i = u.map((I) => K(I, v)), g = r.additionalItems && typeof r.additionalItems === "object" ? K(r.additionalItems, v) : void 0;
        if (g) $ = c.tuple(i).rest(g);
        else $ = c.tuple(i);
        if (typeof r.minItems === "number") $ = $.check(c.minLength(r.minItems));
        if (typeof r.maxItems === "number") $ = $.check(c.maxLength(r.maxItems));
      } else if (u !== void 0) {
        let i = K(u, v), g = c.array(i);
        if (typeof r.minItems === "number") g = g.min(r.minItems);
        if (typeof r.maxItems === "number") g = g.max(r.maxItems);
        $ = g;
      } else $ = c.array(c.any());
      break;
    }
    default:
      throw Error(`Unsupported type: ${o}`);
  }
  if (r.description) $ = $.describe(r.description);
  if (r.default !== void 0) $ = $.default(r.default);
  return $;
}
function K(r, v) {
  if (typeof r === "boolean") return r ? c.any() : c.never();
  let o = I4(r, v), $ = r.type || r.enum !== void 0 || r.const !== void 0;
  if (r.anyOf && Array.isArray(r.anyOf)) {
    let n = r.anyOf.map((i) => K(i, v)), u = c.union(n);
    o = $ ? c.intersection(o, u) : u;
  }
  if (r.oneOf && Array.isArray(r.oneOf)) {
    let n = r.oneOf.map((i) => K(i, v)), u = c.xor(n);
    o = $ ? c.intersection(o, u) : u;
  }
  if (r.allOf && Array.isArray(r.allOf)) if (r.allOf.length === 0) o = $ ? o : c.any();
  else {
    let n = $ ? o : K(r.allOf[0], v), u = $ ? 0 : 1;
    for (let i = u; i < r.allOf.length; i++) n = c.intersection(n, K(r.allOf[i], v));
    o = n;
  }
  if (r.nullable === true && v.version === "openapi-3.0") o = c.nullable(o);
  if (r.readOnly === true) o = c.readonly(o);
  return o;
}
function l4(r, v) {
  if (typeof r === "boolean") return r ? c.any() : c.never();
  let o = gU(r, v?.defaultTarget), $ = r.$defs || r.definitions || {};
  return K(r, { version: o, defs: $, refs: /* @__PURE__ */ new Map(), processing: /* @__PURE__ */ new Set(), rootSchema: r });
}
var ot = {};
d(ot, { string: () => tU, number: () => IU, date: () => _U, boolean: () => lU, bigint: () => UU });
function tU(r) {
  return Gi(er, r);
}
function IU(r) {
  return Bi(Cr, r);
}
function lU(r) {
  return Zi(xr, r);
}
function UU(r) {
  return mi(fr, r);
}
function _U(r) {
  return ng(En, r);
}
X(ln());
var _4 = t.union([t.literal("light"), t.literal("dark")]).describe("Color theme preference for the host environment.");
var lo = t.union([t.literal("inline"), t.literal("fullscreen"), t.literal("pip")]).describe("Display mode for UI presentation.");
var cU = t.union([t.literal("--color-background-primary"), t.literal("--color-background-secondary"), t.literal("--color-background-tertiary"), t.literal("--color-background-inverse"), t.literal("--color-background-ghost"), t.literal("--color-background-info"), t.literal("--color-background-danger"), t.literal("--color-background-success"), t.literal("--color-background-warning"), t.literal("--color-background-disabled"), t.literal("--color-text-primary"), t.literal("--color-text-secondary"), t.literal("--color-text-tertiary"), t.literal("--color-text-inverse"), t.literal("--color-text-info"), t.literal("--color-text-danger"), t.literal("--color-text-success"), t.literal("--color-text-warning"), t.literal("--color-text-disabled"), t.literal("--color-text-ghost"), t.literal("--color-border-primary"), t.literal("--color-border-secondary"), t.literal("--color-border-tertiary"), t.literal("--color-border-inverse"), t.literal("--color-border-ghost"), t.literal("--color-border-info"), t.literal("--color-border-danger"), t.literal("--color-border-success"), t.literal("--color-border-warning"), t.literal("--color-border-disabled"), t.literal("--color-ring-primary"), t.literal("--color-ring-secondary"), t.literal("--color-ring-inverse"), t.literal("--color-ring-info"), t.literal("--color-ring-danger"), t.literal("--color-ring-success"), t.literal("--color-ring-warning"), t.literal("--font-sans"), t.literal("--font-mono"), t.literal("--font-weight-normal"), t.literal("--font-weight-medium"), t.literal("--font-weight-semibold"), t.literal("--font-weight-bold"), t.literal("--font-text-xs-size"), t.literal("--font-text-sm-size"), t.literal("--font-text-md-size"), t.literal("--font-text-lg-size"), t.literal("--font-heading-xs-size"), t.literal("--font-heading-sm-size"), t.literal("--font-heading-md-size"), t.literal("--font-heading-lg-size"), t.literal("--font-heading-xl-size"), t.literal("--font-heading-2xl-size"), t.literal("--font-heading-3xl-size"), t.literal("--font-text-xs-line-height"), t.literal("--font-text-sm-line-height"), t.literal("--font-text-md-line-height"), t.literal("--font-text-lg-line-height"), t.literal("--font-heading-xs-line-height"), t.literal("--font-heading-sm-line-height"), t.literal("--font-heading-md-line-height"), t.literal("--font-heading-lg-line-height"), t.literal("--font-heading-xl-line-height"), t.literal("--font-heading-2xl-line-height"), t.literal("--font-heading-3xl-line-height"), t.literal("--border-radius-xs"), t.literal("--border-radius-sm"), t.literal("--border-radius-md"), t.literal("--border-radius-lg"), t.literal("--border-radius-xl"), t.literal("--border-radius-full"), t.literal("--border-width-regular"), t.literal("--shadow-hairline"), t.literal("--shadow-sm"), t.literal("--shadow-md"), t.literal("--shadow-lg")]).describe("CSS variable keys available to MCP apps for theming.");
var DU = t.record(cU.describe(`Style variables for theming MCP apps.

Individual style keys are optional - hosts may provide any subset of these values.
Values are strings containing CSS values (colors, sizes, font stacks, etc.).

Note: This type uses \`Record<K, string | undefined>\` rather than \`Partial<Record<K, string>>\`
for compatibility with Zod schema generation. Both are functionally equivalent for validation.`), t.union([t.string(), t.undefined()]).describe(`Style variables for theming MCP apps.

Individual style keys are optional - hosts may provide any subset of these values.
Values are strings containing CSS values (colors, sizes, font stacks, etc.).

Note: This type uses \`Record<K, string | undefined>\` rather than \`Partial<Record<K, string>>\`
for compatibility with Zod schema generation. Both are functionally equivalent for validation.`)).describe(`Style variables for theming MCP apps.

Individual style keys are optional - hosts may provide any subset of these values.
Values are strings containing CSS values (colors, sizes, font stacks, etc.).

Note: This type uses \`Record<K, string | undefined>\` rather than \`Partial<Record<K, string>>\`
for compatibility with Zod schema generation. Both are functionally equivalent for validation.`);
var jU = t.object({ method: t.literal("ui/open-link"), params: t.object({ url: t.string().describe("URL to open in the host's browser") }) });
var ut = t.object({ isError: t.boolean().optional().describe("True if the host failed to open the URL (e.g., due to security policy).") }).passthrough();
var $t = t.object({ isError: t.boolean().optional().describe("True if the host rejected or failed to deliver the message.") }).passthrough();
var PU = t.object({ method: t.literal("ui/notifications/sandbox-proxy-ready"), params: t.object({}) });
var SU = t.object({ method: t.literal("ui/notifications/sandbox-resource-ready"), params: t.object({ html: t.string().describe("HTML content to load into the inner iframe."), sandbox: t.string().optional().describe("Optional override for the inner iframe's sandbox attribute."), csp: t.object({ connectDomains: t.array(t.string()).optional().describe("Origins for network requests (fetch/XHR/WebSocket)."), resourceDomains: t.array(t.string()).optional().describe("Origins for static resources (scripts, images, styles, fonts).") }).optional().describe("CSP configuration from resource metadata.") }) });
var AU = t.object({ method: t.literal("ui/notifications/size-changed"), params: t.object({ width: t.number().optional().describe("New width in pixels."), height: t.number().optional().describe("New height in pixels.") }) });
var it = t.object({ method: t.literal("ui/notifications/tool-input"), params: t.object({ arguments: t.record(t.string(), t.unknown().describe("Complete tool call arguments as key-value pairs.")).optional().describe("Complete tool call arguments as key-value pairs.") }) });
var gt = t.object({ method: t.literal("ui/notifications/tool-input-partial"), params: t.object({ arguments: t.record(t.string(), t.unknown().describe("Partial tool call arguments (incomplete, may change).")).optional().describe("Partial tool call arguments (incomplete, may change).") }) });
var bt = t.object({ method: t.literal("ui/notifications/tool-cancelled"), params: t.object({ reason: t.string().optional().describe('Optional reason for the cancellation (e.g., "user action", "timeout").') }) });
var w4 = t.object({ fonts: t.string().optional().describe("CSS for font loading (@font-face rules or") });
var N4 = t.object({ variables: DU.optional().describe("CSS variables for theming the app."), css: w4.optional().describe("CSS blocks that apps can inject.") });
var tt = t.object({ method: t.literal("ui/resource-teardown"), params: t.object({}) });
var JU = t.record(t.string(), t.unknown());
var k4 = t.object({ experimental: t.object({}).optional().describe("Experimental features (structure TBD)."), openLinks: t.object({}).optional().describe("Host supports opening external URLs."), serverTools: t.object({ listChanged: t.boolean().optional().describe("Host supports tools/list_changed notifications.") }).optional().describe("Host can proxy tool calls to the MCP server."), serverResources: t.object({ listChanged: t.boolean().optional().describe("Host supports resources/list_changed notifications.") }).optional().describe("Host can proxy resource reads to the MCP server."), logging: t.object({}).optional().describe("Host accepts log messages.") });
var O4 = t.object({ experimental: t.object({}).optional().describe("Experimental features (structure TBD)."), tools: t.object({ listChanged: t.boolean().optional().describe("App supports tools/list_changed notifications.") }).optional().describe("App exposes MCP-style tools that the host can call.") });
var EU = t.object({ method: t.literal("ui/notifications/initialized"), params: t.object({}).optional() });
var c4 = t.object({ connectDomains: t.array(t.string()).optional().describe("Origins for network requests (fetch/XHR/WebSocket)."), resourceDomains: t.array(t.string()).optional().describe("Origins for static resources (scripts, images, styles, fonts).") });
var LU = t.object({ csp: c4.optional().describe("Content Security Policy configuration."), domain: t.string().optional().describe("Dedicated origin for widget sandbox."), prefersBorder: t.boolean().optional().describe("Visual boundary preference - true if UI prefers a visible border.") });
var GU = t.object({ method: t.literal("ui/request-display-mode"), params: t.object({ mode: lo.describe("The display mode being requested.") }) });
var It = t.object({ mode: lo.describe("The display mode that was actually set. May differ from requested if not supported.") }).passthrough();
var D4 = t.union([t.literal("model"), t.literal("app")]).describe("Tool visibility scope - who can access the tool.");
var WU = t.object({ resourceUri: t.string(), visibility: t.array(D4).optional().describe(`Who can access this tool. Default: ["model", "app"]
- "model": Tool visible to and callable by the agent
- "app": Tool callable by the app from this server only`) });
var XU = t.object({ method: t.literal("ui/message"), params: t.object({ role: t.literal("user").describe('Message role, currently only "user" is supported.'), content: t.array(ContentBlockSchema).describe("Message content blocks (text, image, etc.).") }) });
var lt = t.object({ method: t.literal("ui/notifications/tool-result"), params: CallToolResultSchema.describe("Standard MCP tool execution result.") });
var Ut = t.object({ toolInfo: t.object({ id: RequestIdSchema.describe("JSON-RPC id of the tools/call request."), tool: ToolSchema.describe("Tool definition including name, inputSchema, etc.") }).optional().describe("Metadata of the tool call that instantiated this App."), theme: _4.optional().describe("Current color theme preference."), styles: N4.optional().describe("Style configuration for theming the app."), displayMode: lo.optional().describe("How the UI is currently displayed."), availableDisplayModes: t.array(t.string()).optional().describe("Display modes the host supports."), viewport: t.object({ width: t.number().describe("Current viewport width in pixels."), height: t.number().describe("Current viewport height in pixels."), maxHeight: t.number().optional().describe("Maximum available height in pixels (if constrained)."), maxWidth: t.number().optional().describe("Maximum available width in pixels (if constrained).") }).optional().describe("Current and maximum dimensions available to the UI."), locale: t.string().optional().describe("User's language and region preference in BCP 47 format."), timeZone: t.string().optional().describe("User's timezone in IANA format."), userAgent: t.string().optional().describe("Host application identifier."), platform: t.union([t.literal("web"), t.literal("desktop"), t.literal("mobile")]).optional().describe("Platform type for responsive design decisions."), deviceCapabilities: t.object({ touch: t.boolean().optional().describe("Whether the device supports touch input."), hover: t.boolean().optional().describe("Whether the device supports hover interactions.") }).optional().describe("Device input capabilities."), safeAreaInsets: t.object({ top: t.number().describe("Top safe area inset in pixels."), right: t.number().describe("Right safe area inset in pixels."), bottom: t.number().describe("Bottom safe area inset in pixels."), left: t.number().describe("Left safe area inset in pixels.") }).optional().describe("Mobile safe area boundaries in pixels.") }).passthrough();
var _t = t.object({ method: t.literal("ui/notifications/host-context-changed"), params: Ut.describe("Partial context update containing only changed fields.") });
var KU = t.object({ method: t.literal("ui/initialize"), params: t.object({ appInfo: ImplementationSchema.describe("App identification (name and version)."), appCapabilities: O4.describe("Features and capabilities this app provides."), protocolVersion: t.string().describe("Protocol version this app supports.") }) });
var wt = t.object({ protocolVersion: t.string().describe('Negotiated protocol version string (e.g., "2025-11-21").'), hostInfo: ImplementationSchema.describe("Host application identification and version."), hostCapabilities: k4.describe("Features and capabilities provided by the host."), hostContext: Ut.describe("Rich context about the host environment.") }).passthrough();
function VU() {
  let r = document.documentElement.getAttribute("data-theme");
  if (r === "dark" || r === "light") return r;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
function YU(r) {
  let v = document.documentElement;
  v.setAttribute("data-theme", r), v.style.colorScheme = r;
}
function QU(r, v = document.documentElement) {
  for (let [o, $] of Object.entries(r)) if ($ !== void 0) v.style.setProperty(o, $);
}
function qU(r) {
  if (document.getElementById("__mcp-host-fonts")) return;
  let o = document.createElement("style");
  o.id = "__mcp-host-fonts", o.textContent = r, document.head.appendChild(o);
}
var TU = class extends Protocol {
  _appInfo;
  _capabilities;
  options;
  _hostCapabilities;
  _hostInfo;
  _hostContext;
  constructor(r, v = {}, o = { autoResize: true }) {
    super(o);
    this._appInfo = r;
    this._capabilities = v;
    this.options = o;
    this.setRequestHandler(PingRequestSchema, ($) => {
      return console.log("Received ping:", $.params), {};
    }), this.onhostcontextchanged = () => {
    };
  }
  getHostCapabilities() {
    return this._hostCapabilities;
  }
  getHostVersion() {
    return this._hostInfo;
  }
  getHostContext() {
    return this._hostContext;
  }
  set ontoolinput(r) {
    this.setNotificationHandler(it, (v) => r(v.params));
  }
  set ontoolinputpartial(r) {
    this.setNotificationHandler(gt, (v) => r(v.params));
  }
  set ontoolresult(r) {
    this.setNotificationHandler(lt, (v) => r(v.params));
  }
  set ontoolcancelled(r) {
    this.setNotificationHandler(bt, (v) => r(v.params));
  }
  set onhostcontextchanged(r) {
    this.setNotificationHandler(_t, (v) => {
      this._hostContext = { ...this._hostContext, ...v.params }, r(v.params);
    });
  }
  set onteardown(r) {
    this.setRequestHandler(tt, (v, o) => r(v.params, o));
  }
  set oncalltool(r) {
    this.setRequestHandler(CallToolRequestSchema, (v, o) => r(v.params, o));
  }
  set onlisttools(r) {
    this.setRequestHandler(ListToolsRequestSchema, (v, o) => r(v.params, o));
  }
  assertCapabilityForMethod(r) {
  }
  assertRequestHandlerCapability(r) {
    switch (r) {
      case "tools/call":
      case "tools/list":
        if (!this._capabilities.tools) throw Error(`Client does not support tool capability (required for ${r})`);
        return;
      case "ping":
      case "ui/resource-teardown":
        return;
      default:
        throw Error(`No handler for method ${r} registered`);
    }
  }
  assertNotificationCapability(r) {
  }
  assertTaskCapability(r) {
    throw Error("Tasks are not supported in MCP Apps");
  }
  assertTaskHandlerCapability(r) {
    throw Error("Task handlers are not supported in MCP Apps");
  }
  async callServerTool(r, v) {
    return await this.request({ method: "tools/call", params: r }, CallToolResultSchema, v);
  }
  sendMessage(r, v) {
    return this.request({ method: "ui/message", params: r }, $t, v);
  }
  sendLog(r) {
    return this.notification({ method: "notifications/message", params: r });
  }
  openLink(r, v) {
    return this.request({ method: "ui/open-link", params: r }, ut, v);
  }
  sendOpenLink = this.openLink;
  requestDisplayMode(r, v) {
    return this.request({ method: "ui/request-display-mode", params: r }, It, v);
  }
  sendSizeChanged(r) {
    return this.notification({ method: "ui/notifications/size-changed", params: r });
  }
  setupSizeChangedNotifications() {
    let r = false, v = 0, o = 0, $ = () => {
      if (r) return;
      r = true, requestAnimationFrame(() => {
        r = false;
        let u = document.documentElement, i = u.style.width, g = u.style.height;
        u.style.width = "fit-content", u.style.height = "fit-content";
        let I = u.getBoundingClientRect();
        u.style.width = i, u.style.height = g;
        let b = window.innerWidth - u.clientWidth, U = Math.ceil(I.width + b), w = Math.ceil(I.height);
        if (U !== v || w !== o) v = U, o = w, this.sendSizeChanged({ width: U, height: w });
      });
    };
    $();
    let n = new ResizeObserver($);
    return n.observe(document.documentElement), n.observe(document.body), () => n.disconnect();
  }
  async connect(r = new Yn(window.parent), v) {
    await super.connect(r);
    try {
      let o = await this.request({ method: "ui/initialize", params: { appCapabilities: this._capabilities, appInfo: this._appInfo, protocolVersion: Uo } }, wt, v);
      if (o === void 0) throw Error(`Server sent invalid initialize result: ${o}`);
      if (this._hostCapabilities = o.hostCapabilities, this._hostInfo = o.hostInfo, this._hostContext = o.hostContext, await this.notification({ method: "ui/notifications/initialized" }), this.options?.autoResize) this.setupSizeChangedNotifications();
    } catch (o) {
      throw this.close(), o;
    }
  }
};

// src/core/Subscribable.ts
var Subscribable = class {
  stateListeners = /* @__PURE__ */ new Set();
  eventHandlers = /* @__PURE__ */ new Map();
  subscribe(listener) {
    this.stateListeners.add(listener);
    this.onSubscribe();
    return () => {
      this.stateListeners.delete(listener);
      this.onUnsubscribe();
    };
  }
  on(event, handler) {
    let handlers = this.eventHandlers.get(event);
    if (!handlers) {
      handlers = /* @__PURE__ */ new Set();
      this.eventHandlers.set(event, handlers);
    }
    handlers.add(handler);
    console.log(`[Subscribable] on "${String(event)}" registered, total handlers: ${handlers.size}`);
    return () => {
      handlers.delete(handler);
      console.log(`[Subscribable] on "${String(event)}" unregistered, remaining: ${handlers.size}`);
    };
  }
  notifyStateChange(state, prevState) {
    this.stateListeners.forEach((listener) => listener(state, prevState));
  }
  emit(event, ...args) {
    const handlers = this.eventHandlers.get(event);
    console.log(`[Subscribable] emit "${String(event)}", handlers: ${handlers?.size ?? 0}`);
    if (handlers) {
      handlers.forEach((handler) => {
        handler(...args);
      });
    }
  }
  onSubscribe() {
  }
  onUnsubscribe() {
  }
};

// src/core/McpAppHostClient.ts
var McpAppHostClient = class extends Subscribable {
  // ============================================================================
  // Private Properties
  // ============================================================================
  state = {
    isReady: false,
    environment: "mcp-apps",
    widgetState: null
  };
  config;
  app = null;
  connected = false;
  // ============================================================================
  // Constructor
  // ============================================================================
  constructor(config) {
    super();
    this.config = config;
  }
  // ============================================================================
  // Public API
  // ============================================================================
  /**
   * Get the current client state.
   */
  getState() {
    return this.state;
  }
  /**
   * Connect to the MCP Apps host.
   *
   * Creates the App instance, registers notification handlers, and initiates
   * the protocol handshake. The host will receive `ui/initialize` and respond
   * with host context including theme, styles, and widgetState.
   */
  connect() {
    if (this.connected) {
      return;
    }
    this.connected = true;
    this.app = new TU(
      { name: this.config.name, version: this.config.version },
      {},
      // capabilities
      { autoResize: true }
    );
    this.setupHandlers();
    this.initiateConnection();
  }
  /**
   * Disconnect from the host.
   *
   * Cleans up the App instance and resets state.
   */
  disconnect() {
    if (!this.connected) return;
    this.connected = false;
    if (this.app) {
      this.app.close();
      this.app = null;
    }
    this.setState({ isReady: false });
  }
  /**
   * Call a tool on the MCP server via the host.
   *
   * Uses the SDK's callServerTool method which properly routes through
   * the host to the MCP server.
   *
   * @param toolName - Name of the tool to call
   * @param args - Arguments to pass to the tool
   * @returns Tool result with content and structuredContent
   */
  async callTool(toolName, args) {
    if (!this.app) {
      throw new Error("Not connected");
    }
    const sdkResult = await this.app.callServerTool({
      name: toolName,
      arguments: args
    });
    const result = {
      content: this.extractTextContent(sdkResult.content),
      structuredContent: sdkResult.structuredContent,
      isError: sdkResult.isError
    };
    this.emit("tool-result", result);
    return result;
  }
  /**
   * Send a notification to the host.
   *
   * Sends a notification via the ext-apps SDK transport. Can be used for both
   * spec-compliant and custom (Creature-specific) notifications.
   *
   * @param method - Notification method name
   * @param params - Notification parameters
   */
  sendNotification(method, params) {
    if (!this.app) {
      console.warn(`[${this.config.name}] Cannot send notification before connection`);
      return;
    }
    this.app.notification({ method, params });
  }
  /**
   * Set widget state and notify the host.
   *
   * Widget state is synchronized with the host for persistence across
   * sessions and visibility to the AI model.
   *
   * Note: This is a Creature-specific extension, not part of the MCP Apps spec.
   * The host should handle `ui/notifications/widget-state-changed` notifications.
   *
   * @param state - New widget state (or null to clear)
   */
  setWidgetState(state) {
    this.setState({ widgetState: state });
    this.emit("widget-state-change", state);
    this.sendNotification("ui/notifications/widget-state-changed", {
      widgetState: state
    });
  }
  async requestDisplayMode(params) {
    if (!this.app) {
      return { mode: params.mode };
    }
    const result = await this.app.requestDisplayMode({ mode: params.mode });
    return { mode: result.mode };
  }
  /**
   * Send a log message to the host's DevConsole.
   *
   * Uses the MCP protocol's `notifications/message` notification to send logs
   * to the host. Logs appear in the unified DevConsole alongside server logs,
   * with appropriate color coding based on level.
   *
   * @param level - Log severity level (debug, info, notice, warning, error)
   * @param message - Log message
   * @param data - Optional structured data to include with the log
   */
  log(level, message, data) {
    if (!this.app) {
      const consoleMethod = level === "error" ? "error" : level === "warning" ? "warn" : "log";
      console[consoleMethod](`[${this.config.name}]`, message, data ?? "");
      return;
    }
    this.app.sendLog({
      level,
      logger: this.config.name,
      data: data ? { message, ...data } : message
    });
  }
  // ============================================================================
  // Private Methods
  // ============================================================================
  /**
   * Update internal state and notify listeners.
   */
  setState(partial) {
    const prev = this.state;
    this.state = { ...this.state, ...partial };
    this.notifyStateChange(this.state, prev);
  }
  /**
   * Set up notification handlers on the App instance.
   *
   * Maps the official SDK's callback pattern to our event emitter pattern,
   * allowing consumers to use `.on("tool-result", ...)` etc.
   */
  setupHandlers() {
    if (!this.app) return;
    this.app.ontoolinput = (params) => {
      console.debug(`[${this.config.name}] Received tool-input`, { args: params.arguments });
      this.emit("tool-input", params.arguments || {});
    };
    this.app.ontoolresult = (params) => {
      console.log(`[McpAppHostClient] ontoolresult called`, {
        isError: params.isError,
        source: params.source,
        hasContent: !!params.content,
        hasStructuredContent: !!params.structuredContent,
        structuredContent: params.structuredContent
      });
      const result = {
        content: this.extractTextContent(params.content),
        structuredContent: params.structuredContent,
        isError: params.isError,
        source: params.source
      };
      console.log(`[McpAppHostClient] Emitting tool-result event`, result);
      this.emit("tool-result", result);
    };
    this.app.onhostcontextchanged = (params) => {
      console.debug(`[${this.config.name}] Host context changed`, { theme: params.theme });
      this.applyHostContext(params);
    };
    this.app.onteardown = async (_params, _extra) => {
      console.debug(`[${this.config.name}] Teardown requested`);
      await this.emit("teardown");
      return {};
    };
  }
  /**
   * Initiate connection using PostMessageTransport.
   *
   * The SDK's App.connect() handles the protocol handshake correctly:
   * the guest (App) sends `ui/initialize` to the host.
   */
  async initiateConnection() {
    if (!this.app) {
      return;
    }
    try {
      const transport = new Yn(window.parent, window.parent);
      await this.app.connect(transport);
      const hostContext = this.app.getHostContext();
      console.debug(`[${this.config.name}] Connected to host`, { theme: hostContext?.theme });
      if (hostContext) {
        this.applyHostContext(hostContext);
        const widgetState = hostContext.widgetState;
        if (widgetState) {
          this.setState({ widgetState });
          this.emit("widget-state-change", widgetState);
        }
      }
      this.setState({ isReady: true });
    } catch (error) {
      console.error(`[${this.config.name}] Connection failed`, { error });
    }
  }
  /**
   * Apply theme, styles, and fonts from host context.
   * Also applies Creature-specific extension styles if present.
   */
  applyHostContext(context) {
    if (context.theme) {
      YU(context.theme);
      this.emit("theme-change", context.theme);
    }
    if (context.styles?.variables) {
      QU(context.styles.variables);
    }
    if (context.styles?.css?.fonts) {
      qU(context.styles.css.fonts);
    }
    if (context.creatureStyles) {
      this.applyCreatureStyles(context.creatureStyles);
    }
  }
  /**
   * Apply Creature-specific CSS variables to the document root.
   * These are host extensions sent outside the spec-validated styles.variables path.
   */
  applyCreatureStyles(styles) {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(styles)) {
      if (value !== void 0) {
        root.style.setProperty(key, value);
      }
    }
  }
  /**
   * Extract text content from SDK result content array.
   * Filters to only include text items since our ToolResult type expects text.
   */
  extractTextContent(content) {
    return content?.filter((item) => item.type === "text").map((item) => ({ type: item.type, text: item.text }));
  }
};

// src/core/ChatGptAppHostClient.ts
var ChatGptAppHostClient = class extends Subscribable {
  // ============================================================================
  // Private Properties
  // ============================================================================
  state = {
    isReady: false,
    environment: "chatgpt",
    widgetState: null
  };
  config;
  connected = false;
  hasProcessedInitialData = false;
  globalsHandler = null;
  // ============================================================================
  // Constructor
  // ============================================================================
  constructor(config) {
    super();
    this.config = config;
  }
  // ============================================================================
  // Public API
  // ============================================================================
  /**
   * Get the current client state.
   */
  getState() {
    return this.state;
  }
  /**
   * Connect to the ChatGPT host.
   *
   * Processes initial data from `window.openai` and sets up a listener
   * for subsequent `openai:set_globals` events.
   */
  connect() {
    if (this.connected) return;
    this.connected = true;
    this.processInitialData();
    this.setupGlobalsListener();
  }
  /**
   * Disconnect from the host.
   *
   * Removes the globals event listener.
   */
  disconnect() {
    if (!this.connected) return;
    this.connected = false;
    if (this.globalsHandler) {
      window.removeEventListener("openai:set_globals", this.globalsHandler);
      this.globalsHandler = null;
    }
  }
  /**
   * Call a tool on the MCP server via the ChatGPT bridge.
   *
   * @param toolName - Name of the tool to call
   * @param args - Arguments to pass to the tool
   * @returns Tool result with content and structuredContent
   */
  async callTool(toolName, args) {
    const openai = window.openai;
    if (!openai?.callTool) {
      throw new Error("ChatGPT bridge not available");
    }
    const response = await openai.callTool(toolName, args);
    const result = {
      structuredContent: response?.structuredContent,
      content: response?.content?.map((c2) => ({
        type: c2.type,
        text: c2.text || ""
      })),
      source: "ui"
    };
    this.emit("tool-result", result);
    return result;
  }
  /**
   * Send a notification to the host.
   *
   * No-op on ChatGPT — notifications are not supported.
   */
  sendNotification(_method, _params) {
  }
  /**
   * Set widget state and sync with the ChatGPT host.
   *
   * @param state - New widget state (or null to clear)
   */
  setWidgetState(state) {
    this.setState({ widgetState: state });
    if (window.openai?.setWidgetState) {
      window.openai.setWidgetState(state ?? {});
    }
    this.emit("widget-state-change", state);
  }
  /**
   * Log a message to the console.
   *
   * ChatGPT doesn't have a DevConsole, so logs go to browser console only.
   * This provides API parity with McpAppHostClient.
   *
   * @param level - Log severity level
   * @param message - Log message
   * @param data - Optional structured data
   */
  log(level, message, data) {
    const consoleMethod = level === "error" ? "error" : level === "warning" ? "warn" : "log";
    console[consoleMethod](`[${this.config.name}]`, message, data ?? "");
  }
  // ============================================================================
  // Private Methods
  // ============================================================================
  /**
   * Update internal state and notify listeners.
   */
  setState(partial) {
    const prev = this.state;
    this.state = { ...this.state, ...partial };
    this.notifyStateChange(this.state, prev);
  }
  /**
   * Process initial data from `window.openai`.
   *
   * Called once on connect to handle any tool output or widget state
   * that was set before the client connected.
   */
  processInitialData() {
    if (this.hasProcessedInitialData) return;
    const openai = window.openai;
    if (!openai) {
      console.warn("[SDK] window.openai not available");
      return;
    }
    this.hasProcessedInitialData = true;
    this.setState({ isReady: true });
    if (openai.toolOutput) {
      this.emit("tool-input", openai.toolOutput);
      this.emit("tool-result", { structuredContent: openai.toolOutput });
    }
    if (openai.widgetState) {
      this.setState({ widgetState: openai.widgetState });
      this.emit("widget-state-change", openai.widgetState);
    }
  }
  /**
   * Set up listener for `openai:set_globals` events.
   *
   * ChatGPT dispatches this event when tool output or widget state
   * changes after initial load.
   */
  setupGlobalsListener() {
    this.globalsHandler = (event) => {
      const customEvent = event;
      const globals = customEvent.detail?.globals;
      if (globals?.toolOutput) {
        this.emit("tool-input", globals.toolOutput);
        this.emit("tool-result", { structuredContent: globals.toolOutput });
      }
      if (globals?.widgetState !== void 0) {
        this.setState({ widgetState: globals.widgetState });
        this.emit("widget-state-change", globals.widgetState);
      }
    };
    window.addEventListener("openai:set_globals", this.globalsHandler, { passive: true });
  }
  /**
   * Request a display mode change from the ChatGPT host.
   *
   * @param params - Display mode to request
   * @returns The resulting display mode
   */
  async requestDisplayMode(params) {
    const openai = window.openai;
    if (openai?.requestDisplayMode) {
      const result = await openai.requestDisplayMode({ mode: params.mode });
      return { mode: result.mode };
    }
    return { mode: params.mode };
  }
};

// src/core/utils.ts
function detectEnvironment() {
  if (typeof window === "undefined") {
    return "standalone";
  }
  if ("openai" in window && window.openai) {
    return "chatgpt";
  }
  if (window.parent !== window) {
    return "mcp-apps";
  }
  return "standalone";
}

// src/core/websocket.ts
function createWebSocket(url, config = {}) {
  const {
    onMessage,
    onStatusChange,
    reconnect = true,
    reconnectInterval = 1e3
  } = config;
  let ws = null;
  let status = "disconnected";
  let error;
  let reconnectAttempts = 0;
  let reconnectTimer = null;
  let intentionalClose = false;
  const setStatus = (newStatus, newError) => {
    status = newStatus;
    error = newError;
    onStatusChange?.(status, error);
  };
  const connect = () => {
    if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
      console.log("[WebSocket] Already connected/connecting to:", url);
      return;
    }
    intentionalClose = false;
    setStatus("connecting");
    console.log("[WebSocket] Connecting to:", url);
    try {
      ws = new WebSocket(url);
    } catch (e2) {
      console.error("[WebSocket] Failed to create WebSocket:", e2);
      setStatus("error", "Failed to create WebSocket");
      scheduleReconnect();
      return;
    }
    ws.onopen = () => {
      console.log("[WebSocket] Connected to:", url);
      reconnectAttempts = 0;
      setStatus("connected");
    };
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("[WebSocket] Received message:", message);
        onMessage?.(message);
      } catch (e2) {
        console.error("[WebSocket] Failed to parse message:", e2);
      }
    };
    ws.onerror = (e2) => {
      console.error("[WebSocket] Error:", e2);
      setStatus("error", "Connection error");
    };
    ws.onclose = (event) => {
      ws = null;
      if (intentionalClose) {
        setStatus("disconnected");
        return;
      }
      if (event.code === 4004) {
        setStatus("error", "Instance WebSocket not found");
        return;
      }
      scheduleReconnect();
    };
  };
  const scheduleReconnect = () => {
    if (!reconnect) {
      setStatus("disconnected");
      return;
    }
    const delay = Math.min(reconnectInterval * Math.pow(2, reconnectAttempts), 3e4);
    reconnectAttempts++;
    setStatus("connecting");
    reconnectTimer = setTimeout(connect, delay);
  };
  const disconnect = () => {
    intentionalClose = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    ws?.close();
    ws = null;
    setStatus("disconnected");
  };
  const send = (message) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };
  return {
    get status() {
      return status;
    },
    get error() {
      return error;
    },
    connect,
    disconnect,
    send
  };
}

// src/core/index.ts
function createHost(config) {
  const environment = detectEnvironment();
  if (environment === "chatgpt") {
    return new ChatGptAppHostClient(config);
  }
  return new McpAppHostClient(config);
}

// src/react/useHost.ts
function useHost(config) {
  const clientRef = useRef(null);
  if (!clientRef.current) {
    clientRef.current = createHost({ name: config.name, version: config.version });
  }
  const client = clientRef.current;
  const log = useMemo(() => {
    const logFn = (message, data) => {
      client.log("info", message, data);
    };
    logFn.debug = (message, data) => {
      client.log("debug", message, data);
    };
    logFn.info = (message, data) => {
      client.log("info", message, data);
    };
    logFn.notice = (message, data) => {
      client.log("notice", message, data);
    };
    logFn.warn = (message, data) => {
      client.log("warning", message, data);
    };
    logFn.error = (message, data) => {
      client.log("error", message, data);
    };
    return logFn;
  }, [client]);
  const boundMethods = useMemo(
    () => ({
      callTool: client.callTool.bind(client),
      sendNotification: client.sendNotification.bind(client),
      setWidgetState: client.setWidgetState.bind(client),
      requestDisplayMode: client.requestDisplayMode.bind(client)
    }),
    [client]
  );
  const state = useSyncExternalStore(
    (onStoreChange) => client.subscribe(onStoreChange),
    () => client.getState(),
    () => client.getState()
  );
  const callbacksRef = useRef({
    onToolInput: config.onToolInput,
    onToolResult: config.onToolResult,
    onThemeChange: config.onThemeChange,
    onTeardown: config.onTeardown,
    onWidgetStateChange: config.onWidgetStateChange
  });
  useEffect(() => {
    callbacksRef.current = {
      onToolInput: config.onToolInput,
      onToolResult: config.onToolResult,
      onThemeChange: config.onThemeChange,
      onTeardown: config.onTeardown,
      onWidgetStateChange: config.onWidgetStateChange
    };
  });
  useEffect(() => {
    const unsubs = [];
    unsubs.push(
      client.on("tool-input", (args) => callbacksRef.current.onToolInput?.(args))
    );
    unsubs.push(
      client.on("tool-result", (result) => callbacksRef.current.onToolResult?.(result))
    );
    unsubs.push(
      client.on("theme-change", (theme) => callbacksRef.current.onThemeChange?.(theme))
    );
    unsubs.push(
      client.on("teardown", () => callbacksRef.current.onTeardown?.())
    );
    unsubs.push(
      client.on(
        "widget-state-change",
        (widgetState) => callbacksRef.current.onWidgetStateChange?.(widgetState)
      )
    );
    client.connect();
    return () => {
      unsubs.forEach((unsub) => unsub());
      client.disconnect();
    };
  }, [client]);
  return {
    isReady: state.isReady,
    environment: state.environment,
    widgetState: state.widgetState,
    callTool: boundMethods.callTool,
    sendNotification: boundMethods.sendNotification,
    setWidgetState: boundMethods.setWidgetState,
    requestDisplayMode: boundMethods.requestDisplayMode,
    log
  };
}

// src/react/useToolResult.ts
import { useState, useCallback } from "react";
function useToolResult() {
  const [data, setData] = useState(null);
  const [instanceId, setInstanceId] = useState(null);
  const [title, setTitle] = useState(null);
  const [isError, setIsError] = useState(false);
  const [text, setText] = useState(null);
  const onToolResult = useCallback((result) => {
    const structured = result.structuredContent;
    if (structured) {
      const { title: resultTitle, instanceId: resultInstanceId, ...rest } = structured;
      setData(rest);
      if (resultTitle) {
        setTitle(resultTitle);
      }
      if (resultInstanceId) {
        setInstanceId(resultInstanceId);
      }
    }
    setIsError(result.isError || false);
    if (result.content?.[0]?.text) {
      setText(result.content[0].text);
    }
  }, []);
  const reset = useCallback(() => {
    setData(null);
    setInstanceId(null);
    setTitle(null);
    setIsError(false);
    setText(null);
  }, []);
  return {
    data,
    instanceId,
    title,
    isError,
    text,
    onToolResult,
    reset
  };
}

// src/react/useWebSocket.ts
import { useEffect as useEffect2, useRef as useRef2, useMemo as useMemo2, useCallback as useCallback2, useSyncExternalStore as useSyncExternalStore2 } from "react";
function useWebSocket(url, config = {}) {
  const { onMessage, enabled = true } = config;
  const onMessageRef = useRef2(onMessage);
  onMessageRef.current = onMessage;
  const stateRef = useRef2({ status: "disconnected", error: void 0 });
  const listenersRef = useRef2(/* @__PURE__ */ new Set());
  const clientRef = useRef2(null);
  const subscribe = useCallback2((listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);
  const getSnapshot = useCallback2(() => stateRef.current, []);
  const state = useSyncExternalStore2(subscribe, getSnapshot, getSnapshot);
  useEffect2(() => {
    if (!url || !enabled) {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
        stateRef.current = { status: "disconnected", error: void 0 };
        listenersRef.current.forEach((l2) => l2());
      }
      return;
    }
    const client = createWebSocket(url, {
      onMessage: (msg) => onMessageRef.current?.(msg),
      onStatusChange: (status, error) => {
        stateRef.current = { status, error };
        listenersRef.current.forEach((l2) => l2());
      }
    });
    clientRef.current = client;
    client.connect();
    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [url, enabled]);
  const send = useMemo2(() => {
    return (message) => {
      clientRef.current?.send(message);
    };
  }, []);
  return {
    status: state.status,
    error: state.error,
    send
  };
}

// src/react/CreatureIcon.tsx
import { useState as useState2, useEffect as useEffect3, useRef as useRef3 } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function CreatureIcon({
  isDarkMode,
  showEyes = true,
  enableBlink = false,
  width = 26,
  height = 26,
  className = ""
}) {
  const fillColor = isDarkMode ? "#F8F7F6" : "#0D0D0C";
  const [isBlinking, setIsBlinking] = useState2(false);
  const timeoutRef = useRef3(null);
  useEffect3(() => {
    if (!enableBlink || !showEyes) {
      return;
    }
    const scheduleNextBlink = () => {
      const nextBlinkDelay = Math.random() * 4e3 + 2e3;
      timeoutRef.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 150);
      }, nextBlinkDelay);
    };
    scheduleNextBlink();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enableBlink, showEyes]);
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width,
      height,
      viewBox: "0 0 110 111",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      className,
      children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            fillRule: "evenodd",
            clipRule: "evenodd",
            d: "M76.7407 18.0698L69.6709 0L47.7099 28.6693L11.7829 31.4596L8.12513 55.4302L15.3684 62.8469L21.6574 63.9457L0 88.9139C11.8118 94.2343 23.6381 99.5546 35.4499 104.861L54.2013 93.3813L62.7746 105.265L71.5215 110.889L87.5115 105.439L85.0537 85.1115L100.971 91.1693L109.053 74.5286L106.812 62.0084L94.7692 52.4953L101.608 26.3995L98.0532 1.81982L78.3892 18.2808L76.7407 18.0698ZM76.5816 94.1909L71.2034 65.0011L95.6366 73.5166L101.318 63.1072L80.9622 47.0159C84.5477 35.4354 88.191 23.826 91.5452 12.1877L77.1744 24.5698L69.6709 23.4566L68.3264 8.84802L49.9797 32.7897L15.5563 35.4643L13.113 51.4544L36.621 53.2616L7.08419 87.338L24.6212 95.2318L48.1147 77.5069L64.2348 99.8582L76.6105 94.1764L76.5816 94.1909Z",
            fill: fillColor
          }
        ),
        showEyes && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            "g",
            {
              style: {
                transformOrigin: "64px 33.65px",
                transform: isBlinking ? "scaleY(0.1)" : "scaleY(1)",
                transition: "transform 0.1s ease-out"
              },
              children: /* @__PURE__ */ jsx(
                "path",
                {
                  d: "M65.6051 34.48C66.4951 32.97 66.6051 31.3799 65.8451 30.9299C65.0851 30.4899 63.7451 31.3499 62.8551 32.8699C61.9651 34.3799 61.8551 35.97 62.6151 36.42C63.3751 36.86 64.7151 36 65.6051 34.48Z",
                  fill: fillColor
                }
              )
            }
          ),
          /* @__PURE__ */ jsx(
            "g",
            {
              style: {
                transformOrigin: "70px 36.265px",
                transform: isBlinking ? "scaleY(0.1)" : "scaleY(1)",
                transition: "transform 0.1s ease-out"
              },
              children: /* @__PURE__ */ jsx(
                "path",
                {
                  d: "M71.7651 37.0999C72.6951 35.1499 72.6551 33.1899 71.6751 32.73C70.6951 32.27 69.1551 33.4799 68.2351 35.4299C67.3051 37.3799 67.3451 39.3399 68.3251 39.7999C69.3051 40.2599 70.8451 39.0499 71.7651 37.0999Z",
                  fill: fillColor
                }
              )
            }
          )
        ] })
      ]
    }
  );
}
export {
  ChatGptAppHostClient,
  CreatureIcon,
  McpAppHostClient,
  YU as applyDocumentTheme,
  qU as applyHostFonts,
  QU as applyHostStyleVariables,
  createHost,
  createWebSocket,
  detectEnvironment,
  VU as getDocumentTheme,
  useHost,
  useToolResult,
  useWebSocket
};
//# sourceMappingURL=index.js.map