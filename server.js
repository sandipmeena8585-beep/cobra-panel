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

  // 🔥 TRIAL ADD
  trial:{
   on:false,
   title:"FREE TRIAL 🎁",
   keyText:"TRIAL-KEY",
   kill:"10-12",
   expire:"1 HOUR"
  },

  plans:[
   {type:"",time:"1D",price:"100"},
   {type:"",time:"7D",price:"400"}
  ],
  stock:{},
  requests:[],
  history:[],
  refresh:0
 },null,2));
}

function db(){ return JSON.parse(fs.readFileSync(DB)); }
function save(d){ fs.writeFileSync(DB,JSON.stringify(d,null,2)); }

// ROUTES
app.get("/",(req,res)=>{
 let d=db();
 if(!d.systemOn) return res.send("<h2>⚠️ WAIT ADMIN</h2>");
 res.sendFile(path.join(__dirname,"public/index.html"));
});

app.get("/admin",(req,res)=>{
 res.sendFile(path.join(__dirname,"public/admin.html"));
});

// STATUS
app.get("/status",(req,res)=>{
 let d=db();
 res.json({
  on:d.systemOn,
  refresh:d.refresh,
  color:d.color,
  textColor:d.textColor,
  title:d.title
 });
});

// TOGGLE
app.post("/toggle",(req,res)=>{
 let d=db();
 d.systemOn=!d.systemOn;
 d.refresh=Date.now();
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

// SETTINGS
app.get("/settings",(req,res)=>{
 let d=db();
 res.json({
  upi:d.upi,
  qr:d.qr,
  color:d.color,
  textColor:d.textColor,
  title:d.title
 });
});

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

// ================= TRIAL ROUTES =================

// GET
app.get("/trialSettings",(req,res)=>{
 let d=db();
 res.json(d.trial || {});
});

// UPDATE
app.post("/trialSettings",(req,res)=>{
 let d=db();

 if(!d.trial){
  d.trial={on:false};
 }

 d.trial.title=req.body.title;
 d.trial.keyText=req.body.keyText;
 d.trial.kill=req.body.kill;
 d.trial.expire=req.body.expire;

 save(d);
 res.json({ok:true});
});

// TOGGLE
app.post("/toggleTrial",(req,res)=>{
 let d=db();

 if(!d.trial){
  d.trial={on:false};
 }

 d.trial.on=!d.trial.on;

 save(d);
 res.json({on:d.trial.on});
});

// ================= PLANS =================
app.get("/plans",(req,res)=>res.json(db().plans));

app.post("/savePlans",(req,res)=>{
 let d=db();
 d.plans=req.body;
 d.refresh=Date.now();
 save(d);
 res.json({ok:true});
});

// ================= STOCK =================
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

// ================= BUY =================
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

// ================= REQUEST =================
app.get("/requests",(req,res)=>res.json(db().requests));

// ================= APPROVE =================
app.post("/approve",(req,res)=>{
 let d=db();
 let r=d.requests.find(x=>x.user===req.body.user);

 if(!r) return res.json({});

 if(r.done) return res.json({key:"ALREADY USED"});

 let plan=r.plan;
 let key="NO STOCK";

 if(d.stock[plan]?.length>0){
  key=d.stock[plan].shift();
 }

 r.done=true;

 d.history.unshift({...r,key,status:"approved"});
 d.requests=d.requests.filter(x=>x.user!==r.user);

 d.refresh=Date.now();
 save(d);

 res.json({key});
});

// ================= REJECT =================
app.post("/reject",(req,res)=>{
 let d=db();
 d.requests=d.requests.filter(x=>x.user!==req.body.user);
 d.refresh=Date.now();
 save(d);
 res.json({ok:true});
});

// ================= HISTORY =================
app.get("/history",(req,res)=>res.json(db().history));

// START
app.listen(3000,()=>console.log("🔥 RUNNING ON 3000"));
