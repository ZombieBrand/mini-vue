import { h } from '../../lib/guide-mini-vue.esm.js'

// 这里就是template经过编译后，得到的根组件组合对象（如果用户使用optionsAPI，测绘得到根组件选项对象），里面会包含一个render()函数
export default {
  render() {
    return h('div', {
      id: 'root',
      class: ['flex', 'container-r'],
      onClick() {
        console.log('onClick')
      }
    }, [
      h('p', { class: 'red' }, 'red'),
      h('p', { class: 'blue' }, 'blue'),
      h('div', {}, this.name)
    ])
  },
  setup() {
    // 返回对象或者h()渲染函数
    return {
      name: 'hi my app'
    }
  }
}
