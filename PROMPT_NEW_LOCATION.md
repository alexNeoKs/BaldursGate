# Prompt for a new chat: create one Baldur's Gate V9 landmark interior

Copy the prompt below into a new ChatGPT chat **and attach Baldurs_Gate_V9_Complete.zip** (or at least `interiors/shared/engine.js`, `interiors/places/scene-registry.js`, `interiors/places/scenes/elfsong-tavern.js`, and root `main.js`). Attach screenshots or a hand sketch when available.

---

I am expanding my existing Baldur's Gate Three.js V9 project. The project already has a shared interior engine at `interiors/shared/engine.js` and a registry at `interiors/places/scene-registry.js`. I have attached the V9 source code. Please **build and deliver a new NAMED LANDMARK interior** using this exact architecture, NOT a standalone new Three.js game.

**Location name:** [e.g. Leoric's House]
**Exact landmark ID from main.js:** [e.g. leoric-house]
**Type / atmosphere:** [e.g. warm, well-kept elven cleric's residence, with subtle sacred details]
**Grid size (columns × rows):** [e.g. 16 × 12; feel free to recommend adjustments]
**Floor plan and room connections:** [e.g. front foyer, lounge, bedroom, kitchen, study; specify how rooms connect]
**Furniture and environmental details:** [list exact requirements and approximate locations]
**Special atmosphere / effects:** [e.g. candlelight, stained glass, rugs, sacred iconography]
**NPCs or enemies:** [none, or specify; do not silently add custom NPC tooling unless needed]
**Special interactions:** [describe; distinguish requested features from existing engine features]
**Player entrance / starting squares:** [e.g. four adjacent free squares by the south doorway]

**Requirements:**
1. Preserve the city map visuals, all existing labelled places, murder Scenes 1–5, the cultist panel and its cleanup/delete-by-click behavior.
2. Reuse the current V9 shared-engine camera, player character models, collapsible player panel, tactical grid, 6-square movement, obstacle/pathfinding and door collision. Do NOT duplicate this logic in the new scene file.
3. Make this interior permanent for its named landmark, accessible from the main city map's landmark detail **Enter 3D interior** button. Open in a new tab. Do NOT attach it to the Murder button or random houses.
4. Define scenery in `interiors/places/scenes/<landmark-id>.js` with `export function build<Name>(api) {...}` using only the existing builder API. Add/wire an engine capability only if the content actually requires it; explain precisely why.
5. Add its entry to `interiors/places/scene-registry.js` keyed by the exact landmark ID, and its URL to `LANDMARK_INTERIORS` in root `main.js`.
6. All major furniture must block its grid square. Build partitions using `api.architecture.partitionVertical`/`partitionHorizontal`, with specific passable door gaps and no diagonal wall crossing.
7. Return a **ready-to-upload ZIP with only modified/new files**, preserve correct repository-relative folders, and include which files I should replace. No manual code-splicing if possible.
8. Run `node --check` on every changed JavaScript file, verify import paths and registrations, and clearly state any browser-rendering limitations.
9. Include at least one direct test URL like `interiors/places/index.html?place=<landmark-id>`.

Use the attached V9 source as the source of truth rather than inventing function names or restructuring the project. If something is unsupported in V9, clearly distinguish a requested extension from already working features. Build the scene and supply the files rather than only giving advice or pseudocode.

---

## Example location briefs

**Elfsong Tavern:** A sprawling two-floor tavern. Ground floor common hall with a bar, kitchen, stage, tables, staircase; upstairs guest rooms. This requires adding multi-floor switching if the V9 shared engine does not yet provide it.

**Leoric's House:** A medium private townhouse with furnished living room, library/study, bedroom and Selûne shrine; warm wood, carefully organized belongings, no permanent hostile NPCs.

**Flaming Fist Barracks:** A large stone compound interior with entrance guard post, armory, bunks, office, holding cells and navigable corridors; animated patrols would require an NPC extension.

**Sorcerous Sundries:** Arcane shop with glowing shelves, magical objects, spellbooks, counters and testing circle; support optional interactive prop descriptions after explicit implementation.
