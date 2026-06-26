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
            class="flex-shrink-0 flex items-center justify-center w-9 h-9 text-gray-400 hover:text-gray-600 transition-colors duration-150"
            @click="openPicker"
            aria-label="Open date picker"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
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