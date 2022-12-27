import { h, createTextVNode } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";
// 这里就是template经过编译后，得到的根组件组合对象（如果用户使用optionsAPI，测绘得到根组件选项对象），里面会包含一个render()函数
export default {
  name: "app",
  render() {
    const app = h("div", {}, "App");
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => [
          h("p", {}, "header" + age),
          createTextVNode("你好呀"),
        ],
        footer: () => h("p", {}, "footer"),
      }
    );
    return h("div", {}, [app, foo]);
  },
  setup() {
    return {};
  },
};
