'use client';
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { owners } from "@/data/owners";
import { useRouter } from "next/navigation";
export default function Page(){
  const [form,setForm]=useState({hostelId:"",phone:"",name:"",newPass:"",confirm:""}); const [verified,setVerified]=useState(false); const r=useRouter();
  const verify=()=>{
    const o=owners.find(x=>x.hostelId.toLowerCase()===form.hostelId.trim().toLowerCase() && x.phone===form.phone.trim() && x.name.toLowerCase().includes(form.name.trim().toLowerCase()));
    if(!o) return alert("Not found - Check Hostel ID + Phone + Owner Name must match data/owners.ts - e.g. liz_hostel + 0530140669 + LIZ OWNER");
    setVerified(true); alert("Verified! Now set new password");
  };
  const reset=async()=>{
    if(form.newPass.length<4) return alert("Min 4 chars");
    if(form.newPass!==form.confirm) return alert("Passwords no match");
    const owner=owners.find(x=>x.hostelId.toLowerCase()===form.hostelId.trim().toLowerCase())!;
    await setDoc(doc(db,"owner_passwords",owner.hostelId),{password:form.newPass,phone:form.phone,hostelId:owner.hostelId,updatedAt:new Date().toISOString()},{merge:true});
    alert(`Password reset to ${form.newPass} - Login now`);
    r.push("/owner/login");
  };
  return <main style={{minHeight:"100vh",background:"#fff3e0",padding:20,display:"flex",justifyContent:"center",alignItems:"center",fontFamily:"sans-serif"}}>
    <div style={{background:"white",padding:20,borderRadius:16,width:"100%",maxWidth:400}}>
      <button onClick={()=>r.push("/owner/login")} style={{background:"#eee",border:0,padding:6,borderRadius:6}}>← Owner Login</button>
      <h1 style={{color:"#ef6c00"}}>Owner Forgot Password</h1>
      <p style={{fontSize:12}}>Verify Hostel ID + Phone + Name - Direct reset no email - Saved to owner_passwords</p>
      {!verified? <>
        <input placeholder="Hostel ID e.g. liz_hostel" value={form.hostelId} onChange={e=>setForm({...form,hostelId:e.target.value})} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
        <input placeholder="Phone e.g. 0530140669" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
        <input placeholder="Owner Name e.g. LIZ OWNER" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
        <button onClick={verify} style={{width:"100%",background:"#ef6c00",color:"white",padding:12,borderRadius:8,border:0,marginTop:12}}>Verify</button>
      </> : <>
        <input type="password" placeholder="New Password" value={form.newPass} onChange={e=>setForm({...form,newPass:e.target.value})} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
        <input type="password" placeholder="Confirm New Password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
        <button onClick={reset} style={{width:"100%",background:"#2e7d32",color:"white",padding:12,borderRadius:8,border:0,marginTop:12}}>Reset Password</button>
      </>}
    </div>
  </main>
}