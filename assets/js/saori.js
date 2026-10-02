/* Saori the helper: a small, polite shiba who pops up now and then.
   - idle nudge (no mouse/scroll/key for a while), once per session
   - "welcome back" for returning visitors, once per session
   - click her for a woof
   Dismissible, skipped entirely for prefers-reduced-motion. No dependencies. */
(function(){
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; /* still shows, just without movement */
  var script = document.currentScript;
  if (/[?&]saori-test/.test(location.search) && window.console) console.log('[saori] loaded. reduced motion:', REDUCED);
  var base = script ? script.src.replace(/assets\/js\/saori\.js.*$/, '') : '';
  var IDLE_MS = 20000; /* TESTING value: set back to 45000 before going live */
  var TESTING = /[?&]saori-test/.test(location.search); /* add ?saori-test to the URL to ignore the once-per-session limits */

  var path = location.pathname;
  var generic = ["Still here? You might as well say hi! Contact info is in the end of the page!", "Everything\u2019s interactive. Go on, click some buttons!"];
  var work = ["Still reading? The next project is just a click away.", "Psst. Hire-me window at the bottom. Just saying."].concat(generic);
  var lines = {
    home:  ["Psst. Every window on this desktop opens. Go on, poke around.", "Still there? The Selected work window has the good stuff.", "Bored? Drag stuff around, everything moves!"],
    about: ["Still there? Write me a message in the experience chatbox.", "Try the paint window, it really works!"],
    selected: work.concat(["Psst, have you tried the projects side menu?"]),
    earlier:  work.concat(["Still curious? This is not old, it's vintage!"]),
    work:  work,
    other: generic
  };
  var key = /about/.test(path) ? 'about' : /selected-work/.test(path) ? 'selected' : /earlier-work/.test(path) ? 'earlier' : /\/work\//.test(path) ? 'work' : /(^|\/)(index\.html)?$/.test(path) ? 'home' : 'other';

  function store(kind, k, v){
    if (TESTING && kind === 'sessionStorage') return null;
    try { var s = window[kind]; if (v === undefined) return s.getItem(k); s.setItem(k, v); } catch(e){}
    return null;
  }

  var css = '.saori{position:fixed;right:18px;bottom:18px;z-index:99999;display:flex;align-items:flex-end;gap:8px;pointer-events:none;opacity:0;translate:0 24px;transition:opacity .35s,translate .45s cubic-bezier(.2,1.4,.4,1)}'+
  '.saori.on{opacity:1;translate:0 0;pointer-events:auto}'+
  '.saori__bubble{position:relative;max-width:230px;padding:10px 28px 10px 12px;background:#fff;border:2px solid #25283d;box-shadow:4px 4px 0 rgba(37,40,61,.2);font:600 13px/1.4 "Quicksand",sans-serif;color:#25283d;border-radius:0 !important}'+
  '.saori__bubble::after{content:"";position:absolute;right:-8px;bottom:12px;width:12px;height:12px;background:#fff;border-right:2px solid #25283d;border-top:2px solid #25283d;transform:rotate(45deg)}'+
  '.saori__x{position:absolute;top:2px;right:4px;border:0;background:none;font:700 16px/1 "IBM Plex Mono",monospace;color:#25283d;cursor:pointer;padding:2px 4px}'+
  '.saori__dog{width:64px;height:64px;border:2px solid #25283d;background:#F9F7A1 center/cover no-repeat;cursor:pointer;padding:0;border-radius:50% !important;box-shadow:4px 4px 0 rgba(37,40,61,.2)}'+
  '.saori.on .saori__dog{animation:saoriHop .6s .25s 2}'+
  '.saori__dog.woof{animation:saoriHop .45s 1}'+
  '@keyframes saoriHop{0%,100%{transform:translateY(0)}40%{transform:translateY(-10px) rotate(-6deg)}}'+
  '@media (max-width:640px){.saori{right:10px;bottom:10px}.saori__bubble{max-width:170px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  if (REDUCED) st.textContent += '.saori,.saori.on{transition:none;translate:none}.saori.on .saori__dog,.saori__dog.woof{animation:none}';

  var el = document.createElement('div');
  el.className = 'saori'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<div class="saori__bubble"><button class="saori__x" aria-label="Dismiss">x</button><span class="saori__msg"></span></div>'+
                 '<button class="saori__dog" aria-label="Saori, the helper. Click for a woof" type="button"></button>';
  document.body.appendChild(el);
  var dog = el.querySelector('.saori__dog'), msg = el.querySelector('.saori__msg'), bub = el.querySelector('.saori__bubble');
  dog.style.backgroundImage = 'url("' + base + 'assets/img/y2k/shiba.png")';

  var hideT;
  function say(text, ms){
    msg.textContent = text; bub.style.display = '';
    el.classList.add('on');
    clearTimeout(hideT); hideT = setTimeout(hide, ms || 9000);
  }
  function hide(){ el.classList.remove('on'); }
  el.querySelector('.saori__x').addEventListener('click', function(){ hide(); store('sessionStorage','saori-off','1'); });
  var woofs = ["Bork", "AwAwooo!", "much click!", "Mlem", "fomfom"], wi = 0;
  dog.addEventListener('click', function(){
    dog.classList.remove('woof'); void dog.offsetWidth; dog.classList.add('woof');
    say(woofs[wi++ % woofs.length], 3000);
  });

  /* welcome back (returning visitor, once per session) */
  if (store('localStorage','saori-seen') && !store('sessionStorage','saori-welcomed') && !store('sessionStorage','saori-off')) {
    store('sessionStorage','saori-welcomed','1');
    setTimeout(function(){ say("Welcome back!"); }, 1800);
  }
  store('localStorage','saori-seen','1');

  /* idle nudge, once per session */
  var timer;
  function arm(){
    clearTimeout(timer);
    if (store('sessionStorage','saori-idle') || store('sessionStorage','saori-off')) return;
    timer = setTimeout(function(){
      store('sessionStorage','saori-idle','1');
      var pool = lines[key] || lines.other;
      say(pool[Math.floor(Math.random() * pool.length)], 11000);
    }, IDLE_MS);
  }
  ['mousemove','scroll','keydown','pointerdown','touchstart'].forEach(function(ev){
    window.addEventListener(ev, arm, { passive: true });
  });
  arm();
})();
