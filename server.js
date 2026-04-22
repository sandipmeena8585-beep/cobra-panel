const express=require("express");
const fs=require("fs");
const path=require("path");
const multer=require("multer");

const app=express();
app.use(express.json({limit:"10mb"}));
app.use(express.static("public"));

const DB="./data.json";

// folders
if(!fs.existsSync("public")) fs.mkdirSync("public");
if(!fs.existsSync("public/uploads")) fs.mkdirSync("public/uploads",{recursive:true});

// upload
const storage=multer.diskStorage({
 destination:(req,file,cb)=>cb(null,"public/uploads"),
 filename:(req,file,cb)=>cb(null,Date.now()+"_"+file.originalname)
});
const upload=multer({storage});

// create db
if(!fs.existsSync(DB)){
 fs.writeFileSync(DB,JSON.stringify({
  systemOn:true,
  upi:"godxcobra@axl",
  qr:"",
  color:"#22c55e",
  textColor:"#ffffff",
  title:"COBRA SERVER PANEL",

  // 🔥 UPDATED PLANS
  plans:[
   {type:"",time:"5H",price:"50"},
   {type:"",time:"1 DAY",price:"120"},
   {type:"",time:"3 DAY",price:"200"},
   {type:"",time:"7 DAY",price:"400"},
   {type:"",time:"15 DAY",price:"600"},
   {type:"",time:"30 DAY",price:"1000"},
   {type:"",time:"60 DAY",price:"1200"},
   {type:"",time:"FULL SESSION",price:"1400"}
  ],

  stock:{},
  requests:[],
  history:[],
  refresh:0,

  trial:{
   on:false,
   title:"FREE TRIAL",
   key:"TRIAL-KEY-123",
   kill:"Kill limit 10",
   telegram:"https://t.me/GODx_COBRA",
   updates:["Welcome Trial","Play Safe"]
  }

 },null,2));
}

function db(){ return JSON.parse(fs.readFileSync(DB)); }
function save(d){ fs.writeFileSync(DB,JSON.stringify(d,null,2)); }

// ROUTES
app.get("/",(req,res)=>{
 let d=db();
 if(!d.systemOn) return res.send("<h2>⚠️ PLEASE WAIT ADMIN</h2>");
 res.sendFile(path.join(__dirname,"public/index.html"));
});

app.get("/admin",(req,res)=>{
 res.sendFile(path.join(__dirname,"public/admin.html"));
});

app.get("/status",(req,res)=>{
 res.json(db());
});

app.post("/toggle",(req,res)=>{
 let d=db();
 d.systemOn=!d.systemOn;
 d.refresh=Date.now();
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
app.get("/settings",(req,res)=>res.json(db()));

app.post("/settings",(req,res)=>{
 let d=db();
 Object.assign(d,req.body);
 d.refresh=Date.now();
 save(d);
 res.json({ok:true});
});

// QR
app.post("/uploadQR",upload.single("qr"),(req,res)=>{
 let d=db();
 if(req.file){
  d.qr="/uploads/"+req.file.filename;
  d.refresh=Date.now();
  save(d);
 }
 res.json({ok:true});
});

// PLANS
app.get("/plans",(req,res)=>res.json(db().plans));

app.post("/savePlans",(req,res)=>{
 let d=db();
 d.plans=req.body;
 d.refresh=Date.now();
 save(d);
 res.json({ok:true});
});

// STOCK
app.get("/stock",(req,res)=>res.json(db().stock));

app.post("/addStock",(req,res)=>{
 let d=db();
 let {plan,key}=req.body;
 if(!d.stock[plan]) d.stock[plan]=[];
 d.stock[plan].push(key);
 d.refresh=Date.now();
 save(d);
 res.json({ok:true});
});

app.post("/deleteStock",(req,res)=>{
 let d=db();
 let {plan,index}=req.body;
 d.stock[plan]?.splice(index,1);
 d.refresh=Date.now();
 save(d);
 res.json({ok:true});
});

// BUY
app.post("/buy",(req,res)=>{
 let d=db();

 let exist=d.history.find(x=>x.utr===req.body.utr);
 if(exist) return res.json({ok:true});

 d.requests.push({
  ...req.body,
  time:new Date().toLocaleString()
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

 let plan=r.plan;
 let key="NO STOCK";

 if(d.stock[plan]?.length>0){
  key=d.stock[plan].shift();
 }

 d.history.unshift({...r,key,status:"approved"});
 d.requests=d.requests.filter(x=>x.user!==r.user);

 d.refresh=Date.now();
 save(d);

 res.json({key});
});

// REJECT
app.post("/reject",(req,res)=>{
 let d=db();
 d.requests=d.requests.filter(x=>x.user!==req.body.user);
 d.refresh=Date.now();
 save(d);
 res.json({ok:true});
});

app.get("/history",(req,res)=>res.json(db().history));

// TRIAL
app.get("/trial",(req,res)=>{
 res.json(db().trial || {});
});

app.post("/trialToggle",(req,res)=>{
 let d=db();
 d.trial.on=!d.trial.on;
 d.refresh=Date.now();
 save(d);
 res.json({on:d.trial.on});
});

app.post("/trialSave",(req,res)=>{
 let d=db();
 d.trial={...d.trial,...req.body};
 d.refresh=Date.now();
 save(d);
 res.json({ok:true});
});

// START
app.listen(3000,()=>console.log("🔥 SERVER RUNNING"));
