import { useEffect, useMemo, useRef, useState } from "react";
import { CaretRightIcon, CheckIcon, PencilSimpleIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import {
  buildXiongChatReport, buildXiongChatSteps, emptyXiongChatAnswers, stepId, toggleXiongChip, xiongAnswerText,
  XIONG_CHAT_PARTS, XIONG_CHAT_TEXT, XIONG_DECADES, XIONG_REGIONS, isXiongStepActive, xiongStepChips, XIONG_EXCLUSIVE_CHIPS, type XiongChatAnswers, type XiongChatStep,
} from "./xiongChat";
import { researchId, XIONG_BASIC_FIELDS, XIONG_SCALES, XIONG_TCM_GROUPS, type XiongEntry, type XiongIntakeEntry, type XiongScaleEntry } from "./xiongIntake";

const STEPS = buildXiongChatSteps();
const SCREEN = XIONG_SCALES.find(scale => scale.id === "screen")!;
const CONSENT = "我了解：本表用于整理就诊和研究资料，不用于诊断；正式入组研究以医院的知情同意书为准。";

type Draft = { step: number; answers: XiongChatAnswers };
const draftKey = (slug: string) => `xiong-chat-draft-v3:${slug}`;
function readDraft(slug: string): Draft | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(draftKey(slug)) ?? "null");
    return value && typeof value.step === "number" && value.answers?.basic ? value : null;
  } catch { return null; }
}
function writeDraft(slug: string, draft: Draft | null) {
  try { if (draft) window.localStorage.setItem(draftKey(slug), JSON.stringify(draft)); else window.localStorage.removeItem(draftKey(slug)); } catch { /* 隐私模式下只在本次页面里保留 */ }
}
// 最近一份报告另存本机：切到量表页再回来，先显示报告，不从第一题重来（需求页第二十九节，本人 11-10 定）。
type LastReport = { answers: XiongChatAnswers; savedIds: string[]; at: string };
const reportKey = (slug: string) => `xiong-chat-report-v1:${slug}`;
function readReport(slug: string): LastReport | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(reportKey(slug)) ?? "null");
    return value && value.answers?.basic && Array.isArray(value.savedIds) ? value : null;
  } catch { return null; }
}
function writeReport(slug: string, report: LastReport | null) {
  try { if (report) window.localStorage.setItem(reportKey(slug), JSON.stringify(report)); else window.localStorage.removeItem(reportKey(slug)); } catch { /* 同上 */ }
}
// 动效规则（11-10 本人定）：换题零等待；“正在输入”只在三个部分开头出现，≤0.6 秒；点选后约 0.25 秒进下一题。
const isOpening = (index: number) => index === 0 || (index < STEPS.length && STEPS[index].part !== STEPS[index - 1].part);
const reduceMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const wait = (ms: number) => reduceMotion() ? 0 : ms;

function Bot({ lines, typing }: { lines: string[]; typing?: boolean }) {
  if (typing) return <div className="xc-bot xc-typing" aria-label="正在输入"><i /><i /><i /></div>;
  return <>{lines.map((line, index) => <div className="xc-bot" key={`${index}-${line}`}>{line}</div>)}</>;
}

// 回答气泡里的编号：单选题、量表题显示所选的序号（与答题按钮一致）。
function answerNumber(step: XiongChatStep, answers: XiongChatAnswers) {
  if (step.kind === "scale") { const answer = answers.screen[step.item]; return answer === null || answer === undefined ? null : answer + 1; }
  if (step.kind === "choice") { const index = step.options.indexOf(answers.basic[step.key] ?? ""); return index >= 0 ? index + 1 : null; }
  return null;
}

function Option({ index, label, on, onClick, delay }: { index: number | "other"; label: string; on?: boolean; onClick: () => void; delay: number }) {
  return <button type="button" className={`xc-op${on ? " is-on" : ""}`} aria-pressed={on} style={{ animationDelay: `${delay}ms` }} onClick={onClick}>
    <b>{index === "other" ? <PencilSimpleIcon size={14} /> : index + 1}</b><span>{label}</span>
    {on ? <CheckIcon className="xc-arrow" size={16} weight="bold" /> : <CaretRightIcon className="xc-arrow" size={16} />}
  </button>;
}

function TextAnswer({ placeholder, multiline, initial, onDone }: { placeholder: string; multiline?: boolean; initial: string; onDone: (value: string) => void }) {
  const [value, setValue] = useState(initial);
  return <div className="xc-text">
    {multiline ? <textarea rows={3} maxLength={800} value={value} placeholder={placeholder} onChange={event => setValue(event.target.value)} />
      : <input maxLength={60} value={value} placeholder={placeholder} onChange={event => setValue(event.target.value)} />}
    <button type="button" className="xc-primary" disabled={!value.trim()} onClick={() => onDone(value.trim())}>确定</button>
  </div>;
}

function YearAnswer({ onDone }: { onDone: (year: string) => void }) {
  const [decade, setDecade] = useState<number | null>(null);
  const now = new Date().getFullYear();
  if (decade === null) return <div className="xc-grid xc-grid-4">{XIONG_DECADES.map(d => <button type="button" key={d} className="xc-cell" onClick={() => setDecade(d)}>{d} 年代</button>)}</div>;
  return <>
    <div className="xc-grid xc-grid-5">{Array.from({ length: 10 }, (_, i) => decade + i).filter(year => year <= now).map(year => <button type="button" key={year} className="xc-cell" onClick={() => onDone(String(year))}>{year}</button>)}</div>
    <button type="button" className="xc-link" onClick={() => setDecade(null)}>‹ 重选年代</button>
  </>;
}

function NumberAnswer({ unit, min, max, onDone }: { unit: string; min: number; max: number; onDone: (value: string) => void }) {
  const [value, setValue] = useState("");
  const number = Number(value);
  const valid = value !== "" && number >= min && number <= max;
  const press = (key: string) => setValue(current => key === "删" ? current.slice(0, -1) : (current + key).replace(/^0+/, "").slice(0, 3));
  return <div className="xc-number">
    <output className="xc-display">{value || "—"} <small>{unit}</small></output>
    {value !== "" && !valid && <p className="xc-hint">请输入 {min}–{max} 之间的数。</p>}
    <div className="xc-grid xc-grid-3">{["1", "2", "3", "4", "5", "6", "7", "8", "9", "删", "0"].map(key => <button type="button" key={key} className="xc-cell xc-key" onClick={() => press(key)}>{key}</button>)}
      <button type="button" className="xc-cell xc-key xc-primary" disabled={!valid} onClick={() => onDone(String(number))}>确定</button></div>
  </div>;
}

// 头面部图：点鼻、咽喉、耳、头眼颈，对应症状拆好的四道题（本人 11-09 定）。图下另有同样四个按钮，方便点按和读屏。
const REGION_ZONES: { region: number; shape: "ellipse" | "rect"; a: Record<string, number> }[] = [
  { region: 3, shape: "ellipse", a: { cx: 130, cy: 84, rx: 60, ry: 40 } },
  { region: 3, shape: "rect", a: { x: 102, y: 246, width: 56, height: 40, rx: 8 } },
  { region: 0, shape: "ellipse", a: { cx: 130, cy: 136, rx: 19, ry: 28 } },
  { region: 1, shape: "ellipse", a: { cx: 130, cy: 222, rx: 27, ry: 18 } },
  { region: 2, shape: "ellipse", a: { cx: 55, cy: 128, rx: 16, ry: 28 } },
  { region: 2, shape: "ellipse", a: { cx: 205, cy: 128, rx: 16, ry: 28 } },
];
const REGION_LABELS: { region: number; x: number; y: number; text: string; anchor: "start" | "middle" }[] = [
  { region: 3, x: 130, y: 66, text: "头 · 眼", anchor: "middle" }, { region: 3, x: 130, y: 271, text: "颈", anchor: "middle" },
  { region: 0, x: 156, y: 150, text: "鼻", anchor: "start" }, { region: 1, x: 162, y: 227, text: "咽喉", anchor: "start" }, { region: 2, x: 30, y: 92, text: "耳", anchor: "middle" },
];

function RegionsAnswer({ initial, onDone, onSkip }: { initial: number[]; onDone: (regions: number[]) => void; onSkip: () => void }) {
  const [picked, setPicked] = useState<number[]>(initial);
  const toggle = (region: number) => setPicked(list => list.includes(region) ? list.filter(r => r !== region) : [...list, region].sort());
  return <>
    <svg className="xc-map" viewBox="0 0 260 300" role="group" aria-label="头面部图，点选难受的部位">
      <g className="xc-map-line" aria-hidden="true">
        <ellipse cx="130" cy="122" rx="72" ry="90" />
        <ellipse cx="55" cy="128" rx="11" ry="22" /><ellipse cx="205" cy="128" rx="11" ry="22" />
        <path d="M92 110 q14 -9 28 0 M140 110 q14 -9 28 0" />
        <path d="M130 108 L121 152 Q130 158 139 152" />
        <path d="M112 180 Q130 190 148 180" />
        <path d="M102 206 L102 286 M158 206 L158 286 M102 268 Q60 278 26 298 M158 268 Q200 278 234 298" />
      </g>
      {REGION_ZONES.map((zone, i) => {
        const on = picked.includes(zone.region);
        const props = { ...zone.a, className: `xc-zone-hit${on ? " is-on" : ""}`, role: "button", tabIndex: 0, "aria-pressed": on, "aria-label": XIONG_REGIONS[zone.region].name,
          onClick: () => toggle(zone.region), onKeyDown: (event: React.KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(zone.region); } } };
        return zone.shape === "ellipse" ? <ellipse key={i} {...props} /> : <rect key={i} {...props} />;
      })}
      {REGION_LABELS.map(label => <text key={label.text} x={label.x} y={label.y} className={`xc-map-label${picked.includes(label.region) ? " is-on" : ""}`} textAnchor={label.anchor} aria-hidden="true">{label.text}{picked.includes(label.region) ? " ✓" : ""}</text>)}
    </svg>
    <div className="xc-tags">{XIONG_REGIONS.map((region, i) => <button type="button" key={region.name} className={`xc-tag${picked.includes(i) ? " is-on" : ""}`} aria-pressed={picked.includes(i)} onClick={() => toggle(i)}>
      <span>{region.name}</span>{picked.includes(i) && <CheckIcon className="xc-check" size={16} weight="bold" />}</button>)}</div>
    <button type="button" className="xc-primary xc-sticky" onClick={() => picked.length ? onDone(picked) : onSkip()}>{picked.length ? <>选好了（已选 <span className="xc-count" key={picked.length}>{picked.length}</span> 处）</> : "这组先跳过"}</button>
  </>;
}

export function XiongChatIntake({ slug, onSave, onRemove, onScales, onDoctor }: {
  slug: string;
  onSave: (entries: XiongEntry[]) => void;
  onRemove: (ids: string[]) => void;
  onScales: (start?: "rqlq") => void;
  onDoctor: () => void;
}) {
  const initial = useMemo(() => readDraft(slug), [slug]);
  const last = useMemo(() => initial ? null : readReport(slug), [slug, initial]);
  const [step, setStep] = useState(initial?.step ?? (last ? STEPS.length : 0));
  const [answers, setAnswers] = useState<XiongChatAnswers>(initial?.answers ?? last?.answers ?? emptyXiongChatAnswers());
  const [resumed] = useState(Boolean(initial && initial.step > 0));
  const [typing, setTyping] = useState(() => isOpening(initial?.step ?? 0));
  const [menu, setMenu] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>(last?.savedIds ?? []);
  const [picked, setPicked] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [returnTo, setReturnTo] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(last?.savedIds[0] ?? null);
  const endRef = useRef<HTMLDivElement>(null);
  const current = STEPS[step] as XiongChatStep | undefined;
  const finished = step >= STEPS.length;

  useEffect(() => { if (!finished) writeDraft(slug, { step, answers }); }, [slug, step, answers, finished]);
  useEffect(() => {
    setPicked(null); setWriting(false); setMenu(false);
    if (!isOpening(step)) { setTyping(false); return; }
    setTyping(true);
    const timer = window.setTimeout(() => setTyping(false), wait(600));
    return () => window.clearTimeout(timer);
  }, [step]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end", behavior: reduceMotion() ? "auto" : "smooth" }); }, [step, typing]);

  const advance = () => {
    if (returnTo !== null) { setStep(returnTo); setReturnTo(null); return; }
    setStep(value => value + 1);
  };
  const commit = (update: (value: XiongChatAnswers) => XiongChatAnswers, choice?: string) => {
    const apply = () => { setAnswers(value => { const next = update(value); return { ...next, skipped: next.skipped.filter(id => id !== stepId(current!)) }; }); advance(); };
    if (choice === undefined) { apply(); return; }
    setPicked(choice);
    window.setTimeout(apply, wait(250));
  };
  const setBasic = (key: string, value: string, choice?: string) => commit(value0 => ({ ...value0, basic: { ...value0.basic, [key]: value } }), choice);
  const skip = () => {
    if (!current) return;
    const id = stepId(current);
    setAnswers(value => ({
      ...value,
      skipped: [...value.skipped.filter(item => item !== id), id],
      ...("key" in current && current.key !== "history" ? { basic: { ...value.basic, [current.key]: "" } } : {}),
      ...(current.kind === "scale" ? { screen: value.screen.map((answer, i) => i === current.item ? null : answer) } : {}),
    }));
    advance();
  };
  const direction = useRef(1);
  const back = () => { direction.current = -1; setReturnTo(null); setStep(value => Math.max(0, value - 1)); };
  // 没点到的部位对应的症状题直接越过（往前翻时同样越过）。
  useEffect(() => {
    if (current && !isXiongStepActive(current, answers)) setStep(value => Math.min(STEPS.length, Math.max(0, value + direction.current)));
    else direction.current = 1;
  }, [current, answers]);

  const save = () => {
    const now = new Date().toISOString();
    const saved: XiongEntry[] = [];
    const basic = Object.fromEntries(Object.entries(answers.basic).filter(([, value]) => value));
    if (answers.chips.length || answers.history.trim() || Object.keys(basic).length) {
      saved.push({ id: researchId(), createdAt: now, kind: "intake", basic, chips: answers.chips, history: answers.history.trim() } satisfies XiongIntakeEntry);
    }
    const report = buildXiongChatReport(answers);
    if (answers.screen.every(answer => answer !== null)) {
      const summary = report.blocks[2].lines[0].replace(" · ", "，");
      saved.push({ id: researchId(), createdAt: now, kind: "scale", scale: "screen", answers: answers.screen as number[], summary } satisfies XiongScaleEntry);
    }
    if (saved.length) onSave(saved);
    setSavedId(saved[0]?.id ?? null);
    setSavedIds(saved.map(entry => entry.id));
    writeReport(slug, { answers, savedIds: saved.map(entry => entry.id), at: now });
    writeDraft(slug, null);
    setStep(STEPS.length);
  };
  const restart = () => { writeDraft(slug, null); writeReport(slug, null); setAnswers(emptyXiongChatAnswers()); setSavedId(null); setSavedIds([]); setNotice(""); setReturnTo(null); setStep(0); };
  // 共用手机时清掉这份报告和它存下的记录。
  const clearLocal = () => {
    if (!window.confirm("清除后本机将移除这份报告，请先复制保存。")) return;
    if (savedIds.length) onRemove(savedIds);
    restart();
    setNotice("本机记录已清除。");
  };

  const report = buildXiongChatReport(answers);
  const part = current?.part ?? 2;

  const copy = async () => {
    let copied = false;
    try { await navigator.clipboard.writeText(report.text); copied = true; } catch {
      const field = document.createElement("textarea");
      field.value = report.text; field.style.position = "fixed"; field.style.opacity = "0";
      document.body.appendChild(field); field.select(); copied = document.execCommand("copy"); field.remove();
    }
    setNotice(copied ? "报告已复制，可粘贴给医生。" : "复制失败，请长按报告文字手动复制。");
  };

  const renderAnswerZone = (s: XiongChatStep) => {
    const options = (list: readonly string[], key: string, other?: boolean) => <>
      {list.map((option, i) => <Option key={option} index={i} label={option} on={picked === option || (picked === null && answers.basic[key as keyof typeof answers.basic] === option)} delay={0} onClick={() => setBasic(key, option, option)} />)}
      {other && (writing ? <TextAnswer placeholder="请写下您的情况" initial="" onDone={value => { setBasic(key, value); setNotice(XIONG_CHAT_TEXT.other); }} />
        : <Option index="other" label="其他，我来写" delay={0} onClick={() => setWriting(true)} />)}
    </>;
    switch (s.kind) {
      case "choice": return options(s.options, s.key, s.other);
      case "year": return <YearAnswer onDone={year => setBasic("birthYear", year)} />;
      case "number": return <NumberAnswer key={s.key} unit={s.unit} min={s.min} max={s.max} onDone={value => setBasic(s.key, value)} />;
      case "text": return <TextAnswer key={s.key} placeholder={s.placeholder} multiline={s.key === "history"} initial={s.key === "history" ? answers.history : answers.basic[s.key] ?? ""}
        onDone={value => s.key === "history" ? commit(v => ({ ...v, history: value })) : setBasic(s.key, value)} />;
      case "multi": {
        const chosen = (answers.basic.living ?? "").split("、").filter(Boolean);
        const toggle = (option: string) => setAnswers(v => ({ ...v, basic: { ...v.basic, living: (chosen.includes(option) ? chosen.filter(o => o !== option) : [...chosen, option]).join("、") } }));
        return <>
          <div className="xc-tags">{s.options.map(option => <button type="button" key={option} className={`xc-tag${chosen.includes(option) ? " is-on" : ""}`} aria-pressed={chosen.includes(option)} onClick={() => toggle(option)}><span>{option}</span>{chosen.includes(option) && <CheckIcon className="xc-check" size={16} weight="bold" />}</button>)}</div>
          <button type="button" className="xc-primary xc-sticky" disabled={!chosen.length} onClick={advance}>{chosen.length ? <>选好了（已选 <span className="xc-count" key={chosen.length}>{chosen.length}</span> 项）</> : "请先选一项"}</button>
        </>;
      }
      case "summary": return <>
        <div className="xc-summary">{XIONG_BASIC_FIELDS.map(field => {
          const at = STEPS.findIndex(item => "key" in item && item.key === field.key);
          const shown = xiongAnswerText(STEPS[at], answers);
          return <div key={field.key}><span>{field.label.replace(/（.*）/, "")}</span><b className={shown && shown !== "已跳过" ? "" : "is-empty"}>{shown ?? "未填写"}</b>
            <button type="button" onClick={() => { setReturnTo(step); setStep(at); }}>改</button></div>;
        })}</div>
        <button type="button" className="xc-primary" onClick={advance}>核对好了，下一部分</button>
      </>;
      case "tags": {
        const group = XIONG_TCM_GROUPS[s.group];
        const chips = xiongStepChips(s);
        const exclusive = chips.includes(XIONG_EXCLUSIVE_CHIPS[group.title]) ? XIONG_EXCLUSIVE_CHIPS[group.title] : undefined;
        const count = chips.filter(chip => answers.chips.includes(chip)).length;
        const ordered = exclusive ? [exclusive, ...chips.filter(chip => chip !== exclusive)] : chips;
        return <>
          <div className="xc-tags">{ordered.map(chip => <button type="button" key={chip} className={`xc-tag${chip === exclusive ? " is-exclusive" : ""}${answers.chips.includes(chip) ? " is-on" : ""}`} aria-pressed={answers.chips.includes(chip)}
            onClick={() => setAnswers(v => ({ ...v, chips: toggleXiongChip(v.chips, group.title, chip) }))}><span>{chip}</span>{answers.chips.includes(chip) && <CheckIcon className="xc-check" size={16} weight="bold" />}</button>)}</div>
          <button type="button" className="xc-primary xc-sticky" onClick={count ? () => commit(v => v) : skip}>{count ? <>选好了（已选 <span className="xc-count" key={count}>{count}</span> 项）</> : "这组先跳过"}</button>
        </>;
      }
      case "scale": {
        const item = SCREEN.items[s.item];
        return <div className="xc-scale">
          <small>{item.group} · {SCREEN.subtitle.split("，")[0]}</small>
          <p>{item.text}</p>
          {item.options.map((option, i) => <Option key={option} index={i} label={option} on={picked === option || (picked === null && answers.screen[s.item] === i)} delay={0}
            onClick={() => commit(v => ({ ...v, screen: v.screen.map((answer, k) => k === s.item ? i : answer) }), option)} />)}
        </div>;
      }
      case "regions": return <RegionsAnswer key={step} initial={answers.regions ?? [0]} onSkip={skip}
        onDone={regions => commit(v => ({ ...v, regions }))} />;
      case "consent": return <>
        <p className="xc-consent">{CONSENT}</p>
        <Option index={0} label="我已了解，保存并生成报告" delay={0} onClick={save} />
      </>;
    }
  };

  return <div className="xiong-chat" aria-label="健康问答">
    {/* 窗口头：结构仿问学窗口，用“预问诊助手”身份、竹青色、无头像，和问学区分开（本人 11-09 定）。 */}
    <header className="xc-head">
      <div><h2>预问诊助手</h2><small><i aria-hidden="true" />诊前整理 · 交给医生参考</small></div>
      {/* 头部用文字按钮（老人认不出“…”图标）；“重新开始”收进“更多”，点后再确认（本人 11-10 定）。 */}
      {current && <button type="button" onClick={() => setNotice(XIONG_CHAT_TEXT.saved)}>稍后继续</button>}
      <button type="button" aria-expanded={menu} aria-haspopup="menu" onClick={() => setMenu(open => !open)}>更多</button>
      {menu && <div className="xc-menu" role="menu">
        <button type="button" role="menuitem" onClick={() => { setMenu(false); onScales(); }}>量表测试</button>
        <button type="button" role="menuitem" onClick={() => { setMenu(false); onDoctor(); }}>医生填写入口</button>
        <button type="button" role="menuitem" onClick={() => { setMenu(false); if (window.confirm("重新开始将清空当前已填记录，确认重填吗？")) restart(); }}>重新开始</button>
      </div>}
    </header>
    <div className="xc-safety"><ShieldCheckIcon size={15} weight="duotone" /> 整理病情供医生参考，急症请立即拨打 120</div>
    <ol className="xc-parts" aria-label={`第 ${part + 1} 部分 / 共 3 部分`}>
      {XIONG_CHAT_PARTS.map((name, i) => <li key={name} className={finished || i < part ? "is-done" : i === part ? "is-current" : ""}>{name}{(finished || i < part) && " ✓"}</li>)}
    </ol>
    {report.flags.length > 0 && <div className="xc-help" role="alert">{report.flags.map(flag => <p key={flag}>{flag}</p>)}</div>}

    <div className="xc-log">
      {STEPS.slice(0, Math.min(step, STEPS.length)).map((s, i) => !isXiongStepActive(s, answers) ? null : (() => {
        const shown = xiongAnswerText(s, answers);
        return <div className="xc-turn" key={stepId(s)}>
          <Bot lines={s.kind === "scale" ? [...s.lines, SCREEN.items[s.item].text] : s.lines} />
          {shown && <div className="xc-me">{answerNumber(s, answers) !== null && <em>{answerNumber(s, answers)}</em>}<span>{shown}</span></div>}
          {shown === "已跳过" && i === step - 1 && <Bot lines={[XIONG_CHAT_TEXT.skipped]} />}
        </div>;
      })())}
      {current && <div className="xc-turn">
        {resumed && step === initial?.step && <Bot lines={[XIONG_CHAT_TEXT.resume]} />}
        {typing ? <Bot lines={[]} typing /> : <Bot lines={current.lines} />}
        {!typing && <div className="xc-zone" key={step}>{renderAnswerZone(current)}</div>}
      </div>}

      {finished && <div className="xc-turn">
        <Bot lines={[XIONG_CHAT_TEXT.report, ...(answers.skipped.length ? [XIONG_CHAT_TEXT.someSkipped] : [])]} />
        <article className="xc-report" aria-label="就诊报告">
          <header><b>就诊报告</b><small>{new Date().toISOString().slice(5, 10)} · 供医生参考{savedId ? ` · ${savedId}` : ""}</small></header>
          {report.blocks.map(block => <section key={block.title}><h4>{block.title}</h4>{block.lines.map(line => <p key={line}>{line}</p>)}</section>)}
          {report.advice.map(line => <p className="xc-advice" key={line}>{line}</p>)}
        </article>
        <button type="button" className="xc-primary" onClick={() => void copy()}>复制报告全文</button>
        <Bot lines={[XIONG_CHAT_TEXT.next]} />
        <div className="xc-zone">
          <Option index={0} label="做鼻结膜炎生存质量问卷" delay={0} onClick={() => onScales("rqlq")} />
          <Option index={1} label="重新填写一份" delay={0} onClick={restart} />
        </div>
        <button type="button" className="xc-link" onClick={clearLocal}>清除本机记录</button>
      </div>}
      <div ref={endRef} />
    </div>

    {notice && <p className="xc-notice" role="status">{notice}</p>}
    {current && <nav className="xc-foot" aria-label="答题操作">
      <button type="button" disabled={step === 0} onClick={back}>‹ 改上一题</button>
      {current.kind !== "summary" && current.kind !== "consent" && <button type="button" onClick={skip}>跳过</button>}
    </nav>}
    <p className="xiong-privacy">记录保存在本设备；微信登录后同步到你的账户（存于本平台服务器）。自填记录和量表结果不会发给 AI。</p>
  </div>;
}
