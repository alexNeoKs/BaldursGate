import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CSS2DRenderer,CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import { findLandmarkScene } from '../places/scene-registry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// BALDUR'S GATE — MURDER INTERIOR SYSTEM V8
// Static GitHub Pages compatible. No build step or external model assets.
// Each character can move up to six grid squares (orthogonally or diagonally)
// in one action, respecting furniture, walls and other miniatures.
const PARAMS = new URLSearchParams(location.search);
const LANDMARK_ID = PARAMS.get('place');
const landmarkScene = LANDMARK_ID ? findLandmarkScene(LANDMARK_ID) : null;
// Fail explicitly, rather than quietly rendering an unrelated murder room.
if(LANDMARK_ID && !landmarkScene) throw new Error(`No registered interior scene for: ${LANDMARK_ID}`);
// Gated subsidiary locations are navigable only from their parent landmark.
if(landmarkScene?.requiresEntryFrom &&
   sessionStorage.getItem(`bg-landmark-access:${LANDMARK_ID}`)!==landmarkScene.requiresEntryFrom){
  window.location.replace(`./index.html?place=${encodeURIComponent(landmarkScene.requiresEntryFrom)}`);
  throw new Error(`Visit ${landmarkScene.requiresEntryFrom} to enter ${LANDMARK_ID}`);
}
const SCENE_ID = LANDMARK_ID ? 0 : THREE.MathUtils.clamp(Number(PARAMS.get('scene'))||1,1,5);
const IS_CULT_SCENE = SCENE_ID === 5;
const CELL=4,MAX_MOVEMENT=6;
const SCENES={
  1:{name:'The Crimson Dwelling',subtitle:'Scene I · Bhaal · an ordinary home reduced to a slaughterhouse',w:12,h:9},
  2:{name:'The Tyrant’s Lesson',subtitle:'Scene II · Bane · an abandoned interrogation chamber',w:12,h:9},
  3:{name:'The Bone Collector',subtitle:'Scene III · Myrkul · silence among the remains',w:12,h:9},
  4:{name:'The Silent Family',subtitle:'Scene IV · Bhaal · an entire household murdered',w:12,h:9},
  5:{name:'The Cultist Safehouse',subtitle:'Scene V · Bhaal · an intact house hiding an enemy cell',w:14,h:11}
};
const config = landmarkScene || SCENES[SCENE_ID], WIDTH=config.w*CELL, HEIGHT=config.h*CELL;
// Landmark metadata may opt into open-air terrain and an encounter-scaled camera.
// Existing murder scenes remain on the original indoor dollhouse path.
const $=s=>document.querySelector(s);
$('#scene-title').textContent=config.name;
$('#scene-subtitle').textContent=config.subtitle;
$('#scene-chip').textContent=landmarkScene?`LANDMARK · ${LANDMARK_ID}`:`MURDER SCENE ${SCENE_ID} / 5`;
$('#cult-panel').classList.toggle('hidden',!IS_CULT_SCENE);
$('#toggle-cult-panel').classList.toggle('hidden',!IS_CULT_SCENE);

const scene=new THREE.Scene();scene.background=new THREE.Color(0x1e2428);
scene.fog=new THREE.FogExp2(0x1e2428,.007);
if (landmarkScene?.atmosphere) {
  const sky = landmarkScene.atmosphere;
  scene.background.set(sky.background ?? 0x1e2428);
  scene.fog.color.set(sky.background ?? 0x1e2428);
  scene.fog.density = sky.fogDensity ?? .007;
}
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.33;
$('#viewport').appendChild(renderer.domElement);
const labelRenderer=new CSS2DRenderer();labelRenderer.setSize(innerWidth,innerHeight);
labelRenderer.domElement.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:2';
$('#viewport').appendChild(labelRenderer.domElement);
const camera=new THREE.OrthographicCamera(-38,38,24,-24,.1,landmarkScene?.cameraFar??300);
camera.position.set(57,82,69);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.08;
controls.minZoom=.65;controls.maxZoom=2.8;
controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI*.48;
controls.maxDistance=150;controls.minDistance=23;
controls.screenSpacePanning=true;controls.target.set(0,0,0);controls.update();

const hemisphere=new THREE.HemisphereLight(0xf7e3c3,0x2c1d17,2);scene.add(hemisphere);
const sun=new THREE.DirectionalLight(0xffdec0,3.1);
sun.position.set(-22,50,24);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-55;sun.shadow.camera.right=55;
sun.shadow.camera.top=55;sun.shadow.camera.bottom=-55;sun.shadow.normalBias=.03;
scene.add(sun,sun.target);
if(landmarkScene?.shadowExtent){
  const e=landmarkScene.shadowExtent;
  sun.shadow.camera.left=-e;sun.shadow.camera.right=e;
  sun.shadow.camera.top=e;sun.shadow.camera.bottom=-e;
  sun.shadow.camera.updateProjectionMatrix();
  sun.position.set(-e*.55,e*.95,e*.38);
}
const ambient=new THREE.PointLight(landmarkScene?0xf2aa65:0xa84134,(SCENE_ID===3 || config.floor==='stone')?7:3,80);
ambient.position.set(-13,9,-13);scene.add(ambient);
if(SCENE_ID===5){ambient.color.set(0xf2a65f);ambient.intensity=4;}
// Landmark-only optional sky/light tuning. All legacy murder scenes retain
// their original palette and lighting when no overrides are declared.
const lightSettings=landmarkScene?.atmosphere?.lighting;
if(lightSettings){
  if(lightSettings.hemisphereColor!==undefined)hemisphere.color.set(lightSettings.hemisphereColor);
  if(lightSettings.hemisphereGround!==undefined)hemisphere.groundColor.set(lightSettings.hemisphereGround);
  if(lightSettings.hemisphereIntensity!==undefined)hemisphere.intensity=lightSettings.hemisphereIntensity;
  if(lightSettings.sunColor!==undefined)sun.color.set(lightSettings.sunColor);
  if(lightSettings.sunIntensity!==undefined)sun.intensity=lightSettings.sunIntensity;
  if(lightSettings.ambientColor!==undefined)ambient.color.set(lightSettings.ambientColor);
  if(lightSettings.ambientIntensity!==undefined)ambient.intensity=lightSettings.ambientIntensity;
}

// Optional, reversible scene-wide illumination for large dark landmarks.
// One ambient fill lights every room and corridor without creating dozens of
// expensive point lights. Original scene colors, fog and exposure are restored
// exactly when disabled. This never changes player-attached lights.
const sceneLighting={enabled:false,fill:null,original:null};
function setSceneLightingEnabled(enabled,options={}){
  if(!landmarkScene)throw new Error('Scene-wide lighting requires a named landmark');
  const on=Boolean(enabled);
  const opts={fillColor:0xfff1df,fillIntensity:3.5,
    hemisphereColor:0xe5e6eb,hemisphereGround:0x747b82,
    hemisphereIntensity:2.8,sunColor:0xffebd3,sunIntensity:1.5,
    fogDensity:.0003,...options};
  for(const key of ['fillIntensity','hemisphereIntensity','sunIntensity','fogDensity']){
    if(!Number.isFinite(opts[key])||opts[key]<0)throw new Error(`Invalid scene-lighting ${key}`);
  }
  if(!sceneLighting.original){
    sceneLighting.original={
      hemisphereColor:hemisphere.color.clone(),groundColor:hemisphere.groundColor.clone(),
      hemisphereIntensity:hemisphere.intensity,
      sunColor:sun.color.clone(),sunIntensity:sun.intensity,
      fogDensity:scene.fog?.density??null,
    };
  }
  if(on){
    if(!sceneLighting.fill){
      sceneLighting.fill=new THREE.AmbientLight(opts.fillColor,0);
      scene.add(sceneLighting.fill);
    }
    sceneLighting.fill.color.set(opts.fillColor);
    sceneLighting.fill.intensity=opts.fillIntensity;
    hemisphere.color.set(opts.hemisphereColor);
    hemisphere.groundColor.set(opts.hemisphereGround);
    hemisphere.intensity=opts.hemisphereIntensity;
    sun.color.set(opts.sunColor);
    sun.intensity=opts.sunIntensity;
    if(scene.fog)scene.fog.density=opts.fogDensity;
  }else{
    const original=sceneLighting.original;
    if(sceneLighting.fill)sceneLighting.fill.intensity=0;
    hemisphere.color.copy(original.hemisphereColor);
    hemisphere.groundColor.copy(original.groundColor);
    hemisphere.intensity=original.hemisphereIntensity;
    sun.color.copy(original.sunColor);
    sun.intensity=original.sunIntensity;
    if(scene.fog&&original.fogDensity!==null)scene.fog.density=original.fogDensity;
  }
  sceneLighting.enabled=on;
  return on;
}

const root=new THREE.Group();scene.add(root);
const floorGroup=new THREE.Group(),wallGroup=new THREE.Group(),props=new THREE.Group(),tokenGroup=new THREE.Group(),highlightGroup=new THREE.Group();
root.add(floorGroup,wallGroup,props,tokenGroup,highlightGroup);
const mat=(hex,extra={})=>new THREE.MeshStandardMaterial({color:hex,roughness:.92,...extra});
// Geometry builders create many similarly colored props in a large camp.
// Opt-in material sharing avoids thousands of redundant GPU materials.
const sceneMaterialCache=new Map();
function sceneMat(hex){
  if(!config.optimizeStaticGeometry)return mat(hex);
  if(!sceneMaterialCache.has(hex))sceneMaterialCache.set(hex,mat(hex));
  return sceneMaterialCache.get(hex);
}
const M={
  floor:mat(0x7a5a3d),floorAlt:mat(0x866243),stone:mat(0x77746c),stoneAlt:mat(0x686761),
  wall:mat(0xb5a18b),plaster:mat(0xd0baa0),wood:mat(0x61422d),woodDark:mat(0x392719),
  bronze:mat(0xa68650,{metalness:.45,roughness:.48}),iron:mat(0x424141,{metalness:.48}),
  fabric:mat(0x746b63),linen:mat(0xb9ab9a),rug:mat(0x6d2928),rugAlt:mat(0x394f52),
  wine:mat(0x710d13),blood:mat(0x7e0710,{roughness:.51}),dryBlood:mat(0x420509),
  flesh:mat(0xd0a78d),flesh2:mat(0x96705b),bone:mat(0xd1c7af),
  skullRed:mat(0x982329,{emissive:0x5e090e,emissiveIntensity:1.3}),
  skullPale:mat(0xe4dfd4,{emissive:0x505050,emissiveIntensity:.35}),
  blue:mat(0x435f76),green:mat(0x526746),ink:mat(0x201a19),
  cult:mat(0x3e141b),leather:mat(0x48372e),metal:mat(0xa5a3a0,{metalness:.68,roughness:.38})
};
function mesh(parent,geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,w,h,d,x,y,z,material=M.wood){return mesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z);}
function sphere(parent,r,x,y,z,material=M.bone){return mesh(parent,new THREE.SphereGeometry(r,14,11),material,x,y,z);}
function cylinder(parent,rt,rb,h,x,y,z,material=M.wood,segments=12){return mesh(parent,new THREE.CylinderGeometry(rt,rb,h,segments),material,x,y,z);}
const rng=(a,b)=>a+Math.random()*(b-a);
const randPick=arr=>arr[Math.floor(Math.random()*arr.length)];
function center(c,r){return new THREE.Vector3((c+.5-config.w/2)*CELL,0,(r+.5-config.h/2)*CELL);}
const valid=c=>c>=0&&c<config.w;
const validRow=r=>r>=0&&r<config.h;
const key=(c,r)=>`${c},${r}`;
const blocked=new Set();
// Optional difficult terrain, used only by scenes that register a cost.
const terrainCosts=new Map();
function setTerrainCost(c,r,cost){
  if(!valid(c)||!validRow(r)||!Number.isFinite(cost)||cost<1)throw new Error('Invalid terrain cost');
  terrainCosts.set(key(c,r),cost);
}
function block(c,r){if(valid(c)&&validRow(r))blocked.add(key(c,r));}
function blockMany(cells){cells.forEach(([c,r])=>block(c,r));}
const pieces=[],party=[],sceneActors=[];let selected=null,activeMove=null;
// Optional player-attached torchlight: configured by an individual landmark.
// Because the lights and radius indicators are children of player miniatures,
// they follow the SAME placement and movement animations as the party tokens.
// No renderer, controls, NPC movement, or other scene behavior is duplicated.
const playerTorch={enabled:false,radiusSquares:7,color:0xffd6a0,intensity:15,height:3.5,showRadius:true};
function updatePlayerTorch(actor){
  if(actor.kind!=='player'||!actor.model)return;
  let effects=actor.model.userData.playerTorch;
  if(!playerTorch.enabled){
    if(effects){effects.light.visible=false;effects.radius.visible=false;}
    return;
  }
  const radius=playerTorch.radiusSquares*CELL;
  if(!effects){
    const light=new THREE.PointLight(playerTorch.color,playerTorch.intensity,radius,2);
    light.castShadow=false; // Four torch shadow maps would heavily slow large dungeons.
    actor.model.add(light);
    const mat=new THREE.MeshBasicMaterial({color:0xecc68a,transparent:true,opacity:.39,
      depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    const circle=new THREE.Mesh(new THREE.RingGeometry(radius-.16,radius,96),mat);
    circle.rotation.x=-Math.PI/2;
    circle.position.y=.085; // slightly above the dungeon grid, never an obstacle
    circle.renderOrder=3;
    // This is a visual ruler, not a selectable actor: never intercept floor clicks.
    circle.raycast=()=>{};
    circle.castShadow=false;circle.receiveShadow=false;
    actor.model.add(circle);
    effects={light,radius:circle,radiusSquares:playerTorch.radiusSquares};
    actor.model.userData.playerTorch=effects;
  }
  if(effects.radiusSquares!==playerTorch.radiusSquares){
    effects.radius.geometry.dispose();
    effects.radius.geometry=new THREE.RingGeometry(radius-.16,radius,96);
    effects.radiusSquares=playerTorch.radiusSquares;
  }
  effects.light.position.set(0,playerTorch.height,0);
  effects.light.color.set(playerTorch.color);
  effects.light.intensity=playerTorch.intensity;
  effects.light.distance=radius;
  effects.light.visible=true;
  effects.radius.visible=playerTorch.showRadius;
}
function setPlayerTorchEnabled(enabled,options={}){
  if(!landmarkScene)throw new Error('Party lights require a named landmark scene');
  if(options.radiusSquares!==undefined){
    if(!Number.isInteger(options.radiusSquares)||options.radiusSquares<1||options.radiusSquares>50)
      throw new Error('radiusSquares must be an integer from 1 to 50');
    playerTorch.radiusSquares=options.radiusSquares;
  }
  if(options.color!==undefined)playerTorch.color=options.color;
  if(options.intensity!==undefined){
    if(!Number.isFinite(options.intensity)||options.intensity<0)throw new Error('Invalid party light intensity');
    playerTorch.intensity=options.intensity;
  }
  if(options.height!==undefined)playerTorch.height=options.height;
  if(options.showRadius!==undefined)playerTorch.showRadius=Boolean(options.showRadius);
  playerTorch.enabled=Boolean(enabled);
  for(const actor of party)updatePlayerTorch(actor);
  return playerTorch.enabled;
}
// Landmark NPCs participate in the same occupancy, selection and movement rules.
let sceneActorCounter=0,landmarkNpcRemoveMode=false;
let labelZoomState=null,labelSelection=null;
const NPC_TOOLS=landmarkScene?.npcTools || null;
// Generic GM-only per-landmark identity reveals; initial public names remain
// hidden until a button is explicitly pressed. Does not affect murder actors.
const revealedNpcIds=new Set();
const actorsByMesh=[];
// Shared, scene-defined environment actions and clickable world props.
const sceneInteractions=[],sceneClickable=[];
let tileMaterial,selectionTiles=[],gridObject;
function runSceneInteraction(interaction){
  interaction.run();
  refreshSceneInteractionButtons();
}
function refreshSceneInteractionButtons(){
  const host=document.getElementById('landmark-environment-actions');
  if(!host)return;
  for(const interaction of sceneInteractions){
    const btn=host.querySelector(`[data-scene-action="${interaction.id}"]`);
    if(!btn)continue;
    btn.textContent=typeof interaction.label==='function'?interaction.label():interaction.label;
    btn.classList.toggle('hidden',Boolean(interaction.visible&&!interaction.visible()));
    btn.disabled=Boolean(interaction.enabled&&!interaction.enabled());
  }
}
function visitLandmark(id){
  const target=findLandmarkScene(id);
  if(!target)throw new Error(`Unknown destination: ${id}`);
  sessionStorage.setItem(`bg-landmark-access:${id}`,LANDMARK_ID||'');
  window.location.assign(`./index.html?place=${encodeURIComponent(id)}`);
}


// Physical top-down tactical floor: precisely one visual tile per movement cell.
function makeFloor(){
  const plankMats=[M.floor,M.floorAlt,mat(0x775539),mat(0x85634a)];
  const earthMats=[mat(0x3e5245),mat(0x455747),mat(0x475447),mat(0x4d5b4a),mat(0x3b4a40)];
  const grass=config.floor==='grass';
  const mask=typeof config.floorMask==='function'?config.floorMask:null;
  // The cave floor supports an irregular walkable silhouette. Missing tiles are
  // real voids in both the rendering and tactical collision grid. Instanced
  // stone tiles keep a sprawling dungeon fast without changing older scenes.
  // Large outdoor garrisons opt into instanced floor tiles without changing
  // any murder-scene or legacy landmark draw paths.
  const instanced=Boolean(mask||config.instancedFloor);
  const instances=new Map();
  for(let r=0;r<config.h;r++)for(let c=0;c<config.w;c++){
    if(mask&&!mask(c,r)){block(c,r);continue;}
    const p=center(c,r),stone=SCENE_ID===3 || config.floor==='stone';
    const tileMaterial=grass?earthMats[(c*17+r*11+(c*r)%5)%earthMats.length]:
      stone?((c+r)%3===0?M.stoneAlt:M.stone):plankMats[(c*5+r*7)%plankMats.length];
    if(instanced){
      const cells=instances.get(tileMaterial)||[];cells.push(p);instances.set(tileMaterial,cells);
    }else{
      const base=box(floorGroup,CELL-.045,.34,CELL-.045,p.x,-.22,p.z,tileMaterial);
      base.castShadow=false;
      if(!stone&&!grass)for(let i=-1;i<=1;i++){
        const stripe=box(floorGroup,CELL-.2,.028,.035,p.x,-.034,p.z+i*1.12,M.woodDark);
        stripe.castShadow=false;
      }
    }
  }
  if(instanced){
    const tmp=new THREE.Object3D(),geometry=new THREE.BoxGeometry(CELL-.045,.34,CELL-.045);
    for(const [material,points] of instances){
      const tiles=new THREE.InstancedMesh(geometry,material,points.length);
      points.forEach((p,i)=>{tmp.position.set(p.x,-.22,p.z);tmp.updateMatrix();tiles.setMatrixAt(i,tmp.matrix)});
      tiles.instanceMatrix.needsUpdate=true;tiles.receiveShadow=true;floorGroup.add(tiles);
    }
    const underlay=box(floorGroup,WIDTH+28,.3,HEIGHT+28,0,mask?-2.25:-.57,0,
      mat(mask?0x13121c:(grass?0x27392f:0x383c40)));
    underlay.castShadow=false;
  }else{
    const base=box(floorGroup,WIDTH+4,.55,HEIGHT+4,0,-.57,0,grass?mat(0x27392f):M.woodDark);base.castShadow=false;
  }
  const gridLines=[];
  if(mask){
    for(let r=0;r<config.h;r++)for(let c=0;c<config.w;c++){
      if(!mask(c,r))continue;
      const x=(c-config.w/2)*CELL,z=(r-config.h/2)*CELL;
      gridLines.push(x,.08,z,x+CELL,.08,z,x,.08,z,x,.08,z+CELL);
    }
  }else{
    for(let c=0;c<=config.w;c++){
      const x=(c-config.w/2)*CELL;
      gridLines.push(x,.08,-HEIGHT/2,x,.08,HEIGHT/2);
    }
    for(let r=0;r<=config.h;r++){
      const z=(r-config.h/2)*CELL;
      gridLines.push(-WIDTH/2,.08,z,WIDTH/2,.08,z);
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(gridLines,3));
  gridObject=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:config.floor==='grass'?0x9cae9d:0xe9d6a3,transparent:true,opacity:config.floor==='grass'?.20:.35,depthWrite:false}));
  root.add(gridObject);
  const surface=mesh(root,new THREE.PlaneGeometry(WIDTH,HEIGHT),new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false,side:THREE.DoubleSide}),0,.12,0);
  surface.rotation.x=-Math.PI/2;surface.name='pick-floor';surface.castShadow=false;surface.receiveShadow=false;
  return surface;
}
const floorHit=makeFloor();
function wall(w,d,x,z,height=5.4,material=M.wall){const m=box(wallGroup,w,height,d,x,height/2,z,material);return m;}
function wallEdge(){
  // Three-sided dollhouse walls, with a doorway at the southern edge.
  const t=.65;
  wall(WIDTH+t,t,0,-HEIGHT/2,4.7);
  wall(t,HEIGHT,-WIDTH/2,0,4.6);
  wall(t,HEIGHT,WIDTH/2,0,4.6);
  const doorW=CELL*1.7;
  wall((WIDTH-doorW)/2,t,-(WIDTH+doorW)/4,HEIGHT/2,4.8);
  wall((WIDTH-doorW)/2,t,(WIDTH+doorW)/4,HEIGHT/2,4.8);
  const lintel=box(wallGroup,doorW,1.3,t,0,5.4,HEIGHT/2,M.woodDark);
  for(const x of [-WIDTH/2,WIDTH/2])for(let z=-HEIGHT/2+4;z<=HEIGHT/2-4;z+=8){
    box(wallGroup,.55,5.3,.55,x,2.65,z,M.woodDark);
  }
  for(let x=-WIDTH/2+4;x<WIDTH/2;x+=8){box(wallGroup,.7,5.3,.6,x,2.65,-HEIGHT/2,M.woodDark);}
  for(const x of [-WIDTH/2+.3,WIDTH/2-.3])for(const z of [-HEIGHT/2+8,HEIGHT/2-8]){
    const lamp=cylinder(wallGroup,.33,.36,.4,x,3,z,M.bronze);
    sphere(wallGroup,.35,x,3.6,z,mat(0xffc07d,{emissive:0xf7a145,emissiveIntensity:2}));
    const glow=new THREE.PointLight(0xffb76c,1.2,16);glow.position.set(x,3.5,z);scene.add(glow);
  }
}
if (!config.outdoor) wallEdge();

// Movement across scene 5 partitions is possible ONLY through marked door gaps.
// The wall occupies grid-boundaries, not the middle of walkable squares.
// Global wall-edge data is shared by murder safehouses and all landmark rooms.
// Walls live between grid cells, and doorway cells are explicitly excluded.
const wallEdges = new Set();
function edgeKey(a,b) {
  const ka=key(a.c,a.r),kb=key(b.c,b.r);
  return ka<kb?`${ka}|${kb}`:`${kb}|${ka}`;
}
function canCrossWall(a,b) { return !wallEdges.has(edgeKey(a,b)); }
function partitionVertical(boundary, doorRows=[], height=3.5, span=null) {
  if(!Number.isInteger(boundary)||boundary<=0||boundary>=config.w) throw new Error('Invalid vertical wall boundary');
  const start=span?.start ?? 0, stop=span?.stop ?? config.h;
  const x=(boundary-config.w/2)*CELL;
  for(let r=start;r<stop;r++) {
    if(doorRows.includes(r)) {
      const z=center(0,r).z;
      box(wallGroup,.52,.6,CELL,x,height+.65,z,M.woodDark);
      continue;
    }
    wall(.4,CELL,x,center(0,r).z,height,M.woodDark);
    wallEdges.add(edgeKey({c:boundary-1,r},{c:boundary,r}));
  }
}
function partitionHorizontal(boundary, doorColumns=[], height=3.5, span=null) {
  if(!Number.isInteger(boundary)||boundary<=0||boundary>=config.h) throw new Error('Invalid horizontal wall boundary');
  const start=span?.start ?? 0, stop=span?.stop ?? config.w;
  const z=(boundary-config.h/2)*CELL;
  for(let c=start;c<stop;c++) {
    if(doorColumns.includes(c)) {
      const x=center(c,0).x;
      box(wallGroup,CELL,.6,.52,x,height+.65,z,M.woodDark);
      continue;
    }
    wall(CELL,.4,center(c,0).x,z,height,M.woodDark);
    wallEdges.add(edgeKey({c,r:boundary-1},{c,r:boundary}));
  }
}
// Reusable passage doors occupy *edges*, not walkable cell centers.
// They remove collision only when opened, including diagonal corner checks.
function makePassageDoor(axis,boundary,index,{height=4.3,secret=false}={}){
  const horizontal=axis==='horizontal';
  const a=horizontal?{c:index,r:boundary-1}:{c:boundary-1,r:index};
  const b=horizontal?{c:index,r:boundary}:{c:boundary,r:index};
  if(!valid(a.c)||!validRow(a.r)||!valid(b.c)||!validRow(b.r))throw new Error('Invalid passage door');
  const x=horizontal?center(index,0).x:(boundary-config.w/2)*CELL;
  const z=horizontal?(boundary-config.h/2)*CELL:center(0,index).z;
  const leaf=box(wallGroup,horizontal?CELL-.18:.4,height,horizontal?.4:CELL-.18,
    x,height/2,z,mat(secret?0x302c39:0x392d31,{metalness:secret?.2:.08}));
  if(!secret){
    const band=box(wallGroup,horizontal?CELL-.25:.50,.19,horizontal?.52:CELL-.25,
      x,height*.65,z,M.iron);band.userData.passDoor=leaf;
    leaf.userData.band=band;
  }
  const edge=edgeKey(a,b);wallEdges.add(edge);
  let opened=false;
  return Object.freeze({mesh:leaf,get open(){return opened;},
    setOpen(value){opened=Boolean(value);
      leaf.visible=!opened;if(leaf.userData.band)leaf.userData.band.visible=!opened;
      if(opened)wallEdges.delete(edge);else wallEdges.add(edge);
      if(selected)updateHighlights();refreshSceneInteractionButtons();
    },toggle(){this.setOpen(!opened);}});
}
if(IS_CULT_SCENE) {
  partitionVertical(7,[2,8]);
  partitionHorizontal(5,[3,10]);
}

// A transparent polygonal stain is intentionally stylised and non-photographic.
function stain(c,r,size=1,material=M.blood){
  const p=center(c,r),vertices=[0,0,0];
  const n=13;
  for(let i=0;i<=n;i++){const a=(i/n)*Math.PI*2,rad=size*rng(.68,1.14);vertices.push(Math.cos(a)*rad,0,Math.sin(a)*rad);}
  const inds=[];for(let i=1;i<=n;i++)inds.push(0,i+1,i);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(inds);geo.computeVertexNormals();
  const sm=mesh(props,geo,material,p.x,0.085,p.z);sm.castShadow=false;
  return sm;
}
function splash(c,r,n=10){for(let i=0;i<n;i++){const p=center(c,r);
  const x=p.x+rng(-3.6,3.6),z=p.z+rng(-3,3),rad=rng(.13,.62);
  const disc=mesh(props,new THREE.CircleGeometry(rad,10),Math.random()<.25?M.dryBlood:M.blood,x,.086,z);
  disc.rotation.x=-Math.PI/2;disc.castShadow=false;
}}
function rug(c,r,w=3,h=2,color=M.rug){const p=center(c,r);
  const m=box(props,w*CELL-.32,.11,h*CELL-.32,p.x,.095,p.z,color);m.castShadow=false;
  box(props,w*CELL-.85,.018,.14,p.x,.17,p.z-h*CELL/2+.36,M.bronze).castShadow=false;
  box(props,w*CELL-.85,.018,.14,p.x,.17,p.z+h*CELL/2-.36,M.bronze).castShadow=false;
}
function bed(c,r){const p=center(c,r),g=new THREE.Group();g.position.copy(p);props.add(g);
  box(g,7.1,1.2,5.8,0,.7,0,M.woodDark);
  box(g,6.8,.52,5.6,0,1.5,0,M.linen);
  box(g,6.8,.11,3.4,0,1.84,1.1,M.fabric);
  box(g,6.9,2.65,.48,0,2.2,-2.75,M.wood);
  for(const x of [-2.1,2.1])box(g,1.55,.4,.85,x,1.96,-1.45,M.plaster);
  blockMany([[c,r],[c+1,r]]);
}
function wardrobe(c,r,rot=0){const p=center(c,r);const g=new THREE.Group();g.position.copy(p);g.rotation.y=rot;props.add(g);
  box(g,3.15,5.4,1.9,0,2.7,0,M.wood);
  box(g,1.45,4.55,.1,-.73,2.65,1.0,M.woodDark);box(g,1.45,4.55,.1,.73,2.65,1.0,M.woodDark);
  for(const x of [-.22,.22])sphere(g,.095,x,2.8,1.12,M.bronze);
  block(c,r);
}
function chest(c,r){const p=center(c,r);
  box(props,2.9,1.4,2.1,p.x,.7,p.z,M.wood);
  box(props,3.05,.55,2.2,p.x,1.58,p.z,M.woodDark);
  box(props,.32,.7,.15,p.x,1.25,p.z+1.15,M.bronze);block(c,r);
}
function table(c,r){const p=center(c,r);
  box(props,5.8,.42,3.8,p.x,2.0,p.z,M.wood);
  for(const dx of [-2.45,2.45])for(const dz of [-1.55,1.55])box(props,.4,1.85,.4,p.x+dx,.95,p.z+dz,M.woodDark);
  block(c,r);
}
function chair(c,r,rotation=0,locked=true){const p=center(c,r),g=new THREE.Group();g.position.copy(p);g.rotation.y=rotation;props.add(g);
  box(g,2.1,.34,2.1,0,1.3,0,M.wood);
  for(const x of [-.84,.84])for(const z of [-.84,.84])box(g,.25,1.3,.25,x,.66,z,M.woodDark);
  box(g,2.1,2.45,.32,0,2.55,-.91,M.woodDark);
  if(locked)block(c,r);
  return g;
}
function brokenDebris(c,r,count=5){const p=center(c,r);
  for(let i=0;i<count;i++){
    const b=box(props,rng(.55,2.9),rng(.14,.44),rng(.5,2.1),p.x+rng(-1.6,1.6),rng(.2,.65),p.z+rng(-1.6,1.6),randPick([M.wood,M.woodDark,M.fabric]));
    b.rotation.set(rng(-.55,.55),rng(-3,3),rng(-.6,.6));
  }block(c,r);
}
function bone(c,r,count=16){const p=center(c,r);
  for(let i=0;i<count;i++){
    const x=p.x+rng(-1.5,1.5),z=p.z+rng(-1.5,1.5);
    const b=cylinder(props,.095,.12,rng(.5,1.5),x,.19,z,M.bone,7);
    b.rotation.set(Math.PI/2,rng(-2,2),rng(-.7,.7));
    if(i%5===0)sphere(props,.19,x,.15,z,M.bone);
  }
}
function skull(c,r,scale=1,material=M.bone){const p=center(c,r),g=new THREE.Group();g.position.set(p.x,.06,p.z);props.add(g);
  const h=sphere(g,.8*scale,0,.92*scale,0,material);h.scale.set(1,.89,.89);
  box(g,1.03*scale,.41*scale,.79*scale,0,.33*scale,.31*scale,material);
  for(const s of [-1,1])sphere(g,.18*scale,s*.28*scale,.9*scale,.65*scale,M.ink);
  const nose=mesh(g,new THREE.ConeGeometry(.18*scale,.32*scale,3),M.ink,0,.56*scale,.7*scale);nose.rotation.x=Math.PI/2;
  for(const sx of [-2,-1,0,1,2])box(g,.15*scale,.17*scale,.12*scale,sx*.17*scale,.2*scale,.74*scale,M.plaster);
  return g;
}
function corpse(c,r,{child=false,entrails=false,tied=false,rot=0}={}){
  const p=center(c,r),g=new THREE.Group();g.position.set(p.x,.15,p.z);g.rotation.y=rot;
  props.add(g);const k=child?.73:1;
  // A top-down body, with limbs extended on the wooden floor.
  const torso=box(g,1.75*k,.58,2.75*k,0,.47,0,M.fabric);
  sphere(g,.78*k,0,.45,-2.05*k,M.flesh);
  for(const sign of [-1,1]){
    const arm=box(g,.58*k,.48,2.1*k,sign*1.26*k,.37,-.05*k,M.flesh2);
    arm.rotation.y=sign*(tied?.12:.3);
    box(g,.68*k,.55,2.25*k,sign*.48*k,.42,2.55*k,M.fabric);
  }
  if(entrails){
    const tear=box(g,1.65*k,.1,1.35*k,0,.82,.25*k,M.wine);tear.castShadow=false;
    for(let i=0;i<7;i++){
      const curve=new THREE.CatmullRomCurve3([
        new THREE.Vector3(rng(-.4,.4)*k,.9,rng(-.05,.3)*k),
        new THREE.Vector3(rng(-1.3,1.3)*k,.95,rng(.5,1.0)*k),
        new THREE.Vector3(rng(-1.6,1.6)*k,.87,rng(.9,1.7)*k)
      ]);
      mesh(g,new THREE.TubeGeometry(curve,12,.10*k,6,false),i%2?M.blood:M.wine);
    }
  }
  if(tied){
    for(const zz of [-.5*k,.85*k]){
      const binding=box(g,2.05*k,.13,.13,0,.89,zz,M.bronze);binding.castShadow=false;
    }
  }
  stain(c,r,child?1.5:2.35);splash(c,r,10);
  block(c,r);
  return g;
}
function seatedCorpse(c,r){
  // Victim remains upright on the interrogation chair, bound to the backrest.
  const p=center(c,r),g=new THREE.Group();g.position.copy(p);props.add(g);
  const torso=box(g,1.55,1.8,1.05,0,2.65,-.22,M.fabric);
  const head=sphere(g,.60,0,3.97,-.23,M.flesh2);
  head.scale.set(.93,1.1,.91);
  for(const side of [-1,1]){
    const arm=box(g,.38,1.7,.4,side*1.04,2.57,-.42,M.flesh);
    arm.rotation.z=side*.23;
    // Dark cords immobilise each wrist against the wooden armrest.
    box(g,.56,.20,.56,side*1.04,1.84,-.45,M.woodDark);
    box(g,.43,.12,.45,side*1.04,1.85,-.45,M.bronze);
    box(g,.54,.45,2,side*.45,1.16,1.18,M.fabric);
  }
  box(g,1.85,.18,1.24,0,2.75,.36,M.woodDark);
  box(g,1.8,.17,1.26,0,2.82,.37,M.bronze);
  stain(c,r,2.0);splash(c,r,9);block(c,r);
}
function letteredSign(type){
  // Hand-drawn miniature glyphs (canvas textures). Bhaal: skull + blood drops;
  // Bane: gauntlet/fist; Myrkul: pale death's head in a black circle.
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.translate(256,256);
  function polygon(pts,fill,stroke='#200708',line=9){ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.lineWidth=line;ctx.strokeStyle=stroke;ctx.stroke();}
  function drop(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);polygon([[0,-47],[31,-1],[25,32],[0,45],[-25,32],[-31,-1]],'#ae1d23','#34050a',7);ctx.restore();}
  if(type==='bhaal'){
    ctx.fillStyle='#220b0b';ctx.beginPath();ctx.arc(0,-13,96,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#9d151d';ctx.beginPath();ctx.ellipse(0,-25,67,76,0,0,Math.PI*2);ctx.fill();
    for(const x of [-28,28]){ctx.fillStyle='#120708';ctx.beginPath();ctx.ellipse(x,-34,19,27,x*.004,0,Math.PI*2);ctx.fill();}
    polygon([[-14,-2],[0,-22],[14,-2],[0,12]],'#16070a','#16070a',2);
    ctx.fillStyle='#f0b7a8';ctx.fillRect(-42,31,84,11);
    for(let x=-32;x<=32;x+=16)ctx.fillRect(x,42,6,23);
    drop(-90,111,.7);drop(0,125,.76);drop(90,111,.7);
  }else if(type==='bane'){
    ctx.fillStyle='#190f10';ctx.beginPath();ctx.arc(0,0,157,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#b43c32';ctx.lineWidth=13;ctx.stroke();
    polygon([[-91,38],[-79,-75],[-50,-98],[-23,-83],[-7,-116],[22,-116],[42,-93],[68,-103],[91,-84],[87,35],[44,91],[-44,91]],'#99262b','#280609',12);
    for(const x of [-60,-16,28,65]){ctx.beginPath();ctx.moveTo(x,-83);ctx.lineTo(x-4,-10);ctx.lineWidth=8;ctx.strokeStyle='#321014';ctx.stroke();}
    polygon([[-103,20],[-58,-2],[-35,25],[24,35],[31,64],[-35,94],[-89,70]],'#a83939','#26080c',9);
  }else{
    ctx.fillStyle='#211d22';ctx.beginPath();ctx.arc(0,0,154,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#bdc3c8';ctx.lineWidth=12;ctx.stroke();
    ctx.fillStyle='#dee4df';ctx.beginPath();ctx.ellipse(0,-25,95,103,0,0,Math.PI*2);ctx.fill();
    for(const x of [-44,44]){ctx.fillStyle='#342f36';ctx.beginPath();ctx.ellipse(x,-23,27,35,0,0,Math.PI*2);ctx.fill();}
    polygon([[-17,29],[0,0],[17,29],[0,42]],'#28242a','#28242a',3);
    ctx.fillStyle='#dfe6db';ctx.fillRect(-63,57,126,43);
    for(let x=-46;x<=46;x+=23){ctx.fillStyle='#5c5661';ctx.fillRect(x,65,9,30);}
    drop(0,143,.47);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide});
}
function wallSigil(type,side='north',shift=0){const material=letteredSign(type),size=4.45;
  const p=new THREE.Mesh(new THREE.PlaneGeometry(size,size),material);
  p.castShadow=false;p.renderOrder=10;
  if(side==='north'){p.position.set(shift,2.55,-HEIGHT/2+.38);p.rotation.y=0;}
  if(side==='west'){p.position.set(-WIDTH/2+.38,2.55,shift);p.rotation.y=Math.PI/2;}
  wallGroup.add(p);
}
function floorSigil(type,c,r,size=12){const p=center(c,r);
  const symbol=mesh(props,new THREE.PlaneGeometry(size,size),letteredSign(type),p.x,.12,p.z);
  symbol.rotation.x=-Math.PI/2;symbol.castShadow=false;symbol.renderOrder=12;
}
function candles(c,r){const p=center(c,r);
  for(let i=0;i<3;i++){const x=p.x+(i-1)*.4;
    cylinder(props,.18,.22,rng(.55,.9),x,.4,p.z,M.linen);
    sphere(props,.12,x,1.02,p.z,mat(0xffcc73,{emissive:0xf5a536,emissiveIntensity:2}));
  }
}
function bookshelf(c,r){const p=center(c,r);
  box(props,3,5.5,1.1,p.x,2.75,p.z,M.woodDark);
  for(let level=0;level<4;level++){box(props,2.9,.19,1.2,p.x,.65+level*1.25,p.z,M.wood);
    for(let i=0;i<6;i++)box(props,.24+rng(0,.12),.8+rng(0,.33),.67,p.x-1.1+i*.43,1.16+level*1.25,p.z,randPick([M.wine,M.blue,M.green,M.fabric,M.bronze]));
  }
  block(c,r);
}
function cupboard(c,r){const p=center(c,r);
  box(props,2.7,3.1,2,p.x,1.55,p.z,M.wood);
  box(props,2.5,.23,2.2,p.x,3.17,p.z,M.woodDark);block(c,r);
}
function barrel(c,r){const p=center(c,r);
  cylinder(props,1,1.15,2.6,p.x,1.3,p.z,M.wood,12);
  for(const h of [.45,2.16])cylinder(props,1.18,1.18,.15,p.x,h,p.z,M.iron,12);
  block(c,r);
}
function poisonStain(c,r){stain(c,r,1.5,M.dryBlood);}

function buildOne(){
  wardrobe(0,0);wardrobe(2,0);wardrobe(4,0);wardrobe(6,0);
  bed(1,2);table(9,3);chair(8,5,.3);chair(10,5,-.3);chair(10,2,Math.PI);
  rug(5,5,3,2);chest(10,0);candles(8,0);
  corpse(5,4,{entrails:true,rot:.5});
  stain(4,5,3.7);stain(6,4,2.5);stain(3,6,1.9);stain(7,6,3.2);stain(6,2,2.4);
  for(const [c,r] of [[3,4],[5,2],[4,7],[7,3],[9,6],[2,6],[8,1],[6,7],[10,7],[0,7]])splash(c,r,12);
  wallSigil('bhaal','north',2);
}
function buildTwo(){
  // A single occupied chair stands in a ruined, otherwise vacant interior.
  for(const [c,r] of [[1,1],[10,0],[1,7],[10,7],[2,4],[9,5],[3,0],[7,7]])brokenDebris(c,r,5);
  chair(6,4,Math.PI, true);
  seatedCorpse(6,4);
  floorSigil('bane',6,2,13);
  stain(6,4,2.0);splash(5,5,7);
}
function buildThree(){
  // No furniture — bones and one crimson skull amid pale skulls.
  for(const [c,r] of [[1,1],[3,2],[7,1],[10,2],[2,5],[8,6],[10,7],[5,7],[0,7],[6,3]])bone(c,r,15);
  for(const [c,r] of [[0,2],[10,1],[3,6],[9,8],[2,3],[8,3]])skull(c,r,.65,M.bone);
  skull(6,4,1.85,M.skullRed);block(6,4);
  floorSigil('myrkul',6,4,14);
  // Red moonlight catches the distinct skull.
  const light=new THREE.PointLight(0xc32028,9,20);light.position.copy(center(6,4));light.position.y=4;scene.add(light);
}
function buildFour(){
  bed(1,1);wardrobe(0,0);bed(8,1);wardrobe(11,0);
  table(5,5);chair(7,6,.7);chair(4,3,-.6);
  chest(10,7);rug(4,6,4,2);
  for(const [c,r] of [[2,5],[8,7],[2,7],[6,2],[9,4]])brokenDebris(c,r,6);
  corpse(2,4,{rot:.35});corpse(6,3,{rot:-.65});corpse(8,6,{child:true,rot:.8});corpse(10,3,{child:true,rot:.1});
  for(const [c,r] of [[1,6],[4,2],[8,3],[9,6],[6,7],[0,5],[10,5]]){stain(c,r,2.3);splash(c,r,8);}
  wallSigil('bhaal','west',-1.5);
}
function buildFive(){
  // Four true rooms, with navigable open doorways in the dividers.
  // NW: bedroom. NE: kitchen. SW: sitting room. SE: cult meeting room.
  bed(1,1);wardrobe(0,3);chest(5,0);rug(2,3,2,1,M.rugAlt);
  table(10,1);chair(12,2,-.6);cupboard(8,0);barrel(13,3);candles(10,0);
  rug(2,7,3,2,M.rugAlt);table(3,7);chair(2,9);chair(5,9,.4);bookshelf(0,7);
  rug(10,8,3,2);table(10,7);chair(9,9,-.2);chair(12,9,.2);
  bookshelf(13,6);candles(11,6);floorSigil('bhaal',11,8,7);
}
const SCENE_API = Object.freeze({
  dimensions:{columns:config.w,rows:config.h,cellSize:CELL},
  materials:M,
  // For bespoke scenery, use geometry helpers rather than constructing a second renderer.
  geometry:Object.freeze({
    center:(c,r)=>center(c,r).clone(),
    material:(color,extra={})=>mat(color,extra),
    boxAt(c,r,w,h,d,{y=h/2,color=0x72513b,blocking=false}={}){
      const p=center(c,r), item=box(props,w,h,d,p.x,y,p.z,sceneMat(color));
      if(blocking)block(c,r);
      return item;
    },
    sphereAt(c,r,radius,{y=radius,color=0xcbbd9d,blocking=false}={}){
      const p=center(c,r),item=sphere(props,radius,p.x,y,p.z,sceneMat(color));
      if(blocking)block(c,r);
      return item;
    },
    cylinderAt(c,r,rt,rb,height,{y=height/2,color=0x66503d,blocking=false}={}){
      const p=center(c,r),item=cylinder(props,rt,rb,height,p.x,y,p.z,sceneMat(color));
      if(blocking)block(c,r);
      return item;
    },
    pointLight(c,r,{color=0x8a64c9,intensity=2,range=28,height=5}={}){
      const p=center(c,r),light=new THREE.PointLight(color,intensity,range);
      light.position.set(p.x,height,p.z);scene.add(light);return light;
    },
    // Reusable world-space label for named graves, altars and landmarks.
    // Uses the SAME CSS2D renderer as miniature nameplates.
    labelAt(c,r,text,{y=5,className='landmark-prop-label'}={}){
      const holder=new THREE.Group();holder.position.copy(center(c,r));props.add(holder);
      const el=document.createElement('div');el.className=className;
      el.textContent=String(text); // no HTML injection
      const label=new CSS2DObject(el);label.position.set(0,y,0);holder.add(label);
      return label;
    },
    // Reusable escape hatch for scene-specific grouped props and puzzle widgets.
    // Keeps all custom scenery inside the shared renderer, lighting and picking.
    attach(object,{c=null,r=null,x=0,y=0,z=0}={}){
      if(!object?.isObject3D)throw new Error('attach() requires a THREE.Object3D');
      if(c!==null&&r!==null){
        const p=center(c,r);object.position.set(p.x+x,y,p.z+z);
      }else object.position.set(x,y,z);
      props.add(object);return object;
    },
  }),
  furniture:Object.freeze({bed,wardrobe,chest,table,chair,bookshelf,cupboard,barrel}),
  decoration:Object.freeze({rug,candles,bone,skull,stain,splash,corpse,wallSigil,floorSigil,brokenDebris}),
  architecture:Object.freeze({
    partitionVertical,partitionHorizontal,
    doorHorizontal:(boundary,column,options)=>makePassageDoor('horizontal',boundary,column,options),
    doorVertical:(boundary,row,options)=>makePassageDoor('vertical',boundary,row,options),
    block,setTerrainCost,
    addLight(tone,c,r,intensity=2){
      const point=center(c,r);
      const light=new THREE.PointLight(tone==='red'?0xba3338:tone==='blue'?0x89bce8:0xffd19a,intensity,28);
      light.position.set(point.x,5,point.z);scene.add(light);
      return light;
    },
  }),
  interactions:Object.freeze({
    panelAction({id,label,run,visible=null,enabled=null,group='LOCATION CONTROLS · GM'}){
      if(!landmarkScene||!id||typeof run!=='function')throw new Error('Invalid landmark action');
      if(sceneInteractions.some(item=>item.id===id))throw new Error('Duplicate landmark action '+id);
      const item={id,label,run,visible,enabled,group};sceneInteractions.push(item);return item;
    },
    clickable(mesh,label,run){
      if(!mesh||typeof run!=='function')throw new Error('Invalid world interaction');
      mesh.userData.sceneClick={label,run};sceneClickable.push(mesh);return mesh;
    },
    travel:visitLandmark,
    // Spawn a scene-defined NPC using the existing selectable miniature roster.
    spawnNpc(id,count=1,spawnArea=null){
      const def=NPC_TOOLS?.spawnables?.find(x=>x.id===id);
      if(!def)throw new Error(`Unknown landmark NPC type: ${id}`);
      return spawnSceneActors(spawnArea?{...def,start:null,spots:null,spawnArea}:def,count);
    },
    refresh:refreshSceneInteractionButtons,
    // Reusable opt-in party torchlights; never enabled for unrelated scenes.
    partyLights:Object.freeze({
      setEnabled:setPlayerTorchEnabled,
      isEnabled:()=>playerTorch.enabled,
    }),
    // Brighten an entire landmark and restore its own original dim atmosphere.
    // Independently controllable from adventurer torchlights.
    sceneLighting:Object.freeze({
      setEnabled:setSceneLightingEnabled,
      isEnabled:()=>sceneLighting.enabled,
    }),
    partyState:()=>party.map(actor=>({id:actor.id,name:actor.name,position:actor.position?{...actor.position}:null})),
  }),
});
if(landmarkScene) landmarkScene.build(SCENE_API);
else [buildOne,buildTwo,buildThree,buildFour,buildFive][SCENE_ID-1]();

// Large exterior buildings are static architectural meshes. Merge compatible
// same-material pieces once for this landmark only, keeping labels and world
// interaction objects separate. No changes to the five murder scenes or any
// other landmark, whose doors, dynamic props and rendering remain unchanged.
function optimizeLandmarkStatics(group){
  const collections=new Map();
  for(const child of [...group.children]){
    if(!child.isMesh||child.isInstancedMesh||child.userData.sceneClick||
        child.children.length||Array.isArray(child.material))continue;
    child.updateMatrix();
    const signature=(child.geometry.index?'indexed':'nonindexed')+':'+
      Object.keys(child.geometry.attributes).sort().join('|');
    const byMaterial=collections.get(child.material)||new Map();
    const meshes=byMaterial.get(signature)||[];
    meshes.push(child);byMaterial.set(signature,meshes);
    collections.set(child.material,byMaterial);
  }
  for(const [material,groups] of collections)for(const meshes of groups.values()){
    if(meshes.length<2)continue;
    const transformed=meshes.map(item=>item.geometry.clone().applyMatrix4(item.matrix));
    const geometry=mergeGeometries(transformed,false);
    transformed.forEach(geo=>geo.dispose());
    if(!geometry)continue; // uncommon incompatible formats stay unmerged
    const combined=new THREE.Mesh(geometry,material);
    combined.castShadow=true;combined.receiveShadow=true;
    for(const item of meshes){group.remove(item);item.geometry.dispose();}
    group.add(combined);
  }
}
if(landmarkScene?.optimizeStaticGeometry){
  optimizeLandmarkStatics(props);
  optimizeLandmarkStatics(wallGroup);
}

const PARTY_DATA=[
  {id:'leoric',name:'Leoric',role:'Elven Cleric',symbol:'✚',color:0xd7be94},
  {id:'cohen',name:'Cohen',role:'Human Paladin',symbol:'⚔',color:0xd4ab67},
  {id:'zaazu',name:'Zaazu',role:'Goblin Wizard',symbol:'✧',color:0x94b78a},
  {id:'iimar',name:'IImar',role:'Dhampir Ranger',symbol:'➶',color:0x96a8c1}
];
const playerStart=landmarkScene?.starts || (IS_CULT_SCENE?[[1,10],[2,10],[3,10],[4,10]]:[[3,8],[4,8],[5,8],[6,8]]);
PARTY_DATA.forEach((data,i)=>party.push({...data,kind:'player',position:null,model:null,ui:null,start:playerStart[i]}));
const cultists=[];let cultCounter=0;
let cultistRemoveMode=false;
function makeMiniature(actor){
  const group=new THREE.Group();const color=mat(actor.color);
  const g=group;
  cylinder(g,1.15,1.32,.44,0,.27,0,M.iron,20);
  cylinder(g,.91,1.03,.20,0,.58,0,color,18);
  const isCult=actor.kind==='enemy';
  const isNpc=actor.kind==='scene-npc';
  const isFist=isNpc&&actor.faction==='flaming-fist';
  const bespokeSummon=isNpc&&['shadow-wolf','golden-golem','sheep','potted-plant'].includes(actor.archetype);
  const cloth=isCult?M.cult:(isFist?M.iron:(actor.archetype==='bather'?M.flesh:actor.archetype==='masseuse'?M.linen:color));
  if(!bespokeSummon){
    cylinder(g,.48,.88,1.85,0,1.65,0,cloth,10);
    sphere(g,.50,0,2.92,0,isCult?M.flesh2:M.flesh);
    for(const side of [-1,1]){
      const arm=box(g,.32,1.3,.35,side*.73,1.72,0,cloth);
      arm.rotation.z=-side*.14;
    }
  }
  if(isFist){
    // Reusable miniature archetype: scarlet tabards, armoured shoulders,
    // iron sallet and heraldic shield. Captain receives a gold command crest.
    box(g,.92,1.15,.18,0,1.65,.76,mat(0x8e252b));
    box(g,.7,.14,.19,0,2.05,.87,M.bronze);
    const helm=cylinder(g,.55,.43,.32,0,3.25,0,M.iron,10);
    box(g,1.20,.12,.70,0,3.11,.02,M.iron);
    for(const side of [-1,1])sphere(g,.35,side*.65,2.35,0,M.iron);
    const shield=box(g,.18,1.65,1.15,-1.01,1.72,.28,mat(0x9a3033));
    shield.rotation.z=-.16;
    box(g,.24,.70,.12,-1.14,1.74,.86,M.bronze);
    const spear=cylinder(g,.07,.08,3.0,1.06,1.55,.12,M.woodDark,7);
    mesh(g,new THREE.ConeGeometry(.21,.58,7),M.metal,1.06,3.31,.12);
    if(actor.archetype==='sergeant'){
      // Distinct scarlet officer's epaulets and two brass rank bars.
      for(const dx of [-.71,.71]){
        box(g,.53,.20,.58,dx,2.55,.05,M.bronze);
      }
      for(const y of [1.35,1.63])box(g,.72,.13,.20,0,y,.88,M.bronze);
    }
    if(actor.archetype==='captain'){
      box(g,1.45,.14,.65,0,3.53,0,M.bronze);
      box(g,.23,.72,.32,0,3.92,0,mat(0xc84a3a));
      box(g,.98,2.1,.13,0,1.9,-.65,mat(0x7d1524));
      sphere(g,.23,0,2.07,.89,M.bronze);
    }
  }else if(isNpc){
    if(!['bather','masseuse','shadow-wolf','golden-golem','sheep','potted-plant'].includes(actor.archetype)){
      const cape=box(g,1.05,1.75,.13,0,1.73,-.61,color);
      cape.rotation.x=-.13;
    }
    if(actor.archetype==='refugee'){
      mesh(g,new THREE.ConeGeometry(.65,.83,9),color,0,3.34,0);
      box(g,.73,.96,.53,-.76,1.41,-.38,M.wood);
    }else if(actor.archetype==='volo'){
      mesh(g,new THREE.ConeGeometry(.9,1.45,10),mat(0x66599b),0,3.70,0);
      box(g,.82,.14,.59,0,3.25,0,M.bronze);
      box(g,.82,.18,.56,.73,1.50,.3,M.linen);
    }else if(actor.archetype==='zelvor'){
      const shield=box(g,.24,1.45,1.02,-1,1.75,.10,M.woodDark);
      shield.rotation.z=-.15;
      box(g,.30,.62,.15,-1.15,1.73,.67,M.bronze);
    }else if(actor.archetype==='reyna'){
      box(g,.94,.2,.18,0,2.3,.68,M.bronze);
      const staff=cylinder(g,.07,.09,2.75,.93,1.50,.05,M.woodDark,8);
      sphere(g,.22,.93,3.07,.05,M.bronze);
    }else if(['mirie','grief-guard','inquisitor','shadowheart','nocturne','mother-superior',
              'sharran','dark-justiciar','gloom-maker'].includes(actor.archetype)){
      const goldTrim=mat(0x9b88b0,{metalness:.38});
      const shadowCloth=mat(actor.archetype==='dark-justiciar'?0x20212c:0x352a46);
      // Distinct dark-shrine silhouettes; all remain movable shared-engine minis.
      const isArmour=['grief-guard','inquisitor','dark-justiciar','gloom-maker'].includes(actor.archetype);
      const hood=mesh(g,new THREE.ConeGeometry(.76,.85,9),isArmour?M.iron:shadowCloth,0,3.38,0);
      const crest=box(g,.65,.12,.16,0,2.38,.70,goldTrim);
      box(g,1.12,1.75,.17,0,1.66,-.62,shadowCloth);
      if(isArmour){
        box(g,1.12,.33,.84,0,2.35,.03,M.iron);
        for(const side of [-1,1])sphere(g,.37,side*.7,2.32,0,M.iron);
        const blade=box(g,.14,2.3,.17,.94,1.63,.23,M.metal);blade.rotation.z=-.25;
        box(g,.63,.15,.20,.94,1.06,.23,goldTrim);
      }else if(actor.archetype==='mirie'){
        box(g,1.02,.18,.22,0,2.38,.76,M.bronze);
        box(g,.76,.15,.56,.7,1.47,.3,M.linen);
      }else if(actor.archetype==='shadowheart'){
        const circlet=box(g,1.0,.11,.48,0,3.25,.06,M.bronze);
        cylinder(g,.075,.085,2.8,.91,1.59,.10,M.woodDark);
        sphere(g,.26,.91,3.1,.1,goldTrim);
      }else if(actor.archetype==='nocturne'){
        sphere(g,.38,0,3.39,0,mat(0x9181bb,{emissive:0x39265c,emissiveIntensity:.6}));
      }else if(actor.archetype==='mother-superior'){
        box(g,1.35,.16,.70,0,3.53,0,goldTrim);
        cylinder(g,.11,.11,3.4,.95,1.92,0,M.woodDark);
        sphere(g,.34,.95,3.6,0,mat(0xae84de,{emissive:0x67429e,emissiveIntensity:1}));
      }else if(actor.archetype==='gloom-maker'){
        box(g,1.6,.19,.86,0,3.5,0,M.iron);
        sphere(g,.42,0,4,0,mat(0x7d5cbc,{emissive:0x55368c,emissiveIntensity:1.2}));
      }
    }else if(['bather','masseuse','night-blade','necromite','cultist',
               'fist-bane','iron-consul','master-souls','reaper-bhaal',
               'skeleton','zombie','skeletal-rats','gauntlet','ghost-axe',
               'mortlock','prisoner'].includes(actor.archetype)){
      // Dead Three and bathhouse archetypes: ordinary selectable V9 miniatures.
      const a=actor.archetype;
      if(a==='bather'){
        box(g,1.24,.56,.86,0,1.1,.4,M.linen);
        sphere(g,.54,0,3.13,0,M.flesh);
      }else if(a==='masseuse'){
        box(g,1.1,1.4,.18,0,1.75,.65,M.linen);
      }else if(a==='skeleton'){
        for(let k=0;k<4;k++)box(g,.95,.11,.13,0,1.35+k*.32,.54,M.bone);
        sphere(g,.49,0,3.06,0,M.bone);
        for(const dx of [-.2,.2])sphere(g,.10,dx,3.1,.42,M.ink);
      }else if(a==='zombie'){
        sphere(g,.53,0,3.04,0,mat(0x71927a));
        box(g,.9,1.15,.16,0,1.6,.67,M.fabric);
      }else if(a==='skeletal-rats'){
        for(let j=0;j<6;j++){
          const angle=j*Math.PI/3;
          sphere(g,.19,Math.cos(angle)*.7,.83,Math.sin(angle)*.7,M.bone);
        }
      }else if(a==='gauntlet'||a==='ghost-axe'){
        const spectral=mat(a==='gauntlet'?0x929bad:0x8bb9cc,
          {emissive:a==='gauntlet'?0x41405a:0x305c83,emissiveIntensity:1.5});
        box(g,.60,1.02,.70,0,2.42,0,spectral);
        box(g,1.55,.25,.29,0,3.05,0,spectral);
      }else if(a==='prisoner'){
        box(g,.98,.72,.17,0,1.37,.64,M.linen);
        for(const dx of [-.8,.8])box(g,.22,.12,.35,dx,1.12,.17,M.iron);
      }else if(a==='mortlock'){
        box(g,1.16,1.2,.21,0,1.67,.72,M.leather);
        box(g,.29,2.65,.25,.95,1.57,.06,M.woodDark);
      }else{
        const bane=['fist-bane','iron-consul'].includes(a);
        const bhaal=['night-blade','reaper-bhaal'].includes(a);
        const robe=mat(bane?0x55515d:bhaal?0x57212d:0x353445);
        mesh(g,new THREE.ConeGeometry(.70,.89,9),robe,0,3.35,0);
        box(g,1.2,1.8,.18,0,1.68,-.6,robe);
        const blade=box(g,.20,2.0,.21,.98,1.7,.10,M.metal);
        blade.rotation.z=bhaal?.25:-.12;
        if(bane)box(g,.22,1.65,1.05,-1.0,1.78,.22,M.iron);
        if(a==='master-souls'||a==='necromite'){
          cylinder(g,.08,.09,2.7,.95,1.51,0,M.woodDark);
          sphere(g,.26,.95,2.93,0,mat(0x88be99,{emissive:0x2f774f,emissiveIntensity:1.4}));
        }
      }
    }else if(['selunite-priest','selunite-high-priest','worshipper','wolf'].includes(actor.archetype)){
      if(actor.archetype==='wolf'){
        const fur=mat(0x7d828d),pale=mat(0xbfc7d9),eye=mat(0x9fdcff,{emissive:0x5e7fd6,emissiveIntensity:1.2});
        sphere(g,.52,0,1.55,.15,fur);
        sphere(g,.48,.72,1.78,.22,fur);
        sphere(g,.43,-.72,1.76,.22,fur);
        sphere(g,.40,1.05,2.25,.15,fur);
        sphere(g,.37,-1.05,2.2,.15,fur);
        const head=sphere(g,.58,1.48,2.55,.02,fur);head.scale.set(1.25,.95,.92);
        box(g,1.0,.32,.30,1.92,2.38,.18,pale);
        for(const dx of [-.55,.15,.95,1.55]){
          const leg=box(g,.22,1.15,.22,dx-0.1,1.05,dx<0.5?.30:-.08,fur);
          leg.rotation.z=dx<0.5?.12:-.08;
        }
        sphere(g,.08,1.74,2.66,.36,eye);sphere(g,.08,1.74,2.66,-.18,eye);
        for(const sx of [-1,1]){
          const ear=mesh(g,new THREE.ConeGeometry(.18,.42,6),fur,1.53,3.22,sx*.21);
          ear.rotation.z=sx*.35;ear.rotation.x=.18;
        }
        box(g,1.12,.18,.18,-1.22,1.98,.06,fur).rotation.z=.55;
      }else{
        const isHigh=actor.archetype==='selunite-high-priest';
        const priest=actor.archetype==='selunite-priest'||isHigh;
        const robe=mat(priest?(isHigh?0xd7dcf5:0xb8c5ea):0xa79fb2);
        const trim=mat(priest?0xcdd7ff:0xc5c4cf,{metalness:.28});
        mesh(g,new THREE.ConeGeometry(priest?.76:.70,priest?1.05:.92,10),robe,0,3.32,0);
        box(g,1.18,1.92,.18,0,1.72,-.62,robe);
        box(g,.98,.18,.22,0,2.34,.72,trim);
        box(g,1.10,.12,.22,0,3.17,.04,trim);
        if(priest){
          cylinder(g,.08,.09,isHigh?3.2:2.7,.92,1.72,.05,M.woodDark,8);
          sphere(g,isHigh?.28:.22,.92,isHigh?3.42:3.02,.05,mat(isHigh?0xcde8ff:0xadcaf7,{emissive:0x6a85b8,emissiveIntensity:isHigh?1.2:.8}));
          sphere(g,.18,0,3.28,0,mat(0xdfe6ff,{emissive:0x6f87b6,emissiveIntensity:.7}));
          if(isHigh){
            box(g,1.42,.14,.84,0,3.52,0,trim);
            sphere(g,.16,-.46,3.54,0,trim);sphere(g,.16,.46,3.54,0,trim);
          }
        }else{
          box(g,.86,.16,.56,.70,1.46,.28,M.linen);
        }
      }
    }else if(['shadow-wolf','golden-golem','sheep','potted-plant'].includes(actor.archetype)){
      if(actor.archetype==='shadow-wolf'){
        const shadowFur=mat(0x1c2030,{emissive:0x202743,emissiveIntensity:.8});
        const eye=mat(0xa7d5ff,{emissive:0x7ac0ff,emissiveIntensity:2.0});
        const body=mesh(g,new THREE.SphereGeometry(.82,16,12),shadowFur,0,1.55,0); body.scale.set(7.25,1.35,1.2);
        const neck=mesh(g,new THREE.SphereGeometry(.48,14,10),shadowFur,5.15,1.82,.02); neck.scale.set(1.5,1.0,.9);
        const head=mesh(g,new THREE.SphereGeometry(.62,16,12),shadowFur,6.10,2.02,.02); head.scale.set(1.28,.95,.92);
        for(const [x,z] of [[-4.7,-.42],[-4.7,.42],[-2.0,-.42],[-2.0,.42],[2.2,-.42],[2.2,.42],[4.6,-.36],[4.6,.36]]){
          const leg=box(g,.22,1.18,.22,x,.72,z,shadowFur); leg.rotation.z=x<0?.08:-.05;
        }
        for(const sx of [-1,1]){ const ear=mesh(g,new THREE.ConeGeometry(.22,.58,7),shadowFur,6.25,2.72,sx*.23); ear.rotation.z=sx*.35; ear.rotation.x=.12; }
        sphere(g,.10,6.38,2.08,.24,eye); sphere(g,.10,6.38,2.08,-.18,eye);
        box(g,1.65,.18,.18,-6.5,1.98,.04,shadowFur).rotation.z=.78;
      }else if(actor.archetype==='golden-golem'){
        const gold=mat(0xd9b44d,{metalness:.75,roughness:.25,emissive:0x8f6a10,emissiveIntensity:.8});
        box(g,1.32,1.8,.95,0,1.72,.04,gold); sphere(g,.46,0,3.1,0,gold);
        for(const side of [-1,1]){ box(g,.38,1.55,.38,side*.88,1.7,.02,gold); box(g,.42,1.7,.42,side*.35,.85,.02,gold); }
        for(const side of [-1,1]) sphere(g,.18,side*.22,3.1,.34,mat(0xffec9a,{emissive:0xffe78a,emissiveIntensity:1.5}));
        box(g,1.0,.14,.16,0,2.26,.52,mat(0xffeeaa,{emissive:0xf0d777,emissiveIntensity:1.0}));
      }else if(actor.archetype==='sheep'){
        const wool=mat(0xf1efe8),face=mat(0x4b3f38); const body=mesh(g,new THREE.SphereGeometry(.62,16,12),wool,0,1.1,0); body.scale.set(1.45,1.0,1.08);
        sphere(g,.34,.78,1.16,.02,face); for(const [x,z] of [[-.35,-.22],[-.35,.22],[.32,-.22],[.32,.22]]) box(g,.10,.62,.10,x,.35,z,face);
      }else if(actor.archetype==='potted-plant'){
        const pot=mesh(g,new THREE.CylinderGeometry(.52,.70,.82,14),mat(0x7a5a3c,{roughness:.95}),0,.42,0);
        const stem=mesh(g,new THREE.CylinderGeometry(.08,.10,1.4,10),mat(0x4a6e39),0,1.25,0);
        for(const [x,y,z,sx,sz] of [[.28,1.25,.04,1.4,.55],[-.28,1.5,-.05,1.35,.52],[.10,1.8,-.20,1.25,.60]]){ const leaf=mesh(g,new THREE.SphereGeometry(.26,12,10),mat(0x73aa56,{emissive:0x284f1b,emissiveIntensity:.22}),x,y,z); leaf.scale.set(sx,.55,sz);} 
      }
    }else if(actor.archetype==='hooded-stranger'){
      // Reusable anonymous wanderer silhouette, with no story-specific identity.
      mesh(g,new THREE.ConeGeometry(.75,.94,9),mat(0x20282e),0,3.28,0);
      box(g,1.22,2.02,.22,0,1.60,-.66,mat(0x232d36));
      box(g,.84,.18,.22,0,2.57,.57,mat(0x121c25));
      cylinder(g,.12,.11,2.1,.89,1.05,.12,M.woodDark,9);
      sphere(g,.20,.89,2.12,.12,mat(0xd1b785,{emissive:0x654a25,emissiveIntensity:.4}));
    }
  }
  if(isCult){
    const hood=mesh(g,new THREE.ConeGeometry(.74,.95,9),M.cult,0,3.41,0);
    const dagger=box(g,.12,1.05,.12,.9,1.47,-.1,M.metal);dagger.rotation.z=.5;
  }else if(actor.id==='leoric'){
    cylinder(g,.10,.11,2.7,.95,1.85,0,M.woodDark,8);
    sphere(g,.31,.95,3.27,0,M.bronze);
  }else if(actor.id==='cohen'){
    const shield=cylinder(g,.73,.73,.18,-.96,1.8,.33,M.metal,12);shield.rotation.z=Math.PI/2;
  }else if(actor.id==='zaazu'){
    const hat=mesh(g,new THREE.ConeGeometry(.84,1.45,9),M.blue,0,3.65,0);
  }else if(actor.id==='iimar'){
    const bow=mesh(g,new THREE.TorusGeometry(.8,.08,6,18,Math.PI),M.wood,.95,1.85,0);
    bow.rotation.z=Math.PI/2;
  }
  const footprint=actor.footprint?.cells||null;
  let ring;
  if(footprint&&footprint.length>1){
    let minC=0,maxC=0,minR=0,maxR=0; for(const [dc,dr] of footprint){if(dc<minC)minC=dc;if(dc>maxC)maxC=dc;if(dr<minR)minR=dr;if(dr>maxR)maxR=dr;}
    const sx=(maxC-minC+1)*.88,sz=(maxR-minR+1)*.88;
    ring=mesh(g,new THREE.RingGeometry(1.05,1.28,28),
      new THREE.MeshBasicMaterial({color:isCult?0xd84545:(isFist?0xd76b54:(isNpc?0x89cbb6:0xf1d597)),transparent:true,opacity:.92,side:THREE.DoubleSide}),0,.13,0);
    ring.rotation.x=-Math.PI/2; ring.scale.set(sx,sz,1); ring.castShadow=false;
  }else{
    ring=mesh(g,new THREE.TorusGeometry(1.43,.12,8,28),
      new THREE.MeshBasicMaterial({color:isCult?0xd84545:(isFist?0xd76b54:(isNpc?0x89cbb6:0xf1d597)),transparent:true,opacity:.92}),0,.13,0);
    ring.rotation.x=Math.PI/2;ring.castShadow=false;
  }
  group.userData.actor=actor;
  const label=document.createElement('div');label.className=`mini-label ${isCult?'hostile':isFist?'npc-fist':isNpc?'npc-civilian':''}`;
  label.textContent=actor.name;
  const labelObj=new CSS2DObject(label);labelObj.position.set(0,4.35,0);group.add(labelObj);
  // CSS2DRenderer owns a separate DOM tree. Detach its element explicitly
  // when removing a token to prevent orphaned cultist names on the board.
  group.userData.labelObject=labelObj;
  return group;
}
function footprintCellsFor(entity,c,r){
  const cells=entity?.footprint?.cells;
  if(Array.isArray(cells)&&cells.length) return cells.map(([dc,dr])=>({c:c+dc,r:r+dr}));
  return [{c,r}];
}
function footprintCenter(entity,c,r){
  const cells=footprintCellsFor(entity,c,r); let sx=0,sz=0;
  for(const cell of cells){const p=center(cell.c,cell.r);sx+=p.x;sz+=p.z;}
  return new THREE.Vector3(sx/cells.length,.1,sz/cells.length);
}
function actorsOverlapAt(a,ac,ar,b,bc,br){
  const occupied=new Set(footprintCellsFor(a,ac,ar).map(cell=>key(cell.c,cell.r)));
  return footprintCellsFor(b,bc,br).some(cell=>occupied.has(key(cell.c,cell.r)));
}
function assignActor(actor,c,r){
  if(!isFree(c,r,actor))return false;
  if(!actor.model){actor.model=makeMiniature(actor);tokenGroup.add(actor.model);actorsByMesh.push(actor.model);}
  actor.position={c,r};const p=footprintCenter(actor,c,r);actor.model.position.copy(p);
  updatePlayerTorch(actor);return true;
}
function removeActor(actor){
  if(actor.model){
    const group=actor.model;
    const torch=group.userData.playerTorch;
    if(torch){
      torch.radius.geometry.dispose();
      torch.radius.material.dispose();
      group.remove(torch.light,torch.radius);
      group.userData.playerTorch=null;
    }
    const labelObject=group.userData.labelObject;
    // Removing the 3D model alone does not reliably clean a CSS2DObject's
    // DOM element across render cycles, so explicitly remove both.
    if(labelObject){
      labelObject.element?.remove();
      group.remove(labelObject);
      group.userData.labelObject=null;
    }
    tokenGroup.remove(group);
    const i=actorsByMesh.indexOf(group);
    if(i>=0)actorsByMesh.splice(i,1);
  }
  actor.model=null;
  actor.position=null;
}
function isFree(c,r,entity=null){
  const cells=footprintCellsFor(entity,c,r);
  if(!cells.every(cell=>valid(cell.c)&&validRow(cell.r)&&!blocked.has(key(cell.c,cell.r)))) return false;
  return [...party,...cultists,...sceneActors].every(actor=>{
    if(actor===entity||!actor.position) return true;
    return !actorsOverlapAt(entity||{footprint:null},c,r,actor,actor.position.c,actor.position.r);
  });
}
// Check every occupied edge, not only the anchor square: a four-tile creature
// must not pass through a partition or diagonally clip through a wall.
function footprintCanCross(a,b,actor){
  return footprintCellsFor(actor,0,0).every(offset=>canCrossWall(
    {c:a.c+offset.c,r:a.r+offset.r},
    {c:b.c+offset.c,r:b.r+offset.r}
  ));
}
function canStep(a,b,actor){
  const dx=b.c-a.c,dr=b.r-a.r;
  if(Math.abs(dx)>1||Math.abs(dr)>1||(!dx&&!dr))return false;
  if(!isFree(b.c,b.r,actor))return false;
  if(!dx||!dr)return footprintCanCross(a,b,actor);
  const side1={c:a.c+dx,r:a.r},side2={c:a.c,r:a.r+dr};
  return isFree(side1.c,side1.r,actor)&&isFree(side2.c,side2.r,actor)&&
    footprintCanCross(a,side1,actor)&&footprintCanCross(a,side2,actor)&&
    footprintCanCross(side1,b,actor)&&footprintCanCross(side2,b,actor);
}
const DIRECTIONS=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
function searchReachable(actor){
  if(!actor.position)return new Map();
  // Only opt-in landmark scenes use weighted movement. Flooded squares cost 2.
  if(terrainCosts.size){
    const from=actor.position,start=key(from.c,from.r);
    const distances=new Map([[start,{distance:0,prev:null,cell:{...from}}]]);
    const queue=[{...from,distance:0}];
    while(queue.length){
      queue.sort((a,b)=>a.distance-b.distance);
      const at=queue.shift(),atKey=key(at.c,at.r);
      if(at.distance!==distances.get(atKey)?.distance)continue;
      if(at.distance>=MAX_MOVEMENT)continue;
      for(const [dc,dr] of DIRECTIONS){
        const to={c:at.c+dc,r:at.r+dr},tk=key(to.c,to.r);
        if(!canStep(at,to,actor))continue;
        const cost=at.distance+(terrainCosts.get(tk)||1);
        if(cost>MAX_MOVEMENT||cost>=((distances.get(tk)?.distance)??Infinity))continue;
        distances.set(tk,{distance:cost,prev:atKey,cell:to});
        queue.push({...to,distance:cost});
      }
    }
    return distances;
  }
  const start=actor.position,dist=new Map([[key(start.c,start.r),{distance:0,prev:null,cell:{...start}}]]);
  const queue=[{...start}];let head=0;
  while(head<queue.length){
    const at=queue[head++],meta=dist.get(key(at.c,at.r));
    if(meta.distance>=MAX_MOVEMENT)continue;
    for(const [dc,dr] of DIRECTIONS){
      const to={c:at.c+dc,r:at.r+dr},k=key(to.c,to.r);
      if(dist.has(k)||!canStep(at,to,actor))continue;
      dist.set(k,{distance:meta.distance+1,prev:key(at.c,at.r),cell:to});queue.push(to);
    }
  }
  return dist;
}
let reachable=new Map();
function updateHighlights(){
  for(const tile of selectionTiles)highlightGroup.remove(tile);
  selectionTiles=[];reachable=new Map();
  if(!selected)return;
  if(selected.position)reachable=searchReachable(selected);
  for(let r=0;r<config.h;r++)for(let c=0;c<config.w;c++){
    let color=0,opacity=0;
    if(!selected.position&&isFree(c,r,selected)){color=0xd9b678;opacity=.16;}
    else if(selected.position&&reachable.has(key(c,r))&&!(c===selected.position.c&&r===selected.position.r)){
      color=selected.kind==='enemy'||selected.faction==='flaming-fist'?0xc75a5c:0x7ac4b1;opacity=.18;
    }
    else if(selected.position&&selected.position.c===c&&selected.position.r===r){color=0xfbe6a0;opacity=.35;}
    if(opacity>0){const p=center(c,r);
      const tile=mesh(highlightGroup,new THREE.PlaneGeometry(CELL-.25,CELL-.25),
        new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide}),p.x,.13,p.z);
      tile.rotation.x=-Math.PI/2;tile.castShadow=false;selectionTiles.push(tile);
    }
  }
}
function selectActor(actor){
  if(actor.patrolStep){
    // Snap to the last occupied square rather than allowing a manual command
    // during an unfinished automatic step.
    const p=footprintCenter(actor,actor.position.c,actor.position.r);actor.model.position.copy(p);
    actor.patrolStep=null;actor.patrolPath=null;
  }
  selected=actor;
  for(const a of party)if(a.ui)a.ui.classList.toggle('active',a===selected);
  $('#move-status').textContent=actor.position?`${actor.name}: select a highlighted square (maximum ${MAX_MOVEMENT} steps).`:
    `${actor.name}: select any empty square to place this miniature.`;
  updateHighlights();
  refreshCultistUI();
  refreshLandmarkNpcUI();
}
function spawnAll(){
  for(const a of party){if(a.position)continue;
    const starts=[a.start,...Array.from({length:config.w*config.h},(_,i)=>({c:i%config.w,r:Math.floor(i/config.w)}))];
    for(const p of starts){const pos=Array.isArray(p)?{c:p[0],r:p[1]}:p;
      if(assignActor(a,pos.c,pos.r))break;}
  }
  $('#move-status').textContent='All adventurers are ready. Select a miniature, then a reachable square.';
  updateHighlights();
}
function clearParty(){if(activeMove&&activeMove.actor.kind==='player')activeMove=null;
  party.forEach(removeActor);selected=null;
  for(const a of party)a.ui?.classList.remove('active');
  updateHighlights();$('#move-status').textContent='Party cleared. Select a character to place them.';
}
function refreshCultistUI(){
  if(!IS_CULT_SCENE)return;
  const count=cultists.length;
  const selectedCultist=selected?.kind==='enemy'&&cultists.includes(selected)?selected:null;
  const status=`${count} cultist${count===1?'':'s'} active.`;
  $('#cult-status').textContent=selectedCultist?`${status} Selected: ${selectedCultist.name}.`:status;
  $('#remove-selected-cultist').disabled=!selectedCultist;
  const modeButton=$('#toggle-cultist-remove-mode');
  modeButton.textContent=cultistRemoveMode?'Remove by Click: ON':'Remove by Click: OFF';
  modeButton.classList.toggle('remove-mode-active',cultistRemoveMode);
  modeButton.setAttribute('aria-pressed',String(cultistRemoveMode));
  $('#cult-remove-notice').classList.toggle('hidden',!cultistRemoveMode);
  renderer.domElement.style.cursor=cultistRemoveMode?'not-allowed':'crosshair';
}
function setCultistRemoveMode(enabled){
  cultistRemoveMode=Boolean(enabled)&&SCENE_ID===5;
  refreshCultistUI();
}
function toggleCultPanel(){
  if(!IS_CULT_SCENE)return;
  const panel=$('#cult-panel');
  const visible=panel.classList.toggle('hidden')===false;
  const button=$('#toggle-cult-panel');
  button.textContent=visible?'Hide Cultist Panel':'Show Cultist Panel';
  button.setAttribute('aria-pressed',String(visible));
}
function removeCultist(actor){
  if(!actor||actor.kind!=='enemy')return;
  const index=cultists.indexOf(actor);
  if(index<0)return;
  if(activeMove?.actor===actor)activeMove=null;
  removeActor(actor);
  cultists.splice(index,1);
  if(selected===actor){
    selected=null;
    party.forEach(a=>a.ui?.classList.remove('active'));
  }
  $('#move-status').textContent=`${actor.name} removed from the board.`;
  updateHighlights();
  refreshCultistUI();
}
function spawnCultists(n){if(!IS_CULT_SCENE)return;
  const spots=[[10,10],[12,7],[9,6],[12,10],[8,8],[8,10],[11,6],[7,7],[13,8],[8,6],[12,6]];
  for(let i=0;i<n;i++){
    const candidate=spots.find(([c,r])=>isFree(c,r));if(!candidate)break;
    const a={id:`cult${++cultCounter}`,name:`Bhaal Cultist ${cultCounter}`,role:'Cultist',kind:'enemy',color:0x9b2834,model:null,position:null};
    cultists.push(a);assignActor(a,...candidate);
  }
  refreshCultistUI();
  updateHighlights();
}
function clearCultists(){
  if(activeMove?.actor.kind==='enemy')activeMove=null;
  for(const a of cultists)removeActor(a);
  cultists.length=0;
  if(selected?.kind==='enemy'){
    selected=null;
    party.forEach(a=>a.ui?.classList.remove('active'));
  }
  setCultistRemoveMode(false);
  updateHighlights();
  refreshCultistUI();
  $('#move-status').textContent='All cultists cleared from the board.';
}

// Generic landmark actors. This is configured by each named scene through
// npcTools; murder scenes never mount these controls or instantiate these actors.
function sceneActorPublicName(def){
  const rule=NPC_TOOLS?.reveals?.find(item=>item.sourceId===def.id);
  return rule&&revealedNpcIds.has(def.id)?rule.revealAs:def.name;
}
function createSceneActor(def,source='spawned') {
  return {
    id: source==='initial'?def.id:`${def.id}-${++sceneActorCounter}`,
    sourceId:def.id,name:sceneActorPublicName(def),role:def.role||'Civilian',
    faction:def.faction||'civilian',archetype:def.archetype||'refugee',
    kind:'scene-npc',color:def.color??0x7b927d,origin:source,
    footprint:def.footprint||null,
    patrol:def.patrol||null,patrolIndex:0,patrolStep:null,patrolPath:null,
    patrolWait:0,position:null,model:null,ui:null,
  };
}
function findSceneActorSpot(def) {
  const candidates=def.spots || (def.start?[def.start]:[]);
  for(const [c,r] of candidates) if(isFree(c,r,def))return [c,r];
  const spawnArea=def.spawnArea || (def.faction==='flaming-fist'?{minC:3,maxC:12,minR:6,maxR:17}:null);
  if(spawnArea){
    const {minC,maxC,minR,maxR}=spawnArea;
    // Deterministic arrival order. Allows many refugees without overlap.
    for(let r=maxR;r>=minR;r--)for(let c=minC;c<=maxC;c++)
      if(isFree(c,r,def))return [c,r];
  }
  return null;
}
function addSceneActor(def,source='spawned') {
  if(!NPC_TOOLS)return null;
  if(source==='initial'&&sceneActors.some(a=>a.id===def.id))return null;
  if(def.unique&&sceneActors.some(a=>a.sourceId===def.id)){
    $('#move-status').textContent=`${def.name} is already here.`;
    return null;
  }
  const spot=findSceneActorSpot(def);
  if(!spot){$('#move-status').textContent=`No unoccupied entry square for ${def.name}.`;return null;}
  const actor=createSceneActor(def,source);
  sceneActors.push(actor);
  if(!assignActor(actor,spot[0],spot[1])){sceneActors.pop();return null;}
  labelZoomState=null;return actor;
}
function refreshLandmarkNpcUI(){
  if(!NPC_TOOLS)return;
  const panel=$('#landmark-npc-panel');if(!panel)return;
  const roster=$('#landmark-npc-roster');roster.replaceChildren();
  const guardCount=sceneActors.filter(a=>a.faction==='flaming-fist').length;
  const refugeeCount=sceneActors.filter(a=>a.sourceId==='refugee').length;
  const selectedNpc=selected?.kind==='scene-npc'&&sceneActors.includes(selected)?selected:null;
  const countDetails=[guardCount&&`${guardCount} Flaming Fist`,refugeeCount&&`${refugeeCount} refugees`].filter(Boolean);
  $('#landmark-npc-status').textContent=`${sceneActors.length} NPC${sceneActors.length===1?'':'s'} in this location`+
    (countDetails.length?` · ${countDetails.join(' · ')}`:'')+
    (selectedNpc?` · Selected: ${selectedNpc.name}`:'');
  $('#remove-selected-npc').disabled=!selectedNpc;
  const removeButton=$('#toggle-npc-remove-mode');
  removeButton.textContent=landmarkNpcRemoveMode?'Remove by Click: ON':'Remove by Click: OFF';
  removeButton.classList.toggle('remove-mode-active',landmarkNpcRemoveMode);
  removeButton.setAttribute('aria-pressed',String(landmarkNpcRemoveMode));
  renderer.domElement.style.cursor=landmarkNpcRemoveMode?'not-allowed':'crosshair';
  for(const actor of sceneActors){
    const line=document.createElement('div');line.className='npc-roster-row';
    const pick=document.createElement('button');pick.type='button';pick.className='npc-roster-select';
    pick.textContent=actor.name;pick.title=`Select ${actor.name} for movement`;
    if(actor===selected)pick.classList.add('active');
    pick.addEventListener('click',()=>{setNpcRemoveMode(false);selectActor(actor);});
    const del=document.createElement('button');del.type='button';del.className='npc-roster-remove';
    del.textContent='×';del.title=`Remove ${actor.name}`;del.setAttribute('aria-label',`Remove ${actor.name}`);
    del.addEventListener('click',()=>removeSceneActor(actor));
    line.append(pick,del);roster.appendChild(line);
  }
}
function setNpcRemoveMode(enabled){
  landmarkNpcRemoveMode=Boolean(enabled)&&Boolean(NPC_TOOLS);
  refreshLandmarkNpcUI();
}
function removeSceneActor(actor){
  const i=sceneActors.indexOf(actor);if(i<0)return;
  if(activeMove?.actor===actor)activeMove=null;
  removeActor(actor);sceneActors.splice(i,1);
  if(selected===actor){selected=null;party.forEach(a=>a.ui?.classList.remove('active'));}
  $('#move-status').textContent=`${actor.name} removed from the scene.`;
  updateHighlights();refreshLandmarkNpcUI();
}
function clearSceneActors(filter=()=>true){
  for(const actor of [...sceneActors])if(filter(actor))removeSceneActor(actor);
  updateHighlights();refreshLandmarkNpcUI();
}
function spawnSceneActors(def,number=1){
  if(!NPC_TOOLS)return;
  const max=def.limit??99;
  let added=0;
  for(let i=0;i<number;i++){
    const existing=sceneActors.filter(a=>a.sourceId===def.id).length;
    if(existing>=max)break;
    if(!addSceneActor(def))break;
    added++;
  }
  $('#move-status').textContent=added?`${added} ${def.name}${added===1?'':'s'} placed on the map.`:
    `No additional ${def.name} can be placed.`;
  updateHighlights();refreshLandmarkNpcUI();
}
function restoreSceneGarrison(){
  if(!NPC_TOOLS)return;
  for(const def of NPC_TOOLS.initial||[]) addSceneActor(def,'initial');
  updateHighlights();refreshLandmarkNpcUI();
}
function setSceneActorReveal(rule,revealed){
  if(revealed)revealedNpcIds.add(rule.sourceId);
  else revealedNpcIds.delete(rule.sourceId);
  const initial=NPC_TOOLS?.initial?.find(def=>def.id===rule.sourceId);
  const spawned=NPC_TOOLS?.spawnables?.find(def=>def.id===rule.sourceId);
  const newName=revealed?rule.revealAs:(initial||spawned)?.name||'???';
  for(const actor of sceneActors){
    if(actor.sourceId!==rule.sourceId)continue;
    actor.name=newName;
    // Update the actual label on the 3D miniature immediately, not merely
    // the roster, to keep both interfaces synchronized.
    const label=actor.model?.userData.labelObject?.element;
    if(label)label.textContent=newName;
  }
  if(selected?.sourceId===rule.sourceId){
    $('#move-status').textContent=`${newName}: select a highlighted square (maximum ${MAX_MOVEMENT} steps).`;
  }
  const btn=document.querySelector(`[data-reveal-source-id="${rule.sourceId}"]`);
  if(btn){btn.textContent=revealed?(rule.hideLabel||'Conceal Identity'):(rule.revealLabel||'Reveal Identity');
    btn.setAttribute('aria-pressed',String(revealed));btn.classList.toggle('identity-revealed',revealed);}
  refreshLandmarkNpcUI();
}
function buildLandmarkNpcPanel(){
  if(!NPC_TOOLS)return;
  // Created only for landmark encounters. Nothing changes on murder/cultist pages.
  const panel=document.createElement('aside');
  panel.id='landmark-npc-panel';panel.className='panel right-panel collapsible';
  panel.innerHTML=`<button class="panel-header" data-target="landmark-npc-body" type="button">
    <span><small>LANDMARK GAME MASTER TOOLS</small><strong>Scene NPCs</strong></span><span class="chevron">⌄</span></button>
    <div class="panel-body" id="landmark-npc-body">
      <p class="desc">Spawn characters for this location. Select any miniature or roster name to move up to six squares. Remove figures individually or enable Remove by Click.</p>
      <section id="landmark-environment" class="landmark-environment hidden">
        <div class="npc-roster-heading">LOCATION CONTROLS · GM</div>
        <div id="landmark-environment-actions" class="landmark-interaction-actions"></div>
      </section>
      <div id="landmark-npc-spawn" class="npc-spawn-actions"></div>
      <div id="landmark-npc-reveals" class="npc-identity-controls"></div>
      <div id="patrol-controls" class="row-actions stack hidden">
        <button id="toggle-patrols" class="secondary" type="button">Pause Guard Patrols</button>
      </div>
      <div class="row-actions stack npc-management">
        <button id="remove-selected-npc" class="secondary" disabled>Remove Selected NPC</button>
        <button id="toggle-npc-remove-mode" class="secondary" aria-pressed="false">Remove by Click: OFF</button>
        <button id="clear-refugees" class="secondary">Clear Refugees</button>
        <button id="clear-spawned-npcs" class="secondary">Clear Spawned NPCs</button>
        <button id="restore-garrison" class="secondary">Restore Garrison</button>
        <button id="clear-all-npcs" class="secondary">Remove All NPCs</button>
      </div>
      <div id="landmark-npc-status" class="status-box">No NPCs at this location.</div>
      <div class="npc-roster-heading">ACTIVE NPCs · SELECT OR REMOVE</div>
      <div id="landmark-npc-roster" class="npc-roster"></div>
    </div>`;
  panel.querySelector('.panel-header strong').textContent=NPC_TOOLS.panelTitle||'Scene NPCs';
  document.body.appendChild(panel);
  const topButton=document.createElement('button');topButton.id='toggle-npc-panel';
  topButton.type='button';topButton.textContent='Hide NPC Panel';
  $('#toggle-cult-panel').after(topButton);
  const setPanelVisible=shown=>{
    panel.classList.toggle('hidden',!shown);
    topButton.textContent=shown?'Hide NPC Panel':'Show NPC Panel';
    topButton.setAttribute('aria-pressed',String(shown));
  };
  topButton.addEventListener('click',()=>setPanelVisible(panel.classList.contains('hidden')));
  panel.querySelector('.panel-header').addEventListener('click',()=>panel.classList.toggle('collapsed'));
  const controlsHost=$('#landmark-environment-actions');
  if(sceneInteractions.length){
    $('#landmark-environment').classList.remove('hidden');
    const sections=new Map();
    for(const interaction of sceneInteractions){
      const groupName=interaction.group||'LOCATION CONTROLS · GM';
      let section=sections.get(groupName);
      if(!section){
        section=document.createElement('section');section.className='landmark-interaction-section';
        const heading=document.createElement('div');heading.className='npc-roster-heading';heading.textContent=groupName;
        const body=document.createElement('div');body.className='landmark-interaction-actions';
        section.append(heading,body);controlsHost.appendChild(section);sections.set(groupName,body);
      }
      const button=document.createElement('button');button.type='button';
      button.dataset.sceneAction=interaction.id;
      button.addEventListener('click',()=>runSceneInteraction(interaction));
      sections.get(groupName).appendChild(button);
    }
    refreshSceneInteractionButtons();
  }
  const spawn=$('#landmark-npc-spawn');
  spawn.classList.toggle('hidden',!(NPC_TOOLS.spawnables?.length));
  for(const def of NPC_TOOLS.spawnables||[]){
    const button=document.createElement('button');button.type='button';
    button.textContent=`Spawn ${def.name}`;
    button.addEventListener('click',()=>spawnSceneActors(def,1));
    spawn.appendChild(button);
    if(def.id==='refugee'){
      const triple=document.createElement('button');triple.type='button';
      triple.textContent='Spawn 3 Refugees';
      triple.addEventListener('click',()=>spawnSceneActors(def,3));spawn.appendChild(triple);
    }
  }
  const patrolControls=$('#patrol-controls');
  if(NPC_TOOLS.patrolControls){
    patrolControls.classList.remove('hidden');
    $('#toggle-patrols').addEventListener('click',()=>{
      patrolsEnabled=!patrolsEnabled;
      $('#toggle-patrols').textContent=patrolsEnabled?'Pause Guard Patrols':'Resume Guard Patrols';
      $('#move-status').textContent=patrolsEnabled?'Garrison patrols resumed.':'Garrison patrols paused.';
    });
  }
  const reveals=$('#landmark-npc-reveals');
  reveals.classList.toggle('hidden',!(NPC_TOOLS.reveals?.length));
  for(const rule of NPC_TOOLS.reveals||[]){
    const caption=document.createElement('div');caption.className='npc-identity-description';
    caption.textContent=rule.description||'Keep the name hidden until the encounter calls for a reveal.';
    const btn=document.createElement('button');btn.type='button';
    btn.className='identity-reveal-button';btn.dataset.revealSourceId=rule.sourceId;
    btn.textContent=rule.revealLabel||'Reveal Identity';btn.setAttribute('aria-pressed','false');
    btn.addEventListener('click',()=>setSceneActorReveal(rule,!revealedNpcIds.has(rule.sourceId)));
    reveals.append(caption,btn);
  }
  $('#remove-selected-npc').addEventListener('click',()=>{if(selected?.kind==='scene-npc')removeSceneActor(selected);});
  $('#toggle-npc-remove-mode').addEventListener('click',()=>setNpcRemoveMode(!landmarkNpcRemoveMode));
  $('#clear-refugees').classList.toggle('hidden',!NPC_TOOLS.spawnables?.some(a=>a.id==='refugee'));
  $('#clear-refugees').addEventListener('click',()=>clearSceneActors(a=>a.sourceId==='refugee'));
  $('#clear-spawned-npcs').addEventListener('click',()=>clearSceneActors(a=>a.origin==='spawned'));
  $('#restore-garrison').classList.toggle('hidden',!(NPC_TOOLS.initial?.length));
  $('#restore-garrison').textContent=NPC_TOOLS.restoreLabel||'Restore Garrison';
  $('#restore-garrison').addEventListener('click',restoreSceneGarrison);
  $('#clear-all-npcs').addEventListener('click',()=>clearSceneActors());
  restoreSceneGarrison();
}


// V9 reusable landmark patrols. An NPC's `patrol` is {points:[[c,r], ...],
// speed:<cells per second>, pause:<seconds>}. Only scenes opting into patrols
// run this scheduler; selecting an NPC pauses that miniature until deselected.
// Player actions are still restricted to six grid squares by searchReachable().
let patrolsEnabled=true;
function fullPatrolPath(actor,goal){
  if(!actor.position)return [];
  const origin=actor.position,finish=key(goal[0],goal[1]);
  const source=key(origin.c,origin.r);
  if(source===finish)return [];
  const visited=new Map([[source,null]]),queue=[{...origin}];
  let head=0;
  while(head<queue.length){
    const at=queue[head++],previous=key(at.c,at.r);
    for(const [dc,dr] of DIRECTIONS){
      const next={c:at.c+dc,r:at.r+dr},nk=key(next.c,next.r);
      if(visited.has(nk)||!canStep(at,next,actor))continue;
      visited.set(nk,previous);
      if(nk===finish){
        const path=[];let node=nk;
        while(node!==source){
          const [c,r]=node.split(',').map(Number);
          path.push({c,r});node=visited.get(node);
        }
        return path.reverse();
      }
      queue.push(next);
    }
  }
  return null; // temporarily blocked by another token or a closed doorway
}
function animateLandmarkPatrols(dt){
  if(!patrolsEnabled||!NPC_TOOLS?.patrolControls)return;
  const reserved=new Set();
  for(const a of sceneActors)if(a.patrolStep)reserved.add(key(a.patrolStep.to.c,a.patrolStep.to.r));
  if(activeMove?.path?.[activeMove.index]){
    const cell=activeMove.path[activeMove.index];reserved.add(key(cell.c,cell.r));
  }
  for(const actor of sceneActors){
    const route=actor.patrol?.points;
    if(!route?.length||!actor.position||!actor.model||selected===actor||activeMove?.actor===actor)continue;
    if(actor.patrolStep){
      const step=actor.patrolStep;
      step.t=Math.min(1,step.t+dt*Math.max(.7,Math.min(6,actor.patrol.speed||2.2)));
      const t=step.t,s=t*t*(3-2*t);
      actor.model.position.lerpVectors(step.from,step.toWorld,s);
      if(t>=1){
        actor.position={...step.to};actor.patrolStep=null;
        actor.patrolPath?.shift();actor.patrolWait=.03;
      }
      continue;
    }
    actor.patrolWait-=dt;
    if(actor.patrolWait>0)continue;
    if(!actor.patrolPath?.length){
      const target=route[actor.patrolIndex%route.length];
      if(actor.position.c===target[0]&&actor.position.r===target[1]){
        actor.patrolIndex=(actor.patrolIndex+1)%route.length;
        actor.patrolWait=actor.patrol.pause??.15;
        continue;
      }
      actor.patrolPath=fullPatrolPath(actor,target);
      if(!actor.patrolPath){actor.patrolWait=.9;continue;}
    }
    const next=actor.patrolPath?.[0];
    if(!next)continue;
    if(reserved.has(key(next.c,next.r))||!canStep(actor.position,next,actor)){
      actor.patrolPath=null;actor.patrolWait=.4;continue;
    }
    const toWorld=center(next.c,next.r);toWorld.y=.1;
    actor.patrolStep={to:{...next},from:actor.model.position.clone(),toWorld,t:0};
    reserved.add(key(next.c,next.r));
  }
}

function beginMovement(actor,dest){
  if(NPC_TOOLS?.patrolControls)reachable=searchReachable(actor);
  if(activeMove){$('#move-status').textContent='Finish the current move before choosing another square.';return;}
  const last=reachable.get(key(dest.c,dest.r));
  if(!last){$('#move-status').textContent=`Out of range or obstructed. Maximum ${MAX_MOVEMENT} grid steps.`;return;}
  if(last.distance===0)return;
  const path=[];let k=key(dest.c,dest.r);
  while(k&&k!==key(actor.position.c,actor.position.r)){
    const node=reachable.get(k);if(!node)break;
    path.push(node.cell);k=node.prev;
  }
  path.reverse();
  activeMove={actor,path,index:0,from:actor.model.position.clone(),to:footprintCenter(actor,path[0].c,path[0].r),progress:0};
  activeMove.to.y=.1;
  $('#move-status').textContent=`Moving ${actor.name} ${path.length} square${path.length===1?'':'s'}…`;
  updateHighlights();
}
function animateMovement(dt){
  if(!activeMove)return;
  const m=activeMove;if(!m.actor.model){activeMove=null;return;}
  m.progress+=dt/0.13;
  const t=Math.min(1,m.progress),s=t*t*(3-2*t);
  m.actor.model.position.lerpVectors(m.from,m.to,s);
  if(t<1)return;
  const arrived=m.path[m.index];m.actor.position={...arrived};
  m.index++;
  if(m.index===m.path.length){
    $('#move-status').textContent=`${m.actor.name} moved ${m.path.length} square${m.path.length===1?'':'s'}.`;
    activeMove=null;updateHighlights();return;
  }
  // Moving patrols can occupy a previously highlighted square while a player
  // is completing a six-square action; abort rather than clip through a guard.
  if(NPC_TOOLS?.patrolControls&&!canStep(m.actor.position,m.path[m.index],m.actor)){
    $('#move-status').textContent=`${m.actor.name} stops: the route is now obstructed.`;
    activeMove=null;updateHighlights();return;
  }
  m.from=m.actor.model.position.clone();m.to=footprintCenter(m.actor,m.path[m.index].c,m.path[m.index].r);m.progress=0;
}
function buildPartyUI(){const list=$('#party-list');
  for(const actor of party){
    const btn=document.createElement('button');btn.className='party-row';btn.type='button';
    btn.innerHTML=`<span class="avatar" style="color:#${actor.color.toString(16)}">${actor.symbol}</span><span><strong>${actor.name}</strong><span class="role">${actor.role}</span></span><span class="party-state">PLACE</span>`;
    btn.addEventListener('click',()=>selectActor(actor));list.appendChild(btn);actor.ui=btn;
  }
}
buildPartyUI();
buildLandmarkNpcPanel();
if(landmarkScene?.autoSpawnParty)spawnAll();
function onPointerClick(evt){
  const rect=renderer.domElement.getBoundingClientRect();
  const cursor=new THREE.Vector2(((evt.clientX-rect.left)/rect.width)*2-1,-((evt.clientY-rect.top)/rect.height)*2+1);
  const ray=new THREE.Raycaster();ray.setFromCamera(cursor,camera);
  const actorHits=ray.intersectObjects(actorsByMesh,true);
  if(actorHits.length){
    let obj=actorHits[0].object;
    while(obj&&!obj.userData.actor)obj=obj.parent;
    if(obj?.userData.actor){
      const clicked=obj.userData.actor;
      if(cultistRemoveMode&&clicked.kind==='enemy'){
        removeCultist(clicked);
        return;
      }
      // In removal mode, don't unexpectedly select or move a party member.
      if(cultistRemoveMode){
        $('#move-status').textContent='Remove mode is active. Click a cultist, or press Esc to exit.';
        return;
      }
      if(landmarkNpcRemoveMode){
        if(clicked.kind==='scene-npc')removeSceneActor(clicked);
        else $('#move-status').textContent='Remove mode is active. Click an NPC, or press Esc to exit.';
        return;
      }
      selectActor(clicked);
      return;
    }
  }
  // Clickable scenery shares the existing canvas raycaster; actors take priority.
  if(!cultistRemoveMode&&!landmarkNpcRemoveMode&&sceneClickable.length){
    const hits=ray.intersectObjects(sceneClickable,true);
    if(hits.length){
      let object=hits[0].object;
      while(object&&!object.userData.sceneClick)object=object.parent;
      if(object?.userData.sceneClick){
        object.userData.sceneClick.run();refreshSceneInteractionButtons();return;
      }
    }
  }
  // Delete mode is only for clicking cultist models, not floor placement.
  if(cultistRemoveMode||landmarkNpcRemoveMode||!selected)return;
  const floorHits=ray.intersectObject(floorHit,false);if(!floorHits.length)return;
  const p=floorHits[0].point;
  const c=Math.floor(p.x/CELL+config.w/2),r=Math.floor(p.z/CELL+config.h/2);
  if(!valid(c)||!validRow(r))return;
  if(!selected.position){
    if(assignActor(selected,c,r)){
      $('#move-status').textContent=`${selected.name} placed. Click a highlighted square to move.`;
      selected.ui?.querySelector('.party-state')?.replaceChildren('ON MAP');
    }else $('#move-status').textContent='This square is occupied or blocked.';
    updateHighlights();return;
  }
  beginMovement(selected,{c,r});
}
let pointerStart;
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button===0)pointerStart=[e.clientX,e.clientY];});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!pointerStart||e.button!==0)return;
  const distance=Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1]);
  pointerStart=null;
  if(distance<5)onPointerClick(e);
});

$('.panel-header[data-target="party-panel-body"]').addEventListener('click',()=>$('#party-panel').classList.toggle('collapsed'));
$('.panel-header[data-target="cult-panel-body"]').addEventListener('click',()=>$('#cult-panel').classList.toggle('collapsed'));
$('#spawn-party').addEventListener('click',()=>{spawnAll();party.forEach(a=>{if(a.ui)a.ui.querySelector('.party-state').textContent=a.position?'ON MAP':'PLACE';});});
$('#clear-party').addEventListener('click',()=>{clearParty();party.forEach(a=>a.ui.querySelector('.party-state').textContent='PLACE');});
$('#spawn-cultist').addEventListener('click',()=>spawnCultists(1));
$('#spawn-three-cultists').addEventListener('click',()=>spawnCultists(3));
$('#clear-cultists').addEventListener('click',clearCultists);
$('#remove-selected-cultist').addEventListener('click',()=>removeCultist(selected));
$('#toggle-cultist-remove-mode').addEventListener('click',()=>setCultistRemoveMode(!cultistRemoveMode));
$('#toggle-cult-panel').addEventListener('click',toggleCultPanel);
refreshCultistUI();
$('#reset-camera').addEventListener('click',()=>{camera.position.set(57,82,69);camera.zoom=1;camera.updateProjectionMatrix();controls.target.set(0,0,0);controls.update();});
$('#toggle-grid').addEventListener('click',()=>{gridObject.visible=!gridObject.visible;$('#toggle-grid').textContent=gridObject.visible?'Grid On':'Grid Off';});
$('#toggle-ui').addEventListener('click',()=>document.body.classList.toggle('ui-hidden'));
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    selected=null;
    setCultistRemoveMode(false);
    setNpcRemoveMode(false);
    updateHighlights();
    party.forEach(a=>a.ui?.classList.remove('active'));
    refreshCultistUI();
    return;
  }
  if(e.key.toLowerCase()==='g')$('#toggle-grid').click();
  if(e.key.toLowerCase()==='h')document.body.classList.toggle('ui-hidden');
  if(/^[1-4]$/.test(e.key))selectActor(party[Number(e.key)-1]);
});
window.addEventListener('resize',()=>{
  const aspect=innerWidth/innerHeight,vertical=landmarkScene?.cameraVertical ?? 60;
  camera.left=-vertical*aspect/2;camera.right=vertical*aspect/2;
  camera.top=vertical/2;camera.bottom=-vertical/2;
  camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);labelRenderer.setSize(innerWidth,innerHeight);
});
window.dispatchEvent(new Event('resize'));
function refreshNpcLabelDensity(){
  if(!landmarkScene?.npcLabelZoom)return;
  const expanded=camera.zoom>=landmarkScene.npcLabelZoom;
  if(expanded===labelZoomState&&labelSelection===selected)return;
  labelZoomState=expanded;labelSelection=selected;
  for(const actor of sceneActors){
    const el=actor.model?.userData.labelObject?.element;
    if(!el)continue;
    const officer=actor.archetype==='captain'||actor.archetype==='sergeant';
    el.style.display=(expanded||officer||actor===selected)?'':'none';
  }
}
let prev=performance.now();
function animate(ts){requestAnimationFrame(animate);
  const dt=Math.min((ts-prev)/1000,.05);prev=ts;
  animateMovement(dt);animateLandmarkPatrols(dt);refreshNpcLabelDensity();controls.update();renderer.render(scene,camera);labelRenderer.render(scene,camera);
}
requestAnimationFrame(animate);
