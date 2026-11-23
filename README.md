# Franklin.exe · 我们的交换存档

以交换生活为主题的互动纪念网站：3D 场景、回忆挑战、旅行地图、记忆补充、43 张照片的 CSS 3D 穹顶相册、拍立得浏览和通关证书。

## 本地运行

需要 Python 3。在仓库目录执行：

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

打开 http://127.0.0.1:4173/ 。停止服务按 Ctrl+C。

`dist/index.html` 使用 JavaScript 模块和照片目录请求，应通过 HTTP 服务打开。直接双击它可能无法加载交互。无需 npm 安装，无第三方 CDN 依赖。

`exports/Franklin互动网站.html` 是本次保存的单文件快照，可下载后直接在浏览器打开。后续修改以 `dist/` 为准；单文件快照不会自动同步。

## 文件结构与复用

| 文件 | 用途 |
| --- | --- |
| `dist/index.html` | 页面结构和文案 |
| `dist/style.css` | 视觉样式与响应式布局 |
| `dist/content.mjs` | 题目、回忆和章节内容 |
| `dist/photos.json` | 相册目录 |
| `dist/assets/` | 照片和视觉素材 |
| `dist/app.mjs` | 页面交互、存档、穹顶和照片查看器 |
| `dist/scene.mjs` | 首页 WebGL 3D 场景 |
| `dist/game.mjs` | 排球小游戏 |
| `dist/core.mjs`、`dist/quiz-flow.mjs`、`dist/quiz-art.mjs` | 挑战逻辑和题目视觉 |
| `tests/` | 已有测试文件 |
| `docs/` | 开发过程文档，保留历史记录 |
| `exports/` | 便于保存和打开的单文件快照 |

为另一位朋友复用时，复制项目，修改人物文案、题目、照片目录和素材；同时更换 `app.mjs` 中的 localStorage 键，避免同一站点下复用旧进度。

## 数据保存

做题进度、地图记录和记忆补充保存在当前浏览器的 localStorage 中，不随 Git 仓库同步，也不会在访客之间共享。临时添加的照片仅在当前页面内存在。清除浏览器数据可能删除这些记录。

仓库保存代码与内置素材。修改后通过 Git 提交和推送保存版本；重要版本可加标签，并额外保留离线备份。

这是静态网站，没有后台或账号系统。前端章节解锁只是互动流程，不是访问控制。私有仓库存储与网站公开部署是两个独立操作。

## 已有检查命令

```sh
node --test tests/core.test.mjs tests/quiz-flow.test.mjs
node --check dist/app.mjs
```

本次归档不代表重新执行了全部功能测试；`docs/` 中的检查记录对应各自的历史开发阶段。
