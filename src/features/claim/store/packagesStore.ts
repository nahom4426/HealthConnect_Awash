import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface PackageItem {
  packageUuid?: string
  packageName?: string
  [key: string]: any
}

interface PaginationMeta {
  totalElements: number
  totalPages: number
  currentPage: number
}

export const usePackages = defineStore('packagesStore', () => {
  const packages = ref<PackageItem[]>([])
  const paginationMeta = ref<PaginationMeta | null>(null)

  function getAll() {
    return packages.value
  }

  function set(data: PackageItem[]) {
    packages.value = Array.isArray(data) ? data : []
  }

  function setPaginationMeta(meta: PaginationMeta) {
    paginationMeta.value = meta
  }

  function getPaginationMeta() {
    return paginationMeta.value
  }

  return {
    packages,
    getAll,
    set,
    setPaginationMeta,
    getPaginationMeta,
  }
})
