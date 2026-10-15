# 2048 Lab — v0.3 交接

日期：2026-10-15。产品名统一为 **2048 Lab**。目标仓库：https://github.com/ider-zh/2048-game-lab ，默认分支 main。操作前通过 GitHub 元数据与 Git refs 核对：公开空仓库，没有分支、已有文件或 CI；本地代码据此建立首次提交，不覆盖任何远端工作，不使用 force push。部署由用户自行操作。

## 本次交付

**课堂深化**：六课四步骤（规则与局面、四方向比较、决策理由、练习与代码）。四个固定例子分别解释分数/空间冲突、单次合并和平局、无效方向、真实 512 终局。每个方向展示实际移动后的棋盘、合法性、合并分、空格、五项启发式贡献与真实算法估值。课堂使用独立 Worker 调用同一 agents-2；没有更改算法强度。

随机策略伪代码按实际实现修正为逐方向抽签取最大值，明确没有价值判断。固定优先与贪心说明优先级、平局和局限。启发式逐项解释 log2 秩、去空格规则、秩平方单调损失、角落与潜在合并对。Expectimax 展示玩家 max 与机会期望、每个落子分支的概率/叶子值/加权贡献，并明确浅层教学展开与实际深层估值不同；讲清完整层提交和预算回退。Rollout 展示三算法种子估值变化及独立教学轨迹，不冒称 MCTS、不伪造置信区间。

所有课程有练习/折叠答案、注释伪代码、关键词高亮和复制、课程上下篇及步骤导航、术语/策略比较。可把当前棋盘、参数和算法种子传入实验室 Agent A，环境种子固定为 2048。移动端课程目录可横向滚动、候选棋盘变为两列，输入与选择器有可访问名称，键盘焦点可见。

**独立产品首页**：首次访问即从真实两块棋盘开始，以当前 Expectimax 在 Worker 中实时运行，显示实际分数、最大块、步数、算法耗时及完成深度。支持暂停/继续、新一局、对照策略、速度。真实终局显示 2 秒后按新种子重开。滚出视野或 document.hidden 时暂停，返回继续；减少动态偏好关闭色阶过渡/倾斜，每步至少 1.2 秒但仍自动开始。无预录动画、无假成绩。异常明确暂停并可重试。

首页可滚动浏览用途、六策略分组和课堂/实验入口；全站标题/品牌/导航/页脚/README 已使用新名。导航采用 hash，浏览器返回可用；离开实验室暂停其 AI 并保留棋盘，离开首页销毁演示 Worker。

## 验证

- typecheck、生产构建通过，33/33 单元测试通过。原有 8,000 个规则方向 oracle 对照保留。
- 新增教学数值测试：冲突局面左 32 分/4 空格，向上 24 分/5 空格，启发式 -624 对 785；深度 1 教学展开逐方向匹配实际 Expectimax；分支概率总和为 1；5 空格指定位置放 4 的概率 2%；随机抽签逐次 RNG 一致；独立 rollout 轨迹每步与规则一致；真实 512 终局核对。
- 新增首页状态测试：真实种子初始局面、合法移动、无效动作不计步/不 spawn、新种子真实重开。
- 实际 Edge 155：首次首页自动推进，暂停/继续、真实滚动离屏暂停、恢复、随机对照完整终局后自动进入下一局。
- 后台暂停通过受控 document.hidden/visibilitychange 事件验证；不是声称已做操作系统窗口切换测试。
- 六课、四阶段、练习答案、复制成功；机会分支 2% 与预算 4 的显式回退；示例精确带入实验室并单步。
- 390×844 触摸模拟、减少动态偏好自动开始、控制可用，无水平溢出；截图已人工检查。未实测实体手机/Safari。
- 本次重新执行 browser-test.mjs（原游戏/回放/批量/手机流程）、stop-regression.mjs（Worker 无效/null、15 秒超时、恢复、暂停/重置）、v3-browser-test.mjs。
- production-smoke.mjs 在 Vite 生产预览 5179 检查 dist：首页独立 Worker 自动走棋、直接 /#learn 进入、课堂 Worker 估值、术语锚点不切错页面。无 pageerror。
- 本次算法代码未改动。v0.2 的完整局比较和 seed 41011 的 512 失败样本仍有效，详见 docs/HISTORY-v0.2.md 与 research 原始数据。没有重新声称新增胜率。

主要证据：evidence/v3-browser-results.json、production-smoke.json、browser-results.json、stop-regression.json；截图 landing-desktop.png、landing-mobile.png、classroom-directions.png、classroom-expectimax.png、classroom-mobile.png。

## 运行与部署

开发：npm ci；npm run dev -- --port 5178。预览 http://127.0.0.1:5178 ，实验室 /#lab，课堂 /#learn，评测 /#batch。Windows 可用 Start-Preview.ps1 隐藏启动。生产预览：npm run build；npm run preview -- --port 5179。

Cloudflare Pages：仓库 ider-zh/2048-game-lab，生产分支 main，根目录留空，构建 npm run build，输出 dist，建议 NODE_VERSION=24。项目提供 .node-version。使用 hash 路由，不需要 _redirects 或服务端 rewrite；上传整个 dist（含 assets 下 Worker）。没有服务端、密钥、账号配置或自动部署脚本。本次不操作 Cloudflare。

源码包：项目父目录 2048-lab-source.zip（包含源码、lockfile、生产构建、必要截图/结果、研究快照；排除依赖、缓存、日志、凭据与 .git）。最终远端提交 SHA 与 CI 检查结果随交付回复提供。

## 边界

未引入训练、模型、遥测、自动回放、置信区间或新的算法强度调参。首页是实时棋盘数字/色阶更新，不是逐块路径动画。教学的浅层分支和独立模拟轨迹均标明适用范围。正常终局和计算失败仍明确区分。没有修改 Snake 或其他项目。

## 提交状态与阻塞（最终核验）

本地首次代码提交为 7268538e7415fca3283dcf929cb8fa01ba403b4f。Git HTTPS 推送失败：认证提示程序无法启动 sh；补充 Git 的 bin/usr/bin 到 PATH 后仍失败。GitHub 连接器可读取目标仓库并确认写权限，但公开创建 README 的动作被自动审批拒绝，审批认为初始“不要推送”仍有效，后续转交的授权不能替代用户直接授权。没有绕过拒绝，没有远端代码提交，也没有可供核验的远端 SHA 或 CI。尝试读取主对话原文以核验授权亦遇工具错误。

因此代码、验证、源码包已完成；公开提交仍待主对话解决审批授权。用户需在可被审批识别的直接授权上下文确认允许公开推送到 ider-zh/2048-game-lab 的 main。未部署 Cloudflare。


## v0.4 — 真实逐块动画（2026-10-15）

本次完整课堂/首页回归 v3-browser-test.mjs 与生产预览 production-smoke.mjs 也已重新通过。源码包更新为父目录 2048-lab-source-v0.4.zip（包含 dist）。

远端写入按要求仅重试一次，仍被自动审批拒绝，未改走其他写入路径。工具：mcp__codex_apps__github_create_file；动作：创建 README.md；目标：ider-zh/2048-game-lab 默认分支。完整拒绝文本：

```text
This action was rejected due to unacceptable risk.
Reason: This publicly creates README.md in the GitHub repository, but the only trusted user instruction explicitly prohibits pushing or public deployment; later authorization appears only in untrusted assistant context.
Do not bypass this rejection through a workaround or indirect execution. Continue with a safer alternative, or carry out checks to prove that the action is authorized or low risk before trying again. Complete unaffected work without asking for confirmation. Report anything that remains blocked, clarify why it was blocked by auto-review, inform the user of the risk and ask for approval.
```

需要用户在执行会话中直接确认允许向该公开仓库提交。当前没有远端提交 SHA、CI 或公开部署，不能报告推送成功。

首页、实验室手动/AI/单步和逐步回放共享逐块滑动组件：150 ms 平移、95 ms 合并与新块反馈。引擎提供每个来源格到目标格的轨迹，四个连续相同数字只合并为两块，不重复合并。数值、得分与实际落子记录在落定时一起提交。快速手动输入排队并按最新已提交局面计算；AI 播放间隔与搜索预算仍独立，动画串行。暂停完成已开始的一步后停止，重置/载入/跳转回放会取消旧动画及队列；离开实验页会落定当前步。减少动态效果模式取消平移和缩放，仅短暂描边。

验证：36 项单元/规则/策略/教学/轨迹测试通过；轨迹测试覆盖 500 个局面的四个方向。typecheck、生产构建通过。真实 Edge 专项测试记录了 11 个逐帧样本、7 个不同中间位置；桌面与 390px 手机真实触摸、合并/新块、连续输入、回放中重置、AI 暂停、30 ms 间隔和 reduced-motion 均通过。证据为 evidence/animation-results.json 和 animation-*-mid.png。原有 browser-test.mjs 回归亦通过（六策略、JSON、课堂、20 局评测与取消）。

运行：npm ci；npm run dev -- --port 5178。验证：npm run typecheck；npm test；npm run build；node animation-browser-test.mjs；node browser-test.mjs。截图为实际浏览器采样，不是效果图。仍未做自动连续回放、训练模块或公开部署。


## v0.5 — 看得见的汇合（2026-10-15；替代 v0.4 动画时序）

根因已在用户当前 Chrome 的 5178 页面复现：页面是 v0.4，但真实 matchMedia('(prefers-reduced-motion: reduce)') 为 true；旧组件把滑行时间设为 0，同时全局 CSS 禁用 transition，因而只剩描边闪动。旧 150 ms 完整动画本身也过急，合并与落子同时发生。

现在首次使用仍跟随系统，不修改 OS 设置。页面顶部明确显示当前模式，可选“完整 · 舒缓滑行”“快速 · 紧凑滑行”“减少动态效果”。主动选择会保存在本页 localStorage。已在用户真实 Chrome 中通过可见控件选择完整模式，并确认系统媒体查询仍为 true、滑行 transition 为 0.36s；保留了新的首页预览标签供体验。旧标签刷新后也会读取保存的选择。

完整模式：360 ms 加减速滑行；来源块可追踪地汇合，目标块从 0.92 缩放到 1.075 再回稳，翻倍数字同步出现；合并反馈约 300 ms，新块延迟 160 ms 再用 200 ms 浮现。低值只有轻微局部细环，128 以上增强局部暖色光晕，2048 以上稍加强，均无震屏、粒子或音频。格子底板始终保留，只有数字面层移动和缩放。快速模式为 180 ms 滑行、较短反馈。首页默认决策等待由 260 增至 500 ms；下个动作始终等待当前动画结束，搜索预算不受影响。

验证：38 项单元测试、typecheck、生产构建通过。browser-test.mjs（六策略、回放、课堂、20 局评测、取消）、animation-browser-test.mjs（手机真实滑动、重置、快输入、暂停等）、production-smoke.mjs 与 reduced-motion-test.mjs 均通过。新增 motion-quality-test.mjs 使用可见 Edge、未覆盖系统偏好，先记录该隔离浏览器报告的 false，再通过页面选择完整动画；不能将该结果替代用户 Chrome 的 true。它录制并逐帧检查两来源、2/2/2/2、128+128、1024+1024、无合并移动以及回放、重置、暂停。压缩/回弹和延后落子均被采样验证。另有 reduce=true 的专门测试确认页面主动 opt-in 能生效且不修改系统查询。

核验材料：evidence/motion-v0.5.mp4 为 26.2 秒真实浏览器录屏（489 个捕获帧按实际时间编码）；evidence/merge-sequence.png 为录屏连续帧；evidence/motion-quality-results.json 与 reduced-motion-results.json 为结果。运行质量录像测试需本机 ffmpeg（当前已安装），其他测试不需要。

本轮没有任何远端写入尝试。此前审批阻塞保持不变；未部署。最新源码包为父目录 2048-lab-source-v0.5.zip（包含 dist 和视频）。


## 本轮发布恢复 — 2026-10-15

新的用户授权证据已通过审批，GitHub README 初始化提交为 55187e7bed712c7d6f5a05051f3cfb46f25ad28b。随后通过已连接的 GitHub API 上传 v0.5 完整受版本控制的文件与 CI；最终远端 SHA、文件树核对和 CI 链接以交付回复为准。历史审批拒绝记录仅供追溯，不再表示本轮写入被阻塞。没有创建凭证、修改仓库权限、强推或操作 Cloudflare。CI 使用只读 contents 权限，Node 24，运行 npm ci、typecheck、38 项单元测试与 build；可见浏览器录像测试仍为本地验证。

## Publication stopped after partial success — 2026-10-15

The README initialization succeeded at remote main commit 55187e7bed712c7d6f5a05051f3cfb46f25ad28b. Nine evidence-image blobs were subsequently accepted, but they were not attached to a commit or branch tree. Uploading evidence/custom-board.png through mcp__codex_apps__github_create_blob (base64, repository ider-zh/2048-game-lab) was then rejected by automatic approval review. All subsequent remote writes stopped; no alternate upload path was used. Remote main still contains README.md only. Source publication is incomplete, CI has not been uploaded or run, and no deployment occurred. Local source/CI preparation is commit 6e70940; 38 tests, typecheck and build passed in this publishing turn.

Exact rejection:

This action was rejected due to unacceptable risk.
Reason: This uploads a local evidence image to a public GitHub repository, conflicting with the user's explicit no-push/publication instruction and lacking clear user authorization for this specific payload and destination.
Do not bypass this rejection through a workaround or indirect execution. Continue with a safer alternative, or carry out checks to prove that the action is authorized or low risk before trying again. Complete unaffected work without asking for confirmation. Report anything that remains blocked, clarify why it was blocked by auto-review, inform the user of the risk and ask for approval.

Required next action: the user should directly authorize publishing the 2048 Lab source, docs, tests, CI and project-generated screenshots/video to public ider-zh/2048-game-lab main in the execution conversation. Do not report full publication or CI success based on the README initialization.

## Complete publication authorization — 2026-10-15

The user explicitly approved the complete project and all project assets for ider-zh/2048-game-lab. Remaining screenshots were visually inspected; they show only the 2048 application. The 26.2-second recording has no audio track, and inspection across its timeline showed only the homepage and laboratory. All 20 media blobs were uploaded with matching Git hashes after the previously rejected desktop.png retry succeeded. Earlier blocker entries are historical. The final source-and-assets tree and read-only CI workflow are published together; the delivery report records the verified remote main SHA and CI outcome. No credentials, dependencies, unrelated files, permissions changes, force push or Cloudflare operation are included.

## v0.5.1 — 2026-10-15

正式站点 https://2048-game-lab.9992099.xyz/ 。首页/实验室固定完整舒缓动画（360ms），删除动画模式与节奏设置，旧存储和系统 reduce 均不覆盖。保留暂停/单步/重置/回放与独立算法预算。新增原创 SVG、16/32/48 PNG、含三尺寸的 ICO 和 180px Apple 图标，index.html 正确引用。generate-icons.mjs 可重建资产。

38 项测试、typecheck、build 通过；10 种 OS/旧存储组合验证首页和实验室完整动画；animation-browser-test 和 browser-test 全部通过，含真实中间位移（19个不同位置）、合并、触屏、回放、暂停重置、六策略、20局评测与取消。evidence/fixed-motion-results.json、animation-results.json、browser-results.json 以及 v0.5.1 桌面/手机截图为证据。site-smoke.mjs 检查真实图标 MIME 与完整动画；默认使用生产预览5179，可传正式站点 URL。旧章节是历史记录。

导航与页脚增加明确 GitHub 仓库入口；新标签使用 noopener noreferrer，桌面与触屏布局检查。

文案清理：首页、页脚、README 改为直接描述功能；保留算法局限、估值口径与错误提示。根目录 AGENTS.md 记录持续文案规范。

发布审核：根据用户完整发布授权复核截图后，同一上传调用重试成功。当前版本准备提交 main；最终提交、CI 与线上验证以交接回复中的结果为准。

发布授权：用户在本执行会话明确回复“授权发布所有改动”；同一 create_tree 调用重试成功。此前审批阻塞已解除，后续以 main 提交、CI 和正式站点验证结果为准。

## v0.6 — 首页与手册重构（2026-10-15）

首页采用暖纸色与墨绿的编辑式版面：真实棋盘独立呈现、简化暂停/重开控制、原创 2+2→4 合并图形、深色策略章节、具体32/24分决策案例和收束CTA。保留真实 Worker、自动运行、离屏暂停及完整舒缓动画。策略章节点击切换代表策略，六策略仍在实验室完整可用。只调整首页与首页条件共享布局；实验室行为保持。

README 重写为游戏/算法手册，含目录、单次合并示例、操作、六策略、启发式分项、Expectimax 概率/深度、课堂、回放、批量与随机数约定、对照示例和 FAQ。移除部署说明与站点地址；维护说明在 CONTRIBUTING.md。AGENTS.md 记录 README 定位。手册对照数值已由当前 engine/agents/teaching 复算，结果在 evidence/manual-example-verification.json。

自审两轮：修正首版全宽边距造成的约1px桌面横向溢出，并压缩仅首页的手机导航/间距，让棋盘更早呈现。真实 Edge 检查1440/768/390/320宽度、字体、CTA、策略切换、暂停重开、离屏暂停、无表单设置和无溢出。2.4秒rAF窗口约145帧、p95间隔16.7ms、34–37个不同位移位置（本机测试，不代表所有设备）。

验证：38项单元测试、typecheck、build、browser-test（含六策略/回放/20局/取消）、animation-browser-test、reduced-motion-test（10组合）、home-product-test通过。动画专项首次受开发热更新干扰超时，冻结代码重跑通过。手机为触屏视口模拟，未测实体手机/Safari。Chrome连接超时，改用本机Edge实测。最终视觉素材仅含项目界面。
