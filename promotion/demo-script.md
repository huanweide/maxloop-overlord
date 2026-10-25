# MaxLoop 演示录屏脚本（demo recording script）

> 目标：30–60 秒录屏，直观展示"假绿 vs 真绿"，用于 README / 掘金 / Show HN 配图。无需真人出镜，纯终端 + 浏览器即可。

## 场景设定
- 一个带 2 个缺陷的仪表盘 `seed-dashboard.html`（D1 `#max-val`=120 应为 150；D2 East `aria-label` 数值错）。
- 验收脚本 `acceptance-test.js`（`node` 跑，退出码 0=PASS / 1=FAIL，输出逐字符可复现）。

## 分镜

**镜头 1（0–8s）｜抛出问题**
- 终端运行 `node acceptance-test.js seed-dashboard.html`
- 画面定格：`汇总: 3/5 项通过 -> FAIL`，`退出码: 1`
- 旁白字幕：「Agent 常见的坑：改完就喊完成，但验收其实没过。」

**镜头 2（8–25s）｜普通循环 = 假绿**
- 展示普通循环第 1 轮产物 `dashboard-plain.html`
- 运行 `node acceptance-test.js dashboard-plain.html`
- 定格：`汇总: 4/5 项通过 -> FAIL`，`退出码: 1`
- 字幕红字：「假绿！模型自认完成，实际 D2 还在 → 第 2 轮才补对」

**镜头 3（25–45s）｜MaxLoop = 真绿**
- 展示 MaxLoop 第 1 轮产物 `dashboard-maxloop.html`
- 运行 `node acceptance-test.js dashboard-maxloop.html`
- 定格：`汇总: 5/5 项通过 -> PASS`，`退出码: 0`
- 字幕绿字：「Oracle Gate：跑通验收才交付 → 第 1 轮就真绿，0 假绿」

**镜头 4（45–60s）｜结论卡**
- 贴对比表：
  - 收敛轮数 2 → 1
  - 假绿 100% → 0%
  - 效率指数 0.50 → 1.00（×2.0）
- 结尾字幕 + 仓库链接：`github.com/huanweide/maxloop-overlord`

## 录制要点
- 终端用等宽字体、深色背景，关键 PASS/FAIL 行高亮。
- 退出码（0/1）务必拍进画面，这是"外部判据"的视觉锤。
- 不剪掉 FAIL 过程，"假绿被发现"才是记忆点。
- 文件均在仓库 `experiments/`，开箱即录，无需额外准备。
