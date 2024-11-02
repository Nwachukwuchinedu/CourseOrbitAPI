const TelegramBot = require('node-telegram-bot-api');

// Replace with your bot token and group chat ID
const BOT_TOKEN = '7272799590:AAHILFOJO9mGLm5iQDzUnNEclFMkaEyFnkI';
const GROUP_CHAT_ID = '-1002348699392';

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// Image URL (replace with the URL of the image you want to display)
const imageUrl = 'https://images.unsplash.com/photo-1720048171596-6a7c81662434?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

// HTML message content
const messageContent = `
🔹 <b>The Complete JavaScript Course: From Zero to Expert</b> | Udemy
Beginner To Advanced: Learn Complete JavaScript Full Course!

📘 <b>3.5 hours • 25 lectures</b>

⏰ <b>FREE for:</b> First 1000 enrolls ⚠️
📊 <b>Rating:</b> 3.9 ⭐️
👥 <b>Rated by:</b> 271 students
📂 <b>Category:</b> #development
🔄 <b>Last updated:</b> 11/2023
👨‍🏫 <b>Instructor:</b> John Doe
`;

// Inline button setup
const options = {
  parse_mode: 'HTML',
  reply_markup: {
    inline_keyboard: [
      [
        { text: 'Enroll Now 🚀', url: 'https://www.udemy.com/course/complete-javascript-course/' }
      ]
    ]
  }
};

// Send the image with the caption and inline button
bot.sendPhoto(GROUP_CHAT_ID, imageUrl, { caption: messageContent, ...options }) 
  .then(() => {
    console.log("Message with image and button sent successfully!");
  })
  .catch(err => {
    console.error("Error sending message:", err);
  });