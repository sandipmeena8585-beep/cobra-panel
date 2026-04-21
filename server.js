const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

const DB_FILE = "./data.json";

// INIT DB
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    systemOn: true,
    upi: "godxcobra@axl",
    qr: "/upi_qr.png",
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

// ================= CUSTOMER =================
app.get("/", (req, res) => {
  const db = loadDB();
  if (!db.systemOn) return res.send("OFF");
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ================= STATUS =================
app.get("/status", (req, res) => {
  const db = loadDB();
  res.json({ on: db.systemOn });
});

// ================= SETTINGS =================
app.get("/settings", (req, res) => {
  const db = loadDB();
  res.json({
    upi: db.upi,
    qr: db.qr
  });
});

// ================= BUY =================
app.post("/buy", (req, res) => {
  let db = loadDB();

  db.requests.push({
    user: req.body.user,
    plan: req.body.plan,
    utr: req.body.utr,
    time: new Date().toLocaleString()
  });

  saveDB(db);
  res.json({ success: true });
});

// ================= REQUEST LIST =================
app.get("/requests", (req, res) => {
  const db = loadDB();
  res.json(db.requests);
});

// ================= APPROVE =================
app.post("/approve", (req, res) => {
  let db = loadDB();

  const user = req.body.user;
  const reqData = db.requests.find(r => r.user === user);

  if (!reqData) return res.json({ error: "not found" });

  let plan = reqData.plan;

  if (!db.stock[plan] || db.stock[plan].length === 0) {
    return res.json({ error: "no stock" });
  }

  let key = db.stock[plan].shift();

  db.history.unshift({
    user: user,
    plan: plan,
    utr: reqData.utr,
    key: key,
    status: "approved",
    time: new Date().toLocaleString()
  });

  db.requests = db.requests.filter(r => r.user !== user);

  saveDB(db);

  res.json({ success: true });
});

// ================= REJECT =================
app.post("/reject", (req, res) => {
  let db = loadDB();

  const user = req.body.user;
  const reqData = db.requests.find(r => r.user === user);

  db.history.unshift({
    user: user,
    utr: reqData?.utr,
    status: "rejected",
    time: new Date().toLocaleString()
  });

  db.requests = db.requests.filter(r => r.user !== user);

  saveDB(db);

  res.json({ success: true });
});

// ================= STOCK =================
app.post("/addStock", (req, res) => {
  let db = loadDB();

  let { plan, key } = req.body;

  if (!db.stock[plan]) db.stock[plan] = [];

  db.stock[plan].push(key);

  saveDB(db);

  res.json({ success: true });
});

// ================= HISTORY =================
app.get("/history", (req, res) => {
  const db = loadDB();
  res.json(db.history);
});

// ================= START =================
app.listen(PORT, () => {
  console.log("🔥 Server Running on " + PORT);
});
