// src/stores/selectedValuesStore.js
import { defineStore } from "pinia";

export const useSelectedDrugStore = defineStore("selectedDrug", {
  state: () => ({
    selectedValues: [],
    isAllSelected: false,
  }),
  actions: {
    addValue(value) {
      this.selectedValues.push(value);
    },
    removeValue(value) {
      this.selectedValues = this.selectedValues.filter((v) => v !== value);
    },
    clearValues() {
      this.selectedValues = [];
    },
    SelectAll(checked, data) {
      if (checked) {
        this.selectedValues = data.map((el) => el?.drugUuid);
        this.isAllSelected = true;
      } else {
        this.selectedValues = [];
        this.isAllSelected = false;
      }
    },
    setAllSelected(checked) {
      this.isAllSelected = checked;
    },
  },
});
