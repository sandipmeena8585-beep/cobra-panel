const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 STATIC
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

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

// 🔥 CREATE FILES IF NOT EXIST
if (!fs.existsSync("data.json")) fs.writeFileSync("data.json", "[]");
if (!fs.existsSync("keys.json")) fs.writeFileSync("keys.json", "{}");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// 🔥 ROOT
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// 🔥 BUY (CUSTOMER SUBMIT)
app.post("/buy", upload.single("file"), (req, res) => {

  let { plan, utr } = req.body;

  let data = JSON.parse(fs.readFileSync("data.json"));

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

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

  console.log("NEW ORDER:", newEntry);

  res.json({ success: true });
});

// 🔥 STATUS CHECK
app.get("/status/:utr", (req, res) => {

  let utr = req.params.utr;

  let data = JSON.parse(fs.readFileSync("data.json"));

  let find = data.find(x => x.utr == utr);

  if (!find) {
    return res.json({ status: "notfound" });
  }

  res.json(find);
});

// 🔥 ADMIN DATA
app.get("/admin/data", (req, res) => {

  let data = JSON.parse(fs.readFileSync("data.json"));
  res.json(data);
});

// 🔥 VERIFY (GIVE KEY)
app.get("/admin/verify/:id", (req, res) => {

  let id = Number(req.params.id);

  let data = JSON.parse(fs.readFileSync("data.json"));
  let keys = JSON.parse(fs.readFileSync("keys.json"));

  let order = data.find(x => x.id === id);

  if (!order) return res.send("Not found");

  let planKeys = keys[order.plan] || [];

  if (planKeys.length === 0) {
    order.key = "NO KEY AVAILABLE";
  } else {
    order.key = planKeys.shift(); // 🔥 remove key from stock
    keys[order.plan] = planKeys;
  }

  order.status = "approved";

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
  fs.writeFileSync("keys.json", JSON.stringify(keys, null, 2));

  res.send("Verified");
});

// 🔥 REJECT
app.get("/admin/reject/:id", (req, res) => {

  let id = Number(req.params.id);

  let data = JSON.parse(fs.readFileSync("data.json"));

  let order = data.find(x => x.id === id);

  if (order) {
    order.status = "rejected";
  }

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

  res.send("Rejected");
});

// 🔥 ADD KEY (ADMIN)
app.post("/admin/addkey", (req, res) => {

  let { plan, key } = req.body;

  let keys = JSON.parse(fs.readFileSync("keys.json"));

  if (!keys[plan]) keys[plan] = [];

  keys[plan].push(key);

  fs.writeFileSync("keys.json", JSON.stringify(keys, null, 2));

  res.send("Key Added");
});

// 🔥 START SERVER
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
