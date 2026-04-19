<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>COBRA SERVER</title>

<style>
body{margin:0;font-family:sans-serif;background:#f1f5f9}

/* HEADER */
.header{
display:flex;justify-content:space-between;align-items:center;
padding:12px;background:#fff;
}
.logo{font-weight:bold;color:#0f766e;font-size:20px}
.menuBtn{font-size:22px;cursor:pointer}

/* MENU */
.menu{
position:fixed;top:0;right:-220px;width:200px;height:100%;
background:#111;color:#fff;transition:.3s;padding:10px;
}
.menu.active{right:0}
.menu div{padding:10px;border-bottom:1px solid #333;cursor:pointer}

/* FLOOR */
.page{display:none}
.activePage{display:block}

/* CARD */
.card{
background:#fff;margin:15px;border-radius:15px;padding:20px;text-align:center;
box-shadow:0 5px 15px rgba(0,0,0,0.1);
}

.top{
background:linear-gradient(135deg,#065f46,#4ade80);
color:#fff;
}

/* LOGIN */
#loginWrap{
display:flex;justify-content:center;align-items:center;height:100vh;
}
.loginBox{
background:#fff;padding:25px;border-radius:12px;text-align:center;width:260px;
}
input{width:90%;padding:8px;margin:6px;border-radius:6px;border:1px solid #ccc}
button{padding:8px 12px;border:none;border-radius:6px;background:#22c55e;color:#fff}

.small{font-size:13px;color:#555}
</style>

</head>
<body>

<!-- LOGIN -->
<div id="loginWrap">
  <div class="loginBox">
    <h2>Welcome Back</h2>
    <small>COBRA ADMIN</small><br><br>
    <input id="user" placeholder="Username">
    <input id="pass" placeholder="Password">
    <button onclick="login()">LOGIN</button>
  </div>
</div>

<!-- MAIN -->
<div id="main" style="display:none;">

<div class="header">
  <div class="logo">COBRA SERVER</div>
  <div class="menuBtn" onclick="toggleMenu()">☰</div>
</div>

<!-- MENU -->
<div id="menu" class="menu">
  <div onclick="showPage('home')">Home</div>
  <div onclick="showPage('request')">Request</div>
  <div onclick="showPage('manage')">Manage User</div>
  <div onclick="logout()">Logout</div>
</div>

<!-- ================= HOME ================= -->
<div id="home" class="page activePage">

<div class="card top">
  <h2>Welcome, COBRASERVER!</h2>
  <p>Your account overview and recent activity</p>
</div>

<div class="card">
  <h2 id="stockCount">0</h2>
  <p class="small">Stock Live</p>
</div>

<div class="card">
  <h2 id="soldCount">0</h2>
  <p class="small">Sold</p>
</div>

<div class="card">
  <h2 id="addCount">0</h2>
  <p class="small">Added</p>
</div>

<div class="card">
  <h2 id="deleteCount">0</h2>
  <p class="small">Deleted</p>
</div>

<div class="card">
  <b>Last 5 Activity</b>
  <div id="history"></div>
</div>

</div>

<!-- ================= REQUEST ================= -->
<div id="request" class="page">

<div class="card">
  <h3>Customer Requests</h3>
  <div id="requestData"></div>
</div>

</div>

<!-- ================= MANAGE ================= -->
<div id="manage" class="page">

<div class="card">
  <h3>Customer Panel Control</h3>

  <input type="checkbox" id="customerToggle" onchange="toggleCustomer()">
  <p id="toggleStatus"></p>

</div>

</div>

</div>

<script>

const user = document.getElementById("user");
const pass = document.getElementById("pass");
const loginWrap = document.getElementById("loginWrap");
const main = document.getElementById("main");

const menu = document.getElementById("menu");

const stockCount = document.getElementById("stockCount");
const soldCount = document.getElementById("soldCount");
const addCount = document.getElementById("addCount");
const deleteCount = document.getElementById("deleteCount");

const historyBox = document.getElementById("history");
const requestBox = document.getElementById("requestData");

const toggleStatus = document.getElementById("toggleStatus");
const customerToggle = document.getElementById("customerToggle");

// MENU
function toggleMenu(){
menu.classList.toggle("active");
}

// PAGE SWITCH
function showPage(p){
document.querySelectorAll(".page").forEach(x=>x.classList.remove("activePage"));
document.getElementById(p).classList.add("activePage");
menu.classList.remove("active");

if(p==="home") loadAll();
if(p==="request") loadRequests();
if(p==="manage") loadSettings();
}

// LOGIN
async function login(){
let res=await fetch("/login",{method:"POST",headers:{'Content-Type':'application/json'},
body:JSON.stringify({user:user.value,pass:pass.value,device:navigator.userAgent})});

let d=await res.json();

if(d.status==="ok"){
loginWrap.style.display="none";
main.style.display="block";
loadAll();
}else alert("Login failed");
}

// LOGOUT
function logout(){
location.reload();
}

// LOAD ALL
function loadAll(){
loadStats();
loadHistory();
loadSettings();
}

// STATS
async function loadStats(){
let s=await fetch("/admin/stats");
let d=await s.json();

soldCount.innerText=d.sold;
addCount.innerText=d.added;
deleteCount.innerText=d.deleted;

let st=await fetch("/admin/stock");
let stock=await st.json();

let total=0;
for(let p in stock) total+=stock[p].length;

stockCount.innerText=total;
}

// HISTORY
async function loadHistory(){
let res=await fetch("/admin/history");
let arr=await res.json();

historyBox.innerHTML="";
arr.forEach(x=>{
historyBox.innerHTML+=`<div>${x}</div>`;
});
}

// REQUEST
async function loadRequests(){
let res=await fetch("/admin/data");
let arr=await res.json();

requestBox.innerHTML="";

arr.reverse().forEach(x=>{
if(x.status==="pending"){
requestBox.innerHTML+=`
<div style="border:1px solid #ccc;margin:5px;padding:5px">
${x.plan} | UTR: ${x.utr}
<button onclick="verify(${x.id})">YES</button>
<button onclick="reject(${x.id})">NO</button>
</div>`;
}
});
}

// VERIFY
async function verify(id){
await fetch("/admin/verify/"+id);
loadRequests();
}

// REJECT
async function reject(id){
await fetch("/admin/reject/"+id);
loadRequests();
}

// SETTINGS
async function loadSettings(){
let res=await fetch("/admin/settings");
let s=await res.json();

customerToggle.checked=s.customerEnabled;
toggleStatus.innerText=s.customerEnabled?"ON":"OFF";
}

// TOGGLE
async function toggleCustomer(){
toggleStatus.innerText="...";

let res=await fetch("/admin/toggleCustomer",{
method:"POST",
headers:{'Content-Type':'application/json'},
body:JSON.stringify({enabled:customerToggle.checked})
});

let d=await res.json();
toggleStatus.innerText=d.customerEnabled?"ON":"OFF";
}

</script>

</body>
</html>
