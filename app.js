/* Ту Школа — demo app. All roles share one in-browser state (localStorage). */
(function () {
  const { t } = window.I18N;
  const STORE = 'tushkola-demo-v1';
  const DAY = 86400000;

  /* ---------------- Seed data ---------------- */
  const STUDENTS = [
    { id: 's1', name: { ru: 'Алиса Кузнецова', en: 'Alisa Kuznetsova' }, color: '#4b6bfb' },
    { id: 's2', name: { ru: 'Тимур Галиев', en: 'Timur Galiev' }, color: '#1fa57f' },
    { id: 's3', name: { ru: 'Лиана Нгуен', en: 'Liana Nguyen' }, color: '#ef5b3b' },
    { id: 's4', name: { ru: 'Артём Орлов', en: 'Artyom Orlov' }, color: '#d9930c' },
    { id: 's5', name: { ru: 'Сабина Хасанова', en: 'Sabina Khasanova' }, color: '#8b5cf6' },
    { id: 's6', name: { ru: 'Максим Ли', en: 'Maksim Li' }, color: '#0ea5e9' },
    { id: 's7', name: { ru: 'Камила Зарипова', en: 'Kamila Zaripova' }, color: '#db2777' },
    { id: 's8', name: { ru: 'Даниил Смирнов', en: 'Daniil Smirnov' }, color: '#16a34a' },
  ];
  const RULES = [
    { key: 'grade', emoji: '⭐', amount: 10 },
    { key: 'hw', emoji: '📘', amount: 5 },
    { key: 'help', emoji: '🤝', amount: 15 },
    { key: 'duty', emoji: '🧹', amount: 10 },
    { key: 'olymp', emoji: '🏆', amount: 50 },
    { key: 'streak', emoji: '📅', amount: 20 },
  ];
  const ITEMS = [
    { id: 'i1', key: 'item.lunch.full', cat: 'lunch', price: 40, emoji: '🍲' },
    { id: 'i2', key: 'item.lunch.soup', cat: 'lunch', price: 25, emoji: '🥗' },
    { id: 'i3', key: 'item.lunch.bake', cat: 'lunch', price: 10, emoji: '🥐' },
    { id: 'i4', key: 'item.priv.seat', cat: 'priv', price: 60, emoji: '💺' },
    { id: 'i5', key: 'item.priv.music', cat: 'priv', price: 30, emoji: '🎧' },
    { id: 'i6', key: 'item.priv.late', cat: 'priv', price: 50, emoji: '⏰' },
    { id: 'i7', key: 'item.priv.helper', cat: 'priv', price: 40, emoji: '🧑‍🏫' },
  ];

  function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }

  function seed() {
    const r = rng(42);
    const now = Date.now();
    const ops = [];
    let n = 0;
    const op = (o) => ops.push({ id: 'o' + (++n), ...o });
    STUDENTS.forEach((s, si) => {
      // starting balance from earlier weeks
      op({ ts: now - 9 * DAY - si * 3600e3, type: 'award', sid: s.id, amount: 120 + Math.round(r() * 80), ref: 'streak', by: 'teacher' });
      for (let d = 6; d >= 0; d--) {
        const count = 1 + Math.floor(r() * 3);
        for (let k = 0; k < count; k++) {
          const rule = RULES[Math.floor(r() * (RULES.length - 1))];
          op({ ts: now - d * DAY - (k + 1) * 2.3 * 3600e3, type: 'award', sid: s.id, amount: rule.amount, ref: rule.key, by: 'teacher' });
        }
      }
      if (si !== 0) op({ ts: now - (2 + si % 4) * DAY, type: 'goal', sid: s.id, amount: -(150 + Math.round(r() * 120)), ref: 'goal', by: 'student' });
    });
    // Alisa's own story
    op({ ts: now - 3 * DAY, type: 'buy', sid: 's1', amount: -40, ref: 'i1', by: 'student' });
    op({ ts: now - 1 * DAY, type: 'buy', sid: 's1', amount: -10, ref: 'i3', by: 'student' });
    op({ ts: now - 2 * DAY, type: 'goal', sid: 's1', amount: -50, ref: 'goal', by: 'student' });
    op({ ts: now - 4 * 3600e3, type: 'request', sid: 's3', amount: -30, ref: 'i5', by: 'student' });
    ops.sort((a, b) => a.ts - b.ts);
    const reqOp = ops.find((o) => o.type === 'request');
    return {
      v: 1,
      rules: RULES.map((x) => ({ ...x })),
      items: ITEMS.map((x) => ({ ...x })),
      goal: { key: 'goal.default', name: '', target: 3000 },
      ops,
      seq: n,
      requests: [{ id: 'r1', sid: 's3', itemId: 'i5', ts: reqOp.ts, status: 'pending', opId: reqOp.id }],
      codes: [{ code: 'K-' + (1000 + Math.floor(r() * 8999)), sid: 's1', itemId: 'i3', ts: now - DAY }],
      parent: { limit: 60, notify: true },
      teacherLimit: 300,
    };
  }

  let S;
  function load() {
    try { S = JSON.parse(localStorage.getItem(STORE)); } catch (e) { S = null; }
    if (!S || S.v !== 1) { S = seed(); save(); }
  }
  function save() { localStorage.setItem(STORE, JSON.stringify(S)); }
  load();

  const ui = { shopTab: 'lunch', sel: 's2', rule: 'grade', amount: 10 };

  /* ---------------- Helpers ---------------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const coin = '<span class="coin"></span>';
  const fmt = (n) => new Intl.NumberFormat(I18N.locale()).format(n);
  const nm = (s) => (['ru', 'tt'].includes(I18N.lang) ? s.name.ru : s.name.en);
  const first = (s) => nm(s).split(' ')[0];
  const student = (id) => STUDENTS.find((s) => s.id === id);
  const item = (id) => S.items.find((i) => i.id === id);
  const itemName = (it) => (it ? (it.key ? t(it.key) : it.name) : '—');
  const goalName = () => (S.goal.key ? t(S.goal.key) : S.goal.name);
  const ruleName = (key) => { const v = t('earn.' + key + '.t'); return v.startsWith('earn.') ? key : v; };
  const balance = (sid) => S.ops.filter((o) => o.sid === sid).reduce((a, o) => a + o.amount, 0);
  const goalRaised = () => S.ops.filter((o) => o.type === 'goal').reduce((a, o) => a - o.amount, 0);
  const startOfDay = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const today0 = () => startOfDay(Date.now());
  const time = (ts) => new Intl.DateTimeFormat(I18N.locale(), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(ts);
  const initials = (s) => nm(s).split(' ').map((w) => w[0]).join('').slice(0, 2);
  const avatar = (s) => `<span class="avatar-sm" style="background:${s.color}22;color:${s.color}">${esc(initials(s))}</span>`;

  function addOp(o) { S.seq += 1; const rec = { id: 'o' + S.seq, ts: Date.now(), ...o }; S.ops.push(rec); return rec; }

  function opLabel(o) {
    if (o.type === 'award') return ruleName(o.ref);
    if (o.type === 'goal') return goalName();
    return itemName(item(o.ref));
  }
  function opEmoji(o) {
    if (o.type === 'award') return (S.rules.find((r) => r.key === o.ref) || {}).emoji || '⭐';
    if (o.type === 'goal') return '🔭';
    if (o.type === 'refund') return '↩️';
    return (item(o.ref) || {}).emoji || '🎁';
  }
  function opRow(o, withName) {
    const s = student(o.sid);
    const cls = o.amount > 0 ? 'pos' : o.amount < 0 ? 'neg' : '';
    const amt = o.amount ? `<span class="delta ${cls}">${o.amount > 0 ? '+' : '−'}${fmt(Math.abs(o.amount))}${coin}</span>` : '';
    return `<div class="list-row"><span class="ico-sq">${opEmoji(o)}</span><div class="grow"><div class="title">${esc(opLabel(o))}</div><div class="meta">${withName && s ? esc(nm(s)) + ' · ' : ''}${esc(t('log.' + o.type))} · ${time(o.ts)}</div></div>${amt}</div>`;
  }

  function toast(msg, err) {
    const host = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast' + (err ? ' err' : '');
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function weekSum(sid, pos) {
    const from = today0() - 6 * DAY;
    const week = S.ops.filter((o) => o.sid === sid && o.ts >= from);
    if (pos) return week.filter((o) => o.type === 'award').reduce((a, o) => a + o.amount, 0);
    // spending = purchases, requests and goal contributions, minus refunds
    return Math.max(0, week.filter((o) => o.type !== 'award').reduce((a, o) => a - o.amount, 0));
  }
  const lunchToday = (sid) => S.ops.filter((o) => o.sid === sid && o.type === 'buy' && o.ts >= today0() && (item(o.ref) || {}).cat === 'lunch').reduce((a, o) => a - o.amount, 0);

  /* ---------------- Views ---------------- */
  function viewPicker() {
    const cards = [
      ['student', '🎒', 'var(--sky-soft)'], ['parent', '👪', 'var(--tomato-soft)'],
      ['teacher', '🧑‍🏫', 'var(--mint-soft)'], ['admin', '🏫', 'var(--gold-soft)'],
    ].map(([r, e, bg]) => `<a class="who-card" href="#${r}"><div class="avatar" style="background:${bg}">${e}</div><h3>${t('role.' + r)}</h3><p>${t('who.' + r + '.d')}</p><span class="go">→</span></a>`).join('');
    return `<div class="picker"><h1>${t('pick.title')}</h1><p>${t('pick.lead')}</p><div class="who-grid" style="text-align:left">${cards}</div></div>`;
  }

  function goalBlock(sid) {
    const raised = goalRaised();
    const pct = Math.min(100, Math.round((raised / S.goal.target) * 100));
    const mine = sid ? S.ops.filter((o) => o.type === 'goal' && o.sid === sid).reduce((a, o) => a - o.amount, 0) : null;
    const done = raised >= S.goal.target;
    return `<div class="goal-card">
      <div class="goal-name">🔭 ${esc(goalName())}</div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="goal-row"><span>${t('goal.raised', { a: fmt(raised), b: fmt(S.goal.target) })}${coin}</span><span>${pct}%</span></div>
      ${mine !== null ? `<div class="goal-row" style="margin-top:6px"><span>${t('goal.mine', { n: fmt(mine) })}${coin}</span>${done ? `<b style="color:var(--mint)">${t('goal.done')}</b>` : ''}</div>` : ''}
      ${sid && !done ? `<div class="contribute">${[10, 25, 50, 100].map((v) => `<button class="chip" data-action="goal" data-n="${v}">+${v}${coin}</button>`).join('')}</div>` : ''}
    </div>`;
  }

  function topContributors() {
    const map = {};
    S.ops.filter((o) => o.type === 'goal').forEach((o) => { map[o.sid] = (map[o.sid] || 0) - o.amount; });
    const rows = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([sid, v]) => { const s = student(sid); return `<div class="list-row">${avatar(s)}<div class="grow title">${esc(nm(s))}</div><span class="delta">${fmt(v)}${coin}</span></div>`; }).join('');
    return `<h2 style="margin-top:20px">${t('goal.top')}</h2><div class="list">${rows}</div>`;
  }

  function viewStudent() {
    const me = student('s1');
    const bal = balance('s1');
    const tabs = ['lunch', 'priv', 'goal'].map((c) => `<button class="${ui.shopTab === c ? 'active' : ''}" data-action="tab" data-tab="${c}">${t('st.cat.' + c)}</button>`).join('');
    let shop;
    if (ui.shopTab === 'goal') shop = goalBlock('s1') + topContributors();
    else {
      const list = S.items.filter((i) => i.cat === ui.shopTab);
      shop = list.length ? `<div class="items">${list.map((i) => `<div class="item"><span class="emoji">${i.emoji || '🎁'}</span><span class="name">${esc(itemName(i))}</span><div class="row"><span class="price">${fmt(i.price)}${coin}</span><button class="btn btn-sm ${bal >= i.price ? 'btn-primary' : ''}" data-action="buy" data-id="${i.id}">${t(i.cat === 'lunch' ? 'st.buy' : 'st.request')}</button></div></div>`).join('')}</div>` : `<p class="empty">${t('empty')}</p>`;
    }
    const hist = S.ops.filter((o) => o.sid === 's1').slice().reverse().slice(0, 12).map((o) => opRow(o)).join('') || `<p class="empty">${t('empty')}</p>`;
    const codes = S.codes.filter((c) => c.sid === 's1').slice().reverse().slice(0, 4)
      .map((c) => `<div class="list-row"><span class="ico-sq">${(item(c.itemId) || {}).emoji || '🍽️'}</span><div class="grow"><div class="title">${esc(itemName(item(c.itemId)))}</div><div class="meta">${time(c.ts)}</div></div><span class="code-chip">${esc(c.code)}</span></div>`).join('');
    const reqs = S.requests.filter((r) => r.sid === 's1').slice().reverse().slice(0, 5)
      .map((r) => `<div class="list-row"><span class="ico-sq">${(item(r.itemId) || {}).emoji || '🎟️'}</span><div class="grow"><div class="title">${esc(itemName(item(r.itemId)))}</div><div class="meta">${time(r.ts)}</div></div><span class="pill ${r.status === 'approved' ? 'award' : r.status === 'rejected' ? 'buy' : 'request'}">${t('status.' + r.status)}</span></div>`).join('');
    const ways = S.rules.map((r) => `<div class="list-row"><span class="ico-sq">${r.emoji}</span><div class="grow title">${esc(ruleName(r.key))}</div><span class="delta pos">+${r.amount}${coin}</span></div>`).join('');
    return `
      <div class="view-title"><div><h1>${t('st.hello', { name: esc(first(me)) })}</h1><div class="sub">${esc(nm(me))} · 7Б</div></div></div>
      <div class="grid grid-main">
        <div class="stack">
          <div class="balance-card"><small>${t('st.balance')}</small><div class="amount">${fmt(bal)}${coin}</div><div class="week">${t('st.week', { n: fmt(weekSum('s1', true)) })}</div></div>
          <div class="panel"><h2>${t('st.shop')}</h2><div class="tabs">${tabs}</div>${shop}</div>
          <div class="panel"><h2>${t('st.history')}</h2><div class="list">${hist}</div></div>
        </div>
        <div class="stack">
          <div class="panel"><h2>${t('st.myCodes')}</h2><p class="hint">${t('st.codeHint')}</p><div class="list">${codes || `<p class="empty">${t('st.noCodes')}</p>`}</div></div>
          ${reqs ? `<div class="panel"><h2>${t('st.myRequests')}</h2><div class="list">${reqs}</div></div>` : ''}
          <div class="panel"><h2>${t('st.earnWays')}</h2><div class="list">${ways}</div></div>
        </div>
      </div>`;
  }

  function viewParent() {
    const child = student('s1');
    const days = t('days');
    const cols = [];
    for (let d = 6; d >= 0; d--) {
      const from = today0() - d * DAY;
      const v = S.ops.filter((o) => o.sid === 's1' && o.type === 'award' && o.ts >= from && o.ts < from + DAY).reduce((a, o) => a + o.amount, 0);
      cols.push({ v, label: days[(new Date(from).getDay() + 6) % 7], today: d === 0 });
    }
    const max = Math.max(10, ...cols.map((c) => c.v));
    const chart = cols.map((c) => `<div class="col ${c.today ? 'today' : ''}"><b>${c.v}</b><i style="height:${Math.round((c.v / max) * 100)}%"></i><span>${esc(c.label)}</span></div>`).join('');
    const act = S.ops.filter((o) => o.sid === 's1').slice().reverse().slice(0, 8).map((o) => opRow(o)).join('');
    return `
      <div class="view-title"><div><h1>${t('pa.title')}</h1><div class="sub">${t('pa.child')}: ${esc(nm(child))} · 7Б</div></div></div>
      <div class="grid grid-4" style="margin-bottom:18px">
        <div class="stat"><small>${t('hero.card.balance')}</small><strong>${fmt(balance('s1'))}${coin}</strong></div>
        <div class="stat"><small>${t('pa.earnedWeek')}</small><strong style="color:var(--mint)">+${fmt(weekSum('s1', true))}${coin}</strong></div>
        <div class="stat"><small>${t('pa.spentWeek')}</small><strong style="color:var(--tomato)">−${fmt(weekSum('s1', false))}${coin}</strong></div>
        <div class="stat"><small>${t('st.cat.goal')}</small><strong>${Math.min(100, Math.round((goalRaised() / S.goal.target) * 100))}%</strong></div>
      </div>
      <div class="grid grid-main">
        <div class="stack">
          <div class="panel"><h2>${t('pa.week')}</h2><div class="chart">${chart}</div></div>
          <div class="panel"><h2>${t('pa.activity')}</h2><div class="list">${act || `<p class="empty">${t('empty')}</p>`}</div></div>
        </div>
        <div class="stack">
          <div class="panel">
            <h2>${t('pa.settings')}</h2>
            <div class="form-grid">
              <div class="field"><label for="pl">${t('pa.limit')}</label>
                <div class="form-row"><input class="input" id="pl" type="range" min="0" max="150" step="5" value="${S.parent.limit}" data-action-input="limit"><span class="price" id="pl-v" style="min-width:64px">${S.parent.limit}${coin}</span></div>
              </div>
              <div class="hint" style="margin:0">${t('pa.spentToday', { n: lunchToday('s1') })}</div>
              <label class="switch"><span>${t('pa.notify')}</span><input type="checkbox" id="pn" ${S.parent.notify ? 'checked' : ''}></label>
              <button class="btn btn-dark" data-action="parent-save">${t('ad.save')}</button>
            </div>
          </div>
          <div class="panel">${goalBlock(null)}</div>
        </div>
      </div>`;
  }

  function teacherUsed() {
    return S.ops.filter((o) => o.type === 'award' && o.by === 'teacher' && o.ts >= today0()).reduce((a, o) => a + o.amount, 0);
  }

  function viewTeacher() {
    const used = teacherUsed();
    const list = STUDENTS.map((s) => `<div class="student-row ${ui.sel === s.id ? 'selected' : ''}" data-action="sel" data-id="${s.id}">${avatar(s)}<div class="grow title">${esc(nm(s))}</div><span class="price">${fmt(balance(s.id))}${coin}</span></div>`).join('');
    const chips = S.rules.map((r) => `<button class="chip ${ui.rule === r.key ? 'active' : ''}" data-action="rule" data-key="${r.key}">${r.emoji} ${esc(ruleName(r.key))}</button>`).join('');
    const pend = S.requests.filter((r) => r.status === 'pending');
    const reqs = pend.map((r) => { const s = student(r.sid); const it = item(r.itemId); return `<div class="list-row">${avatar(s)}<div class="grow"><div class="title">${esc(itemName(it))}</div><div class="meta">${esc(nm(s))} · ${time(r.ts)}</div></div><button class="btn btn-sm btn-primary" data-action="approve" data-id="${r.id}">${t('te.approve')}</button><button class="btn btn-sm" data-action="reject" data-id="${r.id}">${t('te.reject')}</button></div>`; }).join('');
    const recent = S.ops.filter((o) => o.type === 'award').slice().reverse().slice(0, 8).map((o) => opRow(o, true)).join('');
    const pct = Math.min(100, Math.round((used / S.teacherLimit) * 100));
    return `
      <div class="view-title"><div><h1>${t('te.title')} · 7Б</h1><div class="sub">${t('te.limit', { used: fmt(used), max: fmt(S.teacherLimit) })}</div></div><div style="min-width:220px"><div class="bar"><i style="width:${pct}%;${pct > 85 ? 'background:var(--tomato)' : ''}"></i></div></div></div>
      <div class="grid grid-main">
        <div class="stack">
          <div class="panel">
            <h2>${t('te.award')}</h2>
            <div class="grid grid-2">
              <div class="field"><label>${t('te.student')}</label><div class="students">${list}</div></div>
              <div class="form-grid" style="align-content:start">
                <div class="field"><label>${t('te.reason')}</label><div class="chips">${chips}</div></div>
                <div class="field"><label for="amt">${t('te.amount')}</label><input class="input" id="amt" type="number" min="1" max="200" value="${ui.amount}"></div>
                <button class="btn btn-primary" data-action="award">${t('te.give')} → ${esc(first(student(ui.sel)))}</button>
              </div>
            </div>
          </div>
          <div class="panel"><h2>${t('st.history')}</h2><div class="list">${recent}</div></div>
        </div>
        <div class="stack">
          <div class="panel"><h2>${t('te.requests')} ${pend.length ? `<span class="pill request">${pend.length}</span>` : ''}</h2><div class="list">${reqs || `<p class="empty">${t('te.noRequests')}</p>`}</div></div>
          <div class="panel">${goalBlock(null)}</div>
        </div>
      </div>`;
  }

  function viewAdmin() {
    const circ = STUDENTS.reduce((a, s) => a + balance(s.id), 0);
    const rules = S.rules.map((r) => `<tr><td>${r.emoji} ${esc(ruleName(r.key))}</td><td><input class="input" type="number" min="0" max="500" value="${r.amount}" data-rule="${r.key}"></td></tr>`).join('');
    const cat = S.items.map((i) => `<tr><td>${i.emoji || '🎁'} ${esc(itemName(i))}</td><td>${t('st.cat.' + i.cat)}</td><td><span class="price">${fmt(i.price)}${coin}</span></td><td style="text-align:right"><button class="btn btn-sm" data-action="del-item" data-id="${i.id}">${t('ad.delete')}</button></td></tr>`).join('');
    const log = S.ops.slice().reverse().slice(0, 30).map((o) => { const s = student(o.sid); return `<tr><td style="white-space:nowrap">${time(o.ts)}</td><td><span class="pill ${o.type}">${t('log.' + o.type)}</span></td><td>${s ? esc(nm(s)) : ''}</td><td>${esc(opLabel(o))}</td><td style="text-align:right"><span class="delta ${o.amount > 0 ? 'pos' : o.amount < 0 ? 'neg' : ''}">${o.amount > 0 ? '+' : o.amount < 0 ? '−' : ''}${fmt(Math.abs(o.amount))}</span></td></tr>`; }).join('');
    return `
      <div class="view-title"><div><h1>${t('ad.title')}</h1><div class="sub">${t('role.admin')} · 7Б</div></div><button class="btn btn-sm" data-action="reset">${t('ad.reset')}</button></div>
      <div class="grid grid-4" style="margin-bottom:18px">
        <div class="stat"><small>${t('ad.circulation')}</small><strong>${fmt(circ)}${coin}</strong></div>
        <div class="stat"><small>${t('ad.students')}</small><strong>${STUDENTS.length}</strong></div>
        <div class="stat"><small>${t('ad.ops')}</small><strong>${fmt(S.ops.length)}</strong></div>
        <div class="stat"><small>${t('ad.goal')}</small><strong>${Math.min(100, Math.round((goalRaised() / S.goal.target) * 100))}%</strong></div>
      </div>
      <div class="grid grid-2" style="margin-bottom:18px">
        <div class="panel">
          <h2>${t('ad.rules')}</h2><p class="hint">${t('ad.rulesHint')}</p>
          <table class="table"><tbody>${rules}</tbody></table>
          <div class="form-row" style="margin-top:14px">
            <div class="field"><label for="tl">${t('ad.teacherLimit')}</label><input class="input" id="tl" type="number" min="10" max="5000" value="${S.teacherLimit}"></div>
            <button class="btn btn-dark" data-action="save-rules">${t('ad.save')}</button>
          </div>
        </div>
        <div class="stack">
          <div class="panel">
            <h2>${t('ad.goalSettings')}</h2>
            <div class="form-grid">
              <div class="field"><label for="gn">${t('ad.goalName')}</label><input class="input" id="gn" value="${esc(goalName())}"></div>
              <div class="form-row">
                <div class="field"><label for="gt">${t('ad.goalTarget')}</label><input class="input" id="gt" type="number" min="100" max="100000" value="${S.goal.target}"></div>
                <button class="btn btn-dark" data-action="save-goal">${t('ad.save')}</button>
              </div>
            </div>
          </div>
          <div class="panel">${goalBlock(null)}</div>
        </div>
      </div>
      <div class="panel" style="margin-bottom:18px">
        <h2>${t('ad.catalog')}</h2>
        <div class="table-scroll"><table class="table"><thead><tr><th>${t('ad.itemName')}</th><th>${t('ad.category')}</th><th>${t('ad.price')}</th><th></th></tr></thead><tbody>${cat}</tbody></table></div>
        <div class="form-row" style="margin-top:16px">
          <div class="field" style="flex:2"><label for="in">${t('ad.itemName')}</label><input class="input" id="in" maxlength="60"></div>
          <div class="field"><label for="ic">${t('ad.category')}</label><select class="select" id="ic"><option value="lunch">${t('st.cat.lunch')}</option><option value="priv">${t('st.cat.priv')}</option></select></div>
          <div class="field"><label for="ip">${t('ad.price')}</label><input class="input" id="ip" type="number" min="1" max="1000" value="20"></div>
          <button class="btn btn-primary" data-action="add-item">${t('ad.add')}</button>
        </div>
      </div>
      <div class="panel">
        <h2>${t('ad.log')}</h2>
        <div class="table-scroll"><table class="table"><tbody>${log}</tbody></table></div>
      </div>`;
  }

  /* ---------------- Router ---------------- */
  const ROLES = ['student', 'parent', 'teacher', 'admin'];
  const role = () => { const h = location.hash.replace('#', ''); return ROLES.includes(h) ? h : null; };

  function render() {
    const r = role();
    const html = { student: viewStudent, parent: viewParent, teacher: viewTeacher, admin: viewAdmin }[r] || viewPicker;
    document.getElementById('view').innerHTML = html();
    document.querySelectorAll('#role-tabs a').forEach((a) => a.classList.toggle('active', a.dataset.role === r));
  }

  /* ---------------- Actions ---------------- */
  const view = document.getElementById('view');

  view.addEventListener('input', (e) => {
    if (e.target.id === 'pl') document.getElementById('pl-v').innerHTML = e.target.value + coin;
    if (e.target.id === 'amt') ui.amount = Math.max(1, parseInt(e.target.value, 10) || 1);
  });

  view.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;

    if (a === 'tab') { ui.shopTab = el.dataset.tab; return render(); }

    if (a === 'buy') {
      const it = item(el.dataset.id);
      if (!it) return;
      if (balance('s1') < it.price) return toast(t('st.noMoney'), true);
      if (it.cat === 'lunch') {
        if (lunchToday('s1') + it.price > S.parent.limit) return toast(t('st.limitReached'), true);
        const code = 'K-' + String(1000 + Math.floor(Math.random() * 8999));
        addOp({ type: 'buy', sid: 's1', amount: -it.price, ref: it.id, by: 'student' });
        S.codes.push({ code, sid: 's1', itemId: it.id, ts: Date.now() });
        save(); render(); return toast(t('st.bought', { code }));
      }
      const o = addOp({ type: 'request', sid: 's1', amount: -it.price, ref: it.id, by: 'student' });
      S.requests.push({ id: 'r' + S.seq, sid: 's1', itemId: it.id, ts: Date.now(), status: 'pending', opId: o.id });
      save(); render(); return toast(t('st.requested'));
    }

    if (a === 'goal') {
      const n = parseInt(el.dataset.n, 10);
      if (balance('s1') < n) return toast(t('st.noMoney'), true);
      addOp({ type: 'goal', sid: 's1', amount: -n, ref: 'goal', by: 'student' });
      save(); render(); return toast(t('goal.thanks', { n }));
    }

    if (a === 'parent-save') {
      S.parent.limit = parseInt(document.getElementById('pl').value, 10) || 0;
      S.parent.notify = document.getElementById('pn').checked;
      save(); render(); return toast(t('pa.saved'));
    }

    if (a === 'sel') { ui.sel = el.dataset.id; return render(); }
    if (a === 'rule') {
      ui.rule = el.dataset.key;
      ui.amount = (S.rules.find((r) => r.key === ui.rule) || {}).amount || 10;
      return render();
    }
    if (a === 'award') {
      const n = Math.max(1, Math.min(200, ui.amount));
      if (teacherUsed() + n > S.teacherLimit) return toast(t('te.overLimit'), true);
      addOp({ type: 'award', sid: ui.sel, amount: n, ref: ui.rule, by: 'teacher' });
      save(); render(); return toast(t('te.awarded', { name: first(student(ui.sel)), n }));
    }
    if (a === 'approve' || a === 'reject') {
      const r = S.requests.find((x) => x.id === el.dataset.id);
      if (!r || r.status !== 'pending') return;
      const it = item(r.itemId);
      if (a === 'approve') {
        r.status = 'approved';
        addOp({ type: 'approve', sid: r.sid, amount: 0, ref: r.itemId, by: 'teacher' });
        save(); render(); return toast(t('te.approved'));
      }
      r.status = 'rejected';
      const orig = S.ops.find((o) => o.id === r.opId);
      addOp({ type: 'refund', sid: r.sid, amount: orig ? -orig.amount : (it ? it.price : 0), ref: r.itemId, by: 'teacher' });
      save(); render(); return toast(t('te.rejected'));
    }

    if (a === 'save-rules') {
      view.querySelectorAll('[data-rule]').forEach((inp) => {
        const r = S.rules.find((x) => x.key === inp.dataset.rule);
        if (r) r.amount = Math.max(0, Math.min(500, parseInt(inp.value, 10) || 0));
      });
      S.teacherLimit = Math.max(10, parseInt(document.getElementById('tl').value, 10) || 300);
      save(); render(); return toast(t('ad.saved'));
    }
    if (a === 'save-goal') {
      const name = document.getElementById('gn').value.trim();
      if (name && name !== goalName()) { S.goal.key = ''; S.goal.name = name.slice(0, 80); }
      S.goal.target = Math.max(100, parseInt(document.getElementById('gt').value, 10) || 3000);
      save(); render(); return toast(t('ad.saved'));
    }
    if (a === 'add-item') {
      const name = document.getElementById('in').value.trim();
      const price = Math.max(1, parseInt(document.getElementById('ip').value, 10) || 0);
      const catv = document.getElementById('ic').value;
      if (!name) return document.getElementById('in').focus();
      S.seq += 1;
      S.items.push({ id: 'i' + S.seq, key: '', name: name.slice(0, 60), cat: catv, price, emoji: catv === 'lunch' ? '🍽️' : '🎟️' });
      save(); render(); return toast(t('ad.saved'));
    }
    if (a === 'del-item') {
      S.items = S.items.filter((i) => i.id !== el.dataset.id);
      save(); render(); return;
    }
    if (a === 'reset') {
      if (!confirm(t('ad.resetConfirm'))) return;
      S = seed(); save(); render(); return toast(t('ad.resetDone'));
    }
  });

  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
  window.addEventListener('storage', (e) => { if (e.key === STORE) { load(); render(); } });
  I18N.onChange(render);
  document.addEventListener('DOMContentLoaded', render);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
})();
