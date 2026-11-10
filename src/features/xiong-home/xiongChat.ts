// 熊老健康问答（聊天式）：题目顺序、引导语、就诊报告。
// 引导语见需求页第二十五、二十六节（11-09 AI 圆桌讨论，Claude 核对，本人定）；量表题干和选项沿用 xiongIntake.ts，一字不改。
// 全部在本机处理，不发给 AI。
import { XIONG_SCALES, XIONG_SCREEN_ADVICE, XIONG_TCM_GROUPS, intakeRedFlags, itemValue, scoreXiongScale, type XiongBasicKey } from "./xiongIntake.ts";

export const XIONG_CHAT_PARTS = ["基本情况", "中医问诊", "情志自测"] as const;

// 一般资料选项（第二十四节，本人 11-09 定）。
export const XIONG_OCCUPATIONS = ["机关事业单位", "企业职员", "工人", "农民", "个体经营", "学生", "退休"] as const;
export const XIONG_EDUCATION = ["小学及以下", "初中", "高中或中专", "大专", "本科", "研究生"] as const;
export const XIONG_LIVING = ["城市", "乡镇", "农村", "潮湿", "干燥", "近工厂或马路"] as const;
export const XIONG_DECADES = [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010] as const;

// 整组互斥项：选它会清掉本组其他项（用模版里已有的条目，不新增“以上均无”）。
export const XIONG_EXCLUSIVE_CHIPS: Record<string, string> = { 诱因: "无明显原因诱发", 二便: "二便正常", 情志: "情绪正常" };

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
  // 二便拆成大便、小便两题（本人 11-10 定）；“二便正常”放在大便题第一项，选了它就不再问小便。
  二便: [
    { title: "大便", prompt: "先说大便：顺畅吗？成形吗？", chips: ["二便正常", "大便黏", "大便干结", "便溏", "稀水样便", "泡沫样便", "大便前半段干后半段稀", "便后腹胀腹痛减轻", "大便带有血丝", "溏结不调", "完谷不化"] },
    { title: "小便", prompt: "再说小便，有哪些情况？", chips: ["小便短赤", "尿频", "尿急", "尿痛", "尿黄", "尿清长"] },
  ],
};

export const XIONG_CHAT_TEXT = {
  welcome: "您好，我是预问诊助手。看病前，先帮您把身体情况理一理。请点下方按钮作答。",
  resume: "欢迎回来，咱们接着刚才的进度继续。",
  skipped: "好的，这一项先跳过，咱们看下一题。",
  multi: "这一组可多选，选好后点确认。",
  saved: "进度已存好，下次打开可接着填。",
  rest: "前一组已记好，请歇口气再继续。",
  done: "辛苦您了，您的回答已记好。",
  report: "就诊报告整理好了，面诊时请拿给医生看。",
  someSkipped: "部分题目已跳过，面诊时可向医生补充。",
  next: "确诊变应性鼻炎的，可再做生存质量问卷。",
  other: "您补充的情况已记下，会写进报告。",
} as const;

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
  | { kind: "choice"; part: number; lines: string[]; key: XiongBasicKey; options: readonly string[]; other?: boolean }
  | { kind: "year"; part: number; lines: string[]; key: "birthYear" }
  | { kind: "number"; part: number; lines: string[]; key: "height" | "weight"; unit: string; min: number; max: number }
  | { kind: "multi"; part: number; lines: string[]; key: "living"; options: readonly string[] }
  | { kind: "text"; part: number; lines: string[]; key: "widenCause" | "history"; placeholder: string }
  | { kind: "summary"; part: number; lines: string[] }
  | { kind: "tags"; part: number; lines: string[]; group: number; block?: number }
  | { kind: "scale"; part: number; lines: string[]; item: number }
  | { kind: "regions"; part: number; lines: string[] }
  | { kind: "consent"; part: number; lines: string[] };

export function buildXiongChatSteps(): XiongChatStep[] {
  const screen = XIONG_SCALES.find(scale => scale.id === "screen")!;
  return [
    { kind: "year", part: 0, key: "birthYear", lines: [XIONG_CHAT_TEXT.welcome, partOpening(0), "咱们先登记几项您的基本情况。", "您是哪一年出生的？先选年代。"] },
    { kind: "choice", part: 0, key: "sex", options: ["男", "女"], lines: ["您的性别是？"] },
    { kind: "choice", part: 0, key: "married", options: ["已婚", "未婚"], other: true, lines: ["您的婚姻状况是？"] },
    { kind: "choice", part: 0, key: "occupation", options: XIONG_OCCUPATIONS, other: true, lines: ["您目前从事哪类工作？"] },
    { kind: "choice", part: 0, key: "education", options: XIONG_EDUCATION, lines: ["您的文化程度是？"] },
    { kind: "multi", part: 0, key: "living", options: XIONG_LIVING, lines: ["您平时住在什么样的环境？", XIONG_CHAT_TEXT.multi] },
    { kind: "number", part: 0, key: "height", unit: "cm", min: 100, max: 220, lines: ["接下来请选填您的身高和体重。", "身高多少厘米？"] },
    { kind: "number", part: 0, key: "weight", unit: "kg", min: 25, max: 200, lines: ["体重多少公斤？"] },
    { kind: "text", part: 0, key: "widenCause", placeholder: "如 鼻部手术史", lines: ["如果知道鼻腔宽大的原因，可写在这里。"] },
    { kind: "summary", part: 0, lines: ["基本情况已记好，请核对一下。", "哪项需要改，点右边的“改”。"] },
    ...XIONG_TCM_GROUPS.flatMap((group, index): XiongChatStep[] => {
      const first = index === 0 ? [partOpening(1)] : [];
      const blocks = XIONG_CHIP_BLOCKS[group.title];
      if (!blocks) return [{ kind: "tags", part: 1, group: index, lines: [...first, TAG_PROMPTS[group.title] ?? `${group.title}方面有哪些情况？`, ...(index === 0 ? [XIONG_CHAT_TEXT.multi] : [])] }];
      const steps = blocks.map((block, b): XiongChatStep => ({ kind: "tags", part: 1, group: index, block: b, lines: [...first, block.prompt] }));
      // 症状先在头面部图上点部位，只问点到的部位（本人 11-09 定）。
      return group.title === "症状" ? [{ kind: "regions", part: 1, lines: ["哪些部位难受？请在图上点选。", "可多选，鼻子已先帮您选上。"] }, ...steps] : steps;
    }),
    { kind: "text", part: 1, key: "history", placeholder: "如：鼻塞三年，秋冬加重", lines: ["起病多久、怎么变化的，可补充几句。"] },
    ...screen.items.map((_, index): XiongChatStep => ({
      kind: "scale", part: 2, item: index,
      lines: index === 0 ? [XIONG_CHAT_TEXT.rest, partOpening(2), "接下来几题，问问您心里的感受。"] : [],
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
};

export const emptyXiongChatAnswers = (): XiongChatAnswers => ({ basic: {}, chips: [], history: "", screen: [null, null, null, null], skipped: [] });

export const stepId = (step: XiongChatStep) =>
  "key" in step ? step.key : step.kind === "tags" ? `tags-${step.group}${step.block === undefined ? "" : `-${step.block}`}` : step.kind === "scale" ? `scale-${step.item}` : step.kind;

// 多选标签：点互斥项清掉本组其他项；点其他项清掉互斥项。
export function toggleXiongChip(chips: readonly string[], groupTitle: string, chip: string) {
  const exclusive = XIONG_EXCLUSIVE_CHIPS[groupTitle];
  const group = XIONG_TCM_GROUPS.find(item => item.title === groupTitle)?.chips ?? [];
  if (chips.includes(chip)) return chips.filter(item => item !== chip);
  if (chip === exclusive) return [...chips.filter(item => !group.includes(item)), chip];
  return [...chips.filter(item => item !== exclusive), chip];
}

// 每一步在对话里显示的回答；没答过返回 null。
export function xiongAnswerText(step: XiongChatStep, answers: XiongChatAnswers): string | null {
  const id = stepId(step);
  if (answers.skipped.includes(id)) return "已跳过";
  if (step.kind === "summary" || step.kind === "consent") return null;
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
  if (step.key === "history") return answers.history.trim() || null;
  const value = answers.basic[step.key];
  if (!value) return null;
  return step.kind === "number" ? `${value} ${step.unit}` : step.kind === "year" ? `${value} 年` : value;
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
export function buildXiongChatReport(answers: XiongChatAnswers, date = new Date()): XiongChatReport {
  const b = answers.basic;
  const basic = [
    b.birthYear && `${b.birthYear} 年生`, b.sex, b.married, b.occupation, b.education,
    b.living && `居住：${b.living}`,
    (b.height || b.weight) && [b.height && `${b.height} cm`, b.weight && `${b.weight} kg`].filter(Boolean).join(" / "),
    b.widenCause && `鼻腔宽大原因：${b.widenCause}`,
  ].filter(Boolean) as string[];
  const tcm = XIONG_TCM_GROUPS.map(group => [group.title, group.chips.filter(chip => answers.chips.includes(chip))] as const)
    .filter(([, chips]) => chips.length).map(([title, chips]) => `${title}：${chips.join("、")}`);
  if (answers.history.trim()) tcm.push(`现病史：${answers.history.trim()}`);
  const phq = screenPart(answers.screen, 0, "PHQ-2");
  const gad = screenPart(answers.screen, 2, "GAD-2");
  const screen = XIONG_SCALES.find(item => item.id === "screen")!;
  const full = scoreXiongScale(screen, answers.screen);
  const advice = full ? full.flags : [phq.score, gad.score].some(score => score !== null && score >= 3)
    ? [XIONG_SCREEN_ADVICE] : [];
  const blocks = [
    { title: "一般资料", lines: basic.length ? [basic.join(" · ")] : ["未填写"] },
    { title: "中医问诊", lines: tcm.length ? tcm : ["未填写"] },
    { title: "情志初筛", lines: [`${phq.line} · ${gad.line}`] },
  ];
  const flags = intakeRedFlags(answers.chips);
  const head = `就诊报告（${date.toISOString().slice(0, 10)}，供医生参考）`;
  const text = [head, ...blocks.map(block => `【${block.title}】${block.lines.join("；")}`), ...advice, ...flags].join("\n");
  return { blocks, advice, flags, text };
}

// 一道多选题里显示的条目：拆过的大组只取这一小块。
export function xiongStepChips(step: Extract<XiongChatStep, { kind: "tags" }>): readonly string[] {
  const group = XIONG_TCM_GROUPS[step.group];
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
export function isXiongStepActive(step: XiongChatStep, answers: XiongChatAnswers) {
  if (step.kind !== "tags" || step.block === undefined) return true;
  const title = XIONG_TCM_GROUPS[step.group].title;
  if (title === "二便") return step.block === 0 || !answers.chips.includes(XIONG_EXCLUSIVE_CHIPS.二便);
  if (title !== "症状") return true;
  if (!answers.regions || answers.skipped.includes("regions")) return true;
  return answers.regions.includes(step.block);
}
