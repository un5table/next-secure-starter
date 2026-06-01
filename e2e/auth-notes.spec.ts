import { test, expect } from "@playwright/test";

// These exercise the full stack and need a database + DEV_PASSWORD (the CI E2E job
// provisions a Neon branch and sets DEV_PASSWORD=dev). They are skipped by the
// default `ci` job and only run in the opt-in `e2e` job.

test("guest note ownership is enforced by the manage token", async ({
  request,
}) => {
  // `request` has no browser cookies — a true guest.
  const create = await request.post("/api/notes", {
    data: { title: "Guest note" },
  });
  expect(create.status()).toBe(201);
  const { note, manageToken } = await create.json();
  expect(note.id).toBeTruthy();
  expect(manageToken).toBeTruthy();

  // Without the token, editing is forbidden.
  const noToken = await request.patch(`/api/notes/${note.id}`, {
    data: { title: "hacked" },
  });
  expect(noToken.status()).toBe(403);

  // With the token, editing and deleting succeed.
  const withToken = await request.patch(
    `/api/notes/${note.id}?token=${encodeURIComponent(manageToken)}`,
    { data: { title: "renamed" } },
  );
  expect(withToken.status()).toBe(200);

  const del = await request.delete(
    `/api/notes/${note.id}?token=${encodeURIComponent(manageToken)}`,
  );
  expect(del.status()).toBe(204);
});

test("authenticated user creates and lists their own notes", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(`e2e+${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("dev"); // DEV_PASSWORD
  await page.getByRole("button", { name: /^sign in$/i }).click();

  await page.waitForURL("/");
  await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();

  // page.request shares the signed-in cookie jar.
  const create = await page.request.post("/api/notes", {
    data: { title: "My note" },
  });
  expect(create.status()).toBe(201);
  const { note, manageToken } = await create.json();
  expect(note.id).toBeTruthy();
  // Authenticated owners are matched by id — no guest token is issued.
  expect(manageToken).toBeUndefined();

  const list = await page.request.get("/api/notes");
  const { notes } = await list.json();
  expect(notes.some((n: { id: string }) => n.id === note.id)).toBe(true);
});
