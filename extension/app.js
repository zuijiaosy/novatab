/* ===== WeTab 风格新标签页 — 应用逻辑 ===== */
(function () {
  "use strict";

  const STORE_KEY = "wetab_clone_v1";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const uid = () => "x" + Math.random().toString(36).slice(2, 9);

  /* ---------- 内置壁纸 ---------- */
  const WALLPAPERS = [
    { id: "warmgray", name: "暖灰", css: "radial-gradient(circle at 30% 18%, rgba(255,255,255,.55), transparent 46%), linear-gradient(155deg, #d8d2c8 0%, #b9b2a6 55%, #908a7e 100%)" },
    { id: "dawn", name: "晨曦", css: "radial-gradient(circle at 70% 22%, rgba(255,240,200,.6), transparent 50%), linear-gradient(155deg, #ffd9a0 0%, #f0a989 45%, #b07e9b 100%)" },
    { id: "coast", name: "海岸", css: "radial-gradient(circle at 28% 20%, rgba(255,255,255,.5), transparent 46%), linear-gradient(160deg, #6dd5ed 0%, #2193b0 55%, #185a7d 100%)" },
    { id: "forest", name: "林海", css: "radial-gradient(circle at 32% 22%, rgba(220,255,230,.45), transparent 48%), linear-gradient(160deg, #88c9a1 0%, #3a8a64 50%, #134e5e 100%)" },
    { id: "dusk", name: "暮色", css: "radial-gradient(circle at 75% 25%, rgba(255,200,160,.5), transparent 48%), linear-gradient(160deg, #4b6cb7 0%, #34406b 50%, #182848 100%)" },
    { id: "night", name: "夜空", css: "radial-gradient(circle at 70% 18%, rgba(120,160,255,.4), transparent 50%), linear-gradient(160deg, #2c5364 0%, #203a43 50%, #0f2027 100%)" }
  ];

  /* ---------- 搜索引擎 ---------- */
  const ENGINES = {
    google: { name: "Google", tpl: "https://www.google.com/search?q=%s", glyph: "G", color: "#4285F4" },
    baidu: { name: "百度", tpl: "https://www.baidu.com/s?wd=%s", glyph: "百", color: "#2932E1" },
    bing: { name: "Bing", tpl: "https://www.bing.com/search?q=%s", glyph: "b", color: "#0C8484" },
    ddg: { name: "DuckDuckGo", tpl: "https://duckduckgo.com/?q=%s", glyph: "D", color: "#DE5833" },
    site: { name: "站内 / 书签", tpl: "", glyph: "★", color: "#8a6df0" },
    custom: { name: "自定义引擎", tpl: "", glyph: "+", color: "#5a8" }
  };

  /* ---------- 配色（图标自动取色） ---------- */
  const PALETTE = ["#1DA1F2", "#FF4500", "#EA4335", "#181717", "#00AEEC", "#FF0000",
    "#0084FF", "#2D963D", "#E6162D", "#FF2442", "#5b9df0", "#8a6df0",
    "#f0883e", "#19b58a", "#d9476b", "#6c63ff"];
  function colorFor(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return PALETTE[Math.abs(h) % PALETTE.length];
  }
  function monoOf(name) {
    const t = (name || "?").trim();
    if (/[一-龥]/.test(t)) return t[0];
    return (t[0] || "?").toUpperCase();
  }
  function hostOf(url) {
    if (!url) return "";
    try {
      let u = url.trim();
      if (!/^https?:\/\//.test(u)) u = "https://" + u;
      return new URL(u).hostname;
    } catch (e) { return ""; }
  }
  function faviconUrl(url) {
    const host = hostOf(url);
    if (!host) return "";
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  }

  /* ---------- 默认数据 ---------- */
  function defaultItems() {
    const mk = (name, url, color) => ({ id: uid(), type: "site", name, url, color: color || colorFor(name), icon: "" });
    return [
      mk("百度", "https://www.baidu.com", "#2932E1"),
      mk("高德地图", "https://www.amap.com", "#00A0E9"),
      mk("淘宝", "https://www.taobao.com", "#FF4400"),
      mk("京东", "https://www.jd.com", "#E1251B"),
      mk("微博", "https://weibo.com", "#E6162D"),
      mk("哔哩哔哩", "https://www.bilibili.com", "#00AEEC"),
      mk("知乎", "https://www.zhihu.com", "#0084FF"),
      mk("抖音", "https://www.douyin.com", "#161823"),
      {
        id: uid(), type: "folder", name: "AI 助手", children: [
          mk("文心一言", "https://yiyan.baidu.com", "#2932E1"),
          mk("通义千问", "https://tongyi.aliyun.com", "#615CED"),
          mk("豆包", "https://www.doubao.com", "#2F68FF"),
          mk("Kimi", "https://kimi.moonshot.cn", "#1F1F1F")
        ]
      },
      mk("小红书", "https://www.xiaohongshu.com", "#FF2442"),
      mk("网易云音乐", "https://music.163.com", "#C20C0C"),
      mk("腾讯视频", "https://v.qq.com", "#FF6600"),
      mk("豆瓣", "https://www.douban.com", "#2D963D"),
      mk("美团", "https://www.meituan.com", "#FFC300"),
      mk("百度网盘", "https://pan.baidu.com", "#06A7FF")
    ];
  }

  function defaultState() {
    return {
      items: defaultItems(),
      theme: "auto",
      wallpaper: "warmgray",
      customWallpaper: "",
      engine: "google",
      customEngineUrl: "",
      glassBlur: 22,
      tileRadius: 22,
      cols: 8,
      city: "北京",
      showWeather: true,
      autoLocate: true,
      weatherCache: null, // { city, temp, code, ts, auto }
      onlineWp: { enabled: false, style: "nature", auto: true, intervalMin: 60, url: "", dataUrl: "", ts: 0 }
    };
  }

  /* ---------- 状态 ---------- */
  let state = load();
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) {}
    return defaultState();
  }
  let fileHandle = null;        // 已绑定的本地数据文件句柄
  let fileWriteTimer = null;
  let firstRunPending = false;  // 首次安装：预留给“数据文件绑定引导”
  let fileNoticeOpen = false;
  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    if (fileHandle) { clearTimeout(fileWriteTimer); fileWriteTimer = setTimeout(writeDataFile, 800); }
  }

  /* ---------- 主题 ---------- */
  function applyTheme() {
    let t = state.theme;
    if (t === "auto") t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
    $("#themeIcon").innerHTML = (state.theme === "dark") ? ICON.moon
      : (state.theme === "light") ? ICON.sun : ICON.auto;
  }

  /* ---------- 壁纸 ---------- */
  // 在线壁纸风格 → Wallhaven 搜索（免 Key）
  const WP_STYLES = [
    { id: "nature", name: "自然风光", q: "nature landscape", cat: "100" },
    { id: "mountain", name: "山川", q: "mountains", cat: "100" },
    { id: "ocean", name: "海洋", q: "ocean sea beach", cat: "100" },
    { id: "city", name: "城市", q: "city architecture", cat: "100" },
    { id: "space", name: "太空星河", q: "space galaxy stars", cat: "100" },
    { id: "minimal", name: "极简", q: "minimalist", cat: "100" },
    { id: "abstract", name: "抽象", q: "abstract", cat: "100" },
    { id: "anime", name: "动漫", q: "", cat: "010" },
    { id: "random", name: "随机", q: "", cat: "111" }
  ];
  const WP_INTERVALS = [
    { v: 0, name: "每次打开新标签" },
    { v: 30, name: "每 30 分钟" },
    { v: 60, name: "每小时" },
    { v: 360, name: "每 6 小时" },
    { v: 1440, name: "每天" }
  ];

  function applyWallpaper() {
    const el = $("#wallpaper");
    const o = state.onlineWp;
    if (o && o.enabled && (o.dataUrl || o.url)) {
      el.style.background = `center / cover no-repeat url("${o.dataUrl || o.url}")`;
      return;
    }
    if (state.wallpaper === "__custom" && state.customWallpaper) {
      el.style.background = `center / cover no-repeat url(${state.customWallpaper})`;
    } else {
      const wp = WALLPAPERS.find(w => w.id === state.wallpaper) || WALLPAPERS[0];
      el.style.background = wp.css;
    }
  }

  /* ---------- 在线壁纸自动更换 ---------- */
  let wpTimer = null;
  let wpFetching = false;
  async function fetchOnlineWallpaper(userInitiated) {
    const o = state.onlineWp;
    if (!o || !o.enabled || wpFetching) return;
    const s = WP_STYLES.find(x => x.id === o.style) || WP_STYLES[0];
    wpFetching = true;
    if (userInitiated) toast("正在获取壁纸…");
    try {
      const url = `https://wallhaven.cc/api/v1/search?categories=${s.cat}&purity=100&sorting=random&atleast=1920x1080`
        + (s.q ? `&q=${encodeURIComponent(s.q)}` : "");
      const d = await fetchJson(url);
      const list = (d && d.data) || [];
      if (!list.length) { if (userInitiated) toast("未获取到壁纸，请稍后再试"); return; }
      const pick = list[Math.floor(Math.random() * list.length)];
      o.url = pick.path; o.dataUrl = ""; o.ts = nowMs(); save();
      applyWallpaper(); // 先用远程地址即时显示
      if (userInitiated) toast("已更换壁纸");
      // 缓存图片字节为 data URL：之后再次打开新标签直接用缓存，不再请求网络
      try {
        const d = await urlToDataUrl(o.url);
        if (d && state.onlineWp && state.onlineWp.url === o.url) {
          state.onlineWp.dataUrl = d; save(); applyWallpaper();
        }
      } catch (e) { /* 缓存失败则保底用远程地址 */ }
    } catch (e) {
      if (userInitiated) toast("壁纸获取失败");
    } finally {
      wpFetching = false;
    }
  }
  function scheduleWallpaper() {
    clearInterval(wpTimer); wpTimer = null;
    const o = state.onlineWp;
    if (!o || !o.enabled || !o.auto || !o.intervalMin) return;
    wpTimer = setInterval(() => {
      const oo = state.onlineWp;
      if (oo && oo.enabled && oo.auto && oo.intervalMin && nowMs() - (oo.ts || 0) >= oo.intervalMin * 60000) {
        fetchOnlineWallpaper(false);
      }
    }, 60000);
  }
  function initOnlineWallpaper() {
    const o = state.onlineWp;
    if (!o || !o.enabled) return;
    const due = !o.url || (o.auto && (o.intervalMin === 0 || !o.ts || nowMs() - o.ts >= o.intervalMin * 60000));
    if (due) {
      fetchOnlineWallpaper(false);
    } else {
      applyWallpaper(); // 未到更换时间：直接用缓存（dataUrl 优先），零网络
      if (!o.dataUrl && o.url) {
        // 有地址但还没缓存字节 → 后台补缓存，供下次直接使用
        urlToDataUrl(o.url).then(d => {
          if (d && state.onlineWp && state.onlineWp.url === o.url) { state.onlineWp.dataUrl = d; save(); applyWallpaper(); }
        }).catch(() => {});
      }
    }
    scheduleWallpaper();
  }

  /* ---------- 玻璃 / 圆角 / 列数 ---------- */
  function applyVars() {
    const r = document.documentElement.style;
    r.setProperty("--glass-blur", state.glassBlur + "px");
    r.setProperty("--tile-radius", state.tileRadius + "px");
    r.setProperty("--grid-cols", state.cols);
  }

  /* ---------- 图标渲染 ---------- */
  function iconInner(item, mini) {
    if (item.icon) return `<img src="${item.icon}" alt="" referrerpolicy="no-referrer">`;
    const cls = mini ? "mm" : "mono";
    return `<span class="${cls}">${monoOf(item.name)}</span>`;
  }
  function tileMarkup(item, idx) {
    let inner;
    if (item.type === "folder") {
      const kids = (item.children || []).slice(0, 4).map(c => {
        const bg = c.icon ? "" : `style="background:${c.color}"`;
        return `<div class="folder-mini" ${bg}>${iconInner(c, true)}</div>`;
      }).join("");
      inner = `<div class="icon-wrap folder">${kids}</div>`;
    } else {
      const bg = item.icon ? "" : `style="background:${item.color}"`;
      inner = `<div class="icon-wrap" ${bg}>${iconInner(item)}</div>`;
    }
    const intro = idx >= 0 ? ` tile-in" style="animation-delay:${Math.min(idx * 28, 600)}ms` : "";
    return `<div class="tile${intro}" data-id="${item.id}" data-type="${item.type}" draggable="true">
      ${inner}
      <div class="label">${escapeHtml(item.name)}</div>
      <button class="tile-menu-btn" title="更多">⋯</button>
    </div>`;
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m])); }

  let introPlayed = false;
  function renderGrid() {
    const grid = $("#grid");
    const intro = !introPlayed;
    let html = state.items.map((it, i) => tileMarkup(it, intro ? i : -1)).join("");
    const addIntro = intro ? ` tile-in" style="animation-delay:${Math.min(state.items.length * 28, 600)}ms` : "";
    html += `<div class="tile add${addIntro}" data-add="1"><div class="icon-wrap">${ICON.plus}</div><div class="label">添加</div></div>`;
    grid.innerHTML = html;
    introPlayed = true;
    bindTiles();
  }

  /* 图标缓存：把远程地址的图标（如 favicon）首次抓取后内嵌为 data URL 缓存，
     之后不再每次重新请求网络。已是 data URL 的图标会被跳过，幂等。 */
  let iconCacheRunning = false;
  async function cacheRemoteIcons() {
    if (iconCacheRunning) return;
    const all = [];
    state.items.forEach(it => { all.push(it); if (it.type === "folder") (it.children || []).forEach(c => all.push(c)); });
    const remote = all.filter(it => it.icon && /^https?:/.test(it.icon));
    if (!remote.length) return;
    iconCacheRunning = true;
    let changed = false;
    for (const it of remote) {
      try { const d = await urlToDataUrl(it.icon); if (d) { it.icon = d; changed = true; } } catch (e) { /* 跳过 */ }
    }
    iconCacheRunning = false;
    if (changed) { save(); renderGrid(); if (openFolderId) renderFolderGrid(); }
  }

  /* ---------- 引擎 UI ---------- */
  function renderEngine() {
    const e = ENGINES[state.engine];
    $("#engineGlyph").textContent = e.glyph;
    $("#engineGlyph").style.background = e.color;
    $("#engineMenu").innerHTML = Object.entries(ENGINES).map(([k, v]) =>
      `<button class="engine-opt ${k === state.engine ? "active" : ""}" data-eng="${k}">
        <span class="engine-glyph" style="background:${v.color}">${v.glyph}</span>${v.name}</button>`).join("");
    $$("#engineMenu .engine-opt").forEach(b => b.onclick = async () => {
      const prev = state.engine;
      state.engine = b.dataset.eng;
      if (state.engine === "custom" && !state.customEngineUrl) {
        const u = await uiPrompt({ title: "自定义搜索引擎", msg: "输入搜索地址，用 %s 代表关键词", value: "https://example.com/search?q=%s" });
        if (u && u.includes("%s")) state.customEngineUrl = u; else { state.engine = prev; }
      }
      save(); renderEngine(); closeEngineMenu();
      $("#searchInput").focus();
    });
  }
  function closeEngineMenu() { $("#engineMenu").classList.remove("open"); }

  function doSearch() {
    const q = $("#searchInput").value.trim();
    if (!q) return;
    if (state.engine === "site") {
      const flat = flatten();
      const hit = flat.find(i => i.name.toLowerCase().includes(q.toLowerCase()));
      if (hit) { openUrl(hit.url); } else { toast("没有匹配的书签"); }
      return;
    }
    let tpl = state.engine === "custom" ? state.customEngineUrl : ENGINES[state.engine].tpl;
    if (!tpl) tpl = ENGINES.google.tpl;
    openUrl(tpl.replace("%s", encodeURIComponent(q)));
  }
  function flatten() {
    const out = [];
    state.items.forEach(i => { if (i.type === "folder") (i.children || []).forEach(c => out.push(c)); else out.push(i); });
    return out;
  }
  function openUrl(u) {
    if (!u) return;
    if (!/^https?:\/\//.test(u)) u = "https://" + u;
    window.location.href = u; // 在当前新标签页打开，而非新建标签
  }

  /* 实时过滤（站内搜索时） */
  function liveFilter() {
    if (state.engine !== "site") { $$(".tile").forEach(t => t.style.opacity = ""); return; }
    const q = $("#searchInput").value.trim().toLowerCase();
    $$(".tile[data-id]").forEach(t => {
      const id = t.dataset.id;
      const item = findItem(id).item;
      if (!item) return;
      if (!q) { t.style.opacity = ""; return; }
      const names = item.type === "folder"
        ? [item.name, ...(item.children || []).map(c => c.name)]
        : [item.name];
      const match = names.some(n => n.toLowerCase().includes(q));
      t.style.opacity = match ? "" : ".25";
    });
  }

  /* ---------- 搜索联想（本地快捷方式） ---------- */
  let suggestItems = [];
  let suggestIdx = -1;
  function renderSuggest() {
    const q = $("#searchInput").value.trim().toLowerCase();
    const menu = $("#suggestMenu");
    if (!q) { menu.classList.remove("open"); suggestItems = []; suggestIdx = -1; return; }
    const flat = flatten().filter(i => i.url);
    suggestItems = flat.filter(i => i.name.toLowerCase().includes(q) || hostOf(i.url).includes(q)).slice(0, 6);
    suggestIdx = -1;
    if (!suggestItems.length) { menu.classList.remove("open"); return; }
    menu.innerHTML = suggestItems.map((it, i) => {
      const dot = it.icon
        ? `<img src="${it.icon}" alt="" referrerpolicy="no-referrer" style="width:16px;height:16px;border-radius:4px;object-fit:cover">`
        : `<span style="width:14px;height:14px;border-radius:4px;background:${it.color};display:inline-block"></span>`;
      return `<button class="suggest-opt" data-i="${i}"><span class="s-ico">${dot}</span>${escapeHtml(it.name)}
        <span style="margin-left:auto;font-size:12px;color:var(--text-dim)">${escapeHtml(hostOf(it.url))}</span></button>`;
    }).join("");
    $$(".suggest-opt", menu).forEach(b => b.onmousedown = (e) => { e.preventDefault(); openUrl(suggestItems[+b.dataset.i].url); closeSuggest(); $("#searchInput").value = ""; });
    menu.classList.add("open");
  }
  function closeSuggest() { $("#suggestMenu").classList.remove("open"); suggestItems = []; suggestIdx = -1; }
  function moveSuggest(dir) {
    if (!suggestItems.length) return;
    suggestIdx = (suggestIdx + dir + suggestItems.length) % suggestItems.length;
    $$(".suggest-opt").forEach((b, i) => b.classList.toggle("active", i === suggestIdx));
  }

  /* ---------- 查找 ---------- */
  function findItem(id) {
    for (let i = 0; i < state.items.length; i++) {
      const it = state.items[i];
      if (it.id === id) return { item: it, index: i, parent: null };
      if (it.type === "folder") {
        const ci = (it.children || []).findIndex(c => c.id === id);
        if (ci >= 0) return { item: it.children[ci], index: ci, parent: it };
      }
    }
    return {};
  }

  /* ---------- 瓦片事件 ---------- */
  function bindTiles() {
    $$(".tile").forEach(tile => {
      if (tile.dataset.add) {
        tile.onclick = () => openSiteModal(null);
        return;
      }
      const id = tile.dataset.id;
      tile.onclick = (e) => {
        if (e.target.closest(".tile-menu-btn")) return;
        const { item } = findItem(id);
        if (!item) return;
        if (item.type === "folder") openFolder(id);
        else openUrl(item.url);
      };
      const mb = tile.querySelector(".tile-menu-btn");
      if (mb) mb.onclick = (e) => { e.stopPropagation(); showTileMenu(e, id); };
      tile.oncontextmenu = (e) => { e.preventDefault(); showTileMenu(e, id); };
    });
    bindDnD();
  }

  function showTileMenu(e, id) {
    const { item } = findItem(id);
    if (!item) return;
    const menu = $("#ctxMenu");
    if (item.type === "folder") {
      menu.innerHTML = `
        <button class="ctx-item" data-act="open">${ICON.open}打开文件夹</button>
        <button class="ctx-item" data-act="rename">${ICON.edit}重命名</button>
        <button class="ctx-item danger" data-act="del">${ICON.trash}解散文件夹</button>`;
    } else {
      menu.innerHTML = `
        <button class="ctx-item" data-act="visit">${ICON.open}打开网站</button>
        <button class="ctx-item" data-act="edit">${ICON.edit}编辑</button>
        <button class="ctx-item danger" data-act="del">${ICON.trash}删除</button>`;
    }
    menu.style.left = Math.min(e.clientX, window.innerWidth - 170) + "px";
    menu.style.top = Math.min(e.clientY, window.innerHeight - 160) + "px";
    menu.classList.add("open");
    $$(".ctx-item", menu).forEach(b => b.onclick = () => {
      const act = b.dataset.act;
      menu.classList.remove("open");
      if (act === "visit") openUrl(item.url);
      else if (act === "open") openFolder(id);
      else if (act === "edit") openSiteModal(id);
      else if (act === "rename") renameFolder(id);
      else if (act === "del") deleteItem(id);
    });
  }

  /* 空白处右键菜单：新建文件夹 / 添加网站 */
  function showBackgroundMenu(e) {
    const menu = $("#ctxMenu");
    menu.innerHTML = `
      <button class="ctx-item" data-act="newfolder">${ICON.plus}新建文件夹</button>
      <button class="ctx-item" data-act="addsite">${ICON.edit}添加网站</button>`;
    menu.style.left = Math.min(e.clientX, window.innerWidth - 170) + "px";
    menu.style.top = Math.min(e.clientY, window.innerHeight - 120) + "px";
    menu.classList.add("open");
    $$(".ctx-item", menu).forEach(b => b.onclick = () => {
      const act = b.dataset.act;
      menu.classList.remove("open");
      if (act === "newfolder") createFolder();
      else if (act === "addsite") openSiteModal(null);
    });
  }
  async function createFolder() {
    const name = await uiPrompt({ title: "新建文件夹", value: "新建文件夹", placeholder: "文件夹名称" });
    if (name == null) return;
    state.items.push({ id: uid(), type: "folder", name: name.trim() || "新建文件夹", children: [] });
    save(); renderGrid(); toast("已新建文件夹");
  }

  function deleteItem(id) {
    const { parent } = findItem(id);
    if (parent) {
      parent.children = parent.children.filter(c => c.id !== id);
      if (parent.children.length <= 1) dissolveFolder(parent.id);
    } else {
      const it = state.items.find(i => i.id === id);
      if (it && it.type === "folder") {
        const idx = state.items.findIndex(i => i.id === id);
        state.items.splice(idx, 1, ...(it.children || []));
      } else {
        state.items = state.items.filter(i => i.id !== id);
      }
    }
    save(); renderGrid(); toast("已删除");
  }
  function dissolveFolder(fid) {
    const idx = state.items.findIndex(i => i.id === fid);
    if (idx < 0) return;
    const f = state.items[idx];
    state.items.splice(idx, 1, ...(f.children || []));
  }

  /* ---------- 拖拽：排序 + 合并文件夹 ---------- */
  let dragId = null;
  function bindDnD() {
    const grid = $("#grid");
    $$(".tile[data-id]", grid).forEach(tile => {
      tile.addEventListener("dragstart", (e) => {
        dragId = tile.dataset.id;
        tile.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", dragId); } catch (x) {}
      });
      tile.addEventListener("dragend", () => {
        dragId = null;
        $$(".tile").forEach(t => t.classList.remove("dragging", "merge-target", "insert-before", "insert-after"));
      });
      tile.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (!dragId || tile.dataset.id === dragId) return;
        clearMarks(tile);
        const r = tile.getBoundingClientRect();
        const rel = (e.clientX - r.left) / r.width;
        const dragType = findItem(dragId).item.type;
        const tgtType = tile.dataset.type;
        if (dragType === "site" && tgtType === "folder") {
          // 拖到文件夹上任意位置都视为放入文件夹
          tile.classList.add("merge-target");
        } else if (dragType === "site" && tgtType === "site" && rel > 0.3 && rel < 0.7) {
          // 两个网站，中心区域合并为新文件夹
          tile.classList.add("merge-target");
        } else {
          tile.classList.add(rel < 0.5 ? "insert-before" : "insert-after");
        }
      });
      tile.addEventListener("dragleave", () => clearMarks(tile));
      tile.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!dragId || tile.dataset.id === dragId) return;
        if (tile.classList.contains("merge-target")) mergeInto(dragId, tile.dataset.id);
        else reorder(dragId, tile.dataset.id, tile.classList.contains("insert-after"));
        clearMarks(tile);
      });
    });
    const addTile = $(".tile.add", grid);
    if (addTile) {
      addTile.addEventListener("dragover", e => e.preventDefault());
      addTile.addEventListener("drop", e => { e.preventDefault(); if (dragId) moveToEnd(dragId); });
    }
  }
  function clearMarks(tile) { tile.classList.remove("merge-target", "insert-before", "insert-after"); }

  function reorder(from, to, after) {
    const fi = state.items.findIndex(i => i.id === from);
    if (fi < 0) return;
    const moved = state.items.splice(fi, 1)[0];
    let ti = state.items.findIndex(i => i.id === to);
    if (after) ti += 1;
    state.items.splice(ti, 0, moved);
    save(); renderGrid();
  }
  function moveToEnd(from) {
    const fi = state.items.findIndex(i => i.id === from);
    if (fi < 0) return;
    const moved = state.items.splice(fi, 1)[0];
    state.items.push(moved);
    save(); renderGrid();
  }
  function mergeInto(from, to) {
    const fromItem = state.items.find(i => i.id === from);
    if (!fromItem || fromItem.type !== "site") return;
    const target = state.items.find(i => i.id === to);
    if (!target) return;
    state.items = state.items.filter(i => i.id !== from);
    if (target.type === "folder") {
      target.children.push(fromItem);
    } else {
      const ti = state.items.findIndex(i => i.id === to);
      const folder = { id: uid(), type: "folder", name: "新建文件夹", children: [target, fromItem] };
      state.items.splice(ti, 1, folder);
    }
    save(); renderGrid(); toast("已合并到文件夹");
  }

  /* ---------- 文件夹弹层 ---------- */
  let openFolderId = null;
  function openFolder(id) {
    openFolderId = id;
    const f = state.items.find(i => i.id === id);
    if (!f) return;
    $("#folderTitle").value = f.name;
    renderFolderGrid();
    $("#folderOverlay").classList.add("open");
  }
  function renderFolderGrid() {
    const f = state.items.find(i => i.id === openFolderId);
    if (!f) return;
    const grid = $("#folderGrid");
    grid.innerHTML = (f.children || []).map(c => {
      const bg = c.icon ? "" : `style="background:${c.color}"`;
      return `<div class="tile" data-id="${c.id}">
        <div class="icon-wrap" ${bg}>${iconInner(c)}</div>
        <div class="label">${escapeHtml(c.name)}</div>
        <button class="tile-menu-btn">⋯</button>
      </div>`;
    }).join("") +
      `<div class="tile add" data-fadd="1"><div class="icon-wrap">${ICON.plus}</div><div class="label">添加</div></div>`;
    $$(".tile", grid).forEach(t => {
      if (t.dataset.fadd) { t.onclick = () => openSiteModal(null, openFolderId); return; }
      const cid = t.dataset.id;
      t.onclick = (e) => { if (e.target.closest(".tile-menu-btn")) return; const c = f.children.find(x => x.id === cid); openUrl(c.url); };
      t.querySelector(".tile-menu-btn").onclick = (e) => { e.stopPropagation(); showFolderItemMenu(e, cid); };
      t.oncontextmenu = (e) => { e.preventDefault(); showFolderItemMenu(e, cid); };
    });
  }
  function showFolderItemMenu(e, cid) {
    const menu = $("#ctxMenu");
    menu.innerHTML = `
      <button class="ctx-item" data-act="edit">${ICON.edit}编辑</button>
      <button class="ctx-item" data-act="out">${ICON.open}移出文件夹</button>
      <button class="ctx-item danger" data-act="del">${ICON.trash}删除</button>`;
    menu.style.left = Math.min(e.clientX, window.innerWidth - 170) + "px";
    menu.style.top = Math.min(e.clientY, window.innerHeight - 160) + "px";
    menu.classList.add("open");
    $$(".ctx-item", menu).forEach(b => b.onclick = () => {
      menu.classList.remove("open");
      const act = b.dataset.act;
      if (act === "edit") openSiteModal(cid, openFolderId);
      else if (act === "out") moveOutOfFolder(cid);
      else if (act === "del") { deleteItem(cid); refreshFolderOrClose(); }
    });
  }
  function moveOutOfFolder(cid) {
    const f = state.items.find(i => i.id === openFolderId);
    if (!f) return;
    const ci = f.children.findIndex(c => c.id === cid);
    if (ci < 0) return;
    const child = f.children.splice(ci, 1)[0];
    state.items.push(child);
    if (f.children.length <= 1) { dissolveFolder(f.id); closeFolder(); }
    save(); renderGrid(); refreshFolderOrClose();
    toast("已移出");
  }
  function refreshFolderOrClose() {
    const f = state.items.find(i => i.id === openFolderId);
    if (!f || f.type !== "folder") { closeFolder(); return; }
    renderFolderGrid();
  }
  function closeFolder() { $("#folderOverlay").classList.remove("open"); openFolderId = null; }
  async function renameFolder(id) {
    const f = state.items.find(i => i.id === id);
    if (!f) return;
    const n = await uiPrompt({ title: "重命名文件夹", value: f.name, placeholder: "文件夹名称" });
    if (n != null && n.trim()) { f.name = n.trim(); save(); renderGrid(); }
  }

  /* ---------- 网站 增/改 模态 ---------- */
  let editCtx = null;
  let selectedColor = PALETTE[0];
  let customIcon = "";
  let favTimer = null;
  function openSiteModal(id, folderId) {
    editCtx = { id, folderId: folderId || null };
    const isEdit = !!id;
    $("#siteModalTitle").textContent = isEdit ? "编辑网站" : "添加网站";
    let item = { name: "", url: "", color: PALETTE[0], icon: "" };
    if (isEdit) { const found = findItem(id).item; if (found) item = Object.assign({}, found); }
    $("#fName").value = item.name;
    $("#fUrl").value = item.url;
    selectedColor = item.color || PALETTE[0];
    customIcon = item.icon || "";
    renderSwatches();
    updateSitePreview();
    $("#siteOverlay").classList.add("open");
    setTimeout(() => $("#fName").focus(), 50);
  }
  function renderSwatches() {
    $("#swatches").innerHTML = PALETTE.map(c =>
      `<div class="swatch ${(c === selectedColor && !customIcon) ? "active" : ""}" data-c="${c}" style="background:${c}"></div>`).join("");
    $$("#swatches .swatch").forEach(s => s.onclick = () => {
      selectedColor = s.dataset.c; customIcon = "";
      renderSwatches(); updateSitePreview();
    });
  }
  function updateSitePreview() {
    const name = $("#fName").value || "?";
    const pv = $("#sitePreview");
    if (customIcon) { pv.style.background = "#fff"; pv.innerHTML = `<img src="${customIcon}" alt="" referrerpolicy="no-referrer">`; }
    else { pv.style.background = selectedColor; pv.innerHTML = `<span class="mono">${monoOf(name)}</span>`; }
  }
  async function autoFavicon() {
    // 根据 URL 自动取站点 favicon
    const url = $("#fUrl").value.trim();
    const host = hostOf(url);
    if (!host) return;
    const favUrl = faviconUrl(url);
    // 先用远程地址即时预览
    customIcon = favUrl;
    renderSwatches();
    updateSitePreview();
    // 再尝试抓取为内嵌 data URL —— 这样图标数据会随导出一并保存，且离线可用
    try {
      const dataUrl = await urlToDataUrl(favUrl);
      if (dataUrl && $("#fUrl").value.trim() === url) {
        customIcon = dataUrl;
        renderSwatches();
        updateSitePreview();
      }
    } catch (e) { /* 抓取失败则保底使用远程地址 */ }
  }
  async function urlToDataUrl(u) {
    const r = await fetch(u);
    if (!r.ok) return null;
    const blob = await r.blob();
    return await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  }
  function saveSite() {
    const name = $("#fName").value.trim();
    let url = $("#fUrl").value.trim();
    if (!name) { toast("请输入名称"); return; }
    if (url && !/^https?:\/\//.test(url)) url = "https://" + url;
    const data = { name, url, color: selectedColor, icon: customIcon };
    if (editCtx.id) {
      const found = findItem(editCtx.id);
      if (found.item) Object.assign(found.item, data);
    } else {
      const site = Object.assign({ id: uid(), type: "site" }, data);
      if (editCtx.folderId) {
        const f = state.items.find(i => i.id === editCtx.folderId);
        if (f) f.children.push(site);
      } else {
        state.items.push(site);
      }
    }
    save(); renderGrid();
    if (openFolderId) renderFolderGrid();
    $("#siteOverlay").classList.remove("open");
    toast(editCtx.id ? "已保存" : "已添加");
  }

  /* ---------- 通用 确认 / 输入 弹窗（替代 prompt/confirm） ---------- */
  let promptResolver = null;
  function uiPrompt({ title, msg, value, placeholder, okText }) {
    return openPrompt({ title, msg, withInput: true, value: value || "", placeholder: placeholder || "", okText: okText || "确定" });
  }
  function uiConfirm({ title, msg, okText, danger }) {
    return openPrompt({ title, msg, withInput: false, okText: okText || "确定", danger });
  }
  function openPrompt({ title, msg, withInput, value, placeholder, okText, danger }) {
    $("#promptTitle").textContent = title || "提示";
    const msgEl = $("#promptMsg");
    if (msg) { msgEl.textContent = msg; msgEl.style.display = ""; } else { msgEl.style.display = "none"; }
    const fieldEl = $("#promptField");
    const input = $("#promptInput");
    if (withInput) { fieldEl.style.display = ""; input.value = value || ""; input.placeholder = placeholder || ""; }
    else { fieldEl.style.display = "none"; }
    const ok = $("#promptOk");
    ok.textContent = okText || "确定";
    ok.classList.toggle("danger", !!danger);
    ok.classList.toggle("primary", !danger);
    $("#promptOverlay").classList.add("open");
    if (withInput) setTimeout(() => { input.focus(); input.select(); }, 50);
    return new Promise(resolve => { promptResolver = { resolve, withInput }; });
  }
  function closePrompt(result) {
    $("#promptOverlay").classList.remove("open");
    if (promptResolver) { promptResolver.resolve(result); promptResolver = null; }
  }

  /* ---------- 设置面板 ---------- */
  function openSettings() { renderSettings(); $("#settingsPanel").classList.add("open"); }
  function closeSettings() { $("#settingsPanel").classList.remove("open"); }
  function renderSettings() {
    $$("#themeSeg button").forEach(b => b.classList.toggle("active", b.dataset.v === state.theme));
    $("#wpGrid").innerHTML = WALLPAPERS.map(w =>
      `<div class="wp-cell ${state.wallpaper === w.id ? "active" : ""}" data-wp="${w.id}" style="background:${w.css}">
        <span class="wp-name">${w.name}</span></div>`).join("") +
      (state.customWallpaper ? `<div class="wp-cell ${state.wallpaper === "__custom" ? "active" : ""}" data-wp="__custom" style="background-image:url(${state.customWallpaper})"><span class="wp-name">自定义</span></div>` : "") +
      `<div class="wp-cell upload" id="wpUpload">${ICON.upload}<span style="font-size:11px;margin-top:4px">上传</span></div>`;
    $$("#wpGrid .wp-cell[data-wp]").forEach(c => c.onclick = () => {
      state.wallpaper = c.dataset.wp;
      if (state.onlineWp) state.onlineWp.enabled = false; // 选固定壁纸即关闭在线壁纸
      scheduleWallpaper();
      save(); applyWallpaper(); renderSettings();
    });
    $("#wpUpload").onclick = () => $("#wpFile").click();
    // 在线壁纸
    const o = state.onlineWp || (state.onlineWp = { enabled: false, style: "nature", auto: true, intervalMin: 60, url: "", ts: 0 });
    $("#onlineWpToggle").checked = !!o.enabled;
    $("#onlineWpOpts").style.display = o.enabled ? "" : "none";
    $("#wpStyleSel").innerHTML = WP_STYLES.map(s => `<option value="${s.id}" ${s.id === o.style ? "selected" : ""}>${s.name}</option>`).join("");
    $("#wpIntervalSel").innerHTML = WP_INTERVALS.map(it => `<option value="${it.v}" ${it.v === o.intervalMin ? "selected" : ""}>${it.name}</option>`).join("");
    $("#wpAutoToggle").checked = !!o.auto;
    $("#wpIntervalRow").style.display = o.auto ? "" : "none";
    $("#engineSel").innerHTML = Object.entries(ENGINES).map(([k, v]) =>
      `<option value="${k}" ${k === state.engine ? "selected" : ""}>${v.name}</option>`).join("");
    $("#engineSel").onchange = async (e) => {
      const prev = state.engine;
      state.engine = e.target.value;
      if (state.engine === "custom" && !state.customEngineUrl) {
        const u = await uiPrompt({ title: "自定义搜索引擎", msg: "输入搜索地址，用 %s 代表关键词", value: "https://example.com/search?q=%s" });
        if (u && u.includes("%s")) state.customEngineUrl = u; else state.engine = prev;
      }
      save(); renderEngine(); renderSettings();
    };
    // 天气
    $("#weatherToggle").checked = !!state.showWeather;
    $("#autoLocateToggle").checked = !!state.autoLocate;
    $("#cityInput").value = state.city || "";
    $("#cityInput").disabled = !!state.autoLocate;
    $("#cityApply").disabled = !!state.autoLocate;
    $("#cityInput").placeholder = state.autoLocate ? "自动定位中…" : "城市，如：北京";
    $("#blurRange").value = state.glassBlur; $("#blurVal").textContent = state.glassBlur;
    $("#radiusRange").value = state.tileRadius; $("#radiusVal").textContent = state.tileRadius;
    $("#colsRange").value = state.cols; $("#colsVal").textContent = state.cols;
    renderFileStatus();
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* ---------- 时钟 / 天气 ---------- */
  const WD = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  function tick() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    $("#clock").innerHTML = `${hh}:${mm}<span class="sec">${ss}</span>`;
    $("#dateLine").textContent = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${WD[d.getDay()]}`;
    const h = d.getHours();
    $("#greeting").textContent = h < 6 ? "夜深了" : h < 12 ? "早上好" : h < 14 ? "中午好" : h < 18 ? "下午好" : "晚上好";
  }

  // WMO 天气代码 → 描述 + 图标
  function weatherInfo(code) {
    const map = {
      0: ["晴", "sun"], 1: ["晴间多云", "sun"], 2: ["多云", "cloud"], 3: ["阴", "cloud"],
      45: ["雾", "cloud"], 48: ["雾凇", "cloud"],
      51: ["小毛雨", "rain"], 53: ["毛雨", "rain"], 55: ["浓毛雨", "rain"],
      61: ["小雨", "rain"], 63: ["中雨", "rain"], 65: ["大雨", "rain"],
      66: ["冻雨", "rain"], 67: ["冻雨", "rain"],
      71: ["小雪", "snow"], 73: ["中雪", "snow"], 75: ["大雪", "snow"], 77: ["雪粒", "snow"],
      80: ["阵雨", "rain"], 81: ["阵雨", "rain"], 82: ["强阵雨", "rain"],
      85: ["阵雪", "snow"], 86: ["强阵雪", "snow"],
      95: ["雷阵雨", "rain"], 96: ["雷阵雨伴冰雹", "rain"], 99: ["雷阵雨伴冰雹", "rain"]
    };
    return map[code] || ["天气", "cloud"];
  }

  function paintWeather() {
    $("#weatherCity").textContent = state.city || "—";
    if (!state.showWeather) {
      $("#weatherIco").innerHTML = ICON.cloud;
      $("#weatherTemp").textContent = "--°";
      $("#weatherDesc").textContent = "已关闭";
      return;
    }
    const c = state.weatherCache;
    if (c) {
      const [desc, ico] = weatherInfo(c.code);
      $("#weatherIco").innerHTML = ICON[ico] || ICON.cloud;
      $("#weatherTemp").textContent = Math.round(c.temp) + "°";
      $("#weatherDesc").textContent = desc;
    } else {
      $("#weatherIco").innerHTML = ICON.cloud;
      $("#weatherTemp").textContent = "…";
      $("#weatherDesc").textContent = "加载中";
    }
  }

  // 浏览器定位服务（精确，优先于一切；不使用 IP，避免代理导致定位错误）
  function getGeoPosition() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve({ error: 2 }); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        err => resolve({ error: err.code }), // 1=拒绝 2=不可用 3=超时
        { enableHighAccuracy: false, timeout: 9000, maximumAge: 10 * 60 * 1000 }
      );
    });
  }
  async function geoPermissionState() {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const s = await navigator.permissions.query({ name: "geolocation" });
        return s.state; // granted | prompt | denied
      }
    } catch (e) {}
    return "prompt";
  }
  // 由经纬度反查城市名（免费、无需 Key）
  async function reverseGeocode(lat, lon) {
    try {
      const d = await fetchJson(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`);
      return d ? (d.city || d.locality || d.principalSubdivision || "") : "";
    } catch (e) { return ""; }
  }
  // 权限未决时，弹通知询问用户是否开启定位
  let geoAsking = false;
  async function maybeAskGeo() {
    if (geoAsking) return;
    if (firstRunPending || fileNoticeOpen) return; // 首次安装先让“数据文件绑定”引导，避免叠加弹窗
    if (state.geoSnoozeTs && nowMs() - state.geoSnoozeTs < 24 * 3600 * 1000) return; // 24h 内被“暂不”则不再打扰
    geoAsking = true;
    const ok = await uiConfirm({ title: "开启定位", msg: "WeTab 想使用您的位置来显示当前所在地的实时天气。是否开启定位服务？", okText: "开启定位" });
    geoAsking = false;
    if (ok) fetchWeather(true); // force：带用户手势触发浏览器定位授权
    else { state.geoSnoozeTs = nowMs(); save(); }
  }

  let weatherReq = 0;
  async function fetchWeather(force) {
    if (!state.showWeather) { paintWeather(); return; }
    const myReq = ++weatherReq;
    const c = state.weatherCache;
    const matchMode = state.autoLocate ? (c && c.auto) : (c && !c.auto && c.city === state.city);
    const fresh = c && matchMode && (nowMs() - c.ts < 30 * 60 * 1000);
    if (fresh && !force) { paintWeather(); return; }
    paintWeather();
    try {
      let lat = null, lon = null, cityName = state.city;
      if (state.autoLocate) {
        const perm = await geoPermissionState();
        if (perm === "granted" || force) {
          const pos = await getGeoPosition();
          if (pos && pos.error == null && pos.lat != null) {
            lat = pos.lat; lon = pos.lon;
            cityName = (await reverseGeocode(lat, lon)) || state.city;
          } else if (pos && pos.error === 1) {
            if (force) toast("定位被拒绝，请在地址栏允许定位，或关闭自动定位后手动输入城市");
          } else if (force) {
            toast("定位失败，请稍后重试或手动输入城市");
          }
        } else if (perm === "prompt") {
          maybeAskGeo(); // 异步询问；本次先用上次城市兜底
        } else if (perm === "denied") {
          if (force) toast("定位已被浏览器拒绝，请在站点设置中允许定位");
        }
      }
      if (lat == null) {
        // 未启用/未授权定位 → 按城市名地理编码兜底
        if (!state.city) { if (myReq === weatherReq) paintWeather(); return; }
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(state.city)}&count=1&language=zh&format=json`;
        const geo = await fetchJson(geoUrl);
        if (!geo || !geo.results || !geo.results.length) { if (force) toast("找不到城市：" + state.city); return; }
        lat = geo.results[0].latitude; lon = geo.results[0].longitude; cityName = state.city;
      }
      const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
      const w = await fetchJson(wUrl);
      if (!w || !w.current) { if (force) toast("天气获取失败"); return; }
      if (myReq !== weatherReq) return; // 已被更新的请求取代，丢弃过期结果
      if (cityName) {
        state.city = cityName;
        const ci = $("#cityInput"); if (ci && !state.autoLocate) ci.value = cityName;
      }
      state.weatherCache = { city: cityName, temp: w.current.temperature_2m, code: w.current.weather_code, ts: nowMs(), auto: !!state.autoLocate };
      save();
      paintWeather();
    } catch (e) {
      if (force) toast("天气获取失败");
      paintWeather();
    }
  }
  function nowMs() { return new Date().getTime(); }
  async function fetchJson(url) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error("http " + r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  /* ---------- 数据 导出 / 导入 ---------- */
  function exportData() {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    a.href = url; a.download = `wetab-backup-${stamp}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast("已导出 JSON");
  }
  function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.items)) throw new Error("格式不正确");
        state = Object.assign(defaultState(), data);
        save();
        applyTheme(); applyWallpaper(); applyVars();
        renderGrid(); renderEngine(); paintWeather(); renderSettings();
        fetchWeather(true);
        toast("导入成功");
      } catch (err) {
        toast("导入失败：" + (err.message || "文件无效"));
      }
    };
    reader.readAsText(file);
  }

  /* ---------- 本地数据文件（File System Access：防丢失 / 跨浏览器） ---------- */
  const FS_DB = "wetab_fs", FS_STORE = "handles", FS_KEY = "dataFile";
  function fsOpen() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(FS_DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(FS_STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function fsPut(v) {
    const db = await fsOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction(FS_STORE, "readwrite");
      tx.objectStore(FS_STORE).put(v, FS_KEY);
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  }
  async function fsGet() {
    const db = await fsOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction(FS_STORE, "readonly");
      const rq = tx.objectStore(FS_STORE).get(FS_KEY);
      rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
    });
  }
  async function fsDel() {
    const db = await fsOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction(FS_STORE, "readwrite");
      tx.objectStore(FS_STORE).delete(FS_KEY);
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  }
  async function fsEnsurePermission(h, write) {
    const opts = { mode: write ? "readwrite" : "read" };
    try {
      if ((await h.queryPermission(opts)) === "granted") return true;
      if ((await h.requestPermission(opts)) === "granted") return true;
    } catch (e) {}
    return false;
  }
  async function writeDataFile() {
    if (!fileHandle) return;
    try {
      if (!(await fsEnsurePermission(fileHandle, true))) return;
      const w = await fileHandle.createWritable();
      await w.write(JSON.stringify(state, null, 2));
      await w.close();
    } catch (e) { /* 写入失败静默，localStorage 仍是主存 */ }
  }
  async function bindDataFile() {
    if (!window.showSaveFilePicker) { toast("当前浏览器不支持文件绑定，请用导出/导入"); return; }
    try {
      const h = await window.showSaveFilePicker({
        suggestedName: "wetab-data.json",
        types: [{ description: "WeTab 数据", accept: { "application/json": [".json"] } }]
      });
      fileHandle = h; await fsPut(h);
      await writeDataFile();
      renderFileStatus();
      toast("已绑定，数据将自动同步到该文件");
    } catch (e) { /* 用户取消 */ }
  }
  async function restoreFromFile() {
    if (!window.showOpenFilePicker) { toast("当前浏览器不支持，请用导入"); return; }
    try {
      const [h] = await window.showOpenFilePicker({
        types: [{ description: "WeTab 数据", accept: { "application/json": [".json"] } }]
      });
      if (!(await fsEnsurePermission(h, false))) { toast("未授权读取该文件"); return; }
      const f = await h.getFile();
      const data = JSON.parse(await f.text());
      if (!data || !Array.isArray(data.items)) throw new Error("文件格式不正确");
      fileHandle = h; await fsPut(h);
      state = Object.assign(defaultState(), data);
      save();
      applyTheme(); applyWallpaper(); applyVars();
      renderGrid(); renderEngine(); paintWeather(); renderSettings();
      fetchWeather(true);
      renderFileStatus();
      toast("已从文件恢复并绑定");
    } catch (e) { toast("恢复失败：" + (e.message || "文件无效")); }
  }
  async function unbindDataFile() {
    fileHandle = null; await fsDel(); renderFileStatus(); toast("已解绑数据文件");
  }
  // 启动时尝试恢复句柄（仅恢复绑定关系，不强行读取，避免覆盖本地最新数据）
  async function restoreFileHandle() {
    try {
      const h = await fsGet();
      if (h) { fileHandle = h; renderFileStatus(); }
    } catch (e) {}
  }
  function renderFileStatus() {
    const el = $("#fileStatus"); if (!el) return;
    const unbind = $("#unbindFileBtn");
    if (fileHandle) {
      el.textContent = "已绑定：" + (fileHandle.name || "本地文件") + "（更改自动写入）";
      if (unbind) unbind.style.display = "";
    } else {
      el.textContent = "未绑定。绑定后所有数据会自动写入你选择的本地文件，换浏览器或重装插件可用「从文件恢复」找回。";
      if (unbind) unbind.style.display = "none";
    }
  }
  // 首次安装的数据文件绑定引导（右下角通知）
  function showFileBindNotice() {
    const n = $("#fileNotice"); if (!n) return;
    fileNoticeOpen = true;
    n.classList.add("show");
  }
  function dismissFileNotice() {
    const n = $("#fileNotice"); if (n) n.classList.remove("show");
    fileNoticeOpen = false; firstRunPending = false;
    state.filePrompted = true; save();
  }

  /* ---------- 图标库 ---------- */
  const ICON = {
    logo: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 7l5 5-5 5M14 7l5 5-5 5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7M6 10v9h12v-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 8h12l-1 12H7L6 8zM9 8V6a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none"><path d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 1010.5 10.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    auto: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 3a9 9 0 010 18z" fill="currentColor"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L18 10l-4-4L4 16v4zM14 6l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5h6v2M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    open: '<svg viewBox="0 0 24 24" fill="none"><path d="M14 4h6v6M20 4l-9 9M18 13v6H5V6h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 16V5M8 9l4-4 4 4M5 19h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    cloud: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 18a4 4 0 010-8 5 5 0 019.6-1.3A3.5 3.5 0 0117 18H7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    rain: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 15a4 4 0 010-8 5 5 0 019.6-1.3A3.5 3.5 0 0117 15H7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    snow: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 14a4 4 0 010-8 5 5 0 019.6-1.3A3.5 3.5 0 0117 14H7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 18h.01M12 19h.01M15 18h.01M10.5 20.5h.01M13.5 20.5h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4v11M8 11l4 4 4-4M5 19h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  /* ---------- 初始化 ---------- */
  function init() {
    // 注入图标
    $("#settingsIco").innerHTML = ICON.gear;
    $("#searchGo").innerHTML = ICON.search;
    $("#weatherIco").innerHTML = ICON.cloud;
    $("#closeFolderIco").innerHTML = ICON.close;
    $("#closeSettingsIco").innerHTML = ICON.close;
    $("#exportIco").innerHTML = ICON.download;
    $("#importIco").innerHTML = ICON.upload;

    applyTheme(); applyWallpaper(); applyVars();
    initOnlineWallpaper();
    renderGrid(); renderEngine();
    cacheRemoteIcons(); // 后台把远程图标缓存为本地 data URL
    tick(); setInterval(tick, 1000);
    // 首次安装：预留首屏给“数据文件绑定”引导，避免与定位询问叠加
    firstRunPending = !state.filePrompted && !!window.showSaveFilePicker;
    fetchWeather(false);

    // 顶栏主题
    $("#themeToggle").onclick = () => {
      const order = ["auto", "light", "dark"];
      state.theme = order[(order.indexOf(state.theme) + 1) % 3];
      save(); applyTheme(); toast("主题：" + (state.theme === "auto" ? "跟随系统" : state.theme === "light" ? "浅色" : "深色"));
    };
    // 天气芯片：点击刷新
    $("#weatherChip").onclick = () => { if (state.showWeather) { toast("刷新天气…"); fetchWeather(true); } };

    // 搜索
    $("#engineBtn").onclick = (e) => { e.stopPropagation(); $("#engineMenu").classList.toggle("open"); };
    $("#searchGo").onclick = doSearch;
    $("#searchInput").addEventListener("keydown", e => {
      if (e.key === "Enter") {
        if (suggestIdx >= 0 && suggestItems[suggestIdx]) { openUrl(suggestItems[suggestIdx].url); closeSuggest(); $("#searchInput").value = ""; }
        else doSearch();
      } else if (e.key === "ArrowDown") { e.preventDefault(); moveSuggest(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); moveSuggest(-1); }
    });
    $("#searchInput").addEventListener("input", () => { liveFilter(); renderSuggest(); });
    $("#searchInput").addEventListener("blur", () => setTimeout(closeSuggest, 150));

    // 设置按钮
    $("#settingsBtn").onclick = openSettings;

    // 网站模态
    $("#fName").addEventListener("input", updateSitePreview);
    $("#fUrl").addEventListener("input", () => { clearTimeout(favTimer); favTimer = setTimeout(autoFavicon, 500); });
    $("#siteCancel").onclick = () => $("#siteOverlay").classList.remove("open");
    $("#siteSave").onclick = saveSite;
    $("#autoIconBtn").onclick = async () => {
      const url = $("#fUrl").value.trim();
      if (!hostOf(url)) { toast("请先输入有效网址"); return; }
      await autoFavicon();
      toast("已获取网站图标");
    };
    // 空白处右键：新建文件夹 / 添加网站
    $(".content").addEventListener("contextmenu", (e) => {
      if (e.target.closest(".tile") || e.target.closest(".searchwrap") || e.target.closest(".topbar")) return;
      e.preventDefault();
      showBackgroundMenu(e);
    });
    $("#iconUploadBtn").onclick = () => $("#iconFile").click();
    $("#iconFile").onchange = (e) => readImage(e.target.files[0], (d) => { customIcon = d; renderSwatches(); updateSitePreview(); });
    $("#siteOverlay").onclick = (e) => { if (e.target.id === "siteOverlay") $("#siteOverlay").classList.remove("open"); };

    // 文件夹
    $("#closeFolder").onclick = closeFolder;
    $("#folderTitle").addEventListener("change", () => {
      const f = state.items.find(i => i.id === openFolderId);
      if (f && $("#folderTitle").value.trim()) { f.name = $("#folderTitle").value.trim(); save(); renderGrid(); }
    });
    $("#folderOverlay").onclick = (e) => { if (e.target.id === "folderOverlay") closeFolder(); };

    // 通用弹窗
    $("#promptOk").onclick = () => closePrompt(promptResolver && promptResolver.withInput ? $("#promptInput").value : true);
    $("#promptCancel").onclick = () => closePrompt(promptResolver && promptResolver.withInput ? null : false);
    $("#promptInput").addEventListener("keydown", e => { if (e.key === "Enter") $("#promptOk").click(); });
    $("#promptOverlay").onclick = (e) => { if (e.target.id === "promptOverlay") closePrompt(promptResolver && promptResolver.withInput ? null : false); };

    // 设置
    $("#closeSettings").onclick = closeSettings;
    $$("#themeSeg button").forEach(b => b.onclick = () => { state.theme = b.dataset.v; save(); applyTheme(); renderSettings(); });
    $("#blurRange").oninput = e => { state.glassBlur = +e.target.value; $("#blurVal").textContent = e.target.value; applyVars(); };
    $("#blurRange").onchange = save;
    $("#radiusRange").oninput = e => { state.tileRadius = +e.target.value; $("#radiusVal").textContent = e.target.value; applyVars(); };
    $("#radiusRange").onchange = save;
    $("#colsRange").oninput = e => { state.cols = +e.target.value; $("#colsVal").textContent = e.target.value; applyVars(); };
    $("#colsRange").onchange = save;
    $("#wpFile").onchange = (e) => readImage(e.target.files[0], (d) => {
      state.customWallpaper = d; state.wallpaper = "__custom";
      if (state.onlineWp) state.onlineWp.enabled = false; scheduleWallpaper();
      save(); applyWallpaper(); renderSettings();
    });
    // 在线壁纸控制
    $("#onlineWpToggle").onchange = (e) => {
      state.onlineWp.enabled = e.target.checked; save();
      $("#onlineWpOpts").style.display = e.target.checked ? "" : "none";
      if (e.target.checked) { if (!state.onlineWp.url) fetchOnlineWallpaper(true); else applyWallpaper(); scheduleWallpaper(); }
      else { scheduleWallpaper(); applyWallpaper(); }
    };
    $("#wpStyleSel").onchange = (e) => {
      state.onlineWp.style = e.target.value; state.onlineWp.url = ""; save();
      fetchOnlineWallpaper(true);
    };
    $("#wpAutoToggle").onchange = (e) => {
      state.onlineWp.auto = e.target.checked; save();
      $("#wpIntervalRow").style.display = e.target.checked ? "" : "none";
      scheduleWallpaper();
    };
    $("#wpIntervalSel").onchange = (e) => {
      state.onlineWp.intervalMin = +e.target.value; save(); scheduleWallpaper();
    };
    $("#wpChangeNow").onclick = () => fetchOnlineWallpaper(true);
    // 天气设置
    $("#weatherToggle").onchange = (e) => {
      state.showWeather = e.target.checked; save();
      if (state.showWeather) fetchWeather(true); else paintWeather();
    };
    $("#autoLocateToggle").onchange = (e) => {
      state.autoLocate = e.target.checked; state.weatherCache = null; save();
      renderSettings();
      if (state.showWeather) fetchWeather(true);
    };
    $("#cityApply").onclick = () => {
      const c = $("#cityInput").value.trim();
      if (!c) { toast("请输入城市"); return; }
      state.city = c; state.weatherCache = null; save();
      if (state.showWeather) fetchWeather(true); else paintWeather();
      toast("已设置城市：" + c);
    };
    $("#cityInput").addEventListener("keydown", e => { if (e.key === "Enter") $("#cityApply").click(); });

    // 数据 导出 / 导入
    $("#exportBtn").onclick = exportData;
    $("#importBtn").onclick = () => $("#importFile").click();
    $("#importFile").onchange = (e) => { importData(e.target.files[0]); e.target.value = ""; };
    // 本地数据文件
    $("#bindFileBtn").onclick = bindDataFile;
    $("#restoreFileBtn").onclick = restoreFromFile;
    $("#unbindFileBtn").onclick = unbindDataFile;
    $("#fileNoticeBind").onclick = async () => { dismissFileNotice(); await bindDataFile(); };
    $("#fileNoticeLater").onclick = dismissFileNotice;
    restoreFileHandle();
    // 首次安装：延迟弹出数据文件绑定引导（若尚未提示且未绑定）
    if (firstRunPending) {
      setTimeout(() => {
        if (!state.filePrompted && !fileHandle && window.showSaveFilePicker) showFileBindNotice();
        else firstRunPending = false;
      }, 1200);
    }
    $("#resetBtn").onclick = async () => {
      const ok = await uiConfirm({ title: "恢复默认", msg: "确定恢复默认设置并清空所有自定义网站？此操作不可撤销。", okText: "恢复默认", danger: true });
      if (ok) {
        localStorage.removeItem(STORE_KEY); state = load();
        applyTheme(); applyWallpaper(); applyVars(); renderGrid(); renderEngine(); paintWeather(); renderSettings();
        fetchWeather(true);
        toast("已恢复默认");
      }
    };

    // 全局点击关闭浮层
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#engineBtn") && !e.target.closest("#engineMenu")) closeEngineMenu();
      if (!e.target.closest(".ctx-menu") && !e.target.closest(".tile-menu-btn")) $("#ctxMenu").classList.remove("open");
      // 点击设置面板以外区域自动关闭（排除设置按钮与其它浮层）
      if ($("#settingsPanel").classList.contains("open") &&
          !e.target.closest("#settingsPanel") && !e.target.closest("#settingsBtn") &&
          !e.target.closest(".overlay") && !e.target.closest(".ctx-menu")) {
        closeSettings();
      }
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        $("#ctxMenu").classList.remove("open"); closeEngineMenu(); closeSuggest();
        $("#siteOverlay").classList.remove("open"); closeFolder(); closeSettings();
        if (promptResolver) closePrompt(promptResolver.withInput ? null : false);
      }
      if (e.key === "/" && document.activeElement.tagName !== "INPUT") { e.preventDefault(); $("#searchInput").focus(); }
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (state.theme === "auto") applyTheme(); });
  }

  function readImage(file, cb) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => cb(reader.result);
    reader.readAsDataURL(file);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
