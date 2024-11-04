const express = require("express");
const router = express.Router();
const scrapeeByIdController = require("../controllers/scrapeeByIdController");

router.get("/:id", scrapeeByIdController.scrape);

module.exports = router;
