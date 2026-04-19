const express = require("express");
const fs = require("fs");
const multer = require("multer");
const fetch = require("node-fetch");

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));

const upload = multer({dest:"uploads/"});

// 🔥 TELEGRAM CONFIG
const BOT_TOKEN = "8390006157:AAFyEdJMkvxV_rPc9IHhQkXOJkKCWEDxJGg";
const CHAT_ID = "7707237527";

// 🔥 DATA FILE
const FILE = "data.json";

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

// 🔥 TELEGRAM SEND
async function sendTelegram(msg){
  try{
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
      method:"POST",
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        chat_id: CHAT_ID,
        text: msg
      })
    });
  }catch(e){
    console.log("Telegram Error",e.message);
  }
}

// 🔥 ADD KEY
app.post("/admin/addkey",(req,res)=>{
  let data = loadData();
  let {plan,key} = req.body;

  if(!data.stock[plan]) data.stock[plan]=[];

  data.stock[plan].push(key);

  saveData(data);

  res.json({ok:true});
});

// 🔥 DELETE KEY
app.post("/admin/deletekey",(req,res)=>{
  let data = loadData();
  let {plan,key} = req.body;

  data.stock[plan] = data.stock[plan].filter(k=>k!==key);

  saveData(data);

  res.send("deleted");
});

// 🔥 GET STOCK
app.get("/admin/stock",(req,res)=>{
  let data = loadData();
  res.json({stock:data.stock});
});

// 🔥 BUY REQUEST + TELEGRAM ALERT
app.post("/buy", upload.single("file"), async (req,res)=>{

  let data = loadData();

  let id = Date.now();

  let request = {
    id,
    plan:req.body.plan,
    utr:req.body.utr,
    time:req.body.time,
    status:"pending",
    file:req.file ? req.file.filename : null
  };

  data.requests.push(request);

  saveData(data);

  // 🔥 TELEGRAM ALERT
  let msg = `
🔥 NEW PAYMENT REQUEST

📦 Plan: ${request.plan}
🧾 UTR: ${request.utr || "N/A"}
⏰ Time: ${request.time}
`;

  await sendTelegram(msg);

  res.send("ok");
});

// 🔥 ADMIN DATA
app.get("/admin/data",(req,res)=>{
  let data = loadData();
  res.json(data.requests);
});

// 🔥 VERIFY
app.get("/admin/verify/:id", async (req,res)=>{

  let data = loadData();
  let id = parseInt(req.params.id);

  let reqItem = data.requests.find(x=>x.id===id);
  if(!reqItem) return res.send("not found");

  let plan = reqItem.plan;

  // 🔥 SAFE STOCK REMOVE
  let key = data.stock[plan] && data.stock[plan].length
    ? data.stock[plan].shift()
    : null;

  reqItem.status = "approved";
  reqItem.key = key || "NO KEY";
  reqItem.expiry = new Date(Date.now()+86400000).toLocaleString();
  reqItem.channel = "https://t.me/GODx_COBRA";

  saveData(data);

  // 🔥 TELEGRAM VERIFY ALERT
  let msg = `
✅ PAYMENT VERIFIED

📦 Plan: ${reqItem.plan}
🔑 Key: ${reqItem.key}
⏰ Time: ${reqItem.time}
`;

  await sendTelegram(msg);

  res.send("verified");
});

// 🔥 REJECT
app.get("/admin/reject/:id", async (req,res)=>{
  let data = loadData();
  let id = parseInt(req.params.id);

  let reqItem = data.requests.find(x=>x.id===id);

  if(reqItem){
    reqItem.status="rejected";

    // 🔥 TELEGRAM REJECT ALERT
    await sendTelegram(`
❌ PAYMENT REJECTED

📦 Plan: ${reqItem.plan}
⏰ Time: ${reqItem.time}
`);
  }

  saveData(data);

  res.send("rejected");
});

// 🔥 STATUS CHECK (CUSTOMER)
app.get("/status/:utr",(req,res)=>{

  let data = loadData();
  let utr = req.params.utr;

  let r = data.requests.find(x=>x.utr==utr);

  if(!r) return res.json({status:"pending"});

  res.json(r);
});

app.listen(3000,()=>console.log("🚀 SERVER RUNNING"));
