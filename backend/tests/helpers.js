process.env.NODE_ENV = "test";

const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const Ngo = require("../src/models/Ngo");
const { seedNgos } = require("../src/seed/ngos");

let mongo;

// Each test file gets its own throwaway in-memory database
async function setupDb() {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await seedNgos();
}

async function teardownDb() {
  await mongoose.disconnect();
  await mongo.stop();
}

async function signup(overrides = {}) {
  const body = {
    name: "Test User",
    email: `user${Date.now()}${Math.random().toString(36).slice(2, 6)}@test.com`,
    password: "secret123",
    role: "donor",
    ...overrides,
  };
  const res = await request(app).post("/api/auth/signup").send(body);
  return { res, body, token: res.body.token };
}

const ngoByName = (name) => Ngo.findOne({ name });

module.exports = { app, request, setupDb, teardownDb, signup, ngoByName };
