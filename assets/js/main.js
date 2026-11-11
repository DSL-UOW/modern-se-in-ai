/* Decision Systems Lab site script.
   Content is rendered at build time by Liquid (index.html + _data/*.yml).
   This script only adds behaviour:
     - video window for the "Watch video" button on a project page
     - breathing dot pattern in the hero and the contact block
     - mobile menu */

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function ytId(u){const m=String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);return m?m[1]:null}

// video window: opens on the play button; closes with the button, a click outside, or Esc
const vm=document.createElement('div');vm.className='vmodal';vm.setAttribute('role','dialog');vm.setAttribute('aria-modal','true');
vm.innerHTML='<div class="frame"><div class="vtitle"></div><button class="vclose" type="button">Close ✕</button><div class="vslot"></div></div>';
document.body.appendChild(vm);
let vmReturn=null;
function openVideo(url,title,from){
  const id=ytId(url),slot=vm.querySelector('.vslot');
  slot.innerHTML=id?`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
                   :`<video controls autoplay playsinline src="${esc(url)}"></video>`;
  vm.querySelector('.vtitle').textContent=title;vm.setAttribute('aria-label',title);
  vm.classList.add('on');document.body.style.overflow='hidden';vmReturn=from;vm.querySelector('.vclose').focus();
}
function closeVideo(){if(!vm.classList.contains('on'))return;vm.classList.remove('on');vm.querySelector('.vslot').innerHTML='';document.body.style.overflow='';if(vmReturn)vmReturn.focus()}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-video]');
  if(b){e.preventDefault();e.stopPropagation();openVideo(b.dataset.video,b.dataset.title+' · video',b);return}
  if(e.target.closest('.vclose')||e.target===vm)closeVideo();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeVideo()});


/* ---------- helpers ---------- */
function fit(c){const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);c.width=r.width*d;c.height=r.height*d;const x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);return[x,r.width,r.height]}

/* ---------- dot-matrix background ----------
   buildField() does the heavy work once (on load and on resize): it paints the
   plain background and computes the dot list. It returns draw(t), which paints
   one frame. t is time in seconds; draw(null) paints the still pattern. */
const BREATH_PERIOD=5.5;  // seconds for one full breath (in + out)
const BREATH_SIZE=.22;    // dot size change, +/- 22 %
const BREATH_ALPHA=.18;   // dot opacity change, +/- 18 %
const BREATH_WAVE=.8;     // how many breaths fit across the canvas (the wave moves out from the main blob)
function buildField(c,opt={}){
  const [x,W,H]=fit(c),dpr=c.width/W,paper=opt.paper||'#fafafa';
  const bg=document.createElement('canvas');bg.width=c.width;bg.height=c.height;
  const b=bg.getContext('2d');b.setTransform(dpr,0,0,dpr,0,0);
  b.fillStyle=paper;b.fillRect(0,0,W,H);
  const blobs=opt.blobs||[
    {x:.88,y:.58,r:.25,w:1.0,blue:1},{x:.97,y:.25,r:.2,w:.8,blue:1},{x:.74,y:.88,r:.07,w:.7,blue:1},
    {x:.96,y:.74,r:.13,w:.7,blue:.8},{x:.83,y:.38,r:.18,w:.45,blue:0},{x:.8,y:.64,r:.2,w:.35,blue:0}];
  const ox=blobs[0].x*W,oy=blobs[0].y*H,span=Math.max(W,H);
  const step=opt.step||20,dots=[];
  for(let gy=step/2;gy<H;gy+=step)for(let gx=step/2;gx<W;gx+=step){
    const nx=gx/W,ny=gy/H*(H/W);let v=0,bl=0;
    for(const o of blobs){const dx=nx-o.x,dy=ny-o.y*(H/W),k=Math.exp(-(dx*dx+dy*dy)/(o.r*o.r*.35));v+=k*o.w;bl+=k*o.blue*o.w}
    v+=Math.sin(gx*.013)*Math.cos(gy*.017)*.06;
    if(v<.10)continue;
    // colour snapped to a small palette, so a frame changes fillStyle about 100 times, not once per dot
    const s=Math.min(1,v),m=Math.round(Math.max(0,Math.min(1,(bl-.45)*2.2))*8)/8,gr=Math.round((195-s*75)/5)*5;
    dots.push({x:gx,y:gy,s:1.4+s*s*7.5,a:.35+s*.55,
      rgb:`rgb(${Math.round(gr*(1-m)+31*m)},${Math.round(gr*(1-m)+111*m)},${Math.round(gr*(1-m)+255*m)})`,
      ph:Math.hypot(gx-ox,gy-oy)/span*Math.PI*2*BREATH_WAVE});
  }
  const groups=new Map();
  for(const d of dots){if(!groups.has(d.rgb))groups.set(d.rgb,[]);groups.get(d.rgb).push(d)}
  // left fade keeps the headline readable
  const fw=opt.fade||.7,fade=x.createLinearGradient(0,0,W*fw,0),pc=paper==='#fafafa'?'250,250,250':'241,242,244';
  fade.addColorStop(0,`rgba(${pc},.97)`);fade.addColorStop(.6,`rgba(${pc},.85)`);fade.addColorStop(1,`rgba(${pc},0)`);
  const w=Math.PI*2/BREATH_PERIOD;
  // only the area that holds dots changes, so later frames repaint just that area
  let x0=W;for(const d of dots)x0=Math.min(x0,d.x-d.s*(1+BREATH_SIZE));
  x0=Math.max(0,Math.floor(x0)-2);
  const rw=W-x0;
  let first=true;
  return function draw(t){
    const full=first;first=false;
    if(full)x.drawImage(bg,0,0,W,H);else x.drawImage(bg,x0*dpr,0,rw*dpr,H*dpr,x0,0,rw,H);
    for(const [rgb,list] of groups){
      x.fillStyle=rgb;
      for(const d of list){
        const k=t==null?0:Math.sin(t*w-d.ph);
        const z=d.s*(1+BREATH_SIZE*k);
        x.globalAlpha=Math.min(1,d.a*(1+BREATH_ALPHA*k));
        x.fillRect(d.x-z/2,d.y-z/2,z,z);
      }
    }
    x.globalAlpha=1;
    x.fillStyle=fade;
    if(full)x.fillRect(0,0,W,H);else x.fillRect(x0,0,rw,H);
  };
}

/* ---------- hero breathing loop ----------
   Runs only while the hero is on screen, at 30 fps.
   With "reduce motion" turned on in the OS, the hero shows the still pattern. */
let heroDraw=null,heroRAF=0,heroOnScreen=true,lastFrame=0;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
function heroLoop(now){
  heroRAF=requestAnimationFrame(heroLoop);
  if(now-lastFrame<33)return;
  lastFrame=now;heroDraw(now/1000);
}
function startHero(){
  cancelAnimationFrame(heroRAF);heroRAF=0;
  if(!heroDraw)return;
  if(reduceMotion.matches){heroDraw(null);return}
  if(!heroOnScreen)return;
  heroDraw(performance.now()/1000);
  heroRAF=requestAnimationFrame(heroLoop);
}
const heroEl=document.querySelector('.hero');
if(heroEl)new IntersectionObserver(es=>{heroOnScreen=es[0].isIntersecting;startHero()}).observe(heroEl);
reduceMotion.addEventListener('change',startHero);

/* ---------- mobile menu ---------- */
const hdr=document.querySelector('header'),menuBtn=document.getElementById('menuBtn');
menuBtn.onclick=()=>{const o=hdr.classList.toggle('open');menuBtn.setAttribute('aria-expanded',o)};
document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>{hdr.classList.remove('open');menuBtn.setAttribute('aria-expanded',false)}));

function drawAll(){
  const narrow=innerWidth<=1024; /* phone + tablet: pattern goes under the text */
  const hero=document.getElementById('field'),cta=document.getElementById('ctaField');
  /* the hero is on the home page only; the contact block is on every page */
  if(narrow){
    if(hero)heroDraw=buildField(hero,{step:16,fade:.001,blobs:[
      {x:.78,y:.97,r:.42,w:1,blue:1},{x:.12,y:1.0,r:.3,w:.7,blue:.6},{x:.48,y:.95,r:.4,w:.45,blue:0}]});
    if(cta)buildField(cta,{step:14,fade:.001,blobs:[
      {x:.75,y:.98,r:.4,w:1,blue:1},{x:.25,y:1.0,r:.32,w:.5,blue:0}]})(null);
  }else{
    if(hero)heroDraw=buildField(hero);
    if(cta)buildField(cta,{step:16,fade:.6,blobs:[{x:.9,y:.12,r:.13,w:1,blue:1},{x:.76,y:.08,r:.12,w:.5,blue:0}]})(null);
  }
  startHero();
}
document.fonts.ready.then(drawAll);
let to;addEventListener('resize',()=>{clearTimeout(to);to=setTimeout(drawAll,150)});
