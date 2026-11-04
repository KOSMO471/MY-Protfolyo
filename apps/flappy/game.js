(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, groundY = 584;
  const assets = ['img (1).png','img (2).png','img (3).png','img (4).png'].map(name => {
    const image = new Image(); image.src = `img/${name}`; return image;
  });
  const costumeNames = ['Pilot','Gökkuşağı','Sultan','Klasik'];
  const menu = document.querySelector('#menuScreen'), costumes = document.querySelector('#costumeScreen'), about = document.querySelector('#aboutScreen'), gameOver = document.querySelector('#gameOverScreen');
  const hud = document.querySelector('#hud'), scoreEl = document.querySelector('#score'), bestEl = document.querySelector('#best');
  let state = 'menu', selected = Number(localStorage.getItem('skyCostume') || 0), score = 0;
  let best = Number(localStorage.getItem('skyBest') || 0), birdY = 280, velocity = 0, pipes = [], clouds = [], lastTime = 0, elapsed = 0, groundOffset = 0, newRecord = false;
  const gravity = 1450, flapPower = -440, pipeSpeed = 205, gapSize = 182, pipeWidth = 82;
  bestEl.textContent = best;
  for (let i=0;i<6;i++) clouds.push({x:i*210+50,y:65+(i*83)%245,s:.65+(i%3)*.2});

  function show(which) {
    [menu,costumes,about,gameOver].forEach(el => el.hidden = true);
    if(which==='menu') menu.hidden=false;
    if(which==='costumes') costumes.hidden=false;
    if(which==='about') about.hidden=false;
    if(which==='over') gameOver.hidden=false;
    hud.hidden = state !== 'playing';
    document.querySelector('#resumeButton').hidden = !['playing','dead'].includes(state) || !pipes.length;
    document.querySelector('#startButton').textContent = state === 'dead' ? '↻  Yeni uçuş başlat' : '▶  Oyunu başlat';
  }
  function buildCostumes(){
    const grid=document.querySelector('#costumeGrid'); grid.innerHTML='';
    assets.forEach((img,i)=>{
      const button=document.createElement('button');button.className='costume-option'+(i===selected?' selected':'');button.setAttribute('aria-label',costumeNames[i]);
      button.innerHTML=`<span class="check">✓</span><img src="${img.src}" alt=""><span>${costumeNames[i]}</span>`;
      button.addEventListener('click',()=>{selected=i;localStorage.setItem('skyCostume',i);buildCostumes();}); grid.appendChild(button);
    });
  }
  function resetGame(){score=0;birdY=280;velocity=0;pipes=[];elapsed=0;scoreEl.textContent='0';addPipe(W+120);state='playing';show('game');lastTime=performance.now();}
  function addPipe(x){const top=105+Math.random()*260;pipes.push({x,top,scored:false});}
  function flap(){if(state==='menu' || state==='dead'){resetGame();return;}if(state!=='playing')return;velocity=flapPower;}
  function openMenu(){if(state==='playing')state='paused';if(state==='dead')state='dead';show('menu');}
  function resume(){if(state==='paused'){state='playing';lastTime=performance.now();show('game');}else resetGame();}
  function endGame(){state='dead';newRecord=score>best;if(newRecord){best=score;localStorage.setItem('skyBest',best);bestEl.textContent=best;}document.querySelector('#finalScore').textContent=score;document.querySelector('#recordMessage').textContent=newRecord?'Yeni rekor! Harika uçuş!':'Bir tur daha uçmaya ne dersin?';show('over');}
  function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function drawBackground(dt=0){
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#80c6dc');sky.addColorStop(.63,'#c8e8df');sky.addColorStop(1,'#f1e5b9');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    // Soft, distant hills
    ctx.fillStyle='#a3d1c3';ctx.beginPath();ctx.moveTo(0,445);for(let x=0;x<=W;x+=4)ctx.lineTo(x,430+Math.sin(x*.009)*17+Math.sin(x*.021)*9);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
    ctx.fillStyle='#bddbbd';ctx.beginPath();ctx.moveTo(0,488);for(let x=0;x<=W;x+=4)ctx.lineTo(x,472+Math.sin(x*.012+2)*12+Math.sin(x*.027)*8);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
    clouds.forEach((c,i)=>{c.x-=dt*(state==='playing'?10:3);if(c.x<-110)c.x=W+50;ctx.globalAlpha=.36;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(c.x,c.y,45*c.s,15*c.s,0,0,Math.PI*2);ctx.ellipse(c.x-20*c.s,c.y+2,22*c.s,14*c.s,0,0,Math.PI*2);ctx.ellipse(c.x+18*c.s,c.y-7,25*c.s,20*c.s,0,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
    // warm horizon and moving ground
    ctx.fillStyle='#d4dfa5';ctx.fillRect(0,groundY,W,H-groundY);ctx.fillStyle='#a9c981';ctx.fillRect(0,groundY,W,8);
    ctx.fillStyle='rgba(77,112,83,.25)';for(let x=-(groundOffset%36);x<W;x+=36)ctx.fillRect(x,groundY+18,18,3);
  }
  function drawPipe(p){
    const bottomY=p.top+gapSize;
    const grad=ctx.createLinearGradient(p.x,0,p.x+pipeWidth,0);grad.addColorStop(0,'#4e9b6c');grad.addColorStop(.22,'#83c779');grad.addColorStop(.56,'#69b572');grad.addColorStop(1,'#367c5b');
    ctx.fillStyle=grad;ctx.strokeStyle='#397754';ctx.lineWidth=4;
    ctx.fillRect(p.x,0,pipeWidth,p.top-18);ctx.strokeRect(p.x+2,0,pipeWidth-4,p.top-18);
    ctx.fillRect(p.x-8,p.top-24,pipeWidth+16,24);ctx.strokeRect(p.x-8,p.top-24,pipeWidth+16,24);
    ctx.fillRect(p.x,bottomY+22,pipeWidth,H-bottomY-22);ctx.strokeRect(p.x+2,bottomY+22,pipeWidth-4,H-bottomY-22);
    ctx.fillRect(p.x-8,bottomY,pipeWidth+16,24);ctx.strokeRect(p.x-8,bottomY,pipeWidth+16,24);
    ctx.fillStyle='rgba(255,255,255,.17)';ctx.fillRect(p.x+12,0,7,p.top-22);ctx.fillRect(p.x+12,bottomY+24,7,H-bottomY);
  }
  function drawBird(){
    ctx.save();ctx.translate(270,birdY);ctx.rotate(Math.max(-.38,Math.min(.72,velocity/650)));
    const img=assets[selected];if(img.complete&&img.naturalWidth){
      const ratio=img.naturalWidth/img.naturalHeight;let dw=72,dh=62;
      if(selected===1){dw=106;dh=62;} if(ratio<.78){dw=62;dh=72;}
      ctx.imageSmoothingEnabled=false;ctx.drawImage(img,-dw/2,-dh/2,dw,dh);
    }else{ctx.fillStyle='#f4cd48';ctx.beginPath();ctx.ellipse(0,0,26,20,0,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(10,-7,8,0,7);ctx.fill();ctx.fillStyle='#19233d';ctx.beginPath();ctx.arc(13,-7,3,0,7);ctx.fill();ctx.fillStyle='#ff784d';ctx.beginPath();ctx.moveTo(20,2);ctx.lineTo(35,7);ctx.lineTo(20,12);ctx.fill();}
    ctx.restore();
  }
  function draw(){
    drawBackground(0);pipes.forEach(drawPipe);drawBird();
    if(state==='menu' || state==='paused'){ctx.fillStyle='rgba(255,255,255,.8)';ctx.font='600 13px Manrope, sans-serif';ctx.textAlign='center';ctx.fillText('SPACE  /  DOKUN',W*.78,H*.75);}
  }
  function loop(now){requestAnimationFrame(loop);const dt=Math.min((now-lastTime)/1000,.04);lastTime=now;
    if(state==='playing'){
      elapsed+=dt;velocity+=gravity*dt;birdY+=velocity*dt;groundOffset+=pipeSpeed*dt;
      pipes.forEach(p=>{p.x-=pipeSpeed*dt;if(!p.scored&&p.x+pipeWidth<270){p.scored=true;score++;scoreEl.textContent=score;}});
      if(pipes.length&&pipes[pipes.length-1].x<W-270)addPipe(W+10);
      pipes=pipes.filter(p=>p.x+pipeWidth>-20);
      const bx=270,by=birdY;
      if(by+21>groundY||by-21<0||pipes.some(p=>bx+21>p.x-5&&bx-21<p.x+pipeWidth+5&&(by-17<p.top-15||by+17>p.top+gapSize+15)))endGame();
    }
    draw();
  }
  document.querySelector('#startButton').addEventListener('click',resetGame);
  document.querySelector('#resumeButton').addEventListener('click',resume);
  document.querySelector('#pauseButton').addEventListener('click',openMenu);
  document.querySelector('#costumeButton').addEventListener('click',()=>{buildCostumes();show('costumes');});
  document.querySelector('#aboutButton').addEventListener('click',()=>show('about'));
  document.querySelector('#costumeDone').addEventListener('click',()=>show('menu'));
  document.querySelectorAll('[data-back]').forEach(btn=>btn.addEventListener('click',()=>show('menu')));
  document.querySelector('#retryButton').addEventListener('click',resetGame);
  document.querySelector('#resultMenuButton').addEventListener('click',()=>show('menu'));
  canvas.addEventListener('pointerdown',e=>{if(state==='playing'){e.preventDefault();flap();}});
  window.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();if(state==='playing')flap();else if(state==='menu'||state==='dead')flap();}if(e.key==='Escape'){e.preventDefault();if(state==='playing'||state==='dead'||state==='paused')openMenu();else if(!costumes.hidden||!about.hidden)show('menu');}});
  document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();openMenu();});
  show('menu');lastTime=performance.now();requestAnimationFrame(loop);
})();
