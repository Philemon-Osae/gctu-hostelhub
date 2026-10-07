"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Page(){
  const [list,setList]=useState<any[]>([]);
  const [reminderBookings,setReminderBookings]=useState<any[]>([]);
  const [faultDesc,setFaultDesc]=useState("");
  const [selectedBookingForFault,setSelectedBookingForFault]=useState<any>(null);
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
      // Mark code as seen
      myList.forEach(async (b:any)=>{
        if(b.bookingCode &&!b.codeSeenByStudent){
          await updateDoc(doc(db,"bookings",b.id),{codeSeenByStudent:true,codeSeenAt:new Date().toISOString()});
        }
      });
    });
    return ()=>unsub();
  },[]);

  const payRent=async(b:any)=>{ if(!confirm(`Pay rent GHC ${b.price} to owner?`)) return; await updateDoc(doc(db,"bookings",b.id),{rentPaid:true,status:"rent_paid"}); alert("Marked paid - Owner will generate your entry code - Watch this page"); };
  const requestCheckout=async(b:any)=>{ const reason=prompt("Reason for moving out?"); if(!reason) return; await updateDoc(doc(db,"bookings",b.id),{ status:"checkout_requested", checkoutReason:reason, checkoutRequestedAt:new Date().toISOString() }); alert("Checkout requested"); };
  const reportFault=async()=>{ if(!selectedBookingForFault) return; if(!faultDesc.trim()) return alert("Describe fault"); await addDoc(collection(db,"faults"),{ hostelId:selectedBookingForFault.hostelId, hostelName:selectedBookingForFault.hostelName, roomType:selectedBookingForFault.roomType, studentName:selectedBookingForFault.studentName, studentPhone:selectedBookingForFault.studentPhone, studentIndex:selectedBookingForFault.studentIndex, description:faultDesc, status:"pending", createdAt:new Date().toISOString(), bookingId:selectedBookingForFault.id }); setFaultDesc(""); setSelectedBookingForFault(null); alert("Fault sent to owner - He will fix soon"); };
  const rateHostel=async(b:any,stars:number)=>{ await updateDoc(doc(db,"bookings",b.id),{rating:stars}); alert(`Rated ${stars}`); };

  return <main style={{padding:12,maxWidth:800,margin:"auto",fontFamily:"sans-serif"}}>
    <button onClick={()=>r.push("/student/dashboard")} style={{background:"#eee",border:0,padding:8,borderRadius:6}}>← Dashboard</button>
    <h2>My Bookings - T-Code appears here automatically</h2>

    {reminderBookings.length>0 && <div style={{background:"#ff5722",color:"white",padding:12,borderRadius:10,marginTop:10}}><b>⏰ {reminderBookings.length} room(s) overdue 120 days - Checkout please</b></div>}

    {list.length===0&&<p>No bookings</p>}
    {list.map((b:any)=>{
      const movedIn = b.verifiedAt? new Date(b.verifiedAt) : new Date(b.createdAt);
      const days = b.status==="moved_in"? Math.floor((new Date().getTime()-movedIn.getTime())/(1000*60*60*24)) : 0;
      return <div key={b.id} style={{border:"2px solid #1a237e",padding:14,marginTop:12,borderRadius:12,background:"white"}}>
      <b>{b.hostelName}</b> - {b.roomType}<br/>
      <span style={{fontSize:12,background:b.status==="moved_in"?"#c8e6c9":b.status==="checked_out"?"#ffcdd2":"#e3f2fd",padding:"4px 8px",borderRadius:10}}>{b.status.toUpperCase()} {days>0?` - ${days} days`:""}</span>

      {/* NEW: BIG T-CODE DISPLAY */}
      {b.bookingCode && b.status==="rent_paid" && (
        <div style={{background:"#1a237e",color:"white",padding:14,borderRadius:10,marginTop:10,textAlign:"center",border:"3px dashed #ffeb3b"}}>
          <small style={{opacity:0.8}}>YOUR ENTRY CODE - SHOW AT GATE</small><br/>
          <b style={{fontSize:32,letterSpacing:4}}>{b.bookingCode}</b><br/>
          <small>Generated {b.codeGeneratedAt?new Date(b.codeGeneratedAt).toLocaleString():""} - Owner will verify this to move you in</small>
        </div>
      )}
      {b.bookingCode && b.status==="confirmed" && <div style={{background:"#fff9c4",padding:8,borderRadius:8,marginTop:8}}>Code generating soon...</div>}

      <br/><small>Trans {b.momoTransactionId} to 0206834470 - {b.verifiedAt?`Moved in: ${new Date(b.verifiedAt).toLocaleString()}`:`Booked: ${new Date(b.createdAt).toLocaleString()}`}{b.checkoutApprovedAt?` - Checked out: ${new Date(b.checkoutApprovedAt).toLocaleString()}`:""}</small>

      {b.status==="confirmed"&&<button onClick={()=>payRent(b)} style={{background:"#1a237e",color:"white",padding:10,marginTop:8,width:"100%",borderRadius:8,border:0}}>I Paid Rent GHC {b.price}</button>}

      {b.status==="moved_in"&&<div>
        <div style={{background:"#e8f5e9",padding:10,borderRadius:8,marginTop:8,fontSize:13}}>✅ Moved in {new Date(b.verifiedAt).toLocaleString()} - {days} days ago - Enjoy</div>
        <button onClick={()=>setSelectedBookingForFault(b)} style={{background:"#ff9800",color:"white",padding:10,marginTop:8,width:"100%",borderRadius:8,border:0}}>🔧 Report Fault / Problem in Room</button>
        <button onClick={()=>requestCheckout(b)} style={{background:"#ff5722",color:"white",padding:10,marginTop:6,width:"100%",borderRadius:8,border:0}}>📦 Request Move-Out</button>
      </div>}

      {b.status==="checkout_requested"&&<div style={{background:"#fff9c4",padding:10,borderRadius:8,marginTop:8}}>⏳ Waiting owner inspection</div>}
      {b.status==="checked_out"&&<div><div style={{background:"#ffcdd2",padding:10,borderRadius:8,marginTop:8}}>📦 Checked out {b.checkoutApprovedAt?new Date(b.checkoutApprovedAt).toLocaleString():""} - {b.damageFee?`Damage GHC ${b.damageFee}`:"No damage"}</div><div style={{display:"flex",gap:6,marginTop:8}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>rateHostel(b,n)} style={{background:b.rating>=n?"#ff9800":"#eee",border:0,padding:"6px 10px",borderRadius:6}}>⭐{n}</button>)}</div></div>}
    </div>
    })}

    {selectedBookingForFault && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",justifyContent:"center",alignItems:"center",padding:12,zIndex:999}}><div style={{background:"white",padding:16,borderRadius:12,width:"100%",maxWidth:400}}><h3>🔧 Report Fault for {selectedBookingForFault.hostelName} - {selectedBookingForFault.roomType}</h3><textarea placeholder="E.g. Tap is leaking, Light not working, Door lock broken..." value={faultDesc} onChange={e=>setFaultDesc(e.target.value)} style={{width:"100%",padding:10,border:"1px solid #ccc",borderRadius:8,minHeight:80,marginTop:8}}></textarea><button onClick={reportFault} style={{width:"100%",background:"#d32f2f",color:"white",padding:12,borderRadius:8,border:0,marginTop:8}}>Send to Owner</button><button onClick={()=>setSelectedBookingForFault(null)} style={{width:"100%",background:"#eee",padding:10,borderRadius:8,border:0,marginTop:6}}>Cancel</button></div></div>}

    {/* ROOMMATE FINDER */}
    <div style={{background:"white",border:"2px solid #6a1b9a",padding:14,borderRadius:12,marginTop:20}}><h3>👥 Find Roommate - Post Request</h3><RoommateSection /></div>
  </main>
}

function RoommateSection(){
  const [list,setList]=useState<any[]>([]); const [form,setForm]=useState({hostelName:"",roomType:"",message:"",phone:""});
  useEffect(()=>{ const unsub=onSnapshot(collection(db,"roommates"),s=>setList(s.docs.map(d=>({id:d.id,...d.data()} as any)).sort((a:any,b:any)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()))); return ()=>unsub(); },[]);
  const post=async()=>{
    const student=JSON.parse(localStorage.getItem("student")||"null");
    if(!form.hostelName||!form.message) return alert("Fill hostel and message");
    await addDoc(collection(db,"roommates"),{...form,studentName:student?.name||"Student",studentCourse:student?.course||"",createdAt:new Date().toISOString()});
    setForm({hostelName:"",roomType:"",message:"",phone:""}); alert("Roommate request posted - All students see it");
  };
  return <div><div style={{display:"flex",flexDirection:"column",gap:6}}><input placeholder="Hostel e.g. LIZ HOSTEL" value={form.hostelName} onChange={e=>setForm({...form,hostelName:e.target.value})} style={{padding:10,border:"1px solid #ccc",borderRadius:8}}/><input placeholder="Room type e.g. 2 in a room" value={form.roomType} onChange={e=>setForm({...form,roomType:e.target.value})} style={{padding:10,border:"1px solid #ccc",borderRadius:8}}/><input placeholder="Your WhatsApp e.g. 024..." value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={{padding:10,border:"1px solid #ccc",borderRadius:8}}/><textarea placeholder="E.g. I am in LIZ Room 5, looking for one female roommate, neat, 2nd year..." value={form.message} onChange={e=>setForm({...form,message:e.target.value})} style={{padding:10,border:"1px solid #ccc",borderRadius:8}}></textarea><button onClick={post} style={{background:"#6a1b9a",color:"white",padding:10,borderRadius:8,border:0}}>Post Roommate Request</button></div><div style={{marginTop:12}}>{list.map((r:any)=><div key={r.id} style={{border:"1px solid #ddd",padding:10,borderRadius:8,marginTop:6,background:"#f3e5f5"}}><b>{r.studentName}</b> - {r.hostelName} - {r.roomType}<br/><small>{new Date(r.createdAt).toLocaleString()} - 📞 {r.phone}</small><br/><p style={{fontSize:13,marginTop:4}}>{r.message}</p></div>)}</div></div>
}