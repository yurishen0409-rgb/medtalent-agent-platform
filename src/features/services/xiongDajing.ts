// 页面、专属提示和离线演示共用任务提供的摘要；不补写未经核实的资料。
export const xiongAgentName = "熊大经名中医传承智能体";
export const xiongBoundary = "支持鼻病与情志研究的理论渊源与辨治问答。可讲解文献所载学术内容、方名、组成和配伍思路并标出处，不能据此自行用药。不给剂量，不复述医案；用户说自己的症状或求方时，不判断、不选方、不加减，建议面诊。不判定个人是否鼻腔宽大或有情志问题。演示内容不替代诊疗。";
export const xiongReviewNote = "传承经典 · 守正创新";
export const xiongAcademicNotice = "本智能体内容仅供学术探讨与名老中医学术传承，不可替代线下四诊合参及专科辨证论治。";
export const xiongWelcome = `你好，这里是${xiongAgentName}。回复由人工智能生成，不是医生本人回复。${xiongAcademicNotice}\n\n可以问熊老的学说、方名、组成和配伍思路；不给剂量，不判断个人病情。查不到时会说明“没有找到依据”。`;
export const xiongQuestions = ["什么是鼻五度辨证？", "“形神合一”是指鼻腔与情志有什么关系？", "鼻腔宽大现在有分级标准吗？", "熊老治慢性鼻窦炎的思路是什么？", "吉雷通窍汤的配伍心法是什么？", "枢度和情志是什么关系？"];
// 旧预览数据库也展示本代 demo 配置；不迁移或改写已保存数据。
export function xiongDemoProfile<T extends { slug: string }>(doctor: T): T {
  return doctor.slug === "xiong-dajing" ? { ...doctor,
    name: xiongAgentName,
    specialty: "鼻病与情志多中心数据集 · 理论渊源与辨治",
    intro: `${xiongIdentity}${xiongBoundary}`,
    quickQuestions: xiongQuestions,
    accent: "#2F5553", accentSoft: "#FFFCF6",
  } : doctor;
}
export const xiongIdentity = "第二届全国名中医；熊氏耳鼻喉科第五代传人；成都中医药大学二级教授、博士生导师；享受国务院政府特殊津贴专家；第四、六批全国老中医药专家学术经验继承指导教师。";
export const xiongPending = "当前门诊、照片使用授权、现任学术任职：待确认。";

export const xiongSources = {
  hypothesis: "谢慧等，中医耳鼻喉科学研究杂志，2014，13(1)。",
  treatment: "谢艳等，北京中医药，2022，41(11)。",
  degrees: "宋红梅等，四川中医，2019，37(11)。",
  holography: "龚轩民、熊大经，中医临床研究，2023，15(34):141-145。",
  station: "新华财经，2025-11-03。",
  profile: "上海市虹口区人民政府网站，2023-09-22。",
  school: "成都中医药大学网站，2022-07-21。",
  lecture: "《国医讲堂：鼻全息五度辨证（上）》预告，上海市虹口区人民政府网站，2023-09-22。",
  degreesPaper: "张锋，田媛媛，许必芳，等。熊大经鼻部“五度辨证”思想及应用。中医杂志，2014，55(2):106-109（仅核到题录）。",
  sinusitis: "张勤修、刘敏，四川中医，2010，28(2)。",
  sinusitisReview: "刘子锋等，成都中医药大学学报，2023，46(5)。",
  formulaReport: "中国中医药报，2026-07-13。",
  rhinitis: "汤臣建等，四川中医，2022，40(1)。",
  wulong: "邓媛元等，四川中医，2014，32(3)。",
  anosmia: "满银环等，中医眼耳鼻喉杂志，2013，3(1)。",
  nasalObstruction: "中医眼耳鼻喉杂志，2014 年第 1 期，DOI 10.3969/j.issn.1674-9006.2014.01.001。",
  emotionFramework: "陈志凌，熊大经论鼻病与情志，中国中医药报，2026-07-13，第6版。",
};

export const xiongProfile = {
  name: "熊大经",
  honors: ["第二届全国名中医", "熊氏耳鼻喉科第五代传人", "国务院特贴专家"],
  intro: "熊大经教授是第二届全国名中医，“熊氏耳鼻喉科”第五代传人，国内首位中医耳鼻咽喉博士生导师，享受国务院政府特殊津贴专家，全国第四批、第六批名老中医师带徒师承指导老师，全国名中医工作室建设专家，四川省学术技术带头人，四川省卫生健康委员会首席专家，四川省十大名中医，在国内率先组织创立中医五官专业（耳鼻喉部分负责），是中华中医药学会耳鼻咽喉分会主要筹建人之一，创建了四川省首个中医耳鼻咽喉科。",
  achievements: "熊老从事临床工作50余年，创新发展中医鼻科理论，首次提出“胆主窦窍，肺主鼻窍”的“胆肺学说”以及“鼻腔五度辨证”、“鼻全息论”，由他主持研发的鼻窦炎口服液、鼻渊舒口服液被《中国药典》收录，入医保基本药物目录；主持20余项科研项目，撰写包括《中医大辞典》、《医学百科全书耳鼻喉分卷》在内的40余部相关论著，发表论文100余篇，荣获多项奖励及荣誉称号；主持撰写多项国家标准，主编普通高等教育中医药类“十二五”、“十三五”规划教材，入选《中国中医药年鉴》。是现代中医耳鼻喉科学科创建者，促进了中国中医耳鼻咽喉科学术发展。",
  academic: "成都中医药大学二级教授、博士生导师；第四、六批全国老中医药专家学术经验继承指导教师。",
  lineage: ["2025-10-31 全国名中医传承工作站在杭州市中医院丁桥院区揭牌。", "陈志凌主任等三位弟子拜师。"],
  references: Object.values(xiongSources),
};

export type XiongPanel =
  | { kind: "herbs"; herbs: { name: string; related: string[]; note: string }[] }
  | { kind: "degrees"; cases: { tag: string; disease: string; text: string }[] }
  | { kind: "steps"; steps: { title: string; text: string }[] };
type XiongKnowledgeItem = { related?: string[]; basis?: string; promptNote?: string; panel?: XiongPanel; figures?: { src: string; alt: string; caption: string }[]; title: string; body: string; sources: string[]; note?: string; question?: string };
const xiongPanelText = (panel?: XiongPanel) => !panel ? ""
  : panel.kind === "herbs" ? panel.herbs.map(herb => `${herb.name}：${herb.note}`).join("") 
  : panel.kind === "degrees" ? panel.cases.map(item => `${item.tag}·${item.disease}：${item.text}`).join("")
  : panel.steps.map(step => `${step.title}：${step.text}`).join("");
// 页面不展示，仅供问答回答分度标准等问题。
export const xiongCollectionGroup: { title: string; description?: string; items: XiongKnowledgeItem[] } = { title: "采集规范", items: [
    { title: "鼻腔宽大描述", body: "拟记录中鼻甲、中鼻道、下鼻甲、下鼻道、总鼻道。中国中医药报 2026-07-13 文章有“鼻腔宽大 2 度”的用法。", sources: [], note: "这是采集规范讨论草案，不能当作现行分级标准，也不用于判断个人。", question: xiongQuestions[2] },
    { title: "量表候选", body: "量表正在讨论中。", sources: [], note: "不提供题目和评分，不开展个人测评。", question: "数据集量表选了哪些？" },
    { title: "图像采集", body: "拟记录设备、采集部位与角度、图像质量；图像不带可识别信息。", sources: [], note: "仅作规范讨论，不接真实上传。" },
    { title: "数据流程", body: "筛选：按纳入要求筛选资料；脱敏：去除可识别信息；质控：核查完整性与一致性；上传：仅描述后续环节；整合：统一字段口径；保存：明确保存要求；共享：明确使用与共享范围。", sources: [], note: "这里只作文字说明，平台未定，不接真实上传。" },
  ] };

export const xiongKnowledgeGroups: { title: string; description?: string; items: XiongKnowledgeItem[] }[] = [
  { title: "理论渊源", items: [
    { title: "鼻五度辨证", panel: { kind: "degrees", cases: [
      { tag: "血度、髓度", disease: "失嗅", text: "文献认为嗅区与血度、髓度密切相关，嗅觉与心、肾关系较为密切；所载治法为补肾养心、升清润燥、通利鼻窍。" },
      { tag: "气度", disease: "鼻窒", text: "文献按气度（下鼻甲、下鼻道）论治；所载证型为肺气不足，治法为补肺益气、散邪通窍。" },
    ] }, figures: [{ src: "", alt: "鼻腔矢状面图，标注血度、肉度、气度、枢度、髓度对应部位", caption: "五度与鼻腔部位对应图待提供" }], body: "气度：下鼻甲、下鼻道，肺\n枢度：中鼻甲、中鼻道，肝胆\n血度：鼻中隔，心\n肉度：鼻尖、鼻翼、鼻前庭，脾\n髓度：上鼻甲、鼻骨、鼻顶，肾", sources: [xiongSources.degrees, xiongSources.anosmia, xiongSources.nasalObstruction], promptNote: "写法差异：血度另有利特尔氏区；髓度 2014 年论文只写鼻顶；肉度 2014 年论文含外鼻。", question: xiongQuestions[0] },
    { title: "胆肺假说", body: "“胆主窦窍，肺主鼻窍”；胆肺同治。", sources: [xiongSources.hypothesis, xiongSources.treatment] },
    { title: "鼻全息论", body: "鼻窍包含脏腑信息，局部与整体含相同基本信息。", sources: [xiongSources.school, xiongSources.holography, xiongSources.lecture], promptNote: "公开讲座报道可查，稳定的完整回放未找到。" },
    { title: "形神合一：鼻腔与情志", figures: [{ src: "", alt: "鼻腔鼻窦及咽喉解剖图，标注上鼻甲、中鼻甲、下鼻甲等", caption: "鼻腔解剖图待提供" }], body: "中鼻甲缩小、中鼻道宽大进而表现为鼻腔宽大，常伴肝郁不舒、情志郁怒、性格暴躁；下鼻甲缩小、下鼻道及总鼻道宽大，常表现为悲忧、情绪低落或暴躁。作者说明病例有限，未总结程度关系。", sources: [xiongSources.holography], note: "中国中医药报 2026-07-13 文章有“鼻腔宽大 2 度”的用法。不用于判断个人是否鼻腔宽大，也不用于判断个人情绪或心理问题。", question: xiongQuestions[1] },
    { title: "辨治理论框架", body: "三方面核心内容：鼻五度辨证与情志；胆肺假说、调少阳枢机与情志；鼻腔宽大与情志。枢度与情志关联最紧密；提出“枢运转，清阳升，浊阴降，鼻窍通”。手术前后要关注情志状态。498 例鼻窦炎观察中 72.89% 属胆腑郁热证（文章转述）。", sources: [xiongSources.emotionFramework], question: xiongQuestions[5] },
  ] },
  { title: "理法", description: "本内容为文献记载之理法，不用于判断个人病情。", items: [
    { related: ["鼻渊·吉雷通窍汤", "鼻渊·用药心法", "鼻渊·核心药组"], title: "鼻渊（慢性鼻窦炎）·病机与治法", body: "病机：病邪留滞、清窍闭塞、正气不足、鼻塞伤脾。治法：宣肺、通窍、益气、排脓；研究归纳为通玄府、利枢机、和清窍。", sources: [xiongSources.sinusitis, xiongSources.sinusitisReview], question: xiongQuestions[3] },
    { related: ["鼻鼽·配伍心法"], title: "鼻鼽（过敏性鼻炎）·辨治思路", body: "重体质辨识，文献总结患者多属阳虚、气虚体质；以少阳为切入点；疏利肝胆，佐以益气健脾、温阳祛风。", sources: [xiongSources.rhinitis] },
    { related: ["鼻鼽·配伍心法"], title: "鼻鼽·从少阳论治", body: "文献载患者喷嚏、流涕、鼻痒多在清晨出现；熊教授认为凌晨 3 点到早上 9 点为少阳春生之气，病机上属少阳之气不升，以疏肝利胆、和解少阳为治则之一，采用小柴胡汤化裁。", sources: [xiongSources.rhinitis] },
    { title: "失嗅·辨治思路", body: "文献载熊老认为心主鼻而知香臭，心的气血阴阳亏虚或失衡是失嗅的重要致病因素，临证常从“心失所养”论治。", sources: [xiongSources.anosmia] },
    { related: ["鼻鼽·五龙颗粒"], title: "鼻鼽·五度辨治", body: "肉度应脾；肺脾同治，培土生金。", sources: [xiongSources.wulong] },
    { related: ["鼻鼽·配伍心法"], title: "鼻鼽·辨治路径", panel: { kind: "steps", steps: [
      { title: "首辨体质", text: "体质辨识放在首位；文献总结阳虚、气虚体质占多数，也有阴虚体质但相对较少。" },
      { title: "调少阳枢机", text: "从少阳论治，以疏肝利胆、和解少阳为治则之一。" },
      { title: "平情志", text: "临床观察总结患者超过半数伴焦虑抑郁状态，处方常佐以白芍、郁金、延胡索等理肝气之品。" },
    ] }, body: "文献所载的学术思路，供专业人员学习，不用于判断个人体质或病情，不能据此自行用药。", sources: [xiongSources.rhinitis] },
  ] },
  { title: "特色方药", description: "以下为文献记载的用药经验与历史方剂，供专业学术学习，切勿据此自行抓药或用药。", items: [
    { basis: "清胆泻热、芳香通窍", title: "鼻渊·吉雷通窍汤", question: xiongQuestions[4], body: "文献所载经验方，主要针对肝胆湿热证。组成（2010 年论文）：黄芩、柴胡、川芎、白芷、枳壳、瓜蒌、藿香。组成（2026 年报纸文章所载原方）：柴胡、黄芩、白芷、川芎、黄芪、炒枳壳、瓜蒌皮、藿香、地龙。作用：清胆泻热、芳香通窍。", sources: [xiongSources.sinusitis, xiongSources.formulaReport] },
    { basis: "肺脾同治，培土生金", title: "鼻鼽·五龙颗粒", body: "文献载验方五龙颗粒加减，含黄芪、白术、山药、大枣、桂枝、防风、五味子，配合僵蚕、地龙。", sources: [xiongSources.wulong] },
  ] },
  { title: "核心用药", description: "以下为文献记载的用药经验，供专业学术学习，切勿据此自行抓药或用药。", items: [
    { title: "鼻渊·用药心法", body: "文献记载巧用黄芪托里透脓排浊，巧用地龙。", sources: [xiongSources.sinusitis] },
    { basis: "通玄府、利枢机、和清窍", title: "鼻渊·核心药组", panel: { kind: "herbs", herbs: [
      { name: "黄芪", related: ["地龙", "桔梗"], note: "与桔梗为文中二项关联支持度最高的组合。地龙得黄芪可加大通窍之功，黄芪得地龙可增强补益之力。" },
      { name: "地龙", related: ["黄芪", "柴胡"], note: "取其通经活络之功，疏通经络、协助驱邪；与黄芪合用，文中认为三焦水液得通，少阳枢机通利。" },
      { name: "柴胡", related: ["黄芪", "地龙", "白芷"], note: "在黄芪、地龙基础上加入柴胡，能疏气机之郁滞，加强调节少阳枢机的能力。" },
      { name: "桔梗", related: ["黄芪"], note: "与黄芪为文中二项关联支持度最高的组合。" },
      { name: "白芷", related: ["柴胡", "黄芪", "地龙"], note: "在柴胡、黄芪、地龙基础上加白芷，文中认为玄府得开，鼻窍与胆腑建立联系。" },
      { name: "枳壳", related: [], note: "文中列为使用频次较高、关联较紧密的核心药物之一。" },
    ] }, body: "文献对 260 首处方做数据挖掘，黄芪、地龙、柴胡、桔梗、白芷、枳壳频次较高、关联更紧密，并认为验证了通玄府、利枢机、和清窍的学术思想。点药名可查看文中的配伍关系。文献所载内容，不能据此自行用药。", sources: [xiongSources.sinusitisReview, xiongSources.sinusitis] },
    { title: "鼻鼽·配伍心法", body: "文献认为地龙、僵蚕可协同使用，并记载其抗过敏和免疫抑制的药理研究。这是文献观点，不代表确定疗效。", sources: [xiongSources.rhinitis] },
  ] },
  { title: "传承与资料", items: [
    { title: "人物信息", body: xiongIdentity, sources: [xiongSources.school, xiongSources.profile, xiongSources.station] },
    { title: "传承工作站", body: "2025-10-31，全国名中医传承工作站在杭州市中医院丁桥院区揭牌。陈志凌主任等三位弟子拜师。", sources: [xiongSources.station] },
    { title: "学习班信息", body: "2026-11-21 杭州市中医院举办熊大经名中医鼻科理论传承与创新学习班。", sources: [], note: "该日期为学习班安排，不标为已举办。" },
    { title: "文献出处", body: "本智能体内容依据的公开文献。", sources: [xiongSources.hypothesis, xiongSources.treatment, xiongSources.degrees, xiongSources.degreesPaper, xiongSources.holography] },
  ] },
  { title: "传承发展：陈志凌主任（非熊老学说）", items: [
    { title: "神经免疫调节", body: "引入神经免疫调节机制。这是陈志凌主任的发展观点，不是熊大经本人学说。", sources: [], note: "没有找到依据，不展开解释。" },
  ] },
];

export const xiongPromptFacts = xiongKnowledgeGroups.flatMap(group => group.items.map(item =>
  `【${group.title}】${group.description || ""}${item.title}：${xiongPanelText(item.panel)}${item.body}${item.note || ""}${item.promptNote || ""} 出处：${item.sources.join(" ") || "未提供公开出处；不声称已有确认规范。"}`));

export function xiongDemoReply(question: string) {
  const text = String(question || "").trim();
  const personal = /我(?:的|有|得|患|最近|一直|现在|总是|经常|鼻|情绪|流|打喷嚏|能|可|适合)|本人|自己|家人|孩子|父亲|母亲|爸爸|妈妈/.test(text) && /鼻腔|鼻甲|鼻道|情绪|情志|暴躁|抑郁|焦虑|鼻塞|鼻炎|鼻窦炎|流涕|喷嚏|症状|诊断|能.*[吃用服]|适合/.test(text);
  const treatment = /该用什么|吃多少|[给帮替].{0,8}(开|选|配|荐|求|方|药)|求方|开方|开处方|我(?:想|要|能|可以).*(?:吃|用|服)|(?:方|药).*(?:适合我|给我|帮我)|吃什么药|用什么药|推荐.{0,6}(药|方)|适合.{0,8}(方|药)|[能可]以?.{0,3}(吃|服用)|怎么(加减|配药)|治疗方案/.test(text);
  const symptoms = /(?:鼻塞|流涕|喷嚏|鼻窦炎|鼻炎).*(?:怎么办|怎么治|[一二三四五六七八九十\d]+[天周月年])/.test(text);
  const gradingQuestion = text === xiongQuestions[2] || /分[度级].*标准|怎么分[度级]|[几二2]\s*度.*(标准|如何|怎么)/.test(text);
  const items = [...xiongKnowledgeGroups, xiongCollectionGroup].flatMap(group => group.items);
  const item = items.find(item => item.question === text || item.title === text || text === `我想进一步了解“${item.title}”。`)
    || (gradingQuestion ? items.find(item => item.title === "鼻腔宽大描述") : undefined)
    || (text.includes("吉雷") ? items.find(item => item.title === "鼻渊·吉雷通窍汤") : undefined)
    || (text.includes("五龙颗粒") ? items.find(item => item.title === "鼻鼽·五龙颗粒") : undefined)
    || (/慢性鼻窦炎.*(病机|治法|思路)/.test(text) ? items.find(item => item.title === "鼻渊（慢性鼻窦炎）·病机与治法") : undefined)
    || (/枢度.*情志/.test(text) ? items.find(item => item.title === "辨治理论框架") : undefined);
  const closing = xiongKnowledgeGroups.find(group => group.title === "理法")?.items.includes(item as XiongKnowledgeItem) ? "\n本内容为文献记载之理法，不用于判断个人病情。"
    : xiongKnowledgeGroups.some(group => ["特色方药", "核心用药"].includes(group.title) && group.items.includes(item as XiongKnowledgeItem)) ? "\n文献记载的用药经验，仅供专业学习与探讨，文献所载，不能据此自行用药。" : "";
  const asked = items.some(item => text === `我想进一步了解“${item.title}”。`);
  const content = treatment && !asked
    ? "不选方、不化裁、不给剂量。文献载有吉雷通窍汤等经验方，但本智能体不提供个人处方与用药指导，建议前往耳鼻喉科线下就诊。"
    : (personal || symptoms) && !asked
    ? "不判断、不选方、不加减，建议面诊。不能据此判定你或他人是否鼻腔宽大或有情志问题，也不能作个人诊断。"
    : gradingQuestion ? "分度标准：待提供（待熊老团队提供）。中国中医药报 2026-07-13 文章有“鼻腔宽大 2 度”的用法；量表名称待确认。\n出处：陈志凌，中国中医药报，2026-07-13，第6版。"
    : /剂量|用量|医案/.test(text) ? "不给剂量，不复述医案。"
    : item ? `${xiongPanelText(item.panel)}${item.body}${item.note ? `\n${item.note}` : ""}\n出处：${item.sources.join(" ") || "未提供公开出处。"}${closing}`
    : "没有找到依据。请围绕页面已列出的内容提问。";
  return `【演示回答：未接模型】\n${content}\n${xiongBoundary}\n如遇紧急情况，请立即拨打 120 或前往急诊；心理援助热线 12356。`;
}
