// GRAVEYARD — permanent named exterior for Baldur's Gate V9.
// Renderer, camera, CSS labels, movement, collisions, GM and adventurer panels
// are provided by interiors/shared/engine.js. This module builds scenery only.
//
// 60 ordinary graves: 36 standard (60%), 12 ornate (20%), 12 sword (20%).
// William W is a unique 61st memorial, not counted in the ordinary-grave mix.

export const GRAVEYARD_GRAVE_MIX=Object.freeze({standard:36,ornate:12,sword:12});

export const GRAVEYARD_NPC_CONFIG = Object.freeze({
  panelTitle:'The Graveyard · GM Controls',
  restoreLabel:'Restore Mysterious NPC',
  initial:[{
    id:'unknown-visitor',name:'???',role:'Unidentified visitor',
    faction:'neutral',archetype:'hooded-stranger',color:0x343c48,
    start:[13,9],
  }],
  // The shared engine provides an opt-in identity toggle for any landmark NPC.
  // The true name is never shown on the board or the roster before the reveal.
  reveals:[{
    sourceId:'unknown-visitor',revealAs:'Roland',
    revealLabel:'Reveal Identity',hideLabel:'Conceal Identity',
    description:'A solitary figure stands among the graves. Their name remains unknown to the players.',
  }],
});

export function buildGraveyard(api){
  const {geometry:g,architecture:a,dimensions:dim}=api;
  const W=dim.columns,H=dim.rows;
  const lowStone=0x737d78;
  const paleStone=0x89918a, agingStone=0x68716b, iron=0x323b3a;
  const black=0x161a20, silver=0xa9b3b6, bronze=0x978466;
  const box=(c,r,w,h,d,color,y=h/2)=>g.boxAt(c,r,w,h,d,{color,y});
  const ball=(c,r,radius,color,y=radius)=>g.sphereAt(c,r,radius,{color,y});
  const post=(c,r,rt,rb,h,color,y=h/2)=>g.cylinderAt(c,r,rt,rb,h,{color,y});

  // Weathered earth and lichened paving keep the scene grounded and quiet.
  // The player/actor collision grid always remains the engine's same floor.
  const stonePath=[0x626a60,0x69716a,0x636963,0x58635d];
  for(let r=0;r<H;r++)for(let c=0;c<W;c++){
    const main=(c>=11&&c<=14),forecourt=(r>=22&&c>=2&&c<=23);
    const cross=(r===6||r===12||r===18)&&c>=1&&c<=24;
    if(!main&&!forecourt&&!cross)continue;
    const col=main?(c+r)%4:(r+c*3)%4;
    box(c,r,3.94,.036,3.94,stonePath[col],.014);
    if((r*3+c)%7===0)box(c+.36,r-.32,1.15,.018,.065,0x899188,.04);
  }
  for(let r=1;r<H-2;r+=2){
    // Occasional worn flagstones down the processional central walkway.
    box(12.5,r,4.0,.024,.10,0x343f3b,.048);
  }

  // The boundary fence is OUTSIDE the usable grid; there is an open and
  // physically accessible four-column gateway on the southern edge.
  box(-.58,12.5,1.55,1.3,H*4+2,lowStone,.62);
  box(W-.42,12.5,1.55,1.3,H*4+2,lowStone,.62);
  box(12.5,-.58,W*4+2,1.3,1.5,lowStone,.62);
  box(5.1,H-.40,10.6*4,1.3,1.45,lowStone,.62);
  box(19.9,H-.40,10.6*4,1.3,1.45,lowStone,.62);

  // Narrow ironwork with stone-capped piers; the rails are non-walkable
  // boundary decor rather than invisible collision walls in the plot area.
  function fencePillar(c,r){
    box(c,r,.82,2.05,.82,agingStone,1.1);
    box(c,r,1.1,.24,1.1,paleStone,2.27);
    post(c,r,.20,.22,1.15,iron,2.92);
  }
  for(let r=0;r<H;r+=3){
    fencePillar(-.58,r);fencePillar(W-.42,r);
    for(let k=1;k<=2;k++){
      post(-.58,r+k,.075,.075,2.5,iron,2.65);
      post(W-.42,r+k,.075,.075,2.5,iron,2.65);
    }
  }
  for(let c=0;c<W;c+=3)fencePillar(c,-.58);
  for(let c=0;c<W;c+=3){
    if(c>=10&&c<=15)continue;
    fencePillar(c,H-.4);
  }
  for(const c of [10.2,15.8]){
    box(c,25.42,2.45,6.2,2.55,agingStone,3.1);
    box(c,25.42,2.9,.55,2.95,paleStone,6.48);
    ball(c,25.42,.65,0x8b9990,7.12);
  }
  box(13,25.42,21.9,.66,2.2,agingStone,7.65);
  box(13,25.42,21.1,.24,2.4,paleStone,8.08);
  // A modest bronze memorial sign that does not cover the entrance.
  box(13,25.37,5.1,.32,.28,bronze,7.78);

  // Headstones align in evenly spaced ranks to leave at least one free
  // walking square between adjacent stones and the four-wide central aisle.
  const graveColumns=[2,4,6,8,10,15,17,19,21,23];
  const graveRows=[4,7,10,13,16,19];
  const placements=[];
  for(const r of graveRows)for(const c of graveColumns)placements.push([c,r]);
  // Deterministic Fisher–Yates shuffle: precisely the requested 60/20/20
  // distribution, but with a naturally varied pattern across both halves.
  const types=[...Array(GRAVEYARD_GRAVE_MIX.standard).fill('standard'),
    ...Array(GRAVEYARD_GRAVE_MIX.ornate).fill('ornate'),
    ...Array(GRAVEYARD_GRAVE_MIX.sword).fill('sword')];
  let seed=412077;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=types.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[types[i],types[j]]=[types[j],types[i]];}

  function gravePlot(c,r,variant){
    const earth=variant%3===0?0x3b4139:variant%3===1?0x3a4438:0x454838;
    // Entire plot stays inside its grid square, which is blocked below.
    box(c,r+.06,2.75,.17,3.18,earth,.105);
    box(c,r+.10,2.42,.09,2.76,0x56614a,.205);
    if(variant%4===0){
      box(c-.36,r+.22,.54,.085,1.14,0x6b7163,.262);
      box(c+.34,r+.18,.38,.06,.95,0x62695d,.250);
    }
  }
  function standardGrave(c,r,variant){
    const shade=[0x7d8581,0x87908b,0x737d77,0x8b8d83][variant%4];
    box(c,r-.25,2.58,.32,1.35,agingStone,.23);
    box(c,r-.25,1.83,2.1,.59,shade,1.39);
    // Gently curved crown of a commonplace rounded headstone.
    ball(c,r-.25,.91,shade,2.42);
    box(c,r-.23,1.10,.12,.10,0x565e5d,1.45);
  }
  function ornateGrave(c,r,variant){
    const shade=variant%2===0?0x89948d:0x737e7a;
    box(c,r-.25,3.1,.52,1.62,agingStone,.28);
    box(c,r-.25,2.54,3.15,.72,shade,1.99);
    for(const x of [-.32,.32]){
      post(c+x,r-.25,.30,.34,3.43,paleStone,2.03);
      ball(c+x,r-.25,.34,0x9da49b,3.91);
    }
    box(c,r-.25,3.0,.42,1.13,paleStone,4.05);
    box(c,r-.24,1.75,.78,.09,0x56675f,2.12);
    // Delicate gold funerary medallion in the gable.
    ball(c,r-.20,.22,bronze,3.55);
    box(c,r-.19,.15,.68,.12,bronze,2.71);
  }
  function swordGrave(c,r,variant){
    const shade=variant%2===0?0x8a918e:0x757e80;
    box(c,r-.25,2.55,.52,1.45,agingStone,.28);
    box(c,r-.25,.87,3.30,.68,shade,2.23);      // blade
    post(c,r-.25,0,.54,.92,shade,4.30);            // triangular tip
    box(c,r-.25,2.8,.38,.83,shade,1.77);          // hilt / crossguard
    box(c,r-.25,.45,1.15,.51,shade,.99);          // grip
    ball(c,r-.25,.34,0x9fa6a1,.67);               // pommel
    box(c,r-.20,.16,2.42,.12,0xb1b6b0,3.03);     // blade ridge
  }
  function flowers(c,r,variant){
    const bloom=[0xb9a2b1,0xe3d4ac,0xa8b4d1,0xb7c6a7,0xc5a3a4][variant%5];
    for(let j=0;j<3;j++){
      const dx=(-.29+j*.27),dz=.12+(j%2)*.11;
      post(c+dx,r+dz,.035,.048,.43,0x536c4c,.43);
      ball(c+dx,r+dz,.17,bloom,.73+(j%2)*.08);
      ball(c+dx+.07,r+dz,.085,0xdac77c,.77+(j%2)*.08);
    }
  }
  placements.forEach(([c,r],i)=>{
    gravePlot(c,r,i);
    if(types[i]==='standard') standardGrave(c,r,i);
    else if(types[i]==='ornate') ornateGrave(c,r,i);
    else swordGrave(c,r,i);
    if(i%5===0||i%11===0)flowers(c,r,i);
    a.block(c,r);
  });

  // One unique black memorial with a silver sword and its OWN explicit label.
  // Deliberately placed off the central walk's centre so players can approach.
  const wc=12,wr=3;
  box(wc,wr+.11,3.25,.25,3.48,0x333b37,.20);
  box(wc,wr-.25,3.4,.49,1.57,black,.27);
  box(wc,wr-.25,2.9,4.55,.92,0x151a20,2.72);
  box(wc,wr-.25,2.4,3.92,.14,0x242c32,2.73);
  box(wc,wr-.25,3.18,.40,1.1,0x090e14,5.11);
  // Sword mounted on the front of the polished black stone.
  box(wc,wr-.21,.48,2.65,.19,silver,3.37);
  post(wc,wr-.21,0,.35,.69,silver,5.04);
  box(wc,wr-.21,2.27,.24,.28,bronze,2.35);
  box(wc,wr-.21,.33,.95,.23,bronze,1.80);
  ball(wc,wr-.21,.28,bronze,1.33);
  box(wc,wr-.18,1.65,.29,.10,0xb2a99b,.88);
  flowers(wc,wr+.10,2);
  g.labelAt(wc,wr-.25,'William W',{y:6.0,className:'landmark-prop-label grave-epitaph'});
  a.block(wc,wr);

  // A few austere standing lanterns mark the memorial's approach. They are
  // placed on distinct cells and registered as physical obstacles.
  function lantern(c,r){
    box(c,r,1.15,.45,1.10,agingStone,.23);
    post(c,r,.14,.20,3.2,iron,1.78);
    box(c,r,.72,1.03,.72,0x444b48,3.56);
    ball(c,r,.31,0xd3b993,3.53);
    box(c,r,1.0,.28,1.0,iron,4.19);
    post(c,r,0,.48,.53,iron,4.60);
    a.block(c,r);
  }
  lantern(10,2);lantern(14,2);

  // Quiet, sparsely branched trees around the perimeter. They remain outside
  // the main graves and aisle and are flagged where their trunks occupy cells.
  function tree(c,r,s=1){
    const trunk=post(c,r,.31*s,.49*s,7.5*s,0x484b42,3.7*s);
    for(const [dx,dz,h,angle] of [[-1.1,0,5.8,-.6],[1.0,.35,5.3,.54],[-.45,-.90,6.3,-.2]]){
      const limb=post(c+dx*.38,r+dz*.32,.12*s,.23*s,3.1*s,0x4a4e45,h*s);
      limb.rotation.z=angle;
    }
    // Very restrained moss rather than a lush leafy summer tree.
    ball(c-.55,r-.19,1.15*s,0x465749,7.4*s);
    ball(c+.54,r+.30,.88*s,0x4f5e4e,8.20*s);
    if(Number.isInteger(c)&&Number.isInteger(r))a.block(c,r);
  }
  for(const [c,r,s] of [[1,2,.80],[24,2,.95],[1,11,.83],[24,14,.89],[1,21,.86],[24,22,.77]])tree(c,r,s);

  // Low cloud banks float just above the damp soil. The engine's fog gives
  // the overall mist; these translucent sheets give it local variation.
  const fogMat=g.material(0xb9c4bc,{transparent:true,opacity:.105,depthWrite:false,roughness:1,side:2});
  for(const [c,r,width,depth] of [[5.5,5.4,19,5.3],[18.9,8.6,21,4.8],
                                  [5.5,16.2,17,5.2],[20.0,19.8,17,5.6],
                                  [13,14,13,4.5]]){
    const haze=box(c,r,width,.018,depth,0xc1c7bc,.31);
    haze.material.dispose();haze.material=fogMat;haze.castShadow=false;haze.receiveShadow=false;
  }
  // Light at the far end of the procession, with no noisy battle effects.
  a.addLight('blue',12.5,3,1.2);
}
