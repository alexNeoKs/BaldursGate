// DUNGEON OF THE DEAD THREE — D5–D33 (D14 is a passage).
// The irregular tactical map is adapted from the supplied published cartography.
// One navigable square represents five feet. Corridors are 1–2 squares wide;
// this is an original low-poly tabletop rendition rather than a texture overlay.
const ROOMS=[
 ['D5','Entrance Stair',8,8,4,3],['D6','Bloated Corpse',9,21,4,3],
 ['D7',"Bhaal's Altar",20,22,3,3],['D8','Moldy Tapestry',20,29,2,2],
 ['D9','Dead Three Doors',29,28,4,3],['D10',"Necromites' Room",29,36,3,3],
 ['D11','Collapsed Crypt',22,41,2,2],['D12',"Bane's Altar",40,37,6,3],
 ['D13','Morgue',22,46,4,3],['D14','Long Flooded Passage',36,50,3,1],
 ['D15','Flooded Room',6,51,3,2],['D16','Flooded Crypt',8,43,2,3],
 ['D17',"Myrkul's Altar",52,36,3,3],['D18','Gas Buildup',54,24,3,3],
 ['D19','Collapsed Crypt',67,43,2,2],['D20','Half-Plundered Crypt',72,43,2,2],
 ['D21','Zombie Crypt',77,43,2,2],['D22','Torture Chamber',81,35,3,3],
 ['D23','Secret Door & Sentry',87,36,2,3],['D24',"Myrkul's Rest",88,45,3,2],
 ['D25',"Bane's Rest",93,41,2,2],['D26',"Bhaal's Rest",93,33,2,2],
 ['D27','Echoes of Battle',85,25,3,2],['D28','Old Cellar',93,25,2,3],
 ['D29','Mortlock Vanthampur',72,23,5,4],['D30',"Tiamat's Treasure",75,31,2,2],
 ['D31','Waterlogged Landing',80,20,2,2],['D32','Northern Crypt',79,11,3,2],
 ['D33','Northern Shrine',66,10,4,3],
].map(([id,name,c,r,rx,rz])=>({id,name,c,r,rx,rz}));
export const DEAD_THREE_ROOMS=Object.freeze(ROOMS);
// Centerline connectors, based on D5–D33 adjacency and the reference map.
const ROUTES=[
 [[8,8],[7,14],[9,14],[9,21]],[[9,21],[20,22]],
 [[20,22],[20,29]],[[20,22],[29,22],[29,28]],
 [[29,28],[29,36]],[[29,36],[22,41]],[[22,41],[22,46]],
 [[22,46],[22,50],[36,50]],[[36,50],[6,50],[6,51]],
 [[6,51],[6,43],[8,43]],[[29,36],[40,37]],
 [[40,37],[52,36]],[[52,36],[54,31],[54,24]],
 [[54,24],[62,24],[72,23]],
 [[54,24],[57,35],[81,35]],
 [[81,35],[70,40],[67,43]],[[67,43],[72,43]],[[72,43],[77,43]],
 [[81,35],[87,36]],[[87,36],[88,45]],[[88,45],[93,41]],
 [[87,36],[93,33]],[[87,36],[85,25]],[[85,25],[93,25]],
 [[85,25],[72,23]],[[72,23],[75,31]],[[72,23],[80,20]],
 [[80,20],[79,11]],[[79,11],[66,10]],
];
const rect=(c,r,room)=>Math.abs(c-room.c)<=room.rx&&Math.abs(r-room.r)<=room.rz;
const routePixel=(c,r,route)=>{
 for(let k=0;k<route.length-1;k++){
  const [ax,ay]=route[k], [bx,by]=route[k+1],dx=bx-ax,dy=by-ay;
  const t=Math.max(0,Math.min(1,((c-ax)*dx+(r-ay)*dy)/(dx*dx+dy*dy||1)));
  if(Math.hypot(c-(ax+t*dx),r-(ay+t*dy))<=1.05)return true;
 }
 return false;
};
export const DEAD_THREE_FLOOR_MASK=(c,r)=>
 c>=0&&c<96&&r>=0&&r<56&&
 (ROOMS.some(room=>rect(c,r,room))||ROUTES.some(path=>routePixel(c,r,path)));
const FLOODED_ROOMS=new Set(['D6','D7','D12','D15','D16','D18','D23','D27','D28','D29']);
const FLOODED_ROUTES=new Set([0,1,2,7,8,9,13,15,21,24,25]);
export function isDeadThreeFlooded(c,r){
 // D12 west side is dry; D29 central island sits above the waterline.
 const room=ROOMS.find(room=>rect(c,r,room));
 if(room){
   if(room.id==='D12')return c>=41;
   if(room.id==='D29')return Math.abs(c-72)+Math.abs(r-23)>4;
   return FLOODED_ROOMS.has(room.id);
 }
 return ROUTES.some((path,k)=>FLOODED_ROUTES.has(k)&&routePixel(c,r,path));
}
const spawn=(minC,maxC,minR,maxR)=>({minC,maxC,minR,maxR});
const cult=(id,name,role,archetype,color,c,r,other={})=>({id,name,role,archetype,
 faction:'dead-three',color,start:[c,r],...other});
const zombie=(id,c,r)=>cult(id,`Zombie ${id.split('-').pop()}`,'Undead Thrall','zombie',0x647365,c,r);
const bane=(id,c,r)=>cult(id,`Fist of Bane ${id.split('-').pop()}`,'Banite Enforcer','fist-bane',0x514b4b,c,r);
const necro=(id,c,r)=>cult(id,`Necromite of Myrkul ${id.split('-').pop()}`,'Necromite','necromite',0x686478,c,r);
export const DEAD_THREE_NPCS=Object.freeze({
 panelTitle:'Dungeon · Dead Three Encounters',restoreLabel:'Restore Dungeon Encounters',
 initial:[
  necro('necromite-1',27,35),necro('necromite-2',30,35),necro('necromite-3',29,38),
  cult('kazzira','Kazzira','Fist of Bane · Female','fist-bane',0x83444c,38,36),
  cult('yignath','Yignath','Iron Consul · Key Bearer','iron-consul',0x77717c,42,36),
  {id:'klim-jhasso',name:'Klim Jhasso',role:'Shackled Prisoner',archetype:'prisoner',faction:'civilian',color:0xb8a39b,start:[41,38]},
  cult('flennis','Flennis','Master of Souls · Necromancer','master-souls',0x585274,20,45),
  cult('skeletal-rats','Skeletal Rat Swarm','Undead Swarm','skeletal-rats',0x9c9884,23,47),
  ...[[76,41],[78,41],[76,42],[78,42],[76,44],[78,44]].map(([c,r],j)=>zombie(`zombie-${j+1}`,c,r)),
  bane('fist-bane-sentry',86,35),
  ...[[92,39],[94,39],[92,42],[94,42]].map(([c,r],j)=>bane(`rest-fist-${j+1}`,c,r)),
  cult('bhaal-reaper','Reaper of Bhaal','Blood-Soaked Assassin','reaper-bhaal',0x8e343b,94,32),
  cult('mortlock','Mortlock Vanthampur','Wounded Fighter','mortlock',0x6d5d52,70,22),
  cult('skull-assailant','Skull-Faced Assassin','Bhaal Murderer','reaper-bhaal',0x993b3a,74,23),
 ],
 spawnables:[
  cult('spawn-fist','Fist of Bane','Banite Enforcer','fist-bane',0x514b4b,81,36,{limit:30,spawnArea:spawn(78,86,32,39)}),
  cult('spawn-night','Night Blade','Assassin of Bhaal','night-blade',0x71313a,30,27,{limit:30,spawnArea:spawn(25,34,24,31)}),
  cult('spawn-necromite','Necromite of Myrkul','Myrkul Acolyte','necromite',0x686478,27,37,{limit:30,spawnArea:spawn(25,33,33,39)}),
  cult('spawn-reaper','Reaper of Bhaal','Bhaal Assassin','reaper-bhaal',0x86373b,91,33,{limit:20,spawnArea:spawn(88,95,30,36)}),
  cult('spawn-skeleton','Skeleton','Animated Bones','skeleton',0xa6a59b,51,35,{limit:40,spawnArea:spawn(47,55,32,40)}),
  cult('spawn-zombie','Zombie','Undead Thrall','zombie',0x647365,76,45,{limit:40,spawnArea:spawn(74,79,41,45)}),
  cult('spawn-cultist','Cultist','Dead Three Initiate','cultist',0x65485d,29,29,{limit:40,spawnArea:spawn(25,34,25,31)}),
  cult('spawn-animated-gauntlet','Animated Gauntlet','Cursed Living Armour','gauntlet',0x96959f,43,38,{limit:4,spawnArea:spawn(35,46,34,40)}),
  cult('spawn-rats','Skeletal Rat Swarm','Undead Swarm','skeletal-rats',0xa09d90,21,47,{limit:10,spawnArea:spawn(19,25,44,49)}),
  cult('spawn-battleaxe','Ghostly Battleaxe','Spectral Trap','ghost-axe',0x93bbcb,8,42,{unique:true,spawnArea:spawn(6,10,41,45)}),
  cult('spawn-hiskaal','Hiskaal','Bhaal Cultist (Formerly Deceased)','night-blade',0x70404c,8,22,{unique:true,spawnArea:spawn(6,12,18,24)}),
  cult('kazzira','Kazzira','Fist of Bane','fist-bane',0x83444c,38,36,{unique:true,spawnArea:spawn(35,46,34,40)}),
  cult('yignath','Yignath','Iron Consul','iron-consul',0x77717c,42,36,{unique:true,spawnArea:spawn(35,46,34,40)}),
  {id:'klim-jhasso',name:'Klim Jhasso',role:'Prisoner',archetype:'prisoner',color:0xb8a39b,unique:true,spawnArea:spawn(35,46,34,40)},
  cult('flennis','Flennis','Master of Souls','master-souls',0x585274,20,45,{unique:true,spawnArea:spawn(18,25,43,49)}),
  cult('mortlock','Mortlock Vanthampur','Wounded Fighter','mortlock',0x6d5d52,70,22,{unique:true,spawnArea:spawn(67,78,19,27)}),
  cult('skull-assailant','Skull-Faced Assassin','Assassin','reaper-bhaal',0x993b3a,74,23,{unique:true,spawnArea:spawn(67,78,19,27)}),
  {id:'spawn-prisoner',name:'Shackled Prisoner',role:'Captive',archetype:'prisoner',color:0xbab0a5,limit:6,spawnArea:spawn(78,84,32,38)},
 ],
});

export function buildDungeonOfTheDeadThree(api){
 const {geometry:g,architecture:a,interactions:i,decoration:d}=api;
 const b=(c,r,w,h,dep,color,y=h/2,blocking=false)=>g.boxAt(c,r,w,h,dep,{color,y,blocking});
 const ball=(c,r,rad,color,y=rad)=>g.sphereAt(c,r,rad,{color,y});
 const cyl=(c,r,top,bot,h,color,y=h/2)=>g.cylinderAt(c,r,top,bot,h,{color,y});
 // Dungeon-only presentation controls. Environment labels are tracked separately
 // from the character nameplates created by the shared miniature engine.
 let environmentLabelsVisible=true;
 const environmentLabels=[];
 const sceneryLabel=(c,r,text,opts={})=>{
   const object=g.labelAt(c,r,text,opts);
   environmentLabels.push(object);
   object.visible=environmentLabelsVisible;
   object.element.style.display=environmentLabelsVisible?'':'none';
   return object;
 };
 const label=(c,r,text)=>sceneryLabel(c,r,text,{y:7,className:'dead-three-zone-label'});
 const info=(msg)=>{const el=document.querySelector('#move-status');if(el)el.textContent=msg;};
 // First two controls in the dungeon GM panel. Player, NPC and enemy labels
 // remain visible even when every room/altar/door label is hidden.
 i.panelAction({
   id:'dd3-toggle-map-labels',
   label:()=>environmentLabelsVisible?'Hide Room / Object Labels':'Show Room / Object Labels',
   run:()=>{
     environmentLabelsVisible=!environmentLabelsVisible;
     for(const object of environmentLabels){
       object.visible=environmentLabelsVisible;
       object.element.style.display=environmentLabelsVisible?'':'none';
     }
     info(environmentLabelsVisible?'Dungeon room labels are visible.':'Room/object labels hidden; character names remain visible.');
   },
 });
 i.panelAction({
   id:'dd3-toggle-party-lights',
   label:()=>i.partyLights.isEnabled()?'Turn OFF Player Lights (7 Squares)':'Turn ON Player Lights (7 Squares)',
   run:()=>{
     const on=i.partyLights.setEnabled(!i.partyLights.isEnabled(),{
       radiusSquares:7,color:0xffd4a0,intensity:400,height:3.5,showRadius:true,
     });
     info(on?'Player lights enabled: seven squares per adventurer.':'Player lights turned off.');
   },
 });
 // Global illumination is independent of the seven-square adventurer lights.
 // Turning it off restores the original dungeon fog, colors and brightness.
 i.panelAction({
   id:'dd3-toggle-full-dungeon-light',
   label:()=>i.sceneLighting.isEnabled()?'Restore Dungeon Darkness':'Light Entire Dungeon',
   run:()=>{
     const on=i.sceneLighting.setEnabled(!i.sceneLighting.isEnabled(),{
       fillColor:0xfff1df,fillIntensity:3.5,
       hemisphereIntensity:2.8,sunIntensity:1.5,fogDensity:.0003,
     });
     info(on?'Entire dungeon illuminated. Adventurer lights remain independent.':
       'Original dungeon darkness and fog restored. Adventurer lights are unchanged.');
   },
 });
 const click=(obj,title,msg)=>i.clickable(obj,title,()=>info(msg));
 const slate=0x514f49,pale=0x888478,dry=0x797166,wood=0x4e3628,
  red=0x6a1920,bronze=0x8a714e,moss=0x4c6b67,fire=0xf3a15a,bone=0xc7c0a8;
 const torch=(c,r)=>{cyl(c,r,.16,.22,2.6,wood,1.3);ball(c,r,.35,fire,2.8);
   g.pointLight(c,r,{color:0xed925d,intensity:1.55,range:20,height:3.9});};
 const sarc=(c,r,open=false,color=slate)=>{
   b(c,r,3.5,1.25,3.0,color,.65,true);
   if(open)b(c,r,2.8,.1,2.15,0x25231f,1.31);
   else b(c,r,3.82,.38,3.3,pale,1.44);
   for(const x of [-1,1])b(c+x*.9,r,.25,.52,3.3,bronze,1.5);
 };
 const altar=(c,r,color=slate)=>{b(c,r,5.4,2.1,3.6,color,1.05,true);b(c,r,5.8,.34,4.1,pale,2.26);};
 const note=(id,message)=>i.panelAction({id:`dungeon-note-${id}`,label:`Inspect ${id} · ${ROOMS.find(z=>z.id===id)?.name||'Passage'}`,run:()=>info(message)});
 // True difficult terrain: one flooded tile consumes TWO movement points.
 // Water visuals are shallow transparent-looking bluish stone at y=0.04;
 // footstep/pathfinding cost is supplied by the shared engine.
 for(let r=0;r<56;r++)for(let c=0;c<96;c++){
   if(!DEAD_THREE_FLOOR_MASK(c,r))continue;
   if(isDeadThreeFlooded(c,r)){
     a.setTerrainCost(c,r,2);
     if((c+r)%2===0)b(c,r,3.88,.042,3.88,0x38575c,.047);
     else b(c,r,3.88,.042,3.88,0x496667,.047);
   }else if((c*7+r*11)%7===0)b(c,r,3.88,.04,3.88,0x625d56,.042);
 }
 // Limestone cave silhouette — the playable grid is an irregular union of
 // rooms and mapped passage centre-lines. Exterior stone is impassable.
 for(let r=0;r<56;r++)for(let c=0;c<96;c++){
   if(DEAD_THREE_FLOOR_MASK(c,r))continue;
   if(![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>DEAD_THREE_FLOOR_MASK(c+dx,r+dz)))continue;
   const variation=(c*13+r*23)%4;
   b(c,r,3.9,4.8+variation*.55,3.9,[0x383733,0x44433d,0x565348,0x4c4c45][variation],2.35+variation*.24);
 }
 // Wooden braces and support beams in passages and rooms; three-hit/masonry
 // collapse is intentionally narrated by GM rather than automatic damage.
 for(const room of ROOMS){
   if(room.id!=='D14')label(room.c,room.r-room.rz-1,`${room.id} · ${room.name}`);
   if(['D7','D10','D13','D15','D18','D23','D27','D29'].includes(room.id)){
     for(const dc of [-room.rx,room.rx]){
       const c=room.c+dc,r=room.r;
       if(DEAD_THREE_FLOOR_MASK(c,r)){
         b(c,r,.42,6.7,.42,wood,3.35);
         b(c,r,1.3,.35,.7,0x70553f,6.85);
       }
     }
   }
 }
 // Real enclosing wall edges around D9 prevent stepping around a shut
 // ceremonial door. North, east, and south openings have controllable leaves.
 a.partitionVertical(25,[],5.4,{start:25,stop:32});
 a.partitionVertical(34,[28],5.4,{start:25,stop:32});
 a.partitionHorizontal(25,[29],5.4,{start:25,stop:34});
 a.partitionHorizontal(32,[29],5.4,{start:25,stop:34});
 // D23 concealed north passage is likewise a real 5-ft doorway gap.
 a.partitionHorizontal(30,[85],5.4,{start:83,stop:88});
 // Three carved D9 doors occupy movement edges, not floor squares.
 const doors={
   bane:a.doorVertical(34,28,{height:5}),
   bhaal:a.doorHorizontal(25,29,{height:5}),
   myrkul:a.doorHorizontal(32,29,{height:5}),
   secret:a.doorHorizontal(30,85,{height:5,secret:true}),
 };
 const doorNames={bane:'Bane · Iron Shackles',bhaal:'Bhaal · Skull-Bladed Murderer',
   myrkul:'Myrkul · Lord of Bones',secret:'D23 Concealed North Passage'};
 for(const [id,door] of Object.entries(doors)){
   i.panelAction({id:`dd3-door-${id}`,label:()=>`${door.open?'Close':'Open'} ${doorNames[id]}`,
     run:()=>{door.toggle();info(`${doorNames[id]} is ${door.open?'open':'closed'}.`);}});
   i.clickable(door.mesh,doorNames[id],()=>door.toggle());
 }
 // D5: torches marking the 20-ft stair down from the hidden bathhouse door.
 for(const r of [6,7,8,9])b(8,r,3.4,.12,3.4,0x999085,.07+(9-r)*.06);
 torch(5,7);torch(11,9);
 const exit=b(9,9,1.6,.58,1.6,0xbca37e,.35);
 i.clickable(exit,'Stairs Back to Bathhouse',()=>i.travel('generic-bathhouse'));
 i.panelAction({id:'dd3-return',label:'Return Upstairs to Generic Bathhouse',run:()=>i.travel('generic-bathhouse')});
 // D6: corpse of Hiskaal afloat in two feet of vile water.
 d.corpse(9,21,{rot:1.18});d.stain(9,21,1.5);
 note('D6','Hiskaal floats face-down, his back scored by knife wounds. His fellow Bhaalists murdered him for letting a target escape.');
 // D7: viscera-streaked altar and large frowning steel skull.
 altar(21,21,0x594b43);d.bone(19,24,13);d.stain(21,22,2.2);
 const skull=ball(22,22,.8,0x979da2,5.1);click(skull,"Bhaal's Frowning Steel Mask",'A three-foot steel skull mask hangs above a stone slab covered with entrails.');
 // D8: disturb the moldy horror tapestry and reveal dangerous spores.
 let moldTriggered=false;
 const tapestry=b(20,29,3.6,4.8,.31,0x57433e,3.8);
 i.clickable(tapestry,'Moldy Tapestry',()=>{moldTriggered=true;info('D8: The tapestry is disturbed! Yellow mold spores billow out. Resolve saving throws and damage as GM.');});
 i.panelAction({id:'dd3-mold',label:()=>moldTriggered?'D8 · Mold Disturbed':'D8 · Disturb Moldy Tapestry',run:()=>{moldTriggered=true;info('Yellow mold spores burst forth! GM: resolve the hazard.');}});
 // D9 symbols mark the three ceremonial routes to different gods.
 for(const [c,r,color,text] of [[28,26,0x632532,'BHAAL'],[32,28,0x434d64,'BANE'],[29,30,0x53655e,'MYRKUL']]){
   b(c,r,2.6,.07,2.6,color,.09);sceneryLabel(c,r,text,{y:3.7,className:'dead-three-zone-label'});
 }
 // D10: three inert-looking cultists in a triangle, lit floor torch.
 torch(29,36);d.stain(29,36,1.2);
 note('D10','Three pale necromites feign death around a torch. GM: they rise to fight when discovered.');
 // D11: shattered sarcophagus concealing three stolen spellbooks.
 sarc(22,41,true);d.bone(20,41,12);
 const books=b(23,42,1.22,.25,.85,0x4f3655,.52);
 click(books,'Three Hidden Spellbooks','Three spellbooks lie hidden beneath the scattered bones in the ruined sarcophagus.');
 // D12: mixed dry/flooded altar, armoured tormentors, shackles and cursed gauntlets.
 altar(38,37,0x4f4b48);d.stain(39,37,1.4);
 b(41,38,.18,2.6,.18,0x383d45,2.8);
 const shackles=b(41,37,2.4,.28,.34,0x767977,5.1);
 click(shackles,'Klim Jhasso’s Shackles','Klim Jhasso hangs captive; Yignath holds a seven-key ring for these chains, D22 and D30.');
 const armour=b(44,35,1.6,3.8,1.2,0x5d6267,2.0,true);
 click(armour,'Helmless Plate Armour','The plate armour is welded together. Its gauntlets animate if touched or Klim is freed.');
 i.panelAction({id:'dd3-gauntlets',label:'D12 · Release Animated Gauntlets',run:()=>i.spawnNpc('spawn-animated-gauntlet',2)});
 // D13: corpse-mending table, Myrkul runes and roving skeletal rat swarm.
 const table=b(22,46,6.2,1.1,2.8,wood,.73,true);
 d.corpse(22,46);d.bone(25,47,14);
 click(table,'Necromancer’s Cadaver','Flennis is preparing a zombie on a scorched table; her skull-locked spellbook is hidden in her possessions.');
 // D15-D16 flooded side branch and disturbed crypt axe trap.
 for(const [c,r] of [[6,51],[7,43]]){d.brokenDebris(c,r,9);}
 sarc(8,43,true);
 const axe=b(9,44,1.2,.16,.38,0x95b6bb,3.7);
 click(axe,'Ghostly Battleaxe Trap','The sarcophagus triggers a spectral battleaxe when disturbed. Use the Spawn Ghostly Battleaxe control.');
 i.panelAction({id:'dd3-axe',label:'D16 · Trigger Ghostly Battleaxe',run:()=>i.spawnNpc('spawn-battleaxe',1)});
 // D17: black wax candles. GM-triggered phrase raises three skeletons.
 altar(52,36,0x46413e);
 for(let k=0;k<7;k++){
   const c=51+(k%3)*.42, r=35+(Math.floor(k/3)%3)*.42;
   b(c,r,.22,.48,.22,0x242128,2.62);
 }
 let candlesLit=false,skeletonsRaised=false;
 const light=g.pointLight(52,36,{color:0x79c684,intensity:0,range:24,height:4.2});
 const lightCandles=()=>{candlesLit=!candlesLit;light.intensity=candlesLit?2.5:0;
   info(candlesLit?'Green light reveals the words RISE AND BE COUNTED!':'The black candles are extinguished.');};
 i.panelAction({id:'dd3-candles',label:()=>candlesLit?'D17 · Extinguish Green Candles':'D17 · Light Black Candles',run:lightCandles});
 i.panelAction({id:'dd3-skeletons',label:'D17 · Speak RISE AND BE COUNTED',enabled:()=>candlesLit&&!skeletonsRaised,
   run:()=>{skeletonsRaised=true;i.spawnNpc('spawn-skeleton',3);info('Three skeletons rise; they obey the speaker until destroyed.');}});
 // D18: foul gas. Explicitly narrative—no automatic explosion or saving throws.
 for(let k=0;k<7;k++)ball(52+(k%4),22+(k%3),.24,0x74805b,1.2+k*.25);
 note('D18','Rotten-egg gas fills this flooded chamber. GM adjudicates fire or explosion consequences.');
 // D19–D21: crypts with disturbed sarcophagi, mummy treasure and six zombies.
 sarc(67,43,false);d.brokenDebris(68,44,8);
 sarc(72,43,true);d.bone(71,44,14);
 note('D20','The coffin has a false plaster bottom hiding a mummy, moonstone eyes and a bag of beans.');
 sarc(77,43,true);d.bone(78,44,18);
 note('D21','Six zombies created by Flennis shamble near a desecrated sarcophagus.');
 // D22: two shackled bodies, bloody chair and salt bucket.
 const chair=b(81,35,2.6,1.8,2.0,wood,.9,true);
 d.stain(81,35,2.5);d.stain(82,35,1.3);
 b(81,34,.3,3,.3,0x858587,3.3);
 const chains=b(83,34,.18,2.0,.18,0x9e9b96,4);
 click(chains,'D22 Captives','Two lifeless shackled prisoners, one elderly man and one young tiefling, hang in a bloodied torture chamber.');
 // D23 sentry, D24/D25 cultist sleeping crypts.
 torch(86,36);
 sarc(88,45,true);for(const [c,r] of [[86,44],[89,44],[89,46]])b(c,r,2.4,.08,1.3,0x5e4a3b,.07);
 sarc(93,41,true);torch(92,40);torch(94,42);
 // D26 blood-filled coffin.
 sarc(93,33,true,red);d.splash(93,33,13);torch(94,31);
 note('D26','Bhaal worshippers bathe in the blood-filled sarcophagus. A reaper lurks behind it.');
 // D27 ripples and the sound of combat from D29.
 for(const [c,r] of [[84,25],[86,25],[88,25]])b(c,r,2.0,.018,2.5,0x799092,.1);
 note('D27','From the flooded passage you hear echoes of violent combat in D29.');
 // D28 four animated skeletons concealed under murky cellar water.
 d.brokenDebris(94,25,9);
 i.panelAction({id:'dd3-cellar-ambush',label:'D28 · Raise Four Skeletons',run:()=>i.spawnNpc('spawn-skeleton',4,{minC:91,maxC:95,minR:22,maxR:28})});
 // D29 Mortlock and skull-faced assassin duel on an island above floodwater.
 for(let r=20;r<=26;r++)for(let c=69;c<=75;c++)
   if(Math.abs(c-72)+Math.abs(r-23)<=4)b(c,r,3.86,.15,3.86,0x776e62,.15);
 for(const [c,r] of [[69,24],[74,26],[76,23]]){d.corpse(c,r);}
 for(const [c,r] of [[68,24],[76,20]])torch(c,r);
 note('D29','Gravely wounded Mortlock Vanthampur fights a skull-faced Bhaal assassin on a raised island.');
 // D30 treasure from Tiamat: four separately inspectable padlocked chests.
 const treasures=[
  '4,500 cp and two red-stoppered potions of fire breath',
  '1,250 sp and ten eye agates',
  'Porcelain dragon mask, 2,400 cp and 500 sp',
  'Bronze crown whose five points resemble chromatic dragon heads',
 ];
 for(let k=0;k<4;k++){
   const c=74.45+(k%2)*1.1,r=30.45+Math.floor(k/2)*1.1;
   const chest=b(c,r,1.7,1.05,1.45,wood,.55);
   b(c,r,1.8,.18,1.5,bronze,1.15);
   click(chest,`Tiamat's Chest ${k+1}`,`Chest ${k+1} (DC 15 thieves' tools or Yignath's keys): ${treasures[k]}.`);
 }
 // All four padlocked chests occupy the central treasure stack.
 for(const [c,r] of [[74,30],[75,30],[74,31],[75,31]])a.block(c,r);
 // Northern temple/crypts are lit by a few guttering torches.
 for(const [c,r] of [[65,10],[79,11],[93,25]])torch(c,r);
 note('D33','Far northern shrine reached through the long, unlit limestone corridors.');
 // Visual cues: unlit by default, except scattered torchlight and pale water.
 for(const [c,r] of [[20,22],[40,37],[72,23],[88,45],[54,24]])
   g.pointLight(c,r,{color:0x819c9a,intensity:.38,range:19,height:4});
}
