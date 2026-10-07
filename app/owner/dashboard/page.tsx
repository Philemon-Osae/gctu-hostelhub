'use client';
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { hostels as staticHostels } from "@/data/hostels";

export default function Page(){
 const [owner,setOwner]=useState<any>(null);
 const [list,setList]=useState<any[]>([]);
 const [code,setCode]=useState('');
 const [liveHostel,setLiveHostel]=useState<any>(null);
 const [pendingExists,setPendingExists]=useState(false);
 const [newPassword,setNewPassword]=useState('');
 const [confirmPassword,setConfirmPassword]=useState('');
 const [checkoutList,setCheckoutList]=useState<any[]>([]);
 const [uploading,setUploading]=useState(false);
 const r=useRouter();

 const getOverstayDays=(b:any)=>{ const movedIn=b.verifiedAt?new Date(b.verifiedAt):new Date(b.createdAt); return Math.floor((new Date().getTime()-movedIn.getTime())/(1000*60*60*24)); };

 useEffect(()=>{
  const o=JSON.parse(localStorage.getItem('owner')||'null'); if(!o){ r.push('/owner/login'); return; } setOwner(o);
  const q=query(collection(db,'bookings'),where('hostelId','==',o.hostelId),where('adminFeePaid','==',true));
  const unsub=onSnapshot(q,s=>setList(s.docs.map(d=>({id:d.id,...d.data()}))));
  const checkoutQ=query(collection(db,'bookings'),where('hostelId','==',o.hostelId),where('status','==','checkout_requested'));
  const unsub2=onSnapshot(checkoutQ,s=>setCheckoutList(s.docs.map(d=>({id:d.id,...d.data()}))));
  getDoc(doc(db,'hostels_pending',o.hostelId)).then(ps=>{ if(ps.exists()&&ps.data().status==='pending'){ setLiveHostel(ps.data()); setPendingExists(true);} else { getDoc(doc(db,'hostels_live',o.hostelId)).then(ls=>{ if(ls.exists()) setLiveHostel(ls.data()); else setLiveHostel(staticHostels.find(h=>h.id===o.hostelId)); }); }});
  return ()=>{unsub();unsub2();};
 },[r]);

 const saveToPending=async(newData:any)=>{ newData.updatedAt=new Date().toISOString(); newData.status='pending'; newData.ownerId=owner.hostelId; newData.ownerName=owner.name; setLiveHostel(newData); await setDoc(doc(db,'hostels_pending',owner.hostelId),newData,{merge:true}); setPendingExists(true); };

 // === NEW: PICTURE UPLOAD ===
 const handlePhotoUpload = async (e:any) => {
   const files = Array.from(e.target.files) as File[];
   if(files.length === 0) return;
   if((liveHostel.photos?.length || 0) + files.length > 6) return alert("Max 6 photos - Delete some first");
   setUploading(true);
   const newPhotos: string[] = [];
   for(const file of files){
     if(file.size > 800*1024) { alert(`${file.name} too big - Max 800KB`); continue; }
     const base64 = await new Promise<string>((resolve)=>{
       const reader = new FileReader();
       reader.onload = () => resolve(reader.result as string);
       reader.readAsDataURL(file);
     });
     newPhotos.push(base64);
   }
   const updated = {...liveHostel, photos: [...(liveHostel.photos||[]),...newPhotos]};
   await saveToPending(updated);
   setUploading(false);
   alert(`${newPhotos.length} photo(s) added - Waiting admin approval then students will see`);
 };

 const deletePhoto = async (index:number) => {
   if(!confirm("Delete this photo?")) return;
   const updatedPhotos = liveHostel.photos.filter((_:any,i:number)=> i!==index);
   const updated = {...liveHostel, photos: updatedPhotos};
   await saveToPending(updated);
 };

 const confirmBooking=async(b:any)=>{ await updateDoc(doc(db,'bookings',b.id),{status:'confirmed'}); };
 const rejectBooking=async(b:any)=>{ await updateDoc(doc(db,'bookings',b.id),{status:'rejected_full'}); };
 const generateCode=async(b:any)=>{ const c='T'+Math.random().toString(36).substring(2,7).toUpperCase()+Math.floor(Math.random()*90+10); await updateDoc(doc(db,'bookings',b.id),{bookingCode:c,codeGeneratedAt:new Date().toISOString()}); alert(`Code ${c} - Send to student via WhatsApp`); };
 const verifyCode=async()=>{ const b=list.find((x:any)=>(x.bookingCode||'').toLowerCase()===code.trim().toLowerCase()); if(!b) return alert('Invalid code'); if(b.status!=='rent_paid') return alert('Rent not paid yet'); await updateDoc(doc(db,'bookings',b.id),{status:'moved_in',verifiedBy:owner.name,verifiedAt:new Date().toISOString()}); alert('✅ Verified! Student moved in'); setCode(''); };
 const changePassword=async()=>{ if(newPassword.length<4) return alert("Min 4 chars"); if(newPassword!==confirmPassword) return alert("No match"); await setDoc(doc(db,"owner_passwords",owner.hostelId),{ password:newPassword, phone:owner.phone, hostelId:owner.hostelId, updatedAt:new Date().toISOString() },{merge:true}); const updated={...owner,password:newPassword}; localStorage.setItem("owner",JSON.stringify(updated)); setOwner(updated); setNewPassword(''); setConfirmPassword(''); alert(`Password changed to ${newPassword}`); };
 const approveCheckout=async(b:any)=>{ if(!confirm(`Approve checkout for ${b.studentName}?`)) return; const damageFee=prompt("Any damage fee? Enter 0 if none:")||"0"; await updateDoc(doc(db,'bookings',b.id),{status:'checked_out',checkoutApprovedAt:new Date().toISOString(),damageFee:parseInt(damageFee),roomFreed:true}); alert(`✅ Approved! Room free now`); };
 const rejectCheckout=async(b:any)=>{ const reason=prompt("Reason?"); await updateDoc(doc(db,'bookings',b.id),{status:'moved_in',checkoutRejectedReason:reason}); };
 const logout=()=>{ if(confirm("Logout?")){ localStorage.removeItem("owner"); r.push("/owner/login"); } };

 if(!owner||!liveHostel) return <p>Loading...</p>;
 return <main style={{padding:20,maxWidth:1100,margin:'auto',fontFamily:"sans-serif"}}>
   <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}><h1>{owner.name} - {owner.hostelId}</h1><button onClick={logout} style={{background:"#c62828",color:"white",padding:"8px 12px",borderRadius:6,border:0}}>Logout</button></div>
   {pendingExists && <div style={{background:'#ffeb3b',padding:10,borderRadius:8}}>⏳ Pending approval - Photos + Contact + Price waiting for Admin 0206834470</div>}

   {/* === NEW PICTURE SECTION - ADD THIS === */}
   <div style={{background:'#fff',border:'2px solid #1a237e',padding:16,borderRadius:12,marginTop:12}}>
     <h3>📸 Hostel Pictures - Upload - Students Will See After Approval</h3>
     <p style={{fontSize:12,color:"#666"}}>Upload real hostel photos - Max 6 photos, each max 800KB - First photo = cover photo</p>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginTop:10}}>
       {liveHostel.photos?.map((p:any,i:number)=><div key={i} style={{position:"relative",border:"1px solid #ddd",borderRadius:8,overflow:"hidden"}}>
         <img src={p} alt={`hostel ${i}`} style={{width:"100%",height:120,objectFit:"cover"}} />
         <button onClick={()=>deletePhoto(i)} style={{position:"absolute",top:4,right:4,background:"red",color:"white",border:0,borderRadius:50,width:24,height:24,fontSize:12}}>X</button>
         <small style={{display:"block",padding:4,textAlign:"center"}}>{i===0?"Cover":"Photo "+(i+1)}</small>
       </div>)}
     </div>
     <div style={{marginTop:12,background:"#e3f2fd",padding:12,borderRadius:8}}>
       <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} disabled={uploading} style={{width:"100%"}} />
       <small style={{fontSize:11}}>{uploading?"Uploading... Wait":"Choose from phone gallery - Hold to select multiple - Will be approved by admin at 0206834470"}</small>
     </div>
   </div>

   <div style={{background:'#f3e5f5',border:'2px solid #7b1fa2',padding:16,borderRadius:12,marginTop:12}}><h3>🔐 Change Password Himself</h3><div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}><input type="password" placeholder="New Password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} style={{flex:1,minWidth:120,padding:10,border:"1px solid #ccc",borderRadius:6}}/><input type="password" placeholder="Confirm New" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} style={{flex:1,minWidth:120,padding:10,border:"1px solid #ccc",borderRadius:6}}/><button onClick={changePassword} style={{background:'#7b1fa2',color:'white',padding:10,borderRadius:6,border:0}}>Change</button></div></div>

   <div style={{background:'#e3f2fd',padding:16,borderRadius:12,marginTop:12}}><b>✅ Verify T-code - Move-In</b><div style={{display:'flex',gap:8,marginTop:8}}><input placeholder="TXXXX" value={code} onChange={e=>setCode(e.target.value)} style={{flex:1,padding:12,border:"1px solid #ccc",borderRadius:8}}/><button onClick={verifyCode} style={{background:'#1a237e',color:'white',padding:12,borderRadius:8,border:0}}>Verify</button></div></div>

   <div style={{background:'#fff9c4',border:'2px solid #ff9800',padding:16,borderRadius:12,marginTop:12}}><h3>📦 Checkout Requests ({checkoutList.length})</h3>{checkoutList.length===0&&<p style={{fontSize:12}}>No checkout requests</p>}{checkoutList.map((b:any)=><div key={b.id} style={{background:'white',padding:12,marginTop:8,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}><div><b>{b.studentName}</b> - {b.roomType}<br/><small>Reason: {b.checkoutReason}</small></div><div style={{display:"flex",gap:6}}><button onClick={()=>approveCheckout(b)} style={{background:'#2e7d32',color:'white',padding:"8px 12px",borderRadius:6,border:0}}>✅ Approve</button><button onClick={()=>rejectCheckout(b)} style={{background:'#c62828',color:'white',padding:"8px 12px",borderRadius:6,border:0}}>❌ Reject</button></div></div>)}</div>

   <h2 style={{marginTop:16}}>All Bookings - Total {list.length}</h2>
   {list.map((b:any)=><div key={b.id} style={{border:'1px solid #ddd',padding:12,borderRadius:10,marginTop:8,background:"white"}}><b>{b.studentName}</b> - {b.roomType} - <span style={{background:"#e3f2fd",padding:"2px 6px",borderRadius:6,fontSize:12}}>{b.status}</span> {b.bookingCode?`- Code ${b.bookingCode}`:''}<br/><small>{b.studentCourse} | {b.studentPhone} | Trans {b.momoTransactionId}</small><div style={{display:'flex',gap:8,marginTop:8,flexWrap:"wrap"}}>{b.status==='booked'&&<><button onClick={()=>confirmBooking(b)} style={{background:'#2e7d32',color:'white',padding:8,borderRadius:6,border:0}}>Confirm</button><button onClick={()=>rejectBooking(b)} style={{background:'#c62828',color:'white',padding:8,borderRadius:6,border:0}}>Reject</button></>}{b.status==='rent_paid'&&<button onClick={()=>generateCode(b)} style={{background:'#ff9800',color:'white',padding:8,borderRadius:6,border:0}}>Generate T-Code</button>}</div></div>)}

   <div style={{background:'#fff',border:'1px solid #ddd',padding:16,borderRadius:12,marginTop:20}}><h3>Edit Hostel - Needs Admin Approval</h3><label style={{fontSize:12,fontWeight:"bold"}}>MoMo Contact for Rent</label><input value={liveHostel.contact} onChange={e=>saveToPending({...liveHostel,contact:e.target.value})} style={{width:'100%',padding:12,border:'2px solid #1a237e',borderRadius:6,background:"#e3f2fd"}}/><label style={{display:"block",marginTop:10,fontSize:12}}>Hostel Name</label><input value={liveHostel.name} onChange={e=>saveToPending({...liveHostel,name:e.target.value})} style={{width:'100%',padding:10,border:"1px solid #ccc",borderRadius:6}}/><h4>Rooms & Prices</h4>{liveHostel.rooms?.map((rm:any,i:number)=><div key={i} style={{display:'flex',gap:8,marginTop:6}}><input value={rm.type} onChange={e=>{const r=[...liveHostel.rooms]; r[i].type=e.target.value; saveToPending({...liveHostel,rooms:r})}} style={{flex:1,padding:8,border:"1px solid #ccc",borderRadius:4}}/><input type="number" value={rm.price} onChange={e=>{const r=[...liveHostel.rooms]; r[i].price=parseInt(e.target.value)||0; saveToPending({...liveHostel,rooms:r})}} style={{width:100,padding:8,border:"1px solid #ccc",borderRadius:4}}/></div>)}</div>
 </main>
}