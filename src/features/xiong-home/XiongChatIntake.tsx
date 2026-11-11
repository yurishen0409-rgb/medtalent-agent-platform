import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon, CameraIcon, CaretRightIcon, CheckIcon, MicrophoneIcon, ShieldCheckIcon, StopIcon } from "@phosphor-icons/react";
import { createWavRecorder } from "../../lib/wavRecorder";
import {
  buildXiongChatReport, buildXiongChatSteps, emptyXiongChatAnswers, stepId, toggleXiongChip, xiongAnswerText,
  XIONG_CHAT_PARTS, XIONG_CHAT_TEXT, followOf, XIONG_REGIONS, isXiongStepActive, xiongStepChips, xiongExclusiveIn, xiongChipLabel, type XiongChatAnswers, type XiongChatStep,
  XIONG_AREAS, XIONG_SURROUNDINGS, XIONG_OCCUPATIONS, XIONG_EDUCATION, XIONG_UNSURE, applyXiongPrefill, xiongBasicLine, xiongVocabulary, XIONG_TALK_GUIDE,
} from "./xiongChat";
import { researchId, removeTonguePhoto, saveTonguePhoto, XIONG_SCALES, XIONG_TCM_GROUPS, type XiongEntry, type XiongIntakeEntry, type XiongScaleEntry } from "./xiongIntake";

const STEPS = buildXiongChatSteps();
const SCREEN = XIONG_SCALES.find(scale => scale.id === "screen")!;
// 本人 11-11 定：界面不出现“入组研究以知情同意书为准”。
const CONSENT = "我了解：本表只用于整理就诊资料，供医生参考。";

type Draft = { step: number; answers: XiongChatAnswers };
// v5：11-11 基本情况改卡片、加自述和舌象，题序变了，旧草稿不再沿用。
const draftKey = (slug: string) => `xiong-chat-draft-v5:${slug}`;
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
// 11-11 本人补充：多句话一条一条出（部分开头每条前先出“正在输入”），气泡入场更明显，点按有墨晕。
const isOpening = (index: number) => index === 0 || (index < STEPS.length && STEPS[index].part !== STEPS[index - 1].part);
const reduceMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const wait = (ms: number) => reduceMotion() ? 0 : ms;

// 助手气泡去掉句末句号（本人 11-11 定）；求助卡、报告正文不经过这里，原文不动。
const plain = (line: string) => line.replace(/。$/, "");
// 熊老头像（本人 11-11 定加上；照片与首页同一张，来源见首页注明）。
const XIONG_AVATAR = "/assets/doctors/portraits/xiong-dajing.jpg";
function Avatar({ size }: { size: "head" | "chat" }) {
  return <span className={`xc-ava is-${size}`} aria-hidden="true"><img src={XIONG_AVATAR} alt="" /></span>;
}
function Bot({ lines, typing }: { lines: string[]; typing?: boolean }) {
  if (!lines.length && !typing) return null;
  return <div className="xc-bot-row">
    <Avatar size="chat" />
    <div className="xc-bot-col">
      {lines.map((line, index) => <div className="xc-bot" key={`${index}-${line}`}>{plain(line)}</div>)}
      {typing && <div className="xc-bot xc-typing" aria-label="正在输入"><i /><i /><i /></div>}
    </div>
  </div>;
}
// 选项字少时一行多放几个，按钮跟着变小（本人 11-11 定）。
const tagsClass = (labels: string[]) => {
  const longest = Math.max(0, ...labels.map(label => [...label].length));
  return `xc-tags${longest <= 2 ? " is-four" : longest <= 4 ? " is-three" : ""}`;
};

// 点按墨晕：在手指按下的位置晕开一圈浅竹青（减弱动态效果时不出）。
function inkAt(event: React.PointerEvent) {
  if (reduceMotion()) return;
  const button = (event.target as Element).closest("button");
  if (!button || (button as HTMLButtonElement).disabled) return;
  const box = button.getBoundingClientRect();
  const ink = document.createElement("span");
  ink.className = "xc-ripple";
  ink.setAttribute("aria-hidden", "true");
  ink.style.left = `${event.clientX - box.left}px`;
  ink.style.top = `${event.clientY - box.top}px`;
  ink.style.setProperty("--d", `${Math.max(box.width, box.height) * 2.2}px`);
  button.appendChild(ink);
  window.setTimeout(() => ink.remove(), 650);
}

// 回答气泡里的编号：单选题、量表题显示所选的序号（与答题按钮一致）。
function answerNumber(step: XiongChatStep, answers: XiongChatAnswers) {
  if (step.kind === "scale") { const answer = answers.screen[step.item]; return answer === null || answer === undefined ? null : answer + 1; }
  return null;
}

function Option({ index, label, on, onClick, delay }: { index: number; label: string; on?: boolean; onClick: () => void; delay: number }) {
  return <button type="button" className={`xc-op${on ? " is-on" : ""}`} aria-pressed={on} style={{ animationDelay: `${delay}ms` }} onClick={onClick}>
    <b>{index + 1}</b><span>{label}</span>
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

// 基本情况卡片：从底部弹出，一屏填完，都可以空着（本人 11-11 同意草图）。鼻腔宽大原因改由医生填写。
function Seg({ options, value, onChange, multi }: { options: readonly string[]; value: string[]; onChange: (value: string[]) => void; multi?: boolean }) {
  return <div className="xc-seg">{options.map(option => {
    const on = value.includes(option);
    return <button type="button" key={option} className={on ? "is-on" : ""} aria-pressed={on}
      onClick={() => onChange(on ? value.filter(item => item !== option) : multi ? [...value, option] : [option])}>{option}{on && " ✓"}</button>;
  })}</div>;
}

function BasicForm({ initial, onDone }: { initial: XiongChatAnswers["basic"]; onDone: (basic: XiongChatAnswers["basic"]) => void }) {
  const living = (initial.living ?? "").split("、").filter(Boolean);
  const [b, setB] = useState({ ...initial });
  const [area, setArea] = useState(living.filter(item => (XIONG_AREAS as readonly string[]).includes(item)));
  const [around, setAround] = useState(living.filter(item => XIONG_SURROUNDINGS.some(s => s.name === item) || item === "都还好"));
  const set = (key: keyof typeof b, value: string) => setB(current => ({ ...current, [key]: value }));
  const one = (key: keyof typeof b) => (value: string[]) => set(key, value[0] ?? "");
  const now = new Date().getFullYear();
  const years = Array.from({ length: now - 1925 }, (_, i) => String(now - i));
  const num = (value: string, min: number, max: number) => value === "" || (Number(value) >= min && Number(value) <= max);
  const valid = num(b.height ?? "", 100, 220) && num(b.weight ?? "", 25, 200);
  return <div className="xc-sheet" role="dialog" aria-label="填写基本情况">
    <h3>基本情况（1/3）</h3>
    <div className="xc-field"><span>性别</span><Seg options={["男", "女"]} value={b.sex ? [b.sex] : []} onChange={one("sex")} /></div>
    <label className="xc-field"><span>出生年份</span><select value={b.birthYear ?? ""} onChange={event => set("birthYear", event.target.value)}><option value="">请选择</option>{years.map(year => <option key={year}>{year}</option>)}</select></label>
    <div className="xc-field"><span>婚姻</span><Seg options={["已婚", "未婚", "其他"]} value={b.married ? [b.married] : []} onChange={one("married")} /></div>
    <label className="xc-field"><span>职业</span><select value={b.occupation ?? ""} onChange={event => set("occupation", event.target.value)}><option value="">请选择</option>{[...XIONG_OCCUPATIONS, "其他"].map(item => <option key={item}>{item}</option>)}</select></label>
    <label className="xc-field"><span>文化程度</span><select value={b.education ?? ""} onChange={event => set("education", event.target.value)}><option value="">请选择</option>{XIONG_EDUCATION.map(item => <option key={item}>{item}</option>)}</select></label>
    <div className="xc-field"><span>身高体重</span><div className="xc-pair">
      <label><input inputMode="numeric" maxLength={3} value={b.height ?? ""} onChange={event => set("height", event.target.value.replace(/\D/g, ""))} aria-label="身高（厘米）" /> cm</label>
      <label><input inputMode="numeric" maxLength={3} value={b.weight ?? ""} onChange={event => set("weight", event.target.value.replace(/\D/g, ""))} aria-label="体重（公斤）" /> kg</label>
    </div></div>
    {!valid && <p className="xc-hint">身高请填 100–220，体重请填 25–200。</p>}
    <div className="xc-field"><span>住在哪</span><Seg options={XIONG_AREAS} value={area} onChange={setArea} /></div>
    <div className="xc-field"><span>周围环境</span><Seg multi options={[...XIONG_SURROUNDINGS.map(item => item.name), "都还好"]} value={around}
      onChange={value => setAround(value.includes("都还好") && !around.includes("都还好") ? ["都还好"] : value.filter(item => item !== "都还好" || value.length === 1))} /></div>
    <ul className="xc-field-hints">{XIONG_SURROUNDINGS.map(item => <li key={item.name}><b>{item.name}</b>：{item.hint}</li>)}</ul>
    <button type="button" className="xc-primary" disabled={!valid} onClick={() => onDone({ ...b, living: [...area, ...around].join("、") })}>填好了，下一部分</button>
  </div>;
}

// 先说哪里难受：按话筒说（转成文字后可改），或直接打字（本人 11-11 定）。
function ComplaintAnswer({ initial, busy, onDone }: { initial: string; busy: boolean; onDone: (text: string) => void }) {
  const [text, setText] = useState(initial);
  const [recording, setRecording] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);
  // 点一方面，在输入框里另起一行写上开头，引导患者按问诊顺序说全（本人 11-11 定）。
  const start = (name: string) => {
    setText(current => `${current.trim()}${current.trim() ? "\n" : ""}${name}：`);
    window.setTimeout(() => { const el = field.current; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 0);
  };
  const recorder = useMemo(() => createWavRecorder(setRecording), []);
  useEffect(() => () => { void recorder.cancel(); }, [recorder]);
  const toggle = async () => {
    setError("");
    if (!recording) { try { await recorder.start(); } catch (err) { setError(err instanceof Error ? err.message : "话筒暂时用不了，请打字。"); } return; }
    try {
      setWorking(true);
      const wav = await recorder.stop();
      if (!wav) return;
      const response = await fetch("/api/asr", { method: "POST", headers: { "Content-Type": "audio/wav" }, body: wav, signal: AbortSignal.timeout(100_000) });
      const data = await response.json().catch(() => ({})) as { text?: string; error?: string };
      if (!response.ok || !data.text?.trim()) throw new Error(response.status === 503 || /未配置/.test(data.error ?? "") ? "话筒暂时用不了，请先打字。" : data.error || "没有听清，请再说一次或打字。");
      setText(current => [current.trim(), data.text!.trim()].filter(Boolean).join("，"));
    } catch (err) { setError(err instanceof Error ? err.message : "没有听清，请再说一次或打字。"); }
    finally { setWorking(false); }
  };
  return <div className="xc-complaint">
    <button type="button" className={`xc-mic${recording ? " is-on" : ""}`} disabled={working || busy} onClick={() => void toggle()} aria-label={recording ? "说完了" : "按一下开始说"}>
      {recording ? <StopIcon size={26} weight="fill" /> : <MicrophoneIcon size={26} weight="duotone" />}
      <span>{recording ? "说完了，点这里" : working ? "正在转成文字" : "按一下开始说"}</span>
    </button>
    {error && <p className="xc-hint">{error}</p>}
    <div className="xc-guide" aria-label="可以说说这几方面">{XIONG_TALK_GUIDE.map(item => <button type="button" key={item.name} onClick={() => start(item.name)}>
      <b>{item.name}</b><small>{item.hint}</small></button>)}</div>
    <textarea ref={field} rows={5} maxLength={1000} value={text} placeholder="如：鼻子堵了半年，早晚打喷嚏，晚上睡不好" onChange={event => setText(event.target.value)} aria-label="哪里难受" />
    <button type="button" className="xc-primary" disabled={!text.trim() || busy || recording || working} onClick={() => onDone(text.trim())}>{busy ? "正在整理，请稍候" : "说好了，下一步"}</button>
  </div>;
}

// 舌象拍照：先勾授权，再拍；压缩到 720px 以内的 JPEG（本人 11-11 定要采集舌象）。
async function compressPhoto(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = url; });
    const scale = Math.min(1, 720 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally { URL.revokeObjectURL(url); }
}

function TongueAnswer({ initial, consented, onDone }: { initial?: string; consented: boolean; onDone: (photo: string, consentAt: string) => void }) {
  const [agree, setAgree] = useState(consented);
  const [photo, setPhoto] = useState(initial ?? "");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const pick = async (file?: File) => {
    if (!file) return;
    setError("");
    try { setPhoto(await compressPhoto(file)); } catch { setError("照片读取失败，请重拍。"); }
  };
  return <div className="xc-tongue">
    <label className="xc-agree"><input type="checkbox" checked={agree} onChange={event => setAgree(event.target.checked)} /> 同意上传舌象照片，仅供医生面诊参考</label>
    <input ref={input} type="file" accept="image/*" capture="user" hidden onChange={event => void pick(event.target.files?.[0])} />
    {photo ? <img className="xc-tongue-photo" src={photo} alt="舌象照片预览" /> : null}
    {error && <p className="xc-hint">{error}</p>}
    <button type="button" className={photo ? "xc-link" : "xc-primary"} disabled={!agree} onClick={() => input.current?.click()}><CameraIcon size={18} /> {photo ? "重拍" : "拍舌头照片"}</button>
    {photo && <button type="button" className="xc-primary" disabled={!agree} onClick={() => onDone(photo, new Date().toISOString())}>用这张，下一步</button>}
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

export function XiongChatIntake({ slug, entries, onSave, onRemove, onScales, onDoctor, onBack }: {
  slug: string;
  entries: readonly XiongEntry[];
  onSave: (entries: XiongEntry[]) => void;
  onRemove: (ids: string[]) => void;
  onScales: (start?: "scl90" | "rqlq") => void;
  onDoctor: () => void;
  onBack?: () => void;
}) {
  const initial = useMemo(() => readDraft(slug), [slug]);
  const last = useMemo(() => initial ? null : readReport(slug), [slug, initial]);
  const [step, setStep] = useState(initial?.step ?? (last ? STEPS.length : 0));
  const [answers, setAnswers] = useState<XiongChatAnswers>(initial?.answers ?? last?.answers ?? emptyXiongChatAnswers());
  const [resumed] = useState(Boolean(initial && initial.step > 0));
  // 当前题已出现几句；全部出完才出答题区。
  const [shown, setShown] = useState(0);
  const [menu, setMenu] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>(last?.savedIds ?? []);
  const [picked, setPicked] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(last?.savedIds[0] ?? null);
  const [busy, setBusy] = useState(false);
  // 做完的部分收成一行，点开再看（本人 11-11 同意草图）。
  const [expanded, setExpanded] = useState<number[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const current = STEPS[step] as XiongChatStep | undefined;
  const finished = step >= STEPS.length;

  useEffect(() => { if (!finished) writeDraft(slug, { step, answers }); }, [slug, step, answers, finished]);
  useEffect(() => {
    setPicked(null); setMenu(false);
    const total = STEPS[step]?.lines.length ?? 0;
    const opening = isOpening(step);
    // 部分开头：每句前“正在输入”0.6 秒；其余多句的题：每句间隔 0.35 秒；单句题直接出。
    const gap = wait(opening ? 600 : 350);
    let count = opening || total <= 1 ? 0 : 1;
    setShown(gap === 0 ? total : count);
    if (gap === 0 || count >= total) return;
    const timer = window.setInterval(() => {
      count += 1; setShown(count);
      if (count >= total) window.clearInterval(timer);
    }, gap);
    return () => window.clearInterval(timer);
  }, [step]);
  const typing = Boolean(current) && shown < current!.lines.length;
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end", behavior: reduceMotion() ? "auto" : "smooth" }); }, [step, shown]);

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
  // 自述整理：返回词表内条目，预先勾上；整理不出来就照常逐项问。
  const submitComplaint = async (text: string) => {
    setBusy(true);
    let picked: string[] = [];
    let alerts: string[] = [];
    let covered: string[] = [];
    try {
      const response = await fetch("/api/xiong/intake/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, vocab: xiongVocabulary() }), signal: AbortSignal.timeout(60_000) });
      const data = await response.json().catch(() => ({})) as { chips?: string[]; covered?: string[]; alerts?: string[] };
      if (response.ok) { picked = data.chips ?? []; alerts = data.alerts ?? []; covered = data.covered ?? []; }
    } catch { /* 网络中断：照常逐项问 */ }
    setBusy(false);
    setNotice(picked.length || covered.length ? "" : "接下来逐项问您，请照实点选。");
    commit(value => applyXiongPrefill({ ...value, complaint: text }, picked, alerts, covered));
  };
  const markUnsure = (id: string, clear: readonly string[], extra?: (value: XiongChatAnswers) => XiongChatAnswers) =>
    commit(value => { const next = { ...value, chips: value.chips.filter(chip => !clear.includes(chip)), unsure: [...(value.unsure ?? []).filter(item => item !== id), id] }; return extra ? extra(next) : next; }, XIONG_UNSURE);
  const dropUnsure = (value: XiongChatAnswers, id: string) => value.unsure?.includes(id) ? { ...value, unsure: value.unsure.filter(item => item !== id) } : value;
  const skip = () => {
    if (!current) return;
    const id = stepId(current);
    setAnswers(value => ({
      ...value,
      skipped: [...value.skipped.filter(item => item !== id), id],
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
    if (answers.chips.length || answers.history.trim() || answers.complaint?.trim() || answers.tongue || Object.keys(basic).length) {
      const id = researchId();
      const tonguePhoto = Boolean(answers.tongue && saveTonguePhoto(id, answers.tongue));
      saved.push({ id, createdAt: now, kind: "intake", basic, chips: answers.chips, history: answers.history.trim(),
        ...(answers.complaint?.trim() ? { complaint: answers.complaint.trim() } : {}), ...(answers.unsure?.length ? { unsure: answers.unsure } : {}),
        ...(tonguePhoto ? { tonguePhoto, tongueConsentAt: answers.tongueConsentAt } : {}) } satisfies XiongIntakeEntry);
    }
    const report = buildXiongChatReport(answers);
    if (answers.screen.every(answer => answer !== null)) {
      const summary = report.blocks.find(block => block.title === "情志初筛")!.lines[0].replace(" · ", "，");
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
    if (savedIds.length) { savedIds.forEach(removeTonguePhoto); onRemove(savedIds); }
    restart();
    setNotice("本机记录已清除。");
  };

  const latestScl90 = entries.find((entry): entry is XiongScaleEntry => entry.kind === "scale" && entry.scale === "scl90");
  const report = buildXiongChatReport(answers, latestScl90?.summary ?? null);
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
    switch (s.kind) {
      case "basic": return <BasicForm initial={answers.basic} onDone={basic => commit(v => ({ ...v, basic }))} />;
      case "complaint": return <ComplaintAnswer initial={answers.complaint ?? ""} busy={busy} onDone={text => void submitComplaint(text)} />;
      case "confirm": {
        // 核对页：整理出的条目按题列出，可点掉；已说清的题后面不再问，可点“再问一遍”。
        const vocab = xiongVocabulary();
        const rows = vocab.filter(item => item.chips.some(chip => answers.aiChips?.includes(chip)) || answers.covered?.includes(item.key));
        return <div className="xc-confirm">
          {rows.map(item => {
            const done = answers.covered?.includes(item.key);
            return <section key={item.key}>
              <header><b>{item.title}</b>{done ? <button type="button" className="xc-link" onClick={() => setAnswers(v => ({ ...v, covered: (v.covered ?? []).filter(key => key !== item.key) }))}>已说到 · 再问一遍</button> : <small>后面再核对</small>}</header>
              <div className="xc-tags">{item.chips.filter(chip => answers.aiChips?.includes(chip)).map(chip => {
                const on = answers.chips.includes(chip);
                const group = XIONG_TCM_GROUPS.find(g => g.chips.includes(chip))!;
                return <button type="button" key={chip} className={`xc-tag${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => setAnswers(v => ({ ...v, chips: toggleXiongChip(v.chips, group.title, chip) }))}>
                  <span>{xiongChipLabel(chip)}</span>{on && <CheckIcon className="xc-check" size={16} weight="bold" />}</button>;
              })}</div>
            </section>;
          })}
          <button type="button" className="xc-primary" onClick={() => commit(v => v)}>对的，继续</button>
        </div>;
      }
      case "tongue": return <TongueAnswer initial={answers.tongue} consented={Boolean(answers.tongueConsentAt)} onDone={(tongue, at) => commit(v => ({ ...v, tongue, tongueConsentAt: at }))} />;
      case "text": return <TextAnswer key={s.key} placeholder={s.placeholder} multiline initial={answers.history}
        onDone={value => commit(v => ({ ...v, history: value }))} />;
      case "tags": {
        const group = XIONG_TCM_GROUPS[s.group];
        const chips = xiongStepChips(s);
        const exclusive = xiongExclusiveIn(group.title, chips);
        const count = chips.filter(chip => answers.chips.includes(chip)).length;
        const ordered = exclusive ? [exclusive, ...chips.filter(chip => chip !== exclusive)] : chips;
        const id = stepId(s);
        const unsureOn = picked === XIONG_UNSURE || Boolean(answers.unsure?.includes(id));
        return <>
          {chips.some(chip => answers.aiChips?.includes(chip)) && <p className="xc-prefill">{XIONG_CHAT_TEXT.prefilled}</p>}
          <div className={tagsClass(ordered.map(xiongChipLabel))}>
            {s.cat === undefined && <button type="button" className={`xc-tag is-exclusive is-unsure${unsureOn ? " is-on" : ""}`} aria-pressed={unsureOn} onClick={() => markUnsure(id, chips)}><span>{XIONG_UNSURE}</span>{unsureOn && <CheckIcon className="xc-check" size={16} weight="bold" />}</button>}
            {ordered.map(chip => <button type="button" key={chip} className={`xc-tag${chip === exclusive ? " is-exclusive" : ""}${answers.chips.includes(chip) ? " is-on" : ""}`} aria-pressed={answers.chips.includes(chip)}
            onClick={() => setAnswers(v => ({ ...dropUnsure(v, id), chips: toggleXiongChip(v.chips, group.title, chip) }))}><span>{xiongChipLabel(chip)}</span>{answers.chips.includes(chip) && <CheckIcon className="xc-check" size={16} weight="bold" />}</button>)}</div>
          <button type="button" className="xc-primary xc-sticky" onClick={count ? () => commit(v => v) : skip}>{count ? <>选好了（已选 <span className="xc-count" key={count}>{count}</span> 项）</> : "这组先跳过"}</button>
        </>;
      }
      case "gate": {
        // 两层追问第一层：先选哪方面（可多选）；原有“正常”类条目单独一行放最上面，选了就进下一题。
        const group = XIONG_TCM_GROUPS[s.group];
        const follow = followOf(s);
        const id = stepId(s);
        const all = [...follow.cats.flatMap(cat => cat.chips), ...(follow.exit ? [follow.exit] : [])];
        const cats = answers.gates?.[id] ?? [];
        const exitOn = Boolean(follow.exit && answers.chips.includes(follow.exit));
        const unsureOn = picked === XIONG_UNSURE || Boolean(answers.unsure?.includes(id));
        const toggle = (cat: number) => setAnswers(v0 => {
          const v = dropUnsure(v0, id);
          const list = v.gates?.[id] ?? [];
          return { ...v, chips: follow.exit ? v.chips.filter(chip => chip !== follow.exit) : v.chips, gates: { ...v.gates, [id]: list.includes(cat) ? list.filter(c => c !== cat) : [...list, cat].sort() } };
        });
        const chooseExit = () => commit(v0 => {
          const v = dropUnsure(v0, id);
          const rest = v.chips.filter(chip => !all.includes(chip));
          const chips = xiongExclusiveIn(group.title, all) === follow.exit ? toggleXiongChip(rest, group.title, follow.exit!) : [...rest, follow.exit!];
          return { ...v, chips, gates: { ...v.gates, [id]: [] } };
        }, follow.exit);
        // 取消的分类，它下面已选的条目一并清掉。
        const confirm = () => commit(v0 => {
          const v = dropUnsure(v0, id);
          const chosen = (v.gates?.[id] ?? []).map(c => follow.cats[c].chips);
          const kept = new Set(chosen.flat());
          // 只有一项的分类，选了就把这一项记下（不再出第二屏）。
          const singles = chosen.filter(chips => chips.length === 1).map(chips => chips[0]);
          return { ...v, chips: [...new Set([...v.chips.filter(chip => !all.includes(chip) || kept.has(chip)), ...singles])] };
        });
        return <>
          {all.some(chip => answers.aiChips?.includes(chip)) && <p className="xc-prefill">{XIONG_CHAT_TEXT.prefilled}</p>}
          <div className="xc-tags">
            <button type="button" className={`xc-tag is-exclusive is-unsure${unsureOn ? " is-on" : ""}`} aria-pressed={unsureOn} onClick={() => markUnsure(id, all, v => ({ ...v, gates: { ...v.gates, [id]: [] } }))}>
              <span>{XIONG_UNSURE}</span>{unsureOn && <CheckIcon className="xc-check" size={16} weight="bold" />}</button>
            {follow.exit && <button type="button" className={`xc-tag is-exclusive${exitOn || picked === follow.exit ? " is-on" : ""}`} aria-pressed={exitOn} onClick={chooseExit}>
              <span>{follow.exit}</span>{(exitOn || picked === follow.exit) && <CheckIcon className="xc-check" size={16} weight="bold" />}</button>}
            {follow.cats.map((cat, c) => <button type="button" key={cat.name} className={`xc-tag${cats.includes(c) ? " is-on" : ""}`} aria-pressed={cats.includes(c)} onClick={() => toggle(c)}>
              <span>{cat.name}</span>{cats.includes(c) && <CheckIcon className="xc-check" size={16} weight="bold" />}</button>)}
          </div>
          <button type="button" className="xc-primary xc-sticky" onClick={cats.length ? confirm : skip}>{cats.length ? <>选好了（已选 <span className="xc-count" key={cats.length}>{cats.length}</span> 类）</> : "这组先跳过"}</button>
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

  return <div className="xiong-chat" aria-label="健康问答" onPointerDown={inkAt}>
    {/* 窗口头：标题“健康问答”，加熊老头像（本人 11-11 定，替换 11-09 的“预问诊助手、无头像”）。 */}
    {/* 顶部只留标题和安全条；进度、稍后继续和“更多”收进右上角悬浮气泡（本人 11-11 定，草图见需求页第三十节）。 */}
    <header className="xc-head">{onBack && <button type="button" className="xc-back" onClick={onBack}><ArrowLeftIcon size={16} /> 返回</button>}<Avatar size="head" /><h2>健康问答</h2></header>
    <div className="xc-safety"><ShieldCheckIcon size={15} weight="duotone" /> 整理病情供医生参考，急症请立即拨打 120</div>
    <div className="xc-float-wrap">
      <button type="button" className="xc-float" aria-expanded={menu} aria-haspopup="dialog"
        aria-label={finished ? "三部分已完成，查看进度和更多操作" : `第 ${part + 1} 部分 ${XIONG_CHAT_PARTS[part]}，共 3 部分，查看进度和更多操作`}
        onClick={() => setMenu(open => !open)}>
        <span className="xc-ring" style={{ "--p": `${Math.round((finished ? 1 : step / STEPS.length) * 100)}%` } as React.CSSProperties} aria-hidden="true"><i /></span>
        {finished ? "已完成 ✓" : `${XIONG_CHAT_PARTS[part]} ${part + 1}/3`} ›
      </button>
      {menu && <>
        <button type="button" className="xc-dim" aria-label="收起" onClick={() => setMenu(false)} />
        <div className="xc-panel" role="dialog" aria-label="进度和更多操作">
          <ol>{XIONG_CHAT_PARTS.map((name, i) => {
            const state = finished || i < part ? "is-done" : i === part ? "is-current" : "";
            return <li key={name} className={state}><span aria-hidden="true">{state === "is-done" ? "✓" : i + 1}</span>{name}{state === "is-current" && <small>进行中</small>}</li>;
          })}</ol>
          {current && <button type="button" className="xc-panel-main" onClick={() => { setMenu(false); setNotice(XIONG_CHAT_TEXT.saved); }}>稍后继续</button>}
          <button type="button" onClick={() => { setMenu(false); onScales(); }}>量表测试</button>
          <button type="button" onClick={() => { setMenu(false); onDoctor(); }}>医生填写入口</button>
          <button type="button" onClick={() => { setMenu(false); if (window.confirm("重新开始将清空当前已填记录，确认重填吗？")) restart(); }}>重新开始</button>
        </div>
      </>}
    </div>
    {report.flags.length > 0 && <div className="xc-help" role="alert">{report.flags.flatMap(flag => flag.split(/\n+/)).map(line => <p key={line}>{line}</p>)}</div>}

    <div className="xc-log">
      {XIONG_CHAT_PARTS.map((name, p) => {
        const done = finished || p < part;
        const open = !done || expanded.includes(p);
        const turns = STEPS.map((s, i) => [s, i] as const).filter(([s, i]) => s.part === p && i < Math.min(step, STEPS.length) && isXiongStepActive(s, answers));
        if (!turns.length) return null;
        const brief = p === 0 ? xiongBasicLine(answers.basic) || "未填写" : p === 1 ? `已记 ${answers.chips.length} 项${answers.tongue ? " · 已拍舌象" : ""}` : `已答 ${answers.screen.filter(answer => answer !== null).length}/4 题`;
        return <div className="xc-part" key={name}>
          {done && <button type="button" className="xc-done" aria-expanded={open} onClick={() => setExpanded(list => list.includes(p) ? list.filter(item => item !== p) : [...list, p])}>
            <CheckIcon size={15} weight="bold" /> <b>{name}</b><span>{brief}</span><em>{open ? "收起" : "展开"} ›</em></button>}
          {open && turns.map(([s, i]) => {
        const shown = xiongAnswerText(s, answers);
        return <div className="xc-turn" key={stepId(s)}>
          <Bot lines={s.kind === "scale" ? [...s.lines, SCREEN.items[s.item].text] : s.lines} />
          {shown && <div className="xc-me">{answerNumber(s, answers) !== null && <em>{answerNumber(s, answers)}</em>}<span>{shown}</span></div>}
          {shown === "已跳过" && i === step - 1 && <Bot lines={[XIONG_CHAT_TEXT.skipped]} />}
        </div>;
          })}
        </div>;
      })}
      {current && <div className="xc-turn">
        {resumed && step === initial?.step && <Bot lines={[XIONG_CHAT_TEXT.resume]} />}
        <Bot lines={current.lines.slice(0, shown)} typing={typing && isOpening(step)} />
        {!typing && <div className="xc-zone" key={step}>{renderAnswerZone(current)}</div>}
      </div>}

      {finished && <div className="xc-turn">
        <Bot lines={[XIONG_CHAT_TEXT.report, ...(answers.skipped.length ? [XIONG_CHAT_TEXT.someSkipped] : [])]} />
        <article className="xc-report" aria-label="就诊报告">
          <header><b>就诊报告</b><small>{new Date().toISOString().slice(5, 10)} · 供医生参考{savedId ? ` · ${savedId}` : ""}</small></header>
          {report.blocks.map(block => <section key={block.title}><h4>{block.title}</h4>{block.lines.map(line => <p key={line}>{line}</p>)}</section>)}
          {answers.tongue && <figure className="xc-report-photo"><img src={answers.tongue} alt="舌象照片" /><figcaption>舌象照片</figcaption></figure>}
          {report.advice.map(line => <p className="xc-advice" key={line}>{line}</p>)}
        </article>
        <button type="button" className="xc-primary" onClick={() => void copy()}>复制报告全文</button>
        <Bot lines={[XIONG_CHAT_TEXT.scl90, XIONG_CHAT_TEXT.next]} />
        <div className="xc-zone">
          <Option index={0} label="做 SCL-90 心理自评" delay={0} onClick={() => onScales("scl90")} />
          <Option index={1} label="做鼻结膜炎生存质量问卷" delay={0} onClick={() => onScales("rqlq")} />
          <Option index={2} label="重新填写一份" delay={0} onClick={restart} />
        </div>
        <button type="button" className="xc-link" onClick={clearLocal}>清除本机记录</button>
      </div>}
      <div ref={endRef} />
    </div>

    {notice && <p className="xc-notice" role="status">{notice}</p>}
    {current && <nav className="xc-foot" aria-label="答题操作">
      <button type="button" disabled={step === 0} onClick={back}>‹ 改上一题</button>
      {current.kind !== "consent" && <button type="button" onClick={skip}>跳过</button>}
    </nav>}
    {/* 本人 11-11 定：处理方式不写在界面上；只说清存放位置。 */}
    <p className="xiong-privacy">记录保存在本设备；微信登录后同步到你的账户（存于本平台服务器）。语音和照片上传到本平台服务器整理。</p>
  </div>;
}
