const express = require("express");
const fs = require("fs");
const multer = require("multer");
const axios = require("axios");

const app = express();

app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const upload = multer({dest:"uploads/"});
const FILE="data.json";

const BOT_TOKEN="PUT_TOKEN";
const CHAT_ID="PUT_CHAT_ID";

async function sendTelegram(msg){
try{
await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
params:{chat_id:CHAT_ID,text:msg}
});
}catch(e){}
}

function loadData(){
if(!fs.existsSync(FILE)){
fs.writeFileSync(FILE,JSON.stringify({
stock:{ "1hour":[], "3hour":[], "1day":[], "3day":[], "7day":[] },
requests:[],
devices:{}
}));
}
return JSON.parse(fs.readFileSync(FILE));
}

function saveData(d){
fs.writeFileSync(FILE,JSON.stringify(d,null,2));
}

// LOGIN
app.post("/login",(req,res)=>{
let d=loadData();
let {user,pass,device}=req.body;

if(user==="COBRA SERVER" && pass==="SAMI9166"){
if(!d.devices[user]) d.devices[user]=device;

if(d.devices[user]!==device){
return res.json({status:"blocked"});
}

saveData(d);
return res.json({status:"ok"});
}

res.json({status:"fail"});
});

// GET REQUEST
app.get("/admin/data",(req,res)=>{
res.json(loadData().requests);
});

// STOCK
app.get("/admin/stock",(req,res)=>{
res.json(loadData().stock);
});

// ADD KEY
app.post("/admin/addkey",(req,res)=>{
let d=loadData();
let {plan,key}=req.body;

if(!d.stock[plan]) d.stock[plan]=[];
d.stock[plan].push(key);

saveData(d);
res.json({ok:true});
});

// BUY
app.post("/buy",upload.single("file"), async (req,res)=>{
let d=loadData();

let r={
id:Date.now(),
plan:req.body.plan,
utr:req.body.utr,
time:req.body.time,
file:req.file?req.file.filename:null,
status:"pending"
};

d.requests.push(r);
saveData(d);

await sendTelegram(`NEW REQUEST\n${r.plan}\n${r.utr}`);

res.send("ok");
});

// VERIFY
app.get("/admin/verify/:id", async (req,res)=>{
let d=loadData();
let r=d.requests.find(x=>x.id==req.params.id);

let key="NO KEY";
if(d.stock[r.plan] && d.stock[r.plan].length>0){
key=d.stock[r.plan].shift();
}

r.status="approved";
r.key=key;

saveData(d);

await sendTelegram(`VERIFIED\n${r.plan}\n${key}`);

res.send("ok");
});

// REJECT
app.get("/admin/reject/:id",(req,res)=>{
let d=loadData();
let r=d.requests.find(x=>x.id==req.params.id);

if(r) r.status="rejected";

saveData(d);
res.send("ok");
});

app.listen(3000,()=>console.log("RUNNING"));
