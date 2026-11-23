Franklin.exe · 我们的交换存档

运行（Python 3）：
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
打开 http://127.0.0.1:4173

检查：
node --test tests/core.test.mjs
node --check dist/app.mjs
node --check dist/scene.mjs
node --check dist/game.mjs

内容：dist/content.mjs（题目、回忆、开放题）、dist/photos.json（照片目录）。
原生 WebGL：dist/scene.mjs；像素排球：dist/game.mjs。
不依赖第三方 CDN，无需 npm 安装。

进度仅保存于浏览器 localStorage。新增照片仅在当前页面临时显示，刷新清除。
内置相册包含 43 张提供的真实照片；在线共同相册URL尚未提供。
前端信件解锁用于纪念仪式，不是私密信息的权限保护。
本地原始图片未修改。网页副本压缩并移除 EXIF。

新版：点击式场景，封面/目录/地图/相册/尾声通过按钮切换，无长页面滚动。复古网格纸风格，3D红色行李箱、白色排球与游泳池。
