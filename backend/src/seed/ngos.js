const Ngo = require("../models/Ngo");

// Same NGOs that were hardcoded in the original signup page
const NGOS = [
  { name: "CRY: Children Rights for You", city: "Mumbai", contact: "+91 22 2306 3647" },
  { name: "Goonj", city: "New Delhi", contact: "+91 11 2697 2351" },
  { name: "Akshaya Patra", city: "Bengaluru", contact: "+91 80 3014 3400" },
  { name: "Helping Hands", city: "Pune", contact: "+91 98765 43210" },
  { name: "Feeding India", city: "Gurugram", contact: "+91 99999 00000" },
];

async function seedNgos() {
  if ((await Ngo.estimatedDocumentCount()) > 0) return;
  await Ngo.insertMany(NGOS);
  console.log(`Seeded ${NGOS.length} NGOs`);
}

module.exports = { seedNgos, NGOS };
