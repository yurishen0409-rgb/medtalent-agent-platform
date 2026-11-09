import { useMemo, useState } from "react";
import { useDoctorLocalState } from "../../hooks/useDoctorLocalState";
import {
  entriesToCsv, intakeRedFlags, intakeVisitNotes, intakeSummary, normalizeXiongEntries, researchId, scoreXiongScale, turbinateGroup,
  RQLQ_ACTIVITIES, XIONG_BASIC_FIELDS, XIONG_DOCTOR_GROUPS, XIONG_INTAKE_SECTION, XIONG_SCALES, XIONG_TCM_GROUPS, XIONG_TURBINATE_SCORES,
  type XiongBasicKey, type XiongEntry, type XiongIntakeEntry, type XiongScale, type XiongScaleEntry,
} from "./xiongIntake";
import { XiongChatIntake } from "./XiongChatIntake";
import "./xiong-intake.css";

type Ask = (question: string) => void;

function useXiongEntries(slug: string) {
  const [raw, setRaw] = useDoctorLocalState<XiongEntry[]>(slug, XIONG_INTAKE_SECTION, []);
  const entries = useMemo(() => normalizeXiongEntries(raw), [raw]);
  return [entries, setRaw] as const;
}

function Chips({ chips, selected, onToggle }: { chips: readonly string[]; selected: readonly string[]; onToggle: (chip: string) => void }) {
  return <div className="xiong-chips">{chips.map(chip => <button key={chip} type="button" aria-pressed={selected.includes(chip)} className={selected.includes(chip) ? "is-on" : ""} onClick={() => onToggle(chip)}>{chip}</button>)}</div>;
}

function downloadCsv(entries: readonly XiongEntry[]) {
  const url = URL.createObjectURL(new Blob([entriesToCsv(entries)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = `熊大经_鼻腔宽大与情志_自填记录_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyNotes(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* 部分 WebView 不支持，改用旧方法 */ }
  const field = document.createElement("textarea");
  field.value = text; field.setAttribute("readonly", ""); field.style.position = "fixed"; field.style.opacity = "0";
  document.body.appendChild(field); field.select();
  const copied = document.execCommand("copy");
  field.remove();
  return copied;
}

const toggle = (list: string[], chip: string) => list.includes(chip) ? list.filter(item => item !== chip) : [...list, chip];

export function XiongIntakePanel({ slug }: { slug: string }) {
  const [entries, setEntries] = useXiongEntries(slug);
  const [basic, setBasic] = useState<Partial<Record<XiongBasicKey, string>>>({});
  const [chips, setChips] = useState<string[]>([]);
  const [history, setHistory] = useState("");
  const [left, setLeft] = useState<number | null>(null);
  const [right, setRight] = useState<number | null>(null);
  const [observed, setObserved] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [notice, setNotice] = useState("");
  const flags = intakeRedFlags(chips);
  const intakes = entries.filter((entry): entry is XiongIntakeEntry => entry.kind === "intake");
  const empty = !chips.length && !history.trim() && !Object.values(basic).some(Boolean);

  const save = () => {
    if (empty) { setNotice("请至少选择一个问诊关键词或填写一项内容。"); return; }
    const hasDoctor = left !== null || right !== null || observed.length > 0;
    const entry: XiongIntakeEntry = { id: researchId(), createdAt: new Date().toISOString(), kind: "intake", basic, chips, history: history.trim(), ...(hasDoctor ? { doctor: { turbinateLeft: left, turbinateRight: right, observed } } : {}) };
    setEntries(current => [entry, ...normalizeXiongEntries(current)].slice(0, 200));
    setBasic({}); setChips([]); setHistory(""); setLeft(null); setRight(null); setObserved([]);
    setNotice(`已保存，研究编号 ${entry.id}。`);
  };

  return <div className="xiong-workspace">
    <header className="xiong-ws-head">
      <h2>健康问答 · 鼻病与情志自填表</h2>
      <p>点选符合的表现即可，不用写姓名、电话和住址；保存后可复制就诊要点给医生。</p>
    </header>

    <section className="xiong-ws-card" aria-label="一般资料">
      <h3>一、一般资料</h3>
      <div className="xiong-fields">{XIONG_BASIC_FIELDS.map(field => <label key={field.key}><span>{field.label}</span>
        {field.type === "choice"
          ? <span className="xiong-choice">{field.options.map(option => <button key={option} type="button" aria-pressed={basic[field.key] === option} className={basic[field.key] === option ? "is-on" : ""} onClick={() => setBasic(current => ({ ...current, [field.key]: current[field.key] === option ? "" : option }))}>{option}</button>)}</span>
          : <input inputMode={field.type === "number" ? "numeric" : undefined} maxLength={60} placeholder={"placeholder" in field ? field.placeholder : ""} value={basic[field.key] ?? ""} onChange={event => setBasic(current => ({ ...current, [field.key]: event.target.value }))} />}
      </label>)}</div>
    </section>

    <section className="xiong-ws-card" aria-label="中医问诊">
      <h3>二、中医问诊（点选符合的表现）</h3>
      {XIONG_TCM_GROUPS.map(group => <div className="xiong-chip-group" key={group.title}><h4>{group.title}</h4><Chips chips={group.chips} selected={chips} onToggle={chip => setChips(current => toggle(current, chip))} /></div>)}
      <label className="xiong-history"><span>现病史（可补充起病时间、变化过程）</span><textarea maxLength={800} rows={3} value={history} onChange={event => setHistory(event.target.value)} placeholder="如：鼻塞三年，秋冬加重，近一月心烦易怒" /></label>
      {flags.length > 0 && <div className="xiong-alert" role="alert">{flags.map(flag => <p key={flag}>{flag}</p>)}</div>}
    </section>

    <details className="xiong-ws-card xiong-doctor-part">
      <summary>三、门诊检查（接诊医生填写，患者不用填）</summary>
      <div className="xiong-turbinate">{(["左侧", "右侧"] as const).map((side, index) => <label key={side}><span>下鼻甲 {side}</span>
        <select value={(index ? right : left) ?? ""} onChange={event => (index ? setRight : setLeft)(event.target.value === "" ? null : Number(event.target.value))}>
          <option value="">未检查</option>{XIONG_TURBINATE_SCORES.map((text, score) => <option key={text} value={score}>{text}</option>)}
        </select></label>)}
        {turbinateGroup(left, right) && <p>分组：{turbinateGroup(left, right)}</p>}
      </div>
      {XIONG_DOCTOR_GROUPS.map(group => <div className="xiong-chip-group" key={group.title}><h4>{group.title}</h4><Chips chips={group.chips} selected={observed} onToggle={chip => setObserved(current => toggle(current, chip))} /></div>)}
    </details>

    <label className="xiong-consent"><input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} /> 我了解：本表用于整理就诊和研究资料，不用于诊断；正式入组研究以医院的知情同意书为准。</label>
    <div className="xiong-actions">
      <button type="button" className="journey-primary-button" disabled={!agreed} onClick={save}>保存记录</button>
    </div>
    {notice && <p className="xiong-notice" role="status">{notice}</p>}
    <p className="xiong-privacy">记录保存在本设备；微信登录后同步到你的账户（存于本平台服务器）。自填记录和量表结果不会发给 AI。</p>

    <section className="xiong-ws-card" aria-label="我的记录">
      <header className="xiong-list-head"><h3>我的记录（{entries.length}）</h3>{entries.length > 0 && <button type="button" onClick={() => downloadCsv(entries)}>导出 CSV</button>}</header>
      {intakes.length ? intakes.map(entry => <article className="xiong-entry" key={entry.id}>
        <b>{entry.id}</b><small>{new Date(entry.createdAt).toLocaleString("zh-CN")}</small>
        <p>{intakeSummary(entry)}</p>
        <div className="xiong-entry-actions"><button type="button" onClick={() => void copyNotes(intakeVisitNotes(entry)).then(copied => setNotice(copied ? `已复制 ${entry.id} 的就诊要点，可粘贴给医生。` : "复制失败，请长按记录文字手动复制。"))}>复制就诊要点</button><button type="button" className="danger" onClick={() => window.confirm("确定删除这条记录吗？") && setEntries(current => normalizeXiongEntries(current).filter(item => item.id !== entry.id))}>删除</button></div>
      </article>) : <p className="xiong-empty">还没有自填记录。</p>}
    </section>
  </div>;
}

function ScaleForm({ scale, onDone, onCancel }: { scale: XiongScale; onDone: (answers: number[], activities: string[]) => void; onCancel: () => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => scale.items.map(() => null));
  const [activities, setActivities] = useState<string[]>(["", "", ""]);
  const left = answers.filter(answer => answer === null).length;
  return <div className="xiong-scale-form">
    <header className="xiong-ws-head"><h2>{scale.title}</h2><p>{scale.subtitle}。{scale.source}。</p></header>
    {scale.items.map((item, index) => {
      const activityIndex = scale.id === "rqlq" && index < 3 ? index : -1;
      return <fieldset className="xiong-scale-item" key={`${item.text}-${index}`}>
        <legend>{index + 1}. {activityIndex >= 0 ? <select aria-label={`选择受限活动 ${index + 1}`} value={activities[activityIndex]} onChange={event => setActivities(current => current.map((value, i) => i === activityIndex ? event.target.value : value))}><option value="">选择过去 7 天受鼻/眼症状限制的活动</option>{RQLQ_ACTIVITIES.map(name => <option key={name}>{name}</option>)}</select> : item.text}</legend>
        <div className="xiong-choice">{item.options.map((option, optionIndex) => <button key={option} type="button" aria-pressed={answers[index] === optionIndex} className={answers[index] === optionIndex ? "is-on" : ""} onClick={() => setAnswers(current => current.map((value, i) => i === index ? optionIndex : value))}>{option}</button>)}</div>
      </fieldset>;
    })}
    <div className="xiong-actions">
      <button type="button" className="journey-primary-button" disabled={left > 0} onClick={() => onDone(answers as number[], scale.id === "rqlq" ? activities : [])}>{left ? `还有 ${left} 题未答` : "查看结果并保存"}</button>
      <button type="button" onClick={onCancel}>返回</button>
    </div>
  </div>;
}

export function XiongScalePanel({ slug, initial }: { slug: string; initial?: XiongScale["id"] }) {
  const [entries, setEntries] = useXiongEntries(slug);
  const [active, setActive] = useState<XiongScale | null>(() => XIONG_SCALES.find(scale => scale.id === initial) ?? null);
  const [latest, setLatest] = useState<XiongScaleEntry | null>(null);
  const results = entries.filter((entry): entry is XiongScaleEntry => entry.kind === "scale");
  const detail = (entry: XiongScaleEntry) => { const scale = XIONG_SCALES.find(item => item.id === entry.scale)!; return { scale, result: scoreXiongScale(scale, entry.answers) }; };

  if (active) return <div className="xiong-workspace"><ScaleForm scale={active} onCancel={() => setActive(null)} onDone={(answers, activities) => {
    const result = scoreXiongScale(active, answers);
    if (!result) return;
    const entry: XiongScaleEntry = { id: researchId(), createdAt: new Date().toISOString(), kind: "scale", scale: active.id, answers, summary: result.summary, ...(activities.some(Boolean) ? { activities } : {}) };
    setEntries(current => [entry, ...normalizeXiongEntries(current)].slice(0, 200));
    setLatest(entry); setActive(null);
  }} /></div>;

  const shown = latest && detail(latest);
  return <div className="xiong-workspace">
    <header className="xiong-ws-head"><h2>量表测试</h2><p>量表结果只用于自我了解和研究记录，不能据此诊断，解读请交给医生。</p></header>
    {shown && shown.result && <section className="xiong-ws-card xiong-result" aria-label="本次结果">
      <h3>{shown.scale.title} · 本次结果</h3>{shown.result.lines.map(line => <p key={line}>{line}</p>)}
      {shown.result.flags.length > 0 && <div className="xiong-alert" role="alert">{shown.result.flags.map(flag => <p key={flag}>{flag}</p>)}</div>}
      <p className="xiong-privacy">结果不会发给 AI。分数含义请就诊时交给医生解读。</p>
    </section>}
    <div className="xiong-scale-list">{XIONG_SCALES.map(scale => <button key={scale.id} type="button" onClick={() => { setLatest(null); setActive(scale); }}><b>{scale.title}</b><small>{scale.subtitle} · {scale.duration}</small></button>)}</div>
    <section className="xiong-ws-card" aria-label="历史结果">
      <header className="xiong-list-head"><h3>历史结果（{results.length}）</h3>{entries.length > 0 && <button type="button" onClick={() => downloadCsv(entries)}>导出 CSV</button>}</header>
      {results.length ? results.map(entry => <article className="xiong-entry" key={entry.id}><b>{detail(entry).scale.title}</b><small>{entry.id} · {new Date(entry.createdAt).toLocaleString("zh-CN")}</small><p>{entry.summary}{entry.activities?.some(Boolean) && `；受限活动：${entry.activities.filter(Boolean).join("、")}`}</p>
        <div className="xiong-entry-actions"><button type="button" onClick={() => setLatest(entry)}>查看详情</button><button type="button" className="danger" onClick={() => window.confirm("确定删除这条结果吗？") && setEntries(current => normalizeXiongEntries(current).filter(item => item.id !== entry.id))}>删除</button></div></article>)
        : <p className="xiong-empty">还没有量表结果。</p>}
    </section>
  </div>;
}

// 健康问答：患者端只有“问答填写 / 量表测试”两个入口；原表格版收为医生端小入口（本人 11-09 定），
// 正式版应放进医生后台、登录后查看，见需求页第二十六节“医生端”。
export function XiongHealthPanel({ slug }: { slug: string }) {
  const [view, setView] = useState<"chat" | "scales" | "doctor">("chat");
  const [scaleStart, setScaleStart] = useState<XiongScale["id"] | undefined>();
  const [entries, setEntries] = useXiongEntries(slug);
  if (view === "doctor") return <div className="xiong-health">
    <div className="xiong-doctor-bar"><button type="button" onClick={() => setView("chat")}>‹ 返回问答</button><b>医生端 · 门诊记录（演示）</b></div>
    <XiongIntakePanel slug={slug} />
  </div>;
  return <div className="xiong-health">
    {view === "chat" && <XiongChatIntake slug={slug} entries={entries} onSave={saved => setEntries(current => [...saved, ...normalizeXiongEntries(current)].slice(0, 200))} onScl90={() => { setScaleStart("scl90"); setView("scales"); }} />}
    {view === "scales" && <XiongScalePanel key={scaleStart ?? "list"} slug={slug} initial={scaleStart} />}
    <button type="button" className="xiong-doctor-link" onClick={() => setView("doctor")}>医生填写入口 ›</button>
    <nav className="xiong-quick" aria-label="健康问答快捷入口">
      {([["chat", "问答填写"], ["scales", "量表测试"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={view === id} className={view === id ? "is-on" : ""} onClick={() => { setScaleStart(undefined); setView(id); }}>{label}</button>)}
    </nav>
  </div>;
}

export type XiongLecture = { title: string; source: string; href?: string; cover?: string; questions: string[] };
// 名家讲堂：已公开的放链接；熊老团队尚未提供的标“待提供”，不编造视频。
export const XIONG_LECTURES: { group: string; items: XiongLecture[] }[] = [
  { group: "公开讲课", items: [{ title: "小鼻子大健康：日常护鼻注意哪些", source: "CCTV4《健康中国》· 视频号 · 2026年6月7日", href: "https://weixin.qq.com/sph/ANwcSHDcpL", cover: "/assets/xiong/lecture-cover.jpg", questions: ["日常护鼻要注意哪些？", "肺开窍于鼻怎么理解？"] }] },
  { group: "学习班专题报告", items: [{ title: "《鼻全息及五度辨证》专题报告", source: "2025年10月31日 杭州市中医院“熊大经中医鼻科理论传承与创新学习班” · 视频待熊老团队提供", questions: ["什么是鼻五度辨证？", "鼻全息论讲的是什么？"] }] },
  { group: "鼻病与情志", items: [{ title: "鼻腔宽大与情志", source: "科普视频待熊老团队提供", questions: ["鼻腔宽大和情绪有什么关系？"] }] },
];

export function XiongLecturePage({ onAsk, onOpen }: { onAsk: Ask; onOpen: (lecture: XiongLecture, event: React.MouseEvent<HTMLAnchorElement>) => void }) {
  return <div className="xiong-lectures">
    {XIONG_LECTURES.map(section => <section key={section.group}><h3>{section.group}</h3>
      {section.items.map(item => <article className="xiong-lecture" key={item.title}>
        {item.href ? <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={event => onOpen(item, event)}>{item.cover && <img src={item.cover} alt="" />}<b>{item.title}</b></a> : <div className="xiong-lecture-pending"><span>视频待提供</span><b>{item.title}</b></div>}
        <small>{item.source}{item.cover && " · 封面图片来自公开渠道"}</small>
        <div className="xiong-chips">{item.questions.map(question => <button key={question} type="button" onClick={() => onAsk(question)}>问学：{question}</button>)}</div>
      </article>)}
    </section>)}
  </div>;
}
