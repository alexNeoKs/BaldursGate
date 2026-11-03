// Wyrm's Crossing — the Chionthar checkpoint. Persistent named landmark scene.
// No renderer, camera, input handler or movement logic lives in this module.
// Everything is placed through the existing shared-engine scene builder API.

const FIST = 0x9b3436;
const GUARD_SPOTS = [
  [5,9],[10,9],[4,11],[11,11],[5,13],
  [10,13],[4,15],[11,15],[6,16],[9,16],
];

export const WYRM_NPC_CONFIG = Object.freeze({
  panelTitle:'Wyrm’s Crossing NPCs',
  initial: [
    {id:'fist-captain',name:'Flaming Fist Captain',role:'Checkpoint Commander',
      faction:'flaming-fist',archetype:'captain',color:0xc14d3b,start:[7,8]},
    ...GUARD_SPOTS.map(([c,r],i)=>({
      id:`fist-soldier-${i+1}`,
      name:`Flaming Fist Soldier ${i+1}`,
      role:'Flaming Fist Guard',faction:'flaming-fist',
      archetype:'fist-soldier',color:FIST,start:[c,r],
    })),
  ],
  spawnables:[
    {id:'refugee',name:'Refugee',role:'Displaced Civilian',faction:'civilian',
      archetype:'refugee',color:0x8e8973,limit:36,
      spawnArea:{minC:2,maxC:13,minR:22,maxR:27}},
    {id:'reyna',name:'Reyna',role:'Special NPC',faction:'civilian',
      archetype:'reyna',color:0x367f81,unique:true,limit:1,
      spots:[[3,25],[4,24],[3,23]],
      spawnArea:{minC:2,maxC:13,minR:22,maxR:27}},
    {id:'zelvor',name:'Zelvor',role:'Special NPC',faction:'civilian',
      archetype:'zelvor',color:0x507850,unique:true,limit:1,
      spots:[[12,25],[11,24],[12,23]],
      spawnArea:{minC:2,maxC:13,minR:22,maxR:27}},
    {id:'volo',name:'Volo',role:'Special NPC · Bard',faction:'civilian',
      archetype:'volo',color:0x6660a3,unique:true,limit:1,
      spots:[[6,24],[9,24],[7,23]],
      spawnArea:{minC:2,maxC:13,minR:22,maxR:27}},
  ],
});

export function buildWyrmsCrossing(api){
  const {geometry:g,architecture:a,furniture:f,decoration:d,materials:M}=api;
  const W=api.dimensions.columns, H=api.dimensions.rows;
  const stone=0x666b6e, stoneLight=0x90908b, stoneDark=0x393f46;
  const soot=0x262b30, iron=0x272e34, gold=0xc2a16a;
  const water=0x244551, waterLight=0x37616b;

  const block=(c,r)=>a.block(c,r);
  const box=(c,r,w,h,depth,color,y=h/2,blocking=false)=>
    g.boxAt(c,r,w,h,depth,{color,y,blocking});
  const ball=(c,r,rad,color,y=rad)=>g.sphereAt(c,r,rad,{color,y});
  const post=(c,r,rt,rb,h,color,y=h/2)=>g.cylinderAt(c,r,rt,rb,h,{color,y});

  // Chionthar water lies three units below the high stone bridge. Outside-grid
  // scenery is visual-only: the same walkable grid still governs every actor.
  box(-10,13.5,76,.28,144,water,-2.45);
  box(25,13.5,76,.28,144,water,-2.45);
  for(let r=0;r<H;r+=2){
    for(const c of [-7,-4,19,22]){
      const wave=box(c+(r%4)*.11,r+.12,2.8,.028,.13,(r%4===0)?waterLight:0x507784,-2.25);
      wave.rotation.y=((r%3)-1)*.18;
    }
  }

  // Bridge parapets. All edge cells are blocked for miniatures; no character
  // can stand with their base inside the stone safety rail or step off the bridge.
  for(let r=0;r<H;r++){
    block(0,r);block(W-1,r);
  }
  for(const c of [-.53,W-.47]){
    box(c,13.5,2,2.4,H*4+2,stoneDark,1.16);
    box(c,13.5,2.55,.40,H*4+2,stoneLight,2.42);
    for(let r=0;r<H;r+=3){
      box(c,r,2.45,2.5,2.65,stone,3.7);
      box(c,r,2.72,.34,2.83,stoneLight,5.12);
    }
  }

  // Cobblestone courses, stained drain lines, raised bridge center strip.
  for(let r=0;r<H;r++){
    if(r%2===0){
      for(let c=2;c<W-2;c+=2){
        box(c+.5,r-.35,4.2,.024,.065,stoneLight,.012);
        box(c+.5,r+.35,3.35,.02,.065,stoneDark,.013);
      }
    }
    box(7.5,r,3.0,.035,3.8,0x74716b,.025);
    if(r%4===0){
      box(1,r,1.5,.02,3.4,soot,.024);
      box(14,r,1.5,.02,3.4,soot,.024);
    }
  }

  // Monumental shut gate. The common wall-edge system seals the entire
  // row-5 boundary, so neither diagonal nor straight paths can pass the door.
  a.partitionHorizontal(5,[],8.7);
  box(7.5,4.5,42,12.0,1.55,0x302c2c,6.2);
  box(7.5,4.5,44,1.2,2.1,stoneDark,12.4);
  for(const c of [2.05,12.95]){
    // Towers and iron-socketed bases.
    box(c,4.1,10.8,11.4,10.2,stoneDark,5.65);
    box(c,4.1,11.65,1.5,11.05,stoneLight,11.98);
    box(c,4.1,10.1,1.4,9.8,stone,13.25);
    for(const dx of [-1.1,0,1.1]){
      box(c+dx,4.1,1.45,2.35,2.0,stoneLight,15.1);
    }
    box(c,6.1,2.2,3.1,1.2,iron,5.2);
    box(c,6.1,1.48,2.5,1.32,0x895e4b,5.12);
    // Towers occupy real grid cells and cannot be walked through.
    for(const row of [3,4,5]){
      block(Math.round(c),row);
    }
  }
  // Iron double leaves, vertical bars, horizontal locking beams and big hinges.
  const centerC=7.5;
  box(centerC,4.52,31.9,9.7,1.18,0x392f2d,5.05);
  box(centerC,4.22,32.2,8.65,.45,iron,5.10);
  box(centerC,4.58,.8,10.0,2.0,stoneLight,5.2);
  for(let j=0;j<17;j++){
    const c=3.65+j*.48;
    box(c,4.45,.28,9.5,.66,0x74716a,5.15);
    ball(c,4.35,.15,gold,9.28);
  }
  for(const y of [2.6,5.35,8.1]){
    box(centerC,4.18,31.8,.36,.75,iron,y);
    for(const c of [3.9,5.1,6.3,7.5,8.7,9.9,11.1])ball(c,4.08,.16,gold,y);
  }
  box(centerC,4.03,1.2,7.7,1.04,0x181e22,5.1);
  for(const c of [7.05,7.95]){
    box(c,4.02,.46,1.95,.65,gold,5.1);
    ball(c,4.0,.43,gold,6.20);
  }
  // Massive crossbar and lock, clearly signalling that the bridge is sealed.
  box(centerC,3.94,27.5,.96,1.1,0x604b37,7.3);
  box(centerC,3.76,1.65,1.5,1.35,gold,7.23);

  // Watch rooms on each side of the roadway; wall gaps at row 11 are real
  // doorways. The small door frames do not block movement between cells.
  a.partitionVertical(3,[11,12],4.6,{start:8,stop:16});
  a.partitionVertical(13,[11,12],4.6,{start:8,stop:16});
  for(const columns of [{start:0,stop:3},{start:13,stop:16}]){
    a.partitionHorizontal(8,[],4.4,columns);
    a.partitionHorizontal(16,[],4.4,columns);
  }
  // Retaining stones and lintels reinforce these side chambers visually.
  for(const c of [2.5,12.5]){
    for(const r of [9,14])box(c,r,.74,5.4,.74,stoneLight,2.7);
    box(c,11.5,.85,.64,8.1,stoneLight,5.1);
  }
  f.table(1,10);f.chest(1,14);
  f.table(14,10);f.barrel(14,14);
  for(const [c,r] of [[1,12],[14,12]])d.candles(c,r);

  // Flameless, enclosed roadside braziers (warm light through smog).
  function brazier(c,r){
    post(c,r,.77,.45,1.32,iron,.66);
    post(c,r,1.05,.88,.29,gold,1.46);
    ball(c,r,.62,0xe58c35,2.02);
    ball(c,r,.40,0xffd69b,2.23);
    a.addLight('warm',c,r,3.2);
  }
  for(const [c,r] of [[3.2,6.4],[11.8,6.4],[2,18],[13,18],[2,24],[13,24]])brazier(c,r);

  // Vertical watchstand poles and deep scarlet Flaming Fist banners.
  function banner(c,r){
    post(c,r,.09,.13,10.8,0x5d5347,5.4);
    box(c,r-.12,2.7,.22,.22,gold,9.45);
    box(c,r-.40,2.3,4.3,.13,0x912b31,7.4);
    box(c,r-.42,1.18,.20,.19,gold,8.35);
    box(c,r-.42,.24,1.85,.19,gold,7.5);
    box(c,r,1.85,.45,1.85,stoneDark,.28);
  }
  for(const [c,r] of [[1.2,7],[13.8,7],[1.2,21],[13.8,21]])banner(c,r);

  // Checkpoint barriers made of real blocked cells. Spiked stakes + X-bracing
  // are decorative; the blocked-cell geometry is what the engine pathfinds.
  function barricade(c,r,variant=0){
    const beam=box(c,r,3.25,.55,.48,0x634837,1.15);
    beam.rotation.y=variant?.2:-.2;
    for(const dx of [-.90,.9]){
      const diagonal=box(c+dx*.18,r,1.55,.33,.44,0x4c3429,1.2);
      diagonal.rotation.y=dx<0?-.68:.68;
    }
    for(const dx of [-1.25,0,1.25]){
      const picket=box(c+dx/4,r, .25,2.25,.28,0x463126,1.35);
      picket.rotation.z=dx/7;
      post(c+dx/4,r,.18,.25,.30,iron,2.64);
    }
    box(c,r,3.2,.17,.31,FIST,1.58);
    block(c,r);
  }
  // Two barricaded lanes with a guarded, two-square chicane in the centre.
  for(let c=2;c<=6;c++)barricade(c,18,c%2);
  for(let c=9;c<=13;c++)barricade(c,18,c%2);
  for(const [c,r] of [[4,21],[5,21],[10,21],[11,21]])barricade(c,r,(c+r)%2);
  // Boulders used as barricade anchors: decorated but not a second wall.
  for(const [c,r] of [[1.35,18],[14.2,18],[3.2,21],[12.6,21]]){
    box(c,r,2.25,1.18,2.1,stoneDark,.6);
    box(c,r,1.7,.2,1.55,stoneLight,1.25);
  }

  // The civilian end is cluttered but contains clear walkable routes.
  // Handcarts are parked well outside the adventurers' centre starting cells.
  function handcart(c,r){
    box(c,r,3.3,.34,5.0,0x624630,1.38);
    box(c,r,3.0,.22,4.8,0x977451,1.76);
    for(const dx of [-1.65,1.65]){
      const wheel=post(c+dx/4,r,.82,.82,.26,iron,.79);
      wheel.rotation.z=Math.PI/2;
    }
    box(c,r+1,.23,.25,3.9,M.woodDark.color.getHex(),1.42);
    block(c,r);
  }
  handcart(2,23);handcart(13,23);
  for(const [c,r] of [[2,25],[13,26],[4,24],[11,24]]){
    box(c,r,1.0,.65,1.15,0x7b694e,.31);
    box(c+.17,r,1.04,.18,.92,0x564837,.70);
  }
  // Insignia markers below the checkpoint squads; not obstacles.
  for(const [c,r] of [[7.5,7.0],[7.5,14.5]]){
    box(c,r,3.1,.03,.16,0x9d5551,.04);
    box(c,r,.16,.03,3.1,0x9d5551,.04);
  }
}
