import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export function login(email, password) {
  const res = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email,
    password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status !== 200) {
    console.error(`Login failed for ${email}: ${res.status} ${res.body}`);
    return null;
  }

  const body = JSON.parse(res.body);
  return body.data?.accessToken || body.data?.token || null;
}

export function getTestUsers(count) {
  const users = [];
  for (let i = 1; i <= count; i++) {
    users.push({
      email: `loadtest+${i}@balancia.app`,
      password: 'LoadTest2026!',
    });
  }
  return users;
}
