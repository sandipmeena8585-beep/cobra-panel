const express = require("express");
const fs = require("fs");
const multer = require("multer");
const axios = require("axios");

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const upload = multer({dest:"uploads/"});
const FILE="data.json";
const SETTINGS_FILE="settings.json";

// ✅ IMPORTANT (Render PORT FIX)
const PORT = process.env.PORT || 3000;

// 🔥 TELEGRAM
const BOT_TOKEN="PUT_TOKEN";
const CHAT_ID="PUT_CHAT_ID";

async function sendTelegram(msg){
  try{
    await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
      params:{chat_id:CHAT_ID,text:msg}
    });
  }catch(e){
    console.log("Telegram Error:", e.message);
  }
}

// ================= SETTINGS =================
if(!fs.existsSync(SETTINGS_FILE)){
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ customerEnabled:true }));
}

function loadSettings(){
  try{
    return JSON.parse(fs.readFileSync(SETTINGS_FILE));
  }catch{
    return {customerEnabled:true};
  }
}

function saveSettings(d){
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(d));
}

// ================= DATA =================
function loadData(){
  try{
    if(!fs.existsSync(FILE)){
      fs.writeFileSync(FILE,JSON.stringify({
        stock:{ "1hour":[], "3hour":[], "1day":[], "3day":[], "7day":[] },
        requests:[],
        devices:{},
        stats:{ sold:0, added:0, deleted:0 },
        history:[]
      }));
    }
    return JSON.parse(fs.readFileSync(FILE));
  }catch(e){
    console.log("Data error:", e.message);
    return {
      stock:{},requests:[],devices:{},
      stats:{ sold:0, added:0, deleted:0 },
      history:[]
    };
  }
}

function saveData(d){
  fs.writeFileSync(FILE,JSON.stringify(d,null,2));
}

// ================= HISTORY =================
function addHistory(text){
  let d = loadData();

  d.history.unshift(text);
  if(d.history.length > 5) d.history.pop();

  saveData(d);
}

// ================= CUSTOMER CONTROL =================
app.use((req,res,next)=>{
  if(req.url.startsWith("/admin")) return next();
  if(req.url.match(/\.(css|js|png|jpg|html)$/)) return next();

  let s = loadSettings();

  if(!s.customerEnabled){
    return res.send("<h2 style='text-align:center;margin-top:60px'>🚫 PLEASE WAIT UPDATE COBRA SERVER PRICE</h2>");
  }

  next();
});

// ================= TOGGLE =================
app.get("/admin/settings",(req,res)=>{
  res.json(loadSettings());
});

app.post("/admin/toggleCustomer",(req,res)=>{
  let {enabled} = req.body;
  let s = { customerEnabled: enabled };
  saveSettings(s);
  res.json(s);
});

// ================= LOGIN =================
app.post("/login", async (req,res)=>{
  let d=loadData();
  let {user,pass,device}=req.body;

  if(user==="COBRA SERVER" && pass==="SAMI9166"){

    await sendTelegram(`🔐 LOGIN SUCCESS\nDevice: ${device}`);

    if(!d.devices[user]) d.devices[user]=device;

    if(d.devices[user]!==device){
      return res.json({status:"blocked"});
    }

    saveData(d);
    return res.json({status:"ok"});
  }

  res.json({status:"fail"});
});

// ================= APIs =================
app.get("/admin/data",(req,res)=>{
  res.json(loadData().requests);
});

app.get("/admin/stock",(req,res)=>{
  res.json(loadData().stock);
});

app.get("/admin/stats",(req,res)=>{
  res.json(loadData().stats);
});

app.get("/admin/history",(req,res)=>{
  res.json(loadData().history);
});

// ================= ADD =================
app.post("/admin/addkey",(req,res)=>{
  let d=loadData();
  let {plan,key}=req.body;

  if(!d.stock[plan]) d.stock[plan]=[];

  d.stock[plan].push(key);
  d.stats.added++;
  addHistory(`➕ Added ${key}`);

  saveData(d);
  res.json({ok:true});
});

// ================= DELETE =================
app.post("/admin/deletekey",(req,res)=>{
  let d=loadData();
  let {plan,key}=req.body;

  if(!d.stock[plan]) return res.send("no plan");

  d.stock[plan]=d.stock[plan].filter(k=>k!==key);
  d.stats.deleted++;
  addHistory(`❌ Deleted ${key}`);

  saveData(d);
  res.send("ok");
});

// ================= BUY =================
app.post("/buy",upload.single("file"),(req,res)=>{
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

  res.send("ok");
});

// ================= VERIFY =================
app.get("/admin/verify/:id",(req,res)=>{
  let d=loadData();
  let r=d.requests.find(x=>x.id==req.params.id);

  if(!r) return res.send("not found");

  let key = d.stock[r.plan]?.shift() || "NO KEY";

  r.status="approved";
  r.key=key;

  d.stats.sold++;
  addHistory(`💰 Sold ${key}`);

  saveData(d);
  res.send("ok");
});

// ================= REJECT =================
app.get("/admin/reject/:id",(req,res)=>{
  let d=loadData();
  let r=d.requests.find(x=>x.id==req.params.id);

  if(r) r.status="rejected";

  saveData(d);
  res.send("ok");
});

// ================= START =================
app.listen(PORT,()=>console.log("🚀 SERVER RUNNING ON", PORT));
