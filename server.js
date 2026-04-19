const express = require("express");
const fs = require("fs");
const multer = require("multer");
const axios = require("axios");

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));

const upload = multer({dest:"uploads/"});

// 🔐 TELEGRAM
const BOT_TOKEN = "YOUR_NEW_TOKEN";
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
      devices:{} // 🔥 DEVICE STORAGE
    }));
  }
  return JSON.parse(fs.readFileSync(FILE));
}

function saveData(data){
  fs.writeFileSync(FILE, JSON.stringify(data,null,2));
}

// ===== TELEGRAM =====
async function sendTelegram(msg){
  try{
    await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
      params:{ chat_id: CHAT_ID, text: msg }
    });
  }catch(e){
    console.log("Telegram Error:", e.message);
  }
}

// ===== 🔐 LOGIN WITH DEVICE LOCK =====
app.post("/login", async (req,res)=>{

  let data = loadData();
  let {user,pass,device} = req.body;

  // 🔑 YOUR LOGIN
  if(user==="COBRA SERVER" && pass==="SAMI9166"){

    // first login save device
    if(!data.devices[user]){
      data.devices[user] = device;

      await sendTelegram(
`🆕 FIRST LOGIN

User: ${user}
Device: ${device}`
      );
    }

    // device check
    if(data.devices[user] !== device){
      return res.json({status:"blocked"});
    }

    saveData(data);

    await sendTelegram(
`🔐 LOGIN SUCCESS

User: ${user}`
    );

    return res.json({status:"ok"});

  }else{
    return res.json({status:"fail"});
  }
});

// ===== ADD KEY =====
app.post("/admin/addkey",(req,res)=>{
  let data = loadData();
  let {plan,key} = req.body;

  if(!data.stock[plan]) data.stock[plan] = [];

  data.stock[plan].push(key);

  saveData(data);
  res.json({ok:true});
});

// ===== DELETE =====
app.post("/admin/deletekey",(req,res)=>{
  let data = loadData();
  let {plan,key} = req.body;

  data.stock[plan] = data.stock[plan].filter(k=>k!==key);

  saveData(data);
  res.send("deleted");
});

// ===== STOCK =====
app.get("/admin/stock",(req,res)=>{
  res.json(loadData().stock);
});

// ===== BUY =====
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

  await sendTelegram(
`🔥 NEW PAYMENT

📦 Plan: ${request.plan}
🧾 UTR: ${request.utr}
⏰ Time: ${request.time}`
  );

  res.send("ok");
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

app.listen(3000,()=>console.log("🚀 SERVER RUNNING"));
