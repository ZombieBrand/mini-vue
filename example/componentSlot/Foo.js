import { h, renderSlots } from '../../lib/guide-mini-vue.esm.js'
export const Foo = {
    setup() {

    },
    render() {
        console.log(this.$slots, '$slots')
        const foo = h('p', {}, "foo")
        return h('div', {}, [renderSlots(this.$slots, "header"), foo, renderSlots(this.$slots, "footer")])
    }
}