const express = require("express");
const fs = require("fs");
const multer = require("multer");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

// ===== FILE FUNCTIONS =====
function read(file){
  return JSON.parse(fs.readFileSync(file));
}
function write(file,data){
  fs.writeFileSync(file, JSON.stringify(data,null,2));
}

// ===== OTP SYSTEM =====
let currentOTP = null;

app.get("/get-otp",(req,res)=>{
  currentOTP = Math.floor(100000 + Math.random()*900000);
  console.log("ADMIN OTP:", currentOTP);
  res.json({msg:"OTP GENERATED"});
});

app.post("/verify-otp",(req,res)=>{
  if(req.body.otp == currentOTP){
    res.json({success:true});
  } else {
    res.json({success:false});
  }
});

// ===== BUY =====
app.post("/buy", upload.single("screenshot"), (req,res)=>{
  let data = read("data.json");

  let plan = req.body.plan;
  let utr = req.body.utr;

  if(!utr || utr.length < 8){
    return res.json({msg:"Fake Payment Detected"});
  }

  let id = Date.now();

  data.requests.push({
    id,
    plan,
    utr,
    file: req.file ? req.file.filename : null,
    status:"pending"
  });

  write("data.json",data);

  res.json({msg:"Request Sent", id});
});

// ===== ADMIN DATA =====
app.get("/admin-data",(req,res)=>{
  let data = read("data.json");
  let keys = read("keys.json");

  let stock = {};
  for(let p in keys){
    stock[p] = keys[p].length;
  }

  res.json({
    requests:data.requests,
    totalSales:data.sales,
    stock
  });
});

// ===== VERIFY =====
app.post("/verify",(req,res)=>{
  let {id} = req.body;

  let data = read("data.json");
  let keys = read("keys.json");

  let index = data.requests.findIndex(r=>r.id==id);
  let request = data.requests[index];

  let plan = request.plan;

  if(!keys[plan] || keys[plan].length===0){
    return res.json({msg:"No Stock"});
  }

  let key = keys[plan].shift();

  data.requests[index].status="approved";
  data.requests[index].key=key;

  data.sales++;

  write("data.json",data);
  write("keys.json",keys);

  res.json({key});
});

// ===== REJECT =====
app.post("/reject",(req,res)=>{
  let {id} = req.body;

  let data = read("data.json");

  let index = data.requests.findIndex(r=>r.id==id);
  data.requests[index].status="rejected";

  write("data.json",data);

  res.json({msg:"Rejected"});
});

// ===== GET KEY =====
app.get("/get-key/:id",(req,res)=>{
  let data = read("data.json");
  let r = data.requests.find(x=>x.id==req.params.id);
  res.json(r);
});

app.listen(3000,()=>console.log("🚀 Server Running"));
