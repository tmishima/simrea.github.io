// Xerox Star風 デスクトップ挙動（ロゴ埋め込み、右下ドック）
(function(){
  const desktop = document.getElementById('desktop');
  const templates = {
    profile: document.getElementById('tmpl-profile'),
    portfolio: document.getElementById('tmpl-portfolio'),
    contact: document.getElementById('tmpl-contact'),
    trash: document.getElementById('tmpl-trash'),
    properties: document.getElementById('tmpl-properties')
  };

  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

  // アイコン選択／開く
  desktop.addEventListener('click', (e) => {
    const icon = e.target.closest('.icon');
    if (!icon) return;
    desktop.querySelectorAll('.icon').forEach(i => i.classList.remove('selected'));
    icon.classList.add('selected');
    if (isTouch) openByIcon(icon);
  });
  //desktop.addEventListener('dblclick', (e) => {
  desktop.addEventListener('click', (e) => {
    const icon = e.target.closest('.icon');
    if (!icon) return;
    openByIcon(icon);
  });

  // 作品カード→サブウィンドウ
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const content = card.dataset.subwindowContent || '';
    const title = card.dataset.subwindowTitle || '詳細';
    const tpl = document.createElement('template');
    tpl.innerHTML = `<article class="window-body">${content}</article>`;
    openWindow('sub-' + title, tpl, title);
  });

  // プロパティシート
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#btn-properties');
    if (!btn) return;
    openWindow('properties', templates.properties, 'プロパティ');
  });

  function openByIcon(icon){
    const key = icon.dataset.target;
    const tpl = templates[key];
    if (!tpl) return;
    openWindow(key, tpl, icon.querySelector('.icon-label')?.textContent || key);
  }

  function openWindow(id, templateEl, title){
    const existing = document.querySelector(`.window[data-id="${CSS.escape(id)}"]`);
    if (existing){ bringToFront(existing); return; }

    const win = document.createElement('section');
    win.className = 'window';
    win.dataset.id = id;
    win.innerHTML = `
      <div class="titlebar" aria-grabbed="false">
        <div class="title">${escapeHtml(title)}</div>
        <div class="controls">
          <button class="control-btn" data-act="min" title="最小化">–</button>
          <button class="control-btn" data-act="close" title="閉じる">×</button>
        </div>
      </div>
    `;
    const body = templateEl.content ? templateEl.content.cloneNode(true) : document.createRange().createContextualFragment(templateEl.innerHTML);
    win.appendChild(body);
    document.body.appendChild(win);
    bringToFront(win);
    makeDraggable(win.querySelector('.titlebar'), win);

    // コントロール
    win.addEventListener('click', (e) => {
      const btn = e.target.closest('.control-btn');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'close') { win.remove(); return; }
      if (act === 'min') { win.style.width = '360px'; }
    });

    // 右クリックで削除デモ→ごみ箱へ記録
    win.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const trashWin = ensureTrash();
      const list = trashWin.querySelector('#trash-list');
      const li = document.createElement('li');
      li.textContent = `[削除] ${win.querySelector('.title').textContent}`;
      list.appendChild(li);
      win.remove();
    });
  }

  function ensureTrash(){
    const id = 'trash';
    let trashWin = document.querySelector(`.window[data-id="${id}"]`);
    if (!trashWin) {
      openWindow('trash', templates.trash, 'ごみ箱');
      trashWin = document.querySelector(`.window[data-id="${id}"]`);
    }
    bringToFront(trashWin);
    return trashWin;
  }

  function bringToFront(win){
    document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
    win.classList.add('active');
  }

  function makeDraggable(handle, win){
    let sx=0, sy=0, ox=0, oy=0, dragging=false;
    const onMove = (e)=>{ if(!dragging) return; win.style.left = (ox + e.clientX - sx) + 'px'; win.style.top = (oy + e.clientY - sy) + 'px'; };
    const onUp = ()=>{ dragging=false; handle.setAttribute('aria-grabbed','false'); document.removeEventListener('mousemove', onMove); };

    handle.addEventListener('mousedown', (e)=>{
      dragging=true; handle.setAttribute('aria-grabbed','true');
      sx = e.clientX; sy = e.clientY;
      const rect = win.getBoundingClientRect(); ox = rect.left; oy = rect.top;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp, { once: true });
    });
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
  }
})();
