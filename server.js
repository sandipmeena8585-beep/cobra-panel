const express=require("express");
const fs=require("fs");
const path=require("path");

const app=express();
app.use(express.json({limit:"10mb"})); // 🔥 QR base64 support
app.use(express.static("public"));

const DB="./data.json";

// CREATE DB
if(!fs.existsSync(DB)){
 fs.writeFileSync(DB,JSON.stringify({
  systemOn:true,
  upi:"godxcobra@axl",
  qr:"",
  plans:[
   {type:"",time:"5H",price:"50"},
   {type:"",time:"1D",price:"100"},
   {type:"",time:"3D",price:"200"},
   {type:"",time:"7D",price:"400"},
   {type:"",time:"15D",price:"600"},
   {type:"",time:"30D",price:"1000"},
   {type:"",time:"60D",price:"1200"},
   {type:"",time:"FULL",price:"1400"}
  ],
  stock:{},
  requests:[],
  history:[],
  refresh:0
 },null,2));
}

// LOAD
function db(){
 let data=JSON.parse(fs.readFileSync(DB));

 if(!data.plans || data.plans.length===0){
  data.plans=[
   {type:"",time:"5H",price:"50"},
   {type:"",time:"1D",price:"100"},
   {type:"",time:"3D",price:"200"},
   {type:"",time:"7D",price:"400"},
   {type:"",time:"15D",price:"600"},
   {type:"",time:"30D",price:"1000"},
   {type:"",time:"60D",price:"1200"},
   {type:"",time:"FULL",price:"1400"}
  ];
 }

 if(data.refresh===undefined){
  data.refresh=0;
 }

 if(!data.stock){
  data.stock={};
 }

 fs.writeFileSync(DB,JSON.stringify(data,null,2));
 return data;
}

// SAVE
function save(d){
 fs.writeFileSync(DB,JSON.stringify(d,null,2));
}

// ================= ROUTES =================

// CUSTOMER
app.get("/",(req,res)=>{
 const d=db();
 if(!d.systemOn){
  return res.send("<h2>⚠️ PLEASE WAIT ADMIN UPDATE</h2>");
 }
 res.sendFile(path.join(__dirname,"public/index.html"));
});

// ADMIN
app.get("/admin",(req,res)=>{
 res.sendFile(path.join(__dirname,"public/admin.html"));
});

// STATUS
app.get("/status",(req,res)=>{
 const d=db();
 res.json({on:d.systemOn,refresh:d.refresh});
});

// TOGGLE
app.post("/toggle",(req,res)=>{
 let d=db();
 d.systemOn=!d.systemOn;
 save(d);
 res.json({on:d.systemOn});
});

// REFRESH
app.post("/refresh",(req,res)=>{
 let d=db();
 d.refresh=Date.now();
 save(d);
 res.json({ok:true});
});

// ================= 🔥 SETTINGS (ADDED FIX) =================
app.post("/settings",(req,res)=>{
 let d=db();

 if(req.body.upi !== undefined){
  d.upi=req.body.upi;
 }

 // QR base64 save
 if(req.body.qr){
  d.qr=req.body.qr;
 }

 save(d);
 res.json({ok:true});
});

// GET SETTINGS
app.get("/settings",(req,res)=>{
 let d=db();
 res.json({upi:d.upi,qr:d.qr});
});

// ================= PLANS =================
app.get("/plans",(req,res)=>{
 res.json(db().plans);
});

app.post("/savePlans",(req,res)=>{
 let d=db();
 d.plans=req.body;
 save(d);
 res.json({ok:true});
});

// ================= BUY =================
app.post("/buy",(req,res)=>{
 let d=db();

 d.requests.push({
  user:req.body.user,
  plan:req.body.plan.trim(),
  price:req.body.price,
  utr:req.body.utr,
  time:new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})
 });

 save(d);
 res.json({ok:true});
});

// REQUEST
app.get("/requests",(req,res)=>{
 res.json(db().requests);
});

// APPROVE
app.post("/approve",(req,res)=>{
 let d=db();
 let r=d.requests.find(x=>x.user===req.body.user);
 if(!r)return res.json({});

 let plan=r.plan.trim();

 let key="NO STOCK";

 if(d.stock[plan] && d.stock[plan].length>0){
  key=d.stock[plan].shift();
 }

 d.history.unshift({
  user:r.user,
  plan:r.plan,
  price:r.price,
  utr:r.utr,
  key:key,
  status:"approved",
  time:new Date().toLocaleString()
 });

 d.requests=d.requests.filter(x=>x.user!==r.user);

 save(d);
 res.json({key});
});

// REJECT
app.post("/reject",(req,res)=>{
 let d=db();
 let r=d.requests.find(x=>x.user===req.body.user);

 d.history.unshift({
  user:r?.user,
  utr:r?.utr,
  status:"rejected",
  time:new Date().toLocaleString()
 });

 d.requests=d.requests.filter(x=>x.user!==req.body.user);

 save(d);
 res.json({ok:true});
});

// HISTORY
app.get("/history",(req,res)=>{
 res.json(db().history);
});

// ================= STOCK =================

// GET
app.get("/stock",(req,res)=>{
 res.json(db().stock);
});

// ADD STOCK
app.post("/addStock",(req,res)=>{
 let d=db();

 let plan=req.body.plan.trim();
 let key=req.body.key.trim();

 if(!plan || !key) return res.json({ok:false});

 if(!d.stock[plan]) d.stock[plan]=[];

 d.stock[plan].push(key);

 save(d);
 res.json({ok:true});
});

// DELETE STOCK
app.post("/deleteStock",(req,res)=>{
 let d=db();

 let plan=req.body.plan;
 let index=req.body.index;

 if(d.stock[plan] && d.stock[plan][index]){
  d.stock[plan].splice(index,1);
 }

 save(d);
 res.json({ok:true});
});

// START
app.listen(3000,()=>{
 console.log("🔥 SERVER RUNNING");
});
