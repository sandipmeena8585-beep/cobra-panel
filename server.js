const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// 🔥 IMPORTANT (Render port fix)
const PORT = process.env.PORT || 3000;

let requests = [];
let systemOn = true;

// ✅ Default route (Customer Panel)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ✅ Admin Login Page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

// ✅ (OPTIONAL) admin.html direct open fix
app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

// ================= BACKEND =================

// ✅ Customer BUY
app.post("/buy", (req, res) => {
  requests.push(req.body);
  res.json({ success: true });
});

// ✅ Admin get all requests
app.get("/requests", (req, res) => {
  res.json(requests);
});

// ✅ Approve
app.post("/approve", (req, res) => {
  const user = req.body.user;
  requests = requests.filter(r => r.user !== user);
  res.json({ success: true });
});

// ✅ Reject
app.post("/reject", (req, res) => {
  const user = req.body.user;
  requests = requests.filter(r => r.user !== user);
  res.json({ success: true });
});

// ✅ Toggle system
app.post("/toggle", (req, res) => {
  systemOn = !systemOn;
  res.json({ on: systemOn });
});

// ✅ Check status
app.get("/status", (req, res) => {
  res.json({ on: systemOn });
});

// ================= START SERVER =================
app.listen(PORT, () => console.log("Server running on " + PORT));
