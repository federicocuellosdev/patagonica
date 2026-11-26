/* Agregados de Rincón del Lago (fuera de la plantilla): video, fotos por cabaña y bloque Comercializa. */
(function(){
  var P = window.PROYECTO, VID = '1Gg5Neb9kFd02GHdOxGoGgezWLSxb3XxI';
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
  function video(){
    var ref = document.querySelector('section.dif'); if(!ref || document.getElementById('video')) return;
    var s = document.createElement('section'); s.id='video'; s.className='oscura';
    s.innerHTML = '<div class="wrap"><p class="eyebrow">Recorrido</p><h2>Conocé el complejo <em>en movimiento.</em></h2>'
      + '<div style="position:relative;margin-top:28px;aspect-ratio:16/9;border-radius:var(--radio);overflow:hidden;box-shadow:var(--sombra);background:#000">'
      + '<iframe src="https://drive.google.com/file/d/'+VID+'/preview" title="Video de Rincón del Lago" allow="autoplay; fullscreen" allowfullscreen loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe></div></div>';
    ref.parentNode.insertBefore(s, ref.nextSibling);
  }
  function fotos(){
    var us = (P.explorador&&P.explorador.niveles||[]).reduce(function(a,n){return a.concat(n.unidades);},[]);
    us.forEach(function(u){
      var art = document.getElementById(u.id); if(!art || !u.fotos || art.querySelector('.uf-fotos')) return;
      var d = document.createElement('div'); d.className='uf-fotos';
      d.innerHTML = '<div class="pista">'+u.fotos.map(function(f,i){return '<img src="'+esc(f)+'" alt="'+esc(u.nombre)+' · foto '+(i+1)+'" loading="lazy" data-lb="'+esc(f)+'">';}).join('')+'</div>'
        + (u.fotos.length>1?'<button class="a" aria-label="Foto anterior">←</button><button class="s" aria-label="Foto siguiente">→</button>':'')
        + '<span class="cont">1 / '+u.fotos.length+'</span>';
      art.insertBefore(d, art.firstChild);
      var pista = d.querySelector('.pista'), cont = d.querySelector('.cont');
      var ir = function(k){ pista.scrollBy({left:k*pista.clientWidth,behavior:'smooth'}); };
      if(u.fotos.length>1){ d.querySelector('.a').onclick=function(){ir(-1);}; d.querySelector('.s').onclick=function(){ir(1);}; }
      pista.addEventListener('scroll',function(){ cont.textContent=(Math.round(pista.scrollLeft/pista.clientWidth)+1)+' / '+u.fotos.length; },{passive:true});
    });
  }
  function equipo(){
    var sec = document.getElementById('equipo'); if(!sec || !P.comercializa) return;
    sec.querySelector('.wrap').innerHTML = '<div class="comer"><p class="eyebrow">Comercializa</p><img src="img/patagonica-color.png" alt="Patagónica Propiedades">'
      + '<div class="agentes">'+P.comercializa.map(function(a){return '<div class="ag"><strong>'+esc(a.nombre)+'</strong><a href="https://wa.me/'+esc(a.whatsapp)+'?text='+encodeURIComponent('Hola, quiero información sobre '+P.nombre+'.')+'" target="_blank" rel="noopener">WhatsApp '+esc(a.tel)+'</a></div>';}).join('')+'</div></div>';
  }
  function todo(){ video(); fotos(); equipo(); }
  function iniciar(){ todo(); new MutationObserver(function(){ fotos(); }).observe(document.body,{childList:true,subtree:true}); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(iniciar,0);}); else setTimeout(iniciar,0);
})();
