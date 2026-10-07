'use client';
import { useRouter } from "next/navigation";

export default function Welcome(){
 const r=useRouter();
 return (
 <main style={{minHeight:"100vh",background:"linear-gradient(180deg,#1a237e,#1976d2)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"sans-serif"}}>
   <h1 style={{color:"white",fontSize:36,fontWeight:"bold",margin:0}}>GCTU HostelHub</h1>
   <small style={{color:"white",opacity:0.8,textAlign:"center",marginTop:4}}>GHANA - GHANA COMMUNICATION TECHNOLOGY UNIVERSITY</small>
   <h2 style={{color:"white",marginTop:20}}>Welcome!</h2>
   <p style={{color:"white",textAlign:"center",maxWidth:300,marginTop:6}}>Find and manage hostel accommodation with ease</p>

   <div style={{width:"100%",maxWidth:360,marginTop:20,display:"flex",flexDirection:"column",gap:14}}>
     <button onClick={()=>r.push("/student/login")} style={{background:"white",border:0,padding:16,borderRadius:16,display:"flex",alignItems:"center",gap:14,textAlign:"left",cursor:"pointer"}}>
       <div style={{background:"#1a237e",width:52,height:52,borderRadius:50,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🎓</div>
       <div><b style={{color:"#1a237e",fontSize:18}}>Student</b><br/><small style={{color:"#555"}}>Search, book & pay for hostels</small></div>
     </button>
     <button onClick={()=>r.push("/owner/login")} style={{background:"white",border:0,padding:16,borderRadius:16,display:"flex",alignItems:"center",gap:14,textAlign:"left",cursor:"pointer"}}>
       <div style={{background:"#1a237e",width:52,height:52,borderRadius:50,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🏨</div>
       <div><b style={{color:"#1a237e",fontSize:18}}>Owner</b><br/><small style={{color:"#555"}}>List & manage your hostel properties</small></div>
     </button>
     <button onClick={()=>r.push("/admin/login")} style={{background:"white",border:0,padding:16,borderRadius:16,display:"flex",alignItems:"center",gap:14,textAlign:"left",cursor:"pointer"}}>
       <div style={{background:"#1a237e",width:52,height:52,borderRadius:50,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🔐</div>
       <div><b style={{color:"#1a237e",fontSize:18}}>Admin</b><br/><small style={{color:"#555"}}>Manage users, bookings & approvals</small></div>
     </button>
   </div>

   {/* MoMo banner REMOVED - Clean for defense */}
 </main>
 );
}