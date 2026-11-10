// Browser check for the built Jekyll site.
// Usage: serve the built site, then
//   node scripts/verify.cjs [base-url] [prototype-file]
// base-url must include the baseurl from _config.yml, e.g. http://127.0.0.1:4123/modern-se-in-ai/
// With a prototype file, the script also compares screenshots of both pages.
// Needs Playwright: npm i -D playwright && npx playwright install chromium
// PLAYWRIGHT_PATH and CHROME_PATH can point to an existing install.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://127.0.0.1:4123/';
const PROTO = process.argv[3] || '';
const OUT = __dirname + '/../screenshots/';
const sizes = [
  { name: 'phone', w: 390, h: 844, dpr: 3, mobile: true },
  { name: 'tablet', w: 768, h: 1024, dpr: 2, mobile: true },
  { name: 'laptop', w: 1280, h: 800, dpr: 2, mobile: false },
  { name: 'desktop', w: 1920, h: 1080, dpr: 1, mobile: false },
];
const PAPER = 'https://ieeexplore.ieee.org/document/11334617/';
let fails = 0;
const check = (ok, label, got) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${got !== undefined ? '  -> ' + JSON.stringify(got) : ''}`); if (!ok) fails++; };

// external pages get a stub, so the test never depends on other sites
const stubOutside = ctx => ctx.route(/^https?:/, r => {
  const u = r.request().url();
  if (u.startsWith(BASE) || /fonts\.(googleapis|gstatic)/.test(u)) return r.continue();
  return r.fulfill({ status: 200, contentType: 'text/html', body: 'stub' });
});

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
  for (const s of sizes) {
    console.log(`\n== ${s.name} (${s.w}px) ==`);
    const ctx = await b.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: s.dpr, isMobile: s.mobile, hasTouch: s.mobile });
    await stubOutside(ctx);
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const failed = []; p.on('response', r => { if (r.url().startsWith(BASE) && r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
    await p.goto(BASE, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
    await p.evaluate(() => document.documentElement.style.scrollBehavior = 'auto');

    const d = await p.evaluate(() => {
      const fam = new Set(), t = document.body.innerText;
      document.querySelectorAll('body *').forEach(el => { if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) fam.add(getComputedStyle(el).fontFamily); });
      const ink = c => { const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < x.length; i += 4 * 97) if (x[i] < 240 || x[i + 2] > x[i] + 20) n++; return n; };
      const c = document.querySelector('.pcard');
      return {
        sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth,
        fonts: [...fam], heroWeight: getComputedStyle(document.querySelector('.hero h1')).fontWeight,
        heroInk: ink(document.getElementById('field')) > 0, ctaInk: ink(document.getElementById('ctaField')) > 0,
        sections: [...document.querySelectorAll('main section[id], main .cta[id]')].map(e => e.id),
        nav: [...document.querySelectorAll('nav a:not(.nav-mobile-cta)')].map(a => a.textContent.trim()),
        removed: ['Research themes', 'Five research areas', 'Workshops in 2026', 'Speakers from research', 'UOW campuses', 'Our people', 'CaféDSL', 'Projects and news']
          .filter(x => t.includes(x)),
        workshopsHeading: [...document.querySelectorAll('h2, nav a, .sec-head .tag, footer a')].filter(e => /^workshops?$/i.test(e.textContent.trim())).length,
        industryH2: document.querySelector('#industry h2')?.textContent,
        cards: document.querySelectorAll('.pcard').length, title: c?.querySelector('h4')?.textContent,
        stats: [...c.querySelectorAll('.stat b')].map(e => e.textContent), byline: c.querySelector('.byline')?.textContent,
        play: c.querySelector('.play-btn')?.textContent.trim(), detailHidden: c.querySelector('.pdetail').hidden,
        events: document.querySelectorAll('.tl-card').length, years: [...document.querySelectorAll('.tl-year')].map(e => e.textContent.trim()),
        broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src),
        menuBtn: getComputedStyle(document.getElementById('menuBtn')).display !== 'none',
      };
    });
    check(errs.length === 0, 'no JS errors', errs);
    check(failed.length === 0, 'no failed requests on the site', failed);
    check(d.sw <= d.vw, 'no sideways scroll', [d.sw, d.vw]);
    check(d.fonts.length === 1 && d.fonts[0].startsWith('Inter'), 'Inter is the only font', d.fonts);
    check(d.heroWeight === '300' && d.heroInk && d.ctaInk, 'hero weight 300; hero and contact dots painted');
    check(d.sections.join() === 'projects,industry,contact', 'sections: projects, industry, contact', d.sections);
    check(d.nav.join() === 'Projects,Industry,Contact', 'nav: Projects, Industry, Contact', d.nav);
    check(d.removed.length === 0 && d.workshopsHeading === 0, 'research themes, stats strip and old content removed; no "Workshops" heading', d.removed);
    check(d.industryH2 === 'Industry' && d.events === 3 && d.years.join() === '2026', 'Industry: 3 events in 2026', [d.industryH2, d.events]);
    check(d.cards === 1 && d.title === 'Human-AI teams in agile effort estimation', 'one project card');
    check(d.stats.join() === '100%,83%,67%' && /Led by Thanh-Long Bui and Hoa Khanh Dam/.test(d.byline) && d.play === 'Watch demo · 3:07' && d.detailHidden, 'card: numbers, leads, play button, details closed', d.byline);
    check(d.broken.length === 0, 'all images load', d.broken);

    // details panel
    await p.click('.dtoggle'); await p.waitForTimeout(400);
    const o = await p.evaluate(() => {
      const c = document.querySelector('.pcard'), d = c.querySelector('.pdetail');
      d.querySelectorAll('img').forEach(i => i.loading = 'eager');
      return { open: !d.hidden, label: c.querySelector('.dtoggle span').textContent, aria: c.querySelector('.dtoggle').getAttribute('aria-expanded'),
        secs: [...d.querySelectorAll('.flabel')].map(e => e.textContent), steps: d.querySelectorAll('.steps li').length,
        leads: [...d.querySelectorAll('.lead b')].map(e => e.textContent), ph: d.querySelectorAll('.lead .av.ph').length, logos: d.querySelectorAll('.logos').length, partnerLabel: [...d.querySelectorAll('.tlabel')].some(e => e.textContent === 'Industry partners'),
        paper: d.querySelector('.paper .meta')?.textContent, links: [...d.querySelectorAll('.paper a')].map(a => a.href),
        sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth };
    });
    await p.waitForTimeout(500);
    const figOk = await p.evaluate(() => { const i = document.querySelector('.how figure img'); return !!i && i.complete && i.naturalWidth === 1404; });
    check(o.open && o.label === 'Hide project details' && o.aria === 'true', 'details open');
    check(o.secs.join('|') === 'What practitioners said|How it works|Team|Related papers' && o.steps === 3 && figOk, 'details: quote, how it works (figure loads), team, papers', o.secs);
    check(o.leads.join('|') === 'Thanh-Long Bui|Hoa Khanh Dam' && o.ph === 1 && o.logos === 0 && !o.partnerLabel, 'leads shown; no partners block', [o.leads, o.ph, o.logos]);
    check(/ASE 2025 \(A\*\) · Thanh-Long Bui, Hoa Khanh Dam, Rashina Hoda/.test(o.paper) && o.links.includes(PAPER) && o.links.includes('https://arxiv.org/abs/2509.14483'), 'paper: venue, authors, links', o.paper);
    check(o.sw <= o.vw, 'no sideways scroll with details open', [o.sw, o.vw]);
    await p.evaluate(() => scrollTo(0, document.querySelector('#projects').getBoundingClientRect().top + scrollY - 62)); await p.waitForTimeout(200);
    await p.screenshot({ path: OUT + `${s.name}-projects-open.png` });
    await p.click('.dtoggle'); await p.waitForTimeout(200);

    // video window
    await p.click('.play-btn'); await p.waitForTimeout(300);
    const v = await p.evaluate(() => ({ on: document.querySelector('.vmodal').classList.contains('on'), src: (document.querySelector('.vmodal iframe') || {}).src || '' }));
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    const vOff = await p.evaluate(() => !document.querySelector('.vmodal').classList.contains('on') && !document.querySelector('.vmodal iframe'));
    check(v.on && /embed\/0jrmOUjQbi8/.test(v.src) && vOff, 'Watch demo opens and closes the video window');

    // mobile menu
    if (d.menuBtn) {
      await p.evaluate(() => scrollTo(0, 0));
      await p.click('#menuBtn'); await p.waitForTimeout(150);
      const opened = await p.evaluate(() => getComputedStyle(document.querySelector('nav')).display !== 'none');
      await p.screenshot({ path: OUT + `${s.name}-menu.png` });
      await p.click('nav a[href$="#industry"]'); await p.waitForTimeout(400);
      const r = await p.evaluate(() => ({ closed: getComputedStyle(document.querySelector('nav')).display === 'none', top: Math.round(document.querySelector('#industry').getBoundingClientRect().top) }));
      check(opened && r.closed && r.top >= 0 && r.top < 140, 'mobile menu opens, goes to Industry, closes', r);
    }

    for (const [sel, name, off] of [['body', 'hero', 0], ['#projects', 'projects', 62], ['#industry', 'industry', 62], ['#contact', 'contact', 70]]) {
      await p.evaluate(([q, o]) => scrollTo(0, q === 'body' ? 0 : document.querySelector(q).getBoundingClientRect().top + scrollY - o), [sel, off]);
      await p.waitForTimeout(250);
      await p.screenshot({ path: OUT + `${s.name}-${name}.png` });
    }

    // 404 page: same skin, no errors
    const p4 = await ctx.newPage(); const e4 = []; p4.on('pageerror', e => e4.push(e.message));
    await p4.goto(BASE + '404.html', { waitUntil: 'networkidle' });
    const nf = await p4.evaluate(() => ({ h2: document.querySelector('h2')?.textContent, font: getComputedStyle(document.body).fontFamily, home: document.querySelector('.notfound .btn')?.getAttribute('href') }));
    check(e4.length === 0 && nf.h2 === 'Page not found' && nf.font.startsWith('Inter') && nf.home === new URL(BASE).pathname, '404 page uses the skin, no JS errors', [nf, e4]);
    await p4.close();
    await ctx.close();

    // visual match with the prototype (still state, details closed)
    if (PROTO) {
      const shotOf = async (url) => {
        const c2 = await b.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1, isMobile: s.mobile, reducedMotion: 'reduce' });
        await stubOutside(c2);
        const q = await c2.newPage(); await q.goto(url, { waitUntil: 'networkidle' }); await q.waitForTimeout(900);
        await q.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelectorAll('img').forEach(i => i.loading = 'eager'); });
        await q.waitForTimeout(400);
        const h = await q.evaluate(() => document.documentElement.scrollHeight);
        const png = await q.screenshot({ fullPage: true, type: 'png' });
        await c2.close(); return { h, png };
      };
      const A = await shotOf(BASE), B = await shotOf('file://' + PROTO);
      const cmp = await b.newPage();
      const diff = await cmp.evaluate(async ([a, bb]) => {
        const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + src; });
        const [ia, ib] = await Promise.all([load(a), load(bb)]);
        const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height);
        const get = im => { const c = new OffscreenCanvas(w, h), x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, w, h).data; };
        const da = get(ia), db = get(ib); let n = 0;
        for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 30) n++;
        return { pct: +(100 * n / (w * h)).toFixed(3), wa: ia.width, ha: ia.height, wb: ib.width, hb: ib.height };
      }, [A.png.toString('base64'), B.png.toString('base64')]);
      await cmp.close();
      check(A.h === B.h && diff.pct < 0.5, 'same look as the prototype (page height equal, pixel difference < 0.5%)', { jekyllH: A.h, protoH: B.h, diffPct: diff.pct });
    }
  }
  await b.close();
  console.log(fails ? `\n${fails} CHECK(S) FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})();
