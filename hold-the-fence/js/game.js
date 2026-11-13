// Hold the Fence — game logic (canvas 540x960 logical, portrait)
// Sprite sheets: 8 frames x 4 rows (up, right, down, left). See docs/GAME_NOTES.md.
(()=>{
const W=540,H=960;
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const frame=document.getElementById('frame');
let S=1,DPR=1;
function resize(){
  const st=document.getElementById('stage');
  const s=Math.min(st.clientWidth/W,st.clientHeight/H);
  S=s;DPR=Math.min(window.devicePixelRatio||1,2);
  frame.style.width=W*s+'px';frame.style.height=H*s+'px';
  cv.style.width=W*s+'px';cv.style.height=H*s+'px';
  cv.width=Math.round(W*s*DPR);cv.height=Math.round(H*s*DPR);
  // scale DOM overlays with the stage so text fits on small phones
  frame.style.fontSize=(16*Math.max(.7,Math.min(1.2,s)))+'px';
  document.querySelectorAll('.overlay,.hud,#banner').forEach(e=>{e.style.zoom=Math.max(.68,Math.min(1.2,s));});
}
addEventListener('resize',resize);

/* ---------- assets ---------- */
function loadImg(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src;});}
const FW=88,FH=118,FOOT=115;
let IMG={};
function tinted(img,color,mode){
  const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
  const g=c.getContext('2d');g.drawImage(img,0,0);g.globalCompositeOperation=mode||'source-atop';g.fillStyle=color;g.fillRect(0,0,c.width,c.height);
  if(mode==='multiply'){g.globalCompositeOperation='destination-in';g.drawImage(img,0,0);}
  return c;
}

/* ---------- world geometry ---------- */
const ZATK_DUR=.9; // seconds per zombie attack cycle (8 frames)
const FX0=70,FX1=470,FY0=215,FY1=775;
// House art is 1362x1651 source px (building + stone pad). HS maps source px -> world px.
const HS=.175,HX0=270-1362*HS/2,HY0=335.5,HW=1362*HS,HH=1651*HS;
const hp_=(x,y)=>[HX0+x*HS,HY0+y*HS];
const hrect=(x0,y0,x1,y1)=>{const a=hp_(x0,y0),b=hp_(x1,y1);return{x0:a[0],y0:a[1],x1:b[0],y1:b[1]};};
// colliders: roof block, lower walls/porch, front steps (stone pad itself is walkable)
const HRS=[hrect(108,165,1272,1085),hrect(228,1085,1138,1350),hrect(548,1350,838,1500)];
const HR={x0:HX0,x1:HX0+HW,y0:HY0,y1:HY0+HH}; // whole pad, used for decoration placement only
// silhouette used to redraw the building over things standing behind it
const HPOLY=[[640,0],[740,0],[1170,55],[1285,175],[1285,1060],[1235,1105],[1145,1110],[1145,1360],[845,1365],[845,1515],[540,1515],[540,1365],[220,1360],[220,1110],[140,1105],[95,1055],[95,215],[205,55]].map(p=>hp_(p[0],p[1]));
const HSORT=HRS[0].y1;
const LANTERN=hp_(690,1185);
const DOOR={x:270,y:HY0+1505*HS};
let segs=[];
function buildFence(){
  segs=[];
  const side=(x0,y0,x1,y1,n,nx,ny)=>{for(let i=0;i<n;i++){
    const a={x:x0+(x1-x0)*i/n,y:y0+(y1-y0)*i/n},b={x:x0+(x1-x0)*(i+1)/n,y:y0+(y1-y0)*(i+1)/n};
    segs.push({a,b,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,nx,ny,hp:stats.fenceMax,max:stats.fenceMax,broken:false,zt:Math.random()*stats.zapCd,hitT:0});}};
  side(FX0,FY0,FX1,FY0,7,0,-1);side(FX1,FY0,FX1,FY1,10,1,0);side(FX1,FY1,FX0,FY1,7,0,1);side(FX0,FY1,FX0,FY0,10,-1,0);
}
function segDist(s,x,y){const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y;let t=((x-s.a.x)*dx+(y-s.a.y)*dy)/(dx*dx+dy*dy);t=Math.max(0,Math.min(1,t));const px=s.a.x+dx*t,py=s.a.y+dy*t;return Math.hypot(x-px,y-py);}
function nearestSeg(x,y){let best=null,bd=1e9;for(const s of segs){const d=segDist(s,x,y);if(d<bd){bd=d;best=s;}}return best;}
const insideRect=(x,y,m=0)=>x>FX0-m&&x<FX1+m&&y>FY0-m&&y<FY1+m;

/* ---------- ground ---------- */
let ground,decals,dctx;
function rnd(a,b){return a+Math.random()*(b-a);}
function makeGround(){
  ground=document.createElement('canvas');ground.width=W*2;ground.height=H*2;
  const g=ground.getContext('2d');g.scale(2,2);
  g.fillStyle='#262719';g.fillRect(0,0,W,H);
  for(let i=0;i<900;i++){g.fillStyle=`rgba(${rnd(20,60)|0},${rnd(30,55)|0},${rnd(15,30)|0},${rnd(.15,.4)})`;g.beginPath();g.ellipse(rnd(0,W),rnd(0,H),rnd(4,26),rnd(3,14),rnd(0,3),0,7);g.fill();}
  // yard dirt
  g.fillStyle='#43382a';g.fillRect(FX0,FY0,FX1-FX0,FY1-FY0);
  for(let i=0;i<500;i++){g.fillStyle=`rgba(${rnd(70,110)|0},${rnd(55,85)|0},${rnd(35,55)|0},${rnd(.15,.45)})`;g.beginPath();g.ellipse(rnd(FX0,FX1),rnd(FY0,FY1),rnd(3,20),rnd(2,10),rnd(0,3),0,7);g.fill();}
  // worn edge inside fence
  const grd=g.createLinearGradient(0,FY0,0,FY0+30);grd.addColorStop(0,'rgba(20,18,10,.45)');grd.addColorStop(1,'rgba(20,18,10,0)');g.fillStyle=grd;g.fillRect(FX0,FY0,FX1-FX0,30);
  // stepping stones door -> south fence
  for(let y=DOOR.y+18;y<FY1-10;y+=24){g.fillStyle='#5d574a';g.beginPath();g.ellipse(270+rnd(-6,6),y,rnd(13,17),rnd(7,9),rnd(-.3,.3),0,7);g.fill();g.fillStyle='rgba(255,255,240,.06)';g.beginPath();g.ellipse(268,y-2,10,4,0,0,7);g.fill();}
  // grass tufts
  const tuft=(x,y,c)=>{g.strokeStyle=c;g.lineWidth=1.4;for(let k=0;k<5;k++){g.beginPath();g.moveTo(x+k*2-4,y);g.quadraticCurveTo(x+k*2-4+rnd(-3,3),y-6,x+k*3-7+rnd(-2,2),y-rnd(7,13));g.stroke();}};
  for(let i=0;i<160;i++){const x=rnd(0,W),y=rnd(0,H);if(insideRect(x,y,8))continue;tuft(x,y,`rgba(${rnd(70,100)|0},${rnd(85,110)|0},${rnd(40,55)|0},.8)`);}
  for(let i=0;i<40;i++){const x=rnd(FX0+10,FX1-10),y=rnd(FY0+10,FY1-10);if(x>HR.x0-10&&x<HR.x1+10&&y>HR.y0-10&&y<HR.y1+10)continue;tuft(x,y,'rgba(92,96,52,.7)');}
  // rocks & stumps outside
  for(let i=0;i<22;i++){const x=rnd(0,W),y=rnd(0,H);if(insideRect(x,y,20))continue;g.fillStyle='#3b3a33';g.beginPath();g.ellipse(x,y,rnd(5,11),rnd(4,7),0,0,7);g.fill();g.fillStyle='rgba(255,255,240,.07)';g.beginPath();g.ellipse(x-2,y-2,4,2,0,0,7);g.fill();}
  decals=document.createElement('canvas');decals.width=W*2;decals.height=H*2;dctx=decals.getContext('2d');dctx.scale(2,2);
}
function splat(x,y,big){
  for(let i=0;i<(big?9:5);i++){dctx.fillStyle=`rgba(${rnd(60,95)|0},${rnd(95,125)|0},${rnd(30,50)|0},${rnd(.35,.6)})`;dctx.beginPath();dctx.ellipse(x+rnd(-14,14),y+rnd(-6,6),rnd(3,big?14:9),rnd(2,big?7:5),rnd(0,3),0,7);dctx.fill();}
}

/* ---------- state ---------- */
let shake=0,state='load',wave=0,kills=0,toSpawn=0,spawnT=0,waveT=0;
let stats,boy,house,zombies,shots,parts,arcs,popups,upLv;
let best=0;try{best=+localStorage.getItem('htf_best')||0;}catch(e){}
function reset(){
  stats={fireCd:.6,dmg:3,reach:50,arc:2.1,kb:10,zapDmg:1,zapCd:1.1,fenceMax:60,repair:14,speed:150};
  upLv={};
  boy={x:270,y:640,dir:2,anim:0,idle:0,moving:false,hp:100,max:100,cd:0,hurt:0,repairing:null,atk:-1,swingDur:.42,hitDone:false};shake=0;
  house={hp:500,max:500,hurt:0};
  zombies=[];shots=[];parts=[];arcs=[];popups=[];
  wave=0;kills=0;makeGround();
}

/* ---------- waves ---------- */
function waveCfg(n){return{count:5+n*3,hp:3+Math.floor(n*.9),spd:24+n*1.2,dps:5+n*.6,gap:Math.max(.3,1.5-n*.09)};}
function startWave(){
  wave++;const c=waveCfg(wave);toSpawn=c.count;spawnT=1.2;state='play';
  banner(`Wave ${wave}`,c.count+' incoming');
}
function spawnGroup(){
  const c=waveCfg(wave);
  const side=Math.random();let x,y;
  if(side<.38){x=rnd(20,W-20);y=-30;}else if(side<.62){x=rnd(20,W-20);y=H+30;}
  else if(side<.81){x=-30;y=rnd(150,880);}else{x=W+30;y=rnd(150,880);}
  let g=1;if(Math.random()<.22+wave*.03)g+=1+Math.floor(Math.random()*Math.min(4,1+wave/2));
  g=Math.min(g,toSpawn);
  for(let i=0;i<g;i++){spawnZombie(x+rnd(-26,26),y+rnd(-26,26),c);toSpawn--;}
}
function spawnZombie(x,y,c){
  const kind='walker';
  const z={x,y,kind,hp:c.hp,spd:c.spd*rnd(.85,1.15),dps:c.dps,sc:.7,r:14,anim:Math.random()*8,dir:2,flash:0,outside:false,state:'inside',seg:null,tx:0,ty:0,rt:0,dead:false,dt:0,kb:0,shake:0,atkOn:null,atkT:0,struck:false};
  z.max=z.hp;
  zombies.push(z);
}
function setSeg(z,s){z.seg=s;const t=rnd(-.35,.35);const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y;z.tx=s.mx+dx*t+s.nx*11;z.ty=s.my+dy*t+s.ny*11;}

/* ---------- input ---------- */
const keys={};let joy=null;
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key==='Escape'||e.key==='p')togglePause();});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
const toLocal=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/S,y:(e.clientY-r.top)/S};};
cv.addEventListener('pointerdown',e=>{if(state!=='play')return;const p=toLocal(e);joy={id:e.pointerId,ox:p.x,oy:p.y,x:p.x,y:p.y};cv.setPointerCapture(e.pointerId);});
cv.addEventListener('pointermove',e=>{if(joy&&e.pointerId===joy.id){const p=toLocal(e);joy.x=p.x;joy.y=p.y;}});
const endJoy=e=>{if(joy&&e.pointerId===joy.id)joy=null;};
cv.addEventListener('pointerup',endJoy);cv.addEventListener('pointercancel',endJoy);

/* ---------- audio ---------- */
let AC=null,muted=false,lastZap=0;
function audio(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();}
let noiseBuf=null;
function noise(){if(!noiseBuf){noiseBuf=AC.createBuffer(1,AC.sampleRate*.3,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}const s=AC.createBufferSource();s.buffer=noiseBuf;return s;}
function sfx(t){
  if(!AC||muted)return;const n=AC.currentTime,g=AC.createGain();g.connect(AC.destination);
  if(t==='shoot'){const o=AC.createOscillator();o.type='triangle';o.frequency.setValueAtTime(620,n);o.frequency.exponentialRampToValueAtTime(160,n+.08);g.gain.setValueAtTime(.06,n);g.gain.exponentialRampToValueAtTime(.001,n+.09);o.connect(g);o.start(n);o.stop(n+.1);}
  else if(t==='zap'){if(n-lastZap<.07)return;lastZap=n;const s=noise(),f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=2600;f.Q.value=2;s.connect(f);f.connect(g);g.gain.setValueAtTime(.09,n);g.gain.exponentialRampToValueAtTime(.001,n+.13);s.start(n);s.stop(n+.14);
    const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=110;const g2=AC.createGain();g2.gain.setValueAtTime(.04,n);g2.gain.exponentialRampToValueAtTime(.001,n+.12);o.connect(g2);g2.connect(AC.destination);o.start(n);o.stop(n+.13);}
  else if(t==='swing'){const s=noise(),f=AC.createBiquadFilter();f.type='bandpass';f.Q.value=1.5;f.frequency.setValueAtTime(500,n);f.frequency.exponentialRampToValueAtTime(2400,n+.14);s.connect(f);f.connect(g);g.gain.setValueAtTime(.001,n);g.gain.linearRampToValueAtTime(.07,n+.06);g.gain.exponentialRampToValueAtTime(.001,n+.16);s.start(n);s.stop(n+.17);}
  else if(t==='chop'){const o=AC.createOscillator();o.type='sine';o.frequency.setValueAtTime(130,n);o.frequency.exponentialRampToValueAtTime(55,n+.12);g.gain.setValueAtTime(.18,n);g.gain.exponentialRampToValueAtTime(.001,n+.14);o.connect(g);o.start(n);o.stop(n+.15);}
  else if(t==='hit'){const s=noise(),f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900;s.connect(f);f.connect(g);g.gain.setValueAtTime(.08,n);g.gain.exponentialRampToValueAtTime(.001,n+.06);s.start(n);s.stop(n+.07);}
  else if(t==='die'){const o=AC.createOscillator();o.type='sine';o.frequency.setValueAtTime(170,n);o.frequency.exponentialRampToValueAtTime(45,n+.28);g.gain.setValueAtTime(.12,n);g.gain.exponentialRampToValueAtTime(.001,n+.3);o.connect(g);o.start(n);o.stop(n+.31);}
  else if(t==='hurt'){const o=AC.createOscillator();o.type='square';o.frequency.setValueAtTime(220,n);o.frequency.exponentialRampToValueAtTime(110,n+.12);g.gain.setValueAtTime(.05,n);g.gain.exponentialRampToValueAtTime(.001,n+.13);o.connect(g);o.start(n);o.stop(n+.14);}
  else if(t==='break'){const s=noise(),f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=500;s.connect(f);f.connect(g);g.gain.setValueAtTime(.25,n);g.gain.exponentialRampToValueAtTime(.001,n+.3);s.start(n);s.stop(n+.3);}
  else if(t==='fix'){const o=AC.createOscillator();o.type='square';o.frequency.setValueAtTime(880,n);g.gain.setValueAtTime(.025,n);g.gain.exponentialRampToValueAtTime(.001,n+.04);o.connect(g);o.start(n);o.stop(n+.05);}
}

/* ---------- helpers ---------- */
const dirOf=(dx,dy)=>Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);
function pushOutHouse(e,r){let hit=false;for(const R of HRS)if(pushOutRect(e,r,R))hit=true;return hit;}
function pushOutRect(e,r,HR){
  const cx=Math.max(HR.x0,Math.min(HR.x1,e.x)),cy=Math.max(HR.y0,Math.min(HR.y1,e.y));
  const dx=e.x-cx,dy=e.y-cy,d=Math.hypot(dx,dy);
  if(e.x>HR.x0&&e.x<HR.x1&&e.y>HR.y0&&e.y<HR.y1){ // inside: eject nearest side
    const opts=[[e.x-HR.x0,-1,0],[HR.x1-e.x,1,0],[e.y-HR.y0,0,-1],[HR.y1-e.y,0,1]].sort((a,b)=>a[0]-b[0])[0];
    e.x+=opts[1]*(opts[0]+r);e.y+=opts[2]*(opts[0]+r);return true;}
  if(d<r){e.x=cx+dx/(d||1)*r;e.y=cy+dy/(d||1)*r;return true;}
  return false;
}
function houseDist(x,y){let best=null;for(const R of HRS){const cx=Math.max(R.x0,Math.min(R.x1,x)),cy=Math.max(R.y0,Math.min(R.y1,y)),d=Math.hypot(x-cx,y-cy);if(!best||d<best.d)best={d,cx,cy};}return best;}
function burst(x,y,color,n,sp){for(let i=0;i<n;i++){const a=Math.random()*6.28,v=rnd(sp*.3,sp);parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(0,40),life:rnd(.25,.5),max:.5,color,size:rnd(1.5,3.5)});}}
function popup(x,y,t,c){popups.push({x,y,t,c,life:.8});}

/* ---------- update ---------- */
function update(dt){
  if(state!=='play')return;
  waveT+=dt;
  // spawning
  if(toSpawn>0){spawnT-=dt;if(spawnT<=0){spawnGroup();spawnT=waveCfg(wave).gap*rnd(.7,1.4)*(1+ (Math.random()<.15?2:0));}}

  // boy movement
  let mx=0,my=0;
  if(keys['arrowleft']||keys['a'])mx--;if(keys['arrowright']||keys['d'])mx++;
  if(keys['arrowup']||keys['w'])my--;if(keys['arrowdown']||keys['s'])my++;
  if(joy){const dx=joy.x-joy.ox,dy=joy.y-joy.oy,d=Math.hypot(dx,dy);if(d>6){const m=Math.min(1,d/48);mx=dx/d*m;my=dy/d*m;}}
  const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml;}
  boy.moving=ml>.05;
  const spMul=boy.atk>=0?.55:1;
  if(boy.moving){boy.x+=mx*stats.speed*spMul*dt;boy.y+=my*stats.speed*spMul*dt;boy.anim+=dt*12*Math.max(.5,Math.min(1,ml));if(boy.atk<0)boy.dir=dirOf(mx,my);}
  else boy.idle+=dt*8;
  boy.x=Math.max(16,Math.min(W-16,boy.x));boy.y=Math.max(110,Math.min(H-10,boy.y));
  pushOutHouse(boy,12);
  boy.hurt=Math.max(0,boy.hurt-dt);

  // axe: auto-swing at anything in reach
  boy.cd-=dt;
  let tgt=null,td=1e9;
  for(const z of zombies){if(z.dead)continue;const d=Math.hypot(z.x-boy.x,z.y-boy.y);if(d<stats.reach+z.r&&d<td){td=d;tgt=z;}}
  if(boy.atk>=0){
    boy.atk+=dt/boy.swingDur;
    if(!boy.hitDone&&boy.atk>=.5){boy.hitDone=true;axeHit();}
    if(boy.atk>=1)boy.atk=-1;
  }else if(tgt){
    boy.dir=dirOf(tgt.x-boy.x,tgt.y-boy.y);
    if(boy.cd<=0){boy.atk=0;boy.hitDone=false;boy.swingDur=Math.min(.42,stats.fireCd*.85);boy.cd=stats.fireCd;sfx('swing');}
  }

  // zombies
  for(const z of zombies){
    if(z.dead){z.dt+=dt;continue;}
    z.flash=Math.max(0,z.flash-dt);z.rt-=dt;
    let tx,ty,moving=true,spd=z.spd;
    {
      const db=Math.hypot(boy.x-z.x,boy.y-z.y);
      const hd=houseDist(z.x,z.y);
      // pick target: the boy when he's near, otherwise the closest point of the house
      const onBoy=db<190&&db<hd.d+60;
      tx=onBoy?boy.x:hd.cx;ty=onBoy?boy.y:hd.cy;
      const dist=onBoy?db:hd.d;
      // enter attack when in reach; leave it as soon as the target steps out (small buffer stops flicker)
      const reach=onBoy?z.r+14:z.r+4, leave=reach+8;
      if(z.atkOn!==(onBoy?'boy':'house'))z.atkOn=null;
      if(!z.atkOn&&dist<reach){z.atkOn=onBoy?'boy':'house';z.atkT=0;z.struck=false;}
      else if(z.atkOn&&dist>leave){z.atkOn=null;}
      if(z.atkOn){moving=false;
        z.atkT+=dt/ZATK_DUR;
        if(!z.struck&&z.atkT>=.5){z.struck=true; // claws land on frame 4
          if(z.atkOn==='boy'){boy.hp-=z.dps*1.6*ZATK_DUR;boy.hurt=.35;sfx('hurt');}
          else{house.hp-=z.dps*.7*ZATK_DUR;house.hurt=.3;sfx('hit');}}
        if(z.atkT>=1){z.atkT=0;z.struck=false;}
      }
    }
    if(moving){const dx=tx-z.x,dy=ty-z.y,d=Math.hypot(dx,dy);if(d>1){z.x+=dx/d*spd*dt;z.y+=dy/d*spd*dt;z.dir=dirOf(dx,dy);}z.anim+=dt*spd/4.2;}
    else{z.anim+=dt*3;const dx=tx-z.x,dy=ty-z.y;z.dir=dirOf(dx,dy);}
    if(z.kb>0){z.kb-=dt;}
  }
  // separation
  const live=zombies.filter(z=>!z.dead);
  for(let i=0;i<live.length;i++){const a=live[i];for(let j=i+1;j<live.length;j++){const b=live[j];const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,m=a.r+b.r;if(d<m*m&&d>.01){const dd=Math.sqrt(d),o=(m-dd)/2;a.x-=dx/dd*o;a.y-=dy/dd*o;b.x+=dx/dd*o;b.y+=dy/dd*o;}}
    const dx=a.x-boy.x,dy=a.y-boy.y,d=Math.hypot(dx,dy),m=a.r+11;if(d<m&&d>.01){a.x+=dx/d*(m-d)*.7;a.y+=dy/d*(m-d)*.7;boy.x-=dx/d*(m-d)*.3;boy.y-=dy/d*(m-d)*.3;}
  }
  // house collision + keep the boy on screen
  for(const z of live)pushOutHouse(z,z.r);
  boy.x=Math.max(16,Math.min(W-16,boy.x));boy.y=Math.max(110,Math.min(H-10,boy.y));
  pushOutHouse(boy,12);

  // death cleanup
  zombies=zombies.filter(z=>!(z.dead&&z.dt>.6));
  for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=220*dt;p.life-=dt;}parts=parts.filter(p=>p.life>0);
  for(const a of arcs)a.life-=dt;arcs=arcs.filter(a=>a.life>0);
  for(const p of popups){p.life-=dt;p.y-=30*dt;}popups=popups.filter(p=>p.life>0);
  house.hurt=Math.max(0,house.hurt-dt);
  shake=Math.max(0,shake-dt);

  if(house.hp<=0){house.hp=0;gameOver('The dead got inside the house.');return;}
  if(boy.hp<=0){boy.hp=0;gameOver('They caught you in the yard.');return;}
  if(toSpawn<=0&&live.length===0&&waveT>2)waveClear();
}
const FACE=[[0,-1],[1,0],[0,1],[-1,0]];
function axeHit(){
  const [fx,fy]=FACE[boy.dir];const cosA=Math.cos(stats.arc/2);let n=0;
  for(const z of zombies){if(z.dead)continue;const dx=z.x-boy.x,dy=z.y-boy.y,d=Math.hypot(dx,dy);
    if(d>stats.reach+z.r)continue;if(d>18&&(dx*fx+dy*fy)/d<cosA)continue;
    damageZ(z,stats.dmg,dx,dy,false);n++;}
  if(n){sfx('chop');shake=Math.min(.18,.08+n*.03);}
}
function damageZ(z,dmg,vx,vy,zap){
  z.hp-=dmg;z.flash=.12;
  const l=Math.hypot(vx,vy)||1;if(!zap){const k=z.kind==='brute'?stats.kb*.3:stats.kb;z.x+=vx/l*k;z.y+=vy/l*k;}
  burst(z.x,z.y-26,'#8fb34a',zap?2:5,90);sfx('hit');
  popup(z.x+rnd(-8,8),z.y-60*z.sc/.62,String(dmg),zap?'#7fe9ff':'#efe4c8');
  if(z.hp<=0&&!z.dead){z.dead=true;z.dt=0;kills++;splat(z.x,z.y,z.kind==='brute');sfx('die');burst(z.x,z.y-20,'#6f8f39',12,140);}
}

/* ---------- draw ---------- */
function drawSprite(img,dir,fr,x,y,sc,alpha){if(alpha!==undefined)ctx.globalAlpha=alpha;ctx.drawImage(img,fr*FW,dir*FH,FW,FH,x-FW/2*sc,y-FOOT*sc,FW*sc,FH*sc);ctx.globalAlpha=1;}
function shadow(x,y,w){ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(x,y,w,w*.38,0,0,7);ctx.fill();}
function drawFence(t){
  ctx.lineCap='round';
  for(const s of segs){
    const r=s.hp/s.max;
    if(s.broken){
      // dangling stubs
      ctx.strokeStyle='rgba(120,120,110,.8)';ctx.lineWidth=1.3;
      for(const h of [6,13,20]){const dx=(s.b.x-s.a.x)*.22,dy=(s.b.y-s.a.y)*.22;
        ctx.beginPath();ctx.moveTo(s.a.x,s.a.y-h);ctx.lineTo(s.a.x+dx,s.a.y+dy-h+6);ctx.stroke();
        ctx.beginPath();ctx.moveTo(s.b.x,s.b.y-h);ctx.lineTo(s.b.x-dx,s.b.y-dy-h+6);ctx.stroke();}
      if(Math.random()<.08)burst(s.a.x,s.a.y-14,'#ffe9a0',2,60);
      continue;
    }
    const flick=.75+.25*Math.sin(t*20+s.mx*.3)+(Math.random()<.02?-.5:0);
    const col=s.hitT>0?'255,140,90':r<.35?'240,164,58':'127,233,255';
    for(const h of [6,13,20]){
      ctx.strokeStyle=`rgba(${col},${.16*flick})`;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(s.a.x,s.a.y-h);ctx.lineTo(s.b.x,s.b.y-h);ctx.stroke();
      ctx.strokeStyle=`rgba(${col},${(.45+.5*r)*flick})`;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(s.a.x,s.a.y-h);ctx.lineTo(s.b.x,s.b.y-h);ctx.stroke();
    }
    if(r<1){ // damage pips
      ctx.fillStyle='rgba(0,0,0,.55)';const bw=22;ctx.fillRect(s.mx-bw/2,s.my-30,bw,3);ctx.fillStyle=r<.35?'#f0a43a':'#7fe9ff';ctx.fillRect(s.mx-bw/2,s.my-30,bw*r,3);
    }
  }
  // posts
  const posts=new Set();for(const s of segs){posts.add(s.a.x+','+s.a.y);}
  for(const k of posts){const [x,y]=k.split(',').map(Number);
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(x+2,y+1,5,2,0,0,7);ctx.fill();
    ctx.fillStyle='#2a2a26';ctx.fillRect(x-2.5,y-24,5,24);ctx.fillStyle='#55554c';ctx.fillRect(x-2.5,y-24,2,24);
    ctx.fillStyle='#c8b98a';for(const h of [6,13,20]){ctx.fillRect(x-3,y-h-1,6,2);}
    ctx.fillStyle='#3a3a33';ctx.fillRect(x-3.5,y-26,7,3);
  }
}
function drawArc(a){
  const n=7;const pts=[];for(let i=0;i<=n;i++){const t=i/n;pts.push([a.x1+(a.x2-a.x1)*t+(i&&i<n?rnd(-7,7):0),a.y1+(a.y2-a.y1)*t+(i&&i<n?rnd(-7,7):0)]);}
  ctx.lineJoin='round';
  ctx.strokeStyle='rgba(127,233,255,.35)';ctx.lineWidth=6;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
  ctx.strokeStyle='#f2fdff';ctx.lineWidth=1.6;ctx.stroke();
}
let tNow=0;
function draw(){
  const shx=shake>0?rnd(-3,3)*shake/.18:0,shy=shake>0?rnd(-3,3)*shake/.18:0;
  ctx.setTransform(S*DPR,0,0,S*DPR,shx*S*DPR,shy*S*DPR);
  ctx.drawImage(ground,0,0,W,H);ctx.drawImage(decals,0,0,W,H);
  // house floor layer (stone pad + building) sits under everything
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(HX0+3,HY0+5,HW,HH);
  const hj=house.hurt>0?rnd(-1.5,1.5):0;
  ctx.drawImage(IMG.house,HX0+hj,HY0,HW,HH);
  // y-sorted entities; the building silhouette is redrawn so it hides anything behind the roof
  const list=[];
  list.push({y:HSORT,f:()=>{
    ctx.save();ctx.beginPath();HPOLY.forEach((p,i)=>i?ctx.lineTo(p[0]+hj,p[1]):ctx.moveTo(p[0]+hj,p[1]));ctx.closePath();ctx.clip();
    ctx.drawImage(IMG.house,HX0+hj,HY0,HW,HH);ctx.restore();
  }});
  if(state!=='load')list.push({y:boy.y,f:()=>{
    shadow(boy.x,boy.y,15);
    let sh,fr;
    if(boy.atk>=0){sh='atk';fr=Math.min(7,Math.floor(boy.atk*8));}
    else if(boy.moving){sh='walk';fr=Math.floor(boy.anim)%8;}
    else{sh='idle';fr=Math.floor(boy.idle)%8;}
    const hurt=boy.hurt>0&&Math.floor(tNow*30)%2;
    const img=IMG[sh+(hurt?'R':'')];const BS=112,BF=104,sc=.82;
    ctx.drawImage(img,fr*BS,boy.dir*BS,BS,BS,boy.x-BS/2*sc,boy.y-BF*sc,BS*sc,BS*sc);
    if(boy.repairing){ctx.strokeStyle='#ffd77a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(boy.x,boy.y-96,7,-1.57,-1.57+6.28*(boy.repairing.hp/boy.repairing.max));ctx.stroke();ctx.fillStyle='#ffd77a';ctx.font='700 11px "Barlow Condensed",sans-serif';ctx.textAlign='center';ctx.fillText('FIX',boy.x,boy.y-106);}
  }});
  for(const z of zombies)list.push({y:z.y,f:()=>{
    const a=z.dead?Math.max(0,1-z.dt/.6):1;
    shadow(z.x,z.y,z.r+2);
    const sx=0;
    const img=z.flash>0?IMG.zWhite:IMG.zom;
    if(z.dead){ctx.save();ctx.translate(z.x,z.y);ctx.rotate(Math.min(1,z.dt*3)*(z.dir===3?-1.3:1.3));ctx.translate(-z.x,-z.y);}
    if(z.atkOn&&!z.dead){const ai=z.flash>0?IMG.zAtkW:IMG.zAtk,BS=112,BF=105,sc=.81,fr=Math.min(7,Math.floor(z.atkT*8));
      ctx.drawImage(ai,fr*BS,z.dir*BS,BS,BS,z.x-BS/2*sc,z.y-BF*sc,BS*sc,BS*sc);}
    else drawSprite(img,z.dir,Math.floor(z.anim)%8,z.x+sx,z.y,z.sc,a);
    if(z.dead)ctx.restore();
    if(!z.dead&&z.hp<z.max&&z.kind==='brute'){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(z.x-18,z.y-108,36,4);ctx.fillStyle='#d4553f';ctx.fillRect(z.x-18,z.y-108,36*z.hp/z.max,4);}
  }});
  list.sort((a,b)=>a.y-b.y).forEach(e=>e.f());
  // projectiles
  for(const p of shots){ctx.strokeStyle='rgba(239,228,200,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.025,p.y-p.vy*.025);ctx.stroke();ctx.fillStyle='#e9d9a6';ctx.beginPath();ctx.arc(p.x,p.y,3,0,7);ctx.fill();}
  arcs.forEach(drawArc);
  for(const p of parts){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}ctx.globalAlpha=1;
  // lantern glow + night vignette
  ctx.globalCompositeOperation='lighter';
  let gl=ctx.createRadialGradient(LANTERN[0],LANTERN[1],2,LANTERN[0],LANTERN[1],90+Math.sin(tNow*7)*3);gl.addColorStop(0,'rgba(255,190,90,.28)');gl.addColorStop(1,'rgba(255,160,60,0)');ctx.fillStyle=gl;ctx.fillRect(LANTERN[0]-100,LANTERN[1]-100,200,200);
  ctx.globalCompositeOperation='source-over';
  const vg=ctx.createRadialGradient(270,500,260,270,500,640);vg.addColorStop(0,'rgba(8,10,6,0)');vg.addColorStop(1,'rgba(8,10,6,.7)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  // popups
  ctx.textAlign='center';
  for(const p of popups){ctx.globalAlpha=Math.min(1,p.life*2);ctx.font='700 '+(p.t.length>3?16:15)+'px "Barlow Condensed",sans-serif';ctx.fillStyle='#000';ctx.fillText(p.t,p.x+1,p.y+1);ctx.fillStyle=p.c;ctx.fillText(p.t,p.x,p.y);}ctx.globalAlpha=1;
  // offscreen threat arrows for broken sections
  // joystick
  if(joy&&state==='play'){const dx=joy.x-joy.ox,dy=joy.y-joy.oy,d=Math.hypot(dx,dy),m=Math.min(48,d);
    ctx.strokeStyle='rgba(239,228,200,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(joy.ox,joy.oy,48,0,7);ctx.stroke();
    ctx.fillStyle='rgba(239,228,200,.35)';ctx.beginPath();ctx.arc(joy.ox+(d?dx/d*m:0),joy.oy+(d?dy/d*m:0),20,0,7);ctx.fill();}
  // low house hp red edge
  if(house.hurt>0){ctx.strokeStyle='rgba(212,85,63,.5)';ctx.lineWidth=10;ctx.strokeRect(5,5,W-10,H-10);}
}

/* ---------- HUD ---------- */
const $=id=>document.getElementById(id);
function setBar(id,v,max,alert){const el=$(id);el.querySelector('.fill').style.width=Math.max(0,v/max*100)+'%';el.lastElementChild.textContent=Math.ceil(Math.max(0,v/max*100));el.classList.toggle('alert',!!alert);}
function hud(){
  $('hWave').textContent=wave;
  setBar('hpHouse',house.hp,house.max,house.hurt>0);
  setBar('hpBoy',boy.hp,boy.max,boy.hurt>0);
}
let bannerT=null;
function banner(t,sub){const b=$('banner');b.innerHTML=t+(sub?`<small>${sub}</small>`:'');b.style.opacity=1;clearTimeout(bannerT);bannerT=setTimeout(()=>b.style.opacity=0,1700);}

/* ---------- upgrades ---------- */
const UPS=[
  {id:'rate',g:'»',n:'Quick Swing',d:'Swing the axe 18% faster.',a:()=>stats.fireCd*=.82,max:4},
  {id:'dmg',g:'+1',n:'Sharpened Edge',d:'+1 axe damage.',a:()=>stats.dmg+=1},
  {id:'arc',g:'◠',n:'Wide Arc',d:'Swings cover a wider angle.',a:()=>stats.arc=Math.min(6.3,stats.arc+.9),max:3},
  {id:'kb',g:'→',n:'Heavy Head',d:'Hits knock zombies back further.',a:()=>stats.kb+=8,max:3},
  {id:'reach',g:'◎',n:'Long Handle',d:'+15% axe reach.',a:()=>stats.reach*=1.15,max:3},
  {id:'boards',g:'⌂',n:'Board Up',d:'Restore 40% of the house.',a:()=>house.hp=Math.min(house.max,house.hp+house.max*.4)},
  {id:'shoes',g:'≫',n:'Sneakers',d:'Move 15% faster.',a:()=>stats.speed*=1.15,max:3},
];
function waveClear(){
  state='inter';joy=null;
  if(wave>best){best=wave;try{localStorage.setItem('htf_best',best);}catch(e){}}
  const pool=UPS.filter(u=>!u.max||(upLv[u.id]||0)<u.max).sort(()=>Math.random()-.5).slice(0,3);
  $('upWave').textContent=wave;
  const c=$('cards');c.innerHTML='';
  pool.forEach(u=>{const b=document.createElement('button');b.className='card';b.id='up_'+u.id;
    b.innerHTML=`<span class="g">${u.g}</span><span><h3>${u.n} ${upLv[u.id]?`<small>Lv ${upLv[u.id]+1}</small>`:''}</h3><p>${u.d}</p></span>`;
    b.onclick=()=>{u.a();upLv[u.id]=(upLv[u.id]||0)+1;
      boy.hp=boy.max;$('oUp').hidden=true;waveT=0;startWave();};
    c.appendChild(b);});
  setTimeout(()=>{if(state==='inter')$('oUp').hidden=false;},700);
  banner('Cleared');
}
function gameOver(why){
  state='over';joy=null;
  const survived=wave-1;if(survived>best){best=survived;try{localStorage.setItem('htf_best',best);}catch(e){}}
  $('overWhy').textContent=why;$('oWave').textContent=survived;$('oKills').textContent=kills;$('oBest').textContent='Best: '+best+' waves';
  setTimeout(()=>{$('oOver').hidden=false;},900);
}
function togglePause(){
  if(state==='play'){state='paused';$('oPause').hidden=false;}
  else if(state==='paused'){state='play';$('oPause').hidden=true;}
}
function begin(){audio();reset();['oStart','oOver','oPause','oUp'].forEach(i=>$(i).hidden=true);$('hud').hidden=false;waveT=0;startWave();}
$('bStart').onclick=begin;$('bAgain').onclick=begin;
$('bPause').onclick=togglePause;$('bResume').onclick=togglePause;
$('bQuit').onclick=()=>{state='menu';$('oPause').hidden=true;reset();showMenu();};
$('bMute').onclick=()=>{audio();muted=!muted;$('bMute').style.opacity=muted?.45:1;};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play')togglePause();});
function showMenu(){$('oStart').hidden=false;$('hud').hidden=true;$('best').textContent=best?`Best: ${best} waves`:'';}

/* ---------- loop ---------- */
let last=performance.now();
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;tNow+=dt;
  update(dt);
  if(state==='menu'){ // idle attract: boy breathes in front of door
    boy.dir=2;
  }
  draw();if(state!=='load'&&state!=='menu')hud();
  requestAnimationFrame(loop);
}
(async()=>{
  resize();
  const A='assets/sprites/';
  const [bi,bw,ba,z,h,za]=await Promise.all(['boy_idle_axe','boy_walk_axe','boy_attack_axe','zombie_walk','house','zombie_attack'].map(n=>loadImg(A+n+'.png')));
  $('hero').src=A+'boy_portrait.png';
  IMG={idle:bi,walk:bw,atk:ba,idleR:tinted(bi,'rgba(255,60,40,.45)'),walkR:tinted(bw,'rgba(255,60,40,.45)'),atkR:tinted(ba,'rgba(255,60,40,.45)'),zom:z,house:h,
    zWhite:tinted(z,'rgba(255,255,255,.85)'),zAtk:za,zAtkW:tinted(za,'rgba(255,255,255,.85)'),
};
  try{await document.fonts.load('700 16px "Barlow Condensed"');}catch(e){}
  reset();state='menu';$('loading').hidden=true;showMenu();
  requestAnimationFrame(loop);
})();
})();
