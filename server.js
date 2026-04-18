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

// 📊 ADMIN STATS (ADVANCED)
app.get("/admin-stats",(req,res)=>{
  let pending = requests.filter(x=>x.status=="pending").length;
  let approved = requests.filter(x=>x.status=="approved").length;
  let rejected = requests.filter(x=>x.status=="rejected").length;
  let fake = requests.filter(x=>x.status=="fake").length;

  res.json({
    stock: keys,
    sold,
    total: requests.length,
    pending,
    approved,
    rejected,
    fake
  });
});

// 💰 FAKE PAYMENT CHECK
function isFakeUTR(utr){
  if(!utr) return true;
  if(utr.length < 6) return true;
  if(utr.toLowerCase().includes("test")) return true;
  return false;
}

// 🧾 BUY REQUEST
app.post("/buy", upload.single("image"), (req,res)=>{
  let { plan, utr } = req.body;

  let status = isFakeUTR(utr) ? "fake" : "pending";

  requests.push({
    id: Date.now(),
    plan,
    utr,
    image: req.file ? req.file.filename : "",
    status,
    key: null
  });

  fs.writeFileSync("requests.json", JSON.stringify(requests,null,2));

  res.send("Request Saved");
});

// 📥 GET ALL REQUESTS
app.get("/requests",(req,res)=>{
  res.json(requests);
});

// ➕ ADD KEY (PLAN WISE)
app.post("/add-key",(req,res)=>{
  let { plan, key } = req.body;

  if(!keys[plan]) keys[plan] = [];

  keys[plan].push(key);

  fs.writeFileSync("keys.json", JSON.stringify(keys,null,2));

  res.send("Key Added");
});

// ✅ VERIFY (NO DELETE — SAME DATA + KEY ASSIGN)
app.post("/verify",(req,res)=>{
  let { id } = req.body;

  let r = requests.find(x=>x.id==id);

  if(!r) return res.send("Request not found");

  if(r.status === "approved"){
    return res.send("Already approved");
  }

  let plan = r.plan;

  if(!keys[plan] || keys[plan].length === 0){
    return res.send("No stock ❌");
  }

  let key = keys[plan].shift(); // 👈 PLAN-WISE KEY

  r.status = "approved";
  r.key = key;

  sold++;

  fs.writeFileSync("keys.json", JSON.stringify(keys,null,2));
  fs.writeFileSync("requests.json", JSON.stringify(requests,null,2));

  res.json({key});
});

// ❌ REJECT
app.post("/reject",(req,res)=>{
  let { id } = req.body;

  let r = requests.find(x=>x.id==id);

  if(!r) return res.send("Request not found");

  r.status = "rejected";

  fs.writeFileSync("requests.json", JSON.stringify(requests,null,2));

  res.send("Rejected");
});

// 🔍 CUSTOMER CHECK KEY (UTR BASED)
app.get("/my-key/:utr",(req,res)=>{
  let utr = req.params.utr;

  let r = requests.find(x=>x.utr==utr && x.status=="approved");

  if(!r){
    return res.json({status:"pending"});
  }

  res.json({
    status:"approved",
    key:r.key
  });
});

// 🚀 SERVER START
app.listen(3000, ()=>{
  console.log("🔥 COBRA FULL SYSTEM RUNNING");
});
