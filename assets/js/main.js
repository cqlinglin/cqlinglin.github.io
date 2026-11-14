/* ============================================================
   VYRA · 个人主页交互
   - 星空背景（视差 + 闪烁 + 偶发流星）
   - 点击撒彩纸（canvas-confetti 风格，纯手写）
   - 明暗开关 / 更多菜单 / 手机菜单 / 站内搜索
   原生 JS，无依赖。
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- 1. 主题 ---------- */
  var colorMeta = document.querySelector('meta[name="theme-color"]');
  var forcedTheme = new URLSearchParams(location.search).get('theme');
  var switches = Array.prototype.slice.call(document.querySelectorAll('#themeToggle, #themeToggle2, #themeToggle3'));

  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (colorMeta) colorMeta.setAttribute('content', theme === 'light' ? '#ffffff' : '#0d1411');
    switches.forEach(function (el) {
      el.setAttribute('aria-checked', theme === 'light' ? 'true' : 'false');
    });
    if (forcedTheme === 'light' || forcedTheme === 'dark') return;
    try {
      localStorage.setItem('vyra-theme', theme);
    } catch (e) {}
  }

  if (switches.length) {
    applyTheme(root.dataset.theme || 'dark');
    switches.forEach(function (el) {
      el.addEventListener('click', function () {
        applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
      });
    });
  }

  /* ---------- 2. 星空（内容后面） ---------- */
  var starCanvas = document.getElementById('fx');
  var starCtx = starCanvas && starCanvas.getContext ? starCanvas.getContext('2d') : null;

  if (starCtx && !reduceMotion) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0;
    var H = 0;
    var stars = [];
    var shooting = null;
    var nextShootAt = performance.now() + 4200;
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    var starRGB = '255, 255, 255';
    var last = performance.now();

    function readColors() {
      starRGB = root.dataset.theme === 'light' ? '60, 60, 67' : '255, 255, 255';
    }

    function makeStars() {
      var count = Math.min(260, Math.floor((W * H) / 6800));
      stars = [];
      for (var i = 0; i < count; i++) {
        var depth = Math.random();
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.4 + depth * 1.4,
          base: 0.16 + depth * 0.5,
          depth: depth,
          phase: Math.random() * Math.PI * 2,
          speed: 0.6 + Math.random() * 1.4,
          drift: (Math.random() - 0.5) * 0.05
        });
      }
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      starCanvas.width = Math.floor(W * dpr);
      starCanvas.height = Math.floor(H * dpr);
      starCanvas.style.width = W + 'px';
      starCanvas.style.height = H + 'px';
      starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
    }

    function drawStars(now, dt) {
      starCtx.clearRect(0, 0, W, H);
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var twinkle = 0.62 + 0.38 * Math.sin(now * 0.0016 * s.speed + s.phase);
        var px = s.x + pointer.x * (8 + s.depth * 26);
        var py = s.y + pointer.y * (8 + s.depth * 26) + Math.sin(now * 0.0004 + s.phase) * 1.6;

        s.y += s.drift;
        if (s.y < -2) s.y = H + 2;
        if (s.y > H + 2) s.y = -2;

        starCtx.beginPath();
        starCtx.fillStyle = 'rgba(' + starRGB + ',' + (s.base * twinkle).toFixed(3) + ')';
        starCtx.arc(px, py, s.r, 0, Math.PI * 2);
        starCtx.fill();
      }

      if (!shooting && now > nextShootAt) {
        shooting = {
          x: W * (0.55 + Math.random() * 0.35),
          y: H * (0.05 + Math.random() * 0.22),
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
          tail.addColorStop(0, 'rgba(226, 255, 157,' + (0.6 * k).toFixed(3) + ')');
          tail.addColorStop(1, 'rgba(226, 255, 157, 0)');
          starCtx.strokeStyle = tail;
          starCtx.lineWidth = 1.3;
          starCtx.lineCap = 'round';
          starCtx.beginPath();
          starCtx.moveTo(shooting.x, shooting.y);
          starCtx.lineTo(shooting.x - shooting.vx * 12, shooting.y - shooting.vy * 12);
          starCtx.stroke();
        }
      }
    }

    function loop(now) {
      var dt = Math.min(now - last, 48);
      last = now;
      drawStars(now, dt);
      if (!document.hidden) requestAnimationFrame(loop);
    }

    readColors();
    resize();
    requestAnimationFrame(loop);

    window.addEventListener('resize', function () {
      clearTimeout(resize._t);
      resize._t = setTimeout(resize, 150);
    });

    window.addEventListener('pointermove', function (e) {
      pointer.tx = e.clientX / W - 0.5;
      pointer.ty = e.clientY / H - 0.5;
    }, { passive: true });

    switches.forEach(function (el) {
      el.addEventListener('click', function () {
        setTimeout(readColors, 60);
      });
    });
  }

  /* ---------- 3. 彩纸（内容上面） ---------- */
  var confettiCanvas = document.getElementById('confetti');
  var confettiCtx = confettiCanvas && confettiCanvas.getContext ? confettiCanvas.getContext('2d') : null;

  if (confettiCtx && !reduceMotion) {
    var cdpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = 0;
    var ch = 0;
    var pieces = [];
    var cLast = 0;
    var cRaf = null;
    var COLORS = ['#3dd68c', '#22d3ee', '#a3e635', '#f472b6', '#fbbf24', '#818cf8', '#f87171'];

    function resizeConfetti() {
      cw = window.innerWidth;
      ch = window.innerHeight;
      confettiCanvas.width = Math.floor(cw * cdpr);
      confettiCanvas.height = Math.floor(ch * cdpr);
      confettiCanvas.style.width = cw + 'px';
      confettiCanvas.style.height = ch + 'px';
      confettiCtx.setTransform(cdpr, 0, 0, cdpr, 0, 0);
    }

    function addPiece(x, y, opts) {
      var angle = opts.angle;
      var spread = opts.spread;
      var speed = opts.speed;
      var a = angle + (Math.random() - 0.5) * spread;
      var v = speed * (0.6 + Math.random() * 0.8);
      pieces.push({
        x: x,
        y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.3,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 0,
        max: 1400 + Math.random() * 900,
        round: Math.random() > 0.7
      });
    }

    function burst(x, y, count) {
      for (var i = 0; i < count; i++) {
        addPiece(x, y, { angle: -Math.PI / 2, spread: Math.PI * 1.35, speed: 9 });
      }
      startConfetti();
    }

    function celebrate() {
      var n = 50;
      for (var i = 0; i < n; i++) {
        addPiece(Math.random() * cw, -20 - Math.random() * 120, {
          angle: Math.PI / 2,
          spread: 0.9,
          speed: 2 + Math.random() * 4
        });
      }
      startConfetti();
    }

    function drawConfetti(now) {
      var dt = Math.min(now - cLast, 40);
      cLast = now;
      confettiCtx.clearRect(0, 0, cw, ch);

      for (var i = pieces.length - 1; i >= 0; i--) {
        var p = pieces[i];
        p.life += dt;
        if (p.life > p.max || p.y > ch + 60) {
          pieces.splice(i, 1);
          continue;
        }
        var k = Math.min(dt / 16.67, 2.2);
        p.vy += 0.32 * k;
        p.vx *= 0.995;
        p.vy *= 0.995;
        p.x += p.vx * k;
        p.y += p.vy * k;
        p.rot += p.vrot * k;

        var fade = Math.min(1, (p.max - p.life) / 500);
        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate(p.rot);
        confettiCtx.globalAlpha = fade;
        confettiCtx.fillStyle = p.color;
        if (p.round) {
          confettiCtx.beginPath();
          confettiCtx.arc(0, 0, p.w * 0.42, 0, Math.PI * 2);
          confettiCtx.fill();
        } else {
          confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot)));
        }
        confettiCtx.restore();
      }

      if (pieces.length) {
        cRaf = requestAnimationFrame(drawConfetti);
      } else {
        cRaf = null;
        confettiCtx.clearRect(0, 0, cw, ch);
      }
    }

    function startConfetti() {
      if (cRaf) return;
      cLast = performance.now();
      cRaf = requestAnimationFrame(drawConfetti);
    }

    resizeConfetti();
    window.addEventListener('resize', function () {
      clearTimeout(resizeConfetti._t);
      resizeConfetti._t = setTimeout(resizeConfetti, 150);
    });

    window.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      burst(e.clientX, e.clientY, 26);
    }, { passive: true });

    // 每次打开标签页先庆祝一下
    try {
      if (!sessionStorage.getItem('vyra-celebrated')) {
        sessionStorage.setItem('vyra-celebrated', '1');
        setTimeout(celebrate, 450);
      }
    } catch (err) {}
  }

  /* ---------- 4. 导航状态 ---------- */
  var nav = document.getElementById('nav');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-menu .nav-link'));
  var topSection = document.getElementById('top');
  var features = document.getElementById('features');

  function onScroll() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 4);

    var currentId = 'top';
    if (features && features.getBoundingClientRect().top <= 160) currentId = 'features';

    navLinks.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      link.classList.toggle('active', href === '#' + currentId);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 5. 更多菜单 ---------- */
  var extraBtn = document.getElementById('extraBtn');
  var extraMenu = document.getElementById('extraMenu');

  function closeExtra() {
    if (!extraMenu) return;
    extraMenu.hidden = true;
    if (extraBtn) extraBtn.setAttribute('aria-expanded', 'false');
  }

  if (extraBtn && extraMenu) {
    extraBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = extraMenu.hidden;
      extraMenu.hidden = !open;
      extraBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', function (e) {
      if (extraMenu.hidden) return;
      if (!extraMenu.contains(e.target) && !extraBtn.contains(e.target)) closeExtra();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeExtra();
    });

    extraMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeExtra();
    });
  }

  /* ---------- 6. 手机菜单 ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var navScreen = document.getElementById('navScreen');

  function closeScreen() {
    if (!navScreen) return;
    navScreen.hidden = true;
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }

  if (menuBtn && navScreen) {
    menuBtn.addEventListener('click', function () {
      var open = navScreen.hidden;
      navScreen.hidden = !open;
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    navScreen.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeScreen();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 767) closeScreen();
    });
  }

  /* ---------- 7. 搜索 ---------- */
  var overlay = document.getElementById('searchOverlay');
  var trigger = document.getElementById('searchTrigger');
  var input = document.getElementById('searchInput');
  var results = document.getElementById('searchResults');
  var empty = document.getElementById('searchEmpty');
  var index = [];

  function buildIndex() {
    index = [
      { title: '首页', desc: '回到页面顶部', href: '#top' },
      { title: '快速开始', desc: '八张卡片，八件小事', href: '#features' }
    ];

    document.querySelectorAll('.box').forEach(function (box) {
      var h2 = box.querySelector('.title');
      var p = box.querySelector('.details');
      if (!h2) return;
      index.push({
        title: h2.textContent.trim(),
        desc: p ? p.textContent.trim() : '',
        href: '#features'
      });
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

  /* ---------- 8. 年份 ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
