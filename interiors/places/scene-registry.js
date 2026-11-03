// V9 — source of truth for named interior scenes. Keep keys equal to LANDMARKS.id.
// Add a new import and an entry here, then add its URL in root/main.js.
import { buildElfsongTavern } from './scenes/elfsong-tavern.js';
import { buildWyrmsCrossing, WYRM_NPC_CONFIG } from './scenes/wyrms-crossing.js';
import { buildGraveyard, GRAVEYARD_NPC_CONFIG } from './scenes/graveyard.js';
import { buildHouseOfGrief, HOUSE_GRIEF_NPCS } from './scenes/house-of-grief.js';
import { buildCloisterOfSombreEmbrace, CLOISTER_NPCS, CLOISTER_FLOOR_MASK } from './scenes/cloister-of-sombre-embrace.js';
import { buildFlamingFistBarracks, BARRACKS_NPCS } from './scenes/flaming-fist-barracks.js';
import {buildGenericBathhouse,BATHHOUSE_NPCS,BATHHOUSE_FLOOR_MASK} from './scenes/generic-bathhouse.js';
import {buildDungeonOfTheDeadThree,DEAD_THREE_NPCS,DEAD_THREE_FLOOR_MASK} from './scenes/dungeon-of-the-dead-three.js';
import {buildTempleOfSelune,SELUNE_TEMPLE_NPCS} from './scenes/temple-of-selune.js';
import {buildSeluniteMoonSanctum,MOON_SANCTUM_NPCS,SELUNITE_MOON_SANCTUM_FLOOR_MASK} from './scenes/selunite-moon-sanctum.js';

export const LANDMARK_SCENES = Object.freeze({
  'temple-of-selune': {
    id:'temple-of-selune',
    name:'Temple of Selûne',
    subtitle:'Moonlit nave · silver clergy · a hidden descent beneath the central moonwell',
    w:20,h:32,floor:'stone',cameraVertical:154,cameraFar:360,autoSpawnParty:true,
    npcLabelZoom:1.2,
    atmosphere:{background:0x1e2430,fogDensity:.0046,
      lighting:{hemisphereColor:0xcad6f8,hemisphereGround:0x303846,
        hemisphereIntensity:1.15,sunColor:0xaad8ff,sunIntensity:.22,
        ambientColor:0xb9c4e8,ambientIntensity:1.15}},
    starts:[[8,29],[9,29],[10,29],[11,29]],
    npcTools:SELUNE_TEMPLE_NPCS,build:buildTempleOfSelune,
  },
  'selunite-moon-sanctum': {
    id:'selunite-moon-sanctum',requiresEntryFrom:'temple-of-selune',
    name:'Moon Sanctum Beneath Selûne',
    subtitle:'Hidden circular chamber · glowing floor · moonlit summons',
    w:34,h:34,floor:'stone',outdoor:true,instancedFloor:true,
    floorMask:SELUNITE_MOON_SANCTUM_FLOOR_MASK,optimizeStaticGeometry:true,
    cameraVertical:146,cameraFar:420,shadowExtent:120,autoSpawnParty:true,
    starts:[[15,27],[16,27],[17,27],[18,27]],
    atmosphere:{background:0x172033,fogDensity:.0012,
      lighting:{hemisphereColor:0xd3e4ff,hemisphereGround:0x20263a,
        hemisphereIntensity:1.25,sunColor:0xc7e4ff,sunIntensity:.34,
        ambientColor:0x92b7e3,ambientIntensity:1.18}},
    npcTools:MOON_SANCTUM_NPCS,build:buildSeluniteMoonSanctum,
  },
  'generic-bathhouse': {
    id:'generic-bathhouse',name:'Generic Bathhouse — Waters of Rivington',
    subtitle:'Polished blue marble baths · smiling nymphs · a hidden stairwell',
    w:26,h:24,floor:'stone',outdoor:true,instancedFloor:true,
    floorMask:BATHHOUSE_FLOOR_MASK,cameraFar:380,cameraVertical:108,
    autoSpawnParty:true,npcLabelZoom:1.15,
    starts:[[12,21],[13,21],[14,21],[15,21]],
    atmosphere:{background:0x687b7b,fogDensity:.0022,
      lighting:{hemisphereColor:0xf6ebd9,hemisphereGround:0x434b4d,
        hemisphereIntensity:2.0,sunColor:0xffd7a1,sunIntensity:2.1,
        ambientColor:0xf5d9b4,ambientIntensity:1.0}},
    npcTools:BATHHOUSE_NPCS,build:buildGenericBathhouse,
  },
  // Hidden subsidiary: not in city LANDMARKS or the main.js URL list.
  'dungeon-of-the-dead-three': {
    id:'dungeon-of-the-dead-three',requiresEntryFrom:'generic-bathhouse',
    name:'Dungeon of the Dead Three',
    subtitle:'Under the bathhouse · limestone crypts · Bane, Bhaal & Myrkul',
    w:96,h:56,floor:'stone',outdoor:true,instancedFloor:true,
    floorMask:DEAD_THREE_FLOOR_MASK,optimizeStaticGeometry:true,
    cameraVertical:267,cameraFar:950,shadowExtent:240,
    autoSpawnParty:true,npcLabelZoom:1.30,
    starts:[[6,7],[7,7],[9,7],[10,7]],
    atmosphere:{background:0x141818,fogDensity:.0034,
      lighting:{hemisphereColor:0x83959a,hemisphereGround:0x111516,
        hemisphereIntensity:.43,sunColor:0x70868c,sunIntensity:.18,
        ambientColor:0x4d7279,ambientIntensity:.45}},
    npcTools:DEAD_THREE_NPCS,build:buildDungeonOfTheDeadThree,
  },
  'flaming-fist-barracks': {
    id:'flaming-fist-barracks',
    name:'Flaming Fist Barracks — The Grand Garrison',
    subtitle:'Lower City · urgent patrols · twenty rival companies · Roman command headquarters',
    w:88,h:88,floor:'stone',outdoor:true,
    instancedFloor:true,optimizeStaticGeometry:true,shadowExtent:220,
    cameraFar:760,npcLabelZoom:1.35,
    cameraVertical:372,autoSpawnParty:true,
    atmosphere:{background:0x6e7b7d,fogDensity:.0017,
      lighting:{hemisphereColor:0xd4dae0,hemisphereGround:0x56534b,
        hemisphereIntensity:2.2,sunColor:0xffd6ae,sunIntensity:2.5,
        ambientColor:0xf7bd83,ambientIntensity:1.7}},
    starts:[[41,85],[42,85],[43,85],[44,85]],
    npcTools:BARRACKS_NPCS,
    build:buildFlamingFistBarracks,
  },
  'house-of-grief': {
    id:'house-of-grief',
    name:'House of Grief — The Mapping Room',
    subtitle:'Lower City · quiet Sharran retreat · doors that conceal deeper sorrows',
    w:18,h:18,floor:'stone',cameraVertical:76,autoSpawnParty:true,
    atmosphere:{background:0x211c27,fogDensity:.006,
      lighting:{hemisphereColor:0xc6aac4,hemisphereGround:0x28202a,
        hemisphereIntensity:.67,sunColor:0xe9b48d,sunIntensity:.38,
        ambientColor:0xb88d90,ambientIntensity:1.0}},
    starts:[[7,17],[8,17],[9,17],[10,17]],
    npcTools:HOUSE_GRIEF_NPCS,build:buildHouseOfGrief,
  },
  // Subsidiary scene, not present in main.js LANDMARKS or LANDMARK_INTERIORS.
  // The shared engine permits entry only after travel from House of Grief.
  'cloister-of-sombre-embrace': {
    id:'cloister-of-sombre-embrace',requiresEntryFrom:'house-of-grief',
    name:'The Cloister of Sombre Embrace',
    subtitle:'Hidden Sharran sanctum · the Lady of Sorrows · secrets made memory',
    w:62,h:42,floor:'stone',outdoor:true,cameraVertical:214,autoSpawnParty:true,
    floorMask:CLOISTER_FLOOR_MASK,
    atmosphere:{background:0x17121f,fogDensity:.0038,
      lighting:{hemisphereColor:0x9783ba,hemisphereGround:0x1b1529,
        hemisphereIntensity:.65,sunColor:0x8c67c5,sunIntensity:.28,
        ambientColor:0x7750a4,ambientIntensity:1.25}},
    starts:[[54,12],[55,12],[54,13],[55,13]],
    npcTools:CLOISTER_NPCS,build:buildCloisterOfSombreEmbrace,
  },
  'graveyard': {
    id:'graveyard',
    name:'The Graveyard — The Quiet Hill',
    subtitle:'Outer City · solemn cemetery · a name waiting to be spoken',
    w:26, h:26, floor:'grass', outdoor:true,
    cameraVertical:120,
    atmosphere:{
      background:0x596a69,fogDensity:.009,
      lighting:{hemisphereColor:0xb8c8cb,hemisphereGround:0x364c3d,
        hemisphereIntensity:1.65,sunColor:0xc8d0cb,sunIntensity:1.7,
        ambientColor:0xabc3bd,ambientIntensity:1.25},
    },
    starts:[[11,24],[12,24],[13,24],[14,24]],
    npcTools:GRAVEYARD_NPC_CONFIG,
    build:buildGraveyard,
  },
  'wyrms-crossing': {
    id:'wyrms-crossing',
    name:"Wyrm's Crossing — Gates Sealed",
    subtitle:'Chionthar Bridge · tense refugee blockade · Flaming Fist garrison',
    w:16, h:28, floor:'stone', outdoor:true,
    cameraVertical:136,
    atmosphere:{background:0x263640,fogDensity:.0042},
    starts:[[6,26],[7,26],[8,26],[9,26]],
    npcTools:WYRM_NPC_CONFIG,
    build:buildWyrmsCrossing,
  },
  'elfsong-tavern': {
    id: 'elfsong-tavern',
    name: 'Elfsong Tavern — Interior Prototype',
    subtitle: 'Lower City · shared-engine demonstration · GM-editable starter scene',
    w: 16, h: 12,
    floor: 'wood',
    // Starting squares for the four party members, [column,row].
    starts: [[7,11],[8,11],[6,11],[9,11]],
    build: buildElfsongTavern,
  },
});

export function findLandmarkScene(id) {
  return Object.hasOwn(LANDMARK_SCENES,id) ? LANDMARK_SCENES[id] : null;
}
