const request = require("supertest");
const { app } = require("../server");

describe("GET /health", () => {
  it("deve retornar { ok: true }", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
