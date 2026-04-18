const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// 🔐 ENV (Render ke liye)
const token = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

const SECRET = "cobra_secret";

const bot = new TelegramBot(token, { polling: true });

// 📦 LOAD DATA
let keys = JSON.parse(fs.readFileSync("keys.json"));
let data = JSON.parse(fs.readFileSync("data.json"));

// 💎 PLANS
const plans = {
  plan1: { name: "1 DAY - 100₹", days: 1 },
  plan2: { name: "7 DAY - 400₹", days: 7 },
  plan3: { name: "15 DAY - 700₹", days: 15 },
  plan4: { name: "30 DAY - 900₹", days: 30 },
  plan5: { name: "60 DAY - 1200₹", days: 60 }
};

let userPlan = {};

// ================= BOT =================

// MENU
function menu(id){
  bot.sendMessage(id,"🔥 SELECT PLAN",{
    reply_markup:{
      inline_keyboard:Object.keys(plans).map(p=>[
        {text:plans[p].name,callback_data:"buy_"+p}
      ])
    }
  });
}

bot.onText(/\/start/,msg=>menu(msg.chat.id));

// BUY
bot.on("callback_query",q=>{
  const user = q.from.id;
  const dataBtn = q.data;

  if(dataBtn.startsWith("buy_")){
    if(userPlan[user]){
      bot.answerCallbackQuery(q.id,{text:"⚠️ Complete previous payment"});
      return;
    }

    let p = dataBtn.split("_")[1];
    userPlan[user] = {...plans[p], id:p};

    bot.sendMessage(user,
`💰 PAYMENT

UPI: godxcobra@axl

PLAN: ${plans[p].name}

Send UTR to continue`);
  }

  // ADMIN VERIFY
  if(dataBtn.startsWith("approve_")){
    let uid = dataBtn.split("_")[1];
    let plan = userPlan[uid];
    if(!plan) return;

    if(!keys[plan.id] || keys[plan.id].length === 0){
      bot.sendMessage(ADMIN_ID,"❌ STOCK EMPTY");
      return;
    }

    let key = keys[plan.id].shift();

    let expiry = new Date();
    expiry.setDate(expiry.getDate()+plan.days);

    data.sold.push({
      user: uid,
      key,
      plan: plan.name,
      expiry: expiry.toISOString()
    });

    fs.writeFileSync("keys.json",JSON.stringify(keys,null,2));
    fs.writeFileSync("data.json",JSON.stringify(data,null,2));

    delete userPlan[uid];

    bot.sendMessage(uid,
`✅ VERIFIED

🔑 KEY: ${key}

📅 ${expiry.toDateString()}`);
  }
});

// ================= PANEL =================

// LOGIN
app.post("/login",(req,res)=>{
  const {username,password} = req.body;

  if(username==="admin" && password==="cobra123"){
    const token = jwt.sign({user:username},SECRET,{expiresIn:"1d"});
    res.json({success:true,token});
  } else res.json({success:false});
});

// AUTH
function auth(req,res,next){
  try{
    jwt.verify(req.headers.authorization,SECRET);
    next();
  }catch{
    res.sendStatus(403);
  }
}

// STOCK
app.get("/stock",auth,(req,res)=>{
  res.json(keys);
});

// ADD STOCK
app.post("/add-stock",auth,(req,res)=>{
  const {plan,newKeys} = req.body;

  newKeys.split("\n").forEach(k=>{
    if(k.trim()) keys[plan].push(k.trim());
  });

  fs.writeFileSync("keys.json",JSON.stringify(keys,null,2));
  res.json({ok:true});
});

// DELETE KEY
app.post("/delete-key",auth,(req,res)=>{
  const {plan,key} = req.body;

  keys[plan] = keys[plan].filter(k=>k!==key);

  fs.writeFileSync("keys.json",JSON.stringify(keys,null,2));
  res.json({ok:true});
});

// SOLD DATA
app.get("/sold",auth,(req,res)=>{
  res.json(data.sold);
});

// SEARCH USER
app.get("/search/:id",auth,(req,res)=>{
  const result = data.sold.filter(x=>x.user==req.params.id);
  res.json(result);
});

// ================= START =================
app.listen(process.env.PORT || 3000,()=>{
  console.log("🚀 SERVER RUNNING");
});
