const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { JSDOM } = require("jsdom");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Use stealth plugin
puppeteer.use(StealthPlugin());

// Endpoint to scrape data from the main page
app.get("/scrape", async (req, res) => {
  try {
    const url = "https://courson.xyz/coupons";

    // Launch Puppeteer
    const browser = await puppeteer.launch({ headless: "new" }); // Set headless to false for debugging
    const page = await browser.newPage();

    // Navigate to the URL
    await page.goto(url, { waitUntil: "networkidle2" });

    // Get the page content
    const html = await page.content();

    // Parse the HTML content using JSDOM
    const { document } = new JSDOM(html).window;

    // Scrape dynamic content
    const title = document.title || "No title found";
    const headings = document.querySelectorAll(".course-preview-link");

    const scrapedData = {
      page_title: title,
      courses: [],
    };

    if (headings.length === 0) {
      return res.status(404).json({
        error:
          "No course preview links found. Check the HTML structure and selectors.",
        title: title,
      });
    }

    headings.forEach((element, index) => {
      const coursePreview = element.querySelector(".course-preview");
      const coursePreviewLink = element.getAttribute("href");

      const img = coursePreview.querySelector(".card-img-top")
        ? coursePreview.querySelector(".card-img-top").src
        : "No image found";
      const cardBodyPreview = coursePreview.querySelector(".card-body-preview");
      const previewWrap = cardBodyPreview
        ? cardBodyPreview.querySelector(".preview-wrap")
        : null;

      const previewTitle =
        previewWrap?.querySelector(".preview-title")?.textContent.trim() ||
        "No title";
      const insPreview =
        previewWrap?.querySelector(".ins-preview")?.textContent.trim() ||
        "No instructor";
      const revPreview =
        previewWrap?.querySelector(".rev-preview")?.textContent.trim() ||
        "No reviews";
      const rateText =
        previewWrap?.querySelector(".rate-text")?.textContent.trim() ||
        "No rating";

      scrapedData.courses.push({
        course_number: index + 1,
        course_title: previewTitle,
        img: img,
        ins_preview: insPreview,
        rev_preview: revPreview,
        rate_text: rateText,
        link: coursePreviewLink,
      });
    });

    // Close the browser
    await browser.close();

    // Return the scraped data as a JSON response
    return res.json(scrapedData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint to scrape course data from a specific URL
app.get("/scrape_course", async (req, res) => {
  const courseUrl = req.query.url; // Get the URL from the query parameter
  if (!courseUrl) {
    return res.status(400).json({ error: "No URL provided." });
  }

  try {
    // Launch Puppeteer with stealth plugin
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to the course URL
    await page.goto(courseUrl, { waitUntil: "networkidle2" });

    // Get the page content
    const html = await page.content();
    const { document } = new JSDOM(html).window;

    // Scrape page title
    const pageTitle = document.title || "No title found";

    // Scrape course title
    const courseTitleElement = document.querySelector(".course-title");
    const courseTitle = courseTitleElement
      ? courseTitleElement.textContent.trim()
      : "No course title found";

    // Scrape last h5 tag inside the .headlines div
    const headlinesDiv = document.querySelector(".headlines div:last-child h5");
    const h5 = headlinesDiv
      ? headlinesDiv.textContent.trim()
      : "No headlines found";

    // Scrape image URL
    const imgElement = document.querySelector(".img-design");
    const imgUrl = imgElement ? imgElement.src : "No image found";

    // Scrape udemy URL
    const udemyUrlElement = document.querySelector(".btn-link");
    const udemyUrl = udemyUrlElement ? udemyUrlElement.href : "No URL found";

    // Scrape the card body contents
    const cardBodyContents = document.querySelectorAll(".card-body-content");
    const scrapedCardContents = Array.from(cardBodyContents).map((card) => ({
      card_h5: card.querySelector("h5")
        ? card.querySelector("h5").textContent.trim()
        : "No card h5 found",
    }));

    // Scrape text info
    const textInfo = document.querySelectorAll(".text-info");
    const whoIsThisCourseForContents = Array.from(
      textInfo[0]?.querySelectorAll(".info-list li") || []
    ).map((li) => ({ li: li.textContent.trim() }));
    const whatYouWillLearnContents = Array.from(
      textInfo[1]?.querySelectorAll(".info-list li") || []
    ).map((li) => ({ li: li.textContent.trim() }));
    const requirementContents = Array.from(
      textInfo[2]?.querySelectorAll(".info-list li") || []
    ).map((li) => ({ li: li.textContent.trim() }));

    // Scrape description from the first .text-info
    const descriptionElement = document.querySelectorAll(".text-info")[3];
    const descriptionText = descriptionElement
      ? descriptionElement.textContent.trim()
      : "No description found";

    // Store the scraped data
    const scrapedData = {
      page_title: pageTitle,
      courses_title: courseTitle,
      h5: h5,
      img: imgUrl,
      udmy_link: udemyUrl,
      card_body_contents: scrapedCardContents,
      who_is_this_course_for: whoIsThisCourseForContents,
      what_you_will_learn: whatYouWillLearnContents,
      requirement_contents: requirementContents,
      description: descriptionText,
    };

    // Close the browser
    await browser.close();

    // Return the scraped course data as a JSON response
    return res.json(scrapedData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
