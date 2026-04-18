const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// 📁 PUBLIC FOLDER SERVE
app.use(express.static("public"));

// 📂 FILE PATHS
const keysFile = "keys.json";
const dataFile = "data.json";

// 🟢 HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// 🟢 ADMIN PANEL
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

// 📊 GET KEYS
app.get("/api/keys", (req, res) => {
  const keys = JSON.parse(fs.readFileSync(keysFile));
  res.json(keys);
});

// ➕ ADD KEYS
app.post("/api/add-keys", (req, res) => {
  const { plan, newKeys } = req.body;

  let keys = JSON.parse(fs.readFileSync(keysFile));

  newKeys.forEach(k => {
    if (k.trim()) keys[plan].push(k.trim());
  });

  fs.writeFileSync(keysFile, JSON.stringify(keys, null, 2));

  res.json({ success: true });
});

// ❌ DELETE KEY
app.post("/api/delete-key", (req, res) => {
  const { plan, key } = req.body;

  let keys = JSON.parse(fs.readFileSync(keysFile));

  keys[plan] = keys[plan].filter(k => k !== key);

  fs.writeFileSync(keysFile, JSON.stringify(keys, null, 2));

  res.json({ success: true });
});

// 📦 STOCK COUNT
app.get("/api/stats", (req, res) => {
  const keys = JSON.parse(fs.readFileSync(keysFile));

  let stats = {};
  Object.keys(keys).forEach(p => {
    stats[p] = keys[p].length;
  });

  res.json(stats);
});

// 🚀 START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🔥 COBRA PANEL RUNNING ON PORT " + PORT);
});
