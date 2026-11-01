const path = require("path");
const fs = require("fs");
const { app, request, setupDb, teardownDb, signup, ngoByName } = require("./helpers");

let donorToken;
let goonjToken;
let otherNgoToken;
let goonj;
const uploaded = [];

beforeAll(async () => {
  await setupDb();
  goonj = await ngoByName("Goonj");
  const helping = await ngoByName("Helping Hands");
  donorToken = (await signup({ name: "Riya Donor" })).token;
  goonjToken = (await signup({ role: "ngo", ngoId: goonj.id })).token;
  otherNgoToken = (await signup({ role: "ngo", ngoId: helping.id })).token;
});

afterAll(async () => {
  // remove photos created by the tests
  uploaded.forEach((url) => fs.rmSync(path.join(__dirname, "..", url), { force: true }));
  await teardownDb();
});

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const donationFields = () => ({
  ngoId: goonj.id,
  foodName: "Veg Biryani",
  quantity: "20 plates",
  building: "Sunshine Apartments",
  street: "MG Road",
  city: "Pune",
});

describe("Donations", () => {
  let donationId;

  test("listing NGOs is public", async () => {
    const res = await request(app).get("/api/ngos");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
  });

  test("must be logged in to donate", async () => {
    const res = await request(app).post("/api/donations").send(donationFields());
    expect(res.status).toBe(401);
  });

  test("NGO accounts cannot create donations", async () => {
    const res = await request(app).post("/api/donations").set(auth(goonjToken)).send(donationFields());
    expect(res.status).toBe(403);
  });

  test("donor creates a donation with a photo", async () => {
    let req = request(app).post("/api/donations").set(auth(donorToken));
    Object.entries(donationFields()).forEach(([k, v]) => (req = req.field(k, v)));
    const res = await req.attach("photo", Buffer.from("fake-image"), {
      filename: "food.png",
      contentType: "image/png",
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Available");
    expect(res.body.donorName).toBe("Riya Donor");
    expect(res.body.ngoName).toBe("Goonj");
    expect(res.body.photoUrl).toMatch(/^\/uploads\//);
    uploaded.push(res.body.photoUrl);
    donationId = res.body._id;
  });

  test("non-image uploads are rejected", async () => {
    let req = request(app).post("/api/donations").set(auth(donorToken));
    Object.entries(donationFields()).forEach(([k, v]) => (req = req.field(k, v)));
    const res = await req.attach("photo", Buffer.from("hello"), { filename: "a.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
  });

  test("missing fields are rejected", async () => {
    const res = await request(app).post("/api/donations").set(auth(donorToken)).send({ ngoId: goonj.id });
    expect(res.status).toBe(400);
  });

  test("the chosen NGO sees the donation, a different NGO does not", async () => {
    const mine = await request(app).get("/api/donations").set(auth(goonjToken));
    expect(mine.body.map((d) => d._id)).toContain(donationId);

    const other = await request(app).get("/api/donations").set(auth(otherNgoToken));
    expect(other.body).toHaveLength(0);
  });

  test("another NGO cannot change the status", async () => {
    const res = await request(app)
      .patch(`/api/donations/${donationId}/status`)
      .set(auth(otherNgoToken))
      .send({ status: "Pending" });
    expect(res.status).toBe(403);
  });

  test("status follows Available -> Pending -> Completed", async () => {
    const skip = await request(app)
      .patch(`/api/donations/${donationId}/status`)
      .set(auth(goonjToken))
      .send({ status: "Completed" });
    expect(skip.status).toBe(400);

    const accept = await request(app)
      .patch(`/api/donations/${donationId}/status`)
      .set(auth(goonjToken))
      .send({ status: "Pending" });
    expect(accept.body.status).toBe("Pending");

    const done = await request(app)
      .patch(`/api/donations/${donationId}/status`)
      .set(auth(goonjToken))
      .send({ status: "Completed" });
    expect(done.body.status).toBe("Completed");
  });

  test("donor sees the updated status of their donation", async () => {
    const res = await request(app).get("/api/donations").set(auth(donorToken));
    expect(res.body[0].status).toBe("Completed");
  });
});
