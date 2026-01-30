/**
 * HMR Client Script
 *
 * This script is injected into MCP App HTML during development mode.
 * It connects to Vite's HMR WebSocket and notifies the parent frame
 * when a full reload is needed.
 *
 * The parent frame (Creature host) will then:
 * 1. Save current widget state
 * 2. Re-fetch fresh HTML from the MCP server
 * 3. Reload the iframe with new content
 * 4. Restore widget state
 *
 * ## Internal Protocol Extension
 *
 * This module uses the `ui/notifications/hmr-reload` notification method,
 * which is an **internal, dev-only Creature extension** not part of the
 * MCP Apps specification. It is NOT exposed via the public SDK client API.
 *
 * The host (Creature desktop) listens for this notification and triggers
 * a graceful iframe reload while preserving widget state.
 */

/**
 * Internal notification method for HMR reload.
 *
 * This is a Creature-specific, dev-only extension NOT part of the MCP Apps spec.
 * It is used internally by the Vite HMR integration and should not be used directly.
 *
 * @internal
 */
export const HMR_RELOAD_NOTIFICATION = "ui/notifications/hmr-reload" as const;

/**
 * Generate the HMR client script as a string.
 * The port is injected at generation time.
 */
export function generateHmrClientScript(port: number): string {
  return `
(function() {
  if (window.parent === window) {
    console.log('[Creature HMR] Not in iframe, skipping HMR client');
    return;
  }
  if (window.__CREATURE_HMR_CONNECTED__) {
    console.log('[Creature HMR] Already connected, skipping');
    return;
  }
  window.__CREATURE_HMR_CONNECTED__ = true;

  var HMR_PORT = ${port};
  var reconnectAttempts = 0;
  var maxReconnectAttempts = 10;
  var reconnectDelay = 1000;

  console.log('[Creature HMR] Initializing HMR client, will connect to port ' + HMR_PORT);

  function connect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log('[Creature HMR] Max reconnection attempts reached, giving up');
      return;
    }

    console.log('[Creature HMR] Attempting to connect to ws://localhost:' + HMR_PORT + ' (attempt ' + (reconnectAttempts + 1) + ')');
    var ws = new WebSocket('ws://localhost:' + HMR_PORT);

    ws.onopen = function() {
      console.log('[Creature HMR] Connected to HMR server on port ' + HMR_PORT);
      reconnectAttempts = 0;
    };

    ws.onmessage = function(event) {
      console.log('[Creature HMR] Received message:', event.data);
      try {
        var data = JSON.parse(event.data);
        
        if (data.type === 'full-reload') {
          console.log('[Creature HMR] Full reload triggered, notifying parent');
          notifyParent();
        } else if (data.type === 'update') {
          console.log('[Creature HMR] Update detected, notifying parent');
          notifyParent();
        } else if (data.type === 'connected') {
          console.log('[Creature HMR] Server acknowledged connection');
        }
      } catch (e) {
        console.log('[Creature HMR] Failed to parse message:', e);
      }
    };

    ws.onclose = function() {
      console.log('[Creature HMR] Disconnected, reconnecting in ' + reconnectDelay + 'ms...');
      reconnectAttempts++;
      setTimeout(connect, reconnectDelay);
    };

    ws.onerror = function(err) {
      console.log('[Creature HMR] WebSocket error:', err);
    };
  }

  // Note: Method name must match HMR_RELOAD_NOTIFICATION constant
  function notifyParent() {
    console.log('[Creature HMR] Sending hmr-reload to parent frame');
    window.parent.postMessage({
      jsonrpc: '2.0',
      method: '${HMR_RELOAD_NOTIFICATION}',
      params: {}
    }, '*');
  }

  // Start connection
  connect();
})();
`.trim();
}

/**
 * Generate a script tag with the HMR client code.
 */
export function generateHmrClientScriptTag(port: number): string {
  return `<script>${generateHmrClientScript(port)}</script>`;
}
