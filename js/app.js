/* wojskowe.com.pl - koncepcja sklepu (wersja demonstracyjna, bez wysylki danych) */
(function(){
'use strict';
var D=window.SKLEP, P=D.p, C=D.cats;
var byId={}; P.forEach(function(p){byId[p.id]=p});
var catBy={}; C.forEach(function(c){catBy[c.slug]=c});
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var main=$('#tresc');
var KROTKIE={'stopnie':'Stopnie i pochewki','nakrycia-glowy':'Nakrycia głowy','gapy-odznaki':'Gapy i odznaki','kordziki':'Kordziki','emblematy':'Emblematy','koszule-swetry':'Koszule i swetry','galanteria':'Galanteria','obuwie':'Obuwie','pamiatki':'Pamiątki'};
var DOSTAWY=[
  {id:'inpost',n:'InPost Paczkomat 24/7',o:'Odbiór w wybranym paczkomacie',c:14.99},
  {id:'kurier',n:'Kurier',o:'Dostawa pod wskazany adres',c:17.99},
  {id:'deblin',n:'Odbiór osobisty w Dęblinie',o:'ul. Bankowa 24',c:0},
  {id:'ryki',n:'Odbiór osobisty w Rykach',o:'ul. Poniatowskiego 39, obok apteki',c:0}
];
var PLATNOSCI=[
  {id:'blik',n:'BLIK',o:'Kod z aplikacji banku'},
  {id:'p24',n:'Przelewy24',o:'Szybki przelew z Twojego banku'},
  {id:'karta',n:'Karta płatnicza',o:'Visa, Mastercard'},
  {id:'przelew',n:'Przelew tradycyjny',o:'Wysyłka po zaksięgowaniu wpłaty'}
];

/* ---------- pomocnicze ---------- */
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function zl(v){return v.toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2})+' zł'}
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ł/g,'l')}
function img(id,big){return 'img/'+(big?'c':'t')+'/'+id+'.webp'}
function plural(n,a,b,c){if(n===1)return a;var d=n%10,e=n%100;return (d>=2&&d<=4&&(e<12||e>14))?b:c}
var strz='<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M5 2l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';
var strzL='<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M9 2 4 7l5 5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';
var znak='<svg viewBox="0 0 28 40" aria-hidden="true"><path d="M2 9 14 2l12 7v29H2z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="14" cy="10.5" r="2.1" fill="currentColor"/><rect x="6" y="20" width="16" height="3.4" fill="currentColor"/><rect x="6" y="27" width="16" height="3.4" fill="currentColor"/></svg>';

/* ---------- pamiec (localStorage w try/catch) ---------- */
var mem={};
function lsGet(k){try{var v=localStorage.getItem(k);return v===null?mem[k]||null:v}catch(e){return mem[k]||null}}
function lsSet(k,v){mem[k]=v;try{localStorage.setItem(k,v)}catch(e){}}
var KEY='wojskowe_koszyk_v1';
var cart=[];
try{cart=JSON.parse(lsGet(KEY)||'[]');if(!Array.isArray(cart))cart=[]}catch(e){cart=[]}
cart=cart.filter(function(i){return i&&byId[i.id]&&i.q>0});
function save(){lsSet(KEY,JSON.stringify(cart));odswiezLicznik()}
function cartCount(){return cart.reduce(function(s,i){return s+i.q},0)}
function cartSum(){return cart.reduce(function(s,i){return s+i.q*i.pr},0)}
function addToCart(id,opts,q,pr){
  var k=id+'|'+JSON.stringify(opts||{});
  var it=cart.filter(function(i){return i.k===k})[0];
  if(it)it.q=Math.min(99,it.q+q);else cart.push({k:k,id:id,o:opts||{},q:q,pr:pr});
  save();
}
function odswiezLicznik(){
  var el=$('#kb-licznik'),n=cartCount();
  if(el.textContent!==String(n)){el.textContent=n;el.classList.remove('puls');void el.offsetWidth;el.classList.add('puls')}
}
var tt;
function toast(t){var e=$('#toast');e.textContent=t;e.classList.add('widac');clearTimeout(tt);tt=setTimeout(function(){e.classList.remove('widac')},2200)}

/* ---------- menu ---------- */
function budujMenu(){
  $('#menu-lista').innerHTML=C.map(function(c){return '<li><a href="#/k/'+c.slug+'" data-k="'+c.slug+'">'+KROTKIE[c.slug]+'</a></li>'}).join('');
  $('#menu-mob-lista').innerHTML=C.map(function(c){return '<li><a href="#/k/'+c.slug+'" data-k="'+c.slug+'">'+esc(c.name)+' <small>'+c.n+'</small></a></li>'}).join('');
  $('#stopka-kat').innerHTML=C.slice(0,6).map(function(c){return '<li><a href="#/k/'+c.slug+'">'+esc(c.name)+'</a></li>'}).join('');
}
function aktywneMenu(slug){$$('.menu a,.menu-mob a').forEach(function(a){a.classList.toggle('akt',a.getAttribute('data-k')===slug);if(a.getAttribute('data-k')===slug)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})}
var burger=$('#burger'),mm=$('#menu-mob');
function menuMob(o){mm.hidden=!o;burger.setAttribute('aria-expanded',o?'true':'false')}
burger.addEventListener('click',function(){menuMob(mm.hidden)});
mm.addEventListener('click',function(e){if(e.target===mm||e.target.closest('a'))menuMob(false)});

/* ---------- karta produktu (listing) ---------- */
function galeria(p,big){
  var n=p.im.length;
  var h='<div class="gal" data-n="'+n+'" tabindex="'+(n>1?0:-1)+'" aria-label="Zdjęcia: '+esc(p.n)+'">'+p.im.map(function(id,i){return '<img src="'+img(id,big)+'" alt="'+esc(p.n)+(n>1?' - zdjęcie '+(i+1):'')+'" '+(i||!big?'loading="lazy" ':'')+'decoding="async" width="600" height="600" draggable="false">'}).join('')+'</div>';
  if(n>1)h+='<span class="gal-licz">1 / '+n+'</span><button class="gal-str l" type="button" aria-label="Poprzednie zdjęcie">'+strzL+'</button><button class="gal-str p" type="button" aria-label="Następne zdjęcie">'+strz+'</button>';
  return h;
}
function karta(p){
  var wym=p.o.some(function(o){return o.t==='s'||!/Haft/.test(o.l)});
  return '<article class="karta"><a class="karta-link" href="#/p/'+p.id+'" aria-label="'+esc(p.n)+'"></a>'+
  '<div class="karta-foto">'+galeria(p,false)+'</div>'+
  '<div class="karta-tresc"><h3 class="karta-n">'+esc(p.n)+'</h3>'+(p.u?'<span class="karta-u">'+esc(p.u)+'</span>':'')+
  '<div class="karta-dol"><span class="cena">'+zl(p.pr)+'</span>'+
  (wym?'<a class="btn btn-obrys karta-kup" href="#/p/'+p.id+'">Wybierz</a>':'<button class="btn btn-ciemny karta-kup" type="button" data-dodaj="'+p.id+'">Do koszyka</button>')+
  '</div></div></article>';
}

/* galerie: swipe palcem (natywny scroll), przeciaganie mysza, strzalki, licznik */
function initGal(root){
  $$('.gal',root).forEach(function(g){
    if(g._ok)return;g._ok=1;
    var n=+g.getAttribute('data-n');if(n<2)return;
    var box=g.parentNode,licz=$('.gal-licz',box);
    function idx(){return Math.round(g.scrollLeft/g.clientWidth)}
    function idz(i){i=Math.max(0,Math.min(n-1,i));g.scrollTo({left:i*g.clientWidth,behavior:'smooth'})}
    var raf;g.addEventListener('scroll',function(){cancelAnimationFrame(raf);raf=requestAnimationFrame(function(){var i=idx();if(licz)licz.textContent=(i+1)+' / '+n;g.dispatchEvent(new CustomEvent('galidx',{detail:i}))})},{passive:true});
    var l=$('.gal-str.l',box),p=$('.gal-str.p',box);
    if(l)l.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();idz(idx()-1)});
    if(p)p.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();idz(idx()+1)});
    g.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();idz(idx()+1)}if(e.key==='ArrowLeft'){e.preventDefault();idz(idx()-1)}});
    var sx=0,sl=0,drag=false,moved=false;
    g.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')return;drag=true;moved=false;sx=e.clientX;sl=g.scrollLeft;g.classList.add('ciag')});
    window.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-sx;if(Math.abs(dx)>4)moved=true;g.scrollLeft=sl-dx});
    window.addEventListener('pointerup',function(){if(!drag)return;drag=false;g.classList.remove('ciag');var i=Math.round(g.scrollLeft/g.clientWidth);g.scrollLeft=g.scrollLeft;idz(i)});
    g.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();moved=false;return}
      var k=g.closest('.karta');if(k){location.hash='#/p/'+k.querySelector('.karta-link').getAttribute('href').split('/').pop()}},true);
    g.goTo=idz;
  });
}
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-dodaj]');if(!b)return;
  e.preventDefault();var p=byId[b.getAttribute('data-dodaj')];
  addToCart(p.id,{},1,p.pr);toast('Dodano do koszyka: '+p.n);otworzMini();
});

/* ---------- widoki ---------- */
function ustaw(html,tytul){main.innerHTML=html;document.title=(tytul?tytul+' | ':'')+'wojskowe.com.pl - sklep mundurowy z Dęblina';initGal(main)}
var HERO=['51-118','54-120','77-111','79-148','87-130','128-185','98-147','142-211'];
var HERO_MOB=['77-111','79-148','98-147','142-211','51-118','128-185'];
function widokStart(){
  aktywneMenu(null);
  var mob=window.matchMedia('(max-width:860px)').matches;
  var lista=mob?HERO_MOB:HERO;
  var best=D.best.map(function(i){return byId[i]});
  var lot=[79,80,77,119,78,128,98,139].map(function(i){return byId[i]});
  ustaw(
  '<section class="hero" aria-label="Sklep wojskowe.com.pl">'+
    '<div class="hero-mozaika" aria-hidden="true">'+lista.map(function(id,i){return '<figure><img src="'+img(id,'c')+'" alt="" '+(i>3?'loading="lazy" ':'fetchpriority="high" ')+'decoding="async"></figure>'}).join('')+'</div>'+
    '<div class="hero-tekst"><div>'+
      '<h1>Wszystko do munduru, zgodnie ze wzorem</h1>'+
      '<p class="hero-lead">Pochewki, stopnie, gapy, kordziki, koszule i nakrycia głowy dla wojsk lotniczych i lądowych. Sklep mundurowy z Dęblina.</p>'+
      '<a class="btn btn-z" href="#/k/stopnie">Przejdź do sklepu <span class="belki" aria-hidden="true"></span></a>'+
      '<p class="hero-fakty"><span>Wysyłka w 24 h od wpłaty</span><span>Sklepy w Dęblinie i Rykach</span></p>'+
    '</div></div>'+
  '</section><div class="tasma" aria-hidden="true"></div>'+
  '<section class="sekcja"><div class="wrap">'+
    '<div class="sek-gora"><div><h2>Kategorie</h2><p>'+P.length+' produktów przeniesionych z obecnego sklepu, uporządkowanych w 9 działów.</p></div></div>'+
    '<div class="kategorie">'+C.map(function(c){return '<a class="kat" href="#/k/'+c.slug+'"><span class="kat-foto"><img src="'+img(c.img,'c')+'" alt="" loading="lazy" decoding="async"></span><span class="kat-n">'+esc(KROTKIE[c.slug])+'</span><span class="kat-l">'+c.n+' '+plural(c.n,'produkt','produkty','produktów')+'</span></a>'}).join('')+'</div>'+
  '</div></section>'+
  '<section class="sekcja sekcja-szara"><div class="wrap">'+
    '<div class="sek-gora"><div><h2>Najczęściej kupowane</h2><p>Lista z obecnego sklepu, z wyborem stopnia od razu na karcie produktu.</p></div><a class="sek-link" href="#/k/stopnie">Wszystkie stopnie</a></div>'+
    '<div class="rzad">'+best.map(karta).join('')+'</div>'+
  '</div></section>'+
  '<section class="sekcja sekcja-ciemna" id="haft"><div class="wrap haft">'+
    '<div class="haft-tekst"><h2>Szyjemy na miarę i haftujemy stopnie</h2>'+
      '<p>Szyjemy umundurowanie na miarę, zgodnie z obowiązującym wzornictwem. Robimy poprawki krawieckie i haftujemy stopnie na mundurach oraz otokach do czapek.</p>'+
      '<ul class="haft-lista"><li>Haft bajorkiem na otoku: 20 zł za jeden symbol</li><li>Pochewki i stopnie dla wojsk lotniczych i lądowych</li><li>Identyfikatory i emblematy z danymi klienta</li></ul>'+
      '<a class="btn btn-z" href="#/sklepy">Zapytaj w sklepie</a></div>'+
    '<div class="haft-foty" aria-hidden="true"><figure><img src="'+img('49-69','c')+'" alt="" loading="lazy"></figure><figure><img src="'+img('52-119','c')+'" alt="" loading="lazy"></figure><figure><img src="'+img('84-122','c')+'" alt="" loading="lazy"></figure></div>'+
  '</div></section>'+
  '<section class="sekcja"><div class="wrap">'+
    '<div class="sek-gora"><div><h2>Dla personelu lotniczego</h2><p>Gapy pilota i nawigatora we wszystkich klasach, kordziki z rapciami, emblematy na ubiór specjalny.</p></div><a class="sek-link" href="#/k/gapy-odznaki">Gapy i odznaki</a></div>'+
    '<div class="rzad">'+lot.map(karta).join('')+'</div>'+
  '</div></section>'+
  sklepyHTML()
  );
}
function sklepyHTML(){
  function m(q){return '<iframe class="mapa" title="Mapa: '+q+'" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q='+encodeURIComponent(q)+'&z=16&output=embed"></iframe>'}
  return '<section class="sekcja sekcja-szara" id="sklepy"><div class="wrap">'+
  '<div class="sek-gora"><div><h2>Sklepy stacjonarne</h2><p>Zamówienie z odbiorem osobistym przygotujemy w wybranym sklepie.</p></div></div>'+
  '<div class="sklepy">'+
   '<article class="sklep"><div class="sklep-in"><h3>Dęblin</h3><p class="sklep-adr">ul. Bankowa 24, 08-530 Dęblin</p><p class="sklep-tel"><a href="tel:+48818830568">81 883 05 68</a><a href="tel:+48604444904">604 444 904</a><a href="tel:+48506167647">506 167 647</a></p></div>'+m('ul. Bankowa 24, 08-530 Dęblin')+'</article>'+
   '<article class="sklep"><div class="sklep-in"><h3>Ryki</h3><p class="sklep-adr">ul. Poniatowskiego 39 (obok apteki), 08-500 Ryki</p><p class="sklep-tel"><a href="tel:+48506167647">506 167 647</a></p></div>'+m('ul. Poniatowskiego 39, 08-500 Ryki')+'</article>'+
  '</div></div></section>';
}

/* kategoria z filtrowaniem i sortowaniem */
var stanF={w:'wszystkie',c:'wszystkie',s:'pol'};
var CENY={'wszystkie':[0,1e9,'Każda cena'],'do30':[0,30,'do 30 zł'],'30-100':[30.01,100,'30-100 zł'],'100-300':[100.01,300,'100-300 zł'],'300':[300.01,1e9,'powyżej 300 zł']};
function filtruj(lista){
  var c=CENY[stanF.c];
  var r=lista.filter(function(p){return (stanF.w==='wszystkie'||p.w===stanF.w)&&p.pr>=c[0]&&p.pr<=c[1]});
  if(stanF.s==='rosn')r.sort(function(a,b){return a.pr-b.pr});
  if(stanF.s==='mal')r.sort(function(a,b){return b.pr-a.pr});
  if(stanF.s==='az')r.sort(function(a,b){return a.n.localeCompare(b.n,'pl')});
  return r;
}
function widokLista(tytul,opis,lista,slug,q){
  aktywneMenu(slug);
  var ok=(slug?'<span><a href="#/k/'+slug+'">'+esc(tytul)+'</a></span>':'<span>'+esc(tytul)+'</span>');
  var wsz={lotnicze:0,'lądowe':0,uniwersalne:0};lista.forEach(function(p){wsz[p.w]++});
  function chip(v,t){var dis=v!=='wszystkie'&&!wsz[v];return '<button class="chip" type="button" data-w="'+v+'" aria-pressed="'+(stanF.w===v)+'"'+(dis?' disabled':'')+'>'+t+'</button>'}
  ustaw(
  '<div class="kat-glowa"><div class="wrap"><nav class="okruszki" aria-label="Okruszki"><a href="#/">Sklep</a>'+ok+'</nav>'+
  '<h1>'+esc(tytul)+'</h1>'+(opis?'<p>'+opis+'</p>':'')+
  (slug?'<div class="kat-inne">'+C.map(function(c){return '<a href="#/k/'+c.slug+'"'+(c.slug===slug?' class="akt" aria-current="page"':'')+'>'+esc(KROTKIE[c.slug])+'</a>'}).join('')+'</div>':'')+
  '</div></div>'+
  '<div class="wrap"><div class="filtry" role="group" aria-label="Filtry">'+
   '<div class="chipy">'+chip('wszystkie','Wszystkie')+chip('lotnicze','Lotnicze')+chip('lądowe','Lądowe')+chip('uniwersalne','Uniwersalne')+'</div>'+
   '<label class="f-sel">Cena <select id="f-cena">'+Object.keys(CENY).map(function(k){return '<option value="'+k+'"'+(stanF.c===k?' selected':'')+'>'+CENY[k][2]+'</option>'}).join('')+'</select></label>'+
   '<label class="f-sel">Sortuj <select id="f-sort"><option value="pol">Polecane</option><option value="rosn">Cena rosnąco</option><option value="mal">Cena malejąco</option><option value="az">Nazwa A-Z</option></select></label>'+
   '<span class="f-licz" id="f-licz" aria-live="polite"></span>'+
  '</div><div class="siatka" id="siatka"></div><div style="height:64px"></div></div>',
  tytul);
  $('#f-sort').value=stanF.s;
  function rys(){
    var r=filtruj(lista);
    $('#f-licz').textContent=r.length+' '+plural(r.length,'produkt','produkty','produktów');
    $('#siatka').innerHTML=r.length?r.map(karta).join(''):'<div class="pusto" style="grid-column:1/-1">Brak produktów dla tych filtrów.<br><button class="btn btn-obrys" type="button" id="f-reset">Wyczyść filtry</button></div>';
    initGal($('#siatka'));
    var rs=$('#f-reset');if(rs)rs.onclick=function(){stanF.w='wszystkie';stanF.c='wszystkie';$('#f-cena').value='wszystkie';$$('.chip').forEach(function(c){c.setAttribute('aria-pressed',c.getAttribute('data-w')==='wszystkie')});rys()};
  }
  $$('.chip').forEach(function(b){b.addEventListener('click',function(){stanF.w=b.getAttribute('data-w');$$('.chip').forEach(function(c){c.setAttribute('aria-pressed',c===b)});rys()})});
  $('#f-cena').addEventListener('change',function(){stanF.c=this.value;rys()});
  $('#f-sort').addEventListener('change',function(){stanF.s=this.value;rys()});
  rys();
}

/* karta produktu */
function widokProdukt(id){
  var p=byId[id];if(!p){return widok404()}
  var c=catBy[p.c];aktywneMenu(p.c);
  var opcje=p.o.map(function(o,i){
    var opt=/Haft/.test(o.l);
    var h='<div class="opcja" data-i="'+i+'"><div class="opcja-l"><span>'+esc(o.l)+'</span>'+(opt?'<em>opcjonalnie</em>':'')+'</div>';
    if(o.t==='s'&&o.v.length<=13&&o.l!=='Stopień'){
      h+='<div class="rozm" role="group" aria-label="'+esc(o.l)+'">'+o.v.map(function(v,j){return '<button type="button" aria-pressed="false" data-v="'+esc(v)+'" data-j="'+j+'">'+esc(v)+(o.p&&o.p[j]?' (+'+zl(o.p[j])+')':'')+'</button>'}).join('')+'</div>';
    }else if(o.t==='s'){
      h+='<select class="pole" aria-label="'+esc(o.l)+'"><option value="">Wybierz...</option>'+o.v.map(function(v){return '<option>'+esc(v)+'</option>'}).join('')+'</select>';
    }else{
      h+='<input class="pole" type="text" maxlength="60" placeholder="'+esc(o.ph)+'" aria-label="'+esc(o.l)+'">';
    }
    return h+'<p class="opcja-blad">'+(o.t==='t'?'Wpisz: ':'Wybierz: ')+esc(o.l.toLowerCase())+'</p></div>';
  }).join('');
  var podobne=P.filter(function(x){return x.c===p.c&&x.id!==p.id}).slice(0,5);
  if(podobne.length<5)podobne=podobne.concat(P.filter(function(x){return x.c!==p.c&&D.best.indexOf(x.id)>-1}).slice(0,5-podobne.length));
  var n=p.im.length;
  ustaw(
  '<div class="wrap"><div class="produkt">'+
   '<div class="prod-media"><div class="prod-gal">'+galeria(p,true)+'</div>'+
    (n>1?'<div class="miniatury">'+p.im.map(function(im,i){return '<button type="button" data-i="'+i+'" aria-label="Zdjęcie '+(i+1)+'"'+(i?'':' aria-current="true"')+'><img src="'+img(im,false)+'" alt="" loading="lazy"></button>'}).join('')+'</div>':'')+
   '</div>'+
   '<div class="prod-info"><nav class="okruszki" aria-label="Okruszki"><a href="#/">Sklep</a><span><a href="#/k/'+c.slug+'">'+esc(c.name)+'</a></span></nav>'+
    '<h1>'+esc(p.n)+'</h1>'+
    '<div class="prod-cena"><span class="cena" id="cena-p">'+zl(p.pr)+'</span><span>'+(p.u?esc(p.u)+', ':'')+'cena brutto</span></div>'+
    opcje+
    '<div class="kup-rzad" id="kup-rzad"><div class="ilosc"><button type="button" data-d="-1" aria-label="Mniej">-</button><input id="ile" type="number" min="1" max="99" value="1" inputmode="numeric" aria-label="Ilość"><button type="button" data-d="1" aria-label="Więcej">+</button></div>'+
    '<button class="btn btn-z" type="button" id="dodaj">Dodaj do koszyka</button></div>'+
    '<ul class="prod-zalety"><li>Wysyłka w ciągu 24 h od wpływu płatności</li><li>Odbiór osobisty w Dęblinie lub w Rykach</li><li>Paczkomaty InPost, kurier, BLIK i Przelewy24</li></ul>'+
    '<div class="prod-opis"><h2>Opis</h2><p>'+esc(p.d)+'</p></div>'+
   '</div></div></div>'+
  '<section class="sekcja sekcja-szara"><div class="wrap"><div class="sek-gora"><div><h2>Zobacz też</h2></div><a class="sek-link" href="#/k/'+c.slug+'">'+esc(c.name)+'</a></div><div class="rzad">'+podobne.map(karta).join('')+'</div></div></section>',
  p.n);
  var wyb={};
  var g=$('.prod-gal .gal');
  $$('.miniatury button').forEach(function(b){b.addEventListener('click',function(){if(g.goTo)g.goTo(+b.getAttribute('data-i'))})});
  if(g)g.addEventListener('galidx',function(e){$$('.miniatury button').forEach(function(b,i){b.setAttribute('aria-current',i===e.detail?'true':'false')})});
  function cena(){var d=0;p.o.forEach(function(o,i){if(o.p&&wyb[i]!=null)d+=o.p[wyb[i]]||0});return p.pr+d}
  function rysCena(){$('#cena-p').textContent=zl(cena());var sc=$('#sticky-kup .cena');if(sc)sc.textContent=zl(cena())}
  $$('.opcja').forEach(function(box){
    var i=+box.getAttribute('data-i');
    $$('.rozm button',box).forEach(function(b){b.addEventListener('click',function(){$$('.rozm button',box).forEach(function(x){x.setAttribute('aria-pressed',x===b)});wyb[i]=+b.getAttribute('data-j');box.classList.remove('blad');rysCena()})});
    var f=$('.pole',box);if(f)f.addEventListener('input',function(){box.classList.remove('blad')});
  });
  var ile=$('#ile');
  $$('.ilosc button[data-d]').forEach(function(b){b.addEventListener('click',function(){ile.value=Math.max(1,Math.min(99,(+ile.value||1)+(+b.getAttribute('data-d'))))})});
  function dodaj(){
    var opts={},bl=null;
    p.o.forEach(function(o,i){
      var box=$('.opcja[data-i="'+i+'"]'),val='';
      var pr=$('.rozm button[aria-pressed="true"]',box);
      if(pr)val=pr.getAttribute('data-v');else{var f=$('.pole',box);if(f)val=f.value.trim()}
      if(!val&&!/Haft/.test(o.l)){box.classList.add('blad');if(!bl)bl=box}
      if(val)opts[o.l]=val;
    });
    if(bl){bl.scrollIntoView({behavior:'smooth',block:'center'});var f=$('button,select,input',bl);if(f)setTimeout(function(){f.focus({preventScroll:true})},350);toast('Uzupełnij wybór, a potem dodaj do koszyka');return}
    addToCart(p.id,opts,Math.max(1,Math.min(99,+ile.value||1)),cena());
    toast('Dodano do koszyka');otworzMini();
  }
  $('#dodaj').addEventListener('click',dodaj);
  /* sticky na telefonie */
  var sk=$('#sticky-kup');
  sk.innerHTML='<div class="sk-l"><span class="sk-n">'+esc(p.n)+'</span><span class="cena">'+zl(cena())+'</span></div><button class="btn btn-z" type="button">Dodaj do koszyka</button>';
  sk.hidden=false;document.body.classList.add('ma-sticky');
  $('button',sk).addEventListener('click',dodaj);
  if('IntersectionObserver' in window){
    sticObs=new IntersectionObserver(function(en){var e=en[0];sk.classList.toggle('widac',!e.isIntersecting&&e.boundingClientRect.top<0)},{threshold:0});
    sticObs.observe($('#kup-rzad'));
  }
}
var sticObs=null;
function zgasSticky(){var sk=$('#sticky-kup');sk.hidden=true;sk.classList.remove('widac');document.body.classList.remove('ma-sticky');if(sticObs){sticObs.disconnect();sticObs=null}}

/* koszyk: mini i strona */
var mini=$('#mini'),miniTlo=$('#mini-tlo'),ostFocus=null;
function pozHTML(i,duzy){
  var p=byId[i.id],o=Object.keys(i.o).map(function(k){return esc(k)+': '+esc(i.o[k])}).join(', ');
  return '<div class="poz" data-k="'+esc(i.k)+'"><img src="'+img(p.im[0],false)+'" alt="" loading="lazy">'+
  '<div><a class="poz-n" href="#/p/'+p.id+'">'+esc(p.n)+'</a>'+(o?'<p class="poz-o">'+o+'</p>':'')+
  '<div class="poz-dol"><div class="ilosc"><button type="button" data-q="-1" aria-label="Mniej">-</button><input type="number" min="1" max="99" value="'+i.q+'" aria-label="Ilość" data-qi><button type="button" data-q="1" aria-label="Więcej">+</button></div>'+
  (duzy?'':'<span class="poz-c">'+zl(i.q*i.pr)+'</span>')+'<button class="usun" type="button" data-usun>Usuń</button></div></div>'+
  (duzy?'<span class="poz-c">'+zl(i.q*i.pr)+'</span>':'')+'</div>';
}
function rysMini(){
  var l=$('#mini-lista'),d=$('#mini-dol');
  if(!cart.length){l.innerHTML='<div class="mini-pusty"><p>Koszyk jest pusty.</p><a class="btn btn-ciemny" href="#/k/stopnie">Przejdź do sklepu</a></div>';d.innerHTML='';d.hidden=true;return}
  d.hidden=false;
  l.innerHTML=cart.map(function(i){return pozHTML(i,false)}).join('');
  d.innerHTML='<div class="suma-rzad"><span>Suma ('+cartCount()+' szt.)</span><b>'+zl(cartSum())+'</b></div><a class="btn btn-z btn-pelny" href="#/zamowienie">Przejdź do zamówienia</a><a class="btn btn-obrys btn-pelny" href="#/koszyk">Zobacz koszyk</a>';
}
function otworzMini(){ostFocus=document.activeElement;rysMini();miniTlo.hidden=false;mini.setAttribute('aria-hidden','false');requestAnimationFrame(function(){mini.classList.add('otw')});setTimeout(function(){$('#mini-zamknij').focus()},60)}
function zamknijMini(){mini.classList.remove('otw');mini.setAttribute('aria-hidden','true');miniTlo.hidden=true;if(ostFocus&&ostFocus.focus&&document.contains(ostFocus))ostFocus.focus({preventScroll:true})}
$('#koszyk-btn').addEventListener('click',otworzMini);
$('#mini-zamknij').addEventListener('click',zamknijMini);
miniTlo.addEventListener('click',zamknijMini);
mini.addEventListener('click',function(e){if(e.target.closest('a'))zamknijMini()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(mini.classList.contains('otw'))zamknijMini();menuMob(false);podp.hidden=true}});
/* zmiany ilosci i usuwanie - wspolne dla mini i strony koszyka */
document.addEventListener('click',function(e){
  var poz=e.target.closest('.poz[data-k]');if(!poz)return;
  var k=poz.getAttribute('data-k'),it=cart.filter(function(i){return i.k===k})[0];if(!it)return;
  if(e.target.closest('[data-usun]')){cart=cart.filter(function(i){return i!==it});save();toast('Usunięto z koszyka');poOdswiez();return}
  var b=e.target.closest('[data-q]');if(b){it.q=Math.max(1,Math.min(99,it.q+(+b.getAttribute('data-q'))));save();poOdswiez()}
});
document.addEventListener('change',function(e){
  if(!e.target.hasAttribute('data-qi'))return;var poz=e.target.closest('.poz');var it=cart.filter(function(i){return i.k===poz.getAttribute('data-k')})[0];
  if(it){it.q=Math.max(1,Math.min(99,parseInt(e.target.value,10)||1));save();poOdswiez()}
});
function poOdswiez(){if(mini.classList.contains('otw'))rysMini();var r=trasa();if(r[0]==='koszyk')widokKoszyk();if(r[0]==='zamowienie')rysPodsumZam()}
function widokKoszyk(){
  aktywneMenu(null);
  if(!cart.length){ustaw('<div class="wrap"><div class="strona-glowa"><h1>Koszyk</h1></div><div class="pusto">Twój koszyk jest pusty.<br><a class="btn btn-ciemny" href="#/k/stopnie">Przejdź do sklepu</a></div><div style="height:48px"></div></div>','Koszyk');return}
  ustaw('<div class="wrap"><div class="strona-glowa"><nav class="okruszki"><a href="#/">Sklep</a><span>Koszyk</span></nav><h1>Koszyk</h1></div>'+
  '<div class="koszyk-uklad"><div class="koszyk-lista">'+cart.map(function(i){return pozHTML(i,true)}).join('')+'</div>'+
  '<aside class="podsumowanie"><h2>Podsumowanie</h2><div class="ps-rzad"><span>Produkty ('+cartCount()+' szt.)</span><span>'+zl(cartSum())+'</span></div><div class="ps-rzad"><span>Dostawa</span><span>w następnym kroku</span></div><div class="ps-rzad razem"><span>Razem</span><b>'+zl(cartSum())+'</b></div>'+
  '<a class="btn btn-z btn-pelny" href="#/zamowienie">Przejdź do zamówienia</a><p class="ps-uwaga">Zamówienie złożysz bez zakładania konta.</p></aside></div></div>','Koszyk');
}

/* zamowienie (demonstracyjne) */
var zam={d:'inpost',p:'blik'};
function widokZamowienie(){
  aktywneMenu(null);
  if(!cart.length){location.hash='#/koszyk';return}
  function pole(id,l,typ,ac,pelne,ph){return '<div class="pole-w'+(pelne?' pelne':'')+'"><label for="'+id+'">'+l+'</label><input class="pole" id="'+id+'" name="'+id+'" type="'+typ+'" autocomplete="'+ac+'"'+(ph?' placeholder="'+ph+'"':'')+' required><p class="opcja-blad">Uzupełnij to pole</p></div>'}
  ustaw('<div class="wrap"><div class="strona-glowa"><nav class="okruszki"><a href="#/">Sklep</a><span><a href="#/koszyk">Koszyk</a></span><span>Zamówienie</span></nav><h1>Zamówienie</h1>'+
  '<div class="demo-info" role="note"><div><b>Wersja demonstracyjna.</b> Formularz pokazuje, jak będzie wyglądać zamówienie w nowym sklepie. Nic nie zostanie wysłane ani pobrane.</div></div></div>'+
  '<form class="koszyk-uklad" id="zam-form" novalidate><div>'+
   '<section class="zam-blok"><h2><span>1</span>Dane do wysyłki</h2><div class="pola">'+
    pole('email','E-mail','email','email',false)+pole('tel','Telefon','tel','tel',false)+pole('imie','Imię','text','given-name',false)+pole('nazwisko','Nazwisko','text','family-name',false)+pole('ulica','Ulica i numer','text','street-address',true)+pole('kod','Kod pocztowy','text','postal-code',false,'08-530')+pole('miasto','Miejscowość','text','address-level2',false)+
    '<label class="zgoda pelne"><input type="checkbox" id="fv"> Chcę fakturę na firmę</label>'+
    '<div class="pole-w pelne" id="fv-pola" hidden><label for="nip">NIP</label><input class="pole" id="nip" type="text" inputmode="numeric" autocomplete="off"></div>'+
   '</div></section>'+
   '<section class="zam-blok"><h2><span>2</span>Dostawa</h2><div class="wybory">'+DOSTAWY.map(function(d){return '<label class="wybor"><input type="radio" name="dost" value="'+d.id+'"'+(zam.d===d.id?' checked':'')+'><span><b>'+d.n+'</b><small>'+d.o+'</small></span><span class="w-c">'+(d.c?zl(d.c):'0,00 zł')+'</span>'+(d.id==='inpost'?'<span class="wybor-dod"><input class="pole" id="paczkomat" type="text" placeholder="Kod paczkomatu, np. DEB01M" aria-label="Kod paczkomatu"></span>':'')+'</label>'}).join('')+'</div><p class="ps-uwaga">Stawki dostawy w wersji demonstracyjnej są przykładowe. W sklepie ustawimy Państwa cennik.</p></section>'+
   '<section class="zam-blok"><h2><span>3</span>Płatność</h2><div class="wybory">'+PLATNOSCI.map(function(p){return '<label class="wybor"><input type="radio" name="plat" value="'+p.id+'"'+(zam.p===p.id?' checked':'')+'><span><b>'+p.n+'</b><small>'+p.o+'</small></span><span></span></label>'}).join('')+'</div></section>'+
   '<section class="zam-blok"><h2><span>4</span>Uwagi</h2><textarea class="pole" id="uwagi" placeholder="Np. prośba o kontakt przed wysyłką (opcjonalnie)"></textarea>'+
    '<label class="zgoda"><input type="checkbox" id="regulamin"> Akceptuję regulamin sklepu i politykę prywatności</label><p class="opcja-blad" id="reg-blad">Zaznacz akceptację regulaminu</p></section>'+
  '</div><aside class="podsumowanie" id="ps-zam"></aside></form></div>','Zamówienie');
  var f=$('#zam-form');
  $('#fv').addEventListener('change',function(){$('#fv-pola').hidden=!this.checked});
  $$('input[name=dost]',f).forEach(function(r){r.addEventListener('change',function(){zam.d=r.value;rysPodsumZam()})});
  $$('input[name=plat]',f).forEach(function(r){r.addEventListener('change',function(){zam.p=r.value})});
  $$('.pole-w .pole',f).forEach(function(i){i.addEventListener('input',function(){i.parentNode.classList.remove('blad')})});
  $('#regulamin').addEventListener('change',function(){$('#reg-blad').style.display='none'});
  f.addEventListener('submit',function(e){
    e.preventDefault();var bl=null;
    $$('.pole-w .pole[required]',f).forEach(function(i){var ok=i.value.trim()&&(i.type!=='email'||/.+@.+\..+/.test(i.value));i.parentNode.classList.toggle('blad',!ok);if(!ok&&!bl)bl=i});
    if(!$('#regulamin').checked){$('#reg-blad').style.display='block';if(!bl)bl=$('#regulamin')}
    if(bl){bl.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(function(){bl.focus({preventScroll:true})},350);return}
    var razem=cartSum()+dostawa().c;
    cart=[];save();
    ustaw('<div class="wrap"><div class="potw"><div class="potw-znak">'+znak+'</div><h1>Dziękujemy, to była wersja demonstracyjna</h1><p>Tak wyglądałoby potwierdzenie zamówienia na kwotę '+zl(razem)+' ('+dostawa().n+', '+PLATNOSCI.filter(function(p){return p.id===zam.p})[0].n+'). W prawdziwym sklepie klient dostaje teraz e-mail z potwierdzeniem, a Państwo powiadomienie o nowym zamówieniu.</p><p>Żadne dane nie zostały wysłane.</p><a class="btn btn-ciemny" href="#/">Wróć do sklepu</a></div></div>','Zamówienie przyjęte (demo)');
    window.scrollTo(0,0);
  });
  rysPodsumZam();
}
function dostawa(){return DOSTAWY.filter(function(d){return d.id===zam.d})[0]}
function rysPodsumZam(){
  var ps=$('#ps-zam');if(!ps)return;
  if(!cart.length){location.hash='#/koszyk';return}
  var d=dostawa();
  ps.innerHTML='<h2>Twoje zamówienie</h2>'+cart.map(function(i){var p=byId[i.id];return '<div class="ps-poz"><img src="'+img(p.im[0],false)+'" alt=""><span>'+esc(p.n)+(i.q>1?' x '+i.q:'')+'</span><b>'+zl(i.q*i.pr)+'</b></div>'}).join('')+
  '<div class="ps-rzad" style="margin-top:8px"><span>Produkty</span><span>'+zl(cartSum())+'</span></div><div class="ps-rzad"><span>Dostawa: '+d.n+'</span><span>'+zl(d.c)+'</span></div><div class="ps-rzad razem"><span>Do zapłaty</span><b>'+zl(cartSum()+d.c)+'</b></div>'+
  '<button class="btn btn-z btn-pelny" type="submit">Zamawiam i płacę</button><p class="ps-uwaga">Wersja demonstracyjna: przycisk nie wysyła zamówienia i nie pobiera płatności.</p>';
}

/* wyszukiwarka */
var podp=$('#podpowiedzi'),pole=$('#szukaj-pole');
function szukaj(q){q=norm(q.trim());if(!q)return [];var sl=q.split(/\s+/);return P.filter(function(p){var t=norm(p.n+' '+p.d+' '+catBy[p.c].name);return sl.every(function(s){return t.indexOf(s)>-1})})}
var aktP=-1;
pole.addEventListener('input',function(){
  var q=pole.value.trim();aktP=-1;
  if(q.length<2){podp.hidden=true;return}
  var r=szukaj(q);
  podp.innerHTML=r.length?r.slice(0,6).map(function(p){return '<a href="#/p/'+p.id+'"><img src="'+img(p.im[0],false)+'" alt=""><span class="pp-n">'+esc(p.n)+'</span><span class="pp-c">'+zl(p.pr)+'</span></a>'}).join('')+'<a class="pp-wsz" href="#/szukaj/'+encodeURIComponent(q)+'">Wszystkie wyniki ('+r.length+')</a>':'<p class="pp-brak">Brak wyników dla „'+esc(q)+'”</p>';
  podp.hidden=false;
});
pole.addEventListener('keydown',function(e){
  var a=$$('a',podp);if(podp.hidden||!a.length)return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();aktP=(aktP+(e.key==='ArrowDown'?1:-1)+a.length)%a.length;a.forEach(function(x,i){x.classList.toggle('akt',i===aktP)})}
  if(e.key==='Enter'&&aktP>-1){e.preventDefault();location.hash=a[aktP].getAttribute('href');podp.hidden=true;pole.blur()}
});
$('#szukaj').addEventListener('submit',function(e){e.preventDefault();var q=pole.value.trim();if(!q)return;podp.hidden=true;pole.blur();location.hash='#/szukaj/'+encodeURIComponent(q)});
podp.addEventListener('click',function(){podp.hidden=true;pole.blur()});
document.addEventListener('click',function(e){if(!e.target.closest('#szukaj'))podp.hidden=true});

/* strony informacyjne */
function widokInfo(){
  aktywneMenu(null);
  ustaw('<div class="wrap"><div class="strona-glowa"><nav class="okruszki"><a href="#/">Sklep</a><span>Wysyłka i zwroty</span></nav><h1>Wysyłka i zwroty</h1></div><div class="tekst-str">'+
  '<h2>Wysyłka</h2><p>Paczki nadajemy w ciągu 24 godzin od otrzymania potwierdzenia wpływu płatności, a paczki priorytetowe pobraniowe w ciągu 12 godzin. Produkty pakujemy w opakowania dopasowane do rozmiaru i dobrze zabezpieczone.</p>'+
  '<p>Kilka produktów warto zebrać w jednym zamówieniu: koszt wysyłki nie zależy od wagi paczki.</p>'+
  '<h2>Odbiór osobisty</h2><p>Zamówienie można odebrać w sklepie w Dęblinie (ul. Bankowa 24) albo w Rykach (ul. Poniatowskiego 39, obok apteki).</p>'+
  '<h2>Zwroty i reklamacje</h2><p>W nowym sklepie regulamin opisze prawo odstąpienia od umowy w ciągu 14 dni i tryb reklamacji, zgodnie z obecnymi przepisami. To miejsce na Państwa zasady.</p>'+
  '<h2>Kontakt</h2><p>Tel. <a href="tel:+48818830568">81 883 05 68</a>, <a href="tel:+48506167647">506 167 647</a>, e-mail <a href="mailto:wojtekszym@wp.pl">wojtekszym@wp.pl</a>.</p>'+
  '</div></div>','Wysyłka i zwroty');
}
function widokPolityka(){
  aktywneMenu(null);
  ustaw('<div class="wrap"><div class="strona-glowa"><nav class="okruszki"><a href="#/">Sklep</a><span>Polityka prywatności</span></nav><h1>Polityka prywatności</h1></div><div class="tekst-str">'+
  '<p><b>Wersja demonstracyjna.</b> Pełną treść przygotujemy razem z Państwem przed uruchomieniem sklepu.</p>'+
  '<h2>Administrator danych</h2><p>Administratorem danych osobowych jest Sklep Wielobranżowy Maciej Szymański z siedzibą w Dęblinie, ul. Bankowa 22, 08-530 Dęblin, NIP 716-244-90-53, e-mail wojtekszym@wp.pl.</p>'+
  '<h2>Cel przetwarzania</h2><p>Dane przetwarzamy, aby zrealizować zamówienie, wystawić paragon lub fakturę i odpowiedzieć na wiadomość. Odbiorcami danych są firmy kurierskie, operator paczkomatów, operator płatności i biuro rachunkowe.</p>'+
  '<h2>Prawa osoby</h2><p>Przysługuje Państwu prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przeniesienia, sprzeciwu oraz skargi do Prezesa Urzędu Ochrony Danych Osobowych.</p>'+
  '<h2>Pliki cookies</h2><ul><li>Niezbędne: zapamiętanie zawartości koszyka i wyboru w banerze cookies (pamięć przeglądarki).</li><li>Mapy Google na stronie mogą zapisywać własne pliki cookies (Google Ireland Ltd.).</li><li>W wersji demonstracyjnej nie używamy narzędzi analitycznych ani reklamowych.</li></ul>'+
  '</div></div>','Polityka prywatności');
}
function widok404(){ustaw('<div class="wrap"><div class="potw"><h1>Nie znaleziono strony</h1><p>Ten adres nie istnieje w wersji demonstracyjnej.</p><a class="btn btn-ciemny" href="#/">Strona główna</a></div></div>','Nie znaleziono')}

/* ---------- routing ---------- */
function trasa(){return (location.hash||'#/').replace(/^#\/?/,'').split('/')}
var ostTrasa='';
function router(){
  var r=trasa(),klucz=r.join('/');
  zgasSticky();menuMob(false);podp.hidden=true;
  if(mini.classList.contains('otw'))zamknijMini();
  if(r[0]==='k'&&catBy[r[1]]){var c=catBy[r[1]];if(ostTrasa.split('/')[0]!=='k')stanF={w:'wszystkie',c:'wszystkie',s:'pol'};widokLista(c.name,c.n+' '+plural(c.n,'produkt','produkty','produktów')+' w kategorii',P.filter(function(p){return p.c===c.slug}),c.slug)}
  else if(r[0]==='p')widokProdukt(r[1]);
  else if(r[0]==='koszyk')widokKoszyk();
  else if(r[0]==='zamowienie')widokZamowienie();
  else if(r[0]==='szukaj'){var q=decodeURIComponent(r.slice(1).join('/'));pole.value=q;stanF={w:'wszystkie',c:'wszystkie',s:'pol'};widokLista('Wyniki: '+q,null,szukaj(q),null,q)}
  else if(r[0]==='informacje')widokInfo();
  else if(r[0]==='polityka')widokPolityka();
  else if(r[0]==='sklepy'){widokStart();var s=$('#sklepy');if(s){setTimeout(function(){s.scrollIntoView()},30)}ostTrasa=klucz;return}
  else if(r[0]===''||r[0]==='')widokStart();
  else widok404();
  if(!(r[0]==='k'&&ostTrasa.split('/')[0]==='k'&&ostTrasa.split('/')[1]===r[1]))window.scrollTo(0,0);
  ostTrasa=klucz;
}
window.addEventListener('hashchange',router);

/* ---------- cookies ---------- */
var ck=$('#cookies');
function ckZapisz(v){lsSet('wojskowe_cookies',v);ck.hidden=true}
if(!lsGet('wojskowe_cookies'))ck.hidden=false;
$('#ck-ok').addEventListener('click',function(){ckZapisz('wszystkie')});
$('#ck-nie').addEventListener('click',function(){ckZapisz('niezbedne')});
$('#cookies-ustaw').addEventListener('click',function(){ck.hidden=false});

/* start */
$('#rok').textContent=new Date().getFullYear();
budujMenu();odswiezLicznik();router();
})();
