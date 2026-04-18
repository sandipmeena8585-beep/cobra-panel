const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const DATA_FILE = path.join(__dirname, "data.json");
const KEY_FILE = path.join(__dirname, "keys.json");

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");
if (!fs.existsSync(KEY_FILE)) fs.writeFileSync(KEY_FILE, "{}");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now()+path.extname(file.originalname))
});
const upload = multer({ storage });

app.get("/", (req,res)=>{
  res.sendFile(path.join(__dirname,"public/index.html"));
});

// 🔥 BUY FIXED
app.post("/buy", upload.single("file"), (req,res)=>{

  let { plan, utr } = req.body;

  console.log("RECEIVED:", plan, utr);

  let data = JSON.parse(fs.readFileSync(DATA_FILE));

  let newData = {
    id: Date.now(),
    plan,
    utr,
    file: req.file ? "/uploads/"+req.file.filename : "",
    status:"pending",
    key:""
  };

  data.push(newData);

  fs.writeFileSync(DATA_FILE, JSON.stringify(data,null,2));

  console.log("SAVED:", newData);

  res.json({ok:true});
});

// STATUS
app.get("/status/:utr",(req,res)=>{
  let data = JSON.parse(fs.readFileSync(DATA_FILE));
  let find = data.find(x=>x.utr==req.params.utr);
  res.json(find || {status:"notfound"});
});

// ADMIN DATA
app.get("/admin/data",(req,res)=>{
  let data = JSON.parse(fs.readFileSync(DATA_FILE));
  res.json(data);
});

// VERIFY
app.get("/admin/verify/:id",(req,res)=>{
  let data = JSON.parse(fs.readFileSync(DATA_FILE));
  let keys = JSON.parse(fs.readFileSync(KEY_FILE));

  let order = data.find(x=>x.id==req.params.id);

  let k = (keys[order.plan]||[]).shift() || "NO KEY";

  order.key = k;
  order.status="approved";

  fs.writeFileSync(DATA_FILE, JSON.stringify(data,null,2));
  fs.writeFileSync(KEY_FILE, JSON.stringify(keys,null,2));

  res.send("done");
});

// REJECT
app.get("/admin/reject/:id",(req,res)=>{
  let data = JSON.parse(fs.readFileSync(DATA_FILE));
  let order = data.find(x=>x.id==req.params.id);
  order.status="rejected";
  fs.writeFileSync(DATA_FILE, JSON.stringify(data,null,2));
  res.send("done");
});

app.listen(PORT,()=>console.log("RUNNING"));
