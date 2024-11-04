const puppeteer = require("puppeteer");
const chromium = require("@sparticuz/chromium");

exports.scrape = async (req, res) => {
  const url = "https://m.forasm.com/blog";

  if (!url) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  try {
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

    // const browser = await puppeteer.launch({ headless: true });
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
      const allCoursesContainer = document.querySelectorAll(".block-inner")[5];
      const courseContainer = allCoursesContainer.querySelectorAll(".p-wrap");

      let idCounter = 1;
      const eachCourseContainer = Array.from(courseContainer).map((item) => {
        const courseData = {
          id: idCounter++,
          link: item.querySelector(".p-flink").href,
          image: item.querySelector("img").src,
          hashTag: item.querySelector(".p-category").textContent,
          title: item.querySelector(".p-url").textContent,
        };

        return courseData;
      });

      return {
        eachCourseContainer,
        // courseContainer: courseContainer ? courseContainer : null,
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
