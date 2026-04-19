const express = require("express");
const fs = require("fs");
const multer = require("multer");
const axios = require("axios");

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));

const upload = multer({dest:"uploads/"});

const FILE = "data.json";

// TELEGRAM
const BOT_TOKEN = "8390006157:AAHs0JAnW19B1iOIa8uUmfGfU5suLvtYwUo";
const CHAT_ID = "7707237527";

async function sendTelegram(msg){
  try{
    await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
      params:{chat_id:CHAT_ID,text:msg}
    });
  }catch(e){}
}

// DATA
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
      devices:{},
      history:{
        added:[],
        removed:[],
        requests:[]
      }
    }));
  }
  return JSON.parse(fs.readFileSync(FILE));
}

function saveData(d){
  fs.writeFileSync(FILE, JSON.stringify(d,null,2));
}

// LOGIN
app.post("/login",(req,res)=>{
  let d=loadData();
  let {user,pass,device}=req.body;

  if(user==="COBRA SERVER" && pass==="SAMI9166"){
    if(!d.devices[user]) d.devices[user]=device;

    if(d.devices[user]!==device){
      return res.json({status:"blocked"});
    }

    saveData(d);
    return res.json({status:"ok"});
  }

  res.json({status:"fail"});
});

// GET REQUESTS
app.get("/admin/data",(req,res)=>{
  res.json(loadData().requests);
});

// STOCK
app.get("/admin/stock",(req,res)=>{
  res.json(loadData().stock);
});

// HISTORY
app.get("/admin/history",(req,res)=>{
  res.json(loadData().history);
});

// ADD KEY
app.post("/admin/addkey",(req,res)=>{
  let d=loadData();
  let {plan,key}=req.body;

  if(!d.stock[plan]) d.stock[plan]=[];
  d.stock[plan].push(key);

  d.history.added.push({
    key,
    plan,
    time:new Date().toLocaleString()
  });

  saveData(d);
  res.json({ok:true});
});

// DELETE KEY (ADMIN REMOVE)
app.post("/admin/deletekey",(req,res)=>{
  let d=loadData();
  let {plan,key}=req.body;

  d.stock[plan]=d.stock[plan].filter(k=>k!==key);

  d.history.removed.push({
    key,
    plan,
    time:new Date().toLocaleString(),
    by:"admin"
  });

  saveData(d);

  sendTelegram(`❌ ADMIN REMOVED KEY\n${key} (${plan})`);

  res.send("ok");
});

// BUY REQUEST
app.post("/buy",upload.single("file"), async (req,res)=>{
  let d=loadData();

  let r={
    id:Date.now(),
    plan:req.body.plan,
    utr:req.body.utr,
    time:req.body.time,
    file:req.file?req.file.filename:null,
    status:"pending",
    warn:0
  };

  d.requests.push(r);

  d.history.requests.push({
    plan:r.plan,
    utr:r.utr,
    time:r.time
  });

  saveData(d);

  await sendTelegram(`🔥 NEW REQUEST\nPlan: ${r.plan}\nUTR: ${r.utr}`);

  res.send("ok");
});

// VERIFY (YES PAYMENT)
app.get("/admin/verify/:id", async (req,res)=>{
  let d=loadData();
  let r=d.requests.find(x=>x.id==req.params.id);

  if(!r) return res.send("not found");

  let key = d.stock[r.plan]?.shift() || "NO KEY";

  r.status="approved";
  r.key=key;

  let expiry = new Date(Date.now()+86400000).toLocaleString();

  d.history.removed.push({
    key,
    plan:r.plan,
    time:new Date().toLocaleString(),
    by:"sell"
  });

  saveData(d);

  // ✅ BOT VERIFIED YES
  await sendTelegram(
`✅ PAYMENT RECEIVED

Plan: ${r.plan}
Key: ${key}

Expiry: ${expiry}

Channel: https://t.me/+wRZN39fdVcRkYTM9
Help: @GODx_COBRA
Setup: https://t.me/c/3525686026/5
OBB: https://t.me/c/3525686026/45

⚠ Kill limit 10-12 | Play Safe`
  );

  res.send("ok");
});

// REJECT (NO PAYMENT)
app.get("/admin/reject/:id", async (req,res)=>{
  let d=loadData();
  let r=d.requests.find(x=>x.id==req.params.id);

  if(r){
    r.warn++;

    // ❌ BOT VERIFIED NO
    if(r.warn==1){
      await sendTelegram(`⚠ WARNING\nFake Payment Attempt\nPlan: ${r.plan}`);
    }else{
      await sendTelegram(`🚫 FINAL WARNING\nAccount Risk\nPlan: ${r.plan}`);
    }

    r.status="rejected";
  }

  saveData(d);
  res.send("ok");
});

app.listen(3000,()=>console.log("🚀 SERVER RUNNING"));
