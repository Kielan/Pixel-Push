<script>
//	import './app.css';
	import { goto } from '$app/navigation';
	import './Events.js';

	Events.on("change", "open-image-browse-holder", uploadContainerInputChanged, 1);

	function uploadContainerInputChanged() {
		goto('/Editor', { replaceState: true });
	}

	export let name;
</script>

<main id="quickstart-container bg-brown">
	<div id="sp-quickstart-title">
		Quickstart
	</div>
	<div class="flex flex-1 flex-wrap content-start overflow-y-auto min-h-0">
		<button class="w-full h-12 px-6 text-indigo-100 transition-colors duration-150 bg-indigo-700 rounded-lg focus:shadow-outline hover:bg-indigo-800 cursor-pointer" onclick="document.getElementById('open-image-browse-holder').click()">
		<div class="flex items-center h-20 w-20 min-w-full uppercase rounded-lg text-lg text-center font-bold bg-brown-light cursor-pointer" style={{ backgroundColor: "#332f35" }}>
			<p>Load</p>
		</div>
		</button>
		<div class="flex items-center h-20 w-20 min-w-full uppercase rounded-lg text-lg text-center font-bold bg-brown-light cursor-pointer" style={{ backgroundColor: "#332f35" }}>
			<button class="w-full h-12 px-6 text-indigo-100 transition-colors duration-150 bg-indigo-700 rounded-lg focus:shadow-outline hover:bg-indigo-800 cursor-pointer">
				<span class="text-sm m-0 p-0">New</span>
				32x32
			</button>
		</div>
	</div>

	<input id="open-image-browse-holder" type="file" accept="image/png, image/gif, .lpe" />
</main>

<style global lang="postcss">
	@tailwind base;
	@tailwind components;
/* purgecss end ignore */
	@tailwind utilities;
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>