const { app, request, setupDb, teardownDb, signup, ngoByName } = require("./helpers");

let donorToken;
let donor2Token;
let ngoToken;
let otherNgoToken;

beforeAll(async () => {
  await setupDb();
  const akshaya = await ngoByName("Akshaya Patra");
  const cry = await ngoByName("CRY: Children Rights for You");
  donorToken = (await signup({ name: "Riya" })).token;
  donor2Token = (await signup({ name: "Kabir" })).token;
  ngoToken = (await signup({ role: "ngo", ngoId: akshaya.id })).token;
  otherNgoToken = (await signup({ role: "ngo", ngoId: cry.id })).token;
});

afterAll(teardownDb);

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const pickup = { building: "Green Towers", street: "Hill Road", city: "Mumbai" };

const pledge = (token, requestId, amount) =>
  request(app)
    .post(`/api/food-requests/${requestId}/donations`)
    .set(auth(token))
    .send({ amount, ...pickup });

const setStatus = (token, donationId, body) =>
  request(app).patch(`/api/donations/${donationId}/status`).set(auth(token)).send(body);

const getRequest = async (token, id) => {
  const res = await request(app).get("/api/food-requests").set(auth(token));
  return res.body.find((r) => r._id === id);
};

describe("Food requests", () => {
  test("donors cannot create food requests", async () => {
    const res = await request(app)
      .post("/api/food-requests")
      .set(auth(donorToken))
      .send({ foodNeeded: "Rice", quantityNeeded: 10, location: "Andheri" });
    expect(res.status).toBe(403);
  });

  test("location and a numeric quantity are required", async () => {
    const res = await request(app)
      .post("/api/food-requests")
      .set(auth(ngoToken))
      .send({ foodNeeded: "Rice", quantityNeeded: "lots" });
    expect(res.status).toBe(400);
  });

  test("NGO posts a request and donors can see it", async () => {
    const created = await request(app)
      .post("/api/food-requests")
      .set(auth(ngoToken))
      .send({ foodNeeded: "Lunch boxes", quantityNeeded: 50, unit: "boxes", location: "Bandra", notes: "Before 1pm" });
    expect(created.status).toBe(201);
    expect(created.body.ngoName).toBe("Akshaya Patra");
    expect(created.body.status).toBe("Open");
    expect(created.body.quantityRemaining).toBe(50);

    const list = await request(app).get("/api/food-requests").set(auth(donorToken));
    expect(list.status).toBe(200);
    expect(list.body[0].foodNeeded).toBe("Lunch boxes");
  });

  test("NGOs only see their own requests", async () => {
    const res = await request(app).get("/api/food-requests").set(auth(otherNgoToken));
    expect(res.body).toHaveLength(0);
  });
});

describe("Fulfilling a food request", () => {
  let requestId;
  let pledge1;
  let pledge2;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/food-requests")
      .set(auth(ngoToken))
      .send({ foodNeeded: "Rice", quantityNeeded: 40, unit: "kg", location: "Dadar" });
    requestId = res.body._id;
  });

  test("NGO accounts cannot pledge", async () => {
    expect((await pledge(ngoToken, requestId, 5)).status).toBe(403);
  });

  test("donor pledges part of the request; it becomes a donation to that NGO", async () => {
    const res = await pledge(donorToken, requestId, 25);
    expect(res.status).toBe(201);
    expect(res.body.ngoName).toBe("Akshaya Patra");
    expect(res.body.quantity).toBe("25 kg");
    expect(res.body.pledgedAmount).toBe(25);
    pledge1 = res.body._id;

    const r = await getRequest(donorToken, requestId);
    expect(r.quantityPledged).toBe(25);
    expect(r.quantityRemaining).toBe(15);
    expect(r.status).toBe("Open"); // nothing received yet
  });

  test("cannot pledge more than what is still needed", async () => {
    const res = await pledge(donor2Token, requestId, 20);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/15 kg/);
  });

  test("the NGO sees the pledge with its request; another NGO does not", async () => {
    const mine = await request(app).get("/api/donations").set(auth(ngoToken));
    const d = mine.body.find((x) => x._id === pledge1);
    expect(d.foodRequest.foodNeeded).toBe("Rice");

    const other = await request(app).get("/api/donations").set(auth(otherNgoToken));
    expect(other.body.find((x) => x._id === pledge1)).toBeUndefined();
  });

  test("NGO confirms only 20 of the 25 kg arrived -> partially fulfilled, 20 left", async () => {
    await setStatus(ngoToken, pledge1, { status: "Pending" });

    const tooMuch = await setStatus(ngoToken, pledge1, { status: "Completed", receivedAmount: 30 });
    expect(tooMuch.status).toBe(400);

    const done = await setStatus(ngoToken, pledge1, { status: "Completed", receivedAmount: 20 });
    expect(done.status).toBe(200);
    expect(done.body.receivedAmount).toBe(20);

    const r = await getRequest(ngoToken, requestId);
    expect(r.quantityReceived).toBe(20);
    expect(r.quantityPledged).toBe(0);
    expect(r.quantityRemaining).toBe(20);
    expect(r.status).toBe("Partially Fulfilled");
  });

  test("second donor fills the rest -> request fulfilled", async () => {
    const res = await pledge(donor2Token, requestId, 20);
    expect(res.status).toBe(201);
    pledge2 = res.body._id;

    await setStatus(ngoToken, pledge2, { status: "Pending" });
    await setStatus(ngoToken, pledge2, { status: "Completed" }); // defaults to the pledged amount

    const r = await getRequest(donorToken, requestId);
    expect(r.quantityReceived).toBe(40);
    expect(r.quantityRemaining).toBe(0);
    expect(r.status).toBe("Fulfilled");
  });

  test("a fulfilled request cannot take more pledges", async () => {
    const res = await pledge(donorToken, requestId, 1);
    expect(res.status).toBe(400);
  });
});
