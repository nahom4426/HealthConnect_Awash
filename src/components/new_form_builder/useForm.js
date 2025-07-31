import { ref, provide, nextTick, reactive, watch } from "vue";

export function useForm(id, inner = true, childrenName) {
  if(!inner) return {}

  if(!id) {
    throw new Error("[id] is required")
  }

  const formEl = ref()
  const validateAll = ref(false);
  const valid = ref(false);
  const reset = ref(false);

  provide("validateAll", validateAll);
  provide("reset", reset);
  provide("id", id);

  function resetValue() {
    reset.value = true
    nextTick(() => {
      reset.value = false
      valid.value = false
    })
  }

  function submit(fun = f => f) {
    validateAll.value = true
    nextTick(() => {
      validateAll.value = false
      
      let inputs
      let formFromId
      if(!formEl.value && id) {
        formFromId = document.querySelector(`#${id}`)
        inputs = formFromId && formFromId.querySelectorAll(childrenName ? `.${childrenName}` : '.custom-input')
      } else if(formEl) {
        inputs = formEl.value.querySelectorAll(childrenName ? `.${childrenName}` : '.custom-input')
      } else {
        throw new Error("no form found")
      }
      
      if(!inputs || !(inputs instanceof NodeList)) return false;

      const allValid = [...inputs].every(el => el.dataset['valid'] == 'true')

      if(!allValid) return
      valid.value = true
      let values = [...inputs].reduce((state, el) => {
        if(el.type == 'file') {
          state[el.getAttribute('name')] = el.val
        } else {
          state[el.getAttribute('name')] = JSON.parse(el.dataset['val'])?.value
        }
        return state
      }, {})

      fun({values, reset: resetValue})
    })
  }

  return {submit, id, formEl, valid, reset: resetValue}
}