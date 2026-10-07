'use client';
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
export default function Page(){
  const [bookings,setBookings]=useState<any[]>([]); const [pending,setPending]=useState<any[]>([]); const [adminId,setAdminId]=useState(""); const r=useRouter();
  useEffect(()=>{
    const isAdmin=localStorage.getItem("admin"); if(!isAdmin){ r.push("/admin/login"); return; } setAdminId(localStorage.getItem("adminId")||"admin");
    const unsub1=onSnapshot(collection(db,"bookings"),s=>setBookings(s.docs.map(d=>({id:d.id,...d.data()}))));
    const unsub2=onSnapshot(collection(db,"hostels_pending"),s=>setPending(s.docs.map(d=>({id:d.id,...d.data()}))));
    return ()=>{unsub1();unsub2();};
  },[r]);
  const fees=bookings.filter(b=>b.adminFeePaid).length*50;
  const comm=bookings.filter(b=>b.rentPaid).reduce((sum,b)=>sum+(b.commissionAmount||0),0);
  const total=fees+comm;
  const checkedOutCount=bookings.filter(b=>b.status==="checked_out").length;
  const checkoutRequestedCount=bookings.filter(b=>b.status==="checkout_requested").length;
  const movedInCount=bookings.filter(b=>b.status==="moved_in").length;
  const overstayCount=bookings.filter((b:any)=>{ if(b.status!=="moved_in") return false; const d=b.verifiedAt?new Date(b.verifiedAt):new Date(b.createdAt); const days=Math.floor((new Date().getTime()-d.getTime())/(1000*60*60*24)); return days>=120; }).length;
  const approve=async(p:any)=>{ const toLive={...p}; delete toLive.status; delete toLive.ownerId; delete toLive.ownerName; delete toLive.updatedAt; await setDoc(doc(db,"hostels_live",p.id),toLive,{merge:true}); await deleteDoc(doc(db,"hostels_pending",p.id)); alert(`Approved ${p.name} - New contact ${p.contact} live now`); };
  const reject=async(p:any)=>{ if(!confirm(`Reject ${p.name} edit?`)) return; await deleteDoc(doc(db,"hostels_pending",p.id)); alert("Rejected"); };
  const logout=()=>{ localStorage.removeItem("admin"); localStorage.removeItem("adminId"); r.push("/admin/login"); };
  return <main style={{padding:20,maxWidth:1200,margin:"auto",fontFamily:"sans-serif",background:"#eceff1",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}><h1>Admin - {adminId} - MoMo 0206834470</h1><div style={{display:"flex",gap:6}}><button onClick={()=>r.push("/")} style={{background:"#fff",padding:"8px 12px",borderRadius:6,border:"1px solid #ccc"}}>Welcome</button><button onClick={logout} style={{background:"#c62828",color:"white",padding:"8px 12px",borderRadius:6,border:0}}>Logout</button></div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginTop:12}}>
      <div style={{background:"#2e7d32",color:"white",padding:16,borderRadius:12}}><b>Total GHC {total}</b><br/><small>Fees {fees} + Comm {comm}</small></div>
      <div style={{background:"#1a237e",color:"white",padding:16,borderRadius:12}}><b>Bookings {bookings.length}</b><br/><small>MovedIn {movedInCount}</small></div>
      <div style={{background:"#ff9800",color:"white",padding:16,borderRadius:12}}><b>Pending {pending.length}</b><br/><small>Hostel edits</small></div>
      <div style={{background:"#795548",color:"white",padding:16,borderRadius:12}}><b>CheckedOut {checkedOutCount}</b><br/><small>Freed rooms</small></div>
      <div style={{background:"#ff5722",color:"white",padding:16,borderRadius:12}}><b>CheckoutReq {checkoutRequestedCount}</b><br/><small>Semester end</small></div>
      <div style={{background:"#d32f2f",color:"white",padding:16,borderRadius:12}}><b>Overstay {overstayCount}</b><br/><small>120+ days</small></div>
    </div>
    <div style={{background:"white",padding:16,borderRadius:12,marginTop:16,border:"2px solid #ff9800"}}>
      <h3>🟠 Pending Hostel Edits - Approve MoMo Contact Changes ({pending.length})</h3>
      {pending.length===0? <p style={{fontSize:12}}>No pending - All hostels approved</p> : pending.map((p:any)=><div key={p.id} style={{border:"1px solid #ff9800",padding:12,borderRadius:8,marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div><b>{p.name}</b> - {p.id}<br/><small>Owner: {p.ownerName} - New Contact: <b style={{color:"#1a237e"}}>{p.contact}</b> - Old contact students used to pay rent to this new number if approved<br/>Rooms: {p.rooms?.map((r:any)=>`${r.type} GHC${r.price}`).join(", ")}</small></div>
        <div style={{display:"flex",gap:6}}><button onClick={()=>approve(p)} style={{background:"#2e7d32",color:"white",padding:"8px 12px",borderRadius:6,border:0}}>✅ Approve Live</button><button onClick={()=>reject(p)} style={{background:"#c62828",color:"white",padding:"8px 12px",borderRadius:6,border:0}}>❌ Reject</button></div>
      </div>)}
    </div>
    <div style={{background:"white",padding:16,borderRadius:12,marginTop:16}}>
      <h3>📋 All Bookings - Verify MoMo 0206834470 - Fees + Checkout + Overstay</h3>
      <p style={{fontSize:11,color:"#666"}}>Check your phone MoMo 0206834470 history - Each Trans ID should be GHC 50 - Fake Trans ID = Reject booking via Firebase Console - Overstay 120 days = call student to checkout</p>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",fontSize:12,borderCollapse:"collapse",marginTop:8}}>
          <thead><tr style={{background:"#263238",color:"white"}}><th style={{padding:8,textAlign:"left"}}>Hostel</th><th>Room</th><th>Status</th><th>Student (Index)</th><th>Trans ID to 0206834470</th><th>T-Code</th><th>Days</th><th>Rating/Damage</th></tr></thead>
          <tbody>{bookings.sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).map((b:any)=>{
            const movedIn=b.verifiedAt?new Date(b.verifiedAt):new Date(b.createdAt);
            const days=Math.floor((new Date().getTime()-movedIn.getTime())/(1000*60*60*24));
            const isOverstay=b.status==="moved_in" && days>=120;
            return <tr key={b.id} style={{borderBottom:"1px solid #ddd",background: isOverstay? "#ffebee" : b.status==="checked_out"? "#efebe9" : "white"}}><td style={{padding:8}}>{b.hostelName}</td><td>{b.roomType}<br/>GHC{b.price}</td><td><span style={{background:b.status==="moved_in"?"#c8e6c9":b.status==="checked_out"?"#bcaaa4":b.status==="checkout_requested"?"#fff9c4":"#e3f2fd",padding:"2px 6px",borderRadius:6}}>{b.status}</span>{isOverstay&&<span style={{background:"red",color:"white",padding:"2px 4px",borderRadius:4,marginLeft:4,fontSize:10}}>OVERSTAY</span>}</td><td>{b.studentName}<br/><small>{b.studentIndex}<br/>{b.studentPhone}</small></td><td><b>{b.momoTransactionId}</b><br/><small>{b.adminMomoNumber}</small></td><td>{b.bookingCode||"No"}</td><td>{b.status==="moved_in"||b.status==="checked_out"?`${days}d`: "-"}</td><td>{b.rating?`⭐${b.rating}`:""} {b.damageFee?`Damage GHC${b.damageFee}`:""}<br/><small>{b.checkoutReason||""}</small></td></tr>
          })}</tbody>
        </table>
      </div>
    </div>
    <div style={{marginTop:16,background:"#263238",color:"white",padding:12,borderRadius:8,fontSize:11}}>
      <b>FINAL BUSINESS FLOW:</b> Student 50 to 0206834470 (you keep) + Rent to Owner MoMo (owner keeps 95%, you get 5% later) + Checkout after 120 days auto reminder + Room freed + Rating - Total Earnings = Fees + Commission
    </div>
  </main>
}