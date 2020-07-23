export const TILE_TYPES = [
	{ name: 'Wall',  value: '#', variants: [
		['stone-000',       100],
		['stone-001',       10],
		['stone-002',       10],
		['stone-003',       10],
	] },
	{ name: 'Path',  value: '.', variants: [
		['cobblestone-000', 100],
		['cobblestone-001', 10],
		['cobblestone-002', 10],
	] },
	{ name: 'Water', value: 'w', variants: [['water-000',       100]] },
	{ name: 'Dirt',  value: '@', variants: [
		['dirt-000',        100],
		['dirt-001',        100],
		['dirt-002',        10],
	] },
	{ name: 'Grass', value: '"', variants: [
		['grass-001',       100],
		['grass-000',       20],
	] },
	{ name: 'Wood',  value: '&', variants: [['wood-000',        100]] },
	{ name: 'Tree',  value: '%', variants: [['tree-000',        100]] },
];

export const TILE_MAP = {};
for (const tile of TILE_TYPES) {
	TILE_MAP[tile.value] = tile;
}
