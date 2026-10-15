# 维护者指南

## 本地开发

使用 Node.js 24，依赖版本以 package-lock.json 为准。

```sh
npm ci
npm run dev -- --port 5178
npm run typecheck
npm test
npm run build
npm run preview -- --port 5179
```

Vite 构建输出到 dist，含独立 Worker。项目使用 hash 路由。Windows 可用 Start-Preview.ps1 启动本地预览。

## 验证

- browser-test.mjs：实验室、六策略、回放、批量评测与取消。
- animation-browser-test.mjs：真实位移、合并、触屏、暂停重置。
- reduced-motion-test.mjs：历史存储与 OS 偏好下固定完整动画。
- home-layout-test.mjs、home-product-test.mjs：首页视觉、交互和帧采样。
- site-smoke.mjs：图标 MIME、完整动画和桌面/手机仓库链接，可传目标 URL。

脚本默认使用本机 Edge。手机测试是触屏和视口模拟；实机 Safari/移动 Chrome 可作为额外验证。截图发布前检查只含项目界面。

## 实现边界

src/engine.ts 负责规则与回放；src/agents.ts 负责六种策略；src/worker.ts 处理实验室和批量任务；src/Landing.tsx 与 landing.css 负责首页。首页视觉变更应保留真实 Worker 生命周期与 useTileMotion 队列。字体使用本机可用字体栈，不依赖远端字体服务。

节点预算、游戏引擎与呈现动画保持独立。算法修改需与规则参考实现和固定种子对照。后续研究方向包括独立设计的 DQN/TD 训练模块、连续回放、可配置批量参数和置信区间。

站点图标可用 node generate-icons.mjs 重建。遵守根目录 AGENTS.md 的文案规范，保留真实研究口径。
