// GENERIC BATHHOUSE — public above-ground D1–D4, 5 ft per tactical tile.
// No new renderer: this is a V9 shared-engine landmark builder.
export const BATHHOUSE_FLOOR_MASK=(c,r)=>
  (c>=2&&c<=18&&r>=2&&r<=16) ||
  (c>=11&&c<=24&&r>=16&&r<=22) ||
  (c>=19&&c<=24&&r>=8&&r<=22) ||
  (c>=4&&c<=6&&r>=0&&r<=2);

const BATH_SPAWN={minC:9,maxC:17,minR:11,maxR:15};
const COMMONER=(n,c,r)=>({id:`bathing-commoner-${n}`,name:`Bathing Commoner ${n}`,
  role:'Bathhouse Guest',faction:'civilian',archetype:'bather',color:0xc5a88c,start:[c,r]});
export const BATHHOUSE_NPCS=Object.freeze({
  panelTitle:'Bathhouse · Patrons & Cultists',restoreLabel:'Restore Bathhouse Patrons',
  initial:[
    COMMONER(1,10,6),COMMONER(2,12,7),COMMONER(3,14,6),COMMONER(4,16,7),COMMONER(5,17,5),
    {id:'jabaz',name:'Jabaz',role:'Human Masseuse',faction:'civilian',archetype:'masseuse',color:0x7e9b96,start:[4,13]},
  ],
  spawnables:[
    {id:'bath-night-blade',name:'Night Blade',role:'Bhaal Assassin',archetype:'night-blade',faction:'dead-three',color:0x73353b,limit:16,spawnArea:BATH_SPAWN},
    {id:'bath-necromite',name:'Necromite of Myrkul',role:'Necromite',archetype:'necromite',faction:'dead-three',color:0x64646f,limit:16,spawnArea:BATH_SPAWN},
    {id:'bath-cultist',name:'Cultist',role:'Dead Three Cultist',archetype:'cultist',faction:'dead-three',color:0x6a4b5d,limit:20,spawnArea:BATH_SPAWN},
    {id:'bath-commoner',name:'Bathing Commoner',role:'Bathhouse Guest',archetype:'bather',color:0xbba18c,spawnArea:{minC:9,maxC:17,minR:4,maxR:9},limit:14},
    {id:'jabaz',name:'Jabaz',role:'Human Masseuse',archetype:'masseuse',color:0x7e9b96,unique:true,start:[4,14],spawnArea:{minC:3,maxC:7,minR:11,maxR:15}},
  ],
});

export function buildGenericBathhouse(api){
  const {geometry:g,architecture:a,interactions:i,decoration:d}=api;
  const box=(c,r,w,h,dep,color,y=h/2,blocking=false)=>g.boxAt(c,r,w,h,dep,{color,y,blocking});
  const ball=(c,r,rad,color,y=rad)=>g.sphereAt(c,r,rad,{color,y});
  const col=(c,r,rt,rb,h,color,y=h/2)=>g.cylinderAt(c,r,rt,rb,h,{color,y});
  const sign=(c,r,label,y=7)=>g.labelAt(c,r,label,{y});
  const cream=0xe1d6bb,plaster=0xbcae93,marble=0xe4e4dc,blue=0x5b88a2,
    blueDark=0x30576f,bronze=0xb48c5e,wood=0x63452f,roof=0xb36242;
  let secretOpen=false;
  const announce=(msg)=>{const el=document.querySelector('#move-status');if(el)el.textContent=msg;};
  const stairs=()=>{if(secretOpen)i.travel('dungeon-of-the-dead-three');else announce('The hidden stairwell is still sealed. Search the north massage room.');};

  // The stucco bathhouse is surrounded by an L-shaped courtyard in the southeast.
  // Walkability is constrained by a true irregular floor mask, not fake painted walls.
  for(let r=2;r<=16;r++)for(let c=2;c<=18;c++){
    if((c*13+r*7)%6===0)box(c,r,3.88,.04,3.88,0xbdbbb3,.035);
  }
  for(let r=16;r<=22;r++)for(let c=11;c<=24;c++){
    if((c+r)%3===0)box(c,r,3.9,.045,3.9,0x648b66,.04);
  }
  for(let r=9;r<=15;r++)for(let c=19;c<=24;c++)
    if((c+r)%3===0)box(c,r,3.89,.03,3.89,0x6e986c,.04);
  // Courtyard carved boundary, stucco parapets and terracotta roof accents.
  const buildingWall=(c,r,w,dep)=>box(c,r,w,7,dep,plaster,3.5);
  for(const c of [2,18])for(let r=2;r<=15;r+=2){
    if(c===18&&r>=12&&r<=13)continue;
    buildingWall(c,r,.48,7.8);
  }
  for(let c=2;c<=18;c+=2){
    if(c>=12&&c<=14)continue;
    buildingWall(c,16,7.8,.48);
  }
  for(let c=2;c<=18;c+=3){
    box(c,2,4.2,.40,4.2,roof,7.2);
    box(c,16,4.1,.32,3.8,roof,7.2);
  }
  // Interior walls: D2 main bath; D1 lobby; D3 south and D4 north massage rooms.
  a.partitionVertical(8,[5,13],5.3,{start:3,stop:16});
  a.partitionHorizontal(11,[13],5.3,{start:8,stop:19});
  a.partitionHorizontal(9,[5],5.3,{start:2,stop:8});
  a.partitionHorizontal(16,[13,14],5.6,{start:2,stop:19});
  a.partitionVertical(19,[13,14],5.6,{start:8,stop:16});
  a.partitionHorizontal(3,[5],5.5,{start:4,stop:7});
  const doors={
    bath:a.doorHorizontal(11,13),
    south:a.doorVertical(8,13),
    north:a.doorVertical(8,5),
    courtyard:a.doorHorizontal(16,13),
    garden:a.doorVertical(19,13),
    secret:a.doorHorizontal(3,5,{secret:true,height:5.1}),
  };
  for(const [id,label] of [['bath','Bathing Chamber Doors'],['south','South Massage Room Door'],
    ['north','North Massage Room Door'],['courtyard','Courtyard Entrance Doors'],['garden','Garden Side Door']]){
    const door=doors[id];
    i.panelAction({id:`bath-door-${id}`,label:()=>`${door.open?'Close':'Open'} ${label}`,
      run:()=>{door.toggle();announce(`${label} ${door.open?'opened':'closed'}.`);}});
    i.clickable(door.mesh,label,()=>door.toggle());
  }
  const revealSecret=()=>{secretOpen=!secretOpen;doors.secret.setOpen(secretOpen);
    announce(secretOpen?'A secret stair descends twenty feet beneath the bathhouse.':'The hidden door seals again.');};
  i.panelAction({id:'bath-reveal-stair',label:()=>secretOpen?'Seal Hidden Staircase':'Find & Open Hidden Staircase',run:revealSecret});
  i.panelAction({id:'bath-descend',label:'Descend to Dungeon of the Dead Three',enabled:()=>secretOpen,run:stairs});
  i.clickable(doors.secret.mesh,'Hidden Stair Switch',revealSecret);
  // Entrance portal to the southeast courtyard: wood relief doors and smiling nymph outlines.
  for(const c of [13,14]){
    box(c,15.94,3.1,5.5,.3,wood,2.75);
    ball(c,15.91,.46,cream,3.4);
    box(c,15.84,.18,1.2,.28,bronze,2.2);
  }
  // Frescoes and jewel-colored stained glass. No opaque roof above playable floor.
  for(let c=9;c<=17;c+=3){
    box(c,3,2.3,3.8,.21,0xc7a98d,5.5);
    box(c,3.05,1.8,3.3,.22,[0x668dae,0xad7698,0xd4b77c][(c/3)%3|0],5.45);
    box(c,3.1,.22,3.3,.25,bronze,5.5);
    ball(c,3.0,.42,cream,5.2);
  }
  for(const [c,r] of [[4,4],[4,14],[17,4],[17,14]]){
    col(c,r,.38,.42,6.8,marble,3.4);box(c,r,1.5,.50,1.5,cream,7.05);
  }
  // D2: three shallow blue-marble baths; water and submerged stair edges are traversable.
  // The five human bathers spawn on these water cells, not inside blocked scenery.
  for(const c0 of [10,13,16]){
    for(let r=5;r<=8;r++)for(let c=c0;c<=c0+1;c++){
      box(c,r,3.85,.07,3.85,blueDark,.06);
      box(c,r,3.73,.055,3.73,(r+c)%2?0x76c4cf:0x8cd1db,.112);
    }
    for(const r of [4.6,8.55])box(c0+.5,r,8.2,.36,.44,marble,.20);
    for(const x of [c0-.48,c0+1.48])box(x,6.5,.42,.3,15.9,cream,.20);
    col(c0-.28,5,.12,.12,1.1,bronze,.55);
    ball(c0-.28,5,.22,bronze,1.2);
  }
  for(const [c,r] of [[9,9],[16,9]]){
    box(c,r,3.2,.65,1.6,marble,.33,true);
    for(let k=0;k<3;k++)box(c-.72+k*.7,r, .62,.10,.72,cream,.73);
  }
  sign(13,4,'D2 · Perfumed Baths');
  // D1: polished reception space, fountain sounds drifting from the garden.
  for(let c=10;c<=16;c++)box(c,13,3.82,.06,3.82,(c%2)?0xd0c9ba:0xb6b8bd,.05);
  box(11,14,8,.9,2.5,0x8e6344,.45);
  box(11,14,8.4,.23,2.9,bronze,1.02);
  for(const c of [10,11,12])a.block(c,14);
  sign(14,12,'Bathhouse Entry Hall');
  // D3 / D4: massage tables, towels, scented perfume jars.
  for(const [c,r,label] of [[5,12,'D3 · South Massage'],[5,5,'D4 · North Massage']]){
    box(c,r,6.5,1.15,2.65,0x6b493b,.79,true);
    box(c,r,6.35,.26,2.7,cream,1.48);
    for(const side of [-1,1])box(c+side*.98,r,.75,.13,2.4,marble,1.69);
    for(const dc of [-1,0,1])a.block(c+dc,r);
    for(let j=0;j<4;j++){
      col(c-1.25+j*.8,r+.8,.15,.18,.60,[0x758f91,0x9b8b6c,0xa47eaa,0x879e7a][j],.30);
    }
    sign(c,r-1,label,5.9);
  }
  box(6,1.1,2.55,.34,3.2,0x7b6b5e,.18);
  for(let r=0;r<=2;r++)for(const c of [4,6])box(c,r,.7,4,3.8,0x766b61,2.0,true);
  for(let n=0;n<4;n++)box(5,2.1-n*.65,2.5,.28,1.15,0x83756c,.16+n*.2);
  const stair=box(5,1,2.2,.28,2.4,0x463f40,.17);
  i.clickable(stair,'Staircase to D5',stairs);
  sign(5,1,'Hidden Descent',5.5);
  // D1 courtyard: trimmed hedge, marble seating, two nymph-topped water fountains.
  for(let c=12;c<=24;c+=2){if(c<17||c>20)box(c,22.5,2.8,1.7,1.8,0x3c6a48,.85);}
  for(let r=10;r<=20;r+=2)box(24.45,r,1.6,1.5,2.8,0x446e4c,.75);
  for(const [c,r] of [[17,20],[22,12]]){
    col(c,r,1.65,1.85,.65,marble,.33,true);
    col(c,r,1.34,1.34,.35,blue,.78);
    col(c,r,.4,.6,2.4,marble,1.92);
    ball(c,r,.58,marble,3.25);
    const jug=box(c+.65,r,.55,.7,.4,marble,2.85);
    jug.rotation.z=-.45;
    ball(c+.84,r,.23,0x88ced7,2.15);
    g.pointLight(c,r,{color:0xffefd8,intensity:.9,range:18,height:4.6});
  }
  for(const [c,r] of [[12,20],[20,19],[22,17]]){
    box(c,r,4.4,.42,1.3,marble,1.25,true);
    box(c-.85,r,.65,1.05,1.2,marble,.53);
    box(c+.85,r,.65,1.05,1.2,marble,.53);
  }
  sign(21,21,'D1 · Nymph Courtyard');
  for(const [c,r] of [[8,12],[18,11],[6,8]])g.pointLight(c,r,{color:0xffd9aa,intensity:1.2,range:19,height:6});
}
