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
   key:"TRIAL-KEY-123",
   kill:"Kill limit 10-12 (LEGIT PLAY SAFE)",
   telegram:"https://t.me/GODx_COBRA"
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

// LOAD
function db(){
 let d={};
 try{
  d=JSON.parse(fs.readFileSync(DB));
 }catch(e){
  d={};
 }

 if(!d.stock) d.stock={};
 if(!d.requests) d.requests=[];
 if(!d.history) d.history=[];
 if(!d.refresh) d.refresh=0;

 // 🔥 TRIAL SAFETY
 if(!d.trial){
  d.trial={
   on:false,
   title:"FREE TRIAL 🎁",
   key:"TRIAL-KEY-123",
   kill:"Kill limit 10-12 (LEGIT PLAY SAFE)",
   telegram:"https://t.me/GODx_COBRA"
  };
 }

 return d;
}

function save(d){
 fs.writeFileSync(DB,JSON.stringify(d,null,2));
}

// ROUTES
app.get("/",(req,res)=>{
 let d=db();
 if(!d.systemOn) return res.send("<h2>⚠️ WAIT ADMIN</h2>");
 res.sendFile(path.join(__dirname,"public/index.html"));
});

app.get("/admin",(req,res)=>{
 res.sendFile(path.join(__dirname,"public/admin.html"));
});

app.get("/status",(req,res)=>{
 let d=db();
 res.json(d);
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

// REJECT
app.post("/reject",(req,res)=>{
 let d=db();
 d.requests=d.requests.filter(x=>x.user!==req.body.user);
 d.refresh=Date.now();
 save(d);
 res.json({ok:true});
});

app.get("/history",(req,res)=>res.json(db().history));


// ================= 🔥 TRIAL ROUTES =================

// GET
app.get("/trial",(req,res)=>{
 res.json(db().trial);
});

// TOGGLE
app.post("/trialToggle",(req,res)=>{
 let d=db();
 d.trial.on=!d.trial.on;
 d.refresh=Date.now();
 save(d);
 res.json({on:d.trial.on});
});

// UPDATE
app.post("/trialUpdate",(req,res)=>{
 let d=db();

 d.trial.title=req.body.title;
 d.trial.key=req.body.key;
 d.trial.kill=req.body.kill;
 d.trial.telegram=req.body.telegram;

 d.refresh=Date.now();
 save(d);

 res.json({ok:true});
});


// START
app.listen(3000,()=>console.log("🔥 RUNNING"));
