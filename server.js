const express = require("express");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// CREATE FILE
if (!fs.existsSync("data.json")) fs.writeFileSync("data.json", "[]");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// UPLOAD
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + ".jpg")
});
const upload = multer({ storage });

// BUY
app.post("/buy", upload.single("file"), (req,res)=>{

  let data = JSON.parse(fs.readFileSync("data.json"));

  let newOrder = {
    id: Date.now(),
    plan: req.body.plan,
    utr: req.body.utr,
    file: req.file ? "/uploads/"+req.file.filename : "",
    status: "pending",
    key: ""
  };

  data.push(newOrder);

  fs.writeFileSync("data.json", JSON.stringify(data,null,2));

  res.json({ok:true});
});

// STATUS
app.get("/status/:utr",(req,res)=>{
  let data = JSON.parse(fs.readFileSync("data.json"));
  let find = data.find(x=>x.utr==req.params.utr);
  res.json(find || {status:"notfound"});
});

// ADMIN DATA
app.get("/admin/data",(req,res)=>{
  let data = JSON.parse(fs.readFileSync("data.json"));
  res.json(data);
});

// VERIFY
app.get("/admin/verify/:id",(req,res)=>{
  let data = JSON.parse(fs.readFileSync("data.json"));

  let order = data.find(x=>x.id==req.params.id);

  order.status="approved";
  order.key="COBRA-"+Math.floor(Math.random()*999999);

  fs.writeFileSync("data.json", JSON.stringify(data,null,2));

  res.send("done");
});

// REJECT
app.get("/admin/reject/:id",(req,res)=>{
  let data = JSON.parse(fs.readFileSync("data.json"));

  let order = data.find(x=>x.id==req.params.id);

  order.status="rejected";

  fs.writeFileSync("data.json", JSON.stringify(data,null,2));

  res.send("done");
});

app.listen(PORT,()=>console.log("RUNNING"));
