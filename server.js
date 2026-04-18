const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 STATIC FILES
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// 🔥 FILE PATH (IMPORTANT FIX)
const DATA_FILE = path.join(__dirname, "data.json");
const KEY_FILE = path.join(__dirname, "keys.json");

// 🔥 CREATE FILES IF NOT EXIST
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");
if (!fs.existsSync(KEY_FILE)) fs.writeFileSync(KEY_FILE, "{}");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// 🔥 FILE UPLOAD
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 🔥 ROOT
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// 🔥 BUY (CUSTOMER → ADMIN REQUEST)
app.post("/buy", upload.single("file"), (req, res) => {

  let { plan, utr } = req.body;

  console.log("RECEIVED:", plan, utr);

  let data = [];

  try{
    data = JSON.parse(fs.readFileSync(DATA_FILE));
  }catch{
    data = [];
  }

  let newEntry = {
    id: Date.now(),
    plan: plan || "NO PLAN",
    utr: utr || "NO UTR",
    file: req.file ? "/uploads/" + req.file.filename : "",
    status: "pending",
    key: "",
    time: new Date()
  };

  data.push(newEntry);

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  console.log("SAVED:", newEntry);

  res.json({ success: true });
});

// 🔥 STATUS CHECK (CUSTOMER)
app.get("/status/:utr", (req, res) => {

  let data = [];

  try{
    data = JSON.parse(fs.readFileSync(DATA_FILE));
  }catch{
    data = [];
  }

  let find = data.find(x => x.utr == req.params.utr);

  if (!find) return res.json({ status: "notfound" });

  res.json(find);
});

// 🔥 ADMIN DATA (FIXED)
app.get("/admin/data", (req, res) => {

  let data = [];

  try{
    data = JSON.parse(fs.readFileSync(DATA_FILE));
  }catch{
    data = [];
  }

  res.json(data);
});

// 🔥 VERIFY (KEY ASSIGN + STOCK REMOVE)
app.get("/admin/verify/:id", (req, res) => {

  let data = JSON.parse(fs.readFileSync(DATA_FILE));
  let keys = JSON.parse(fs.readFileSync(KEY_FILE));

  let id = Number(req.params.id);

  let order = data.find(x => x.id === id);

  if (!order) return res.send("Not found");

  let planKeys = keys[order.plan] || [];

  if (planKeys.length > 0) {
    order.key = planKeys.shift();
    keys[order.plan] = planKeys;
  } else {
    order.key = "NO KEY AVAILABLE";
  }

  order.status = "approved";

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  fs.writeFileSync(KEY_FILE, JSON.stringify(keys, null, 2));

  res.send("Verified");
});

// 🔥 REJECT
app.get("/admin/reject/:id", (req, res) => {

  let data = JSON.parse(fs.readFileSync(DATA_FILE));

  let id = Number(req.params.id);

  let order = data.find(x => x.id === id);

  if (order) order.status = "rejected";

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  res.send("Rejected");
});

// 🔥 ADD KEY (ADMIN)
app.post("/admin/addkey", (req, res) => {

  let { plan, key } = req.body;

  let keys = JSON.parse(fs.readFileSync(KEY_FILE));

  if (!keys[plan]) keys[plan] = [];

  keys[plan].push(key);

  fs.writeFileSync(KEY_FILE, JSON.stringify(keys, null, 2));

  res.send("Key Added");
});

// 🔥 START SERVER
app.listen(PORT, () => {
  console.log("🔥 SERVER RUNNING ON PORT " + PORT);
});
