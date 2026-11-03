import * as THREE from 'three';

const circle=(c,r,cx,cy,rad)=>Math.hypot(c-cx,r-cy)<=rad;
export const SELUNITE_MOON_SANCTUM_FLOOR_MASK=(c,r)=>{
  if(c<0||c>=34||r<0||r>=34) return false;
  return circle(c,r,17,17,12.7);
};

const spawn=(minC,maxC,minR,maxR)=>({minC,maxC,minR,maxR});
export const MOON_SANCTUM_NPCS=Object.freeze({
  panelTitle:'Moon Sanctum · Summons',
  restoreLabel:'Clear Summons',
  initial:[],
  spawnables:[
    {
      id:'shadow-wolf-large',name:'Large Shadow Wolf',role:'Shadow Beast',
      archetype:'shadow-wolf',color:0x49607d,limit:4,
      spawnArea:spawn(8,16,10,22),
      footprint:{cells:[[0,0],[1,0],[2,0],[3,0]]},
    },
    {
      id:'golden-golem',name:'Golden Armored Golem',role:'Construct Guardian',
      archetype:'golden-golem',color:0xe2bf62,limit:10,
      spawnArea:spawn(10,24,8,24),
    },
    {
      id:'sheep',name:'Sheep',role:'Docile Beast',
      archetype:'sheep',color:0xd8d5cf,limit:12,
      spawnArea:spawn(9,24,10,24),
    },
    {
      id:'potted-plant',name:'Potted Plant',role:'Animated Flora',
      archetype:'potted-plant',color:0x83b56e,limit:12,
      spawnArea:spawn(9,24,10,24),
    },
  ],
});

export function buildSeluniteMoonSanctum(api){
  const {geometry:g,architecture:a,interactions:i}=api;
  const b=(c,r,w,h,d,color,y=h/2,blocking=false)=>g.boxAt(c,r,w,h,d,{color,y,blocking});
  const cyl=(c,r,rt,rb,h,color,y=h/2)=>g.cylinderAt(c,r,rt,rb,h,{color,y});
  const ball=(c,r,rad,color,y=rad)=>g.sphereAt(c,r,rad,{color,y});
  const label=(c,r,text,y=5.4,cls='dead-three-zone-label')=>g.labelAt(c,r,text,{y,className:cls});

  // Return stair.
  for(const r of [5,6,7]) b(17,r,3.4,.14,3.4,0xa3a4b3,.10+(6-r)*.06);
  const stairPad=b(17,5,2.2,.46,2.2,0xc0c1ca,.28);
  i.clickable(stairPad,'Return to Temple of Selûne',()=>i.travel('temple-of-selune'));
  i.panelAction({id:'sanctum-return',label:'Ascend to Temple of Selûne',group:'LOCATION CONTROLS · GM',run:()=>i.travel('temple-of-selune')});

  // Circular boundary ring and support columns.
  for(let deg=0; deg<360; deg+=20){
    const angle=deg*Math.PI/180;
    const c=Math.round(17+Math.cos(angle)*11.2);
    const r=Math.round(17+Math.sin(angle)*11.2);
    cyl(c,r,.52,.58,5.2,0x8b8f9d,2.6);
    a.block(c,r);
  }
  for(let deg=10; deg<360; deg+=45){
    const angle=deg*Math.PI/180;
    const c=Math.round(17+Math.cos(angle)*8.7);
    const r=Math.round(17+Math.sin(angle)*8.7);
    cyl(c,r,.42,.46,3.2,0xaab2c3,1.6);
    ball(c,r,.18,0xe6f2ff,3.35);
  }

  // Glowing floors.
  const floorGlow=new THREE.Group();
  const outer=new THREE.Mesh(
    new THREE.RingGeometry(9.5,49.0,96),
    new THREE.MeshStandardMaterial({color:0x82baff,emissive:0x2c72ff,emissiveIntensity:1.25,transparent:true,opacity:.9,side:THREE.DoubleSide})
  );
  outer.rotation.x=-Math.PI/2; outer.position.y=.08; floorGlow.add(outer);
  const mid=new THREE.Mesh(
    new THREE.CircleGeometry(9.0,72),
    new THREE.MeshStandardMaterial({color:0xd8eeff,emissive:0x5ba8ff,emissiveIntensity:1.6,transparent:true,opacity:.88,side:THREE.DoubleSide})
  );
  mid.rotation.x=-Math.PI/2; mid.position.y=.09; floorGlow.add(mid);
  const rune=new THREE.Mesh(
    new THREE.RingGeometry(3.2,6.8,56),
    new THREE.MeshStandardMaterial({color:0xe6f4ff,emissive:0x91d7ff,emissiveIntensity:2.2,transparent:true,opacity:.95,side:THREE.DoubleSide})
  );
  rune.rotation.x=-Math.PI/2; rune.position.y=.10; floorGlow.add(rune);
  const core=new THREE.Mesh(
    new THREE.CircleGeometry(2.4,40),
    new THREE.MeshStandardMaterial({color:0xf4fbff,emissive:0x9fe7ff,emissiveIntensity:2.8,transparent:true,opacity:.96,side:THREE.DoubleSide})
  );
  core.rotation.x=-Math.PI/2; core.position.y=.11; floorGlow.add(core);
  g.attach(floorGlow,{c:17,r:17,y:0});

  // Strong room lighting.
  g.pointLight(17,17,{color:0xd3ecff,intensity:400,range:120,height:6.5});
  g.pointLight(17,17,{color:0xb7d8ff,intensity:220,range:80,height:3.8});
  for(const [c,r] of [[17,9],[25,17],[17,25],[9,17]]) g.pointLight(c,r,{color:0x9ecfff,intensity:120,range:40,height:4.8});

  // Decorative central moon basin.
  cyl(17,17,2.2,2.2,.48,0x8e97a7,.24);
  ball(17,17,.62,0xf2fbff,1.2);
  label(17,13,'Moon Sanctum',5.2);

  // A few broad stone platforms around the chamber perimeter for composition.
  for(const [c,r,w,d] of [[8,17,6.0,2.3],[26,17,6.0,2.3],[17,8,2.4,6.0],[17,26,2.4,6.0]]){
    b(c,r,w,.42,d,0x7c828f,.22,true);
  }
}
