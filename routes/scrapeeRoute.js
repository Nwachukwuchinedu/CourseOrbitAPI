const express = require("express");
const router = express.Router();
const scrapeeController = require("../controllers/scrapeeController");

router.get("/", scrapeeController.scrape);

module.exports = router;
