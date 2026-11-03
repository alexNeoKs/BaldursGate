# Baldur's Gate V9 — shared interior engine

## Status

V9 preserves the V8 city map geometry, V7 landmark labels, and the V8.1 murder interior scenes, including cultist deletion and label cleanup. **Both** murder scenes and named interiors now use `interiors/shared/engine.js` as the actual renderer, grid, miniature, and movement engine. No npm build, package manager or server-side code is required. Three.js loads from jsDelivr.

The newly connected Elfsong Tavern is intentionally a **prototype**, not the final tavern design. Other landmarks remain unimplemented until their scene modules and registry routes are added.

## Files

```
index.html
main.js                      city map; LANDMARK_INTERIORS URL mapping
style.css
assets/README.md             retain your original reference map asset
interiors/
  murder.html                original V8 murder scene URL works
  interior.css               shared HUD styles
  interior-main.js           compatibility import to the V9 engine
  shared/
    engine.js                ONE runtime for murder and landmark interiors
  places/
    index.html               named landmark entry page
    scene-registry.js        keyed by exact LANDMARKS.id
    scenes/
      elfsong-tavern.js      example scene module
      TEMPLATE-NEW-LOCATION.js
PROMPT_NEW_LOCATION.md       copy/paste prompt for creating scenes in a new chat
```

## Upgrade an existing V8.1 GitHub Pages repository

1. Back up your current repository or commit before replacement.
2. Copy the **root** `index.html`, `main.js`, and `style.css` files over their existing versions. Keep the existing `assets/` folder and `assets/baldurs-gate-reference.jpg` if present.
3. Upload the full `interiors/` folder and its nested subfolders. In particular, `interiors/shared/engine.js` and `interiors/places/scene-registry.js` must remain at those exact paths.
4. Do not upload the *Baldurs_Gate_V9* enclosing folder into the repo root: `index.html` should stay at the root.
5. Commit/push; refresh the Pages website with Ctrl+Shift+R.

## Quick tests

From the folder containing `index.html`:

```
python -m http.server 8000
```

Browse:
- `http://localhost:8000/` — city map; select **Elfsong Tavern** in Places of Interest and click **Enter 3D interior**.
- `http://localhost:8000/interiors/murder.html?scene=1` — old murder Scene 1.
- `http://localhost:8000/interiors/murder.html?scene=5` — cultist safehouse, spawn/clear/remove functionality.
- `http://localhost:8000/interiors/places/index.html?place=elfsong-tavern` — named scene using the same engine.

Do **not** launch the HTML directly with `file://`; ES modules require a local web server or GitHub Pages.

## How to add a named location (3 edits)

1. Create `interiors/places/scenes/<LANDMARK_ID>.js`. Copy `TEMPLATE-NEW-LOCATION.js`, export a `build<PlaceName>(api)` function, and use the API described below. Don't copy or initialize the Three.js engine.
2. Add an import and a matching registry entry in `interiors/places/scene-registry.js`. Set `id` equal to the existing `LANDMARKS.id` in root `main.js`; give `name`, `subtitle`, `w`, `h`, `starts`, and `build`.
3. Add a matching key-value to `LANDMARK_INTERIORS` near the top of root `main.js`, e.g.:

```
'leoric-house': './interiors/places/index.html?place=leoric-house',
```

These are all you need. The city itself doesn't need new geometry. All named interiors open independently of Crime Events.

## Scene builder API

`buildScene(api)` receives:

- `api.dimensions`: `{columns, rows, cellSize}` where `cellSize=4` world units.
- `api.materials`: named ready-to-use material palette, e.g. `M.wood`, `M.rug`, `M.bronze`.
- `api.furniture`: `bed(c,r)`, `wardrobe(c,r,rotation)`, `chest(c,r)`, `table(c,r)`, `chair(c,r,rotation,locked=true)`, `bookshelf(c,r)`, `cupboard(c,r)`, `barrel(c,r)`. Furniture registers blocked squares automatically.
- `api.decoration`: `rug(c,r,wInCells,hInCells,material)`, `candles(c,r)`, `bone(c,r,count)`, `skull(c,r,scale,material)`, `stain(c,r,size,material)`, `splash(c,r,count)`, `corpse(c,r,opts)`, `wallSigil(type,side,shift)`, `floorSigil(type,c,r,size)`, `brokenDebris(c,r,count)`.
- `api.architecture.partitionVertical(boundaryColumn, openDoorRows, wallHeight=3.5, span=null)`: creates walls between columns `boundaryColumn-1` and `boundaryColumn`, keeping openings at `openDoorRows`. Example `partitionVertical(6, [2,7])`. Optional span `{start:0, stop:5}` limits the wall to certain rows.
- `api.architecture.partitionHorizontal(boundaryRow, openDoorColumns, wallHeight=3.5, span=null)`: same for a wall between rows `boundaryRow-1` and `boundaryRow`.
- `api.architecture.block(c,r)` to register an obstruction. Walls/doors register collision edges automatically.
- `api.architecture.addLight('warm'|'red'|'blue', c, r, intensity)` to add lighting.
- `api.geometry.center(c,r)` returns a fresh Three.js Vector3 for a cell.
- `api.geometry.material(hex, extra={})` creates a MeshStandardMaterial.
- `api.geometry.boxAt(c,r,w,h,d,{y,color,blocking}={})`, `sphereAt(c,r,radius,options)`, `cylinderAt(c,r,topRadius,bottomRadius,height,options)` place custom assets; options can set `blocking:true`. Return the created mesh so you can adjust its rotation.

Coordinates are zero-based. Columns increase left-to-right and rows north-to-south (as the isometric room is built). The movement engine uses 6 steps per move with eight directions, pathfinding, occupied-cell checks and corner-cutting prevention. Both kinds of room use the same player miniatures and HUD.

Existing murder/cultist editor controls are enabled only for murder Scene 5. New named locations never randomly spawn through the crime tools.

## Limits & next work

V9 establishes the shared architecture, not finalized artwork for every landmark. New scene scripts can create geometry, furniture and lighting. A generic scripted-interaction/NPC-dialogue editor, stair navigation, save persistence and scene-to-scene doors are **not included yet**. Avoid claiming these are implemented until deliberately added.

Browser rendering could not be verified in this execution environment because local URLs were blocked by the browser runtime. Syntax and package/file-link integrity are checked, but test rendering on your local server/GitHub Pages.
