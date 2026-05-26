# Tasks — Wayfair AI Design Agent

> **总时间**：2 小时（17:45–19:45）
> **执行原则**：每个任务有明确验收标准；卡 5 分钟没解决就找 mentor 或砍掉

---

## 时间线总览

```
17:45 ─┬─ 17:55  (10min) Phase 0: 现场就位 + 拿 API key
       │
       ├─ 18:00  (15min) Phase 1: Setup + 任务分工锁定
       │
       ├─ 19:00  (60min) Phase 2: 主开发（MVP + Stretch 1）
       │
       ├─ 19:25  (25min) Phase 3: 集成 + 测试 + Cloudflare
       │
       └─ 19:45  (20min) Phase 4: Demo + 录视频 + 提交
```

---

## 现场前必做（出发前）

### Task 0.1 — 环境预热（你，30 分钟）
- [ ] 在家 `npx create-next-app@latest test-app --typescript --tailwind --app --src-dir` 跑一次
- [ ] `cd test-app && npx shadcn@latest init -d` 跑一次
- [ ] `npx shadcn@latest add button input card scroll-area badge` 装好基础组件
- [ ] `npm install subconscious zod` 装好
- [ ] 把 `wayfair-agent-starter/` 里的 4 个核心文件复制到桌面
- [ ] `npm run dev` 能起来（用 dummy API key 看到首页就行）

**验收**：浏览器打开 localhost:3000 看到首页

### Task 0.2 — 文档对齐（你 + 搭档，10 分钟）
- [ ] 把 architecture.md、tasks.md 发给搭档
- [ ] 微信/电话过一遍 Phase 1 的分工
- [ ] 提前在 Cloudflare 注册账号（搭档负责）

---

## Phase 0: 17:45–17:55（10 分钟）

### Task 0.3 — 拿 API key
**负责人**：搭档
- [ ] 去 Subconscious booth 拿 `SUBCONSCIOUS_API_KEY`
- [ ] 顺便问 Cloudflare booth 有没有现场专用免费额度
- [ ] 把 key 截图/记在记事本

**验收**：手上有可用的 Subconscious key

### Task 0.4 — 项目初始化
**负责人**：你
- [ ] 把家里跑过的项目 clone 到这台机器（或者重新 create-next-app）
- [ ] `.env.local` 填好 `SUBCONSCIOUS_API_KEY`
- [ ] `npm run dev` 起来

**验收**：localhost:3000 能访问

---

## Phase 1: 17:55–18:00（5 分钟，决策锁定）

### Task 1.1 — 站会同步
**双方一起，限时 3 分钟**：
- [ ] 确认题材：Wayfair 装修 Agent（不变）
- [ ] 确认分工（见下方）
- [ ] 确认 19:00 / 19:20 两个 checkpoint

**分工分配**：

| 你（Backend + Infra） | 搭档（Frontend + Demo） |
|----------------------|------------------------|
| `/api/agent` route | Page 1 输入 + 卡片网格 |
| Subconscious 集成 | Page 2 reasoning 展示 |
| `/api/runs/[id]` | shadcn 组件 styling |
| Cloudflare 部署 | Demo 脚本 + 录视频 |
| Prompt 调优 | Example 输入测试 |

---

## Phase 2: 18:00–19:00（60 分钟，核心开发）

### 你的任务串

#### Task 2.1 — `/api/agent` route（20 分钟）
**依赖**：Task 0.4
- [ ] 创建 `src/app/api/agent/route.ts`
- [ ] 实现 POST handler，调用 Subconscious
- [ ] Prompt 里明确要求返回 JSON 格式（products + summary + total）
- [ ] 加 try/catch JSON.parse，失败时 fallback 到 raw 展示
- [ ] 生成 runId（用 `crypto.randomUUID()`）
- [ ] 把 run 结果存到内存 Map（`src/lib/store.ts`）

**验收**：用 curl 或 Postman 调用，能收到结构化 JSON 返回

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"userRequest":"Studio apartment, scandinavian, $800"}'
```

#### Task 2.2 — `/api/runs/[id]` route（5 分钟）
**依赖**：Task 2.1
- [ ] 创建 `src/app/api/runs/[id]/route.ts`
- [ ] GET handler，从内存 Map 取 run 返回
- [ ] 包含 `reasoning` 字段（Subconscious 的 `result.reasoning`）

**验收**：能查到上一次 run 的完整数据

#### Task 2.3 — Prompt 调优（15 分钟）
**依赖**：Task 2.1
- [ ] 用 3 个 example 输入测试
- [ ] 调整 instructions，确保：
  - 总是返回严格 JSON（不带 markdown 代码块）
  - 产品数量稳定在 3-5 个
  - 每个产品有 image_url 和 product_url
  - 总价不超预算
- [ ] 把最终 prompt 存到 `src/lib/prompts.ts`

**验收**：3 个 example 输入都能稳定返回合理结果

#### Task 2.4 — Cloudflare 部署准备（10 分钟，可推迟）
**依赖**：Task 2.1（基本完成）
- [ ] 装 wrangler：`npm install -D wrangler`
- [ ] 创建 `wrangler.toml`
- [ ] 装 `@cloudflare/next-on-pages`
- [ ] 本地 `npx wrangler pages dev` 跑一次
- [ ] **暂不真正 deploy**，留到 Phase 3

**验收**：本地 wrangler 能跑起来项目

#### Task 2.5 — Buffer / 帮搭档（10 分钟）
- 如果搭档卡住就过去帮忙
- 如果都搞定了就微调 prompt 或者搞 Cloudflare

---

### 搭档的任务串

#### Task 2.6 — Page 1 输入 + 卡片网格（30 分钟）
**依赖**：Task 0.4
- [ ] `src/app/page.tsx`：主页面 layout
- [ ] `src/components/ChatInput.tsx`：输入框 + 3 个 example badge
- [ ] `src/components/ProductGrid.tsx`：4-up 卡片网格
- [ ] Loading 状态（spinner + "Agent thinking..."）
- [ ] Error 状态展示
- [ ] 提交后调 `/api/agent`，拿到 runId 后展示结果

**验收**：能输入一段文字，看到产品卡片排列

#### Task 2.7 — Page 2 推理展示（25 分钟）
**依赖**：Task 2.6 跑通 + Task 2.2 完成
- [ ] `src/app/reasoning/[runId]/page.tsx`
- [ ] `src/components/ReasoningTimeline.tsx`：垂直时间线
- [ ] 每个步骤显示：序号、类型图标（思考/调工具/观察）、内容
- [ ] 顶部有"返回主页"按钮

**验收**：从主页点"查看推理"能跳转到这页，展示结构化步骤

#### Task 2.8 — Demo 脚本草稿（5 分钟）
- [ ] 写好 30 秒开场白
- [ ] 选好 3 个 demo 输入
- [ ] 决定哪个作为主 demo

---

## Phase 3: 19:00–19:25（25 分钟，集成+测试+部署）

### 🚨 19:00 关键 checkpoint

**双方同步 3 分钟，回答这个问题：**
> "Page 1 跑通了吗？输入 → 结果 卡片能看到吗？"

- **能**：继续 Stretch 1（Page 2）
- **不能**：**所有人放弃 Page 2，专心修主流程**

### Task 3.1 — 联调（10 分钟）
**双方一起**
- [ ] 跑 3 个 demo 输入，确认稳定
- [ ] 记录哪些输入有问题，**绕开它们**
- [ ] 检查产品图片有没有死链，加 onError fallback

### Task 3.2 — Cloudflare 部署尝试（10 分钟）
**负责人**：你
- [ ] `npx @cloudflare/next-on-pages`
- [ ] `wrangler pages deploy .vercel/output/static`
- [ ] 拿到 *.pages.dev URL
- [ ] 在新 URL 测试一次 happy path

**🚨 19:20 关键 checkpoint：部署成功了吗？**
- **成功**：用 Cloudflare URL 做 demo
- **失败**：回 localhost demo，**不要再硬刚**

### Task 3.3 — 锁定 happy path（5 分钟）
**双方一起**
- [ ] 选定**唯一**一个 demo 输入（最稳的那个）
- [ ] 测试 2 次，确认每次都成功
- [ ] **19:25 起不允许改任何代码**

---

## Phase 4: 19:25–19:45（20 分钟，Demo + 提交）

### Task 4.1 — 录视频（10 分钟）
**负责人**：搭档
- [ ] QuickTime 全屏录浏览器
- [ ] **无声录制**（紧张声音会扣分）
- [ ] 录一次完整 happy path：输入 → 等结果 → 滚动产品 → 跳转 reasoning 页 → 滚动步骤
- [ ] 视频长度 30-60 秒
- [ ] 如果有时间，加字幕（用 CapCut 或 Descript 快速生成）

### Task 4.2 — Demo 脚本最终版（5 分钟）
**负责人**：你
- [ ] 把开场、live demo、收尾三段写在便签上
- [ ] 念 2 遍计时，控制在 2 分钟内

### Task 4.3 — 提交（5 分钟）
**双方一起**
- [ ] 在 hackathon 平台上传视频
- [ ] 填项目说明
- [ ] 提交 GitHub repo 链接
- [ ] **19:45 之前提交完毕**

---

## 应急预案

### 🆘 如果 18:30 还没跑通 `/api/agent`
- 立刻找 Subconscious mentor
- 让搭档先用 mock 数据继续开发前端
- 你专注修 backend

### 🆘 如果 Subconscious API 完全挂了
- 切换到 Anthropic SDK 直接调（你有 ANTHROPIC_API_KEY）
- 但**不要现场写 web scraping**，直接 mock 假数据
- 故事可以改成"展示 agent 决策框架"

### 🆘 如果两人都卡住
- 一人继续修代码，一人开始录"概念演示视频"
- 用 Figma / 截图拼接展示"如果跑通会是这样"

### 🆘 19:30 之后才发现重大 bug
- **不要修**，直接放预先录好的 backup 视频
- 现场说："Let me show you the recorded run from earlier"

---

## 验收标准总结

每完成一个任务，必须能回答"yes"：

| 任务 | 验收问题 |
|------|---------|
| 2.1 | curl 能拿到 JSON 返回？ |
| 2.2 | 能查到历史 run？ |
| 2.3 | 3 个 example 都稳定？ |
| 2.6 | 输入后能看到卡片？ |
| 2.7 | reasoning 页有时间线？ |
| 3.1 | 3 个输入都跑通？ |
| 3.2 | Cloudflare URL 能访问？ |
| 4.1 | 视频录好上传了？ |
| 4.3 | 19:45 前提交了？ |