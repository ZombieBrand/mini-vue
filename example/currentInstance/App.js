import { h, getCurrentInstance } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";
// 这里就是template经过编译后，得到的根组件组合对象（如果用户使用optionsAPI，测绘得到根组件选项对象），里面会包含一个render()函数
export default {
  name: "app",
  render() {
    return h("div", {}, [h('p',{},"currentInstance demo"),h(Foo)]);
  },
  setup() {
    const instance = getCurrentInstance()
    console.log("APP:",instance)
    return {}
  },
};
