<script setup>
import DrawerButtonParent from "@/components/drawer_buttons/DrawerButtonParent.vue";
import { useAuthStore } from "@/stores/auth";
import imageSrc from "@/assets/img/profile.png";
import { computed } from "vue";

const props = defineProps({
  navs: { type: Array, default: () => [] },
  collapsed: { type: Boolean, default: false },
});

const auth = useAuthStore();

const profilePicture = computed(() => {
  const data = auth.auth?.user?.imageData || auth.auth?.user?.image || null;
  if (!data) return imageSrc;
  if (typeof data === "string" && data.startsWith("data:image/")) return data;
  return `data:image/png;base64,${data}`;
});
</script>

<template>
  <aside class="sidebar flex flex-col h-full select-none">

    <!-- ── Logo Header ── -->
    <div class="sidebar-logo flex items-center gap-3 px-5 py-4 flex-shrink-0">
      <div class="logo-icon flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 flex-shrink-0">
        <img src="/src/assets/img/letter-logo.png" alt="Awash" class="h-6 w-auto brightness-0 invert" />
      </div>
      <div v-if="!collapsed" class="flex flex-col leading-tight overflow-hidden">
        <span class="text-white font-bold text-sm tracking-wide truncate">Awash Insurance</span>
        <span class="text-white/40 text-[10px] font-medium uppercase tracking-widest">Portal</span>
      </div>
    </div>

    <div class="sidebar-divider"></div>

    <!-- ── Navigation ── -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 sidebar-scroll">
      <DrawerButtonParent
        v-for="nav in navs"
        :key="nav.name || nav.path"
        :navs="nav"
        :collapsed="collapsed"
      />
    </nav>

    <div class="sidebar-divider"></div>

    <!-- ── User Footer ── -->
    <div v-if="!collapsed" class="flex items-center gap-3 px-4 py-3.5 flex-shrink-0">
      <div class="w-8 h-8 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
        <img :src="profilePicture" alt="avatar" class="w-full h-full object-cover" />
      </div>
      <div class="flex flex-col leading-tight min-w-0">
        <span class="text-white/90 text-xs font-semibold truncate">
          {{ (auth.auth?.user?.firstName || '') + ' ' + (auth.auth?.user?.fatherName || '') || 'User' }}
        </span>
        <span class="text-white/40 text-[10px] truncate">{{ auth.auth?.user?.roleName || 'Admin' }}</span>
      </div>
    </div>
    <div v-else class="flex justify-center py-3 flex-shrink-0">
      <div class="w-8 h-8 rounded-full overflow-hidden border border-white/20">
        <img :src="profilePicture" alt="avatar" class="w-full h-full object-cover" />
      </div>
    </div>

  </aside>
</template>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 55%, #0f172a 100%);
  border-right: 1px solid rgba(255,255,255,0.05);
  width: 100%;
  height: 100%;
}

.sidebar-logo {
  background: linear-gradient(135deg, rgba(30,64,175,0.35) 0%, rgba(14,165,233,0.12) 100%);
  border-bottom: 1px solid rgba(30,64,175,0.2);
  min-height: 4rem;
}

.sidebar-divider {
  height: 1px;
  background: rgba(255,255,255,0.06);
  flex-shrink: 0;
}

.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}
.sidebar-scroll::-webkit-scrollbar { width: 3px; }
.sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
.sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
</style>
