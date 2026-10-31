import { ref } from "vue";
import { openModal } from "@customizer/modal-x";
import { toasted } from "@/utils/utils";
import { fileForm, useLifeResource } from "./useLifeResource";

/**
 * Wires a RateTableEditor to its endpoints: load, bulk save, delete one row, import.
 * @param {{ list: Function, bulkSave: Function, remove: (uuid: string) => Promise<any>, importFile?: (fd: FormData) => Promise<any>, idField: string, label: string }} api
 */
export function useRateTable(api) {
  const { data: rows, loading, error, load } = useLifeResource(api.list, { initial: [], map: (d) => (Array.isArray(d) ? d : []) });
  const saving = ref(false);
  const importing = ref(false);
  let lastArgs = [];

  function reload(...args) {
    if (args.length) lastArgs = args;
    return load(...lastArgs);
  }

  async function save(payload) {
    saving.value = true;
    const res = await api.bulkSave(payload);
    saving.value = false;
    if (res?.success) {
      toasted(true, `${api.label} saved`);
      await reload();
    }
  }

  function remove(row) {
    openModal(
      "Confirmation",
      {
        title: `Delete this ${api.label.toLowerCase()} row?`,
        message: "The row is removed from the rate table. Policies already priced keep their premium.",
        confirmText: "Delete",
        cancelText: "Cancel",
        tone: "danger",
      },
      async (yes) => {
        if (!yes) return;
        const res = await api.remove(row[api.idField]);
        if (res?.success) {
          toasted(true, "Row deleted");
          await reload();
        }
      }
    );
  }

  async function importFile(file) {
    if (!api.importFile) return;
    importing.value = true;
    const res = await api.importFile(fileForm(file));
    importing.value = false;
    if (res?.success) {
      toasted(true, res.data?.message || `${file.name} imported`);
      await reload();
    }
  }

  return { rows, loading, error, saving, importing, reload, save, remove, importFile };
}
