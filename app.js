/* ── SHW Legacy Payment Tracker — app.js ── */

const DEPOSITS  = 1076.66;
const HOUSE_TOT = 5383.23;
const HOUSE_OWD = 4306.57;
const MAX_FULL  = 5420;
const LS        = 'shw_glass_v1';

const PP = [
  { id:'martinJr',  f:'Martin Jr',  n:'Martin Jr + Amari',               g:1, b:270, full:270 },
  { id:'etrinity',  f:'Etrinity',   n:'Etrinity Stewart + Demarious',    g:1, b:270, full:270 },
  { id:'zephaniah', f:'Zephaniah',  n:'Zephaniah + Zee + Nova',          g:1, b:270, full:270 },
  { id:'ayshiona',  f:'Ayshiona',   n:"Ayshiona + Ti'Yanna",             g:1, b:270, full:270 },
  { id:'terrence',  f:'Terrence',   n:'Terrence Stewart + partner',      g:1, b:270, full:270 },
  { id:'mary',      f:'Mary',       n:'Mary Stewart',                    g:0, b:270, full:270 },
  { id:'latavia',   f:'Latavia',    n:'Latavia',                         g:0, b:270, full:270 },
  { id:'david',     f:'David',      n:'David Hicks',                     g:0, b:270, full:270 },
  { id:'adrian',    f:'Adrian',     n:'Adrian Hicks',                    g:0, b:290, full:290, note:'incl. $20 reserve' },
  { id:'ravaughn',  f:'Ravaughn',   n:'Ravaughn',                        g:0, b:155, full:270, note:'Phase 1 + $20 reserve' },
  { id:'aaron',     f:'Aaron',      n:'Aaron Hicks Jr + Darion + Aaron', g:1, b:135, full:270 },
  { id:'tarra',     f:'Tarra',      n:'Tarra + Kiley + Kiyonn',          g:1, b:135, full:270 },
  { id:'malachi',   f:'Malachi',    n:'Malachi + Jaylen',                g:1, b:135, full:270 },
  { id:'terrencia', f:'Terrencia',  n:'Terrencia + Sayori',              g:1, b:135, full:270 },
  { id:'jasmine',   f:'Jasmine',    n:'Jasmine Williams + partner',      g:1, b:135, full:270 },
  { id:'martinea',  f:'Martinea',   n:'Martinea Hicks',                  g:0, b:135, full:270 },
  { id:'helena',    f:'Helena',     n:'Helena + Kiyan',                  g:1, b:30,  full:270, note:'$30 reserve' },
  { id:'jonathan',  f:'Jonathan',   n:'Jonathan',                        g:0, b:20,  full:270, note:'$20 reserve' },
  { id:'makayla',   f:'Makayla',    n:'Makayla',                         g:0, b:0,   full:270 },
  { id:'marquise',  f:'Marquise',   n:'Marquise',                        g:0, b:0,   full:270 },
  { id:'imari',     f:"I'Mari",     n:"I'Mari",                          g:0, b:null, full:0,  teen:1 },
];

let S  = {};   // payment state
let PO = null; // partial-input open id

/* ── UTILS ── */
function ini(n) {
  return n.split(' ').filter(w => w && w !== '+').map(w => w[0]).join('').slice(0,2).toUpperCase();
}
function fm(n) {
  return '$' + parseFloat(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function fms(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

/* ── PERSISTENCE ── */
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(LS) || '{}');
    PP.forEach(p => { S[p.id] = (p.id in d) ? d[p.id] : p.b; });
    const dlEl = document.getElementById('deadline');
    if (d._dl && dlEl) dlEl.value = d._dl;
  } catch(e) {
    PP.forEach(p => { S[p.id] = p.b; });
  }
}

function save() {
  try {
    const dlEl = document.getElementById('deadline');
    localStorage.setItem(LS, JSON.stringify({ ...S, _dl: dlEl ? dlEl.value : '' }));
  } catch(e) {}
}

/* ── STATS ── */
function totalCol() {
  return PP.filter(p => !p.teen).reduce((s, p) => s + (S[p.id] || 0), 0);
}

function upStats() {
  const col   = totalCol();
  const hand  = Math.max(col - DEPOSITS, 0);
  const short = Math.max(HOUSE_OWD - hand, 0);
  const fp    = PP.filter(p => !p.teen && (S[p.id] || 0) >= p.full).length;
  const pct   = Math.min(col / MAX_FULL * 100, 100);

  document.getElementById('s-col').textContent   = fms(col);
  document.getElementById('s-hand').textContent  = fms(hand);
  document.getElementById('s-short').textContent = fms(short);
  document.getElementById('s-full').textContent  = fp + '/20';
  document.getElementById('prog-fill').style.width = pct.toFixed(1) + '%';
  document.getElementById('prog-pct').textContent  = pct.toFixed(1) + '%';
  upCD();
}

function upCD() {
  const v  = document.getElementById('deadline').value;
  const el = document.getElementById('cdown');
  if (!v) { el.textContent = ''; return; }
  const d = Math.ceil((new Date(v + 'T00:00:00') - new Date()) / 864e5);
  el.textContent = d < 0 ? 'Past due' : d === 0 ? 'Due today' : d === 1 ? '1 day left' : d + ' days left';
}

function onDL() { save(); upStats(); }

/* ── PAYMENT ACTIONS ── */
function markPaid(id) {
  const p = PP.find(x => x.id === id);
  S[id] = p.full;
  PO = null;
  save(); render();
  toast(p.f + ' marked fully paid ✓');
}

function undo(id) {
  const p = PP.find(x => x.id === id);
  S[id] = p.b;
  save(); render();
  toast('Payment reset for ' + p.f);
}

function togPart(id) {
  PO = (PO === id) ? null : id;
  render();
  if (PO) {
    setTimeout(() => {
      const inp = document.getElementById('pi_' + id);
      if (inp) { inp.focus(); inp.select(); }
    }, 80);
  }
}

function applyPart(id) {
  const inp = document.getElementById('pi_' + id);
  const v   = parseFloat(inp.value);
  if (isNaN(v) || v <= 0) { inp.style.borderColor = 'var(--red)'; return; }
  const p    = PP.find(x => x.id === id);
  const prev = S[id] || 0;
  S[id] = parseFloat(Math.min(prev + v, p.full).toFixed(2));
  PO = null;
  save(); render();
  const ow = p.full - S[id];
  toast(ow <= 0 ? p.f + ' is now fully paid ✓' : fm(v) + ' added · ' + fm(ow) + ' remaining');
}

/* ── RENDER ── */
function render() {
  const paid = PP.filter(p => !p.teen && (S[p.id] || 0) >= p.full);
  const part = PP.filter(p => !p.teen && (S[p.id] || 0) > 0 && (S[p.id] || 0) < p.full);
  const zero = PP.filter(p => !p.teen && (S[p.id] || 0) === 0);
  const teen = PP.filter(p => p.teen);

  let h = '';

  if (paid.length) {
    h += `<div class="sec-head sh-green">✓ Fully paid<span class="sec-ct">${paid.length}</span></div>`;
    paid.forEach(p => {
      const amt = S[p.id];
      const lbl = amt > 270 ? fm(amt) + ' · incl. reserve' : fm(amt);
      h += `<div class="pcard pcard-green">
        <div class="ptop">
          <div class="av av-g">${ini(p.n)}</div>
          <div class="pinfo">
            <div class="pname">${p.n}</div>
            ${p.note ? `<div class="psub">${p.note}</div>` : ''}
          </div>
          <span class="badge bg-green">${lbl}</span>
        </div>
        <div class="btn-row">
          <button class="btn btn-undo" onclick="undo('${p.id}')">↩ Undo</button>
        </div>
      </div>`;
    });
  }

  if (part.length) {
    h += `<div class="sec-head sh-blue">● Balance remaining<span class="sec-ct">${part.length}</span></div>`;
    part.forEach(p => {
      const pd  = S[p.id] || 0;
      const ow  = p.full - pd;
      const pct = (pd / p.full * 100).toFixed(0);
      const op  = PO === p.id;
      h += `<div class="pcard pcard-blue">
        <div class="ptop">
          <div class="av av-b">${ini(p.n)}</div>
          <div class="pinfo">
            <div class="pname">${p.n}</div>
            <div class="psub">paid ${fm(pd)} · owes ${fm(ow)}</div>
          </div>
          <span class="badge bg-blue">${fm(ow)} left</span>
        </div>
        <div class="mini-track"><div class="mini-fill" style="width:${pct}%"></div></div>
        <div class="btn-row">
          <button class="btn btn-paid"    onclick="markPaid('${p.id}')">✓ Mark fully paid</button>
          <button class="btn btn-partial" onclick="togPart('${p.id}')">${op ? 'Cancel' : '+ Add payment'}</button>
        </div>
        ${op ? `<div class="partial-wrap">
          <div class="partial-lbl">How much did they pay?</div>
          <div class="partial-row">
            <span class="dollar">$</span>
            <input class="partial-inp" id="pi_${p.id}" type="number" inputmode="decimal" min="1" max="${ow}" step="1" placeholder="e.g. 50">
            <button class="btn-apply" onclick="applyPart('${p.id}')">Apply</button>
            <button class="btn-x"     onclick="togPart('${p.id}')">✕</button>
          </div>
        </div>` : ''}
      </div>`;
    });
  }

  if (zero.length) {
    h += `<div class="sec-head sh-red">✕ No payment yet<span class="sec-ct">${zero.length}</span></div>`;
    zero.forEach(p => {
      const op = PO === p.id;
      h += `<div class="pcard pcard-red">
        <div class="ptop">
          <div class="av av-d">${ini(p.n)}</div>
          <div class="pinfo">
            <div class="pname">${p.n}</div>
            <div class="psub">$270.00 remaining</div>
          </div>
          <span class="badge bg-red">$270 left</span>
        </div>
        <div class="btn-row">
          <button class="btn btn-paid"    onclick="markPaid('${p.id}')">✓ Mark fully paid</button>
          <button class="btn btn-partial" onclick="togPart('${p.id}')">${op ? 'Cancel' : '+ Add payment'}</button>
        </div>
        ${op ? `<div class="partial-wrap">
          <div class="partial-lbl">How much did they pay?</div>
          <div class="partial-row">
            <span class="dollar">$</span>
            <input class="partial-inp" id="pi_${p.id}" type="number" inputmode="decimal" min="1" max="270" step="1" placeholder="e.g. 50">
            <button class="btn-apply" onclick="applyPart('${p.id}')">Apply</button>
            <button class="btn-x"     onclick="togPart('${p.id}')">✕</button>
          </div>
        </div>` : ''}
      </div>`;
    });
  }

  h += `<div class="sec-head sh-gray">Teenager · not contributing</div>`;
  teen.forEach(p => {
    h += `<div class="pcard">
      <div class="ptop">
        <div class="av av-d">${ini(p.n)}</div>
        <div class="pinfo"><div class="pname">${p.n}</div></div>
        <span class="badge bg-gray">n/a</span>
      </div>
    </div>`;
  });

  document.getElementById('content').innerHTML = h;
  upStats();
}

/* ── OVERVIEW MODAL ── */
function openOv() {
  const col   = totalCol();
  const hand  = Math.max(col - DEPOSITS, 0);
  const short = Math.max(HOUSE_OWD - hand, 0);
  const fp    = PP.filter(p => !p.teen && (S[p.id] || 0) >= p.full).length;
  const pt    = PP.filter(p => !p.teen && (S[p.id] || 0) > 0 && (S[p.id] || 0) < p.full).length;
  const np    = PP.filter(p => !p.teen && (S[p.id] || 0) === 0).length;
  const ow    = PP.filter(p => !p.teen).reduce((s, p) => s + Math.max(p.full - (S[p.id] || 0), 0), 0);
  const pct   = (col / MAX_FULL * 100).toFixed(1);
  const dl    = document.getElementById('deadline').value;
  const dlf   = dl ? new Date(dl + 'T00:00:00').toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) : '—';
  const dd    = dl ? Math.ceil((new Date(dl + 'T00:00:00') - new Date()) / 864e5) : null;
  const dds   = dd !== null ? (dd < 0 ? 'Past due' : dd === 0 ? 'Due today' : dd + ' days left') : '';

  document.getElementById('ov-body').innerHTML = `
    <div class="ov-sec">
      <div class="ov-sec-title">Collection</div>
      <div class="ov-big">
        <div><div class="ov-big-lbl">Collected so far</div><div class="ov-big-val green">${fms(col)}</div></div>
        <div style="text-align:right"><div class="ov-big-lbl">Progress</div><div class="ov-big-val gold">${pct}%</div></div>
      </div>
      <div class="ov-row"><span class="ov-lbl">Deposits paid</span><span class="ov-val amber">${fm(DEPOSITS)}</span></div>
      <div class="ov-row"><span class="ov-lbl">Remaining in hand</span><span class="ov-val blue">${fm(hand)}</span></div>
    </div>
    <div class="ov-sec">
      <div class="ov-sec-title">Houses</div>
      <div class="ov-row"><span class="ov-lbl">Total house cost</span><span class="ov-val">${fm(HOUSE_TOT)}</span></div>
      <div class="ov-row"><span class="ov-lbl">Still owed on houses</span><span class="ov-val red">${fm(HOUSE_OWD)}</span></div>
      <div class="ov-row"><span class="ov-lbl">Shortfall right now</span><span class="ov-val red">${fm(short)}</span></div>
    </div>
    <div class="ov-sec">
      <div class="ov-sec-title">People</div>
      <div class="ov-row"><span class="ov-lbl">Fully paid</span><span class="ov-val green">${fp} of 20</span></div>
      <div class="ov-row"><span class="ov-lbl">Partial payment</span><span class="ov-val blue">${pt} people</span></div>
      <div class="ov-row"><span class="ov-lbl">No payment yet</span><span class="ov-val red">${np} people</span></div>
      <div class="ov-row"><span class="ov-lbl">Total still owed</span><span class="ov-val amber">${fm(ow)}</span></div>
    </div>
    <div class="ov-sec">
      <div class="ov-sec-title">If everyone pays in full</div>
      <div class="ov-row"><span class="ov-lbl">Total collected</span><span class="ov-val">${fm(MAX_FULL)}</span></div>
      <div class="ov-row"><span class="ov-lbl">Total house cost</span><span class="ov-val">${fm(HOUSE_TOT)}</span></div>
      <div class="ov-row"><span class="ov-lbl">Surplus</span><span class="ov-val green">$36.77</span></div>
    </div>
    <div class="ov-sec">
      <div class="ov-sec-title">Deadline</div>
      <div class="ov-row"><span class="ov-lbl">Payment due by</span><span class="ov-val gold">${dlf}</span></div>
      ${dds ? `<div class="ov-row"><span class="ov-lbl">Time remaining</span><span class="ov-val amber">${dds}</span></div>` : ''}
    </div>`;

  document.getElementById('ov-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeOv() {
  document.getElementById('ov-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function closeOvOutside(e) {
  if (e.target === document.getElementById('ov-overlay')) closeOv();
}

/* ── STAT DETAIL MODALS ── */
function showStatDetail(type) {
  const col   = totalCol();
  const hand  = Math.max(col - DEPOSITS, 0);
  const short = Math.max(HOUSE_OWD - hand, 0);
  const fp    = PP.filter(p => !p.teen && (S[p.id] || 0) >= p.full);
  const pt    = PP.filter(p => !p.teen && (S[p.id] || 0) > 0 && (S[p.id] || 0) < p.full);
  const zr    = PP.filter(p => !p.teen && (S[p.id] || 0) === 0);
  let title = '', body = '';

  if (type === 'collected') {
    title = 'Total collected';
    const rows = PP.filter(p => !p.teen && (S[p.id] || 0) > 0).map(p => `
      <div class="ov-row">
        <span class="ov-lbl">${p.f}</span>
        <span class="ov-val ${(S[p.id] || 0) >= p.full ? 'green' : 'blue'}">${fm(S[p.id] || 0)}</span>
      </div>`).join('');
    body = `
      <div class="ov-sec">
        <div class="ov-sec-title">What this means</div>
        <div class="ov-big">
          <div><div class="ov-big-lbl">Total from family</div><div class="ov-big-val green">${fm(col)}</div></div>
          <div style="text-align:right"><div class="ov-big-lbl">Of ${fm(MAX_FULL)} goal</div><div class="ov-big-val gold">${(col/MAX_FULL*100).toFixed(1)}%</div></div>
        </div>
        <div class="ov-row"><span class="ov-lbl">Fully paid (${fp.length})</span><span class="ov-val green">${fm(fp.reduce((s,p)=>s+(S[p.id]||0),0))}</span></div>
        <div class="ov-row"><span class="ov-lbl">Partial paid (${pt.length})</span><span class="ov-val blue">${fm(pt.reduce((s,p)=>s+(S[p.id]||0),0))}</span></div>
        <div class="ov-row"><span class="ov-lbl">No payment (${zr.length})</span><span class="ov-val red">$0.00</span></div>
      </div>
      <div class="ov-sec">
        <div class="ov-sec-title">Breakdown by person</div>
        ${rows}
      </div>`;
  }

  else if (type === 'inhand') {
    title = 'Remaining in hand';
    body = `
      <div class="ov-sec">
        <div class="ov-sec-title">What this means</div>
        <div class="ov-big">
          <div><div class="ov-big-lbl">Currently in hand</div><div class="ov-big-val blue">${fm(hand)}</div></div>
        </div>
        <div class="ov-row"><span class="ov-lbl">Total collected</span><span class="ov-val green">${fm(col)}</span></div>
        <div class="ov-row"><span class="ov-lbl">Minus deposits paid</span><span class="ov-val red">− ${fm(DEPOSITS)}</span></div>
        <div class="ov-row" style="border-top:1px solid var(--border-md);margin-top:4px;padding-top:12px">
          <span class="ov-lbl">Remaining in hand</span><span class="ov-val blue">${fm(hand)}</span>
        </div>
      </div>
      <div class="ov-sec">
        <div class="ov-sec-title">Deposit breakdown</div>
        <div class="ov-row"><span class="ov-lbl">House A deposit</span><span class="ov-val amber">$617.99</span></div>
        <div class="ov-row"><span class="ov-lbl">House B deposit</span><span class="ov-val amber">$458.67</span></div>
        <div class="ov-row"><span class="ov-lbl">Total deposits paid</span><span class="ov-val amber">${fm(DEPOSITS)}</span></div>
      </div>
      <div class="ov-sec">
        <div class="ov-sec-title">What we still need</div>
        <div class="ov-row"><span class="ov-lbl">Still owed on houses</span><span class="ov-val red">${fm(HOUSE_OWD)}</span></div>
        <div class="ov-row"><span class="ov-lbl">In hand right now</span><span class="ov-val blue">${fm(hand)}</span></div>
        <div class="ov-row" style="border-top:1px solid var(--border-md);margin-top:4px;padding-top:12px">
          <span class="ov-lbl">Gap to cover houses</span><span class="ov-val red">${fm(short)}</span>
        </div>
      </div>`;
  }

  else if (type === 'shortfall') {
    title = 'Shortfall';
    const stillOwed = PP.filter(p => !p.teen).reduce((s, p) => s + Math.max(p.full - (S[p.id] || 0), 0), 0);
    body = `
      <div class="ov-sec">
        <div class="ov-sec-title">What this means</div>
        <div class="ov-big">
          <div><div class="ov-big-lbl">Gap to pay off houses</div><div class="ov-big-val red">${fm(short)}</div></div>
        </div>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:14px">
          This is how much we're short of covering the remaining house balance right now, based on what's currently in hand.
        </p>
        <div class="ov-row"><span class="ov-lbl">Still owed on houses</span><span class="ov-val red">${fm(HOUSE_OWD)}</span></div>
        <div class="ov-row"><span class="ov-lbl">Currently in hand</span><span class="ov-val blue">${fm(hand)}</span></div>
        <div class="ov-row" style="border-top:1px solid var(--border-md);margin-top:4px;padding-top:12px">
          <span class="ov-lbl">Shortfall right now</span><span class="ov-val red">${fm(short)}</span>
        </div>
      </div>
      <div class="ov-sec">
        <div class="ov-sec-title">How to close the gap</div>
        <div class="ov-row"><span class="ov-lbl">Still owed by family</span><span class="ov-val amber">${fm(stillOwed)}</span></div>
        <div class="ov-row"><span class="ov-lbl">Shortfall right now</span><span class="ov-val red">${fm(short)}</span></div>
        <div class="ov-row" style="border-top:1px solid var(--border-md);margin-top:4px;padding-top:12px">
          <span class="ov-lbl">Surplus when all pay</span><span class="ov-val green">$36.77</span>
        </div>
        <p style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.5">
          If everyone pays their full share, the shortfall is covered and we end with a $36.77 surplus.
        </p>
      </div>`;
  }

  else if (type === 'fullpaid') {
    title = 'Fully paid';
    body = `
      <div class="ov-sec">
        <div class="ov-sec-title">Payment status</div>
        <div class="ov-big">
          <div><div class="ov-big-lbl">Fully paid</div><div class="ov-big-val green">${fp.length} of 20</div></div>
          <div style="text-align:right"><div class="ov-big-lbl">Still owed</div><div class="ov-big-val red">${20-fp.length} people</div></div>
        </div>
        <div class="ov-row"><span class="ov-lbl">Fully paid</span><span class="ov-val green">${fp.length}</span></div>
        <div class="ov-row"><span class="ov-lbl">Partial payment</span><span class="ov-val blue">${pt.length}</span></div>
        <div class="ov-row"><span class="ov-lbl">No payment</span><span class="ov-val red">${zr.length}</span></div>
      </div>
      <div class="ov-sec">
        <div class="ov-sec-title">Fully paid people (${fp.length})</div>
        ${fp.map(p => `<div class="ov-row"><span class="ov-lbl">${p.n}</span><span class="ov-val green">${fm(S[p.id]||0)}</span></div>`).join('')}
      </div>
      ${pt.length ? `<div class="ov-sec">
        <div class="ov-sec-title">Balance remaining (${pt.length})</div>
        ${pt.map(p => `<div class="ov-row"><span class="ov-lbl">${p.f}</span><span class="ov-val blue">${fm(p.full-(S[p.id]||0))} left</span></div>`).join('')}
      </div>` : ''}
      ${zr.length ? `<div class="ov-sec">
        <div class="ov-sec-title">No payment yet (${zr.length})</div>
        ${zr.map(p => `<div class="ov-row"><span class="ov-lbl">${p.f}</span><span class="ov-val red">${fm(p.full)} owed</span></div>`).join('')}
      </div>` : ''}`;
  }

  document.getElementById('stat-title').textContent = title;
  document.getElementById('stat-body').innerHTML = body;
  document.getElementById('stat-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeStat() {
  document.getElementById('stat-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function closeStatIfOutside(e) {
  if (e.target === document.getElementById('stat-overlay')) closeStat();
}

/* ── COPY REMINDER ── */
function doCopy() {
  const wb  = PP.filter(p => !p.teen && (S[p.id] || 0) < p.full);
  const pt  = wb.filter(p => (S[p.id] || 0) > 0);
  const zr  = wb.filter(p => (S[p.id] || 0) === 0);
  const dl  = document.getElementById('deadline').value;
  const dlf = dl ? new Date(dl + 'T00:00:00').toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) : '';
  const dd  = dl ? Math.ceil((new Date(dl + 'T00:00:00') - new Date()) / 864e5) : null;
  const dds = dd !== null ? (dd < 0 ? 'past due' : dd === 0 ? 'due today' : dd === 1 ? '1 day left' : dd + ' days left') : '';

  let msg = `SHW Legacy Reunion 2026 — Balance Reminder\n━━━━━━━━━━━━━━━━━━━━━\n`;
  if (dlf) msg += `⏰ Payment deadline: ${dlf}${dds ? ' · ' + dds : ''}\n`;
  msg += '\n';

  if (pt.length) {
    msg += `🔵 Balance remaining:\n`;
    pt.forEach(p => {
      const ow = p.full - (S[p.id] || 0);
      msg += `${p.g ? '👥' : '🧍'}  ${p.f} — ${fm(ow)} still owed\n`;
    });
    msg += '\n';
  }

  if (zr.length) {
    msg += `❌ No payment yet:\n`;
    zr.forEach(p => { msg += `${p.g ? '👥' : '🧍'}  ${p.f} — ${fm(p.full)} still owed\n`; });
    msg += '\n';
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💳 Payment methods: Zelle · Apple Pay · Cash App · Cash\n`;
  if (dlf) msg += `📅 ${dds ? dds.charAt(0).toUpperCase() + dds.slice(1) + ' — please' : 'Please'} send your payment before ${dlf}\n`;
  msg += `Stewart · Hicks · Williams · 2026 🙏`;

  navigator.clipboard.writeText(msg).then(done).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = msg; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta); done();
  });

  function done() {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✓ Copied! Paste into your text';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '📋 Copy payment reminder'; btn.classList.remove('copied'); }, 3000);
  }
}

/* ── TOAST ── */
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

/* ── REAL-TIME PERSISTENCE for iOS ── */
// Save when switching apps
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
// iOS Safari specific: save on page exit
window.addEventListener('pagehide', () => save());
// iOS bfcache: reload state when returning
window.addEventListener('pageshow', (e) => { if (e.persisted) { load(); render(); upStats(); } });
// Safety net: save every 10 seconds
setInterval(save, 10000);

/* ── PWA MANIFEST ── */
(function() {
  const mf = {
    name: "SHW Legacy 2026",
    short_name: "SHW Tracker",
    description: "Stewart · Hicks · Williams Family Reunion Payment Tracker",
    start_url: "./",
    display: "standalone",
    background_color: "#0A0A1A",
    theme_color: "#D4AF37",
    icons: [{
      src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' rx='32' fill='%230A0A1A'/%3E%3Ctext x='96' y='135' font-size='110' text-anchor='middle' fill='%23D4AF37' font-family='Georgia,serif' font-weight='bold'%3ES%3C/text%3E%3C/svg%3E",
      sizes: "192x192", type: "image/svg+xml"
    }]
  };
  const blob = new Blob([JSON.stringify(mf)], { type: 'application/json' });
  const link = document.createElement('link');
  link.rel = 'manifest'; link.href = URL.createObjectURL(blob);
  document.head.appendChild(link);
})();

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  load();
  render();
  upStats();
  setInterval(upCD, 60000);
});
