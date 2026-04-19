const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

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

// ✅ Optional direct access
app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

// ================= BACKEND =================

// ✅ Customer BUY
app.post("/buy", (req, res) => {
  if(!req.body) return res.json({ success:false });

  console.log("New Request:", req.body); // 🔥 debug

  requests.push(req.body);
  res.json({ success: true });
});

// ✅ Get all requests (SAFE)
app.get("/requests", (req, res) => {
  res.json(requests || []);
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

// ✅ Status check
app.get("/status", (req, res) => {
  res.json({ on: systemOn });
});

// ================= START =================
app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});
