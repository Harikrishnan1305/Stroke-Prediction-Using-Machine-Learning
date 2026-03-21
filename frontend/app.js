/* ─── Stroke Prediction System — App v3 ────────────────────── */
'use strict';

const API = 'http://127.0.0.1:5000/api';

// ── Auth ─────────────────────────────────────────────────────
const token = {
  get:     () => localStorage.getItem('sp_token') || sessionStorage.getItem('sp_token'),
  set:     (t, remember)  => { if (remember) { localStorage.setItem('sp_token', t); sessionStorage.removeItem('sp_token'); } else { sessionStorage.setItem('sp_token', t); localStorage.removeItem('sp_token'); } },
  clear:   () => { localStorage.removeItem('sp_token'); sessionStorage.removeItem('sp_token'); },
  headers: () => {
    const t = localStorage.getItem('sp_token') || sessionStorage.getItem('sp_token');
    return t ? { 'Authorization': `Bearer ${t}` } : {};
  }
};

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
function showEl(el, v = true) { if (el) v ? el.classList.remove('hidden') : el.classList.add('hidden'); }

async function api(method, path, body, isForm = false) {
  const h = token.headers();
  const opts = { method, headers: h };
  if (body) {
    if (isForm) opts.body = body;
    else { h['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  }
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { details: data.details, status: res.status });
  return data;
}

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
function toast(msg, type = 'info', ms = 3500) {
  const c = $('#toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(60px)'; setTimeout(() => el.remove(), 350); }, ms);
}

// ═══════════════════════════════════════════════════════════════
//  PARTICLE CANVAS
// ═══════════════════════════════════════════════════════════════
(function initParticles() {
  const cv = $('#particle-canvas'); if (!cv) return;
  const ctx = cv.getContext('2d');
  let W, H, pts = [];
  function resize() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);
  class P {
    constructor() { this.reset(); }
    reset() { this.x = Math.random()*W; this.y = Math.random()*H; this.vx = (Math.random()-.5)*.3; this.vy = (Math.random()-.5)*.3; this.r = Math.random()*2+.5; this.a = Math.random()*.5+.1; }
    update() { this.x += this.vx; this.y += this.vy; if(this.x<0||this.x>W) this.vx*=-1; if(this.y<0||this.y>H) this.vy*=-1; }
    draw() { ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fillStyle=`rgba(0,212,255,${this.a})`; ctx.fill(); }
  }
  for(let i=0;i<55;i++) pts.push(new P());
  (function loop() {
    ctx.clearRect(0,0,W,H);
    pts.forEach(p=>{p.update();p.draw()});
    for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++) {
      const d = Math.hypot(pts[i].x-pts[j].x, pts[i].y-pts[j].y);
      if(d<110){ ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.strokeStyle=`rgba(0,212,255,${.08*(1-d/110)})`; ctx.stroke(); }
    }
    requestAnimationFrame(loop);
  })();
})();

// ═══════════════════════════════════════════════════════════════
//  CLOCK
// ═══════════════════════════════════════════════════════════════
function updateClock() { const el=$('#header-clock'); if(el) el.textContent = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'}); }
setInterval(updateClock, 1000); updateClock();

// ═══════════════════════════════════════════════════════════════
//  SCREEN MANAGEMENT (Intro → Login → App)
// ═══════════════════════════════════════════════════════════════
const introScreen = $('#intro-screen');
const loginScreen = $('#login-screen');
const appScreen   = $('#app-screen');

function showScreen(name) {
  [introScreen, loginScreen, appScreen].forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
  const target = name === 'intro' ? introScreen : name === 'login' ? loginScreen : appScreen;
  target.classList.remove('hidden');
  target.classList.add('active');
  if (name === 'app') { checkServerStatus(); window.scrollTo(0, 0); }
  if (name === 'intro') window.scrollTo(0, 0);
}

// Navigation buttons: Intro → Login
$('#go-login-btn').addEventListener('click', () => showScreen('login'));
$('#hero-signin-btn').addEventListener('click', () => showScreen('login'));
$('#about-signin-btn').addEventListener('click', () => showScreen('login'));
$('#back-to-intro').addEventListener('click', () => showScreen('intro'));

// ═══════════════════════════════════════════════════════════════
//  AUTH TABS (Sign In / Sign Up / Forgot Password)
// ═══════════════════════════════════════════════════════════════
function switchAuthView(viewId) {
  $$('.auth-view').forEach(v => v.classList.remove('active'));
  $$('.auth-tab').forEach(t => t.classList.remove('active'));
  $(`#auth-${viewId}`).classList.add('active');
  const tab = $(`[data-auth="${viewId}"]`);
  if (tab) tab.classList.add('active');
}

$$('.auth-tab').forEach(tab => tab.addEventListener('click', () => switchAuthView(tab.dataset.auth)));
$('#switch-to-register').addEventListener('click', e => { e.preventDefault(); switchAuthView('register'); });
$('#switch-to-login').addEventListener('click', e => { e.preventDefault(); switchAuthView('login'); });
$('#show-forgot').addEventListener('click', e => { e.preventDefault(); switchAuthView('forgot'); });
$('#back-to-login').addEventListener('click', e => { e.preventDefault(); switchAuthView('login'); });

// ═══════════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════════
const loginForm = $('#login-form');
const loginErr  = $('#login-error');
const loginBtn  = $('#login-btn');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoading(loginBtn, true); showEl(loginErr, false); showEl($('#login-success'), false);
  try {
    const res = await api('POST', '/auth/login', {
      username: $('#username').value.trim(),
      password: $('#password').value
    });
    token.set(res.access_token, $('#remember-me').checked);
    setUserInfo(res.user);
    showScreen('app');
    toast('Welcome back!', 'success');
  } catch (err) {
    loginErr.textContent = err.message; showEl(loginErr);
    toast('Login failed', 'error');
  } finally { setLoading(loginBtn, false); }
});

// ═══════════════════════════════════════════════════════════════
//  REGISTER
// ═══════════════════════════════════════════════════════════════
const registerForm = $('#register-form');
const registerErr  = $('#register-error');
const registerOk   = $('#register-success');
const registerBtn  = $('#register-btn');

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showEl(registerErr, false); showEl(registerOk, false);
  const pw = $('#reg-password').value, confirm = $('#reg-confirm').value;
  if (pw.length < 6) { registerErr.textContent = 'Password must be at least 6 characters'; showEl(registerErr); return; }
  if (pw !== confirm) { registerErr.textContent = 'Passwords do not match'; showEl(registerErr); return; }
  setLoading(registerBtn, true);
  try {
    await api('POST', '/auth/register', {
      username: $('#reg-username').value.trim(),
      email: $('#reg-email').value.trim(),
      password: pw,
      role: $('#reg-role').value
    });
    registerOk.textContent = 'Account created! You can now sign in.';
    showEl(registerOk);
    registerForm.reset();
    $('#strength-bar').className = 'strength-bar';
    $('#strength-text').textContent = '';
    toast('Registration successful!', 'success');
    setTimeout(() => switchAuthView('login'), 2000);
  } catch (err) {
    registerErr.textContent = err.message; showEl(registerErr);
    toast('Registration failed', 'error');
  } finally { setLoading(registerBtn, false); }
});

// Password strength indicator
$('#reg-password').addEventListener('input', (e) => {
  const pw = e.target.value, bar = $('#strength-bar'), txt = $('#strength-text');
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = ['', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong', 'strength-strong'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  bar.className = 'strength-bar ' + (levels[score] || '');
  txt.textContent = pw ? labels[score] || '' : '';
});

// ═══════════════════════════════════════════════════════════════
//  FORGOT PASSWORD & RESET PASSWORD
// ═══════════════════════════════════════════════════════════════
$('#forgot-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#forgot-email').value.trim();
  if (!email) return;
  const msg = $('#forgot-message');
  const btn = $('#forgot-btn');
  setLoading(btn, true); showEl(msg, false);
  try {
    const res = await api('POST', '/auth/forgot-password', { email });
    msg.className = 'alert alert-success';
    msg.innerHTML = `<strong>Success:</strong> ${res.message}<br/>Please check your email inbox to proceed.`;
    showEl(msg);
    toast('Secure reset link sent', 'success');
  } catch (err) {
    msg.className = 'alert alert-error';
    msg.textContent = err.message;
    showEl(msg);
  } finally {
    setLoading(btn, false);
  }
});

$('#reset-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = $('#reset-password').value;
  if(pw.length < 6) return toast('Password too short', 'error');
  const msg = $('#reset-error'), ok = $('#reset-success'), btn = $('#do-reset-btn');
  setLoading(btn,true); showEl(msg,false); showEl(ok,false);
  try {
    const res = await api('POST', '/auth/reset-password', {
      token: $('#reset-token').value,
      password: pw
    });
    ok.textContent = res.message + " You can now sign in.";
    showEl(ok);
    toast('Password updated securely', 'success');
    $('#reset-form').reset();
    setTimeout(() => switchAuthView('login'), 2500);
  } catch(err) {
    msg.textContent = err.message; showEl(msg);
  } finally { setLoading(btn,false); }
});

const elResetLogin = $('#reset-to-login');
if(elResetLogin) elResetLogin.addEventListener('click', e => { e.preventDefault(); switchAuthView('login'); });

function setUserInfo(u) {
  if (!u) return;
  const name = u.username || 'User';
  $('#user-display-name').textContent = name;
  $('#user-role').textContent = u.role || 'doctor';
  $('#user-avatar').textContent = name[0].toUpperCase();
}

$('#logout-btn').addEventListener('click', () => {
  token.clear();
  showScreen('intro');
  toast('Logged out', 'info');
});

// ═══════════════════════════════════════════════════════════════
//  SERVER STATUS
// ═══════════════════════════════════════════════════════════════
async function checkServerStatus() {
  const dot = $('#server-status .status-dot'), txt = $('#server-status .status-text');
  try { 
    const res = await fetch(`${API}/health`);
    if (res.ok) { dot.className='status-dot status-online'; txt.textContent='Server Online'; }
    else throw new Error('Offline');
  }
  catch { dot.className='status-dot status-offline'; txt.textContent='Server Offline'; }
}
setInterval(checkServerStatus, 30000);

// ═══════════════════════════════════════════════════════════════
//  TAB NAVIGATION
// ═══════════════════════════════════════════════════════════════
$$('.nav-item').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = link.dataset.tab;
    $$('.nav-item').forEach(n => n.classList.remove('active'));
    link.classList.add('active');
    $$('.tab-section').forEach(s => s.classList.remove('active'));
    $(`#tab-${tab}`).classList.add('active');
    if (tab === 'history')    loadHistory();
    if (tab === 'dashboard')  loadDashboard();
    if (tab === 'patients')   loadPatients();
    if (tab === 'model-info') loadModelInfo();
  });
});

// ═══════════════════════════════════════════════════════════════
//  VITALS BAR
// ═══════════════════════════════════════════════════════════════
function updateVitalsBar() {
  const v = id => $(`#${id}`).value;
  setVital('vi-age',   v('p-age')  || '--',  v('p-age') ? (+v('p-age')>65?'vi-warn':'vi-ok') : '');
  setVital('vi-bp',    v('p-bps')&&v('p-bpd') ? `${v('p-bps')}/${v('p-bpd')}` : '--/--', v('p-bps') ? (+v('p-bps')>140?'vi-danger':+v('p-bps')>120?'vi-warn':'vi-ok') : '');
  setVital('vi-hr',    v('p-hr')   || '--',  v('p-hr') ? (+v('p-hr')>100||+v('p-hr')<60?'vi-warn':'vi-ok') : '');
  setVital('vi-bmi',   v('p-bmi')  || '--',  v('p-bmi') ? (+v('p-bmi')>30?'vi-danger':+v('p-bmi')>25?'vi-warn':'vi-ok') : '');
  setVital('vi-sugar', v('p-bs')   || '--',  v('p-bs') ? (+v('p-bs')>126?'vi-danger':+v('p-bs')>100?'vi-warn':'vi-ok') : '');
  setVital('vi-chol',  v('p-chol') || '--',  v('p-chol') ? (+v('p-chol')>240?'vi-danger':+v('p-chol')>200?'vi-warn':'vi-ok') : '');
}
function setVital(id, val, cls) { const el=$(`#${id}`); if(!el)return; el.querySelector('.vi-val').textContent=val; el.className=`vital-indicator ${cls}`; }
['p-age','p-bps','p-bpd','p-hr','p-bmi','p-bs','p-chol'].forEach(id => { const el=$(`#${id}`); if(el) el.addEventListener('input', updateVitalsBar); });

// Fill Sample Data
$('#sample-data-btn').addEventListener('click', () => {
  $('#p-name').value='Demo Patient'; $('#p-age').value=62; $('#p-gender').value='Male';
  $('#p-hr').value=88; $('#p-bps').value=145; $('#p-bpd').value=92;
  $('#p-bs').value=135; $('#p-chol').value=240; $('#p-bmi').value=28.5;
  updateVitalsBar(); toast('Sample data filled', 'info');
});

// ═══════════════════════════════════════════════════════════════
//  IMAGE UPLOAD
// ═══════════════════════════════════════════════════════════════
const uploadZone = $('#upload-zone'), scanFile = $('#scan-file'), imgPrev = $('#image-preview'), prevImg = $('#preview-img');
$('#upload-btn').addEventListener('click', () => scanFile.click());
uploadZone.addEventListener('click', (e) => { if(e.target!==$('#upload-btn')) scanFile.click(); });
scanFile.addEventListener('change', () => { if(scanFile.files[0]) showPreview(scanFile.files[0]); });
uploadZone.addEventListener('dragover', e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
uploadZone.addEventListener('dragleave', ()=>uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e=>{e.preventDefault();uploadZone.classList.remove('drag-over');const f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/')){const dt=new DataTransfer();dt.items.add(f);scanFile.files=dt.files;showPreview(f);}});
function showPreview(f){ prevImg.src=URL.createObjectURL(f); showEl(uploadZone,false); showEl(imgPrev); toast('MRI loaded','success'); }
$('#remove-img').addEventListener('click', ()=>{scanFile.value='';prevImg.src='';showEl(imgPrev,false);showEl(uploadZone);});

// ═══════════════════════════════════════════════════════════════
//  PROGRESS BAR
// ═══════════════════════════════════════════════════════════════
function showProgress(steps) {
  const wrap=$('#progress-wrap'), bar=$('#progress-bar'), label=$('#progress-label');
  showEl(wrap); let i=0;
  const labels=['Validating patient data...','Running ML model...','Preprocessing MRI...','Running DL model...','Combining predictions...','Generating recommendations...','Complete!'];
  const iv=setInterval(()=>{i++;bar.style.width=Math.min(i/steps*100,95)+'%';label.textContent=labels[Math.min(i,labels.length-1)];if(i>=steps)clearInterval(iv);},400);
  return{finish:()=>{clearInterval(iv);bar.style.width='100%';label.textContent=labels[labels.length-1];setTimeout(()=>showEl(wrap,false),800);}};
}

// ═══════════════════════════════════════════════════════════════
//  PREDICT
// ═══════════════════════════════════════════════════════════════
const predictForm = $('#predict-form'), predictBtn = $('#predict-btn'), resultsPanel = $('#results-panel'), predictErr = $('#predict-error');
let lastPredId = null;

predictForm.addEventListener('submit', async (e) => {
  e.preventDefault(); showEl(predictErr, false); setLoading(predictBtn, true); showEl(resultsPanel, false);
  const hasImg = !!scanFile.files[0];
  const prog = showProgress(hasImg ? 6 : 4);
  try {
    const fd = new FormData(predictForm);
    fd.set('is_smoker', $('#p-smoker').checked ? 'true' : 'false');
    fd.set('is_alcoholic', $('#p-alcoholic').checked ? 'true' : 'false');
    const res = await fetch(`${API}/predict`, { method: 'POST', headers: token.headers(), body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.details ? data.details.join('\n') : data.error || 'Failed');
    prog.finish(); lastPredId = data.prediction?.id;
    renderResults(data); toast('Prediction complete!', 'success');
    if (hasImg && lastPredId) fetchGradCam(lastPredId);
  } catch (err) { prog.finish(); predictErr.textContent = err.message; showEl(predictErr); toast('Error: ' + err.message, 'error'); }
  finally { setLoading(predictBtn, false); }
});

// ═══════════════════════════════════════════════════════════════
//  RENDER RESULTS
// ═══════════════════════════════════════════════════════════════
function renderResults(data) {
  const p = data.prediction || {}, pt = data.patient || {};
  $('#results-patient-name').textContent = pt.name ? `Patient: ${pt.name}, Age: ${pt.age||'-'}` : '';
  const risk = p.stroke_risk || 'Low', prob = Math.round((p.risk_probability||0) * 100);
  const sr = $('#summary-risk'); sr.textContent = risk; sr.className = `risk-badge risk-${risk}`;
  $('#summary-prob').textContent = prob + '%';
  $('#summary-stage').textContent = p.stroke_stage || 'None';
  $('#summary-ml').textContent = p.ml_prediction != null ? Math.round(p.ml_prediction*100)+'%' : '—';
  $('#summary-dl').textContent = p.dl_prediction != null ? Math.round(p.dl_prediction*100)+'%' : 'N/A';
  animateGauge(prob, risk);
  const rb = $('#risk-badge'); rb.textContent = risk; rb.className = `risk-badge risk-${risk}`;
  animateBar('ml-bar','ml-pct',p.ml_prediction);
  animateBar('dl-bar','dl-pct',p.dl_prediction);
  animateBar('combined-bar','combined-pct',p.risk_probability);
  renderHealthIndicators();
  renderFeatureBars(data.feature_importance, 'feature-bars');
  const ul = $('#recommendations-list'); ul.innerHTML = '';
  (data.recommendations||[]).forEach(r => { const li=document.createElement('li'); li.textContent=r; ul.appendChild(li); });
  if (prevImg.src && prevImg.src !== location.href) {
    $('#original-img-result').src = prevImg.src;
    showEl($('#gradcam-section')); showEl($('#gradcam-loading')); $('#gradcam-img').src = '';
  } else showEl($('#gradcam-section'), false);
  showEl(resultsPanel); resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#download-report-btn').onclick = () => downloadReport(p.id);
  $('#print-result-btn').onclick = () => window.print();
  $('#new-prediction-btn').onclick = resetForm;
}

function renderHealthIndicators() {
  const c=$('#health-indicators'); if(!c) return; c.innerHTML='';
  const checks = [
    { name:'Blood Pressure', val:`${$('#p-bps').value}/${$('#p-bpd').value}`, ok:+$('#p-bps').value<=120, warn:+$('#p-bps').value<=140 },
    { name:'Heart Rate', val:`${$('#p-hr').value} bpm`, ok:+$('#p-hr').value>=60&&+$('#p-hr').value<=100, warn:true },
    { name:'Blood Sugar', val:`${$('#p-bs').value} mg/dL`, ok:+$('#p-bs').value<=100, warn:+$('#p-bs').value<=126 },
    { name:'Cholesterol', val:`${$('#p-chol').value} mg/dL`, ok:+$('#p-chol').value<200, warn:+$('#p-chol').value<240 },
    { name:'BMI', val:$('#p-bmi').value, ok:+$('#p-bmi').value>=18.5&&+$('#p-bmi').value<=24.9, warn:+$('#p-bmi').value<30 },
    { name:'Age Risk', val:`${$('#p-age').value} yrs`, ok:+$('#p-age').value<55, warn:+$('#p-age').value<70 },
  ];
  checks.forEach(ck => {
    const s = ck.ok ? 'ok' : ck.warn ? 'warn' : 'danger';
    c.insertAdjacentHTML('beforeend',`<div class="hi-item"><span class="hi-dot ${s}"></span><span class="hi-name">${ck.name}</span><span class="hi-val">${ck.val}</span></div>`);
  });
}

function animateGauge(pct, risk) {
  const arc=283, fill=$('#gauge-fill');
  fill.style.strokeDashoffset = arc - (pct/100)*arc;
  fill.style.stroke = risk==='High'?'#ef4444':risk==='Medium'?'#f59e0b':'#10b981';
  $('#gauge-label').textContent = risk+' Risk';
  let cur=0; const step=pct/40;
  const iv=setInterval(()=>{cur=Math.min(cur+step,pct);$('#gauge-pct').textContent=Math.round(cur)+'%';if(cur>=pct)clearInterval(iv);},25);
}
function animateBar(bId,pId,v) { const pct=v!=null?Math.round(v*100):null; $(`#${pId}`).textContent=pct!=null?pct+'%':'—'; const b=$(`#${bId}`); if(b){b.style.width='0%';setTimeout(()=>b.style.width=(pct||0)+'%',100);}}
function renderFeatureBars(feat, cId) {
  const c=$(`#${cId}`); if(!feat||!c)return; c.innerHTML='';
  const entries = Object.entries(feat).sort((a,b)=>b[1]-a[1]).slice(0,9);
  const max = Math.max(...entries.map(e=>e[1]));
  entries.forEach(([name,val])=> {
    const pct = max>0?(val/max)*100:0;
    const label = name.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    c.insertAdjacentHTML('beforeend',`<div class="feature-item"><span class="feature-name">${label}</span><div class="feature-track"><div class="feature-bar" style="width:0%"></div></div><span class="feature-val">${(val*100).toFixed(1)}%</span></div>`);
  });
  setTimeout(()=>c.querySelectorAll('.feature-bar').forEach((b,i)=>{ b.style.width=(max>0?(entries[i][1]/max)*100:0)+'%'; }),100);
}

// Grad-CAM
async function fetchGradCam(pid) {
  try { showEl($('#gradcam-loading'));
    const d = await api('GET', `/predictions/${pid}/gradcam`);
    showEl($('#gradcam-loading'),false);
    if(d.gradcam_image){ $('#gradcam-img').src=d.gradcam_image; showEl($('#gradcam-section')); toast('Grad-CAM generated','success'); }
  } catch(e){ showEl($('#gradcam-loading'),false); showEl($('#gradcam-section'),false); }
}

// Report
async function downloadReport(pid) {
  if(!pid) return;
  try { const r=await fetch(`${API}/prediction/${pid}/report`,{headers:token.headers()}); if(!r.ok) throw new Error('Failed');
    const b=await r.blob(); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=`stroke_report_${pid}.pdf`; a.click(); URL.revokeObjectURL(u); toast('PDF downloaded','success');
  } catch(e){ toast('Report failed: '+e.message,'error'); }
}

function resetForm() {
  predictForm.reset(); showEl(imgPrev,false); showEl(uploadZone); prevImg.src=''; scanFile.value='';
  showEl(resultsPanel,false); showEl(predictErr,false); updateVitalsBar(); window.scrollTo({top:0,behavior:'smooth'});
}

// ═══════════════════════════════════════════════════════════════
//  HISTORY TAB (WORKING)
// ═══════════════════════════════════════════════════════════════
let allPredictions = [];

async function loadHistory() {
  const loading=$('#history-loading'), table=$('#history-table'), empty=$('#history-empty'), tbody=$('#history-tbody');
  showEl(loading); showEl(table,false); showEl(empty,false);
  try {
    const data = await api('GET', '/predictions?per_page=200');
    allPredictions = data.predictions || [];
    showEl(loading, false);
    renderHistory(allPredictions);
  } catch(e) { loading.innerHTML = 'Failed: '+e.message; }
}

function renderHistory(preds) {
  const table=$('#history-table'), empty=$('#history-empty'), tbody=$('#history-tbody');
  if (!preds.length) { showEl(empty); showEl(table,false); return; }
  tbody.innerHTML='';
  preds.forEach((p,i) => {
    const risk = p.stroke_risk||'Low';
    const pct = p.risk_probability!=null ? Math.round(p.risk_probability*100)+'%' : '—';
    const date = p.created_at ? new Date(p.created_at).toLocaleDateString() : '—';
    const mri = p.scan_image_path ? '✅' : '—';
    tbody.insertAdjacentHTML('beforeend',`<tr><td>${i+1}</td><td>${p.patient_name||'—'}</td><td><span class="risk-badge risk-${risk}">${risk}</span></td><td class="mono">${pct}</td><td>${p.stroke_stage||'—'}</td><td>${date}</td><td style="text-align:center">${mri}</td></tr>`);
  });
  showEl(table); showEl(empty,false);
}

$('#history-filter-risk').addEventListener('change', () => {
  const risk = $('#history-filter-risk').value;
  renderHistory(risk ? allPredictions.filter(p=>p.stroke_risk===risk) : allPredictions);
});

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD TAB (WORKING)
// ═══════════════════════════════════════════════════════════════
async function loadDashboard() {
  try {
    const data = await api('GET', '/statistics');
    animateCounter('stat-patients-val', data.total_patients || 0);
    animateCounter('stat-predictions-val', data.total_predictions || 0);
    animateCounter('stat-high-val', data.risk_distribution?.high || 0);
    animateCounter('stat-medium-val', data.risk_distribution?.medium || 0);
    animateCounter('stat-low-val', data.risk_distribution?.low || 0);
    drawDonut(data.risk_distribution || {});
    const rl=$('#recent-list'); rl.innerHTML='';
    (data.recent_predictions||[]).forEach(p=>{
      const risk=p.stroke_risk||'Low', date=p.created_at?new Date(p.created_at).toLocaleDateString():'—';
      rl.insertAdjacentHTML('beforeend',`<div class="recent-item"><span class="recent-patient">${p.patient_name||'Unknown'}</span><span><span class="risk-badge risk-${risk}">${risk}</span></span><span class="recent-date">${date}</span></div>`);
    });
    if(!data.recent_predictions?.length) rl.innerHTML='<p style="padding:1.5rem;color:var(--text-muted);font-size:.85rem">No predictions yet.</p>';
  } catch(e) { console.error(e); toast('Dashboard error','error'); }
}

function animateCounter(id, target) {
  const el=$(`#${id}`); if(!el) return; let cur=0; const step=Math.max(1,Math.ceil(target/30));
  const iv=setInterval(()=>{cur=Math.min(cur+step,target);el.textContent=cur;if(cur>=target)clearInterval(iv);},30);
}

function drawDonut(dist) {
  const cv=$('#risk-donut'); if(!cv) return;
  const ctx=cv.getContext('2d'), W=cv.width, H=cv.height, cx=W/2, cy=H/2, r=80, th=22;
  ctx.clearRect(0,0,W,H);
  const total = (dist.high||0)+(dist.medium||0)+(dist.low||0);
  if(!total){ ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=th;ctx.stroke();ctx.fillStyle='#64748b';ctx.font='14px Inter';ctx.textAlign='center';ctx.fillText('No data',cx,cy+5); return; }
  const segs=[{val:dist.high||0,color:'#ef4444',label:'High'},{val:dist.medium||0,color:'#f59e0b',label:'Medium'},{val:dist.low||0,color:'#10b981',label:'Low'}];
  let angle=-Math.PI/2;
  segs.forEach(s=>{if(!s.val)return;const sw=(s.val/total)*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,r,angle,angle+sw);ctx.strokeStyle=s.color;ctx.lineWidth=th;ctx.lineCap='butt';ctx.stroke();angle+=sw;});
  ctx.fillStyle='#e2e8f0';ctx.font='bold 28px JetBrains Mono';ctx.textAlign='center';ctx.fillText(total,cx,cy+2);
  ctx.fillStyle='#64748b';ctx.font='12px Inter';ctx.fillText('Total',cx,cy+18);
  const lg=$('#donut-legend');
  if(lg) lg.innerHTML=segs.map(s=>`<div class="donut-legend-item"><span class="donut-color" style="background:${s.color}"></span><span>${s.label}: ${s.val} (${Math.round(s.val/total*100)}%)</span></div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
//  PATIENTS TAB (WORKING)
// ═══════════════════════════════════════════════════════════════
let allPatients = [];

async function loadPatients() {
  const loading=$('#patients-loading'), table=$('#patients-table'), empty=$('#patients-empty'), tbody=$('#patients-tbody');
  showEl(loading); showEl(table,false); showEl(empty,false);
  try {
    const data = await api('GET', '/patients');
    allPatients = data.patients || [];
    showEl(loading, false);
    renderPatients(allPatients);
  } catch(e) { loading.innerHTML = 'Failed: '+e.message; }
}

function renderPatients(pts) {
  const table=$('#patients-table'), empty=$('#patients-empty'), tbody=$('#patients-tbody');
  if (!pts.length) { showEl(empty); showEl(table,false); return; }
  tbody.innerHTML='';
  pts.forEach((p,i) => {
    const date = p.created_at ? new Date(p.created_at).toLocaleDateString() : '—';
    tbody.insertAdjacentHTML('beforeend',`<tr><td>${i+1}</td><td>${p.name||'—'}</td><td>${p.age||'—'}</td><td>${p.gender||'—'}</td><td>${p.prediction_count??'—'}</td><td>${date}</td></tr>`);
  });
  showEl(table); showEl(empty,false);
}

$('#patient-search').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  renderPatients(q ? allPatients.filter(p => (p.name||'').toLowerCase().includes(q)) : allPatients);
});

// ═══════════════════════════════════════════════════════════════
//  MODEL INFO TAB (WORKING)
// ═══════════════════════════════════════════════════════════════
async function loadModelInfo() {
  try {
    const data = await api('GET', '/model/performance');

    // ML metrics — backend returns data.ml_metrics (not data.ml)
    const ml = data.ml_metrics;
    const mlEl = $('#ml-metrics');
    if (ml) {
      mlEl.innerHTML = `<div class="metric-grid">
        <div class="metric-item"><span class="metric-label">Algorithm</span><span class="metric-val">Random Forest</span></div>
        <div class="metric-item"><span class="metric-label">Training Accuracy</span><span class="metric-val">${ml.training_accuracy!=null ? (ml.training_accuracy*100).toFixed(1)+'%' : 'N/A'}</span></div>
        <div class="metric-item"><span class="metric-label">Testing Accuracy</span><span class="metric-val">${ml.testing_accuracy!=null ? (ml.testing_accuracy*100).toFixed(1)+'%' : 'N/A'}</span></div>
        <div class="metric-item"><span class="metric-label">Precision</span><span class="metric-val">${ml.precision!=null ? (ml.precision*100).toFixed(1)+'%' : 'N/A'}</span></div>
        <div class="metric-item"><span class="metric-label">Recall</span><span class="metric-val">${ml.recall!=null ? (ml.recall*100).toFixed(1)+'%' : 'N/A'}</span></div>
        <div class="metric-item"><span class="metric-label">F1-Score</span><span class="metric-val">${ml.f1_score!=null ? (ml.f1_score*100).toFixed(1)+'%' : 'N/A'}</span></div>
        <div class="metric-item"><span class="metric-label">CV Accuracy</span><span class="metric-val">${ml.cv_mean!=null ? (ml.cv_mean*100).toFixed(1)+'%' : 'N/A'}</span></div>
        <div class="metric-item"><span class="metric-label">Best Params</span><span class="metric-val">${data.best_params ? JSON.stringify(data.best_params).substring(0,60)+'...' : 'N/A'}</span></div>
      </div>`;
    } else {
      mlEl.innerHTML = '<p style="color:var(--text-muted);padding:1rem">ML model not trained yet. Run: python ml_model.py</p>';
    }

    // Feature importance
    if (data.feature_importance) {
      renderFeatureBars(data.feature_importance, 'model-feature-bars');
    }
  } catch(e) {
    console.error(e);
    $('#ml-metrics').innerHTML = '<p style="color:var(--text-muted);padding:1rem">Could not load model info. Make sure the backend is running.</p>';
  }
}

// ═══════════════════════════════════════════════════════════════
//  UTILITY
// ═══════════════════════════════════════════════════════════════
function setLoading(btn, on) {
  const t=btn.querySelector('.btn-text'), l=btn.querySelector('.btn-loader');
  btn.disabled=on; if(t) showEl(t,!on); if(l) showEl(l,on);
}

// ═══════════════════════════════════════════════════════════════
//  AUTO-LOGIN & URL PARAMS
// ═══════════════════════════════════════════════════════════════
(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const resetT = urlParams.get('reset_token');
  if (resetT) {
    showScreen('login');
    switchAuthView('reset');
    $('#reset-token').value = resetT;
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  if (token.get()) {
    try { const u = await api('GET', '/auth/me'); setUserInfo(u); showScreen('app'); }
    catch { token.clear(); /* stay on intro */ }
  }
})();
