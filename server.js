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
      devices:{}
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

// GET REQUEST
app.get("/admin/data",(req,res)=>{
  res.json(loadData().requests);
});

// STOCK
app.get("/admin/stock",(req,res)=>{
  res.json(loadData().stock);
});

// STOCK COUNT
app.get("/admin/stockcount",(req,res)=>{
  let d=loadData();
  let total=0;

  for(let p in d.stock){
    total += d.stock[p].length;
  }

  res.json({total});
});

// ADD KEY
app.post("/admin/addkey",(req,res)=>{
  let d=loadData();
  let {plan,key}=req.body;

  if(!key || !key.trim()){
    return res.json({ok:false});
  }

  if(!d.stock[plan]) d.stock[plan]=[];

  d.stock[plan].push(key);

  saveData(d);
  res.json({ok:true});
});

// DELETE KEY
app.post("/admin/deletekey",(req,res)=>{
  let d=loadData();
  let {plan,key}=req.body;

  if(d.stock[plan]){
    d.stock[plan]=d.stock[plan].filter(k=>k!==key);
  }

  saveData(d);
  res.json({ok:true});
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
  saveData(d);

  await sendTelegram(`🔥 NEW REQUEST\nPlan: ${r.plan}\nUTR: ${r.utr}`);

  res.send("ok");
});

// ✅ VERIFY (KEY REMOVE FROM STOCK)
app.get("/admin/verify/:id", async (req,res)=>{
  let d=loadData();
  let r=d.requests.find(x=>x.id==req.params.id);

  if(!r) return res.send("not found");

  // 🔥 REMOVE KEY FROM STOCK
  let key = "NO KEY";

  if(d.stock[r.plan] && d.stock[r.plan].length > 0){
    key = d.stock[r.plan].shift(); // ✅ REMOVE HERE
  }

  r.status="approved";
  r.key=key;

  let expiry = new Date(Date.now()+86400000).toLocaleString();

  saveData(d);

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

// REJECT
app.get("/admin/reject/:id", async (req,res)=>{
  let d=loadData();
  let r=d.requests.find(x=>x.id==req.params.id);

  if(r){
    r.warn++;

    if(r.warn==1){
      await sendTelegram(`⚠ WARNING\nFake Payment Attempt`);
    }else{
      await sendTelegram(`🚫 FINAL WARNING\nAccount Risk`);
    }

    r.status="rejected";
  }

  saveData(d);
  res.send("ok");
});

app.listen(3000,()=>console.log("🚀 RUNNING"));
