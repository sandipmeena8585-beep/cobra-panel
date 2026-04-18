const express = require("express");
const fs = require("fs");
const multer = require("multer");

const app = express();

app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const upload = multer({ dest: "uploads/" });

// 📦 LOAD DATA
let keys = require("./keys.json");
let requests = require("./requests.json");

let sold = 0;

// 📊 ADMIN STATS
app.get("/admin-stats", (req,res)=>{
  res.json({
    stock: keys,
    sold,
    requests: requests.length
  });
});

// 🧾 BUY REQUEST
app.post("/buy", upload.single("image"), (req,res)=>{
  let { plan, utr } = req.body;

  requests.push({
    id: Date.now(),
    plan,
    utr,
    image: req.file.filename,
    status: "pending"
  });

  fs.writeFileSync("requests.json", JSON.stringify(requests,null,2));
  res.send("OK");
});

// 📥 ALL REQUESTS
app.get("/requests",(req,res)=>{
  res.json(requests);
});

// ➕ ADD KEY (PLAN WISE)
app.post("/add-key",(req,res)=>{
  let { plan, key } = req.body;

  if(!keys[plan]){
    keys[plan] = [];
  }

  keys[plan].push(key);

  fs.writeFileSync("keys.json", JSON.stringify(keys,null,2));

  res.send("Key Added ✅");
});

// ✅ VERIFY (PLAN WISE KEY)
app.post("/verify",(req,res)=>{
  let { id } = req.body;

  let r = requests.find(x => x.id == id);

  if(!r) return res.send("Request not found ❌");

  let plan = r.plan;

  if(!keys[plan] || keys[plan].length === 0){
    return res.send("No stock ❌");
  }

  let key = keys[plan].shift(); // 👈 correct plan key
  sold++;

  r.status = "approved";
  r.key = key;

  fs.writeFileSync("keys.json", JSON.stringify(keys,null,2));
  fs.writeFileSync("requests.json", JSON.stringify(requests,null,2));

  res.send("Approved ✅");
});

// ❌ REJECT
app.post("/reject",(req,res)=>{
  let { id } = req.body;

  let r = requests.find(x => x.id == id);

  if(!r) return res.send("Request not found ❌");

  r.status = "rejected";

  fs.writeFileSync("requests.json", JSON.stringify(requests,null,2));

  res.send("Rejected ❌");
});

// 🚀 START SERVER
app.listen(3000, ()=>{
  console.log("🔥 COBRA PANEL RUNNING ON 3000");
});
