import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createAccountHandler } from '../server/accounts.mjs';

async function start() {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'aigraph-accounts-')), 'accounts.json');
  const handle = createAccountHandler({ file });
  const server = createServer((req, res) => { void handle(req, res); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return { server, port: typeof address === 'object' && address ? address.port : 0 };
}

async function call(port, url, { method = 'GET', body, cookie = '' } = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  const setCookie = response.headers.get('set-cookie') ?? '';
  const token = /aigraph_session=([^;]*)/.exec(setCookie)?.[1] ?? '';
  return { status: response.status, payload, cookie: token ? `aigraph_session=${token}` : '' };
}

async function captcha(port) {
  const issued = await call(port, '/api/auth/captcha');
  const code = [...issued.payload.svg.matchAll(/>([A-Z2-9])</g)].map(match => match[1]).join('');
  return { id: issued.payload.id, code };
}

test('admin can sign in, a student cannot open the admin overview, and records stay separate', async () => {
  const { server, port } = await start();
  try {
    const first = await captcha(port);
    const wrong = await call(port, '/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin', captchaId: first.id, captcha: 'XXXX' },
    });
    assert.equal(wrong.status, 400);
    const reused = await call(port, '/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin', captchaId: first.id, captcha: first.code },
    });
    assert.equal(reused.status, 400);

    const adminCaptcha = await captcha(port);
    const admin = await call(port, '/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin', captchaId: adminCaptcha.id, captcha: adminCaptcha.code },
    });
    assert.equal(admin.status, 200);
    assert.equal(admin.payload.user.role, 'admin');
    assert.equal(admin.payload.user.mustChangePassword, true);
    assert.equal(JSON.stringify(admin.payload).includes('hash'), false);

    const reserved = await captcha(port);
    const blocked = await call(port, '/api/auth/register', {
      method: 'POST',
      body: { username: 'admin', password: 'another-password', captchaId: reserved.id, captcha: reserved.code },
    });
    assert.equal(blocked.status, 400);

    const studentCaptcha = await captcha(port);
    const student = await call(port, '/api/auth/register', {
      method: 'POST',
      body: { username: '学员A', password: 'study-pass', captchaId: studentCaptcha.id, captcha: studentCaptcha.code },
    });
    assert.equal(student.status, 201);
    const denied = await call(port, '/api/admin/overview', { cookie: student.cookie });
    assert.equal(denied.status, 403);
    const saved = await call(port, '/api/learning/quiz', {
      method: 'PUT', cookie: student.cookie, body: { answers: { 'q-1': 1, 'drop-me': 3 } },
    });
    assert.deepEqual(saved.payload.quiz.answers, { 'q-1': 1 });
    const own = await call(port, '/api/learning', { cookie: student.cookie });
    assert.deepEqual(own.payload.record.quiz.answers, { 'q-1': 1 });
    const adminRecord = await call(port, '/api/learning', { cookie: admin.cookie });
    assert.deepEqual(adminRecord.payload.record.quiz.answers, {});

    const overview = await call(port, '/api/admin/overview', { cookie: admin.cookie });
    assert.equal(overview.status, 200);
    assert.equal(overview.payload.userCount, 2);
    assert.equal(overview.payload.users.find(user => user.username === '学员A').quizAnswered, 1);
    assert.equal(JSON.stringify(overview.payload).includes('study-pass'), false);

    const changed = await call(port, '/api/auth/password', {
      method: 'POST', cookie: admin.cookie, body: { currentPassword: 'admin', nextPassword: 'a-new-admin-pass' },
    });
    assert.equal(changed.status, 200);
    assert.equal(changed.payload.user.mustChangePassword, false);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
