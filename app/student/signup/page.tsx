'use client';
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
export default function Page(){
  const [form,setForm]=useState({name:"",course:"",indexNumber:"",phone:"",email:"",password:""});
  const r=useRouter();
  const signup=async()=>{
    if(!form.name||!form.course||!form.indexNumber||!form.phone||!form.email||!form.password) return alert("Fill all fields");
    try{
      const cred=await createUserWithEmailAndPassword(auth,form.email,form.password);
      await setDoc(doc(db,"students",cred.user.uid),{...form,createdAt:new Date().toISOString()});
      localStorage.setItem("student",JSON.stringify({uid:cred.user.uid,...form}));
      alert("Account created!");
      r.push("/student/dashboard");
    }catch(e:any){ alert(e.message); }
  };
  return <main style={{minHeight:"100vh",background:"#e3f2fd",padding:20,fontFamily:"sans-serif",display:"flex",justifyContent:"center",alignItems:"center"}}>
    <div style={{background:"white",padding:20,borderRadius:16,width:"100%",maxWidth:420,boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}}>
      <button onClick={()=>r.push("/")} style={{background:"#eee",border:0,padding:6,borderRadius:6}}>← Welcome</button>
      <h1 style={{color:"#1a237e"}}>Student Sign Up</h1>
      <p style={{fontSize:12}}>Create your student account - Ghana Student Hostel</p>
      <input placeholder="Full Name e.g. John Mensah" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
      <input placeholder="Course e.g. BSc Computer Science" value={form.course} onChange={e=>setForm({...form,course:e.target.value})} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
      <input placeholder="Index Number e.g. GCTU/2023/1234" value={form.indexNumber} onChange={e=>setForm({...form,indexNumber:e.target.value})} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
      <input placeholder="Phone +233 24 123 4567" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
      <input placeholder="Email e.g. john@gctu.edu.gh" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
      <input type="password" placeholder="Password min 6 chars" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} style={{width:"100%",padding:12,marginTop:8,border:"1px solid #ccc",borderRadius:8}} />
      <button onClick={signup} style={{width:"100%",background:"#1a237e",color:"white",padding:14,borderRadius:10,border:0,marginTop:12,fontWeight:"bold"}}>Sign Up</button>
      <p style={{textAlign:"center",fontSize:12,marginTop:10}}>Already have account? <span onClick={()=>r.push("/student/login")} style={{color:"#1a237e",fontWeight:"bold",cursor:"pointer"}}>Log in</span></p>
      <p style={{fontSize:10,textAlign:"center",color:"#888"}}>MoMo Payments to 0206834470 - Multi-account same phone supported</p>
    </div>
  </main>
}