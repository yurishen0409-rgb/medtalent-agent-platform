import test from "node:test";
import assert from "node:assert/strict";
import { buildXiongExtractPrompt, extractXiongChips, normalizeXiongVocabulary, registerXiongIntakeRoutes } from "./xiong-intake-routes.mjs";

const vocab = [{ title: "症状", chips: ["鼻塞", "耳鸣"] }, { title: "情志", chips: ["情绪正常", "情绪抑郁"] }];

function fakeApp() {
  const routes = {};
  return { routes, post: (path, ...handlers) => { routes[path] = handlers.at(-1); } };
}
async function call(handler, body) {
  let out, status = 200, error;
  await handler({ body }, { json: value => { out = value; }, status(code) { status = code; return this; } }, err => { error = err; });
  return { out, status, error };
}

test("熊老自述整理：只留词表里的条目原文", async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ chips: ["鼻塞", "鼻炎", "耳鸣", "鼻塞"] }) } }] }) });
  const env = { AI_API_KEY: "test-key", AI_API_URL: "https://example.test/v1/chat/completions", AI_MODEL: "m" };
  const result = await extractXiongChips({ text: "鼻子堵，耳朵响", vocab, env, fetchImpl });
  assert.deepEqual(result, { chips: ["鼻塞", "耳鸣"], configured: true });
  assert.match(buildXiongExtractPrompt(vocab), /不要下诊断/);
});

test("熊老自述整理：未配置模型照常逐项问；自伤表述返回求助原文；词表格式校验", async () => {
  const app = fakeApp();
  registerXiongIntakeRoutes(app, { env: {}, limit: () => (_req, _res, next) => next(), extractImpl: async () => ({ chips: [], configured: false }) });
  const handler = app.routes["/api/xiong/intake/extract"];
  const plain = await call(handler, { text: "鼻子堵", vocab });
  assert.deepEqual(plain.out, { chips: [], organized: false, alerts: [] });
  const risky = await call(handler, { text: "我不想活了", vocab });
  assert.match(risky.out.alerts.join(), /12356/);
  const empty = await call(handler, { text: " ", vocab });
  assert.equal(empty.error?.statusCode, 400);
  assert.throws(() => normalizeXiongVocabulary("x"), /词表格式无效/);
});
