import { useEffect, useRef, useState } from "react";
import { useHost, useToolResult } from "open-mcp-app/react";
import "./styles.css";

const DEFAULT_PROMPT = "Write a short status update about MCP sampling.";

type SamplingResult = {
  model?: string;
  stopReason?: string;
  content?: unknown;
};

type WidgetModelContent = {
  prompt?: string;
  result?: string;
  model?: string;
  stopReason?: string;
};

type WidgetPrivateContent = {
  systemPrompt?: string;
  maxTokens?: string;
  includeContext?: string;
  temperature?: string;
};

export default function App() {
  const { isReady, callTool, exp_widgetState, onToolResult } = useHost({
    name: "sampling-tester",
    version: "0.1.0",
  });

  const [widgetState, setWidgetState] = exp_widgetState();

  const [runSample, sampleState] = callTool<SamplingResult>("sampling_test");
  const toolResult = useToolResult<SamplingResult>();
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [maxTokens, setMaxTokens] = useState("256");
  const [includeContext, setIncludeContext] = useState("none");
  const [temperature, setTemperature] = useState("");
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    const modelContent = widgetState?.modelContent as WidgetModelContent | undefined;
    const privateContent = widgetState?.privateContent as WidgetPrivateContent | undefined;
    if (modelContent?.prompt) setPrompt(modelContent.prompt);
    if (privateContent?.systemPrompt) setSystemPrompt(privateContent.systemPrompt);
    if (privateContent?.maxTokens) setMaxTokens(privateContent.maxTokens);
    if (privateContent?.includeContext) setIncludeContext(privateContent.includeContext);
    if (privateContent?.temperature) setTemperature(privateContent.temperature);
    initializedRef.current = true;
  }, [widgetState]);

  useEffect(() => {
    if (!sampleState.result) return;
    setWidgetState({
      modelContent: {
        prompt,
        result: sampleState.text || undefined,
        model: sampleState.data?.model,
        stopReason: sampleState.data?.stopReason,
      },
      privateContent: {
        systemPrompt: systemPrompt || undefined,
        maxTokens,
        includeContext,
        temperature,
      },
    });
  }, [sampleState.result, sampleState.text, sampleState.data, prompt, systemPrompt, maxTokens, includeContext, temperature, setWidgetState]);

  useEffect(() => {
    if (!isReady) return;
    const unsubscribe = onToolResult(toolResult.onToolResult);
    return () => {
      unsubscribe?.();
    };
  }, [isReady, onToolResult, toolResult.onToolResult]);

  useEffect(() => {
    if (!toolResult.text && !toolResult.data) return;
    setWidgetState({
      modelContent: {
        prompt,
        result: toolResult.text || undefined,
        model: toolResult.data?.model,
        stopReason: toolResult.data?.stopReason,
      },
      privateContent: {
        systemPrompt: systemPrompt || undefined,
        maxTokens,
        includeContext,
        temperature,
      },
    });
  }, [toolResult.text, toolResult.data, prompt, systemPrompt, maxTokens, includeContext, temperature, setWidgetState]);

  const handleRun = async () => {
    const max = Number.parseInt(maxTokens, 10);
    await runSample({
      prompt,
      systemPrompt: systemPrompt.trim().length ? systemPrompt : undefined,
      maxTokens: Number.isFinite(max) ? max : 256,
      includeContext: includeContext !== "none" ? includeContext : "none",
      temperature: temperature.trim().length ? Number.parseFloat(temperature) : undefined,
    });
  };

  const statusLabel = sampleState.status === "loading" ? "Running" : sampleState.status === "error" ? "Error" : "Ready";
  const displayText = sampleState.text ?? toolResult.text ?? "No response yet.";
  const displayData = sampleState.data ?? toolResult.data;
  const displayError = sampleState.error || (toolResult.isError ? "Error" : null);

  return (
    <div className="app">
      <div className="header">
        <div>
          <div className="eyebrow">MCP Sampling</div>
          <h1>Sampling Tester</h1>
          <p>Trigger a host-side sample and inspect the response before it returns to the server.</p>
        </div>
        <div className={`status status-${sampleState.status}`}>{statusLabel}</div>
      </div>

      <div className="panel">
        <label>
          Prompt
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={DEFAULT_PROMPT}
          />
        </label>

        <div className="row">
          <label>
            System Prompt
            <input
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              placeholder="Optional system prompt"
            />
          </label>
          <label>
            Max Tokens
            <input
              value={maxTokens}
              onChange={(event) => setMaxTokens(event.target.value)}
              inputMode="numeric"
            />
          </label>
        </div>

        <div className="row">
          <label>
            Include Context
            <select
              value={includeContext}
              onChange={(event) => setIncludeContext(event.target.value)}
            >
              <option value="none">None</option>
              <option value="thisServer">This Server</option>
              <option value="allServers">All Servers</option>
            </select>
          </label>
          <label>
            Temperature
            <input
              value={temperature}
              onChange={(event) => setTemperature(event.target.value)}
              placeholder="0.0 - 1.0"
              inputMode="decimal"
            />
          </label>
        </div>

        <button className="primary" onClick={handleRun} disabled={!isReady || sampleState.status === "loading"}>
          Run Sampling
        </button>
      </div>

      <div className="panel output">
        <div className="output-header">
          <div>
            <div className="eyebrow">Latest Output</div>
            <h2>{displayData?.model || "Model pending"}</h2>
          </div>
          <div className="meta">{displayData?.stopReason || "-"}</div>
        </div>
        {displayError && <div className="error">{String(displayError)}</div>}
        <pre>{displayText}</pre>
      </div>
    </div>
  );
}
