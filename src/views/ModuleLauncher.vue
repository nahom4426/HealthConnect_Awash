<script setup>
import { useRouter } from 'vue-router';
import { useModuleStore, MODULES } from '@/stores/moduleStore';
import { useAuthStore } from '@/stores/auth';
import { useLanguageStore } from '@/stores/languageStore';
import { computed, ref } from 'vue';
import imageSrc from '@/assets/img/profile.png';
import eicLogo from '@/assets/img/standard_icon.png';

const router = useRouter();
const moduleStore = useModuleStore();
const authStore = useAuthStore();
const langStore = useLanguageStore();

const u = computed(() => authStore.auth?.user ?? authStore.auth ?? {});
const userName = computed(() =>
  [u.value?.firstName, u.value?.fatherName].filter(Boolean).join(' ') || 'Admin'
);
const userRole = computed(() => u.value?.roleName || 'SUPER ADMIN');
const profilePicture = computed(() => {
  const data = authStore.imageData || u.value?.imageData || u.value?.image || null;
  if (!data) return imageSrc;
  if (typeof data === 'string' && data.startsWith('data:image/')) return data;
  return `data:image/png;base64,${data}`;
});

const showUserMenu = ref(false);

// Matching card theme colors with standalone larger icons (no inner box wrapper)
const cardThemeMap = {
  motor: {
    cardBg: 'bg-blue-50',
    border: 'border-blue-300/80 hover:border-blue-500 ring-1 ring-blue-100',
    iconColor: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    actionText: 'text-blue-600 group-hover:text-blue-700',
  },
  fire: {
    cardBg: 'bg-amber-50',
    border: 'border-amber-200/70 hover:border-amber-400',
    iconColor: 'text-amber-600',
    badge: 'bg-emerald-100 text-emerald-700',
    actionText: 'text-amber-600 group-hover:text-amber-700',
  },
  health: {
    cardBg: 'bg-green-50',
    border: 'border-emerald-200/70 hover:border-emerald-400',
    iconColor: 'text-emerald-600',
    badge: 'bg-amber-100 text-amber-700',
    actionText: 'text-emerald-600 group-hover:text-emerald-700',
  },
  marine: {
    cardBg: 'bg-sky-50',
    border: 'border-sky-200/70 hover:border-sky-400',
    iconColor: 'text-sky-600',
    badge: 'bg-slate-100 text-slate-600',
    actionText: 'text-sky-600 group-hover:text-sky-700',
  },
  life: {
    cardBg: 'bg-rose-50',
    border: 'border-rose-200/70 hover:border-rose-400',
    iconColor: 'text-rose-600',
    badge: 'bg-slate-100 text-slate-600',
    actionText: 'text-rose-600 group-hover:text-rose-700',
  },
  engineering: {
    cardBg: 'bg-purple-50',
    border: 'border-purple-200/70 hover:border-purple-400',
    iconColor: 'text-purple-600',
    badge: 'bg-slate-100 text-slate-600',
    actionText: 'text-purple-600 group-hover:text-purple-700',
  },
  liability: {
    cardBg: 'bg-teal-50',
    border: 'border-teal-200/70 hover:border-teal-400',
    iconColor: 'text-teal-600',
    badge: 'bg-slate-100 text-slate-600',
    actionText: 'text-teal-600 group-hover:text-teal-700',
  },
  burglary: {
    cardBg: 'bg-violet-50',
    border: 'border-indigo-200/70 hover:border-indigo-400',
    iconColor: 'text-indigo-600',
    badge: 'bg-emerald-100 text-emerald-700',
    actionText: 'text-indigo-600 group-hover:text-indigo-700',
  },
};

function selectModule(mod) {
  moduleStore.selectModule(mod.id);
  router.push(mod.dashboardPath);
}

function logout() { showUserMenu.value = false; authStore.logout(); }
function goProfile() { showUserMenu.value = false; router.push('/profile'); }
</script>

<template>
  <div class="min-h-screen bg-surface-muted/60 text-ink font-sans flex flex-col">
    
    <!-- Top Navigation Bar -->
    <header class="bg-white border-b border-line/80 px-8 py-3.5 shadow-2xs sticky top-0 z-30">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        <!-- Left: Brand Logo -->
        <div class="flex items-center gap-3 shrink-0">
          <img :src="eicLogo" alt="Standard Insurance S.C." class="h-9 w-auto object-contain shrink-0" />
          <div class="flex flex-col text-left justify-center items-start shrink-0">
            <h1 class="text-sm font-extrabold text-ink leading-none whitespace-nowrap">Standard Insurance S.C.</h1>
            <p class="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mt-1 leading-none whitespace-nowrap pl-[7px]">YOUR TRUST, OUR STANDARD</p>
          </div>
        </div>

        <!-- Right Header Actions -->
        <div class="flex items-center gap-3">
          
          <!-- Language Switcher -->
          <button 
            @click.stop="langStore.toggleLanguage()"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-raised hover:bg-line text-ink-muted transition-colors border border-line/80"
          >
            {{ langStore.isAmharic ? 'English' : 'አማርኛ' }}
          </button>

          <!-- User Profile Chip -->
          <div class="relative">
            <button 
              @click.stop="showUserMenu = !showUserMenu"
              class="flex items-center gap-2.5 px-3 py-1 rounded-full bg-surface-raised hover:bg-line border border-line/80 transition-colors"
            >
              <img :src="profilePicture" class="w-6 h-6 rounded-full object-cover border-2 border-amber-500" />
              <div class="text-left leading-tight hidden sm:block">
                <span class="text-xs font-bold text-ink block">{{ userName }}</span>
                <span class="text-[9px] font-bold text-amber-600 uppercase">{{ userRole }}</span>
              </div>
            </button>

            <!-- Dropdown Menu -->
            <div v-if="showUserMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-line py-2 z-50">
              <div class="px-4 py-2 border-b border-line">
                <p class="text-xs font-bold text-ink">{{ userName }}</p>
                <p class="text-[10px] text-ink-subtle font-medium">{{ userRole }}</p>
              </div>
              <button @click="goProfile" class="w-full text-left px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-muted">
                My Profile
              </button>
              <button @click="logout" class="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                Logout
              </button>
            </div>
          </div>

          <!-- Red Logout Button -->
          <button 
            @click="logout" 
            class="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors hidden sm:flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="max-w-7xl w-full mx-auto px-8 py-8 flex-1">
      
      <!-- Welcome Section -->
      <div class="mb-8 space-y-1.5">
        <h2 class="text-2xl sm:text-[1.85rem] font-black text-ink tracking-tight leading-tight">Welcome, {{ userName }}</h2>
        <p class="text-sm sm:text-[0.92rem] font-medium text-ink-subtle leading-relaxed">Select an insurance module to manage rate configurations, underwriting workflows, and claims processing.</p>
      </div>

      <!-- Module Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="mod in MODULES"
          :key="mod.id"
          @click="selectModule(mod)"
          :class="[
            'group rounded-2xl p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md',
            cardThemeMap[mod.id]?.cardBg || 'bg-surface-muted',
            cardThemeMap[mod.id]?.border || 'border-line'
          ]"
        >
          <div>
            <!-- Top Row: Direct Icon (No Box Wrapper) + Badge -->
            <div class="flex items-center justify-between mb-5">
              <div 
                :class="[
                  'w-8 h-8 transition-transform group-hover:scale-110 flex items-center justify-center',
                  cardThemeMap[mod.id]?.iconColor || 'text-ink-muted'
                ]"
              >
                <div class="w-full h-full [&>svg]:w-full [&>svg]:h-full" v-html="mod.icon"></div>
              </div>

              <span 
                v-if="mod.badge"
                :class="[
                  'px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider',
                  cardThemeMap[mod.id]?.badge || 'bg-surface-raised text-ink-muted'
                ]"
              >
                {{ mod.badge }}
              </span>
            </div>

            <!-- Title & Description -->
            <h3 class="text-[0.95rem] font-extrabold text-ink mb-1.5 tracking-tight">
              {{ langStore.t('modules.' + mod.id) }}
            </h3>

            <p class="text-xs sm:text-[0.82rem] text-ink-subtle font-medium leading-relaxed line-clamp-3 mb-6">
              {{ langStore.t('modules.' + mod.id + 'Desc') }}
            </p>
          </div>

          <!-- Bottom Action Row -->
          <div class="pt-3.5 border-t border-line/60 flex items-center justify-between text-xs">
            <span class="text-[10px] font-semibold text-ink-subtle uppercase tracking-wide">
              Module v3.2
            </span>
            <span 
              :class="[
                'font-extrabold text-[0.8rem] inline-flex items-center gap-1 transition-transform group-hover:translate-x-0.5',
                cardThemeMap[mod.id]?.actionText || 'text-blue-600'
              ]"
            >
              Open →
            </span>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
/* Clean Styling matching Proposal Form Builder screenshot */
</style>