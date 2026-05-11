<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import ProfileForm from "../components/ProfileForm.vue";
import SecurityForm from "../components/SecurityForm.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { updateProfileData, uploadProfilePicture } from "../api/profileApi";
import { toasted } from "@/utils/utils";
import { useForm } from "@/components/new_form_builder/useForm";
import imageSrc from '@/assets/img/profile.png';

const authStore = useAuthStore();
const api = useApiRequest();
const profileApi = useApiRequest();

const profilePicture = ref(null);

function processProfilePicture() {
  const raw = authStore.imageData || authStore.auth?.imageData || null;
  if (!raw) { profilePicture.value = null; return; }
  profilePicture.value = raw.startsWith("data:image/") ? raw : `data:image/png;base64,${raw}`;
}
processProfilePicture();

const avatarSrc = computed(() => profilePicture.value || imageSrc);

const u = computed(() => authStore.auth?.user ?? authStore.auth ?? {});

const userName = computed(() => {
  return [u.value?.firstName, u.value?.fatherName, u.value?.grandFatherName].filter(Boolean).join(' ') || 'User';
});
const initials = computed(() => {
  const parts = [u.value?.firstName, u.value?.fatherName].filter(Boolean);
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2) || 'U';
});
const userEmail  = computed(() => u.value?.email || '');
const userRole   = computed(() => u.value?.roleName || 'Admin');
const userPhone  = computed(() => u.value?.mobilePhone || '—');
const userGender = computed(() => u.value?.gender || '—');

const activeTab = ref('profile');
const tabs = [
  { id: 'profile',  label: 'Profile Info', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>` },
  { id: 'security', label: 'Security',     icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>` },
];

const fileInput = ref(null);

function triggerFileInput() { fileInput.value?.click(); }

function handleFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { toasted(false, "Please select a valid image file."); return; }
  const formData = new FormData();
  formData.append("profilePicture", file);
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64Image = e.target.result;
    profileApi.send(
      () => uploadProfilePicture(formData),
      (res) => {
        if (res.success) {
          profilePicture.value = base64Image;
          toasted(true, "Profile picture updated successfully!");
        } else {
          toasted(false, res.error || "Failed to update profile picture.");
        }
      }
    );
  };
  reader.onerror = () => { toasted(false, "Error reading image file."); };
  reader.readAsDataURL(file);
}

const { submit } = useForm('ProfileForm');

function handleUpdateProfile({ values }) {
  const roleUuid = u.value?.roleUuid || u.value?.roleName;
  const payload = {
    email: values?.email ?? u.value?.email,
    title: u.value?.title,
    firstName: values?.firstName,
    fatherName: values?.fatherName,
    grandFatherName: values?.grandFatherName,
    mobilePhone: values?.mobilePhone ?? values?.phone,
    userStatus: 'ACTIVE',
    roleUuid,
    gender: typeof values?.gender === 'string' ? values.gender.toLowerCase() : values?.gender,
  };
  api.send(() => updateProfileData(u.value?.userUuid, payload), res => {
    toasted(res.success, 'Profile Updated Successfully', res.error);
  });
}
</script>

<template>
  <div class="pf-root">

    <!-- ══ COVER BANNER ══ -->
    <div class="pf-cover">
      <div class="pf-cover-orb pf-orb1"></div>
      <div class="pf-cover-orb pf-orb2"></div>
      <div class="pf-cover-mesh"></div>
    </div>

    <!-- ══ MAIN LAYOUT ══ -->
    <div class="pf-layout">

      <!-- ── LEFT SIDEBAR ── -->
      <aside class="pf-sidebar">

        <!-- Avatar card -->
        <div class="pf-avatar-card">
          <div class="pf-avatar-ring">
            <img v-if="profilePicture" :src="avatarSrc" alt="avatar" class="pf-avatar-img" />
            <div v-else class="pf-avatar-initials">{{ initials }}</div>
            <span class="pf-avatar-status"></span>
          </div>

          <div class="pf-user-meta">
            <h2 class="pf-user-name">{{ userName }}</h2>
            <span class="pf-user-role">{{ userRole }}</span>
          </div>

          <div class="pf-meta-grid">
            <div class="pf-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pf-meta-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              <span class="pf-meta-val">{{ userEmail || '—' }}</span>
            </div>
            <div class="pf-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pf-meta-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              <span class="pf-meta-val">{{ userPhone }}</span>
            </div>
            <div class="pf-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pf-meta-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              <span class="pf-meta-val pf-meta-capitalize">{{ userGender }}</span>
            </div>
          </div>

          <!-- Hidden file input -->
          <input ref="fileInput" type="file" accept="image/*" class="pf-hidden" @change="handleFileChange" />

          <button class="pf-upload-btn" @click="triggerFileInput" :disabled="profileApi.pending.value">
            <svg v-if="profileApi.pending.value" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pf-spin" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            {{ profileApi.pending.value ? 'Uploading…' : 'Change Photo' }}
          </button>
        </div>

        <!-- Stats card -->
        <div class="pf-stats-card">
          <div class="pf-stat">
            <div class="pf-stat-icon pf-stat-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div>
              <div class="pf-stat-val">142</div>
              <div class="pf-stat-lbl">Policies</div>
            </div>
          </div>
          <div class="pf-stat-divider"></div>
          <div class="pf-stat">
            <div class="pf-stat-icon pf-stat-emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <div class="pf-stat-val">38</div>
              <div class="pf-stat-lbl">Claims</div>
            </div>
          </div>
          <div class="pf-stat-divider"></div>
          <div class="pf-stat">
            <div class="pf-stat-icon pf-stat-violet">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
            </div>
            <div>
              <div class="pf-stat-val">4.9</div>
              <div class="pf-stat-lbl">Rating</div>
            </div>
          </div>
        </div>

      </aside>

      <!-- ── MAIN CONTENT ── -->
      <div class="pf-main">

        <!-- Panel with tabs inside -->
        <div class="pf-panel">

          <!-- Tab bar header -->
          <div class="pf-panel-tabbar">
            <div class="pf-tabs">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                class="pf-tab"
                :class="{ 'pf-tab-active': activeTab === tab.id }"
                @click="activeTab = tab.id"
              >
                <span class="pf-tab-icon" v-html="tab.icon"></span>
                {{ tab.label }}
              </button>
            </div>
            <button
              v-if="activeTab === 'profile'"
              class="pf-save-btn"
              :disabled="api.pending.value"
              @click="submit(handleUpdateProfile)"
            >
              <svg v-if="api.pending.value" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pf-spin" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              {{ api.pending.value ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>

          <!-- Profile Info Tab -->
          <div v-if="activeTab === 'profile'" class="pf-form-body">
            <ProfileForm />
          </div>

          <!-- Security Tab -->
          <div v-if="activeTab === 'security'" class="pf-form-body">
            <SecurityForm />
          </div>

        </div>

        <!-- Account badge row -->
        <div class="pf-badges-row">
          <div class="pf-badge pf-badge-green">
            <span class="pf-badge-dot"></span>
            Account Active
          </div>
          <div class="pf-badge pf-badge-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            {{ userRole }}
          </div>
          <div class="pf-badge pf-badge-slate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Member since 2024
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Root ── */
.pf-root {
  min-height: 100vh;
  background: var(--bg-color);
  display: flex; flex-direction: column;
  font-family: 'Inter', sans-serif;
}

/* ── Cover banner ── */
.pf-cover {
  position: relative;
  height: 220px;
  background: linear-gradient(135deg, #001a3d 0%, #003E7E 45%, #1A5A9A 75%, #0c4a6e 100%);
  overflow: hidden;
  flex-shrink: 0;
  z-index: 0;
}
.pf-cover-orb {
  position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none;
}
.pf-orb1 {
  width: 480px; height: 480px;
  background: radial-gradient(circle, rgba(243,146,0,0.35) 0%, transparent 65%);
  top: -160px; left: -60px;
  animation: pfOrb 16s ease-in-out infinite;
}
.pf-orb2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(56,189,248,0.3) 0%, transparent 65%);
  bottom: -160px; right: 8%;
  animation: pfOrb 22s ease-in-out infinite reverse;
}
@keyframes pfOrb {
  0%,100% { transform: translate(0,0); }
  50%      { transform: translate(25px,-15px); }
}
.pf-cover-mesh {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
  background-size: 28px 28px;
}
.pf-cover::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.15) 100%);
}

/* ── Layout ── */
.pf-layout {
  display: flex;
  gap: 1.5rem;
  padding: 0 2rem 3rem;
  max-width: 1200px;
  width: 100%;
  margin: -64px auto 0;
  align-items: flex-start;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

/* ── Sidebar ── */
.pf-sidebar {
  width: 280px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 1rem;
}

.pf-avatar-card {
  background: var(--surface);
  border-radius: 1.25rem;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  padding: 1.75rem 1.5rem 1.5rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.875rem;
}

.pf-avatar-ring {
  position: relative;
  width: 96px; height: 96px; border-radius: 50%;
  border: 4px solid #fff;
  box-shadow: 0 0 0 3px var(--primary-light), 0 8px 24px var(--shadow-primary);
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--primary-dark), var(--primary-light));
}
.pf-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pf-avatar-initials {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; font-weight: 900; color: #fff;
}
.pf-avatar-status {
  position: absolute; bottom: 4px; right: 4px;
  width: 14px; height: 14px; border-radius: 50%;
  background: #34d399; border: 2.5px solid #fff;
  box-shadow: 0 0 6px #34d399;
}

.pf-user-meta { text-align: center; }
.pf-user-name { font-size: 1rem; font-weight: 800; color: var(--text-main); line-height: 1.3; font-family: 'Outfit', sans-serif; }
.pf-user-role {
  display: inline-block; margin-top: 0.3rem;
  padding: 0.15rem 0.75rem; border-radius: 9999px;
  background: rgba(0,62,126,0.08); color: var(--primary);
  font-size: 0.68rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em;
  font-family: 'Outfit', sans-serif;
}

.pf-meta-grid { width: 100%; display: flex; flex-direction: column; gap: 0.5rem; }
.pf-meta-item {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  background: #f8fafc; border-radius: 0.5rem;
  border: 1px solid #f1f5f9;
}
.pf-meta-icon { width: 14px; height: 14px; flex-shrink: 0; color: #64748b; }
.pf-meta-val { font-size: 0.75rem; font-weight: 500; color: var(--text-main); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pf-meta-capitalize { text-transform: capitalize; }

.pf-hidden { display: none; }
.pf-upload-btn {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  width: 100%; padding: 0.6rem 1rem;
  border-radius: 0.625rem; border: none;
  background: linear-gradient(135deg, var(--primary-dark), var(--primary));
  color: #fff; font-size: 0.8rem; font-weight: 700;
  cursor: pointer; transition: opacity 0.15s, transform 0.15s;
  box-shadow: var(--shadow-primary);
  font-family: 'Inter', sans-serif;
}
.pf-upload-btn:hover { opacity: 0.9; transform: translateY(-1px); }
.pf-upload-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* Stats card */
.pf-stats-card {
  background: var(--surface);
  border-radius: 1.25rem;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  padding: 1rem;
  display: flex; align-items: center; justify-content: space-around;
}
.pf-stat { display: flex; align-items: center; gap: 0.6rem; }
.pf-stat-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.pf-stat-blue    { background: rgba(0,62,126,0.08);  color: var(--primary); }
.pf-stat-emerald { background: rgba(16,185,129,0.1); color: var(--success); }
.pf-stat-violet  { background: rgba(243,146,0,0.1);  color: var(--accent); }
.pf-stat-val  { font-size: 1.1rem; font-weight: 900; color: var(--text-main); line-height: 1; font-family: 'Outfit', sans-serif; }
.pf-stat-lbl  { font-size: 0.68rem; font-weight: 600; color: var(--text-muted); }
.pf-stat-divider { width: 1px; height: 36px; background: var(--border); }

/* ── Main content ── */
.pf-main {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 1rem;
}

/* Tabs */
.pf-panel-tabbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(135deg, var(--bg-color), rgba(0,62,126,0.04));
  border-radius: 1.25rem 1.25rem 0 0;
  gap: 1rem; flex-wrap: wrap;
}
.pf-tabs {
  display: flex; gap: 0.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.875rem;
  padding: 0.3rem;
  box-shadow: var(--shadow-sm);
}
.pf-tab {
  display: flex; align-items: center; gap: 0.45rem;
  padding: 0.5rem 1.125rem;
  border-radius: 0.625rem; border: none; background: transparent;
  font-size: 0.8rem; font-weight: 600; color: var(--text-muted);
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
  font-family: 'Inter', sans-serif;
}
.pf-tab:hover { color: var(--text-main); background: var(--bg-color); }
.pf-tab-active { background: var(--primary); color: #fff; box-shadow: var(--shadow-primary); }
.pf-tab-icon { display: flex; width: 15px; height: 15px; }
.pf-tab-icon :deep(svg) { width: 15px; height: 15px; }

/* Panel */
.pf-panel {
  background: var(--surface);
  border-radius: 1.25rem;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  flex: 1;
}
.pf-panel-title { font-size: 0.95rem; font-weight: 800; color: var(--text-main); font-family: 'Outfit', sans-serif; }
.pf-panel-sub   { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem; }

.pf-save-btn {
  display: flex; align-items: center; gap: 0.45rem;
  padding: 0.5rem 1.125rem;
  border-radius: 0.625rem; border: none;
  background: var(--primary);
  color: #fff; font-size: 0.8rem; font-weight: 700;
  cursor: pointer; transition: all 0.2s ease;
  box-shadow: var(--shadow-primary);
  white-space: nowrap;
  font-family: 'Inter', sans-serif;
}
.pf-save-btn:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: var(--shadow-primary); }
.pf-save-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.pf-form-body { padding: 1.5rem; }

/* Badges row */
.pf-badges-row {
  display: flex; gap: 0.625rem; flex-wrap: wrap;
}
.pf-badge {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.3rem 0.75rem; border-radius: 9999px;
  font-size: 0.7rem; font-weight: 700;
}
.pf-badge-green  { background: rgba(16,185,129,0.1);  color: var(--success); border: 1px solid rgba(16,185,129,0.2); }
.pf-badge-blue   { background: rgba(0,62,126,0.08);   color: var(--primary); border: 1px solid rgba(0,62,126,0.15); }
.pf-badge-slate  { background: var(--bg-color); color: var(--text-muted); border: 1px solid var(--border); }
.pf-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; animation: pfPulse 1.8s ease-in-out infinite; }
@keyframes pfPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* Spinner */
@keyframes pfSpin { to { transform: rotate(360deg); } }
.pf-spin { animation: pfSpin 0.8s linear infinite; }

/* ── Responsive ── */
@media (max-width: 900px) {
  .pf-layout {
    flex-direction: column;
    padding: 0 1rem 2rem;
    margin-top: -40px;
  }
  .pf-sidebar { width: 100%; }
  .pf-stats-card { justify-content: space-evenly; }
  .pf-avatar-card { flex-direction: row; flex-wrap: wrap; text-align: left; align-items: flex-start; }
  .pf-avatar-ring { width: 72px; height: 72px; }
  .pf-user-meta { text-align: left; }
}
@media (max-width: 580px) {
  .pf-cover { height: 140px; }
  .pf-layout { margin-top: -28px; padding: 0 0.75rem 2rem; }
  .pf-avatar-card { flex-direction: column; align-items: center; text-align: center; }
  .pf-user-meta { text-align: center; }
  .pf-panel-header { flex-direction: column; align-items: flex-start; }
}
</style>
