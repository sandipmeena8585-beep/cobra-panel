const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// 🔥 MAIN DATA STORE
let systemOn = true;

let settings = {
  upi: "upi@id",
  qr: "/upi_qr.png"
};

let plans = []; // max 8
let stock = [];
let requests = [];

// ================= ROUTES =================

// HOME
app.get("/", (req,res)=>{
  if(!systemOn){
    return res.send("<h2 style='text-align:center'>⚠️ PLEASE WAIT ADMIN UPDATE</h2>");
  }
  res.sendFile(path.join(__dirname,"public/index.html"));
});

// ADMIN
app.get("/admin",(req,res)=>{
  res.sendFile(path.join(__dirname,"public/admin.html"));
});

// ================= CONTROL =================

// SYSTEM ON/OFF
app.post("/toggle",(req,res)=>{
  systemOn=!systemOn;
  res.json({on:systemOn});
});

// STATUS
app.get("/status",(req,res)=>{
  res.json({on:systemOn});
});

// ================= SETTINGS =================

// UPDATE UPI + QR
app.post("/settings",(req,res)=>{
  settings=req.body;
  res.json({ok:true});
});

app.get("/settings",(req,res)=>{
  res.json(settings);
});

// ================= PLANS =================

// ADD PLAN (MAX 8)
app.post("/addPlan",(req,res)=>{
  if(plans.length>=8) return res.json({error:"MAX 8 PLAN"});
  plans.push(req.body);
  res.json(plans);
});

app.get("/plans",(req,res)=>{
  res.json(plans);
});

app.post("/deletePlan",(req,res)=>{
  plans.splice(req.body.i,1);
  res.json(plans);
});

// ================= STOCK =================

app.post("/addStock",(req,res)=>{
  stock.push(req.body.key);
  res.json(stock);
});

app.get("/stock",(req,res)=>{
  res.json(stock);
});

app.post("/deleteStock",(req,res)=>{
  stock.splice(req.body.i,1);
  res.json(stock);
});

// ================= REQUEST =================

app.post("/buy",(req,res)=>{
  requests.push(req.body);
  res.json({ok:true});
});

app.get("/requests",(req,res)=>{
  res.json(requests);
});

app.post("/approve",(req,res)=>{
  requests = requests.filter(x=>x.user!==req.body.user);
  res.json({ok:true});
});

app.post("/reject",(req,res)=>{
  requests = requests.filter(x=>x.user!==req.body.user);
  res.json({ok:true});
});

// ================= START =================
app.listen(PORT, ()=>console.log("RUNNING "+PORT));
