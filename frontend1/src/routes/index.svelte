<style>
	.canvas {
		display: flex;
		flex-grow: 1;
		width: 100%;
		height: 100%;
		/* background-color: #DFDBE5; */
		/* background-position: -6px -6px; */
		/* background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); */
	}
</style>

<svelte:head>
	<title>Sapper project template</title>
</svelte:head>

<script>
	let grid = [];
	let temp = [];

	let pos = null;

	let tool = { type: 'line', start: null, mat: 1 };
	let svg;

	let transform = { zoom: 1 };

	function pointToGrid (x, y) {
		const bounds = svg.getBoundingClientRect();
		return {
			x: Math.round((x - bounds.x) / transform.zoom),
			y: Math.round((y - bounds.y) / transform.zoom),
		};
	}

	let mouseDown = false;
	function handleMove (e) {
		let { x, y } = pointToGrid(e.clientX, e.clientY);

		if (mouseDown) {
			const quantize = v => 10 * Math.floor(v / 10);
			[x, y] = [quantize(x), quantize(y)];

			if (tool.type === 'line') {
				temp = line(tool.start.x / 10, tool.start.y / 10, x / 10, y / 10)
					.map(v => ({x: v.x * 10, y: v.y * 10, mat: tool.mat }));
			} else if (tool.type === 'rect') {
				temp = rect(tool.start.x / 10, tool.start.y / 10, x / 10, y / 10)
					.map(v => ({x: v.x * 10, y: v.y * 10, mat: tool.mat }));
			}
		}
	}

	function handleMouseDown (e) {
		mouseDown = true;

		let { x, y } = pointToGrid(e.clientX, e.clientY);

		if (tool.type === 'line' || tool.type === 'rect') {
			x = 10 * Math.floor(x / 10);
			y = 10 * Math.floor(y / 10);
			tool.start = { x, y };
		}
	}

	function handleMouseUp (e) {
		mouseDown = false;
		if (tool.type === 'line' || tool.type === 'rect') {
			grid = grid.concat(temp);
			temp = [];
		}
	}

	// see https://rosettacode.org/wiki/Bitmap/Bresenham%27s_line_algorithm#C
	function line (x0, y0, x1, y1) {
		let [ dx, sx ] = [ math.abs(x1-x0), x0 < x1 ? 1 : -1 ];
		let [ dy, sy ] = [ math.abs(y1-y0), y0 < y1 ? 1 : -1 ];
		let err = (dx > dy ? dx : -dy) / 2;
		let e2 = 0;

		let line = [];
		while (true) {
			line.push({ x: x0, y: y0 });
			if (x0 === x1 && y0 === y1) return line;
			e2 = err;
			if (e2 > -dx) { err -= dy; x0 += sx; }
			if (e2 < dy) { err += dx; y0 += sy; }
		}
	}

	function rect(x0, y0, x1, y1) {
		const rect = [];

		const minx = Math.min(x0, x1);
		const miny = Math.min(y0, y1);
		const maxx = Math.max(x0, x1);
		const maxy = Math.max(y0, y1);

		for (let x = minx; x <= maxx; x++) {
			for (let y = miny; y <= maxy; y++) {
				rect.push({ x, y });
			}
		}
		return rect;
	}

	if (typeof window !== 'undefined') {
		window.line = line;
	}
</script>

<pre>{JSON.stringify(pos)}</pre>

<button on:click={() => tool.type = 'line'}>Line</button>
<button on:click={() => tool.type = 'rect'}>Rect</button>

<br />

<button on:click={() => transform.zoom *= 1.1}>Zoom In</button>
<button on:click={() => transform.zoom *= 0.9}>Zoom Out</button>

<br />

<button on:click={() => tool.mat = 1 }>Mat #1</button>
<button on:click={() => tool.mat = 2 }>Mat #2</button>
<button on:click={() => tool.mat = 3 }>Mat #3</button>

<div class="canvas" style="overflow: scroll">
	<svg
		width="{8192 * transform.zoom}"
		height="{8192 * transform.zoom}"
		viewBox="0 0 8192 8192"
		overflow="visible"
		on:mousedown={handleMouseDown}
		on:mouseup={handleMouseUp}
		on:mousemove={handleMove}
		bind:this={svg}
	>
		<defs>
			<pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
				<path d="M 10 0 L 0 0 0 10" fill="none" stroke="gray" stroke-width="0.5"/>
			</pattern>
		</defs>
		<rect x="0" y="0" width="8192" height="8192" fill="url(#smallGrid)" />


		{#each grid as cell }
			<rect x={cell.x} y={cell.y} width={10} height={10} fill="{
				cell.mat === 1 && 'red'
				|| cell.mat === 2 && 'blue'
				|| 'pink'
				}" />
		{/each}

		{#each temp as cell }
			<rect x={cell.x} y={cell.y} width={10} height={10} fill="#0f0" />
		{/each}
</div>
