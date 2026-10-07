'use client';
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { owners } from "@/data/owners";
import { useRouter } from "next/navigation";
export default function Page(){
  const [hostelId,setHostelId]=useState(""); const [password,setPassword]=useState(""); const r=useRouter();
  const login=async()=>{
    const staticOwner=owners.find(o=>o.hostelId.toLowerCase()===hostelId.trim().toLowerCase());
    if(!staticOwner) return alert("Hostel ID not found - e.g. liz_hostel");
    let validPass = staticOwner.phone;
    try{
      const passDoc=await getDoc(doc(db,"owner_passwords",staticOwner.hostelId));
      if(passDoc.exists()) validPass=passDoc.data().password;
    }catch{}
    if(password!==validPass) return alert(`Wrong password - Default is phone ${staticOwner.phone} - If changed, use new password - Forgot? Click Forgot`);
    localStorage.setItem("owner",JSON.stringify({...staticOwner,password:validPass}));
    r.push("/owner/dashboard");
  };
  return <main style={{minHeight:"100vh",background:"#e8f5e9",padding:20,display:"flex",justifyContent:"center",alignItems:"center",fontFamily:"sans-serif"}}>
    <div style={{background:"white",padding:20,borderRadius:16,width:"100%",maxWidth:400}}>
      <button onClick={()=>r.push("/")} style={{background:"#eee",border:0,padding:6,borderRadius:6}}>← Welcome</button>
      <h1 style={{color:"#2e7d32"}}>Owner Login</h1>
      <p style={{fontSize:12}}>Hostel ID e.g. liz_hostel + Password = Phone e.g. 0530140669 - Change password himself in dashboard - Forgot available</p>
      <input placeholder="Hostel ID e.g. liz_hostel" value={hostelId} onChange={e=>setHostelId(e.target.value)} style={{width:"100%",padding:12,marginTop:12,border:"1px solid #ccc",borderRadius:8}} />
      <input type="password" placeholder="Password default = phone number" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
      <button onClick={login} style={{width:"100%",background:"#2e7d32",color:"white",padding:12,borderRadius:8,border:0,marginTop:12}}>Login</button>
      <p style={{fontSize:12,textAlign:"center",marginTop:10,cursor:"pointer",color:"#c62828"}} onClick={()=>r.push("/owner/forgot-password")}>Forgot Password? Reset with Hostel ID + Phone + Name</p>
      <p style={{fontSize:10,color:"#888"}}>MoMo for rent payment editable in dashboard - Needs admin approval - Checkout requests at semester end</p>
    </div>
  </main>
}