export interface ModelMessage { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; }
export interface NormalizedToolCall { id: string; name: string; arguments: unknown; }
export interface ModelUsage { promptTokens: number; completionTokens: number; estimatedCostUsd: number; }
export interface ModelRequest {
  model: string;
  messages: readonly ModelMessage[];
  tools?: readonly { name: string; description: string; inputSchema: Record<string, unknown> }[];
  temperature?: number;
  signal?: AbortSignal;
}
export interface ModelResponse {
  text: string;
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter' | 'error';
  toolCalls: readonly NormalizedToolCall[];
  usage: ModelUsage;
  providerRequestId?: string;
}
export interface ModelAdapter { readonly provider: string; complete(request: ModelRequest): Promise<ModelResponse>; }

export function assertValidModelRequest(request: ModelRequest): ModelRequest {
  if (!request.model.trim()) throw new Error('Model name is required');
  if (request.messages.length === 0) throw new Error('At least one model message is required');
  if (request.messages.some((message) => !message.content.trim())) throw new Error('Model messages require non-empty content');
  if (request.temperature !== undefined && (!Number.isFinite(request.temperature) || request.temperature < 0 || request.temperature > 2)) {
    throw new Error('Temperature must be between 0 and 2');
  }
  const toolNames = new Set<string>();
  for (const tool of request.tools ?? []) {
    if (!tool.name.trim()) throw new Error('Tool name is required');
    if (toolNames.has(tool.name)) throw new Error(`Duplicate tool definition: ${tool.name}`);
    toolNames.add(tool.name);
  }
  return request;
}

export class ModelAdapterRegistry {
  private readonly adapters = new Map<string, ModelAdapter>();
  register(adapter: ModelAdapter): void {
    const provider = adapter.provider.trim();
    if (!provider) throw new Error('Model adapter provider is required');
    if (this.adapters.has(provider)) throw new Error(`Model adapter already registered: ${provider}`);
    this.adapters.set(provider, adapter);
  }
  resolve(provider: string): ModelAdapter {
    const adapter = this.adapters.get(provider.trim());
    if (!adapter) throw new Error(`Model adapter not found: ${provider}`);
    return adapter;
  }
}

export class MockModelAdapter implements ModelAdapter {
  readonly provider = 'mock';
  constructor(private readonly responder: (request: ModelRequest) => ModelResponse | Promise<ModelResponse>) {}
  async complete(request: ModelRequest): Promise<ModelResponse> {
    assertValidModelRequest(request);
    if (request.signal?.aborted) throw new Error('Model request aborted');
    return assertValidModelResponse(await this.responder(request));
  }
}

export function assertValidModelResponse(response: ModelResponse): ModelResponse {
  if (!Number.isInteger(response.usage.promptTokens) || response.usage.promptTokens < 0) throw new Error('Invalid prompt token count');
  if (!Number.isInteger(response.usage.completionTokens) || response.usage.completionTokens < 0) throw new Error('Invalid completion token count');
  if (!Number.isFinite(response.usage.estimatedCostUsd) || response.usage.estimatedCostUsd < 0) throw new Error('Invalid model cost');
  if (response.finishReason === 'tool_calls' && response.toolCalls.length === 0) throw new Error('tool_calls finish reason requires at least one tool call');
  if (response.finishReason !== 'tool_calls' && response.toolCalls.length > 0) throw new Error('Tool calls require tool_calls finish reason');
  const ids = new Set<string>();
  for (const call of response.toolCalls) {
    if (!call.id.trim() || !call.name.trim()) throw new Error('Tool calls require id and name');
    if (ids.has(call.id)) throw new Error(`Duplicate tool call id: ${call.id}`);
    ids.add(call.id);
  }
  return response;
}
