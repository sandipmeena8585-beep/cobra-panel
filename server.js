app.use(express.static("public"));
app.post("/buy", upload.single("file"), (req, res) => {

  let { plan, utr } = req.body;

  console.log("RECEIVED:", plan, utr); // 🔥 DEBUG

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

  console.log("SAVED:", newEntry); // 🔥 DEBUG

  res.json({ ok: true });
});
