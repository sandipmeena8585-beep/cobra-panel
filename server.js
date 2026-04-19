const express = require("express");
const fs = require("fs");
const multer = require("multer");
const axios = require("axios");

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

// ✅ STATIC FIRST (IMPORTANT)
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const upload = multer({dest:"uploads/"});
const FILE="data.json";
const SETTINGS_FILE="settings.json";

// 🔥 TELEGRAM
const BOT_TOKEN="PUT_TOKEN";
const CHAT_ID="PUT_CHAT_ID";

async function sendTelegram(msg){
  try{
    await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
      params:{chat_id:CHAT_ID,text:msg}
    });
  }catch(e){}
}

// ✅ SETTINGS FILE CREATE
if(!fs.existsSync(SETTINGS_FILE)){
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ customerEnabled:true }));
}

// ================= ✅ CUSTOMER PANEL CONTROL (FIXED) =================
app.use((req,res,next)=>{

  // ✅ ADMIN ALWAYS ALLOW
  if(req.url.startsWith("/admin")) return next();

  // ✅ STATIC FILES ALLOW (VERY IMPORTANT)
  if(req.url.match(/\.(css|js|png|jpg|jpeg|gif|html)$/)) return next();

  let setting = { customerEnabled:true };

  try{
    if(fs.existsSync(SETTINGS_FILE)){
      setting = JSON.parse(fs.readFileSync(SETTINGS_FILE));
    }
  }catch(e){}

  // ❌ BLOCK CUSTOMER
  if(!setting.customerEnabled){
    return res.send(`
      <h2 style="text-align:center;margin-top:60px;font-family:sans-serif;">
        🚫 SERVER UNDER MAINTENANCE <br><br>
        Try again later
      </h2>
    `);
  }

  next();
});
// ====================================================================

// ================= TOGGLE SYSTEM =================
app.get("/admin/settings",(req,res)=>{
  const data = JSON.parse(fs.readFileSync(SETTINGS_FILE));
  res.json(data);
});

app.post("/admin/toggleCustomer",(req,res)=>{
  const { enabled } = req.body;
  const newData = { customerEnabled: enabled };

  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newData));
  res.json(newData);
});
// =================================================

// ================= DATA =================
function loadData(){
  if(!fs.existsSync(FILE)){
    fs.writeFileSync(FILE,JSON.stringify({
      stock:{ "1hour":[], "3hour":[], "1day":[], "3day":[], "7day":[] },
      requests:[],
      devices:{}
    }));
  }
  return JSON.parse(fs.readFileSync(FILE));
}

function saveData(d){
  fs.writeFileSync(FILE,JSON.stringify(d,null,2));
}

// 🔐 LOGIN
app.post("/login", async (req,res)=>{
  let d=loadData();
  let {user,pass,device}=req.body;

  if(user==="COBRA SERVER" && pass==="SAMI9166"){

    await sendTelegram(`🔐 LOGIN SUCCESS\nDevice: ${device}`);

    if(!d.devices[user]) d.devices[user]=device;

    if(d.devices[user]!==device){
      await sendTelegram(`🚫 BLOCKED DEVICE LOGIN`);
      return res.json({status:"blocked"});
    }

    saveData(d);
    return res.json({status:"ok"});
  }

  await sendTelegram(`❌ WRONG LOGIN ATTEMPT`);
  res.json({status:"fail"});
});

// REQUEST LIST
app.get("/admin/data",(req,res)=>{
  res.json(loadData().requests);
});

// STOCK
app.get("/admin/stock",(req,res)=>{
  res.json(loadData().stock);
});

// ➕ ADD KEY
app.post("/admin/addkey",(req,res)=>{
  let d=loadData();
  let {plan,key}=req.body;

  if(!d.stock[plan]) d.stock[plan]=[];

  d.stock[plan].push(key);
  sendTelegram(`➕ KEY ADDED\n${key}\nPlan: ${plan}`);

  saveData(d);
  res.json({ok:true});
});

// ❌ DELETE KEY
app.post("/admin/deletekey",(req,res)=>{
  let d=loadData();
  let {plan,key}=req.body;

  if(!d.stock[plan]) return res.send("no plan");

  d.stock[plan]=d.stock[plan].filter(k=>k!==key);
  sendTelegram(`❌ KEY DELETED\n${key}\nPlan: ${plan}`);

  saveData(d);
  res.send("ok");
});

// 🛒 BUY
app.post("/buy",upload.single("file"), async (req,res)=>{
  let d=loadData();

  let r={
    id:Date.now(),
    plan:req.body.plan,
    utr:req.body.utr,
    time:req.body.time,
    file:req.file?req.file.filename:null,
    status:"pending"
  };

  d.requests.push(r);
  saveData(d);

  await sendTelegram(`🔥 NEW REQUEST\nPlan: ${r.plan}\nUTR: ${r.utr}`);

  res.send("ok");
});

// ✅ VERIFY
app.get("/admin/verify/:id", async (req,res)=>{
  let d=loadData();
  let r=d.requests.find(x=>x.id==req.params.id);

  if(!r) return res.send("not found");
  if(r.status!=="pending") return res.send("done");

  let key="NO KEY";

  if(d.stock[r.plan] && d.stock[r.plan].length>0){
    key=d.stock[r.plan].shift();
  }

  r.status="approved";
  r.key=key;

  saveData(d);

  await sendTelegram(`✅ VERIFIED\nPlan: ${r.plan}\nKey: ${key}`);

  if(d.stock[r.plan] && d.stock[r.plan].length<=2){
    await sendTelegram(`⚠ LOW STOCK\n${r.plan} = ${d.stock[r.plan].length}`);
  }

  res.send("ok");
});

// ❌ REJECT
app.get("/admin/reject/:id", async (req,res)=>{
  let d=loadData();
  let r=d.requests.find(x=>x.id==req.params.id);

  if(!r) return res.send("not found");

  r.status="rejected";
  saveData(d);

  await sendTelegram(`❌ REJECTED\nPlan: ${r.plan}`);

  res.send("ok");
});

// 🚀 START
app.listen(3000,()=>console.log("🚀 SERVER RUNNING"));
