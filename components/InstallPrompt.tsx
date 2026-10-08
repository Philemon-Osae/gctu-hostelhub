'use client';
import { useEffect, useState } from 'react';

export default function InstallPrompt(){
  const [deferredPrompt,setDeferredPrompt]=useState<any>(null);
  const [show,setShow]=useState(false);

  useEffect(()=>{
    const handler=(e:any)=>{
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt',handler);
    return ()=>window.removeEventListener('beforeinstallprompt',handler);
  },[]);

  const install=async()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    const {outcome}=await deferredPrompt.userChoice;
    if(outcome==='accepted') setShow(false);
    setDeferredPrompt(null);
  };

  if(!show) return null;

  return (
    <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#1a237e',color:'white',padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:9999}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span>📲</span>
        <div>
          <b>Install GCTU HostelHub</b><br/>
          <small>Fast & Offline - Add to home screen</small>
        </div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={install} style={{background:'#ffeb3b',color:'black',border:0,padding:'8px 14px',borderRadius:20,fontWeight:'bold'}}>Install</button>
        <button onClick={()=>setShow(false)} style={{background:'transparent',color:'white',border:'1px solid white',padding:'8px 10px',borderRadius:8}}>X</button>
      </div>
    </div>
  );
}