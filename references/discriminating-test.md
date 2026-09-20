# Discriminating Test · 判别性测试（先失败后通过）

> 本文件回答 Oracle Gate 的 **d 判据**（修复前失败输出）：一个在旧代码上也能通过的测试，锁不住任何东西。

> 一句话：**一个在旧代码上也能通过的测试，锁不住任何东西。** 测试的价值 = 它能否让旧代码 FAIL。

## 一、定义

**判别性测试** = 满足以下两条的测试：

1. **Baseline FAILS**：把改好的代码回滚（或用原始版本）跑同一测试 → **必须失败**
2. **Candidate PASSES**：在当前改动代码上跑 → **必须成功**

缺任意一条，这个测试就不具备判别力，等同于没写。

## 二、为什么普通测试不够

| 场景 | 普通测试的表现 | 后果 |
|---|---|---|
| 测试测到了别的对象 | 绿 | 缺陷还在，没人知道 |
| 测试断言太宽（如 `expect(x).toBeTruthy()`） | 绿 | 什么都没锁 |
| 测试走了一条与真实入口不同的路径 | 绿 | 上线就炸（本项目最贵的教训） |
| 测试依赖的环境与生产不同 | 绿 | 假阳性，误判为修复 |

判别性测试是**唯一**能区分「这次改动真的起了作用」和「这次改动恰好没破坏任何东西」的手段。

## 三、构造三步法

### Step 1 · 取 baseline

```bash
git stash                    # 或用 git show HEAD:path > /tmp/old.js
node test/run.js             # 记录旧代码输出：必须是 FAIL
```

**若旧代码也 PASS → 立刻停下**，你的测试没有判据力，重写。
不允许用「反正我改了之后是绿的」放行。

### Step 2 · 收紧断言到具体值

```js
// ✗ 宽断言：旧代码也能过
assert(result.ok);

// ✓ 具体断言：只有修好了才过
assert.equal(texts.join(','), 'A,C');
assert.equal(spy.clickOption.args[0][0], 2);
```

### Step 3 · 恢复改动，验证翻转

```bash
git stash pop
node test/run.js             # 必须 PASS
```

一次完整的执行必须产出**两份输出**（FAIL 快照 + PASS 快照），缺一不放行。

### Step 1·补充：新增未跟踪模块（untracked）的 baseline 取法

`git stash`（不含 `-u`）只收已跟踪文件。若本次新增的是**全新文件**（如项目里凭空加的 `src/14-stats.js`），
它处于 untracked 状态，`git stash` 抓不到它——回滚后旧代码里**根本没有这个模块**，
测试会因 `ZHS.Xxx is undefined` 整组 TypeError 崩溃：看起来像 FAIL，但其实没验证到「功能缺失」，
且首个崩溃会把后面一半用例吞掉（假阴性掩盖真失败）。

正确做法（本项目实证 2026-09-20）：
1. 把新文件**临时移出** src 目录（`mv src/14-stats.js /tmp/`）→ build 产物不含该模块 = 模拟 baseline（无此功能）
2. `node build.js` 重建（按目录扫描，少一个文件就少一个模块）
3. `node test/run.js` → 断言应全红（如「统计模块已挂载」因 `ZHS.Stats` 不存在而 ✗）
4. 把文件移回，`node build.js` 重建，复验全绿

**配套要求**：测试里的兜底 stub 要设计成「模块不存在时返回空值而非抛错」，让每条断言**干净 FAIL**，
而不是首个 TypeError 把后半段用例淹没。`git stash -u` 也能收 untracked，但会连带收走 dist 差异，
不如「移出 src/ 重建」干净可控。

## 四、★ 入口真实性要求（本项目强制）

测试必须**从用户真实调用点发起**，不允许直接调底层函数。

```
✗ 错：直接调用 innerExtract(texts) 单测
✓ 对：从 handleDialog() 发起，用 spy 记录其内部调用实参
```

理由：项目历史上多次出现「单测绿但入口不可达」，累计贡献 3 轮返工。
测底层函数通过而入口崩掉，是最具欺骗性的假绿。

若真实入口依赖浏览器环境，用以下手段之一构造**可执行的**入口级测试：
- 最小 DOM stub + 模块注入（已有 `test/` 目录可复用）
- spy/proxy 拦截并记录调用实参后断言
- 关键路径打桩，非关键路径走真实实现

## 五、记录格式（贴在提交信息 / 会议记录里）

```markdown
### Discriminating Test · IMP-xxx
用例：<文件路径>::<用例名>
入口：<从哪个真实调用点发起>
断言：<具体值，非 truthy>

Baseline（旧代码）：
  $ git stash && node test/run.js
  → FAIL: Expected "2,3" received "A,C"      ← 贴真实输出

Candidate（新代码）：
  $ git stash pop && node test/run.js
  → PASS: 通过 421 / 失败 0                   ← 贴真实输出

翻转确认：baseline FAIL ✔ / candidate PASS ✔（两条都要有）
```

## 六、常见失效模式

| 失效模式 | 症状 | 修法 |
|---|---|---|
| **同义断言** | 断言复述实现（`assert(a === a)`） | 断言**外部可见输出**，不复用实现表达式 |
| **测试自己也改了** | 改代码同时改了测试的期望值 | 禁止同一次改动里既改被测代码又改断言期待值 |
| **只跑 PASS 那一次** | 「现在绿了，OK」 | 必须补 baseline 那一次 FAIL |
| **环境差异** | 本地绿 CI 红 / 反之 | 固定随机种子、固定时间、mock 网络 |
| **测了 wrapper 没测 core** | 把 mock 的行为测了 | spy 记完实参后断言**实参内容**，不是调用次数 |

## 七、与其它文件的关系

```
discriminating-test  → 证明「这次改动真的有用」   （提供 d 类判据给 oracle-gate）
oracle-gate          → 必须包含 discriminating-test 的 baseline FAIL 证据才能放行
root-cause-protocol  → 决定这个测试应该测哪一层
```
