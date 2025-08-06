<script setup>
  import { computed, provide, ref, watch } from 'vue'
  import { useTablePagination } from '@/composables/useTablePagination'
  import { useApiRequest } from '@/composables/useApiRequest'
  
  const props = defineProps({
    search: {
      type: String,
    },
    cb: {
      type: Function,
      required: true
    },
    store: {
      type: Object
    },
    auto: {
      type: Boolean,
      default: true
    },
    prePage: {
      type: Number,
      default: 25
    }
  })

  const req = useApiRequest()

  const searching = ref(false)

  const searchPagination = useTablePagination(props.prePage)
  const pagination = useTablePagination(props.prePage)

  function getPaginationData(next = true, current = false) {
    if(searching.value) {
      return {
        searchKey: props.search || '',
        search: props.search || '',
        page: next ? ++searchPagination.page.value : --searchPagination.page.value,
        limit: searchPagination.limit.value,
      }
    } else {
      return {
        searchKey: props.search || '',
        page: next ? !current ? ++pagination.page.value : pagination.page.value : --pagination.page.value,
        limit: pagination.limit.value,
      }
    }
  }

  function fetch(next = true, current = false) {
    if(req.pending.value || (next && pagination.done.value)) return

    req.send(
      () => props.cb(getPaginationData(next, current)),
      res => {
        if(props.store && res.success) {
          props.store.set(res.data)
        }

        if(res.success && res.data?.length != pagination.limit.value) {
          pagination.done.value = true
        }
      },
      true
    )
  }

  let controller
  function fetchSearch(next = true) {
    if(next && searchPagination.done.value) return 

    if(controller) controller.abort()
    controller = new AbortController()

    req.send(
      () => props.cb(getPaginationData(next), {
        signal: controller.signal
      }),
      res => {
        if(res?.success && res.data?.length < searchPagination.limit.value) {
          searchPagination.done.value = true
        }
      },
      true
    )
  }

  function next() {
    if(searching.value) {
      fetchSearch()
    } else {
      fetch()
    }
  }

  function previous() {
    if(searching.value && searchPagination.page.value == 1) return
    if(!searching.value && pagination.page.value == 1) return

    if(searching.value) {
      fetchSearch(false)
      searchPagination.done.value = false
    } else {
      pagination.done.value = false
      fetch(false)
    }
  }

  const search = computed(() => props.search)
  watch(search, () => {
    searchPagination.done.value = false
    searchPagination.page.value = 0
    if(search.value) {
      searching.value = true
      fetchSearch()
    } else if(!search.value && props.auto) {
      searching.value = false
      pagination.done.value = false
      fetch(true, true)
    }
  })

  const auto = computed(() => props.auto)
  watch(auto, fetch, {
    immediate: props.auto
  })
  
  const perPage = computed(() => props.prePage)
  watch(perPage, () => {
    pagination.limit.value = perPage.value
    pagination.done.value = false
    searchPagination.limit.value = perPage.value
    searchPagination.done.value = false
  }, {
    immediate: true
  })

  watch([pagination.page, searchPagination.page], () => {
    console.log('pagin', pagination.page.value)
    console.log('earch pagin', searchPagination.page.value)
  }, {
    immediate: true
  })

  provide('next', next)
  provide('previous', previous)
</script>
<!-- if you are using a store you need a method called getAll -->
<template>
  <slot
    :data="store && !searching ? store.getAll() : req.response.value || []"
    :pending="req.pending.value"
    :next="next"
    :previous="previous"
  />
</template>