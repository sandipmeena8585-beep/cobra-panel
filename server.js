const express=require("express");
const fs=require("fs");
const path=require("path");
const multer=require("multer");

const app=express();
app.use(express.json({limit:"10mb"}));
app.use(express.static("public"));

const DB="./data.json";

// ===== FOLDER =====
if(!fs.existsSync("public")) fs.mkdirSync("public");
if(!fs.existsSync("public/uploads")) fs.mkdirSync("public/uploads",{recursive:true});

// ===== MULTER =====
const storage=multer.diskStorage({
 destination:(req,file,cb)=>cb(null,"public/uploads"),
 filename:(req,file,cb)=>cb(null,Date.now()+"_"+file.originalname)
});
const upload=multer({storage});

// ===== INIT DB =====
if(!fs.existsSync(DB)){
 fs.writeFileSync(DB,JSON.stringify({
  systemOn:true,
  upi:"godxcobra@axl",
  qr:"",
  color:"#22c55e",
  textColor:"#ffffff",
  title:"COBRA SERVER PANEL",

  trial:{
   on:false,
   title:"COBRA SERVER TRIAL",
   key:"TRIAL-KEY-123",
   kill:"Kill limit 10-12 LEGIT PLAY SAFE",
   telegram:"https://t.me/GODx_COBRA",
   expire:"Not Set"
  },

  plans:[
   {time:"5H",price:"50"},
   {time:"1D",price:"120"},
   {time:"3D",price:"200"},
   {time:"7D",price:"400"},
   {time:"15D",price:"600"},
   {time:"30D",price:"1000"},
   {time:"60D",price:"1200"},
   {time:"FULL",price:"1400"}
  ],

  stock:{},
  requests:[],
  history:[],
  spam:{},
  refresh:0

 },null,2));
}

// ===== LOAD =====
function db(){
 let d={};
 try{ d=JSON.parse(fs.readFileSync(DB)); }catch(e){ d={}; }

 if(!d.stock) d.stock={};
 if(!d.requests) d.requests=[];
 if(!d.history) d.history=[];
 if(!d.spam) d.spam={};
 if(!d.refresh) d.refresh=0;

 if(!d.trial){
  d.trial={
   on:false,
   title:"COBRA SERVER TRIAL",
   key:"TRIAL-KEY-123",
   kill:"Kill limit 10-12 LEGIT PLAY SAFE",
   telegram:"https://t.me/GODx_COBRA",
   expire:"Not Set"
  };
 }

 return d;
}

function save(d){
 fs.writeFileSync(DB,JSON.stringify(d,null,2));
}

// ===== ROUTES =====

// HOME
app.get("/",(req,res)=>{
 const d=db();
 if(!d.systemOn) return res.send("<h2>⚠️ PLEASE WAIT ADMIN UPDATE</h2>");
 res.sendFile(path.join(__dirname,"public/index.html"));
});

// ADMIN
app.get("/admin",(req,res)=>{
 res.sendFile(path.join(__dirname,"public/admin.html"));
});

// STATUS
app.get("/status",(req,res)=>{
 const d=db();
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

// ================= BUY FINAL =================
app.post("/buy",(req,res)=>{
 let d=db();
 let user=req.body.user;
 let now=Date.now();

 // ===== SPAM =====
 if(!d.spam[user]) d.spam[user]={count:0,time:0};

 if(d.spam[user].time > now){
  return res.json({
   blocked:true,
   time:Math.ceil((d.spam[user].time-now)/1000)
  });
 }

 // ===== APPROVED CHECK WITH EXPIRE =====
 let approved=d.history.find(x=>
  x.utr===req.body.utr &&
  x.plan===req.body.plan &&
  x.status==="approved"
 );

 if(approved){

  let created=new Date(approved.time).getTime();
  let expireTime=12*60*60*1000;

  // ❌ not expired
  if(now - created < expireTime){

   if(approved.claimed){
    return res.json({used:true});
   }

   approved.claimed=true;
   approved.claimTime=new Date().toLocaleString();
   save(d);

   return res.json({
    ok:true,
    key:approved.key,
    direct:true
   });

  }else{
   // 🔥 EXPIRED → remove old
   d.history=d.history.filter(x=>x!==approved);
  }
 }

 // ===== WRONG PLAN =====
 let wrong=d.history.find(x=>x.utr===req.body.utr && x.status==="approved");
 if(wrong){
  return res.json({wrongPlan:true});
 }

 // ===== NEW REQUEST =====
 if(!d.requests.find(x=>x.utr===req.body.utr)){
  d.requests.push({
   user:req.body.user,
   plan:req.body.plan,
   price:req.body.price,
   utr:req.body.utr,
   time:new Date().toLocaleString()
  });
 }else{
  d.spam[user].count++;
 }

 // ===== BLOCK =====
 if(d.spam[user].count>=3){
  d.spam[user].time=now + (5*60*1000);
  d.spam[user].count=0;

  save(d);

  return res.json({
   blocked:true,
   time:300
  });
 }

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

 let key="NO STOCK";

 if(d.stock[r.plan]?.length){
  key=d.stock[r.plan].shift(); // 🔥 REMOVE
 }

 d.history.unshift({
  ...r,
  key,
  status:"approved"
 });

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

// HISTORY
app.get("/history",(req,res)=>res.json(db().history));

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
 if(d.stock[req.body.plan]){
  d.stock[req.body.plan].splice(req.body.index,1);
 }
 d.refresh=Date.now();
 save(d);
 res.json({ok:true});
});

// TRIAL
app.get("/trial",(req,res)=>res.json(db().trial));

app.post("/trialToggle",(req,res)=>{
 let d=db();
 d.trial.on=!d.trial.on;
 d.refresh=Date.now();
 save(d);
 res.json({on:d.trial.on});
});

app.post("/trialUpdate",(req,res)=>{
 let d=db();

 if(req.body.title!==undefined) d.trial.title=req.body.title;
 if(req.body.key!==undefined) d.trial.key=req.body.key;
 if(req.body.kill!==undefined) d.trial.kill=req.body.kill;
 if(req.body.telegram!==undefined) d.trial.telegram=req.body.telegram;
 if(req.body.expire!==undefined) d.trial.expire=req.body.expire;

 d.refresh=Date.now();
 save(d);

 res.json({ok:true});
});

// START
const PORT=process.env.PORT||3000;

app.listen(PORT,()=>{
 console.log("🔥 FINAL SERVER RUNNING "+PORT);
});
