export const INTERACTION_DISTANCE=2.65;
export function withinReach(player,person,{entered=false,queuing=false}={}){
 if(!player||!person||queuing)return false;
 if(person.z<0&&(!entered||player.z>1))return false;
 if(person.z>1&&player.z<-.5)return false;
 return Math.hypot(player.x-person.x,player.z-person.z)<=INTERACTION_DISTANCE;
}
