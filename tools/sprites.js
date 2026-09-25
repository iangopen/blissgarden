// =====================================================================
// Bliss Garden sprite generator
// 64×64 native, 23 crops × 3 stages + 5 items × 3 states = 28 rows
// =====================================================================

const PAL = {
  soil:'#9b7653', soilDk:'#6b4e35', soilLt:'#c4a07a',
  leaf:'#5bbf3a', leafDk:'#3a8020', leafLt:'#90e060',
  shadow:'rgba(0,0,0,0.25)', highlight:'rgba(255,255,255,0.5)',

  // potato
  potatoBody:'#d4a855', potatoDk:'#8a6020', potatoLt:'#f0d090', potatoSpot:'#7a5018',
  // carrot
  carrotBody:'#ff7020', carrotDk:'#c04010', carrotLt:'#ffb060',
  // wheat
  wheatBody:'#f0c840', wheatDk:'#a07808', wheatLt:'#fff4a0',
  // sunflower
  sunPetal:'#ffd020', sunPetalDk:'#c09000', sunCenter:'#6a3010', sunStem:'#3a9020',
  // pumpkin
  pumpBody:'#f07020', pumpDk:'#b04010', pumpLt:'#ffa060', pumpStem:'#3a8020',
  // chard
  chardLeaf:'#2ab040', chardDk:'#1a7030', chardLt:'#70e080',
  chardRed:'#e83030', chardYel:'#f0d020', chardPurp:'#9040c0', chardStem:'#f4edd8',
  // moonbloom
  moonPetal:'#b0ccf0', moonPetalDk:'#6080b0', moonCenter:'#fffce8', moonGlow:'#deeeff', moonStem:'#506880',
  // starfruit
  starBody:'#f8e020', starDk:'#b08800', starLt:'#fffca0', starShine:'#ffffff',
  // thornvine
  thornBody:'#2a7020', thornDk:'#184010', thornLt:'#60c040', thornSpike:'#c03030', thornBloom:'#8020a0',
  // glowshroom
  glowCap:'#7030b0', glowCapDk:'#400870', glowDot:'#f8e040', glowStem:'#e8dcc0', glowStemDk:'#a09060', glowRim:'#c080ff',
  // voidbloom
  voidPetal:'#4a1870', voidPetalDk:'#200840', voidGlow:'#c060ff', voidCenter:'#ff80ff',
  // aetherfern
  aetherLeaf:'#20c0a0', aetherDk:'#108060', aetherLt:'#80ffe0', aetherShim:'#c0fff0',
  // solarspike
  solarBody:'#ffa020', solarDk:'#c05808', solarYel:'#ffe040', solarCore:'#ffffff',
  // netherfruit
  netherBody:'#2a0808', netherSkin:'#5a1010', netherGlow:'#ff4400', netherCrack:'#ff8030', netherPurp:'#600040',
  // duskpetal
  duskPetal:'#e060a0', duskPetalDk:'#a02060', duskTip:'#601040', duskLt:'#f8b0d8',
  // ashbloom
  ashPetal:'#b8b8c0', ashPetalDk:'#707078', ashCenter:'#ff8020', ashEmber:'#ff6000', ashWhite:'#f0f0f0',
  // voidcoral
  coralBody:'#0820a0', coralDk:'#040860', coralTip:'#00e0ff', coralMid:'#0060d0',
  // eclipseLotus
  lotusBody:'#080810', lotusPetal:'#181830', lotusRim:'#ffe060', lotusCenter:'#a040f0',
  // stardustFern
  sdLeaf:'#c8d8e8', sdDk:'#8090a8', sdLt:'#f0f8ff', sdSpark:'#ffffff',
  // celestialPod
  celBody:'#1a2870', celDk:'#0a1040', celLt:'#3050c0', celDot:'#a0c0ff',
  // auricBloom
  auricPetal:'#e8a000', auricDk:'#a06000', auricLt:'#f8d040', auricInner:'#fff0a0',
  // prismaticRoot
  prismBody:'#4a2c10', prismDk:'#2a1808', prismLt:'#7a5030',
  // genesisSeed
  genCore:'#ffffff', genGold:'#ffe040', genOrange:'#ff8000', genPink:'#ff4080', genViolet:'#8000ff',
  // items
  canBlue:'#3080e0', canBlueDk:'#1050a0', canBlueLt:'#80c0ff', canRust:'#c06030',
  cageGray:'#c0c8d0', cageDk:'#808890', cageLt:'#e8eef4',
  fertBrown:'#8a5a28', fertDk:'#5a3010', fertLeafG:'#30b040',
  fertGrnBag:'#207840', fertGrnLeaf:'#50d060',
  scarHat:'#4a2808', scarShirt:'#d04020', scarStraw:'#e0c050',
};

// ---------- Draw helpers ----------
function px(ctx, x, y, c) { ctx.fillStyle=c; ctx.fillRect(x|0,y|0,1,1); }
function rect(ctx, x, y, w, h, c) { ctx.fillStyle=c; ctx.fillRect(x|0,y|0,w|0,h|0); }
function circle(ctx, cx, cy, r, c) {
  ctx.fillStyle=c;
  for (let dy=-r; dy<=r; dy++) for (let dx=-r; dx<=r; dx++)
    if (dx*dx+dy*dy <= r*r+r*0.4) ctx.fillRect((cx+dx)|0,(cy+dy)|0,1,1);
}
function ellipse(ctx, cx, cy, rx, ry, c) {
  ctx.fillStyle=c;
  for (let dy=-ry; dy<=ry; dy++) for (let dx=-rx; dx<=rx; dx++)
    if ((dx*dx)/(rx*rx)+(dy*dy)/(ry*ry) <= 1) ctx.fillRect((cx+dx)|0,(cy+dy)|0,1,1);
}
function ring(ctx, cx, cy, r, c, t=1) {
  ctx.fillStyle=c;
  for (let dy=-r; dy<=r; dy++) for (let dx=-r; dx<=r; dx++) {
    const d2=dx*dx+dy*dy;
    if (d2<=r*r+r*0.4 && d2>=(r-t)*(r-t)) ctx.fillRect((cx+dx)|0,(cy+dy)|0,1,1);
  }
}
function line(ctx, x0, y0, x1, y1, c) {
  ctx.fillStyle=c;
  let dx=Math.abs(x1-x0), dy=Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1, err=dx-dy;
  for (;;) {
    ctx.fillRect(x0|0,y0|0,1,1);
    if (x0===x1&&y0===y1) break;
    const e2=2*err;
    if (e2>-dy){err-=dy;x0+=sx;}
    if (e2< dx){err+=dx;y0+=sy;}
  }
}
function thickLine(ctx, x0, y0, x1, y1, c, t=2) {
  ctx.fillStyle=c;
  const dx=x1-x0, dy=y1-y0, len=Math.max(Math.abs(dx),Math.abs(dy))||1;
  for (let i=0; i<=len; i++) {
    const x=x0+dx*i/len, y=y0+dy*i/len;
    for (let oy=0; oy<t; oy++) for (let ox=0; ox<t; ox++)
      ctx.fillRect((x+ox-(t>>1))|0,(y+oy-(t>>1))|0,1,1);
  }
}
function parseColor(c) {
  if (c[0]==='#') { const h=c.slice(1); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
  return [0,0,0];
}
function autoOutlineTonal(ctx, w, h) {
  const img=ctx.getImageData(0,0,w,h), d=img.data, orig=new Uint8ClampedArray(d);
  const a=(x,y)=>(x<0||y<0||x>=w||y>=h)?0:orig[(y*w+x)*4+3];
  const col=(x,y)=>{const i=(y*w+x)*4;return[orig[i],orig[i+1],orig[i+2]];};
  for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
    if (a(x,y)===0) {
      let nc=null;
      if (a(x-1,y)>0) nc=col(x-1,y); else if (a(x+1,y)>0) nc=col(x+1,y);
      else if (a(x,y-1)>0) nc=col(x,y-1); else if (a(x,y+1)>0) nc=col(x,y+1);
      if (nc) { const i=(y*w+x)*4; d[i]=nc[0]*0.3|0; d[i+1]=nc[1]*0.3|0; d[i+2]=nc[2]*0.3|0; d[i+3]=255; }
    }
  }
  ctx.putImageData(img,0,0);
}

// ---------- Shared stage templates ----------
function drawSeed(ctx, rx, ry, body, dark, lite, mark) {
  const cx=32, cy=36;
  ellipse(ctx,cx,cy+9,13,3,PAL.shadow);
  ellipse(ctx,cx,cy,rx,ry,dark);
  ellipse(ctx,cx-1,cy-1,rx-1,ry-1,body);
  if (lite) ellipse(ctx,cx-rx*0.4,cy-ry*0.45,Math.max(2,rx*0.35|0),Math.max(2,ry*0.3|0),lite);
  if (mark==='split') line(ctx,cx,cy-ry+2,cx,cy+ry-2,dark);
  if (mark==='spot') { px(ctx,cx+2,cy+1,dark); px(ctx,cx-3,cy-2,dark); }
}
function drawSprout(ctx, stemC, leafC, leafLt, h=18, ls=6) {
  ellipse(ctx,32,50,14,4,PAL.soilDk); ellipse(ctx,32,49,13,3,PAL.soil);
  rect(ctx,31,50-h,2,h,stemC||PAL.leafDk);
  const ly=50-h+1;
  ellipse(ctx,32-ls,ly,ls,Math.max(3,ls-2),leafC||PAL.leaf);
  ellipse(ctx,32+ls,ly,ls,Math.max(3,ls-2),leafC||PAL.leaf);
  ellipse(ctx,32-ls-1,ly-1,Math.max(2,(ls-2)|0),2,leafLt||PAL.leafLt);
  ellipse(ctx,32+ls-1,ly-1,Math.max(2,(ls-2)|0),2,leafLt||PAL.leafLt);
  px(ctx,32,ly-1,leafLt||PAL.leafLt);
}
function drawSoilMound(ctx) {
  ellipse(ctx,32,55,17,4,PAL.soilDk); ellipse(ctx,32,54,16,3,PAL.soil);
}

// =====================================================================
// CROPS 0–12 (existing, fully redrawn)
// =====================================================================
const CROPS = {

  // 0 POTATO
  potato: {
    seed: ctx => drawSeed(ctx,10,13,PAL.potatoBody,PAL.potatoDk,PAL.potatoLt,'spot'),
    sprout: ctx => drawSprout(ctx,PAL.leafDk,PAL.leaf,PAL.leafLt,16,6),
    grown: ctx => {
      drawSoilMound(ctx);
      // potato peeking out left
      ellipse(ctx,24,52,9,6,PAL.potatoDk); ellipse(ctx,23,51,8,5,PAL.potatoBody);
      ellipse(ctx,21,50,3,2,PAL.potatoLt);
      px(ctx,26,51,PAL.potatoSpot); px(ctx,22,53,PAL.potatoSpot); px(ctx,28,49,PAL.potatoSpot);
      // foliage
      ellipse(ctx,32,26,14,13,PAL.leafDk);
      ellipse(ctx,27,24,8,7,PAL.leaf); ellipse(ctx,37,26,8,7,PAL.leaf); ellipse(ctx,32,20,7,6,PAL.leaf);
      ellipse(ctx,26,22,3,2,PAL.leafLt); ellipse(ctx,37,23,3,2,PAL.leafLt); ellipse(ctx,32,18,3,2,PAL.leafLt);
      px(ctx,26,19,'#fffae8'); px(ctx,38,21,'#fffae8');
    },
  },

  // 1 CARROT
  carrot: {
    seed: ctx => drawSeed(ctx,7,11,'#ffe090','#c07020','#fff4c0','split'),
    sprout: ctx => drawSprout(ctx,PAL.leafDk,PAL.leaf,PAL.leafLt,20,5),
    grown: ctx => {
      drawSoilMound(ctx);
      // feathery tops
      for (let i=-10; i<=10; i+=3) thickLine(ctx,32,29,32+i,14+Math.abs(i)*0.4,'#3a9020',1);
      ellipse(ctx,29,21,5,4,PAL.leaf); ellipse(ctx,36,22,5,3,PAL.leaf); ellipse(ctx,32,16,4,3,PAL.leafLt);
      // carrot body
      ctx.fillStyle=PAL.carrotDk;
      for (let y=30; y<57; y++) { const w=Math.max(1,((57-y)*0.58)|0); ctx.fillRect(32-w,y,w*2,1); }
      ctx.fillStyle=PAL.carrotBody;
      for (let y=31; y<55; y++) { const w=Math.max(0,((55-y)*0.52)|0); ctx.fillRect(32-w,y,w*2,1); }
      ctx.fillStyle=PAL.carrotLt;
      for (let y=32; y<48; y++) { const w=Math.max(0,((48-y)*0.25)|0); ctx.fillRect(31-w,y,w*2,1); }
      for (let y=34; y<53; y+=3) rect(ctx,31,y,1,1,PAL.carrotDk);
    },
  },

  // 2 WHEAT
  wheat: {
    seed: ctx => {
      ellipse(ctx,32,38,4,9,PAL.wheatDk); ellipse(ctx,32,37,3,8,PAL.wheatBody); ellipse(ctx,31,34,1,3,PAL.wheatLt);
      line(ctx,32,28,32,24,PAL.wheatDk); ellipse(ctx,32,49,7,2,PAL.shadow);
    },
    sprout: ctx => {
      ellipse(ctx,32,50,14,4,PAL.soilDk); ellipse(ctx,32,49,13,3,PAL.soil);
      thickLine(ctx,32,48,30,28,PAL.leaf,1); thickLine(ctx,32,48,34,26,PAL.leaf,1);
      thickLine(ctx,32,48,32,24,PAL.leafLt,1);
    },
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,29,54,26,20,PAL.wheatDk,1); thickLine(ctx,32,54,32,14,PAL.wheatDk,1); thickLine(ctx,35,54,38,20,PAL.wheatDk,1);
      const head=(cx,cy)=>{
        ellipse(ctx,cx,cy,3,8,PAL.wheatDk); ellipse(ctx,cx,cy,2,7,PAL.wheatBody);
        for (let dy=-6; dy<=6; dy+=2) { px(ctx,cx-2,cy+dy,PAL.wheatLt); px(ctx,cx+2,cy+dy,PAL.wheatLt); }
        line(ctx,cx,cy-9,cx,cy-12,PAL.wheatDk);
        line(ctx,cx-1,cy-8,cx-3,cy-11,PAL.wheatDk); line(ctx,cx+1,cy-8,cx+3,cy-11,PAL.wheatDk);
        px(ctx,cx,cy-7,PAL.wheatLt);
      };
      head(26,26); head(32,20); head(38,26);
    },
  },

  // 3 SUNFLOWER
  sunflower: {
    seed: ctx => {
      ellipse(ctx,32,38,7,11,'#2a1c10'); ellipse(ctx,32,38,6,10,'#4a3020');
      for (let y=30; y<=46; y+=2) px(ctx,32,y,'#140a04');
      for (let y=31; y<=45; y+=2) px(ctx,30,y,'#140a04');
      for (let y=31; y<=45; y+=2) px(ctx,34,y,'#140a04');
      px(ctx,30,32,'#a08060'); ellipse(ctx,32,50,9,2,PAL.shadow);
    },
    sprout: ctx => drawSprout(ctx,PAL.leafDk,PAL.leaf,PAL.leafLt,22,7),
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,32,54,32,28,PAL.sunStem,2);
      ellipse(ctx,26,42,5,3,PAL.leaf); ellipse(ctx,38,38,5,3,PAL.leaf);
      px(ctx,24,41,PAL.leafLt); px(ctx,40,37,PAL.leafLt);
      const cx=32,cy=20,np=12;
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2; ellipse(ctx,cx+Math.cos(a)*12,cy+Math.sin(a)*12,5,3,PAL.sunPetalDk);}
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2+Math.PI/np; ellipse(ctx,cx+Math.cos(a)*10,cy+Math.sin(a)*10,4,2,PAL.sunPetal);}
      circle(ctx,cx,cy,7,PAL.sunCenter);
      for (let dy=-4;dy<=4;dy++) for (let dx=-4;dx<=4;dx++) if (dx*dx+dy*dy<=20&&(dx+dy)%2===0) px(ctx,cx+dx,cy+dy,'#8a5028');
      px(ctx,cx-1,cy-1,'#c08040');
    },
  },

  // 4 PUMPKIN
  pumpkin: {
    seed: ctx => {
      ellipse(ctx,32,38,8,11,'#c0a868'); ellipse(ctx,32,39,7,10,'#e8d898'); ellipse(ctx,32,36,4,5,'#fff8d8');
      px(ctx,32,28,'#a09060'); px(ctx,32,27,'#a09060'); ellipse(ctx,32,50,9,2,PAL.shadow);
    },
    sprout: ctx => drawSprout(ctx,PAL.leafDk,PAL.leaf,PAL.leafLt,18,8),
    grown: ctx => {
      drawSoilMound(ctx);
      ellipse(ctx,32,40,20,16,PAL.pumpDk); ellipse(ctx,32,40,19,15,PAL.pumpBody);
      for (let dx=-12; dx<=12; dx+=6) ellipse(ctx,32+dx,40,3,13,PAL.pumpDk);
      ellipse(ctx,24,35,4,5,PAL.pumpLt);
      rect(ctx,30,23,4,6,PAL.pumpStem); rect(ctx,29,25,6,2,PAL.pumpStem);
      px(ctx,36,23,PAL.leaf); px(ctx,37,22,PAL.leaf); px(ctx,38,23,PAL.leaf); px(ctx,39,22,PAL.leafLt);
      ellipse(ctx,24,26,5,3,PAL.leaf); px(ctx,22,25,PAL.leafLt);
    },
  },

  // 5 CHARD
  chard: {
    seed: ctx => {
      ellipse(ctx,32,38,8,8,'#5a3a20'); ellipse(ctx,32,38,7,7,'#7a5a38');
      circle(ctx,29,36,2,'#c09060'); circle(ctx,35,37,2,'#c09060'); circle(ctx,32,41,2,'#c09060');
      px(ctx,29,35,'#e8c890'); ellipse(ctx,32,48,8,2,PAL.shadow);
    },
    sprout: ctx => drawSprout(ctx,PAL.chardRed,PAL.leaf,PAL.leafLt,18,6),
    grown: ctx => {
      drawSoilMound(ctx);
      const stems=[{x:28,c:PAL.chardRed},{x:31,c:PAL.chardYel},{x:34,c:PAL.chardPurp},{x:37,c:PAL.chardRed}];
      stems.forEach(s=>thickLine(ctx,s.x,53,s.x,28,s.c,2));
      ellipse(ctx,25,26,9,7,PAL.chardDk); ellipse(ctx,25,25,8,6,PAL.chardLeaf); ellipse(ctx,24,24,4,2,PAL.chardLt);
      ellipse(ctx,39,28,9,7,PAL.chardDk); ellipse(ctx,39,27,8,6,PAL.chardLeaf); ellipse(ctx,40,26,4,2,PAL.chardLt);
      ellipse(ctx,32,20,9,7,PAL.chardDk); ellipse(ctx,32,19,8,6,PAL.chardLeaf); ellipse(ctx,32,18,3,2,PAL.chardLt);
      // midribs
      thickLine(ctx,25,26,28,53,PAL.chardStem,1); thickLine(ctx,39,28,34,53,PAL.chardStem,1);
    },
  },

  // 6 MOONBLOOM
  moonbloom: {
    seed: ctx => {
      ellipse(ctx,32,38,10,10,'#1e1a30'); ellipse(ctx,33,37,9,9,'#302850');
      ellipse(ctx,36,35,6,6,'#0c0818');
      px(ctx,28,32,PAL.moonCenter); px(ctx,26,40,PAL.moonCenter); px(ctx,34,44,PAL.moonGlow);
      ellipse(ctx,32,50,10,2,PAL.shadow);
    },
    sprout: ctx => drawSprout(ctx,'#504870','#9878c8','#ceb4ff',20,6),
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,32,54,32,30,PAL.moonStem,1);
      ellipse(ctx,26,44,4,3,'#3a3458'); ellipse(ctx,38,40,4,3,'#3a3458');
      px(ctx,24,43,PAL.moonPetalDk); px(ctx,40,39,PAL.moonPetalDk);
      const cx=32,cy=22,np=6;
      // glow halo
      ellipse(ctx,cx,cy,14,14,'rgba(180,210,255,0.22)');
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2-Math.PI/2; ellipse(ctx,cx+Math.cos(a)*8,cy+Math.sin(a)*8,5,5,PAL.moonPetalDk);}
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2-Math.PI/2; ellipse(ctx,cx+Math.cos(a)*7,cy+Math.sin(a)*7,4,4,PAL.moonPetal);}
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2-Math.PI/2; ellipse(ctx,cx+Math.cos(a)*5,cy+Math.sin(a)*5,2,2,PAL.moonGlow);}
      circle(ctx,cx,cy,5,PAL.moonCenter); px(ctx,cx-1,cy-1,'#ffffff'); px(ctx,cx+6,cy-5,'#ffffff');
    },
  },

  // 7 STARFRUIT
  starfruit: {
    seed: ctx => {
      ellipse(ctx,32,38,9,11,'#302050'); ellipse(ctx,32,38,8,10,'#503880');
      // mini star
      const cx=32,cy=38,pts=5;
      for (let i=0;i<pts;i++){const a=(i/pts)*Math.PI*2-Math.PI/2; px(ctx,cx+Math.cos(a)*4|0,cy+Math.sin(a)*4|0,PAL.starBody);}
      px(ctx,cx,cy,PAL.starShine); ellipse(ctx,32,50,9,2,PAL.shadow);
    },
    sprout: ctx => drawSprout(ctx,PAL.leafDk,PAL.leaf,'#d0f898',18,6),
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,32,54,32,30,PAL.leafDk,1);
      ellipse(ctx,26,44,4,3,PAL.leaf); ellipse(ctx,38,40,4,3,PAL.leaf);
      const cx=32,cy=20;
      // star: 5 thick rays
      for (let i=0;i<5;i++){const a=(i/5)*Math.PI*2-Math.PI/2; thickLine(ctx,cx,cy,cx+Math.cos(a)*12|0,cy+Math.sin(a)*12|0,PAL.starDk,3);}
      for (let i=0;i<5;i++){const a=(i/5)*Math.PI*2-Math.PI/2; thickLine(ctx,cx,cy,cx+Math.cos(a)*10|0,cy+Math.sin(a)*10|0,PAL.starBody,2);}
      circle(ctx,cx,cy,5,PAL.starShine); circle(ctx,cx,cy,3,PAL.starLt);
      px(ctx,cx+13,cy-5,PAL.starShine); px(ctx,cx-14,cy+4,PAL.starShine); px(ctx,cx+8,cy+13,PAL.starLt);
    },
  },

  // 8 THORNVINE
  thornvine: {
    seed: ctx => {
      ellipse(ctx,32,38,8,11,PAL.thornDk); ellipse(ctx,32,38,7,10,'#4a7038');
      [[32,26],[26,32],[38,32],[26,44],[38,44]].forEach(([x,y])=>{
        const d=Math.hypot(x-32,y-38); const dx=(x-32)/d*4|0, dy=(y-38)/d*4|0;
        line(ctx,x,y,x+dx,y+dy,PAL.thornDk); px(ctx,x+dx,y+dy,'#1a2810');
      });
      px(ctx,30,36,'#90c070'); ellipse(ctx,32,52,9,2,PAL.shadow);
    },
    sprout: ctx => drawSprout(ctx,PAL.thornDk,'#4a7838','#80b060',18,6),
    grown: ctx => {
      drawSoilMound(ctx);
      const path=[];
      for (let y=54; y>=14; y-=2) { const x=32+Math.sin((54-y)/5)*6; path.push([x|0,y]); }
      path.forEach(([x,y])=>{rect(ctx,x-1,y,2,2,PAL.thornDk); px(ctx,x,y,PAL.thornBody);});
      path.forEach(([x,y],i)=>{
        if (i%3===0){const dir=i%6===0?-1:1; line(ctx,x,y,x+4*dir,y-2,PAL.thornSpike);}
      });
      ellipse(ctx,24,38,4,2,PAL.thornDk); ellipse(ctx,42,30,4,2,PAL.thornDk);
      ellipse(ctx,24,38,3,1,PAL.thornLt); ellipse(ctx,42,30,3,1,PAL.thornLt);
      const [tx,ty]=path[path.length-1];
      circle(ctx,tx,ty-2,5,PAL.thornBloom); circle(ctx,tx,ty-2,4,'#a040c0'); px(ctx,tx,ty-3,'#ffd8ff');
      px(ctx,tx-5,ty-3,PAL.thornDk); px(ctx,tx+5,ty-3,PAL.thornDk);
    },
  },

  // 9 GLOWSHROOM
  glowshroom: {
    seed: ctx => {
      ellipse(ctx,32,38,10,10,'#502040'); ellipse(ctx,32,37,9,9,'#803060');
      px(ctx,28,34,PAL.glowDot); px(ctx,29,34,PAL.glowDot);
      px(ctx,35,36,PAL.glowDot); px(ctx,35,37,PAL.glowDot);
      px(ctx,30,41,PAL.glowDot); px(ctx,36,42,PAL.glowDot);
      ellipse(ctx,32,38,12,12,'rgba(200,100,255,0.15)'); ellipse(ctx,32,50,10,2,PAL.shadow);
    },
    sprout: ctx => {
      ellipse(ctx,32,50,14,4,PAL.soilDk); ellipse(ctx,32,49,13,3,PAL.soil);
      rect(ctx,31,38,2,12,PAL.glowStemDk); rect(ctx,30,39,1,10,PAL.glowStem);
      ellipse(ctx,32,36,6,4,PAL.glowCapDk); ellipse(ctx,32,35,5,3,PAL.glowCap);
      px(ctx,30,34,PAL.glowDot); px(ctx,33,35,PAL.glowDot); px(ctx,29,36,PAL.glowRim);
    },
    grown: ctx => {
      drawSoilMound(ctx);
      // back small
      rect(ctx,22,38,2,14,PAL.glowStemDk);
      ellipse(ctx,23,36,7,5,PAL.glowCapDk); ellipse(ctx,23,35,6,4,PAL.glowCap);
      px(ctx,21,34,PAL.glowDot); px(ctx,26,35,PAL.glowDot); px(ctx,20,36,PAL.glowRim);
      // main
      rect(ctx,31,28,4,26,PAL.glowStemDk); rect(ctx,32,29,2,24,PAL.glowStem);
      ellipse(ctx,33,24,13,9,PAL.glowCapDk); ellipse(ctx,33,23,12,8,PAL.glowCap);
      ring(ctx,33,24,13,'rgba(192,128,255,0.3)',2);
      px(ctx,27,22,PAL.glowDot); px(ctx,28,22,PAL.glowDot); px(ctx,37,21,PAL.glowDot); px(ctx,38,21,PAL.glowDot);
      px(ctx,33,25,PAL.glowDot); px(ctx,30,27,PAL.glowDot); px(ctx,40,26,PAL.glowDot);
      // side small
      rect(ctx,42,40,2,12,PAL.glowStemDk);
      ellipse(ctx,43,38,5,4,PAL.glowCapDk); ellipse(ctx,43,37,4,3,PAL.glowCap);
      px(ctx,42,37,PAL.glowDot); px(ctx,45,38,PAL.glowRim);
    },
  },

  // 10 VOIDBLOOM
  voidbloom: {
    seed: ctx => {
      ellipse(ctx,32,38,9,11,PAL.voidPetalDk); ellipse(ctx,32,38,8,10,PAL.voidPetal);
      line(ctx,32,28,26,38,'#6030a0'); line(ctx,32,28,38,38,'#6030a0');
      line(ctx,26,38,32,48,'#180630'); line(ctx,38,38,32,48,'#180630');
      px(ctx,30,33,PAL.voidGlow); px(ctx,32,31,PAL.voidGlow); ellipse(ctx,32,50,10,2,PAL.shadow);
    },
    sprout: ctx => drawSprout(ctx,PAL.voidPetalDk,PAL.voidPetal,PAL.voidGlow,20,6),
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,32,54,32,30,PAL.voidPetalDk,1);
      ellipse(ctx,26,44,4,3,PAL.voidPetalDk); ellipse(ctx,38,40,4,3,PAL.voidPetalDk);
      px(ctx,24,43,PAL.voidPetal); px(ctx,40,39,PAL.voidPetal);
      const cx=32,cy=22,np=6;
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2-Math.PI/2; ellipse(ctx,cx+Math.cos(a)*10,cy+Math.sin(a)*10,5,6,PAL.voidPetalDk);}
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2-Math.PI/2; ellipse(ctx,cx+Math.cos(a)*9,cy+Math.sin(a)*9,4,5,PAL.voidPetal);}
      circle(ctx,cx,cy,5,'#040210'); ring(ctx,cx,cy,6,PAL.voidGlow,1); ring(ctx,cx,cy,9,'rgba(192,96,255,0.35)',1);
      px(ctx,cx-2,cy-1,PAL.voidGlow); px(ctx,cx+1,cy+2,'#e0d8ff');
      px(ctx,cx+13,cy-8,'#e0d8ff'); px(ctx,cx-13,cy+7,PAL.voidGlow);
    },
  },

  // 11 AETHERFERN
  aetherfern: {
    seed: ctx => {
      ellipse(ctx,32,38,10,11,PAL.aetherDk); ellipse(ctx,32,38,9,10,PAL.aetherLeaf);
      const sp=[[32,38],[31,38],[31,37],[32,37],[33,37],[34,38],[34,39],[33,40],[31,40],[29,39],[28,37],[29,35],[31,34]];
      sp.forEach(([x,y])=>px(ctx,x,y,PAL.aetherShim));
      ellipse(ctx,32,38,12,12,'rgba(32,192,160,0.18)'); ellipse(ctx,32,50,10,2,PAL.shadow);
    },
    sprout: ctx => drawSprout(ctx,PAL.aetherDk,PAL.aetherLeaf,PAL.aetherShim,16,5),
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,32,54,32,26,PAL.aetherDk,1);
      for (let y=50; y>=28; y-=4) {
        const len=6-(50-y)*0.15;
        thickLine(ctx,32,y,32-len|0,y-2,PAL.aetherDk,1); thickLine(ctx,32,y,32+len|0,y-2,PAL.aetherDk,1);
        thickLine(ctx,32,y,(32-len+1)|0,y-2,PAL.aetherLeaf,1); thickLine(ctx,32,y,(32+len-1)|0,y-2,PAL.aetherLeaf,1);
      }
      const cx=32,cy=22;
      const spiral=[[cx,cy],[cx-1,cy],[cx-2,cy],[cx-2,cy+1],[cx-2,cy+2],[cx-1,cy+3],[cx,cy+3],[cx+1,cy+3],[cx+2,cy+2],[cx+3,cy+1],[cx+3,cy],[cx+3,cy-1],[cx+2,cy-2],[cx+1,cy-3],[cx,cy-3],[cx-1,cy-3],[cx-2,cy-3],[cx-3,cy-2],[cx-4,cy-1]];
      spiral.forEach(([x,y])=>px(ctx,x,y,PAL.aetherDk));
      [[cx,cy-1],[cx+1,cy-1],[cx+1,cy],[cx,cy+1],[cx-1,cy+1],[cx-1,cy]].forEach(([x,y])=>px(ctx,x,y,PAL.aetherLeaf));
      px(ctx,cx,cy,PAL.aetherShim);
      px(ctx,22,36,PAL.aetherShim); px(ctx,44,32,PAL.aetherShim); px(ctx,38,48,PAL.aetherLt);
    },
  },

  // 12 SOLARSPIKE
  solarspike: {
    seed: ctx => {
      ellipse(ctx,32,38,9,11,PAL.solarDk); ellipse(ctx,32,38,8,10,PAL.solarBody);
      ellipse(ctx,32,38,5,7,PAL.solarYel); ellipse(ctx,32,36,2,3,'#fffff0');
      px(ctx,32,27,PAL.solarYel); px(ctx,32,26,'#fffff0'); px(ctx,31,28,PAL.solarBody); px(ctx,33,28,PAL.solarBody);
      px(ctx,26,30,PAL.solarYel); px(ctx,38,32,PAL.solarYel); ellipse(ctx,32,50,10,2,PAL.shadow);
    },
    sprout: ctx => drawSprout(ctx,PAL.solarDk,PAL.solarBody,PAL.solarYel,18,5),
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,32,54,32,36,PAL.solarDk,2);
      ellipse(ctx,26,46,5,3,PAL.solarDk); ellipse(ctx,38,42,5,3,PAL.solarDk);
      ellipse(ctx,26,46,4,2,PAL.solarBody); ellipse(ctx,38,42,4,2,PAL.solarBody);
      // 8 radiating spikes
      for (let i=0;i<8;i++){const a=(i/8)*Math.PI*2; thickLine(ctx,32,26,32+Math.cos(a)*14|0,26+Math.sin(a)*14|0,PAL.solarDk,2);}
      for (let i=0;i<8;i++){const a=(i/8)*Math.PI*2; thickLine(ctx,32,26,32+Math.cos(a)*12|0,26+Math.sin(a)*12|0,PAL.solarYel,1);}
      circle(ctx,32,26,7,PAL.solarDk); circle(ctx,32,26,6,PAL.solarBody); circle(ctx,32,26,4,PAL.solarYel); circle(ctx,32,26,2,PAL.solarCore);
      px(ctx,22,16,PAL.solarYel); px(ctx,42,18,'#fffff0'); px(ctx,38,36,PAL.solarYel);
    },
  },
};

// =====================================================================
// CROPS 13–22 (new abyssal / divine crops)
// =====================================================================
const CROPS2 = {

  // 13 NETHERFRUIT
  netherfruit: {
    seed: ctx => drawSeed(ctx,9,11,PAL.netherSkin,PAL.netherBody,'#804040','spot'),
    sprout: ctx => drawSprout(ctx,'#601010','#902020','#ff6040',18,6),
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,32,54,32,32,'#601010',1);
      ellipse(ctx,26,44,4,3,'#601010'); ellipse(ctx,38,40,4,3,'#601010');
      // dark round fruit
      circle(ctx,32,26,13,PAL.netherBody); circle(ctx,32,26,12,PAL.netherSkin);
      ellipse(ctx,28,22,3,2,'#801818');
      // cracks revealing glow
      line(ctx,28,20,34,30,PAL.netherCrack); line(ctx,36,22,30,32,'#ff6018');
      px(ctx,28,20,PAL.netherGlow); px(ctx,36,22,PAL.netherGlow); px(ctx,30,32,PAL.netherCrack);
      // deep purple shadow
      ellipse(ctx,36,32,4,3,PAL.netherPurp);
      // orange glow seeping
      ellipse(ctx,32,26,5,4,'rgba(255,80,0,0.3)');
      px(ctx,22,18,PAL.netherGlow); px(ctx,43,20,'rgba(255,80,0,0.5)');
    },
  },

  // 14 DUSKPETAL
  duskpetal: {
    seed: ctx => drawSeed(ctx,9,11,PAL.duskPetal,PAL.duskPetalDk,PAL.duskLt,null),
    sprout: ctx => drawSprout(ctx,PAL.duskPetalDk,PAL.duskPetal,PAL.duskLt,19,6),
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,32,54,32,30,'#804060',1);
      ellipse(ctx,26,44,4,3,'#603050'); ellipse(ctx,38,40,4,3,'#603050');
      const cx=32,cy=22,np=8;
      // layered petals: outer dark, inner light
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2; ellipse(ctx,cx+Math.cos(a)*10,cy+Math.sin(a)*10,5,6,PAL.duskPetalDk);}
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2+Math.PI/np; ellipse(ctx,cx+Math.cos(a)*8,cy+Math.sin(a)*8,4,5,PAL.duskPetal);}
      for (let i=0;i<np/2;i++){const a=(i/(np/2))*Math.PI*2; ellipse(ctx,cx+Math.cos(a)*5,cy+Math.sin(a)*5,3,4,PAL.duskLt);}
      // petal tips darker
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2; px(ctx,cx+Math.cos(a)*14|0,cy+Math.sin(a)*14|0,PAL.duskTip);}
      circle(ctx,cx,cy,4,'#f0c0e0'); px(ctx,cx,cy,'#ffffff');
    },
  },

  // 15 ASHBLOOM
  ashbloom: {
    seed: ctx => drawSeed(ctx,9,11,PAL.ashPetal,PAL.ashPetalDk,PAL.ashWhite,null),
    sprout: ctx => drawSprout(ctx,'#808088','#b0b0b8',PAL.ashWhite,18,6),
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,32,54,32,30,'#686870',1);
      ellipse(ctx,26,44,4,3,'#686870'); ellipse(ctx,38,40,4,3,'#686870');
      const cx=32,cy=22,np=7;
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2; ellipse(ctx,cx+Math.cos(a)*9,cy+Math.sin(a)*9,5,5,PAL.ashPetalDk);}
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2+Math.PI/np*0.5; ellipse(ctx,cx+Math.cos(a)*7,cy+Math.sin(a)*7,4,4,PAL.ashPetal);}
      circle(ctx,cx,cy,5,PAL.ashEmber); circle(ctx,cx,cy,4,PAL.ashCenter); circle(ctx,cx,cy,2,'#ffec90');
      // ash particles
      px(ctx,cx-8,cy-12,'#c0c0c8'); px(ctx,cx+10,cy-10,'#c0c0c8'); px(ctx,cx-12,cy+6,'#a0a0a8');
      px(ctx,cx+6,cy+14,PAL.ashPetalDk); px(ctx,cx-4,cy+16,PAL.ashPetalDk);
      px(ctx,cx+14,cy,PAL.ashCenter);
    },
  },

  // 16 VOIDCORAL
  voidcoral: {
    seed: ctx => drawSeed(ctx,8,11,PAL.coralMid,PAL.coralDk,PAL.coralTip,null),
    sprout: ctx => drawSprout(ctx,PAL.coralDk,PAL.coralMid,PAL.coralTip,20,5),
    grown: ctx => {
      drawSoilMound(ctx);
      // branching coral structure
      thickLine(ctx,32,54,32,36,PAL.coralDk,3);
      thickLine(ctx,32,36,20,20,PAL.coralDk,2); thickLine(ctx,32,36,44,20,PAL.coralDk,2);
      thickLine(ctx,32,36,32,18,PAL.coralDk,2);
      thickLine(ctx,20,20,14,12,PAL.coralDk,2); thickLine(ctx,20,20,26,12,PAL.coralDk,2);
      thickLine(ctx,44,20,38,12,PAL.coralDk,2); thickLine(ctx,44,20,50,12,PAL.coralDk,2);
      thickLine(ctx,32,18,27,10,PAL.coralDk,2); thickLine(ctx,32,18,37,10,PAL.coralDk,2);
      // same branches in blue
      thickLine(ctx,32,54,32,36,PAL.coralBody,2);
      thickLine(ctx,32,36,20,20,PAL.coralBody,1); thickLine(ctx,32,36,44,20,PAL.coralBody,1);
      thickLine(ctx,32,36,32,18,PAL.coralBody,1);
      // cyan tips
      [[14,12],[26,12],[38,12],[50,12],[27,10],[37,10]].forEach(([x,y])=>{circle(ctx,x,y,3,PAL.coralTip); px(ctx,x,y,'#c0ffff');});
      px(ctx,32,18,PAL.coralTip);
    },
  },

  // 17 ECLIPSE LOTUS
  eclipseLotus: {
    seed: ctx => drawSeed(ctx,9,11,PAL.lotusPetal,PAL.lotusBody,PAL.lotusRim,null),
    sprout: ctx => drawSprout(ctx,PAL.lotusBody,'#282838','#a060e0',20,7),
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,32,54,32,34,PAL.lotusBody,2);
      const cx=32,cy=22,np=6;
      // outer black petals with gold rim
      for (let i=0;i<np;i++){
        const a=(i/np)*Math.PI*2;
        const px1=cx+Math.cos(a)*11|0, py1=cy+Math.sin(a)*11|0;
        ellipse(ctx,px1,py1,6,7,PAL.lotusBody);
        // gold rim on petal edge
        const px2=cx+Math.cos(a)*14|0, py2=cy+Math.sin(a)*14|0;
        ellipse(ctx,px2,py2,3,2,PAL.lotusRim);
      }
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2+Math.PI/np; ellipse(ctx,cx+Math.cos(a)*8,cy+Math.sin(a)*8,4,5,PAL.lotusPetal);}
      circle(ctx,cx,cy,6,PAL.lotusCenter); circle(ctx,cx,cy,4,'#c080ff'); px(ctx,cx,cy,'#ffffff');
      // white gold highlights on petals
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2; px(ctx,cx+Math.cos(a)*10|0,cy+Math.sin(a)*10|0,'#fff8d0');}
    },
  },

  // 18 STARDUST FERN
  stardustFern: {
    seed: ctx => drawSeed(ctx,9,11,PAL.sdLeaf,PAL.sdDk,PAL.sdLt,null),
    sprout: ctx => drawSprout(ctx,PAL.sdDk,PAL.sdLeaf,PAL.sdLt,18,6),
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,32,54,32,22,PAL.sdDk,1);
      for (let y=50; y>=24; y-=4) {
        const len=8-(50-y)*0.18;
        thickLine(ctx,32,y,32-len|0,y-2,PAL.sdDk,1); thickLine(ctx,32,y,32+len|0,y-2,PAL.sdDk,1);
        thickLine(ctx,32,y,(32-len+1)|0,y-2,PAL.sdLeaf,1); thickLine(ctx,32,y,(32+len-1)|0,y-2,PAL.sdLeaf,1);
        if (y%8===2) { px(ctx,(32-len-1)|0,y-3,PAL.sdSpark); px(ctx,(32+len+1)|0,y-3,PAL.sdSpark); }
      }
      // sparkle pixels
      [[20,30],[44,28],[18,42],[46,38],[24,20],[40,22],[32,16]].forEach(([x,y])=>px(ctx,x,y,PAL.sdSpark));
      [[22,32],[42,30],[20,44]].forEach(([x,y])=>px(ctx,x,y,PAL.sdLt));
    },
  },

  // 19 CELESTIAL POD
  celestialPod: {
    seed: ctx => drawSeed(ctx,9,11,PAL.celLt,PAL.celDk,PAL.celDot,null),
    sprout: ctx => drawSprout(ctx,PAL.celDk,PAL.celLt,PAL.celDot,18,5),
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,32,54,32,32,PAL.celDk,1);
      ellipse(ctx,26,44,4,3,PAL.celDk); ellipse(ctx,38,40,4,3,PAL.celDk);
      // smooth rounded pod
      ellipse(ctx,32,24,13,17,PAL.celDk); ellipse(ctx,32,24,12,16,PAL.celBody); ellipse(ctx,32,24,11,15,PAL.celLt);
      // constellation dots on surface
      [[28,18],[36,18],[24,24],[40,24],[26,30],[38,30],[32,22],[30,26],[34,26]].forEach(([x,y])=>px(ctx,x,y,PAL.celDot));
      // dot connections (constellation lines)
      line(ctx,28,18,36,18,PAL.celDk); line(ctx,28,18,24,24,PAL.celDk); line(ctx,36,18,40,24,PAL.celDk);
      line(ctx,32,22,30,26,PAL.celDk); line(ctx,32,22,34,26,PAL.celDk);
      ellipse(ctx,27,20,2,1,PAL.celDot);
    },
  },

  // 20 AURIC BLOOM
  auricBloom: {
    seed: ctx => drawSeed(ctx,9,11,PAL.auricLt,PAL.auricDk,PAL.auricInner,null),
    sprout: ctx => drawSprout(ctx,PAL.auricDk,PAL.auricPetal,PAL.auricLt,19,6),
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,32,54,32,30,PAL.leafDk,1);
      ellipse(ctx,26,44,4,3,PAL.leaf); ellipse(ctx,38,40,4,3,PAL.leaf);
      const cx=32,cy=22,np=10;
      // outer petals
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2; ellipse(ctx,cx+Math.cos(a)*11,cy+Math.sin(a)*11,5,4,PAL.auricDk);}
      for (let i=0;i<np;i++){const a=(i/np)*Math.PI*2+Math.PI/np; ellipse(ctx,cx+Math.cos(a)*9,cy+Math.sin(a)*9,4,3,PAL.auricPetal);}
      // inner petals lighter
      for (let i=0;i<np/2;i++){const a=(i/(np/2))*Math.PI*2; ellipse(ctx,cx+Math.cos(a)*6,cy+Math.sin(a)*6,3,2,PAL.auricLt);}
      circle(ctx,cx,cy,4,PAL.auricDk); circle(ctx,cx,cy,3,PAL.auricPetal); circle(ctx,cx,cy,1,PAL.auricInner);
      // gold shine
      px(ctx,cx-1,cy-1,PAL.auricInner); px(ctx,cx+14,cy-6,PAL.auricLt); px(ctx,cx-14,cy+5,PAL.auricLt);
    },
  },

  // 21 PRISMATIC ROOT
  prismaticRoot: {
    seed: ctx => drawSeed(ctx,8,11,PAL.prismLt,PAL.prismDk,PAL.prismBody,'split'),
    sprout: ctx => drawSprout(ctx,PAL.prismDk,PAL.prismLt,PAL.prismBody,16,5),
    grown: ctx => {
      drawSoilMound(ctx);
      // gnarled root: thick wavy trunk
      const rootPath=[];
      for (let y=54; y>=16; y-=2) { const x=32+Math.sin((54-y)/6)*4|0; rootPath.push([x,y]); }
      rootPath.forEach(([x,y])=>rect(ctx,x-2,y,5,2,PAL.prismDk));
      rootPath.forEach(([x,y])=>rect(ctx,x-1,y,3,2,PAL.prismBody));
      // rainbow bands running across the root
      const rainbow=['#ff2020','#ff8000','#f8e020','#20c040','#2080ff','#8020c0','#e040a0'];
      rainbow.forEach((c,i)=>{
        const y=52-(i*6); const [rx]=rootPath[Math.min((54-y)/2|0,rootPath.length-1)];
        rect(ctx,rx-2,y,5,1,c);
      });
      // side rootlets
      for (let i=2; i<rootPath.length-2; i+=3) {
        const [x,y]=rootPath[i], dir=i%6<3?-1:1;
        thickLine(ctx,x,y,x+6*dir,y+2,PAL.prismDk,1);
      }
      // small leaf tuft at top
      ellipse(ctx,32,18,5,4,PAL.leafDk); ellipse(ctx,28,16,4,3,PAL.leaf); ellipse(ctx,36,16,4,3,PAL.leaf);
    },
  },

  // 22 GENESIS SEED
  genesisSeed: {
    seed: ctx => {
      ellipse(ctx,32,38,11,13,'#c080ff'); ellipse(ctx,32,38,10,12,PAL.genGold);
      ellipse(ctx,32,38,8,10,PAL.genOrange); ellipse(ctx,32,36,5,7,PAL.genCore);
      ellipse(ctx,32,38,13,15,'rgba(255,255,200,0.2)');
      px(ctx,32,25,'#ffffff'); px(ctx,26,30,'#ffe040'); px(ctx,38,30,'#ffe040');
      ellipse(ctx,32,50,11,2,PAL.shadow);
    },
    sprout: ctx => {
      ellipse(ctx,32,50,14,4,PAL.soilDk); ellipse(ctx,32,49,13,3,PAL.soil);
      thickLine(ctx,32,48,32,28,PAL.genGold,2);
      ellipse(ctx,26,32,6,5,PAL.genOrange); ellipse(ctx,38,32,6,5,PAL.genOrange);
      ellipse(ctx,26,32,4,3,PAL.genGold); ellipse(ctx,38,32,4,3,PAL.genGold);
      px(ctx,24,30,PAL.genCore); px(ctx,40,30,PAL.genCore); px(ctx,32,26,PAL.genCore);
    },
    grown: ctx => {
      drawSoilMound(ctx);
      thickLine(ctx,32,54,32,32,PAL.genGold,2);
      ellipse(ctx,26,44,5,3,PAL.genOrange); ellipse(ctx,38,40,5,3,PAL.genOrange);
      ellipse(ctx,26,44,3,2,PAL.genGold); ellipse(ctx,38,40,3,2,PAL.genGold);
      const cx=32,cy=22;
      // rainbow rim halo
      const rainbow=['#ff2020','#ff8000','#f8e020','#20c040','#2080ff','#8020c0'];
      rainbow.forEach((c,i)=>{ring(ctx,cx,cy,14-i,c,1);});
      // gold layer
      circle(ctx,cx,cy,9,PAL.genGold); circle(ctx,cx,cy,7,PAL.genOrange); circle(ctx,cx,cy,5,PAL.genCore);
      circle(ctx,cx,cy,3,'#ffffff');
      // shine cross
      px(ctx,cx,cy-6,PAL.genCore); px(ctx,cx,cy+6,PAL.genGold); px(ctx,cx-6,cy,PAL.genCore); px(ctx,cx+6,cy,PAL.genGold);
      px(ctx,cx-1,cy-1,'#ffffff'); px(ctx,cx+1,cy-1,'#ffffff');
    },
  },
};

// =====================================================================
// ITEMS (rows 23–27)  idle · active · depleted
// =====================================================================
const ITEM_SPRITES = {

  // 23 WATERING CAN
  wateringCan: {
    idle: ctx => {
      // can body (blue trapezoid)
      for (let y=28; y<=50; y++) { const w=10+((y-28)*0.15)|0; rect(ctx,32-w,y,w*2,1,PAL.canBlueDk); }
      for (let y=29; y<=49; y++) { const w=9+((y-29)*0.12)|0; rect(ctx,32-w,y,w*2,1,PAL.canBlue); }
      rect(ctx,23,29,5,1,PAL.canBlueLt); rect(ctx,24,30,3,1,PAL.canBlueLt);
      // spout left
      thickLine(ctx,22,36,14,30,PAL.canBlueDk,2); thickLine(ctx,22,36,14,30,PAL.canBlue,1);
      rect(ctx,10,27,6,3,PAL.canBlueDk); rect(ctx,11,28,4,1,PAL.canBlueLt);
      // handle right
      rect(ctx,42,33,4,2,PAL.canBlueDk); rect(ctx,46,32,2,10,PAL.canBlueDk); rect(ctx,42,42,4,2,PAL.canBlueDk);
      rect(ctx,43,34,1,8,PAL.canBlueLt);
      // water drop at spout
      px(ctx,12,32,'#80e0ff'); px(ctx,12,33,'#80e0ff'); px(ctx,11,33,'#80e0ff');
      // opening rim
      rect(ctx,27,26,10,3,PAL.canBlueDk); rect(ctx,28,27,8,1,PAL.canBlueLt);
    },
    active: ctx => {
      // tilted can pouring
      ctx.save(); ctx.translate(32,40); ctx.rotate(-0.6); ctx.translate(-32,-40);
      for (let y=28; y<=50; y++) { const w=10+((y-28)*0.15)|0; rect(ctx,32-w,y,w*2,1,PAL.canBlueDk); }
      for (let y=29; y<=49; y++) { const w=9+((y-29)*0.12)|0; rect(ctx,32-w,y,w*2,1,PAL.canBlue); }
      rect(ctx,23,29,5,1,PAL.canBlueLt);
      thickLine(ctx,22,36,14,30,PAL.canBlueDk,2); thickLine(ctx,22,36,14,30,PAL.canBlue,1);
      rect(ctx,10,27,6,3,PAL.canBlueDk);
      ctx.restore();
      // water stream (separate, not rotated)
      for (let i=0; i<4; i++) { px(ctx,18+i*2,44+i*3,'#40c0ff'); px(ctx,19+i*2,45+i*3,'#80e0ff'); }
    },
    depleted: ctx => {
      // same can, rusty tint, tilted slightly
      ctx.save(); ctx.translate(32,40); ctx.rotate(0.3); ctx.translate(-32,-40);
      for (let y=28; y<=50; y++) { const w=10+((y-28)*0.15)|0; rect(ctx,32-w,y,w*2,1,PAL.canRust); }
      for (let y=29; y<=49; y++) { const w=9+((y-29)*0.12)|0; rect(ctx,32-w,y,w*2,1,'#e08050'); }
      rect(ctx,42,33,4,2,PAL.canRust); rect(ctx,46,32,2,10,PAL.canRust); rect(ctx,42,42,4,2,PAL.canRust);
      thickLine(ctx,22,36,14,30,PAL.canRust,2);
      rect(ctx,10,27,6,3,PAL.canRust);
      ctx.restore();
      // rust spots
      px(ctx,30,36,'#a04020'); px(ctx,34,42,'#a04020'); px(ctx,28,44,'#a04020');
    },
  },

  // 24 CAGE
  cage: {
    idle: ctx => {
      // wire cage top ellipse
      ellipse(ctx,32,18,12,4,PAL.cageDk); ring(ctx,32,18,12,PAL.cageDk,1); ellipse(ctx,32,18,12,4,'rgba(200,210,220,0.6)');
      // vertical bars
      for (let i=-3; i<=3; i++) thickLine(ctx,32+i*4,18,32+i*4,50,PAL.cageDk,1);
      // horizontal rings
      for (let y=26; y<=50; y+=8) { ring(ctx,32,y,12,PAL.cageDk,1); }
      // bottom floor
      ellipse(ctx,32,50,12,4,PAL.cageDk); ellipse(ctx,32,50,11,3,PAL.cageGray);
      // door (open, hinged right)
      rect(ctx,42,26,4,16,PAL.cageDk); rect(ctx,43,27,2,14,PAL.cageLt);
      // top hook
      rect(ctx,31,12,2,6,PAL.cageDk); rect(ctx,29,10,6,3,PAL.cageDk); rect(ctx,30,11,4,1,PAL.cageLt);
    },
    active: ctx => {
      ellipse(ctx,32,18,12,4,PAL.cageDk); ring(ctx,32,18,12,PAL.cageDk,1);
      for (let i=-3; i<=3; i++) thickLine(ctx,32+i*4,18,32+i*4,50,PAL.cageDk,1);
      for (let y=26; y<=50; y+=8) ring(ctx,32,y,12,PAL.cageDk,1);
      ellipse(ctx,32,50,12,4,PAL.cageDk); ellipse(ctx,32,50,11,3,PAL.cageGray);
      // door closed (latched front)
      for (let i=-3; i<=3; i++) thickLine(ctx,32+i*4,18,32+i*4,50,PAL.cageDk,1);
      ring(ctx,32,34,12,PAL.cageDk,1);
      // latch
      rect(ctx,38,30,6,4,PAL.cageDk); rect(ctx,39,31,4,2,PAL.cageGray);
      rect(ctx,31,12,2,6,PAL.cageDk); rect(ctx,29,10,6,3,PAL.cageDk);
    },
    depleted: ctx => {
      // broken cage, bent bars
      ellipse(ctx,32,50,12,4,PAL.cageDk); ellipse(ctx,32,50,11,3,PAL.cageGray);
      thickLine(ctx,20,18,20,50,PAL.cageDk,1); thickLine(ctx,28,18,28,50,PAL.cageDk,1);
      thickLine(ctx,36,18,40,50,PAL.cageDk,1); thickLine(ctx,44,18,44,50,PAL.cageDk,1);
      // bent/snapped bars
      thickLine(ctx,24,18,20,38,PAL.cageDk,1); thickLine(ctx,32,18,28,32,PAL.cageDk,1);
      thickLine(ctx,28,32,34,50,PAL.cageDk,1);
      ellipse(ctx,32,22,8,3,PAL.cageDk);
      for (let y=26; y<=50; y+=8) ellipse(ctx,32,y,12,3,PAL.cageDk);
    },
  },

  // 25 COMMON FERTILIZER
  commonFertilizer: {
    idle: ctx => {
      // brown bag
      ellipse(ctx,32,48,13,4,PAL.fertDk);
      rect(ctx,20,22,24,28,PAL.fertDk); rect(ctx,21,21,22,29,PAL.fertBrown); rect(ctx,22,22,20,26,PAL.fertBrown);
      // bag top tied
      rect(ctx,25,16,14,8,PAL.fertDk); rect(ctx,26,17,12,6,'#7a5028');
      rect(ctx,29,12,6,6,PAL.fertDk); rect(ctx,30,13,4,4,'#7a5028');
      // green leaf icon on front
      ellipse(ctx,32,32,6,8,PAL.fertLeafG); ellipse(ctx,32,32,4,6,'#50d060');
      thickLine(ctx,32,26,32,38,PAL.fertDk,1); thickLine(ctx,26,30,38,34,PAL.fertDk,1);
      // highlight
      rect(ctx,23,24,3,10,PAL.fertBrown);
    },
    active: ctx => {
      // bag tilted
      ctx.save(); ctx.translate(32,36); ctx.rotate(-0.5); ctx.translate(-32,-36);
      rect(ctx,21,21,22,29,PAL.fertDk); rect(ctx,22,22,20,27,PAL.fertBrown);
      rect(ctx,25,16,14,8,PAL.fertDk); rect(ctx,29,12,6,6,PAL.fertDk);
      ellipse(ctx,32,32,6,8,PAL.fertLeafG);
      ctx.restore();
      // granules pouring
      for (let i=0; i<5; i++) { px(ctx,28+i*3,50+i,'#c09060'); px(ctx,30+i*3,52+i,'#a07040'); }
      px(ctx,36,58,'#c09060'); px(ctx,32,56,'#a07040');
    },
    depleted: ctx => {
      // flat empty bag
      rect(ctx,22,28,20,20,PAL.fertDk); rect(ctx,23,29,18,18,'#7a5028');
      for (let y=29; y<=46; y+=3) rect(ctx,23,y,18,1,PAL.fertDk);
      rect(ctx,25,22,14,8,PAL.fertDk);
      rect(ctx,29,16,6,8,PAL.fertDk);
    },
  },

  // 26 UNCOMMON FERTILIZER
  uncommonFertilizer: {
    idle: ctx => {
      ellipse(ctx,32,48,13,4,PAL.fertGrnBag);
      rect(ctx,20,22,24,28,'#185830'); rect(ctx,21,21,22,29,PAL.fertGrnBag); rect(ctx,22,22,20,26,PAL.fertGrnBag);
      rect(ctx,25,16,14,8,'#185830'); rect(ctx,29,12,6,6,'#185830');
      // double leaf icon
      ellipse(ctx,28,32,5,7,PAL.fertGrnLeaf); ellipse(ctx,36,30,5,7,PAL.fertGrnLeaf);
      ellipse(ctx,28,32,3,5,'#80f080'); ellipse(ctx,36,30,3,5,'#80f080');
      thickLine(ctx,28,26,28,38,'#185830',1); thickLine(ctx,36,24,36,36,'#185830',1);
      rect(ctx,23,24,3,10,PAL.fertGrnBag);
    },
    active: ctx => {
      ctx.save(); ctx.translate(32,36); ctx.rotate(-0.5); ctx.translate(-32,-36);
      rect(ctx,21,21,22,29,'#185830'); rect(ctx,22,22,20,27,PAL.fertGrnBag);
      rect(ctx,25,16,14,8,'#185830'); rect(ctx,29,12,6,6,'#185830');
      ellipse(ctx,28,32,5,7,PAL.fertGrnLeaf); ellipse(ctx,36,30,5,7,PAL.fertGrnLeaf);
      ctx.restore();
      for (let i=0; i<5; i++) { px(ctx,28+i*3,50+i,'#30a050'); px(ctx,30+i*3,52+i,'#208040'); }
      px(ctx,36,58,'#40c060'); px(ctx,32,56,'#208040');
    },
    depleted: ctx => {
      rect(ctx,22,28,20,20,'#185830'); rect(ctx,23,29,18,18,PAL.fertGrnBag);
      for (let y=29; y<=46; y+=3) rect(ctx,23,y,18,1,'#185830');
      rect(ctx,25,22,14,8,'#185830'); rect(ctx,29,16,6,8,'#185830');
    },
  },

  // 27 SCARECROW
  scarecrow: {
    idle: ctx => {
      // post
      rect(ctx,30,24,4,36,PAL.fertBrown); rect(ctx,31,25,2,34,'#c09060');
      // arms (horizontal crossbar)
      rect(ctx,12,30,40,4,PAL.fertBrown); rect(ctx,13,31,38,2,'#c09060');
      // shirt (body area)
      rect(ctx,22,28,20,20,PAL.scarShirt); rect(ctx,24,30,16,16,'#e06030');
      // straw tufts at ends
      for (let i=0;i<4;i++){px(ctx,12+i,28,PAL.scarStraw); px(ctx,11+i,32,PAL.scarStraw); px(ctx,12+i,36,PAL.scarStraw);}
      for (let i=0;i<4;i++){px(ctx,50-i,28,PAL.scarStraw); px(ctx,51-i,32,PAL.scarStraw); px(ctx,50-i,36,PAL.scarStraw);}
      // straw at bottom
      for (let i=-3;i<=3;i++) px(ctx,32+i*2,50,PAL.scarStraw);
      // head
      circle(ctx,32,20,8,PAL.scarStraw); circle(ctx,32,20,6,'#f0d880');
      px(ctx,29,19,'#3a2808'); px(ctx,35,19,'#3a2808'); px(ctx,32,22,'#8a3820');
      // hat
      rect(ctx,24,10,16,4,PAL.scarHat); rect(ctx,20,14,24,4,PAL.scarHat);
      rect(ctx,25,11,14,2,'#6a3c10');
    },
    active: ctx => {
      rect(ctx,30,24,4,36,PAL.fertBrown); rect(ctx,31,25,2,34,'#c09060');
      // arms raised
      thickLine(ctx,12,40,32,28,PAL.fertBrown,3); thickLine(ctx,52,40,32,28,PAL.fertBrown,3);
      thickLine(ctx,13,40,32,29,'#c09060',1); thickLine(ctx,51,40,32,29,'#c09060',1);
      rect(ctx,22,28,20,20,PAL.scarShirt); rect(ctx,24,30,16,16,'#e06030');
      for (let i=0;i<4;i++){px(ctx,12+i,38,PAL.scarStraw); px(ctx,52-i,38,PAL.scarStraw);}
      for (let i=-3;i<=3;i++) px(ctx,32+i*2,50,PAL.scarStraw);
      // head slightly tilted
      circle(ctx,33,19,8,PAL.scarStraw); circle(ctx,33,19,6,'#f0d880');
      px(ctx,30,18,'#3a2808'); px(ctx,36,18,'#3a2808'); px(ctx,33,21,'#8a3820');
      rect(ctx,25,9,16,4,PAL.scarHat); rect(ctx,21,13,24,4,PAL.scarHat);
    },
    depleted: ctx => {
      // fallen over (horizontal)
      rect(ctx,8,34,48,4,PAL.fertBrown); rect(ctx,9,35,46,2,'#c09060');
      // shirt sagging
      rect(ctx,18,30,20,10,PAL.scarShirt);
      // straw everywhere
      for (let x=8;x<=56;x+=4) { px(ctx,x,32,PAL.scarStraw); px(ctx,x+1,38,PAL.scarStraw); }
      // hat fallen off
      rect(ctx,48,22,12,4,PAL.scarHat); rect(ctx,46,26,16,4,PAL.scarHat);
      // head on ground
      circle(ctx,20,36,7,PAL.scarStraw); circle(ctx,20,36,5,'#f0d880');
      px(ctx,18,35,'#3a2808'); px(ctx,23,35,'#3a2808');
    },
  },
};

// =====================================================================
// Sheet structure
// =====================================================================
const CROP_ORDER = [
  'potato','carrot','wheat','sunflower','pumpkin','chard','moonbloom',
  'starfruit','thornvine','glowshroom','voidbloom','aetherfern','solarspike',
  'netherfruit','duskpetal','ashbloom','voidcoral','eclipseLotus',
  'stardustFern','celestialPod','auricBloom','prismaticRoot','genesisSeed',
];
const ITEM_ORDER  = ['wateringCan','cage','commonFertilizer','uncommonFertilizer','scarecrow'];
const CROP_STAGES = ['seed','sprout','grown'];
const ITEM_STATES = ['idle','active','depleted'];

const ALL_SPRITES = window.CROPS_ALL = { ...CROPS, ...CROPS2 };

// =====================================================================
// Rendering
// =====================================================================
let outlineMode = 'tone';
let nativeSize  = 64;

function makeCanvas(size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  c.className = 'sprite'; c.style.width = '128px'; c.style.height = '128px';
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

function drawCell(ctx, rowId, col, size, isItem) {
  ctx.save();
  if (size !== 64) { ctx.scale(size/64, size/64); ctx.imageSmoothingEnabled = false; }
  if (isItem) {
    ITEM_SPRITES[rowId][ITEM_STATES[col]](ctx);
  } else {
    ALL_SPRITES[rowId][CROP_STAGES[col]](ctx);
  }
  ctx.restore();
  if (outlineMode === 'tone') autoOutlineTonal(ctx, size, size);
}

function buildGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  const hdr = (t) => { const d=document.createElement('div'); d.className='hdr'; d.textContent=t; grid.appendChild(d); };
  hdr('Name'); hdr('Seed / Idle'); hdr('Sprout / Active'); hdr('Grown / Depleted');

  const addRow = (name, id, isItem) => {
    const nm=document.createElement('div'); nm.className='row-name';
    nm.innerHTML=`<div class="nm">${name}</div><div class="id">${id}</div>`; grid.appendChild(nm);
    for (let col=0; col<3; col++) {
      const cell=document.createElement('div'); cell.className='cell';
      const {c,ctx}=makeCanvas(nativeSize);
      drawCell(ctx,id,col,nativeSize,isItem);
      cell.appendChild(c); grid.appendChild(cell);
    }
  };

  CROP_ORDER.forEach(id => addRow(id,id,false));
  ITEM_ORDER.forEach(id => addRow(id,id,true));
}

function buildSheet() {
  const cells=nativeSize, totalRows=CROP_ORDER.length+ITEM_ORDER.length;
  const w=3*cells, h=totalRows*cells;
  const sheet=document.getElementById('sheet');
  sheet.width=w; sheet.height=h;
  sheet.style.width=(w*2)+'px'; sheet.style.height=(h*2)+'px';
  const ctx=sheet.getContext('2d'); ctx.imageSmoothingEnabled=false;
  ctx.clearRect(0,0,w,h);

  const allRows=[
    ...CROP_ORDER.map(id=>({id,isItem:false})),
    ...ITEM_ORDER.map(id=>({id,isItem:true})),
  ];
  allRows.forEach(({id,isItem},ri)=>{
    for (let col=0; col<3; col++) {
      const off=document.createElement('canvas'); off.width=cells; off.height=cells;
      const octx=off.getContext('2d'); octx.imageSmoothingEnabled=false;
      drawCell(octx,id,col,cells,isItem);
      ctx.drawImage(off,col*cells,ri*cells);
    }
  });

  document.getElementById('sheet-info').innerHTML=
    `<strong>${w} × ${h} px</strong> · ${totalRows} rows (${CROP_ORDER.length} crops + ${ITEM_ORDER.length} items) × 3 cols<br>
     Cell: <strong>${cells}×${cells}px native</strong> · Row order: ${CROP_ORDER.concat(ITEM_ORDER).join(' → ')}`;
}

function downloadSheet() {
  document.getElementById('sheet').toBlob(blob=>{
    const url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=`blissgarden-sprites-${nativeSize}px.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
}

function rebuild() { buildGrid(); buildSheet(); }

document.getElementById('btn-sheet').addEventListener('click', downloadSheet);
document.getElementById('btn-redraw').addEventListener('click', rebuild);
document.getElementById('opt-outline').addEventListener('change', e => { outlineMode=e.target.value; rebuild(); });
document.getElementById('opt-cellsize').addEventListener('change', e => { nativeSize=parseInt(e.target.value,10); rebuild(); });
rebuild();
