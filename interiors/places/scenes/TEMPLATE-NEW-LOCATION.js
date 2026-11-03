// Copy this file to <landmark-id>.js and rename the exported function.
// Each scene receives the same engine API. No Three.js renderer or controls here.
export function buildNewLocation(api) {
  const { furniture: f, architecture: a, decoration: d, materials: M } = api;
  // Grid positions: c = 0 .. w-1, r = 0 .. h-1.
  // Examples (uncomment and customize):
  // a.partitionVertical(6, [2, 7]);  // wall between column 5 and 6; doors at rows 2 and 7
  // a.partitionHorizontal(5, [3]);   // wall between row 4 and 5; door at col 3
  // f.table(3, 4);
  // f.chair(3, 5);
  // f.wardrobe(1, 1);
  // f.bookshelf(8, 1);
  // f.barrel(9, 6);
  // d.rug(5, 5, 2, 2, M.rugAlt);
  // a.addLight('warm', 5, 5, 2);
}
