// FLAMING FIST BARRACKS — permanent landmark, outside garrison campus.
// The shared V9 engine provides the renderer, collision, movement, NPC manager,
// labels, camera, and autonomous patrol scheduler. Nothing here creates a new
// Three.js engine or registers an independent input handler.

const SCARLET=0x9c3038;
const GUARD=0xae3b3e;
const PATROL=(points,speed=3.5)=>({points,speed,pause:.08});
const patrols=[
  PATROL([[42,83],[42,44],[42,24],[44,20],[42,44]]),
  PATROL([[45,81],[45,45],[45,25],[45,19],[45,45]]),
  PATROL([[40,79],[40,43],[24,43],[11,42]]),
  PATROL([[47,77],[47,43],[69,43],[81,43]]),
  PATROL([[38,73],[38,52],[22,52],[9,52]]),
  PATROL([[50,71],[50,60],[67,60],[81,60]]),
  PATROL([[39,67],[39,60],[9,60],[9,67]]),
  PATROL([[49,65],[49,68],[66,68],[80,68]]),
  PATROL([[38,59],[38,42],[28,42],[28,39]]),
  PATROL([[49,56],[49,44],[56,44],[56,42]]),
  PATROL([[40,47],[40,24],[27,23],[9,22]]),
  PATROL([[48,47],[48,23],[65,22],[79,22]]),
  PATROL([[42,42],[42,24],[44,22],[44,29]]),
  PATROL([[51,42],[69,42],[81,42],[81,24]]),
];
const guardStarts=[
  [42,83],[45,81],[40,79],[47,77],[38,73],[50,71],[39,67],
  [49,65],[38,59],[49,56],[40,47],[48,47],[42,42],[51,42],
  [40,82],[47,82],[40,76],[47,74],[41,70],[45,70],
  [41,63],[47,62],[41,56],[47,54],[40,49],[49,50],
  [26,43],[33,43],[58,43],[65,43],[31,24],[63,23]
];
const sergeants=[[40,34],[48,34],[41,53],[47,69],[26,22],[67,22]];
const captains=[[44,24],[22,22],[73,22]];

export const BARRACKS_NPCS=Object.freeze({
  panelTitle:'Flaming Fist · Garrison Command',
  restoreLabel:'Restore Duty Roster',
  patrolControls:true,
  initial:[
    ...captains.map(([c,r],i)=>({id:`barracks-captain-${i+1}`,
      name:`Flaming Fist Captain ${i+1}`,role:'Garrison Captain',
      faction:'flaming-fist',archetype:'captain',color:0xbe4740,start:[c,r]})),
    ...sergeants.map(([c,r],i)=>({id:`barracks-sergeant-${i+1}`,
      name:`Flaming Fist Sergeant ${i+1}`,role:'Squad Sergeant',
      faction:'flaming-fist',archetype:'sergeant',color:0x9d363a,start:[c,r]})),
    ...guardStarts.map(([c,r],i)=>({id:`barracks-guard-${i+1}`,
      name:`Flaming Fist Guard ${i+1}`,role:i<14?'Rapid Response Patrol':'Flaming Fist Guard',
      faction:'flaming-fist',archetype:'fist-soldier',color:GUARD,start:[c,r],
      ...(i<patrols.length?{patrol:patrols[i]}:{})})),
  ],
  spawnables:[
    {id:'reinforcement-guard',name:'Flaming Fist Guard',role:'Reserve Guard',
      faction:'flaming-fist',archetype:'fist-soldier',color:GUARD,limit:75,
      spawnArea:{minC:40,maxC:49,minR:45,maxR:85}},
    {id:'reinforcement-sergeant',name:'Flaming Fist Sergeant',role:'Squad Sergeant',
      faction:'flaming-fist',archetype:'sergeant',color:0x9e3b42,limit:12,
      spawnArea:{minC:39,maxC:49,minR:22,maxR:44}},
    {id:'reinforcement-captain',name:'Flaming Fist Captain',role:'Garrison Captain',
      faction:'flaming-fist',archetype:'captain',color:0xb74437,limit:6,
      spawnArea:{minC:37,maxC:52,minR:22,maxR:43}},
  ],
});

const CABIN_THEMES=[
  {name:'The Golden Standard',color:0xf0e2bc,trim:0xc7a05d,roof:0x374850,kind:'palace'},
  {name:'Sapphire Hall',color:0x6786a8,trim:0xc0b798,roof:0x263f63,kind:'spire'},
  {name:'Rosewatch Lodge',color:0xc66f7c,trim:0xdac4a3,roof:0x6c3946,kind:'manor'},
  {name:'Emerald Bastion',color:0x598273,trim:0xd2bd83,roof:0x2e5144,kind:'keep'},
  {name:'Ivory House',color:0xd8d0b8,trim:0x987a5c,roof:0x58616d,kind:'villa'},
  {name:'Copper Guard',color:0xb47855,trim:0xd1a770,roof:0x487a72,kind:'dome'},
  {name:'Violet Hall',color:0x726384,trim:0xc6ab87,roof:0x423954,kind:'spire'},
  {name:'Redoubt of Dawn',color:0xbf5d4b,trim:0xdfbe8a,roof:0x62453f,kind:'keep'},
  {name:'The Broken Company',color:0x604631,trim:0x4d3429,roof:0x292522,kind:'ruin'},
  {name:'Silvercross Lodge',color:0x9aabb0,trim:0xd8cab6,roof:0x3b4f5b,kind:'manor'},
  {name:'Marigold Watch',color:0xc9a04e,trim:0xeee0b1,roof:0x7a5d37,kind:'villa'},
  {name:'Crimson Crest',color:0x922c36,trim:0xd1aa77,roof:0x4f2534,kind:'keep'},
  {name:'Skyglass Hall',color:0x88afb4,trim:0xe1d9c4,roof:0x4c7682,kind:'dome'},
  {name:'Obsidian Spire',color:0x454454,trim:0xc9bdad,roof:0x242632,kind:'spire'},
  {name:'Forest Sentinels',color:0x697944,trim:0xc6b07f,roof:0x414b36,kind:'manor'},
  {name:'Pale Lion House',color:0xd5bf97,trim:0xc09e64,roof:0x6c614c,kind:'palace'},
  {name:'Azure Citadel',color:0x426a92,trim:0xc1b5a8,roof:0x2b4359,kind:'keep'},
  {name:'The Copper Lantern',color:0xc28b6e,trim:0xe0c4a1,roof:0x6e5147,kind:'dome'},
  {name:'Winterforge House',color:0x9da7bd,trim:0xe0e3e6,roof:0x414b65,kind:'villa'},
  {name:'The Saffron Banner',color:0xc4a160,trim:0xead7a1,roof:0x654a3b,kind:'manor'},
];

export function buildFlamingFistBarracks(api){
  const {geometry:g,architecture:a,decoration:d,dimensions:dim,interactions:i}=api;
  const {columns:W,rows:H}=dim;
  const STONE=0x79736a,PALE=0xb7aa91,GOLD=0xc6a16b,IRON=0x353a3d;
  const EARTH=0x52584c,WOOD=0x5a4031,RED=SCARLET;
  const b=(c,r,w,h,depth,color,y=h/2)=>g.boxAt(c,r,w,h,depth,{color,y});
  const orb=(c,r,radius,color,y=radius)=>g.sphereAt(c,r,radius,{color,y});
  const post=(c,r,top,bottom,height,color,y=height/2)=>
    g.cylinderAt(c,r,top,bottom,height,{color,y});
  const label=(c,r,text,y=9,klass='barracks-zone-label')=>
    g.labelAt(c,r,text,{y,className:klass});
  const trim=(c,r,w,depth,color=GOLD,y=8)=>b(c,r,w,.3,depth,color,y);
  const pebble=(c,r,color=0x6c685d)=>b(c,r,3.8,.03,3.8,color,.035);

  // Stone parade spine and diagonal-footpath-free courtyards between buildings.
  for(let row=20;row<87;row++)for(let c=40;c<=49;c++){
    if((c+row)%3!==0)continue;
    pebble(c,row,(c+row)%2?0x777568:0x77776d);
  }
  for(let row of [21,22,43,44,52,60,68,76,84])for(let c=2;c<W-2;c++){
    if(c%3===0)pebble(c,row,(row+c)%4?0x64695c:0x898477);
  }
  for(let c=40;c<=49;c++)for(let r=1;r<=2;r++)pebble(c,r,PALE);
  // Rampart stones and defensive palisades remain outside the camp walking area.
  for(let r=1;r<87;r+=3){
    for(const c of [0,87]){
      b(c,r,2.0,4.0,11.6,0x665e55,2.05);
      b(c,r,2.8,.42,11.8,PALE,4.25);
      for(let off=-1;off<=1;off++)a.block(c,Math.min(87,Math.max(0,r+off)));
    }
  }
  for(let c=0;c<88;c+=2){
    if(c>=39&&c<=49)continue;
    b(c,87,8,3,1.2,0x746c5b,1.5);a.block(c,87);
  }
  for(let c=0;c<88;c+=2){
    b(c,0,8,3.5,1.3,0x716a5e,1.72);a.block(c,0);
  }

  function flag(c,r,height=9.5,color=RED){
    post(c,r,.10,.16,height,IRON,height/2);
    b(c+.64,r,4.2,3.7,.15,color,height-2.95);
    b(c+.64,r,3.2,.18,.21,GOLD,height-1.75);
    b(c+.64,r,.26,2.2,.22,GOLD,height-2.95);
    orb(c,r,.24,GOLD,height+.1);
  }
  function torch(c,r,light=0xffac65){
    post(c,r,.19,.32,3.1,IRON,1.55);
    post(c,r,.64,.55,.33,0x594438,3.24);
    const fire=orb(c,r,.43,0xffb35e,3.66);
    fire.material.emissive.setHex(light);fire.material.emissiveIntensity=1.6;
    g.pointLight(c,r,{color:light,intensity:1.7,range:23,height:3.7});
  }
  function crate(c,r,block=true){
    b(c,r,2.75,2.1,2.9,0x66503a,1.05);
    b(c,r,2.8,.22,2.95,0xab8d5b,2.16);
    for(const dx of [-.28,.28])b(c+dx,r,.13,1.9,3.1,WOOD,1.1);
    if(block)a.block(Math.round(c),Math.round(r));
  }
  function shell(l,rr,t,bb,height,{color=STONE,trimColor=GOLD,roof=IRON,roofRows=3,
     ruin=false,door=null,kind='hall',tag=null}={}){
    const entry=door??Math.floor((l+rr)/2);
    // Solid, edge-based walls. A real southern gap leads inside each building.
    a.partitionVertical(l,[],height,{start:t,stop:bb+1});
    a.partitionVertical(rr+1,[],height,{start:t,stop:bb+1});
    a.partitionHorizontal(t,[],height,{start:l,stop:rr+1});
    a.partitionHorizontal(bb+1,[entry],height,{start:l,stop:rr+1});
    for(const c of [l,rr])for(const r of [t,bb]){
      const h=height+1;
      b(c,r,1.7,h,1.7,ruin?WOOD:trimColor,h/2);
      b(c,r,2.3,.45,2.3,ruin?0x3e332b:trimColor,h+.2);
      a.block(c,r);
    }
    // Tall, opaque colored masonry panels are set into the structural shared-engine
    // collision walls. Their appearance varies by company, but movement uses
    // the true partition boundaries and southern doorway, not these meshes.
    for(let r=t;r<=bb;r++){
      b(l-.53,r,.25,height-.25,3.90,color,height/2);
      b(rr+.53,r,.25,height-.25,3.90,color,height/2);
    }
    for(let c=l;c<=rr;c++){
      b(c,t-.53,3.89,height-.25,.25,color,height/2);
      if(c!==entry)b(c,bb+.53,3.89,height-.25,.25,color,height/2);
    }
    // Brick courses, tall glazed windows and window mouldings along the facade.
    for(let c=l+2;c<rr-1;c+=3){
      if(Math.abs(c-entry)<=1)continue;
      const x=c,front=bb+.49;
      b(x,front,2.45,3.15,.20,ruin?0x191e24:0x263e4a,3.7);
      b(x,front+.02,2.8,.22,.3,ruin?WOOD:trimColor,5.45);
      b(x,front+.02,.21,3.9,.32,ruin?WOOD:trimColor,3.7);
      if(ruin){
        const broken=b(x+.16,front+.09,2.4,.14,.19,0x8b8e90,3.35);
        broken.rotation.z=.58; // empty, shattered frame
        b(x-.19,front+.11,.12,1.65,.18,0x6e7b7e,4.1);
      }else{
        b(x-.24,front+.13,.80,2.48,.08,0x577e8a,3.7);
        b(x+.24,front+.13,.70,2.48,.08,0x667f8c,3.7);
        trim(x,front,2.8,.42,trimColor,2.06);
      }
    }
    // The doorway is a genuine open 4-unit-high passage, not a solid door mesh.
    b(entry,bb+.49,3.52,height-5.0,.26,ruin?0x302823:0x39312a,(height+5)/2);
    b(entry,bb+.50,4.0,.78,.43,trimColor,height-.55);
    for(const dc of [-.47,.47])b(entry+dc,bb+.50,.25,height-2,.4,
      ruin?WOOD:trimColor,(height-2)/2);
    // Roof is restricted to the rear, giving top-down players a dollhouse view.
    if(ruin){
      for(let c=l+1;c<=rr-1;c+=2){
        if((c*7+t)%4===0)continue; // big holes where rafters have collapsed
        const slat=b(c,t+1,7.2,.52,6.5,(c%3)?0x3c3028:0x514032,height+.3);
        slat.rotation.z=(c%2?-.13:.24);
      }
      for(let c=l+2;c<=rr-2;c+=3){
        const beam=b(c,t+2,.41,3.5,7.5,WOOD,height+.2);
        beam.rotation.z=(c%2?-.52:.38);
        b(c,t+2,2.1,.29,3.0,0x3f3530,.10);
      }
    }else{
      const roofDepth=roofRows*4;
      const rc=(l+rr)/2,rz=t+(roofRows-1)/2;
      const overhang=b(rc,rz,(rr-l+2)*4,1.1,roofDepth+2,roof,height+1.0);
      overhang.rotation.z=(kind==='spire'?-.065:.018);
      trim(rc,rz,(rr-l+2)*4,roofDepth+2,trimColor,height+1.68);
      for(let c=l+1;c<rr;c+=2)b(c,rz, .14,.12,roofDepth+2,trimColor,height+1.66);
    }
    if(!ruin){
      for(let c=l+2;c<=rr-2;c+=4){
        b(c,t+.48,2.7,.13,.15,trimColor,4.7);
        b(c,t+.48,2.2,2.8,.13,0x283b43,3.2);
      }
      if(kind==='spire')for(const c of [l+1,rr-1]){
        b(c,t+1,4.8,4.5,4.8,roof,height+3.6);
        post(c,t+1,.32,1.65,5.3,trimColor,height+8.1);
      }
      else if(kind==='dome'){
        post((l+rr)/2,t+1,3.15,3.45,3.1,roof,height+3.2);
        orb((l+rr)/2,t+1,2.45,trimColor,height+5.1);
      }
      else if(kind==='keep')for(const c of [l+1,l+4,rr-4,rr-1]){
        b(c,t,2.1,1.8,2.25,trimColor,height+2.2);
      }
      else if(kind==='palace'||kind==='villa'){
        const p=b((l+rr)/2,t+1,8.0,2.0,3.1,trimColor,height+3);
        p.rotation.z=.14;
      }
    }
    if(tag)label((l+rr)/2,bb-1,tag,Math.min(height+6,18));
    return entry;
  }

  // Roman-style command headquarters dominates the entire campus.
  const HQ={l:33,r:55,t:3,b:22};
  shell(HQ.l,HQ.r,HQ.t,HQ.b,21.6,{color:0xcec3a8,trimColor:GOLD,roof:0x536372,
    roofRows:8,kind:'palace',tag:'FLAMING FIST · HQ'});
  b(44,10,91,1.9,4.8,PALE,24.3);
  b(44,10,95,.65,5.8,GOLD,25.7);
  for(let c=34;c<=54;c+=2){
    if(c===44)continue; // open centerline of HQ main portico
    a.block(c,21);
    post(c,21.35,.68,.89,17.5,0xcac0a9,9.6);
    post(c,21.35,.95,.99,.55,GOLD,18.65);
    b(c,21.35,2.2,.44,2.2,0xd0c5ad,1.15);
  }
  b(44,21.5,86,1.32,6.3,0xb2a58d,19.85);
  const pediment=b(44,21.2,31.2,3.8,2.4,0xd2bd91,23.4);
  pediment.rotation.z=.05;
  b(44,21.8,14,3.1,.32,0x9b3038,18.3);
  b(44,21.89,9.2,.32,.36,GOLD,19.0);
  b(44,21.89,.6,1.8,.38,GOLD,18.35);
  post(44,8.5,5.5,7.2,5.8,0x7a8791,28.0);
  orb(44,8.5,4.4,0xb3a277,32.2);
  for(const c of [35.4,52.6]){
    b(c,8.5,4.6,10.0,4.9,0x8b9699,28.1);
    post(c,8.5,1.6,2.2,6,GOLD,35.6);
    flag(c,22.9,11.8,RED);
  }
  // Within the accessible HQ: command table, map, counters, and standards.
  b(44,16,11,1.7,7.2,0x644333,.9);for(let c=43;c<=45;c++)a.block(c,16);
  b(44,16,8.4,.09,5.4,0xc4ad83,1.86);
  b(44,16,4.2,.11,2.0,0x66888b,1.96);
  for(const [c,r] of [[37,7],[51,7],[37,14],[51,14]]){
    post(c,r,.54,.73,6.0,0xc8ba9d,3.0);a.block(c,r);
  }
  for(const [c,r] of [[36,24],[52,24]])torch(c,r);

  // Library and dining hall to the west; armoury and infirmary east of HQ.
  shell(4,17,5,18,11.5,{trimColor:0xc7a77d,roof:0x53677c,roofRows:5,kind:'spire',tag:'LIBRARY'});
  shell(20,31,7,19,11.5,{trimColor:0xcfaa78,roof:0x704c43,roofRows:4,kind:'villa',tag:'DINING HALL'});
  shell(59,71,7,19,12.5,{trimColor:0x9eaaa7,roof:0x3f4b56,roofRows:5,kind:'keep',tag:'ARMOURY'});
  shell(74,84,7,19,12.0,{trimColor:0xd9cbbb,roof:0x5b7383,roofRows:5,kind:'dome',tag:'INFIRMARY'});
  // Indoor tactical props sit inside reachable doorways, not across them.
  for(const [c,r] of [[6,14],[10,14],[14,14],[6,9],[10,9],[14,9]]){
    b(c,r,2.8,4.8,2.0,WOOD,2.4);a.block(c,r);
    for(const y of [1.2,2.7,4.0])b(c,r+0.26,2.4,.18,1.7,GOLD,y);
  }
  for(const [c,r] of [[22,15],[25,15],[28,15],[23,11],[28,11]]){
    b(c,r,5.2,1.1,2.8,0x76533a,.7);a.block(c,r);
  }
  for(const [c,r] of [[61,13],[65,13],[69,13]]){
    b(c,r,2.25,4.3,1.2,WOOD,2.15);a.block(c,r);
    for(let k=0;k<3;k++)b(c,r,1.75,.15,.24,0x9ca5a5,1.6+k*.8);
  }
  for(const [c,r] of [[76,12],[80,12],[76,16],[80,16]]){
    b(c,r,3.0,.8,5.0,0xa7aca7,.8);a.block(c,r);
    b(c,r-.15,2.7,.11,4.2,0xe2ddcf,1.25);
  }

  // Supply depot / logistics shop and real loading platforms.
  shell(4,20,25,37,12.4,{trimColor:0xbb9866,roof:0x57544b,roofRows:5,
    kind:'keep',tag:'LOGISTICS SHOP'});
  for(const [c,r] of [[6,33],[10,33],[14,33],[18,33],[7,28],[13,28],[17,28]])crate(c,r);
  for(const [c,r] of [[8,40],[12,40],[17,40]]){
    crate(c,r);b(c,r,3.5,.22,4.2,GOLD,2.35);
  }
  // Stacked wagons and supply crates just off the wide parade boulevard.
  for(const [c,r] of [[7,42],[19,42],[70,44],[81,44]]){
    b(c,r,6.6,1.1,10.0,0x78614a,1.15);a.block(c,r);
    b(c,r,6.5,.27,10,0xa5895e,1.87);
    for(const dx of [-1.4,1.4])post(c+dx/4,r,.94,.94,.45,IRON,.89);
  }

  // Training yard (outdoors). Rows of proper person-shaped dummies.
  label(30,25,'TRAINING GROUND',10);
  function dummy(c,r,heavy=false){
    post(c,r,.25,.4,4.6,WOOD,2.3);
    post(c,r,1.0,1.0,.50,IRON,.25);
    const cross=b(c,r,3.4,.46,.56,WOOD,2.85);
    cross.rotation.y=(c+r)%2?.11:-.11;
    orb(c,r,.48,heavy?0x80665b:0x9b896f,4.36);
    b(c,r,1.45,2.1,.78,heavy?0x756050:0x998269,2.16);
    b(c,r,1.1,.35,.86,RED,2.25);
    a.block(c,r);
  }
  for(const [c,r] of [[26,28],[30,28],[34,28],[38,28],
    [26,33],[30,33],[34,33],[38,33],[26,38],[30,38],[34,38],[38,38]]){
    dummy(c,r,(c+r)%3===0);
  }
  // Practice blade racks and low hurdles.
  for(const c of [24,36])for(const r of [30,35]){
    b(c,r,2.3,2.4,3.1,WOOD,1.2);a.block(c,r);
    b(c,r,3.3,.24,3.2,GOLD,2.48);
  }
  for(const c of [28,33])b(c,40,6.2,.33,2.2,0x887153,.55);

  // Open-air combat arena: generous court; continuous perimeter barriers have
  // true openings on the north, south, east and west, so players can enter.
  const arena={l:46,r:67,t:25,btm:41};
  a.partitionVertical(arena.l,[32,33,34],2.3,{start:arena.t,stop:arena.btm+1});
  a.partitionVertical(arena.r+1,[32,33,34],2.3,{start:arena.t,stop:arena.btm+1});
  a.partitionHorizontal(arena.t,[56,57],2.3,{start:arena.l,stop:arena.r+1});
  a.partitionHorizontal(arena.btm+1,[56,57],2.3,{start:arena.l,stop:arena.r+1});
  label(56,27,'COMBAT ARENA',13);
  for(let n=0;n<36;n++){
    const ang=n*Math.PI/18;
    const c=56.5+Math.cos(ang)*9.3,r=33+Math.sin(ang)*6.3;
    const rail=post(c,r,.17,.23,2.2,(n%3)?0x785644:0xab8158,1.1);
    if(n%2===0)b(c,r,1.0,.27,1.4,0xc2a577,2.25);
  }
  for(let i=0;i<5;i++){
    for(const c of [47.5,66.5]){
      b(c,27+i*2.4,2.0,.65,6.5,0x877562,.34);
    }
  }
  for(const [c,r] of [[52,33],[60,33]]){
    b(c,r,2.8,.06,2.8,0x85353b,.085);
    b(c,r,.38,.07,2.9,GOLD,.1);
  }
  // Banners, braziers and light sources around the courtyard.
  for(const [c,r] of [[4,23],[19,23],[59,22],[82,22],[22,40],[38,40],
      [47,44],[67,44],[39,82],[49,82]]){
    flag(c,r,(r>=40?7.5:9));
  }
  for(const [c,r] of [[26,24],[38,24],[57,24],[68,24],[23,44],[74,43]])torch(c,r);

  // COMPANY QUARTERS: 4 columns x 5 rows; a central parade spine remains open.
  // Company 1 receives additional terraces and golden columns. Company 9's
  // timber ruin is fully broken: holes in the roof and empty shattered frames.
  const xStarts=[4,22,55,72],rowStarts=[45,53,61,69,77];
  let companyCount=0;
  const footprint=[];
  for(let row=0;row<5;row++)for(let col=0;col<4;col++){
    const number=++companyCount,theme=CABIN_THEMES[number-1];
    const l=xStarts[col],rr=(number===1?18:l+12);
    const t=rowStarts[row],btm=t+(number===1?6:5);
    footprint.push({number,l,rr,t,btm});
    const ruin=number===9;
    const height=number===1?14.5:ruin?5.2:8.3+(number%4)*.65;
    shell(l,rr,t,btm,height,{
      color:theme.color,trimColor:theme.trim,roof:theme.roof,kind:theme.kind,
      roofRows:number===1?4:3,ruin,tag:`COMPANY ${number}`,
    });
    // Distinct colored exterior front walls and heraldic trims. The southern
    // door gap stays empty in the tactical wall edges.
    for(let c=l+1;c<rr;c++){
      if(Math.abs(c-Math.floor((l+rr)/2))<=1)continue;
      b(c,btm+.46,3.72,2.0,.18,theme.color,2.0);
      if(!ruin)b(c,btm+.47,3.6,.15,.2,theme.trim,3.12);
    }
    if(number===1){
      // The most prestigious company cabin by far: ornate golden entrance,
      // green marble portico, twin corner watch-turrets and a tall blue dome.
      b(11,48,58,1.25,13.0,0xd6caa5,16.0);
      for(const c of [5.2,7.8,10.4,13.0,15.6,17.1]){
        post(c,51.2,.45,.70,10.0,0xece1c3,6.0);
        a.block(Math.round(c),51);
        post(c,51.2,.78,.82,.28,0xcda65c,11.3);
      }
      post(11,47,3.5,4.3,5.0,0x42627b,19.6);
      orb(11,47,3.05,0xcab780,23.8);
      for(const c of [5,17]){
        b(c,46,4.1,7.0,4.2,0xe8d7b5,19.2);
        post(c,46,1.4,2.2,4.3,0xcfb46e,24.9);
      }
      for(const c of [6,16]){
        b(c,52,2.3,.24,2.9,0x436f4b,.10);
        orb(c,52,.60,0xe8d17b,.69);
      }
      for(const c of [5,17])flag(c,52,10.6,RED);
      trim(11,51.7,55,1.3,GOLD,11.8);
    }else if(ruin){
      // Company 9: broken windows, shattered roof and askew wood beams.
      for(let c=l+1;c<rr;c+=2){
        const timber=b(c,t+.9,.25,4.3,.35,WOOD,2.15);
        timber.rotation.z=((c%3)-1)*.30;
      }
      b(l+2,t+2,4.0,.18,6.1,0x564335,3.0).rotation.z=-.43;
      b(rr-2,t+2,5.0,.20,7.0,0x473528,3.45).rotation.z=.55;
      for(const [c,r] of [[l+2,t+2],[l+5,t+3],[rr-3,t+1]]){
        b(c,r,2.45,.4,2.0,0x342c27,.2);a.block(c,r);
      }
      b((l+rr)/2,btm+.48,7.0,.24,.27,0x51402f,2.9).rotation.z=.15;
    }else{
      // Different rooflines, crests and materials for all remaining companies.
      if(number%3===0)post((l+rr)/2,t+.5,.42,.68,4.4,theme.trim,height+4.3);
      if(number%3===1)orb((l+rr)/2,t+1,1.0,theme.trim,height+3.2);
      for(const c of [l+1,rr-1]){
        b(c,t+1,2.45,1.5,2.3,theme.trim,height+2.6);
      }
    }
    // An accessible mess-table/chest inside each cabin, always away from entry.
    const interiorC=l+3;
    b(interiorC,btm-1,3.1,1.0,2.3,ruin?0x4b392a:0x69513b,.55);
    a.block(interiorC,btm-1);
    if(number%2===0){
      b(rr-2,btm-1,1.6,1.6,2.1,0x624a39,.83);a.block(rr-2,btm-1);
    }
  }
  if(companyCount!==20)throw new Error('Barracks must have exactly twenty companies');
  // Central checkpoint entrance and mustering muster line. Walkable between
  // the two outer gate bastions and along the full north/south parade street.
  for(const c of [35,53]){
    b(c,84,6.9,10.0,5.8,0x72736f,5.0);
    b(c,84,8.0,1.2,6.8,0xa79b85,10.5);
    post(c,84,1.3,1.75,4.2,0xbeb29a,12.8);
    a.block(c,84);
  }
  b(44,85,35.0,.65,1.8,0x997351,11.6);
  b(44,85,35.0,.34,1.9,GOLD,12.15);
  for(const [c,r] of [[37,85],[51,85]])torch(c,r);
  label(44,84,'GARRISON ENTRANCE',8);
  // The camp's torch-lit urgency is accompanied by a watch bell and clear roads.
  post(53,44,.29,.34,14.2,IRON,7.1);
  const bell=post(53,44,1.05,.7,1.35,GOLD,13.6);
  bell.rotation.z=.12;
  b(53,44,2.8,.35,2.8,0x746656,.2);
  a.block(53,44);
  g.pointLight(44,27,{color:0xffc185,intensity:2.7,range:58,height:14});
  g.pointLight(44,52,{color:0xf5aa7a,intensity:2.2,range:55,height:11});
  // High-alert control really changes the speed of automatic patrols, rather
  // than merely showing a notification. Remains optional and reversible.
  let highAlert=false;
  i.panelAction({id:'barracks-alarm',label:()=>highAlert?'Stand Down Alert':'Declare High Alert',
    run:()=>{
      highAlert=!highAlert;
      for(const entry of BARRACKS_NPCS.initial){
        if(entry.patrol)entry.patrol.speed=highAlert?5.2:3.5;
      }
      document.querySelector('#move-status').textContent=highAlert?
        'High alert: Flaming Fist patrols are running between duty posts.':
        'The garrison stands down. Patrols return to their regular pace.';
    }});
}
