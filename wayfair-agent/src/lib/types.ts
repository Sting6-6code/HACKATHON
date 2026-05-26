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

export type RoomProfile = {
  room_type: string;
  dimensions: {
    label: string;
    width_ft?: number;
    length_ft?: number;
    source: 'user' | 'assumed';
  };
  style: string[];
  budget?: number;
  needs: string[];
  constraints: string[];
};

export type LayoutItem = {
  id: string;
  label: string;
  category: string;
  price?: string;
  left: string;
  top: string;
  width: string;
  height: string;
};

export type AgentSource = 'mock' | 'fallback' | 'live';

export type AgentAnswer = {
  products: Product[];
  summary: string;
  total_estimated: string;
};

export type RunRecord = {
  runId: string;
  userRequest: string;
  roomProfile: RoomProfile;
  products: Product[];
  reasoning: ReasoningNode[];
  summary: string;
  total_estimated: string;
  layout: LayoutItem[];
  source?: AgentSource;
  createdAt: string;
};

export type AgentSuccessResponse = {
  runId: string;
  roomProfile: RoomProfile;
  products: Product[];
  summary: string;
  total_estimated: string;
  reasoning: ReasoningNode[];
  layout: LayoutItem[];
  source?: AgentSource;
};

export type AgentErrorResponse = {
  error: string;
};
