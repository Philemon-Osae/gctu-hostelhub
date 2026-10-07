'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function Page(){
  const [id,setId]=useState(""); const [pass,setPass]=useState(""); const r=useRouter();
  const login=()=>{
    const admins:any={ admin:"0206834470", philemon:"admin123", gctu:"gctu2024" };
    if(admins[id.trim().toLowerCase()]===pass.trim()){ localStorage.setItem("admin","true"); localStorage.setItem("adminId",id.trim()); r.push("/admin/dashboard"); }
    else alert("Wrong ID/Pass - Try admin / 0206834470 - Your MoMo is password");
  };
  return <main style={{minHeight:"100vh",background:"#263238",padding:20,display:"flex",justifyContent:"center",alignItems:"center",fontFamily:"sans-serif"}}>
    <div style={{background:"white",padding:20,borderRadius:16,width:"100%",maxWidth:400}}>
      <button onClick={()=>r.push("/")} style={{background:"#eee",border:0,padding:6,borderRadius:6}}>← Welcome</button>
      <h1 style={{color:"#263238"}}>Admin Login - Philemon</h1>
      <p style={{fontSize:12}}>ID: admin Pass: 0206834470 (your MoMo) - Also philemon/admin123 backup</p>
      <input placeholder="Admin ID e.g. admin" value={id} onChange={e=>setId(e.target.value)} style={{width:"100%",padding:12,marginTop:12,border:"1px solid #ccc",borderRadius:8}} />
      <input type="password" placeholder="Password e.g. 0206834470" value={pass} onChange={e=>setPass(e.target.value)} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
      <button onClick={login} style={{width:"100%",background:"#263238",color:"white",padding:12,borderRadius:8,border:0,marginTop:12}}>Login as Admin</button>
      <p style={{fontSize:10,color:"#888",marginTop:8}}>MoMo 0206834470 - Verify all Trans IDs against your phone balance - Checkout approvals + Hostel edits + Earnings</p>
    </div>
  </main>
}