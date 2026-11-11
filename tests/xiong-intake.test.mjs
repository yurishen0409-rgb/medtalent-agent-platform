import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  entriesToCsv, intakeRedFlags, intakeVisitNotes, normalizeXiongEntries, researchId, scoreXiongScale, turbinateGroup,
  SCL90_FACTORS, XIONG_BASIC_FIELDS, XIONG_PATIENT_SCALES, XIONG_SCALES, XIONG_TCM_GROUPS,
} from '../src/features/xiong-home/xiongIntake.ts';
import {
  buildXiongChatReport, buildXiongChatSteps, emptyXiongChatAnswers, isXiongStepActive, toggleXiongChip, xiongAnswerText, XIONG_CHAT_TEXT, XIONG_REGIONS,
} from '../src/features/xiong-home/xiongChat.ts';

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

test('快速筛查 ≥3 分提示继续填 SCL-90，界面里没有 CRF、需求说明、数据库字样', () => {
  assert.equal(scoreXiongScale(scale('screen'), [1, 1, 0, 0]).flags.length, 0);
  const result = scoreXiongScale(scale('screen'), [2, 1, 0, 0]);
  assert.match(result.summary, /PHQ-2 3 分/);
  assert.equal(result.flags.length, 1);
  assert.match(result.flags[0], /症状自评量表 SCL-90/);
  assert.deepEqual(XIONG_PATIENT_SCALES.map(item => item.id), ['screen', 'scl90', 'rqlq'], '患者端保留 SCL-90（本人 11-10 改定）');
  assert.doesNotMatch(result.flags[0], /CRF|需求说明|数据库/);
  for (const item of XIONG_SCALES) assert.doesNotMatch(item.source + item.subtitle, /CRF|需求说明|数据库|陈主任/);
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

test('SCL-90 第 59 题想到死亡、第 63 题伤人冲动也出求助提示', () => {
  const death = Array(90).fill(0); death[58] = 1;
  assert.match(scoreXiongScale(scale('scl90'), death).flags.join(), /12356/);
  const others = Array(90).fill(0); others[62] = 1;
  const flags = scoreXiongScale(scale('scl90'), others).flags;
  assert.equal(flags.length, 1);
  assert.match(flags[0], /伤害他人/);
  assert.match(flags[0], /110/);
});

test('鼻结膜炎问卷 28 题，未做活动不计分', () => {
  const rqlq = scale('rqlq');
  assert.equal(rqlq.items.length, 28);
  const answers = Array(28).fill(2); answers[0] = 7;
  assert.match(scoreXiongScale(rqlq, answers).summary, /总均分 2/);
});

test('导出 CSV 和就诊要点只含填写内容', () => {
  const entry = { id: 'XDJ-20261109-0001', createdAt: '2026-11-09T00:00:00.000Z', kind: 'intake', basic: { sex: '女', occupation: '教师, 高中' }, chips: ['鼻塞', '心烦易怒'], history: '鼻塞三年' };
  const csv = entriesToCsv([entry]);
  assert.ok(csv.startsWith('﻿研究编号'));
  assert.match(csv, /"教师, 高中"/);
  assert.match(intakeVisitNotes(entry), /情志：心烦易怒/);
  assert.doesNotMatch(intakeVisitNotes(entry), /熊老|学说/);
  assert.deepEqual(normalizeXiongEntries([entry, { id: 1 }, null, { ...entry, kind: 'other' }]), [entry]);
});

test('熊老导航、页面和账户同步已接入', async () => {
  const app = await read('../src/pages/DoctorApp.tsx');
  for (const label of ['"健康问答"', '"学说"']) assert.ok(app.includes(label), label);
  assert.match(app, /<XiongHealthPanel slug=\{doctor.slug\} \/>/);
  const workspace = await read('../src/features/xiong-home/XiongWorkspace.tsx');
  assert.match(workspace, /\[\["chat", "问答填写"\], \["scales", "量表测试"\]\]/);
  assert.doesNotMatch(workspace, /"表格版"/);
  assert.match(workspace, /医生填写入口/);
  assert.match(workspace, /useState<"chat" \| "scales" \| "doctor">\("chat"\)/);
  // 自填记录和量表结果不发给问学模型
  assert.doesNotMatch(workspace, /去问学/);
  assert.doesNotMatch(workspace, /XiongIntakePanel\(\{ slug, onAsk/);
  assert.match(app, /tangPanel === "名家讲堂"/);
  assert.match(await read('../src/lib/consumerData.ts'), /'xiong-intake-v1'/);
  assert.match(await read('../server/wechat-bridge.mjs'), /arraySections = new Set\(\[[^\]]*"xiong-intake-v1"/);
});

test('聊天式健康问答：三部分顺序、引导语短句、保留鼻腔宽大原因', () => {
  const steps = buildXiongChatSteps();
  assert.deepEqual([...new Set(steps.map(step => step.part))], [0, 1, 2]);
  assert.ok(steps.some(step => step.key === 'widenCause'));
  const firstLayer = steps.filter(step => step.kind === 'gate' || (step.kind === 'tags' && step.cat === undefined));
  assert.equal(firstLayer.length, 14, '诱因、特征、情志各一题；症状 4 题，寒热汗 2 题，饮食睡眠 3 题，二便 2 题（大便、小便）');
  assert.equal(steps.filter(step => step.kind === 'gate').length, 8, '超过 8 项的 8 组改两层追问');
  assert.equal(steps.filter(step => step.kind === 'scale').length, 4);
  const lines = [...steps.flatMap(step => step.lines), ...Object.values(XIONG_CHAT_TEXT)];
  for (const line of lines.filter(line => line !== XIONG_CHAT_TEXT.welcome)) assert.ok([...line].length <= 25, line);
  for (const line of lines) assert.doesNotMatch(line, /不/, line);
});

test('互斥项清掉本组其他项，跳过记为缺失，量表缺题标未完成', () => {
  let chips = toggleXiongChip([], '二便', '便溏');
  chips = toggleXiongChip(chips, '二便', '大便正常');
  assert.deepEqual(chips, ['大便正常']);
  assert.deepEqual(toggleXiongChip(chips, '二便', '尿黄'), ['大便正常', '尿黄'], '大便正常只管大便题');
  assert.deepEqual(toggleXiongChip(['大便正常', '尿黄'], '二便', '小便正常'), ['大便正常', '小便正常']);
  assert.deepEqual(toggleXiongChip(['大便正常', '小便正常'], '二便', '便溏'), ['小便正常', '便溏']);
  const answers = { ...emptyXiongChatAnswers(), basic: { sex: '女' }, chips: ['鼻塞', '呼吸困难'], screen: [2, 1, null, null], skipped: ['scale-2'] };
  const scale = buildXiongChatSteps().find(step => step.kind === 'scale' && step.item === 2);
  assert.equal(xiongAnswerText(scale, answers), '已跳过');
  const report = buildXiongChatReport(answers, null, new Date('2026-11-09T02:00:00Z'));
  assert.deepEqual(report.blocks.map(block => block.title), ['一般资料', '中医问诊', '情志初筛', 'SCL-90']);
  assert.match(report.text, /PHQ-2：3 \/ 6 · GAD-2：未完成（已答 0\/2）/);
  assert.match(report.text, /SCL-90】未填写/);
  assert.ok(report.advice.length === 1, 'PHQ-2 ≥3 给出进一步评估建议');
  assert.ok(report.flags.some(flag => flag.includes('120')), '呼吸困难出求助提示');
  assert.doesNotMatch(report.text, /证|辨|诊断为/);
});

test('大组分块只改排版：每组条目一个不少、一个不多', async () => {
  const { XIONG_CHIP_BLOCKS } = await import('../src/features/xiong-home/xiongChat.ts');
  for (const [title, blocks] of Object.entries(XIONG_CHIP_BLOCKS)) {
    const group = XIONG_TCM_GROUPS.find(item => item.title === title);
    assert.deepEqual(blocks.flatMap(block => block.chips).sort(), [...group.chips].sort(), title);
  }
});

test('头面部图：选部位在症状四题之前，只问点到的部位；跳过则四题都问', () => {
  const steps = buildXiongChatSteps();
  const at = steps.findIndex(step => step.kind === 'regions');
  assert.ok(at > 0);
  const symptom = steps.slice(at + 1).filter(step => step.kind === 'gate' || (step.kind === 'tags' && step.cat === undefined)).slice(0, 4);
  assert.deepEqual(symptom.map(step => step.block), [0, 1, 2, 3]);
  assert.deepEqual(XIONG_REGIONS.map(region => region.name), ['鼻', '咽喉', '耳', '头、眼、颈']);
  const base = emptyXiongChatAnswers();
  assert.deepEqual(symptom.map(step => isXiongStepActive(step, { ...base, regions: [0, 2] })), [true, false, true, false]);
  assert.ok(symptom.every(step => isXiongStepActive(step, { ...base, regions: [0], skipped: ['regions'] })));
  assert.ok(symptom.every(step => isXiongStepActive(step, base)));
  assert.equal(xiongAnswerText(steps[at], { ...base, regions: [0, 3] }), '鼻、头、眼、颈');
});

test('二便拆成大便、小便，“正常”也拆成大便正常、小便正常，两题都问（本人 11-11 定）', () => {
  const steps = buildXiongChatSteps().filter(step => (step.kind === 'gate' || (step.kind === 'tags' && step.cat === undefined)) && XIONG_TCM_GROUPS[step.group].title === '二便');
  assert.deepEqual(steps.map(step => step.block), [0, 1]);
  const base = emptyXiongChatAnswers();
  assert.deepEqual(steps.map(step => isXiongStepActive(step, { ...base, chips: ['大便正常'] })), [true, true]);
  assert.ok(!XIONG_TCM_GROUPS.find(group => group.title === '二便').chips.includes('二便正常'));
  assert.deepEqual(steps.map(step => isXiongStepActive(step, { ...base, chips: ['便溏'] })), [true, true]);
});

test('保留 SCL-90：报告页可进 SCL-90，第 15 题出求助提示（本人 11-10 改定）', async () => {
  const chat = await read('../src/features/xiong-home/XiongChatIntake.tsx');
  assert.match(chat, /onScales\("scl90"\)/);
  const answers = Array(90).fill(0); answers[14] = 1;
  assert.match(scoreXiongScale(scale('scl90'), answers).flags.join(), /120 或 110[\s\S]*12356/);
});

test('界面里没有“入组研究以知情同意书为准”', async () => {
  const { readFile } = await import('node:fs/promises');
  for (const file of ['XiongChatIntake.tsx', 'XiongWorkspace.tsx']) {
    const source = await readFile(new URL(`../src/features/xiong-home/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source.replace(/\/\/.*$/gm, ''), /入组研究|知情同意书为准/, file);
  }
});

test('顶部改为悬浮气泡：进度、稍后继续、更多收进气泡；安全条原文保留；分段开头提醒已自动保存', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/features/xiong-home/XiongChatIntake.tsx', import.meta.url), 'utf8');
  assert.match(source, /className="xc-float"/);
  assert.match(source, /整理病情供医生参考，急症请立即拨打 120/);
  assert.doesNotMatch(source, /className="xc-parts"/);
  for (const label of ['稍后继续', '量表测试', '医生填写入口', '重新开始']) assert.match(source, new RegExp(`>${label}</button>`));
  const opens = buildXiongChatSteps().filter(step => step.lines.includes(XIONG_CHAT_TEXT.autoSaved));
  assert.deepEqual(opens.map(step => step.part), [1, 2]);
});

test('两层追问（本人 11-11 定，草稿版，分类名待陈主任确认）：条目原文一个不少，每屏最多 6 项，只问选中的分类', async () => {
  const { XIONG_FOLLOWUPS, XIONG_CHIP_BLOCKS, followOf, stepId } = await import('../src/features/xiong-home/xiongChat.ts');
  const source = title => {
    const [group, block] = title.split('/');
    return block ? XIONG_CHIP_BLOCKS[group].find(item => item.title === block).chips : XIONG_TCM_GROUPS.find(item => item.title === group).chips;
  };
  for (const [key, follow] of Object.entries(XIONG_FOLLOWUPS)) {
    const all = [...follow.cats.flatMap(cat => cat.chips), ...(follow.exit ? [follow.exit] : [])];
    assert.deepEqual([...all].sort(), [...source(key)].sort(), key);
    assert.equal(new Set(all).size, all.length, key);
    for (const cat of follow.cats) assert.ok(cat.chips.length <= 6, `${key}/${cat.name}`);
  }
  const steps = buildXiongChatSteps();
  const gate = steps.find(step => step.kind === 'gate' && XIONG_TCM_GROUPS[step.group].title === '诱因');
  const level2 = steps.filter(step => step.kind === 'tags' && step.cat !== undefined && step.group === gate.group);
  assert.equal(followOf(gate).exit, '无明显原因诱发');
  assert.ok(level2.every(step => step.lines.every(line => [...line].length <= 25)));
  const base = emptyXiongChatAnswers();
  const id = stepId(gate);
  assert.deepEqual(level2.map(step => isXiongStepActive(step, { ...base, gates: { [id]: [0, 2] } })), [true, false, true]);
  assert.ok(level2.every(step => !isXiongStepActive(step, base)), '没选分类就不问第二层');
  assert.ok(level2.every(step => !isXiongStepActive(step, { ...base, gates: { [id]: [0] }, skipped: [id] })), '第一层跳过，第二层也不问（记缺失）');
  assert.equal(xiongAnswerText(gate, { ...base, gates: { [id]: [1] } }), '情绪、劳累');
  assert.equal(xiongAnswerText(gate, { ...base, chips: ['无明显原因诱发'], gates: { [id]: [] } }), '无明显原因诱发');
  const chat = await read('../src/features/xiong-home/XiongChatIntake.tsx');
  assert.match(chat, /case "gate"/);
  assert.match(chat, /xiong-chat-draft-v4/, '题序变了，草稿换新版本号');
});

test('开场一句一句出、助手气泡去句末句号、点按有墨晕（本人 11-11 定）', async () => {
  const chat = await read('../src/features/xiong-home/XiongChatIntake.tsx');
  const css = await read('../src/features/xiong-home/xiong-intake.css');
  assert.equal(buildXiongChatSteps()[0].lines.length, 4);
  assert.match(chat, /current\.lines\.slice\(0, shown\)/);
  assert.match(chat, /replace\(\/。\$\/, ""\)/);
  assert.match(chat, /onPointerDown=\{inkAt\}/);
  assert.match(css, /\.xc-ripple \{/);
  assert.match(css, /@keyframes xc-bubble/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{ \.xiong-chat \* \{ animation: none/);
});

test('标题字体子集覆盖熊大经页面所有标题字（本人 11-11 发现“智能体”字体不一致）', async () => {
  const chars = new Set(await read('../public/assets/fonts/xiong/title-chars.txt'));
  const titles = ['熊大经名中医传承智能体', '学说理论', '我的', '正在加载智能体', '智能体不存在或已下线', '暂时无法加载智能体', '传承经典 · 守正创新', '名医大德', '名家讲堂', '学术动态', '问学举隅', '看学说 · 问学', '求诊', '求学', '就诊报告', '预问诊助手', '健康问答', '量表测试', '医家小传'];
  for (const title of titles) for (const char of title.replace(/[\s·]/g, '')) assert.ok(chars.has(char), `${title} 缺“${char}”`);
});
