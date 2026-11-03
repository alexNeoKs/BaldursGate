import * as THREE from 'three';

const spawn=(minC,maxC,minR,maxR)=>({minC,maxC,minR,maxR});
const worship=(id,name,role,archetype,color,c,r,extra={})=>({id,name,role,archetype,color,start:[c,r],...extra});

export const SELUNE_TEMPLE_NPCS=Object.freeze({
  panelTitle:'Temple of Selûne · Clergy & Congregation',
  restoreLabel:'Restore Temple Congregation',
  patrolControls:true,
  initial:[
    worship('high-priest-selune','High Priest of Selûne','Moonlit Celebrant','selunite-high-priest',0xd6ddff,10,5),
    worship('priest-selune-1','Priest of Selûne','Temple Priest','selunite-priest',0xbdc9f4,6,10,{patrol:{points:[[6,10],[6,15],[8,18],[6,22],[5,25]],speed:1.1,pause:1.1}}),
    worship('priest-selune-2','Priest of Selûne','Temple Priest','selunite-priest',0xc7d3fb,14,10,{patrol:{points:[[14,10],[14,15],[12,18],[14,22],[15,25]],speed:1.1,pause:1.1}}),
    worship('priest-selune-3','Priest of Selûne','Moonlit Attendant','selunite-priest',0xc4d0fb,10,20,{patrol:{points:[[10,20],[9,15],[10,12],[11,16],[10,22]],speed:1.15,pause:1.0}}),
    worship('worshipper-1','Worshipper','Praying Devotee','worshipper',0x9fa2bd,7,14),
    worship('worshipper-2','Worshipper','Praying Devotee','worshipper',0x9d97b6,13,14),
    worship('worshipper-3','Worshipper','Quiet Pilgrim','worshipper',0xaa9db4,8,19,{patrol:{points:[[8,26],[8,22],[8,19],[8,22],[8,27]],speed:1.0,pause:1.2}}),
    worship('worshipper-4','Worshipper','Quiet Pilgrim','worshipper',0xb3a8c4,12,19,{patrol:{points:[[12,27],[12,22],[12,19],[12,22],[12,27]],speed:1.0,pause:1.2}}),
    worship('worshipper-5','Worshipper','Moonlit Visitor','worshipper',0x8ea1bf,9,25,{patrol:{points:[[10,29],[10,26],[9,23],[10,18],[10,13],[10,18],[10,29]],speed:1.05,pause:1.0}}),
    worship('worshipper-6','Worshipper','Moonlit Visitor','worshipper',0xb09ec0,11,26,{patrol:{points:[[11,29],[11,26],[11,21],[10,17],[11,21],[11,29]],speed:1.05,pause:1.0}}),
  ],
  spawnables:[
    {id:'spawn-priest-selune',name:'Priest of Selûne',role:'Temple Priest',archetype:'selunite-priest',color:0xc4d0f7,limit:12,spawnArea:spawn(5,15,21,29)},
    {id:'spawn-worshipper',name:'Worshipper',role:'Temple Worshipper',archetype:'worshipper',color:0xa89eb9,limit:20,spawnArea:spawn(5,15,21,29)},
  ],
});

export function buildTempleOfSelune(api){
  const {geometry:g,architecture:a,interactions:i}=api;
  const b=(c,r,w,h,d,color,y=h/2,blocking=false)=>g.boxAt(c,r,w,h,d,{color,y,blocking});
  const cyl=(c,r,rt,rb,h,color,y=h/2)=>g.cylinderAt(c,r,rt,rb,h,{color,y});
  const ball=(c,r,rad,color,y=rad)=>g.sphereAt(c,r,rad,{color,y});
  const label=(c,r,text,y=5.6,cls='landmark-prop-label')=>g.labelAt(c,r,text,{y,className:cls});
  const info=msg=>{const el=document.querySelector('#move-status');if(el)el.textContent=msg;};

  const stone=0x8b898e,shadow=0x4f4f59,silver=0xcad8f6,moon=0xbfdcff,wood=0x5c3f2e;

  // Aisle and subtle blue-silver floor pattern.
  for(let r=2;r<30;r++) b(10,r,4.1,.05,3.9,(r%2?0x707a92:0x7d879c),.06);
  for(let r=3;r<30;r+=2){ b(6,r,3.88,.03,3.88,0x777376,.05); b(14,r,3.88,.03,3.88,0x777376,.05); }

  // Stone columns and candle bowls.
  for(const r of [5,9,13,17,21,25]){
    for(const c of [3,17]){
      cyl(c,r,1.05,1.1,6.6,0x8f9097,3.3);
      cyl(c,r,1.35,1.35,.35,0xb5bac6,6.78);
      cyl(c,r,1.32,1.38,.33,0x686b73,.16);
    }
  }
  for(const [c,r] of [[5,7],[15,7],[5,27],[15,27]]){ cyl(c,r,.34,.38,1.8,0x8f8472,0.9); ball(c,r,.32,0xf2c789,2.05); g.pointLight(c,r,{color:0xf0d8aa,intensity:1.1,range:12,height:2.8}); }

  // Pews.
  const pewMat=new THREE.MeshStandardMaterial({color:wood,roughness:.92});
  const trimMat=new THREE.MeshStandardMaterial({color:0x3b2a20,roughness:.95});
  const addPew=(cellX,row)=>{
    const group=new THREE.Group();
    const seat=new THREE.Mesh(new THREE.BoxGeometry(8.6,.52,1.1),pewMat);
    seat.position.set(0,.55,0);seat.castShadow=seat.receiveShadow=true;
    const back=new THREE.Mesh(new THREE.BoxGeometry(8.6,1.4,.22),trimMat);
    back.position.set(0,1.18,-1.02);back.castShadow=back.receiveShadow=true;
    group.add(seat,back);
    for(const [x,z] of [[-3.8,.0],[3.8,.0],[-3.8,-.95],[3.8,-.95]]){
      const leg=new THREE.Mesh(new THREE.BoxGeometry(.24,1.0,.24),trimMat);
      leg.position.set(x,.5,z);leg.castShadow=leg.receiveShadow=true;group.add(leg);
    }
    g.attach(group,{c:cellX,r:row,y:0});
    for(let dc=-1;dc<=1;dc++) a.block(cellX+dc,row);
  };
  for(const row of [11,13,15,17,20,22,24]) for(const cx of [7,13]) addPew(cx,row);

  // Raised altar dais and moon icon.
  for(let rr=2;rr<=6;rr++) for(let cc=7;cc<=13;cc++) b(cc,rr,3.9,.18,3.9,(cc+rr)%2?0xa39ea5:0x94919b,.12);
  b(10,4,13.6,1.2,8.0,0x857e86,.62);
  b(10,4,6.6,2.0,2.8,0x6d6a76,1.05,true);
  cyl(10,3,.18,.18,2.0,0xcad7f7,2.2); ball(10,3,.68,moon,3.5);
  label(10,2,'Altar of Selûne',4.8);
  for(const c of [7,10,13]){ ball(c,6,.24,0xf1cf8d,2.55); g.pointLight(c,6,{color:0xf0d8aa,intensity:1.2,range:12,height:3.2}); }

  // Moonwell / hidden descent.
  const moonLight=g.pointLight(10,16,{color:0xaed9ff,intensity:2.0,range:28,height:7.8});
  const moonwell=new THREE.Group();
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(4.3,4.3,.55,40),new THREE.MeshStandardMaterial({color:0xaeb7c8,roughness:.88,metalness:.05}));
  disc.position.y=.33;disc.castShadow=disc.receiveShadow=true;moonwell.add(disc);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(3.95,.20,14,40),new THREE.MeshStandardMaterial({color:silver,roughness:.35,metalness:.3,emissive:0x31425e,emissiveIntensity:.35}));
  ring.rotation.x=Math.PI/2; ring.position.y=.55; moonwell.add(ring);
  g.attach(moonwell,{c:10,r:16,y:0});

  const stairGroup=new THREE.Group();
  for(let step=0;step<12;step++){
    const tread=new THREE.Mesh(new THREE.BoxGeometry(1.8,.18,.95),new THREE.MeshStandardMaterial({color:0x7c7f86,roughness:.95}));
    const angle=step*.55;
    tread.position.set(Math.cos(angle)*1.9,-step*.22,Math.sin(angle)*1.9);
    tread.rotation.y=-angle;
    tread.castShadow=tread.receiveShadow=true;
    stairGroup.add(tread);
  }
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(3.6,3.6,4.5,26,1,true),new THREE.MeshStandardMaterial({color:0x4c515c,side:THREE.DoubleSide,roughness:1}));
  shaft.position.set(0,-2.1,0); shaft.castShadow=shaft.receiveShadow=true; stairGroup.add(shaft);
  stairGroup.visible=false;
  g.attach(stairGroup,{c:10,r:16,y:0});

  let stairOpen=false;
  function setStairOpen(open){
    stairOpen=Boolean(open); disc.visible=!stairOpen; stairGroup.visible=stairOpen; moonLight.intensity=stairOpen?2.6:2.0;
    info(stairOpen?'Moonlit stone iris opens, revealing the hidden circular stair.':'The circular stairwell closes beneath the moonwell.');
    i.refresh();
  }
  i.clickable(disc,'Moonlit Stone Iris',()=>setStairOpen(!stairOpen));
  i.clickable(ring,'Hidden Selûnite Stairwell',()=> stairOpen ? i.travel('selunite-moon-sanctum') : info('The central moonlit floor is sealed. A hidden mechanism must open it first.'));
  i.panelAction({id:'selune-stair-toggle',label:()=>`${stairOpen?'Seal':'Open'} Hidden Selûnite Stairwell`,run:()=>setStairOpen(!stairOpen)});
  i.panelAction({id:'selune-descend',label:'Descend to the Moon Sanctum',visible:()=>stairOpen,enabled:()=>stairOpen,run:()=>i.travel('selunite-moon-sanctum')});
  label(10,17,'Moonlit Descent',5.0,'dead-three-zone-label');

  // Temple entry and side shrines.
  for(const c of [4,16]){ b(c,29,4.0,5.0,.35,shadow,2.5,true); b(c,29,4.1,.22,.55,0xcab18a,4.9); }
  for(const c of [3,6,14,17]) g.pointLight(c,28,{color:0xe8d3a7,intensity:1.1,range:11,height:3.7});
  for(const [c,r] of [[4,5],[16,5]]){ b(c,r,2.3,1.0,2.3,0x70717f,.54,true); ball(c,r,.40,moon,1.65); label(c,r,'Silver Shrine',4.2); }
}
