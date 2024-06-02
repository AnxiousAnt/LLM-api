document.getElementById("send-button").addEventListener("click", sendMessage);
document.getElementById("user-input").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

document.getElementById("chat-toggle-button").addEventListener("click", function() {
  const chatContainer = document.getElementById("chat-container");
  chatContainer.classList.toggle("open");
});

async function sendMessage() {
  const userInput = document.getElementById("user-input").value;
  if (!userInput.trim()) return;

  appendMessage("user", userInput);
  document.getElementById("user-input").value = "";

  const messages = [
    {
      role: "system",
      content: "You are a helpful AI agent.",
    },
    ...getChatHistory(),
    { role: "user", content: userInput }
  ];

  const responseMessage = await fetchChat(messages);
  appendMessage("assistant", responseMessage.content);
}

function appendMessage(role, content) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message", role);
  messageElement.textContent = content;
  document.getElementById("chat-messages").appendChild(messageElement);
  scrollToBottom();
}

function scrollToBottom() {
  const chatMessages = document.getElementById("chat-messages");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getChatHistory() {
  const chatMessages = document.querySelectorAll(".chat-message");
  return Array.from(chatMessages).map((message) => ({
    role: message.classList.contains("user") ? "user" : "assistant",
    content: message.textContent,
  }));
}

async function fetchChat(messages) {
  const body = {
    //model: "qwen:0.5b",
    model: "patch-gen:latest",
    messages,
  };

  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Failed to read response body");
  }
  let content = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const rawjson = new TextDecoder().decode(value);
    const json = JSON.parse(rawjson);
    if (json.done === false) {
      content += json.message.content;
    }
  }
  return { role: "assistant", content };
}
