import { h, ref } from "../../dist/guide-mini-vue.esm.js";
export default {
  setup() {
    const count = ref(1);
    function onClick() {
      for (let i = 0; i < 100; i++) {
        console.log("update");
        count.value = i;
      }
    }
    return {
      onClick,
      count,
    };
  },
  render() {
    const button = h("button", { onClick: this.onClick }, "update");
    const p = h("p", {}, "count:" + this.count);
    return h("div", {}, [button, p]);
  },
};
