import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BookOpenIcon } from '@phosphor-icons/react';
import { doctorProfiles } from '../src/data/doctorProfiles.ts';
import { doctorCustoms, enabledGroups } from '../src/features/services/doctorCustom.ts';
import { componentEnabled, configuredNavigation, healthContextEnabled, usesTangRecords, usesWellness, voiceEnabled } from '../src/lib/builderRuntime.ts';
import { doctorTabPath, resolveDoctorEntryTab } from '../src/lib/doctorEntry.ts';
import { xiongAgentName, xiongCollectionGroup, xiongDemoReply, xiongWelcome, xiongKnowledgeGroups, xiongQuestions, xiongSources, xiongPromptFacts, xiongDemoProfile } from '../src/features/services/xiongDajing.ts';
import { doctorExperiences } from '../src/data/doctorExperience.ts';
import { defaultConfig } from '../server/domain.mjs';
import { buildDoctorSystemPrompt, generateChatReply, generateChatReplyStream } from '../server/chat-core.mjs';
import { specialtyChatProfiles } from '../server/specialty-chat-profiles.mjs';
import { PlatformDatabase } from '../server/database.mjs';

const doctor = doctorProfiles.find(item => item.slug === 'xiong-dajing');
const custom = doctorCustoms[doctor.slug];
const appSource = await readFile(new URL('../src/pages/DoctorApp.tsx', import.meta.url), 'utf8');
const runtimeSource = await readFile(new URL('../src/lib/builderRuntime.ts', import.meta.url), 'utf8');
const bundle = await build({
  stdin: { contents: appSource + '\nexport { XiongProfileSheet, HomePanel, ServicesPanel, PublishedContentDetail, createGenericExperience, navItems, AskPanel, CrisisHelpCard, MessageCitations, doctorNavigation };', resolveDir: fileURLToPath(new URL('../src/pages/', import.meta.url)), loader: 'tsx' },
  loader: { '.css': 'empty' },
  bundle: true, write: false, platform: 'node', format: 'cjs', external: ['react', 'react/*', 'react-dom', 'react-dom/*', 'framer-motion', 'react-router-dom'], jsx: 'automatic',
});
const compiled = { exports: {} };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
const render = (name, props) => renderToStaticMarkup(createElement(compiled.exports[name], props));

test('Xiong is registered with six questions and no inherited clinical metadata or media', () => {
  assert.equal(doctorProfiles.filter(item => item.slug === 'xiong-dajing').length, 1);
  assert.equal(doctor.hospital, '成都中医药大学');
  assert.equal(doctor.department, '待确认');
  assert.equal(doctor.title, '全国名中医');
  assert.equal(doctor.portrait, '');
  assert.deepEqual(doctor.quickQuestions, xiongQuestions);
  assert.equal(xiongQuestions.length, 6);
  assert.deepEqual(doctor.services, []);
  assert.deepEqual(doctor.articles, []);
  assert.deepEqual(custom.videos, []);
  assert.equal(custom.bio, undefined);
  assert.equal(custom.introPhoto, undefined);
  assert.deepEqual(enabledGroups(custom), xiongKnowledgeGroups.filter(group => !group.title.startsWith('传承发展')).map(({ items, ...group }) => ({ ...group, items: items.map(item => item.title) })));
  const chen = doctorProfiles.find(item => item.slug === 'chen-zhiling');
  assert.equal(doctor.name, '熊大经名中医传承智能体');
  assert.equal(xiongAgentName, doctor.name);
  assert.equal(doctor.accent, '#2F5553');
  assert.equal(doctor.accentSoft, '#FFFCF6');
  assert.deepEqual(compiled.exports.createGenericExperience(doctor).theme, { accent: '#2F5553', accentStrong: '#2F5553', accentRgb: '47, 85, 83', surface: '#FFFCF6', canvas: '#F6F1E7', ink: '#2B2A28' });
  assert.equal(chen.accent, '#3B9A70');
  assert.equal(doctorTabPath(doctor.slug, 'ask'), '/d/xiong-dajing/ask');
  assert.equal(resolveDoctorEntryTab('/d/xiong-dajing/ask', doctor.slug, () => 'manage'), 'ask');
});

test('fresh database seeds and publishes Xiong alongside the existing doctors', async t => {
  const root = path.resolve('.test-tmp');
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, 'xiong-seed-'));
  const database = new PlatformDatabase({ dataDir: directory, seedDoctors: doctorProfiles });
  t.after(async () => { database.close(); await rm(directory, { recursive: true, force: true }); });
  for (const slug of ['xiong-dajing', 'tang-jinsong', 'chen-zhiling']) {
    const seeded = database.getAgent(slug, true);
    assert.equal(seeded.slug, slug);
    assert.equal(seeded.status, 'published');
    assert.equal(seeded.config.model, '');
    if (slug === 'xiong-dajing') {
      assert.deepEqual(seeded.services, []);
      assert.equal(seeded.config.ragEnabled, false);
      assert.equal(seeded.config.healthContextEnabled, false);
      assert.match(seeded.config.welcomeMessage, /熊大经名中医传承智能体/);
    } else {
      assert.equal(seeded.config.ragEnabled, true);
      assert.equal(seeded.config.healthContextEnabled, true);
    }
  }
});

test('shared navigation keeps Chen labels and icons and uses off for unavailable components', () => {
  const items = compiled.exports.navItems;
  const navigation = configuredNavigation(doctor, items);
  assert.deepEqual(navigation, items.filter(item => ['home', 'ask', 'services'].includes(item.id)));
  assert.deepEqual(compiled.exports.doctorNavigation(doctor).map(item => item.label), ['首页', '问学', '学说']);
  for (const tab of ['manage', 'me']) {
    const saved = resolveDoctorEntryTab('/d/xiong-dajing', doctor.slug, () => tab);
    assert.equal(navigation.some(item => item.id === saved), false);
    assert.equal(navigation[0].id, 'home');
  }
  for (const id of ['records', 'assessments', 'wellness', 'voice', 'me']) assert.equal(componentEnabled(doctor, id), false);
  for (const check of [usesTangRecords, usesWellness, voiceEnabled, healthContextEnabled]) assert.equal(check(doctor), false);
  for (const name of ['量表自评', '睡眠日记', '用药记录', '戒烟管理', '复诊开方', '门诊指引', '就诊准备', '家属照护', '今日心境']) assert.ok(custom.off.includes(name));
  // Toggling the common off configuration restores the same template modules.
  const originalOff = custom.off;
  try {
    custom.off = [];
    assert.deepEqual(configuredNavigation(doctor, items), items);
    assert.equal(componentEnabled(doctor, 'records'), true);
  } finally { custom.off = originalOff; }
  for (const slug of ['tang-jinsong', 'chen-zhiling']) {
    assert.equal(configuredNavigation({ slug }, items), items);
    assert.equal(componentEnabled({ slug }, 'records'), true);
  }
  assert.equal(doctorCustoms['tang-jinsong'].bio.department, '精神卫生科');
  assert.equal(doctorCustoms['tang-jinsong'].videos.length, 1);
  assert.deepEqual(doctorCustoms['tang-jinsong'].off, ['复诊开方']);
  assert.deepEqual(doctorCustoms['chen-zhiling'].off, []);
  assert.doesNotMatch(appSource + runtimeSource, /knowledgeOnly|KnowledgeIntroduction|KnowledgeServices/);
});

test('actual template home, service cards and shared content details retain all supplied content', () => {
  const props = { doctor: { ...doctor, content: [] }, experience: compiled.exports.createGenericExperience(doctor), onAsk() {}, onManage() {}, onExpert() {} };
  const home = render('HomePanel', props);
  const services = render('ServicesPanel', { ...props, onTangAction() {} });
  assert.match(home, /journey-home/);
  assert.match(home, /名医大德/);
  assert.doesNotMatch(home, /医家小传/);
  assert.match(home, /熊大经/);
  assert.doesNotMatch(home, /journey-assessment|journey-notice-wrap|填写今日记录/);
  assert.match(services, /学说理论/);
  assert.doesNotMatch(services, /神经免疫调节/);
  assert.doesNotMatch(services, /采集规范|量表候选|图像采集/);
  assert.match(services, /tang-feature-grid/);
  assert.doesNotMatch(services, /健康科普|就医准备/);
  // Card clicks are routed to the common content detail inside the existing sheet.
  assert.match(appSource, /custom\.serviceDetails\?\.\[tangPanel\]/);
  assert.match(appSource, /content=\{custom\.serviceDetails\[tangPanel\]\}/);
  assert.match(appSource, /onExpert=\{custom \? \(\) => setTangPanel\("专家介绍"\)/);
  const details = [];
  for (const group of xiongKnowledgeGroups) {
    const hidden = group.title.startsWith('传承发展');
    const offTab = ['理法', '特色方药', '核心用药'].includes(group.title);
    assert.equal(services.includes(`<h2>${group.title}</h2>`), !hidden && !offTab);
    for (const item of group.items) {
      if (!offTab) assert.equal(services.includes(item.title), !hidden);
      const detail = custom.serviceDetails[item.title];
      assert.ok(detail.body.includes(item.body));
      if (item.note) assert.ok(detail.body.includes(item.note));
      let question;
      const detailTree = compiled.exports.PublishedContentDetail({ content: detail, onAsk(value) { question = value; } });
      detailTree.props.children.find(child => child?.type === 'button').props.onClick();
      assert.equal(question, item.question || `我想进一步了解“${item.title}”。`);
      const html = render('PublishedContentDetail', { content: detail, research: true, onAsk() {} });
      assert.match(html, /journey-published-body/);
      for (const source of item.sources) assert.ok(html.includes(source));
      details.push(html);
    }
  }
  assert.equal(details.length, 21);
  const allDetails = details.join('');
  for (const source of Object.values(xiongSources)) assert.ok(allDetails.includes(source));
  assert.match(allDetails, /病例有限，未总结程度关系/);
  assert.match(allDetails, /不用于判断个人情绪或心理问题/);
  assert.doesNotMatch(allDetails, /利特尔氏区/);
  assert.match(allDetails, /该日期为学习班安排，不标为已举办/);
  const intro = custom.expertSections.map(section => section.body).join('');
  assert.ok(intro.includes(xiongAgentName));
  assert.match(intro, /熊氏耳鼻喉科第五代传人/);
  const html = home + services + allDetails;
  assert.doesNotMatch(html, /<video|<input|<textarea|<select|唐劲松|邵逸夫|精神分裂症|今日心境|量表自评|睡眠日记|用药记录|戒烟管理|复诊开方|门诊指引|就诊准备|家属照护|预约挂号/);
  assert.match(appSource, /journey-photo-fallback/);
});

test('Xiong role is bounded to the supplied facts, requires sources and rejects diagnosis and prescriptions', () => {
  const config = defaultConfig(doctor);
  assert.equal(config.ragEnabled, false);
  assert.equal(config.healthContextEnabled, false);
  assert.match(config.welcomeMessage, /不是医生本人回复/);
  const prompt = buildDoctorSystemPrompt({ ...doctor, config });
  assert.ok(specialtyChatProfiles[doctor.slug]);
  assert.match(prompt, /没有找到依据/);
  assert.match(prompt, /可讲以上学术内容、方名、组成、配伍思路并标出处/);
  assert.match(prompt, /不给剂量，不复述医案/);
  assert.match(prompt, /用户说自己的症状或求方，不判断、不选方、不加减，建议面诊/);
  assert.match(prompt, /分度标准回答“待提供”/);
  assert.doesNotMatch(prompt, /不引用方剂|不提供方药、方名、药名/);
  assert.match(prompt, /拒绝个人诊断、辨证、处方和个人方药/);
  assert.match(prompt, /不根据鼻腔形态判断个人情绪或心理问题/);
  assert.match(prompt, /陈主任发展观点；后者出处待补/);
  assert.doesNotMatch(prompt, /唐劲松|【耳鼻喉症状与检查沟通重点】|【服务计划与真实操作边界】/);
  for (const source of Object.values(xiongSources)) assert.ok(prompt.includes(source));
  for (const question of xiongQuestions) {
    const answer = xiongDemoReply(question);
    assert.match(answer, /^【演示回答/);
    assert.match(answer, /出处：/);
    assert.doesNotMatch(answer, /GAD|PHQ|精神卫生科|唐劲松/);
  }
  for (const question of ['鼻全息论讲稿全文', '请补充神经免疫机制']) {
    assert.match(xiongDemoReply(question), /没有找到依据/);
    assert.match(xiongDemoReply(question), /不能据此自行用药/);
  }
});

test('Xiong reuses full local safety in ordinary and streaming chat, even without a model', async () => {
  const messages = ['我想结束生命', '我已经吃了一整瓶安眠药', '我妈抽搐了怎么办', '我现在没有自杀计划，但还是想死', '我不想再醒来'];
  for (const message of messages) {
    const args = { doctor: { ...doctor, config: defaultConfig(doctor) }, message, env: {}, fetchImpl: () => assert.fail('Local safety must not call a model') };
    const result = await generateChatReply(args);
    assert.equal(result.crisis, true, message);
    assert.match(result.reply, /120/);
    assert.doesNotMatch(result.reply, /演示回答/);
    const events = [];
    for await (const event of generateChatReplyStream(args)) events.push(event);
    assert.equal(events[0].crisis, true);
    assert.equal(events.at(-1).crisisCategory, result.crisisCategory);
    assert.equal(events.filter(event => event.type === 'delta').map(event => event.text).join(''), result.reply);
  }
});

test('Xiong shares the model safety classifier and never passes supplied knowledge context to the reply model', async () => {
  for (const stream of [false, true]) {
    const calls = [];
    const args = { doctor: { ...doctor, config: defaultConfig(doctor) }, message: xiongQuestions[0], env: { AI_API_KEY: 'synthetic-xiong-key', AI_API_URL: 'https://xiong.invalid/v1' }, knowledgeContext: 'FORBIDDEN_TRANSCRIPT_CONTEXT',
      fetchImpl: async (_, options) => {
        const body = JSON.parse(options.body); calls.push(body);
        if (body.response_format) return Response.json({ choices: [{ message: { content: '{"level":"safe","subject":"self"}' } }] });
        assert.equal(JSON.stringify(body).includes('FORBIDDEN_TRANSCRIPT_CONTEXT'), false);
        const content = '胆主窦窍，肺主鼻窍。出处：谢慧等，中医耳鼻喉科学研究杂志，2014，13(1)。';
        return stream ? new Response(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`) : Response.json({ choices: [{ message: { content } }] });
      } };
    if (stream) { for await (const _ of generateChatReplyStream(args)) { /* drain */ } }
    else await generateChatReply(args);
    assert.equal(calls.length, 2);
    assert.match(calls[0].messages[0].content, /危机分类/);
    assert.match(calls[1].messages[0].content, /胆主窦窍，肺主鼻窍/);
  }
  for (const level of ['clear_risk', 'uncertain']) {
    const result = await generateChatReply({ doctor, message: '不太想再撑下去了', env: { AI_API_KEY: 'synthetic-xiong-key' }, fetchImpl: async () => Response.json({ choices: [{ message: { content: JSON.stringify({ level, subject: 'self', category: 'self_harm' }) } }] }) });
    assert.equal(result.crisis, true);
    assert.match(result.reply, /120/);
  }
});


test('research, treatment and collection facts have no doses, cases or scale questions', () => {
  assert.deepEqual(xiongKnowledgeGroups.map(group => group.title), ['理论渊源', '理法', '特色方药', '核心用药', '传承与资料', '传承发展：陈志凌主任（非熊老学说）']);
  assert.deepEqual(xiongQuestions, ['什么是鼻五度辨证？', '“形神合一”是指鼻腔与情志有什么关系？', '鼻腔宽大现在有分级标准吗？', '熊老治慢性鼻窦炎的思路是什么？', '吉雷通窍汤的配伍心法是什么？', '枢度和情志是什么关系？']);
  const degrees = xiongKnowledgeGroups[0].items[0];
  assert.equal(degrees.body.split('\n').length, 5);
  assert.equal(degrees.body, '气度：下鼻甲、下鼻道，肺\n枢度：中鼻甲、中鼻道，肝胆\n血度：鼻中隔，心\n肉度：鼻尖、鼻翼、鼻前庭，脾\n髓度：上鼻甲、鼻骨、鼻顶，肾');
  const relation = xiongKnowledgeGroups[0].items[3];
  assert.match(relation.body, /中鼻甲缩小、中鼻道宽大进而表现为鼻腔宽大/);
  assert.match(relation.body, /肝郁不舒、情志郁怒、性格暴躁/);
  assert.match(relation.body, /下鼻甲缩小、下鼻道及总鼻道宽大/);
  assert.match(relation.body, /悲忧、情绪低落或暴躁/);
  assert.deepEqual(relation.sources, ['龚轩民、熊大经，中医临床研究，2023，15(34):141-145。']);
  const collection = xiongCollectionGroup;
  const scales = collection.items.find(item => item.title === '量表候选');
  assert.equal(scales.body, '量表正在讨论中。');
  assert.match(scales.note, /不提供题目和评分，不开展个人测评/);
  assert.match(collection.items[0].body, /中国中医药报 2026-07-13 文章有“鼻腔宽大 2 度”的用法/);
  assert.match(collection.items[2].body, /设备.*部位与角度.*质量.*不带可识别信息/);
  assert.match(collection.items[3].body, /筛选.*脱敏.*质控.*上传.*整合.*保存.*共享/);
  assert.match(collection.items[3].note, /平台未定，不接真实上传/);
  const all = JSON.stringify(custom) + xiongPromptFacts.join('\n') + xiongQuestions.map(xiongDemoReply).join('\n') + buildDoctorSystemPrompt({ ...doctor, config: defaultConfig(doctor) });
  assert.doesNotMatch(all, /\d+(?:\.\d+)?\s*(?:g\b|mg\b|克|毫克)|[一二三四五六七八九十百]+克|周某|曾某/i);
  assert.doesNotMatch(all, /所提供文献无分级和量表/);
  assert.doesNotMatch(JSON.stringify(collection), /第[一二三四五六七八九十0-9]+题|0[—–~-][34]分|从不|有时|经常|总是|总分|评分标准/);
  assert.match(xiongDemoReply(xiongQuestions[2]), /分度标准：待提供/);
  assert.match(xiongDemoReply('数据集量表选了哪些？'), /量表正在讨论中/);
  for (const question of ['我鼻腔宽大吗？', '我的情绪低落是不是鼻甲缩小？', '孩子暴躁和鼻道宽大有关吗？']) {
    assert.match(xiongDemoReply(question), /不能据此判定/);
    assert.match(xiongDemoReply(question), /建议面诊/);
  }
  for (const question of ['给我开个方剂', '给我个人用药建议', '推荐药名']) assert.match(xiongDemoReply(question), /不选方、不化裁、不给剂量/);
});

test('treatment group renders the supplied warning, formulas, compositions and source limits', () => {
  const titled = title => xiongKnowledgeGroups.flatMap(g => g.items).find(item => item.title === title);
  const theory = xiongKnowledgeGroups.find(g => g.title === '理法');
  const formula = xiongKnowledgeGroups.find(g => g.title === '特色方药');
  assert.equal(theory.description, '本内容为文献记载之理法，不用于判断个人病情。');
  assert.equal(formula.description, '以下为文献记载的用药经验与历史方剂，供专业学术学习，切勿据此自行抓药或用药。');
  assert.deepEqual(theory.items.map(item => item.title), ['鼻渊（慢性鼻窦炎）·病机与治法', '鼻鼽（过敏性鼻炎）·辨治思路', '鼻鼽·从少阳论治', '失嗅·辨治思路', '鼻鼽·五度辨治', '鼻鼽·辨治路径']);
  assert.deepEqual(formula.items.map(item => item.title), ['鼻渊·吉雷通窍汤', '鼻鼽·五龙颗粒']);
  const titles = ['鼻渊（慢性鼻窦炎）·病机与治法', '鼻渊·吉雷通窍汤', '鼻渊·用药心法', '鼻鼽（过敏性鼻炎）·辨治思路', '鼻鼽·五度辨治', '鼻鼽·五龙颗粒', '鼻鼽·配伍心法'];
  const group = { items: titles.map(titled) };
  assert.equal(titled('鼻渊·吉雷通窍汤').basis, '清胆泻热、芳香通窍');
  for (const item of theory.items) for (const title of item.related ?? []) assert.ok(xiongKnowledgeGroups.flatMap(g => g.items).some(f => f.title === title), title);
  const services = render('ServicesPanel', { doctor: { ...doctor, content: [] }, experience: compiled.exports.createGenericExperience(doctor), onAsk() {}, onManage() {}, onTangAction() {} });
  assert.match(services, /xiong-doctrine-nav/);
  assert.ok(services.indexOf('<h2>理论渊源</h2>') < services.indexOf('<h2>传承与资料</h2>'));
  assert.ok(!services.includes('<h2>特色方药</h2>'));
  const expected = [
    ['病邪留滞、清窍闭塞、正气不足、鼻塞伤脾', '宣肺、通窍、益气、排脓', '通玄府、利枢机、和清窍'],
    ['肝胆湿热证', '黄芩、柴胡、川芎、白芷、枳壳、瓜蒌、藿香', '清胆泻热、芳香通窍', ],
    ['黄芪托里透脓排浊', '巧用地龙'],
    ['阳虚、气虚体质', '以少阳为切入点', '益气健脾、温阳祛风'],
    ['肉度应脾', '肺脾同治，培土生金'],
    ['五龙颗粒加减', '黄芪、白术、山药、大枣、桂枝、防风、五味子', '僵蚕、地龙'],
    ['地龙、僵蚕可协同使用', '抗过敏和免疫抑制的药理研究', '这是文献观点，不代表确定疗效'],
  ];
  group.items.forEach((item, index) => {
    const detail = custom.serviceDetails[item.title];
    const reply = xiongDemoReply(item.title);
    for (const text of expected[index]) {
      assert.ok(detail.body.includes(text), text);
      assert.ok(reply.includes(text), text);
    }
    assert.ok(detail.body.includes(xiongKnowledgeGroups.find(g => g.items.includes(item)).description));
    assert.match(reply, /文献所载/);
    assert.match(reply, /不能据此自行用药/);
    for (const source of item.sources) assert.ok(reply.includes(source));
  });
  const framework = xiongKnowledgeGroups[0].items.find(item => item.title === '辨治理论框架');
  for (const text of ['鼻五度辨证与情志', '胆肺假说、调少阳枢机与情志', '鼻腔宽大与情志', '枢度与情志关联最紧密', '枢运转，清阳升，浊阴降，鼻窍通', '手术前后要关注情志状态', '498 例', '72.89%', '文章转述']) assert.ok(framework.body.includes(text));
  assert.deepEqual(framework.sources, ['陈志凌，熊大经论鼻病与情志，中国中医药报，2026-07-13，第6版。']);
  assert.ok(xiongDemoReply(xiongQuestions[3]).includes(group.items[0].body));
  assert.ok(xiongDemoReply(xiongQuestions[4]).includes(group.items[1].body));
  assert.ok(xiongDemoReply(xiongQuestions[5]).includes(framework.body));
});

test('demo allows literature discussion but refuses personal formula selection, doses and case retelling', () => {
  for (const question of ['吉雷通窍汤的组成是什么？', '我想了解吉雷通窍汤的配伍思路', '吉雷开窍方和吉雷通窍汤的写法', '五龙颗粒的组成是什么？', ...[...xiongKnowledgeGroups[1].items, ...xiongKnowledgeGroups[2].items, ...xiongKnowledgeGroups[3].items].map(item => `我想进一步了解“${item.title}”。`)]) {
    const answer = xiongDemoReply(question);
    assert.match(answer, /出处：/);
    assert.match(answer, /黄芩|黄芪|阳虚|病邪留滞|地龙|肉度应脾|少阳|心失所养/);
    assert.doesNotMatch(answer, /^【演示回答[^\n]*\n不判断/);
  }
  for (const question of ['我鼻塞三个月，用吉雷通窍汤可以吗？', '我鼻炎，适合五龙颗粒吗？', '孩子流涕，帮选方', '鼻塞三个月怎么办', '我的症状要怎么加减五龙颗粒？', '给我开个方剂', '推荐药名']) {
    const answer = xiongDemoReply(question);
    assert.match(answer, /^【演示回答[^\n]*\n(不判断、不选方、不加减，建议面诊|不选方、不化裁、不给剂量。文献载有吉雷通窍汤等经验方，但本智能体不提供个人处方与用药指导，建议前往耳鼻喉科线下就诊。)/);
    assert.doesNotMatch(answer, /组成：|主要针对肝胆湿热证|含黄芪/);
  }
  for (const question of ['吉雷通窍汤的剂量', '复述吉雷通窍汤医案', '五龙颗粒用量']) {
    assert.match(xiongDemoReply(question), /^【演示回答[^\n]*\n不给剂量，不复述医案/);
  }
  for (const question of ['鼻腔宽大怎么分度？', '鼻腔宽大 2 度标准是什么？', '鼻腔宽大的分度标准']) assert.match(xiongDemoReply(question), /分度标准：待提供/);
  const allReplies = xiongKnowledgeGroups.flatMap(group => group.items).flatMap(item => [xiongDemoReply(item.title), xiongDemoReply(`我想进一步了解“${item.title}”。`)]).join('\n');
  assert.doesNotMatch(allReplies, /\d+(?:\.\d+)?\s*(?:g\b|mg\b|克|毫克)|[一二三四五六七八九十百]+克|周某|曾某/i);
});

test('Xiong template home and chat use neutral wording, six questions and no image upload', () => {
  const props = { doctor: { ...doctor, content: [] }, experience: compiled.exports.createGenericExperience(doctor), onAsk() {}, onManage() {}, onExpert() {} };
  const home = render('HomePanel', props);
  assert.match(home, /问学举隅/);
  assert.doesNotMatch(home, /封面待提供/);
  for (const cover of ['lecture-cover.jpg', 'news-cover.svg']) assert.ok(home.includes(`/assets/xiong/${cover}`), cover);
  assert.match(home, /入门问学/);
  for (const text of ['名医大德', '名家讲堂', '学术动态']) assert.match(home, new RegExp(text));
  assert.doesNotMatch(home, /待确认|WEEKLY FOCUS|PERSONAL HEALTH|本周大家最关心|进入智能问答，进一步了解相关信息/);
  for (const [index, question] of xiongQuestions.entries()) assert.equal(home.includes(question), [0, 1, 4].includes(index));
  assert.doesNotMatch(home, /立即提问/);
  const chat = render('AskPanel', { ...props, initialQuestion: '', initialAutoSend: false, initialShareHealthRecords: false, onConsumeInitialQuestion() {} });
  assert.match(chat, /传承经典 · 守正创新/);
  assert.match(chat, /熊大经名中医传承智能体/);
  assert.match(chat, /请输入想了解的学术问题/);
  assert.match(chat, /演示内容仅供讨论，急症请立即拨打 120/);
  assert.doesNotMatch(chat, /报告上传|健康科普|就医准备|描述你的健康问题/);
  for (const question of xiongQuestions) assert.ok(chat.includes(question));
  const footer = render('MessageCitations', { message: { text: '', role: 'assistant' }, research: true, showDisclaimer: true });
  assert.match(footer, /演示内容不替代诊疗/);
  assert.doesNotMatch(footer, /健康科普/);
});

test('Tang and Chen keep their template wording, theme and navigation', () => {
  for (const slug of ['tang-jinsong', 'chen-zhiling']) {
    const other = doctorProfiles.find(item => item.slug === slug);
    const props = { doctor: { ...other, content: [] }, experience: doctorExperiences[slug], onAsk() {}, onManage() {}, onExpert() {}, onTangAction() {} };
    const home = render('HomePanel', props);
    const services = render('ServicesPanel', props);
    const chat = render('AskPanel', { ...props, initialQuestion: '', initialAutoSend: false, initialShareHealthRecords: false, onConsumeInitialQuestion() {} });
    assert.match(home, slug === 'tang-jinsong' ? /本周大家最关心/ : /常见问题/);
    assert.match(services, /专业健康服务/);
    assert.match(chat, /健康科普智能助手/);
    assert.match(chat, /健康科普仅供参考，急症请立即拨打 120/);
    assert.doesNotMatch(home + services + chat, /研究与规范|可以这样问|待线上会确定|鼻病与情志智能体/);
    assert.equal(compiled.exports.doctorNavigation(other).find(item => item.id === 'ask').label, '问医生');
    assert.equal(other.accent, slug === 'tang-jinsong' ? '#2f8f65' : '#3B9A70');
    assert.equal(doctorExperiences[slug].theme.canvas, '#F3F7F2');
  }
});


test('Xiong palette is scoped and leaves emergency styling intact', async () => {
  const css = await readFile(new URL('../src/pages/doctor-app.css', import.meta.url), 'utf8');
  const xiongCss = css.slice(css.indexOf('/* 熊老演示版'));
  for (const color of ['#F6F1E7', '#FFFCF6', '#2B2A28', '#595752', '#2F5553', '#D9D2C5']) assert.ok(xiongCss.includes(color));
  for (const match of xiongCss.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{[^{}]*\}/g)) assert.match(match[1].trim(), /^\.is-xiong/);
  assert.doesNotMatch(xiongCss, /journey-crisis-card|journey-safety|journey-boundary|font-family|grid-template-columns/);
  assert.match(css, /\.journey-safety\s*\{[^}]*background: #fff8e9;[^}]*color: #806839;/);
  const crisis = render('CrisisHelpCard', { safety: { crisis: true, crisisCategory: 'medical_emergency' } });
  assert.match(crisis, /情况可能很紧急/);
  assert.match(crisis, /一键拨打 120/);
  assert.doesNotMatch(crisis, /演示版|问学/);
});


test('existing preview profiles adopt Xiong demo facts without changing other agents or saved data', () => {
  const saved = { slug: 'xiong-dajing', name: '熊大经', specialty: '旧定位', quickQuestions: ['旧问题'], content: [] };
  const view = xiongDemoProfile(saved);
  assert.equal(view.name, xiongAgentName);
  assert.deepEqual(view.quickQuestions, xiongQuestions);
  assert.match(view.specialty, /鼻病与情志多中心数据集/);
  assert.equal(saved.name, '熊大经');
  assert.deepEqual(saved.quickQuestions, ['旧问题']);
  assert.equal(view.content, saved.content);
  for (const slug of ['tang-jinsong', 'chen-zhiling']) {
    const other = doctorProfiles.find(item => item.slug === slug);
    assert.equal(xiongDemoProfile(other), other);
  }
});

test('academic notice is in welcome and notice; emergency line stays on the crisis card with 120', () => {
  assert.ok(xiongWelcome.includes('不可替代线下四诊合参及专科辨证论治'));
  assert.ok(custom.noticeLines.some(line => line.includes('不可替代线下四诊合参及专科辨证论治')));
  const source = readFileSync(new URL('../src/pages/DoctorApp.tsx', import.meta.url), 'utf8');
  assert.match(source, /emergency && doctorSlug === "xiong-dajing" && <p>察觉到您当前情况危急[^<]*拨打 120/);
  assert.match(source, /tel:120/);
  assert.match(source, /tel:12356/);
});

test('profile sheet shows honors, lineage and every source without review notes', () => {
  const html = render('XiongProfileSheet', {});
  for (const text of ['第二届全国名中医', '传承脉络', '溯源与文献出处', ...Object.values(xiongSources)]) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /核实|待确认|未审核/);
});

test('knowledge panels carry source-checked facts and no dosage', () => {
  const items = xiongKnowledgeGroups.flatMap(group => group.items);
  const herbs = items.find(item => item.title === '鼻渊·核心药组');
  assert.deepEqual(herbs.panel.herbs.find(herb => herb.name === '桔梗').related, ['黄芪']);
  assert.match(JSON.stringify(herbs.panel), /与桔梗为文中二项关联支持度最高/);
  assert.doesNotMatch(JSON.stringify(items.map(item => item.panel)), /\d\s*(?:g|克)/i);
  assert.match(items.find(item => item.title === '鼻鼽·辨治路径').body, /不用于判断个人体质或病情/);
  const html = render('PublishedContentDetail', { content: custom.serviceDetails['鼻渊·核心药组'], onAsk() {} });
  assert.match(html, /aria-pressed="true"/);
});

test('熊老标题用字都在思源宋体子集里', async () => {
  const { readFile } = await import('node:fs/promises');
  const chars = await readFile('public/assets/fonts/xiong/title-chars.txt', 'utf8');
  for (const title of ['熊大经', '传承经典 · 守正创新', '名医大德', '名家讲堂', '学术动态', '问学举隅', '学说理论']) {
    for (const char of title.replaceAll(' ', '')) assert.ok(chars.includes(char), `子集缺字：${char}`);
  }
});
