'use client';
import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
export default function Page(){
  const [form,setForm]=useState({indexNumber:"",email:"",phone:""}); const r=useRouter();
  const reset=async()=>{
    if(!form.indexNumber||!form.email||!form.phone) return alert("Fill all 3 fields - Must match signup data");
    const q=query(collection(db,"students"),where("indexNumber","==",form.indexNumber),where("email","==",form.email),where("phone","==",form.phone));
    const snap=await getDocs(q);
    if(snap.empty) return alert("No student found with Index "+form.indexNumber+" + Email "+form.email+" + Phone "+form.phone+" - Must match exactly");
    try{ await sendPasswordResetEmail(auth,form.email); alert("Reset email sent to "+form.email+" - Open Gmail, click link, set new password"); r.push("/student/login"); }catch(e:any){ alert(e.message); }
  };
  return <main style={{minHeight:"100vh",background:"#ffebee",padding:20,display:"flex",justifyContent:"center",alignItems:"center",fontFamily:"sans-serif"}}>
    <div style={{background:"white",padding:20,borderRadius:16,width:"100%",maxWidth:400}}>
      <button onClick={()=>r.push("/student/login")} style={{background:"#eee",border:0,padding:6,borderRadius:6}}>← Login</button>
      <h1 style={{color:"#c62828"}}>Forgot Password?</h1>
      <p style={{fontSize:12}}>Enter Index Number + Email + Phone exactly as signup - We verify then send reset email</p>
      <input placeholder="Index Number e.g. GCTU/2023/1234" value={form.indexNumber} onChange={e=>setForm({...form,indexNumber:e.target.value})} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
      <input placeholder="Email e.g. john@gctu.edu.gh" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
      <input placeholder="Phone e.g. 0551234567" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
      <button onClick={reset} style={{width:"100%",background:"#c62828",color:"white",padding:12,borderRadius:8,border:0,marginTop:12}}>Send Reset Email</button>
      <p style={{fontSize:10,color:"#888",marginTop:8}}>If phone lost, borrow friend phone, enter your Index+Email+Phone, reset via your email, login on friend phone, book, then logout</p>
    </div>
  </main>
}