const API_URL = "http://localhost:5000/api"; // change if backend hosted

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      window.location.href = "dashboard.html";
    } else {
      document.getElementById("error").innerText = data.msg || "Login failed";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("error").innerText = "Server error";
  }
});
