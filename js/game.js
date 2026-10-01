const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const ui = {
  score: document.getElementById('score'), coins: document.getElementById('coins'), lives: document.getElementById('lives'), level: document.getElementById('level'),
  coinMission: document.getElementById('coinMission'), enemyMission: document.getElementById('enemyMission'), goalMission: document.getElementById('goalMission'),
  coinBar: document.getElementById('coinBar'), enemyBar: document.getElementById('enemyBar'), goalBar: document.getElementById('goalBar'),
  overlay: document.getElementById('overlay'), overlayTitle: document.getElementById('overlayTitle'), overlayText: document.getElementById('overlayText')
};

const world = { width: 5200, gravity: 0.85, floorY: 710, cameraX: 0, paused: false, won: false };
const state = { score:0, coins:0, lives:3, enemies:0, goal:0, level:1 };
const keys = {left:false,right:false,jump:false,attack:false};

const platforms = [
  {x:0,y:710,w:1150,h:190}, {x:1240,y:760,w:650,h:140}, {x:2010,y:690,w:680,h:210},
  {x:2800,y:760,w:550,h:140}, {x:3450,y:670,w:720,h:230}, {x:4300,y:730,w:900,h:170},
  {x:850,y:535,w:260,h:35}, {x:1570,y:560,w:300,h:35}, {x:2350,y:505,w:300,h:35}, {x:3230,y:500,w:280,h:35}, {x:4000,y:490,w:310,h:35}
];
const coins = [];
for (let i=0;i<42;i++) coins.push({x:420+i*110 + (i%5)*25, y: 520-(i%4)*65, r:18, collected:false, spin:Math.random()*Math.PI*2});
const enemies = [
  {x:1050,y:645,w:62,h:62,dir:-1,min:930,max:1120,alive:true},
  {x:1740,y:495,w:62,h:62,dir:1,min:1580,max:1830,alive:true},
  {x:2500,y:625,w:62,h:62,dir:-1,min:2200,max:2620,alive:true},
  {x:3100,y:695,w:62,h:62,dir:1,min:2850,max:3290,alive:true},
  {x:3750,y:605,w:62,h:62,dir:-1,min:3510,max:4100,alive:true}
];
const mystery = [{x:1450,y:395,w:74,h:74,hit:false},{x:2980,y:420,w:74,h:74,hit:false}];
const goal = {x:4930,y:520,w:110,h:190};

const player = {x:210,y:600,w:72,h:92,vx:0,vy:0,speed:7.2,jumpPower:16.5,onGround:false,facing:1,attackTimer:0,invuln:0,anim:0};
let checkpoint = {x:210,y:600};

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function rects(a,b){return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y}

function reset(full=true){
  player.x=210; player.y=600; player.vx=player.vy=0; player.invuln=0;
  world.cameraX=0; world.paused=false; world.won=false;
  if(full){state.score=0;state.coins=0;state.lives=3;state.enemies=0;state.goal=0; coins.forEach(c=>c.collected=false); enemies.forEach(e=>e.alive=true); mystery.forEach(m=>m.hit=false)}
  hideOverlay(); updateUI();
}
function damage(){
  if(player.invuln>0) return;
  state.lives--; player.invuln=120; updateUI();
  if(state.lives<=0){ showOverlay('Fin del juego','El príncipe se quedó sin vidas. ¡Inténtalo otra vez!'); world.paused=true; }
  else {player.x=checkpoint.x; player.y=checkpoint.y; player.vx=0;player.vy=-4;}
}

function update(){
  if(world.paused) return;
  if(keys.left){player.vx-=0.75;player.facing=-1}
  if(keys.right){player.vx+=0.75;player.facing=1}
  player.vx*=0.84; player.vx=clamp(player.vx,-player.speed,player.speed);
  if(keys.jump && player.onGround){player.vy=-player.jumpPower; player.onGround=false;}
  if(keys.attack && player.attackTimer<=0) player.attackTimer=22;
  if(player.attackTimer>0) player.attackTimer--;
  if(player.invuln>0) player.invuln--;

  player.vy += world.gravity; player.vy=clamp(player.vy,-22,18);
  const prevY = player.y;
  player.x += player.vx;
  player.x = clamp(player.x,0,world.width-player.w);
  player.y += player.vy;
  player.onGround=false;

  for(const p of platforms){
    const body={x:player.x,y:player.y,w:player.w,h:player.h};
    if(rects(body,p) && prevY+player.h <= p.y+14 && player.vy>=0){player.y=p.y-player.h;player.vy=0;player.onGround=true;}
  }
  if(player.y>H+220) damage();

  for(const c of coins){
    c.spin += .12;
    if(!c.collected && Math.hypot((player.x+player.w/2)-c.x,(player.y+player.h/2)-c.y)<58){c.collected=true;state.coins++;state.score+=100;updateUI();}
  }

  for(const m of mystery){
    if(!m.hit && rects(player,m) && player.vy<0 && player.y > m.y){m.hit=true; state.coins+=3; state.score+=300; updateUI();}
  }

  for(const e of enemies){
    if(!e.alive) continue;
    e.x += e.dir*1.8; if(e.x<e.min||e.x>e.max)e.dir*=-1;
    if(rects(player,e)){
      if(player.attackTimer>9 && ((player.facing>0 && e.x>player.x-10)||(player.facing<0 && e.x<player.x+player.w+10))){e.alive=false;state.enemies++;state.score+=350;updateUI();}
      else if(player.vy>5 && player.y+player.h < e.y+38){e.alive=false;player.vy=-11;state.enemies++;state.score+=300;updateUI();}
      else damage();
    }
  }

  if(rects(player,goal) && state.goal===0){state.goal=1;state.score+=1000;updateUI(); if(state.coins>=20 && state.enemies>=3){world.won=true;world.paused=true;showOverlay('¡Misión cumplida!','El príncipe llegó al castillo con las monedas y venció a los enemigos.');} else {checkpoint={x:4480,y:600};}}

  const target = clamp(player.x-W*.38,0,world.width-W);
  world.cameraX += (target-world.cameraX)*.08;
  player.anim += Math.abs(player.vx)*.06;
}

function drawBackground(){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#66c8ff');g.addColorStop(.58,'#c8f3ff');g.addColorStop(1,'#77cce4');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // clouds
  ctx.fillStyle='rgba(255,255,255,.82)';
  for(let i=0;i<9;i++){const x=(i*310-world.cameraX*.12)%2200; const y=120+(i%3)*55; cloud(x,y,1.1+(i%2)*.25)}
  // distant cliffs
  for(let i=0;i<14;i++){let x=i*420-world.cameraX*.28; x=((x+600)%6000)-600; const h=180+(i%4)*70; ctx.fillStyle=i%2?'#82b6a2':'#77a9a2'; roundRect(x,520-h,260,h+250,45);ctx.fill(); ctx.fillStyle='#7dd060';ctx.beginPath();ctx.ellipse(x+130,520-h,145,50,0,0,Math.PI*2);ctx.fill();}
  // castle
  const cx=1180-world.cameraX*.18; ctx.fillStyle='#f8e8c8';
  for(const [x,y,w,h] of [[cx,190,80,230],[cx+105,145,100,275],[cx+235,205,75,215]]){ctx.fillRect(x,y,w,h);ctx.fillStyle='#e7534b';ctx.beginPath();ctx.moveTo(x-12,y);ctx.lineTo(x+w/2,y-80);ctx.lineTo(x+w+12,y);ctx.fill();ctx.fillStyle='#f8e8c8'}
  ctx.fillStyle='#4ca9de';ctx.fillRect(cx+25,300,25,55);ctx.fillRect(cx+138,260,28,60);ctx.fillRect(cx+260,300,24,55);
}
function cloud(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);for(const [dx,dy,r] of [[0,0,36],[42,-8,48],[90,2,32],[48,18,50]]){ctx.beginPath();ctx.arc(dx,dy,r,0,Math.PI*2);ctx.fill()}ctx.restore()}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}

function drawPlatforms(){
  for(const p of platforms){const x=p.x-world.cameraX;if(x+p.w<-40||x>W+40)continue;ctx.fillStyle='#7c4c27';roundRect(x,p.y,p.w,p.h,22);ctx.fill();ctx.fillStyle='#a76a34';for(let tx=x;tx<x+p.w;tx+=80){ctx.beginPath();ctx.arc(tx+30,p.y+55,22,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#58b431';ctx.fillRect(x,p.y-18,p.w,30);ctx.fillStyle='#78da40';for(let gx=x+10;gx<x+p.w;gx+=28){ctx.beginPath();ctx.ellipse(gx,p.y-18,18,16,0,0,Math.PI*2);ctx.fill()}}
}
function drawCoin(c){if(c.collected)return;const x=c.x-world.cameraX;if(x<-40||x>W+40)return;ctx.save();ctx.translate(x,c.y);ctx.scale(.35+Math.abs(Math.sin(c.spin))*.65,1);ctx.fillStyle='#ffb916';ctx.beginPath();ctx.arc(0,0,c.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffdf63';ctx.lineWidth=6;ctx.stroke();ctx.fillStyle='#fff0a0';ctx.font='bold 20px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('♛',0,1);ctx.restore()}
function drawEnemy(e){if(!e.alive)return;const x=e.x-world.cameraX;ctx.save();ctx.translate(x,e.y);ctx.fillStyle='#7a4a27';ctx.beginPath();ctx.ellipse(31,34,36,30,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(18,28,10,13,0,0,Math.PI*2);ctx.ellipse(43,28,10,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(20,30,4,0,7);ctx.arc(41,30,4,0,7);ctx.fill();ctx.strokeStyle='#321b12';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(8,13);ctx.lineTo(23,19);ctx.moveTo(55,13);ctx.lineTo(40,19);ctx.stroke();ctx.restore()}
function drawMystery(m){const x=m.x-world.cameraX;ctx.fillStyle=m.hit?'#b88745':'#f5a516';roundRect(x,m.y,m.w,m.h,10);ctx.fill();ctx.strokeStyle=m.hit?'#7d5a2d':'#ffd76b';ctx.lineWidth=6;ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 50px Arial';ctx.textAlign='center';ctx.fillText(m.hit?'•':'?',x+m.w/2,m.y+54)}
function drawGoal(){const x=goal.x-world.cameraX;ctx.fillStyle='#eee';ctx.fillRect(x+25,goal.y-70,8,260);ctx.fillStyle='#ff3a38';ctx.beginPath();ctx.moveTo(x+33,goal.y-68);ctx.lineTo(x+110,goal.y-42);ctx.lineTo(x+33,goal.y-16);ctx.fill();ctx.fillStyle='#f2d6a2';ctx.fillRect(x,goal.y+70,100,120);ctx.fillStyle='#df513f';ctx.beginPath();ctx.moveTo(x-10,goal.y+70);ctx.lineTo(x+50,goal.y+5);ctx.lineTo(x+110,goal.y+70);ctx.fill();}
function drawPlayer(){const x=player.x-world.cameraX,y=player.y;ctx.save();ctx.translate(x+player.w/2,y+player.h/2);ctx.scale(player.facing,1);if(player.invuln>0 && Math.floor(player.invuln/7)%2===0)ctx.globalAlpha=.35;const run=Math.sin(player.anim)*9;ctx.strokeStyle='#623619';ctx.lineWidth=15;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-8,28);ctx.lineTo(-18+run,45);ctx.moveTo(12,28);ctx.lineTo(22-run,45);ctx.stroke();ctx.fillStyle='#1f7ac8';roundRect(-22,-14,44,52,15);ctx.fill();ctx.fillStyle='#d52d35';ctx.beginPath();ctx.moveTo(-20,-8);ctx.lineTo(-54,8);ctx.lineTo(-22,20);ctx.fill();ctx.fillStyle='#ffd09e';ctx.beginPath();ctx.arc(0,-34,28,0,Math.PI*2);ctx.fill();ctx.fillStyle='#7a3515';ctx.beginPath();ctx.arc(-3,-47,27,Math.PI,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(20,-47,14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(12,-37,4,0,7);ctx.fill();ctx.fillStyle='#f4c72d';ctx.beginPath();ctx.moveTo(-17,-60);ctx.lineTo(-8,-86);ctx.lineTo(0,-67);ctx.lineTo(10,-88);ctx.lineTo(19,-60);ctx.closePath();ctx.fill();ctx.strokeStyle='#ffd09e';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(17,0);ctx.lineTo(38,12+run*.25);ctx.stroke();if(player.attackTimer>0){ctx.strokeStyle='#f7f3e9';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(35,2);ctx.lineTo(74,-25);ctx.stroke();ctx.fillStyle='#ffe27d';ctx.fillRect(26,5,24,6)}ctx.restore()}
function drawSign(){const x=120-world.cameraX;ctx.fillStyle='#8a5429';ctx.fillRect(x+55,540,20,130);roundRect(x,520,170,80,14);ctx.fillStyle='#9c622f';ctx.fill();ctx.fillStyle='#f6d89a';ctx.beginPath();ctx.moveTo(x+40,545);ctx.lineTo(x+118,545);ctx.lineTo(x+118,535);ctx.lineTo(x+150,560);ctx.lineTo(x+118,585);ctx.lineTo(x+118,575);ctx.lineTo(x+40,575);ctx.closePath();ctx.fill()}

function render(){ctx.clearRect(0,0,W,H);drawBackground();drawPlatforms();drawSign();coins.forEach(drawCoin);mystery.forEach(drawMystery);enemies.forEach(drawEnemy);drawGoal();drawPlayer()}
function loop(){update();render();requestAnimationFrame(loop)}
function updateUI(){ui.score.textContent=state.score.toLocaleString('es-EC');ui.coins.textContent=state.coins;ui.lives.textContent='♥'.repeat(Math.max(0,state.lives));ui.coinMission.textContent=`${Math.min(state.coins,20)} / 20`;ui.enemyMission.textContent=`${Math.min(state.enemies,3)} / 3`;ui.goalMission.textContent=`${state.goal} / 1`;ui.coinBar.style.width=`${Math.min(100,state.coins/20*100)}%`;ui.enemyBar.style.width=`${Math.min(100,state.enemies/3*100)}%`;ui.goalBar.style.width=`${state.goal*100}%`}
function showOverlay(t,p){ui.overlayTitle.textContent=t;ui.overlayText.textContent=p;ui.overlay.classList.remove('hidden')}
function hideOverlay(){ui.overlay.classList.add('hidden')}
function togglePause(){if(world.won)return;world.paused=!world.paused;if(world.paused)showOverlay('Pausa','La aventura está en pausa.');else hideOverlay()}

document.addEventListener('keydown',e=>{if(['ArrowLeft','a','A'].includes(e.key))keys.left=true;if(['ArrowRight','d','D'].includes(e.key))keys.right=true;if(['ArrowUp','w','W',' '].includes(e.key))keys.jump=true;if(['x','X','Enter'].includes(e.key))keys.attack=true;if(e.key==='Escape')togglePause()});
document.addEventListener('keyup',e=>{if(['ArrowLeft','a','A'].includes(e.key))keys.left=false;if(['ArrowRight','d','D'].includes(e.key))keys.right=false;if(['ArrowUp','w','W',' '].includes(e.key))keys.jump=false;if(['x','X','Enter'].includes(e.key))keys.attack=false});
function bindHold(id,key){const el=document.getElementById(id);['pointerdown','touchstart'].forEach(ev=>el.addEventListener(ev,e=>{e.preventDefault();keys[key]=true}));['pointerup','pointercancel','pointerleave','touchend'].forEach(ev=>el.addEventListener(ev,e=>{e.preventDefault();keys[key]=false}))}
bindHold('leftBtn','left');bindHold('rightBtn','right');bindHold('jumpBtn','jump');bindHold('attackBtn','attack');
document.getElementById('pauseBtn').onclick=togglePause;document.getElementById('resumeBtn').onclick=()=>{world.paused=false;hideOverlay()};document.getElementById('restartBtn').onclick=()=>reset(true);
updateUI();loop();
