const express = require("express");
const router = express.Router();
const scrapeByIdController = require("../controllers/scrapeByIdController");

router.get("/:id", scrapeByIdController.scrape);

module.exports = router;
