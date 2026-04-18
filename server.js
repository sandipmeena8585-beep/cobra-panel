const express = require("express");
const fs = require("fs");
const multer = require("multer");
const app = express();

app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

// ================= DATA =================
function read(file){
  return JSON.parse(fs.readFileSync(file));
}

function write(file,data){
  fs.writeFileSync(file,JSON.stringify(data,null,2));
}

// ================= BUY REQUEST =================
app.post("/buy", upload.single("screenshot"), (req,res)=>{
  let data = read("data.json");

  let plan = req.body.plan;
  let utr = req.body.utr;

  // 🔴 FAKE PAYMENT CHECK
  if(!utr || utr.length < 8){
    return res.json({msg:"Fake Payment Detected"});
  }

  data.requests.push({
    id: Date.now(),
    plan,
    utr,
    file: req.file ? req.file.filename : null,
    status:"pending"
  });

  write("data.json",data);

  res.json({msg:"Request Sent"});
});

// ================= ADMIN GET =================
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

// ================= VERIFY =================
app.post("/verify",(req,res)=>{
  let {id} = req.body;

  let data = read("data.json");
  let keys = read("keys.json");

  let reqIndex = data.requests.findIndex(r=>r.id==id);
  let request = data.requests[reqIndex];

  let plan = request.plan;

  if(keys[plan].length === 0){
    return res.json({msg:"No Stock"});
  }

  let key = keys[plan].shift();

  data.requests[reqIndex].status = "approved";
  data.requests[reqIndex].key = key;

  data.sales++;

  write("data.json",data);
  write("keys.json",keys);

  res.json({key});
});

// ================= REJECT =================
app.post("/reject",(req,res)=>{
  let {id} = req.body;

  let data = read("data.json");

  let reqIndex = data.requests.findIndex(r=>r.id==id);
  data.requests[reqIndex].status="rejected";

  write("data.json",data);

  res.json({msg:"Rejected"});
});

// ================= GET USER KEY =================
app.get("/get-key/:id",(req,res)=>{
  let data = read("data.json");

  let r = data.requests.find(x=>x.id==req.params.id);

  res.json(r);
});

// ================= START =================
app.listen(3000,()=>{
  console.log("Server Running 🚀");
});
