'use client';
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
export default function Page(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const r=useRouter();
  const login=async()=>{
    try{
      localStorage.removeItem("student"); localStorage.removeItem("myBookings"); await signOut(auth);
      const cred=await signInWithEmailAndPassword(auth,email,password);
      const snap=await getDoc(doc(db,"students",cred.user.uid));
      if(!snap.exists()) return alert("Student data not found - Signup again");
      localStorage.setItem("student",JSON.stringify({uid:cred.user.uid,...snap.data()}));
      r.push("/student/dashboard");
    }catch(e:any){ alert(e.message+" - Check email/password - Multi-account: previous user logged out"); }
  };
  return <main style={{minHeight:"100vh",background:"#e3f2fd",padding:20,display:"flex",justifyContent:"center",alignItems:"center",fontFamily:"sans-serif"}}>
    <div style={{background:"white",padding:20,borderRadius:16,width:"100%",maxWidth:400}}>
      <button onClick={()=>r.push("/")} style={{background:"#eee",border:0,padding:6,borderRadius:6}}>← Welcome</button>
      <h1 style={{color:"#1a237e"}}>Student Login</h1>
      <p style={{fontSize:12}}>Multi-account same phone - Previous user auto logged out</p>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%",padding:12,marginTop:12,border:"1px solid #ccc",borderRadius:8}} />
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
      <button onClick={login} style={{width:"100%",background:"#1a237e",color:"white",padding:12,borderRadius:8,border:0,marginTop:12}}>Login</button>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:10,fontSize:12}}><span onClick={()=>r.push("/student/signup")} style={{color:"#1a237e",cursor:"pointer"}}>No account? Signup</span><span onClick={()=>r.push("/student/forgot-password")} style={{color:"#c62828",cursor:"pointer"}}>Forgot Password?</span></div>
      <p style={{fontSize:10,color:"#888",marginTop:10}}>If you forgot phone, borrow friend phone, login, book, then logout - friend data safe</p>
    </div>
  </main>
}