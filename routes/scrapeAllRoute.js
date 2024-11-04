const express = require("express");
const router = express.Router();
const scrapeAllController = require("../controllers/scrapeAllController");

router.get("/", scrapeAllController.scrape);

module.exports = router;
