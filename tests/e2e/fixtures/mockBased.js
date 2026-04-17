// Network mocks for @weirdscience/based-client. The client hits:
//   POST /auth/signin | /auth/signup | /auth/signout | /auth/refresh
//   GET  /auth/me
//   GET/PUT /api/user_data/:id   (via useRecord / useMutation)
// We intercept everything headed at based.test.invalid and respond locally.

const BASED_URL = 'https://based.test.invalid';

const FAKE_USER = { id: 'user-test-1', email: 'e2e@example.com' };
const FAKE_TOKENS = { accessToken: 'access-token-xyz', refreshToken: 'refresh-token-xyz' };

/**
 * Install the default "happy path" mock: signin/signup succeed, /auth/me returns
 * the fake user when an Authorization header is present, user_data GETs are 404
 * (no server-side state), PUTs succeed.
 */
export async function mockBasedHappyPath(page) {
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

    if (path.startsWith('/api/user_data/')) {
      if (method === 'GET') {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'no row' } }),
        });
      }
      if (method === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { id: path.split('/').pop() } }),
        });
      }
    }

    return route.fulfill({
      status: 501,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'UNMOCKED', message: `${method} ${path}` } }),
    });
  });
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
