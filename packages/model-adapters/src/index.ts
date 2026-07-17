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

export class ModelAdapterRegistry {
  private readonly adapters = new Map<string, ModelAdapter>();
  register(adapter: ModelAdapter): void {
    if (this.adapters.has(adapter.provider)) throw new Error(`Model adapter already registered: ${adapter.provider}`);
    this.adapters.set(adapter.provider, adapter);
  }
  resolve(provider: string): ModelAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`Model adapter not found: ${provider}`);
    return adapter;
  }
}

export class MockModelAdapter implements ModelAdapter {
  readonly provider = 'mock';
  constructor(private readonly responder: (request: ModelRequest) => ModelResponse | Promise<ModelResponse>) {}
  complete(request: ModelRequest): Promise<ModelResponse> {
    if (request.signal?.aborted) return Promise.reject(new Error('Model request aborted'));
    return Promise.resolve(this.responder(request));
  }
}

export function assertValidModelResponse(response: ModelResponse): ModelResponse {
  if (!Number.isInteger(response.usage.promptTokens) || response.usage.promptTokens < 0) throw new Error('Invalid prompt token count');
  if (!Number.isInteger(response.usage.completionTokens) || response.usage.completionTokens < 0) throw new Error('Invalid completion token count');
  if (!Number.isFinite(response.usage.estimatedCostUsd) || response.usage.estimatedCostUsd < 0) throw new Error('Invalid model cost');
  const ids = new Set<string>();
  for (const call of response.toolCalls) {
    if (!call.id || !call.name) throw new Error('Tool calls require id and name');
    if (ids.has(call.id)) throw new Error(`Duplicate tool call id: ${call.id}`);
    ids.add(call.id);
  }
  return response;
}
