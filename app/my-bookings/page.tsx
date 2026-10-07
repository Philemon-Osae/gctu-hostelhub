"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
export default function Page(){
  const [list,setList]=useState<any[]>([]);
  const [reminderBookings,setReminderBookings]=useState<any[]>([]);
  const r=useRouter();
  useEffect(()=>{
    const my=JSON.parse(localStorage.getItem("myBookings")||"[]");
    if(my.length===0) return;
    const ids=my.map((m:any)=>m.id);
    const unsub=onSnapshot(collection(db,"bookings"),s=>{
      const all=s.docs.map(d=>({id:d.id,...d.data()} as any));
      const myList = all.filter((b:any)=>ids.includes(b.id));
      setList(myList);
      const now = new Date();
      const overdue = myList.filter((b:any)=>{
        if(b.status!=="moved_in") return false;
        const movedIn = b.verifiedAt? new Date(b.verifiedAt) : new Date(b.createdAt);
        const days = Math.floor((now.getTime()-movedIn.getTime())/(1000*60*60*24));
        return days >= 120;
      });
      setReminderBookings(overdue);
    });
    return ()=>unsub();
  },[]);
  const payRent=async(b:any)=>{
    if(!confirm(`Pay rent GHC ${b.price} to owner MoMo?`)) return;
    await updateDoc(doc(db,"bookings",b.id),{rentPaid:true,status:"rent_paid"});
    alert("Rent marked paid - Wait for owner T-code");
  };
  const requestCheckout=async(b:any)=>{
    const reason=prompt("Reason for moving out?\n1. End of semester\n2. Transfer\n3. Personal\n4. Graduation\nType reason:");
    if(!reason) return;
    if(!confirm(`Request checkout from ${b.hostelName} - ${b.roomType}?\nRoom will be inspected by owner.`)) return;
    await updateDoc(doc(db,"bookings",b.id),{ status:"checkout_requested", checkoutReason:reason, checkoutRequestedAt:new Date().toISOString() });
    alert("✅ Checkout requested - Owner will inspect room soon");
  };
  const rateHostel=async(b:any,stars:number)=>{
    await updateDoc(doc(db,"bookings",b.id),{rating:stars,ratedAt:new Date().toISOString()});
    alert(`Thanks! Rated ${stars} stars ⭐`);
  };
  return <main style={{padding:20,maxWidth:800,margin:"auto",fontFamily:"sans-serif"}}>
    <button onClick={()=>r.push("/student/dashboard")} style={{background:"#eee",border:0,padding:8,borderRadius:6}}>← Dashboard</button>
    <h1>My Bookings - MoMo 0206834470</h1>
    {reminderBookings.length>0 && (
      <div style={{background:"#ff5722",color:"white",padding:16,borderRadius:12,marginTop:12,border:"3px solid #bf360c"}}>
        <h3 style={{margin:0}}>⏰ SEMESTER END ALERT! {reminderBookings.length} room(s) overdue 120 days</h3>
        <p style={{fontSize:13,margin:"8px 0"}}>You moved in 4+ months ago. Semester ending? Please checkout to free room for new GCTU students.</p>
        {reminderBookings.map((b:any)=>{
          const movedIn = b.verifiedAt? new Date(b.verifiedAt) : new Date(b.createdAt);
          const days = Math.floor((new Date().getTime()-movedIn.getTime())/(1000*60*60*24));
          return <div key={b.id} style={{background:"white",color:"black",padding:10,borderRadius:8,marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><b>{b.hostelName}</b> - {b.roomType}<br/><small>Moved in {days} days ago - {movedIn.toLocaleDateString()}</small></div>
            <button onClick={()=>requestCheckout(b)} style={{background:"#ff5722",color:"white",padding:"10px 14px",borderRadius:8,border:0,fontWeight:"bold"}}>📦 Checkout Now</button>
          </div>
        })}
      </div>
    )}
    <p style={{fontSize:12,color:"#666",marginTop:12}}>Move-in with T-code, Move-out at semester end - Auto reminder after 120 days</p>
    {list.length===0&&<p>No bookings yet - Go book hostel</p>}
    {list.map((b:any)=>{
      const movedIn = b.verifiedAt? new Date(b.verifiedAt) : new Date(b.createdAt);
      const days = b.status==="moved_in"? Math.floor((new Date().getTime()-movedIn.getTime())/(1000*60*60*24)) : 0;
      return <div key={b.id} style={{border:"1px solid #ddd",padding:14,marginTop:10,borderRadius:10,background:"white",borderLeft: days>=120? "5px solid #ff5722" : "5px solid #1a237e"}}>
      <b>{b.hostelName}</b> - {b.roomType}<br/>
      <span style={{fontSize:12,background:b.status==="moved_in"?"#c8e6c9":b.status==="checkout_requested"?"#fff9c4":b.status==="checked_out"?"#ffcdd2":b.status==="rent_paid"?"#e1bee7":"#e3f2fd",padding:"3px 8px",borderRadius:10}}>{b.status.toUpperCase()} {days>0 && b.status==="moved_in"? ` - ${days} days` : ""}</span>
      {b.bookingCode&&<span style={{marginLeft:6,fontSize:12,background:"#1a237e",color:"white",padding:"3px 8px",borderRadius:10}}>T-Code: {b.bookingCode}</span>}
      <br/><small>Trans {b.momoTransactionId} to 0206834470 - {b.verifiedAt? `Moved in: ${new Date(b.verifiedAt).toLocaleDateString()}` : `Booked: ${new Date(b.createdAt).toLocaleDateString()}`}</small>
      {b.status==="confirmed"&&<button onClick={()=>payRent(b)} style={{background:"#1a237e",color:"white",padding:10,marginTop:8,width:"100%",borderRadius:8,border:0}}>I Paid Rent GHC {b.price} to Owner MoMo</button>}
      {b.status==="moved_in"&&<div><div style={{background: days>=120? "#ffebee" : "#e8f5e9",padding:10,borderRadius:8,marginTop:8,fontSize:12,border: days>=120? "1px solid #ff5722" : "1px solid #4caf50"}}>{days>=120? `⏰ ${days} days in room - Semester end? Please checkout to free room` : `✅ You moved in ${days} days ago - Enjoy! At semester end, request checkout`}</div><button onClick={()=>requestCheckout(b)} style={{background: days>=120? "#ff5722" : "#ff9800",color:"white",padding:10,marginTop:8,width:"100%",borderRadius:8,border:0,fontWeight:"bold"}}>📦 Request Move-Out / Checkout {days>=120? "- Overdue!" : ""}</button></div>}
      {b.status==="checkout_requested"&&<div style={{background:"#fff9c4",padding:10,borderRadius:8,marginTop:8,fontSize:12}}>⏳ Checkout requested: {b.checkoutReason} - Waiting owner room inspection</div>}
      {b.status==="checked_out"&&<div><div style={{background:"#ffcdd2",padding:10,borderRadius:8,marginTop:8,fontSize:12}}>📦 Checked out {b.checkoutApprovedAt? `on ${new Date(b.checkoutApprovedAt).toLocaleDateString()}` : ""} - Room freed - {b.damageFee? `Damage fee GHC ${b.damageFee}` : "No damages"} - Thanks!</div><div style={{marginTop:8}}><p style={{fontSize:12}}>Rate hostel for next students:</p><div style={{display:"flex",gap:6}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>rateHostel(b,n)} style={{background:b.rating>=n?"#ff9800":"#eee",border:0,padding:"6px 10px",borderRadius:6}}>⭐ {n}</button>)}</div></div></div>}
    </div>
    })}
  </main>
}