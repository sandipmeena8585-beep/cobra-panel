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
    history: [],  
    refresh: 0  
  }, null, 2));  
}  

// ================= LOAD DB =================  
function loadDB() {  
  let data = JSON.parse(fs.readFileSync(DB_FILE));  

  if (data.refresh === undefined) {  
    data.refresh = 0;  
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));  
  }  

  return data;  
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

app.post("/toggle", (req, res) => {  
  let db = loadDB();  
  db.systemOn = !db.systemOn;  
  saveDB(db);  
  res.json({ on: db.systemOn });  
});  

app.get("/status", (req, res) => {  
  const db = loadDB();  
  res.json({ on: db.systemOn, refresh: db.refresh });  
});  

// 🔥 REFRESH SIGNAL (FIXED)
app.post("/refresh", (req,res)=>{  
  let db = loadDB();  
  db.refresh = Date.now() + Math.floor(Math.random()*1000);  
  saveDB(db);  
  res.json({ ok:true });  
});  

// ================= SETTINGS =================  

app.get("/settings", (req, res) => {  
  const db = loadDB();  
  res.json({  
    upi: db.upi,  
    qr: db.qr  
  });  
});  

app.post("/settings", (req, res) => {  
  let db = loadDB();  
  db.upi = req.body.upi;  
  db.qr = req.body.qr;  
  saveDB(db);  
  res.json({ success: true });  
});  

// ================= PLANS =================  

app.get("/plans", (req, res) => {  
  const db = loadDB();  
  res.json(db.plans);  
});  

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

app.get("/stock", (req, res) => {  
  const db = loadDB();  
  res.json(db.stock);  
});  

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

app.post("/buy", (req, res) => {  
  let db = loadDB();  

  // 🔥 PLAN PRICE FIX
  let planData = db.plans.find(p => (p.type + p.time) === req.body.plan);

  db.requests.push({  
    user: req.body.user,  
    plan: req.body.plan,  
    price: planData ? planData.price : "0",  
    utr: req.body.utr,  
    time: new Date().toLocaleString()  
  });  

  saveDB(db);  

  res.json({ success: true });  
});  

app.get("/requests", (req, res) => {  
  const db = loadDB();  
  res.json(db.requests);  
});  

// ================= APPROVE =================  

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

  db.history.unshift({  
    user: user,  
    plan: request.plan,  
    price: request.price,  
    utr: request.utr,  
    key: key,  
    status: "approved",  
    time: new Date().toLocaleString()  
  });  

  if (db.history.length > 5) {  
    db.history.pop();  
  }  

  db.requests = db.requests.filter(r => r.user !== user);  

  saveDB(db);  

  res.json({ key });  
});  

// ================= REJECT =================  

app.post("/reject", (req, res) => {  
  let db = loadDB();  

  const user = req.body.user;  

  const request = db.requests.find(r => r.user === user);  

  db.history.unshift({  
    user: user,  
    plan: request?.plan,  
    price: request?.price,  
    utr: request?.utr,  
    status: "rejected",  
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

app.get("/history", (req, res) => {  
  const db = loadDB();  
  res.json(db.history);  
});  

// ================= START =================  

app.listen(PORT, () => {  
  console.log("🔥 Server Running on " + PORT);  
});
