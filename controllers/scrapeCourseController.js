const puppeteer1 = require("puppeteer-extra");
const chromium = require("@sparticuz/chromium");

exports.scrape = async (req, res) => {
  const courseUrl = req.query.url; // Get the URL from the query parameter
  if (!courseUrl) {
    return res.status(400).json({ error: "No URL provided." });
  }

  try {
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
}
