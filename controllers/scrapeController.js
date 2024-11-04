const puppeteer = require("puppeteer");
const chromium = require("@sparticuz/chromium");

exports.scrape = async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  try {
    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    //  const browser = await puppeteer.launch({ headless: true });

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      const url = request.url();

      // Block images, stylesheets, and fonts
      if (
        resourceType === "image" ||
        resourceType === "stylesheet" ||
        resourceType === "font"
      ) {
        request.abort();
      }
      // Block ads (scripts that include 'ads' in the URL)
      else if (resourceType === "script" && url.includes("ads")) {
        request.abort(); // Block ads
      } else {
        request.continue();
      }
    });
    // Go to the URL
    await page.goto(url, { waitUntil: "networkidle2" });

    // Extract the href attribute and text content
    const data = await page.evaluate(() => {
      const udemyLink = document.querySelector(".edu-btn");
      const courseTitle = document.querySelector(".s-title");
      const courseImg = document.querySelector(
        ".attachment-foxiz_crop_o2.size-foxiz_crop_o2.wp-post-image"
      );

      const borderBox = document.querySelectorAll(".course-overview ul");

      const learnBox = borderBox[0];
      const learnItems = learnBox.querySelectorAll("li");
      const requiremetBox = borderBox[1];
      const requirementItems = requiremetBox.querySelectorAll("li");
      const courseForBox = borderBox[borderBox.length - 1];
      const courseForItems = courseForBox.querySelectorAll("li");
      const tagBar = document.querySelectorAll(".tag-bar span")[1];

      // Map over the NodeList and extract the textContent of each <li>
      const learn = Array.from(learnItems).map((item) =>
        item.textContent.trim()
      );
      const requirement = Array.from(requirementItems).map((item) =>
        item.textContent.trim()
      );
      const course = Array.from(courseForItems).map((item) =>
        item.textContent.trim()
      );

      return {
        udemyLink: udemyLink ? udemyLink.href : null,
        courseTitle: courseTitle ? courseTitle.textContent.trim() : null,
        courseImg: courseImg ? courseImg.src : null,
        learn: learn.length > 0 ? learn : null,
        requirement: requirement.length > 0 ? requirement : null,
        course: course.length > 0 ? course : null,
        tagBar: tagBar ? tagBar.textContent.trim() : null,
      };
    });

    // Close the browser
    await browser.close();

    // Send the data as JSON
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ error: "Elements not found" });
    }
  } catch (error) {
    console.error("Error scraping the site:", error);
    res.status(500).json({ error: "Error scraping the site" });
  }
};
