<script setup>
import { computed, nextTick, ref, useAttrs, useSlots } from 'vue';
import InputParent from "../new_form_builder/InputParent.vue";
import InputLayout from "./NewInputLayout.vue";

const props = defineProps({
  focus: {
    type: Boolean,
    default: false
  },
})

const attrs = useAttrs();
const slots = useSlots();

const isDate = computed(() => attrs?.attributes?.type === 'date');
const hasRightSlot = computed(() => !!slots.right);

const nativeDateEl = ref(null);
const displayValue = ref('');
const displayInputEl = ref(null);

const displayMask = 'MM/DD/YYYY';

function ghostFrom(displayStr) {
  const typed = String(displayStr || '');
  let full = '';

  for (let i = 0; i < displayMask.length; i++) {
    const m = displayMask[i];
    const t = typed[i];

    if (t) {
      full += t;
    } else {
      full += m;
    }
  }

  return {
    typed,
    full,
  };
}

function formatToDisplay(iso) {
  if (!iso || typeof iso !== 'string') return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  return `${m[2]}/${m[3]}/${m[1]}`;
}

function formatToIso(mmddyyyy) {
  if (!mmddyyyy || typeof mmddyyyy !== 'string') return '';
  const m = mmddyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);
  const dateObj = new Date(year, month - 1, day);
  if (
    Number.isNaN(dateObj.getTime()) ||
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() + 1 !== month ||
    dateObj.getDate() !== day
  ) {
    return '';
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function maskMmddyyyy(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 8);
  const mm = digits.slice(0, 2);
  const dd = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  if (digits.length <= 2) return mm;
  if (digits.length <= 4) return `${mm}/${dd}`;
  return `${mm}/${dd}/${yyyy}`;
}

function clampMonthDay(masked) {
  const digits = String(masked || '').replace(/\D/g, '').slice(0, 8);
  let mm = digits.slice(0, 2);
  let dd = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);

  if (mm.length === 2) {
    let m = Number(mm);
    if (!m) m = 1;
    if (m > 12) m = 12;
    mm = String(m).padStart(2, '0');
  }

  if (dd.length === 2 && mm.length === 2) {
    const m = Number(mm);
    const y = yyyy.length === 4 ? Number(yyyy) : 2024;
    const maxDay = new Date(y, m, 0).getDate();
    let d = Number(dd);
    if (!d) d = 1;
    if (d > maxDay) d = maxDay;
    dd = String(d).padStart(2, '0');
  }

  const rebuilt = `${mm}${dd}${yyyy}`;
  return maskMmddyyyy(rebuilt);
}

function onDisplayFocus(currentIso) {
  displayValue.value = formatToDisplay(currentIso);
  nextTick(() => {
    if (displayInputEl.value) {
      displayInputEl.value.value = displayValue.value;
    }
  });
}

function focusNextFrom(el) {
  if (!el) return;
  const focusableElements = Array.from(
    document.querySelectorAll(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
  const currentIndex = focusableElements.indexOf(el);
  if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
    focusableElements[currentIndex + 1].focus();
  }
}

function onDisplayInput(e, changeValue) {
  const el = e?.target;
  const raw = el?.value ?? '';
  const rawDigits = String(raw).replace(/\D/g, '');

  // If the user tries to type beyond YYYY (more than 8 digits), move to next field.
  if (rawDigits.length > 8) {
    focusNextFrom(el);
    return;
  }

  // Clearing should truly clear the model + hidden native date input
  if (rawDigits.length === 0) {
    displayValue.value = '';
    if (nativeDateEl.value) nativeDateEl.value.value = '';
    if (typeof changeValue === 'function') changeValue('');
    return;
  }

  const before = String(el?.value ?? '');
  const caret = el?.selectionStart ?? before.length;

  const masked = clampMonthDay(maskMmddyyyy(rawDigits));
  displayValue.value = masked;

  // Write directly to the input to avoid Vue re-render moving the caret to the end
  if (el) {
    el.value = masked;

    const delta = masked.length - before.length;
    const nextPos = Math.max(0, Math.min(masked.length, caret + delta));
    try {
      el.setSelectionRange(nextPos, nextPos);
    } catch (_) {
      // ignore selection errors
    }
  }

  const iso = formatToIso(masked);
  if (!iso || !nativeDateEl.value) return;

  nativeDateEl.value.value = iso;

  if (typeof changeValue === 'function') {
    changeValue(iso);
  }
}

function onDisplayBlur(currentIso) {
  // Trigger InputParent's blur handler + validation (it is attached to the hidden native input)
  if (nativeDateEl.value) {
    nativeDateEl.value.dispatchEvent(new Event('blur'));
  }

  // If a real value exists in the model, show the formatted value on blur.
  // If the model is empty (user typed partial date), keep what they typed.
  if (currentIso) {
    displayValue.value = '';
  }
}

function openPicker() {
  if (!nativeDateEl.value) return;
  if (typeof nativeDateEl.value.showPicker === 'function') {
    nativeDateEl.value.showPicker();
  } else {
    nativeDateEl.value.focus();
    nativeDateEl.value.click();
  }
}

function setNativeDateInputRef(el, setRef) {
  setRef(el);
  nativeDateEl.value = el;
}
</script>
<template>
  <InputParent v-slot="{ setRef, error, value, changeValue }">
    <InputLayout :error="error" :label="$attrs?.label" :validation="$attrs?.validation">
      <div class="flex w-full" :class="{ relative: isDate }">
        <slot class="" name="left" />

        <template v-if="isDate">
          <div class="relative flex-1">
            <div class="flex absolute inset-0 items-center px-3 py-2 text-sm pointer-events-none select-none">
              <span class="text-gray-800">{{ ghostFrom(displayValue || formatToDisplay(value) || '').typed }}</span>
              <span class="text-gray-400">{{ ghostFrom(displayValue || formatToDisplay(value) || '').full.slice(ghostFrom(displayValue || formatToDisplay(value) || '').typed.length) }}</span>
            </div>
            <input
              v-focus='focus'
              class="skip_custom-input"
              inputmode="numeric"
              autocomplete="off"
              ref="displayInputEl"
              :value="displayValue || formatToDisplay(value)"
              @focus="onDisplayFocus(value)"
              @input="(e) => onDisplayInput(e, changeValue)"
              @blur="() => onDisplayBlur(value)"
              @click="openPicker"
              style="color: transparent; caret-color: #111827;"
            />
          </div>

          <input
            :ref="(el) => setNativeDateInputRef(el, setRef)"
            tabindex="-1"
            style="position: absolute; right: 0; top: 0; width: 2.5rem; height: 100%; opacity: 0; cursor: pointer;"
          />

          <button
            v-if="!hasRightSlot"
            type="button"
            class="px-3 text-gray-500 hover:text-gray-700"
            @click="openPicker"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
          <slot v-else name="right" />
        </template>

        <input
          v-else
          v-focus='focus'
          :ref="setRef"
        />
        <slot v-if="!isDate" name="right" />
      </div>
    </InputLayout>
  </InputParent>
</template>