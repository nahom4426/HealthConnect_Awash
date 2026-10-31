import { openModal } from "@customizer/modal-x";

/**
 * Ask before an important Life action (components/Confirmation.mdl.vue), then run it.
 * @param {{ title: string, message: string, confirmText?: string, tone?: 'primary'|'danger' }} dialog
 * @param {() => any} onYes
 */
export function confirmAction(dialog, onYes) {
  openModal("Confirmation", { cancelText: "Cancel", ...dialog }, (yes) => {
    if (yes) onYes();
  });
}
