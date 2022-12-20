import { h } from '../../lib/guide-mini-vue.esm.js'
export const Foo = {
    setup(props, { emit }) {
        // props.count
        console.log(props, 'props')

        const emitAdd = (ev) => {
            console.log('emitAdd', ev)
            emit("add", 1, 2, 3)
            emit("addFoo", ['apple', 'banana'])
        }
        return {
            emitAdd
        }
    },
    render() {
        const btn = h('button', {
            onClick: this.emitAdd
        }, "emitAdd")
        const foo = h('p', {

        }, 'foo')
        return h('div', {}, [btn, foo])
    }
}