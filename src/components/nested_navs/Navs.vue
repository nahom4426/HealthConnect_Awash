<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NestedNavs from './NestedNavs.vue';

	const props = defineProps({
		nav: {
			type: Object,
			required: true
		}
	})

	const route = useRoute()
	const router = useRouter()

	const currentPath = computed(() => route.path)
	const open = ref(false)

	function checkRoute () {
		if(currentPath.value == props.nav.path || (Array.isArray(props.nav?.navs) && props.nav?.navs.find(el => el.path == currentPath.value))) {
			open.value = true
		} else {
			open.value = false
		}
	}

	onMounted(checkRoute)

	watch(currentPath, checkRoute)

	function toggle() {
		open.value = !open.value
	}
</script>
<!-- <template>
	<div class="w-full flex flex-col gap-2">
		<RouterLink v-if="nav.path" @click.stop.prevent="toggle" :to="nav.path" class="flex h-8 px-2 items-center gap-3 rounded-md p-1">
			<span class="min-w-6 flex items-center justify-center" v-html="nav.icon"></span>
			<span :title="nav.name" class="font-medium truncate flex-1">{{ nav.name }}</span>
		</RouterLink>
		<div v-else @click.stop.prevent="toggle" class="flex h-8 pl-2 items-center gap-3 cursor-pointer rounded-md p-1">
			<span class="min-w-6 flex items-center justify-center" v-html="nav.icon"></span>
			<span :title="nav.name" class="font-medium truncate flex-1">{{ nav.name }}</span>
			<button class="rounded-full">
				<svg :class="[open ? 'rotate-180' : 'rotate-0']" class="transition-all duration-200 ease-linear" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4z"/></svg>
			</button>
		</div>
		<div class="border-l border-gray-500 flex flex-col ml-4 pl-2" v-if="nav?.navs && open">
			<NestedNavs :navs="nav.navs" />
		</div>
	</div>
</template> -->