const express = require("express");
const fs = require("fs");
const multer = require("multer");
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));

const upload = multer({dest:"uploads/"});

// 🔥 DATA FILE
const FILE = "data.json";

function loadData(){
  if(!fs.existsSync(FILE)){
    fs.writeFileSync(FILE, JSON.stringify({
      stock:{
        "1hour":[],
        "3hour":[],
        "1day":[],
        "3day":[],
        "7day":[]
      },
      requests:[]
    }));
  }
  return JSON.parse(fs.readFileSync(FILE));
}

function saveData(data){
  fs.writeFileSync(FILE, JSON.stringify(data,null,2));
}

// 🔥 ADD KEY
app.post("/admin/addkey",(req,res)=>{
  let data = loadData();
  let {plan,key} = req.body;

  data.stock[plan].push(key);

  saveData(data);

  res.json({ok:true});
});

// 🔥 DELETE KEY
app.post("/admin/deletekey",(req,res)=>{
  let data = loadData();
  let {plan,key} = req.body;

  data.stock[plan] = data.stock[plan].filter(k=>k!==key);

  saveData(data);

  res.send("deleted");
});

// 🔥 GET STOCK
app.get("/admin/stock",(req,res)=>{
  let data = loadData();
  res.json({stock:data.stock});
});

// 🔥 BUY REQUEST
app.post("/buy", upload.single("file"), (req,res)=>{

  let data = loadData();

  let id = Date.now();

  data.requests.push({
    id,
    plan:req.body.plan,
    utr:req.body.utr,
    time:req.body.time,
    status:"pending",
    file:req.file ? req.file.filename : null
  });

  saveData(data);

  res.send("ok");
});

// 🔥 ADMIN DATA
app.get("/admin/data",(req,res)=>{
  let data = loadData();
  res.json(data.requests);
});

// 🔥 VERIFY
app.get("/admin/verify/:id",(req,res)=>{

  let data = loadData();
  let id = parseInt(req.params.id);

  let reqItem = data.requests.find(x=>x.id===id);

  if(!reqItem) return res.send("not found");

  let plan = reqItem.plan;

  let key = data.stock[plan].shift(); // 🔥 REMOVE FROM STOCK

  reqItem.status = "approved";
  reqItem.key = key || "NO KEY";
  reqItem.expiry = new Date(Date.now()+86400000).toLocaleString();
  reqItem.channel = "https://t.me/GODx_COBRA";

  saveData(data);

  res.send("verified");
});

// 🔥 REJECT
app.get("/admin/reject/:id",(req,res)=>{
  let data = loadData();
  let id = parseInt(req.params.id);

  let reqItem = data.requests.find(x=>x.id===id);
  if(reqItem) reqItem.status="rejected";

  saveData(data);

  res.send("rejected");
});

// 🔥 STATUS CHECK (CUSTOMER)
app.get("/status/:utr",(req,res)=>{

  let data = loadData();
  let utr = req.params.utr;

  let r = data.requests.find(x=>x.utr==utr);

  if(!r) return res.json({status:"pending"});

  res.json(r);
});

app.listen(3000,()=>console.log("SERVER RUNNING"));
