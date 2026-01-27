import type { HostClientState, BaseHostClientEvents, StateListener } from "./types.js";

type EventHandler = BaseHostClientEvents[keyof BaseHostClientEvents];

/**
 * Base class for subscribable host clients.
 * Provides event emitter pattern for state changes and host events.
 */
export abstract class Subscribable {
  private stateListeners = new Set<StateListener>();
  private eventHandlers = new Map<keyof BaseHostClientEvents, Set<EventHandler>>();

  subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    this.onSubscribe();
    return () => {
      this.stateListeners.delete(listener);
      this.onUnsubscribe();
    };
  }

  on<K extends keyof BaseHostClientEvents>(
    event: K,
    handler: BaseHostClientEvents[K]
  ): () => void {
    let handlers = this.eventHandlers.get(event);
    if (!handlers) {
      handlers = new Set();
      this.eventHandlers.set(event, handlers);
    }
    handlers.add(handler as EventHandler);
    return () => {
      handlers!.delete(handler as EventHandler);
    };
  }

  protected notifyStateChange(state: HostClientState, prevState: HostClientState): void {
    this.stateListeners.forEach((listener) => listener(state, prevState));
  }

  protected emit<K extends keyof BaseHostClientEvents>(
    event: K,
    ...args: Parameters<BaseHostClientEvents[K]>
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        (handler as (...args: Parameters<BaseHostClientEvents[K]>) => void)(...args);
      });
    }
  }

  protected onSubscribe(): void {}
  protected onUnsubscribe(): void {}
}

/**
 * Extended subscribable for MCP Apps hosts that support additional events.
 */
export abstract class McpAppsSubscribable extends Subscribable {
  private mcpEventHandlers = new Map<"theme-change" | "teardown", Set<(...args: unknown[]) => unknown>>();

  onMcpEvent<K extends "theme-change" | "teardown">(
    event: K,
    handler: K extends "theme-change" 
      ? (theme: "light" | "dark") => void 
      : () => Promise<void> | void
  ): () => void {
    let handlers = this.mcpEventHandlers.get(event);
    if (!handlers) {
      handlers = new Set();
      this.mcpEventHandlers.set(event, handlers);
    }
    handlers.add(handler as (...args: unknown[]) => unknown);
    return () => {
      handlers!.delete(handler as (...args: unknown[]) => unknown);
    };
  }

  protected emitMcpEvent<K extends "theme-change" | "teardown">(
    event: K,
    ...args: K extends "theme-change" ? ["light" | "dark"] : []
  ): void | Promise<void> {
    const handlers = this.mcpEventHandlers.get(event);
    if (handlers) {
      if (event === "teardown") {
        // For teardown, we may need to await handlers
        const promises: (Promise<void> | void)[] = [];
        handlers.forEach((handler) => {
          promises.push((handler as () => Promise<void> | void)());
        });
        return Promise.all(promises).then(() => {});
      } else {
        handlers.forEach((handler) => {
          (handler as (theme: "light" | "dark") => void)(args[0] as "light" | "dark");
        });
      }
    }
  }
}
