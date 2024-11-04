const puppeteer1 = require("puppeteer-extra");
const chromium = require("@sparticuz/chromium");

exports.scrape = async (req, res) => {
  try {
    const url = "https://courson.xyz/coupons";
    const courseId = parseInt(req.params.id, 10);
    
    // Launch Puppeteer with stealth plugin
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
    // const browser = await puppeteer1.launch({ headless: true });
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
    // Step 1: Navigate to the main URL and scrape the list of courses
    await page.goto(url, { waitUntil: "networkidle2" });

    // Scrape course preview links
    const courses = await page.evaluate(() => {
      const courseElements = document.querySelectorAll(".course-preview-link");
      return Array.from(courseElements).map((element, index) => {
        const coursePreview = element.querySelector(".course-preview");
        const coursePreviewLink = element.getAttribute("href");
        const img =
          coursePreview.querySelector(".card-img-top")?.src || "No image found";
        const previewTitle =
          coursePreview.querySelector(".preview-title")?.textContent.trim() ||
          "No title";
        const hashTag =
          coursePreview
            .querySelector(".category-preview")
            ?.textContent.trim() || "No hash tag";
        const insPreview =
          coursePreview.querySelector(".ins-preview")?.textContent.trim() ||
          "No instructor";
        const revPreview =
          coursePreview.querySelector(".rev-preview")?.textContent.trim() ||
          "No reviews";
        const rateText =
          coursePreview.querySelector(".rate-text")?.textContent.trim() ||
          "No rating";

        return {
          id: index + 1,
          course_title: previewTitle,
          img: img,
          ins_preview: insPreview,
          rev_preview: revPreview,
          rate_text: rateText,
          link: coursePreviewLink,
          hashTag: hashTag,
        };
      });
    });

    // Step 2: Find the specific course by its id
    const course = courses.find((c) => c.id === courseId);
    if (!course) {
      await browser.close();
      return res
        .status(404)
        .json({ error: "Course not found with the specified id." });
    }

    // Step 3: Use Puppeteer to navigate to the specific course page and scrape additional details
    const coursePageUrl = `https://courson.xyz${course.link}`;
    await page.goto(coursePageUrl, { waitUntil: "networkidle2" });

    // Scrape additional details from the course page
    const detailedCourseData = await page.evaluate(() => {
      const pageTitle = document.title || "No title found";
      const courseTitle =
        document.querySelector(".course-title")?.textContent.trim() ||
        "No course title found";
      const h5 =
        document
          .querySelector(".headlines div:last-child h5")
          ?.textContent.trim() || "No headlines found";
      const img =
        document.querySelector(".img-design")?.src || "No image found";
      const udemyLink =
        document.querySelector(".btn-link")?.href || "No URL found";

      const cardBodyContents = Array.from(
        document.querySelectorAll(".card-body-content")
      ).map((card) => ({
        card_h5:
          card.querySelector("h5")?.textContent.trim() || "No card h5 found",
      }));

      const whoIsThisCourseForContents = Array.from(
        document
          .querySelectorAll(".text-info")[0]
          ?.querySelectorAll(".info-list li") || []
      ).map((li) => ({ li: li.textContent.trim() }));
      const whatYouWillLearnContents = Array.from(
        document
          .querySelectorAll(".text-info")[1]
          ?.querySelectorAll(".info-list li") || []
      ).map((li) => ({ li: li.textContent.trim() }));
      const requirementContents = Array.from(
        document
          .querySelectorAll(".text-info")[2]
          ?.querySelectorAll(".info-list li") || []
      ).map((li) => ({ li: li.textContent.trim() }));
      const description =
        document.querySelectorAll(".text-info")[3]?.textContent.trim() ||
        "No description found";

      return {
        page_title: pageTitle,
        courses_title: courseTitle,
        h5: h5,
        img: img,
        udmy_link: udemyLink,
        card_body_contents: cardBodyContents,
        who_is_this_course_for: whoIsThisCourseForContents,
        what_you_will_learn: whatYouWillLearnContents,
        requirement_contents: requirementContents,
        description: description,
      };
    });

    // Close the browser
    await browser.close();

    // Add the course ID and return the detailed course data
    detailedCourseData.id = course.id;
    return res.json(detailedCourseData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
