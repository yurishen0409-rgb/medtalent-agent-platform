import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  entriesToCsv, intakeQuestion, intakeRedFlags, normalizeXiongEntries, researchId, scoreXiongScale, turbinateGroup,
  SCL90_FACTORS, XIONG_BASIC_FIELDS, XIONG_SCALES, XIONG_TCM_GROUPS,
} from '../src/features/xiong-home/xiongIntake.ts';

const scale = id => XIONG_SCALES.find(item => item.id === id);
const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('表单不收集姓名、电话和住址', () => {
  const labels = XIONG_BASIC_FIELDS.map(field => field.label).join();
  assert.doesNotMatch(labels, /姓名|电话|联系方式|地址/);
  assert.match(researchId(new Date('2026-11-09T02:00:00Z'), 0.5), /^XDJ-20261109-[0-9A-F]{4}$/);
});

test('中医问诊按模版分组，情志组完整', () => {
  assert.deepEqual(XIONG_TCM_GROUPS.map(group => group.title), ['诱因', '症状', '特征', '寒热汗', '饮食睡眠', '二便', '情志']);
  assert.equal(XIONG_TCM_GROUPS.at(-1).chips.length, 7);
});

test('危险表现会提示就医', () => {
  assert.equal(intakeRedFlags(['鼻塞']).length, 0);
  assert.match(intakeRedFlags(['呼吸困难']).join(), /120/);
  assert.match(intakeRedFlags(['情绪躁狂（打人毁物）']).join(), /12356/);
});

test('下鼻甲按较重一侧分组', () => {
  assert.equal(turbinateGroup(0, 0), '正常下鼻甲');
  assert.equal(turbinateGroup(1, 3), '下鼻甲重度缩小');
  assert.equal(turbinateGroup(null, 2), '');
});

test('快速筛查按需求说明 ≥3 分提示进一步评估', () => {
  assert.equal(scoreXiongScale(scale('screen'), [1, 1, 0, 0]).flags.length, 0);
  const result = scoreXiongScale(scale('screen'), [2, 1, 0, 0]);
  assert.match(result.summary, /PHQ-2 3 分/);
  assert.equal(result.flags.length, 1);
  assert.equal(scoreXiongScale(scale('screen'), [1, null, 0, 0]), null);
});

test('SCL-90 有 90 题，因子覆盖每题一次', () => {
  assert.equal(scale('scl90').items.length, 90);
  const items = Object.values(SCL90_FACTORS).flat().sort((a, b) => a - b);
  assert.deepEqual(items, Array.from({ length: 90 }, (_, index) => index + 1));
  const calm = scoreXiongScale(scale('scl90'), Array(90).fill(0));
  assert.match(calm.summary, /总分 90/);
  assert.equal(calm.flags.length, 0);
  const answers = Array(90).fill(0); answers[14] = 1;
  assert.match(scoreXiongScale(scale('scl90'), answers).flags.join(), /12356/);
});

test('鼻结膜炎问卷 28 题，未做活动不计分', () => {
  const rqlq = scale('rqlq');
  assert.equal(rqlq.items.length, 28);
  const answers = Array(28).fill(2); answers[0] = 7;
  assert.match(scoreXiongScale(rqlq, answers).summary, /总均分 2/);
});

test('导出 CSV 和问学文本只含填写内容', () => {
  const entry = { id: 'XDJ-20261109-0001', createdAt: '2026-11-09T00:00:00.000Z', kind: 'intake', basic: { sex: '女', occupation: '教师, 高中' }, chips: ['鼻塞', '心烦易怒'], history: '鼻塞三年' };
  const csv = entriesToCsv([entry]);
  assert.ok(csv.startsWith('﻿研究编号'));
  assert.match(csv, /"教师, 高中"/);
  assert.match(intakeQuestion(entry), /情志：心烦易怒/);
  assert.deepEqual(normalizeXiongEntries([entry, { id: 1 }, null, { ...entry, kind: 'other' }]), [entry]);
});

test('熊老导航、页面和账户同步已接入', async () => {
  const app = await read('../src/pages/DoctorApp.tsx');
  for (const label of ['"健康问答"', '"量表测试"', '"学说"']) assert.ok(app.includes(label), label);
  assert.match(app, /<XiongIntakePanel slug=\{doctor.slug\}/);
  assert.match(app, /<XiongScalePanel slug=\{doctor.slug\}/);
  assert.match(app, /tangPanel === "名家讲堂"/);
  assert.match(await read('../src/lib/consumerData.ts'), /'xiong-intake-v1'/);
  assert.match(await read('../server/wechat-bridge.mjs'), /arraySections = new Set\(\[[^\]]*"xiong-intake-v1"/);
});
