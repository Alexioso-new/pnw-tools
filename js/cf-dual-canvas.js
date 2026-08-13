/* CastFlow Dual Free Canvas — v116 / v9.16 */
(function(){
'use strict';
var VERSION='v9.16', KEY='pnwCastflowDualCanvas.v1', MIN=.12, MAX=3, HEAD=30;
var qmode=''; try{qmode=new URLSearchParams(location.search).get('mode')||'';}catch(e){}
/* Cegah iframe output membuat canvas/iframe rekursif. */
if(/^(display|stage|remote)$/i.test(qmode)) return;
var stage,root,view,world,menu,help,zoomLabel,mini,empty,editMark,liveMark,state;
var active=false,selected='',spaceDown=false,op=null,saveTimer=0,miniRaf=0,fresh=false;
function id(x){return document.getElementById(x);}
function clamp(v,a,b){v=Number(v);if(!isFinite(v))v=a;return Math.max(a,Math.min(b,v));}
function uid(t){return (t||'dc')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
var TYPES={
 edit:{label:'Edit Preview',short:'EDIT',src:'',icon:'✎'},
 live:{label:'Live Output',short:'LIVE',src:'./castflow.html?mode=display&embed=1',icon:'●'},
 stage:{label:'Stage Display',short:'STAGE',src:'./castflow.html?mode=stage&embed=1',icon:'▣'},
 remote:{label:'Remote Control',short:'REMOTE',src:'./castflow.html?mode=remote&embed=1',icon:'⌁'},
 browser:{label:'Browser / URL',short:'WEB',src:'about:blank',icon:'◎'}
};
function info(t){return TYPES[t]||TYPES.browser;}
function cleanSrc(src,type){
 if(type!=='browser') return info(type).src;
 src=String(src||'about:blank').trim();
 if(src==='about:blank')return src;
 try{var u=new URL(src,location.href);if(u.protocol==='http:'||u.protocol==='https:'||u.protocol==='file:')return u.href;}catch(e){}
 return 'about:blank';
}
function node(type,x){x=x||{};var inf=info(type);return {
 id:String(x.id||uid(type)).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,100),type:type,
 title:String(x.title||inf.label).slice(0,80),src:cleanSrc(x.src||inf.src,type),
 x:clamp(x.x==null?0:x.x,-100000,100000),y:clamp(x.y==null?0:x.y,-100000,100000),
 w:clamp(x.w==null?640:x.w,240,2600),h:clamp(x.h==null?390:x.h,165,1800),
 z:clamp(x.z==null?1:x.z,1,99999),locked:!!x.locked,ratio:x.ratio!==false};}
function defaults(){return {view:{x:70,y:58,zoom:.72},grid:true,nodes:[node('edit',{id:'dc-edit',x:40,y:70,z:1}),node('live',{id:'dc-live',x:740,y:70,z:2})]};}
function sanitize(raw){
 if(!raw||typeof raw!=='object')return defaults();
 var out={view:{x:clamp(raw.view&&raw.view.x,-100000,100000),y:clamp(raw.view&&raw.view.y,-100000,100000),zoom:clamp(raw.view&&raw.view.zoom,MIN,MAX)},grid:raw.grid!==false,nodes:[]},hasEdit=false;
 if(Array.isArray(raw.nodes))raw.nodes.slice(0,40).forEach(function(n,i){
  if(!n||!TYPES[n.type]||(n.type==='edit'&&hasEdit))return;if(n.type==='edit')hasEdit=true;
  out.nodes.push(node(n.type,{id:n.id,title:n.title,src:n.src,x:n.x,y:n.y,w:n.w,h:n.h,z:n.z==null?i+1:n.z,locked:n.locked,ratio:n.ratio}));
 });
 return out;
}
function load(){try{var r=localStorage.getItem(KEY);fresh=!r;return sanitize(r?JSON.parse(r):null);}catch(e){fresh=true;return defaults();}}
function snapshot(){try{return JSON.parse(JSON.stringify(state));}catch(e){return state;}}
function save(){if(!state)return;try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}try{document.dispatchEvent(new CustomEvent('cf:dualCanvasChanged',{detail:snapshot()}));}catch(e){}}
function saveSoon(){clearTimeout(saveTimer);saveTimer=setTimeout(save,100);}
function find(nid){for(var i=0;i<state.nodes.length;i++)if(state.nodes[i].id===nid)return state.nodes[i];return null;}
function topZ(){var z=0;state.nodes.forEach(function(n){z=Math.max(z,n.z||0);});return z;}
function marker(n,name){if(!n||!n.parentNode)return null;var m=document.createComment('cf-dual-'+name);n.parentNode.insertBefore(m,n);return m;}
function restoreOne(n,m){if(n&&m&&m.parentNode&&(n.parentNode!==m.parentNode||n.previousSibling!==m))m.parentNode.insertBefore(n,m.nextSibling);}
function restore(){restoreOne(id('projPreview'),editMark);restoreOne(id('cfLiveFrame'),liveMark);}
function iframe(src,title){var f=document.createElement('iframe');f.className='cfDcIframe';f.title=title;f.src=src;f.loading='lazy';f.setAttribute('allow','autoplay; fullscreen; clipboard-read; clipboard-write');return f;}
function styleNode(n){if(!world)return;var b=world.querySelector('[data-dc-id="'+n.id+'"]');if(!b)return;b.style.left=n.x+'px';b.style.top=n.y+'px';b.style.width=n.w+'px';b.style.height=n.h+'px';b.style.zIndex=n.z;b.classList.toggle('is-selected',selected===n.id);b.classList.toggle('is-locked',n.locked);var r=b.querySelector('[data-act="ratio"]');if(r)r.classList.toggle('on',n.ratio);var l=b.querySelector('[data-act="lock"]');if(l)l.textContent=n.locked?'🔒':'♢';scheduleMini();}
function render(){
 if(!world)return;restore();world.innerHTML='';var usedEdit=false,usedLive=false;
 state.nodes.slice().sort(function(a,b){return a.z-b.z;}).forEach(function(n){var inf=info(n.type),b=document.createElement('section');
  b.className='cfDcFrame cfDcType-'+n.type+(selected===n.id?' is-selected':'');b.dataset.dcId=n.id;b.tabIndex=0;
  b.innerHTML='<header class="cfDcFrameHead"><span class="cfDcTypeChip">'+esc(inf.short)+'</span><span class="cfDcFrameTitle" title="Double-click untuk ubah nama">'+esc(n.title)+'</span><span class="cfDcFrameOps"><button data-act="ratio" title="Kunci rasio 16:9">16:9</button><button data-act="lock" title="Kunci frame">♢</button><button data-act="front" title="Bawa ke depan">↑</button>'+(n.type==='edit'?'':'<button data-act="duplicate" title="Duplikat">⧉</button>')+'<button data-act="pop" title="Buka jendela">↗</button><button data-act="remove" title="Keluarkan">×</button></span></header><div class="cfDcFrameBody"></div><span class="cfDcResize" title="Resize"></span>';
  world.appendChild(b);var body=b.querySelector('.cfDcFrameBody');
  if(n.type==='edit'&&!usedEdit&&id('projPreview')){body.appendChild(id('projPreview'));usedEdit=true;}
  else if(n.type==='live'&&!usedLive&&id('cfLiveFrame')){body.appendChild(id('cfLiveFrame'));usedLive=true;}
  else body.appendChild(iframe(n.src||inf.src,n.title));styleNode(n);
 });
 empty.hidden=state.nodes.length>0;syncMenu();renderMini();
}
function select(nid){selected=find(nid)?nid:'';if(world)Array.prototype.forEach.call(world.querySelectorAll('.cfDcFrame'),function(b){b.classList.toggle('is-selected',b.dataset.dcId===selected);});renderMini();}
function centerPoint(w,h){var r=view.getBoundingClientRect();return {x:(r.width/2-state.view.x)/state.view.zoom-w/2,y:(r.height/2-state.view.y)/state.view.zoom-h/2};}
function add(type,x){x=x||{};if(!TYPES[type])return '';
 if(type==='edit'){var old=state.nodes.filter(function(n){return n.type==='edit';})[0];if(old){select(old.id);center(old.id);return old.id;}}
 var w=clamp(x.w==null?640:x.w,240,2600),h=clamp(x.h==null?390:x.h,165,1800),p=centerPoint(w,h);
 var n=node(type,{title:x.title,src:x.src,x:x.x==null?p.x+state.nodes.length*18:x.x,y:x.y==null?p.y+state.nodes.length*18:x.y,w:w,h:h,z:topZ()+1,ratio:x.ratio});state.nodes.push(n);selected=n.id;render();save();return n.id;
}
function remove(nid){var k=state.nodes.length;state.nodes=state.nodes.filter(function(n){return n.id!==nid;});if(k===state.nodes.length)return false;if(selected===nid)selected='';render();save();return true;}
function duplicate(nid){var n=find(nid);if(!n||n.type==='edit')return '';return add(n.type,{title:n.title+' Copy',src:n.src,x:n.x+42,y:n.y+42,w:n.w,h:n.h,ratio:n.ratio});}
function front(nid){var n=find(nid);if(!n)return;n.z=topZ()+1;styleNode(n);saveSoon();}
function center(nid){var n=find(nid);if(!n)return;var r=view.getBoundingClientRect();state.view.x=r.width/2-(n.x+n.w/2)*state.view.zoom;state.view.y=r.height/2-(n.y+n.h/2)*state.view.zoom;applyView();saveSoon();}
function fit(persist){
 var r=view.getBoundingClientRect();if(!state.nodes.length){state.view={x:60,y:60,zoom:1};applyView();if(persist!==false)saveSoon();return;}
 var a=Infinity,b=Infinity,c=-Infinity,d=-Infinity;state.nodes.forEach(function(n){a=Math.min(a,n.x);b=Math.min(b,n.y);c=Math.max(c,n.x+n.w);d=Math.max(d,n.y+n.h);});var bw=c-a,bh=d-b,z=clamp(Math.min((r.width-100)/bw,(r.height-100)/bh),MIN,1.5);state.view.zoom=z;state.view.x=(r.width-bw*z)/2-a*z;state.view.y=(r.height-bh*z)/2-b*z;applyView();if(persist!==false)saveSoon();
}
function actual(){var r=view.getBoundingClientRect(),old=state.view.zoom,cx=(r.width/2-state.view.x)/old,cy=(r.height/2-state.view.y)/old;state.view.zoom=1;state.view.x=r.width/2-cx;state.view.y=r.height/2-cy;applyView();saveSoon();}
function zoomAt(cx,cy,z){var r=view.getBoundingClientRect(),px=cx-r.left,py=cy-r.top,old=state.view.zoom,wx=(px-state.view.x)/old,wy=(py-state.view.y)/old;z=clamp(z,MIN,MAX);state.view.zoom=z;state.view.x=px-wx*z;state.view.y=py-wy*z;applyView();saveSoon();}
function applyView(){if(!world)return;world.style.transform='translate('+state.view.x+'px,'+state.view.y+'px) scale('+state.view.zoom+')';zoomLabel.textContent=Math.round(state.view.zoom*100)+'%';root.classList.toggle('no-grid',!state.grid);view.style.setProperty('--dc-small',Math.max(6,20*state.view.zoom)+'px');view.style.setProperty('--dc-big',Math.max(30,100*state.view.zoom)+'px');view.style.setProperty('--dc-x',state.view.x+'px');view.style.setProperty('--dc-y',state.view.y+'px');scheduleMini();}
function scheduleMini(){if(miniRaf)return;miniRaf=requestAnimationFrame(function(){miniRaf=0;renderMini();});}
function renderMini(){if(!mini||!state)return;mini.innerHTML='';if(!state.nodes.length)return;var vr=view.getBoundingClientRect(),vx=-state.view.x/state.view.zoom,vy=-state.view.y/state.view.zoom,vw=vr.width/state.view.zoom,vh=vr.height/state.view.zoom,a=vx,b=vy,c=vx+vw,d=vy+vh;state.nodes.forEach(function(n){a=Math.min(a,n.x);b=Math.min(b,n.y);c=Math.max(c,n.x+n.w);d=Math.max(d,n.y+n.h);});a-=40;b-=40;c+=40;d+=40;var sc=Math.min((mini.clientWidth||150)/(c-a),(mini.clientHeight||92)/(d-b));state.nodes.forEach(function(n){var m=document.createElement('i');m.className='cfDcMiniNode'+(n.id===selected?' on':'');m.style.cssText='left:'+((n.x-a)*sc)+'px;top:'+((n.y-b)*sc)+'px;width:'+Math.max(3,n.w*sc)+'px;height:'+Math.max(2,n.h*sc)+'px';mini.appendChild(m);});var v=document.createElement('b');v.className='cfDcMiniView';v.style.cssText='left:'+((vx-a)*sc)+'px;top:'+((vy-b)*sc)+'px;width:'+Math.max(4,vw*sc)+'px;height:'+Math.max(3,vh*sc)+'px';mini.appendChild(v);}
function syncMenu(){var e=state.nodes.some(function(n){return n.type==='edit';}),b=menu.querySelector('[data-add="edit"]');b.disabled=e;b.title=e?'Edit Preview sudah ada':'';}
function normalUrl(s){s=String(s||'').trim();if(!s)return '';try{if(!/^[a-z][a-z0-9+.-]*:/i.test(s))s=/^[./]/.test(s)?new URL(s,location.href).href:'https://'+s;var u=new URL(s,location.href);return (u.protocol==='http:'||u.protocol==='https:')?u.href:'';}catch(e){return '';}}
function reset(){state=defaults();selected='';render();requestAnimationFrame(function(){fit(true);});save();}
function maximize(force){var on=force==null?!stage.classList.contains('cfDcMax'):!!force;stage.classList.toggle('cfDcMax',on);root.querySelector('[data-tool="max"]').classList.toggle('on',on);setTimeout(applyView,40);}
function pop(n){if(n.type==='edit'){var b=id('cfPopBtn');if(b)b.click();return;}try{window.open((n.src||info(n.type).src).replace(/([?&])embed=1(&|$)/,'$1').replace(/[?&]$/,''),'_blank','noopener');}catch(e){}}
function action(a,nid){var n=find(nid);if(!n)return;if(a==='remove')remove(nid);else if(a==='duplicate')duplicate(nid);else if(a==='front')front(nid);else if(a==='pop')pop(n);else if(a==='lock'){n.locked=!n.locked;styleNode(n);save();}else if(a==='ratio'){n.ratio=!n.ratio;styleNode(n);save();}}
function pointerDown(e){if(!active||e.button>1)return;var t=e.target,box=t.closest&&t.closest('.cfDcFrame'),nid=box&&box.dataset.dcId,resize=t.closest&&t.closest('.cfDcResize'),head=t.closest&&t.closest('.cfDcFrameHead');
 if(spaceDown||e.button===1){op={kind:'pan',pid:e.pointerId,sx:e.clientX,sy:e.clientY,x:state.view.x,y:state.view.y};root.classList.add('is-panning');e.preventDefault();return;}
 if(resize&&nid){var rn=find(nid);if(!rn||rn.locked)return;select(nid);front(nid);op={kind:'resize',pid:e.pointerId,id:nid,sx:e.clientX,sy:e.clientY,w:rn.w,h:rn.h};root.classList.add('is-resizing');e.preventDefault();return;}
 if(head&&nid&&!(t.closest&&t.closest('button'))){var dn=find(nid);select(nid);front(nid);if(!dn||dn.locked)return;op={kind:'drag',pid:e.pointerId,id:nid,sx:e.clientX,sy:e.clientY,x:dn.x,y:dn.y};root.classList.add('is-dragging');e.preventDefault();return;}
 if(box&&nid){select(nid);return;}if(t===view||t===world||t===empty){select('');op={kind:'pan',pid:e.pointerId,sx:e.clientX,sy:e.clientY,x:state.view.x,y:state.view.y};root.classList.add('is-panning');e.preventDefault();}}
function pointerMove(e){if(!op||e.pointerId!==op.pid)return;var dx=e.clientX-op.sx,dy=e.clientY-op.sy;if(op.kind==='pan'){state.view.x=op.x+dx;state.view.y=op.y+dy;applyView();}else if(op.kind==='drag'){var n=find(op.id);n.x=op.x+dx/state.view.zoom;n.y=op.y+dy/state.view.zoom;if(e.shiftKey){n.x=Math.round(n.x/10)*10;n.y=Math.round(n.y/10)*10;}styleNode(n);}else{var r=find(op.id),nw=clamp(op.w+dx/state.view.zoom,240,2600),nh=clamp(op.h+dy/state.view.zoom,165,1800);if(r.ratio&&!e.altKey)nh=clamp(nw*9/16+HEAD,165,1800);r.w=nw;r.h=nh;styleNode(r);}e.preventDefault();}
function pointerEnd(e){if(!op||(e.pointerId!=null&&e.pointerId!==op.pid))return;op=null;root.classList.remove('is-panning','is-dragging','is-resizing');save();}
function targetInput(e){var t=e.target,tag=((t&&t.tagName)||'').toLowerCase();return tag==='input'||tag==='textarea'||tag==='select'||(t&&t.isContentEditable);}
function keyDown(e){if(!active||targetInput(e))return;var k=(e.key||'').toLowerCase(),n;if(e.key===' '||e.code==='Space'){spaceDown=true;root.classList.add('is-space');e.preventDefault();e.stopImmediatePropagation();return;}if(e.key==='Escape'){if(stage.classList.contains('cfDcMax'))maximize(false);else{menu.hidden=true;help.hidden=true;select('');}e.preventDefault();e.stopImmediatePropagation();return;}if((e.ctrlKey||e.metaKey)&&k==='d'&&selected){duplicate(selected);e.preventDefault();e.stopImmediatePropagation();return;}if(k==='0'){fit(true);e.preventDefault();e.stopImmediatePropagation();return;}if(k==='1'){actual();e.preventDefault();e.stopImmediatePropagation();return;}if(e.key==='Delete'||e.key==='Backspace'){if(selected)remove(selected);e.preventDefault();e.stopImmediatePropagation();return;}if(/^Arrow/.test(e.key)){n=find(selected);var d=e.shiftKey?10:1;if(n&&!n.locked){if(e.key==='ArrowLeft')n.x-=d;if(e.key==='ArrowRight')n.x+=d;if(e.key==='ArrowUp')n.y-=d;if(e.key==='ArrowDown')n.y+=d;styleNode(n);}else{if(e.key==='ArrowLeft')state.view.x+=36;if(e.key==='ArrowRight')state.view.x-=36;if(e.key==='ArrowUp')state.view.y+=36;if(e.key==='ArrowDown')state.view.y-=36;applyView();}saveSoon();e.preventDefault();e.stopImmediatePropagation();}}
function keyUp(e){if(e.key===' '||e.code==='Space'){spaceDown=false;if(root)root.classList.remove('is-space');}}
function wheel(e){if(!active)return;e.preventDefault();if(e.ctrlKey||e.metaKey||e.altKey)zoomAt(e.clientX,e.clientY,state.view.zoom*Math.exp(-e.deltaY*.002));else{state.view.x-=e.deltaX;state.view.y-=e.deltaY;applyView();saveSoon();}}
function toolbar(e){var b=e.target.closest&&e.target.closest('[data-tool]');if(!b)return;var a=b.dataset.tool,r=view.getBoundingClientRect();if(a==='add'){menu.hidden=!menu.hidden;help.hidden=true;}else if(a==='zin')zoomAt(r.left+r.width/2,r.top+r.height/2,state.view.zoom*1.2);else if(a==='zout')zoomAt(r.left+r.width/2,r.top+r.height/2,state.view.zoom/1.2);else if(a==='fit')fit(true);else if(a==='actual')actual();else if(a==='grid'){state.grid=!state.grid;b.classList.toggle('on',state.grid);applyView();save();}else if(a==='reset')reset();else if(a==='max')maximize();else if(a==='help'){help.hidden=!help.hidden;menu.hidden=true;}e.preventDefault();}
function activate(){if(!root||active)return;active=true;root.hidden=false;stage.classList.add('cfDcMode');render();applyView();if(fresh){fresh=false;requestAnimationFrame(function(){fit(true);});}}
function deactivate(){if(!root||!active)return;active=false;spaceDown=false;op=null;root.hidden=true;stage.classList.remove('cfDcMode','cfDcMax');restore();menu.hidden=true;help.hidden=true;}
function setActive(on){if(on)activate();else deactivate();}
function build(){stage=id('cfPrevStage');var edit=id('projPreview'),live=id('cfLiveFrame');if(!stage||!edit||!live||id('cfDualCanvas'))return false;editMark=marker(edit,'edit');liveMark=marker(live,'live');state=load();root=document.createElement('div');root.id='cfDualCanvas';root.className='cfDualCanvas';root.hidden=true;root.innerHTML='<div class="cfDcToolbar"><button class="primary" data-tool="add">＋ Output</button><i></i><button data-tool="zout">−</button><button class="zoom" data-tool="actual">100%</button><button data-tool="zin">＋</button><button data-tool="fit">Fit</button><i></i><button class="on" data-tool="grid">Grid</button><button data-tool="reset">Reset</button><button data-tool="max">⛶</button><button data-tool="help">?</button><span>Drag kosong = pan · Ctrl/⌘ + wheel = zoom</span></div><div class="cfDcViewport" tabindex="0"><div class="cfDcWorld"></div><div class="cfDcEmpty" hidden><b>Canvas kosong</b><small>Gunakan + Output untuk menambahkan layar.</small></div><div class="cfDcMini" title="Klik untuk Fit"></div></div><div class="cfDcMenu" hidden><b>Tambah output</b><button data-add="edit">✎ Edit Preview</button><button data-add="live">● Live Output</button><button data-add="stage">▣ Stage Display</button><button data-add="remote">⌁ Remote Control</button><label>Browser / URL</label><div><input id="cfDcUrl" placeholder="https://…"><button id="cfDcUrlAdd">Tambah</button></div></div><div class="cfDcHelp" hidden><b>Dual Free Canvas</b><span><kbd>Space</kbd> + drag / area kosong — Pan</span><span><kbd>Ctrl/⌘</kbd> + wheel — Zoom</span><span><kbd>Arrow</kbd> 1 px · <kbd>Shift</kbd> 10 px</span><span><kbd>Ctrl/⌘ D</kbd> Duplikat · <kbd>Delete</kbd> Keluarkan</span><span><kbd>0</kbd> Fit · <kbd>1</kbd> 100% · <kbd>Esc</kbd> keluar</span><small>Alt saat resize melepas rasio sementara.</small></div>';
 stage.appendChild(root);view=root.querySelector('.cfDcViewport');world=root.querySelector('.cfDcWorld');menu=root.querySelector('.cfDcMenu');help=root.querySelector('.cfDcHelp');zoomLabel=root.querySelector('.zoom');mini=root.querySelector('.cfDcMini');empty=root.querySelector('.cfDcEmpty');
 root.querySelector('.cfDcToolbar').onclick=toolbar;root.addEventListener('pointerdown',pointerDown);root.addEventListener('pointermove',pointerMove);root.addEventListener('pointerup',pointerEnd);root.addEventListener('pointercancel',pointerEnd);view.addEventListener('wheel',wheel,{passive:false});mini.onclick=function(){fit(true);};
 world.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-act]'),b=e.target.closest&&e.target.closest('.cfDcFrame');if(a&&b){action(a.dataset.act,b.dataset.dcId);e.preventDefault();e.stopPropagation();}});
 world.addEventListener('dblclick',function(e){var t=e.target.closest&&e.target.closest('.cfDcFrameTitle'),b=e.target.closest&&e.target.closest('.cfDcFrame');if(!t||!b)return;var n=find(b.dataset.dcId),v=prompt('Nama frame',n.title);if(v&&v.trim()){n.title=v.trim().slice(0,80);t.textContent=n.title;save();}});
 menu.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-add]');if(b&&!b.disabled){add(b.dataset.add);menu.hidden=true;}if(e.target.id==='cfDcUrlAdd'){var inp=id('cfDcUrl'),u=normalUrl(inp.value);if(!u){inp.classList.add('bad');return;}add('browser',{title:inp.value,src:u,ratio:false});inp.value='';menu.hidden=true;}});
 document.addEventListener('keydown',keyDown,true);document.addEventListener('keyup',keyUp,true);window.addEventListener('blur',function(){spaceDown=false;if(root)root.classList.remove('is-space');});window.addEventListener('resize',function(){if(active)applyView();});new MutationObserver(function(){setActive(stage.dataset.previewMode==='dual');}).observe(stage,{attributes:true,attributeFilter:['data-preview-mode']});setActive(stage.dataset.previewMode==='dual');return true;}
function boot(){var n=0,t=setInterval(function(){if(build()||++n>80)clearInterval(t);},100);}
window.CastFlowDualCanvas={version:VERSION,setActive:setActive,isActive:function(){return active;},add:add,remove:remove,duplicate:duplicate,select:select,fit:fit,actualSize:actual,reset:reset,centerOn:center,getState:snapshot,save:save,render:render};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
