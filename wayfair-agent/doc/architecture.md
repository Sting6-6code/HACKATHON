# Architecture — Wayfair AI Design Agent

> **目标（一句话）**：用户用自然语言描述空间需求 → Subconscious agent 在 Wayfair 上搜索 → 输出搭配方案 + 推理过程

---

## 1. 系统架构图

```
┌───────────────────────────────────────────────────────────────┐
│                       Next.js App                              │
│                                                                │
│  ┌──────────────────────┐         ┌────────────────────────┐  │
│  │  /  (Page 1)         │         │  /reasoning/[runId]    │  │
│  │  - 输入框            │  ──────▶│  - Agent 思考步骤      │  │
│  │  - Example prompts   │  跳转   │  - Tool calls          │  │
│  │  - 产品卡片网格      │         │  - 时间线视图          │  │
│  └──────────┬───────────┘         └────────────────────────┘  │
│             │                                                  │
│             │ POST                                             │
│             ▼                                                  │
│  ┌──────────────────────┐                                     │
│  │  /api/agent          │  Next.js Route Handler               │
│  │  POST → run agent    │  Returns: products + reasoning + id │
│  └──────────┬───────────┘                                     │
└─────────────┼─────────────────────────────────────────────────┘
              │
              ▼
   ┌──────────────────────┐
   │  Subconscious SDK    │
   │  engine: tim-gpt     │
   │  tool: fast_search   │  ← Subconscious 内置 web 搜索
   └──────────┬───────────┘
              │
              ▼
        wayfair.com
```

**部署目标**：Cloudflare Pages（如果时间允许）

---

## 2. 数据流（一条 happy path）

```
1. 用户在 / 页输入："Studio apartment, Scandinavian style, $800 budget"
                                ▼
2. ChatUI 组件 POST 到 /api/agent
   Body: { userRequest: "..." }
                                ▼
3. /api/agent 调用 Subconscious:
   - engine: "tim-gpt"
   - instructions: [完整的 system prompt + 用户请求]
   - tools: [{ type: "platform", id: "fast_search" }]
   - options: { awaitCompletion: true }
                                ▼
4. Subconscious 自己跑 multi-hop:
   - 解析用户意图
   - 调用 fast_search 多次（搜床、搜桌、搜椅）
   - 综合分析价格、风格、搭配
                                ▼
5. 返回 result:
   - result.answer  → JSON 格式的产品列表
   - result.reasoning → 结构化推理树（Page 2 用）
                                ▼
6. /api/agent 解析 + 存到内存 store（按 runId 索引）
   返回给前端: { runId, products, summary, total }
                                ▼
7. Page 1 渲染产品卡片
   "查看 AI 推理过程" 按钮 → 跳转到 /reasoning/[runId]
                                ▼
8. Page 2 GET /api/runs/[id]
   渲染推理步骤的时间线
```

---

## 3. 文件结构

```
wayfair-agent/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # 全局 layout
│   │   ├── page.tsx                   # Page 1: 主输入页
│   │   ├── reasoning/
│   │   │   └── [runId]/
│   │   │       └── page.tsx           # Page 2: 推理展示
│   │   ├── api/
│   │   │   ├── agent/
│   │   │   │   └── route.ts           # POST: 跑 agent
│   │   │   └── runs/
│   │   │       └── [id]/
│   │   │           └── route.ts       # GET: 获取历史 run
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ChatInput.tsx              # Page 1 输入区
│   │   ├── ProductGrid.tsx            # Page 1 结果展示
│   │   ├── ReasoningTimeline.tsx      # Page 2 推理时间线
│   │   └── ui/                        # shadcn 组件
│   │
│   └── lib/
│       ├── subconscious.ts            # Subconscious client 封装
│       ├── store.ts                   # 内存 store（按 runId 存 run）
│       └── types.ts                   # TypeScript types
│
├── .env.local                         # SUBCONSCIOUS_API_KEY
├── next.config.js
└── package.json
```

---

## 4. API 接口定义

### `POST /api/agent`

**Request:**
```typescript
{
  userRequest: string  // 用户自然语言输入
}
```

**Response (success):**
```typescript
{
  runId: string,           // 用来跳转到 Page 2
  products: Product[],     // 推荐的产品列表
  summary: string,         // 整体设计说明
  total_estimated: string  // "$745"
}
```

**Response (error):**
```typescript
{
  error: string
}
```

### `GET /api/runs/[id]`

**Response:**
```typescript
{
  runId: string,
  userRequest: string,
  products: Product[],
  reasoning: ReasoningNode[],   // Subconscious 返回的推理树
  summary: string,
  total_estimated: string,
  createdAt: string
}
```

### 共享类型

```typescript
type Product = {
  name: string;
  price: string;          // "$129"
  why_it_fits: string;    // AI 给出的推荐理由
  image_url?: string;
  product_url?: string;
};

type ReasoningNode = {
  step: number;
  type: 'thought' | 'tool_call' | 'observation';
  content: string;
  tool?: string;
  duration_ms?: number;
};
```

---

## 5. 关键技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| Agent 框架 | Subconscious SDK (Node) | 赞助商主推 + 不需要自己写 tool loop |
| Web 浏览 | Subconscious 内置 fast_search | 比 Browser Use 简单 10 倍，避免 Python/Node 混栈 |
| 前端框架 | Next.js 15 App Router | 全栈一体化，部署简单 |
| UI 库 | shadcn/ui + Tailwind | 现成漂亮组件，零自定义 CSS |
| 状态管理 | 无（URL + 内存 Map） | 2 小时不引入 Redux/Zustand |
| 部署 | Cloudflare Pages | 加分项，Next.js 兼容 |
| 数据持久化 | 内存 Map（重启丢失） | 够 demo 用，不引入数据库 |

---

## 6. Cut Points（关键！）

按时间检查点决定砍什么：

### 🟢 MVP（必须完成，19:00 前）
- Page 1 完整：输入框 + Example badge + 产品卡片网格
- `/api/agent` 跑通：能调 Subconscious 返回结构化产品
- localhost 能 demo 一个完整 happy path
- **如果 19:00 这些没完成 → 项目失败，专心修主流程**

### 🟡 Stretch 1: Page 2 推理展示
- 19:00 检查点：MVP 完成了吗？
  - 是 → 继续做 Page 2
  - 否 → 跳过，从主页直接展示 reasoning JSON（不做单独页面）

### 🟡 Stretch 2: Cloudflare 部署
- 19:20 检查点：还有时间吗？
  - 是 → `wrangler deploy` 尝试
  - 卡住 5 分钟没好 → 回 localhost demo（不要硬刚）
  - **Demo 用本地版本完全 OK**，可以口头说"部署目标是 Cloudflare"

### 🔴 Demo 救命兜底
- 19:30 必须有截图 / 屏幕录制存档
- 现场跑失败 → 直接放录像
- 主办方不会扣分

---

## 7. 风险点 + 应对

| 风险 | 概率 | 应对 |
|------|------|------|
| Subconscious 返回不是 JSON | 中 | `route.ts` 里 try/catch JSON.parse，失败就 raw 展示 |
| fast_search 找不到 Wayfair 产品 | 中 | prompt 里明确要求 "wayfair.com" 关键词 |
| Subconscious API 完全挂掉 | 低 | 备用：Anthropic SDK 直接调，但不要现场切换 |
| Cloudflare 部署失败 | 高 | 回 localhost demo |
| 产品 image_url 是死链 | 中 | `<img onError>` fallback 到 placeholder |

---

## 8. 演示故事（决定 25% 评分）

**核心 narrative**：
> "国际学生第一次来美国布置房间——几十万件商品，自己搭配太难。
>  我们做了一个 AI 装修顾问。你描述空间和风格，Agent 自动浏览 Wayfair、选品、搭配、给方案。
>  而且——你能看到 Agent 是怎么思考的（点 reasoning 页面），这是 Subconscious 的 TIM 模型独有的能力。"

**Showmanship 加分**：
- Page 2 推理展示 = 让评委看到"agent 真的在思考"
- Cloudflare 部署 = "可以全球 edge 部署"
- 真实 Wayfair 链接 = 评委可以点开验证不是假的