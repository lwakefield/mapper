export const TILE_TYPES = [
	{ name: 'Wall',  value: '#', id: 'stone-000' },
	{ name: 'Path',  value: '.', id: 'cobblestone-000' },
	{ name: 'Water', value: 'w', id: 'water-000' },
	{ name: 'Dirt',  value: '@', id: 'dirt-000' },
	{ name: 'Grass', value: '"', id: 'grass-000' },
	{ name: 'Wood',  value: '&', id: 'wood-000' },
	{ name: 'Tree',  value: '%', id: 'tree-000' },
];

export const TILE_MAP = {};
for (const tile of TILE_TYPES) {
	TILE_MAP[tile.value] = tile;
}
