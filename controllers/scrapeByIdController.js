const puppeteer1 = require("puppeteer-extra");
const chromium = require("@sparticuz/chromium");

exports.scrape = async (req, res) => {
  const url = "https://m.forasm.com/blog";
  const { id } = req.params; // Get the id from the request parameters

  // Check if id is valid (you can add further validation if needed)
  if (!id) {
    return res.status(400).json({ error: "ID parameter is required" });
  }

  try {
      const browser = await puppeteer1.launch({
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    // const browser = await puppeteer1.launch({ headless: true }); // or 'new' if you have the latest Puppeteer1
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

      const eachCourseContainer = Array.from(courseContainer).map(
        (item, index) => {
          return {
            id: index + 1, // Sequential IDs starting from 1
            link: item.querySelector(".p-flink").href,
            image: item.querySelector("img").src,
            hashTag: item.querySelector(".p-category").textContent,
            title: item.querySelector(".p-url").textContent,
          };
        }
      );

      return eachCourseContainer; // Return the array of courses
    });

    // Close the browser
    await browser.close();

    // Find the course that matches the requested id
    const course = data.find((course) => course.id.toString() === id);

    // Send the course data as JSON if found
    if (course) {
      res.json(course);
    } else {
      res.status(404).json({ error: "Course not found" });
    }
  } catch (error) {
    console.error("Error scraping the site:", error);
    res.status(500).json({ error: "Error scraping the site" });
  }
};
