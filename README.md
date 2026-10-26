<p align="center">
  <img src="assets/banner.svg" alt="MaxLoop · 带刹车的 AI 自我迭代引擎" width="1280">
</p>

# 🔁 MaxLoop · 带刹车的 AI 自我迭代引擎

![Version](https://img.shields.io/badge/version-4.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Stars](https://img.shields.io/github/stars/huanweide/maxloop-overlord?style=social)
![Last Commit](https://img.shields.io/github/last-commit/huanweide/maxloop-overlord)
![CI](https://github.com/huanweide/maxloop-overlord/actions/workflows/ci.yml/badge.svg)

> **English TL;DR** — MaxLoop is a drop-in skill that makes *any* AI agent's self-iteration actually converge, using **external-verification brakes** (Oracle Gate + discriminating tests + evidence anchors) instead of "the model says it's done". Two modes: **product deep-iteration** and **plan-upgrade**. Works with WorkBuddy / Claude Code / Cursor / Codex / OpenCode. MIT.

> **一句话**：一套「带刹车的迭代收敛」通用引擎——让 AI 自我迭代在**有限轮数**里真正收敛，而不是一轮接一轮**假绿空转**。任何 agent 都能直接加载，不绑定项目、语言或框架。

> v4.0 起，原 `maxloop-overlord`（魔王系统）与 `maxloop-upgrade`（方案升级循环）已**融合为一套思维、两个模式**，本仓库同版本升级。

**自然语言 / AI 迭代 → 自动完成「发现真问题 → 轮次修复 → 外部判据复检 → 真达标才交付」**

[30 秒看懂](#-30-秒看懂) · [它能做什么](#-它能做什么) · [特性](#-特性) · [快速开始](#-快速开始) · [触发词速查](#-触发词速查) · [架构](#-架构) · [相关项目](#-相关项目) · [贡献](#-贡献)

---

## 🔁 30 秒看懂

```
用户：把登录接口修一下，别再报 SQL 注入

普通循环：✅ 已修复（改用参数化查询）          ← 模型自己说"修好了"
         第 2 轮：✅ 已修复                    ← 还是自己说的
         第 3 轮：✅ 已修复                    ← 轮数烧光，问题还在

MaxLoop ：Oracle Gate 复检 → 实跑 PoC → 发现 username 字段仍可注入
         判别测试：baseline 旧版必红 + candidate 必绿 → 旧"修复"未过门禁
         → 不出"已修复"结论，继续修到真过测试才放行
```

差别只有一句话：**放行的判据来自模型之外，不来自模型自己。**

---

## 🔁 它能做什么

两种触发，同一套引擎：

**模式 A · 产品深度迭代（原魔王系统）**

```
User: 对这个仪表盘 HTML 做深度评审迭代，直到通过 acceptance-test.js

Round 1: 深度体验   → 发现 #max-val 写死 120，数据集真实最大 150
Round 1: 根因 R/C/N → R（非改不可）：数值来自硬编码，不是从数据集算出来的
Round 2: 代码执行   → 改为从 dataset 实算最大值；同步修 aria-label
Round 2: Oracle Gate→ 实跑 node acceptance-test.js dashboard-maxloop.html
         → baseline(seed) 必红 / candidate 必绿 → 判别测试通过 → 放行
Round 2: 交付       → 双文档 + 台账 + 证据锚点
```

**模式 B · 方案升级循环（原升级循环）**

```
User: maxloop 升级这份中期汇报 PPT

Round 1: 监督质询   → 模拟用户逐页挑刺，形成候选升级项
Round 2: R/C/N 台账 → 每项判定"必须升级 / 可选项 / 不该加"，抑制乱加功能
Round 3: 三轮校验   → 每条升级结论必须有真实来源锚点，禁止主观自辩
Round 3: 交付       → 升级方案文档 + 校验台账 + 放弃报告
```

---

## 🔁 特性

- **Oracle Gate 外部判据闸门（最高铁律）** —— 声明"已修复"前必须给出五类真实判据：真跑输出 / lint / 入口可达 / 修复前失败证据 / 逐字符证据锚点；缺任一行直接打回。见 `references/oracle-gate.md`。
- **判别测试 Discriminating Test（旧红新绿）** —— 同一个问题必须同时存在「改动前必红」与「改动后必绿」两份输出；只有绿没有红，等于没证明。见 `references/discriminating-test.md`。
- **R/C/N + 5 Whys 根因闸门** —— 每个改动先过必要性关：R 非改不可 / C 可选项 / N 不该加；根因必须落到 `file:line`，辅以占位符替换测试证伪"改到位了没"。见 `references/root-cause-protocol.md`。
- **逃逸阶梯 + stall guard（防空转）** —— 同一项卡住时 R2 换人、R3 换问题、R4 认输并出结构化放弃报告；连续 2 轮全体红点=0 立即停，不空派。见 `references/repeat-failure-breaker.md`。
- **证据制评审 + 符号核销** —— 任何评审/升级结论必须挂真实来源锚点，无证据不收；结论漂移由符号核销防线拦截。见 `references/review-protocol.md`。
- **效率指数（可量化，不靠感觉）** —— 产出级别 ÷ 轮数。首份对照实证（2026-10-25，同提示词/同模型/同缺陷种子）：**效率指数 ×2.0、假绿率 100%→0%**，数据与复现见 `experiments/controlled-study-2026-10-25.md`。
- **零依赖、纯方法论** —— 整个 skill 就是 Markdown + 两个可视化 HTML；不装包、不联网、不绑定模型，任何能读 skill 的 agent 都能用。

---

## 🔁 快速开始

### 安装（把 skill 放进你的 agent 的 skills 目录即生效）

```bash
# WorkBuddy
git clone https://github.com/huanweide/maxloop-overlord.git ~/.workbuddy/skills/maxloop-overlord

# Claude Code
git clone https://github.com/huanweide/maxloop-overlord.git ~/.claude/skills/maxloop-overlord

# Cursor
git clone https://github.com/huanweide/maxloop-overlord.git ~/.cursor/skills/maxloop-overlord

# Codex / OpenCode
git clone https://github.com/huanweide/maxloop-overlord.git ~/.codex/skills/maxloop-overlord
```

放入对应 `skills` 路径即生效，无需额外配置。

### 触发一句话

```text
模式A：对 XX 做一轮深度评审并迭代修复 / 用魔王系统把这个问题收敛掉
模式B：maxloop 升级方案 / 在 PPT 基础上优化 / 三轮校验
```

### 自检（证明这套方法论真的跑过）

```bash
cd experiments
node acceptance-test.js seed-dashboard.html      # 基准：必须红（3/5）
node acceptance-test.js dashboard-maxloop.html   # 产物：必须绿（5/5）
```

真实输出：

```
=========================================
验收对象: dashboard-maxloop.html
数据集真实最大值(trueMax) = 150
-----------------------------------------
  [PASS] C1  柱子数=4, 唯一label数=4, labels=[North, South, East, West]
  [PASS] C2  #max-val="150" 期望="150"
  [PASS] C3  全部柱 aria-label 数值正确
  [PASS] C4  比值=[1.500, 1.500, 1.500, 1.500] 最大偏离=0.00%
  [PASS] C5  无 ERROR
-----------------------------------------
汇总: 5/5 项通过 -> PASS
=========================================
```

> ⚠️ `seed-dashboard.html` 故意保留缺陷，它是**判别测试的 baseline（必须红）**。
> CI 同时断言「seed 必红 + 四个产物必绿」——只绿不红不算证明。

---

## 🔁 触发词速查

| 你说的话 | 模式 | 引擎做什么 |
|---|---|---|
| "对 XX 做深度评审并迭代修复" | A | 七阶段闭环：体验 → 评审 → 根因 → 执行 → Oracle 复检 → 记录 |
| "用魔王系统把这个收敛掉" | A | 同上，显式指定 maxloop 收敛纪律 |
| "有限轮数内把这个模块做扎实" | A | 带轮数预算 + 效率指数报告 |
| "maxloop 升级方案" | B | 模板基准 → 监督质询 → R/C/N 台账 → 三轮校验 |
| "在 PPT 基础上优化" | B | 只合理化升级，不强行加内容 |
| "监督 agent 模拟我反复挑刺" | B | 启用监督 Agent 对抗质询 |

---

## 🔁 架构

七阶段主循环由**四道刹车**串成一条铁链；判据永远来自模型之外，收敛标准是"外部判据全绿"，不是"模型说好了"。

| 原语 Primitive | 含义 |
|---|---|
| **红点 finding** | 带 `file:line` 证据的具体问题，不是"感觉不好" |
| **R/C/N 判定** | R 非改不可 / C 可选项 / N 不该加 —— 必要性与根因闸门 |
| **判别测试** | baseline 必红 + candidate 必绿，证明"确实是这个改动起的效" |
| **Oracle Gate** | 五类外部判据齐全才允许声称通过 |
| **证据锚点** | 结论必须能在真实输出里逐字符对上 |
| **逃逸阶梯** | R2 换人 / R3 换问题 / R4 认输，卡住就强制换打法 |
| **stall guard** | 连续 N 轮无改善立即刹车交给人，杜绝空转 |

```
        ┌──────────── 阶段零 · 外部学习（载模板 / 搜资料）────────────┐
        ↓
  ① 发现真问题 ──→ ② 轮次修复 ──→ ③ 外部判据复检 ──→ ④ 交付真结果
        ↑                                  │
        │        未过 Oracle Gate           │
        └──────────────────────────────────┘
                     ↓ 同一项卡住
            逃逸阶梯 R2 换人 / R3 换问题 / R4 认输
                     ↓ 连续 N 轮零改善
                stall guard 刹车 → 交给人
```

| 模块 Module | 文件 | 说明 |
|---|---|---|
| 主循环状态机 | `SKILL.md` | 七阶段 + 脊柱标签 ①②③④，英文版见 `SKILL.en.md` |
| Oracle Gate | `references/oracle-gate.md` | 外部判据先决（最高铁律） |
| 判别测试 | `references/discriminating-test.md` | baseline-fails / candidate-passes |
| 根因协议 | `references/root-cause-protocol.md` | 5 Whys + 占位符替换测试 |
| 逃逸阶梯 | `references/repeat-failure-breaker.md` | 2-3-4 换打法，防换马甲返工 |
| 方案升级细则 | `references/upgrade-mode.md` | 模式 B 的模板基准 / R/C/N 台账 / 用词纪律 |
| 执行与降级 | `references/code-exec-protocol.md` · `degrade-protocol.md` | 落盘纪律 / 通道故障降级到 Chair 亲验 |
| 记录与度量 | `references/record-keeping.md` · `effectiveness-metrics.md` | 双文档 + 台账 + 效率指数 |
| 场景适配器 | `references/novel-forge-adapter.md` | 把引擎接到具体业务的范例 |
| 验收脚本 | `experiments/acceptance-test.js` | 无浏览器、纯 node 解析的客观验收器 |

---

## 🔁 加一个你自己的适配器

MaxLoop 不绑定任务类型。把"外部判据"换成你 domain 的客观验收脚本，就能直接复用整套刹车：

```js
// my-acceptance.js —— 你的 Oracle（退出码 0=PASS，1=FAIL）
const out = runMyThing('build/out.bin');
if (out.latencyMs > 200) { console.error('FAIL: latency'); process.exit(1); }
if (!out.hasChecksum)    { console.error('FAIL: checksum'); process.exit(1); }
console.log('PASS');
```

然后把它当成 `Oracle Gate` 的第 (a) 条判据（真跑）：

| Oracle Gate 五条 | 你的场景怎么填 |
|---|---|
| a 真跑 | `node my-acceptance.js` 输出 PASS |
| b lint | 你的 linter / 类型检查命令 |
| c 入口可达 | 产物能被真实入口加载 |
| d 修复前失败 | 旧的 baseline 输出（必须 FAIL） |
| e 证据锚点 | 失败行 / 指标值，能逐字符对上 |

改完照抄 `references/novel-forge-adapter.md` 的结构落一个 adapter 文档即可。

---

## 🔁 路线图

- [x] 四道刹车（Oracle Gate / 判别测试 / 根因闸门 / 逃逸阶梯）
- [x] 效率指数 + 控制变量对照实证 `experiments/`
- [x] 英文版完整方法论 `SKILL.en.md`
- [ ] 更多 agent 适配实战记录（Claude Code / Cursor）
- [ ] `experiments/` 持续累积跨任务、跨模型的对照数据
- [ ] 贡献指南（欢迎提交你的实证结果）

欢迎在 `experiments/` 提交你的对照实验 —— **任何"提升 X 倍"的结论，必须能在 `experiments/` 里找到对应的判别测试输出与逐字符证据锚点。**

---

## 🔁 相关项目

同一套范式（**外部判据刹车 · 杜绝假绿空转 · 四道刹车**）在不同载体的落地，互相导流：

| 项目 | 载体 | 一句话 |
|---|---|---|
| [`maxloop-overlord`](https://github.com/huanweide/maxloop-overlord) | Agent Skill（本仓库） | 范式本体：带刹车的产品迭代 / 方案升级双模式 |
| [`codehealth-loop`](https://github.com/huanweide/codehealth-loop) | Python 引擎 | 范式的工程健康具象化：12 轴体检 + 四道刹车 + 沙箱验证修复 |
| [`veriloop`](https://github.com/huanweide/veriloop) | Python CLI | 范式的代码审计具象化：12 个可插拔分析轴 + 4 道验证刹车 |
| [`overlord-loop`](https://github.com/huanweide/overlord-loop) | 引擎实现 | 魔王系统：让 AI 自我迭代、多层自检、带刹车的代码进化引擎 |
| [`doctors`](https://github.com/huanweide/doctors) | Node CLI 全家桶 | 提供 8 个零依赖体检轴，被 `codehealth-loop` 的感知层移植复用 |
| [`family-showcase`](https://github.com/huanweide/family-showcase) | 单页 HTML | 工程健康家族 18 轴全景仪表盘 |

---

## 🔁 贡献

- 提交 Issue 讲清「你遇到的假绿场景」，附上模型/提示词/轮数，比抽象建议有用得多。
- 提交 PR 请附判别测试：你的改动必须同时有「改动前必红」与「改动后必绿」两份真实输出。
- 在 `experiments/` 追加你自己的对照实验目录，注明模型与提示词原文。

## 🔁 安全边界

> ⚠️ MaxLoop 是一套**方法论 skill**，不是执行器：
> - 它不自动改你的代码、不自动发网络请求、不读取任何密钥。
> - 它要求"落地由人 / 上层 agent 执行"，判据与执行解耦。
> - 它管"迭代是否真收敛"，不替你写业务需求；单次小修、纯问答不需要开 MaxLoop。

## 🔁 License

[MIT](LICENSE) © 2026 huanweide

---

<div align="center">
  <b>如果 MaxLoop 让你少烧了几轮无效迭代，点个 ⭐ Star 让更多人看到。</b><br/>
  <a href="https://github.com/huanweide/maxloop-overlord">huanweide/maxloop-overlord</a>
</div>
