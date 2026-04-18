<script>

let selectedPlan="";
let interval;

// START BUY
function startBuy(){
  selectedPlan=document.getElementById("plan").value;
  if(!selectedPlan){ alert("Select Plan"); return; }

  document.getElementById("payment").classList.remove("hidden");
  document.getElementById("planShow").innerText="Plan: "+selectedPlan;
}

// METHOD
function changeMethod(){
  let m=document.getElementById("method").value;
  if(m==="utr"){
    document.getElementById("utr").style.display="block";
    document.getElementById("file").style.display="none";
  }else{
    document.getElementById("utr").style.display="none";
    document.getElementById("file").style.display="block";
  }
}

// 🔥 SUBMIT (FINAL FIX)
async function submitPayment(){

  let utr=document.getElementById("utr").value.trim();
  let file=document.getElementById("file").files[0];

  if(!selectedPlan){
    alert("Select Plan First");
    return;
  }

  if(!utr && !file){
    alert("Enter UTR or Upload Screenshot");
    return;
  }

  let finalUTR = utr || Date.now().toString();

  let form=new FormData();
  form.append("plan",selectedPlan);
  form.append("utr",finalUTR);

  if(file){
    form.append("file",file);
  }

  console.log("SENDING:", selectedPlan, finalUTR);

  try{

    let res = await fetch(window.location.origin + "/buy",{
      method:"POST",
      body:form
    });

    let data = await res.json();

    console.log("SERVER RESPONSE:", data);

    alert("✅ Request Sent");

  }catch(err){
    alert("❌ Error sending request");
    console.log(err);
    return;
  }

  localStorage.setItem("utr",finalUTR);

  document.getElementById("status").innerText="⏳ Waiting for admin verification...";

  check(finalUTR);
}

// STATUS
function check(utr){

  clearInterval(interval);

  interval=setInterval(async()=>{

    let res=await fetch(window.location.origin + "/status/"+utr);
    let data=await res.json();

    if(data.status==="approved"){
      clearInterval(interval);
      localStorage.removeItem("utr");
      alert("✅ KEY: "+data.key);
      location.reload();
    }

    if(data.status==="rejected"){
      clearInterval(interval);
      localStorage.removeItem("utr");
      alert("❌ Rejected");
      location.reload();
    }

  },2000);
}

</script>
