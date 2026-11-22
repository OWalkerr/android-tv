// Pırıl bölüm erişilebilirlik testi: oyunun kendi fiziğiyle her bölümde başlangıçtan çıkışa yol arar.
// Kullanım: node piril/tools/reachability.js [bölümler...]   (varsayılan 1-5)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').join(__dirname,'..','index.html')+'');await p.waitForTimeout(500);
await p.evaluate(()=>{window.__piril.save.intro=true;});
for(const ch of (process.argv.slice(2).length?process.argv.slice(2).map(Number):[1,2,3,4,5])){
  await p.evaluate(ch=>{const s=window.__piril.save;s.dj=ch>=2;s.glide=ch>=3;s.done=[1,2,3,4];s.cp=-1;},ch);
  await p.click('#chapB').catch(()=>{});await p.click(`#chList button:nth-child(${ch})`);await p.waitForTimeout(300);
  const r=await p.evaluate((ch)=>{
    const X=window.__piril,G=X.G,K=X.keys,S=X.sim,save=X.save;G.mode='sim';
    const gift=G.ents.find(e=>e.t==='gift');const mush=G.ents.filter(e=>e.t==='mush');
    const phases=[];
    if(ch===1)phases.push({dj:false,glide:false,goal:gift.y+20},{dj:true,glide:false,goal:38});
    else if(ch===2)phases.push({dj:true,glide:false,goal:gift.y+20},{dj:true,glide:true,goal:38});
    else if(ch<5)phases.push({dj:true,glide:true,goal:38});
    else phases.push({dj:true,glide:true,goal:G.boss.arenaBot-60});
    function run(st,pl,ab){save.dj=ab.dj;save.glide=ab.glide;const P=S.newPlayer(st.x,st.y);P.ground=!!st.g;P.vine=!!st.v;P.vx=0;P.vy=0;P.jumps=ab.dj?1:0;if(st.w){P.wallT=.12;P.wallSide=st.w;}
      const h0=P.hearts;let res=null;const N=Math.round((pl.T||2.4)*120);
      for(let i=0;i<N;i++){const t=i/120;const d=t<(pl.dT||9)?pl.dir:(pl.dir2||0);K.left=d<0?1:0;K.right=d>0?1:0;K.jump=(t<pl.jh)||(pl.dj&&t>=pl.dj&&t<pl.dj+(pl.djh||.3))||(pl.gl&&t>.1)?1:0;K.up=pl.up&&t<pl.up?1:0;K.down=pl.down&&t<.05?1:0;K.attack=0;
        if(i===0&&pl.jh>0)S.edge();if(pl.dj&&i===Math.round(pl.dj*120))S.edge();
        S.stepPlayer(P,S.DT);if(G.parts.length>50)G.parts.length=0;
        for(const m of mush){if(P.vy>0&&P.x<m.x+15&&P.x+P.w>m.x-15&&P.y+P.h>m.y-14&&P.y+P.h<m.y+4){P.vy=-1100;P.jumps=ab.dj?1:0;P.cut=true;}}
        if(P.hearts<h0){res=null;break;}
        if(i>8){if(P.ground&&!(pl.walk&&t<pl.T-.02)){res={x:P.x+9,y:P.y+P.h,g:1};break;}
          if(P.wall&&t>.1){res={x:P.x+9,y:P.y+P.h,w:P.wall};break;}
          if(P.vine&&!st.v){res={x:P.x+9,y:P.y+P.h,v:1};break;}}
        if(P.y<pl.goalY){res={x:P.x+9,y:P.y+P.h,goal:1};break;}
        if(P.y>st.y+700)break;}
      if(res===null&&pl.walk&&P.ground)res={x:P.x+9,y:P.y+P.h,g:1};
      S.clear();K.left=K.right=K.jump=K.up=K.down=0;return res;}
    let start={x:G.spawn.x,y:G.spawn.y,g:1},out=[];
    for(const ab of phases){
      const seen=new Set(),Q=[start];let best=start,found=null,iter=0;
      const key=s=>(s.w?'w'+s.w:s.v?'v':'g')+':'+Math.round(s.x/12)+':'+Math.round(s.y/12);
      seen.add(key(start));
      while(Q.length&&!found&&iter<2500){iter++;const s=Q.shift();
        const plans=[];
        if(s.g){for(const dir of [-1,0,1]){plans.push({dir,T:.35,walk:1,jh:0});for(const jh of [.1,.22,.5]){plans.push({dir,jh});if(ab.dj){plans.push({dir,jh:.5,dj:.32});plans.push({dir,jh:.5,dj:.5});plans.push({dir:0,dir2:dir,dT:.25,jh:.5,dj:.4});}if(ab.glide)plans.push({dir,jh:.5,gl:1,T:3});}
            plans.push({dir:0,dir2:dir,dT:.3,jh:.5});plans.push({dir,up:1.5,jh:.2,T:2.5});}
          plans.push({dir:0,jh:.2,down:1});}
        else if(s.w){for(const jh of [.15,.3]){plans.push({dir:-s.w,jh,dT:.16,dir2:s.w});plans.push({dir:-s.w,jh});if(ab.dj)plans.push({dir:-s.w,jh,dj:.3});}}
        else if(s.v){for(const dir of [-1,1]){plans.push({dir:0,up:1.6,T:1.7,dT:1.6,dir2:dir});plans.push({dir:0,up:.6,T:.7,dT:.6,dir2:dir});}}
        for(const pl of plans){pl.goalY=ab.goal-26;const r=run(s,pl,ab);if(!r)continue;if(r.goal){found=r;break;}const k=key(r);if(seen.has(k))continue;seen.add(k);Q.push(r);if(r.y<best.y)best=r;}
      }
      out.push({ab:JSON.stringify(ab),found:!!found,bestY:Math.round(best.y),goal:ab.goal,rows:G.MH,iter});
      if(!found)break;start={x:found.x,y:found.y,g:1};
    }
    G.mode='play';return out;},ch);
  console.log('Bölüm',ch,JSON.stringify(r));
  await p.evaluate(()=>{document.getElementById('pauseB').click();});await p.click('#menuB');
}
console.log(errs);await b.close();})();
