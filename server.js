const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ================= DATABASE FILE =================
const DB_FILE = "./data.json";

// CREATE DB IF NOT EXIST
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    systemOn: true,
    upi: "godxcobra@axl",
    qr: "/upi_qr.png",
    plans: [],
    stock: {},
    requests: [],
    history: []
  }, null, 2));
}

// LOAD DB
function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

// SAVE DB
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ================= ROUTES =================

// CUSTOMER PANEL
app.get("/", (req, res) => {
  const db = loadDB();

  if (!db.systemOn) {
    return res.send(`
      <h2 style="text-align:center;margin-top:50px">
      ⚠️ PLEASE WAIT ADMIN PANEL UPDATE
      </h2>
    `);
  }

  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ADMIN PANEL
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

// ================= SYSTEM =================

// ON / OFF PANEL
app.post("/toggle", (req, res) => {
  let db = loadDB();
  db.systemOn = !db.systemOn;
  saveDB(db);
  res.json({ on: db.systemOn });
});

// STATUS
app.get("/status", (req, res) => {
  const db = loadDB();
  res.json({ on: db.systemOn });
});

// ================= SETTINGS =================

// GET UPI + QR
app.get("/settings", (req, res) => {
  const db = loadDB();
  res.json({
    upi: db.upi,
    qr: db.qr
  });
});

// UPDATE UPI + QR
app.post("/settings", (req, res) => {
  let db = loadDB();

  db.upi = req.body.upi;
  db.qr = req.body.qr;

  saveDB(db);

  res.json({ success: true });
});

// ================= PLANS =================

// GET PLANS
app.get("/plans", (req, res) => {
  const db = loadDB();
  res.json(db.plans);
});

// SAVE PLANS (MAX 8)
app.post("/savePlans", (req, res) => {
  let db = loadDB();

  if (req.body.length > 8) {
    return res.json({ error: "Max 8 plans allowed" });
  }

  db.plans = req.body;
  saveDB(db);

  res.json({ success: true });
});

// ================= STOCK =================

// GET STOCK
app.get("/stock", (req, res) => {
  const db = loadDB();
  res.json(db.stock);
});

// ADD STOCK
app.post("/addStock", (req, res) => {
  let db = loadDB();

  const { plan, key } = req.body;

  if (!db.stock[plan]) {
    db.stock[plan] = [];
  }

  db.stock[plan].push(key);

  saveDB(db);

  res.json({ success: true });
});

// REMOVE STOCK (AUTO)
app.post("/removeStock", (req, res) => {
  let db = loadDB();

  const { plan } = req.body;

  if (db.stock[plan] && db.stock[plan].length > 0) {
    const key = db.stock[plan].shift();
    saveDB(db);
    return res.json({ key });
  }

  res.json({ error: "No stock available" });
});

// ================= REQUEST =================

// BUY REQUEST
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

// GET REQUESTS
app.get("/requests", (req, res) => {
  const db = loadDB();
  res.json(db.requests);
});

// APPROVE REQUEST
app.post("/approve", (req, res) => {
  let db = loadDB();

  const user = req.body.user;

  const request = db.requests.find(r => r.user === user);

  if (!request) {
    return res.json({ error: "Request not found" });
  }

  const plan = request.plan;

  if (!db.stock[plan] || db.stock[plan].length === 0) {
    return res.json({ error: "No stock for this plan" });
  }

  const key = db.stock[plan].shift();

  // ADD HISTORY
  db.history.unshift({
    user: user,
    plan: plan,
    key: key,
    status: "APPROVED",
    time: new Date().toLocaleString()
  });

  // KEEP ONLY LAST 5
  if (db.history.length > 5) {
    db.history.pop();
  }

  // REMOVE REQUEST
  db.requests = db.requests.filter(r => r.user !== user);

  saveDB(db);

  res.json({ key });
});

// REJECT REQUEST
app.post("/reject", (req, res) => {
  let db = loadDB();

  const user = req.body.user;

  db.history.unshift({
    user: user,
    status: "REJECTED",
    time: new Date().toLocaleString()
  });

  if (db.history.length > 5) {
    db.history.pop();
  }

  db.requests = db.requests.filter(r => r.user !== user);

  saveDB(db);

  res.json({ success: true });
});

// ================= HISTORY =================

// GET HISTORY
app.get("/history", (req, res) => {
  const db = loadDB();
  res.json(db.history);
});

// ================= START =================
app.listen(PORT, () => {
  console.log("🔥 Server Running on " + PORT);
});
