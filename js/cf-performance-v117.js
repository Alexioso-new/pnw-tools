/* CastFlow performance runtime — v117 / v9.17 */
(function(){
'use strict';
var VERSION='v9.17',mode='';try{mode=new URLSearchParams(location.search).get('mode')||'';}catch(e){}
var OPERATOR=!/^(display|stage|remote|youthviews)$/i.test(mode);
var stats={fps:0,frameMs:0,longTasks:0,worstTask:0,at:0},frames=0,last=performance.now(),raf=0;
var parentVisible=true,mediaActive=true,badge=null,badgeObserver=null;
function motion(){try{if(window.PNWYouthViews&&typeof window.PNWYouthViews.motion==='function')return window.PNWYouthViews.motion();}catch(e){}return null;}
function applyMedia(on){
 if(mediaActive===on)return;mediaActive=on;document.documentElement.classList.toggle('cfPreviewSuspended',!on);
 Array.prototype.forEach.call(document.querySelectorAll('#displayScreen video,#projPreview video'),function(v){try{if(on&&v.src){var p=v.play();if(p&&p.catch)p.catch(function(){});}else v.pause();}catch(e){}});
 var m=motion();if(m)try{if(on&&m.start)m.start();else if(!on&&m.stop)m.stop();}catch(e){}
}
function setMedia(on){parentVisible=on!==false;applyMedia(parentVisible&&!document.hidden);}
function ensureBadge(){if(badge&&badge.isConnected)return badge;var bar=document.querySelector('#cfDualCanvas .cfDcToolbar');if(!bar)return null;badge=document.createElement('span');badge.id='cfPerfBadge';badge.className='cfPerfBadge';badge.title='FPS interaksi canvas · long task halaman';badge.textContent='FPS --';bar.appendChild(badge);if(badgeObserver){badgeObserver.disconnect();badgeObserver=null;}return badge;}
function paintBadge(){var b=ensureBadge();if(!b)return;b.textContent=stats.fps+' FPS'+(stats.longTasks?' · '+stats.longTasks+' LT':'');b.classList.toggle('warn',stats.fps>0&&stats.fps<48);b.classList.toggle('bad',stats.fps>0&&stats.fps<30);}
function loop(now){raf=requestAnimationFrame(loop);if(!OPERATOR||document.hidden||!parentVisible){frames=0;last=now;return;}frames++;var elapsed=now-last;if(elapsed>=1000){stats.fps=Math.max(0,Math.round(frames*1000/elapsed));stats.frameMs=frames?Math.round(elapsed/frames*10)/10:0;stats.at=Date.now();frames=0;last=now;paintBadge();try{document.dispatchEvent(new CustomEvent('cf:performance',{detail:getStats()}));}catch(e){}}}
function getStats(){return {fps:stats.fps,frameMs:stats.frameMs,longTasks:stats.longTasks,worstTask:stats.worstTask,at:stats.at};}
if(OPERATOR)try{if(window.PerformanceObserver){var po=new PerformanceObserver(function(list){list.getEntries().forEach(function(x){stats.longTasks++;stats.worstTask=Math.max(stats.worstTask,Math.round(x.duration));});});po.observe({entryTypes:['longtask']});}}catch(e){}
window.addEventListener('message',function(e){var d=e&&e.data;if(d&&d.type==='cf:previewVisibility')setMedia(d.visible!==false);});
document.addEventListener('visibilitychange',function(){applyMedia(parentVisible&&!document.hidden);});
if(OPERATOR){badgeObserver=new MutationObserver(ensureBadge);if(document.documentElement)badgeObserver.observe(document.documentElement,{childList:true,subtree:true});ensureBadge();raf=requestAnimationFrame(loop);}
window.CastFlowPerformance={version:VERSION,getStats:getStats,setRichMediaActive:setMedia,reset:function(){stats.longTasks=0;stats.worstTask=0;stats.fps=0;paintBadge();}};
})();
