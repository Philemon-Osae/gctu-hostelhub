'use client';
import { useRouter } from "next/navigation";
export default function Page(){
  const r=useRouter();
  return <main style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a237e,#42a5f5)",padding:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
    <div style={{textAlign:"center",color:"white",marginBottom:20}}>
      <h1 style={{fontSize:32,fontWeight:"bold",margin:0}}>GCTU HostelHub</h1>
      <p style={{fontSize:12,opacity:0.8}}>GHANA - GHANA CHRISTIAN UNIVERSITY COLLEGE</p>
      <h2 style={{fontSize:28,marginTop:20}}>Welcome!</h2>
      <p>Find and manage hostel accommodation with ease</p>
    </div>
    <div style={{width:"100%",maxWidth:400,display:"flex",flexDirection:"column",gap:14}}>
      <button onClick={()=>r.push("/student/signup")} style={{background:"white",padding:18,borderRadius:14,border:0,textAlign:"left",display:"flex",gap:12,alignItems:"center",boxShadow:"0 4px 12px rgba(0,0,0,0.2)"}}>
        <div style={{background:"#1a237e",color:"white",width:50,height:50,borderRadius:25,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🎓</div>
        <div><b style={{fontSize:18,color:"#1a237e"}}>Student</b><br/><small>Search, book & pay for hostels</small></div>
      </button>
      <button onClick={()=>r.push("/owner/login")} style={{background:"white",padding:18,borderRadius:14,border:0,textAlign:"left",display:"flex",gap:12,alignItems:"center",boxShadow:"0 4px 12px rgba(0,0,0,0.2)"}}>
        <div style={{background:"#1a237e",color:"white",width:50,height:50,borderRadius:25,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🏨</div>
        <div><b style={{fontSize:18,color:"#1a237e"}}>Owner</b><br/><small>List & manage your hostel properties</small></div>
      </button>
      <button onClick={()=>r.push("/admin/login")} style={{background:"white",padding:18,borderRadius:14,border:0,textAlign:"left",display:"flex",gap:12,alignItems:"center",boxShadow:"0 4px 12px rgba(0,0,0,0.2)"}}>
        <div style={{background:"#1a237e",color:"white",width:50,height:50,borderRadius:25,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🔐</div>
        <div><b style={{fontSize:18,color:"#1a237e"}}>Admin</b><br/><small>Manage users, bookings & approvals</small></div>
      </button>
    </div>
    <div style={{marginTop:20,background:"rgba(255,255,255,0.2)",padding:"10px 14px",borderRadius:10,color:"white",fontSize:12}}>
      📱 MoMo Support & Payments: <b>MoMo 0206834470</b><br/>Secure • Fast • Ghanaian • GCTU HostelHub v2.0 - Checkout + 120 Days Reminder
    </div>
  </main>
}