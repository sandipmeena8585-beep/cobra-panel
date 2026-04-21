const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

const DB_FILE = "./data.json";

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    systemOn: true,
    plans: [],
    stock: {},
    requests: [],
    history: []
  }, null, 2));
}

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// CUSTOMER
app.get("/", (req, res) => {
  const db = loadDB();
  if (!db.systemOn) return res.send("OFF");
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// STATUS
app.get("/status", (req, res) => {
  const db = loadDB();
  res.json({ on: db.systemOn });
});

// BUY REQUEST
app.post("/buy", (req, res) => {
  let db = loadDB();

  db.requests.push({
    user: req.body.user,
    plan: req.body.plan,
    utr: req.body.utr,

    // 🔥 FIX TIME
    time: req.body.time || new Date().toLocaleString()
  });

  saveDB(db);
  res.json({ success: true });
});

// HISTORY
app.get("/history", (req, res) => {
  const db = loadDB();
  res.json(db.history);
});

app.listen(PORT, () => {
  console.log("Server Running");
});
