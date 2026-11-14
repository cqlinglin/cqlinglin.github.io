/* ============================================================
   VYRA · 个人主页交互
   - 星空背景（视差 + 闪烁 + 偶发流星）
   - 鼠标点击：扩散光环 + 光点粒子
   - 跟随光晕 / 卡片聚光 / 滚动揭示
   - 明暗主题、搜索浮层、移动端菜单
   全部原生 JS，无任何依赖。
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- 主题 ---------- */
  var themeToggle = document.getElementById('themeToggle');
  var themeColorMeta = document.querySelector('meta[name="theme-color"]');
  var forcedTheme = new URLSearchParams(location.search).get('theme');

  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'light' ? '#f4f7f3' : '#080c0a');
    }
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    }
    if (forcedTheme === 'light' || forcedTheme === 'dark') return;
    try {
      localStorage.setItem('vyra-theme', theme);
    } catch (e) {}
  }

  if (themeToggle) {
    applyTheme(root.dataset.theme || 'dark');
    themeToggle.addEventListener('click', function () {
      applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
    });
  }

  /* ---------- 星空与点击特效 ---------- */
  // 两层画布：#fx 在内容后面画星星，#fx-top 在内容上面画点击光效
  var starCanvas = document.getElementById('fx');
  var fxCanvas = document.getElementById('fx-top');
  var starCtx = starCanvas && starCanvas.getContext ? starCanvas.getContext('2d') : null;
  var fxCtx = fxCanvas && fxCanvas.getContext ? fxCanvas.getContext('2d') : null;

  if (starCtx && fxCtx && !reduceMotion) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0;
    var H = 0;
    var stars = [];
    var bursts = [];
    var rings = [];
    var shooting = null;
    var nextShootAt = performance.now() + 4200;
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    var starRGB = '233, 241, 236';

    function readColors() {
      var v = getComputedStyle(root).getPropertyValue('--star-rgb').trim();
      starRGB = v || '233, 241, 236';
    }

    function fit(canvas, ctx) {
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeStars() {
      var count = Math.min(240, Math.floor((W * H) / 8600));
      stars = [];
      for (var i = 0; i < count; i++) {
        var depth = Math.random();
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.4 + depth * 1.5,
          base: 0.18 + depth * 0.55,
          depth: depth,
          phase: Math.random() * Math.PI * 2,
          speed: 0.6 + Math.random() * 1.4,
          drift: (Math.random() - 0.5) * 0.06
        });
      }
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      fit(starCanvas, starCtx);
      fit(fxCanvas, fxCtx);
      makeStars();
    }

    function burst(x, y) {
      var n = 14;
      for (var i = 0; i < n; i++) {
        var a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
        var sp = 2 + Math.random() * 5;
        bursts.push({
          x: x,
          y: y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0,
          max: 620 + Math.random() * 380,
          size: 0.8 + Math.random() * 1.8,
          color: Math.random() > 0.55 ? '163, 230, 53' : '52, 211, 153'
        });
      }
      rings.push({ x: x, y: y, r: 4, max: 92, life: 0, dur: 640 });
      rings.push({ x: x, y: y, r: 2, max: 46, life: 0, dur: 460, soft: true });
    }

    function drawStars(now, dt) {
      starCtx.clearRect(0, 0, W, H);

      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var twinkle = 0.62 + 0.38 * Math.sin(now * 0.0016 * s.speed + s.phase);
        var alpha = s.base * twinkle;
        var px = s.x + pointer.x * (8 + s.depth * 26);
        var py = s.y + pointer.y * (8 + s.depth * 26) + Math.sin(now * 0.0004 + s.phase) * 1.6;

        s.y += s.drift;
        if (s.y < -2) s.y = H + 2;
        if (s.y > H + 2) s.y = -2;

        starCtx.beginPath();
        starCtx.fillStyle = 'rgba(' + starRGB + ',' + alpha.toFixed(3) + ')';
        starCtx.arc(px, py, s.r, 0, Math.PI * 2);
        starCtx.fill();
      }

      // 偶发流星
      if (!shooting && now > nextShootAt) {
        shooting = {
          x: W * (0.55 + Math.random() * 0.35),
          y: H * (0.05 + Math.random() * 0.25),
          vx: -(6 + Math.random() * 4),
          vy: 2.6 + Math.random() * 1.8,
          life: 0,
          max: 900
        };
        nextShootAt = now + 5200 + Math.random() * 7000;
      }
      if (shooting) {
        shooting.life += dt;
        shooting.x += shooting.vx;
        shooting.y += shooting.vy;
        var k = 1 - shooting.life / shooting.max;
        if (k <= 0 || shooting.x < -80 || shooting.y > H + 40) {
          shooting = null;
        } else {
          var tail = starCtx.createLinearGradient(
            shooting.x, shooting.y,
            shooting.x - shooting.vx * 12, shooting.y - shooting.vy * 12
          );
          tail.addColorStop(0, 'rgba(226, 255, 157,' + (0.65 * k).toFixed(3) + ')');
          tail.addColorStop(1, 'rgba(226, 255, 157, 0)');
          starCtx.strokeStyle = tail;
          starCtx.lineWidth = 1.4;
          starCtx.lineCap = 'round';
          starCtx.beginPath();
          starCtx.moveTo(shooting.x, shooting.y);
          starCtx.lineTo(shooting.x - shooting.vx * 12, shooting.y - shooting.vy * 12);
          starCtx.stroke();
        }
      }
    }

    function drawFX(dt) {
      fxCtx.clearRect(0, 0, W, H);
      fxCtx.globalCompositeOperation = 'lighter';

      // 光点
      for (var b = bursts.length - 1; b >= 0; b--) {
        var p = bursts[b];
        p.life += dt;
        if (p.life >= p.max) {
          bursts.splice(b, 1);
          continue;
        }
        p.vx *= 0.955;
        p.vy = p.vy * 0.955 + 0.03;
        p.x += p.vx;
        p.y += p.vy;
        var t = 1 - p.life / p.max;
        fxCtx.beginPath();
        fxCtx.fillStyle = 'rgba(' + p.color + ',' + (t * 0.95).toFixed(3) + ')';
        fxCtx.arc(p.x, p.y, p.size * (0.35 + t * 0.9), 0, Math.PI * 2);
        fxCtx.fill();
      }

      // 光环
      for (var r = rings.length - 1; r >= 0; r--) {
        var ring = rings[r];
        ring.life += dt;
        var rt = ring.life / ring.dur;
        if (rt >= 1) {
          rings.splice(r, 1);
          continue;
        }
        var ease = 1 - Math.pow(1 - rt, 3);
        var radius = ring.r + (ring.max - ring.r) * ease;
        fxCtx.beginPath();
        fxCtx.strokeStyle = 'rgba(' + (ring.soft ? '52, 211, 153' : '163, 230, 53') + ',' + ((1 - rt) * (ring.soft ? 0.45 : 0.7)).toFixed(3) + ')';
        fxCtx.lineWidth = ring.soft ? 1 : 1.6;
        fxCtx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
        fxCtx.stroke();
      }

      fxCtx.globalCompositeOperation = 'source-over';
    }

    var last = performance.now();
    function loop(now) {
      var dt = Math.min(now - last, 48);
      last = now;
      drawStars(now, dt);
      drawFX(dt);
      if (!document.hidden) requestAnimationFrame(loop);
    }

    function start() {
      last = performance.now();
      requestAnimationFrame(loop);
    }

    window.addEventListener('resize', function () {
      clearTimeout(resize._t);
      resize._t = setTimeout(resize, 150);
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) start();
    });

    readColors();
    resize();
    start();

    // 主题切换后重新读取星星颜色
    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        setTimeout(readColors, 60);
      });
    }

    // 鼠标视差
    window.addEventListener('pointermove', function (e) {
      pointer.tx = e.clientX / W - 0.5;
      pointer.ty = e.clientY / H - 0.5;
    }, { passive: true });

    // 点击特效
    window.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      burst(e.clientX, e.clientY);
    }, { passive: true });
  }

  /* ---------- 跟随光晕 ---------- */
  var glow = document.querySelector('.cursor-glow');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (glow && finePointer && !reduceMotion) {
    var gx = window.innerWidth / 2;
    var gy = window.innerHeight / 2;
    var tx = gx;
    var ty = gy;
    var raf = null;

    function follow() {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
      if (Math.abs(tx - gx) > 0.4 || Math.abs(ty - gy) > 0.4) {
        raf = requestAnimationFrame(follow);
      } else {
        raf = null;
      }
    }

    window.addEventListener('pointermove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      glow.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(follow);
    }, { passive: true });

    document.addEventListener('pointerleave', function () {
      glow.classList.remove('is-on');
    });
  }

  /* ---------- 顶栏状态与当前导航 ---------- */
  var header = document.getElementById('header');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav .nav-link'));
  var sections = ['top', 'features', 'start']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 6);

    var current = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= 140) current = sections[i];
    }
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      link.classList.toggle('is-active', current && href === '#' + current.id);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 滚动揭示 ---------- */
  var revealItems = document.querySelectorAll('.card, .section-head, .start-inner, .hero-meta');

  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.style.getPropertyValue('--d'), 10) || 0;
        el.classList.add('in');
        io.unobserve(el);
        // 动画结束后摘掉类名，让卡片恢复自带的悬停过渡
        setTimeout(function () {
          el.classList.remove('reveal', 'in');
        }, delay + 900);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.setProperty('--d', Math.min(i * 55, 420) + 'ms');
      io.observe(el);
    });
  }

  /* ---------- 卡片聚光 ---------- */
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    });
  });

  /* ---------- 移动端菜单 ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var mobileMenu = document.getElementById('mobileMenu');

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.hidden = true;
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      var willOpen = mobileMenu.hidden;
      mobileMenu.hidden = !willOpen;
      menuBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    mobileMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* ---------- 搜索 ---------- */
  var overlay = document.getElementById('searchOverlay');
  var trigger = document.getElementById('searchTrigger');
  var input = document.getElementById('searchInput');
  var results = document.getElementById('searchResults');
  var empty = document.getElementById('searchEmpty');

  var index = [];

  function buildIndex() {
    index = [
      { title: '首页', desc: '回到页面顶部', href: '#top' },
      { title: '特性一览', desc: '八张卡片，八件小事', href: '#features' },
      { title: '开始使用', desc: '把它变成你自己的页面', href: '#start' }
    ];

    document.querySelectorAll('.card').forEach(function (card) {
      var h3 = card.querySelector('h3');
      var p = card.querySelector('p');
      if (!h3) return;
      index.push({
        title: h3.textContent.trim(),
        desc: p ? p.textContent.trim() : '',
        href: '#features'
      });
    });

    index.sort(function (a, b) {
      return a.title.localeCompare(b.title, 'zh-Hans-CN');
    });
  }

  function render(list) {
    if (!results) return;
    results.innerHTML = '';
    list.forEach(function (item, i) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = item.href;
      if (i === 0) a.classList.add('is-hover');
      var strong = document.createElement('strong');
      strong.textContent = item.title;
      var span = document.createElement('span');
      span.textContent = item.desc;
      a.appendChild(strong);
      a.appendChild(span);
      a.addEventListener('click', closeSearch);
      li.appendChild(a);
      results.appendChild(li);
    });

    if (empty) empty.hidden = list.length !== 0;
    results.hidden = list.length === 0;
  }

  function filter(q) {
    var key = q.trim().toLowerCase();
    if (!key) return index.slice(0, 6);
    return index.filter(function (item) {
      return (item.title + ' ' + item.desc).toLowerCase().indexOf(key) !== -1;
    });
  }

  function openSearch() {
    if (!overlay) return;
    buildIndex();
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    if (input) {
      input.value = '';
      input.focus();
    }
    render(index.slice(0, 6));
  }

  function closeSearch() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  if (overlay && trigger) {
    trigger.addEventListener('click', openSearch);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSearch();
    });

    document.getElementById('searchClose').addEventListener('click', closeSearch);

    if (input) {
      input.addEventListener('input', function () {
        render(filter(input.value));
      });

      input.addEventListener('keydown', function (e) {
        var links = results ? Array.prototype.slice.call(results.querySelectorAll('a')) : [];
        var hovered = links.findIndex(function (a) { return a.classList.contains('is-hover'); });

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (!links.length) return;
          var next = e.key === 'ArrowDown'
            ? (hovered + 1 + links.length) % links.length
            : (hovered - 1 + links.length) % links.length;
          links.forEach(function (a) { a.classList.remove('is-hover'); });
          links[next].classList.add('is-hover');
          links[next].scrollIntoView({ block: 'nearest' });
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          var target = links[hovered] || links[0];
          if (target) {
            closeSearch();
            var el = document.querySelector(target.getAttribute('href'));
            if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
          }
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      var isK = (e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey);
      if (isK) {
        e.preventDefault();
        if (overlay.hidden) openSearch();
        else closeSearch();
      }
      if (e.key === 'Escape' && !overlay.hidden) closeSearch();
    });
  }

  /* ---------- 年份 ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
