const express = require('express');
require("dotenv").config();
const cors = require('cors');
const chromium = require("@sparticuz/chromium");
const puppeteer = require('puppeteer');
const puppeteer1 = require('puppeteer-extra');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { JSDOM } = require('jsdom');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Use stealth plugin
puppeteer.use(StealthPlugin());


const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/scrape', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
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

  //  const browser = await puppeteer.launch({ headless: 'new' });


    const page = await browser.newPage();

    // Go to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract the href attribute and text content
    const data = await page.evaluate(() => {
      const udemyLink = document.querySelector('.edu-btn');
      const courseTitle = document.querySelector('.s-title');
      const courseImg = document.querySelector('.attachment-foxiz_crop_o2.size-foxiz_crop_o2.wp-post-image');
      
      const borderBox = document.querySelectorAll('.course-overview ul');

      const learnBox = borderBox[0]
      const learnItems = learnBox.querySelectorAll('li')
      const requiremetBox = borderBox[1]
      const requirementItems = requiremetBox.querySelectorAll('li')
      const courseForBox = borderBox[borderBox.length - 1]
      const courseForItems = courseForBox.querySelectorAll('li')
      const tagBar = document.querySelectorAll('.tag-bar span')[1]

      // Map over the NodeList and extract the textContent of each <li>
      const learn = Array.from(learnItems).map(item => item.textContent.trim());
      const requirement = Array.from(requirementItems).map(item => item.textContent.trim());
      const course = Array.from(courseForItems).map(item => item.textContent.trim());

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
      res.status(404).json({ error: 'Elements not found' });
    }
  } catch (error) {
    console.error('Error scraping the site:', error);
    res.status(500).json({ error: 'Error scraping the site' });
  }
});


app.get('/scrape_all', async (req, res) => {
  const url = 'https://m.forasm.com/blog';

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
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

    // const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Go to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract the href attribute and text content
    const data = await page.evaluate(() => {
      const allCoursesContainer = document.querySelectorAll('.block-inner')[5]
      const courseContainer = allCoursesContainer.querySelectorAll('.p-wrap')

      let idCounter = 1
        const eachCourseContainer = Array.from(courseContainer).map(item => {
          const courseData = {
            id: idCounter++, 
            link: item.querySelector('.p-flink').href,
            image: item.querySelector('img').src,
            hashTag: item.querySelector('.p-category').textContent,
            title: item.querySelector('.p-url').textContent
          }

          return courseData
      });

      return {
        eachCourseContainer
        // courseContainer: courseContainer ? courseContainer : null,
    }
    })



 // Close the browser
    await browser.close();

    // Send the data as JSON
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ error: 'Elements not found' });
    }

  }catch (error) {
    console.error('Error scraping the site:', error);
    res.status(500).json({ error: 'Error scraping the site' });
  }
})



// Scrape endpoint that accepts an id parameter
app.get('/scrape_all/:id', async (req, res) => {
  const url = 'https://m.forasm.com/blog';
  const { id } = req.params; // Get the id from the request parameters

  // Check if id is valid (you can add further validation if needed)
  if (!id) {
    return res.status(400).json({ error: 'ID parameter is required' });
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

    // Go to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract the href attribute and text content
    const data = await page.evaluate(() => {
      const allCoursesContainer = document.querySelectorAll('.block-inner')[5];
      const courseContainer = allCoursesContainer.querySelectorAll('.p-wrap');

      const eachCourseContainer = Array.from(courseContainer).map((item, index) => {
        return {
          id: index + 1, // Sequential IDs starting from 1
          link: item.querySelector('.p-flink').href,
          image: item.querySelector('img').src,
          hashTag: item.querySelector('.p-category').textContent,
          title: item.querySelector('.p-url').textContent
        };
      });

      return eachCourseContainer; // Return the array of courses
    });

    // Close the browser
    await browser.close();

    // Find the course that matches the requested id
    const course = data.find(course => course.id.toString() === id);

    // Send the course data as JSON if found
    if (course) {
      res.json(course);
    } else {
      res.status(404).json({ error: 'Course not found' });
    }
  } catch (error) {
    console.error('Error scraping the site:', error);
    res.status(500).json({ error: 'Error scraping the site' });
  }
});


// Endpoint to scrape data from the main page
app.get('/scrapee', async (req, res) => {
    try {
        const url = "https://courson.xyz/coupons";

        // Launch Puppeteer1
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
        // const browser = await puppeteer1.launch({ headless: true }); // Set headless to false for debugging
        const page = await browser.newPage();

        // Navigate to the URL
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Get the page content
        const html = await page.content();

        // Parse the HTML content using JSDOM
        const { document } = (new JSDOM(html)).window;

        // Scrape dynamic content
        const title = document.title || "No title found";
        const headings = document.querySelectorAll('.course-preview-link');

        const scrapedData = {
            page_title: title,
            courses: []
        };

        if (headings.length === 0) {
            return res.status(404).json({ error: "No course preview links found. Check the HTML structure and selectors.", "title": title });
        }

        headings.forEach((element, index) => {
            const coursePreview = element.querySelector('.course-preview');
            const coursePreviewLink = element.getAttribute('href');

            const img = coursePreview.querySelector('.card-img-top') ? coursePreview.querySelector('.card-img-top').src : "No image found";
            const cardBodyPreview = coursePreview.querySelector('.card-body-preview');
            const previewWrap = cardBodyPreview ? cardBodyPreview.querySelector('.preview-wrap') : null;

            const previewTitle = previewWrap?.querySelector('.preview-title')?.textContent.trim() || "No title";
            const insPreview = previewWrap?.querySelector('.ins-preview')?.textContent.trim() || "No instructor";
            const revPreview = previewWrap?.querySelector('.rev-preview')?.textContent.trim() || "No reviews";
            const rateText = previewWrap?.querySelector('.rate-text')?.textContent.trim() || "No rating";

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
app.get('/scrape_course', async (req, res) => {
    const courseUrl = req.query.url;  // Get the URL from the query parameter
    if (!courseUrl) {
        return res.status(400).json({ error: "No URL provided." });
    }

    try {
        // Launch Puppeteer with stealth plugin
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

        // Navigate to the course URL
        await page.goto(courseUrl, { waitUntil: 'networkidle2' });

        // Get the page content
        const html = await page.content();
        const { document } = (new JSDOM(html)).window;

        // Scrape page title
        const pageTitle = document.title || "No title found";

        // Scrape course title
        const courseTitleElement = document.querySelector('.course-title');
        const courseTitle = courseTitleElement ? courseTitleElement.textContent.trim() : "No course title found";

        // Scrape last h5 tag inside the .headlines div
        const headlinesDiv = document.querySelector('.headlines div:last-child h5');
        const h5 = headlinesDiv ? headlinesDiv.textContent.trim() : "No headlines found";

        // Scrape image URL
        const imgElement = document.querySelector('.img-design');
        const imgUrl = imgElement ? imgElement.src : "No image found";

        // Scrape udemy URL
        const udemyUrlElement = document.querySelector('.btn-link');
        const udemyUrl = udemyUrlElement ? udemyUrlElement.href : "No URL found";

        // Scrape the card body contents
        const cardBodyContents = document.querySelectorAll('.card-body-content');
        const scrapedCardContents = Array.from(cardBodyContents).map(card => ({
            card_h5: card.querySelector('h5') ? card.querySelector('h5').textContent.trim() : "No card h5 found"
        }));

        // Scrape text info
        const textInfo = document.querySelectorAll('.text-info');
        const whoIsThisCourseForContents = Array.from(textInfo[0]?.querySelectorAll('.info-list li') || []).map(li => ({ li: li.textContent.trim() }));
        const whatYouWillLearnContents = Array.from(textInfo[1]?.querySelectorAll('.info-list li') || []).map(li => ({ li: li.textContent.trim() }));
        const requirementContents = Array.from(textInfo[2]?.querySelectorAll('.info-list li') || []).map(li => ({ li: li.textContent.trim() }));

        // Scrape description from the first .text-info
        const descriptionElement = document.querySelectorAll('.text-info')[3];
        const descriptionText = descriptionElement ? descriptionElement.textContent.trim() : "No description found";

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
            description: descriptionText
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
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
