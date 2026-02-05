/**
 * Main App Component
 *
 * Demonstrates:
 * - HostProvider setup
 * - View routing via useViews()
 * - Widget state management
 * - Tool result handling
 */

import { useEffect, useRef, useCallback } from "react";
import { HostProvider, useHost, useViews } from "open-mcp-app/react";
import { ListView } from "./ListView";
import { DetailView } from "./DetailView";
import type { Item, WidgetState, ModelContent, PrivateContent } from "./types";
import { VIEWS } from "./types";

/**
 * Inner app component that uses SDK hooks.
 */
function AppContent() {
  const { isReady, callTool, onToolResult, hostContext, exp_widgetState, exp } =
    useHost();

  // View routing - automatically switches based on tool results
  const { view, params, data } = useViews(VIEWS);

  // Widget state for AI memory and UI restoration
  const [widgetState, setWidgetState] = exp_widgetState<WidgetState>();

  // Track initialization
  const hasInitialized = useRef(false);

  // Tool callers
  const [listItems] = callTool<{ items: Item[] }>("items_list");
  const [getItem] = callTool<{ item: Item; view: string }>("items_get");

  // Get items from widget state or tool result
  const items: Item[] = data?.items ?? widgetState?.privateContent?.items ?? [];
  const selectedItem: Item | undefined =
    data?.item ?? items.find((i) => i.id === params?.itemId);

  /**
   * Update widget state helper.
   * Updates both AI-visible and UI-only state.
   */
  const updateWidgetState = useCallback(
    ({
      items,
      currentView,
      selectedItem,
      lastAction,
    }: {
      items: Item[];
      currentView: "list" | "detail";
      selectedItem?: Item;
      lastAction?: ModelContent["lastAction"];
    }) => {
      const modelContent: ModelContent = {
        currentView,
        totalItems: items.length,
        completedItems: items.filter((i) => i.completed).length,
        selectedItemId: selectedItem?.id,
        selectedItemTitle: selectedItem?.title,
        lastAction,
      };

      const privateContent: PrivateContent = {
        items,
        lastFetchedAt: new Date().toISOString(),
      };

      setWidgetState({ modelContent, privateContent });
    },
    [setWidgetState]
  );

  /**
   * Handle initial load.
   */
  useEffect(() => {
    if (!isReady || hasInitialized.current) return;
    hasInitialized.current = true;

    // Check if opened by tool call (has initial data)
    const initialResult = exp.getInitialToolResult();
    if (initialResult?.structuredContent?.items) {
      const initialItems = initialResult.structuredContent.items as Item[];
      updateWidgetState({ items: initialItems, currentView: "list" });
    } else if (widgetState?.privateContent?.items) {
      // Restore from widget state
      // State already loaded, no action needed
    } else {
      // Opened without data - fetch
      listItems({});
    }
  }, [isReady, exp, listItems, widgetState, updateWidgetState]);

  /**
   * Handle tool results from AI or UI calls.
   */
  useEffect(() => {
    return onToolResult((result) => {
      const resultData = result.structuredContent as {
        items?: Item[];
        item?: Item;
        view?: string;
        searchQuery?: string;
      } | null;

      if (!resultData) return;

      // Determine action from tool name
      const toolName = result._meta?.toolName as string | undefined;
      let lastAction: ModelContent["lastAction"] | undefined;

      if (toolName === "items_create") {
        lastAction = { type: "created", itemTitle: result.text };
      } else if (toolName === "items_update") {
        lastAction = { type: "updated", itemTitle: result.text };
      } else if (toolName === "items_delete") {
        lastAction = { type: "deleted", itemTitle: result.text };
      } else if (toolName === "items_search" && resultData.searchQuery) {
        lastAction = { type: "searched", query: resultData.searchQuery };
      }

      // Update state based on result
      if (resultData.items) {
        const isDetailView = resultData.view === "detail" && resultData.item;
        updateWidgetState({
          items: resultData.items,
          currentView: isDetailView ? "detail" : "list",
          selectedItem: isDetailView ? resultData.item : undefined,
          lastAction,
        });
      } else if (resultData.item && resultData.view === "detail") {
        // Single item fetch for detail view
        const currentItems = widgetState?.privateContent?.items ?? [];
        updateWidgetState({
          items: currentItems,
          currentView: "detail",
          selectedItem: resultData.item,
        });
      }
    });
  }, [onToolResult, updateWidgetState, widgetState]);

  /**
   * Handle opening an item (navigating to detail view).
   */
  const handleOpenItem = useCallback(
    (id: string) => {
      getItem({ id });
    },
    [getItem]
  );

  /**
   * Handle going back to list view.
   */
  const handleBack = useCallback(() => {
    listItems({});
  }, [listItems]);

  // Check display mode for responsive rendering
  const isInline = hostContext?.displayMode === "inline";

  // Loading state
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-primary">
        <div className="w-5 h-5 border-2 border-bdr-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Route to appropriate view
  if (view === "/item/:itemId" && selectedItem) {
    return (
      <DetailView
        item={selectedItem}
        onBack={handleBack}
        isInline={isInline}
      />
    );
  }

  return (
    <ListView
      items={items}
      onOpenItem={handleOpenItem}
      isInline={isInline}
    />
  );
}

/**
 * Root App component with HostProvider.
 */
export default function App() {
  return (
    <HostProvider name="items" version="0.1.0">
      <AppContent />
    </HostProvider>
  );
}
