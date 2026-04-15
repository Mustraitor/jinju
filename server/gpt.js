import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "sk-vcEo0MLLXgCPZBMV751999FdC031431f921cFdE78d5f03A4",
  baseURL: "https://free.v36.cm/v1"
});

const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello world" }],
});

console.log(completion.choices[0].message.content);
