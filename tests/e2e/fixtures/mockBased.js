// Network mocks for @weirdscience/based-client. The client hits:
//   POST /auth/signin | /auth/signup | /auth/signout | /auth/refresh
//   GET  /auth/me
//   GET/PUT /api/user_data/:id   (via useRecord / useMutation)
// We intercept everything headed at based.test.invalid and respond locally.

const BASED_URL = 'https://based.test.invalid';

const FAKE_USER = { id: 'user-test-1', email: 'e2e@example.com' };
const FAKE_TOKENS = { accessToken: 'access-token-xyz', refreshToken: 'refresh-token-xyz' };

/**
 * Install the default "happy path" mock: auth endpoints succeed, and
 * /api/user_data/:id behaves like a real REST store — GET 404s until a POST
 * creates a row, PUT 404s until the row exists. Rows live in-memory on the
 * mock and are returned to callers (and to the test via getMockRows).
 */
export async function mockBasedHappyPath(page) {
  const rows = new Map();
  const writes = [];

  await page.route(`${BASED_URL}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();

    if (path === '/auth/signin' && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { user: FAKE_USER, ...FAKE_TOKENS } }),
      });
    }

    if (path === '/auth/signup' && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { user: FAKE_USER, ...FAKE_TOKENS } }),
      });
    }

    if (path === '/auth/signout' && method === 'POST') {
      return route.fulfill({ status: 204, body: '' });
    }

    if (path === '/auth/me' && method === 'GET') {
      const auth = req.headers()['authorization'];
      if (!auth?.startsWith('Bearer ')) {
        return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'No token' } }) });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: FAKE_USER }),
      });
    }

    if (path === '/auth/refresh' && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: FAKE_TOKENS }),
      });
    }

    if (path === '/api/user_data' && method === 'POST') {
      // Insert (server-generated id). Not used by usePersistedState but kept
      // so the mock stays a faithful REST store.
      const body = JSON.parse(req.postData() || '{}');
      const id = body.id ?? `auto-${rows.size + 1}`;
      const stored = { ...body, id };
      rows.set(id, stored);
      writes.push({ op: 'insert', id, data: body.data });
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: stored }),
      });
    }

    if (path.startsWith('/api/user_data/')) {
      const id = decodeURIComponent(path.split('/').pop());
      if (method === 'GET') {
        const stored = rows.get(id);
        if (!stored) {
          return route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'no row' } }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: stored }),
        });
      }
      if (method === 'PUT') {
        // Upsert per RFC 7231 § 4.3.4: 201 on create, 200 on update.
        const body = JSON.parse(req.postData() || '{}');
        const existed = rows.has(id);
        const merged = existed
          ? { ...rows.get(id), ...body, id }
          : { ...body, id };
        rows.set(id, merged);
        writes.push({ op: existed ? 'update' : 'create', id, data: body.data });
        return route.fulfill({
          status: existed ? 200 : 201,
          contentType: 'application/json',
          body: JSON.stringify({ data: merged }),
        });
      }
    }

    return route.fulfill({
      status: 501,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'UNMOCKED', message: `${method} ${path}` } }),
    });
  });

  return {
    getRows: () => Array.from(rows.values()),
    getWrites: () => writes.slice(),
  };
}

/**
 * Sign-in endpoint returns 401. Other endpoints unmocked — add them as tests
 * need them.
 */
export async function mockBasedSignInFailure(page) {
  await page.route(`${BASED_URL}/auth/signin`, (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }),
    }),
  );
}

/**
 * Seed localStorage with a "logged in" Based session before the app boots.
 * Must be called before page.goto. The /auth/me mock from mockBasedHappyPath
 * will then confirm the session and the app will skip the login screen.
 */
export async function seedSignedInSession(page) {
  await page.addInitScript(
    ({ key, session }) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(session));
      } catch {
        // Storage blocked — the test will surface the failure via a visible login screen.
      }
    },
    {
      key: 'based.session',
      session: { user: FAKE_USER, ...FAKE_TOKENS },
    },
  );
}

export { FAKE_USER };
