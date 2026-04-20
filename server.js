const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ================= DATABASE FILE =================
const DB = "./data.json";

function loadDB(){
  if(!fs.existsSync(DB)){
    fs.writeFileSync(DB, JSON.stringify({
      systemOn:true,
      upi:"godxcobra@axl",
      qr:"/upi_qr.png",
      plans:[],
      stock:{},
      requests:[],
      history:[]
    }));
  }
  return JSON.parse(fs.readFileSync(DB));
}

function saveDB(data){
  fs.writeFileSync(DB, JSON.stringify(data,null,2));
}

// ================= ROUTES =================

// HOME (CUSTOMER PANEL CONTROL)
app.get("/", (req,res)=>{
  let db = loadDB();

  if(!db.systemOn){
    return res.send(`
      <h2 style="text-align:center;margin-top:50px">
      ⚠️ PLEASE WAIT ADMIN PANEL UPDATE
      </h2>
    `);
  }

  res.sendFile(path.join(__dirname,"public/index.html"));
});

// ADMIN
app.get("/admin",(req,res)=>{
  res.sendFile(path.join(__dirname,"public/admin.html"));
});

// ================= SYSTEM =================

app.post("/toggle",(req,res)=>{
  let db = loadDB();
  db.systemOn = !db.systemOn;
  saveDB(db);
  res.json({on:db.systemOn});
});

app.get("/status",(req,res)=>{
  let db = loadDB();
  res.json({on:db.systemOn});
});

// ================= SETTINGS =================

app.get("/settings",(req,res)=>{
  let db = loadDB();
  res.json({upi:db.upi, qr:db.qr});
});

app.post("/settings",(req,res)=>{
  let db = loadDB();
  db.upi = req.body.upi;
  db.qr = req.body.qr;
  saveDB(db);
  res.json({ok:true});
});

// ================= PLANS =================

app.get("/plans",(req,res)=>{
  let db = loadDB();
  res.json(db.plans);
});

app.post("/savePlans",(req,res)=>{
  let db = loadDB();

  if(req.body.length > 8){
    return res.json({error:"Max 8 plans"});
  }

  db.plans = req.body;
  saveDB(db);

  res.json({ok:true});
});

// ================= STOCK =================

app.get("/stock",(req,res)=>{
  let db = loadDB();
  res.json(db.stock);
});

app.post("/addStock",(req,res)=>{
  let db = loadDB();

  let {plan, key} = req.body;

  if(!db.stock[plan]) db.stock[plan]=[];

  db.stock[plan].push(key);

  saveDB(db);

  res.json({ok:true});
});

app.post("/removeStock",(req,res)=>{
  let db = loadDB();

  let {plan} = req.body;

  if(db.stock[plan] && db.stock[plan].length > 0){
    let key = db.stock[plan].shift();
    saveDB(db);
    res.json({key});
  }else{
    res.json({error:"No stock"});
  }
});

// ================= REQUEST =================

app.post("/buy",(req,res)=>{
  let db = loadDB();

  db.requests.push({
    user:req.body.user,
    plan:req.body.plan,
    utr:req.body.utr,
    time:new Date().toLocaleString()
  });

  saveDB(db);

  res.json({ok:true});
});

app.get("/requests",(req,res)=>{
  let db = loadDB();
  res.json(db.requests);
});

// APPROVE
app.post("/approve",(req,res)=>{
  let db = loadDB();

  let r = db.requests.find(x=>x.user===req.body.user);
  if(!r) return res.json({error:"not found"});

  let stock = db.stock[r.plan] || [];

  if(stock.length === 0){
    return res.json({error:"No Stock"});
  }

  let key = stock.shift();

  db.history.unshift({
    user:r.user,
    plan:r.plan,
    key:key,
    status:"APPROVED"
  });

  if(db.history.length>5) db.history.pop();

  db.requests = db.requests.filter(x=>x.user!==r.user);

  saveDB(db);

  res.json({key});
});

// REJECT
app.post("/reject",(req,res)=>{
  let db = loadDB();

  db.history.unshift({
    user:req.body.user,
    status:"REJECTED"
  });

  if(db.history.length>5) db.history.pop();

  db.requests = db.requests.filter(x=>x.user!==req.body.user);

  saveDB(db);

  res.json({ok:true});
});

// HISTORY
app.get("/history",(req,res)=>{
  let db = loadDB();
  res.json(db.history);
});

// ================= START =================
app.listen(PORT, ()=>console.log("RUNNING "+PORT));
