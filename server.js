const express = require("express");
const fs = require("fs");
const multer = require("multer");

const app = express();

app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const upload = multer({ dest: "uploads/" });

// 📦 DATA
let keys = require("./keys.json");
let requests = require("./requests.json");

let sold = 0;

// 📊 ADVANCED STATS
app.get("/admin-stats",(req,res)=>{
  let pending = requests.filter(x=>x.status=="pending").length;
  let approved = requests.filter(x=>x.status=="approved").length;
  let rejected = requests.filter(x=>x.status=="rejected").length;

  res.json({
    stock: keys,
    sold,
    totalRequests: requests.length,
    pending,
    approved,
    rejected
  });
});

// 💰 FAKE PAYMENT CHECK (basic)
function isFakeUTR(utr){
  if(!utr) return true;
  if(utr.length < 6) return true;
  if(utr.includes("test")) return true;
  return false;
}

// 🧾 BUY REQUEST
app.post("/buy", upload.single("image"), (req,res)=>{
  let { plan, utr } = req.body;

  let fake = isFakeUTR(utr);

  requests.push({
    id: Date.now(),
    plan,
    utr,
    image: req.file.filename,
    status: fake ? "fake" : "pending"
  });

  fs.writeFileSync("requests.json", JSON.stringify(requests,null,2));
  res.send("OK");
});

// 📥 GET REQUESTS
app.get("/requests",(req,res)=>{
  res.json(requests);
});

// ➕ ADD KEY
app.post("/add-key",(req,res)=>{
  let { plan, key } = req.body;

  if(!keys[plan]) keys[plan]=[];

  keys[plan].push(key);

  fs.writeFileSync("keys.json", JSON.stringify(keys,null,2));

  res.send("Added");
});

// ✅ VERIFY → KEY AUTO SEND + REMOVE REQUEST
app.post("/verify",(req,res)=>{
  let { id } = req.body;

  let index = requests.findIndex(x=>x.id==id);
  let r = requests[index];

  if(!r) return res.send("Not found");

  let plan = r.plan;

  if(!keys[plan] || keys[plan].length === 0){
    return res.send("No stock");
  }

  let key = keys[plan].shift(); // 👈 single key
  sold++;

  // 👇 remove request (IMPORTANT)
  requests.splice(index,1);

  fs.writeFileSync("keys.json", JSON.stringify(keys,null,2));
  fs.writeFileSync("requests.json", JSON.stringify(requests,null,2));

  res.json({
    key
  });
});

// ❌ REJECT
app.post("/reject",(req,res)=>{
  let { id } = req.body;

  let index = requests.findIndex(x=>x.id==id);
  if(index==-1) return res.send("Not found");

  requests.splice(index,1);

  fs.writeFileSync("requests.json", JSON.stringify(requests,null,2));

  res.send("Rejected");
});

app.listen(3000, ()=>console.log("🔥 PRO MAX RUNNING"));
