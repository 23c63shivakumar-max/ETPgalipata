// Toggle chatbot window
document.getElementById("chatbotBtn").addEventListener("click", () => {
  const win = document.getElementById("chatbotWindow");
  win.style.display = win.style.display === "flex" ? "none" : "flex";
});

// Input styles
const chatInput = document.getElementById("chatInput");
chatInput.style.color = "black";
chatInput.style.caretColor = "black";
chatInput.style.backgroundColor = "white";
chatInput.setAttribute("placeholder", "Type a message...");

// Send message
document.getElementById("sendChat").addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function addMessage(text, sender) {
  const msgBox = document.getElementById("chatMessages");
  const div = document.createElement("div");

  div.style.margin = "8px 0";
  div.style.padding = "8px";
  div.style.borderRadius = "6px";
  div.style.maxWidth = "80%";
  div.style.wordWrap = "break-word";
  div.style.color = "black";

  if (sender === "user") {
    div.style.background = "#d1e7ff";
    div.style.alignSelf = "flex-end";
    div.textContent = text;
  } else {
    div.style.background = "#eeeeee";
    div.style.alignSelf = "flex-start";

    // Convert multiline text to bullets
    const lines = text.split("\n").map(line => line.trim()).filter(line => line);
    if (lines.length > 1) {
      const ul = document.createElement("ul");
      lines.forEach(line => {
        const li = document.createElement("li");
        li.textContent = line;
        ul.appendChild(li);
      });
      div.appendChild(ul);
    } else {
      div.textContent = text;
    }
  }

  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  chatInput.value = "";

  try {
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json();

    if (data.error) {
      addMessage("⚠ Server error, try again!", "bot");
      return;
    }

    addMessage(data.reply, "bot");

  } catch (err) {
    addMessage("⚠ Cannot connect to server!", "bot");
  }
}
