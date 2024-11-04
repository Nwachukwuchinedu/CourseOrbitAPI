const express = require("express");
const router = express.Router();
const scrapeCourseController = require("../controllers/scrapeCourseController");

router.get("/", scrapeCourseController.scrape);

module.exports = router;
