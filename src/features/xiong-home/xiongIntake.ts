// 熊老“鼻腔宽大与情志”数据库的自填表单与量表。
// 字段来源：陈志凌主任提供的《鼻腔宽大与情志关系 CRF 表》、中医问诊模版截图（2026-11-06）、
// 《熊大经鼻腔宽大与情志数据库初版需求说明》（PHQ-2 + GAD-2 快速筛查，≥3 分进一步评估）。
// 均未经医生审核；不收集姓名、电话、住址，研究编号由页面生成。

export const XIONG_INTAKE_SECTION = "xiong-intake-v1";

export type XiongChipGroup = { title: string; chips: readonly string[] };

// 中医问诊模版（患者可自述部分），按截图顺序转录；症状里去掉了与鼻病无关的会阴、排尿条目。
export const XIONG_TCM_GROUPS: readonly XiongChipGroup[] = [
  { title: "诱因", chips: ["无明显原因诱发", "因季节变化诱发", "因天气变化诱发", "因受寒诱发", "因情绪波动诱发", "因工作压力大诱发", "因工作不顺心诱发", "因劳累诱发", "因怕风诱发", "因不洁饮食诱发", "因辛辣饮食诱发", "因饮酒过度诱发", "因过敏原接触诱发"] },
  { title: "症状", chips: ["鼻塞", "晨晚鼻塞加重", "鼻塞呈单侧明显", "交替鼻塞流涕", "反复流涕", "反复喷嚏", "打喷嚏时连续多次才停", "鼻痒时需反复用手捏鼻", "嗅觉下降", "味觉下降", "呼吸不畅", "呼吸困难", "眠时打鼾", "咽部异物感", "咽痒", "咽痛", "反复咳嗽", "耳鸣", "耳内蝉鸣声", "耳痛", "耳内闷胀堵塞感", "头晕", "无头晕头痛", "眼痛", "结膜充血", "颈胀", "颈部疼痛"] },
  { title: "特征", chips: ["夜间加重", "服药后缓解", "说话时明显", "活动时疼痛加重", "闷胀样痛", "慢性起病", "胀痛", "钝痛", "弯腰加重"] },
  { title: "寒热汗", chips: ["发热", "低热", "午后低热", "夜间发热", "潮热", "手心热", "手心冷", "脚心热", "脚心冷", "畏寒", "畏热", "恶风", "恶寒", "寒热往来", "自汗", "盗汗", "汗多", "汗黏", "冷汗", "上身汗", "头汗", "颈部汗", "胸部汗", "背部汗", "手汗", "脚汗", "无汗"] },
  { title: "饮食睡眠", chips: ["口苦", "口淡", "口甜", "口酸", "口咸", "口涩", "口黏腻", "饮食正常", "睡眠正常", "纳眠一般", "纳差眠可", "多食善饥", "反酸嘈杂", "纳呆", "纳可", "纳差", "厌食", "厌油腻", "易饥饿", "饥不欲食", "口干欲饮", "口渴不欲饮", "喜冷饮", "喜热饮", "纳可眠差", "眠浅", "多梦", "易醒", "早醒", "入睡困难", "嗜睡"] },
  { title: "二便", chips: ["大便正常", "小便正常", "大便黏", "大便干结", "便溏", "稀水样便", "泡沫样便", "大便前半段干后半段稀", "便后腹胀腹痛减轻", "大便带有血丝", "溏结不调", "完谷不化", "小便短赤", "尿频", "尿急", "尿痛", "尿黄", "尿清长"] },
  { title: "情志", chips: ["情绪正常", "情绪激动", "心烦易怒", "心烦易躁", "情绪焦虑", "情绪抑郁", "情绪躁狂（打人毁物）"] },
];

// 望闻问由接诊医生填写。
export const XIONG_DOCTOR_GROUPS: readonly XiongChipGroup[] = [
  { title: "望", chips: ["正常面容", "神志清醒", "面色无华", "面色晦暗", "面色萎黄", "面色苍白", "面色红赤", "面色潮红", "面色青紫", "倦怠乏力", "有气无力", "满月脸", "面肥身瘦", "身体肥胖", "身体消瘦", "体重增加明显", "体重下降明显"] },
  { title: "闻", chips: ["未闻及明显异味", "口腔异味重", "下体异味重"] },
  { title: "问", chips: ["对答切题", "语言清晰", "回答不清需家属代诉"] },
];

// CRF 一般资料（去掉姓名、电话、详细地址）。
export const XIONG_BASIC_FIELDS = [
  { key: "birthYear", label: "出生年份", type: "number", placeholder: "如 1980" },
  { key: "sex", label: "性别", type: "choice", options: ["男", "女"] },
  { key: "married", label: "婚否", type: "choice", options: ["已婚", "未婚"] },
  { key: "occupation", label: "职业", type: "text" },
  { key: "education", label: "文化程度", type: "text" },
  { key: "living", label: "居住环境", type: "text", placeholder: "如 城市、潮湿、近工厂" },
  { key: "height", label: "身高（cm）", type: "number" },
  { key: "weight", label: "体重（kg）", type: "number" },
  { key: "widenCause", label: "鼻腔宽大原因（如知道）", type: "text", placeholder: "如 鼻部手术史，不清楚可不填" },
] as const;
export type XiongBasicKey = typeof XIONG_BASIC_FIELDS[number]["key"];

// CRF 第二部分：下鼻甲分度，0–3 分，由医生在第二头位观察后填写。
export const XIONG_TURBINATE_SCORES = [
  "0 分：下鼻甲未接触鼻中隔，经窥鼻器窥见 <1/3 中鼻甲",
  "1 分：下鼻甲未接触鼻中隔，可窥见 1/3–2/3 中鼻甲",
  "2 分：可窥见 2/3–全部中鼻甲，但无法窥及鼻咽后壁",
  "3 分：经窥鼻器可窥及鼻咽后壁",
] as const;
export function turbinateGroup(left: number | null, right: number | null) {
  if (left === null || right === null) return "";
  const worst = Math.max(left, right);
  return ["正常下鼻甲", "下鼻甲轻度缩小", "下鼻甲中度缩小", "下鼻甲重度缩小"][worst] ?? "";
}

// 选中后需要优先就医的条目（不替代医生判断）。
export const XIONG_RED_FLAGS: Record<string, string> = {
  呼吸困难: "出现呼吸困难，请立即就医；情况紧急请拨打 120。",
  大便带有血丝: "大便带血需要尽快到医院就诊，查明原因。",
  "情绪躁狂（打人毁物）": "如果有打人毁物或伤害自己、他人的冲动，请立即联系家人陪同就医，紧急时拨打 120 或 110；也可拨打全国心理援助热线 12356。",
};
export function intakeRedFlags(chips: readonly string[]) {
  return chips.filter(chip => XIONG_RED_FLAGS[chip]).map(chip => XIONG_RED_FLAGS[chip]);
}

// ---- 量表 ----
export type XiongScaleId = "screen" | "scl90" | "rqlq";
export type XiongScaleItem = { text: string; options: readonly string[]; values?: readonly number[]; group?: string };
export type XiongScale = { id: XiongScaleId; title: string; subtitle: string; duration: string; source: string; items: XiongScaleItem[] };

// PHQ-2 与 GAD-2 条目和选项沿用平台已有的 INfORM 中文版（见 yuwen/assessmentModel.ts）。
const FREQUENCY = ["根本没有", "有几天", "一半以上的时间", "几乎每天"] as const;
const SCREEN: XiongScale = {
  id: "screen", title: "情志快速筛查 PHQ-2 + GAD-2", subtitle: "回顾近两周，4 道题", duration: "约 1 分钟",
  source: "PHQ-2 + GAD-2，任一得分 ≥3 分再做进一步评估",
  items: [
    { text: "做事没有兴趣或愉悦感", options: FREQUENCY, group: "PHQ-2" },
    { text: "感觉低落、郁闷或没有希望", options: FREQUENCY, group: "PHQ-2" },
    { text: "感到紧张、焦虑或不安", options: FREQUENCY, group: "GAD-2" },
    { text: "无法停止或控制的忧虑", options: FREQUENCY, group: "GAD-2" },
  ],
};

const SCL_OPTIONS = ["无", "轻度", "中度", "偏重", "严重"] as const;
const SCL_ITEMS = [
  "头痛", "神经过敏，心中不踏实", "头脑中有不必要的想法或字句盘旋", "头晕或晕倒", "对异性的兴趣减退",
  "对旁人责备求全", "感到别人能控制您的思想", "责怪别人制造麻烦", "忘性大", "担心自己的衣饰整齐及仪态的端正",
  "容易烦恼和激动", "胸痛", "害怕空旷的场所或街道", "感到自己的精力下降，活动减慢", "想结束自己的生命",
  "听到旁人听不到的声音", "发抖", "感到大多数人都不可信任", "胃口不好", "容易哭泣",
  "同异性相处时感到害羞不自在", "感到受骗，中了圈套或有人想抓住您", "无缘无故地突然感到害怕", "自己不能控制地大发脾气", "怕单独出门",
  "经常责怪自己", "腰痛", "感到难以完成任务", "感到孤独", "感到苦闷",
  "过分担忧", "对事物不感兴趣", "感到害怕", "您的感情容易受到伤害", "旁人能知道您的私下想法",
  "感到别人不理解您、不同情您", "感到人们对您不友好，不喜欢您", "做事必须做得很慢以保证做得正确", "心跳得很厉害", "恶心或胃部不舒服",
  "感到比不上他人", "肌肉酸痛", "感到有人在监视您、谈论您", "难以入睡", "做事必须反复检查",
  "难以做出决定", "怕乘电车、公共汽车、地铁或火车", "呼吸有困难", "一阵阵发冷或发热", "因为感到害怕而避开某些东西、场合或活动",
  "脑子变空了", "身体发麻或刺痛", "喉咙有梗塞感", "感到前途没有希望", "不能集中注意力",
  "感到身体的某一部分软弱无力", "感到紧张或容易紧张", "感到手或脚发重", "想到死亡的事", "吃得太多",
  "当别人看着您或谈论您时感到不自在", "有一些不属于您自己的想法", "有想打人或伤害他人的冲动", "醒得太早", "必须反复洗手、点数或触摸某些东西",
  "睡得不稳不深", "有想摔坏或破坏东西的想法", "有一些别人没有的想法", "感到对别人神经过敏", "在商店或电影院等人多的地方感到不自在",
  "感到任何事情都很困难", "一阵阵恐惧或惊恐", "感到公共场合吃东西很不舒服", "经常与人争论", "单独一人时神经很紧张",
  "别人对您的成绩没有做出恰当的评价", "即使和别人在一起也感到孤单", "感到坐立不安，心神不定", "感到自己没有什么价值", "感到熟悉的东西变成陌生或不像是真的",
  "大叫或摔东西", "害怕会在公共场合晕倒", "感到别人想占您的便宜", "为一些有关“性”的想法而很苦恼", "您认为应该因为自己的过错而受到惩罚",
  "感到要很快把事情做完", "感到自己的身体有严重问题", "从未感到和其他人很亲近", "感到自己有罪", "感到自己的脑子有毛病",
];
const SCL90: XiongScale = {
  id: "scl90", title: "症状自评量表 SCL-90", subtitle: "根据现在或最近一星期的感觉，90 道题", duration: "约 15 分钟",
  source: "每题 1–5 分",
  items: SCL_ITEMS.map(text => ({ text, options: SCL_OPTIONS, values: [1, 2, 3, 4, 5] })),
};
// SCL-90 常用的 9 个因子及“其他”，题号从 1 开始。
export const SCL90_FACTORS: Record<string, readonly number[]> = {
  躯体化: [1, 4, 12, 27, 40, 42, 48, 49, 52, 53, 56, 58],
  强迫症状: [3, 9, 10, 28, 38, 45, 46, 51, 55, 65],
  人际关系敏感: [6, 21, 34, 36, 37, 41, 61, 69, 73],
  抑郁: [5, 14, 15, 20, 22, 26, 29, 30, 31, 32, 54, 71, 79],
  焦虑: [2, 17, 23, 33, 39, 57, 72, 78, 80, 86],
  敌对: [11, 24, 63, 67, 74, 81],
  恐怖: [13, 25, 47, 50, 70, 75, 82],
  偏执: [8, 18, 43, 68, 76, 83],
  精神病性: [7, 16, 35, 62, 77, 84, 85, 87, 88, 90],
  其他: [19, 44, 59, 60, 64, 66, 89],
};

const RQLQ_OPTIONS = ["没有困扰", "几乎没有困扰", "有些困扰", "中等程度困扰", "十分困扰", "很困扰", "极度困扰"] as const;
const RQLQ_ACTIVITY_OPTIONS = [...RQLQ_OPTIONS, "未做活动"] as const;
export const RQLQ_ACTIVITIES = ["骑自行车", "阅读", "购物", "做家庭维修", "做家务活", "进出空调房间", "看电视", "运动或锻炼", "晨练", "使用电脑", "乒乓球", "与宠物玩耍", "与儿女们或孙子们玩耍", "参加团体式体育运动", "驾驶", "唱歌", "进行正常的社交活动", "性生活", "羽毛球", "聊天", "吃东西", "使用吸尘器", "拜访朋友或亲戚", "外出散步", "带孩子上下学", "户外活动", "工作", "坐在户外", "带孩子上公园", "置身于吸烟环境"] as const;
const rqlq = (group: string, texts: string[]) => texts.map(text => ({ text, options: RQLQ_OPTIONS, group }));
const RQLQ: XiongScale = {
  id: "rqlq", title: "鼻结膜炎生存质量问卷", subtitle: "诊断过变应性鼻炎者填写，回顾过去 7 天", duration: "约 5 分钟",
  // 原表第 24 题重复写成“眼痛”，这里按眼肿记录，待陈主任确认。
  source: "每题 0–6 分，“未做活动”不计分",
  items: [
    ...[1, 2, 3].map(index => ({ text: `受限活动 ${index}`, options: RQLQ_ACTIVITY_OPTIONS, values: [0, 1, 2, 3, 4, 5, 6, 9], group: "活动" })),
    ...rqlq("睡眠", ["入睡困难", "夜间醒来", "夜间睡眠欠佳"]),
    ...rqlq("非鼻/眼症状", ["精力不足", "口渴", "工作能力下降", "疲倦", "注意力难以集中", "头痛", "疲惫不堪"]),
    ...rqlq("实际问题", ["因为不得不带纸巾或手帕而感到不便", "需要揉擦鼻/眼", "需要反复地擤鼻涕"]),
    ...rqlq("鼻部症状", ["鼻不通气/鼻塞", "流鼻水", "打喷嚏", "鼻涕倒流至咽喉"]),
    ...rqlq("眼部症状", ["眼痒", "流泪", "眼痛", "眼肿"]),
    ...rqlq("情感", ["沮丧", "内心不耐烦或不安宁", "易恼怒", "因症状而感到难堪"]),
  ],
};

export const XIONG_SCALES: readonly XiongScale[] = [SCREEN, SCL90, RQLQ];
// 患者端可选的量表。SCL-90 保留（本人 11-10 改定：先不去掉，含自伤、伤人念头题和求助提示）。
export const XIONG_PATIENT_SCALES: readonly XiongScale[] = [SCREEN, SCL90, RQLQ];

export function itemValue(item: XiongScaleItem, answer: number) {
  return item.values ? item.values[answer] : answer;
}

export type XiongScaleResult = { lines: string[]; flags: string[]; summary: string };
const mean = (values: number[]) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100 : null;

// PHQ-2 或 GAD-2 任一 ≥3 分时的提示。
export const XIONG_SCREEN_ADVICE = "有一项得分 ≥3 分：建议继续填写症状自评量表 SCL-90，并把结果带给医生进一步评估。";

// 只给出分数和需求说明里写明的筛查规则，不做诊断。
export function scoreXiongScale(scale: XiongScale, answers: readonly (number | null)[]): XiongScaleResult | null {
  if (answers.length !== scale.items.length || answers.some(answer => answer === null)) return null;
  const values = scale.items.map((item, index) => itemValue(item, answers[index] as number));
  if (scale.id === "screen") {
    const phq = values[0] + values[1], gad = values[2] + values[3];
    const flags = phq >= 3 || gad >= 3 ? [XIONG_SCREEN_ADVICE] : [];
    return { lines: [`PHQ-2：${phq} / 6`, `GAD-2：${gad} / 6`], flags, summary: `PHQ-2 ${phq} 分，GAD-2 ${gad} 分` };
  }
  if (scale.id === "scl90") {
    const total = values.reduce((a, b) => a + b, 0);
    const positive = values.filter(value => value >= 2).length;
    const factors = Object.entries(SCL90_FACTORS).map(([name, items]) => `${name} ${mean(items.map(n => values[n - 1]))}`);
    const flags = scl90Flags(values);
    return { lines: [`总分：${total}（90–450）`, `阳性项目数：${positive}`, `因子分：${factors.join("，")}`], flags, summary: `SCL-90 总分 ${total}，阳性项目 ${positive} 项` };
  }
  const groups = [...new Set(scale.items.map(item => item.group!))];
  const scored = values.map((value, index) => ({ value, group: scale.items[index].group! })).filter(item => item.value !== 9);
  const overall = mean(scored.map(item => item.value));
  const domains = groups.map(group => `${group} ${mean(scored.filter(item => item.group === group).map(item => item.value)) ?? "—"}`);
  return { lines: [`总均分：${overall ?? "—"}（0–6）`, `各部分均分：${domains.join("，")}`], flags: [], summary: `鼻结膜炎生存质量总均分 ${overall ?? "—"}` };
}

// SCL-90 中涉及自伤、伤人的题（题号从 1 开始），选“轻度”及以上即出求助提示。
export const SCL90_SELF_HARM_ITEMS = [15, 59] as const;
export const SCL90_HARM_OTHERS_ITEMS = [63] as const;
export function scl90Flags(values: readonly number[]) {
  const hit = (items: readonly number[]) => items.some(n => values[n - 1] >= 2);
  return [...(hit(SCL90_SELF_HARM_ITEMS) ? [XIONG_CRISIS_TEXT] : []), ...(hit(SCL90_HARM_OTHERS_ITEMS) ? [XIONG_HARM_OTHERS_TEXT] : [])];
}

export const XIONG_HARM_OTHERS_TEXT = "你提到有想打人或伤害他人的冲动。请先离开让你激动的场景，让信任的人陪着你，尽快联系精神心理专业人员；如果担心马上会伤害别人或自己，请立即拨打 110 或 120，也可以拨打全国心理援助热线 12356。";
export const XIONG_CRISIS_TEXT = "你提到有想结束自己生命或常想到死亡的念头，这需要认真对待。请让信任的人陪在身边，尽快联系精神心理专业人员；如果此刻有伤害自己的冲动或计划，请立即拨打 120 或 110，也可拨打全国心理援助热线 12356。";

// ---- 记录 ----
export type XiongIntakeEntry = {
  id: string; createdAt: string; kind: "intake";
  basic: Partial<Record<XiongBasicKey, string>>;
  chips: string[]; history: string;
  // 11-11 起：患者自述原话、选了“不清楚”的题、是否拍了舌象（照片另存本机，见 saveTonguePhoto）。
  complaint?: string; unsure?: string[]; tonguePhoto?: boolean; tongueConsentAt?: string;
  // 11-12 起：是否上传了鼻内镜照片（照片另存本机，同舌象）。
  endoscopePhoto?: boolean; endoscopeConsentAt?: string;
  doctor?: { turbinateLeft: number | null; turbinateRight: number | null; observed: string[] };
};
export type XiongScaleEntry = { id: string; createdAt: string; kind: "scale"; scale: XiongScaleId; answers: number[]; summary: string; activities?: string[] };
export type XiongEntry = XiongIntakeEntry | XiongScaleEntry;

// 舌象照片单独存本机：账户同步每项上限 512KB，照片放不进记录里（服务器存放待公司定）。
const tongueKey = (id: string) => `xiong-tongue-v1:${id}`;
export function saveTonguePhoto(id: string, photo: string) {
  try { window.localStorage.setItem(tongueKey(id), photo); return true; } catch { return false; }
}
export function readTonguePhoto(id: string) {
  try { return window.localStorage.getItem(tongueKey(id)); } catch { return null; }
}
export function removeTonguePhoto(id: string) {
  try { window.localStorage.removeItem(tongueKey(id)); } catch { /* 隐私模式 */ }
}
// 鼻内镜照片同样只存本机（11-12）。
const endoscopeKey = (id: string) => `xiong-endoscope-v1:${id}`;
export function saveEndoscopePhoto(id: string, photo: string) {
  try { window.localStorage.setItem(endoscopeKey(id), photo); return true; } catch { return false; }
}
export function readEndoscopePhoto(id: string) {
  try { return window.localStorage.getItem(endoscopeKey(id)); } catch { return null; }
}
// 删除记录时把这条记录的舌象、鼻内镜照片一起清掉。
export function removeIntakePhotos(id: string) {
  removeTonguePhoto(id);
  try { window.localStorage.removeItem(endoscopeKey(id)); } catch { /* 隐私模式 */ }
}

export function researchId(date = new Date(), random = Math.random()) {
  const day = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `XDJ-${day}-${Math.floor(random * 0xffff).toString(16).toUpperCase().padStart(4, "0")}`;
}

export function intakeSummary(entry: XiongIntakeEntry) {
  const basic = XIONG_BASIC_FIELDS.filter(field => entry.basic[field.key]).map(field => `${field.label.replace(/（.*）/, "")}：${entry.basic[field.key]}`);
  const groups = XIONG_TCM_GROUPS.map(group => [group.title, group.chips.filter(chip => entry.chips.includes(chip))] as const).filter(([, chips]) => chips.length);
  const lines = [
    basic.length ? `一般资料：${basic.join("；")}` : "",
    entry.complaint?.trim() ? `患者自述：${entry.complaint.trim()}` : "",
    ...groups.map(([title, chips]) => `${title}：${chips.join("、")}`),
    entry.history.trim() ? `现病史：${entry.history.trim()}` : "",
    entry.unsure?.length ? `不清楚：${entry.unsure.length} 题，请医生面诊时询问` : "",
    entry.tonguePhoto ? "舌象照片：已拍（存于本设备）" : "",
    entry.endoscopePhoto ? "鼻内镜照片：已上传（存于本设备）" : "",
  ];
  const group = entry.doctor ? turbinateGroup(entry.doctor.turbinateLeft, entry.doctor.turbinateRight) : "";
  if (group) lines.push(`下鼻甲分度（医生填写）：左 ${entry.doctor!.turbinateLeft} 分，右 ${entry.doctor!.turbinateRight} 分，${group}`);
  if (entry.doctor?.observed.length) lines.push(`望闻问（医生填写）：${entry.doctor.observed.join("、")}`);
  return lines.filter(Boolean).join("\n");
}

// 就诊要点：本机拼成文字供复制给医生，不发给任何模型。
export function intakeVisitNotes(entry: XiongIntakeEntry) {
  return `鼻病与情志自填记录（${entry.id}，${entry.createdAt.slice(0, 10)}）\n${intakeSummary(entry)}`;
}

const csvCell = (value: string) => /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
// 导出给研究录入用，列名对应 CRF；不含任何身份信息。
export function entriesToCsv(entries: readonly XiongEntry[]) {
  const header = ["研究编号", "记录时间", "类型", ...XIONG_BASIC_FIELDS.map(field => field.label), ...XIONG_TCM_GROUPS.map(group => group.title), "现病史", "患者自述", "不清楚的题数", "舌象照片", "鼻内镜照片", "下鼻甲左", "下鼻甲右", "下鼻甲分组", "望闻问", "量表", "量表结果", "量表作答"];
  const rows = entries.map(entry => entry.kind === "intake"
    ? [entry.id, entry.createdAt, "自填表", ...XIONG_BASIC_FIELDS.map(field => entry.basic[field.key] ?? ""), ...XIONG_TCM_GROUPS.map(group => group.chips.filter(chip => entry.chips.includes(chip)).join("、")), entry.history, entry.complaint ?? "", String(entry.unsure?.length ?? ""), entry.tonguePhoto ? "已拍" : "", entry.endoscopePhoto ? "已上传" : "",
      String(entry.doctor?.turbinateLeft ?? ""), String(entry.doctor?.turbinateRight ?? ""), entry.doctor ? turbinateGroup(entry.doctor.turbinateLeft, entry.doctor.turbinateRight) : "", entry.doctor?.observed.join("、") ?? "", "", "", ""]
    : [entry.id, entry.createdAt, "量表", ...XIONG_BASIC_FIELDS.map(() => ""), ...XIONG_TCM_GROUPS.map(() => ""), "", "", "", "", "", "", "", "", "", XIONG_SCALES.find(scale => scale.id === entry.scale)?.title ?? entry.scale, entry.summary, entry.answers.join(" ") + (entry.activities?.some(Boolean) ? `（受限活动：${entry.activities.filter(Boolean).join("、")}）` : "")]);
  return "﻿" + [header, ...rows].map(row => row.map(cell => csvCell(String(cell))).join(",")).join("\n");
}

// 账户同步的数据来自用户本人，恢复时只保留结构正确的条目。
export function normalizeXiongEntries(value: unknown): XiongEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is XiongEntry => Boolean(item) && typeof item === "object" && typeof item.id === "string" && typeof item.createdAt === "string"
    && ((item.kind === "intake" && Array.isArray(item.chips) && typeof item.history === "string" && item.basic && typeof item.basic === "object")
      || (item.kind === "scale" && XIONG_SCALES.some(scale => scale.id === item.scale) && Array.isArray(item.answers) && typeof item.summary === "string")));
}
