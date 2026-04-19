const express = require("express");
const fs = require("fs");
const multer = require("multer");
const axios = require("axios");

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));

const upload = multer({dest:"uploads/"});

// 🔥 TELEGRAM CONFIG
const BOT_TOKEN = "8390006157:AAHs0JAnW19B1iOIa8uUmfGfU5suLvtYwUo";
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
      requests:[],
      devices:{}
    }));
  }
  return JSON.parse(fs.readFileSync(FILE));
}

function saveData(data){
  fs.writeFileSync(FILE, JSON.stringify(data,null,2));
}

// ===== TELEGRAM FUNCTION =====
async function sendTelegram(msg){
  try{
    await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
      params:{
        chat_id: CHAT_ID,
        text: msg
      }
    });
  }catch(e){
    console.log("Telegram Error:", e.message);
  }
}

// ===== LOGIN =====
app.post("/login",(req,res)=>{
  let data = loadData();
  let {user,pass,device} = req.body;

  if(user==="COBRA SERVER" && pass==="SAMI9166"){
    if(!data.devices[user]){
      data.devices[user]=device;
    }

    if(data.devices[user]!==device){
      return res.json({status:"blocked"});
    }

    saveData(data);
    return res.json({status:"ok"});
  }

  res.json({status:"fail"});
});

// ===== ADMIN DATA =====
app.get("/admin/data",(req,res)=>{
  res.json(loadData().requests);
});

// ===== STOCK =====
app.get("/admin/stock",(req,res)=>{
  res.json(loadData().stock);
});

// ===== ADD KEY =====
app.post("/admin/addkey",(req,res)=>{
  let data = loadData();
  let {plan,key} = req.body;

  data.stock[plan].push(key);
  saveData(data);

  res.json({ok:true});
});

// ===== BUY (🔥 TELEGRAM ALERT HERE) =====
app.post("/buy", upload.single("file"), async (req,res)=>{

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

  // 🔥 TELEGRAM ALERT
  await sendTelegram(
`🔥 NEW REQUEST

📦 Plan: ${request.plan}
🧾 UTR: ${request.utr}
⏰ Time: ${request.time}`
  );

  res.send("ok");
});

// ===== VERIFY =====
app.get("/admin/verify/:id", async (req,res)=>{
  let data = loadData();
  let r = data.requests.find(x=>x.id==req.params.id);

  let key = data.stock[r.plan]?.shift() || "NO KEY";

  r.status="approved";
  r.key=key;

  saveData(data);

  // 🔥 TELEGRAM VERIFIED
  await sendTelegram(
`✅ VERIFIED

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

    await sendTelegram(
`❌ REJECTED

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
