const express=require("express");
const fs=require("fs");
const path=require("path");
const multer=require("multer");

const app=express();
app.use(express.json({limit:"10mb"}));
app.use(express.static("public"));

const DB="./data.json";

// ================= FOLDER =================
if(!fs.existsSync("public")){
fs.mkdirSync("public");
}

if(!fs.existsSync("public/uploads")){
fs.mkdirSync("public/uploads",{recursive:true});
}

// ================= MULTER =================
const storage=multer.diskStorage({
destination:(req,file,cb)=>cb(null,"public/uploads"),
filename:(req,file,cb)=>cb(null,Date.now()+"_"+file.originalname)
});
const upload=multer({storage});

// ================= CREATE DB =================
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
refresh:0,
qrTime:0
},null,2));
}

// ================= LOAD =================
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
if(!d.color) d.color="#22c55e";
if(!d.textColor) d.textColor="#ffffff";
if(!d.title) d.title="COBRA SERVER PANEL";

return d;
}

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

// ================= SETTINGS =================
app.post("/settings",(req,res)=>{
let d=db();

if(req.body.upi!==undefined) d.upi=req.body.upi;
if(req.body.color!==undefined) d.color=req.body.color;
if(req.body.textColor!==undefined) d.textColor=req.body.textColor;
if(req.body.title!==undefined) d.title=req.body.title;

d.refresh=Date.now();
save(d);

res.json({ok:true});
});

// ================= QR =================
app.post("/uploadQR",upload.single("qr"),(req,res)=>{
let d=db();

if(req.file){
d.qr="/uploads/"+req.file.filename;
d.qrTime=Date.now();
d.refresh=Date.now();
save(d);
}

res.json({ok:true,qr:d.qr});
});

// GET SETTINGS
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

// ================= PLANS =================
app.get("/plans",(req,res)=>{
res.json(db().plans);
});

app.post("/savePlans",(req,res)=>{
let d=db();
d.plans=req.body;
d.refresh=Date.now();
save(d);
res.json({ok:true});
});

// ================= BUY =================
app.post("/buy",(req,res)=>{
let d=db();

// 🔥 FIX START
let approved=d.history.find(x=>x.utr===req.body.utr && x.status==="approved");

if(approved){
if(approved.claimed){
return res.json({ok:true});
}
approved.claimed=true;
approved.claimTime=new Date().toLocaleString();
save(d);
return res.json({ok:true});
}
// 🔥 FIX END

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
app.get("/requests",(req,res)=>{
res.json(db().requests);
});

// APPROVE
app.post("/approve",(req,res)=>{
let d=db();
let r=d.requests.find(x=>x.user===req.body.user);

if(!r)return res.json({});

let plan=(r.plan||"").trim();
let key="NO STOCK";

if(d.stock[plan]?.length>0){
key=d.stock[plan].shift();
}

d.history.unshift({
...r,
key:key,
status:"approved",
time:new Date().toLocaleString()
});

d.requests=d.requests.filter(x=>x.user!==r.user);

d.refresh=Date.now();
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

d.refresh=Date.now();
save(d);

res.json({ok:true});
});

// HISTORY
app.get("/history",(req,res)=>{
res.json(db().history);
});

// ================= STOCK =================
app.get("/stock",(req,res)=>{
res.json(db().stock);
});

app.post("/addStock",(req,res)=>{
let d=db();

let plan=(req.body.plan||"").trim();
let key=(req.body.key||"").trim();

if(!plan || !key) return res.json({ok:false});

if(!d.stock[plan]) d.stock[plan]=[];

d.stock[plan].push(key);

d.refresh=Date.now();
save(d);

res.json({ok:true});
});

app.post("/deleteStock",(req,res)=>{
let d=db();

if(d.stock[req.body.plan] && d.stock[req.body.plan][req.body.index]){
d.stock[req.body.plan].splice(req.body.index,1);
}

d.refresh=Date.now();
save(d);

res.json({ok:true});
});

// ================= TRIAL FEATURE (SAFE ADD) =================
app.get("/trial",(req,res)=>{
let d=db();

if(!d.trial){
d.trial={
on:false,
title:"COBRA SERVER ON",
key:"TRIAL-KEY",
kill:"Kill limit 10-12",
url:"https://t.me/+wRZN39fdVcRkYTM9",
updates:[]
};
save(d);
}

res.json(d.trial);
});

app.post("/trial",(req,res)=>{
let d=db();

if(!d.trial) d.trial={};

if(req.body.on!==undefined) d.trial.on=req.body.on;
if(req.body.title!==undefined) d.trial.title=req.body.title;
if(req.body.key!==undefined) d.trial.key=req.body.key;
if(req.body.kill!==undefined) d.trial.kill=req.body.kill;
if(req.body.url!==undefined) d.trial.url=req.body.url;

if(req.body.updateLine){
if(!d.trial.updates) d.trial.updates=[];
d.trial.updates.unshift(req.body.updateLine);
d.trial.updates=d.trial.updates.slice(0,3);
}

d.refresh=Date.now();
save(d);

res.json({ok:true});
});

// ================= START =================
const PORT=process.env.PORT||3000;

app.listen(PORT,()=>{
console.log("🔥 SERVER RUNNING ON "+PORT);
});
