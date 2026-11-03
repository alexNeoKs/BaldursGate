// HOUSE OF GRIEF — reception and Mapping Room. A permanent city landmark.
// The Cloister is a separate scene and intentionally has no LANDMARKS entry.
// Shared renderer, movement, NPC tools, dynamic doors, and travel live in engine.js.

export const HOUSE_GRIEF_NPCS=Object.freeze({
  panelTitle:'House of Grief · GM',restoreLabel:'Restore House Attendants',
  initial:[
    {id:'mirie',name:'Mirie',role:'Attendant of Grief',archetype:'mirie',
      faction:'sharran',color:0x83738e,start:[8,12]},
    ...[[3,11],[14,11],[15,7]].map(([c,r],i)=>({
      id:`grief-guard-${i+1}`,name:`Grief Guard ${i+1}`,role:'House Guard',
      faction:'sharran',archetype:'grief-guard',color:0x373448,start:[c,r]})),
    {id:'grief-inquisitor',name:'Inquisitor of Grief',role:'Sharran Inquisitor',
      faction:'sharran',archetype:'inquisitor',color:0x493359,start:[12,6]},
    {id:'house-shadowheart',name:'Shadowheart',role:'Cleric of Shar',
      faction:'sharran',archetype:'shadowheart',color:0x716081,start:[4,6]},
  ],
  spawnables:[
    {id:'house-guard-spawn',name:'Grief Guard',role:'House Guard',faction:'sharran',
      archetype:'grief-guard',color:0x373448,limit:8,spawnArea:{minC:2,maxC:15,minR:10,maxR:16}},
  ],
});

export function buildHouseOfGrief(api){
  const {geometry:g,architecture:a,decoration:d,interactions:i}=api;
  const dark=0x27222a,stone=0x63565a,stoneLit=0x9f8383,wood=0x3e2a28;
  const bronze=0x8f7162,velvet=0x2c2737,iron=0x27282e,oldGold=0xa68b65;
  const b=(c,r,w,h,z,color,y=h/2)=>g.boxAt(c,r,w,h,z,{color,y});
  const ball=(c,r,rad,color,y=rad)=>g.sphereAt(c,r,rad,{color,y});
  const post=(c,r,rt,rb,h,color,y=h/2)=>g.cylinderAt(c,r,rt,rb,h,{color,y});

  // Reception (south, rows 9–17) and Mapping Room (north, rows 4–8).
  // Two independent locked doors occupy the original partition's gaps.
  a.partitionHorizontal(9,[5,12],5.6);
  const doorLeft=a.doorHorizontal(9,5,{height:5.0});
  const doorRight=a.doorHorizontal(9,12,{height:5.0});
  i.clickable(doorLeft.mesh,'Left Mapping Room Door',()=>doorLeft.toggle());
  i.clickable(doorRight.mesh,'Right Mapping Room Door',()=>doorRight.toggle());
  i.panelAction({id:'door-left',label:()=>`Left mapping door · ${doorLeft.open?'Close':'Open'}`,
    run:()=>doorLeft.toggle()});
  i.panelAction({id:'door-right',label:()=>`Right mapping door · ${doorRight.open?'Close':'Open'}`,
    run:()=>doorRight.toggle()});

  // Concealed northern corridor, separated by a stone-slab secret passage.
  a.partitionHorizontal(4,[9],6.0);
  const secret=a.doorHorizontal(4,9,{height:5.3,secret:true});
  // Within the secret passage, do not add an off-map landmark or another engine.
  const openSecret=()=>{
    secret.setOpen(!secret.open);
    document.querySelector('#move-status').textContent=secret.open?
      'A hidden wall slides aside. The passage to the Cloister is revealed.':
      'The concealed entrance seals again.';
  };
  i.panelAction({id:'concealed-stone',label:()=>secret.open?'Seal secret stone passage':'Press concealed stone switch',run:openSecret});
  i.panelAction({id:'enter-cloister',label:'Descend into the Cloister of Sombre Embrace',
    visible:()=>secret.open,run:()=>i.travel('cloister-of-sombre-embrace')});

  // Flagstone floors, ceremonial carpet runners and pale tile in Mapping Room.
  for(let r=0;r<18;r++)for(let c=0;c<18;c++){
    if((c+r)%6===0)b(c,r,3.78,.025,3.78,r<9?0x61585f:0x6b5b58,.025);
    if(r>=10&&r<=16&&c>=7&&c<=10)b(c,r,3.88,.035,3.88,0x352333,.048);
    if(r>=5&&r<=8&&c>=8&&c<=9)b(c,r,3.88,.03,3.88,0x4b3449,.05);
  }
  d.rug(9,14,4,3,g.material(0x3c2735));
  // Heavy carved wooden counter, sales/consultation ledgers, and notice boards.
  for(let c=6;c<=11;c++){
    b(c,13,3.82,2.05,2.45,wood,1.025);a.block(c,13);
    b(c,13,3.8,.26,2.65,oldGold,2.15);
    if(c%2===0)b(c,13,2.1,.08,.11,0x292026,1.08);
  }
  for(const [c,r] of [[6,12],[11,12]]){
    b(c,r,1.45,.20,1.07,0xc1b49e,1.10);
    b(c,r,.88,.12,1.13,iron,1.28);
  }
  // Carved cabinets against side walls, with purple draperies and murals.
  for(const [c,r] of [[1,12],[16,12],[1,15],[16,15]]){
    b(c,r,2.65,3.7,2.9,wood,1.90);b(c,r,2.8,.32,3.04,oldGold,3.83);a.block(c,r);
    for(const dy of [1.5,2.5])b(c,r,2.04,.12,.12,bronze,dy);
  }
  for(const [c,r] of [[3,9.8],[14,9.8],[2,4.2],[15,4.2]]){
    b(c,r,3.2,5.3,.28,velvet,3.15);
    b(c,r,3.8,.24,.37,oldGold,5.77);
    b(c-.38,r, .12,4.7,.36,oldGold,3.0);
  }
  for(const [c,r] of [[5.7,10.1],[12.3,10.1]]){
    b(c,r,.48,6.4,.68,stoneLit,3.2);
    b(c,r,1.1,.46,.94,stone,6.5);
  }
  // Wooden lintels and historical relief paintings evoke the attached
  // reference without a solid roof blocking the orthographic tabletop view.
  for(let c=2;c<=16;c+=4){
    b(c,11.0,1.05,.38,15.5,0x392728,7.20);
    b(c,5.0,1.05,.38,8.9,0x392728,7.20);
  }
  for(const [c,r] of [[4,10.15],[13,10.15],[3,4.18],[14,4.18]]){
    b(c,r,2.85,3.25,.17,0x846b58,4.72);
    b(c,r,2.4,2.77,.19,(c%2)?0x38313e:0x3a2b36,4.70);
    b(c,r,1.2,1.85,.22,0x686071,4.72);
    b(c,r,.22,1.15,.24,0xa68b65,4.95);
  }
  // Low ceremonial brazier lights, wall torches and warm candle groups.
  for(const [c,r] of [[2,10],[15,10],[3,5],[14,5],[2,16],[15,16]]){
    post(c,r,.29,.42,1.60,iron,.8);
    const flame=ball(c,r,.33,0xf3a45a,1.9);
    flame.material.emissive.setHex(0xb75a25);flame.material.emissiveIntensity=2.4;
    g.pointLight(c,r,{color:0xff9d60,intensity:1.45,range:23,height:2.4});
    a.block(c,r);
  }
  // Mapping Room: intentionally almost empty; one stone bench faces a blank wall.
  b(9,6,9.3,.58,2.25,0x767071,.87);
  b(7.8,6,1.15,.95,2.25,0x58525a,.58);
  b(10.2,6,1.15,.95,2.25,0x58525a,.58);
  for(const c of [8,9,10])a.block(c,6);
  b(8.5,4.3,8.2,5.75,.38,0x4e444f,3.4);
  b(8.5,4.18,8.5,.32,.62,0x8c747e,6.47);
  // Secret switch is tiny and partially camouflaged in the bench-side wall.
  const hiddenSwitch=b(10.7,4.92,.50,.41,.29,0x514953,1.62);
  b(10.7,4.93,.10,.28,.34,0x887086,1.66);
  i.clickable(hiddenSwitch,'Concealed Stone Switch',openSecret);
  // Solid masonry flanks the concealed corridor. There are no phantom
  // inaccessible rooms behind the Mapping Room's north partition.
  for(let r=0;r<=3;r++)for(let c=0;c<18;c++){
    if(c>=8&&c<=10)continue;
    b(c,r,3.98,8.0,3.98,(c+r)%3===0?0x38323d:0x302c37,4.0);
    a.block(c,r);
  }
  // Serpentine stone passage behind the revealed entrance.
  for(let r=0;r<=3;r++){
    b(8,r,1.35,4.2,3.85,dark,2.13);a.block(8,r);
    b(10,r,1.35,4.2,3.85,dark,2.13);a.block(10,r);
    b(9,r,3.8,.025,3.8,0x453c4b,.055);
  }
  // A clickable descent marker links the two separate scene modules.
  // It cannot be used before the hidden stone has been triggered.
  const descent=b(9,1.1,2.35,2.8,.48,0x75598e,2.4);
  b(9,1.08,3.2,.32,.62,oldGold,3.91);
  i.clickable(descent,'Descent to the Cloister',()=>{
    if(secret.open)i.travel('cloister-of-sombre-embrace');
    else document.querySelector('#move-status').textContent='The hidden stone doorway is still sealed.';
  });
  g.pointLight(9,2,{color:0x8b6ab5,intensity:2.5,range:21,height:4.6});
  for(const [c,r] of [[4,4],[13,4],[2,17],[15,17]])post(c,r,.32,.48,3.1,0x484047,1.55);
  g.labelAt(9,7,'Mapping Room',{y:5.6});
}
