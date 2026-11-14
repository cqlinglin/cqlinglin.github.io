# VYRA · 个人主页

一个纯静态的个人主页模板：深色星空背景、鼠标视差、点击粒子光效、明暗主题、卡片悬停聚光、站内搜索。
没有框架、没有构建步骤，改完文件直接刷新即可。

站点地址：<https://cqlinglin.github.io>

## 目录结构

```
.
├── index.html            # 页面主体（所有文案都在这里）
├── 404.html              # 找不到页面时显示
├── assets/
│   ├── css/style.css     # 样式：配色、排版、动画
│   ├── js/main.js        # 交互：星空、点击特效、主题、搜索
│   └── img/favicon.svg   # 浏览器标签页图标
├── .nojekyll             # 告诉 GitHub Pages 不要用 Jekyll 处理
└── README.md
```

## 常见修改

### 1. 改名字和标题

- 名字：`index.html` 里所有 `VYRA` 换成你的名字（导航栏、`<title>`、页脚）。
- 首屏大标题：搜索 `hero-title`，改里面的两行文字。
- 副标题：搜索 `hero-sub`。

### 2. 改卡片

每张卡片是一段 `<article class="card">`，复制一整段就能新增一张：

```html
<article class="card" data-search="用于搜索的关键词 空格分隔">
  <span class="card-icon" style="--tint:#a3e635">
    <svg viewBox="0 0 24 24"><path d="..."></path></svg>
  </span>
  <h3>卡片标题</h3>
  <p>卡片说明文字。</p>
</article>
```

- `--tint` 决定图标底色，换一个十六进制颜色即可。
- 本页默认四列；窗口变窄会自动变成两列、一列。

### 3. 改配色

打开 `assets/css/style.css` 顶部的 `:root`：

| 变量 | 作用 |
| --- | --- |
| `--bg` | 页面背景色 |
| `--text` / `--muted` | 主文字 / 次要文字 |
| `--accent` / `--accent-2` / `--accent-3` | 三档主色，用于渐变和光效 |

浅色主题在 `:root[data-theme="light"]` 里，改完两边都能看到效果。

### 4. 关掉或调整点击特效

- 只想保留点击光环、不要粒子：`assets/js/main.js` 里把 `burst()` 中 `var n = 16;` 改成 `0`。
- 完全不想要：删除 `index.html` 里的 `<canvas id="fx">` 也行，脚本会自动跳过。
- 系统开启「减少动态效果」时，动画会自动关闭。

### 5. 换背景星星密度

`main.js` 里 `Math.floor((W * H) / 8600)`，数字越大星星越少。

## 本地预览

直接双击 `index.html` 即可。若想用本地服务器：

```bash
python -m http.server 8000
# 然后访问 http://localhost:8000
```

## 部署（GitHub Pages）

仓库 `cqlinglin/cqlinglin.github.io` 是「用户主页仓库」，只要把文件放到 `main` 分支根目录，
GitHub Pages 就会自动发布到 <https://cqlinglin.github.io>，不需要额外配置。

更新流程：

```bash
git add .
git commit -m "update site"
git push
```

推上去后等 1–2 分钟，Pages 会自动重新构建。

## 说明

- 页面不加载任何外部字体、图标库或统计脚本，离线也能正常显示。
- 图标全部是内联 SVG，可以直接改 `d` 路径或换成自己的图标。
- 主题选择保存在浏览器 `localStorage` 的 `vyra-theme` 键里。
