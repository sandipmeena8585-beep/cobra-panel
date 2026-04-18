const express = require("express");
const fs = require("fs");
const multer = require("multer");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

if (!fs.existsSync("data.json")) fs.writeFileSync("data.json", "[]");

if (!fs.existsSync("keys.json")) {
  fs.writeFileSync("keys.json", JSON.stringify({
    "1hour": ["KEY-1H-001","KEY-1H-002"],
    "3hour": ["KEY-3H-001"],
    "1day": ["KEY-1D-001"],
    "3day": [],
    "7day": []
  }, null, 2));
}

const upload = multer({ dest: "uploads/" });

// ===== BUY =====
app.post("/buy", upload.single("file"), (req, res) => {
  let { plan, utr } = req.body;

  let data = JSON.parse(fs.readFileSync("data.json"));

  data.push({
    id: Date.now(),
    plan,
    utr,
    file: req.file ? "/uploads/" + req.file.filename : "",
    status: "pending",
    key: "",
    time: new Date()
  });

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

  res.json({ ok: true });
});

// ===== STATUS =====
app.get("/status/:utr", (req, res) => {
  let data = JSON.parse(fs.readFileSync("data.json"));
  let r = data.find(x => x.utr == req.params.utr);
  if (!r) return res.json({ status: "none" });
  res.json(r);
});

// ===== ADMIN DATA =====
app.get("/admin/data", (req, res) => {
  res.json(JSON.parse(fs.readFileSync("data.json")));
});

// ===== VERIFY =====
app.get("/admin/verify/:id", (req, res) => {

  let data = JSON.parse(fs.readFileSync("data.json"));
  let keys = JSON.parse(fs.readFileSync("keys.json"));

  let index = data.findIndex(x => x.id == req.params.id);
  if (index === -1) return res.send("Invalid");

  let plan = data[index].plan;

  if (!keys[plan] || keys[plan].length === 0) {
    return res.send("No Stock");
  }

  let key = keys[plan].shift();

  data[index].status = "approved";
  data[index].key = key;

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
  fs.writeFileSync("keys.json", JSON.stringify(keys, null, 2));

  res.send("OK");
});

// ===== REJECT =====
app.get("/admin/reject/:id", (req, res) => {
  let data = JSON.parse(fs.readFileSync("data.json"));
  let index = data.findIndex(x => x.id == req.params.id);
  if (index === -1) return res.send("Invalid");

  data[index].status = "rejected";

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
  res.send("OK");
});

app.listen(3000, () => console.log("🔥 SYSTEM RUNNING"));
app.post("/admin/addkey",(req,res)=>{

  let {plan,key}=req.body;

  let keys=JSON.parse(fs.readFileSync("keys.json"));

  if(!keys[plan]) keys[plan]=[];

  keys[plan].push(key);

  fs.writeFileSync("keys.json",JSON.stringify(keys,null,2));

  res.send("OK");
});
