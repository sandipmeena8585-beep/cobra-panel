const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

let requests = [];
let systemOn = true;

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

// APIs
app.get("/requests", (req, res) => {
  res.json(requests || []);
});

app.post("/buy", (req, res) => {
  requests.push(req.body);
  res.json({ success: true });
});

app.post("/approve", (req, res) => {
  requests = requests.filter(r => r.user !== req.body.user);
  res.json({ success: true });
});

app.post("/reject", (req, res) => {
  requests = requests.filter(r => r.user !== req.body.user);
  res.json({ success: true });
});

app.post("/toggle", (req, res) => {
  systemOn = !systemOn;
  res.json({ on: systemOn });
});

app.get("/status", (req, res) => {
  res.json({ on: systemOn });
});

app.listen(PORT, () => console.log("Running on " + PORT));
