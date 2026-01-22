import type { HostClientState, HostClientEvents, StateListener } from "./types.js";

type EventHandler = HostClientEvents[keyof HostClientEvents];

export abstract class Subscribable {
  private stateListeners = new Set<StateListener>();
  private eventHandlers = new Map<keyof HostClientEvents, Set<EventHandler>>();

  subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    this.onSubscribe();
    return () => {
      this.stateListeners.delete(listener);
      this.onUnsubscribe();
    };
  }

  on<K extends keyof HostClientEvents>(
    event: K,
    handler: HostClientEvents[K]
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

  protected emit<K extends keyof HostClientEvents>(
    event: K,
    ...args: Parameters<HostClientEvents[K]>
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        (handler as (...args: Parameters<HostClientEvents[K]>) => void)(...args);
      });
    }
  }

  protected onSubscribe(): void {}
  protected onUnsubscribe(): void {}
}
