const express = require("express");
const fs = require("fs");
const multer = require("multer");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// ===== FILE INIT =====
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

// ===== UPLOAD =====
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + ".jpg");
  }
});
const upload = multer({ storage });

// ===== OTP =====
let adminOTP = "0000";

// ===== SEND OTP =====
app.get("/admin/send-otp", (req, res) => {
  adminOTP = Math.floor(1000 + Math.random() * 9000).toString();
  res.json({ otp: adminOTP }); // 👈 screen pe show
});

// ===== LOGIN =====
app.post("/admin/login", (req, res) => {
  const { user, pass, otp } = req.body;

  if (
    user === "COBRA SERVER" &&
    pass === "SAMI9166" &&
    otp === adminOTP
  ) {
    res.json({ status: "success" });
  } else {
    res.json({ status: "fail" });
  }
});

// ===== BUY =====
app.post("/buy", upload.single("file"), (req, res) => {

  let { plan, utr } = req.body;

  if (!utr || utr.length < 5) {
    return res.json({ status: "rejected", msg: "Fake Payment" });
  }

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

// ===== ADMIN REQUEST =====
app.get("/admin/requests", (req, res) => {
  res.json(JSON.parse(fs.readFileSync("data.json")));
});

// ===== VERIFY =====
app.get("/admin/verify/:id", (req, res) => {

  let id = req.params.id;
  let data = JSON.parse(fs.readFileSync("data.json"));
  let keys = JSON.parse(fs.readFileSync("keys.json"));

  if (!data[id]) return res.send("Invalid");

  let plan = data[id].plan;

  if (keys[plan] && keys[plan].length > 0) {
    let key = keys[plan].shift();

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
  let data = JSON.parse(fs.readFileSync("data.json"));

  if (!data[req.params.id]) return res.send("Invalid");

  data[req.params.id].status = "rejected";

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

  res.send("Rejected");
});

// ===== STATUS =====
app.get("/status/:utr", (req, res) => {

  let data = JSON.parse(fs.readFileSync("data.json"));

  let found = data.find(x => x.utr == req.params.utr);

  if (!found) return res.json({ status: "not_found" });

  res.json(found);
});

// ===== STATS =====
app.get("/admin/stats", (req, res) => {

  let data = JSON.parse(fs.readFileSync("data.json"));

  let total = data.length;
  let approved = data.filter(x => x.status === "approved").length;
  let rejected = data.filter(x => x.status === "rejected").length;

  res.json({ total, approved, rejected, data });
});

app.listen(3000, () => console.log("🚀 FULL SYSTEM RUNNING"));
