import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createAccountHandler } from '../server/accounts.mjs';

const SECRET = 'sk-test-grading-key';
const EXAM_ID = '11111111-1111-4111-8111-111111111111';

function exam(status = 'submitted') {
  return {
    id: EXAM_ID,
    mode: 'exam',
    status,
    startedAt: 1,
    updatedAt: 2,
    submittedAt: status === 'submitted' ? 3 : undefined,
    submissionReason: status === 'submitted' ? 'manual' : undefined,
    questionIds: ['1.2.1'],
    answers: { '1.2.1': { 'answer-1': { text: '把顾客评价分成正面和负面。' } } },
  };
}

async function start(fetchImpl) {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'aigraph-grading-')), 'accounts.json');
  const handle = createAccountHandler({ file, fetch: fetchImpl });
  const server = createServer((req, res) => { void handle(req, res); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return { server, file, port: typeof address === 'object' && address ? address.port : 0 };
}

async function call(port, url, { method = 'GET', body, cookie = '' } = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  const token = /aigraph_session=([^;]*)/.exec(response.headers.get('set-cookie') ?? '')?.[1] ?? '';
  return { status: response.status, payload, cookie: token ? `aigraph_session=${token}` : cookie };
}

async function captcha(port) {
  const issued = await call(port, '/api/auth/captcha');
  const code = [...issued.payload.svg.matchAll(/>([A-Z2-9])</g)].map(match => match[1]).join('');
  return { id: issued.payload.id, code };
}

async function login(port, username, password) {
  const image = await captcha(port);
  return call(port, username === 'admin' ? '/api/auth/login' : '/api/auth/register', {
    method: 'POST',
    body: { username, password, captchaId: image.id, captcha: image.code },
  });
}

test('only an admin can store an OpenAI-compatible model, and grading uses it without returning the key', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, authorization: init.headers.Authorization, body: JSON.parse(init.body) });
    const content = JSON.stringify({ items: [{ questionId: '1.2.1', suggestedPoints: 40, reason: '分类标准清楚。' }] });
    return new Response(JSON.stringify({ choices: [{ message: { content: `\`\`\`json\n${content}\n\`\`\`` } }] }), { status: 200 });
  };
  const { server, file, port } = await start(fetchImpl);
  try {
    const student = await login(port, 'learner2', 'learn-pass');
    assert.equal((await call(port, '/api/admin/model', { cookie: student.cookie })).status, 403);
    await call(port, '/api/learning/exams', { method: 'PUT', cookie: student.cookie, body: exam() });
    const unconfigured = await call(port, `/api/grading/exams/${EXAM_ID}`, { method: 'POST', cookie: student.cookie, body: {} });
    assert.equal(unconfigured.status, 400);

    const adminImage = await captcha(port);
    const admin = await call(port, '/api/auth/login', { method: 'POST', body: { username: 'admin', password: 'admin', captchaId: adminImage.id, captcha: adminImage.code } });
    const rejected = await call(port, '/api/admin/model', { method: 'PUT', cookie: admin.cookie, body: { baseUrl: 'javascript:alert(1)', model: 'demo', apiKey: SECRET } });
    assert.equal(rejected.status, 400);
    const saved = await call(port, '/api/admin/model', {
      method: 'PUT', cookie: admin.cookie,
      body: { baseUrl: 'http://127.0.0.1:9/v1', model: 'demo-model', apiKey: SECRET },
    });
    assert.equal(saved.status, 200);
    assert.equal(saved.payload.model.baseUrl, 'http://127.0.0.1:9/v1/chat/completions');
    assert.equal(saved.payload.model.keyHint, SECRET.slice(-4));
    assert.equal(JSON.stringify(saved.payload).includes(SECRET), false);

    const active = await call(port, '/api/learning/exams', { method: 'PUT', cookie: student.cookie, body: exam('active') });
    assert.equal(active.status, 200);
    assert.equal((await call(port, `/api/grading/exams/${EXAM_ID}`, { method: 'POST', cookie: student.cookie, body: {} })).status, 400);
    await call(port, '/api/learning/exams', { method: 'PUT', cookie: student.cookie, body: exam() });

    const graded = await call(port, `/api/grading/exams/${EXAM_ID}`, { method: 'POST', cookie: student.cookie, body: {} });
    assert.equal(graded.status, 200);
    assert.equal(graded.payload.assessment.total, 25);
    assert.equal(graded.payload.assessment.maxTotal, 25);
    assert.equal(graded.payload.assessment.provider, 'demo-model');
    assert.equal(graded.payload.assessment.items[0].reason, '分类标准清楚。');
    assert.equal(JSON.stringify(graded.payload).includes(SECRET), false);
    assert.equal(calls[0].url, 'http://127.0.0.1:9/v1/chat/completions');
    assert.equal(calls[0].authorization, `Bearer ${SECRET}`);
    assert.match(calls[0].body.messages[1].content, /把顾客评价分成正面和负面/);
    assert.equal(calls[0].body.model, 'demo-model');

    await call(port, '/api/learning/exams', { method: 'PUT', cookie: student.cookie, body: exam() });
    const kept = await call(port, '/api/learning', { cookie: student.cookie });
    assert.equal(kept.payload.record.exams[EXAM_ID].assessment.total, 25);
    assert.equal(JSON.stringify(kept.payload).includes(SECRET), false);

    const renamed = await call(port, '/api/admin/model', {
      method: 'PUT', cookie: admin.cookie,
      body: { baseUrl: 'http://127.0.0.1:9/v1', model: 'other-model', apiKey: '' },
    });
    assert.equal(renamed.payload.model.model, 'other-model');
    assert.equal(renamed.payload.model.keyHint, SECRET.slice(-4));
    await call(port, `/api/grading/exams/${EXAM_ID}`, { method: 'POST', cookie: student.cookie, body: {} });
    assert.equal(calls[1].body.model, 'other-model');
    assert.equal(calls[1].authorization, `Bearer ${SECRET}`);
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).llm.apiKey, SECRET);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
