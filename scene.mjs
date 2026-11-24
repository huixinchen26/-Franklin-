// Dependency-free WebGL scene. All shapes are real meshes; photographs remain textures.
const VS=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUV;uniform mat4 uMVP;uniform mat4 uModel;varying vec3 vNormal;varying vec3 vPosition;varying vec2 vUV;void main(){gl_Position=uMVP*vec4(aPosition,1.);vNormal=mat3(uModel)*aNormal;vPosition=(uModel*vec4(aPosition,1.)).xyz;vUV=aUV;}`;
const FS=`precision mediump float;varying vec3 vNormal;varying vec3 vPosition;varying vec2 vUV;uniform vec3 uColor;uniform sampler2D uTexture;uniform float uTextured;void main(){vec3 n=normalize(vNormal);float light=max(dot(n,normalize(vec3(-4.,7.,6.))),0.);float fill=max(dot(n,normalize(vec3(5.,3.,-2.))),0.);vec3 base=mix(uColor,texture2D(uTexture,vUV).rgb,uTextured);float shade=.69+.27*light+.07*fill;vec3 color=base*shade;gl_FragColor=vec4(color,1.);}`;
const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function mul(a,b){const o=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
function mat(p=[0,0,0],r=[0,0,0],s=[1,1,1]){const [x,y,z]=r,cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);let a=I();a[12]=p[0];a[13]=p[1];a[14]=p[2];a=mul(a,[cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1]);a=mul(a,[cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1]);a=mul(a,[1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1]);return mul(a,[s[0],0,0,0,0,s[1],0,0,0,0,s[2],0,0,0,0,1]);}
const norm=a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l);};const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];const dot=(a,b)=>a.reduce((v,n,i)=>v+n*b[i],0);
function camera(eye,target,aspect){const z=norm(eye.map((v,i)=>v-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x),view=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1],f=1/Math.tan(.46/2),near=.1,far=100;return mul([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0],view);}
function box(w,h,d,r=.15){const data=[],sz=[w/2,h/2,d/2],n=8;for(let axis=0;axis<3;axis++)for(const side of [-1,1]){const a=(axis+1)%3,b=(axis+2)%3;function v(u,t){const p=[0,0,0];p[axis]=side*sz[axis];p[a]=(u*2-1)*sz[a];p[b]=(t*2-1)*sz[b];const c=p.map((x,i)=>Math.max(-sz[i]+r,Math.min(sz[i]-r,x))),normal=norm(p.map((x,i)=>x-c[i]));return [...p.map((_,i)=>c[i]+normal[i]*r),...normal,u,t];}for(let i=0;i<n;i++)for(let j=0;j<n;j++){const vs=[v(i/n,j/n),v((i+1)/n,j/n),v((i+1)/n,(j+1)/n),v(i/n,(j+1)/n)];for(const k of [0,1,2,0,2,3])data.push(...vs[k]);}}return data;}
function sphere(r=1){const data=[];function v(i,j){const a=i/32*Math.PI*2,b=j/20*Math.PI,n=[Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)];return [...n.map(x=>x*r),...n,i/32,j/20];}for(let i=0;i<32;i++)for(let j=0;j<20;j++)for(const vtx of [v(i,j),v(i+1,j),v(i+1,j+1),v(i,j),v(i+1,j+1),v(i,j+1)])data.push(...vtx);return data;}
function torus(radius,tube){const data=[];function v(i,j){const a=i/48*Math.PI*2,b=j/10*Math.PI*2,n=[Math.cos(a)*Math.cos(b),Math.sin(a)*Math.cos(b),Math.sin(b)];return [(radius+tube*Math.cos(b))*Math.cos(a),(radius+tube*Math.cos(b))*Math.sin(a),tube*Math.sin(b),...n,i/48,j/10];}for(let i=0;i<48;i++)for(let j=0;j<10;j++)for(const p of [v(i,j),v(i+1,j),v(i+1,j+1),v(i,j),v(i+1,j+1),v(i,j+1)])data.push(...p);return data;}
function lathe(profile,segments=32){const data=[];for(let k=0;k<profile.length-1;k++){const [r0,y0]=profile[k],[r1,y1]=profile[k+1],slope=(r1-r0)/(y1-y0||1),n0=Math.hypot(1,slope);function v(i,r,y){const a=i/segments*Math.PI*2,c=Math.cos(a),s=Math.sin(a);return [r*c,y,r*s,c/n0,-slope/n0,s/n0,i/segments,k/(profile.length-1)];}for(let i=0;i<segments;i++){const v0=v(i,r0,y0),v1=v(i+1,r0,y0),v2=v(i+1,r1,y1),v3=v(i,r1,y1);for(const q of [v0,v3,v2,v0,v2,v1])data.push(...q);}}return data;}
const plane=(w,h)=>[-w/2,-h/2,0,0,0,1,0,0,w/2,-h/2,0,0,0,1,1,0,w/2,h/2,0,0,0,1,1,1,-w/2,-h/2,0,0,0,1,0,0,w/2,h/2,0,0,0,1,1,1,-w/2,h/2,0,0,0,1,0,1];
export function initScene(canvas){const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,VS));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('WebGL link');gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
 const uniforms=Object.fromEntries(['uMVP','uModel','uColor','uTexture','uTextured'].map(n=>[n,gl.getUniformLocation(program,n)])),attrs=['aPosition','aNormal','aUV'].map(n=>gl.getAttribLocation(program,n));const objects=[];let angle=-.24,pitch=0,drag=false,lastX=0,lastY=0,travel=0,impulse=0;
 function mesh(data,color,p,r=[0,0,0],s=[1,1,1],texture=null){const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);const obj={buf,count:data.length/8,color,p,r,s,texture};objects.push(obj);return obj;}
 const pal={mint:[.78,.85,.76],red:[.77,.12,.17],rib:[.63,.065,.11],cream:[.97,.96,.89],dark:[.27,.34,.29],tan:[.82,.60,.37],white:[.99,.98,.93],green:[.77,.88,.53],pink:[.92,.70,.70]};
 // Swimming pool: tiled coping, blue water, lanes and a stainless ladder.
 mesh(box(7.8,.38,5.2,.15),[.94,.91,.80],[0,.06,0]);
 for(let x=-3.7;x<=3.7;x+=.44)mesh(box(.013,.012,5.03,.005),[.79,.79,.71],[x,.256,0]);
 for(let z=-2.4;z<=2.4;z+=.44)mesh(box(7.65,.012,.013,.005),[.79,.79,.71],[0,.256,z]);
 mesh(box(6.98,.06,4.24,.11),[.24,.58,.68],[0,.263,0]);
 const water=texture((ctx)=>{const grad=ctx.createLinearGradient(0,0,512,512);grad.addColorStop(0,'#8ed1da');grad.addColorStop(1,'#60afc5');ctx.fillStyle=grad;ctx.fillRect(0,0,512,512);ctx.lineWidth=1;ctx.strokeStyle='#d6f7f643';for(let i=0;i<=512;i+=32){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke();}ctx.strokeStyle='#d9fbf56b';ctx.lineWidth=2;for(let j=0;j<10;j++){ctx.beginPath();for(let x=0;x<=512;x+=4){const y=j*54+Math.sin(x/29+j*2)*9;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}});
 mesh(plane(6.8,4.06),[1,1,1],[0,.300,0],[-Math.PI/2,0,0],[1,1,1],water);
 for(const x of [-1.55,1.55]){mesh(box(.09,.01,3.3,.004),[.21,.49,.62],[x,.312,0]);mesh(box(.55,.011,.08,.004),[.21,.49,.62],[x,.313,1.25]);}
 for(const z of [-1.13,-.42]){mesh(torus(.24,.035),[.76,.81,.79],[3.42,.74,z],[0,Math.PI/2,0]);mesh(box(.065,.57,.065,.03),[.76,.81,.79],[3.2,.48,z]);}
 for(const y of [.39,.59,.78])mesh(box(.08,.06,.76,.025),[.82,.86,.82],[3.18,y,-.78]);
 // A small floating mat keeps the suitcase above the water.
 mesh(box(2.60,.13,1.55,.065),[.97,.87,.66],[-.1,.39,-.08],[0,-.13,-.06]);
 mesh(torus(.70,.10),[.97,.78,.37],[2.03,.37,.91],[Math.PI/2,0,0],[1.06,1,1]);
 for(const radius of [.90,1.12])mesh(torus(radius,.011),[.76,.92,.91],[-2.28,.322,.72],[Math.PI/2,0,0],[1, .67,1]);
 // Clay suitcase and soft modular details.
 const caseGroup=[];function luggage(data,col,p,r=[0,0,0],s=[1,1,1],tex=null){const o=mesh(data,col,p,r,s,tex);o.luggage=true;caseGroup.push(o);return o;}
 luggage(box(2.28,2.82,1.12,.24),pal.red,[-.10,1.92,-.08],[0,-.13,-.06]);
 for(const x of [-.76,-.29,.18,.65])luggage(box(.10,2.08,.13,.049),pal.rib,[x,1.92,.53],[0,-.13,-.06]);
 luggage(box(.80,.12,.17,.055),pal.dark,[-.09,3.48,-.12]);for(const x of [-.44,.26])luggage(box(.10,.29,.12,.045),pal.rib,[x,3.34,-.12]);
 for(const x of [-.83,.68])luggage(sphere(.14),pal.dark,[x,.48,.12],[0,0,0],[1,1,.75]);
 luggage(box(2.34,.035,1.08,.015),[.45,.055,.09],[-.12,1.91,-.08],[0,-.13,-.06]);
 const ball=mesh(sphere(.65),[.99,.98,.92],[-2.28,.92,.72],[.1,0,-.3]);
 // White volleyball panels: three curved seam families, no basketball cross.
 const seamData=[];
 for(let panel=0;panel<6;panel++)for(let i=0;i<48;i++){
  const point=(t,side)=>{const theta=t*Math.PI,phi=panel*Math.PI/3+.28*Math.sin(theta)+side*.009,n=[Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi)];return [...n.map(v=>v*.655),...n,t,side];};
  for(const v of [point(i/48,-1),point((i+1)/48,-1),point((i+1)/48,1),point(i/48,-1),point((i+1)/48,1),point(i/48,1)])seamData.push(...v);
 }
 const seams=mesh(seamData,[.44,.49,.53],[-2.28,.92,.72],[.1,0,-.3]);seams.volleyball=true;
// Basketball with curved channel seams.
 const basketballCenter=[2.88,.70,-.12],basketball=mesh(sphere(.39),[.91,.31,.08],basketballCenter);basketball.basketball=true;
 const basketballSeams=[];
 for(const basePhi of [0,Math.PI/2])for(let i=0;i<48;i++){
  const point=(t,side)=>{const theta=t*Math.PI,phi=basePhi+.34*Math.sin(theta)+side*.022,n=[Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi)];return [...n.map(v=>v*.394),...n,t,side];};
  for(const v of [point(i/48,-1),point((i+1)/48,-1),point((i+1)/48,1),point(i/48,-1),point((i+1)/48,1),point(i/48,1)])basketballSeams.push(...v);
 }
 const basketballLines=mesh(basketballSeams,[.12,.10,.08],basketballCenter);basketballLines.basketball=true;
 const equator=mesh(torus(.39,.012),[.12,.10,.08],basketballCenter,[Math.PI/2,0,0]);equator.basketball=true;
 // A green champagne bottle with gold foil and a small front label.
 const bottlePos=[-2.82,.31,-.60],glass=[.12,.36,.25],gold=[.86,.62,.25];
 mesh(lathe([[.14,0],[.19,.045],[.21,.10],[.21,.48],[.18,.58],[.11,.67],[.085,.72],[.085,.80],[0,.80]]),glass,bottlePos);
 mesh(lathe([[.086,.73],[.09,.76],[.09,.94],[.075,.97],[0,.97]]),gold,bottlePos);
 mesh(lathe([[.060,.95],[.065,1.08],[.06,1.13],[0,1.13]]),[.63,.39,.20],bottlePos);
 mesh(torus(.091,.009),gold,[bottlePos[0],bottlePos[1]+.77,bottlePos[2]],[Math.PI/2,0,0]);
 mesh(box(.24,.19,.018,.018),[.94,.84,.63],[bottlePos[0],bottlePos[1]+.39,bottlePos[2]+.195]);
 mesh(sphere(.035),gold,[bottlePos[0],bottlePos[1]+.39,bottlePos[2]+.208],[0,0,0],[1,.72,.22]);
 // Corgi souvenir. Rounded ears, white muzzle, two short legs.
 const dogCenter=[2.02,.92,.98];function dog(data,col,p,r=[0,0,0],s=[1,1,1]){const o=mesh(data,col,p,r,s);o.dog=true;return o;}
 dog(box(1.16,.66,.66,.25),pal.tan,[2.02,.72,.80],[0,-.35,0]);dog(box(.88,.85,.75,.25),pal.tan,[2.10,1.20,1.1],[0,-.24,0]);
 dog(sphere(.32),pal.white,[2.19,1.02,1.43],[0,0,0],[1.10,.70,.62]);
 dog(sphere(.15),pal.dark,[2.15,1.13,1.63],[0,0,0],[.60,.55,.45]);
 for(const x of [1.81,2.39]){dog(box(.27,.50,.25,.11),pal.tan,[x,1.73,1.08],[0,0,x<2?.23:-.23]);dog(sphere(.055),pal.dark,[x+.02,1.36,1.44]);dog(box(.23,.36,.26,.10),pal.cream,[x,.44,1.0]);}
 dog(sphere(.19),pal.cream,[1.65,.81,.30],[.2,0,0],[1,1,1.3]);
 // Backdrop memories printed on small polaroids.
 function texture(draw){const c=document.createElement('canvas');c.width=512;c.height=512;draw(c.getContext('2d'),c);const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);return t;}
 function card(src,p,r,label){const draw=(ctx,c,img)=>{ctx.fillStyle='#fffef7';ctx.fillRect(0,0,512,512);if(img){const size=Math.min(img.width,img.height),sx=(img.width-size)/2,sy=(img.height-size)/2;ctx.drawImage(img,sx,sy,size,size,24,24,464,388);}else{ctx.fillStyle='#dbe4ca';ctx.fillRect(24,24,464,388);}ctx.fillStyle='#6e7d61';ctx.textAlign='center';ctx.font='25px Georgia';ctx.fillText(label,256,463);};const o=mesh(plane(1.95,1.95),[1,1,1],p,r,[1,1,1],texture((ctx,c)=>draw(ctx,c)));o.float=true;const img=new Image();img.onload=()=>o.texture=texture((ctx,c)=>draw(ctx,c,img));img.src=src;}
 card('assets/photo-24.webp',[-2.25,2.40,-.90],[.04,.1,.22],'our first day');card('assets/photo-01.webp',[2.03,2.53,-1.1],[.03,.02,-.18],'Malaysia, together');
 const sticker=texture((ctx)=>{ctx.fillStyle='#d9f69f';ctx.fillRect(0,0,512,512);ctx.fillStyle='#416331';ctx.textAlign='center';ctx.font='bold 110px sans-serif';ctx.fillText('SG',256,265);ctx.font='40px sans-serif';ctx.fillText('2026',256,335);});luggage(plane(.53,.53),[1,1,1],[.58,2.63,.61],[0,-.13,-.14],[1,1,1],sticker);
 const tag=texture((ctx)=>{ctx.fillStyle='#f8f7e9';ctx.fillRect(0,0,512,512);ctx.fillStyle='#6e7862';ctx.textAlign='center';ctx.font='bold 70px sans-serif';ctx.fillText('FRANKLIN',256,245);ctx.font='36px sans-serif';ctx.fillText('NEXT CHAPTER',256,315);});luggage(plane(.88,.39),[1,1,1],[-.45,1.17,.61],[0,-.13,-.06],[1,1,1],tag);
 // Three floating tokens move under damped spring forces and repel on collision.
 const tokens=[{p:[-2.85,3.28,.15],v:[0,0,0],home:[-2.85,3.28,.15],color:pal.green,r:.22},{p:[2.98,2.70,.45],v:[0,0,0],home:[2.98,2.70,.45],color:[.94,.78,.58],r:.20},{p:[1.4,3.92,-.7],v:[0,0,0],home:[1.4,3.92,-.7],color:pal.green,r:.14}];for(const t of tokens)t.obj=mesh(sphere(t.r),t.color,t.p);
 mesh(torus(.27,.085),pal.green,[-2.7,.54,-1.40],[Math.PI/2,0,0]);mesh(box(.7,.12,.52,.05),pal.cream,[2.46,.37,-.72],[0,.4,.12]);
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');let active=true,previous=0,raf;
 function frame(ms){raf=requestAnimationFrame(frame);if(!active)return;const dt=Math.min((ms-previous)/1000||.016,.03);previous=ms;const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);gl.viewport(0,0,canvas.width,canvas.height);}gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  if(!reduce.matches)impulse*=.94;else impulse=0;const time=reduce.matches?0:ms/1000;const group=mat([0,0,0],[pitch,angle,0],[1.05,1.05,1.05]);const aspect=w/h;const zoom=aspect>2.4?1.12:1;const vp=camera([7.6*zoom,6.7*zoom,11.0*zoom],[0,1.20,0],aspect);
  for(const t of tokens){for(let j=0;j<3;j++){const target=t.home[j]+(j===1?Math.sin(time*1.05+t.home[0])*.10:0);t.v[j]+=(target-t.p[j])*2.2*dt;t.v[j]*=.97;t.p[j]+=t.v[j]*dt;}}
  for(let i=0;i<tokens.length;i++)for(let j=i+1;j<tokens.length;j++){const a=tokens[i],b=tokens[j],d=a.p.map((v,k)=>v-b.p[k]),dist=Math.hypot(...d);if(dist<a.r+b.r&&dist>.001){const n=norm(d);for(let k=0;k<3;k++){a.v[k]+=n[k]*.07;b.v[k]-=n[k]*.07;}}}
  for(const o of objects){let p=[...o.p],r=[...o.r];if(o.float&&!reduce.matches)p[1]+=Math.sin(time*.8+o.p[0])*.045;if(o.luggage&&!reduce.matches){r[2]+=Math.sin(time*.65)*.015;p[1]+=impulse*.08;}if((o===ball||o.volleyball||o.basketball)&&!reduce.matches)p[1]+=Math.abs(Math.sin(time*.8))*.035;const model=mul(group,mat(p,r,o.s));gl.uniformMatrix4fv(uniforms.uModel,false,model);gl.uniformMatrix4fv(uniforms.uMVP,false,mul(vp,model));gl.uniform3fv(uniforms.uColor,o.color);gl.uniform1f(uniforms.uTextured,o.texture?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,o.texture);gl.uniform1i(uniforms.uTexture,0);gl.bindBuffer(gl.ARRAY_BUFFER,o.buf);for(let i=0;i<3;i++){gl.enableVertexAttribArray(attrs[i]);gl.vertexAttribPointer(attrs[i],i===2?2:3,gl.FLOAT,false,32,i===0?0:i===1?12:24);}gl.drawArrays(gl.TRIANGLES,0,o.count);}
 }
 canvas.addEventListener('pointerdown',e=>{drag=true;travel=0;lastX=e.clientX;lastY=e.clientY;if(e.pointerType==='mouse')canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;travel+=Math.abs(dx)+Math.abs(dy);angle+=dx*.007;pitch=Math.max(-.35,Math.min(.35,pitch+dy*.003));lastX=e.clientX;lastY=e.clientY;});function release(){if(drag&&travel<8){impulse=1;for(const t of tokens){t.v[0]+=(Math.random()-.5)*4;t.v[1]+=2;t.v[2]+=(Math.random()-.5)*3;}}drag=false;}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',()=>drag=false);canvas.addEventListener('pointerleave',()=>drag=false);
 canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();angle+=(e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0);pitch=Math.max(-.35,Math.min(.35,pitch+(e.key==='ArrowUp'?-.08:e.key==='ArrowDown'?.08:0)));}});
 document.querySelector('#scene-reset').onclick=()=>{angle=-.24;pitch=0;impulse=.8;};new IntersectionObserver(([e])=>active=e.isIntersecting,{rootMargin:'100px'}).observe(canvas);document.addEventListener('visibilitychange',()=>active=!document.hidden);frame(0);return ()=>cancelAnimationFrame(raf);
}
