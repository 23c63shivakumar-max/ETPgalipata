const API_URL = "http://localhost:5000/api"; // change if backend hosted
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "index.html"; // redirect if not logged in
}

document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "index.html";
});

async function fetchPosts() {
  try {
    const res = await fetch(`${API_URL}/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const posts = await res.json();
    const postsDiv = document.getElementById("posts");
    postsDiv.innerHTML = "";

    posts.forEach((post) => {
      const div = document.createElement("div");
      div.className = "post";
      div.innerHTML = `<p>${post.text}</p><small>${new Date(post.createdAt).toLocaleString()}</small>`;
      postsDiv.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

document.getElementById("postForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = document.getElementById("postText").value;

  try {
    const res = await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      document.getElementById("postText").value = "";
      fetchPosts();
    }
  } catch (err) {
    console.error(err);
  }
});

fetchPosts();
