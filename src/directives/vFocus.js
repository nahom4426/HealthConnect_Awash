export default {
    mounted: (el, { value }) => {
        if(![undefined, null, ''].includes(value) && value) {
            el.focus()
        }
    }
}