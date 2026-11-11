// Browser check for the built Jekyll site.
// Usage: serve the built site, then
//   node scripts/verify.cjs [base-url]
// base-url must include the baseurl from _config.yml, e.g. http://127.0.0.1:4077/modern-se-in-ai/
// Needs Playwright: npm i -D playwright && npx playwright install chromium
// PLAYWRIGHT_PATH and CHROME_PATH can point to an existing install.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://127.0.0.1:4077/modern-se-in-ai/';
const OUT = __dirname + '/../screenshots/';
const EMAIL = 'mailto:hoa@uow.edu.au';
const PROJECT = 'research/human-ai-teams-effort-estimation/';
const sizes = [
  { name: 'phone', w: 390, h: 844, dpr: 2, mobile: true },
  { name: 'tablet', w: 768, h: 1024, dpr: 2, mobile: true },
  { name: 'desktop', w: 1440, h: 900, dpr: 1, mobile: false },
];
// text that Hoa's review removed from the site
const REMOVED = ['Request a live demo', 'Work with us', 'What practitioners said', 'How it works', 'Led by', 'Show project details', 'Program details'];
let fails = 0;
const check = (ok, label, got) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && got !== undefined ? '  -> ' + JSON.stringify(got) : ''}`); if (!ok) fails++; };

// outside pages get a stub, so the test never depends on other sites
const stubOutside = ctx => ctx.route(/^https?:/, r => {
  const u = r.request().url();
  if (u.startsWith(BASE) || /fonts\.(googleapis|gstatic)/.test(u)) return r.continue();
  return r.fulfill({ status: 200, contentType: 'text/html', body: 'stub' });
});

// checks that apply to every page
async function common(p) {
  return p.evaluate(([removed]) => {
    const t = document.body.innerText;
    const c = document.getElementById('ctaField');
    let ink = false;
    if (c) { const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 0; i < x.length; i += 4) if (x[i + 2] > x[i] + 20) { ink = true; break; } }
    return {
      sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth,
      removed: removed.filter(x => t.includes(x)),
      broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src),
      contact: [...document.querySelectorAll('a')].filter(a => /^contact us$/i.test(a.textContent.trim())).map(a => a.getAttribute('href')),
      nav: [...document.querySelectorAll('nav a:not(.nav-mobile-cta)')].map(a => a.textContent.trim()),
      ctaInk: ink,
    };
  }, [REMOVED]);
}
function commonChecks(c, label) {
  check(c.sw <= c.vw, `${label}: no sideways scroll`, [c.sw, c.vw]);
  check(c.removed.length === 0, `${label}: removed text is gone`, c.removed);
  check(c.broken.length === 0, `${label}: all images load`, c.broken);
  check(c.contact.length >= 2 && c.contact.every(h => h.startsWith(EMAIL)), `${label}: every "Contact us" opens an email to Hoa`, c.contact);
  check(c.nav.join() === 'Research,Industry,Community', `${label}: nav is Research, Industry, Community`, c.nav);
  check(c.ctaInk, `${label}: contact block dots painted`);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
  for (const s of sizes) {
    console.log(`\n== ${s.name} (${s.w}px) ==`);
    const ctx = await b.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: s.dpr, isMobile: s.mobile, hasTouch: s.mobile });
    await stubOutside(ctx);
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const failed = []; p.on('response', r => { if (r.url().startsWith(BASE) && r.status() >= 400 && !r.url().endsWith('404.html')) failed.push(r.status() + ' ' + r.url()); });
    const go = async (path) => { await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(700); await p.evaluate(() => document.documentElement.style.scrollBehavior = 'auto'); };
    const shot = async (name, full = true) => p.screenshot({ path: OUT + `${s.name}-${name}.png`, fullPage: full });

    // 1. home: hero and 3 category cards with cover images
    await go('');
    commonChecks(await common(p), 'home');
    const h = await p.evaluate(() => ({
      cards: [...document.querySelectorAll('.ccard h3')].map(e => e.textContent.trim()),
      covers: [...document.querySelectorAll('.ccover img')].map(i => i.naturalWidth > 0),
      counts: [...document.querySelectorAll('.ccount')].map(e => e.textContent.trim()),
    }));
    check(h.cards.join() === 'Research,Industry,Community' && h.covers.length === 3 && h.covers.every(Boolean), 'home: 3 category cards with covers', h);
    await shot('home');
    await p.locator('.ccard').nth(1).scrollIntoViewIfNeeded();
    const box = await p.locator('.ccard').nth(1).boundingBox();
    await p.mouse.click(box.x + box.width / 2, box.y + 40); await p.waitForURL(BASE + 'industry/', { timeout: 5000 }).catch(() => {});
    check(p.url() === BASE + 'industry/', 'home: a click on the Industry card cover opens /industry/', p.url());

    // 2. research page: grid of project cards
    await go('research/');
    commonChecks(await common(p), 'research');
    const r = await p.evaluate(() => ({
      h1: document.querySelector('.page-head h1')?.textContent, cards: document.querySelectorAll('.igrid .icard').length,
      title: document.querySelector('.icard h3')?.textContent.trim(),
      tags: [...document.querySelectorAll('.icard .tags span')].map(e => e.textContent), high: document.querySelectorAll('.icard .stat, .icard .ihigh').length, cardText: document.querySelector('.icard').innerText,
      viewAll: !!document.querySelector('.more'),
    }));
    check(r.h1 === 'Research' && r.cards === 1 && r.title === 'Human-AI teams in agile effort estimation' && r.high === 0 && !/100%/.test(r.cardText) && r.tags.length === 2 && !r.viewAll, 'research: grid with 1 project card, no result on the card, no "View all" under the limit', r);
    await shot('research');
    await p.locator('.icard').first().scrollIntoViewIfNeeded();
    const cb = await p.locator('.icard').first().boundingBox();
    await p.mouse.click(cb.x + cb.width / 2, cb.y + 30); await p.waitForURL(BASE + PROJECT, { timeout: 5000 }).catch(() => {});
    check(p.url() === BASE + PROJECT, 'research: a click on the card opens the project page', p.url());

    // 3. project page: field order from the template
    await go(PROJECT);
    commonChecks(await common(p), 'project');
    const pr = await p.evaluate(() => ({
      h1: document.querySelector('.ptext h1')?.textContent, tags: document.querySelectorAll('.ptext .tags span').length,
      sents: (document.querySelector('.ptext .pitch')?.textContent.match(/[.!?](\s|$)/g) || []).length,
      secs: [...document.querySelectorAll('.project .flabel')].map(e => e.textContent),
      stats: [...document.querySelectorAll('.stat b')].map(e => e.textContent),
      noteGap: (() => { const n = document.querySelector('.stats-note'), st = document.querySelector('.project .stats'); return n && st ? Math.round(n.getBoundingClientRect().top - st.getBoundingClientRect().bottom) : null; })(),
      noteText: document.querySelector('.stats-note')?.textContent || '',
      teamUnderDesc: (() => { const d = document.querySelector('.ptext .pitch'), t = document.querySelector('.ptext .pteam'); return !!d && !!t && d.nextElementSibling === t; })(),
      team: [...document.querySelectorAll('.lead')].map(l => ({ n: l.querySelector('b').textContent, link: l.querySelector('.mlink')?.getAttribute('href') || '' })),
      cover: (() => { const i = document.querySelector('.project .media img'); return !!i && i.naturalWidth > 0; })(),
      papers: [...document.querySelectorAll('.paper a')].map(a => a.href),
    }));
    check(pr.h1 === 'Human-AI teams in agile effort estimation' && pr.tags === 2 && pr.sents <= 3 && pr.cover, 'project: tags, title, description of 3 sentences or fewer, cover', pr);
    check(pr.teamUnderDesc, 'project: team is directly under the description');
    check(pr.secs.join('|') === 'Results|Testimonial|Papers', 'project: sections below are Results, Testimonial, Papers', pr.secs);
    check(pr.stats.join() === '100%,83%,67%', 'project: 3 result metrics', pr.stats);
    check(pr.noteGap >= 8 && !/\d/.test(pr.noteText), 'project: survey note sits below the results border and has no participant count', [pr.noteGap, pr.noteText]);
    check(pr.team.find(t => t.n === 'Hoa Khanh Dam')?.link === 'https://documents.uow.edu.au/~hoa/', 'project: Hoa card links to his homepage', pr.team);
    check(pr.papers.includes('https://ieeexplore.ieee.org/document/11334617/') && pr.papers.includes('https://arxiv.org/abs/2509.14483'), 'project: paper links');
    await shot('project');
    await p.click('.play-btn'); await p.waitForTimeout(300);
    const v = await p.evaluate(() => ({ on: document.querySelector('.vmodal').classList.contains('on'), src: (document.querySelector('.vmodal iframe') || {}).src || '' }));
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    const vOff = await p.evaluate(() => !document.querySelector('.vmodal').classList.contains('on'));
    check(v.on && /embed\/0jrmOUjQbi8/.test(v.src) && vOff, 'project: "Watch video" opens and closes the video window');

    // 4. industry and community: same card grid, no timeline
    for (const cat of ['industry', 'community']) {
      await go(cat + '/');
      commonChecks(await common(p), cat);
      const c = await p.evaluate(() => ({ h1: document.querySelector('.page-head h1')?.textContent, cards: document.querySelectorAll('.igrid .icard').length, empty: !!document.querySelector('.empty'), tl: document.querySelectorAll('.tl, .tl-card').length }));
      if (cat === 'industry') check(c.cards === 3 && c.tl === 0, 'industry: 3 event cards in the grid, no timeline', c);
      else check(c.empty && c.cards === 0, 'community: page shows the empty-state text', c);
      await shot(cat);
    }

    // 5. "View all" page builds and lists every item
    await go('industry/all/');
    const all = await p.evaluate(() => ({ h1: document.querySelector('.page-head h1')?.textContent, cards: document.querySelectorAll('.icard').length, back: document.querySelector('.page-head .tag a')?.getAttribute('href') }));
    check(all.h1 === 'All industry' && all.cards === 3 && /\/industry\/$/.test(all.back), 'industry/all: full list with a link back', all);

    // 6. mobile menu
    const menu = await p.evaluate(() => getComputedStyle(document.getElementById('menuBtn')).display !== 'none');
    if (menu) {
      await go('');
      await p.click('#menuBtn'); await p.waitForTimeout(150);
      await shot('menu', false);
      await p.click('nav a[href$="/research/"]'); await p.waitForURL(BASE + 'research/', { timeout: 5000 }).catch(() => {});
      check(p.url() === BASE + 'research/', 'mobile menu opens and goes to Research', p.url());
    }

    // 7. 404 page
    await go('404.html');
    const nf = await p.evaluate(() => document.querySelector('h2')?.textContent);
    check(nf === 'Page not found', '404 page renders', nf);

    check(errs.length === 0, 'no JS errors on any page', errs);
    check(failed.length === 0, 'no failed requests on the site', failed);
    await ctx.close();
  }
  await b.close();
  console.log(fails ? `\n${fails} CHECK(S) FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})();
