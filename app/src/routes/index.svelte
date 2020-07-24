<style>
</style>

<script>
    import * as uuid from 'uuid';
</script>

<div>
	<a href="/gm/{uuid.v4()}">New Game</a>
</div>

<form method="post" action="/upload">
	<input type="file" nanme="f" />
	<button>submit</button>
</form>
