import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const SCHOOLS = [
  "American Senior High School","Barbara Goleman Senior High School","Booker T. Washington Senior High School","Coral Gables Senior High School","Coral Reef Senior High School","Cutler Bay Senior High School","Design & Architecture Senior High School (DASH)","Dr. Michael M. Krop Senior High School","Felix Varela Senior High School","G. Holmes Braddock Senior High School","Hialeah Gardens Senior High School","Hialeah Senior High School","Hialeah-Miami Lakes Senior High School","Homestead Senior High School","J.C. Bermudez Doral Senior High School","John A. Ferguson Senior High School","MAST Academy","Miami Beach Senior High School","Miami Carol City Senior High School","Miami Central Senior High School","Miami Coral Park Senior High School","Miami Edison Senior High School","Miami High School","Miami Jackson Senior High School","Miami Killian Senior High School","Miami Norland Senior High School","Miami Northwestern Senior High School","Miami Palmetto Senior High School","Miami Southridge Senior High School","Miami Springs Senior High School","Miami Sunset Senior High School","North Miami Beach Senior High School","North Miami Senior High School","Ronald W. Reagan / Doral Senior High School","South Dade Senior High School","South Miami Senior High School","Southwest Miami Senior High School","Westland Hialeah Senior High School","Young Men's Preparatory Academy",
  "Allapattah Middle School","Arvida Middle School","Brownsville Middle School","Citrus Grove Middle School","Coral Gables Preparatory Academy","Cutler Ridge Middle School","Drew Middle School","Earlington Heights Elementary / Middle","Fulford Middle School","George Washington Carver Middle School","Herbert A. Ammons Middle School","Highland Oaks Middle School","Holmes Middle School","Horace Mann Middle School","Jose De Diego Middle School","John F. Kennedy Middle School","Lake Stevens Middle School","Madison Middle School","Miami Edison Middle School","Nautilus Middle School","North Miami Middle School","Palm Springs Middle School","Parkway Middle School","Redland Middle School","Richmond Heights Middle School","Riviera Middle School","Rockway Middle School","Ruben Dario Middle School","Shenandoah Middle School","South Miami Middle School","Southwood Middle School","Toussaint L'Ouverture Elementary / Middle","Village Middle School","West Miami Middle School","Westview Middle School",
];
const INSTRUMENT_TYPES = ["Alto Saxophone","Tenor Saxophone","Baritone Saxophone","Soprano Saxophone","Bb Clarinet","Bass Clarinet","Oboe","Bassoon","Trumpet","French Horn","Trombone","Euphonium","Tuba","Flute","Piccolo","Snare Drum","Bass Drum","Marimba","Xylophone","Timpani","Violin","Viola","Cello","String Bass"];
const CONDITIONS = [
  { value:"excellent", label:"Excellent", color:"#10b981", icon:"✅", desc:"Plays perfectly, no issues" },
  { value:"good",      label:"Good",      color:"#3b82f6", icon:"👍", desc:"Minor cosmetic wear, plays fine" },
  { value:"fair",      label:"Fair",      color:"#f59e0b", icon:"⚠️", desc:"Needs minor repair, still playable" },
  { value:"poor",      label:"Poor",      color:"#ef4444", icon:"🔴", desc:"Major repair needed, barely playable" },
  { value:"unplayable",label:"Unplayable",color:"#9f1239", icon:"🚫", desc:"Broken, out of service" },
];
const REPAIR_CATEGORIES = ["Broken/missing pads","Stuck or broken key","Bent body/bell","Broken mouthpiece","Broken neck/crook","Stuck slide","Missing parts","Broken bow","Cracked body","Damaged case","Other"];
const TECH_ACTIONS = [
  { value:"repair",      label:"Schedule Repair",      color:"#f59e0b" },
  { value:"parts",       label:"Needs Parts Order",    color:"#3b82f6" },
  { value:"third_party", label:"Send to 3rd Party",    color:"#a855f7" },
  { value:"dispose",     label:"Dispose / Surplus",    color:"#ef4444" },
  { value:"reviewed",    label:"Reviewed — No Action", color:"#10b981" },
];
const REPAIR_COSTS = {
  "Alto Saxophone":{fair:120,poor:320,replace:550},"Tenor Saxophone":{fair:140,poor:380,replace:750},
  "Baritone Saxophone":{fair:180,poor:480,replace:1400},"Soprano Saxophone":{fair:110,poor:280,replace:500},
  "Bb Clarinet":{fair:75,poor:180,replace:280},"Bass Clarinet":{fair:95,poor:240,replace:520},
  "Oboe":{fair:130,poor:350,replace:900},"Bassoon":{fair:160,poor:420,replace:1800},
  "Trumpet":{fair:80,poor:200,replace:350},"French Horn":{fair:150,poor:400,replace:1200},
  "Trombone":{fair:90,poor:220,replace:400},"Euphonium":{fair:120,poor:300,replace:700},
  "Tuba":{fair:160,poor:420,replace:1400},"Flute":{fair:70,poor:160,replace:260},
  "Piccolo":{fair:65,poor:150,replace:300},"Snare Drum":{fair:50,poor:120,replace:200},
  "Bass Drum":{fair:60,poor:140,replace:280},"Marimba":{fair:200,poor:500,replace:2200},
  "Xylophone":{fair:150,poor:380,replace:1400},"Timpani":{fair:180,poor:450,replace:2000},
  "Violin":{fair:80,poor:200,replace:300},"Viola":{fair:85,poor:210,replace:350},
  "Cello":{fair:110,poor:280,replace:550},"String Bass":{fair:130,poor:320,replace:800},
};
const SCHOOL_ENROLLMENT = {
  "Miami Beach Senior High School":160,"Coral Gables Senior High School":220,
  "Southwest Miami Senior High School":195,"Hialeah Senior High School":210,
  "Miami Norland Senior High School":160,"North Miami Senior High School":175,
  "Homestead Senior High School":155,"Miami Palmetto Senior High School":200,
  "Miami Killian Senior High School":185,"MAST Academy":120,
  "Design & Architecture Senior High School (DASH)":130,"Young Men's Preparatory Academy":110,
};

// ─── URL routing helpers ──────────────────────────────────────────────────────
// Routes:
//   /           → QR hub / landing
//   /?view=form → Auditor submission form (optionally ?school=...)
//   /?view=tech → Repair tech portal (PIN-protected)
//   /?view=dashboard → District dashboard (PIN-protected)
//
// For pilot school QR: /?view=form&school=Miami+Edison+Senior+High+School

function getInitialView() {
  try {
    const p = new URLSearchParams(window.location.search);
    const v = p.get("view");
    if (["form","tech","dashboard"].includes(v)) return v;
  } catch (_) {}
  return "qr";
}
function getPrefillSchool() {
  try { return new URLSearchParams(window.location.search).get("school") || ""; }
  catch (_) { return ""; }
}
function buildUrl(view, school) {
  const base = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({ view });
  if (school) params.set("school", school);
  return `${base}?${params.toString()}`;
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function getRepairCost(instrument, condition) {
  const c = REPAIR_COSTS[instrument]||{fair:100,poor:250,replace:500};
  if(condition==="fair") return c.fair;
  if(condition==="poor") return c.poor;
  if(condition==="unplayable") return c.replace;
  return 0;
}
function getReplaceCost(instrument) { return (REPAIR_COSTS[instrument]||{replace:500}).replace; }
function fmtCurrency(n) {
  if(n>=1000000) return `$${(n/1000000).toFixed(1)}M`;
  if(n>=1000) return `$${(n/1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }

const F = "'DM Sans', sans-serif";
const labelStyle = {display:"block",color:"rgba(255,255,255,0.55)",fontSize:"0.72rem",fontWeight:700,marginBottom:"0.4rem",marginTop:"1rem",letterSpacing:"0.07em",textTransform:"uppercase"};
const fieldBase = {display:"block",width:"100%",borderRadius:"10px",padding:"0.72rem 0.9rem",fontSize:"0.88rem",outline:"none",boxSizing:"border-box",fontFamily:F,background:"#132030",color:"#e8f0ff",border:"1.5px solid rgba(255,255,255,0.1)",WebkitAppearance:"none",appearance:"none"};
const inputStyle = {...fieldBase,marginBottom:"0.1rem"};
const selectStyle = {...fieldBase,cursor:"pointer",marginBottom:"0.1rem",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23f59e0b' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 0.9rem center",paddingRight:"2.5rem"};
const btnStyle = (active,color="#f59e0b",textColor=null) => ({display:"block",width:"100%",marginTop:"1.25rem",background:active?color:"#1a2a3a",color:active?(textColor||(color==="#f59e0b"?"#000":"#fff")):"#445",border:"none",borderRadius:"12px",padding:"0.9rem",fontSize:"0.95rem",fontWeight:700,cursor:active?"pointer":"not-allowed",transition:"all 0.2s",fontFamily:F});

// ─── Supabase data loader ─────────────────────────────────────────────────────
async function loadData() {
  const {data:instruments,error:iErr} = await supabase.from("instruments").select("*");
  if(iErr||!instruments) return [];
  const {data:audits,error:aErr} = await supabase.from("audits").select("*").order("submitted_at",{ascending:false});
  if(aErr||!audits) return [];
  const byInstrument = {};
  for(const a of audits) {
    if(!byInstrument[a.instrument_id]) byInstrument[a.instrument_id]=[];
    byInstrument[a.instrument_id].push(a);
  }
  return instruments.map(inst => {
    const history = byInstrument[inst.id]||[];
    const latest = history[0]||null;
    return {
      instrumentId:inst.id, school:inst.school, instrumentType:inst.instrument_type,
      assetTag:inst.asset_tag, createdAt:inst.created_at, auditCount:history.length,
      auditHistory:history.map(a=>({
        auditId:a.id, condition:a.condition, repairIssues:a.repair_issues||[],
        notes:a.notes, submittedBy:a.submitted_by, submittedAt:a.submitted_at,
        photos:a.photos||[], techAction:a.tech_action, techNotes:a.tech_notes,
        actualCost:a.actual_cost, urgent:a.urgent,
      })),
      latestAuditId:latest?.id||null,
      condition:latest?.condition||null, repairIssues:latest?.repair_issues||[],
      notes:latest?.notes||"", submittedBy:latest?.submitted_by||"",
      submittedAt:latest?.submitted_at||inst.created_at, photos:latest?.photos||[],
      techAction:latest?.tech_action||null, techNotes:latest?.tech_notes||"",
      actualCost:latest?.actual_cost||null, urgent:latest?.urgent||false,
    };
  });
}

// ─── Photo helpers ────────────────────────────────────────────────────────────
function PhotoUploader({photos,onChange}) {
  const fileRef = useRef(null);
  function handleFiles(e) {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => onChange(p=>[...p,{url:ev.target.result,name:file.name}]);
      reader.readAsDataURL(file);
    });
    e.target.value="";
  }
  return (
    <div style={{marginTop:"0.25rem"}}>
      <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" style={{display:"none"}} onChange={handleFiles}/>
      <div onClick={()=>fileRef.current.click()} style={{border:"1.5px dashed rgba(245,158,11,0.35)",borderRadius:"12px",padding:"1rem",textAlign:"center",cursor:"pointer",background:"rgba(245,158,11,0.04)"}}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(245,158,11,0.09)"}
        onMouseLeave={e=>e.currentTarget.style.background="rgba(245,158,11,0.04)"}>
        <div style={{fontSize:"1.5rem",marginBottom:"0.25rem"}}>📷</div>
        <div style={{color:"#f59e0b",fontWeight:600,fontSize:"0.83rem"}}>Add photos</div>
        <div style={{color:"rgba(255,255,255,0.3)",fontSize:"0.7rem",marginTop:"0.1rem"}}>Camera or gallery · multiple ok</div>
      </div>
      {photos.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem",marginTop:"0.65rem"}}>
          {photos.map((p,i)=>(
            <div key={i} style={{position:"relative"}}>
              <img src={p.url} alt="" style={{width:"68px",height:"68px",objectFit:"cover",borderRadius:"8px",border:"1.5px solid rgba(255,255,255,0.1)"}}/>
              <div onClick={()=>onChange(prev=>prev.filter((_,idx)=>idx!==i))} style={{position:"absolute",top:"-5px",right:"-5px",width:"17px",height:"17px",background:"#ef4444",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:"9px",color:"white",fontWeight:800}}>×</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoViewer({photos,onClose}) {
  const [idx,setIdx] = useState(0);
  if(!photos||photos.length===0) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:9000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{position:"relative",maxWidth:"90vw",maxHeight:"80vh"}}>
        <img src={photos[idx].url} alt="" style={{maxWidth:"90vw",maxHeight:"75vh",objectFit:"contain",borderRadius:"12px",border:"1px solid rgba(255,255,255,0.1)"}}/>
        {photos.length>1&&(
          <>
            <button onClick={()=>setIdx(i=>(i-1+photos.length)%photos.length)} style={{position:"absolute",left:"-2.5rem",top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.1)",border:"none",color:"white",fontSize:"1.4rem",width:"2rem",height:"2rem",borderRadius:"50%",cursor:"pointer"}}>‹</button>
            <button onClick={()=>setIdx(i=>(i+1)%photos.length)} style={{position:"absolute",right:"-2.5rem",top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.1)",border:"none",color:"white",fontSize:"1.4rem",width:"2rem",height:"2rem",borderRadius:"50%",cursor:"pointer"}}>›</button>
          </>
        )}
        <div style={{textAlign:"center",color:"rgba(255,255,255,0.4)",fontSize:"0.72rem",marginTop:"0.5rem"}}>{idx+1} / {photos.length}</div>
      </div>
      <button onClick={onClose} style={{marginTop:"1.5rem",background:"rgba(255,255,255,0.08)",border:"none",color:"rgba(255,255,255,0.7)",borderRadius:"8px",padding:"0.5rem 1.5rem",cursor:"pointer",fontFamily:F,fontSize:"0.85rem"}}>✕ Close</button>
    </div>
  );
}

// ─── QR Code component ────────────────────────────────────────────────────────
function QRCodeBox({url, color="#0a1628", size=110}) {
  const ref = useRef(null);
  useEffect(()=>{
    if(!ref.current) return;
    ref.current.innerHTML = "";
    function tryGen() {
      if(window.QRCode) {
        new window.QRCode(ref.current,{text:url,width:size,height:size,colorDark:color,colorLight:"#ffffff",correctLevel:window.QRCode.CorrectLevel.M});
      } else { setTimeout(tryGen, 200); }
    }
    tryGen();
  },[url,color,size]);
  return <div ref={ref} style={{display:"flex",justifyContent:"center",alignItems:"center"}}/>;
}

// ─── QR Hub / Landing ─────────────────────────────────────────────────────────
// Shows all three QR codes with copy-link buttons.
// The pilot school QR links directly to the form pre-filled with Miami Edison.
function QRHub() {
  const [copied, setCopied] = useState(null);

  const formUrl       = buildUrl("form");
  const techUrl       = buildUrl("tech");
  const dashUrl       = buildUrl("dashboard");
  const edisonUrl     = buildUrl("form", "Miami Edison Senior High School");

  function copyLink(url, key) {
    navigator.clipboard.writeText(url).then(()=>{
      setCopied(key);
      setTimeout(()=>setCopied(null), 2000);
    });
  }

  const cards = [
    {
      key:"form", icon:"📋", label:"Auditor Form", sub:"For music teachers & staff submitting instrument audits",
      url:formUrl, color:"#f59e0b", textColor:"#000",
      action:()=>window.open(formUrl,"_self"),
    },
    {
      key:"edison", icon:"🎷", label:"Miami Edison Pilot", sub:"Pre-filled for Miami Edison Senior High School",
      url:edisonUrl, color:"#10b981", textColor:"#000",
      action:()=>window.open(edisonUrl,"_self"),
      badge:"PILOT",
    },
    {
      key:"tech", icon:"🔧", label:"Repair Tech Portal", sub:"PIN-protected · For certified repair technicians only",
      url:techUrl, color:"#a855f7", textColor:"#fff",
      action:()=>window.open(techUrl,"_self"),
    },
    {
      key:"dashboard", icon:"📊", label:"District Dashboard", sub:"PIN-protected · For MDCPS district administrators",
      url:dashUrl, color:"#3b82f6", textColor:"#fff",
      action:()=>window.open(dashUrl,"_self"),
    },
  ];

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#050e1c 0%,#0b1e35 100%)",fontFamily:F,color:"white",padding:"2rem 1.25rem",paddingBottom:"3rem"}}>
      <div style={{maxWidth:"480px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <div style={{fontSize:"2.5rem",marginBottom:"0.5rem"}}>🎷</div>
          <h1 style={{color:"#f59e0b",fontWeight:800,fontSize:"1.15rem",letterSpacing:"0.06em",margin:"0 0 0.3rem"}}>MDCPS INSTRUMENT AUDIT</h1>
          <p style={{color:"rgba(255,255,255,0.35)",fontSize:"0.75rem",margin:0}}>Miami-Dade County Public Schools · Access Hub</p>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          {cards.map(card=>(
            <div key={card.key} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${card.color}30`,borderRadius:"18px",padding:"1.25rem",position:"relative",overflow:"hidden"}}>
              {card.badge&&(
                <div style={{position:"absolute",top:"1rem",right:"1rem",background:`${card.color}25`,color:card.color,fontSize:"0.6rem",fontWeight:800,letterSpacing:"0.08em",padding:"0.2rem 0.55rem",borderRadius:"20px",border:`1px solid ${card.color}40`}}>{card.badge}</div>
              )}
              <div style={{display:"flex",alignItems:"flex-start",gap:"0.85rem",marginBottom:"1rem"}}>
                <span style={{fontSize:"1.5rem",flexShrink:0}}>{card.icon}</span>
                <div>
                  <div style={{fontWeight:800,fontSize:"0.9rem",marginBottom:"0.2rem"}}>{card.label}</div>
                  <div style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.4)",lineHeight:1.5}}>{card.sub}</div>
                </div>
              </div>

              {/* QR code */}
              <div style={{background:"white",borderRadius:"10px",padding:"0.75rem",display:"flex",justifyContent:"center",marginBottom:"0.85rem"}}>
                <QRCodeBox url={card.url} color={card.color==="#f59e0b"?"#78350f":card.color==="#10b981"?"#064e3b":card.color==="#a855f7"?"#4a0090":"#1e3a8a"} size={100}/>
              </div>

              {/* URL display + copy */}
              <div style={{background:"rgba(0,0,0,0.3)",borderRadius:"8px",padding:"0.5rem 0.75rem",marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:"0.5rem",overflow:"hidden"}}>
                <span style={{fontSize:"0.67rem",color:"rgba(255,255,255,0.3)",fontFamily:"monospace",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{card.url}</span>
                <button onClick={()=>copyLink(card.url,card.key)}
                  style={{flexShrink:0,background:"transparent",border:"none",color:copied===card.key?"#10b981":"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:"0.72rem",fontWeight:700,fontFamily:F,padding:"0.15rem 0.35rem",borderRadius:"4px",transition:"color 0.2s"}}>
                  {copied===card.key?"✓ Copied":"Copy"}
                </button>
              </div>

              <button onClick={card.action}
                style={{display:"block",width:"100%",background:card.color,color:card.textColor,border:"none",borderRadius:"10px",padding:"0.72rem",fontSize:"0.84rem",fontWeight:700,cursor:"pointer",fontFamily:F,transition:"opacity 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                Open →
              </button>
            </div>
          ))}
        </div>

        <div style={{marginTop:"2rem",background:"rgba(255,255,255,0.03)",borderRadius:"12px",padding:"1rem 1.1rem",border:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.07em",color:"rgba(255,255,255,0.3)",marginBottom:"0.6rem"}}>URL REFERENCE</div>
          {[
            {label:"Auditor Form",url:"?view=form"},
            {label:"Miami Edison Pilot",url:"?view=form&school=Miami+Edison+Senior+High+School"},
            {label:"Tech Portal",url:"?view=tech"},
            {label:"District Dashboard",url:"?view=dashboard"},
          ].map(r=>(
            <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.4rem"}}>
              <span style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.5)"}}>{r.label}</span>
              <span style={{fontSize:"0.67rem",fontFamily:"monospace",color:"rgba(255,255,255,0.3)"}}>{r.url}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PIN Gate (shared by Tech and Dashboard) ──────────────────────────────────
const TECH_PIN      = "2024";
const DASHBOARD_PIN = "2024"; // Change independently as needed

function PinGate({pinKey, pin, color, icon, title, subtitle, children}) {
  const storageKey = `pin_ok_${pinKey}`;
  const [unlocked, setUnlocked] = useState(()=>sessionStorage.getItem(storageKey)==="1");
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  function tryPin() {
    if(input === pin) {
      sessionStorage.setItem(storageKey, "1");
      setUnlocked(true);
    } else {
      setError(true);
      setInput("");
      setTimeout(()=>setError(false), 1500);
    }
  }

  if(unlocked) return children;
  return (
    <div style={{minHeight:"100vh",background:"#06101a",fontFamily:F,color:"white",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{maxWidth:"340px",width:"100%",padding:"2rem",textAlign:"center"}}>
        <div style={{fontSize:"2.5rem",marginBottom:"1rem"}}>{icon}</div>
        <div style={{fontWeight:800,color:color,fontSize:"1.1rem",marginBottom:"0.4rem"}}>{title}</div>
        <div style={{opacity:0.45,fontSize:"0.8rem",marginBottom:"2rem"}}>{subtitle}</div>
        <input type="password" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryPin()} placeholder="Enter PIN"
          style={{...inputStyle,textAlign:"center",letterSpacing:"0.5rem",fontSize:"1.4rem",borderColor:error?"#ef4444":undefined}}/>
        {error&&<div style={{color:"#ef4444",fontSize:"0.78rem",marginTop:"0.5rem"}}>Incorrect PIN</div>}
        <button onClick={tryPin} style={btnStyle(true, color, color==="#f59e0b"?"#000":"#fff")}>🔓 Unlock</button>
      </div>
    </div>
  );
}

// ─── Auditor Form (no nav, no cross-links) ────────────────────────────────────
function MobileForm({onSubmit, prefillSchool, existingTags}) {
  const [step,setStep]=useState(1);
  const [photos,setPhotos]=useState([]);
  const [form,setForm]=useState({school:prefillSchool||"",instrumentType:"",assetTag:"",condition:"",repairIssues:[],notes:"",submittedBy:""});
  const [submitted,setSubmitted]=useState(false);
  const [submitting,setSubmitting]=useState(false);

  const needsRepair=["fair","poor","unplayable"].includes(form.condition);
  const normTag=form.assetTag.trim().toLowerCase();
  const isExisting=normTag.length>0&&existingTags.includes(normTag);
  const canNext1=form.school&&form.instrumentType&&form.assetTag.trim();
  const canNext2=form.condition;
  const canSubmit=!!form.submittedBy;

  function toggleIssue(issue){setForm(f=>({...f,repairIssues:f.repairIssues.includes(issue)?f.repairIssues.filter(x=>x!==issue):[...f.repairIssues,issue]}));}

  async function doSubmit(){
    setSubmitting(true);
    await onSubmit({...form,photos,submittedAt:new Date().toISOString(),urgent:form.condition==="unplayable"});
    setSubmitted(true);setSubmitting(false);
  }

  function reset(){setSubmitted(false);setStep(1);setPhotos([]);setForm({school:prefillSchool||"",instrumentType:"",assetTag:"",condition:"",repairIssues:[],notes:"",submittedBy:""});}

  if(submitted) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#050e1c 0%,#0b1e35 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,padding:"2rem"}}>
      <div style={{textAlign:"center",color:"white"}}>
        <div style={{width:"76px",height:"76px",background:"rgba(16,185,129,0.12)",border:"2px solid #10b981",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.25rem",fontSize:"2rem"}}>✓</div>
        <h2 style={{fontSize:"1.4rem",fontWeight:800,margin:"0 0 0.5rem"}}>Submitted!</h2>
        <p style={{opacity:0.5,marginBottom:"0.5rem",fontSize:"0.88rem"}}>Audit recorded for {form.school}.</p>
        {isExisting&&<p style={{color:"#f59e0b",fontSize:"0.8rem",marginBottom:"1.5rem"}}>📋 New audit added to existing instrument record.</p>}
        <button onClick={reset} style={{background:"#f59e0b",color:"#000",border:"none",borderRadius:"12px",padding:"0.85rem 2rem",fontSize:"0.95rem",fontWeight:700,cursor:"pointer",fontFamily:F}}>Audit Another</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#050e1c 0%,#0b1e35 100%)",fontFamily:F,paddingBottom:"5rem"}}>
      <div style={{padding:"1.25rem 1.25rem 0",textAlign:"center"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",marginBottom:"0.2rem"}}>
          <span style={{fontSize:"1.25rem"}}>🎷</span>
          <span style={{color:"#f59e0b",fontWeight:800,fontSize:"0.9rem",letterSpacing:"0.06em"}}>MDCPS INSTRUMENT AUDIT</span>
        </div>
        {prefillSchool&&(
          <div style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:"20px",padding:"0.25rem 0.75rem",marginBottom:"0.5rem"}}>
            <span style={{fontSize:"0.65rem",color:"#10b981",fontWeight:700,letterSpacing:"0.05em"}}>📍 {prefillSchool}</span>
          </div>
        )}
        <p style={{color:"rgba(255,255,255,0.35)",fontSize:"0.72rem",margin:"0 0 1.25rem"}}>Miami-Dade County Public Schools</p>
        <div style={{display:"flex",gap:"6px",marginBottom:"1.5rem"}}>
          {["Instrument","Condition","Submit"].map((lbl,i)=>(
            <div key={i} style={{flex:1}}>
              <div style={{height:"3px",borderRadius:"2px",marginBottom:"4px",background:i<step?"#f59e0b":"rgba(255,255,255,0.08)",transition:"background 0.3s"}}/>
              <span style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.05em",color:i<step?"#f59e0b":"rgba(255,255,255,0.2)"}}>{lbl.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"0 1.25rem"}}>
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:"18px",padding:"1.4rem",border:"1px solid rgba(255,255,255,0.07)"}}>
          {step===1&&(
            <div>
              <h3 style={{color:"white",fontSize:"1rem",fontWeight:700,margin:"0 0 1.1rem"}}>📋 Instrument Info</h3>
              <label style={labelStyle}>School</label>
              <select value={form.school} onChange={e=>setForm(f=>({...f,school:e.target.value}))} style={selectStyle}>
                <option value="" style={{background:"#132030"}}>Select school...</option>
                {SCHOOLS.map(s=><option key={s} value={s} style={{background:"#132030",color:"#e8f0ff"}}>{s}</option>)}
              </select>
              {prefillSchool&&form.school===prefillSchool&&(
                <div style={{fontSize:"0.7rem",color:"#10b981",marginTop:"0.3rem"}}>✓ Pre-filled from your school QR code</div>
              )}
              <label style={labelStyle}>Instrument Type</label>
              <select value={form.instrumentType} onChange={e=>setForm(f=>({...f,instrumentType:e.target.value}))} style={selectStyle}>
                <option value="" style={{background:"#132030"}}>Select instrument...</option>
                {INSTRUMENT_TYPES.map(t=><option key={t} value={t} style={{background:"#132030",color:"#e8f0ff"}}>{t}</option>)}
              </select>
              <label style={labelStyle}>Asset Tag / Serial #</label>
              <input value={form.assetTag} onChange={e=>setForm(f=>({...f,assetTag:e.target.value}))} placeholder="e.g. MDC-01-0042" style={inputStyle}/>
              {isExisting&&<div style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:"8px",padding:"0.55rem 0.75rem",marginTop:"0.35rem",fontSize:"0.75rem",color:"#fcd34d"}}>📋 Already in system — new audit will be added to history.</div>}
              <button disabled={!canNext1} onClick={()=>setStep(2)} style={btnStyle(!!canNext1)}>Next: Condition →</button>
            </div>
          )}
          {step===2&&(
            <div>
              <h3 style={{color:"white",fontSize:"1rem",fontWeight:700,margin:"0 0 1.1rem"}}>🔍 Condition</h3>
              <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",marginBottom:"1.1rem"}}>
                {CONDITIONS.map(c=>(
                  <div key={c.value} onClick={()=>setForm(f=>({...f,condition:c.value,repairIssues:[]}))}
                    style={{border:`2px solid ${form.condition===c.value?c.color:"rgba(255,255,255,0.07)"}`,borderRadius:"12px",padding:"0.75rem 1rem",cursor:"pointer",background:form.condition===c.value?`${c.color}15`:"rgba(255,255,255,0.02)",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all 0.15s"}}>
                    <div>
                      <div style={{color:"white",fontWeight:600,fontSize:"0.86rem"}}>{c.icon} {c.label}</div>
                      <div style={{color:"rgba(255,255,255,0.35)",fontSize:"0.7rem",marginTop:"0.08rem"}}>{c.desc}</div>
                    </div>
                    <div style={{width:"16px",height:"16px",borderRadius:"50%",flexShrink:0,border:`2px solid ${form.condition===c.value?c.color:"rgba(255,255,255,0.15)"}`,background:form.condition===c.value?c.color:"transparent"}}/>
                  </div>
                ))}
              </div>
              {needsRepair&&(
                <>
                  <label style={labelStyle}>Repair Issues</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem",marginBottom:"1rem"}}>
                    {REPAIR_CATEGORIES.map(issue=>{
                      const active=form.repairIssues.includes(issue);
                      return <div key={issue} onClick={()=>toggleIssue(issue)} style={{padding:"0.35rem 0.65rem",borderRadius:"20px",fontSize:"0.75rem",cursor:"pointer",border:`1px solid ${active?"#f59e0b":"rgba(255,255,255,0.12)"}`,background:active?"rgba(245,158,11,0.14)":"rgba(255,255,255,0.02)",color:active?"#f59e0b":"rgba(255,255,255,0.55)",fontWeight:active?600:400,transition:"all 0.12s"}}>{issue}</div>;
                    })}
                  </div>
                </>
              )}
              <label style={labelStyle}>Photos</label>
              <PhotoUploader photos={photos} onChange={setPhotos}/>
              <div style={{display:"flex",gap:"0.65rem"}}>
                <button onClick={()=>setStep(1)} style={{...btnStyle(true),background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)",flex:1}}>← Back</button>
                <button disabled={!canNext2} onClick={()=>setStep(3)} style={{...btnStyle(!!canNext2),flex:2}}>Next →</button>
              </div>
            </div>
          )}
          {step===3&&(
            <div>
              <h3 style={{color:"white",fontSize:"1rem",fontWeight:700,margin:"0 0 1.1rem"}}>✍️ Confirm & Submit</h3>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Any additional details..." rows={3} style={{...inputStyle,resize:"none"}}/>
              <label style={labelStyle}>Your Name</label>
              <input value={form.submittedBy} onChange={e=>setForm(f=>({...f,submittedBy:e.target.value}))} placeholder="e.g. Mr. Johnson" style={inputStyle}/>
              <div style={{background:"rgba(0,0,0,0.25)",borderRadius:"12px",padding:"0.9rem",margin:"1.1rem 0",fontSize:"0.82rem",lineHeight:1.9}}>
                <span style={{color:"rgba(255,255,255,0.4)"}}>Instrument: </span><span style={{color:"white",fontWeight:600}}>{form.instrumentType}</span><br/>
                <span style={{color:"rgba(255,255,255,0.4)"}}>School: </span><span style={{color:"white"}}>{form.school}</span><br/>
                <span style={{color:"rgba(255,255,255,0.4)"}}>Tag: </span><span style={{color:"#f59e0b",fontFamily:"monospace"}}>{form.assetTag}</span><br/>
                <span style={{color:"rgba(255,255,255,0.4)"}}>Condition: </span>
                <span style={{color:CONDITIONS.find(c=>c.value===form.condition)?.color,fontWeight:700}}>{CONDITIONS.find(c=>c.value===form.condition)?.label}</span>
                {photos.length>0&&<><br/><span style={{color:"rgba(255,255,255,0.4)"}}>Photos: </span><span style={{color:"#10b981"}}>{photos.length} attached</span></>}
              </div>
              <div style={{display:"flex",gap:"0.65rem"}}>
                <button onClick={()=>setStep(2)} style={{...btnStyle(true),background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)",flex:1}}>← Back</button>
                <button disabled={!canSubmit||submitting} onClick={doSubmit} style={{...btnStyle(canSubmit&&!submitting,"#10b981"),flex:2}}>{submitting?"Saving…":"✓ Submit"}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tech Portal ──────────────────────────────────────────────────────────────
function TechPortalInner({instruments,onUpdateTech}) {
  const [filterAction,setFilterAction]=useState("all");
  const [selected,setSelected]=useState(null);
  const [techForm,setTechForm]=useState({action:"",notes:"",actualCost:""});
  const [editMode,setEditMode]=useState(false);
  const [editForm,setEditForm]=useState({});
  const [editPhotos,setEditPhotos]=useState([]);
  const [viewerPhotos,setViewerPhotos]=useState(null);
  const [saving,setSaving]=useState(false);

  const queue=instruments
    .filter(s=>["fair","poor","unplayable"].includes(s.condition))
    .filter(s=>{
      if(filterAction==="all") return true;
      if(filterAction==="pending") return !s.techAction;
      return s.techAction===filterAction;
    });

  const pending=instruments.filter(s=>["fair","poor","unplayable"].includes(s.condition)&&!s.techAction).length;
  const disposed=instruments.filter(s=>s.techAction==="dispose").length;
  const thirdParty=instruments.filter(s=>s.techAction==="third_party").length;
  const repairSched=instruments.filter(s=>s.techAction==="repair").length;
  const confirmedTotal=instruments.reduce((sum,s)=>sum+(s.actualCost||0),0);
  const confirmedCount=instruments.filter(s=>s.actualCost>0).length;

  function openItem(item){setSelected(item);setTechForm({action:item.techAction||"",notes:item.techNotes||"",actualCost:item.actualCost?String(item.actualCost):""});setEditMode(false);}
  function startEdit(item){setEditForm({condition:item.condition,repairIssues:item.repairIssues||[],notes:item.notes||"",submittedBy:item.submittedBy||""});setEditPhotos(item.photos||[]);setEditMode(true);}

  async function saveEdit(){
    if(!selected) return;setSaving(true);
    await onUpdateTech(selected.instrumentId,selected.latestAuditId,{condition:editForm.condition,repairIssues:editForm.repairIssues,notes:editForm.notes,submittedBy:editForm.submittedBy,photos:editPhotos,techAction:techForm.action||selected.techAction,techNotes:techForm.notes||selected.techNotes,actualCost:selected.actualCost});
    setSaving(false);setSelected(null);setEditMode(false);
  }

  async function saveTech(){
    if(!selected) return;setSaving(true);
    const parsed=parseFloat(techForm.actualCost);
    await onUpdateTech(selected.instrumentId,selected.latestAuditId,{condition:selected.condition,repairIssues:selected.repairIssues,notes:selected.notes,submittedBy:selected.submittedBy,photos:selected.photos,techAction:techForm.action,techNotes:techForm.notes,actualCost:!isNaN(parsed)&&parsed>0?parsed:null});
    setSaving(false);setSelected(null);
  }

  function toggleEditIssue(issue){setEditForm(f=>({...f,repairIssues:f.repairIssues.includes(issue)?f.repairIssues.filter(x=>x!==issue):[...f.repairIssues,issue]}));}

  return (
    <div style={{minHeight:"100vh",background:"#06101a",fontFamily:F,color:"white"}}>
      {viewerPhotos&&<PhotoViewer photos={viewerPhotos} onClose={()=>setViewerPhotos(null)}/>}
      <div style={{background:"linear-gradient(90deg,#0c1a2e,#14243d)",borderBottom:"1px solid rgba(168,85,247,0.2)",padding:"1rem 1.5rem",display:"flex",alignItems:"center",gap:"0.75rem"}}>
        <span style={{fontSize:"1.4rem"}}>🔧</span>
        <div>
          <div style={{fontWeight:800,color:"#a855f7",fontSize:"1rem",letterSpacing:"0.04em"}}>REPAIR TECH PORTAL</div>
          <div style={{fontSize:"0.68rem",opacity:0.4}}>MDCPS · Instruments Requiring Attention</div>
        </div>
      </div>
      <div style={{padding:"1.25rem 1.5rem",maxWidth:"900px",margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"0.65rem",marginBottom:"1.25rem"}}>
          {[{label:"Awaiting Review",value:pending,color:"#f59e0b"},{label:"Repair Scheduled",value:repairSched,color:"#3b82f6"},{label:"3rd Party",value:thirdParty,color:"#a855f7"},{label:"Flag Disposal",value:disposed,color:"#ef4444"},{label:"Confirmed Costs",value:fmtCurrency(confirmedTotal),color:"#10b981",sub:`${confirmedCount} quoted`}].map(s=>(
            <div key={s.label} style={{background:"rgba(255,255,255,0.04)",borderRadius:"12px",padding:"0.85rem",border:`1px solid ${s.color}30`,textAlign:"center"}}>
              <div style={{fontSize:s.label==="Confirmed Costs"?"1.2rem":"1.6rem",fontWeight:800,color:s.color}}>{s.value}</div>
              <div style={{fontSize:"0.68rem",opacity:0.55,marginTop:"0.1rem"}}>{s.label}</div>
              {s.sub&&<div style={{fontSize:"0.62rem",color:s.color,opacity:0.7,marginTop:"0.1rem"}}>{s.sub}</div>}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:"0.4rem",marginBottom:"1rem",flexWrap:"wrap"}}>
          {[{value:"all",label:"All",color:"#fff"},{value:"pending",label:"⏳ Pending",color:"#f59e0b"},...TECH_ACTIONS].map(a=>(
            <button key={a.value} onClick={()=>setFilterAction(a.value)} style={{padding:"0.38rem 0.8rem",borderRadius:"20px",fontSize:"0.73rem",fontWeight:600,cursor:"pointer",border:`1px solid ${filterAction===a.value?a.color:"rgba(255,255,255,0.08)"}`,background:filterAction===a.value?`${a.color}20`:"transparent",color:filterAction===a.value?a.color:"rgba(255,255,255,0.4)",fontFamily:F,transition:"all 0.15s"}}>{a.label}</button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"0.55rem"}}>
          {queue.length===0&&<div style={{padding:"3rem",textAlign:"center",opacity:0.25,fontSize:"0.88rem"}}>No instruments match this filter</div>}
          {queue.map(item=>{
            const cond=CONDITIONS.find(c=>c.value===item.condition);
            const action=TECH_ACTIONS.find(a=>a.value===item.techAction);
            return (
              <div key={item.instrumentId} onClick={()=>openItem(item)}
                style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderLeft:`3px solid ${cond?.color}`,borderRadius:"12px",padding:"0.9rem 1.1rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"1rem",transition:"background 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
                onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:"0.88rem",marginBottom:"0.15rem"}}>
                    {item.instrumentType}
                    {item.urgent&&<span style={{marginLeft:"0.5rem",background:"#ef444420",color:"#ef4444",padding:"0.12rem 0.4rem",borderRadius:"4px",fontSize:"0.62rem",fontWeight:800}}>URGENT</span>}
                    {item.auditCount>1&&<span style={{marginLeft:"0.5rem",background:"rgba(59,130,246,0.15)",color:"#60a5fa",padding:"0.12rem 0.4rem",borderRadius:"4px",fontSize:"0.62rem",fontWeight:600}}>{item.auditCount} audits</span>}
                  </div>
                  <div style={{fontSize:"0.72rem",opacity:0.45}}>{item.school} · <span style={{fontFamily:"monospace",color:"#f59e0b"}}>{item.assetTag}</span></div>
                  {item.repairIssues?.length>0&&<div style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.3)",marginTop:"0.15rem"}}>{item.repairIssues.join(", ")}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.35rem",flexShrink:0}}>
                  <span style={{background:`${cond?.color}20`,color:cond?.color,padding:"0.18rem 0.5rem",borderRadius:"20px",fontSize:"0.7rem",fontWeight:600}}>{cond?.label}</span>
                  {action&&<span style={{background:`${action.color}20`,color:action.color,padding:"0.18rem 0.5rem",borderRadius:"20px",fontSize:"0.66rem",fontWeight:600}}>{action.label}</span>}
                  {!action&&<span style={{opacity:0.25,fontSize:"0.66rem"}}>Pending review</span>}
                  {item.actualCost>0&&<span style={{fontSize:"0.66rem",color:"#10b981",fontWeight:700}}>✓ ${item.actualCost.toLocaleString()}</span>}
                  {item.photos?.length>0&&<span style={{fontSize:"0.66rem",opacity:0.35}}>📷 {item.photos.length}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:2000,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
          onClick={e=>{if(e.target===e.currentTarget){setSelected(null);setEditMode(false);}}}>
          <div style={{background:"#0e1e33",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:"640px",padding:"1.5rem",maxHeight:"90vh",overflowY:"auto",border:"1px solid rgba(255,255,255,0.08)",borderBottom:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem"}}>
              <div>
                <div style={{fontWeight:800,fontSize:"1.05rem"}}>{selected.instrumentType}</div>
                <div style={{fontSize:"0.72rem",opacity:0.45,marginTop:"0.1rem"}}>{selected.school}</div>
                <div style={{fontFamily:"monospace",color:"#f59e0b",fontSize:"0.8rem"}}>{selected.assetTag}</div>
                {selected.auditCount>1&&<div style={{fontSize:"0.68rem",color:"#60a5fa",marginTop:"0.2rem"}}>📋 {selected.auditCount} audits on record</div>}
              </div>
              <div style={{display:"flex",gap:"0.5rem"}}>
                <button onClick={()=>startEdit(selected)} style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",color:"#f59e0b",borderRadius:"8px",padding:"0.35rem 0.7rem",cursor:"pointer",fontFamily:F,fontSize:"0.75rem",fontWeight:600}}>✏️ Edit</button>
                <button onClick={()=>{setSelected(null);setEditMode(false);}} style={{background:"rgba(255,255,255,0.07)",border:"none",color:"rgba(255,255,255,0.7)",borderRadius:"8px",padding:"0.35rem 0.7rem",cursor:"pointer",fontFamily:F,fontSize:"0.85rem"}}>✕</button>
              </div>
            </div>

            {selected.photos?.length>0&&(
              <div style={{marginBottom:"1rem"}}>
                <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.07em",color:"rgba(255,255,255,0.35)",marginBottom:"0.5rem"}}>PHOTOS</div>
                <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                  {selected.photos.map((p,i)=>(
                    <img key={i} src={p.url} alt="" onClick={()=>setViewerPhotos(selected.photos)}
                      style={{width:"72px",height:"72px",objectFit:"cover",borderRadius:"8px",border:"1.5px solid rgba(255,255,255,0.1)",cursor:"pointer"}}/>
                  ))}
                </div>
              </div>
            )}

            {selected.auditCount>1&&(
              <div style={{marginBottom:"1rem",background:"rgba(59,130,246,0.05)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:"12px",padding:"0.85rem"}}>
                <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.07em",color:"#60a5fa",marginBottom:"0.6rem"}}>AUDIT HISTORY</div>
                {selected.auditHistory.map((a,i)=>{
                  const c=CONDITIONS.find(x=>x.value===a.condition);
                  return (
                    <div key={a.auditId} style={{display:"flex",alignItems:"center",gap:"0.65rem",paddingBottom:"0.5rem",marginBottom:"0.5rem",borderBottom:i<selected.auditHistory.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                      <div style={{width:"8px",height:"8px",borderRadius:"50%",background:c?.color,flexShrink:0}}/>
                      <div style={{flex:1,fontSize:"0.75rem"}}>
                        <span style={{color:c?.color,fontWeight:600}}>{c?.label}</span>
                        {a.repairIssues?.length>0&&<span style={{color:"rgba(255,255,255,0.35)",marginLeft:"0.4rem"}}>· {a.repairIssues.join(", ")}</span>}
                        {a.photos?.length>0&&<span onClick={()=>setViewerPhotos(a.photos)} style={{color:"#60a5fa",marginLeft:"0.5rem",cursor:"pointer",fontSize:"0.68rem"}}>📷 {a.photos.length}</span>}
                      </div>
                      <div style={{fontSize:"0.68rem",opacity:0.35}}>{new Date(a.submittedAt).toLocaleDateString()} · {a.submittedBy}</div>
                      {i===0&&<span style={{fontSize:"0.6rem",background:"rgba(245,158,11,0.15)",color:"#f59e0b",padding:"0.1rem 0.35rem",borderRadius:"4px",fontWeight:700}}>LATEST</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {editMode?(
              <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:"1rem"}}>
                <div style={{fontSize:"0.7rem",fontWeight:800,letterSpacing:"0.07em",color:"#f59e0b",marginBottom:"0.75rem"}}>EDIT LATEST AUDIT</div>
                <label style={labelStyle}>Condition</label>
                <div style={{display:"flex",flexDirection:"column",gap:"0.4rem",marginBottom:"0.8rem"}}>
                  {CONDITIONS.map(c=>(
                    <div key={c.value} onClick={()=>setEditForm(f=>({...f,condition:c.value}))}
                      style={{border:`2px solid ${editForm.condition===c.value?c.color:"rgba(255,255,255,0.07)"}`,borderRadius:"10px",padding:"0.6rem 0.85rem",cursor:"pointer",background:editForm.condition===c.value?`${c.color}15`:"transparent",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{color:"white",fontSize:"0.83rem"}}>{c.icon} {c.label}</span>
                      <div style={{width:"13px",height:"13px",borderRadius:"50%",border:`2px solid ${editForm.condition===c.value?c.color:"rgba(255,255,255,0.15)"}`,background:editForm.condition===c.value?c.color:"transparent"}}/>
                    </div>
                  ))}
                </div>
                <label style={labelStyle}>Repair Issues</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem",marginBottom:"0.8rem"}}>
                  {REPAIR_CATEGORIES.map(issue=>{
                    const active=editForm.repairIssues?.includes(issue);
                    return <div key={issue} onClick={()=>toggleEditIssue(issue)} style={{padding:"0.3rem 0.6rem",borderRadius:"20px",fontSize:"0.73rem",cursor:"pointer",border:`1px solid ${active?"#f59e0b":"rgba(255,255,255,0.12)"}`,background:active?"rgba(245,158,11,0.14)":"rgba(255,255,255,0.02)",color:active?"#f59e0b":"rgba(255,255,255,0.55)",fontWeight:active?600:400}}>{issue}</div>;
                  })}
                </div>
                <label style={labelStyle}>Notes</label>
                <textarea value={editForm.notes} onChange={e=>setEditForm(f=>({...f,notes:e.target.value}))} rows={2} style={{...inputStyle,resize:"none"}}/>
                <label style={labelStyle}>Submitted By</label>
                <input value={editForm.submittedBy} onChange={e=>setEditForm(f=>({...f,submittedBy:e.target.value}))} style={inputStyle}/>
                <label style={labelStyle}>Photos</label>
                <PhotoUploader photos={editPhotos} onChange={setEditPhotos}/>
                <div style={{display:"flex",gap:"0.65rem"}}>
                  <button onClick={()=>setEditMode(false)} style={{...btnStyle(true),background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)",flex:1}}>Cancel</button>
                  <button onClick={saveEdit} disabled={saving} style={{...btnStyle(!saving,"#f59e0b"),flex:2}}>{saving?"Saving…":"💾 Save Changes"}</button>
                </div>
              </div>
            ):(
              <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:"1.1rem"}}>
                {selected.repairIssues?.length>0&&(
                  <div style={{marginBottom:"1rem"}}>
                    <div style={labelStyle}>Reported Issues</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem",marginTop:"0.4rem"}}>
                      {selected.repairIssues.map(i=><span key={i} style={{background:"rgba(239,68,68,0.12)",color:"#fca5a5",padding:"0.22rem 0.55rem",borderRadius:"20px",fontSize:"0.73rem"}}>{i}</span>)}
                    </div>
                  </div>
                )}
                {selected.notes&&<div style={{background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"0.75rem",marginBottom:"1rem",fontSize:"0.8rem",color:"rgba(255,255,255,0.6)"}}>"{selected.notes}"</div>}
                <div style={{fontSize:"0.7rem",fontWeight:800,letterSpacing:"0.07em",color:"#a855f7",marginBottom:"0.75rem"}}>TECH DECISION</div>
                <div style={{display:"flex",flexDirection:"column",gap:"0.45rem",marginBottom:"0.9rem"}}>
                  {TECH_ACTIONS.map(a=>(
                    <div key={a.value} onClick={()=>setTechForm(f=>({...f,action:a.value}))}
                      style={{border:`2px solid ${techForm.action===a.value?a.color:"rgba(255,255,255,0.07)"}`,borderRadius:"10px",padding:"0.65rem 1rem",cursor:"pointer",background:techForm.action===a.value?`${a.color}12`:"transparent",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.12s"}}>
                      <span style={{color:techForm.action===a.value?a.color:"rgba(255,255,255,0.65)",fontWeight:techForm.action===a.value?700:400,fontSize:"0.84rem"}}>{a.label}</span>
                      <div style={{width:"13px",height:"13px",borderRadius:"50%",border:`2px solid ${techForm.action===a.value?a.color:"rgba(255,255,255,0.15)"}`,background:techForm.action===a.value?a.color:"transparent",flexShrink:0}}/>
                    </div>
                  ))}
                </div>
                {["repair","parts","third_party"].includes(techForm.action)&&(
                  <div style={{background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:"10px",padding:"0.75rem 1rem",marginBottom:"0.75rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:"0.65rem",color:"#f59e0b",fontWeight:700,letterSpacing:"0.05em",marginBottom:"0.2rem"}}>SYSTEM ESTIMATE</div>
                      <div style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.5)"}}>Based on instrument type & condition</div>
                    </div>
                    <div style={{fontSize:"1.1rem",fontWeight:800,color:"#f59e0b"}}>${getRepairCost(selected.instrumentType,selected.condition).toLocaleString()}</div>
                  </div>
                )}
                {["repair","parts","third_party"].includes(techForm.action)&&(
                  <>
                    <label style={labelStyle}>Actual Quote / Cost ($)</label>
                    <div style={{position:"relative"}}>
                      <span style={{position:"absolute",left:"0.9rem",top:"50%",transform:"translateY(-50%)",color:"#f59e0b",fontWeight:700,fontSize:"0.9rem",pointerEvents:"none"}}>$</span>
                      <input type="number" min="0" value={techForm.actualCost} onChange={e=>setTechForm(f=>({...f,actualCost:e.target.value}))} placeholder="Enter vendor quote..." style={{...inputStyle,paddingLeft:"1.75rem"}}/>
                    </div>
                    {techForm.actualCost&&!isNaN(parseFloat(techForm.actualCost))&&<div style={{fontSize:"0.7rem",color:"#10b981",marginTop:"0.3rem",marginBottom:"0.25rem"}}>✓ Replaces system estimate in dashboard totals</div>}
                  </>
                )}
                <label style={labelStyle}>Tech Notes</label>
                <textarea value={techForm.notes} onChange={e=>setTechForm(f=>({...f,notes:e.target.value}))} placeholder="Vendor name, parts needed, reason for disposal..." rows={3} style={{...inputStyle,resize:"none"}}/>
                <button disabled={!techForm.action||saving} onClick={saveTech} style={btnStyle(!!techForm.action&&!saving,"#a855f7")}>{saving?"Saving…":"💾 Save Decision"}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({instruments}) {
  const [tab,setTab]=useState("overview");
  const [filterSchool,setFilterSchool]=useState("All Schools");
  const [filterCond,setFilterCond]=useState("all");
  const [sortBy,setSortBy]=useState("recent");
  const [search,setSearch]=useState("");
  const [exportOpen,setExportOpen]=useState(false);
  const [exporting,setExporting]=useState(null);

  function condLabel(val){return CONDITIONS.find(c=>c.value===val)?.label||val;}
  function techLabel(val){return val?(TECH_ACTIONS.find(a=>a.value===val)?.label||val):"Pending Review";}
  function withXLSX(fn){if(window.XLSX){fn();return;}const iv=setInterval(()=>{if(window.XLSX){clearInterval(iv);fn();}},100);setTimeout(()=>clearInterval(iv),5000);}

  const total=instruments.length;
  const needRepair=instruments.filter(s=>["fair","poor","unplayable"].includes(s.condition)).length;
  const unplayable=instruments.filter(s=>s.condition==="unplayable").length;
  const repairRate=total?Math.round((needRepair/total)*100):0;
  const totalRepairCost=instruments.reduce((sum,s)=>{if(s.actualCost>0)return sum+s.actualCost;return sum+getRepairCost(s.instrumentType,s.condition);},0);
  const quotedCount=instruments.filter(s=>s.actualCost>0).length;
  const estimatedCount=instruments.filter(s=>!s.actualCost&&["fair","poor","unplayable"].includes(s.condition)).length;
  const totalReplaceCost=instruments.filter(s=>s.condition==="unplayable").reduce((sum,s)=>sum+getReplaceCost(s.instrumentType),0);
  const repairVsReplace=instruments.filter(s=>["poor","unplayable"].includes(s.condition)).map(s=>{
    const repairCost=s.actualCost>0?s.actualCost:getRepairCost(s.instrumentType,s.condition);
    const replaceCost=getReplaceCost(s.instrumentType);
    return{...s,repairCost,replaceCost,shouldReplace:repairCost>replaceCost*0.6,isQuoted:s.actualCost>0};
  });
  const shouldReplaceCount=repairVsReplace.filter(s=>s.shouldReplace).length;
  const typeStats=INSTRUMENT_TYPES.map(type=>{
    const items=instruments.filter(s=>s.instrumentType===type);
    const broken=items.filter(s=>["fair","poor","unplayable"].includes(s.condition));
    const repairCost=broken.reduce((sum,s)=>sum+getRepairCost(s.instrumentType,s.condition),0);
    return{type,total:items.length,broken:broken.length,rate:items.length?Math.round((broken.length/items.length)*100):0,repairCost};
  }).filter(t=>t.total>0).sort((a,b)=>b.rate-a.rate);
  const schoolStats=SCHOOLS.map(school=>{
    const items=instruments.filter(s=>s.school===school);
    const broken=items.filter(s=>["fair","poor","unplayable"].includes(s.condition)).length;
    const playable=items.filter(s=>["excellent","good"].includes(s.condition)).length;
    const enrollment=SCHOOL_ENROLLMENT[school]||150;
    const ratio=playable>0?(enrollment/playable).toFixed(1):"∞";
    const ratioNum=playable>0?enrollment/playable:999;
    const repairCost=items.reduce((sum,s)=>sum+getRepairCost(s.instrumentType,s.condition),0);
    const risk=ratioNum>3?"critical":ratioNum>2?"warning":"ok";
    return{school,total:items.length,broken,playable,enrollment,ratio,ratioNum,repairCost,risk,rate:items.length?Math.round((broken/items.length)*100):0};
  }).sort((a,b)=>b.ratioNum-a.ratioNum);
  const condCounts=CONDITIONS.map(c=>({...c,count:instruments.filter(s=>s.condition===c.value).length}));
  const filtered=instruments.filter(s=>{
    if(filterSchool!=="All Schools"&&s.school!==filterSchool) return false;
    if(filterCond!=="all"&&s.condition!==filterCond) return false;
    if(search){const q=search.toLowerCase();if(!s.instrumentType.toLowerCase().includes(q)&&!s.assetTag.toLowerCase().includes(q)&&!s.school.toLowerCase().includes(q)) return false;}
    return true;
  }).sort((a,b)=>{
    if(sortBy==="recent") return new Date(b.submittedAt)-new Date(a.submittedAt);
    if(sortBy==="worst") return CONDITIONS.findIndex(c=>c.value===b.condition)-CONDITIONS.findIndex(c=>c.value===a.condition);
    if(sortBy==="cost") return getRepairCost(b.instrumentType,b.condition)-getRepairCost(a.instrumentType,a.condition);
    return 0;
  });

  function exportLog(){withXLSX(()=>{setExporting("log");const wb=window.XLSX.utils.book_new();const headers=["Asset Tag","School","Instrument Type","Condition","Est. Repair Cost ($)","Repair Issues","Tech Status","Tech Notes","Actual Cost ($)","Urgent","Submitted By","Date Submitted","Audit Count"];const rows=instruments.map(s=>[s.assetTag,s.school,s.instrumentType,condLabel(s.condition),getRepairCost(s.instrumentType,s.condition)||"",(s.repairIssues||[]).join("; "),techLabel(s.techAction),s.techNotes||"",s.actualCost||"",s.urgent?"Yes":"No",s.submittedBy,new Date(s.submittedAt).toLocaleDateString(),s.auditCount]);const ws=window.XLSX.utils.aoa_to_sheet([]);window.XLSX.utils.sheet_add_aoa(ws,[["MDCPS Instrument Audit — Full Log"]],{origin:"A1"});window.XLSX.utils.sheet_add_aoa(ws,[["Miami-Dade County Public Schools"]],{origin:"A2"});window.XLSX.utils.sheet_add_aoa(ws,[[`Generated: ${new Date().toLocaleDateString()}`]],{origin:"A3"});window.XLSX.utils.sheet_add_aoa(ws,[headers],{origin:"A5"});window.XLSX.utils.sheet_add_aoa(ws,rows,{origin:"A6"});ws["!cols"]=[14,32,18,11,16,28,18,24,14,8,18,14,10].map(w=>({wch:w}));ws["!ref"]=window.XLSX.utils.encode_range({s:{r:0,c:0},e:{r:rows.length+5,c:headers.length-1}});window.XLSX.utils.book_append_sheet(wb,ws,"Instrument Log");window.XLSX.writeFile(wb,`MDCPS_Instrument_Log_${new Date().toISOString().slice(0,10)}.xlsx`);setExporting(null);});}
  function exportSchools(){withXLSX(()=>{setExporting("schools");const wb=window.XLSX.utils.book_new();const headers=["School","Instruments Audited","Playable","Need Repair","Repair Rate (%)","Est. Enrollment","Student:Instrument Ratio","Est. Repair Cost ($)","Program Status"];const rows=schoolStats.filter(s=>s.total>0).map(s=>[s.school,s.total,s.playable,s.broken,s.rate,s.enrollment,parseFloat(s.ratio)||999,s.repairCost,s.risk==="critical"?"Critical":s.risk==="warning"?"At Risk":"OK"]);const ws=window.XLSX.utils.aoa_to_sheet([]);window.XLSX.utils.sheet_add_aoa(ws,[["MDCPS School Health Report"]],{origin:"A1"});window.XLSX.utils.sheet_add_aoa(ws,[headers],{origin:"A5"});window.XLSX.utils.sheet_add_aoa(ws,rows,{origin:"A6"});ws["!cols"]=[36,18,10,12,14,16,22,18,14].map(w=>({wch:w}));ws["!ref"]=window.XLSX.utils.encode_range({s:{r:0,c:0},e:{r:rows.length+5,c:headers.length-1}});window.XLSX.utils.book_append_sheet(wb,ws,"School Health");window.XLSX.writeFile(wb,`MDCPS_School_Health_${new Date().toISOString().slice(0,10)}.xlsx`);setExporting(null);});}
  function exportRvR(){withXLSX(()=>{setExporting("rvr");const wb=window.XLSX.utils.book_new();const headers=["Asset Tag","School","Instrument Type","Condition","Repair Cost ($)","Cost Source","Replacement Cost ($)","Repair as % of Replace","Recommendation"];const rows=repairVsReplace.map(s=>[s.assetTag,s.school,s.instrumentType,condLabel(s.condition),s.repairCost,s.isQuoted?"Vendor Quote":"System Estimate",s.replaceCost,s.replaceCost>0?+(s.repairCost/s.replaceCost*100).toFixed(1):"",s.shouldReplace?"Replace":"Repair"]);const ws=window.XLSX.utils.aoa_to_sheet([]);window.XLSX.utils.sheet_add_aoa(ws,[["MDCPS Replace vs. Repair"]],{origin:"A1"});window.XLSX.utils.sheet_add_aoa(ws,[headers],{origin:"A5"});window.XLSX.utils.sheet_add_aoa(ws,rows,{origin:"A6"});ws["!cols"]=[14,32,18,11,14,16,18,20,14].map(w=>({wch:w}));ws["!ref"]=window.XLSX.utils.encode_range({s:{r:0,c:0},e:{r:rows.length+5,c:headers.length-1}});window.XLSX.utils.book_append_sheet(wb,ws,"Replace vs Repair");window.XLSX.writeFile(wb,`MDCPS_Replace_vs_Repair_${new Date().toISOString().slice(0,10)}.xlsx`);setExporting(null);});}

  const TABS=[{id:"overview",label:"📊 Overview"},{id:"budget",label:"💰 Budget"},{id:"schools",label:"🏫 Schools"},{id:"log",label:"📋 Log"}];
  const card=(children,style={})=><div style={{background:"rgba(255,255,255,0.04)",borderRadius:"14px",padding:"1.1rem",border:"1px solid rgba(255,255,255,0.06)",...style}}>{children}</div>;
  const sL=(text)=><div style={{fontWeight:700,marginBottom:"0.9rem",fontSize:"0.7rem",letterSpacing:"0.07em",opacity:0.45,textTransform:"uppercase"}}>{text}</div>;
  const riskColor=(r)=>r==="critical"?"#ef4444":r==="warning"?"#f59e0b":"#10b981";
  const riskLabel=(r)=>r==="critical"?"Critical":r==="warning"?"At Risk":"OK";

  const donutData=CONDITIONS.map(c=>({name:c.label,value:instruments.filter(s=>s.condition===c.value).length,color:c.color})).filter(d=>d.value>0);
  const donutTotal=instruments.length;
  const playable=instruments.filter(s=>["excellent","good"].includes(s.condition)).length;
  const playablePct=donutTotal?Math.round((playable/donutTotal)*100):0;
  const renderDonutLabel=({cx,cy,midAngle,innerRadius,outerRadius,index})=>{
    const RADIAN=Math.PI/180;const r=innerRadius+(outerRadius-innerRadius)*0.5;
    const x=cx+r*Math.cos(-midAngle*RADIAN);const y=cy+r*Math.sin(-midAngle*RADIAN);
    const d=donutData[index];if(d.value<donutTotal*0.05)return null;
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fontFamily={F}>{Math.round((d.value/donutTotal)*100)}%</text>;
  };
  const barData=INSTRUMENT_TYPES.map(type=>{const items=instruments.filter(s=>s.instrumentType===type);const broken=items.filter(s=>["fair","poor","unplayable"].includes(s.condition)).length;return{type,total:items.length,broken,rate:items.length?Math.round((broken/items.length)*100):0};}).filter(d=>d.total>0).sort((a,b)=>b.rate-a.rate).slice(0,12);
  const barColor=(rate)=>rate>60?"#ef4444":rate>35?"#f59e0b":"#10b981";
  const CustomXTick=({x,y,payload})=>{const words=payload.value.split(" ");const line1=words.slice(0,Math.ceil(words.length/2)).join(" ");const line2=words.slice(Math.ceil(words.length/2)).join(" ");return(<g transform={`translate(${x},${y})`}><text x={0} y={0} dy={12} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9} fontFamily={F}>{line1}</text>{line2&&<text x={0} y={0} dy={22} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9} fontFamily={F}>{line2}</text>}</g>);};

  return (
    <div style={{minHeight:"100vh",background:"#0c1220",fontFamily:F,color:"white",paddingBottom:"5rem"}}>
      <div style={{background:"linear-gradient(90deg,#0a1628,#1a2f50)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"1rem 2rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
          <span style={{fontSize:"1.75rem"}}>🎷</span>
          <div>
            <div style={{fontWeight:800,fontSize:"1.05rem",color:"#f59e0b",letterSpacing:"0.04em"}}>MDCPS INSTRUMENT AUDIT</div>
            <div style={{fontSize:"0.7rem",opacity:0.4}}>Miami-Dade County Public Schools · District Dashboard</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.65rem"}}>
          <div style={{fontSize:"0.7rem",opacity:0.3}}>{new Date().toLocaleDateString()}</div>
          <div style={{position:"relative"}}>
            <button onClick={()=>setExportOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:"0.45rem",background:exportOpen?"rgba(245,158,11,0.18)":"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:"10px",padding:"0.45rem 0.85rem",cursor:"pointer",fontFamily:F,color:"#f59e0b",fontSize:"0.78rem",fontWeight:700}}>
              <span>⬇</span> Export <span style={{fontSize:"0.6rem",opacity:0.6}}>{exportOpen?"▲":"▼"}</span>
            </button>
            {exportOpen&&(
              <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:"#0e1e33",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"14px",padding:"0.75rem",width:"240px",zIndex:500,boxShadow:"0 12px 32px rgba(0,0,0,0.6)"}}>
                {[{id:"log",icon:"📋",label:"Full Instrument Log",sub:`${instruments.length} records`,fn:exportLog},{id:"schools",icon:"🏫",label:"School Health Report",sub:`${schoolStats.filter(s=>s.total>0).length} schools`,fn:exportSchools},{id:"rvr",icon:"⚖️",label:"Replace vs. Repair List",sub:`${repairVsReplace.length} instruments`,fn:exportRvR}].map(r=>(
                  <button key={r.id} onClick={()=>{r.fn();setExportOpen(false);}} disabled={exporting===r.id}
                    style={{display:"flex",alignItems:"center",gap:"0.65rem",width:"100%",background:"transparent",border:"none",borderRadius:"9px",padding:"0.6rem 0.65rem",cursor:"pointer",textAlign:"left",marginBottom:"0.25rem",fontFamily:F}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{fontSize:"1.15rem",flexShrink:0}}>{r.icon}</span>
                    <div><div style={{color:"rgba(255,255,255,0.88)",fontSize:"0.78rem",fontWeight:600}}>{r.label}</div><div style={{color:"rgba(255,255,255,0.3)",fontSize:"0.67rem",marginTop:"0.05rem"}}>{r.sub}</div></div>
                    <span style={{marginLeft:"auto",fontSize:"0.65rem",color:"#10b981",fontWeight:700}}>{exporting===r.id?"…":"↓"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{background:"#0a1220",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"0 2rem",display:"flex",gap:"0.25rem"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"0.75rem 1.1rem",border:"none",cursor:"pointer",fontSize:"0.8rem",fontWeight:600,fontFamily:F,background:"transparent",color:tab===t.id?"#f59e0b":"rgba(255,255,255,0.35)",borderBottom:`2px solid ${tab===t.id?"#f59e0b":"transparent"}`}}>{t.label}</button>
        ))}
      </div>

      <div style={{padding:"1.5rem 2rem",maxWidth:"1400px",margin:"0 auto"}}>
        {tab==="overview"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1rem",marginBottom:"1.25rem"}}>
              {[{label:"Total Instruments",value:total,sub:"unique instruments on record",icon:"🎵",accent:"#3b82f6"},{label:"Need Repair",value:needRepair,sub:`${repairRate}% of fleet`,icon:"🔧",accent:"#f59e0b"},{label:"Unplayable",value:unplayable,sub:"out of service now",icon:"🚫",accent:"#ef4444"},{label:"Est. Repair Cost",value:fmtCurrency(totalRepairCost),sub:"district-wide",icon:"💸",accent:"#a855f7"}].map(c=>(
                <div key={c.label} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${c.accent}28`,borderRadius:"16px",padding:"1.25rem",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:"0.9rem",right:"0.9rem",fontSize:"1.4rem",opacity:0.2}}>{c.icon}</div>
                  <div style={{fontSize:"1.9rem",fontWeight:800,color:c.accent}}>{c.value}</div>
                  <div style={{fontWeight:600,fontSize:"0.82rem",marginBottom:"0.1rem"}}>{c.label}</div>
                  <div style={{fontSize:"0.7rem",opacity:0.4}}>{c.sub}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.25rem",marginBottom:"1.25rem"}}>
              {card(<>
                {sL("Fleet Condition")}
                {condCounts.map(c=>(
                  <div key={c.value} style={{marginBottom:"0.65rem"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.28rem"}}>
                      <span style={{fontSize:"0.76rem",color:c.color}}>{c.icon} {c.label}</span>
                      <span style={{fontSize:"0.72rem",opacity:0.55}}>{c.count} ({total?Math.round(c.count/total*100):0}%)</span>
                    </div>
                    <div style={{height:"5px",background:"rgba(255,255,255,0.06)",borderRadius:"3px"}}>
                      <div style={{height:"100%",width:`${total?(c.count/total)*100:0}%`,background:c.color,borderRadius:"3px"}}/>
                    </div>
                  </div>
                ))}
              </>)}
              {card(<>
                {sL("Highest Failure Rates by Instrument")}
                <div style={{overflowY:"auto",maxHeight:"220px"}}>
                  {typeStats.slice(0,10).map(t=>(
                    <div key={t.type} style={{display:"flex",alignItems:"center",gap:"0.65rem",marginBottom:"0.5rem"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:"0.72rem",marginBottom:"0.18rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.type}</div>
                        <div style={{height:"4px",background:"rgba(255,255,255,0.06)",borderRadius:"2px"}}>
                          <div style={{height:"100%",width:`${t.rate}%`,background:t.rate>60?"#ef4444":t.rate>35?"#f59e0b":"#10b981",borderRadius:"2px"}}/>
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",minWidth:"60px"}}>
                        <span style={{fontSize:"0.7rem",fontWeight:700,color:t.rate>60?"#ef4444":t.rate>35?"#f59e0b":"#10b981"}}>{t.rate}%</span>
                        <span style={{fontSize:"0.65rem",opacity:0.35}}>{t.broken}/{t.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>)}
            </div>
            {card(<>
              {sL("Program Impact — Student to Playable Instrument Ratio")}
              <div style={{fontSize:"0.72rem",opacity:0.45,marginBottom:"1rem"}}>Ratio = enrolled students ÷ playable instruments. Above 2:1 is at risk. Above 3:1 is critical.</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.65rem"}}>
                {schoolStats.filter(s=>s.total>0).map(s=>(
                  <div key={s.school} style={{background:`${riskColor(s.risk)}0e`,border:`1px solid ${riskColor(s.risk)}30`,borderRadius:"10px",padding:"0.75rem"}}>
                    <div style={{fontSize:"0.7rem",fontWeight:600,marginBottom:"0.4rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.school}</div>
                    <div style={{display:"flex",alignItems:"baseline",gap:"0.35rem",marginBottom:"0.25rem"}}>
                      <span style={{fontSize:"1.5rem",fontWeight:800,color:riskColor(s.risk),lineHeight:1}}>{s.ratio}</span>
                      <span style={{fontSize:"0.65rem",opacity:0.5}}>students/instrument</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.65rem",opacity:0.5}}>
                      <span>{s.playable} playable</span>
                      <span style={{color:riskColor(s.risk),fontWeight:700,opacity:1}}>{riskLabel(s.risk)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>)}
          </div>
        )}

        {tab==="budget"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1rem",marginBottom:"1.25rem"}}>
              {[{label:"Total Repair Budget Needed",value:fmtCurrency(totalRepairCost),sub:`${quotedCount} quoted · ${estimatedCount} estimated`,accent:"#f59e0b",icon:"🔧"},{label:"Replacement Cost (Unplayable)",value:fmtCurrency(totalReplaceCost),sub:`${unplayable} instruments`,accent:"#ef4444",icon:"🆕"},{label:"Recommend Replace Not Repair",value:shouldReplaceCount,sub:"repair cost >60% of replacement",accent:"#a855f7",icon:"⚖️"}].map(c=>(
                <div key={c.label} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${c.accent}28`,borderRadius:"16px",padding:"1.25rem",position:"relative"}}>
                  <div style={{position:"absolute",top:"0.9rem",right:"0.9rem",fontSize:"1.4rem",opacity:0.2}}>{c.icon}</div>
                  <div style={{fontSize:"1.75rem",fontWeight:800,color:c.accent}}>{c.value}</div>
                  <div style={{fontWeight:600,fontSize:"0.82rem",marginBottom:"0.1rem"}}>{c.label}</div>
                  <div style={{fontSize:"0.7rem",opacity:0.4}}>{c.sub}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"360px 1fr",gap:"1.25rem",marginBottom:"1.25rem"}}>
              <div style={{background:"rgba(255,255,255,0.04)",borderRadius:"14px",padding:"1.25rem",border:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{fontWeight:700,marginBottom:"0.3rem",fontSize:"0.7rem",letterSpacing:"0.07em",opacity:0.45,textTransform:"uppercase"}}>Fleet Condition Breakdown</div>
                <div style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.3)",marginBottom:"1rem"}}>{donutTotal} instruments</div>
                <div style={{display:"flex",alignItems:"center",gap:"1.5rem"}}>
                  <div style={{position:"relative",flexShrink:0}}>
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie data={donutData} cx={85} cy={85} innerRadius={52} outerRadius={82} dataKey="value" strokeWidth={2} stroke="#0c1220" labelLine={false} label={renderDonutLabel}>
                          {donutData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                        </Pie>
                        <Tooltip content={({active,payload})=>{if(!active||!payload?.length) return null;return(<div style={{background:"#0e1e33",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",padding:"0.65rem 0.9rem",fontFamily:F,fontSize:"0.78rem"}}><span style={{color:payload[0].payload.color}}>●</span> {payload[0].name}: {payload[0].value}</div>);}}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none"}}>
                      <div style={{fontSize:"1.6rem",fontWeight:800,color:playablePct>=70?"#10b981":playablePct>=50?"#f59e0b":"#ef4444",lineHeight:1}}>{playablePct}%</div>
                      <div style={{fontSize:"0.6rem",opacity:0.45,marginTop:"0.15rem",fontWeight:600}}>PLAYABLE</div>
                    </div>
                  </div>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:"0.55rem"}}>
                    {donutData.map(d=>(
                      <div key={d.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"0.45rem"}}>
                          <div style={{width:"10px",height:"10px",borderRadius:"50%",background:d.color,flexShrink:0}}/>
                          <span style={{fontSize:"0.76rem",color:"rgba(255,255,255,0.75)"}}>{d.name}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                          <span style={{fontSize:"0.76rem",fontWeight:700,color:d.color}}>{d.value}</span>
                          <span style={{fontSize:"0.68rem",opacity:0.35}}>({Math.round((d.value/donutTotal)*100)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{background:"rgba(255,255,255,0.04)",borderRadius:"14px",padding:"1.25rem",border:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{fontWeight:700,marginBottom:"0.3rem",fontSize:"0.7rem",letterSpacing:"0.07em",opacity:0.45,textTransform:"uppercase"}}>Failure Rate by Instrument Type</div>
                <div style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.3)",marginBottom:"1rem"}}>% needing repair · top 12</div>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={barData} margin={{top:4,right:8,left:-10,bottom:36}} barCategoryGap="28%">
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="type" tick={<CustomXTick/>} axisLine={false} tickLine={false} interval={0}/>
                    <YAxis tickFormatter={v=>`${v}%`} tick={{fill:"rgba(255,255,255,0.3)",fontSize:10,fontFamily:F}} axisLine={false} tickLine={false} domain={[0,100]} ticks={[0,25,50,75,100]}/>
                    <Tooltip content={({active,payload,label})=>{if(!active||!payload?.length) return null;const d=barData.find(x=>x.type===label);return(<div style={{background:"#0e1e33",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",padding:"0.65rem 0.9rem",fontFamily:F,fontSize:"0.78rem"}}><div style={{color:"white",fontWeight:700,marginBottom:"0.35rem"}}>{label}</div><div style={{color:barColor(payload[0].value),fontWeight:800,fontSize:"1.1rem"}}>{payload[0].value}% failure rate</div><div style={{color:"rgba(255,255,255,0.4)",fontSize:"0.7rem",marginTop:"0.2rem"}}>{d?.broken} of {d?.total} need repair</div></div>);}}/>
                    <Bar dataKey="rate" radius={[4,4,0,0]}>
                      {barData.map((d,i)=><Cell key={i} fill={barColor(d.rate)}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.25rem",marginBottom:"1.25rem"}}>
              {card(<>
                {sL("Estimated Repair Cost by School")}
                <div style={{overflowY:"auto",maxHeight:"260px"}}>
                  {[...schoolStats].sort((a,b)=>b.repairCost-a.repairCost).filter(s=>s.repairCost>0).map(s=>{const maxC=Math.max(...schoolStats.map(x=>x.repairCost));return(<div key={s.school} style={{display:"flex",alignItems:"center",gap:"0.65rem",marginBottom:"0.55rem"}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:"0.72rem",marginBottom:"0.18rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.school}</div><div style={{height:"4px",background:"rgba(255,255,255,0.06)",borderRadius:"2px"}}><div style={{height:"100%",width:`${(s.repairCost/maxC)*100}%`,background:"#f59e0b",borderRadius:"2px"}}/></div></div><div style={{fontSize:"0.72rem",fontWeight:700,color:"#f59e0b",minWidth:"48px",textAlign:"right"}}>{fmtCurrency(s.repairCost)}</div></div>);})}
                </div>
              </>)}
              {card(<>
                {sL("Repair Cost by Instrument Type")}
                <div style={{overflowY:"auto",maxHeight:"260px"}}>
                  {[...typeStats].sort((a,b)=>b.repairCost-a.repairCost).filter(t=>t.repairCost>0).map(t=>{const maxC=Math.max(...typeStats.map(x=>x.repairCost));return(<div key={t.type} style={{display:"flex",alignItems:"center",gap:"0.65rem",marginBottom:"0.55rem"}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:"0.72rem",marginBottom:"0.18rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.type}</div><div style={{height:"4px",background:"rgba(255,255,255,0.06)",borderRadius:"2px"}}><div style={{height:"100%",width:`${(t.repairCost/maxC)*100}%`,background:"#a855f7",borderRadius:"2px"}}/></div></div><div style={{fontSize:"0.72rem",fontWeight:700,color:"#a855f7",minWidth:"48px",textAlign:"right"}}>{fmtCurrency(t.repairCost)}</div></div>);})}
                </div>
              </>)}
            </div>
            {card(<>
              {sL("Replace vs. Repair Analysis — Poor & Unplayable")}
              <div style={{fontSize:"0.7rem",opacity:0.4,marginBottom:"0.85rem"}}>Flagged when repair cost exceeds 60% of replacement value</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.77rem"}}>
                  <thead><tr style={{background:"rgba(255,255,255,0.02)"}}>{["Instrument","School","Condition","Repair Cost","Replace Cost","Recommendation"].map(h=><th key={h} style={{padding:"0.6rem 0.85rem",textAlign:"left",opacity:0.4,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {repairVsReplace.slice(0,40).map(s=>(
                      <tr key={s.instrumentId} style={{borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                        <td style={{padding:"0.55rem 0.85rem",whiteSpace:"nowrap"}}>{s.instrumentType}</td>
                        <td style={{padding:"0.55rem 0.85rem",opacity:0.55,maxWidth:"130px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.school}</td>
                        <td style={{padding:"0.55rem 0.85rem"}}><span style={{color:CONDITIONS.find(c=>c.value===s.condition)?.color,fontWeight:600}}>{CONDITIONS.find(c=>c.value===s.condition)?.label}</span></td>
                        <td style={{padding:"0.55rem 0.85rem"}}><span style={{color:s.isQuoted?"#10b981":"#f59e0b",fontWeight:600}}>${s.repairCost.toLocaleString()}</span>{s.isQuoted&&<span style={{fontSize:"0.62rem",color:"#10b981",marginLeft:"0.35rem"}}>✓ quoted</span>}</td>
                        <td style={{padding:"0.55rem 0.85rem",opacity:0.6}}>${s.replaceCost.toLocaleString()}</td>
                        <td style={{padding:"0.55rem 0.85rem"}}><span style={{background:s.shouldReplace?"rgba(239,68,68,0.15)":"rgba(16,185,129,0.15)",color:s.shouldReplace?"#ef4444":"#10b981",padding:"0.18rem 0.55rem",borderRadius:"20px",fontSize:"0.68rem",fontWeight:700}}>{s.shouldReplace?"🔄 Replace":"🔧 Repair"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>)}
          </div>
        )}

        {tab==="schools"&&(
          <div>
            {card(<>
              {sL("School-by-School Program Health")}
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.78rem"}}>
                  <thead><tr style={{background:"rgba(255,255,255,0.03)"}}>{["School","Audited","Playable","Need Repair","Repair Rate","Enrollment","Student Ratio","Est. Cost","Status"].map(h=><th key={h} style={{padding:"0.65rem 0.9rem",textAlign:"left",opacity:0.4,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {schoolStats.filter(s=>s.total>0).map(s=>(
                      <tr key={s.school} style={{borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                        <td style={{padding:"0.65rem 0.9rem",fontWeight:600,maxWidth:"180px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.school}</td>
                        <td style={{padding:"0.65rem 0.9rem",opacity:0.6}}>{s.total}</td>
                        <td style={{padding:"0.65rem 0.9rem",color:"#10b981",fontWeight:600}}>{s.playable}</td>
                        <td style={{padding:"0.65rem 0.9rem",color:"#f59e0b"}}>{s.broken}</td>
                        <td style={{padding:"0.65rem 0.9rem"}}><div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}><div style={{width:"50px",height:"4px",background:"rgba(255,255,255,0.06)",borderRadius:"2px"}}><div style={{height:"100%",width:`${s.rate}%`,background:s.rate>60?"#ef4444":s.rate>35?"#f59e0b":"#10b981",borderRadius:"2px"}}/></div><span style={{fontSize:"0.72rem",fontWeight:700,color:s.rate>60?"#ef4444":s.rate>35?"#f59e0b":"#10b981"}}>{s.rate}%</span></div></td>
                        <td style={{padding:"0.65rem 0.9rem",opacity:0.5}}>{s.enrollment}</td>
                        <td style={{padding:"0.65rem 0.9rem"}}><span style={{fontSize:"1rem",fontWeight:800,color:riskColor(s.risk)}}>{s.ratio}:1</span></td>
                        <td style={{padding:"0.65rem 0.9rem",color:"#f59e0b",fontWeight:600}}>{fmtCurrency(s.repairCost)}</td>
                        <td style={{padding:"0.65rem 0.9rem"}}><span style={{background:`${riskColor(s.risk)}18`,color:riskColor(s.risk),padding:"0.2rem 0.55rem",borderRadius:"20px",fontSize:"0.68rem",fontWeight:700}}>{riskLabel(s.risk)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>)}
          </div>
        )}

        {tab==="log"&&(
          <div style={{background:"rgba(255,255,255,0.04)",borderRadius:"14px",border:"1px solid rgba(255,255,255,0.06)",overflow:"hidden"}}>
            <div style={{padding:"1rem 1.25rem",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:"0.55rem",flexWrap:"wrap",alignItems:"center"}}>
              <div style={{fontWeight:700,fontSize:"0.72rem",opacity:0.55,letterSpacing:"0.05em",marginRight:"auto"}}>INSTRUMENT LOG ({filtered.length})</div>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{...inputStyle,width:"130px",padding:"0.35rem 0.65rem",fontSize:"0.76rem",marginBottom:0}}/>
              <select value={filterSchool} onChange={e=>setFilterSchool(e.target.value)} style={{...selectStyle,padding:"0.35rem 2rem 0.35rem 0.65rem",fontSize:"0.76rem",marginBottom:0,width:"auto"}}>
                <option>All Schools</option>{SCHOOLS.map(s=><option key={s} style={{background:"#132030"}}>{s}</option>)}
              </select>
              <select value={filterCond} onChange={e=>setFilterCond(e.target.value)} style={{...selectStyle,padding:"0.35rem 2rem 0.35rem 0.65rem",fontSize:"0.76rem",marginBottom:0,width:"auto"}}>
                <option value="all" style={{background:"#132030"}}>All Conditions</option>{CONDITIONS.map(c=><option key={c.value} value={c.value} style={{background:"#132030"}}>{c.label}</option>)}
              </select>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...selectStyle,padding:"0.35rem 2rem 0.35rem 0.65rem",fontSize:"0.76rem",marginBottom:0,width:"auto"}}>
                <option value="recent" style={{background:"#132030"}}>Most Recent</option>
                <option value="worst" style={{background:"#132030"}}>Worst First</option>
                <option value="cost" style={{background:"#132030"}}>Highest Cost</option>
              </select>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.78rem"}}>
                <thead><tr style={{background:"rgba(255,255,255,0.02)"}}>{["Asset Tag","Instrument","School","Condition","Est. Cost","Issues","Tech Status","Audits","Date"].map(h=><th key={h} style={{padding:"0.65rem 1rem",textAlign:"left",opacity:0.4,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.slice(0,100).map(s=>{
                    const cond=CONDITIONS.find(c=>c.value===s.condition);
                    const action=TECH_ACTIONS.find(a=>a.value===s.techAction);
                    const cost=getRepairCost(s.instrumentType,s.condition);
                    return(
                      <tr key={s.instrumentId} style={{borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                        <td style={{padding:"0.6rem 1rem",fontFamily:"monospace",color:"#f59e0b",fontSize:"0.73rem"}}>{s.assetTag}</td>
                        <td style={{padding:"0.6rem 1rem",whiteSpace:"nowrap"}}>{s.instrumentType}</td>
                        <td style={{padding:"0.6rem 1rem",opacity:0.55,maxWidth:"150px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.school}</td>
                        <td style={{padding:"0.6rem 1rem"}}><span style={{background:`${cond?.color}18`,color:cond?.color,padding:"0.18rem 0.5rem",borderRadius:"20px",fontSize:"0.7rem",fontWeight:600}}>{s.urgent&&"⚠️ "}{cond?.label}</span></td>
                        <td style={{padding:"0.6rem 1rem",color:cost>0?"#f59e0b":"rgba(255,255,255,0.25)",fontWeight:cost>0?600:400,fontSize:"0.73rem"}}>{cost>0?`$${cost.toLocaleString()}`:"—"}</td>
                        <td style={{padding:"0.6rem 1rem",opacity:0.45,fontSize:"0.7rem",maxWidth:"130px"}}>{s.repairIssues?.join(", ")||"—"}</td>
                        <td style={{padding:"0.6rem 1rem"}}>{action?<span style={{background:`${action.color}18`,color:action.color,padding:"0.18rem 0.5rem",borderRadius:"20px",fontSize:"0.66rem",fontWeight:600}}>{action.label}</span>:<span style={{opacity:0.25,fontSize:"0.68rem"}}>Pending</span>}</td>
                        <td style={{padding:"0.6rem 1rem"}}><span style={{background:"rgba(59,130,246,0.1)",color:"#60a5fa",padding:"0.15rem 0.45rem",borderRadius:"10px",fontSize:"0.68rem",fontWeight:600}}>{s.auditCount}</span></td>
                        <td style={{padding:"0.6rem 1rem",opacity:0.35,whiteSpace:"nowrap"}}>{new Date(s.submittedAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length===0&&<div style={{padding:"2rem",textAlign:"center",opacity:0.25}}>No results</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view]        = useState(getInitialView);
  const prefillSchool  = getPrefillSchool();
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(()=>{
    const link=document.createElement("link");
    link.href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap";
    link.rel="stylesheet";document.head.appendChild(link);
    if(!window.XLSX){const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";document.head.appendChild(s);}
    if(!window.QRCode){const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";document.head.appendChild(s);}
    loadData().then(data=>{setInstruments(data);setLoading(false);});
  },[]);

  async function handleSubmit(entry) {
    const normTag=entry.assetTag.trim();
    const existing=instruments.find(i=>i.assetTag.toLowerCase()===normTag.toLowerCase());
    let instrumentId;
    if(existing){instrumentId=existing.instrumentId;}
    else{
      instrumentId=uid();
      await supabase.from("instruments").insert([{id:instrumentId,school:entry.school,instrument_type:entry.instrumentType,asset_tag:normTag}]);
    }
    const auditId=uid();
    await supabase.from("audits").insert([{id:auditId,instrument_id:instrumentId,condition:entry.condition,repair_issues:entry.repairIssues,notes:entry.notes,submitted_by:entry.submittedBy,submitted_at:entry.submittedAt,photos:entry.photos,urgent:entry.urgent||false,tech_action:null,tech_notes:"",actual_cost:null}]);
    const updated=await loadData();setInstruments(updated);
  }

  async function handleUpdateTech(instrumentId,auditId,updates) {
    await supabase.from("audits").update({condition:updates.condition,repair_issues:updates.repairIssues,notes:updates.notes,submitted_by:updates.submittedBy,photos:updates.photos,tech_action:updates.techAction,tech_notes:updates.techNotes,actual_cost:updates.actualCost}).eq("id",auditId);
    const updated=await loadData();setInstruments(updated);
  }

  const existingTags=instruments.map(i=>i.assetTag.toLowerCase());

  if(loading) return (
    <div style={{minHeight:"100vh",background:"#06101a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif",color:"rgba(255,255,255,0.5)",fontSize:"0.9rem"}}>
      Loading audit data...
    </div>
  );

  // Each view is fully isolated — no shared nav bar
  if(view==="form")      return <MobileForm onSubmit={handleSubmit} prefillSchool={prefillSchool} existingTags={existingTags}/>;
  if(view==="tech")      return <PinGate pinKey="tech" pin={TECH_PIN} color="#a855f7" icon="🔧" title="REPAIR TECH PORTAL" subtitle="Restricted Access · Enter PIN to continue"><TechPortalInner instruments={instruments} onUpdateTech={handleUpdateTech}/></PinGate>;
  if(view==="dashboard") return <PinGate pinKey="dashboard" pin={DASHBOARD_PIN} color="#3b82f6" icon="📊" title="DISTRICT DASHBOARD" subtitle="Restricted Access · Enter PIN to continue"><Dashboard instruments={instruments}/></PinGate>;
  return <QRHub/>;
}
