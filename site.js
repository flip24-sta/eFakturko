/* eFakturko official site — shared interactions. Every block is guarded so each page loads only what it uses. */
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  // mobile menu
  const burger = $('#burger'), menu = $('#mnav');
  if (burger && menu) burger.onclick = () => { const open = menu.hidden; menu.hidden = !open; burger.setAttribute('aria-expanded', String(open)); };

  // countdown to the e-invoicing mandate
  if ($('#cd-d')) {
    const target = new Date('2027-01-01T00:00:00+01:00').getTime();
    const p = (n) => String(n).padStart(2, '0');
    const tick = () => { let d = Math.max(0, target - Date.now()); const D = Math.floor(d / 864e5); d -= D * 864e5; const H = Math.floor(d / 36e5); d -= H * 36e5; const M = Math.floor(d / 6e4); d -= M * 6e4; const S = Math.floor(d / 1e3);
      $('#cd-d').textContent = D; $('#cd-h').textContent = p(H); $('#cd-m').textContent = p(M); $('#cd-s').textContent = p(S); };
    tick(); setInterval(tick, 1000);
  }

  // pricing monthly / yearly toggle
  $$('.ptoggle button').forEach((b) => (b.onclick = () => {
    $$('.ptoggle button').forEach((x) => x.classList.toggle('on', x === b));
    const c = b.dataset.cycle; $$('.plans [data-m]').forEach((el) => { el.textContent = el.dataset[c]; });
  }));

  // partner commission calculator (Pro 14.70 €/month; 30 %, 40 % from 25 clients)
  const pr = $('#pr');
  if (pr) {
    const calc = () => { const n = +pr.value, rate = n >= 25 ? 0.4 : 0.3; $('#pc').textContent = n; $('#po').textContent = Math.round(n * 14.7 * 12 * rate).toLocaleString('sk-SK') + ' €'; $('#pt').textContent = (n >= 25 ? 'Úroveň Partner Gold · 40 %' : 'Úroveň Partner · 30 %'); };
    pr.oninput = calc; calc();
  }

  // module tabs on the home page
  const mod = $('#mod');
  if (mod) {
    const MODS = [
      ['Fakturácia', 'Faktúra za pár sekúnd a QR platba na každej', 'Vystavte faktúru z jednej vety alebo klasicky vo formulári. Číslovanie, variabilný symbol a DPH sa nastavia samé.', ['Faktúra z vety s AI', 'PAY by square QR', 'PDF a e‑faktúra (UBL XML)', 'Platiteľ aj neplatiteľ DPH'], ['Nová faktúra', 'Kaviareň Mlyn s.r.o.', '1 549,80 €', 'Odoslaná']],
      ['Upomienky', 'Klienti platia, vy nemusíte volať', 'eFakturko pošle pripomienku v deň 1, 7 a 14 po splatnosti. Každý stupeň má iný tón, text napíše AI.', ['3 stupne upomienok', 'Automatické odoslanie', 'História komunikácie pri faktúre'], ['Upomienka 2/3', 'Horská chata Tatry', '1 180,00 €', 'Odoslaná']],
      ['Opakované faktúry', 'Paušály sa vystavia samé', 'Mesačné služby, prenájmy alebo správa webu. Nastavíte raz, eFakturko vystaví a odošle faktúru každé obdobie.', ['Mesačne, štvrťročne alebo ročne', 'Automatické odoslanie e‑mailom', 'Pozastavenie jedným klikom'], ['Opakovaná faktúra', 'Pekáreň u Žofie', '350,00 €', 'Každý mesiac']],
      ['Daňový radar', 'Viete, koľko vám zostane', 'Priebežný odhad dane z príjmov a odvodov, porovnanie paušálnych a skutočných výdavkov a sledovanie hranice DPH.', ['Odhad dane a odvodov', 'Paušál vs. skutočné výdavky', 'Daňový kalendár s termínmi'], ['Odkladajte si mesačne', 'Ukážkový odhad', '784 €', 'na daň a odvody']],
      ['AI asistent', 'Opýtajte sa čokoľvek o fakturácii', 'Asistent odpovedá na otázky o DPH, paušáloch a e‑faktúre a z vašich dát pripraví postrehy.', ['Otázky o daniach a DPH', 'Postrehy z vašich faktúr', 'Vystavenie faktúry v chate'], ['AI postreh', 'Hranica DPH', '84 %', 'obratu za 12 mesiacov']],
    ];
    const show = (i) => { const m = MODS[i];
      mod.innerHTML = `<div><div class="eyebrow">${m[0]}</div><h3>${m[1]}</h3><p>${m[2]}</p><ul>${m[3].map((x) => `<li>${x}</li>`).join('')}</ul><a href="funkcie.html" class="btn btn-primary">Viac o funkciách →</a></div>
        <div class="mod-art"><div class="blob"></div><div class="card"><div style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em">${m[4][0]}</div><b style="display:block;font-size:20px;color:var(--ink);margin:6px 0 16px">${m[4][1]}</b><div style="display:flex;justify-content:space-between;align-items:flex-end;gap:10px"><b style="font-size:30px;color:var(--violet)">${m[4][2]}</b><span class="pill p-sent" style="font-size:12px;padding:4px 10px">${m[4][3]}</span></div></div></div>`;
      $$('.mods button').forEach((b, k) => b.classList.toggle('on', k === i)); };
    $$('.mods button').forEach((b, k) => (b.onclick = () => show(k))); show(0);
  }

  // Netlify Forms: submit via fetch and show an inline confirmation
  $$('form[data-netlify]').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = f.querySelector('button[type=submit]'); const msg = f.querySelector('.form-msg');
    btn.disabled = true; const old = btn.textContent; btn.textContent = 'Odosielam…';
    try {
      const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(f)).toString() });
      if (!r.ok) throw new Error(r.status);
      f.reset(); msg.textContent = 'Ďakujeme, správa bola odoslaná. Ozveme sa vám e‑mailom.'; msg.className = 'form-msg ok';
    } catch { msg.textContent = 'Správu sa nepodarilo odoslať. Skúste to prosím znova o chvíľu.'; msg.className = 'form-msg err'; }
    btn.disabled = false; btn.textContent = old;
  }));

  // "Pre koho" tabs
  const audPanel = $('#audPanel');
  if (audPanel) {
    const ICON = { user: '<path d="M12 12a5 5 0 100-10 5 5 0 000 10zM3 22a9 9 0 0118 0"/>', firm: '<path d="M3 21V7l9-4 9 4v14M9 21v-6h6v6M3 21h18"/>', calc: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h8"/>' };
    const AUD = [
      ['Živnostník', 'user', 'Faktúry za pár sekúnd a prehľad o daniach počas celého roka, nie až v marci.', ['Faktúra z jednej vety a QR platba', 'Upozornenie na blížiacu sa hranicu DPH', 'Odhad dane a odvodov v Daňovom radare', 'Plán Štart zadarmo navždy']],
      ['Firma', 'firm', 'Opakované faktúry, automatické upomienky a pripravenosť na povinnú e‑faktúru.', ['Opakované faktúry pre paušály a prenájmy', 'Automatické upomienky v 3 krokoch', 'Export UBL XML pre e‑faktúru 2027', 'Viac firiem a používateľov (pripravujeme)']],
      ['Účtovnícka firma', 'calc', 'Klienti fakturujú správne a vy dostávate podklady v jednom formáte. Za každého klienta provízia.', ['Provízia 30 až 40 % z platieb klientov', 'Export CSV a UBL XML za obdobie', 'White‑label od 25 klientov', 'Účtovník zadarmo v platených plánoch']],
    ];
    const show = (i) => {
      const a = AUD[i];
      audPanel.innerHTML = `<div><h3>${a[0]}</h3><p>${a[2]}</p><ul>${a[3].map((x) => `<li>${x}</li>`).join('')}</ul><a href="${i === 2 ? 'partneri.html' : 'app.html#/onboarding'}" class="btn btn-primary" style="margin-top:20px">${i === 2 ? 'Program pre účtovníkov' : 'Začať zadarmo'} →</a></div><div class="aud-art"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICON[a[1]]}</svg><b>${a[0]}</b></div>`;
      $$('.aud-list button').forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', String(k === i)); });
    };
    $$('.aud-list button').forEach((b, k) => (b.onclick = () => show(k)));
    show(0);
  }

  // "Moduly" dropdown: click support for touch devices
  $$('.dd > button').forEach((b) => (b.onclick = (e) => {
    e.stopPropagation();
    const d = b.parentElement; const open = !d.classList.contains('open');
    d.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
  }));
  document.addEventListener('click', () => $$('.dd.open').forEach((d) => d.classList.remove('open')));

  // Company search (public tool page)
  const regForm = $('#regForm');
  if (regForm) {
    const out = $('#regOut');
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const TYPE = { firma: 'firma', szco: 'živnostník', iny: 'iný subjekt' };
    const card = (r) => `<div class="reg-card"><div class="reg-h"><b>${esc(r.name)}</b><span class="pill p-sent">${TYPE[r.type] || ''}</span></div>
      <dl><dt>IČO</dt><dd>${esc(r.ico)}</dd><dt>Sídlo</dt><dd>${esc(r.address || '—')}</dd>${r.register ? `<dt>Register</dt><dd>${esc(r.registerText.replace('Zapísaný v registri: ', ''))}</dd>` : ''}${r.established ? `<dt>Vznik</dt><dd>${esc(r.established.split('-').reverse().join('. '))}</dd>` : ''}</dl>
      <button type="button" class="btn btn-ghost btn-sm" data-copy="${esc(`${r.name}\n${r.address}\nIČO: ${r.ico}`)}">Kopírovať údaje</button></div>`;
    const run = async (q) => {
      out.innerHTML = '<p class="reg-msg"><span class="spinner"></span> Hľadám v registri…</p>';
      try {
        const r = await fetch(`/.netlify/functions/register?q=${encodeURIComponent(q)}`);
        const j = await r.json();
        if (!r.ok) { out.innerHTML = `<p class="reg-msg err">${esc(j.error || 'Vyhľadávanie zlyhalo')}</p>`; return; }
        const list = j.results || (j.result ? [j.result] : []);
        out.innerHTML = list.length ? `<p class="reg-msg">Nájdené: ${list.length}${j.total > list.length ? ` z ${j.total} (spresnite názov)` : ''}</p><div class="reg-grid">${list.map(card).join('')}</div>` : '<p class="reg-msg">Nič sa nenašlo. Skúste iný názov alebo presné IČO.</p>';
      } catch { out.innerHTML = '<p class="reg-msg err">Register je dočasne nedostupný. Skúste to o chvíľu.</p>'; }
    };
    regForm.addEventListener('submit', (e) => { e.preventDefault(); const q = $('#regQ').value.trim(); if (q.length >= 3) run(q); });
    out.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-copy]'); if (!b) return;
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Skopírované ✓'; } catch { b.textContent = 'Kopírovanie nie je dostupné'; }
    });
  }
})();
