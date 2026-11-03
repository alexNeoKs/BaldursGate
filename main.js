import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// BALDUR'S GATE: LIVING CITY ATLAS
// Zero-build GitHub Pages project; all positions use the supplied map's rough
// 1500x1000 cartographic coordinate space, translated into Three.js world units.
// A much larger playable world. A grid cell is 1.8 world units: roads are exactly
// ten cells (major) or five cells (minor) wide.
const MAP_W = 1500, MAP_H = 1000, SCALE = 0.50;
const GRID_CELL=1.8, MAIN_ROAD=GRID_CELL*10, MINOR_ROAD=GRID_CELL*5;
const EXTENTS={minX:-270,maxX:1780,minZ:-370,maxZ:1330};
const X = n => (n - MAP_W / 2) * SCALE;
const Z = n => (n - MAP_H / 2) * SCALE;
const fromMap = (x, y) => new THREE.Vector3(X(x), 0, Z(y));
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const v = (x,y,z) => new THREE.Vector3(x,y,z);
let seed = 924631;
function rng(){ seed = (Math.imul(seed,1664525) + 1013904223) >>> 0; return seed / 4294967296; }
function rr(a,b){return a+(b-a)*rng();}
function pick(arr){return arr[Math.floor(rng()*arr.length)];}
function smooth(a,b,t){const s=clamp((t-a)/(b-a),0,1);return s*s*(3-2*s);}
function distToSegment2(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(px-(ax+t*dx),pz-(az+t*dz));}
function closestPointOnSegment(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz||1),0,1);return {x:ax+t*dx,z:az+t*dz,t};}
const RIVER_NORTH=[[-270,930],[0,795],[100,732],[215,651],[305,531],[410,502],[520,515],[640,545],[735,608],[885,626],[1035,609],[1180,590],[1340,572],[1500,555],[1780,505]];
const RIVER_SOUTH=[[-270,1170],[0,975],[120,862],[250,782],[380,703],[520,692],[660,715],[780,755],[1015,784],[1225,773],[1370,757],[1500,740],[1780,696]];
function samplePolylineY(points, x){for(let i=0;i<points.length-1;i++){const [ax,ay]=points[i],[bx,by]=points[i+1];if(x>=ax && x<=bx)return lerp(ay,by,(x-ax)/(bx-ax));}return x<points[0][0]?points[0][1]:points.at(-1)[1];}
function inRiver(px,pz){return pz>samplePolylineY(RIVER_NORTH,px)&&pz<samplePolylineY(RIVER_SOUTH,px);}
function hillHeight(wx,wz){const px=wx/SCALE+750,pz=wz/SCALE+500;const dx=(px-995)/300,dz=(pz-370)/225;
  const r=Math.hypot(dx,dz);const main=26.5*Math.pow(Math.max(0,1-r*r),1.55);
  const ridge=6.4*Math.exp(-(((px-1135)/170)**2)-(((pz-355)/90)**2));
  const shoulder=3.0*Math.exp(-(((px-910)/150)**2)-(((pz-455)/110)**2));
  return Math.max(0,main+ridge+shoulder);
}
function groundY(wx,wz){return .12+hillHeight(wx,wz);}
function walkingY(wx,wz){
  const px=wx/SCALE+750,pz=wz/SCALE+500;
  const onCrossing=(1-smooth(12,25,Math.abs(px-1339)))*smooth(548,585,pz)*(1-smooth(781,810,pz));
  return lerp(groundY(wx,wz)+.17,2.78,onCrossing);
}
const up = new THREE.Vector3(0,1,0);
function polygonContains(x,y,coords){let yes=false;for(let i=0,j=coords.length-1;i<coords.length;j=i++){const a=coords[i],b=coords[j];if(((a[1]>y)!=(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))yes=!yes;}return yes;}

const LANDMARKS = [
  // Lower City: the riverfront, commerce and the neighborhoods between walls.
  {id:'gray-harbor',name:'Gray Harbor',district:'lower',kind:'harbor',x:460,z:472,major:true,desc:'The great harbor of Baldur’s Gate. Cranes, wharves and cargo ships gather beneath the city.'},
  {id:'counting-house',name:'Counting House',district:'lower',kind:'bank',x:443,z:348,major:true,desc:'A formidable institution of coin, contracts and heavily guarded vaults.'},
  {id:'sorcerous-sundries',name:'Sorcerous Sundries',district:'lower',kind:'tower',x:599,z:179,major:true,desc:'Arcane wares, mysterious scrolls and the promise of magic, at a price.'},
  {id:'water-queens-house',name:"Water Queen's House",district:'lower',kind:'temple',x:404,z:425,major:true,desc:'The imposing seaside shrine of Umberlee and her perilous waters.'},
  {id:'blade-and-stars',name:'Blade and Stars',district:'lower',kind:'tavern',x:598,z:236,desc:'A familiar inn and meeting spot for travelers and city folk.'},
  {id:'blushing-mermaid',name:'Blushing Mermaid',district:'lower',kind:'tavern',x:506,z:177,desc:'A notorious tavern with a colorful clientele and an even more colorful reputation.'},
  {id:'elfsong-tavern',name:'Elfsong Tavern',district:'lower',kind:'tavern',x:493,z:316,major:true,desc:'An old favorite of adventurers. Rumor has it the very walls remember a song.'},
  {id:'generic-bathhouse',name:'Generic Bathhouse',district:'lower',kind:'bathhouse',x:375,z:310,desc:'Steam rooms, pools and private conversations in the Lower City.'},
  {id:'low-lantern',name:'Low Lantern',district:'lower',kind:'ship',x:505,z:553,desc:'A floating tavern on an old ship anchored in the harbor.'},
  {id:'flaming-fist-barracks',name:'Flaming Fist Barracks',district:'lower',kind:'barracks',x:225,z:267,major:true,desc:'An armed post of the Flaming Fist, always ready to enforce order.'},
  {id:'baldurs-gate',name:"Baldur's Gate",district:'lower',kind:'gate',x:318,z:295,desc:'The venerable gate from which the city takes its name.'},
  {id:'basilisk-gate',name:'Basilisk Gate',district:'outer',kind:'gate',x:606,z:325,major:true,desc:'An eastern gateway linking the Lower City to the Outer City.'},
  {id:'gond-gate',name:'Gond Gate',district:'lower',kind:'gate',x:286,z:370,desc:'A fortified entry amid the busy western wards.'},
  {id:'baldurs-mouth',name:"Baldur's Mouth",district:'lower',kind:'printing',x:353,z:336,desc:'The city’s famous broadsheet and news publishing house.'},
  {id:'leoric-house',name:"Leoric's House",district:'lower',kind:'townhouse',x:435,z:267,desc:'The home of Leoric, the elven cleric of your adventuring party.'},
  {id:'temple-of-selune',name:'Temple of Selûne',district:'lower',kind:'temple',x:239,z:335,desc:'A moonlit sanctuary honoring the goddess Selûne.'},
  {id:'house-of-grief',name:'House of Grief',district:'lower',kind:'temple-dark',x:143,z:386,desc:'A sombre house of worship, secrets and forgotten sorrow.'},
  {id:'bloomridge-park',name:'Bloomridge Park',district:'lower',kind:'park',x:265,z:446,major:true,desc:'A sheltered patch of greenery amid busy and tightly packed streets.'},
  // Outer City and Rivington: settlements and scattered points of interest.
  {id:'cohens-house',name:"Cohen's House",district:'outer',kind:'cottage',x:1200,z:543,major:true,desc:'Cohen the human paladin’s cozy cottage near Wyrm’s Crossing in the Outer City.'},
  {id:'jasmines-house',name:"Jasmine's House",district:'outer',kind:'cottage',x:1239,z:537,major:true,desc:'Jasmine’s cottage, immediately next door to Cohen’s near Wyrm’s Crossing.'},
  {id:'graveyard',name:'Graveyard',district:'outer',kind:'graveyard',x:805,z:532,major:true,desc:'A quiet burial ground along the rise outside the city.'},
  {id:'wyrms-crossing',name:"Wyrm's Crossing",district:'outer',kind:'crossing',x:1339,z:637,major:true,desc:'The long, fortified bridge across the Chionthar to Rivington.'},
  {id:'danthelons-dancing-axe',name:"Danthelon's Dancing Axe",district:'outer',kind:'tavern',x:1285,z:537,major:true,desc:'A celebrated outfitter and place to trade tales near Wyrm’s Crossing.'},
  {id:'cliff-gate',name:'Cliff Gate',district:'outer',kind:'gate',x:699,z:458,desc:'A gate set into the cliffside routes of the eastern outskirts.'},
  {id:'shitty-bars-bar',name:"Shitty Bar's Bar",district:'outer',kind:'tavern',x:1117,z:500,major:true,desc:'A decidedly questionable drinking establishment created for this campaign.'},
  // Upper City landmarks: represent the walled and wealthy western district.
  {id:'high-hall',name:'High Hall',district:'upper',kind:'palace',x:303,z:220,major:true,desc:'Seat of the wealthy and powerful in Baldur’s Gate.'},
  {id:'watch-citadel',name:'Watch Citadel',district:'upper',kind:'barracks',x:153,z:266,major:true,desc:'A stronghold of soldiers and watchmen overlooking the city.'},
  {id:'ladys-hall',name:"Lady's Hall",district:'upper',kind:'temple',x:211,z:200,desc:'A stately temple in the refined Upper City.'},
  {id:'ducal-palace',name:'Ducal Palace',district:'upper',kind:'palace',x:283,z:157,major:true,desc:'A grand seat of ducal authority and civic ceremony.'},
  {id:'upper-city-gardens',name:'Upper City Gardens',district:'upper',kind:'park',x:400,z:155,desc:'Elegant formal gardens tucked behind the Upper City’s walls.'},
  {id:'helm-and-cloak',name:'Helm and Cloak',district:'upper',kind:'tavern',x:157,z:222,desc:'A refined establishment favored by visitors to the Upper City.'},
];
// V9: Named interiors are explicit entries, never random crime events.
// Keep this list aligned with interiors/places/scene-registry.js.
const LANDMARK_INTERIORS = Object.freeze({
  'elfsong-tavern': './interiors/places/index.html?place=elfsong-tavern',
  'wyrms-crossing': './interiors/places/index.html?place=wyrms-crossing',
  'graveyard': './interiors/places/index.html?place=graveyard',
  'house-of-grief': './interiors/places/index.html?place=house-of-grief',
  'flaming-fist-barracks': './interiors/places/index.html?place=flaming-fist-barracks',
  'generic-bathhouse': './interiors/places/index.html?place=generic-bathhouse',
  'temple-of-selune': './interiors/places/index.html?place=temple-of-selune',
});
function interiorUrlFor(landmark) {
  return LANDMARK_INTERIORS[landmark.id] || (landmark.interiorExists ? `./interiors/${landmark.id}.html` : null);
}
function openLandmarkInterior(landmark) {
  const url = interiorUrlFor(landmark);
  if(url) window.open(url, '_blank', 'noopener');
}
const BY_ID = Object.fromEntries(LANDMARKS.map(l=>[l.id,l]));
const ICONS={harbor:'⚓',bank:'◆',tower:'✧',temple:'☽','temple-dark':'☾',tavern:'♜',bathhouse:'♨',ship:'⚓',barracks:'⚔',gate:'⌂',printing:'✎',townhouse:'⌂',park:'♣',cottage:'⌂',graveyard:'✝',crossing:'≋',palace:'♛'};
const DISTRICT_NAMES={upper:'UPPER CITY',lower:'LOWER CITY',outer:'OUTER CITY'};
const CRIMES=[
  {id:'loitering',title:'Loitering',tier:1,target:'person'},
  {id:'murder',title:'Murder',tier:2,target:'unlabelled-house'},
  {id:'mugging',title:'Mugging',tier:3,target:'pair'},
  {id:'urination',title:'Public Urination',tier:3,target:'person'},
  {id:'thief',title:'Thief',tier:3,target:'building'},
  {id:'harassment',title:'Harassment',tier:3,target:'pair'},
];
// V8: Each new murder opens the next bespoke encounter. Named landmarks
// are never eligible and five distinct houses are used for the first five cases.
const MURDER_SCENES=[
  'Civilian House of Bhaal',
  'Bane Interrogation Chamber',
  'Myrkul Bone Chamber',
  'Murdered Family Home',
  'Cultist Safehouse'
];
let nextMurderScene=0;
function murderUrl(incident){return `./interiors/murder.html?scene=${incident.sceneIndex}&case=${incident.id}`;}
function enterMurderScene(incident){
  if(incident?.definition.id!=='murder'||!incident.sceneIndex)return;
  window.open(murderUrl(incident),'_blank','noopener');
}
const PLAYERS=[
  {id:'leoric',name:'Leoric',race:'Elf',role:'Cleric',color:0xe0c6a1,symbol:'✚'},
  {id:'cohen',name:'Cohen',race:'Human',role:'Paladin',color:0xd5ac62,symbol:'⚔'},
  {id:'zaazu',name:'Zaazu',race:'Goblin',role:'Wizard',color:0x9aca83,symbol:'✧'},
  {id:'iimar',name:'IImar',race:'Dhampir',role:'Ranger',color:0x9db0c2,symbol:'➶'},
];

const viewport=document.querySelector('#viewport');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xa5b9b3);
scene.fog=new THREE.FogExp2(0x9faea8,.00030);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.32;
viewport.appendChild(renderer.domElement);
const labelsRenderer=new CSS2DRenderer();
labelsRenderer.setSize(window.innerWidth,window.innerHeight);
labelsRenderer.domElement.style.cssText='position:absolute;inset:0;pointer-events:none;';
viewport.appendChild(labelsRenderer.domElement);
const camera=new THREE.OrthographicCamera(-450,450,250,-250,.2,3000);
camera.position.set(340,420,460);
camera.lookAt(0,0,0);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.075;
controls.screenSpacePanning=true;
controls.minZoom=.55;controls.maxZoom=10;
controls.maxPolarAngle=1.54;controls.minPolarAngle=.02;
controls.target.set(0,0,0);
controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
const hemi=new THREE.HemisphereLight(0xf1edce,0x647f78,2.1);scene.add(hemi);
let topView=false,savedAngledView=null;
const keyboardPan={w:false,a:false,s:false,d:false};
const sun=new THREE.DirectionalLight(0xffe5b4,3.0);
sun.position.set(-75,130,20);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-450;sun.shadow.camera.right=450;sun.shadow.camera.top=450;sun.shadow.camera.bottom=-450;sun.shadow.normalBias=.04;
scene.add(sun,sun.target);
const moon=new THREE.DirectionalLight(0x84aed5,.45);moon.position.set(75,120,-50);scene.add(moon);
const world=new THREE.Group();scene.add(world);
const buildingsGroup=new THREE.Group();world.add(buildingsGroup);
const NPCGroup=new THREE.Group();world.add(NPCGroup);
const effectsGroup=new THREE.Group();world.add(effectsGroup);
const pathGroup=new THREE.Group();pathGroup.renderOrder=6;world.add(pathGroup);
const geometryCache={};
const mats={};
function mat(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.93,metalness:0,...extra});}
const M={grass:mat(0x8f9d7e),sand:mat(0xb7ac85),sea:mat(0x609d9d,{roughness:.66,metalness:.07}),road:mat(0xa49c85),roadBorder:mat(0x736c5b),wall:mat(0xb7ac91),wallTop:mat(0xd2be97),stoneDark:mat(0x676f69),gold:mat(0xe0ba70,{metalness:.25}),wood:mat(0x715b42),woodLight:mat(0xa88a61),white:mat(0xe4d9b6),red:mat(0xa75143),blue:mat(0x54879c),bronze:mat(0x9e7957),tree:mat(0x55795a),tree2:mat(0x729366),bark:mat(0x5b5240),roofA:mat(0x6b7773),roofB:mat(0x946854),roofC:mat(0x597a77),roofD:mat(0xa88762),roofE:mat(0x696a80),roofF:mat(0x79674e)};
const ROOFS=[M.roofA,M.roofB,M.roofC,M.roofD,M.roofE,M.roofF];
const terrainBox={xmin:X(EXTENTS.minX),xmax:X(EXTENTS.maxX),zmin:Z(EXTENTS.minZ),zmax:Z(EXTENTS.maxZ)};
function cachedShape(key,build){let shape=geometryCache[key];if(!shape){shape=build();geometryCache[key]=shape;}return shape;}
function gBox(w,h,d){return cachedShape(`box:${w}:${h}:${d}`,()=>new THREE.BoxGeometry(w,h,d));}
function box(parent,w,h,d,x,y,z,material,rot=0){const m=new THREE.Mesh(gBox(w,h,d),material);m.position.set(x,y,z);m.rotation.y=rot;m.castShadow=h>.4;m.receiveShadow=true;parent.add(m);return m;}
function cyl(parent,rt,rb,h,x,y,z,material,segments=8){const geo=cachedShape(`cyl:${rt}:${rb}:${h}:${segments}`,()=>new THREE.CylinderGeometry(rt,rb,h,segments));const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function sphere(parent,r,x,y,z,material,seg=8){const geo=cachedShape(`sphere:${r}:${seg}`,()=>new THREE.SphereGeometry(r,seg,6));const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
function cone(parent,r,h,x,y,z,material,seg=4){const geo=cachedShape(`cone:${r}:${h}:${seg}`,()=>new THREE.ConeGeometry(r,h,seg));const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function segment(parent,a,b,width,height,material,yOffset=0){const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);const m=box(parent,width,height,length,(a.x+b.x)/2,(a.y+b.y)/2+yOffset,(a.z+b.z)/2,material);m.rotation.y=-Math.atan2(dx,dz);return m;}
function P(px,pz,height=0){const a=fromMap(px,pz);a.y=groundY(a.x,a.z)+height;return a;}
function createTerritory(){
  const worldWidth=(EXTENTS.maxX-EXTENTS.minX)*SCALE,worldDepth=(EXTENTS.maxZ-EXTENTS.minZ)*SCALE;
  const geom=new THREE.PlaneGeometry(worldWidth,worldDepth,265,220);
  geom.rotateX(-Math.PI/2);
  geom.translate(X((EXTENTS.minX+EXTENTS.maxX)/2),0,Z((EXTENTS.minZ+EXTENTS.maxZ)/2));
  const pos=geom.attributes.position;const colors=[];const ca=new THREE.Color(),c1=new THREE.Color(0xa7a98b),c2=new THREE.Color(0xc9b68f),c3=new THREE.Color(0x838e70);
  for(let i=0;i<pos.count;i++){const wx=pos.getX(i),wz=pos.getZ(i),h=groundY(wx,wz);pos.setY(i,h);
    const rough=(Math.sin(wx*.11+wz*.09)*Math.cos(wx*.06-wz*.12)+Math.sin(wx*.03+wz*.18))*.12;
    ca.copy(c1).lerp(c2,clamp(.22+h*.023+rough,0,1)).lerp(c3,clamp((h-5)/22,0,.46));
    const mpz=wz/SCALE+MAP_H/2;
    const mpx=wx/SCALE+MAP_W/2;
    const forestTint=mpz>samplePolylineY(RIVER_SOUTH,mpx)+30;
    if(forestTint)ca.lerp(new THREE.Color(0x788f68),.38);
    colors.push(ca.r,ca.g,ca.b);}
  geom.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geom.computeVertexNormals();
  const mesh=new THREE.Mesh(geom,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));mesh.receiveShadow=true;world.add(mesh);
  // Historical district cobblestones, laid below buildings and highways.
  const districts=[{coords:[[83,130],[345,80],[532,121],[559,293],[360,331],[118,314]],color:0xb6a88a},{coords:[[88,305],[365,313],[555,257],[676,451],[547,565],[171,612],[52,475]],color:0xa7a08b},{coords:[[625,232],[751,114],[1065,126],[1250,270],[1460,437],[1465,575],[1220,566],[1110,526],[800,559],[661,459]],color:0xa2aa87},
    {coords:[[-225,-345],[1720,-345],[1735,245],[1320,255],[880,175],[480,225],[-215,270]],color:0xb3aa8d},
    {coords:[[1160,795],[1640,785],[1655,1065],[1170,1055]],color:0xb2a78c}];
  for(const d of districts){const s=new THREE.Shape();d.coords.forEach(([x,z],i)=>i===0?s.moveTo(X(x),-Z(z)):s.lineTo(X(x),-Z(z)));s.closePath();const ge=new THREE.ShapeGeometry(s);ge.rotateX(-Math.PI/2);const m=new THREE.Mesh(ge,mat(d.color,{transparent:true,opacity:.37,depthWrite:false,side:THREE.DoubleSide}));m.position.y=.22;world.add(m);}
  createRiver();createGrid();createShore();
}
let gridObjects=[];
function createGrid(){
  // Lines follow the terrain surface instead of hovering over the landscape.
  const bounds=terrainBox,step=GRID_CELL;
  for(const major of [false,true]){
    const points=[];
    const lineStep=step*(major?5:1);
    for(let x=Math.ceil(bounds.xmin/lineStep)*lineStep;x<=bounds.xmax;x+=lineStep){
      if(!major&&Math.abs(Math.round(x/step)%5)===0)continue;
      for(let z=bounds.zmin;z<bounds.zmax;z+=7){
        const z2=Math.min(z+7,bounds.zmax),y1=inRiver(x/SCALE+750,z/SCALE+500)?.51:groundY(x,z)+.10,y2=inRiver(x/SCALE+750,z2/SCALE+500)?.51:groundY(x,z2)+.10;
        if(inRiver(x/SCALE+750,(z+z2)*.5/SCALE+500))continue;
        points.push(x,y1,z,x,y2,z2);
      }
    }
    for(let z=Math.ceil(bounds.zmin/lineStep)*lineStep;z<=bounds.zmax;z+=lineStep){
      if(!major&&Math.abs(Math.round(z/step)%5)===0)continue;
      for(let x=bounds.xmin;x<bounds.xmax;x+=7){
        const x2=Math.min(x+7,bounds.xmax),y1=inRiver(x/SCALE+750,z/SCALE+500)?.51:groundY(x,z)+.10,y2=inRiver(x2/SCALE+750,z/SCALE+500)?.51:groundY(x2,z)+.10;
        if(inRiver((x+x2)*.5/SCALE+750,z/SCALE+500))continue;
        points.push(x,y1,z,x2,y2,z);
      }
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    const line=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:major?0x596b58:0x637260,transparent:true,opacity:major?.23:.12,depthWrite:false}));
    line.renderOrder=4;world.add(line);gridObjects.push(line);
  }
}
function shapeFromWorld(points){const s=new THREE.Shape();points.forEach(([x,z],i)=>i?s.lineTo(X(x),-Z(z)):s.moveTo(X(x),-Z(z)));s.closePath();const g=new THREE.ShapeGeometry(s);g.rotateX(-Math.PI/2);return g;}
function createRiver(){const all=[...RIVER_NORTH,...RIVER_SOUTH.slice().reverse()];const m=new THREE.Mesh(shapeFromWorld(all),M.sea);m.position.y=.37;m.receiveShadow=true;world.add(m);
  // No drawn sparkle/wave lines: they previously looked like stray roads
  // crossing the river from an oblique camera angle. Keep only 3D boats.
  for(let i=0;i<20;i++){const x=rr(120,1270),y=rr(samplePolylineY(RIVER_NORTH,x)+15,samplePolylineY(RIVER_SOUTH,x)-15);const boat=new THREE.Group();const p=fromMap(x,y);boat.position.set(p.x,.53,p.z);box(boat,rr(1.3,2.7),.28,.62,0,0,0,M.wood,rr(-.5,.5));cyl(boat,.04,.04,.9,0,.55,0,M.white,5);boat.rotation.y=rr(-.4,.4);world.add(boat);}
}
function createShip(px,pz,scale=1,heading=0,large=true){
  const group=new THREE.Group(),point=fromMap(px,pz);
  group.position.set(point.x,.70,point.z);group.rotation.y=heading;
  const timber=M.wood;
  // Pointed wooden hull and rails; Z is the ship's fore-aft direction.
  const profile=new THREE.Shape();
  profile.moveTo(-2.2,-6.6);profile.lineTo(-3.5,-3.5);profile.lineTo(-3.9,3.3);
  profile.lineTo(-2.7,6.8);profile.lineTo(0,8.2);profile.lineTo(2.7,6.8);
  profile.lineTo(3.9,3.3);profile.lineTo(3.5,-3.5);profile.lineTo(2.2,-6.6);profile.closePath();
  const hullGeo=new THREE.ExtrudeGeometry(profile,{depth:1.6,bevelEnabled:true,bevelSegments:1,steps:1,bevelThickness:.3,bevelSize:.35});
  hullGeo.rotateX(Math.PI/2);
  const hull=new THREE.Mesh(hullGeo,timber);hull.castShadow=true;group.add(hull);
  box(group,6.4,.6,11.6,0,.68,0,M.woodLight);
  box(group,4.3,2.0,4.0,0,1.55,-3.3,timber);
  for(const side of [-1,1])for(let z=-5;z<=5;z+=2){box(group,.26,1.2,.24,side*3.1,1.2,z,timber);}
  for(const z of [-1.5,3]){
    cyl(group,.24,.3,large?12:8,0,large?6.7:4.7,z,timber,8);
    const sailMat=mat(0xe9debf,{side:THREE.DoubleSide});
    const sail=new THREE.Mesh(new THREE.PlaneGeometry(large?7.5:6,large?8.6:6.4),sailMat);
    sail.position.set(0,large?7.2:5.1,z+.25);group.add(sail);
    box(group,large?8.4:6.6,.15,.16,0,large?11.1:8.0,z,timber);
    box(group,large?8.4:6.6,.15,.16,0,large?3.2:2.2,z,timber);
  }
  group.scale.setScalar(scale);world.add(group);
  return group;
}
function populateHarbor(){
  // Several obvious ocean-going merchant ships plus smaller docked craft.
  const spots=[];
  for(let i=0;i<34;i++){
    const px=rr(255,755),north=samplePolylineY(RIVER_NORTH,px),south=samplePolylineY(RIVER_SOUTH,px);
    const pz=rr(north+16,Math.min(north+103,south-18));
    if(!inRiver(px,pz)||(Math.abs(px-505)<28&&Math.abs(pz-553)<35))continue;
    if(spots.some(s=>Math.hypot((s[0]-px)*SCALE,(s[1]-pz)*SCALE)<21))continue;
    spots.push([px,pz]);createShip(px,pz,rr(.54,.86),rr(-.55,.55),i%3!==0);
  }
  // Additional quays extending from Gray Harbor into the water.
  for(const px of [300,340,380,426,475,520,558,625,700,742]){
    const z=samplePolylineY(RIVER_NORTH,px),tip=fromMap(px,z+rr(17,30)),land=fromMap(px,z-10);
    land.y=.60;tip.y=.60;segment(world,land,tip,3.0,.7,M.wood);
    for(let s of [-1,1]){
      const p=fromMap(px+s*5,z+10);box(world,.45,2.9,.45,p.x,.05,p.z,M.wood);
    }
  }
}
function createShore(){for(const coast of [RIVER_NORTH,RIVER_SOUTH]){for(let i=0;i<coast.length-1;i++){const [a,b]=[coast[i],coast[i+1]];const from=P(...a,.17),to=P(...b,.17);from.y=.52;to.y=.52;segment(world,from,to,.7,.20,M.sand);}}}
function roadStrip(a,b,width,material,raise=0.0){
  // Build a terrain-hugging road ribbon, sampling every few world units.
  const ax=X(a[0]),az=Z(a[1]),bx=X(b[0]),bz=Z(b[1]);
  const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);
  if(len<.01)return;
  const nx=-dz/len,nz=dx/len,n=Math.max(3,Math.ceil(len/2.4));
  const verts=[],idx=[];
  for(let i=0;i<=n;i++){
    const t=i/n,mx=lerp(ax,bx,t),mz=lerp(az,bz,t);
    for(const side of [-1,1]){
      const px=mx+nx*side*width/2,pz=mz+nz*side*width/2;
      const mapX=px/SCALE+750,mapZ=pz/SCALE+500;
      const bridge=inRiver(mapX,mapZ)&&Math.abs(mapX-1339)<22;
      const yy=(bridge?2.64:groundY(px,pz))+.12+raise;
      verts.push(px,yy,pz);
    }
    if(i<n){const k=2*i;idx.push(k,k+2,k+1,k+1,k+2,k+3);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,material);mesh.material.side=THREE.DoubleSide;mesh.material.polygonOffset=true;mesh.material.polygonOffsetFactor=-2;mesh.material.polygonOffsetUnits=-3;mesh.receiveShadow=true;mesh.castShadow=false;mesh.renderOrder=6;pathGroup.add(mesh);
}
function batchedRoadStrips(spurs,width,material,raise){
  const vertices=[],indices=[];
  for(const spur of spurs){
    const a=spur.from,b=spur.to;
    const ax=X(a[0]),az=Z(a[1]),bx=X(b[0]),bz=Z(b[1]);
    const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);
    if(len<0.2)continue;
    const nx=-dz/len,nz=dx/len,n=Math.max(2,Math.ceil(len/3));
    const base=vertices.length/3;
    for(let i=0;i<=n;i++){
      const t=i/n,mx=lerp(ax,bx,t),mz=lerp(az,bz,t);
      for(const side of [-1,1]){
        const x=mx+nx*side*width/2,z=mz+nz*side*width/2;
        vertices.push(x,groundY(x,z)+.12+raise,z);
      }
      if(i<n){const k=base+2*i;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
    }
  }
  if(!indices.length)return;
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,material);mesh.receiveShadow=true;
  mesh.castShadow=false;mesh.renderOrder=6;pathGroup.add(mesh);
}
function isWalkableSegment(a,b){
  for(let i=0;i<=24;i++){
    const t=i/24,x=lerp(a[0],b[0],t),z=lerp(a[1],b[1],t);
    if(inRiver(x,z)&&Math.abs(x-1339)>22)return false;
  }
  return true;
}
// All streets and front-door approaches share the same single, terrain-hugging
// cobblestone surface. Overlapping dark borders caused the old triangular joins.
function addRoad(nodes,width,minor=false){for(let i=0;i<nodes.length-1;i++){
    const a=nodes[i],b=nodes[i+1];
    if(!isWalkableSegment(a,b))continue;
    roadStrip(a,b,width,M.road,.14);
  }
}
const ROAD_PATHS=[
  [[125,269],[230,272],[319,284],[432,280],[530,306],[605,327],[730,317],[865,277],[985,214],[1150,285],[1260,405],[1340,566],[1338,634],[1340,786]],
  [[133,423],[253,439],[361,420],[460,390],[525,433],[610,449],[711,466],[824,510],[990,524],[1127,508],[1286,537],[1336,565]],
  [[185,562],[260,490],[343,457],[433,469],[528,479],[611,481],[708,510],[824,510],[989,524]],
  [[212,143],[310,152],[406,194],[491,246],[529,306],[520,433],[528,479]],
  [[125,269],[150,194],[212,143],[280,110],[407,194],[492,245]],
  [[133,423],[117,367],[125,269],[228,313],[319,284]],
  [[236,319],[302,362],[361,420],[343,457],[260,490],[185,562]],
  [[319,284],[302,362],[433,469]],
  [[605,327],[653,244],[749,186],[858,187],[985,214],[1090,251],[1150,285]],
  [[605,327],[681,373],[754,401],[824,510]],
  [[730,317],[681,373],[711,466]],
  [[749,186],[836,148],[950,158],[1090,251]],
  [[1150,285],[1230,361],[1260,405],[1161,477],[1127,508]],
  [[1260,405],[1314,464],[1286,537],[1340,566]],
  [[1340,786],[1323,827],[1290,860],[1358,873],[1420,856],[1460,895]],
  [[150,335],[245,332],[318,330],[390,336],[470,352],[545,363],[612,375]],
  [[206,240],[230,305],[240,370],[263,439],[292,505]],
  [[438,283],[420,346],[410,418],[424,488]],
  [[858,187],[845,260],[826,344],[822,431],[824,510]],
  [[985,214],[1037,265],[1090,322],[1138,392],[1161,477]],
  [[1150,523],[1215,534],[1286,537],[1338,565]],
  [[1198,495],[1220,517],[1286,537]],
  [[1268,479],[1295,514],[1286,537]],
  [[420,165],[535,132],[682,122],[818,138],[946,176],[985,214]],
  [[470,248],[566,228],[658,236],[760,257],[865,277]],
  [[612,120],[620,190],[653,244]],
  [[792,136],[796,208],[785,268]],
  [[900,180],[1010,200],[1150,285]],
  [[678,519],[760,576],[896,604],[1040,604],[1180,587],[1338,565]],
  [[1160,430],[1225,450],[1280,483],[1286,537]],
  // V6: Northern urban expansion. Broad continuous avenues connect the former woodland
  // to the city centre; each side street joins at least one of these avenues.
  [[-220,-232],[-95,-224],[45,-216],[185,-224],[330,-225],[480,-228],[640,-224],[790,-213],[950,-213],[1100,-224],[1250,-221],[1410,-214],[1580,-220],[1730,-218]],
  [[-220,-75],[-90,-68],[50,-72],[190,-67],[330,-73],[480,-68],[640,-62],[790,-73],[950,-65],[1100,-65],[1250,-69],[1410,-60],[1580,-64],[1730,-65]],
  [[-210,93],[-70,100],[60,98],[190,105],[330,96],[480,96],[640,102],[790,91],[950,88],[1100,96],[1250,90],[1410,100],[1580,92],[1730,94]],
  [[-202,226],[-75,225],[60,229],[190,232],[330,229],[480,238],[640,222],[790,225],[950,235],[1100,228],[1250,237],[1410,230],[1575,232],[1710,233]],
  // North-south streets. Their southern tips merge into older lanes and market roads.
  [[-140,-320],[-135,-232],[-125,-75],[-120,93],[-120,226],[-70,357]],
  [[48,-320],[45,-216],[50,-72],[60,98],[60,229],[125,269]],
  [[238,-325],[235,-224],[230,-68],[228,104],[230,272],[236,319]],
  [[418,-322],[420,-228],[420,-72],[420,96],[420,165],[432,280]],
  [[595,-320],[600,-224],[600,-68],[612,120],[620,190],[605,327]],
  [[765,-320],[765,-213],[762,-73],[770,91],[792,136],[749,186]],
  [[940,-320],[940,-213],[945,-65],[950,88],[950,158],[985,214]],
  [[1110,-320],[1100,-224],[1100,-65],[1100,96],[1090,251]],
  [[1270,-320],[1250,-221],[1250,-69],[1250,90],[1250,237],[1260,405]],
  [[1465,-320],[1460,-214],[1450,-60],[1450,100],[1455,230],[1485,453]],
  [[1640,-320],[1640,-220],[1640,-64],[1640,94],[1640,233],[1635,432]],
  // V6 WESTERN LOWER CITY: infill previously vacant waterfront wards.
  // Broad junctions connect directly into the older market and harbor network.
  [[-219,292],[-139,298],[-55,302],[40,308],[133,423]],
  [[-219,414],[-139,413],[-48,411],[43,409],[133,423]],
  // A fortified square is reserved for the enlarged Flaming Fist compound.
  // These lanes skirt its walls rather than cutting through the courtyard.
  [[70,518],[185,562]],
  [[68,625],[135,610]],
  [[-199,725],[-135,726],[-35,721],[48,710]],
  [[-213,239],[-211,292],[-212,414],[-212,525],[-212,625],[-209,725]],
  [[-27,230],[-27,302],[-30,411],[44,419],[44,515],[44,632],[48,710]],
  [[78,228],[70,308],[72,409],[70,518],[68,625],[48,710]],
  // Rivington: several real connected residential streets, not one single lane.
  [[1160,811],[1240,807],[1323,827],[1405,811],[1480,825],[1550,835],[1630,835]],
  [[1160,900],[1240,907],[1320,914],[1400,914],[1480,921],[1560,924],[1630,933]],
  [[1170,1000],[1250,1000],[1330,1012],[1410,1015],[1490,1022],[1570,1020],[1635,1031]],
  [[1198,795],[1196,900],[1198,1000],[1200,1090]],
  [[1260,793],[1260,907],[1250,1000],[1255,1080]],
  [[1340,786],[1340,807],[1340,914],[1330,1012],[1335,1090]],
  [[1410,790],[1405,811],[1400,914],[1410,1015],[1410,1090]],
  [[1490,791],[1480,825],[1480,921],[1490,1022],[1490,1090]],
  [[1570,792],[1550,835],[1560,924],[1570,1020],[1580,1090]],
];
function makeRoadNetwork(){
  for(let i=0;i<ROAD_PATHS.length;i++){
    addRoad(ROAD_PATHS[i],i<4?MAIN_ROAD:MINOR_ROAD,i>=4);
  }
  // V6: Removed the two cylinders placed on every road node. Those produced
  // the distracting circles/roundabouts (and floated on sloped terrain).
  // Road ribbons now meet directly, without decorative junction disks.
}
// Southern boundary of the wealthy Upper City. Monumental stone walls and
// actual gate openings follow the new city-scale arrangement of landmarks.
const UPPER_WALL=[[-228,187],[-105,187],[55,187],[230,193],[412,198],
                  [605,199],[780,190],[920,171]];
const UPPER_GATE_X=[-120,48,238,418,597,765];
// Eastern curtain closes the high-walled district against the northern wards.
const UPPER_EAST_WALL=[[920,171],[926,95],[911,-58],[895,-218],[880,-335]];
const UPPER_EAST_GATES=[91,-65,-218];
function upperWallZ(x){return samplePolylineY(UPPER_WALL,x);}
function nearUpperWall(px,pz,clearance=32){
  for(const wall of [UPPER_WALL,UPPER_EAST_WALL])for(let i=1;i<wall.length;i++){
    const [ax,az]=wall[i-1],[bx,bz]=wall[i];
    if(distToSegment2(px,pz,ax,az,bx,bz)<clearance)return true;
  }
  return false;
}
function createFortifications(){
  const HEIGHT=26,THICKNESS=3.9;
  const masonry=M.wall,cap=M.wallTop;
  // Small segments track terrain; the gaps are truly empty below their lintels.
  for(let j=1;j<UPPER_WALL.length;j++){
    const a=UPPER_WALL[j-1],b=UPPER_WALL[j];
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const n=Math.max(1,Math.ceil(length/13));
    for(let i=0;i<n;i++){
      const t0=i/n,t1=(i+1)/n,tm=(t0+t1)/2;
      const px=lerp(a[0],b[0],tm);
      if(UPPER_GATE_X.some(gx=>Math.abs(px-gx)<29))continue;
      const p0=P(lerp(a[0],b[0],t0),lerp(a[1],b[1],t0));
      const p1=P(lerp(a[0],b[0],t1),lerp(a[1],b[1],t1));
      p0.y+=HEIGHT*.5;p1.y+=HEIGHT*.5;
      segment(world,p0,p1,THICKNESS,HEIGHT,masonry);
      if(i%2===0){
        const crown=p0.clone().lerp(p1,.5);crown.y+=HEIGHT*.5+1.1;
        box(world,THICKNESS+1.0,2.4,2.5,crown.x,crown.y,crown.z,cap,-Math.atan2(p1.x-p0.x,p1.z-p0.z));
      }
    }
  }
  // Rounded crenellated watchtowers punctuate the rampart.
  for(let x=-197;x<=891;x+=96){
    if(UPPER_GATE_X.some(g=>Math.abs(x-g)<37))continue;
    const p=P(x,upperWallZ(x));
    cyl(world,5.4,6.4,34,p.x,p.y+17,M.stoneDark,10);
    cyl(world,6.1,6.1,2.2,p.x,p.y+35,cap,12);
    cone(world,6.7,6.0,p.x,p.y+39.3,M.roofE,10);
  }
  // Reinforced gatehouses: two towers and an elevated lintel, with a clear
  // navigable arch beneath for the major roads crossing the city boundary.
  for(const gx of UPPER_GATE_X){
    const gz=upperWallZ(gx);
    for(const sign of [-1,1]){
      const p=P(gx+sign*29,gz);
      cyl(world,5.6,6.2,36,p.x,p.y+18,M.wall,10);
      cone(world,6.7,6.3,p.x,p.y+40,M.roofB,10);
    }
    const mid=P(gx,gz);
    box(world,29,8,7.3,mid.x,mid.y+26,mid.z,M.stoneDark);
    box(world,30,1.8,8,mid.x,mid.y+30.9,mid.z,cap);
  }
  // The eastern curtain is broken into short terrain-following sections, with
  // three open arches at the crossings of the old northern avenues.
  for(let j=1;j<UPPER_EAST_WALL.length;j++){
    const a=UPPER_EAST_WALL[j-1],b=UPPER_EAST_WALL[j];
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const n=Math.max(1,Math.ceil(length/13));
    for(let i=0;i<n;i++){
      const t0=i/n,t1=(i+1)/n,tm=(t0+t1)/2;
      const mz=lerp(a[1],b[1],tm);
      if(UPPER_EAST_GATES.some(gz=>Math.abs(mz-gz)<28))continue;
      const p0=P(lerp(a[0],b[0],t0),lerp(a[1],b[1],t0));
      const p1=P(lerp(a[0],b[0],t1),lerp(a[1],b[1],t1));
      p0.y+=HEIGHT/2;p1.y+=HEIGHT/2;
      segment(world,p0,p1,THICKNESS,HEIGHT,masonry);
      if(i%2===0){const crown=p0.clone().lerp(p1,.5);
        box(world,THICKNESS+1,2.4,2.5,crown.x,crown.y+HEIGHT/2+1,crown.z,cap,-Math.atan2(p1.x-p0.x,p1.z-p0.z));}
    }
  }
  function eastWallX(z){
    for(let j=1;j<UPPER_EAST_WALL.length;j++){
      const a=UPPER_EAST_WALL[j-1],b=UPPER_EAST_WALL[j];
      if(z<=a[1]&&z>=b[1])return lerp(a[0],b[0],(z-a[1])/(b[1]-a[1]));
    }
    return UPPER_EAST_WALL.at(-1)[0];
  }
  for(const gz of UPPER_EAST_GATES){
    const gx=eastWallX(gz);
    for(const sign of [-1,1]){
      const p=P(gx,gz+sign*29);
      cyl(world,5.6,6.2,36,p.x,p.y+18,M.wall,10);
      cone(world,6.7,6.3,p.x,p.y+40,M.roofB,10);
    }
    const mid=P(gx,gz);
    box(world,7.3,8,29,mid.x,mid.y+26,mid.z,M.stoneDark);
    box(world,8,1.8,30,mid.x,mid.y+30.9,mid.z,cap);
  }
}
function createBridge(){
  const north=P(1338,555),south=P(1341,798),deckY=2.12;
  north.y=deckY;south.y=deckY;
  segment(world,north,south,MAIN_ROAD+2,1.0,M.wall);
  const count=28;
  for(let i=0;i<=count;i++){
    const p=north.clone().lerp(south,i/count);
    for(const s of [-1,1]){
      box(world,.84,1.35,1.9,p.x+s*(MAIN_ROAD/2+1.3),deckY+1.15,p.z,M.wall);
      if(i%3===0)cone(world,.58,.92,p.x+s*(MAIN_ROAD/2+1.3),deckY+2.2,p.z,M.roofC,4);
    }
  }
  // Twin towers flank the bridge, leaving the whole central roadway clear.
  for(const f of [.08,.90])for(const side of [-1,1]){
    const p=north.clone().lerp(south,f);p.x+=side*(MAIN_ROAD/2+4.0);
    cyl(world,3.6,4.1,11.0,p.x,deckY+5.1,p.z,M.stoneDark,9);
    cone(world,4.2,4.1,p.x,deckY+12.5,p.z,M.roofB,9);
  }
}
// Ensure buildings do not protrude through the riverbank into the water.
function shoreClear(px,pz,radiusWorld=0){
  const n=samplePolylineY(RIVER_NORTH,px),s=samplePolylineY(RIVER_SOUTH,px);
  const pad=radiusWorld/SCALE;
  return pz<n-pad||pz>s+pad;
}
const ROAD_SEGMENTS=ROAD_PATHS.flatMap((path,roadIndex)=>path.slice(1).map((p,i)=>({a:path[i],b:p,width:roadIndex<4?MAIN_ROAD:MINOR_ROAD})).filter(s=>isWalkableSegment(s.a,s.b)));
const VALID_NPC_PATHS=ROAD_PATHS.map(path=>{
  const groups=[];let current=[];
  for(let i=0;i<path.length-1;i++){
    if(isWalkableSegment(path[i],path[i+1])){if(!current.length)current.push(path[i]);current.push(path[i+1]);}
    else{if(current.length>1)groups.push(current);current=[];}
  }
  if(current.length>1)groups.push(current);
  return groups;
}).flat();
function nearRoad(px,pz,dist=9){for(const {a:[ax,az],b:[bx,bz]} of ROAD_SEGMENTS){if(distToSegment2(px,pz,ax,az,bx,bz)<dist)return true;}return false;}
function nearestRoadPoint(px,pz){let best=null,bestDist=Infinity;for(const {a:[ax,az],b:[bx,bz],width} of ROAD_SEGMENTS){const cp=closestPointOnSegment(px,pz,ax,az,bx,bz);const d=Math.hypot(px-cp.x,pz-cp.z);if(d<bestDist){bestDist=d;best={...cp,dist:d,width,ax,az,bx,bz};}}return best;}
function tree(group,x,y,z,size=1){cyl(group,.14*size,.21*size,1.25*size,x,y+.63*size,z,M.bark,6);cone(group,.9*size,2.15*size,x,y+2.14*size,z,pick([M.tree,M.tree2]),6);}
function terrainDecor(){
  // V6: North of the Chionthar is urban; the south-bank BLUE zone is woodland.
  // Rivington is a protected clearing (and its inner streets remain free of trees).
  const forest=[];
  let attempts=0;
  while(forest.length<4250&&attempts<29000){attempts++;
    const px=rr(EXTENTS.minX+16,EXTENTS.maxX-16),pz=rr(EXTENTS.minZ+16,EXTENTS.maxZ-16);
    if(inRiver(px,pz))continue;
    const southEdge=samplePolylineY(RIVER_SOUTH,px);
    const isSouthernWoodland=pz>southEdge+18;
    if(px<EXTENTS.minX+48||px>EXTENTS.maxX-48)continue;
    // The red region should read as a city, not scattered fir trees.
    const onDusthawkHill=Math.hypot((px-995)/300,(pz-370)/225)<.74;
    if(!isSouthernWoodland&&!onDusthawkHill)continue;
    if(onDusthawkHill&&rng()>.06)continue;
    if(CITY_POLYGONS.some(poly=>polygonContains(px,pz,poly.coords)))continue;
    if(nearRoad(px,pz,38))continue;
    if(LANDMARKS.some(l=>Math.hypot(px-l.x,pz-l.z)<(l.kind==='graveyard'?46:32)))continue;
    if(isSouthernWoodland&&rng()>.94)continue;
    const pt=P(px,pz);
    forest.push({x:pt.x,y:pt.y,z:pt.z,s:rr(1.35,3.5)});
  }
  const trunkGeo=new THREE.CylinderGeometry(.17,.27,1.3,5);
  const canopyGeo=new THREE.ConeGeometry(1,2.4,6);
  const trunks=new THREE.InstancedMesh(trunkGeo,M.bark,forest.length);
  const canopies=new THREE.InstancedMesh(canopyGeo,M.tree,forest.length);
  const dummy=new THREE.Object3D(),color=new THREE.Color();
  forest.forEach((t,i)=>{
    dummy.position.set(t.x,t.y+t.s*.67,t.z);dummy.rotation.y=0;
    dummy.scale.set(t.s,t.s,t.s);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
    dummy.position.set(t.x,t.y+t.s*2.40,t.z);dummy.rotation.y=rr(0,Math.PI*2);
    dummy.scale.set(t.s*1.14,t.s*1.25,t.s*1.14);dummy.updateMatrix();canopies.setMatrixAt(i,dummy.matrix);
    canopies.setColorAt(i,color.setHex(pick([0x4c7252,0x60835b,0x77916b,0x48705c,0x657a54,0x547e5b])));
  });
  trunks.instanceMatrix.needsUpdate=true;canopies.instanceMatrix.needsUpdate=true;
  canopies.instanceColor.needsUpdate=true;trunks.castShadow=false;canopies.castShadow=false;
  world.add(trunks,canopies);
  // Keep Dusthawk Hill legible from overhead without cluttering the cemetery.
  const rockMaterials=[mat(0x9b947e),mat(0x8f9181),mat(0xb6a78a)];
  for(let i=0;i<150;i++){
    const a=rr(0,Math.PI*2),r=rr(.25,1.02),px=995+280*r*Math.cos(a),pz=370+210*r*Math.sin(a),p=P(px,pz);
    if(p.y<1.5||LANDMARKS.some(l=>Math.hypot(px-l.x,pz-l.z)<35))continue;
    const rock=box(world,rr(.65,2.6),rr(.4,1.55),rr(.8,3.0),p.x,p.y+.27,p.z,pick(rockMaterials));
    rock.rotation.y=rr(-Math.PI,Math.PI);
  }
  console.info(`Forest trees: ${forest.length} (south bank priority).`);
}
const CITY_POLYGONS=[
  // V6 RED REGION: dense walled-city extensions where the unbuilt forest used to be.
  {id:'northwest-ward',coords:[[-228,-337],[235,-337],[348,-165],[190,122],[-227,272]],number:540},
  {id:'northcentral-ward',coords:[[180,-337],[720,-337],[890,-130],[794,171],[353,191],[170,-40]],number:740},
  {id:'northeast-ward',coords:[[705,-337],[1250,-337],[1450,-125],[1390,221],[1100,205],[870,120]],number:780},
  {id:'far-eastern-ward',coords:[[1230,-340],[1745,-340],[1742,470],[1515,482],[1360,228]],number:670},
  // Fill the lower-left blue region: a proper dense waterfront neighborhood
  // rather than a large dead patch of unused ground.
  {id:'western-lower-city',coords:[[-240,206],[61,213],[184,308],[149,515],[139,653],[62,740],[-230,820]],number:760},
  // Existing Upper / Lower City and streets remain present.
  {id:'upper',coords:[[112,118],[315,72],[523,118],[595,220],[556,344],[319,364],[117,324]],number:380},
  {id:'upper-east',coords:[[470,118],[670,102],[884,132],[982,225],[884,314],[665,308],[510,238]],number:320},
  {id:'lower',coords:[[61,305],[158,277],[350,326],[520,249],[641,361],[628,472],[520,534],[334,568],[129,549],[49,455]],number:580},
  {id:'outer-north',coords:[[667,150],[842,88],[1048,112],[1238,182],[1295,312],[1120,350],[892,332],[700,270]],number:300},
  {id:'outer-east',coords:[[1165,240],[1350,329],[1485,453],[1487,551],[1261,545],[1130,462]],number:250},
  {id:'outer-west',coords:[[619,326],[747,264],[848,296],[853,543],[678,519],[612,468]],number:230},
  // V5 BLUE REGION: intentionally NO massive south-bank housing polygon.
  // V5 GREEN REGION: larger, much denser Rivington residential quarters.
  {id:'rivington',coords:[[1150,782],[1660,782],[1660,1085],[1160,1085]],number:850},
];
const housePositions=[];
const houseSpurs=[];
const houseBuckets=[];
const wallCube=new THREE.BoxGeometry(1,1,1),roofCone=new THREE.ConeGeometry(1,1,4);
const wallMaterial2=mat(0x928879),wallMaterial3=mat(0xc1b69e);
function getBucket(key,geo,material){let b=houseBuckets.find(s=>s.key===key);if(!b){b={key,geo,material,items:[]};houseBuckets.push(b);}return b;}
function scatterHouses(){
  const LANDMARK_RADIUS={barracks:44,palace:35,gate:26,temple:29,
    'temple-dark':31,harbor:34,park:62,graveyard:34,cottage:24,
    tavern:24,tower:27,bank:27,ship:28,crossing:24};
  const noBuild=LANDMARKS.map(l=>({x:l.x,z:l.z,
    r:l.id==='flaming-fist-barracks'?103:(LANDMARK_RADIUS[l.kind]||20)}));
  const cell=48,buckets=new Map(),bucketKey=(x,z)=>`${x}:${z}`;
  function neighbors(px,pz){
    const cx=Math.floor(px/cell),cz=Math.floor(pz/cell),result=[];
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
      const list=buckets.get(bucketKey(cx+dx,cz+dz));if(list)result.push(...list);
    }
    return result;
  }
  function parcelRegion(px,pz){
    return CITY_POLYGONS.find(r=>polygonContains(px,pz,r.coords))||null;
  }
  function tryHouse(px,pz,region){
    if(!region||inRiver(px,pz)||nearUpperWall(px,pz,54))return false;
    if(region.id.startsWith('outer')&&Math.hypot((px-998)/300,(pz-372)/225)<.92)return false;
    // Leave the cemetery and the crown of Dusthawk Hill open.
    if(Math.hypot((px-915)/180,(pz-430)/120)<.68)return false;
    let w=rr(12,23),d=rr(11,20);
    if(region.id.startsWith('north')){w=rr(13,23);d=rr(12,21);}
    if(region.id==='upper'||region.id==='upper-east'){w=rr(15,25);d=rr(13,22);}
    if(region.id==='western-lower-city'){w=rr(7.5,12.5);d=rr(8.5,13.5);}
    if(region.id==='rivington'){w=rr(10,17);d=rr(9,16);}
    else if(region.id.startsWith('outer')){w=rr(12,22);d=rr(11,19);}
    const radius=Math.hypot(w,d)*.5;
    if(!shoreClear(px,pz,radius+2.8))return false;
    const road=nearestRoadPoint(px,pz);
    if(!road)return false;
    if(road.dist*SCALE<road.width/2+d/2+(region.id==='western-lower-city'?1.8:3.8)||road.dist*SCALE>43)return false;
    if(noBuild.some(b=>Math.hypot(px-b.x,pz-b.z)*SCALE<b.r*SCALE+radius+2.5))return false;
    if(neighbors(px,pz).some(b=>Math.abs(px-b.px)*SCALE<(w+b.w)/2+(region.id==='western-lower-city'?.8:1.65)&&Math.abs(pz-b.pz)*SCALE<(d+b.d)/2+(region.id==='western-lower-city'?.8:1.65)))return false;
    const wx=X(px),wz=Z(pz),gy=groundY(wx,wz);
    const h=rr(18.5,31.5)*(region.id.startsWith('upper')?1.14:region.id==='rivington'?.72:region.id.startsWith('outer')?.98:1.03);
    const roofIndex=Math.floor(rng()*ROOFS.length),wallIndex=Math.floor(rng()*3);
    const rot=Math.atan2(X(road.x)-wx,Z(road.z)-wz);
    getBucket('w'+wallIndex,wallCube,[M.wall,wallMaterial2,wallMaterial3][wallIndex]).items.push({x:wx,y:gy+h*.5,z:wz,w,h,d,rotation:rot});
    getBucket('r'+roofIndex,roofCone,ROOFS[roofIndex]).items.push({x:wx,y:gy+h+1.4,z:wz,w:w*.65,h:3.2,d:d*.65,rotation:rot+Math.PI/4});
    const house={px,pz,w,d,worldX:wx,worldZ:wz,groundY:gy,rotation:rot};
    housePositions.push(house);
    const dx=road.x-px,dz=road.z-pz,len=Math.hypot(dx,dz)||1;
    // Door-to-street spur finishes at the facade (not inside the building).
    const facade=(d*.5+1)/SCALE;
    houseSpurs.push({from:[road.x,road.z],to:[px+dx/len*facade,pz+dz/len*facade]});
    const key=bucketKey(Math.floor(px/cell),Math.floor(pz/cell));
    if(!buckets.has(key))buckets.set(key,[]);
    buckets.get(key).push(house);
    return true;
  }
  // First: pack shops and dwellings along the sides of real streets.
  for(const {a,b,width} of ROAD_SEGMENTS){
    const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
    if(length<36)continue;
    const nx=-dz/length,nz=dx/length;
    const slots=Math.max(1,Math.floor(length/36));
    for(let i=0;i<slots;i++){
      const t=clamp((i+.46+rr(-.16,.16))/slots,.05,.95);
      const cx=lerp(a[0],b[0],t),cz=lerp(a[1],b[1],t);
      for(const side of [-1,1]){
        const offset=(width/2+rr(9.6,14.8))/SCALE;
        const px=cx+nx*side*offset,pz=cz+nz*side*offset;
        tryHouse(px,pz,parcelRegion(px,pz));
      }
    }
  }
  // Second: infill remaining suitable street-accessible parcels.
  for(const region of CITY_POLYGONS){
    const xx=region.coords.map(p=>p[0]),zz=region.coords.map(p=>p[1]);
    const xmin=Math.min(...xx),xmax=Math.max(...xx),zmin=Math.min(...zz),zmax=Math.max(...zz);
    let added=0,tries=0;
    while(added<region.number&&tries<region.number*30){
      tries++;
      const px=rr(xmin,xmax),pz=rr(zmin,zmax);
      if(!polygonContains(px,pz,region.coords))continue;
      if(tryHouse(px,pz,region))added++;
    }
  }
  const dummy=new THREE.Object3D();
  for(const bucket of houseBuckets){if(!bucket.items.length)continue;
    const im=new THREE.InstancedMesh(bucket.geo,bucket.material,bucket.items.length);im.castShadow=false;im.receiveShadow=true;
    bucket.items.forEach((item,i)=>{dummy.position.set(item.x,item.y,item.z);dummy.rotation.set(0,item.rotation||0,0);dummy.scale.set(item.w,item.h,item.d);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);});
    im.instanceMatrix.needsUpdate=true;buildingsGroup.add(im);
  }
  // Batch thousands of door-to-road connections into two meshes (rather than
  // two individual Three.js draw calls per household).
  batchedRoadStrips(houseSpurs,GRID_CELL*1.45,M.road,.17);
  console.info(`Procedural buildings: ${housePositions.length}; forest uses instancing.`);
}
function labelAt(group,title,district,major,height){const el=document.createElement('div');el.className=`map-label ${district}`;el.textContent=title;
  const o=new CSS2DObject(el);o.position.set(0,height,0);o.userData={major};group.add(o);return o;}
function markerDisk(group,r=3.1){const ringMat=new THREE.MeshBasicMaterial({color:0xf1d49e,transparent:true,opacity:.9,depthWrite:false,side:THREE.DoubleSide});const ring=new THREE.Mesh(new THREE.RingGeometry(r-.17,r,32),ringMat);ring.rotation.x=-Math.PI/2;ring.position.y=.22;group.add(ring);}
function roof(group,w,d,y,material=M.roofB){const r=cone(group,Math.max(w,d)*.75,1.45,0,y+.7,0,material,4);r.rotation.y=Math.PI/4;return r;}
function regularBuilding(group,opts={}){const {w=5,d=4,h=3,wall=M.wall,roofmat=M.roofB}=opts;box(group,w,h,d,0,h/2,0,wall);roof(group,w,d,h,roofmat);
  for(const side of [-1,1])for(let i=0;i<2;i++){const wx=(i-.5)*w*.42;const wi=box(group,.46,.56,.06,wx,h*.55,side*(d/2+.042),M.wood);const pane=box(group,.25,.32,.07,wx,h*.55,side*(d/2+.075),mat(0xffd89b,{emissive:0xeba95a,emissiveIntensity:.20}));windowMeshes.push(pane);}
  box(group,.9,1.6,.1,0,.8,d/2+.06,M.wood);
}
const windowMeshes=[];
function buildingLandmark(l){const gp=new THREE.Group();gp.name=l.name;gp.userData.landmarkId=l.id;const pt=P(l.x,l.z);gp.position.copy(pt);buildingsGroup.add(gp);
  const baseMat=l.district==='upper'?M.white:M.wall;
  let labelHeight=7;const kind=l.kind;
  if(kind==='cottage'){
    box(gp,6.2,3.2,5.2,0,1.6,0,mat(0xd6c3a3));roof(gp,6.7,5.6,3.2,M.roofB);
    box(gp,1.0,2.0,.12,0,1.0,2.66,M.wood);box(gp,.82,.9,.12,-1.75,1.8,2.66,M.blue);box(gp,.82,.9,.12,1.75,1.8,2.66,M.blue);
    box(gp,.28,1.2,.28,1.6,4.4,-.5,M.stoneDark);
    const fence=mat(0xc0ab84);for(let j=-3;j<=3;j++){box(gp,.14,.9,.14,j*1.3,.45,4.9,fence);box(gp,.14,.9,.14,j*1.3,.45,-4.4,fence);}for(let k of [-4.4,4.9])box(gp,8.0,.12,.12,0,.75,k,fence);for(let k of [-4.0,4.0])box(gp,.12,.12,9.3,k,.75,.25,fence);
    for(let i=0;i<10;i++){const x=rr(-4.8,4.8),z=rr(-4.2,4.2);if(Math.abs(x)<3.0&&Math.abs(z)<2.8)continue;sphere(gp,.34,x,.34,z,pick([M.tree2,M.red,M.roofD]),6);}labelHeight=7.2;
  }else if(kind==='tavern'){
    regularBuilding(gp,{w:8.5,d:7.2,h:5.1,wall:baseMat,roofmat:M.roofB});box(gp,2.8,1.0,.18,0,3.7,3.75,M.wood);
    box(gp,1.2,2.0,1.0,3.0,5.6,-2.4,M.roofD);cyl(gp,.62,.72,.55,-3.6,3.1,3.5,M.wood,8);labelHeight=9;
  }else if(kind==='palace'){
    box(gp,13,5.8,8.2,0,2.9,0,M.white);box(gp,15,.55,9.8,0,.45,0,M.wallTop);roof(gp,13,8.2,5.8,M.roofE);
    for(const dx of [-6.0,6.0]){cyl(gp,1.7,1.9,7.5,dx,3.75,2.9,M.wall,8);cone(gp,2.1,2.6,dx,8.6,2.9,M.roofC,8);}for(let i=-3;i<=3;i++)cyl(gp,.34,.38,4.2,i*1.68,2.2,4.35,M.white,8);
    box(gp,4.0,.6,2.1,0,.28,5.1,M.stoneDark);labelHeight=12;
  }else if(kind==='bank'){
    box(gp,11,4.4,7.4,0,2.2,0,M.white);box(gp,12.4,.8,8.5,0,4.85,0,M.wallTop);box(gp,12.8,.40,9.0,0,.22,0,M.stoneDark);
    for(let i=-3;i<=3;i++)cyl(gp,.36,.40,4.7,i*1.55,2.35,4.05,M.white,9);box(gp,10.9,.75,1.4,0,4.8,3.75,M.wallTop);labelHeight=7.2;
  }else if(kind==='tower'){
    box(gp,8,4.6,7.5,0,2.3,0,M.wall);for(const [dx,dz] of [[-3.1,-2.6],[3.1,-2.6]]){cyl(gp,1.7,2.0,10.4,dx,5.2,dz,M.white,9);cone(gp,2.1,3.2,dx,11.9,dz,M.roofC,9);}cyl(gp,1.9,2.1,13.0,0,6.5,1.7,M.wall,10);cone(gp,2.35,4.1,0,14.7,1.7,M.roofE,10);labelHeight=18.5;
  }else if(kind==='temple'){
    box(gp,9.8,.65,11.5,0,.32,0,M.wallTop);box(gp,8.8,3.8,8.4,0,2.55,-.6,M.white);for(let i=-3;i<=3;i++)cyl(gp,.30,.34,3.9,i*1.15,2.05,4.05,M.white,10);
    const pediment=new THREE.Mesh(new THREE.CylinderGeometry(0,5.0,2.1,3,1,false),M.white);pediment.rotation.z=Math.PI/2;pediment.rotation.y=Math.PI/2;pediment.position.set(0,4.45,4.25);gp.add(pediment);
    box(gp,10.3,.25,1.2,0,4.12,4.00,M.wallTop);for(let s=-1;s<=1;s+=2){box(gp,1.5,3.6,1.5,s*3.8,2.1,-3.0,M.white);cone(gp,1.7,1.7,s*3.8,4.95,-3.0,M.roofC,4);}labelHeight=9.8;
  }else if(kind==='temple-dark'){
    box(gp,10.8,4.2,12.0,0,2.1,0,M.stoneDark);box(gp,4.5,5.0,3.3,0,2.5,4.6,M.stoneDark);
    for(const dx of [-4.1,4.1]){cyl(gp,1.5,1.7,8.8,dx,4.4,4.4,M.wall,8);cone(gp,1.8,3.1,dx,10.2,4.4,M.roofE,8);}roof(gp,10.8,12.0,4.2,M.roofE);
    for(let i=-3;i<=3;i++)cyl(gp,.26,.30,3.5,i*1.2,2.1,6.15,M.wallTop,8);labelHeight=12;
  }else if(kind==='bathhouse'){
    box(gp,8.5,3.2,7.5,0,1.6,0,M.white);const dome=new THREE.Mesh(new THREE.SphereGeometry(3.8,18,10,0,Math.PI*2,0,Math.PI/2),M.blue);dome.position.y=3.2;gp.add(dome);
    for(const dx of [-2.8,2.8])cyl(gp,.52,.58,3.5,dx,1.75,3.7,M.white,8);labelHeight=7.5;
  }else if(kind==='barracks'){
    box(gp,17,.4,18.5,0,.2,0,M.sand);box(gp,14,1.6,.7,0,.8,-8.7,M.wall);box(gp,14,1.6,.7,0,.8,8.7,M.wall);box(gp,.7,1.6,17,-6.7,.8,0,M.wall);box(gp,.7,1.6,17,6.7,.8,0,M.wall);
    box(gp,6.8,6.2,5.0,0,3.1,-4.6,M.stoneDark);roof(gp,6.8,5.0,6.2,M.roofE);box(gp,4.2,2.7,3.4,-4.2,1.35,5.0,M.wall);roof(gp,4.2,3.4,2.7,M.roofB);
    box(gp,7.6,.12,2.1,0,.16,3.2,M.road);for(let i=-2;i<=2;i++){for(let j=0;j<3;j++)box(gp,.22,1.4,.22,i*1.4,.8,1.0+j*1.4,M.wood);}cyl(gp,.55,.55,2.2,4.0,1.2,4.8,M.wood,6);
    box(gp,1.8,2.1,.18,0,2.5,-7.55,M.red);labelHeight=10.2;
  }else if(kind==='gate'){
    for(const dx of [-4.3,4.3]){cyl(gp,2.1,2.5,8.6,dx,4.3,0,M.wall,10);cone(gp,2.6,3.1,dx,10.1,0,M.roofE,10);}box(gp,8.2,3.0,2.2,0,7.6,0,M.wall);box(gp,8.6,.45,2.6,0,9.35,0,M.wallTop);
    box(gp,15,.8,1.0,0,.5,-2.2,M.stoneDark);for(const side of [-1,1])box(gp,3.4,2.0,1.2,side*6.8,1.0,0,M.wall);labelHeight=12;
  }else if(kind==='printing'||kind==='townhouse'){
    regularBuilding(gp,{w:6.8,d:7.2,h:5.0,wall:baseMat,roofmat:kind==='printing'?M.roofD:M.roofC});box(gp,1.5,1.2,1.3,-2.0,5.8,-2.2,M.wall);labelHeight=8.6;
  }else if(kind==='harbor'){
    box(gp,14,.9,4.8,0,.22,0,M.wood);for(const dx of [-6.1,-2.3,2.2,6.0])box(gp,.42,2.6,.42,dx,.15,1.9,M.wood);
    for(let i=0;i<6;i++){box(gp,rr(1.2,2.4),rr(1.0,1.6),rr(1.0,1.8),rr(-5.6,5.8),1.05,rr(-1.1,1.2),pick([M.woodLight,M.roofD,M.stoneDark]));}
    box(gp,.28,5.8,.28,5.2,1.2,-1.8,M.wood);segment(gp,v(5.2,5.2,-1.8),v(-1.6,1.3,-1.8),.12,.1,M.wood);
    for(const sx of [-6.5,-1.5,3.8]){const ship=new THREE.Group();ship.position.set(sx,.45,4.6+rr(.0,1.2));box(ship,4.5,.65,1.4,0,.16,0,M.wood);box(ship,2.4,1.35,1.1,0,1.0,0,M.woodLight);box(ship,.14,3.7,.14,1.1,1.9,0,M.wood);const sail=box(ship,.08,1.8,.02,.5,2.6,0,M.white);ship.rotation.y=rr(-.35,.35);gp.add(ship);}labelHeight=6.8;
  }else if(kind==='ship'){
    const riverY=.5;if(inRiver(l.x,l.z))gp.position.y=riverY;
    box(gp,10,.95,3.0,0,.3,0,M.wood);box(gp,6.2,2.2,2.6,0,1.8,0,M.woodLight);roof(gp,6.2,2.6,2.8,M.roofE);box(gp,.18,6.0,.18,3.4,.8,0,M.wood);labelHeight=7.0;
  }else if(kind==='crossing'){
    box(gp,10.5,1.0,12.0,0,.45,0,M.stoneDark);
    box(gp,5.4,4.8,3.4,0,2.4,0,M.wall);
    for(const [dx,dz] of [[-4.4,-4.1],[4.4,-4.1],[-4.4,4.1],[4.4,4.1]]){cyl(gp,1.9,2.15,9.0,dx,4.5,dz,M.wall,8);cone(gp,2.3,3.2,dx,10.6,dz,M.roofB,8);}
    box(gp,3.8,5.0,9.8,0,2.5,0,M.wall);box(gp,2.1,3.3,10.2,0,1.65,0,M.stoneDark);
    for(let i=-2;i<=2;i++)box(gp,.12,3.0,.18,i*.45,1.55,5.06,M.stoneDark);
    box(gp,10.4,.55,2.2,0,8.3,0,M.wallTop);labelHeight=11.2;
  }else if(kind==='park'){
    const big=l.id==='bloomridge-park';
    cyl(gp,big?10.8:6.8,big?11.2:7.1,.34,0,.15,0,M.grass,22);for(let i=0;i<(big?34:20);i++){const a=rng()*Math.PI*2,r=rr(2.0,big?11.2:8.0),sx=Math.cos(a)*r*(big?1.08:1),sz=Math.sin(a)*r*(big?.92:1);tree(gp,sx,.25,sz,rr(.70,big?1.35:1.15));}
    cyl(gp,big?1.7:1.25,big?1.7:1.25,.42,0,.32,0,M.blue,16);cyl(gp,.28,.42,1.1,0,1.05,0,M.white,8);labelHeight=big?9.6:8.2;
  }else if(kind==='graveyard'){
    box(gp,16,.22,13,0,.11,0,M.sand);for(let i=0;i<40;i++){const x=rr(-7.0,7.0),z=rr(-5.7,5.7);box(gp,.45,rr(.8,1.8),.26,x,.82,z,M.stoneDark,rr(-.12,.12));}
    roof(gp,3.8,3.0,3.1,M.roofE);box(gp,3.6,3.1,2.8,0,1.56,-4.0,M.wall);for(let i=0;i<9;i++){const a=i*.72;tree(gp,Math.cos(a)*7.8,.12,Math.sin(a)*6.1,rr(.75,1.45));}labelHeight=7.2;
  }
  const road=nearestRoadPoint(l.x,l.z);
  if(road){if(kind==='gate'||kind==='crossing')gp.rotation.y=Math.atan2(road.bx-road.ax,road.bz-road.az);else if(!['park','graveyard','ship'].includes(kind))gp.rotation.y=Math.atan2(X(road.x)-X(l.x),Z(road.z)-Z(l.z));}
  // The Flaming Fist compound has about 3x the previous footprint area.
  // Unlike the Watch Citadel, its large yard and buildings form an imposing fort.
  if(l.id==='flaming-fist-barracks')gp.scale.set(4.3,3.35,4.3);
  else gp.scale.setScalar(kind==='barracks'?2.45:kind==='cottage'?2.95:kind==='crossing'?2.35:kind==='harbor'?2.1:kind==='ship'?2.5:l.id==='bloomridge-park'?2.65:kind==='park'?2.0:kind==='graveyard'?2.25:2.8);
  // No markerDisk: district labels identify landmarks without extra circles on streets.
  l.group=gp;l.label=labelAt(gp,l.name,l.district,!!l.major,labelHeight+1.5);
  return gp;
}
function connectLandmarksToRoads(){
  // Approximate visible footprint in world units after the model's scale is applied.
  const facade={palace:18,bank:16,tower:15,temple:15,'temple-dark':17,
    tavern:13,bathhouse:14,barracks:19,printing:11,townhouse:11,
    cottage:10,park:24,graveyard:17,gate:10};
  for(const l of LANDMARKS){
    if(['ship','harbor','crossing'].includes(l.kind))continue;
    const road=nearestRoadPoint(l.x,l.z);if(!road)continue;
    const dx=road.x-l.x,dz=road.z-l.z,len=Math.hypot(dx,dz)||1;
    const offset=Math.min(len,(l.id==='flaming-fist-barracks'?39:(facade[l.kind]||12))/SCALE);
    const end=[l.x+dx/len*offset,l.z+dz/len*offset];
    if(!isWalkableSegment([road.x,road.z],end))continue;
    roadStrip([road.x,road.z],end,GRID_CELL*1.60,M.road,.17);
  }
}
function placeDistrictText(txt,px,pz,size='district'){const o=new THREE.Group();o.position.copy(P(px,pz,10));world.add(o);const el=document.createElement('div');el.className=`district-label ${size}`;el.innerHTML=txt;const label=new CSS2DObject(el);o.add(label);return label;}
function lamps(){for(const {a,b} of ROAD_SEGMENTS){const len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<24||rng()>.46)continue;
  const t=.5,p=P(lerp(a[0],b[0],t)+rr(-5,5),lerp(a[1],b[1],t)+rr(-5,5));cyl(world,.09,.14,2.7,p.x,p.y+1.35,p.z,M.wood,6);
  const light=box(world,.48,.64,.48,p.x,p.y+2.9,p.z,mat(0xe4b875,{emissive:0xeaab65,emissiveIntensity:.15}));lanternMeshes.push(light);
}}
const lanternMeshes=[];
// --- Citizens & adventurers -------------------------------------------------
const citizenMats={};
function cm(color){const key=String(color);return citizenMats[key] ||= mat(color);}
function makeCharacter({race='Human',type='Peasant',color=null,isPlayer=false}={}){
  const character=new THREE.Group(),size=((race==='Gnome'||race==='Goblin')?0.62:race==='Dwarf'?0.71:race==='Orc'?0.95:0.82)*(type==='Flaming Fist'?1.09:1);
  character.scale.setScalar(size);
  const skin=race==='Orc'?0x81a676:race==='Goblin'?0x8ac27f:race==='Dhampir'?0xc6b9c6:pick([0xd5a884,0xe0ba94,0xb77f63,0x997157,0xe0c6a3]);
  let coat=color??(type==='Flaming Fist'?0xbd573d:type==='Noble'?0x8b68a5:type==='Merchant'?0xa67a50:type==='Performer'?pick([0xa6574c,0x6d7fa5,0x8b5e9b,0x4e8c74,0xb68c3f]):pick([0x6c8c87,0x926d68,0x8f9968,0x68869b,0x9c8264,0x8c6b5d]));
  if(isPlayer)coat=color;
  const skinMat=cm(skin),coatMat=cm(coat),pant=cm(type==='Flaming Fist'?0x363a43:0x4b4d4b),hair=cm(race==='Dhampir'?0x414249:pick([0x4b4033,0x6c5440,0xc7a16a,0x353735]));
  const torso=cyl(character,.38,.46,1.03,0,1.34,0,coatMat,6);
  const head=sphere(character,.36,0,2.13,0,skinMat,8);
  if(race==='Elf'||race==='Goblin')for(const side of [-1,1]){const ear=cone(character,.20,.47,.42*side,2.15,0,skinMat,5);ear.rotation.z=side*Math.PI/2;}
  if(race==='Dwarf'){box(character,.49,.35,.24,0,1.91,.20,cm(0x6c4e37));}
  if(race==='Orc'){for(const side of [-1,1])cone(character,.10,.23,side*.20,1.92,.27,cm(0xebdfb5),5);}
  if(type==='Flaming Fist'){const steel=cm(0x939b94),trim=cm(0xc99b50);const helmet=cone(character,.41,.50,0,2.52,0,steel,8);box(character,.98,.22,.20,0,1.66,.28,trim);box(character,.82,.42,.48,0,1.45,.05,steel);box(character,.28,.54,.36,-.36,1.44,.02,steel);box(character,.28,.54,.36,.36,1.44,.02,steel);box(character,.22,.26,.56,-.53,1.18,0,steel);box(character,.22,.26,.56,.53,1.18,0,steel);box(character,.22,.86,.22,-.20,.44,0,steel);box(character,.22,.86,.22,.20,.44,0,steel);}
  if(type==='Noble'){const crown=cyl(character,.38,.38,.13,0,2.53,0,cm(0xcfac63),8);}
  if(type==='Merchant'){box(character,.55,.62,.43,.54,1.19,-.2,cm(0x9b7654));}
  if(type==='Performer'){box(character,.12,1.15,.12,.58,1.1,0,cm(0x7a5c34));sphere(character,.20,.67,1.15,.07,cm(0xc39158),7);cone(character,.30,.35,0,2.56,0,cm(0x51392a),8);}
  const leftLeg=cyl(character,.14,.16,.73,-.20,.43,0,pant,5);const rightLeg=cyl(character,.14,.16,.73,.20,.43,0,pant,5);
  const leftArm=cyl(character,.115,.14,.8,-.52,1.26,0,coatMat,5);const rightArm=cyl(character,.115,.14,.8,.52,1.26,0,coatMat,5);
  leftArm.rotation.z=-.12;rightArm.rotation.z=.12;
  if(isPlayer){const base=cyl(character,.68,.68,.16,0,.05,0,cm(0x3b3931),14);base.castShadow=false;const edge=new THREE.Mesh(new THREE.RingGeometry(.61,.71,22),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));edge.rotation.x=-Math.PI/2;edge.position.y=.145;character.add(edge);}
  character.traverse(obj=>{if(obj.isMesh)obj.castShadow=isPlayer;});
  return {group:character,limbs:[leftLeg,rightLeg,leftArm,rightArm],size};
}
function makeCat(){const g=new THREE.Group();const color=pick([0x6a6253,0xc0a47e,0x313942,0xe3ceae]);const m=cm(color);box(g,.30,.32,.72,0,.34,0,m);sphere(g,.22,0,.49,-.43,m,7);for(const s of [-1,1])cone(g,.13,.25,.15*s,.71,-.48,m,5);
  for(const x of [-.11,.11])for(const z of [-.22,.24])box(g,.08,.32,.08,x,.16,z,m);
  const tail=box(g,.11,.12,.48,0,.60,.44,m);tail.rotation.x=.55;g.traverse(o=>{if(o.isMesh)o.castShadow=false;});return {group:g,limbs:[],size:.8};}
function makeCart(){const g=new THREE.Group();box(g,1.35,.34,2.1,0,.55,0,M.woodLight);box(g,1.0,.56,1.1,0,.98,-.08,M.wood);for(const [x,z] of [[-.62,-.72],[.62,-.72],[-.62,.72],[.62,.72]]){const wheel=cyl(g,.30,.30,.12,x,.32,z,M.stoneDark,10);wheel.rotation.z=Math.PI/2;}box(g,.12,.12,1.55,0,.88,-1.52,M.wood);const driver=makeCharacter({race:'Human',type:'Merchant',color:0x9d7356}).group;driver.position.set(0,.05,-1.1);driver.scale.multiplyScalar(.82);g.add(driver);g.traverse(o=>{if(o.isMesh)o.castShadow=false;});return {group:g,limbs:[],size:1.8};}
const NPCS=[],playerActors=new Map(),streetDoors=[];
function buildStreetDoors(){
  // A doorway is on a building's perimeter, and its approach is a short straight
  // spur from the nearest actual street. Agents vanish at the door, never inside walls.
  for(const house of housePositions){
    const road=nearestRoadPoint(house.px,house.pz);
    if(!road||road.dist*SCALE>22||rng()>.50)continue;
    const dx=X(road.x)-house.worldX,dz=Z(road.z)-house.worldZ,len=Math.hypot(dx,dz)||1;
    const ux=dx/len,uz=dz/len;
    const perimeter=Math.min(house.w/2/Math.max(Math.abs(ux),.001),house.d/2/Math.max(Math.abs(uz),.001))+1.0;
    const at=v(house.worldX+dx/len*perimeter,0,house.worldZ+dz/len*perimeter);
    at.y=walkingY(at.x,at.z);
    const start=P(road.x,road.z);start.y=walkingY(start.x,start.z);
    streetDoors.push({point:at,road:start,parcel:house});
  }
  for(const l of LANDMARKS){
    if(['crossing','gate','park','graveyard','harbor','ship','barracks'].includes(l.kind))continue;
    const road=nearestRoadPoint(l.x,l.z);if(!road||road.dist*SCALE>22)continue;
    const lp=P(l.x,l.z),roadPoint=P(road.x,road.z);
    const dx=roadPoint.x-lp.x,dz=roadPoint.z-lp.z,len=Math.hypot(dx,dz)||1;
    const perimeter=10;
    const at=v(lp.x+dx/len*perimeter,0,lp.z+dz/len*perimeter);
    at.y=walkingY(at.x,at.z);roadPoint.y=walkingY(roadPoint.x,roadPoint.z);
    streetDoors.push({point:at,road:roadPoint,landmark:l});
  }
}
function routePoint(route,index){
  // NPCs may reverse at road endpoints. Clamp indexes so malformed/short
  // paths can never abort the entire Three.js animation frame.
  if(!route || route.length===0) return v(0,walkingY(0,0),0);
  const a=route[clamp(index,0,route.length-1)];
  const p=P(a[0],a[1],.17);
  p.y=walkingY(p.x,p.z);
  return p;
}
const CROWD_COUNTS={pedestrians:270,performers:24,carts:18};
function spawnCitizens(){
  const spawnActor=(type,race,index)=>{
    const model=type==='Cat'?makeCat():type==='Cart'?makeCart():makeCharacter({race,type});
    const route=pick(type==='Cart'?VALID_NPC_PATHS.filter(r=>r.length>3):VALID_NPC_PATHS);
    const idx=Math.floor(rng()*(route.length-1));const a=routePoint(route,idx),b=routePoint(route,idx+1),t=rng();
    const gp=model.group;gp.position.copy(a).lerp(b,t);gp.position.y=walkingY(gp.position.x,gp.position.z);gp.name=`${type} (${race})`;
    NPCGroup.add(gp);
    const speed=type==='Cat'?rr(2.3,3.9):type==='Flaming Fist'?rr(2.2,3.3):type==='Cart'?rr(1.0,1.7):type==='Performer'?rr(1.6,2.6):rr(1.75,3.5);
    const npc={id:index,type,race,group:gp,limbs:model.limbs,route,index:idx,dir:idx===0?1:(rng()<.5?1:-1),speed,mode:'road',phase:rr(0,7),doorCooldown:rr(2,24),doorTimer:0,door:null,returnPoint:null,insideTimer:0};
    NPCS.push(npc);
  };
  let id=0;
  for(let i=0;i<CROWD_COUNTS.pedestrians;i++){
    const kindRoll=rng();const type=kindRoll<.08?'Cat':kindRoll<.18?'Flaming Fist':kindRoll<.205?'Noble':kindRoll<.43?'Merchant':'Peasant';
    const raceRoll=rng();const race=raceRoll<.69?'Human':raceRoll<.82?'Elf':raceRoll<.90?'Dwarf':raceRoll<.95?'Gnome':'Orc';
    spawnActor(type,race,id++);
  }
  for(let i=0;i<CROWD_COUNTS.performers;i++){spawnActor('Performer',pick(['Human','Elf','Human','Gnome']),id++);}
  for(let i=0;i<CROWD_COUNTS.carts;i++){spawnActor('Cart','Human',id++);}
}
function animateWalk(npc,now){const t=now*npc.speed*5.4+npc.phase;
  if(npc.limbs.length){npc.limbs[0].rotation.x=Math.sin(t)*.58;npc.limbs[1].rotation.x=-Math.sin(t)*.58;npc.limbs[2].rotation.x=-Math.sin(t)*.41;npc.limbs[3].rotation.x=Math.sin(t)*.41;}
}
function moveTowards(group,dest,travel,dt){const delta=dest.clone().sub(group.position);delta.y=0;const length=delta.length();if(length<.07)return true;
  const amount=Math.min(length,travel*dt);group.position.addScaledVector(delta,amount/length);
  if(length>.2)group.rotation.y=Math.atan2(-delta.x,-delta.z);
  group.position.y=walkingY(group.position.x,group.position.z);
  return length<=travel*dt+.07;
}
function updateCitizens(dt,time){for(const n of NPCS){
    // A loitering NPC remains at their exact position until the incident is
    // dismissed. Do not run the route, door-entry, or walk animations.
    if((n.loiteringCount||0)>0){
      for(const limb of n.limbs)limb.rotation.x=0;
      continue;
    }
    n.doorCooldown-=dt;n.phase+=dt*.12;
    if(n.mode==='road'){
      let dest=routePoint(n.route,n.index+n.dir);
      if(moveTowards(n.group,dest,n.speed,dt)){
        n.index+=n.dir;
        if(n.index>=n.route.length-1||n.index<=0)n.dir*=-1;
      }
      if(n.doorCooldown<=0&&!['Cat','Cart','Performer'].includes(n.type)){
        const nearby=streetDoors.filter(d=>d.road.distanceToSquared(n.group.position)<64&&d.point.distanceToSquared(n.group.position)<180);if(nearby.length&&rng()<dt*.19){n.returnPoint=n.group.position.clone();n.door=pick(nearby);n.mode='approach';n.doorCooldown=rr(15,38);}
      }
    }else if(n.mode==='approach'){
      if(moveTowards(n.group,n.door.road,n.speed,dt))n.mode='enter';
    }else if(n.mode==='enter'){
      if(moveTowards(n.group,n.door.point,n.speed*.85,dt)){n.mode='inside';n.insideTimer=rr(.7,2.5);n.group.visible=false;}
    }else if(n.mode==='inside'){
      n.insideTimer-=dt;if(n.insideTimer<=0){n.mode='exit';n.group.visible=true;}
    }else if(n.mode==='exit'){
      if(moveTowards(n.group,n.door.road,n.speed*.85,dt))n.mode='resume';
    }else if(n.mode==='resume'){
      if(moveTowards(n.group,n.returnPoint,n.speed,dt))n.mode='road';
    }
    animateWalk(n,time);
  }}
function placePlayer(actor,at,instant=false){
  const pos=at.clone();pos.y=walkingY(pos.x,pos.z);
  if(!actor.group){const model=makeCharacter({race:actor.race,type:actor.role,color:actor.color,isPlayer:true});actor.group=model.group;actor.limbs=model.limbs;actor.group.userData.playerId=actor.id;actor.group.name=actor.name;NPCGroup.add(actor.group);
    actor.group.position.copy(pos);const l=new CSS2DObject(Object.assign(document.createElement('div'),{textContent:actor.name}));l.element.className='player-label';l.position.set(0,3.2,0);actor.label=l;actor.group.add(l);
  }else if(instant){actor.group.position.copy(pos);actor.target=null;}
  else {actor.start=actor.group.position.clone();actor.target=pos;actor.moveProgress=0;actor.moveDuration=clamp(actor.start.distanceTo(pos)/42,.33,2.4);}
  actor.spawned=true;refreshPartyUI();
}
function updatePlayers(dt,time){for(const a of PLAYERS){if(!a.spawned||!a.group)continue;
    if(a.target){a.moveProgress+=dt/a.moveDuration;const t=smooth(0,1,a.moveProgress);a.group.position.lerpVectors(a.start,a.target,t);a.group.position.y=walkingY(a.group.position.x,a.group.position.z);
      const d=a.target.clone().sub(a.start);a.group.rotation.y=Math.atan2(-d.x,-d.z);
      a.limbs[0].rotation.x=Math.sin(time*12)*.48;a.limbs[1].rotation.x=-Math.sin(time*12)*.48;
      if(a.moveProgress>=1){a.target=null;a.limbs[0].rotation.x=0;a.limbs[1].rotation.x=0;}
    }else{a.group.rotation.y+=dt*.18;a.limbs[0].rotation.x=0;a.limbs[1].rotation.x=0;}
  }}

// --- Crime effects: billboard pillars + red ground rings --------------------
let incidentCounter=0;const incidents=[];
function createCrimeMarker(location,large=false){const g=new THREE.Group();g.position.copy(location);g.position.y+=.2;
  const r=large?17.5:1.75,beamHeight=large?38:7;
  const ring=new THREE.Mesh(new THREE.RingGeometry(r-.20,r,32),new THREE.MeshBasicMaterial({color:0xff3d3e,side:THREE.DoubleSide,transparent:true,opacity:.96,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.2;g.add(ring);
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(r*.48,r*.74,beamHeight,10,1,true),new THREE.MeshBasicMaterial({color:0xff413d,transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false}));pillar.position.y=beamHeight/2;g.add(pillar);
  const top=new THREE.Mesh(new THREE.RingGeometry(r*.32,r*.50,24),new THREE.MeshBasicMaterial({color:0xff6a64,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));top.rotation.x=-Math.PI/2;top.position.y=beamHeight;g.add(top);
  effectsGroup.add(g);return {group:g,ring,pillar,top};
}
function crimeToast(incident){
  const host=document.getElementById('toast-container');const el=document.createElement('div');el.className='crime-toast';
  el.innerHTML=`<span class="tier">⚠ CITY WATCH ALERT · TIER ${incident.definition.tier}</span><strong>Tier ${incident.definition.tier} Crime detected</strong><div class="case-name">${incident.definition.title} · ${incident.name}</div>`;
  host.appendChild(el);setTimeout(()=>el.remove(),6500);
}
function makeIncident(typeId){const def=CRIMES.find(c=>c.id===typeId);if(!def)return;
  let targets=[],place='',point;
  if(def.id==='murder'){
    // Only non-landmark residential buildings. Never reuse an active house.
    const used=new Set(incidents.filter(i=>i.definition.id==='murder')
      .flatMap(i=>i.targets.filter(t=>t.kind==='house').map(t=>t.obj)));
    const available=housePositions.filter(h=>!used.has(h));
    if(!available.length){console.warn('No free residences for another murder.');return;}
    const house=pick(available);
    point=P(house.px,house.pz);
    targets=[{kind:'house',obj:house,position:point.clone()}];
    place='Unmarked city residence';
  }else if(def.id==='loitering'){
    // Spawn a loitering event only on a visible, walking civilian.
    // Avoid carts, cats and NPCs already standing still for another event.
    const eligible=NPCS.filter(n=>n.group.visible&&n.mode==='road'&&
      n.type!=='Cat'&&n.type!=='Cart'&&(n.loiteringCount||0)===0);
    const npc=pick(eligible);
    if(!npc)return;
    npc.loiteringCount=(npc.loiteringCount||0)+1;
    for(const limb of npc.limbs)limb.rotation.x=0;
    targets=[{kind:'citizen',obj:npc}];
    point=npc.group.position.clone();place=npc.type+' loitering';
  }else if(def.target==='pair'){
    const valid=NPCS.filter(n=>n.group.visible&&n.type!=='Cat');const first=pick(valid);const second=valid.filter(n=>n!==first).reduce((best,n)=>!best||n.group.position.distanceToSquared(first.group.position)<best.group.position.distanceToSquared(first.group.position)?n:best,null);
    if(!first||!second)return;targets=[{kind:'citizen',obj:first},{kind:'citizen',obj:second}];point=first.group.position.clone().add(second.group.position).multiplyScalar(.5);place='City streets';
  }else{
    const npc=pick(NPCS.filter(n=>n.group.visible&&n.type!=='Cat'));
    if(!npc)return;targets=[{kind:'citizen',obj:npc}];point=npc.group.position.clone();place=npc.type+' in the city';
  }
  const marker=targets.map(t=>createCrimeMarker(
    t.kind==='house'?t.position:t.obj.group.position,
    t.kind==='house'||t.kind==='landmark'
  ));
  const incident={id:++incidentCounter,definition:def,name:place,targets,marker,born:performance.now()/1000};
  if(def.id==='murder'){
    incident.sceneIndex=(nextMurderScene++%MURDER_SCENES.length)+1;
    incident.sceneName=MURDER_SCENES[incident.sceneIndex-1];
    incident.name=`Scene ${incident.sceneIndex} · ${incident.sceneName}`;
  }
  incidents.push(incident);crimeToast(incident);refreshCrimeUI();focusAt(point,.95);
}
function removeIncident(id){
  const idx=incidents.findIndex(i=>i.id===id);if(idx<0)return;
  const [incident]=incidents.splice(idx,1);
  // Only an active loitering incident pauses pedestrian motion.
  // Dismissing it returns the same NPC to their existing route.
  if(incident.definition.id==='loitering')for(const target of incident.targets){
    if(target.kind==='citizen')target.obj.loiteringCount=Math.max(0,(target.obj.loiteringCount||0)-1);
  }
  incident.marker.forEach(m=>effectsGroup.remove(m.group));refreshCrimeUI();
}
function updateCrimes(now){for(const i of incidents){i.targets.forEach((t,j)=>{
    const marker=i.marker[j],p=t.kind==='house'?t.position:t.obj.group.position;
    marker.group.position.set(p.x,p.y+.22,p.z);
    const pulse=1+.11*Math.sin(now*4+i.id);marker.ring.scale.setScalar(pulse);marker.pillar.material.opacity=.10+.05*Math.sin(now*3+i.id);
    marker.group.visible=t.kind==='house'||t.kind==='landmark'||t.obj.group.visible;
  });}}

// --- Weather & time-of-day --------------------------------------------------
let hour=10,raining=false,showGrid=true,showLabels=true,selectedPlayer=null,selectedLandmark=null;
const RAIN_COUNT=3200;let rainMesh;
function initRain(){const arr=new Float32Array(RAIN_COUNT*6);
  for(let i=0;i<RAIN_COUNT;i++){const x=rr(-500,500),y=rr(2,42),z=rr(-390,390),j=i*6;arr[j]=x;arr[j+1]=y;arr[j+2]=z;arr[j+3]=x-.22;arr[j+4]=y-1.4;arr[j+5]=z-.1;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));
  rainMesh=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xb9d9ee,transparent:true,opacity:.38,depthWrite:false}));rainMesh.frustumCulled=false;rainMesh.visible=false;scene.add(rainMesh);
}
function updateRain(dt){if(!raining)return;const pos=rainMesh.geometry.attributes.position;const arr=pos.array;
  for(let i=0;i<RAIN_COUNT;i++){const j=i*6,x=arr[j]+dt*3,y=arr[j+1]-dt*32,z=arr[j+2]+dt*1.1;
    if(y<groundY(x,z)){const nx=rr(-500,500),nz=rr(-390,390),ny=rr(24,48);arr[j]=nx;arr[j+1]=ny;arr[j+2]=nz;arr[j+3]=nx-.22;arr[j+4]=ny-1.4;arr[j+5]=nz-.1;}
    else{arr[j]=x;arr[j+1]=y;arr[j+2]=z;arr[j+3]=x-.22;arr[j+4]=y-1.4;arr[j+5]=z-.1;}}
  pos.needsUpdate=true;
}
function formatHour(value){const h=Math.floor(value)%24,m=Math.round((value-h)*60)%60;return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;}
function setTime(value){hour=Number(value);document.querySelector('#time-slider').value=hour;document.querySelector('#clock-label').textContent=formatHour(hour);
  document.querySelectorAll('[data-time]').forEach(el=>el.classList.toggle('selected',el.dataset.time==='day' ? hour>=6&&hour<18 : hour<6||hour>=18));
  const daylight=clamp(Math.sin((hour-5.6)*Math.PI/13.5),0,1),sunPower=smooth(0,.35,daylight);
  const rainFactor=raining?.73:1;
  const daylightColor=new THREE.Color(0xa9bdba),twilightColor=new THREE.Color(0x9b7979),nightColor=new THREE.Color(0x101d33);
  let color=nightColor.clone().lerp(twilightColor,smooth(0,.25,daylight));color.lerp(daylightColor,smooth(.15,.75,daylight));color.multiplyScalar(raining?.78:1);
  scene.background.copy(color);scene.fog.color.copy(color);
  hemi.intensity=lerp(.45,2.15,daylight)*rainFactor;
  sun.intensity=lerp(.10,3.1,sunPower)*rainFactor;sun.color.set(hour>16||hour<7?0xffbb89:0xffe7c0);
  sun.position.set(-90*Math.cos((hour-6)/12*Math.PI),25+105*daylight,45);
  moon.intensity=lerp(.9,.15,sunPower);
  renderer.toneMappingExposure=lerp(.88,1.36,sunPower)*(raining?.89:1);
  for(const lamp of lanternMeshes)lamp.material.emissiveIntensity=lerp(2.25,.12,sunPower);
  for(const light of windowMeshes)light.material.emissiveIntensity=lerp(1.85,.20,sunPower);
  const state=daylight>.22?'DAYLIGHT':'NIGHTFALL';document.querySelector('#world-status').textContent=`${state} · ${raining?'RAIN':'CLEAR'}`;
  document.querySelector('.live-dot').style.background=raining?'#88b5cc':daylight>.22?'#89c9a0':'#d9b983';
}
function setRain(value){raining=!!value;rainMesh.visible=raining;const b=document.querySelector('#rain-switch');b.classList.toggle('on',raining);b.setAttribute('aria-pressed',String(raining));setTime(hour);}
// --- Interactive interface --------------------------------------------------
let activeDistrict='all',searchText='',panTween=null;
const $=selector=>document.querySelector(selector);
function refreshLocationUI(){const host=$('#location-list');host.innerHTML='';let count=0;
  for(const district of ['upper','lower','outer']){
    const places=LANDMARKS.filter(l=>(activeDistrict==='all'||l.district===activeDistrict)&&l.district===district&&l.name.toLowerCase().includes(searchText));
    if(!places.length)continue;
    const head=document.createElement('div');head.className='district-heading';head.textContent=DISTRICT_NAMES[district];host.appendChild(head);
    for(const l of places){const row=document.createElement('button');row.className=`location-row ${selectedLandmark===l.id?'active':''}`;row.title=`Fly to ${l.name}`;
      row.innerHTML=`<span class="location-symbol">${ICONS[l.kind]||'⌂'}</span><span class="location-text">${l.name}</span><span class="location-arrow">›</span>`;
      row.addEventListener('click',()=>selectLandmark(l,true));host.appendChild(row);count++;
    }
  }
  if(!count)host.innerHTML='<div class="empty-events" style="margin:16px 6px">No places found.</div>';
  $('#place-count').textContent=`${count} landmark${count===1?'':'s'}`;
}
function selectLandmark(l,shouldFocus){
  selectedLandmark=l.id;
  for(const l0 of LANDMARKS){l0.label.element.classList.toggle('selected',l0.id===l.id);}
  refreshLocationUI();
  if(shouldFocus)focusAt(l.group.position,3.1);
  const box=$('#landmark-detail');box.classList.remove('hidden');
  box.innerHTML=`<button class="detail-close" title="Close" aria-label="Close location">✕</button><span class="detail-district">${DISTRICT_NAMES[l.district]} · ${l.kind.replaceAll('-',' ')}</span><h3>${l.name}</h3><p>${l.desc}</p>${interiorUrlFor(l)?'<button class="enter-button">↗ Enter 3D interior</button>':'<div class="enter-status">⌂ Interior scene not created yet</div>'}`;
  box.querySelector('.detail-close').addEventListener('click',clearLandmark);
  const enter=box.querySelector('.enter-button');if(enter)enter.addEventListener('click',()=>openLandmarkInterior(l));
}
function clearLandmark(){selectedLandmark=null;$('#landmark-detail').classList.add('hidden');LANDMARKS.forEach(l=>l.label.element.classList.remove('selected'));refreshLocationUI();}
async function probeInteriors(){// A direct HEAD check lets a future <slug>.html file automatically become clickable.
  await Promise.all(LANDMARKS.map(async l=>{
    try{const resp=await fetch(`./interiors/${l.id}.html`,{method:'HEAD',cache:'no-cache'});l.interiorExists=resp.ok;}
    catch{l.interiorExists=false;}
    if(selectedLandmark===l.id)selectLandmark(l,false);
  }));
}
function focusAt(point,zoom=1.5){const target=v(point.x,0,point.z);panTween={from:controls.target.clone(),to:target,fromCam:camera.position.clone(),start:performance.now(),duration:850,fromZoom:camera.zoom,toZoom:Math.max(camera.zoom,zoom)};}
function resetCamera(){topView=false;savedAngledView=null;controls.enableRotate=true;camera.up.set(0,1,0);panTween={from:controls.target.clone(),to:v(0,0,0),fromCam:camera.position.clone(),toCam:v(340,420,460),start:performance.now(),duration:700,fromZoom:camera.zoom,toZoom:1};document.querySelector('#top-view-btn')?.classList.remove('selected');}
function updateCamera(now){if(!panTween)return;let t=clamp((now*1000-panTween.start)/panTween.duration,0,1);t=t*t*(3-2*t);
  const target=panTween.from.clone().lerp(panTween.to,t);controls.target.copy(target);if(panTween.toCam){camera.position.lerpVectors(panTween.fromCam,panTween.toCam,t);}else{const offset=panTween.to.clone().sub(panTween.from);camera.position.copy(panTween.fromCam).addScaledVector(offset,t);}
  camera.zoom=lerp(panTween.fromZoom,panTween.toZoom,t);camera.updateProjectionMatrix();if(t>=1)panTween=null;
}
function animateCameraTo(target,pos,zoom=1.2,duration=800){panTween={from:controls.target.clone(),to:target.clone(),fromCam:camera.position.clone(),toCam:pos.clone(),start:performance.now(),duration,fromZoom:camera.zoom,toZoom:zoom};}
function toggleTopView(force){
  const next=typeof force==='boolean'?force:!topView;
  if(next===topView)return;
  topView=next;panTween=null;
  if(topView){
    savedAngledView={position:camera.position.clone(),target:controls.target.clone(),zoom:camera.zoom};
    camera.up.set(0,0,-1);
    controls.target.set(0,0,0);camera.position.set(0,800,.01);
    camera.zoom=.59;controls.enableRotate=false;
    camera.lookAt(controls.target);camera.updateProjectionMatrix();
  }else{
    controls.enableRotate=true;camera.up.set(0,1,0);
    const old=savedAngledView||{position:v(340,420,460),target:v(0,0,0),zoom:1};
    animateCameraTo(old.target,old.position,old.zoom,650);
    savedAngledView=null;
  }
  document.querySelector('#top-view-btn')?.classList.toggle('selected',topView);
}
function updateKeyboardPan(dt){const pressed=keyboardPan.w||keyboardPan.a||keyboardPan.s||keyboardPan.d;if(!pressed)return;const speed=(topView?190:135)/camera.zoom;const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;if(forward.lengthSq()<1e-5)forward.set(0,0,-1);forward.normalize();const right=new THREE.Vector3(-forward.z,0,forward.x).normalize();const delta=new THREE.Vector3();if(keyboardPan.w)delta.add(forward);if(keyboardPan.s)delta.sub(forward);if(keyboardPan.d)delta.add(right);if(keyboardPan.a)delta.sub(right);if(delta.lengthSq()===0)return;delta.normalize().multiplyScalar(speed*dt);camera.position.add(delta);controls.target.add(delta);}
function buildCrimeUI(){const host=$('#crime-buttons');host.innerHTML='';for(const c of CRIMES){const btn=document.createElement('button');btn.className='crime-button';btn.innerHTML=`<strong>${c.title}</strong><small>● TIER ${c.tier} CRIME</small>`;btn.addEventListener('click',()=>makeIncident(c.id));host.appendChild(btn);}}
function refreshCrimeUI(){
  const host=$('#crime-events');host.innerHTML='';
  if(!incidents.length){host.innerHTML='<div class="empty-events">No incidents in the city.</div>';return;}
  incidents.slice().reverse().forEach(i=>{
    const row=document.createElement('div');row.className='event-row';
    const dot=document.createElement('span');dot.className='event-dot';
    const body=document.createElement('div');body.className='event-info';
    const title=document.createElement('strong');title.textContent=`Tier ${i.definition.tier} · ${i.definition.title}`;
    title.title='Find incident on map';title.addEventListener('click',()=>focusAt(i.marker[0].group.position,2));
    body.appendChild(title);
    if(i.sceneIndex){
      const detail=document.createElement('small');detail.textContent=i.name;detail.className='case-description';
      body.appendChild(detail);
      const enter=document.createElement('button');enter.className='event-enter';
      enter.textContent='↗ Enter House';enter.title=`Open ${i.sceneName} in a new tab`;
      enter.addEventListener('click',()=>enterMurderScene(i));body.appendChild(enter);
    }
    const dismiss=document.createElement('button');dismiss.textContent='✕';
    dismiss.title='Dismiss incident';dismiss.className='event-dismiss';
    dismiss.addEventListener('click',()=>removeIncident(i.id));
    row.append(dot,body,dismiss);host.appendChild(row);
  });
}
function refreshPartyUI(){const host=$('#party-list');host.innerHTML='';for(const [index,a] of PLAYERS.entries()){
    const row=document.createElement('button');row.className=`party-row ${selectedPlayer===a.id?'active':''}`;
    row.innerHTML=`<span class="party-avatar" style="background:#${a.color.toString(16).padStart(6,'0')}22;color:#${a.color.toString(16).padStart(6,'0')}">${a.symbol}</span><span><span class="party-name">${a.name}</span><span class="party-class">${a.race} · ${a.role}</span></span><span class="party-status">${a.spawned?'ON MAP':'PLACE'}</span>`;
    row.title=`${index+1} · ${a.spawned?'Select and move':'Place'} ${a.name}`;row.addEventListener('click',()=>selectPlayer(a));host.appendChild(row);
    if(a.label)a.label.element.classList.toggle('selected',selectedPlayer===a.id);
  }
  const actor=PLAYERS.find(a=>a.id===selectedPlayer);
  $('#move-instructions').textContent=actor?`◈ ${actor.name} selected. Click anywhere on the map to ${actor.spawned?'move':'spawn'}; hold Shift when clicking to teleport instantly.`:'Select a party member, then click the map.';
  renderer.domElement.style.cursor=actor?'crosshair':'grab';
}
function selectPlayer(a){selectedPlayer=a.id;clearLandmark();refreshPartyUI();if(a.spawned)focusAt(a.group.position,Math.max(camera.zoom,1.8));}
function clearPlayer(){selectedPlayer=null;refreshPartyUI();}
function spawnAll(){const house=BY_ID['cohens-house'];const at=house.group.position;
  PLAYERS.forEach((a,i)=>placePlayer(a,at.clone().add(v((i-1.5)*3.2,0,-(i%2)*3.0-24)),true));selectedPlayer=null;refreshPartyUI();focusAt(at,2.4);
}
function removeAllPlayers(){for(const a of PLAYERS){if(a.group){NPCGroup.remove(a.group);a.group=null;a.label=null;}a.spawned=false;a.target=null;}clearPlayer();}
function collapsePanel(id){const panel=document.querySelector(`[data-panel="${id}"]`);if(!panel)return;panel.classList.toggle('collapsed');panel.querySelector('.fold-header').setAttribute('aria-expanded',String(!panel.classList.contains('collapsed')));}
function toggleModal(id,open){$(id).classList.toggle('hidden',!open);}
function hideUi(){document.body.classList.toggle('ui-hidden');}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let terrainSurface;
function raySetup(ev){const rect=renderer.domElement.getBoundingClientRect();pointer.x=((ev.clientX-rect.left)/rect.width)*2-1;pointer.y=-((ev.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);}
function clickMap(ev){if(ev.target!==renderer.domElement)return;raySetup(ev);
  const actors=PLAYERS.filter(a=>a.group&&a.spawned).map(a=>a.group);
  const hits=raycaster.intersectObjects(actors,true);
  if(hits.length){let p=hits[0].object;while(p&&!p.userData.playerId)p=p.parent;if(p){const actor=PLAYERS.find(a=>a.id===p.userData.playerId);selectPlayer(actor);return;}}
  const landHits=raycaster.intersectObjects(LANDMARKS.map(l=>l.group),true);
  if(!selectedPlayer&&landHits.length){let p=landHits[0].object;while(p&&!p.userData.landmarkId)p=p.parent;if(p){const l=BY_ID[p.userData.landmarkId];selectLandmark(l,false);return;}}
  const terrainHits=raycaster.intersectObject(terrainSurface,false);const hit=terrainHits[0];
  if(!hit)return;
  if(selectedPlayer){const actor=PLAYERS.find(a=>a.id===selectedPlayer);if(actor){placePlayer(actor,hit.point,ev.shiftKey||!actor.spawned);focusAt(hit.point,Math.max(camera.zoom,1.4));}}
  else clearLandmark();
}
function coordinateHover(ev){if(ev.target!==renderer.domElement)return;raySetup(ev);const hit=raycaster.intersectObject(terrainSurface)[0];if(!hit)return;const px=Math.round(hit.point.x/SCALE+750),pz=Math.round(hit.point.z/SCALE+500);
  $('#coordinates').textContent=`${clamp(px,0,1500)} : ${clamp(pz,0,1000)} · BALDUR'S GATE`;
}
function initEvents(){
  $('#location-search').addEventListener('input',e=>{searchText=e.target.value.trim().toLowerCase();refreshLocationUI();});
  document.querySelectorAll('.district-tabs button').forEach(b=>b.addEventListener('click',()=>{activeDistrict=b.dataset.district;document.querySelectorAll('.district-tabs button').forEach(x=>x.classList.toggle('active',x===b));refreshLocationUI();}));
  document.querySelectorAll('.fold-header').forEach(b=>b.addEventListener('click',()=>collapsePanel(b.closest('[data-panel]').dataset.panel)));
  $('#time-slider').addEventListener('input',e=>setTime(e.target.value));
  document.querySelectorAll('[data-time]').forEach(b=>b.addEventListener('click',()=>setTime(b.dataset.time==='day'?10:22)));
  $('#rain-switch').addEventListener('click',()=>setRain(!raining));
  $('#clear-crimes').addEventListener('click',()=>incidents.slice().forEach(i=>removeIncident(i.id)));
  $('#spawn-party').addEventListener('click',spawnAll);$('#remove-party').addEventListener('click',removeAllPlayers);
  $('#reference-btn').addEventListener('click',()=>toggleModal('#reference-modal',true));
  $('#help-btn').addEventListener('click',()=>toggleModal('#help-modal',true));
  $('#top-view-btn').addEventListener('click',()=>toggleTopView());
  $('#ui-toggle').addEventListener('click',hideUi);
  $('#mobile-places').addEventListener('click',()=>{$('#locations-panel').classList.toggle('mobile-show');$('.right-panels').classList.remove('mobile-show');});
  $('#mobile-tools').addEventListener('click',()=>{$('.right-panels').classList.toggle('mobile-show');$('#locations-panel').classList.remove('mobile-show');});
  document.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>b.closest('.modal').classList.add('hidden')));
  $('#grid-toggle').addEventListener('click',()=>{showGrid=!showGrid;gridObjects.forEach(g=>g.visible=showGrid);$('#grid-toggle').textContent=showGrid?'ON':'OFF';$('#grid-toggle').classList.toggle('active',showGrid);});
  $('#labels-toggle').setAttribute('aria-pressed',String(showLabels));
  $('#labels-toggle').addEventListener('click',()=>{
    showLabels=!showLabels;
    const toggle=$('#labels-toggle');
    toggle.textContent=showLabels?'ON':'OFF';
    toggle.classList.toggle('active',showLabels);
    toggle.setAttribute('aria-pressed',String(showLabels));
    updateLabels();
  });
  let pointerDown=null;
  renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};});
  renderer.domElement.addEventListener('pointerup',e=>{if(pointerDown&&Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)<6)clickMap(e);pointerDown=null;});
  let hoverLast=0;renderer.domElement.addEventListener('pointermove',e=>{if(performance.now()-hoverLast>90){coordinateHover(e);hoverLast=performance.now();}});
  renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('keydown',e=>{
    if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
    if(e.key==='Escape'){$('#reference-modal').classList.add('hidden');$('#help-modal').classList.add('hidden');clearPlayer();clearLandmark();return;}
    if(['1','2','3','4'].includes(e.key)){selectPlayer(PLAYERS[Number(e.key)-1]);return;}
    const key=e.key.toLowerCase();
    if(['w','a','s','d'].includes(key)){keyboardPan[key]=true;return;}
    if(key==='t')collapsePanel('atmosphere');else if(key==='c')collapsePanel('crimes');else if(key==='p')collapsePanel('party');
    else if(key==='r')setRain(!raining);else if(key==='n')setTime(hour>=6&&hour<18?22:10);
    else if(key==='g')$('#grid-toggle').click();else if(key==='l')$('#labels-toggle').click();
    else if(key==='m')toggleModal('#reference-modal',$('#reference-modal').classList.contains('hidden'));
    else if(key==='h')hideUi();else if(key==='f'){resetCamera();topView=false;controls.enableRotate=true;}else if(key==='v')toggleTopView();else if(e.key==='?')toggleModal('#help-modal',true);
  });
  window.addEventListener('keyup',e=>{const key=e.key.toLowerCase();if(['w','a','s','d'].includes(key))keyboardPan[key]=false;});
  window.addEventListener('resize',()=>{const w=window.innerWidth,h=window.innerHeight,aspect=w/h,viewHeight=700;
    camera.left=-viewHeight*aspect/2;camera.right=viewHeight*aspect/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.updateProjectionMatrix();renderer.setSize(w,h);labelsRenderer.setSize(w,h);});
  window.dispatchEvent(new Event('resize'));
}

// --- Assembly & draw loop ---------------------------------------------------
function repositionLandmarks(){
  // V6: Disperse the label-bearing landmark parcels across the former red woodland.
  // The waterfront, city gates, Rivington crossing and hilltop cemetery stay anchored.
  const planned={
    'ducal-palace':[515,-235], 'high-hall':[300,-120],
    'ladys-hall':[95,-190], 'watch-citadel':[75,80],
    'helm-and-cloak':[198,54], 'upper-city-gardens':[720,-230],
    'flaming-fist-barracks':[-96,563], 'generic-bathhouse':[70,335],
    'temple-of-selune':[196,366], 'house-of-grief':[-194,707],
    'blushing-mermaid':[196,375], 'blade-and-stars':[665,415],
    'sorcerous-sundries':[877,337], 'elfsong-tavern':[556,271],
    'counting-house':[555,418], 'leoric-house':[95,455],
    'baldurs-mouth':[865,325], 'water-queens-house':[250,545],
    'shitty-bars-bar':[1110,40],
    'cohens-house':[1196,37], 'jasmines-house':[1240,54],
    'danthelons-dancing-axe':[1290,475], 'graveyard':[915,430],
    'bloomridge-park':[254,458],
  };
  for(const l of LANDMARKS)if(planned[l.id]){
    l.x=planned[l.id][0];l.z=planned[l.id][1];
  }
  const radius={barracks:21,palace:18,temple:15,'temple-dark':16,tavern:13,
    bank:16,cottage:11,tower:15,bathhouse:13,printing:11,townhouse:11,
    gate:10,crossing:12,harbor:12,ship:12,graveyard:19,park:20};
  const anchored=new Set(['gray-harbor','low-lantern','wyrms-crossing',
    'flaming-fist-barracks','house-of-grief','counting-house','leoric-house','shitty-bars-bar',
    'elfsong-tavern','blushing-mermaid','sorcerous-sundries',
    'baldurs-gate','basilisk-gate','gond-gate','cliff-gate',
    'bloomridge-park','graveyard','cohens-house','jasmines-house',
    'danthelons-dancing-axe']);
  const placed=LANDMARKS.filter(l=>anchored.has(l.id));
  const movable=LANDMARKS.filter(l=>!anchored.has(l.id)).sort((a,b)=>(radius[b.kind]||12)-(radius[a.kind]||12));
  for(const l of movable){
    const ox=l.x,oz=l.z,r=radius[l.kind]||12;
    let best=null,bestScore=Infinity;
    for(const shift of [0,22,38,56,78,106,142,188,240]){
      for(let k=0;k<(shift?24:1);k++){
        const angle=k*Math.PI*2/24,px=ox+Math.cos(angle)*shift,pz=oz+Math.sin(angle)*shift;
        if(px<-192||px>1700||pz<-295||pz>1065||!shoreClear(px,pz,r+3)||nearUpperWall(px,pz,28))continue;
        if(l.district==='upper'&&px>860)continue;
        if(l.district==='lower'&&px>965)continue;
        if(l.district==='lower'&&px<=920&&pz<upperWallZ(px)+40)continue;
        if(l.district==='outer'&&px<615)continue;
        // A landmark needs a clear parcel and a short visible route to the streets.
        const road=nearestRoadPoint(px,pz);
        if(!road||road.dist*SCALE>47)continue;
        const clearance=road.dist*SCALE-road.width/2-r-2;
        if(clearance<0)continue;
        if(placed.some(o=>Math.hypot(px-o.x,pz-o.z)*SCALE<r+(radius[o.kind]||12)+5))continue;
        const score=shift+Math.max(0,road.dist*SCALE-24)*.4;
        if(score<bestScore){best=[px,pz];bestScore=score;}
      }
      if(best)break;
    }
    if(best){l.x=best[0];l.z=best[1];}
    else console.warn('No clear landmark parcel around:',l.id);
    placed.push(l);
  }
}
function createMap(){
  repositionLandmarks();
  createTerritory();makeRoadNetwork();createFortifications();createBridge();populateHarbor();
  scatterHouses();terrainDecor();
  for(const l of LANDMARKS)buildingLandmark(l);
  connectLandmarksToRoads();
  buildStreetDoors();lamps();
  placeDistrictText('UPPER CITY',310,-18);placeDistrictText('LOWER CITY',478,385);
  placeDistrictText('OUTER CITY',1150,-130);placeDistrictText('RIVINGTON',1391,965);
  placeDistrictText('CHIONTHAR RIVER',951,683,'river');placeDistrictText('DUSTHAWK HILL',1010,360,'river');
  spawnCitizens();initRain();
  // Terrain mesh is the first large mesh created by createTerritory().
  terrainSurface=world.children.find(obj=>obj.isMesh&&obj.geometry.type==='PlaneGeometry');
  buildCrimeUI();refreshCrimeUI();refreshLocationUI();refreshPartyUI();initEvents();setTime(10);
  probeInteriors();
}
function updateLabels(){
  // CSS2DRenderer writes element.style.display during its render pass, so
  // toggling inline display is unreliable. A CSS class with !important
  // keeps label visibility under our control at every zoom level.
  // V7.1: restore V6's complete landmark-name coverage. V6's inline
  // display:none was overwritten by CSS2DRenderer, so all landmarks (not
  // only 'major' landmarks) were visible. When V7 fixed that display override,
  // its old zoom filter unexpectedly hid the smaller named locations.
  // Every named location now follows the user's Labels ON/OFF setting,
  // independently of camera zoom; ordinary buildings remain unlabelled.
  for(const l of LANDMARKS){
    l.label.element.classList.toggle('atlas-label-hidden',!showLabels);
  }
  document.querySelectorAll('.district-label').forEach(el=>
    el.classList.toggle('atlas-label-hidden',!(showLabels&&camera.zoom<2.25)));
  for(const a of PLAYERS)if(a.label)
    a.label.element.classList.toggle('atlas-label-hidden',!showLabels);
}
let last=performance.now(),crowdErrorReported=false;
function animate(ts){
  requestAnimationFrame(animate);
  const dt=Math.min((ts-last)/1000,.05);last=ts;
  updateCamera(ts/1000);updateKeyboardPan(dt);controls.update();
  // Keep the map visible even if a future crowd AI change has an error.
  try{updateCitizens(dt,ts/1000);}catch(err){
    if(!crowdErrorReported){console.error('Crowd update failed (map stays visible):',err);crowdErrorReported=true;}
  }
  updatePlayers(dt,ts/1000);updateCrimes(ts/1000);updateRain(dt);updateLabels();
  renderer.render(scene,camera);labelsRenderer.render(scene,camera);
}
try{
  createMap();requestAnimationFrame(animate);
  const loading=$('#loading');requestAnimationFrame(()=>{loading.style.opacity='0';setTimeout(()=>loading.remove(),620);});
}catch(err){
  console.error('Atlas initialization failed:',err);
  const message=String(err?.message||err);
  $('#loading').innerHTML='<div class="loading-emblem">⚠</div><div>UNABLE TO OPEN THE ATLAS</div><small style="max-width:85vw;text-align:center;line-height:1.5">'+message.replace(/[<>&"]/g,'')+' — Open Chrome DevTools (F12) for details.</small>';
}
