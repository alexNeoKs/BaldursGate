// Starter prototype of Elfsong Tavern; replace this builder with detailed custom content.
// All coordinates are integers: columns 0..w-1; rows 0..h-1.
// This module ONLY defines the contents. It never creates a renderer or movement system.
export function buildElfsongTavern(api) {
  const { furniture: f, architecture: a, decoration: d, materials: M } = api;
  // Two rooms on the north side, with two open doors leading into the common room.
  a.partitionHorizontal(4, [3, 11], 3.5);
  a.partitionVertical(8, [0,1,2,3], 3.5);

  // Common hall, with wide spaces between interactive pieces.
  d.rug(7,8,4,2,M.rugAlt);
  for (const [c,r] of [[3,6],[7,6],[11,6],[3,9],[11,9]]) {
    f.table(c,r);
    f.chair(c,r+1,0);
  }
  // Northern private room and kitchen/bar store.
  f.bed(2,1);
  f.wardrobe(0,2);
  f.chest(5,1);
  for(const [c,r] of [[10,1],[12,1],[14,1]]) f.barrel(c,r);
  f.cupboard(10,3);
  f.bookshelf(14,3);
  d.candles(8,8);
  d.candles(4,1);
  a.addLight('warm',8,5,8,1.8);
}
