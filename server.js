const express=require("express");
const fs=require("fs");
const path=require("path");

const app=express();
app.use(express.json({limit:"10mb"}));
app.use(express.static("public"));

const DB="./data.json";

// CREATE DB
if(!fs.existsSync(DB)){
 fs.writeFileSync(DB,JSON.stringify({
  systemOn:true,
  upi:"godxcobra@axl",
  qr:"",
  color:"#22c55e",
  textColor:"#ffffff",
  title:"COBRA SERVER PANEL",
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

 if(!data.textColor) data.textColor="#ffffff";
 if(!data.stock) data.stock={};
 if(data.refresh===undefined) data.refresh=0;

 fs.writeFileSync(DB,JSON.stringify(data,null,2));
 return data;
}

function save(d){
 fs.writeFileSync(DB,JSON.stringify(d,null,2));
}

// ROUTES
app.get("/",(req,res)=>{
 const d=db();
 if(!d.systemOn){
  return res.send("<h2>⚠️ PLEASE WAIT ADMIN UPDATE</h2>");
 }
 res.sendFile(path.join(__dirname,"public/index.html"));
});

app.get("/admin",(req,res)=>{
 res.sendFile(path.join(__dirname,"public/admin.html"));
});

app.get("/status",(req,res)=>{
 const d=db();
 res.json({on:d.systemOn,refresh:d.refresh});
});

app.post("/toggle",(req,res)=>{
 let d=db();
 d.systemOn=!d.systemOn;
 save(d);
 res.json({on:d.systemOn});
});

app.post("/refresh",(req,res)=>{
 let d=db();
 d.refresh=Date.now();
 save(d);
 res.json({ok:true});
});

// SETTINGS
app.post("/settings",(req,res)=>{
 let d=db();

 if(req.body.upi !== undefined) d.upi=req.body.upi;
 if(req.body.qr !== undefined) d.qr=req.body.qr; // 🔥 FIX
 if(req.body.color !== undefined) d.color=req.body.color;
 if(req.body.title !== undefined) d.title=req.body.title;
 if(req.body.textColor !== undefined) d.textColor=req.body.textColor;

 save(d);
 res.json({ok:true});
});

app.get("/settings",(req,res)=>{
 let d=db();
 res.json({
  upi:d.upi,
  qr:d.qr,
  color:d.color,
  title:d.title,
  textColor:d.textColor
 });
});

// PLANS
app.get("/plans",(req,res)=>res.json(db().plans));

app.post("/savePlans",(req,res)=>{
 let d=db();
 d.plans=req.body;
 save(d);
 res.json({ok:true});
});

// BUY
app.post("/buy",(req,res)=>{
 let d=db();

 // 🔥 duplicate UTR block
 if(d.requests.find(x=>x.utr===req.body.utr)){
  return res.json({ok:true});
 }

 d.requests.push({
  user:req.body.user,
  plan:(req.body.plan||"").trim(),
  price:req.body.price,
  utr:req.body.utr,
  time:new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})
 });

 save(d);
 res.json({ok:true});
});

// REQUEST
app.get("/requests",(req,res)=>res.json(db().requests));

// APPROVE
app.post("/approve",(req,res)=>{
 let d=db();
 let r=d.requests.find(x=>x.user===req.body.user);

 if(!r) return res.json({});

 let plan=(r.plan||"").trim();
 let key="NO STOCK";

 if(d.stock[plan]?.length>0){
  key=d.stock[plan].shift(); // 🔥 1 tap = 1 key remove
 }

 d.history.unshift({
  ...r,
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

 // 🔥 save reject history
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
app.get("/history",(req,res)=>res.json(db().history));

// STOCK
app.get("/stock",(req,res)=>res.json(db().stock));

app.post("/addStock",(req,res)=>{
 let d=db();

 let plan=(req.body.plan||"").trim();
 let key=(req.body.key||"").trim();

 if(!plan || !key) return res.json({ok:false});

 if(!d.stock[plan]) d.stock[plan]=[];

 d.stock[plan].push(key);

 save(d);
 res.json({ok:true});
});

app.post("/deleteStock",(req,res)=>{
 let d=db();

 if(d.stock[req.body.plan] && d.stock[req.body.plan][req.body.index]){
  d.stock[req.body.plan].splice(req.body.index,1);
 }

 save(d);
 res.json({ok:true});
});

// START
app.listen(3000,()=>console.log("🔥 SERVER RUNNING"));
