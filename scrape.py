from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from flask import Flask, jsonify, request
from bs4 import BeautifulSoup
import cloudscraper
import time

app = Flask(__name__)

@app.route('/scrape', methods=['GET'])
def scrape_data():
    try:
        # The URL to scrape
        url = "https://courson.xyz/coupons"

        # Initialize Selenium WebDriver (you can use Chrome or Firefox)
        driver = webdriver.Chrome()  # Ensure the driver is installed and set in PATH

        # Open the URL in Selenium
        driver.get(url)

        # Add a delay to allow dynamic content to load

        # Get the page source after the delay
        html = driver.page_source

        # Parse the HTML content using BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')

        # Scrape dynamic content (example: extract title and course preview titles)
        title = soup.title.string if soup.title else "No title found"

        # Find all course preview links
        headings = soup.select(".course-preview-link")

        # Store the scraped data
        scraped_data = {
            "page_title": title,
            "courses": [],
        }

        if not headings:
            return jsonify({"error": "No course preview links found. Check the HTML structure and selectors."})

        # Extract text from each course preview link
        for index, element in enumerate(headings):
            course_preview = element.select_one('.course-preview')
            course_preview_link = element.get('href')

            img = course_preview.select_one('.card-img-top')['src'] if course_preview and course_preview.select_one('.card-img-top') else "No image found"
            card_body_preview = course_preview.select_one('.card-body-preview') if course_preview else None
            preview_wrap = card_body_preview.select_one('.preview-wrap') if card_body_preview else None

            preview_title = preview_wrap.select_one('.preview-title').text.strip() if preview_wrap and preview_wrap.select_one('.preview-title') else "No title"
            ins_preview = preview_wrap.select_one('.ins-preview').text.strip() if preview_wrap and preview_wrap.select_one('.ins-preview') else "No instructor"
            rev_preview = preview_wrap.select_one('.rev-preview').text.strip() if preview_wrap and preview_wrap.select_one('.rev-preview') else "No reviews"
            rate_text = preview_wrap.select_one('.rate-text').text.strip() if preview_wrap and preview_wrap.select_one('.rate-text') else "No rating"

            scraped_data["courses"].append({
                "course_number": index + 1,
                "course_title": preview_title,
                "img": img,
                "ins_preview": ins_preview,
                "rev_preview": rev_preview,
                "rate_text": rate_text,
                "link": course_preview_link,
            })

        # Close the browser once done
        driver.quit()

        # Return the scraped data as a JSON response
        return jsonify(scraped_data)

    except Exception as e:
        # In case of an error, return an error message
        return jsonify({"error": str(e)})


@app.route('/scrape_course', methods=['GET'])
def scrape_course():

  # Initialize the WebDriver (adjust path if necessary)
    driver = webdriver.Chrome()

    course_url = request.args.get('url')  # Get the URL from the query parameter
    # Go to the webpage you want to scrape
    driver.get(course_url)

    # Simulate clicking "Show More" multiple times if needed
    # Adjust the locator for the Show More button as per the site
    while True:
        try:
            # Find the "Show More" button by its ID
            show_more_button = driver.find_element(By.ID, "show-button")
            
            # Scroll to the button with an offset to avoid the navbar
            driver.execute_script("window.scrollTo(0, arguments[0].getBoundingClientRect().top + window.scrollY - 100);", show_more_button)
                
            # Add a slight delay to ensure scrolling completes
            time.sleep(1)
                
            # Click the "Show More" button
            show_more_button.click()
            
           # Wait for the new content to load
            time.sleep(2)
            print("It was clicked successfully" )
        except Exception as e:
            print("No more 'Show More' button found or an error occurred:", e)
        break

    # After all content is loaded, parse the page with Beautiful Soup
    soup = BeautifulSoup(driver.page_source, "html.parser")

    # Extract the text you need
    description_ele = soup.select('.text-info')[3]
    description_text = description_ele.text.strip() if description_ele else "No description found"
 

    # Close the browser
    driver.quit()
  
    course_url = request.args.get('url')  # Get the URL from the query parameter
    if not course_url:
        return jsonify({"error": "No URL provided."}), 400

    try:
        # Create a cloudscraper object
        scraper = cloudscraper.create_scraper()

        # Send a GET request to the course URL
        response = scraper.get(course_url)

        # Check if the request was successful
        if response.status_code != 200:
            return jsonify({"error": f"Failed to retrieve the page. Status code: {response.status_code}"}), response.status_code

        # Parse the HTML content using BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')

        # Scrape the page title
        page_title = soup.title.string if soup.title else "No title found"

        # Scrape the course title
        course_title_element = soup.select_one('.course-title')
        course_title = course_title_element.text.strip() if course_title_element else "No course title found"

        # Scrape the last h5 tag inside the .headlines div
        headlines_div = soup.select_one('.headlines div:last-child h5')
        h5 = headlines_div.text.strip() if headlines_div else "No headlines found"

        # Scrape the image URL
        img_element = soup.select_one('.img-design')
        img_url = img_element['src'] if img_element else "No image found"

        # Scrape the udmy URL
        udmy_url_element = soup.select_one('.btn-link')
        udmy_url = udmy_url_element['href'] if udmy_url_element else "No url found"

        # Scrape the card body contents (if available)
        card_body_contents = soup.select('.card-body-content')
        scraped_card_contents = []

        for card in card_body_contents:
            card_h5 = card.find('h5').text.strip() if card.find('h5') else "No card h5 found"
            scraped_card_contents.append({"card_h5": card_h5})

        # Scrape the text info for body contents (if available)
        text_info = soup.select('.text-info')

        # Scrape the who is this course for body contents (if available)
        who_is_this_course_for_ele = text_info[0].select('.info-list li')
        who_is_this_course_for_contents = []

        for li in who_is_this_course_for_ele:
            li_text = li.text.strip() if li else "No list found"
            who_is_this_course_for_contents.append({"li": li_text}) 

        # Scrape the what you will learn for body contents (if available)
        what_you_will_learn_ele = text_info[1].select('.info-list li')
        what_you_will_learn_contents = []

        for li in what_you_will_learn_ele:
            li_text = li.text.strip() if li else "No list found"
            what_you_will_learn_contents.append({"li": li_text}) 

        # Scrape the requirement for body contents (if available)
        requirement_ele = text_info[2].select('.info-list li')
        requirement_contents = []

        for li in requirement_ele:
            li_text = li.text.strip() if li else "No list found"
            requirement_contents.append({"li": li_text}) 


        # Store the scraped data
        scraped_data = {
            "page_title": page_title,
            "courses_title": course_title,
            "h5": h5,
            "img": img_url,
            "udmy_link": udmy_url,
            "card_body_contents": scraped_card_contents,
            "who_is_this_course_for": who_is_this_course_for_contents,
            "what_you_will_learn": what_you_will_learn_contents,
            "requirement_contents": requirement_contents,
            "description": description_text
        }

        # Return the scraped course data as a JSON response
        return jsonify(scraped_data)

    except Exception as e:
        # In case of an error, return an error message
        return jsonify({"error": str(e)})



if __name__ == '__main__':
    app.run(debug=True)
