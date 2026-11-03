// CLOISTER OF SOMBRE EMBRACE — a large, irregular Sharran underground complex.
// This is a subsidiary scene of House of Grief. It is deliberately not a city
// landmark; access is gated by the scene navigation in the shared engine.
// Adapted as a playable 62 x 42 tactical layout from the user's overhead map:
// western sanctuary, central hub, northern training, long eastern passage,
// northeastern Memory Chapel, southern ritual crypt and orchid grotto.

export const CLOISTER_FLOOR_MASK=(c,r)=>{
  // Union of cavern halls and corridors, avoiding a fake rectangular 'room'.
  const ellipse=(x,y,rx,ry)=>((c-x)/rx)**2+((r-y)/ry)**2<=1;
  const rect=(l,t,rr,b)=>c>=l&&c<=rr&&r>=t&&r<=b;
  return ellipse(9,22,8.8,9.0) ||       // Western sanctuary and Shar's altar
    ellipse(25,21,11.5,10.0) ||       // Main convocation / central plaza
    ellipse(26,9,7.8,8.6) ||         // Training court north
    ellipse(27,36,8.5,6.3) ||        // Night-orchid cavern south
    ellipse(40,33,6.6,7.0) ||        // Armoury and preparation chamber
    ellipse(14,34,7.5,6.4) ||        // Ritual chamber southwest
    ellipse(55,8,8.1,7.4) ||         // Mirror of Loss Chapel far east
    ellipse(40,15,6.5,4.7) ||        // Northern cell and library
    ellipse(41,27,5.5,6.3) ||        // South-east chambers
    ellipse(15,11,5.2,4.5) ||        // Western side rooms
    rect(32,19,56,23) ||           // Long corridor from central to eastern wing
    rect(53,10,57,22) ||           // Eastern raised passage
    rect(22,14,30,35);             // Broad central/south corridor
};

const HEX_PURPLE=0x8d63be;
export const CLOISTER_NPCS=Object.freeze({
  panelTitle:'Cloister · Sharran Roster',restoreLabel:'Restore the Cloister',
  initial:[
    {id:'cloister-shadowheart',name:'Shadowheart',role:'Cleric of Shar',
      faction:'sharran',archetype:'shadowheart',color:0x706080,start:[23,20]},
    {id:'nocturne',name:'Nocturne',role:'Sharran Acolyte',
      faction:'sharran',archetype:'nocturne',color:0x796a97,start:[28,35]},
    {id:'mother-superior',name:'Mother Superior',role:'Cloister Leader',
      faction:'sharran',archetype:'mother-superior',color:0x512d74,start:[8,23]},
    ...[[20,19],[21,24],[30,20],[30,24],[11,18],[11,26],[40,20],[52,20]].map(([c,r],index)=>({
      id:`cloister-sharran-${index+1}`,name:`Sharran ${index+1}`,role:'Disciple of Shar',
      faction:'sharran',archetype:'sharran',color:0x4b3b60,start:[c,r],
    })),
    ...[[24,9],[28,9],[38,32],[57,12]].map(([c,r],index)=>({
      id:`dark-justiciar-${index+1}`,name:`Dark Justiciar ${index+1}`,role:'Armoured Justiciar',
      faction:'sharran',archetype:'dark-justiciar',color:0x333b48,start:[c,r],
    })),
    {id:'gloom-maker',name:'Gloom Maker',role:'Shadow Ritualist',
      faction:'sharran',archetype:'gloom-maker',color:0x62418b,start:[15,34]},
  ],
  spawnables:[
    {id:'additional-sharran',name:'Sharran',role:'Disciple of Shar',
      faction:'sharran',archetype:'sharran',color:0x55416b,limit:18,
      spawnArea:{minC:18,maxC:33,minR:17,maxR:29}},
    {id:'additional-justiciar',name:'Dark Justiciar',role:'Armoured Justiciar',
      faction:'sharran',archetype:'dark-justiciar',color:0x333b48,limit:12,
      spawnArea:{minC:22,maxC:30,minR:5,maxR:15}},
  ],
});

export function buildCloisterOfSombreEmbrace(api){
  const {geometry:g,architecture:a,interactions:i,dimensions:dim}=api;
  const {columns:W,rows:H}=dim;
  const black=0x1b1923,slate=0x393440,pale=0x787184,trim=0x726085;
  const violet=0x654b85,bright=0xbaa4dc,blue=0x403e62,steel=0x9a97a4;
  const b=(c,r,w,h,z,color,y=h/2)=>g.boxAt(c,r,w,h,z,{color,y});
  const orb=(c,r,rad,color,y=rad)=>g.sphereAt(c,r,rad,{color,y});
  const post=(c,r,rt,rb,h,color,y=h/2)=>g.cylinderAt(c,r,rt,rb,h,{color,y});
  const mark=(c,r,label)=>g.labelAt(c,r,label,{y:8,className:'cloister-zone-label'});
  const stone=(c,r,color=slate)=>b(c,r,3.88,.06,3.88,color,.025);
  const light=(c,r,power=2.3,range=36,height=6)=>g.pointLight(c,r,{color:HEX_PURPLE,intensity:power,range,height});

  // Weathered tile courses and violet-inlaid processional routes.
  for(let r=1;r<H-1;r++)for(let c=1;c<W-1;c++){
    if(!CLOISTER_FLOOR_MASK(c,r))continue;
    const main=r>=19&&r<=23&&c>=20&&c<=57;
    const east=r>=8&&r<=22&&c>=54&&c<=56;
    const west=c<17&&r>=17&&r<=28;
    if(main||east||west||(r%4===0&&c%3===0))
      stone(c,r,main?((c+r)%3?0x4b4056:0x63516d):east?0x4b465c:west?0x4c4650:0x41404d);
    if(main&&c%4===0)b(c,r,2.65,.036,.12,0x8e759e,.083);
  }

  // Dark rock escarpment around the cave perimeter. The silhouette in the
  // floor mask is the *actual* walkable zone; these rocks are visual only.
  for(let r=0;r<H;r++)for(let c=0;c<W;c++){
    if(CLOISTER_FLOOR_MASK(c,r))continue;
    const edge=[[1,0],[-1,0],[0,1],[0,-1]].some(([dc,dr])=>
      c+dc>=0&&c+dc<W&&r+dr>=0&&r+dr<H&&CLOISTER_FLOOR_MASK(c+dc,r+dr));
    if(!edge)continue;
    const n=(c*97+r*71)%7;
    const rock=post(c,r,1.7+n*.12,2.15,4.5+n*.7,
      n%3===0?0x494653:n%3===1?0x33343f:0x292c36,2.0+n*.3);
    rock.rotation.z=.08*((c+r)%3-1);
    if(n%4===0)b(c+.25,r-.22,3.4,.9,3.8,0x46404c,4.7);
  }

  // Strong spatial divisions, with real passable apertures and no corner cuts.
  a.partitionVertical(17,[21,22,23,24],5.8,{start:17,stop:29});
  a.partitionHorizontal(13,[26,27],5.3,{start:21,stop:32});
  a.partitionHorizontal(32,[26,27,28],4.9,{start:22,stop:32});
  a.partitionVertical(35,[20,21,22],5.8,{start:19,stop:24});
  a.partitionHorizontal(14,[55,56],5.3,{start:50,stop:61});

  // Rows of pillars: each occupies precisely its own grid square.
  function pillar(c,r,height=7){
    b(c,r,2.4,.64,2.4,0x504b57,.32);
    post(c,r,.79,1.01,height,0x656071,height/2+.55);
    b(c,r,2.55,.55,2.55,0x817184,height+.68);
    b(c,r,2.7,.22,2.7,black,height+1.0);a.block(c,r);
  }
  for(const [c,r] of [[19,16],[31,16],[19,28],[31,28],
    [5,16],[13,16],[5,28],[13,28],
    [24,5],[30,5],[24,13],[30,13],
    [51,5],[59,5],[51,11],[59,11],
    [37,19],[42,23],[46,19],[51,23]]){
    if(CLOISTER_FLOOR_MASK(c,r))pillar(c,r,(r<13?6.4:7.8));
  }

  // Dim floating Sharran candles, cold violet fire and carefully limited lights.
  for(let k=0;k<39;k++){
    const c=3+(k*13)%56, r=3+(k*17)%36;
    if(!CLOISTER_FLOOR_MASK(c,r))continue;
    const lift=4.3+(k%5)*.55;
    const candle=post(c+.18,r-.15,.10,.13,.54,0xc3bad0,lift);
    const flame=orb(c+.18,r-.15,.25,0xc59bf1,lift+.49);
    flame.material.emissive.setHex(0x8a51bd);flame.material.emissiveIntensity=2.3;
    candle.castShadow=false;flame.castShadow=false;
    if(k%4===0)light(c,r,1.75,30,lift+.6);
  }
  for(const [c,r,power] of [[9,22,3],[25,21,3.3],[26,9,2.4],[27,36,2.9],
                              [40,32,2.3],[55,8,4.2],[43,21,2.2],[14,34,2.5]])light(c,r,power,38,7);

  // The western Sanctuary: a raised stone dais and altar to Shar.
  for(let r=19;r<=25;r++)for(let c=3;c<=9;c++){
    if((c-6)**2+(r-22)**2<=10) b(c,r,3.87,.34,3.87,0x302b38,.16);
  }
  b(6,22,9.4,2.35,5.2,black,1.38);a.block(6,22);
  b(6,21.7,8.2,.27,5.5,trim,2.63);
  post(6,21,.58,.78,6.1,0x49404d,5.7);
  orb(6,21,1.10,0x2d273d,9.1);
  for(const side of [-1,1]){
    const wing=b(6+side*.82,21,2.7,6.1,.55,0x45404d,7.5);wing.rotation.z=side*.27;
  }
  orb(6,21,.48,0x9878b9,10.25);
  for(const [c,r] of [[3,20],[9,20],[3,25],[9,25]]){
    post(c,r,.33,.51,1.7,0x4d4652,.85);orb(c,r,.29,0xbba1d2,1.94);
  }
  mark(7,17,'Sanctuary · Altar of Shar');

  // Main Chamber: broad circular convocation floor, a sunken central sigil.
  post(25,22,10.5,11.8,.35,0x37313f,.10);
  post(25,22,6.5,6.5,.37,0x4c385b,.32);
  post(25,22,4.9,4.9,.19,0x211c2c,.59);
  for(let n=0;n<12;n++){
    const ang=n*Math.PI/6;
    const c=25+Math.cos(ang)*2.55,r=22+Math.sin(ang)*2.55;
    const inlay=b(c,r,2.0,.07,.22,0xb193ca,.72);inlay.rotation.y=-ang;
  }
  // Do not block the circle itself: miniatures can occupy the rite's center.
  mark(25,17,'Main Chamber · Sombre Embrace');

  // Northern training hall — dummies, weapon racks and practice arena.
  for(let r=6;r<=12;r++)for(let c=23;c<=30;c++){
    if(CLOISTER_FLOOR_MASK(c,r) && (c+r)%4===0)stone(c,r,0x58515d);
  }
  function trainingDummy(c,r){
    post(c,r,.18,.23,3.1,0x75665e,1.62);
    b(c,r,1.65,1.42,.58,0x61525b,2.38);
    b(c,r,2.22,.18,.38,steel,2.4);
    orb(c,r,.35,0xa19996,3.23);a.block(c,r);
  }
  for(const [c,r] of [[22,8],[26,7],[30,10]])trainingDummy(c,r);
  for(const [c,r] of [[23,11],[29,6]]){
    b(c,r,2.85,2.3,.85,0x48414c,1.2);a.block(c,r);
    for(let t=0;t<3;t++){
      const sword=b(c+.15*t-.15,r, .13,2.4,.15,steel,3.05);
      sword.rotation.z=.17*(t-1);
    }
  }
  mark(26,4,'Hall of Training');

  // Night Orchid grotto, gently luminous flower clusters and low rock ledges.
  const flowers=[[24,37],[26,39],[30,38],[23,35],[32,34],[29,36],[26,34],[31,40],[20,36]];
  for(const [c,r] of flowers){
    if(!CLOISTER_FLOOR_MASK(c,r))continue;
    const stalk=post(c,r,.08,.14,1.35,0x364f48,.69);
    for(let t=0;t<5;t++){
      const th=t*Math.PI*2/5;
      const blossom=orb(c+Math.cos(th)*.17,r+Math.sin(th)*.17,.26,
        t%2?0xbba0ed:0x8660bc,1.62+(t%2)*.09);
      blossom.material.emissive.setHex(0x673f90);blossom.material.emissiveIntensity=1.2;
    }
    orb(c,r,.21,0xe0cae9,1.73);
    a.block(c,r);
  }
  for(const [c,r] of [[22,40],[33,38],[21,33]]){
    b(c,r,4.2,1.85,4.2,0x413e49,1);a.block(c,r);
  }
  light(27,37,3.1,24,4);mark(27,33,'Night Orchid Cave');

  // Armoury in the southeast. Steel racks and locked trunks obstruct their cells.
  for(const [c,r] of [[38,34],[41,34],[43,32],[40,37]]){
    if(!CLOISTER_FLOOR_MASK(c,r))continue;
    b(c,r,3.2,2.65,1.0,0x594b53,1.46);
    for(const x of [-.65,0,.65]){
      const blade=b(c+x,r,.18,2.70,.18,0xa4a4aa,3.48);
      blade.rotation.z=x*.15;
      b(c+x,r,.62,.18,.25,oldGold(),2.48);
    }
    a.block(c,r);
  }
  for(const [c,r] of [[38,30],[43,36],[36,34]]){
    if(CLOISTER_FLOOR_MASK(c,r)){
      b(c,r,3.0,1.75,2.65,0x392e3e,.90);
      b(c,r,3.1,.23,2.7,0x92788e,1.85);a.block(c,r);
    }
  }
  mark(40,29,'Cloister Armoury');

  // A self-contained ritual circle in the southwest cavern.
  post(14,34,12.2,12.2,.09,0x282332,.08);
  for(let n=0;n<32;n++){
    const angle=n*Math.PI/16;
    const c=14+3.05*Math.cos(angle),r=34+3.05*Math.sin(angle);
    const sigil=b(c,r,2.4,.05,.17,(n%4===0)?0xc7a2de:0x84639a,.16);
    sigil.rotation.y=-angle;
  }
  for(let n=0;n<8;n++){
    const ang=n*Math.PI/4;
    const glyph=b(14+1.85*Math.cos(ang),34+1.85*Math.sin(ang),1.4,.05,.13,0xb590d4,.18);
    glyph.rotation.y=ang;
  }
  orb(14,34,.55,0x4c325d,1.0);
  mark(13,29,'Ritual Circle');

  // The long eastern causeway from the central hub to the lost-memory chapel.
  for(let c=33;c<=55;c++){
    for(const r of [19,23]){
      if(c%3===0)b(c,r,2.4,.14,.14,0x9f81ad,.11);
    }
    if(c%5===0){
      b(c,21,2.8,.06,3.6,0x51445d,.08);
    }
  }
  for(let r=11;r<=19;r++)for(let c=54;c<=56;c++){
    if((r+c)%5===0)stone(c,r,0x5f556e);
  }

  // Mirror of Loss: monumental dark framed artefact in the far east chamber.
  const mirrorBack=b(56,6,13.1,10.7,1.16,0x211b31,5.56);
  b(56,6,14.1,.70,1.55,0x9b7aab,11.17);
  b(56,6,14.1,.65,1.57,0x5c485f,.44);
  for(const c of [54.4,57.6]){
    b(c,6,.72,10.8,1.55,0x8f779b,5.55);
    orb(c,6,.72,0xb69bc3,11.15);
  }
  const glass=b(56,6,10.4,8.5,.20,0x56426b,5.48);
  glass.material.transparent=true;glass.material.opacity=.73;
  glass.material.emissive.setHex(0x36204f);glass.material.emissiveIntensity=.38;
  for(const c of [54,55,56,57,58])a.block(c,6);
  for(const [c,r] of [[52,8],[60,8]]){
    post(c,r,.5,.58,5.0,0x403347,2.5);orb(c,r,.6,0x9872ba,5.5);a.block(c,r);
  }
  const mirrorLight=g.pointLight(56,7,{color:0x946bd1,intensity:3.3,range:35,height:7});
  let mirrorAwake=false;
  const toggleMirror=()=>{
    mirrorAwake=!mirrorAwake;
    glass.material.emissiveIntensity=mirrorAwake?2.1:.38;
    mirrorLight.intensity=mirrorAwake?7:3.3;
    document.querySelector('#move-status').textContent=mirrorAwake?
      'The Mirror of Loss stirs; violet memories gather in its surface.':
      'The Mirror of Loss falls silent.';
  };
  i.clickable(glass,'Mirror of Loss',toggleMirror);
  i.panelAction({id:'mirror-loss',label:()=>mirrorAwake?'Quieten the Mirror of Loss':'Awaken the Mirror of Loss',run:toggleMirror});
  mark(55,10,'Mirror of Loss');

  // Smaller chamber clusters are intentionally connected through real cave
  // corridors. Tomb furniture / writing desks block occupied tactical squares.
  for(const [c,r] of [[15,10],[39,15],[43,26]]){
    if(!CLOISTER_FLOOR_MASK(c,r))continue;
    b(c,r,3.4,1.75,3.0,0x50414c,.92);
    b(c,r,3.5,.18,3.1,0x816d82,1.89);a.block(c,r);
    b(c+.35,r,.98,.12,1.10,0xb3a1aa,2.05);
  }
  for(const [c,r] of [[13,13],[39,17],[42,28],[57,10]]){
    if(!CLOISTER_FLOOR_MASK(c,r))continue;
    post(c,r,.45,.64,2.6,black,1.3);
    orb(c,r,.44,0x8e6cb0,3.0);a.block(c,r);
  }
  mark(40,13,'Silent Cells');

  // Entering from the secret passage starts in the northeast chapel; the
  // return action is available from this scene only, never from city LANDMARKS.
  i.panelAction({id:'return-house',label:'Return to the House of Grief',
    run:()=>i.travel('house-of-grief')});
  // Clicking the stone arrival arch is an alternative to the GM panel.
  const returnArch=b(53,12,2.5,4.7,.42,0x6e597f,3.1);
  b(53,12,3.1,.3,.55,0xb18bc8,5.55);
  i.clickable(returnArch,'Ascend to the House of Grief',()=>i.travel('house-of-grief'));
}

function oldGold(){return 0x9f849a;}
