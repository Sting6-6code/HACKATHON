export type Product = {
  name: string;
  price: string;
  why_it_fits: string;
  image_url?: string;
  product_url?: string;
};

export type ReasoningNode = {
  step: number;
  type: 'thought' | 'tool_call' | 'observation';
  content: string;
  tool?: string;
  duration_ms?: number;
};

export type AgentAnswer = {
  products: Product[];
  summary: string;
  total_estimated: string;
};

export type RunRecord = {
  runId: string;
  products: Product[];
  reasoning: ReasoningNode[];
  summary: string;
  total_estimated: string;
  createdAt: string;
};

export type AgentSuccessResponse = {
  runId: string;
  products: Product[];
  summary: string;
  total_estimated: string;
};

export type AgentErrorResponse = {
  error: string;
};
