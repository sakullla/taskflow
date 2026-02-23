import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import request from "supertest";

const testDbPath = fileURLToPath(new URL("../data/test.sqlite", import.meta.url));

process.env.NODE_ENV = "test";
process.env.TODO_DB_PATH = testDbPath;
rmSync(testDbPath, { force: true });

const { app } = await import("./server.js");
const api = request(app);

const userId = "test-user";

async function ensureBaseList(): Promise<string> {
  const listsRes = await api.get("/lists").set("x-user-id", userId);
  const existing = listsRes.body.find((item: { isDefault?: boolean; id: string }) => item.isDefault);
  if (existing) {
    return existing.id;
  }

  const created = await api
    .post("/lists")
    .set("x-user-id", userId)
    .send({ name: "Tasks", color: "#2563eb" });

  return created.body.id as string;
}

test("returns validation error shape when title is missing", async () => {
  await ensureBaseList();

  const response = await api.post("/tasks").set("x-user-id", userId).send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, "VALIDATION_ERROR");
  assert.equal(typeof response.body.error.message, "string");
});

test("creates and updates task via API", async () => {
  const listId = await ensureBaseList();

  const created = await api
    .post("/tasks")
    .set("x-user-id", userId)
    .send({ title: "Task from test", listId, priority: "normal" });

  assert.equal(created.status, 201);
  assert.equal(created.body.title, "Task from test");

  const patched = await api
    .patch(`/tasks/${created.body.id}`)
    .set("x-user-id", userId)
    .send({ isCompleted: true, isImportant: true });

  assert.equal(patched.status, 200);
  assert.equal(patched.body.isCompleted, true);
  assert.equal(patched.body.isImportant, true);
});

test("creates and fetches my-day entry", async () => {
  const listId = await ensureBaseList();

  const task = await api
    .post("/tasks")
    .set("x-user-id", userId)
    .send({ title: "My day test task", listId });

  assert.equal(task.status, 201);

  const addMyDay = await api
    .post("/my-day")
    .set("x-user-id", userId)
    .send({ taskId: task.body.id });

  assert.equal(addMyDay.status, 201);

  const dayView = await api.get("/my-day").set("x-user-id", userId);
  assert.equal(dayView.status, 200);
  assert.equal(Array.isArray(dayView.body.tasks), true);
  assert.equal(dayView.body.tasks.some((item: { id: string }) => item.id === task.body.id), true);
});
