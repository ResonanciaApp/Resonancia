import { beforeEach, describe, expect, it, vi } from "vitest";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";

type Category = {
  id: string; label: string; icon: string; iconFamily: string;
  color: string; sortOrder: number; active: boolean;
};
const state = vi.hoisted(() => ({
  role: "admin",
  rows: [] as Category[],
  originals: [
    { id: "gratitude", label: "Gratitud", icon: "cards-heart", iconFamily: "MaterialCommunityIcons", color: "#F075B3", sortOrder: 0, active: true },
    { id: "purpose", label: "Propósito", icon: "sprout", iconFamily: "MaterialCommunityIcons", color: "#5FCA81", sortOrder: 1, active: true },
    { id: "understanding", label: "Entendimiento", icon: "brain", iconFamily: "MaterialCommunityIcons", color: "#8B95EE", sortOrder: 2, active: false },
  ] as Category[],
}));

vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as { currentUser: { role: string } }).currentUser = { role: state.role };
    next();
  },
}));
vi.mock("../middlewares/requireRole", () => ({
  requireRole: (role: string) => (req: Request, res: Response, next: NextFunction) => {
    if ((req as unknown as { currentUser: { role: string } }).currentUser.role !== role) {
      res.status(403).end(); return;
    }
    next();
  },
}));
vi.mock("drizzle-orm", () => ({
  asc: (field: string) => field,
  eq: (field: string, value: unknown) => ({ field, value }),
}));
vi.mock("@workspace/db", () => {
  const columns = { id: "id", active: "active", sortOrder: "sortOrder" };
  const matches = (row: Category, condition?: { field: string; value: unknown }) =>
    !condition || row[condition.field as keyof Category] === condition.value;
  const db = {
    select: () => {
      let condition: { field: string; value: unknown } | undefined;
      const rows = () => state.rows.filter((row) => matches(row, condition))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
      const query = {
        from: () => query,
        where: (value: typeof condition) => { condition = value; return query; },
        for: async () => rows(),
        orderBy: async () => rows(),
        limit: async (count: number) => rows().slice(0, count),
        then: (resolve: (value: Category[]) => unknown) => Promise.resolve(rows()).then(resolve),
      };
      return query;
    },
    insert: () => ({
      values: (value: Category | Category[]) => ({
        onConflictDoNothing: async () => {
          for (const row of Array.isArray(value) ? value : [value]) {
            if (!state.rows.some((existing) => existing.id === row.id)) state.rows.push({ ...row });
          }
        },
        returning: async () => {
          const row = value as Category;
          if (state.rows.some((existing) => existing.id === row.id)) {
            throw Object.assign(new Error("duplicate"), { code: "23505" });
          }
          state.rows.push(row);
          return [row];
        },
      }),
    }),
    update: () => {
      let next: Partial<Category>;
      let condition: { field: string; value: unknown };
      return {
        set(value: Partial<Category>) { next = value; return this; },
        where(value: typeof condition) { condition = value; return this; },
        async returning() {
          const row = state.rows.find((item) => matches(item, condition));
          if (!row) return [];
          Object.assign(row, next);
          return [row];
        },
        then(resolve: (value: unknown) => unknown) {
          const row = state.rows.find((item) => matches(item, condition));
          if (row) Object.assign(row, next);
          return Promise.resolve(row).then(resolve);
        },
      };
    },
    transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback(db),
  };
  return {
    db, reflectionCategoriesTable: columns,
    INITIAL_REFLECTION_CATEGORIES: state.originals,
  };
});

import reflectionCategoriesRouter from "./reflection-categories";
const app = express();
app.use(express.json());
app.use("/api", reflectionCategoriesRouter);

describe("editorial reflection categories", () => {
  beforeEach(() => {
    state.role = "admin";
    state.rows = state.originals.map((row) => ({ ...row }));
  });

  it("lists visible and archived categories in editorial order", async () => {
    const response = await request(app).get("/api/reflection-categories").expect(200);
    expect(response.body.items.map((item: Category) => item.id)).toEqual(["gratitude", "purpose", "understanding"]);
    expect(response.body.items[2].active).toBe(false);
    expect(response.body.icons.some((icon: { name: string }) => icon.name === "sprout")).toBe(true);
  });

  it("restricts writes and rejects unsupported icons", async () => {
    state.role = "user";
    await request(app).post("/api/admin/reflection-categories")
      .send({ id: "courage", label: "Coraje" }).expect(403);
    state.role = "admin";
    await request(app).post("/api/admin/reflection-categories")
      .send({ id: "courage", label: "Coraje", icon: "not-an-icon" }).expect(400);
  });

  it("creates, edits and archives without deleting historical metadata", async () => {
    const created = await request(app).post("/api/admin/reflection-categories")
      .send({ id: "courage", label: "Coraje" }).expect(201);
    expect(created.body).toMatchObject({ id: "courage", active: true, sortOrder: 3 });
    await request(app).post("/api/admin/reflection-categories")
      .send({ id: "courage", label: "Otro" }).expect(409);
    await request(app).patch("/api/admin/reflection-categories/courage")
      .send({ label: "Valor", icon: "triangle", active: false }).expect(200)
      .expect((response) => expect(response.body).toMatchObject({ label: "Valor", iconFamily: "Feather", active: false }));
    const response = await request(app).get("/api/reflection-categories").expect(200);
    expect(response.body.items.find((item: Category) => item.id === "courage"))
      .toMatchObject({ label: "Valor", active: false });
  });

  it("will not archive the last selectable tab", async () => {
    await request(app).patch("/api/admin/reflection-categories/gratitude")
      .send({ active: false }).expect(200);
    await request(app).patch("/api/admin/reflection-categories/purpose")
      .send({ active: false }).expect(400);
    expect(state.rows.find((item) => item.id === "purpose")?.active).toBe(true);
  });

  it("requires a full unique reorder and preserves archived categories", async () => {
    await request(app).put("/api/admin/reflection-categories/order")
      .send({ ids: ["purpose", "gratitude"] }).expect(409);
    await request(app).put("/api/admin/reflection-categories/order")
      .send({ ids: ["purpose", "purpose", "understanding"] }).expect(400);
    const response = await request(app).put("/api/admin/reflection-categories/order")
      .send({ ids: ["understanding", "purpose", "gratitude"] }).expect(200);
    expect(response.body.items.map((item: Category) => item.id))
      .toEqual(["understanding", "purpose", "gratitude"]);
  });
});