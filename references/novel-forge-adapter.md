# novel-forge 适配层（MaxLoop 魔王系统）

> 默认产品示例。作用于其他产品时，由用户提供等价四项命令（构建/测试/升版/推送）替换本节。

## 一、技术栈与入口
- Next.js 16 + React 19 + Tailwind v4 + Prisma 7 + PostgreSQL 17；dev 端口 3001。
- 仓库 `huanweide/novel-forge`（工作副本 git main）。本地运行工具（类比 SillyTavern）非 SaaS。
- LLM 配置存 DB `AppSettings`（`getSettings()` 读取），非 `.env` 的 `LLM_API_KEY`。

## 二、质量门禁命令（Chair 亲验，阶段四）
- 类型检查（零错误）：`SAFE_DELETE_DISABLE=1 npx tsc --noEmit`
- 测试（全绿）：`npm test`（vitest run，当前 203 用例）
- 构建：`npm run build`（沙箱可能被 safe-delete 钩子拦截删除 `.next/trace`，以 tsc+测试为准并诚实标注，CI 上保留硬门禁）

## 三、双 changelog 升版（每次改动必做）
1. 根 `CHANGELOG.md` 顶部插 `## vX.Y.Z — YYYY-MM-DD` + 功能分类列表。
2. `src/lib/changelog-data.ts`：改 `LATEST_VERSION`→新号；`CHANGELOG_BRIEF`→4 条摘要；`VERSIONS` 数组头条插 `{version,date,title,sections:[...]}`（**保留旧条目完整 `{ version/date/title/sections: [` 头，防 TS1128/TS1005**）。
3. 两文件同 `git commit`。
> 铁律：changelog-data.ts 字符串内**严禁英文引号 "**（TS1005 断串），中文强调用「」；HTTP header 严禁中文（ByteString 500）。

## 四、代理推送
```bash
git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 push origin main
```
GitHub 出口走此代理；如遇 TLS connect error 待网络恢复重推（commit 先本地就绪）。

## 五、真机验证脚本（阶段一体验 / 阶段四验证，走真实 HTTP API + 真实 LLM）
- `scripts/agent-release-journey.cjs`：用户旅程 9/9 真机（建项目→写章→AI 生成→确认→整本交付→软删清理）。
- `scripts/audit-api-refs.cjs`：API 断链巡检（提取路由 + 前端 `/api/` 引用交叉核对，0 断链）。
- `scripts/agent-batch-guard-verify.cjs` / `agent-round2-guard-verify.cjs` / `agent-idempotency-verify.cjs`：确认护栏 / 幂等验证。
- `scripts/agent-auto-confirm-verify.cjs` / `agent-smart-deliver-verify.cjs` / `agent-game-light-confirm-verify.cjs`：自动确认 / 智能交付 / 游戏轻确认验证。

## 六、沙箱铁律（避坑）
- DB：`.env` 的 `DATABASE_URL` 用 `127.0.0.1:5432`（勿 `localhost`→IPv6 解析致 503）。Windows PG17 服务版自启。
- Prisma 7 新增模型/字段后须 `npx prisma db push` + `PRISMA_DISABLE_SAFE_DELETE=1 npx prisma generate`（否则 TS 看不到新字段）。
- 改 schema 后旧 dev 进程 stale client 致 503「数据库访问出错」时，重启 `npm run dev`（脚本自带 `-p 3001`；**勿写 `npm run dev -p 3001`** 会把 3001 当目录参数）。
- `.env` 勿加 `NODE_OPTIONS="--import ./proxy-setup.mjs"`（令 npm 自身崩溃）。
- 沙箱无 Chromium：浏览器交互穷举降级为「API 真实调用 + SSR HTML 抓取 + 源码阅读」；悬浮态/首用教程类细节需本地 `npm run dev` 目测。
- LLM key 来自 DB AppSettings；`.env` 留空也能真实生成（不要把「.env 无 key」误判为「LLM 不可用」）。
