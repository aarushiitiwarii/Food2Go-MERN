// Creates demo logins: one donor and one user per NGO.  Run with: npm run seed:demo
// Safe to run more than once - existing accounts are left untouched.
const { connectDB, disconnectDB } = require("../config/db");
const User = require("../models/User");
const Ngo = require("../models/Ngo");
const { seedNgos } = require("./ngos");

const DEMO_PASSWORD = "demo1234";

const NGO_LOGINS = {
  "CRY: Children Rights for You": { email: "cry@food2go.test", name: "CRY Coordinator" },
  Goonj: { email: "goonj@food2go.test", name: "Goonj Coordinator" },
  "Akshaya Patra": { email: "akshayapatra@food2go.test", name: "Akshaya Patra Coordinator" },
  "Helping Hands": { email: "helpinghands@food2go.test", name: "Helping Hands Coordinator" },
  "Feeding India": { email: "feedingindia@food2go.test", name: "Feeding India Coordinator" },
};

async function ensureUser(data) {
  if (await User.exists({ email: data.email })) return "exists";
  await User.create({ ...data, password: DEMO_PASSWORD }); // create() so the password gets hashed
  return "created";
}

async function main() {
  await connectDB();
  await seedNgos();

  const rows = [];
  rows.push({ role: "donor", ngo: "-", email: "donor@food2go.test", result: await ensureUser({ name: "Riya Shah", email: "donor@food2go.test", role: "donor" }) });

  for (const ngo of await Ngo.find().sort({ name: 1 })) {
    const login = NGO_LOGINS[ngo.name];
    if (!login) continue;
    rows.push({ role: "ngo", ngo: ngo.name, email: login.email, result: await ensureUser({ ...login, role: "ngo", ngo: ngo._id }) });
  }

  console.table(rows);
  console.log(`Password for all demo accounts: ${DEMO_PASSWORD}`);
  await disconnectDB();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDB();
  process.exit(1);
});
