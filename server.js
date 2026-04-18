const express = require("express");
const fs = require("fs");
const multer = require("multer");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

// ===== ADMIN SECURITY =====
const ADMIN_PASS = "cobra123"; // 🔒 password
let currentOTP = null;

// ===== FILE HELPERS =====
function read(file){
  return JSON.parse(fs.readFileSync(file));
}
function write(file,data){
  fs.writeFileSync(file, JSON.stringify(data,null,2));
}

// ===== PASSWORD + OTP =====
app.post("/admin-login",(req,res)=>{
  if(req.body.password !== ADMIN_PASS){
    return res.json({step:"wrong_pass"});
  }

  currentOTP = Math.floor(100000 + Math.random()*900000);
  console.log("OTP:", currentOTP);

  res.json({step:"otp_sent"});
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
    status:"pending",
    time: new Date()
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

// ===== USER KEY =====
app.get("/get-key/:id",(req,res)=>{
  let data = read("data.json");
  let r = data.requests.find(x=>x.id==req.params.id);
  res.json(r);
});

// ===== SALES GRAPH DATA =====
app.get("/sales-graph",(req,res)=>{
  let data = read("data.json");

  let map = {};

  data.requests.forEach(r=>{
    if(r.status==="approved"){
      let day = new Date(r.time).toDateString();
      map[day] = (map[day] || 0) + 1;
    }
  });

  res.json(map);
});

app.listen(3000,()=>console.log("🔥 FINAL PRO SERVER RUNNING"));
// ===== OTP SYSTEM =====
let adminOTP = "1234"; // demo OTP (later random kar sakte)

app.get("/admin/send-otp", (req,res)=>{
  adminOTP = Math.floor(1000 + Math.random()*9000).toString();
  console.log("ADMIN OTP:", adminOTP); // console me dikhega
  res.json({ok:true});
});

app.post("/admin/login", (req,res)=>{
  const {user, pass, otp} = req.body;

  if(user==="COBRA SERVER" && pass==="SAMI9166" && otp===adminOTP){
    res.json({status:"success"});
  }else{
    res.json({status:"fail"});
  }
});


// ===== SALES DATA =====
app.get("/admin/stats",(req,res)=>{
  let data = JSON.parse(fs.readFileSync("data.json"));

  let total = data.length;
  let approved = data.filter(x=>x.status==="approved").length;
  let rejected = data.filter(x=>x.status==="rejected").length;

  res.json({total, approved, rejected, data});
});
