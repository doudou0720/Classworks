/**
 * main.js
 *
 * 精简启动流水线：快速挂载 Vue app，重型依赖（Clarity）异步加载
 */

// 核心插件（Vuetify / Router / Pinia）
import { registerPlugins } from "@/plugins";

// Components
import App from "./App.vue";
import GlobalMessage from "@/components/GlobalMessage.vue";

// Composables
import { createApp } from "vue";

import messageService from "./utils/message";

const app = createApp(App);

registerPlugins(app);
app.use(messageService);

app.component("GlobalMessage", GlobalMessage);

// 挂载 Vue app（首要目标：尽快渲染首屏）
app.mount("#app");

// ====== 以下全部异步，不阻塞首屏渲染 ======

// 异步加载 Clarity（在页面完全加载后）
const loadClarity = async () => {
  try {
    const { getVisitorId } = await import("./utils/visitorId");
    const Clarity = (await import("@microsoft/clarity")).default;
    Clarity.init("rhp8uqoc3l");

    const visitorId = await getVisitorId();
    console.log("Visitor ID:", visitorId);
    Clarity.identify(visitorId);
    Clarity.setTag("fingerprintjs", visitorId);
  } catch (error) {
    console.warn("Clarity 加载或标识设置失败:", error);
  }
};

if (document.readyState === "complete") {
  loadClarity();
} else {
  window.addEventListener("load", loadClarity, { once: true });
}
