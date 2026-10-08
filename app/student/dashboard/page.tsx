'use client';
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { hostels as staticHostels } from "@/data/hostels";

export default function Page(){
  const [student,setStudent]=useState<any>(null);
  const [hostels,setHostels]=useState<any[]>([]);
  const [filterLocation,setFilterLocation]=useState("All");
  const [search,setSearch]=useState("");
  const [showBook,setShowBook]=useState<any>(null);
  const [transId,setTransId]=useState("");
  const r=useRouter();

  useEffect(()=>{
    const s=JSON.parse(localStorage.getItem("student")||"null");
    if(!s){ r.push("/student/login"); return; }
    setStudent(s);

    const load=async()=>{
      const liveSnap=await getDocs(collection(db,"hostels_live"));
      const liveMap: any = {};
      liveSnap.docs.forEach(d=>liveMap[d.id]=d.data());
      const merged = staticHostels.map(h=> liveMap[h.id]? {...h,...liveMap[h.id]} : h);
      setHostels(merged);
    };
    load();

    const checkSemesterEnd = async () => {
      const my = JSON.parse(localStorage.getItem("myBookings") || "[]");
      if (my.length === 0) return;
      const bookingsSnap = await getDocs(collection(db, "bookings"));
      const allBookings = bookingsSnap.docs.map(d => ({ id: d.id,...d.data() } as any));
      const myBookings = allBookings.filter((b:any) => my.some((m:any) => m.id === b.id && b.status === "moved_in"));
      myBookings.forEach((b:any) => {
        const movedInDate = b.verifiedAt? new Date(b.verifiedAt) : new Date(b.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - movedInDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 120) {
          const alreadyReminded = localStorage.getItem(`reminded_${b.id}`);
          if (!alreadyReminded) {
            setTimeout(() => {
              if (confirm(`⏰ SEMESTER END REMINDER!\n\nYou moved into ${b.hostelName} - ${b.roomType} ${Math.floor(daysDiff/30)} months ago (${daysDiff} days).\n\nSemester ending? Click OK to Request Move-Out & Free Room for next GCTU students.\nCancel to Stay.`)) {
                r.push("/my-bookings");
              }
              localStorage.setItem(`reminded_${b.id}`, "true");
            }, 3000);
          }
        }
      });
    };
    checkSemesterEnd();
  },[r]);

  const filtered = hostels.filter(h=>{
    const matchLoc = filterLocation==="All" || h.location===filterLocation;
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) || h.location.toLowerCase().includes(search.toLowerCase());
    return matchLoc && matchSearch;
  });

  // === FIXED BOOKING FUNCTION - BLOCKS 1, abcd ===
  const bookRoom=async(room:any)=>{
    const rawId = transId.trim().toUpperCase();

    if(!rawId){
      return alert("Enter MoMo Transaction ID for 50 to 0206834470");
    }

    // BLOCK FAKE IDs
    if(rawId.length < 8){
      return alert(`❌ Invalid ID! "${rawId}" too short.\n\nReal MoMo IDs are 8-12 chars like:\n1234567890\nor MOMO1234567890\n\nCheck your MoMo SMS after sending 50 to 0206834470`);
    }

    if(["1","2","3","123","1234","TEST","MOMO","ABC","ABCD","MOMO123"].includes(rawId)){
      return alert(`❌ Fake ID detected: "${rawId}"\n\nPlease enter REAL Transaction ID from MoMo SMS after you send 50 GHS to 0206834470`);
    }

    if(!/^[A-Z0-9]{8,20}$/.test(rawId)){
      return alert("❌ Invalid format. Use only letters and numbers, 8-20 characters. Example: 1234567890 or MOMO2338749201");
    }

    try {
      const my=JSON.parse(localStorage.getItem("myBookings")||"[]");
      const ref=await addDoc(collection(db,"bookings"),{
        hostelId:showBook.id,
        hostelName:showBook.name,
        studentName:student.name,
        studentCourse:student.course,
        studentIndex:student.indexNumber,
        studentPhone:student.phone,
        studentEmail:student.email,
        studentUid:student.uid,
        roomType:room.type,
        price:room.price,
        adminFeePaid:false, // Will be true after admin verifies
        adminFeeAmount:50,
        adminMomoNumber:"0206834470",
        momoTransactionId:rawId, // Clean ID
        transId:rawId, // For compatibility
        rentPaid:false,
        status:"PENDING_VERIFICATION", // FIXED: NOT booked, PENDING until you verify 50 GHS
        verified:false,
        commissionAmount: Math.floor(room.price*0.05),
        ownerAmount: room.price - Math.floor(room.price*0.05),
        createdAt:new Date().toISOString(),
        bookedAt:new Date().toISOString()
      });
      localStorage.setItem("myBookings",JSON.stringify([...my,{id:ref.id,hostelName:showBook.name,roomType:room.type}]));
      alert(`✅ SUBMITTED!\n\nHostel: ${showBook.name}\nRoom: ${room.type}\nTrans ID: ${rawId}\nAmount: 50 GHS to 0206834470\n\nStatus: ⏳ PENDING VERIFICATION\nAdmin will check your payment and confirm. T-Code appears in My Bookings after verification.`);
      setShowBook(null); setTransId(""); r.push("/my-bookings");
    } catch (e:any) {
      alert("Error: " + e.message);
    }
  };

  const logout=()=>{ if(confirm("Logout? Next student can login on same phone")){ localStorage.removeItem("student"); r.push("/student/login"); } };

  if(!student) return <p>Loading...</p>;
  return <main style={{padding:12,maxWidth:1100,margin:"auto",fontFamily:"sans-serif",background:"#f5f5f5",minHeight:"100vh"}}>
    <div style={{background:"white",padding:12,borderRadius:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
      <div><b>Hi, {student.name}!</b><br/><small>{student.course} • {student.indexNumber} • {student.phone}</small></div>
      <div style={{display:"flex",gap:6}}><button onClick={()=>r.push("/my-bookings")} style={{background:"#1a237e",color:"white",padding:"8px 12px",borderRadius:8,border:0}}>My Bookings</button><button onClick={logout} style={{background:"#c62828",color:"white",padding:"8px 12px",borderRadius:8,border:0}}>Logout</button></div>
    </div>
    <div style={{background:"white",padding:12,borderRadius:12,marginTop:10}}>
      <h2 style={{margin:0}}>Find Your Hostel - 19 Hostels - MoMo 0206834470</h2>
      <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
        <input placeholder="Search hostel e.g. LIZ" value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:140,padding:10,border:"1px solid #ccc",borderRadius:8}} />
        <select value={filterLocation} onChange={e=>setFilterLocation(e.target.value)} style={{padding:10,borderRadius:8,border:"1px solid #ccc"}}><option>All</option><option>Lapaz</option><option>Tesano</option><option>Abeka</option></select>
      </div>
      <p style={{fontSize:12,color:"#666"}}>Found {filtered.length} hostels - Book 50 fee to 0206834470 - Semester reminder after 120 days</p>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12,marginTop:12}}>
      {filtered.map((h:any)=><div key={h.id} style={{background:"white",borderRadius:12,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>
        <img src={h.photos?.[0]||"https://via.placeholder.com/400"} alt={h.name} style={{width:"100%",height:160,objectFit:"cover"}} />
        <div style={{padding:12}}>
          <b>{h.name}</b> <span style={{background:"#e3f2fd",fontSize:10,padding:"2px 6px",borderRadius:6}}>{h.location}</span><br/>
          <small>📍 {h.distance} • 📞 {h.contact}</small><br/>
          <small style={{fontSize:11}}>{h.facilities?.slice(0,4).join(" • ")}</small>
          <div style={{marginTop:8}}>
            {h.rooms?.map((rm:any,i:number)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f5f5f5",padding:6,borderRadius:6,marginTop:4}}>
              <span style={{fontSize:12}}>{rm.type} - GHC {rm.price}/month</span>
              <button onClick={()=>setShowBook(h)} style={{background:"#ff9800",color:"white",border:0,padding:"6px 10px",borderRadius:6,fontSize:11}}>Book 50</button>
            </div>)}
          </div>
        </div>
      </div>)}
    </div>

    {showBook && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",justifyContent:"center",alignItems:"center",padding:12,zIndex:999}}>
      <div style={{background:"white",padding:16,borderRadius:12,width:"100%",maxWidth:380}}>
        <h3>Book {showBook.name}</h3>
        <p style={{fontSize:12}}>Pay GHC 50 booking fee to Admin MoMo <b>0206834470</b><br/>Then enter Transaction ID</p>
        <div style={{background:"#e3f2fd",padding:10,borderRadius:8,fontSize:12,marginTop:8}}>
          1. Open MoMo App<br/>2. Send 50 to 0206834470<br/>3. Copy Trans ID e.g. MOMO1234567890 (8+ chars)<br/>4. Paste below
        </div>
        {showBook.rooms?.map((rm:any,i:number)=><div key={i} style={{border:"1px solid #ddd",padding:10,borderRadius:8,marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><b>{rm.type}</b><br/>GHC {rm.price}/month + 50 fee to 0206834470<br/><small>Commission 5% = GHC {Math.floor(rm.price*0.05)}</small></div>
          <button onClick={()=>bookRoom(rm)} style={{background:"#1a237e",color:"white",padding:"8px 12px",borderRadius:6,border:0}}>Book This</button>
        </div>)}
        <input placeholder="Enter MoMo Trans ID e.g. MOMO2338749201 for 50 to 0206834470" value={transId} onChange={e=>setTransId(e.target.value)} style={{width:"100%",padding:12,marginTop:10,border:"2px solid #1a237e",borderRadius:8}} />
        <small style={{fontSize:10,color:"red"}}>Type 1 or abcd will be blocked - Enter real MoMo ID (8+ chars)</small>
        <button onClick={()=>{setShowBook(null);setTransId("");}} style={{width:"100%",background:"#eee",padding:10,borderRadius:8,border:0,marginTop:8}}>Cancel</button>
      </div>
    </div>}
  </main>
}