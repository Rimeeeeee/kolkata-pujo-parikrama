export const PLACES = [
 {id:'street',number:'01',title:'The neighbourhood lane',bn:'পাড়ার রাস্তা',description:'Fairy lights, familiar faces, and a little Kolkata adda.',position:[0,1.9,20],look:[0,3,-1]},
 {id:'queue',number:'02',title:'The pandal entrance',bn:'প্যান্ডেলের প্রবেশপথ',description:'Join the neighbours and let the volunteer guide you in.',position:[4.7,1.9,15.65],look:[4.7,1.8,12]},
 {id:'inside',number:'03',title:'Inside the pandal',bn:'মণ্ডপের ভিতরে',description:'A traditional courtyard, the idol, and evening arati.',position:[0,2,-7],look:[0,3.8,-20]},
 {id:'dhaki',number:'04',title:'Follow the dhak',bn:'ঢাকের তালে',description:'Meet Bimal-da and watch the rhythm come alive.',position:[-4.8,2,-6.2],look:[-6.4,1.8,-8]},
 {id:'tea',number:'05',title:'A cup at Haru-da’s',bn:'হারুদার চায়ের দোকান',description:'Cha in a clay cup. A conversation that can wait.',position:[-8.05,1.9,10.25],look:[-10,2,10]},
 {id:'balloons',number:'06',title:'Cork shooting range',bn:'বেলুন ফাটান',description:'Moving balloons, twelve corks, and 45 seconds.',position:[7.3,1.9,15.2],look:[9.7,2.1,14.9]},
 {id:'seller',number:'07',title:'Your favourite balloon',bn:'রঙিন বেলুন',description:'Choose any colour and take it along for the evening.',position:[5.6,1.9,19.6],look:[7.7,2.5,19]},
 {id:'fuchka',number:'08',title:'The fuchka corner',bn:'দাদার ফুচকা',description:'Tok-jhal fuchka and a leaf plate of happiness.',position:[-8.05,1.9,19.2],look:[-10,2,19]},
 {id:'jhalmuri',number:'09',title:'A cone of jhalmuri',bn:'মশলা ঝালমুড়ি',description:'Freshly mixed, with lime and a little mustard oil.',position:[-8.05,1.9,25.2],look:[-10,2,25]},
 {id:'mishti',number:'10',title:'Mitali-di’s mishti',bn:'মিতালির মিষ্টি',description:'Roshogolla, sandesh, and a pot of mishti doi.',position:[8.05,1.9,25],look:[10,2,25]},
 {id:'flowers',number:'11',title:'Phuler jhuri for Maa',bn:'বেলাদির ফুল',description:'Choose a small, medium or big basket of Puja flowers.',position:[8.05,1.9,7.5],look:[10.55,2.1,7]}
];
export function canEnter(x,z,hasEntered){return hasEntered || !(z<1 && Math.abs(x)<10.5);}
export function constrainWalk(x,z,hasEntered){
 x=Math.max(-11.1,Math.min(11.1,x));z=Math.max(-16.4,Math.min(27,z));
 if(z<1 && !hasEntered) z=1;
 if(z<.8) x=Math.max(-8.9,Math.min(8.9,x));
 if(z>=1 && z<7 && Math.abs(x)>7.4)z=7;
 return [x,z];
}
