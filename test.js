const readline = require("readline");

const model = "qwen:0.5b";

const Message = {
  role: ["assistant", "user", "system"],
  content: String,
};

const messages = [
  {
    role: "system",
    content: "You are a helpful AI agent.",
  },
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function chat(messages) {
  const body = {
    model,
    messages,
  };

  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Failed to read response body");
  }
  let content = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const rawjson = new TextDecoder().decode(value);
    const json = JSON.parse(rawjson);

    if (json.done === false) {
      process.stdout.write(json.message.content);
      content += json.message.content;
    }
  }
  return { role: "assistant", content };
}

async function askQuestion() {
  return new Promise((resolve) => {
    rl.question("\n\nAsk a question: (press enter alone to quit)\n\n", async (user_input) => {
      if (user_input.trim() === "") {
        rl.close();
        console.log("Thankyou. Goodbye.\n");
        console.log("=======\nHere is the message history that was used in this conversation.\n=======\n");
        messages.forEach((message) => console.log(message));
        resolve();
      } else {
        console.log();
        messages.push({ role: "user", content: user_input });
        messages.push(await chat(messages));
        await askQuestion();
      }
    });
  });
}

async function main() {
  await askQuestion();
}

main();
