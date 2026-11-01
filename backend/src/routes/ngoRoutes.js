const router = require("express").Router();
const { listNgos } = require("../controllers/ngoController");

// Public: used by the NGO signup dropdown and the donor dashboard
router.get("/", listNgos);

module.exports = router;
