/**
 * 毛泽东诗词网站 · 应用逻辑
 * 基于哈希路由的轻量单页应用
 */
(function () {
  'use strict';

  var POEMS = window.POEMS || [];
  var view = document.getElementById('view');
  var poemBg = document.getElementById('poem-bg');
  var pages = {};
  Array.prototype.forEach.call(view.querySelectorAll('.page'), function (p) {
    pages[p.dataset.page] = p;
  });

  /* ---------- 工具 ---------- */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k.indexOf('data-') === 0) node.setAttribute(k, attrs[k]);
        else if (k === 'href') node.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      if (!Array.isArray(children)) children = [children];
      children.forEach(function (c) {
        if (c == null) return;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return node;
  }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function poemById(id) {
    return POEMS.find(function (p) { return p.id === id; });
  }
  function poemIndexById(id) {
    return POEMS.findIndex(function (p) { return p.id === id; });
  }
  function snippetOf(poem) {
    return poem.content.filter(function (l) { return l.trim() !== ''; }).slice(0, 1).join('');
  }

  /* ---------- 路由 ---------- */
  function router() {
    var hash = location.hash.replace(/^#/, '') || '/';
    closePoemBackground();

    if (hash === '/' || hash === '') {
      showPage('home');
      setActiveNav('home');
    } else if (hash.indexOf('/index/') === 0 || hash === '/index') {
      showPage('index');
      setActiveNav('index');
      renderIndex();
    } else if (hash.indexOf('/timeline/') === 0 || hash === '/timeline') {
      showPage('timeline');
      setActiveNav('timeline');
      renderTimeline();
    } else if (hash.indexOf('/about/') === 0 || hash === '/about') {
      showPage('about');
      setActiveNav('about');
    } else if (hash.indexOf('/poem/') === 0) {
      var id = hash.replace(/^\/poem\//, '').replace(/\/$/, '');
      if (poemById(id)) {
        showPage('poem');
        setActiveNav('');
        renderPoemDetail(id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        location.hash = '#/index/';
      }
    } else {
      location.hash = '#/index/';
    }
  }

  function showPage(name) {
    Object.keys(pages).forEach(function (k) {
      pages[k].hidden = k !== name;
    });
  }
  function setActiveNav(name) {
    Array.prototype.forEach.call(document.querySelectorAll('.site-nav a'), function (a) {
      a.classList.toggle('is-active', a.dataset.nav === name);
    });
  }

  /* ---------- 首页：精选三首 ---------- */
  function renderFeatured() {
    var grid = document.getElementById('featured-grid');
    grid.innerHTML = '';
    var picks = ['qinyuanchun-xue', 'qinyuanchun-changsha', 'qilv-renmin-jiefangjun-zhanling-nanjing']
      .map(poemById)
      .filter(Boolean);
    picks.forEach(function (p) { grid.appendChild(poemCard(p)); });
  }

  /* ---------- 诗词卡片 ---------- */
  function poemCard(p) {
    return el('a', { class: 'poem-card', href: '#/poem/' + p.id + '/' }, [
      el('div', { class: 'poem-card__year', text: p.dateLabel }),
      el('h3', { class: 'poem-card__title', text: p.title }),
      el('div', { class: 'poem-card__form', text: p.form + ' · ' + p.place }),
      el('div', { class: 'poem-card__mood', text: p.mood }),
      el('div', { class: 'poem-card__snippet', text: snippetOf(p) }),
      el('span', { class: 'poem-card__more', text: '查看全文与时代背景' })
    ]);
  }

  /* ---------- 目录索引 ---------- */
  var indexState = { form: 'all', q: '' };

  function renderIndex() {
    // 体裁筛选 chips
    var chips = document.getElementById('filter-chips');
    var forms = ['all']
      .concat(Array.from(new Set(POEMS.map(function (p) { return p.form; }))));
    chips.innerHTML = '';
    forms.forEach(function (f) {
      var label = f === 'all' ? '全部' : f;
      var chip = el('button', {
        class: 'chip' + (indexState.form === f ? ' is-active' : ''),
        text: label
      });
      chip.addEventListener('click', function () {
        indexState.form = f;
        renderIndex();
      });
      chips.appendChild(chip);
    });

    // 保留搜索框值
    var search = document.getElementById('search-input');
    if (!search.__bound) {
      search.__bound = true;
      search.addEventListener('input', function () {
        indexState.q = search.value.trim().toLowerCase();
        renderPoemList();
      });
    }
    if (search.value !== indexState.q) search.value = indexState.q;

    renderPoemList();
  }

  function renderPoemList() {
    var list = document.getElementById('poem-list');
    var tip = document.getElementById('empty-tip');
    list.innerHTML = '';
    var q = indexState.q;
    var filtered = POEMS.filter(function (p) {
      if (indexState.form !== 'all' && p.form !== indexState.form) return false;
      if (q) {
        var hay = (p.title + ' ' + p.form + ' ' + p.dateLabel + ' ' + p.place + ' ' + p.mood + ' ' + p.year).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    tip.hidden = filtered.length > 0;
    filtered.forEach(function (p) { list.appendChild(poemCard(p)); });
  }

  /* ---------- 时间线 ---------- */
  function renderTimeline() {
    var tl = document.getElementById('timeline');
    tl.innerHTML = '';
    POEMS.forEach(function (p) {
      var item = el('div', { class: 'tl-item' }, [
        el('div', { class: 'tl-item__year', text: p.dateLabel }),
        el('a', { class: 'tl-item__title', href: '#/poem/' + p.id + '/', text: p.title }),
        el('div', { class: 'tl-item__mood', text: p.mood }),
        el('div', { class: 'tl-item__snippet', text: snippetOf(p) }),
        el('a', { class: 'tl-item__link', href: '#/poem/' + p.id + '/', text: '阅读全文 ›' })
      ]);
      tl.appendChild(item);
    });
  }

  /* ---------- 诗词详情 ---------- */
  function renderPoemDetail(id) {
    var idx = poemIndexById(id);
    var p = POEMS[idx];
    var prev = idx > 0 ? POEMS[idx - 1] : null;
    var next = idx < POEMS.length - 1 ? POEMS[idx + 1] : null;
    var container = document.getElementById('poem-detail');

    container.innerHTML = '';

    // 返回按钮
    container.appendChild(el('a', {
      class: 'poem-detail__back', href: '#/index/'
    }, ['‹ 返回目录']));

    // 主卡片
    var card = el('div', { class: 'poem-detail__card' });

    // 头部
    card.appendChild(el('div', { class: 'poem-detail__head' }, [
      el('div', { class: 'poem-detail__year', text: p.dateLabel }),
      el('div', { class: 'poem-detail__titleblock' }, [
        el('h1', { class: 'poem-detail__title', text: p.title }),
        el('div', { class: 'poem-detail__meta' }, [
          el('span', { text: '体裁：' + p.form }),
          el('span', { text: '地点：' + p.place }),
          el('span', { text: '年份：' + p.year })
        ])
      ]),
      el('div', { class: 'poem-detail__moodtag', text: p.mood })
    ]));

    // 正文 + 背景
    var body = el('div', { class: 'poem-detail__body' });

    // 诗词文本
    var text = el('div', { class: 'poem-text' });
    p.content.forEach(function (line) {
      var cls = 'poem-text__line';
      if (line.trim() === '') cls += ' poem-text__line--blank';
      text.appendChild(el('div', { class: cls, text: line }));
    });
    body.appendChild(text);

    // 右侧背景与心境
    var side = el('div', { class: 'poem-side' });
    side.appendChild(infoBlock('时代背景', p.background));
    side.appendChild(infoBlock('创作心境', p.stateOfMind));
    body.appendChild(side);

    card.appendChild(body);

    // 底部上下首导航
    var foot = el('div', { class: 'poem-detail__foot' });
    foot.appendChild(el('a', {
      class: 'nav-link' + (prev ? '' : ' nav-link--disabled'),
      href: prev ? '#/poem/' + prev.id + '/' : 'javascript:void(0)'
    }, ['‹ 上一首' + (prev ? ' · ' + prev.title : '')]));
    foot.appendChild(el('a', {
      class: 'nav-link' + (next ? '' : ' nav-link--disabled'),
      href: next ? '#/poem/' + next.id + '/' : 'javascript:void(0)'
    }, [(next ? next.title + ' · ' : '') + '下一首 ›']));
    card.appendChild(foot);

    container.appendChild(card);

    // 启用对应主题的动态背景（实拍意境图 + 轻量动效）
    openPoemBackground(p);
  }

  function infoBlock(title, text) {
    return el('div', { class: 'info-block' }, [
      el('h3', { class: 'info-block__title', text: title }),
      el('p', { class: 'info-block__text', text: text })
    ]);
  }

  /* ---------- 详情视图背景：每首诗独特意境渐变 + 主题动效 ----------
     纯 CSS 实现，零网络依赖，秒开；色调与构图贴合每首诗词意境。
     每条为多层渐变（linear 主色 + radial 光斑/层次），由 fx 层叠加主题动效、veil 层暗化。 */
  var BG_GRADIENTS = {
    // 青山远眺·少年出乡（青山含黛、晨雾）
    'qijue-gaishi-cengfuqin': 'radial-gradient(80% 60% at 50% 100%, rgba(255,255,255,.45), transparent 70%), radial-gradient(60% 50% at 20% 30%, rgba(180,210,170,.5), transparent 70%), linear-gradient(180deg, #eaf2e4 0%, #bcd6b2 42%, #6a8e62 100%)',
    // 万山红遍·层林尽染（红枫、金黄、湘江碧透）
    'qinyuanchun-changsha': 'radial-gradient(60% 40% at 30% 65%, rgba(40,90,70,.45), transparent 70%), radial-gradient(50% 35% at 75% 30%, rgba(255,180,80,.4), transparent 70%), linear-gradient(180deg, #f7e2a8 0%, #d9883a 46%, #8a3a18 100%)',
    // 烟雨莽苍苍·龟蛇锁大江（墨青、烟雨灰）
    'pusaman-huanghelou': 'radial-gradient(100% 50% at 50% 28%, rgba(255,255,255,.32), transparent 70%), radial-gradient(70% 40% at 50% 100%, rgba(30,45,55,.5), transparent 70%), linear-gradient(180deg, #c8d2d6 0%, #6a7a82 50%, #3a4a52 100%)',
    // 暮云愁·红旗暴动（暗云、赤旗红）
    'xijiangyue-qiushouqiyi': 'radial-gradient(40% 30% at 72% 42%, rgba(200,30,30,.55), transparent 70%), radial-gradient(80% 50% at 50% 0%, rgba(90,80,72,.6), transparent 70%), linear-gradient(180deg, #5a5048 0%, #3a2a26 52%, #8a1818 100%)',
    // 红旗跃汀江·分田分地（绿山、暖光、赤旗）
    'qingpingyue-jiangui-zhanzheng': 'radial-gradient(50% 40% at 30% 70%, rgba(255,200,120,.32), transparent 70%), radial-gradient(35% 30% at 78% 40%, rgba(180,40,30,.4), transparent 70%), linear-gradient(135deg, #2a5a3a 0%, #6a9a4a 50%, #b03828 100%)',
    // 战地黄花·万里霜秋（金黄菊、赭霜）
    'caisangzi-chongyang': 'radial-gradient(40% 40% at 60% 42%, rgba(255,220,120,.45), transparent 70%), radial-gradient(70% 50% at 50% 100%, rgba(120,60,30,.4), transparent 70%), linear-gradient(180deg, #f0d278 0%, #c8842a 52%, #6a3a18 100%)',
    // 武夷冬山·红旗如画（青黛、雪雾、旗点）
    'rumengling-yuandan': 'radial-gradient(30% 30% at 70% 50%, rgba(180,30,30,.5), transparent 70%), radial-gradient(80% 55% at 50% 100%, rgba(255,255,255,.4), transparent 70%), linear-gradient(180deg, #d8e0e6 0%, #8a9aa6 46%, #4a5a66 100%)',
    // 漫天皆白·雪里行军（雪白、灰蓝、风雪）
    'jianzimulan-guangchang-lushang': 'radial-gradient(60% 50% at 50% 70%, rgba(255,255,255,.55), transparent 70%), radial-gradient(50% 40% at 80% 30%, rgba(120,140,160,.3), transparent 70%), linear-gradient(180deg, #f0f4f8 0%, #c8d4e0 50%, #8aa0b4 100%)',
    // 百万工农·狂飙天降（赤红、墨云翻涌）
    'dielanhua-cong-tingzhou-xiang-changsha': 'radial-gradient(70% 50% at 50% 82%, rgba(255,120,40,.45), transparent 70%), radial-gradient(80% 45% at 50% 0%, rgba(20,15,15,.6), transparent 70%), linear-gradient(180deg, #2a1a18 0%, #6a1818 46%, #c8302a 100%)',
    // 龙冈雾嶂千嶂暗·伏击（墨青雾嶂、烟）
    'yujiaao-fandi-yi-ci-weijiao': 'radial-gradient(50% 60% at 50% 100%, rgba(60,70,60,.55), transparent 70%), radial-gradient(60% 35% at 50% 20%, rgba(160,168,172,.4), transparent 70%), linear-gradient(180deg, #8a9098 0%, #4a5258 52%, #2a3036 100%)',
    // 白云山·横扫千军如卷席（灰白云、翠山、烟尘）
    'yujiaao-fandi-er-ci-weijiao': 'radial-gradient(40% 30% at 72% 62%, rgba(180,80,30,.32), transparent 70%), radial-gradient(70% 45% at 30% 20%, rgba(230,232,224,.45), transparent 70%), linear-gradient(180deg, #e0e4e0 0%, #9aa090 46%, #5a6a4a 100%)',
    // 雨后彩虹·关山阵阵苍（七彩、青翠）
    'pusaman-dabodi': 'radial-gradient(50% 30% at 50% 22%, rgba(255,200,200,.5), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(50,90,70,.4), transparent 70%), linear-gradient(135deg, #4a8ec8 0%, #6ab8a0 42%, #d8a848 100%)',
    // 东方欲晓·郁郁葱葱（橙金晓光、青翠山）
    'qingpingyue-huichang': 'radial-gradient(60% 40% at 50% 0%, rgba(255,240,200,.55), transparent 70%), radial-gradient(60% 50% at 50% 100%, rgba(40,80,50,.4), transparent 70%), linear-gradient(180deg, #f0b860 0%, #d88838 36%, #4a7a4a 100%)',
    // 苍山如海·残阳如血·霜晨月（血红残阳、墨青山海、霜白）
    'yiqine-loushanguan': 'radial-gradient(50% 30% at 50% 92%, rgba(255,80,40,.45), transparent 70%), radial-gradient(40% 30% at 30% 18%, rgba(220,225,230,.35), transparent 70%), linear-gradient(180deg, #2a3a3a 0%, #5a2a2a 46%, #b03020 100%)',
    // 岷山千里雪·雪山草地（雪白、青黛雪峰、远方）
    'qilv-changzheng': 'radial-gradient(60% 40% at 50% 100%, rgba(60,80,70,.42), transparent 70%), radial-gradient(50% 35% at 50% 18%, rgba(255,255,255,.5), transparent 70%), linear-gradient(180deg, #e8eef2 0%, #b0c0cc 50%, #6a7a88 100%)',
    // 天高云淡·南飞雁·红旗西风（青蓝高天、云淡、旗点）
    'qingpingyue-liupanshan': 'radial-gradient(30% 30% at 30% 60%, rgba(180,30,30,.42), transparent 70%), radial-gradient(70% 40% at 60% 15%, rgba(255,255,255,.5), transparent 70%), linear-gradient(180deg, #b8d0e0 0%, #6a8aa8 46%, #3a4a5a 100%)',
    // 莽昆仑·玉龙三百万·冰雪（冰蓝、雪白、昆仑赭）
    'niannujiao-kunlun': 'radial-gradient(50% 50% at 50% 90%, rgba(120,90,70,.32), transparent 70%), radial-gradient(60% 35% at 50% 12%, rgba(255,255,255,.55), transparent 70%), linear-gradient(180deg, #d8e4ec 0%, #9ab0c0 46%, #5a6a78 100%)',
    // 北国风光·千里冰封（雪白、长城赭、冰蓝）
    'qinyuanchun-xue': 'radial-gradient(60% 40% at 50% 82%, rgba(140,100,70,.32), transparent 70%), radial-gradient(55% 35% at 50% 16%, rgba(255,255,255,.6), transparent 70%), linear-gradient(180deg, #eef2f6 0%, #c4d0dc 46%, #8a9aa8 100%)',
    // 缅北丛林·沙场肃穆（深绿、黄褐）
    'wulv-wan-dai-an-lan': 'radial-gradient(50% 40% at 50% 90%, rgba(40,30,20,.42), transparent 70%), radial-gradient(55% 40% at 40% 20%, rgba(180,160,80,.3), transparent 70%), linear-gradient(180deg, #3a4a2a 0%, #5a6a3a 46%, #8a7a3a 100%)',
    // 钟山风雨·百万雄师过大江（赤红、墨云、长江灰）
    'qilv-renmin-jiefangjun-zhanling-nanjing': 'radial-gradient(60% 50% at 50% 82%, rgba(180,150,120,.32), transparent 70%), radial-gradient(80% 45% at 50% 0%, rgba(15,15,20,.6), transparent 70%), linear-gradient(180deg, #2a2a30 0%, #6a1a1a 46%, #b0302a 100%)'
  };

  // 历史/真实照片（Wikimedia Commons 公域资源直链，已验证可 hotlink）。
  // 无照片者用 BG_GRADIENTS 独特渐变兜底；照片层懒加载，失败/弱网保留渐变。
  var BG_PHOTOS = {
    'qijue-gaishi-cengfuqin': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/Shaoshan_01.JPG/1920px-Shaoshan_01.JPG',
    'qinyuanchun-changsha': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Orange_Isle_2021122661.jpg/1920px-Orange_Isle_2021122661.jpg',
    'pusaman-huanghelou': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Yellow_Crane_Tower_61469-Wuhan_%2849149984218%29.jpg/1920px-Yellow_Crane_Tower_61469-Wuhan_%2849149984218%29.jpg',
    'qingpingyue-jiangui-zhanzheng': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Shanghang_Gutian_Huiyi_Huizhi_2013.10.07_16-01-23.jpg/1920px-Shanghang_Gutian_Huiyi_Huizhi_2013.10.07_16-01-23.jpg',
    'rumengling-yuandan': 'https://upload.wikimedia.org/wikipedia/commons/4/40/Wuyishan%2C_Fujian%2C_China.jpg',
    'dielanhua-cong-tingzhou-xiang-changsha': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/58/Jichuan_Gate%2C_Changting_%2820250125124334%29.jpg/1920px-Jichuan_Gate%2C_Changting_%2820250125124334%29.jpg',
    'yujiaao-fandi-er-ci-weijiao': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Mountains_and_sky_and_trees_and_clouds_--_32_of_33.jpg/1920px-Mountains_and_sky_and_trees_and_clouds_--_32_of_33.jpg',
    'qingpingyue-huichang': 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Jingkou_Sunrise_%28151240987%29.jpeg',
    'yiqine-loushanguan': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/FanjingShan_%2854389831311%29.jpg/1920px-FanjingShan_%2854389831311%29.jpg',
    'qingpingyue-liupanshan': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/59/Shaanxi_landscape_IGP4863.jpg/1920px-Shaanxi_landscape_IGP4863.jpg',
    'niannujiao-kunlun': 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Yuzhu_Peak.jpg',
    'qinyuanchun-xue': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/20090529_Great_Wall_8185.jpg/1920px-20090529_Great_Wall_8185.jpg',
    'wulv-wan-dai-an-lan': 'https://upload.wikimedia.org/wikipedia/commons/4/49/Civilians-watch-U-S-Army-engineers-work-on-the-road-in_-Burma-391757373059.jpg',
    'qilv-renmin-jiefangjun-zhanling-nanjing': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/Nanjing_Yangtze_River_Bridge_Night_Pukou.jpg/1920px-Nanjing_Yangtze_River_Bridge_Night_Pukou.jpg'
  };
  var photoCache = {};

  function openPoemBackground(poem) {
    var theme = poem.theme;
    // DOM 顺序：layer(渐变兜底) → photo(真实历史照片·水墨化·Ken Burns) → fx(主题动效) → veil(暗化遮罩)
    poemBg.innerHTML =
      '<div class="poem-bg__layer"></div>' +
      '<div class="poem-bg__photo"></div>' +
      '<div class="poem-bg__fx"></div>' +
      '<div class="poem-bg__veil"></div>';
    poemBg.className = 'poem-bg poem-bg--' + theme + ' is-active';

    var layer = poemBg.querySelector('.poem-bg__layer');
    var grad = BG_GRADIENTS[poem.id];
    if (grad) layer.style.backgroundImage = grad;

    var photo = poemBg.querySelector('.poem-bg__photo');
    var url = BG_PHOTOS[poem.id];
    if (!url) return; // 无真实照片：仅渐变 + 动效
    if (photoCache[url]) {
      photo.style.backgroundImage = 'url("' + url + '")';
      requestAnimationFrame(function () { photo.classList.add('is-loaded'); });
      return;
    }
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      photoCache[url] = true;
      photo.style.backgroundImage = 'url("' + url + '")';
      requestAnimationFrame(function () { photo.classList.add('is-loaded'); });
    };
    img.onerror = function () { /* 失败：保留渐变兜底 */ };
    img.src = url;
  }
  function closePoemBackground() {
    poemBg.classList.remove('is-active');
    // 保留 DOM 以便下次复用前清空
    setTimeout(function () { if (!poemBg.classList.contains('is-active')) poemBg.innerHTML = ''; }, 800);
  }

  /* ---------- 初始化 ---------- */
  function init() {
    renderFeatured();
    window.addEventListener('hashchange', router);
    router();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
