
(function(){
'use strict';
function ready(f){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',f,{once:true}):f();}
ready(function(){
document.querySelectorAll('.sidebar,.chat-panel,.panel,.card,.composer').forEach(e=>e.classList.add('wc-floating-surface'));
document.addEventListener('click',e=>{
 const t=e.target.closest('button,.btn,.button');
 if(!t)return;
 const r=document.createElement('span');
 r.className='wc-ripple';
 t.appendChild(r);
 setTimeout(()=>r.remove(),700);
});
console.log('World Class Experience Layer active');
});
})();
