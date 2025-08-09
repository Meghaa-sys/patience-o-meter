/* script.js
   Single shared JS to control all page behaviours.
   Call initPage('login'|'page2'|'page3'|'page4'|'page5') from each HTML.
*/

function initPage(page) {
  // small audio helper
  function beep(freq=440,dur=0.05, type='sine', vol=0.02){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = vol;
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
    }catch(e){}
  }

  // common phantom cursors container
  const phantomContainer = document.getElementById('phantomContainer') || document.body;

  /* ================= PAGE: login (index.html) ================= */
  if(page === 'login'){
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const submitBtn = document.getElementById('submitBtn');
    const timerSpan = document.getElementById('timer');
    let countdown = 20;
    submitBtn.disabled = true;
    timerSpan.innerText = countdown;

    // create many fake cursors to confuse
    const cursors = [];
    for(let i=0;i<5;i++){
      const c = document.createElement('div'); c.className = 'fake-cursor';
      c.style.width = (8 + Math.random()*12)+'px'; c.style.height = c.style.width;
      c.style.background = 'rgba(255,255,255,'+(0.3+Math.random()*0.7)+')';
      phantomContainer.appendChild(c); cursors.push(c);
    }
    let mx=0,my=0;
    document.addEventListener('mousemove', (e)=>{ mx=e.clientX; my=e.clientY; });

    // animate fake cursors trailing behind mouse with different offsets
    (function animateCursors(){
      cursors.forEach((c, idx)=>{
        // each cursor lags by different factor
        const lag = 0.06 + idx*0.02;
        const dx = (mx - (parseFloat(c.style.left)||0)); const dy = (my - (parseFloat(c.style.top)||0));
        c.style.left = ( (parseFloat(c.style.left)||mx) + dx*lag ) + 'px';
        c.style.top = ( (parseFloat(c.style.top)||my) + dy*lag ) + 'px';
        c.style.position = 'fixed';
        c.style.pointerEvents = 'none';
        c.style.borderRadius = '50%';
        c.style.zIndex = 9998 - idx;
      });
      requestAnimationFrame(animateCursors);
    })();

    // username auto-typo mapping
    const typoMap = { 'megha':'mango', 'hello':'hullo','name':'n@me','admin':'adm1n' };
    username.addEventListener('input', (e)=>{
      const val = e.target.value;
      let out = val;
      Object.keys(typoMap).forEach(k => { const re = new RegExp('\\b'+k+'\\b','ig'); out = out.replace(re, typoMap[k]); });
      // small chance to apply change immediately
      if(out !== val && Math.random() > 0.3){
        setTimeout(()=>{ if(username.value === val) username.value = out; beep(700,0.04,'square'); }, 280);
      }
    });

    // email reversed as typed (live)
    email.addEventListener('input', (e)=>{
      const raw = e.target.value;
      const rev = raw.split('').reverse().join('');
      // show reversed visually but store original in data-orig (so backend could use it)
      e.target.dataset.orig = raw;
      e.target.value = rev;
      beep(520,0.03,'sine',0.01);
    });

    // runaway submit button: on mousemove it moves away until 20s have passed
    submitBtn.addEventListener('mousemove', (ev)=>{
      if(!submitBtn.dataset.unlocked){
        const rect = submitBtn.getBoundingClientRect();
        const moveX = (ev.clientX < rect.left + rect.width/2) ? -80 - Math.random()*60 : 80 + Math.random()*60;
        const moveY = (Math.random()*40 - 20);
        submitBtn.style.transform = `translate(${moveX}px, ${moveY}px)`;
        beep(900,0.02,'square',0.01);
      }
    });
    submitBtn.addEventListener('mouseleave', ()=> submitBtn.style.transform = '');

    // countdown enabling submit after 20s
    const countdownInterval = setInterval(()=>{
      countdown--; timerSpan.innerText = countdown;
      if(countdown <= 0){
        clearInterval(countdownInterval);
        submitBtn.disabled = false; submitBtn.dataset.unlocked = '1';
        document.getElementById('countdown').innerText = 'Submit is enabled — good luck.';
        // reset transform
        submitBtn.style.transform = '';
      }
    }, 1000);

    // clicking submit after unlocked navigates to page2
    submitBtn.addEventListener('click', ()=>{
      if(!submitBtn.dataset.unlocked){ beep(240,0.06); return; }
      // small check: make sure a name/email exists; if not, frustrate
      const nameVal = username.value || '';
      const emailOrig = email.dataset.orig || '';
      if(!nameVal || !emailOrig){ alert('Please provide name and email.'); return; }
      // navigate
      window.location.href = 'page2.html';
    });
  } // end login

  /* ================= PAGE: page2 (cookies, captcha, reversed scroll, runaway arrows) ================= */
  if(page === 'page2'){
    // cookie joke popup
    const acceptBtn = document.getElementById('acceptCookies');
    const declineBtn = document.getElementById('declineCookies');
    acceptBtn.addEventListener('click', ()=>{
      alert("Cookie accepted 🍪\nJoke: These cookies are diabetic — they're made with extra love and sugar… and regret.");
      beep(700,0.04,'square');
    });
    declineBtn.addEventListener('click', ()=>{ alert("No cookies? You monster."); });

    // captcha generation onto canvas (hard to read)
    const canvas = document.getElementById('captchaCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    function drawCaptcha(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // messy background
      for(let i=0;i<200;i++){
        ctx.fillStyle = `rgba(${20+Math.random()*100},${20+Math.random()*200},${20+Math.random()*100},${0.03+Math.random()*0.12})`;
        ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*40, Math.random()*10);
      }
      // draw random noisy characters overlapping
      const chars = 'AB8K%$#@7mN!QwZ2xY';
      let text='';
      for(let i=0;i<6;i++){ text += chars.charAt(Math.floor(Math.random()*chars.length)); }
      // apply heavy distortion: many rotations, stroke overlays
      for(let i=0;i<12;i++){
        ctx.save();
        const fsize = 28 + Math.random()*36;
        ctx.font = `${fsize}px serif`;
        ctx.translate( (canvas.width/7) * (i%6+1) + Math.random()*20 - 10, canvas.height/2 + Math.random()*30 - 15 );
        ctx.rotate((Math.random()-0.5)*0.8);
        ctx.fillStyle = `rgba(${50+Math.random()*200},${50+Math.random()*200},${50+Math.random()*200},${0.12+Math.random()*0.4})`;
        ctx.fillText(chars.charAt(Math.floor(Math.random()*chars.length)), 0, 0);
        ctx.restore();
      }
      // add noise lines
      for(let i=0;i<30;i++){
        ctx.beginPath();
        ctx.moveTo(Math.random()*canvas.width, Math.random()*canvas.height);
        ctx.lineTo(Math.random()*canvas.width, Math.random()*canvas.height);
        ctx.strokeStyle = `rgba(255,255,255,${0.02+Math.random()*0.06})`;
        ctx.lineWidth = Math.random()*2;
        ctx.stroke();
      }
    }
    drawCaptcha();
    // Re-draw captcha often to make it unreadable
    setInterval(drawCaptcha, 1800);

    // captcha verify button: often fails
    document.getElementById('captchaBtn').addEventListener('click', ()=>{
      // random chance to fail always
      if(Math.random() > 0.2){
        alert('Captcha unreadable. Please try again.');
        beep(220,0.06,'sine');
      } else {
        alert('Captcha accepted (magic). Proceeding.');
        window.location.href = 'page3.html';
      }
    });

    // left/right arrow behaviour: left -> page3; right -> back to login; arrows runaway for 10s
    const leftArrow = document.getElementById('leftArrow');
    const rightArrow = document.getElementById('rightArrow');
    let arrowsLocked = true;
    const runAwayDuration = 10000;
    function makeRunaway(btn){
      btn.addEventListener('mousemove', (e)=>{
        if(arrowsLocked) {
          const rect = btn.getBoundingClientRect();
          btn.style.transform = `translate(${(Math.random()*160-80)}px, ${(Math.random()*40-20)}px)`;
          beep(900,0.02);
        }
      });
      btn.addEventListener('mouseleave', ()=>btn.style.transform='');
    }
    makeRunaway(leftArrow); makeRunaway(rightArrow);
    // unlock after 10s
    setTimeout(()=> { arrowsLocked = false; leftArrow.style.transform=''; rightArrow.style.transform=''; }, runAwayDuration);

    leftArrow.addEventListener('click', ()=> {
      if(arrowsLocked){ alert('Arrow is shy'); return; }
      window.location.href = 'page3.html';
    });
    rightArrow.addEventListener('click', ()=> {
      if(arrowsLocked){ alert('Arrow is shy'); return; }
      window.location.href = 'index.html';
    });

    // reverse scroll: scrolling up moves down and vice versa for this page
    const onWheel = (e)=> {
      e.preventDefault();
      window.scrollBy(0, -e.deltaY);
      beep(440,0.02);
    };
    window.addEventListener('wheel', onWheel, {passive:false});
    // remove reversed scroll when leaving page to avoid unexpected behavior globally
    window.addEventListener('beforeunload', ()=> window.removeEventListener('wheel', onWheel));
  }

  /* ================= PAGE: page3 (glitch & exit loop) ================= */
  if(page === 'page3'){
    const glitchCard = document.getElementById('glitchCard');
    const exitBtn = document.getElementById('exitBtn');
    const glitchLog = document.getElementById('glitchLog');
    const logArea = document.getElementById('logArea');

    // start glitch visuals for 10s
    glitchCard.classList.add('shake');
    setTimeout(()=> glitchCard.classList.remove('shake'), 10000);
    // overlay green flicker via CSS changes
    const originalBg = document.body.style.background;
    const flickerInterval = setInterval(()=> {
      document.body.style.background = `linear-gradient(180deg,#032,#092)`; setTimeout(()=> document.body.style.background = originalBg, 120);
    }, 360);
    setTimeout(()=> clearInterval(flickerInterval), 10000);

    // after 10s show exit button (it is visible already). On click start error loop for 10s then show move on message
    exitBtn.addEventListener('click', ()=> {
      // simulate loop of errors for 10s
      glitchLog.style.display = 'block';
      logArea.textContent = '';
      let elapsed = 0;
      const t = setInterval(()=> {
        const now = new Date().toLocaleTimeString();
        logArea.textContent += `${now}  ERROR: Unexpected null pointer at pixel driver\n`;
        logArea.scrollTop = logArea.scrollHeight;
        beep(200 + Math.random()*600, 0.03, 'sine');
        elapsed += 500;
        if(elapsed >= 10000){
          clearInterval(t);
          // show move-on button
          const moveOn = document.createElement('button');
          moveOn.className = 'btn';
          moveOn.innerText = 'Seems you have good patience — Move on';
          moveOn.style.marginTop = '10px';
          glitchLog.appendChild(moveOn);
          moveOn.addEventListener('click', ()=> {
            window.location.href = 'page4.html';
          });
        }
      }, 500);
    });
  }

  /* ================= PAGE: page4 (IQ games) ================= */
  if(page === 'page4'){
    // Game1: Guess the image — always incorrect
    const guessBtn = document.getElementById('guessBtn');
    const guessMsg = document.getElementById('guessMsg');
    const guessInput = document.getElementById('guessInput');
    guessBtn.addEventListener('click', ()=>{
      guessMsg.innerText = 'Oops — the image was incorrect. Try again.';
      guessMsg.classList.add('bad');
      beep(220,0.05);
    });
    document.getElementById('guessNext').addEventListener('click', ()=> {
      guessMsg.innerText = 'Moving to next image...';
      setTimeout(()=> guessMsg.innerText = '', 900);
    });

    // Game2: Spot the difference — 3 tries with trolling messages
    const diffSubmit = document.getElementById('diffSubmit');
    const diffMsg = document.getElementById('diffMsg');
    let diffTries = 0;
    diffSubmit.addEventListener('click', ()=> {
      diffTries++;
      if(diffTries === 1){
        diffMsg.innerText = 'Oops — it is incorrect.';
        beep(300,0.04);
      } else if(diffTries === 2){
        diffMsg.innerText = 'One more chance...';
        beep(360,0.04);
      } else {
        diffMsg.innerText = 'There is literally no difference — so where do you spot this?';
        beep(200,0.07);
      }
    });
    document.getElementById('diffNext').addEventListener('click', ()=> { diffMsg.innerText=''; diffTries=0; });

    // Game3: paragraph flicker for 10s
    const para = document.getElementById('flickerPara');
    const paraBtn = document.getElementById('paraCheck');
    paraBtn.addEventListener('click', ()=> {
      let elapsed = 0;
      const t = setInterval(()=> {
        para.style.opacity = (para.style.opacity === '0.08' ? '1' : '0.08');
        elapsed += 500;
        if(elapsed >= 10000){ clearInterval(t); para.style.opacity = '1'; alert('Now move to the next game.'); }
      }, 500);
    });

    // final move to page5
    document.getElementById('toPage5').addEventListener('click', ()=> {
      window.location.href = 'page5.html';
    });
  }

  /* ================= PAGE: page5 (final loading and message, emoji) ================= */
  if(page === 'page5'){
    const progress = document.getElementById('finalProgress');
    const label = document.getElementById('finalLabel');
    const exitBtn = document.getElementById('exitBtnFinal');
    const emotes = document.querySelectorAll('.emote');
    const selected = document.getElementById('selectedEmoji');

    // animate loading 0->100 over 10s, then drop to 0 immediately and announce
    let p = 0;
    const startTime = Date.now();
    const totalDur = 10000;
    const iv = setInterval(()=> {
      const t = Date.now() - startTime;
      p = Math.min(100, Math.floor((t/totalDur) * 100));
      progress.style.width = p + '%';
      label.innerText = `Loading patience: ${p}%`;
      if(t >= totalDur){
        clearInterval(iv);
        // dramatic drop
        setTimeout(()=> {
          progress.style.width = '0%';
          label.innerText = 'Oops — patience reset to 0%';
          // voice message using speechSynthesis
          const msg = new SpeechSynthesisUtterance('Congratulations. You have no patience. This test will not work for you. It is better to leave and do your job.');
          msg.rate = 0.95; window.speechSynthesis.speak(msg);
        }, 800);
      }
    }, 200);

    emotes.forEach(e=> e.addEventListener('click', ()=> {
      selected.innerText = 'You selected: ' + e.innerText;
      e.style.boxShadow = '0 8px 30px rgba(124,58,237,0.18)';
    }));

    exitBtn.addEventListener('click', ()=> {
      // small exit action - redirect to index or close tab (can't close tab)
      alert('Have a nice day!'); window.location.href = 'index.html';
    });
  }
} // end initPage
