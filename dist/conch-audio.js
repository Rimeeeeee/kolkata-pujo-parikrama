// A quiet original synthesized conch call, spatially gated to the performer.
export class ConchAmbience{
 constructor(){this.nextCall=0;this.context=null;this.gain=null;}
 stop(){if(this.gain&&this.context){this.gain.gain.cancelScheduledValues(this.context.currentTime);this.gain.gain.setValueAtTime(0,this.context.currentTime);}}
 update({enabled,position,performer,time}){
  if(!enabled||!performer){this.stop();return;}const distance=Math.hypot(position.x-performer.x,position.z-performer.z);if(distance>9){this.stop();return;}if(time<this.nextCall)return;this.nextCall=time+13;
  try{this.context??=new (window.AudioContext||window.webkitAudioContext)();const c=this.context;if(c.state==='suspended')c.resume();const now=c.currentTime,o=c.createOscillator(),g=c.createGain();o.setPeriodicWave(c.createPeriodicWave(new Float32Array(6),new Float32Array([0,1,.55,.28,.12,.05])));o.frequency.setValueAtTime(188,now);o.frequency.linearRampToValueAtTime(197,now+1.1);o.frequency.linearRampToValueAtTime(191,now+3.3);const volume=.045*Math.max(.12,1-distance/10);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(volume,now+.5);g.gain.setValueAtTime(volume*.85,now+2.7);g.gain.linearRampToValueAtTime(0,now+3.6);o.connect(g);g.connect(c.destination);o.start(now);o.stop(now+3.7);this.gain=g;o.onended=()=>{o.disconnect();g.disconnect();};}catch{}
 }
}
