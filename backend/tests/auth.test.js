const { app, request, setupDb, teardownDb, signup, ngoByName } = require("./helpers");

beforeAll(setupDb);
afterAll(teardownDb);

describe("Auth", () => {
  test("donor can sign up and gets a token, password is never returned", async () => {
    const { res } = await signup({ email: "donor@test.com" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("donor");
    expect(res.body.user.password).toBeUndefined();
  });

  test("duplicate email is rejected with 409", async () => {
    const { res } = await signup({ email: "donor@test.com" });
    expect(res.status).toBe(409);
  });

  test("NGO signup requires a valid NGO", async () => {
    const { res } = await signup({ role: "ngo" });
    expect(res.status).toBe(400);
  });

  test("NGO user is linked to the chosen NGO", async () => {
    const ngo = await ngoByName("Goonj");
    const { res } = await signup({ role: "ngo", ngoId: ngo.id });
    expect(res.status).toBe(201);
    expect(res.body.user.ngo.name).toBe("Goonj");
  });

  test("invalid input returns field errors", async () => {
    const res = await request(app).post("/api/auth/signup").send({ email: "bad", password: "1" });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  test("login works with the right password and fails with the wrong one", async () => {
    const ok = await request(app).post("/api/auth/login").send({ email: "donor@test.com", password: "secret123" });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeDefined();

    const bad = await request(app).post("/api/auth/login").send({ email: "donor@test.com", password: "wrong" });
    expect(bad.status).toBe(401);
  });

  test("donor cannot log in through the NGO login page", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "donor@test.com", password: "secret123", role: "ngo" });
    expect(res.status).toBe(403);
  });

  test("/me requires a valid token", async () => {
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
    expect((await request(app).get("/api/auth/me").set("Authorization", "Bearer nonsense")).status).toBe(401);

    const { token } = await signup();
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
