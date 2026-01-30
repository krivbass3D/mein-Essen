
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function test() {
  try {
    console.log("Testing OpenAI API with json_object...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Return valid JSON: { \"test\": true }"
        },
        {
          role: "user",
          content: "Go"
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 100
    });

    console.log("Response:", response.choices[0].message.content);
    console.log("Success! API accepts json_object.");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

test();
