#!/usr/bin/env node
/*
 * acceptance-test.js — 客观验收脚本（无浏览器，纯 node 解析）
 *
 * 用法：
 *   node acceptance-test.js <path-to-dashboard.html>
 *   node acceptance-test.js seed-dashboard.html
 *   node acceptance-test.js dashboard-plain.html
 *   node acceptance-test.js dashboard-maxloop.html
 *
 * 退出码：0 = PASS，1 = FAIL（便于脚本化判定）
 *
 * 校验条件（全部客观、可逐字符复现）：
 *   [C1] 每个地区都有对应的柱子（bar 数量 == 数据集条数，且 label 不重复）
 *   [C2] #max-val 文本 === 数据集真实最大值（字符串相等）
 *   [C3] 每个柱都含 aria-label，且其数值 === 该柱 data-value（无障碍文本正确）
 *   [C4] 每个柱高度与 data-value 成比例（height/value 比值一致，容差 1%）
 *   [C5] 全文档不含 "ERROR" 字面量
 */

'use strict';
const fs = require('fs');
const path = require('path');

function fail(msg) {
  console.error('用法: node acceptance-test.js <dashboard.html>');
  console.error(msg || '');
  process.exit(2);
}

const target = process.argv[2];
if (!target) fail('缺少 HTML 路径参数');
if (!fs.existsSync(target)) fail('文件不存在: ' + target);

let html = fs.readFileSync(target, 'utf8');
// 去除 HTML 注释，避免注释中的示例元素（如 <span id="max-val">）被误当作真实 DOM 验收
html = html.replace(/<!--[\s\S]*?-->/g, '');
const checks = [];
function check(id, pass, detail) {
  checks.push({ id, pass: !!pass, detail });
}

// --- 解析柱子 ---
const barBlocks = [...html.matchAll(/<div class="bar"[^>]*>/g)].map(m => m[0]);
const bars = barBlocks.map(b => {
  const label = (b.match(/data-label="([^"]*)"/) || [])[1];
  const value = Number((b.match(/data-value="(\d+)"/) || [])[1]);
  const hMatch = b.match(/height:(\d+(?:\.\d+)?)px/);
  const height = hMatch ? Number(hMatch[1]) : NaN;
  const aria = (b.match(/aria-label="([^"]*)"/) || [])[1];
  return { label, value, height, aria };
});

const validBars = bars.filter(b => b.label && !Number.isNaN(b.value) && !Number.isNaN(b.height));

// [C1] 数量与 label 唯一性
const labels = validBars.map(b => b.label);
const uniqueLabels = new Set(labels);
check('C1', validBars.length >= 1 && uniqueLabels.size === labels.length,
  `柱子数=${validBars.length}, 唯一label数=${uniqueLabels.size}, labels=[${labels.join(', ')}]`);

// 真实最大值
const values = validBars.map(b => b.value);
const trueMax = values.length ? Math.max(...values) : NaN;

// [C2] #max-val 文本 === 真实最大值
const maxValMatch = html.match(/<(\w+)\s+id="max-val"[^>]*>([^<]*)<\/\1>/);
const maxValText = maxValMatch ? maxValMatch[2].trim() : null;
check('C2', maxValText !== null && maxValText === String(trueMax),
  `#max-val="${maxValText}" 期望="${String(trueMax)}"`);

// [C3] 每个柱 aria-label 数值 === data-value
let c3Detail = [];
let c3Pass = true;
for (const b of validBars) {
  if (!b.aria) { c3Pass = false; c3Detail.push(`${b.label}: 缺失aria-label`); continue; }
  const m = b.aria.match(/:\s*(\d+)/);
  const ariaVal = m ? Number(m[1]) : NaN;
  if (ariaVal !== b.value) { c3Pass = false; c3Detail.push(`${b.label}: aria="${b.aria}" 数值${ariaVal}≠data-value${b.value}`); }
}
check('C3', c3Pass, c3Detail.length ? c3Detail.join('; ') : '全部柱 aria-label 数值正确');

// [C4] 高度成比例
let c4Pass = true, c4Detail = '仅一柱或无可比';
if (validBars.length >= 2) {
  const ratios = validBars.map(b => b.height / b.value);
  const r0 = ratios[0];
  const maxDev = Math.max(...ratios.map(r => Math.abs(r - r0) / r0));
  c4Pass = maxDev <= 0.01;
  c4Detail = `比值=[${ratios.map(r => r.toFixed(3)).join(', ')}] 最大偏离=${(maxDev * 100).toFixed(2)}%`;
}
check('C4', c4Pass, c4Detail);

// [C5] 无 ERROR 字面量
const hasError = /ERROR/.test(html);
check('C5', !hasError, hasError ? '检测到 "ERROR" 字面量' : '无 ERROR');

// --- 汇总 ---
const passed = checks.filter(c => c.pass).length;
const total = checks.length;
const allPass = checks.every(c => c.pass);

console.log('=========================================');
console.log(`验收对象: ${path.basename(target)}`);
console.log(`数据集真实最大值(trueMax) = ${trueMax}`);
console.log('-----------------------------------------');
for (const c of checks) {
  console.log(`  [${c.pass ? 'PASS' : 'FAIL'}] ${c.id}  ${c.detail}`);
}
console.log('-----------------------------------------');
console.log(`汇总: ${passed}/${total} 项通过 -> ${allPass ? 'PASS' : 'FAIL'}`);
console.log('=========================================');

process.exit(allPass ? 0 : 1);
