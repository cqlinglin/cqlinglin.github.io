# VYRA · 个人主页

一个纯静态的个人主页：深色星空背景、点击撒彩纸、明暗主题、站内搜索。
版式照着 VitePress 文档站首页排的——顶部导航 64px、首屏左右两栏、下方四列特性卡片。
没有框架、没有构建步骤，改完文件刷新即可。

站点地址：<https://cqlinglin.github.io>

## 目录结构

```
.
├── index.html            # 页面主体（所有文案都在这里）
├── 404.html              # 找不到页面时显示
├── assets/
│   ├── css/style.css     # 样式：配色、排版、响应式
│   ├── js/main.js        # 交互：星空、彩纸、主题开关、搜索
│   └── img/favicon.svg   # 浏览器标签页图标
├── .nojekyll             # 告诉 GitHub Pages 不要用 Jekyll 处理
└── README.md
```

## 常见修改

### 0. 不想装 Git？直接在网页上改

打开 <https://github.com/cqlinglin/cqlinglin.github.io>，点开要修改的文件 →
右上角的铅笔图标 → 改完点「Commit changes」。提交后 1–2 分钟线上就会更新。

### 1. 改名字与标题

- 品牌名：`index.html` 里的 `VYRA`（导航栏、`<title>`、页脚、大标题各一处）。
- 首屏大标题：

```html
<h1 class="heading">
  <span class="name">VYRA</span>          <!-- 渐变色的那一行 -->
  <span class="text">个人<span class="mark">主页</span></span>  <!-- 白色 + 手绘下划线 -->
</h1>
```

- 副标题：`<p class="tagline">`。
- 两个按钮：`.actions` 里的两个 `<a class="btn ...">`，`brand` 是绿色实心，`alt` 是灰色。

### 2. 改卡片

每张卡片是一个 `.item`，复制一整段就能新增一张（四列时每行四张）：

```html
<div class="item">
  <article class="box">
    <div class="icon">⚙️</div>          <!-- 直接用 emoji，也可以换成 <svg> -->
    <h2 class="title">卡片标题</h2>
    <p class="details">卡片说明文字。</p>
  </article>
</div>
```

卡片的搜索关键词来自标题和说明，改了文字搜索会跟着变，不用另外维护。

### 3. 改配色

打开 `assets/css/style.css` 顶部的 `:root`：

| 变量 | 作用 |
| --- | --- |
| `--bg` / `--bg-soft` | 页面底色 / 卡片底色 |
| `--text-1` / `--text-2` | 主文字 / 次要文字 |
| `--brand-1` / `--brand-2` / `--brand-3` | 三档主色（链接、按钮、悬停） |
| `--glow` | 首屏右上角的柔光 |

浅色主题在 `:root[data-theme="light"]` 里，两组一起改就能保持两套主题一致。

### 4. 调特效

- **彩纸**：`main.js` 里 `burst(e.clientX, e.clientY, 26)` 的 `26` 是点击时撒出的张数；
  打开页面时的那次庆祝在 `celebrate()`，`var n = 50;` 改数量，不想要就把 `setTimeout(celebrate, 450);` 删掉。
- **星星密度**：`main.js` 里 `Math.floor((W * H) / 6800)`，数字越大星星越少。
- 系统开启「减少动态效果」时，这些动画会自动关闭。

### 5. 明暗开关

顶栏那个胶囊开关是 `#themeToggle`（宽 40、高 22，滑块里放着太阳和月亮）。
点一下切换主题，选择存在浏览器 `localStorage` 的 `vyra-theme` 键里；
默认是深色，在网址后加 `?theme=light` 可以临时预览浅色（不写入存储）。

## 本地预览

直接双击 `index.html` 即可。想用本地服务器：

```bash
python -m http.server 8000
# 然后访问 http://localhost:8000
```

## 部署（GitHub Pages）

仓库 `cqlinglin/cqlinglin.github.io` 是「用户主页仓库」，文件放在 `main` 分支根目录，
GitHub Pages 就会自动发布到 <https://cqlinglin.github.io>，不需要额外配置。

更新流程：

```bash
git add .
git commit -m "update site"
git push
```

推上去后等 1–2 分钟，Pages 会自动重新构建。

### 想换成自己的域名

在域名服务商处购买域名后，在仓库根目录新建名为 `CNAME` 的文件，内容只写域名
（例如 `www.example.com`），再到仓库 Settings → Pages 填同一个域名并开启 HTTPS。

## 说明

- 不加载任何外部字体、图标库或统计脚本，离线也能正常显示。
- 图标是 emoji + 内联 SVG，可以直接替换。
- 页面结构：`header.nav` → `section.hero` → `section.features` → `footer`。
