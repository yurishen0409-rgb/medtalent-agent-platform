// 熊老健康问答（聊天式）：题目顺序、引导语、就诊报告。
// 引导语见需求页第二十五、二十六节（11-09 AI 圆桌讨论，Claude 核对，本人定）；量表题干和选项沿用 xiongIntake.ts，一字不改。
// 11-11 本人定：开头先让患者说（语音转文字），由服务端整理出条目预先勾选，再逐组核对；舌象拍照。
// 题目、报告仍在本机按规则生成；界面上不写处理方式（本人定）。
import { XIONG_SCALES, XIONG_SCREEN_ADVICE, XIONG_TCM_GROUPS, intakeRedFlags, itemValue, scoreXiongScale, type XiongBasicKey } from "./xiongIntake.ts";

export const XIONG_CHAT_PARTS = ["基本情况", "中医问诊", "情志自测"] as const;

// 一般资料选项（第二十四节，本人 11-09 定）。
export const XIONG_OCCUPATIONS = ["机关事业单位", "企业职员", "工人", "农民", "个体经营", "学生", "退休"] as const;
export const XIONG_EDUCATION = ["小学及以下", "初中", "高中或中专", "大专", "本科", "研究生"] as const;
// 居住环境拆成“住在哪”“周围环境”两问，潮湿、干燥配白话说明（本人 11-11 同意草图；说明文字待陈主任看）。
export const XIONG_AREAS = ["城市", "乡镇", "农村"] as const;
export const XIONG_SURROUNDINGS = [
  { name: "潮湿", hint: "墙面返潮、衣服难晾干" },
  { name: "干燥", hint: "常觉鼻子、嘴唇发干" },
  { name: "近工厂或马路", hint: "家附近有工厂或大马路" },
] as const;
// 症状每组可选“不清楚”，报告里单独标出，提示医生面诊时询问（本人 11-11 同意；加在哪些组待陈主任定，先全加）。
export const XIONG_UNSURE = "不清楚";
export const XIONG_UNSURE_NOTE = "不清楚，请医生面诊时询问";

// 整组互斥项：选它会清掉本组其他项（用模版里已有的条目，不新增“以上均无”）。
// 二便的“正常”拆成大便正常、小便正常，各管各的一题（本人 11-11 定，原表是一条“二便正常”）。
export const XIONG_EXCLUSIVE_CHIPS: Record<string, readonly string[]> = { 诱因: ["无明显原因诱发"], 二便: ["大便正常", "小便正常"], 情志: ["情绪正常"] };

// 大组按部位、类别拆成几道小题，一道题一小块（条目原文不变；分块名待医生看）。
export const XIONG_CHIP_BLOCKS: Record<string, { title: string; prompt: string; chips: readonly string[] }[]> = {
  症状: [
    { title: "鼻部", prompt: "眼下鼻子主要有哪些难受的地方？", chips: ["鼻塞", "晨晚鼻塞加重", "鼻塞呈单侧明显", "交替鼻塞流涕", "反复流涕", "反复喷嚏", "打喷嚏时连续多次才停", "鼻痒时需反复用手捏鼻", "嗅觉下降", "味觉下降", "呼吸不畅", "呼吸困难", "眠时打鼾"] },
    { title: "咽喉", prompt: "咽喉这边有哪些情况？", chips: ["咽部异物感", "咽痒", "咽痛", "反复咳嗽"] },
    { title: "耳部", prompt: "耳朵有哪些情况？", chips: ["耳鸣", "耳内蝉鸣声", "耳痛", "耳内闷胀堵塞感"] },
    { title: "头、眼、颈", prompt: "头、眼睛、脖子有哪些情况？", chips: ["头晕", "无头晕头痛", "眼痛", "结膜充血", "颈胀", "颈部疼痛"] },
  ],
  寒热汗: [
    { title: "寒热", prompt: "平时怕冷还是怕热？", chips: ["发热", "低热", "午后低热", "夜间发热", "潮热", "手心热", "手心冷", "脚心热", "脚心冷", "畏寒", "畏热", "恶风", "恶寒", "寒热往来"] },
    { title: "出汗", prompt: "出汗情况怎么样？", chips: ["自汗", "盗汗", "汗多", "汗黏", "冷汗", "上身汗", "头汗", "颈部汗", "胸部汗", "背部汗", "手汗", "脚汗", "无汗"] },
  ],
  饮食睡眠: [
    { title: "口味", prompt: "嘴里常有什么味道？", chips: ["口苦", "口淡", "口甜", "口酸", "口咸", "口涩", "口黏腻"] },
    { title: "饮食口渴", prompt: "胃口和口渴情况怎么样？", chips: ["饮食正常", "多食善饥", "反酸嘈杂", "纳呆", "纳可", "纳差", "厌食", "厌油腻", "易饥饿", "饥不欲食", "口干欲饮", "口渴不欲饮", "喜冷饮", "喜热饮"] },
    { title: "睡眠", prompt: "夜里睡得怎么样？", chips: ["睡眠正常", "纳眠一般", "纳差眠可", "纳可眠差", "眠浅", "多梦", "易醒", "早醒", "入睡困难", "嗜睡"] },
  ],
  // 二便拆成大便、小便两题（本人 11-10 定）；11-11 起“正常”也拆开：大便题有“大便正常”，小便题有“小便正常”，两题都问。
  二便: [
    { title: "大便", prompt: "先说大便：顺畅吗？成形吗？", chips: ["大便正常", "大便黏", "大便干结", "便溏", "稀水样便", "泡沫样便", "大便前半段干后半段稀", "便后腹胀腹痛减轻", "大便带有血丝", "溏结不调", "完谷不化"] },
    { title: "小便", prompt: "再说小便，有哪些情况？", chips: ["小便正常", "小便短赤", "尿频", "尿急", "尿痛", "尿黄", "尿清长"] },
  ],
};

export const XIONG_CHAT_TEXT = {
  welcome: "您好，这里是健康问答，看病前先帮您理一理身体情况，请点下方按钮作答",
  resume: "欢迎回来，咱们接着刚才的进度继续。",
  skipped: "好的，这一项先跳过，咱们看下一题。",
  multi: "这一组可多选，选好后点确认。",
  saved: "进度已存好，下次打开可接着填。",
  // 稍后继续收进悬浮气泡后，每部分开头提醒一句（本人 11-11 同意悬浮气泡草图）。
  autoSaved: "进度已自动存好，可随时离开。",
  rest: "前一组已记好，请歇口气再继续。",
  done: "辛苦您了，您的回答已记好。",
  report: "就诊报告整理好了，面诊时请拿给医生看。",
  someSkipped: "部分题目已跳过，面诊时可向医生补充。",
  scl90: "精力允许的话，可再做一份 90 题的心理自评。",
  next: "确诊变应性鼻炎的，可再做生存质量问卷。",
  other: "您补充的情况已记下，会写进报告。",
  gate: "先选哪方面，可多选",
  basic: "先登记几项基本情况，点下方填写",
  complaint: "先说说哪里难受，按话筒说或打字",
  complaintHint: "照下面几方面说得越全，后面问得越少",
  confirm: "按您说的，先记下这些",
  confirmHint: "有出入的点掉，没说到的再问您",
  prefilled: "按您刚才说的已先勾好，请核对",
  tongue: "如方便，请拍一张舌头的照片",
  tongueHint: "自然光下伸出舌头，拍清舌面",
  endoscope: "做过鼻内镜检查的话，可上传照片",
  endoscopeHint: "从相册选清晰的一张，没有可跳过",
} as const;

// 只教“怎么答”的提示句：答完就从聊天记录里收起，只留问题和回答，免得挤占窗口（本人 11-11 定）。
export const XIONG_HINT_LINES: ReadonlySet<string> = new Set([
  XIONG_CHAT_TEXT.gate, XIONG_CHAT_TEXT.basic, XIONG_CHAT_TEXT.complaintHint, XIONG_CHAT_TEXT.confirmHint,
  XIONG_CHAT_TEXT.prefilled, XIONG_CHAT_TEXT.tongueHint, XIONG_CHAT_TEXT.endoscopeHint, XIONG_CHAT_TEXT.autoSaved, XIONG_CHAT_TEXT.multi, "可多选，鼻子已先帮您选上。",
]);
export const xiongAnsweredLines = (lines: readonly string[]) => lines.filter(line => !XIONG_HINT_LINES.has(line));

const partOpening = (part: number) => `第${"一二三"[part]}部分：${XIONG_CHAT_PARTS[part]}（共三部分）。`;

const TAG_PROMPTS: Record<string, string> = {
  诱因: "这次鼻子难受，起初是因为什么引起的？",
  症状: "眼下鼻子主要有哪些难受的地方？",
  特征: "这些难受什么时候更明显？是什么样的感觉？",
  寒热汗: "平时怕冷还是怕热？出汗多吗？",
  饮食睡眠: "嘴里什么味道？胃口和睡眠怎么样？",
  二便: "大小便怎么样？顺畅吗，成形吗？",
  情志: "最近心情怎么样？选最贴近的几项。",
};

export type XiongChatStep =
  | { kind: "basic"; part: number; lines: string[] }
  | { kind: "complaint"; part: number; lines: string[] }
  | { kind: "confirm"; part: number; lines: string[] }
  | { kind: "tongue"; part: number; lines: string[] }
  | { kind: "endoscope"; part: number; lines: string[] }
  | { kind: "text"; part: number; lines: string[]; key: "history"; placeholder: string }
  | { kind: "tags"; part: number; lines: string[]; group: number; block?: number; cat?: number }
  | { kind: "gate"; part: number; lines: string[]; group: number; block?: number }
  | { kind: "scale"; part: number; lines: string[]; item: number }
  | { kind: "regions"; part: number; lines: string[] }
  | { kind: "consent"; part: number; lines: string[] };

export function buildXiongChatSteps(): XiongChatStep[] {
  const screen = XIONG_SCALES.find(scale => scale.id === "screen")!;
  return [
    // 基本情况一张卡片填完（本人 11-11 同意草图）；鼻腔宽大原因改由医生填写，患者端不问。
    { kind: "basic", part: 0, lines: [XIONG_CHAT_TEXT.welcome, partOpening(0), XIONG_CHAT_TEXT.basic] },
    // 中医问诊先让患者自己说，整理出的条目预先勾选，后面各组逐项核对（本人 11-11 定）。
    { kind: "complaint", part: 1, lines: [XIONG_CHAT_TEXT.autoSaved, partOpening(1), XIONG_CHAT_TEXT.complaint, XIONG_CHAT_TEXT.complaintHint] },
    // 自述整理后先在一页核对；已说到的组后面不再问（本人 11-11 定）。
    { kind: "confirm", part: 1, lines: [XIONG_CHAT_TEXT.confirm, XIONG_CHAT_TEXT.confirmHint] },
    ...XIONG_TCM_GROUPS.flatMap((group, index): XiongChatStep[] => {
      const blocks = XIONG_CHIP_BLOCKS[group.title];
      if (!blocks) {
        const prompt = TAG_PROMPTS[group.title] ?? `${group.title}方面有哪些情况？`;
        const follow = XIONG_FOLLOWUPS[followKey(group.title)];
        if (follow) return followSteps(index, undefined, [prompt]);
        return [{ kind: "tags", part: 1, group: index, lines: [prompt, ...(index === 0 ? [XIONG_CHAT_TEXT.multi] : [])] }];
      }
      const steps = blocks.flatMap((block, b): XiongChatStep[] => XIONG_FOLLOWUPS[followKey(group.title, block.title)]
        ? followSteps(index, b, [block.prompt])
        : [{ kind: "tags", part: 1, group: index, block: b, lines: [block.prompt] }]);
      // 症状先在头面部图上点部位，只问点到的部位（本人 11-09 定）。
      return group.title === "症状" ? [{ kind: "regions", part: 1, lines: ["哪些部位难受？请在图上点选。", "可多选，鼻子已先帮您选上。"] }, ...steps] : steps;
    }),
    { kind: "text", part: 1, key: "history", placeholder: "如：鼻塞三年，秋冬加重", lines: ["起病多久、怎么变化的，可补充几句。"] },
    { kind: "tongue", part: 1, lines: [XIONG_CHAT_TEXT.tongue, XIONG_CHAT_TEXT.tongueHint] },
    // 11-12 本人定：舌象之外，可上传鼻内镜检查照片（选填，从相册选）。
    { kind: "endoscope", part: 1, lines: [XIONG_CHAT_TEXT.endoscope, XIONG_CHAT_TEXT.endoscopeHint] },
    ...screen.items.map((_, index): XiongChatStep => ({
      kind: "scale", part: 2, item: index,
      lines: index === 0 ? [XIONG_CHAT_TEXT.rest, XIONG_CHAT_TEXT.autoSaved, partOpening(2), "接下来几题，问问您心里的感受。"] : [],
    })),
    { kind: "consent", part: 2, lines: [XIONG_CHAT_TEXT.done] },
  ];
}

export type XiongChatAnswers = {
  basic: Partial<Record<XiongBasicKey, string>>;
  chips: string[];
  history: string;
  screen: (number | null)[];
  skipped: string[];
  regions?: number[];
  // 两层追问第一层选了哪些分类（键是 gate 的 stepId）；选了“正常”项时为空数组。
  gates?: Record<string, number[]>;
  // 患者自述原话；从中整理出、预先勾上的条目；服务端返回的求助提示（原文）。
  complaint?: string;
  aiChips?: string[];
  // 自述里已说清楚的组或小题（键见 xiongBlockKey），后面不再逐项问。
  covered?: string[];
  alerts?: string[];
  // 选了“不清楚”的题（stepId）。
  unsure?: string[];
  // 舌象照片（压缩后的 JPEG data URL）及拍照授权时间。
  tongue?: string;
  tongueConsentAt?: string;
  // 鼻内镜照片（压缩后的 JPEG data URL）及上传授权时间。
  endoscope?: string;
  endoscopeConsentAt?: string;
};

export const emptyXiongChatAnswers = (): XiongChatAnswers => ({ basic: {}, chips: [], history: "", screen: [null, null, null, null], skipped: [] });

const blockSuffix = (step: { block?: number }) => step.block === undefined ? "" : `-${step.block}`;
export const stepId = (step: XiongChatStep) =>
  "key" in step ? step.key
    : step.kind === "tags" ? `tags-${step.group}${blockSuffix(step)}${step.cat === undefined ? "" : `-c${step.cat}`}`
    : step.kind === "gate" ? `gate-${step.group}${blockSuffix(step)}`
    : step.kind === "scale" ? `scale-${step.item}` : step.kind;

// 这一题里的互斥项（“正常”类）；没有返回 undefined。
export const xiongExclusiveIn = (groupTitle: string, chips: readonly string[]) => (XIONG_EXCLUSIVE_CHIPS[groupTitle] ?? []).find(chip => chips.includes(chip));

// 多选标签：点互斥项清掉同一题其他项；点其他项清掉同一题的互斥项。分块的组按块算“同一题”。
export function toggleXiongChip(chips: readonly string[], groupTitle: string, chip: string) {
  const blocks = XIONG_CHIP_BLOCKS[groupTitle];
  const scope = blocks?.find(block => block.chips.includes(chip))?.chips ?? XIONG_TCM_GROUPS.find(item => item.title === groupTitle)?.chips ?? [];
  const exclusive = xiongExclusiveIn(groupTitle, scope);
  if (chips.includes(chip)) return chips.filter(item => item !== chip);
  if (chip === exclusive) return [...chips.filter(item => !scope.includes(item)), chip];
  return [...chips.filter(item => item !== exclusive), chip];
}

// 每一步在对话里显示的回答；没答过返回 null。
export function xiongAnswerText(step: XiongChatStep, answers: XiongChatAnswers): string | null {
  const id = stepId(step);
  if (answers.skipped.includes(id)) return "已跳过";
  if (step.kind === "consent") return null;
  if (answers.unsure?.includes(id)) return XIONG_UNSURE;
  if (step.kind === "basic") return xiongBasicLine(answers.basic) || null;
  if (step.kind === "complaint") return answers.complaint?.trim() || null;
  if (step.kind === "confirm") return answers.covered?.length ? `已说到：${answers.covered.map(key => key.split("/").at(-1)).join("、")}` : "已核对";
  if (step.kind === "tongue") return answers.tongue ? "已拍舌象照片" : null;
  if (step.kind === "endoscope") return answers.endoscope ? "已上传鼻内镜照片" : null;
  if (step.kind === "gate") {
    const follow = followOf(step);
    const picked = answers.gates?.[id];
    if (!picked) return null;
    if (!picked.length) return follow.exit && answers.chips.includes(follow.exit) ? follow.exit : "都还好";
    return picked.map(i => follow.cats[i].name).join("、");
  }
  if (step.kind === "regions") return answers.regions ? (answers.regions.length ? answers.regions.map(i => XIONG_REGIONS[i].name).join("、") : "都还好") : null;
  if (step.kind === "tags") {
    const picked = xiongStepChips(step).filter(chip => answers.chips.includes(chip));
    return picked.length ? picked.join("、") : null;
  }
  if (step.kind === "scale") {
    const answer = answers.screen[step.item];
    const scale = XIONG_SCALES.find(item => item.id === "screen")!;
    return answer === null || answer === undefined ? null : scale.items[step.item].options[answer];
  }
  return answers.history.trim() || null;
}

export function xiongBasicLine(b: XiongChatAnswers["basic"]) {
  return [
    b.sex, b.birthYear && `${b.birthYear} 年生`, b.married, b.occupation, b.education,
    b.living && `居住：${b.living}`,
    (b.height || b.weight) && [b.height && `${b.height} cm`, b.weight && `${b.weight} kg`].filter(Boolean).join(" / "),
    b.widenCause && `鼻腔宽大原因：${b.widenCause}`,
  ].filter(Boolean).join(" · ");
}

// 选了“不清楚”的题在报告里怎么称呼：组名，拆过的加小题名。
function stepLabel(step: XiongChatStep) {
  if (step.kind !== "tags" && step.kind !== "gate") return "";
  const group = XIONG_TCM_GROUPS[step.group].title;
  const block = step.block === undefined ? "" : XIONG_CHIP_BLOCKS[group][step.block].title;
  return block ? `${group}（${block}）` : group;
}

const screenPart = (answers: readonly (number | null)[], from: number, name: string) => {
  const scale = XIONG_SCALES.find(item => item.id === "screen")!;
  const done = [from, from + 1].filter(i => answers[i] !== null && answers[i] !== undefined);
  if (done.length < 2) return { line: `${name}：未完成（已答 ${done.length}/2）`, score: null };
  const score = itemValue(scale.items[from], answers[from]!) + itemValue(scale.items[from + 1], answers[from + 1]!);
  return { line: `${name}：${score} / 6`, score };
};

export type XiongChatReport = { blocks: { title: string; lines: string[] }[]; advice: string[]; flags: string[]; text: string };

// 就诊报告：只整理用户自己的回答和量表分数，不做辨证和诊断。
export function buildXiongChatReport(answers: XiongChatAnswers, scl90Summary: string | null = null, date = new Date()): XiongChatReport {
  const basic = xiongBasicLine(answers.basic);
  const tcm = XIONG_TCM_GROUPS.map(group => [group.title, group.chips.filter(chip => answers.chips.includes(chip))] as const)
    .filter(([, chips]) => chips.length).map(([title, chips]) => `${title}：${chips.join("、")}`);
  if (answers.complaint?.trim()) tcm.unshift(`患者自述：${answers.complaint.trim()}`);
  const unsure = buildXiongChatSteps().filter(step => answers.unsure?.includes(stepId(step)));
  for (const step of unsure) tcm.push(`${stepLabel(step)}：${XIONG_UNSURE_NOTE}`);
  if (answers.history.trim()) tcm.push(`现病史：${answers.history.trim()}`);
  const phq = screenPart(answers.screen, 0, "PHQ-2");
  const gad = screenPart(answers.screen, 2, "GAD-2");
  const screen = XIONG_SCALES.find(item => item.id === "screen")!;
  const full = scoreXiongScale(screen, answers.screen);
  const advice = full ? full.flags : [phq.score, gad.score].some(score => score !== null && score >= 3)
    ? [XIONG_SCREEN_ADVICE] : [];
  const blocks = [
    { title: "一般资料", lines: [basic || "未填写"] },
    { title: "中医问诊", lines: tcm.length ? tcm : ["未填写"] },
    { title: "舌象", lines: [answers.tongue ? "已拍照片，见报告图片" : "未拍"] },
    { title: "鼻内镜", lines: [answers.endoscope ? "已上传照片，见报告图片" : "未上传"] },
    { title: "情志初筛", lines: [`${phq.line} · ${gad.line}`] },
    { title: "SCL-90", lines: [scl90Summary ?? "未填写"] },
  ];
  const flags = [...(answers.alerts ?? []), ...intakeRedFlags(answers.chips)];
  const head = `就诊报告（${date.toISOString().slice(0, 10)}，供医生参考）`;
  const text = [head, ...blocks.map(block => `【${block.title}】${block.lines.join("；")}`), ...advice, ...flags].join("\n");
  return { blocks, advice, flags, text };
}

// 一道多选题里显示的条目：拆过的大组只取这一小块。
export function xiongStepChips(step: Extract<XiongChatStep, { kind: "tags" }>): readonly string[] {
  const group = XIONG_TCM_GROUPS[step.group];
  if (step.cat !== undefined) return followOf(step).cats[step.cat].chips;
  return step.block === undefined ? group.chips : XIONG_CHIP_BLOCKS[group.title][step.block].chips;
}

// 头面部图的部位，对应“症状”拆好的四道题（XIONG_CHIP_BLOCKS.症状 的顺序）。鼻部默认选上，可取消。
export const XIONG_REGIONS = [
  { name: "鼻", block: 0 },
  { name: "咽喉", block: 1 },
  { name: "耳", block: 2 },
  { name: "头、眼、颈", block: 3 },
] as const;

// 没点到的部位就不问；跳过了选部位这一步，则四个部位都问。
export function isXiongStepActive(step: XiongChatStep, answers: XiongChatAnswers): boolean {
  if (step.kind === "confirm") return Boolean(answers.aiChips?.length || answers.covered?.length);
  if ((step.kind === "gate" || step.kind === "tags") && answers.covered?.includes(xiongBlockKey(step))) return false;
  if (step.kind === "gate") return blockActive(step, answers);
  if (step.kind !== "tags") return true;
  if (step.cat !== undefined) {
    if (!blockActive(step, answers)) return false;
    const gateId = stepId({ kind: "gate", part: step.part, lines: [], group: step.group, block: step.block });
    // 只有一项的分类：第一层选了就记下，不再出第二屏。
    if (followOf(step).cats[step.cat].chips.length === 1) return false;
    return Boolean(answers.gates?.[gateId]?.includes(step.cat)) && !answers.skipped.includes(gateId);
  }
  return blockActive(step, answers);
}

function blockActive(step: { group: number; block?: number }, answers: XiongChatAnswers) {
  if (step.block === undefined) return true;
  const title = XIONG_TCM_GROUPS[step.group].title;
  if (title !== "症状") return true;
  if (!answers.regions || answers.skipped.includes("regions")) return true;
  return answers.regions.includes(step.block);
}

// ---- 两层追问（本人 11-11 定先做草稿版；分类名待陈主任确认）----
// 一组超过 8 项时：先问“哪方面”（可多选，分类名只用来分组，不写进报告），再只问选中的分类，每屏最多 6 项。
// 条目原文不改、一个不少（测试核对）。exit 是该组原有的“正常”类条目，单独一行，选了就跳过本组。
export type XiongFollowup = { exit?: string; cats: { name: string; chips: readonly string[] }[] };
// 11-11 本人反馈“分类过于宽泛”：一类只放一件事，名字用患者的话；只有一项的分类，选了就直接记下，不再出第二屏。
export const XIONG_FOLLOWUPS: Record<string, XiongFollowup> = {
  "症状/鼻部": { cats: [
    { name: "鼻塞", chips: ["鼻塞", "晨晚鼻塞加重", "鼻塞呈单侧明显", "交替鼻塞流涕"] },
    { name: "流鼻涕", chips: ["反复流涕"] },
    { name: "打喷嚏、鼻痒", chips: ["反复喷嚏", "打喷嚏时连续多次才停", "鼻痒时需反复用手捏鼻"] },
    { name: "闻味、尝味变差", chips: ["嗅觉下降", "味觉下降"] },
    { name: "喘气费劲", chips: ["呼吸不畅", "呼吸困难"] },
    { name: "睡觉打鼾", chips: ["眠时打鼾"] },
  ] },
  诱因: { exit: "无明显原因诱发", cats: [
    { name: "天气、季节变化", chips: ["因季节变化诱发", "因天气变化诱发"] },
    { name: "受凉、吹风", chips: ["因受寒诱发", "因怕风诱发"] },
    { name: "心情、工作压力", chips: ["因情绪波动诱发", "因工作压力大诱发", "因工作不顺心诱发"] },
    { name: "劳累", chips: ["因劳累诱发"] },
    { name: "吃喝", chips: ["因不洁饮食诱发", "因辛辣饮食诱发", "因饮酒过度诱发"] },
    { name: "接触过敏的东西", chips: ["因过敏原接触诱发"] },
  ] },
  特征: { cats: [
    { name: "夜里加重", chips: ["夜间加重"] },
    { name: "说话、活动、弯腰时加重", chips: ["说话时明显", "活动时疼痛加重", "弯腰加重"] },
    { name: "吃药后缓解", chips: ["服药后缓解"] },
    { name: "疼痛的感觉", chips: ["闷胀样痛", "胀痛", "钝痛"] },
    { name: "慢慢起病", chips: ["慢性起病"] },
  ] },
  "寒热汗/寒热": { cats: [
    { name: "怕冷、怕风", chips: ["畏寒", "恶风", "恶寒"] },
    { name: "怕热", chips: ["畏热"] },
    { name: "一阵冷一阵热", chips: ["寒热往来"] },
    { name: "发热", chips: ["发热", "低热", "午后低热", "夜间发热", "潮热"] },
    { name: "手脚心发热", chips: ["手心热", "脚心热"] },
    { name: "手脚心发凉", chips: ["手心冷", "脚心冷"] },
  ] },
  "寒热汗/出汗": { exit: "无汗", cats: [
    { name: "白天或睡着时出汗", chips: ["自汗", "盗汗"] },
    { name: "汗多、汗黏或冷汗", chips: ["汗多", "汗黏", "冷汗"] },
    { name: "头颈、胸背出汗", chips: ["头汗", "颈部汗", "上身汗", "胸部汗", "背部汗"] },
    { name: "手脚出汗", chips: ["手汗", "脚汗"] },
  ] },
  "饮食睡眠/饮食口渴": { exit: "饮食正常", cats: [
    { name: "胃口", chips: ["纳可", "纳差", "纳呆", "厌食", "厌油腻"] },
    { name: "饿的感觉", chips: ["易饥饿", "多食善饥", "饥不欲食"] },
    { name: "反酸、烧心", chips: ["反酸嘈杂"] },
    { name: "口渴、喝水", chips: ["口干欲饮", "口渴不欲饮", "喜冷饮", "喜热饮"] },
  ] },
  "二便/大便": { exit: "大便正常", cats: [
    { name: "大便干还是稀", chips: ["大便干结", "便溏", "稀水样便", "溏结不调", "大便前半段干后半段稀"] },
    { name: "大便黏、有泡沫或带血", chips: ["大便黏", "泡沫样便", "大便带有血丝"] },
    { name: "大便有食物残渣", chips: ["完谷不化"] },
    { name: "便后肚子舒服些", chips: ["便后腹胀腹痛减轻"] },
  ] },
  "饮食睡眠/睡眠": { exit: "睡眠正常", cats: [
    { name: "入睡和夜里醒", chips: ["入睡困难", "眠浅", "易醒", "早醒", "多梦"] },
    { name: "白天犯困", chips: ["嗜睡"] },
    { name: "胃口和睡眠合起来说", chips: ["纳眠一般", "纳差眠可", "纳可眠差"] },
  ] },
};

// 按钮上的短写法（本人 11-11 定“减少口字”）：题目已写明是嘴里的味道、什么诱发，按钮只写关键字；
// 记录和报告仍用原表原文。
const MOUTH_CHIPS = new Set<string>(XIONG_CHIP_BLOCKS.饮食睡眠.find(block => block.title === "口味")?.chips ?? []);
export function xiongChipLabel(chip: string) {
  if (MOUTH_CHIPS.has(chip)) return chip.slice(1);
  const cause = /^因(.+)诱发$/.exec(chip);
  return cause ? cause[1] : chip;
}

function followKey(groupTitle: string, blockTitle?: string) { return blockTitle ? `${groupTitle}/${blockTitle}` : groupTitle; }

export function followOf(step: { group: number; block?: number }): XiongFollowup {
  const group = XIONG_TCM_GROUPS[step.group];
  const block = step.block === undefined ? undefined : XIONG_CHIP_BLOCKS[group.title][step.block].title;
  return XIONG_FOLLOWUPS[followKey(group.title, block)];
}

function followSteps(group: number, block: number | undefined, lines: string[]): XiongChatStep[] {
  const follow = followOf({ group, block });
  return [
    { kind: "gate", part: 1, group, block, lines: [...lines, XIONG_CHAT_TEXT.gate] },
    ...follow.cats.map((cat, c): XiongChatStep => ({ kind: "tags", part: 1, group, block, cat: c, lines: [`${cat.name}：有哪些情况？可多选`] })),
  ];
}

// ---- 主诉整理后预先勾选（本人 11-11 定）----
// 服务端只能返回词表里已有的条目；这里再按词表过滤一遍，并按条目推出部位和两层追问的分类。
// 组或小题的键：没拆的组用组名，拆过的用“组名/小题名”。
export function xiongBlockKey(step: { group: number; block?: number }) {
  const title = XIONG_TCM_GROUPS[step.group].title;
  return step.block === undefined ? title : `${title}/${XIONG_CHIP_BLOCKS[title][step.block].title}`;
}

// 发给服务端的词表：按“一道题”为单位，模型据此判断哪些题患者已说清楚。
export const xiongVocabulary = () => XIONG_TCM_GROUPS.flatMap(group => XIONG_CHIP_BLOCKS[group.title]
  ? XIONG_CHIP_BLOCKS[group.title].map(block => ({ key: `${group.title}/${block.title}`, title: `${group.title}·${block.title}`, chips: [...block.chips] }))
  : [{ key: group.title, title: group.title, chips: [...group.chips] }]);

// 引导患者自述时可以说的几方面（按中医问诊顺序；点一下在输入框里加上开头）。
export const XIONG_TALK_GUIDE = [
  { name: "起因", hint: "什么时候开始，因为什么" },
  { name: "鼻子", hint: "鼻塞、流涕、喷嚏、闻味" },
  { name: "咽喉耳头", hint: "咽痒、耳鸣、头晕眼痛" },
  { name: "加重", hint: "什么时候更明显" },
  { name: "冷热出汗", hint: "怕冷怕热，出汗多少" },
  { name: "吃睡", hint: "胃口、口味、睡眠" },
  { name: "大小便", hint: "成形吗，顺畅吗" },
  { name: "心情", hint: "最近心情怎么样" },
] as const;

export function applyXiongPrefill(answers: XiongChatAnswers, picked: readonly string[], alerts: readonly string[] = [], covered: readonly string[] = []): XiongChatAnswers {
  const known = new Set(XIONG_TCM_GROUPS.flatMap(group => group.chips));
  let chips = [...answers.chips];
  const added: string[] = [];
  for (const chip of picked) {
    if (!known.has(chip) || chips.includes(chip)) continue;
    const group = XIONG_TCM_GROUPS.find(item => item.chips.includes(chip))!;
    chips = toggleXiongChip(chips, group.title, chip);
    added.push(chip);
  }
  const symptomBlocks = XIONG_CHIP_BLOCKS.症状;
  const regions = new Set(answers.regions ?? [0]);
  symptomBlocks.forEach((block, b) => { if (block.chips.some(chip => added.includes(chip))) regions.add(b); });
  const gates = { ...answers.gates };
  for (const step of buildXiongChatSteps()) {
    if (step.kind !== "gate") continue;
    const follow = followOf(step);
    const cats = follow.cats.map((cat, c) => cat.chips.some(chip => chips.includes(chip)) ? c : -1).filter(c => c >= 0);
    if (cats.length) gates[stepId(step)] = [...new Set([...(gates[stepId(step)] ?? []), ...cats])].sort();
  }
  const keys = new Set(xiongVocabulary().map(item => item.key));
  return { ...answers, chips, gates, regions: [...regions].sort(), covered: [...new Set([...(answers.covered ?? []), ...covered.filter(key => keys.has(key))])], aiChips: [...new Set([...(answers.aiChips ?? []), ...added])], alerts: [...new Set([...(answers.alerts ?? []), ...alerts])] };
}
