<script>
	import Nav from '../components/Nav.svelte';

	export let segment;
</script>

<style>
	main {
		position: relative;
		background-color: white;
		box-sizing: border-box;
		padding: 20px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
</style>

<Nav {segment} />

<main>
	<slot></slot>
</main>
