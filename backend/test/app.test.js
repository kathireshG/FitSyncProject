const { before, after, test } = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/app");

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("health endpoint responds without requiring a database", async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "ok");
});

test("protected routes reject requests without a JWT", async () => {
  const response = await fetch(`${baseUrl}/api/v1/workouts`);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.message, "Authentication required");
});

test("unknown routes use the centralized error response", async () => {
  const response = await fetch(`${baseUrl}/api/v1/not-a-route`);
  assert.equal(response.status, 404);
  assert.match((await response.json()).error.message, /Route not found/);
});
