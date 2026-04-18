const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== STATIC =====
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// ===== FILE UPLOAD =====
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + ".jpg");
  }
});
const upload = multer({ storage });

// ===== FILE INIT =====
if (!fs.existsSync("data.json")) fs.writeFileSync("data.json", "[]");

if (!fs.existsSync("keys.json")) {
  fs.writeFileSync("keys.json", JSON.stringify({
    "1h": ["KEY-1H-001","KEY-1H-002"],
    "3h": ["KEY-3H-001"],
    "1d": ["KEY-1D-001"],
    "3d": [],
    "7d": []
  }, null, 2));
}

// ===== BUY REQUEST =====
app.post("/buy", upload.single("file"), (req, res) => {

  let { plan, utr } = req.body;

  let data = JSON.parse(fs.readFileSync("data.json"));

  data.push({
    plan,
    utr,
    file: req.file ? "/uploads/" + req.file.filename : "",
    status: "pending",
    key: ""
  });

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

  res.json({ status: "pending" });
});

// ===== ADMIN REQUEST LIST =====
app.get("/admin/requests", (req, res) => {
  let data = JSON.parse(fs.readFileSync("data.json"));
  res.json(data);
});

// ===== VERIFY =====
app.get("/admin/verify/:id", (req, res) => {

  let id = req.params.id;
  let data = JSON.parse(fs.readFileSync("data.json"));
  let keys = JSON.parse(fs.readFileSync("keys.json"));

  if (!data[id]) return res.send("Invalid");

  let plan = data[id].plan;

  if (keys[plan] && keys[plan].length > 0) {
    let key = keys[plan].shift(); // remove 1 key

    data[id].status = "approved";
    data[id].key = key;

    fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
    fs.writeFileSync("keys.json", JSON.stringify(keys, null, 2));

    res.send("Approved");
  } else {
    res.send("No Stock");
  }
});

// ===== REJECT =====
app.get("/admin/reject/:id", (req, res) => {

  let id = req.params.id;
  let data = JSON.parse(fs.readFileSync("data.json"));

  if (!data[id]) return res.send("Invalid");

  data[id].status = "rejected";

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

  res.send("Rejected");
});

// ===== CHECK STATUS (AUTO KEY DELIVERY) =====
app.get("/status/:utr", (req, res) => {

  let utr = req.params.utr;
  let data = JSON.parse(fs.readFileSync("data.json"));

  let found = data.find(x => x.utr == utr);

  if (!found) return res.json({ status: "not_found" });

  res.json(found);
});

// ===== OTP LOGIN =====
let adminOTP = "1234";

app.get("/admin/send-otp", (req, res) => {
  adminOTP = Math.floor(1000 + Math.random() * 9000).toString();
  console.log("ADMIN OTP:", adminOTP);
  res.json({ ok: true });
});

app.post("/admin/login", (req, res) => {

  let { user, pass, otp } = req.body;

  if (user === "COBRA SERVER" && pass === "SAMI9166" && otp === adminOTP) {
    res.json({ status: "success" });
  } else {
    res.json({ status: "fail" });
  }
});

// ===== STATS =====
app.get("/admin/stats", (req, res) => {

  let data = JSON.parse(fs.readFileSync("data.json"));

  let total = data.length;
  let approved = data.filter(x => x.status === "approved").length;
  let rejected = data.filter(x => x.status === "rejected").length;

  res.json({
    total,
    approved,
    rejected,
    data
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server Running on " + PORT));
