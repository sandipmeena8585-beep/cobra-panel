const express = require("express");
const fs = require("fs");
const multer = require("multer");

// ✅ fetch fix
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));

const upload = multer({dest:"uploads/"});

// ⚠️ IMPORTANT: NEW TOKEN USE KAR (old leak ho gaya hai)
const BOT_TOKEN = "8390006157:AAHkDjlT6VQNTMq-qfwYlPyBh1tQSQv8dVA";
const CHAT_ID = "7707237527";

const FILE = "data.json";

// ===== DATA =====
function loadData(){
  if(!fs.existsSync(FILE)){
    fs.writeFileSync(FILE, JSON.stringify({
      stock:{
        "1hour":[],
        "3hour":[],
        "1day":[],
        "3day":[],
        "7day":[]
      },
      requests:[]
    }));
  }
  return JSON.parse(fs.readFileSync(FILE));
}

function saveData(data){
  fs.writeFileSync(FILE, JSON.stringify(data,null,2));
}

// ===== ✅ TELEGRAM SEND (FINAL FIX) =====
async function sendTelegram(msg){
  try{
    console.log("📤 Sending Telegram...");

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(msg)}`;

    let res = await fetch(url);
    let data = await res.json();

    console.log("📡 TELEGRAM RESPONSE:", data);

  }catch(e){
    console.log("❌ TELEGRAM ERROR:", e.message);
  }
}

// ===== ADD KEY =====
app.post("/admin/addkey",(req,res)=>{
  let data = loadData();
  let {plan,key} = req.body;

  if(!data.stock[plan]) data.stock[plan] = [];

  data.stock[plan].push(key);

  console.log("✅ KEY ADDED:", plan, key);

  saveData(data);
  res.json({ok:true});
});

// ===== DELETE =====
app.post("/admin/deletekey",(req,res)=>{
  let data = loadData();
  let {plan,key} = req.body;

  data.stock[plan] = data.stock[plan].filter(k=>k!==key);

  console.log("❌ KEY DELETED:", key);

  saveData(data);
  res.send("deleted");
});

// ===== STOCK =====
app.get("/admin/stock",(req,res)=>{
  res.json(loadData().stock);
});

// ===== BUY =====
app.post("/buy", upload.single("file"), async (req,res)=>{

  console.log("🔥 NEW BUY REQUEST");

  let data = loadData();

  let request = {
    id: Date.now(),
    plan:req.body.plan,
    utr:req.body.utr,
    time:req.body.time,
    status:"pending",
    file:req.file ? req.file.filename : null
  };

  data.requests.push(request);
  saveData(data);

  await sendTelegram(
`🔥 NEW PAYMENT

📦 Plan: ${request.plan}
🧾 UTR: ${request.utr || "N/A"}
⏰ Time: ${request.time}`
  );

  res.send("ok");
});

// ===== ADMIN DATA =====
app.get("/admin/data",(req,res)=>{
  res.json(loadData().requests);
});

// ===== VERIFY =====
app.get("/admin/verify/:id", async (req,res)=>{

  let data = loadData();
  let id = parseInt(req.params.id);

  let r = data.requests.find(x=>x.id===id);
  if(!r) return res.send("not found");

  let key = data.stock[r.plan]?.shift() || "NO KEY";

  r.status="approved";
  r.key=key;
  r.expiry=new Date(Date.now()+86400000).toLocaleString();
  r.channel="https://t.me/GODx_COBRA";

  saveData(data);

  console.log("✅ VERIFIED:", r.plan, key);

  await sendTelegram(
`✅ PAYMENT VERIFIED

📦 ${r.plan}
🔑 ${key}`
  );

  res.send("ok");
});

// ===== REJECT =====
app.get("/admin/reject/:id", async (req,res)=>{

  let data = loadData();
  let r = data.requests.find(x=>x.id==req.params.id);

  if(r){
    r.status="rejected";

    console.log("❌ REJECTED:", r.plan);

    await sendTelegram(
`❌ PAYMENT REJECTED

📦 ${r.plan}`
    );
  }

  saveData(data);
  res.send("ok");
});

// ===== STATUS =====
app.get("/status/:utr",(req,res)=>{
  let r = loadData().requests.find(x=>x.utr==req.params.utr);
  res.json(r || {status:"pending"});
});

// ===== START =====
app.listen(3000,()=>console.log("🚀 SERVER RUNNING"));
