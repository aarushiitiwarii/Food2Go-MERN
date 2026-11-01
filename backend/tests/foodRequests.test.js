const { app, request, setupDb, teardownDb, signup, ngoByName } = require("./helpers");

let donorToken;
let ngoToken;

beforeAll(async () => {
  await setupDb();
  const ngo = await ngoByName("Akshaya Patra");
  donorToken = (await signup()).token;
  ngoToken = (await signup({ role: "ngo", ngoId: ngo.id })).token;
});

afterAll(teardownDb);

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe("Food requests", () => {
  test("donors cannot create food requests", async () => {
    const res = await request(app)
      .post("/api/food-requests")
      .set(auth(donorToken))
      .send({ foodNeeded: "Rice", location: "Andheri" });
    expect(res.status).toBe(403);
  });

  test("location is required", async () => {
    const res = await request(app).post("/api/food-requests").set(auth(ngoToken)).send({ foodNeeded: "Rice" });
    expect(res.status).toBe(400);
  });

  test("NGO posts a request and donors can see it", async () => {
    const created = await request(app)
      .post("/api/food-requests")
      .set(auth(ngoToken))
      .send({ foodNeeded: "50 lunch boxes", quantity: "50", location: "Bandra", notes: "Before 1pm" });
    expect(created.status).toBe(201);
    expect(created.body.ngoName).toBe("Akshaya Patra");

    const list = await request(app).get("/api/food-requests").set(auth(donorToken));
    expect(list.status).toBe(200);
    expect(list.body[0].foodNeeded).toBe("50 lunch boxes");
  });
});
