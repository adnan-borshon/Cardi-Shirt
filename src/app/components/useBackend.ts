import {useState,useEffect,useRef,useCallback} from "react";
import {io,Socket} from "socket.io-client";

const API_URL="http://localhost:4000";
let _socket:Socket|null=null;

function getSocket():Socket{
if(!_socket){
_socket=io(API_URL,{transports:["websocket","polling"],reconnection:true,reconnectionDelay:2000});
}
return _socket;
}

export interface LiveVitals{
bpm:number;
temp:number;
fall_detected:boolean;
ecg_array?:number[];
timestamp:string;
}

export interface SOSEvent{
reason:string;
bpm:number;
temp:number;
timestamp:string;
}

export interface ECGRecord{
id:number;
waveform_data:number[];
ai_summary:string;
timestamp:string;
}

// Hook: real-time vitals via WebSocket
export function useLiveVitals(){
const[vitals,setVitals]=useState<LiveVitals|null>(null);
const[connected,setConnected]=useState(false);
const[sos,setSos]=useState<SOSEvent|null>(null);

useEffect(()=>{
const s=getSocket();
s.on("connect",()=>setConnected(true));
s.on("disconnect",()=>setConnected(false));
s.on("vitals",(data:LiveVitals)=>setVitals(data));
s.on("sos",(data:SOSEvent)=>setSos(data));
return()=>{
s.off("vitals");
s.off("sos");
};
},[]);

const dismissSos=useCallback(()=>setSos(null),[]);
return{vitals,connected,sos,dismissSos};
}

// Hook: fetch ECG records from REST API
export function useECGRecords(){
const[records,setRecords]=useState<ECGRecord[]>([]);
const[loading,setLoading]=useState(true);
const[error,setError]=useState<string|null>(null);

const fetchRecords=useCallback(async()=>{
setLoading(true);
setError(null);
try{
const res=await fetch(`${API_URL}/api/ecg-records`);
if(!res.ok)throw new Error(`HTTP ${res.status}`);
const data=await res.json();
setRecords(Array.isArray(data)?data:[]);
}catch(err:any){
console.error("[useECGRecords]",err.message);
setError(err.message||"Failed to fetch ECG records");
setRecords([]);
}finally{
setLoading(false);
}
},[]);

useEffect(()=>{fetchRecords();},[fetchRecords]);

// Re-fetch when new ECG session arrives via socket
useEffect(()=>{
const s=getSocket();
s.on("ecg_session",()=>fetchRecords());
return()=>{s.off("ecg_session");};
},[fetchRecords]);

return{records,loading,error,refetch:fetchRecords};
}

// Hook: fetch Daily Summaries from REST API
export interface DailySummary{
id:number;
summary:string;
created_at:string;
}

export function useDailySummaries(){
const[summaries,setSummaries]=useState<DailySummary[]>([]);
const[loading,setLoading]=useState(true);
const[error,setError]=useState<string|null>(null);

const fetchSummaries=useCallback(async()=>{
setLoading(true);
setError(null);
try{
const res=await fetch(`${API_URL}/api/daily-summaries`);
if(!res.ok)throw new Error(`HTTP ${res.status}`);
const data=await res.json();
setSummaries(Array.isArray(data)?data:[]);
}catch(err:any){
console.error("[useDailySummaries]",err.message);
setError(err.message||"Failed to fetch daily summaries");
setSummaries([]);
}finally{
setLoading(false);
}
},[]);

useEffect(()=>{fetchSummaries();},[fetchSummaries]);

return{summaries,loading,error,refetch:fetchSummaries};
}

export function useGeolocationWatcher(){useEffect(()=>{if(typeof window==="undefined"||!navigator.geolocation)return;const watchId=navigator.geolocation.watchPosition(async(pos)=>{const{latitude:lat,longitude:lng}=pos.coords;try{await fetch(`${API_URL}/api/location/update`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lat,lng})});}catch(e){console.error(e);}},e=>console.warn(e),{enableHighAccuracy:true,timeout:10000,maximumAge:0});return()=>{navigator.geolocation.clearWatch(watchId);};},[]);}
export function useLiveLocation(){const[loc,setLoc]=useState<{lat:number;lng:number}|null>(null);useEffect(()=>{fetch(`${API_URL}/api/location/current`).then(r=>r.json()).then(d=>setLoc(d)).catch(e=>console.error(e));const s=getSocket();s.on("location_change",(d:{lat:number;lng:number})=>setLoc(d));return()=>{s.off("location_change");};},[]);return loc;}

export{API_URL};
