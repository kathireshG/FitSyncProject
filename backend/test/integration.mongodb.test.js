const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");

const mongoUri = process.env.MONGODB_TEST_URI;

if (!mongoUri) {
  test("MongoDB integration tests require MONGODB_TEST_URI", { skip: true }, () => {});
} else {
  process.env.NODE_ENV = "development";
  process.env.MONGODB_URI = mongoUri;
  process.env.JWT_SECRET = "fitsync-integration-test-secret-at-least-32-characters";

  const mongoose = require("mongoose");
  const app = require("../src/app");
  const connectDatabase = require("../src/config/database");

  let server;
  let baseUrl;
  let firstToken;
  let secondToken;
  let firstWorkoutId;

  async function request(path, { method = "GET", token, body } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    return {
      response,
      body: text ? JSON.parse(text) : undefined,
    };
  }

  before(async () => {
    await connectDatabase();
    await mongoose.connection.db.dropDatabase();
    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase();
    }
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
  });

  test("readiness confirms the real MongoDB connection", async () => {
    const { response, body } = await request("/api/v1/readiness");
    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: "ready", database: "connected" });
  });

  test("users can register and passwords are never serialized", async () => {
    const first = await request("/api/v1/auth/register", {
      method: "POST",
      body: {
        name: "Integration User",
        email: "integration-one@example.com",
        password: "ValidPassword123!",
        height: 180,
        weight: 80,
      },
    });
    assert.equal(first.response.status, 201);
    assert.ok(first.body.token);
    assert.equal(first.body.user.password, undefined);
    firstToken = first.body.token;

    const second = await request("/api/v1/auth/register", {
      method: "POST",
      body: {
        name: "Second User",
        email: "integration-two@example.com",
        password: "ValidPassword123!",
      },
    });
    assert.equal(second.response.status, 201);
    secondToken = second.body.token;

    const duplicate = await request("/api/v1/auth/register", {
      method: "POST",
      body: {
        name: "Duplicate",
        email: "integration-one@example.com",
        password: "ValidPassword123!",
      },
    });
    assert.equal(duplicate.response.status, 409);
  });

  test("login rejects a wrong password and accepts the correct password", async () => {
    const rejected = await request("/api/v1/auth/login", {
      method: "POST",
      body: { email: "integration-one@example.com", password: "wrong-password" },
    });
    assert.equal(rejected.response.status, 401);

    const accepted = await request("/api/v1/auth/login", {
      method: "POST",
      body: {
        email: "integration-one@example.com",
        password: "ValidPassword123!",
      },
    });
    assert.equal(accepted.response.status, 200);
    assert.ok(accepted.body.token);
  });

  test("workout CRUD is persisted and isolated by owner", async () => {
    const created = await request("/api/v1/workouts", {
      method: "POST",
      token: firstToken,
      body: {
        exerciseName: "Running",
        caloriesBurned: 320,
        durationMinutes: 30,
        date: "2026-10-02T08:00:00.000Z",
      },
    });
    assert.equal(created.response.status, 201);
    firstWorkoutId = created.body.data._id;

    const ownList = await request("/api/v1/workouts", { token: firstToken });
    assert.equal(ownList.response.status, 200);
    assert.equal(ownList.body.data.length, 1);
    assert.deepEqual(ownList.body.pagination, {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    });

    const invalidPage = await request("/api/v1/workouts?page=0", { token: firstToken });
    assert.equal(invalidPage.response.status, 400);

    const otherList = await request("/api/v1/workouts", { token: secondToken });
    assert.equal(otherList.response.status, 200);
    assert.equal(otherList.body.data.length, 0);

    const forbiddenUpdate = await request(`/api/v1/workouts/${firstWorkoutId}`, {
      method: "PATCH",
      token: secondToken,
      body: { caloriesBurned: 999 },
    });
    assert.equal(forbiddenUpdate.response.status, 404);

    const updated = await request(`/api/v1/workouts/${firstWorkoutId}`, {
      method: "PATCH",
      token: firstToken,
      body: { caloriesBurned: 350 },
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.data.caloriesBurned, 350);
  });

  test("nutrition, progress, and dashboard records are persisted", async () => {
    const nutrition = await request("/api/v1/nutrition-entries", {
      method: "POST",
      token: firstToken,
      body: {
        foodName: "Oatmeal",
        calories: 280,
        proteinGrams: 10,
        date: "2026-10-02T09:00:00.000Z",
      },
    });
    assert.equal(nutrition.response.status, 201);

    const progress = await request("/api/v1/progress-entries", {
      method: "POST",
      token: firstToken,
      body: {
        date: "2026-10-03",
        weightKg: 79.5,
        bmi: 99,
        bodyFatPercentage: 18,
      },
    });
    assert.equal(progress.response.status, 201);
    assert.equal(progress.body.data.bmi, 24.54);
    assert.equal(progress.body.data.heightCm, 180);

    const profile = await request("/api/v1/users/me", {
      method: "PATCH",
      token: firstToken,
      body: { height: 175, weight: 77, goalWeight: 72 },
    });
    assert.equal(profile.response.status, 200);
    assert.equal(profile.body.user.goalWeight, 72);

    const progressList = await request("/api/v1/progress-entries?limit=1", {
      token: firstToken,
    });
    assert.equal(progressList.response.status, 200);
    assert.equal(progressList.body.data.length, 1);
    assert.equal(progressList.body.pagination.limit, 1);
    assert.ok(progressList.body.pagination.total >= 2);

    const dashboard = await request("/api/v1/dashboard/summary", { token: firstToken });
    assert.equal(dashboard.response.status, 200);
    assert.ok(dashboard.body.data);

    const regularUserAdminRequest = await request("/api/v1/users", { token: firstToken });
    assert.equal(regularUserAdminRequest.response.status, 403);
  });

  test("password reset token is single-use and the new password works", async () => {
    const forgot = await request("/api/v1/auth/forgot-password", {
      method: "POST",
      body: { email: "integration-one@example.com" },
    });
    assert.equal(forgot.response.status, 200);
    const resetToken = forgot.body.development.resetToken;
    assert.ok(resetToken);

    const reset = await request(`/api/v1/auth/reset-password/${resetToken}`, {
      method: "POST",
      body: { password: "NewValidPassword456!" },
    });
    assert.equal(reset.response.status, 200);

    const reused = await request(`/api/v1/auth/reset-password/${resetToken}`, {
      method: "POST",
      body: { password: "AnotherPassword789!" },
    });
    assert.equal(reused.response.status, 400);

    const login = await request("/api/v1/auth/login", {
      method: "POST",
      body: {
        email: "integration-one@example.com",
        password: "NewValidPassword456!",
      },
    });
    assert.equal(login.response.status, 200);
  });

  test("owners can delete their workout", async () => {
    const deleted = await request(`/api/v1/workouts/${firstWorkoutId}`, {
      method: "DELETE",
      token: firstToken,
    });
    assert.equal(deleted.response.status, 204);

    const list = await request("/api/v1/workouts", { token: firstToken });
    assert.equal(list.body.data.length, 0);
  });
}
