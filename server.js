const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

let requests = [];
let systemOn = true;

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

app.listen(3000, () => console.log("Server running"));
