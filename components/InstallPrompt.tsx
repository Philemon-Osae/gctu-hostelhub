'use client';
import { useEffect, useState } from 'react';
export default function InstallPrompt(){
  const [deferredPrompt,setDeferredPrompt]=useState<any>(null);
  const [show,setShow]=useState(false);
  const [isIOS,setIsIOS]=useState(false);
  useEffect(()=>{
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIosDevice);
    const handler=(e:any)=>{ e.preventDefault(); setDeferredPrompt(e); setShow(true); };
    window.addEventListener('beforeinstallprompt',handler);
    setTimeout(()=>{ if(!deferredPrompt){ setShow(true); } },3000);
    return ()=>window.removeEventListener('beforeinstallprompt',handler);
  },[deferredPrompt]);
  const install=async()=>{
    if(deferredPrompt){ deferredPrompt.prompt(); const {outcome}=await deferredPrompt.userChoice; setDeferredPrompt(null); setShow(false); }
    else { alert('To install: Tap Share -> Add to Home Screen - GH icon will appear'); }
  };
  if(!show) return null;
  return <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#1a237e',color:'white',padding:14,display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:9999,borderTop:'3px solid #ffeb3b'}}>
    <div><b>📲 Install GCTU HostelHub App</b><br/><small>Fast, offline, MoMo 0206834470 - {isIOS? 'Tap Share -> Add to Home Screen' : 'Add GH icon to home screen'}</small></div>
    <div style={{display:'flex',gap:8}}><button onClick={install} style={{background:'#ffeb3b',color:'#1a237e',padding:'8px 14px',borderRadius:8,border:0,fontWeight:'bold'}}>{isIOS? 'How?' : 'Install'}</button><button onClick={()=>setShow(false)} style={{background:'transparent',color:'white',border:'1px solid white',padding:'8px 10px',borderRadius:8}}>X</button></div>
  </div>
}