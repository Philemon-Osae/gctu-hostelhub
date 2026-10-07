'use client';
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { hostels as staticHostels } from "@/data/hostels";

export default function Page(){
 const [owner,setOwner]=useState<any>(null);
 const [tab,setTab]=useState<'home'|'data'|'report'|'faults'>('home');
 const [list,setList]=useState<any[]>([]);
 const [code,setCode]=useState('');
 const [liveHostel,setLiveHostel]=useState<any>(null);
 const [pendingExists,setPendingExists]=useState(false);
 const [newPassword,setNewPassword]=useState('');
 const [confirmPassword,setConfirmPassword]=useState('');
 const [checkoutList,setCheckoutList]=useState<any[]>([]);
 const [uploading,setUploading]=useState(false);
 const [faults,setFaults]=useState<any[]>([]);
 // POPUPS
 const [lastCount,setLastCount]=useState({bookings:0,faults:0,checkout:0});
 const [popup,setPopup]=useState<any>(null);
 const r=useRouter();

 const getOverstayDays=(b:any)=>{ const movedIn=b.verifiedAt?new Date(b.verifiedAt):new Date(b.createdAt); return Math.floor((new Date().getTime()-movedIn.getTime())/(1000*60*60*24)); };
 const playSound=()=>{ try{ const a=new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_5a7d2b9e3c.mp3'); a.play(); }catch{} };

 useEffect(()=>{
  const o=JSON.parse(localStorage.getItem('owner')||'null'); if(!o){ r.push('/owner/login'); return; } setOwner(o);

  const q=query(collection(db,'bookings'),where('hostelId','==',o.hostelId),where('adminFeePaid','==',true));
  const unsub=onSnapshot(q,s=>{
    const data=s.docs.map(d=>({id:d.id,...d.data()} as any));
    if(data.length>lastCount.bookings && lastCount.bookings!==0){
      const newest=data.sort((a:any,b:any)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())[0];
      setPopup({type:'booking',title:'🔔 NEW BOOKING!',data:newest,message:`${newest.studentName} booked ${newest.roomType} - GHC ${newest.price} - Trans ${newest.momoTransactionId}`});
      playSound(); setTimeout(()=>setPopup(null),8000);
    }
    setList(data); setLastCount(prev=>({...prev,bookings:data.length}));
  });

  const checkoutQ=query(collection(db,'bookings'),where('hostelId','==',o.hostelId),where('status','==','checkout_requested'));
  const unsub2=onSnapshot(checkoutQ,s=>{
    const data=s.docs.map(d=>({id:d.id,...d.data()} as any));
    if(data.length>lastCount.checkout && lastCount.checkout!==0){
      const newest=data.sort((a:any,b:any)=>new Date(b.checkoutRequestedAt).getTime()-new Date(a.checkoutRequestedAt).getTime())[0];
      setPopup({type:'checkout',title:'📦 CHECKOUT REQUEST!',data:newest,message:`${newest.studentName} wants to checkout - Reason: ${newest.checkoutReason}`});
      playSound(); setTimeout(()=>setPopup(null),8000);
    }
    setCheckoutList(data); setLastCount(prev=>({...prev,checkout:data.length}));
  });

  const faultsQ=query(collection(db,'faults'),where('hostelId','==',o.hostelId));
  const unsub3=onSnapshot(faultsQ,s=>{
    const data=s.docs.map(d=>({id:d.id,...d.data()} as any));
    if(data.length>lastCount.faults && lastCount.faults!==0){
      const newest=data.sort((a:any,b:any)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())[0];
      if(newest.status!=='resolved'){
        setPopup({type:'fault',title:'🚨 NEW FAULT!',data:newest,message:`${newest.studentName} - ${newest.description}`});
        playSound(); setTimeout(()=>setPopup(null),8000);
      }
    }
    setFaults(data); setLastCount(prev=>({...prev,faults:data.length}));
  });

  getDoc(doc(db,'hostels_pending',o.hostelId)).then(ps=>{ if(ps.exists()&&ps.data().status==='pending'){ setLiveHostel(ps.data()); setPendingExists(true);} else { getDoc(doc(db,'hostels_live',o.hostelId)).then(ls=>{ if(ls.exists()) setLiveHostel(ls.data()); else setLiveHostel(staticHostels.find(h=>h.id===o.hostelId)); }); }});
  return ()=>{unsub();unsub2();unsub3();};
 },[r,lastCount.bookings,lastCount.checkout,lastCount.faults]);

 const saveToPending=async(newData:any)=>{ newData.updatedAt=new Date().toISOString(); newData.status='pending'; newData.ownerId=owner.hostelId; newData.ownerName=owner.name; setLiveHostel(newData); await setDoc(doc(db,'hostels_pending',owner.hostelId),newData,{merge:true}); setPendingExists(true); };
 const handlePhotoUpload=async(e:any)=>{ const files=Array.from(e.target.files) as File[]; if(files.length===0) return; if((liveHostel.photos?.length||0)+files.length>6) return alert("Max 6"); setUploading(true); const newPhotos:string[]=[]; for(const file of files){ if(file.size>800*1024){ alert(`${file.name} too big`); continue; } const base64=await new Promise<string>((resolve)=>{ const reader=new FileReader(); reader.onload=()=>resolve(reader.result as string); reader.readAsDataURL(file); }); newPhotos.push(base64); } const updated={...liveHostel,photos:[...(liveHostel.photos||[]),...newPhotos]}; await saveToPending(updated); setUploading(false); alert("Photos added - Waiting approval 0206834470"); };
 const deletePhoto=async(i:number)=>{ if(!confirm("Delete?")) return; const updatedPhotos=liveHostel.photos.filter((_:any,idx:number)=>idx!==i); await saveToPending({...liveHostel,photos:updatedPhotos}); };
 const confirmBooking=async(b:any)=>{ await updateDoc(doc(db,'bookings',b.id),{status:'confirmed'}); };
 const rejectBooking=async(b:any)=>{ await updateDoc(doc(db,'bookings',b.id),{status:'rejected_full'}); };
 const generateCode=async(b:any)=>{ const c='T'+Math.random().toString(36).substring(2,7).toUpperCase()+Math.floor(Math.random()*90+10); await updateDoc(doc(db,'bookings',b.id),{bookingCode:c,codeGeneratedAt:new Date().toISOString(),codeSeenByStudent:false}); alert(`Code ${c} - Student sees instantly`); };
 const verifyCode=async()=>{ const b=list.find((x:any)=>(x.bookingCode||'').toLowerCase()===code.trim().toLowerCase()); if(!b) return alert('Invalid'); if(b.status!=='rent_paid') return alert('Rent not paid'); await updateDoc(doc(db,'bookings',b.id),{status:'moved_in',verifiedBy:owner.name,verifiedAt:new Date().toISOString()}); alert('✅ Verified Moved In'); setCode(''); };
 const changePassword=async()=>{ if(newPassword.length<4) return alert("Min 4"); if(newPassword!==confirmPassword) return alert("No match"); await setDoc(doc(db,"owner_passwords",owner.hostelId),{password:newPassword,phone:owner.phone,hostelId:owner.hostelId,updatedAt:new Date().toISOString()},{merge:true}); const updated={...owner,password:newPassword}; localStorage.setItem("owner",JSON.stringify(updated)); setOwner(updated); setNewPassword(''); setConfirmPassword(''); alert(`Changed to ${newPassword}`); };
 const approveCheckout=async(b:any)=>{ if(!confirm(`Approve checkout for ${b.studentName}?`)) return; const fee=prompt("Damage fee 0 if none:")||"0"; await updateDoc(doc(db,'bookings',b.id),{status:'checked_out',checkoutApprovedAt:new Date().toISOString(),damageFee:parseInt(fee),roomFreed:true}); };
 const rejectCheckout=async(b:any)=>{ const reason=prompt("Reason?"); await updateDoc(doc(db,'bookings',b.id),{status:'moved_in',checkoutRejectedReason:reason}); };
 const resolveFault=async(f:any)=>{ await updateDoc(doc(db,'faults',f.id),{status:'resolved',resolvedAt:new Date().toISOString()}); };

 const movedInList=list.filter(b=>b.status==='moved_in' || b.status==='checked_out' || b.status==='checkout_requested');
 const today=new Date().toDateString();
 const dailyBookings=movedInList.filter(b=>b.verifiedAt && new Date(b.verifiedAt).toDateString()===today);
 const weeklyBookings=movedInList.filter(b=>{ if(!b.verifiedAt) return false; const d=new Date(b.verifiedAt); const diff=Math.floor((new Date().getTime()-d.getTime())/(1000*60*60*24)); return diff<=7; });
 const monthlyBookings=movedInList.filter(b=>{ if(!b.verifiedAt) return false; const d=new Date(b.verifiedAt); const now=new Date(); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear(); });
 const yearlyBookings=movedInList.filter(b=>{ if(!b.verifiedAt) return false; return new Date(b.verifiedAt).getFullYear()===new Date().getFullYear(); });
 const sumOwner=(arr:any[])=>arr.reduce((s,b)=>s+(b.ownerAmount||b.price-Math.floor(b.price*0.05)),0);

 if(!owner||!liveHostel) return <p>Loading...</p>;
 return <main style={{padding:12,maxWidth:1100,margin:'auto',fontFamily:"sans-serif"}}>
   {/* POPUP */}
   {popup && (
     <div style={{position:'fixed',top:16,right:12,left:12,maxWidth:420,marginLeft:'auto',background:popup.type==='booking'?"#1a237e":popup.type==='checkout'?"#ff9800":"#d32f2f",color:'white',padding:14,borderRadius:12,zIndex:9999,boxShadow:'0 6px 24px rgba(0,0,0,0.4)',border:'2px solid white'}}>
       <div style={{display:'flex',justifyContent:'space-between'}}><b>{popup.title}</b><button onClick={()=>setPopup(null)} style={{background:'white',color:'black',border:0,borderRadius:50,width:24,height:24}}>X</button></div>
       <div style={{marginTop:8,fontSize:13}}>{popup.message}<br/><small>{new Date(popup.data?.createdAt||popup.data?.checkoutRequestedAt||new Date().toISOString()).toLocaleString()}</small></div>
       <button onClick={()=>{ if(popup.type==='fault') setTab('faults'); if(popup.type==='checkout') setTab('home'); if(popup.type==='booking') setTab('home'); setPopup(null); }} style={{background:'white',color:'black',padding:'6px 12px',borderRadius:6,border:0,marginTop:8,fontWeight:'bold',width:'100%'}}>View Now</button>
     </div>
   )}

   <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap"}}><h2>{owner.name} - {owner.hostelName}</h2><button onClick={()=>{localStorage.removeItem("owner"); r.push("/owner/login");}} style={{background:"#c62828",color:"white",padding:"8px 12px",borderRadius:6,border:0}}>Logout</button></div>
   <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
     <button onClick={()=>setTab('home')} style={{background:tab==='home'?"#1a237e":"#eee",color:tab==='home'?"white":"black",padding:"10px 14px",borderRadius:8,border:0,fontWeight:"bold"}}>🏠 Home ({list.filter(b=>b.status==='booked').length})</button>
     <button onClick={()=>setTab('data')} style={{background:tab==='data'?"#1a237e":"#eee",color:tab==='data'?"white":"black",padding:"10px 14px",borderRadius:8,border:0,fontWeight:"bold"}}>📊 Data ({movedInList.length})</button>
     <button onClick={()=>setTab('report')} style={{background:tab==='report'?"#1a237e":"#eee",color:tab==='report'?"white":"black",padding:"10px 14px",borderRadius:8,border:0,fontWeight:"bold"}}>💰 Report</button>
     <button onClick={()=>setTab('faults')} style={{background:tab==='faults'?"#d32f2f":"#eee",color:tab==='faults'?"white":"black",padding:"10px 14px",borderRadius:8,border:0,fontWeight:"bold"}}>🔧 Faults ({faults.filter(f=>f.status!=='resolved').length})</button>
   </div>
   {pendingExists && <div style={{background:'#ffeb3b',padding:8,borderRadius:8,marginTop:8}}>⏳ Pending approval - Admin 0206834470</div>}

   {tab==='home' && <div>
     <div style={{background:'#e3f2fd',padding:14,borderRadius:12,marginTop:12}}><b>✅ Verify T-code - Student shows code from his phone</b><div style={{display:'flex',gap:8,marginTop:8}}><input placeholder="TXXXX" value={code} onChange={e=>setCode(e.target.value)} style={{flex:1,padding:12,border:"1px solid #ccc",borderRadius:8}}/><button onClick={verifyCode} style={{background:'#1a237e',color:'white',padding:12,borderRadius:8,border:0}}>Verify</button></div></div>
     <div style={{background:'#fff9c4',border:'2px solid #ff9800',padding:14,borderRadius:12,marginTop:12}}><h3>📦 Checkout Requests ({checkoutList.length})</h3>{checkoutList.map((b:any)=><div key={b.id} style={{background:'white',padding:10,marginTop:8,borderRadius:8,display:"flex",justifyContent:"space-between",flexWrap:"wrap"}}><div><b>{b.studentName}</b> - {b.roomType}<br/><small>{b.checkoutReason} - {b.verifiedAt?new Date(b.verifiedAt).toLocaleString():""}</small></div><div style={{display:"flex",gap:6}}><button onClick={()=>approveCheckout(b)} style={{background:'#2e7d32',color:'white',padding:"8px 12px",borderRadius:6,border:0}}>Approve</button><button onClick={()=>rejectCheckout(b)} style={{background:'#c62828',color:'white',padding:"8px 12px",borderRadius:6,border:0}}>Reject</button></div></div>)}</div>
     <h3 style={{marginTop:16}}>Bookings - Generate auto to student</h3>{list.map((b:any)=><div key={b.id} style={{border:'1px solid #ddd',padding:12,borderRadius:10,marginTop:8,background:"white"}}><b>{b.studentName}</b> - {b.roomType} - <span style={{background:"#e3f2fd",padding:"2px 6px",borderRadius:6,fontSize:12}}>{b.status}</span> {b.bookingCode&&` Code ${b.bookingCode}`}<br/><small>{b.studentIndex} | {b.studentPhone} | Trans {b.momoTransactionId}</small><div style={{display:'flex',gap:6,marginTop:8}}>{b.status==='booked'&&<><button onClick={()=>confirmBooking(b)} style={{background:'#2e7d32',color:'white',padding:8,borderRadius:6,border:0}}>Confirm</button><button onClick={()=>rejectBooking(b)} style={{background:'#c62828',color:'white',padding:8,borderRadius:6,border:0}}>Reject</button></>}{b.status==='rent_paid'&&<button onClick={()=>generateCode(b)} style={{background:'#ff9800',color:'white',padding:8,borderRadius:6,border:0}}>Generate T-Code</button>}</div></div>)}
   </div>}

   {tab==='data' && <div style={{marginTop:12}}><div style={{background:"white",padding:14,borderRadius:12}}><h3>📊 Moved-In Data with Date/Time</h3><div style={{overflowX:"auto"}}><table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}><thead><tr style={{background:"#1a237e",color:"white"}}><th style={{padding:8}}>Student</th><th>Room</th><th>Moved In</th><th>Checked Out</th><th>Days</th><th>Status</th></tr></thead><tbody>{list.filter(b=>b.verifiedAt).sort((a,b)=>new Date(b.verifiedAt).getTime()-new Date(a.verifiedAt).getTime()).map((b:any)=><tr key={b.id} style={{borderBottom:"1px solid #ddd"}}><td style={{padding:8}}>{b.studentName}<br/><small>{b.studentIndex}</small></td><td>{b.roomType}</td><td><small>{new Date(b.verifiedAt).toLocaleString()}</small></td><td><small>{b.checkoutApprovedAt?new Date(b.checkoutApprovedAt).toLocaleString():b.status==='moved_in'?"Still in":"-"}</small></td><td>{b.checkoutApprovedAt?Math.floor((new Date(b.checkoutApprovedAt).getTime()-new Date(b.verifiedAt).getTime())/(1000*60*60*24))+"d":getOverstayDays(b)+"d"}</td><td>{b.status}</td></tr>)}</tbody></table></div></div><div style={{background:'#fff',border:'1px solid #ddd',padding:14,borderRadius:12,marginTop:12}}><h3>📸 Pictures + Edit Contact + Price - DATA tab</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8,marginTop:8}}>{liveHostel.photos?.map((p:any,i:number)=><div key={i} style={{position:"relative",border:"1px solid #ddd",borderRadius:8,overflow:"hidden"}}><img src={p} style={{width:"100%",height:100,objectFit:"cover"}}/><button onClick={()=>deletePhoto(i)} style={{position:"absolute",top:2,right:2,background:"red",color:"white",border:0,borderRadius:50,width:20,height:20}}>X</button></div>)}</div><input type="file" multiple accept="image/*" onChange={handlePhotoUpload} disabled={uploading} style={{marginTop:10}}/><br/><small>MoMo Contact: </small><input value={liveHostel.contact} onChange={e=>saveToPending({...liveHostel,contact:e.target.value})} style={{padding:8,border:"1px solid #ccc",borderRadius:6,width:"100%",marginTop:4}} /><small>Hostel Name: </small><input value={liveHostel.name} onChange={e=>saveToPending({...liveHostel,name:e.target.value})} style={{padding:8,border:"1px solid #ccc",borderRadius:6,width:"100%",marginTop:4}} /><h4>Rooms & Prices</h4>{liveHostel.rooms?.map((rm:any,i:number)=><div key={i} style={{display:'flex',gap:8,marginTop:6}}><input value={rm.type} onChange={e=>{const r=[...liveHostel.rooms]; r[i].type=e.target.value; saveToPending({...liveHostel,rooms:r})}} style={{flex:1,padding:8,border:"1px solid #ccc",borderRadius:4}}/><input type="number" value={rm.price} onChange={e=>{const r=[...liveHostel.rooms]; r[i].price=parseInt(e.target.value)||0; saveToPending({...liveHostel,rooms:r})}} style={{width:100,padding:8,border:"1px solid #ccc",borderRadius:4}}/></div>)}</div></div>}

   {tab==='report' && <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:10}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}><div style={{background:"#2e7d32",color:"white",padding:16,borderRadius:12}}><small>Today</small><br/><b>GHC {sumOwner(dailyBookings)}</b><br/><small>{dailyBookings.length} in</small></div><div style={{background:"#1a237e",color:"white",padding:16,borderRadius:12}}><small>Week</small><br/><b>GHC {sumOwner(weeklyBookings)}</b><br/><small>{weeklyBookings.length} in</small></div><div style={{background:"#ff9800",color:"white",padding:16,borderRadius:12}}><small>Month</small><br/><b>GHC {sumOwner(monthlyBookings)}</b><br/><small>{monthlyBookings.length} in</small></div><div style={{background:"#6a1b9a",color:"white",padding:16,borderRadius:12}}><small>Year</small><br/><b>GHC {sumOwner(yearlyBookings)}</b><br/><small>{yearlyBookings.length} in</small></div></div><div style={{background:"white",padding:14,borderRadius:12}}><h3>Report</h3><p>All time GHC {sumOwner(movedInList)} - {movedInList.length} students</p><p>Currently in: {list.filter(b=>b.status==='moved_in').length}</p><p>Checked out: {list.filter(b=>b.status==='checked_out').length}</p><p>Overstay 120+: {list.filter(b=>b.status==='moved_in' && getOverstayDays(b)>=120).length}</p></div></div>}

   {tab==='faults' && <div style={{marginTop:12}}><div style={{background:"white",padding:14,borderRadius:12}}><h3>🔧 Faults</h3>{faults.length===0&&<p>No faults</p>}{faults.map((f:any)=><div key={f.id} style={{border:"1px solid #ddd",padding:10,borderRadius:8,marginTop:8,borderLeft:f.status==='resolved'?"5px solid green":"5px solid red"}}><b>{f.studentName}</b> - {f.roomType}<br/><small>{new Date(f.createdAt).toLocaleString()}</small><br/><p style={{background:"#fff3e0",padding:8,borderRadius:6,marginTop:6}}>{f.description}</p><small>{f.status}</small>{f.status!=='resolved'&&<button onClick={()=>resolveFault(f)} style={{marginLeft:8,background:"#2e7d32",color:"white",padding:"6px 10px",borderRadius:6,border:0}}>Resolved</button>}</div>)}</div></div>}

   <div style={{background:'#f3e5f5',border:'2px solid #7b1fa2',padding:14,borderRadius:12,marginTop:12}}><h4>🔐 Change Password</h4><div style={{display:"flex",gap:6}}><input type="password" placeholder="New" value={newPassword} onChange={e=>setNewPassword(e.target.value)} style={{flex:1,padding:8,border:"1px solid #ccc",borderRadius:6}}/><input type="password" placeholder="Confirm" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} style={{flex:1,padding:8,border:"1px solid #ccc",borderRadius:6}}/><button onClick={changePassword} style={{background:'#7b1fa2',color:'white',padding:8,borderRadius:6,border:0}}>Change</button></div></div>
 </main>
}