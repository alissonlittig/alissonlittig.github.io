/* Alta Estima: catálogo, sacola (cupom) e pedido pelo WhatsApp. Serve a todas as páginas. */
(function(){
var WA='5533988137703';
var ROOT=document.documentElement.dataset.root||'./';

var LOJAS=[
  {id:'quintino',nome:'Loja Quintino',end:'Rua Quintino Bocaiúva, 676',hora:'seg. a sex. 7h30 às 18h, sáb. até 13h'},
  {id:'israel',nome:'Loja Israel Pinheiro',end:'Rua Israel Pinheiro, 3381',hora:'seg. a sex. 8h às 18h, sáb. até 13h'}
];

// Categorias: a chave "cor" aponta para as variáveis --cat-* do style.css.
var CATS=[
  {nome:'Maquiagem',cor:'maquiagem'},
  {nome:'Skincare',cor:'skincare'},
  {nome:'Cabelos',cor:'cabelos'},
  {nome:'Perfumaria',cor:'perfumaria'},
  {nome:'Corpo e banho',cor:'corpo'},
  {nome:'Unhas',cor:'unhas'},
  {nome:'Presentes',cor:'presentes'}
];

/* Catálogo da loja online. Para editar:
   - preco: deixe null para "preço no WhatsApp", ou ponha o número (ex.: 19.9) para mostrar o valor;
   - foto: caminho ou endereço de uma foto do produto (opcional);
   - destaque: true aparece na prateleira da página inicial. */
var PRODUTOS=[
  {id:'base',nome:'Base líquida',cat:'Maquiagem',desc:'Cobertura leve a alta, para vários tons de pele.',marcas:['Ruby Rose','Vult','Maybelline'],destaque:true},
  {id:'corretivo',nome:'Corretivo',cat:'Maquiagem',desc:'Para olheiras e manchas, em bastão ou líquido.',marcas:['Ruby Rose','Vult','Dailus']},
  {id:'batom',nome:'Batom',cat:'Maquiagem',desc:'Matte, cremoso ou líquido. Diga a cor que procura.',marcas:['Ruby Rose','Vult','Dailus','Avon'],destaque:true},
  {id:'gloss',nome:'Gloss labial',cat:'Maquiagem',desc:'Brilho com ou sem cor, efeito volume.',marcas:['Ruby Rose','Dailus']},
  {id:'mascara-cilios',nome:'Máscara de cílios',cat:'Maquiagem',desc:'Volume, alongamento ou à prova d\'água.',marcas:['Maybelline','Vult','Ruby Rose']},
  {id:'delineador',nome:'Delineador',cat:'Maquiagem',desc:'Caneta, gel ou lápis para os olhos.',marcas:['Vult','Dailus','Ruby Rose']},
  {id:'paleta',nome:'Paleta de sombras',cat:'Maquiagem',desc:'Tons neutros, coloridos e cintilantes.',marcas:['Ruby Rose','Vult']},
  {id:'po',nome:'Pó compacto ou solto',cat:'Maquiagem',desc:'Para selar a maquiagem e tirar o brilho.',marcas:['Vult','Ruby Rose','Dailus']},
  {id:'blush',nome:'Blush e iluminador',cat:'Maquiagem',desc:'Cor nas bochechas e ponto de luz.',marcas:['Ruby Rose','Vult']},
  {id:'pinceis',nome:'Pincéis e esponjas',cat:'Maquiagem',desc:'Kits e avulsos para base, pó e olhos.',marcas:['Ruby Rose','Macrilan']},

  {id:'limpeza',nome:'Sabonete facial',cat:'Skincare',desc:'Limpeza para pele oleosa, mista ou seca.',marcas:['Neutrogena','Nivea','Garnier'],destaque:true},
  {id:'agua-micelar',nome:'Água micelar',cat:'Skincare',desc:'Remove maquiagem e limpa sem enxágue.',marcas:['Garnier','Nivea','L\'Oréal Paris']},
  {id:'hidratante-facial',nome:'Hidratante facial',cat:'Skincare',desc:'Textura leve, com ou sem cor.',marcas:['Nivea','Neutrogena','Garnier']},
  {id:'serum',nome:'Sérum facial',cat:'Skincare',desc:'Vitamina C, ácido hialurônico e niacinamida.',marcas:['Garnier','L\'Oréal Paris']},
  {id:'protetor',nome:'Protetor solar facial',cat:'Skincare',desc:'FPS 30 a 70, com ou sem cor.',marcas:['Neutrogena','Nivea','Garnier'],destaque:true},
  {id:'mascara-facial',nome:'Máscara facial',cat:'Skincare',desc:'Argila, tecido ou hidratante.',marcas:['Garnier','Ruby Rose']},

  {id:'shampoo',nome:'Shampoo',cat:'Cabelos',desc:'Para cabelo liso, cacheado, oleoso ou com química.',marcas:['Elseve','Pantene','Seda','Haskell','Bio Extratus'],destaque:true},
  {id:'condicionador',nome:'Condicionador',cat:'Cabelos',desc:'Desembaraça e hidrata. Combine com o seu shampoo.',marcas:['Elseve','Pantene','Seda','Bio Extratus']},
  {id:'mascara-capilar',nome:'Máscara capilar',cat:'Cabelos',desc:'Hidratação, nutrição e reconstrução.',marcas:['Haskell','Bio Extratus','Salon Line','Skala'],destaque:true},
  {id:'creme-pentear',nome:'Creme para pentear',cat:'Cabelos',desc:'Definição de cachos e controle do frizz.',marcas:['Salon Line','Skala','Seda']},
  {id:'finalizador',nome:'Óleo e finalizador',cat:'Cabelos',desc:'Brilho, pontas e proteção térmica.',marcas:['Elseve','Haskell','Salon Line']},
  {id:'coloracao',nome:'Coloração',cat:'Cabelos',desc:'Tinta permanente e tonalizante. Diga o número do tom.',marcas:['Koleston','L\'Oréal Paris','Garnier']},
  {id:'escova',nome:'Escovas e acessórios',cat:'Cabelos',desc:'Escovas, pentes, piranhas e elásticos.',marcas:[]},

  {id:'perfume-f',nome:'Perfume feminino',cat:'Perfumaria',desc:'Floral, frutado, doce ou amadeirado.',marcas:['Eudora','O Boticário','Natura','Avon'],destaque:true},
  {id:'perfume-m',nome:'Perfume masculino',cat:'Perfumaria',desc:'Fresco, amadeirado ou intenso.',marcas:['Eudora','O Boticário','Natura','Avon']},
  {id:'body-splash',nome:'Body splash',cat:'Perfumaria',desc:'Fragrância leve para usar no dia a dia.',marcas:['Eudora','O Boticário']},
  {id:'desodorante',nome:'Desodorante',cat:'Perfumaria',desc:'Aerosol, roll-on ou creme.',marcas:['Nivea','Dove','Monange']},

  {id:'hidratante-corpo',nome:'Hidratante corporal',cat:'Corpo e banho',desc:'Pele seca, extrasseca ou normal.',marcas:['Nivea','Dove','Monange'],destaque:true},
  {id:'sabonete',nome:'Sabonete',cat:'Corpo e banho',desc:'Em barra ou líquido, hidratante ou esfoliante.',marcas:['Dove','Nivea','Natura']},
  {id:'oleo-corpo',nome:'Óleo corporal',cat:'Corpo e banho',desc:'Hidratação e brilho depois do banho.',marcas:['Monange','Natura','Dove']},
  {id:'esfoliante',nome:'Esfoliante',cat:'Corpo e banho',desc:'Para corpo e pés.',marcas:['Nivea','Monange']},
  {id:'depilacao',nome:'Cera e depilação',cat:'Corpo e banho',desc:'Cera roll-on, quente, fria e lâminas.',marcas:['Depil Bella']},

  {id:'esmalte',nome:'Esmalte',cat:'Unhas',desc:'Cremoso, cintilante ou com efeito gel.',marcas:['Risqué','Colorama','Dailus'],destaque:true},
  {id:'base-unha',nome:'Base e fortalecedor',cat:'Unhas',desc:'Base, top coat e tratamento para unhas fracas.',marcas:['Risqué','Colorama']},
  {id:'removedor',nome:'Removedor de esmalte',cat:'Unhas',desc:'Com ou sem acetona.',marcas:[]},
  {id:'alicate',nome:'Alicates e lixas',cat:'Unhas',desc:'Alicate de cutícula, lixas e palitos.',marcas:[]},

  {id:'kit-pronto',nome:'Kit presente pronto',cat:'Presentes',desc:'Caixas montadas para presentear.',marcas:[]},
  {id:'kit-montado',nome:'Kit do seu jeito',cat:'Presentes',desc:'Escolha os itens e a equipe monta o presente.',marcas:[]}
];

var MARCAS=['Natura','O Boticário','Eudora','Avon','L\'Oréal Paris','Elseve','Koleston','Colorama','Risqué','Dailus','Maybelline','Ruby Rose','Vult','Nivea','Dove','Monange','Haskell','Bio Extratus','Salon Line','Skala','Seda','Pantene','Garnier','Neutrogena'];

/* Fotos ilustrativas: um produto real por marca de cada tipo, passando no cartão.
   Cada foto: [marca, nome do produto na foto, arquivo em assets/produtos/<arquivo>.webp]. */
var FOTOS={
  'base':[['Ruby Rose','Base Líquida Ruby Rose Feels Mel 030 29ml','base'],['Vult','Base Líquida Vult Mega Matte V150 26ml','base--vult'],['Maybelline','Base Líquida Maybelline Fit Me Fresh Tint 30ml','base--maybelline']],
  'corretivo':[['Ruby Rose','Corretivo Líquido Melu by Ruby Rose ME110 3,5ml','corretivo--ruby-rose'],['Vult','Corretivo Líquido Vult HD B-126 8ml','corretivo'],['Dailus','Corretivo Líquido Dailus Bye Bye Olheira 4,5ml','corretivo--dailus']],
  'batom':[['Ruby Rose','Batom Líquido Ruby Rose Mood Desire 01','batom--ruby-rose'],['Vult','Batom Matte Lips Rosé Vult 3,8g','batom'],['Dailus','Batom Dailus Vegano 02 Doce 3,5g','batom--dailus'],['Avon','Batom Avon Ultra Color Matte FPS 30 Malva Rosado','batom--avon']],
  'gloss':[['Ruby Rose','Gloss Labial Ruby Rose Shine 75 2,1ml','gloss'],['Dailus','Lip Gloss Incolor Dailus 3ml','gloss--dailus']],
  'mascara-cilios':[['Maybelline','Máscara de Cílios Maybelline Sky High à Prova D’água 2,9g','mascara-cilios'],['Vult','Máscara de Cílios Vult Super Fix 10g','mascara-cilios--vult'],['Ruby Rose','Máscara de Cílios Melu by Ruby Rose Peel Off Selfie','mascara-cilios--ruby-rose']],
  'delineador':[['Vult','Delineador Líquido Preto Vult 2,5ml','delineador'],['Dailus','Caneta Delineadora Preta Dailus 1,2ml','delineador--dailus'],['Ruby Rose','Delineador Líquido Preto Ruby Rose 5,8ml','delineador--ruby-rose']],
  'paleta':[['Ruby Rose','Paleta de Sombras Ruby Rose The Glow 11g','paleta'],['Vult','Paleta de Sombras Vult Essent Rose','paleta--vult']],
  'po':[['Vult','Pó Compacto Vult Basic PC12 9g','po'],['Ruby Rose','Pó Compacto Ruby Rose Blow Blurry','po--ruby-rose'],['Dailus','Pó Compacto Dailus Vegano D5 10g','po--dailus']],
  'blush':[['Ruby Rose','Blush Natural Ruby Rose Mini Pêssego 9,4g','blush'],['Vult','Blush Compacto Vult Malva Matte 3g','blush--vult']],
  'pinceis':[['Ruby Rose','Pincel LF80 para Base Melu by Ruby Rose','pinceis'],['Macrilan','Pincel Cônico Macrilan Linha A A29','pinceis--macrilan']],
  'limpeza':[['Neutrogena','Gel de Limpeza Facial Neutrogena Deep Clean Grapefruit 150g','limpeza'],['Nivea','Gel de Limpeza Facial Nivea Efeito Matte 150ml','limpeza--nivea'],['Garnier','Gel de Limpeza Facial Garnier Antioleosidade Vitamina C 150g','limpeza--garnier']],
  'agua-micelar':[['Garnier','Água Micelar Garnier Antioleosidade 400ml','agua-micelar--garnier'],['Nivea','Água Micelar Nivea Micellair Expert Bifásica 200ml','agua-micelar'],['L’Oréal Paris','Água Micelar L’Oréal Paris 5 em 1 200ml','agua-micelar--l-oreal-paris']],
  'hidratante-facial':[['Nivea','Creme Nutritivo Hidratante Facial Nivea 100g','hidratante-facial'],['Neutrogena','Creme Facial Neutrogena Face Care Intensive Matte 100g','hidratante-facial--neutrogena'],['Garnier','Hidratante Facial Garnier Salicílico Toque Seco 85g','hidratante-facial--garnier']],
  'serum':[['Garnier','Sérum Booster Antimanchas Garnier Uniform & Matte Vitamina C 30ml','serum'],['L’Oréal Paris','Sérum Revitalift Hialurônico L’Oréal Paris 15ml','serum--l-oreal-paris']],
  'protetor':[['Neutrogena','Protetor Solar Facial Neutrogena Sun Fresh FPS 70 40g','protetor'],['Nivea','Protetor Solar Facial Nivea Sun Toque Seco FPS 70 40ml','protetor--nivea'],['Garnier','Protetor Solar Facial Garnier Uniform & Matte FPS 30 40g','protetor--garnier']],
  'mascara-facial':[['Garnier','Máscara Facial em Tecido Garnier Hidra Bomb Romã 32g','mascara-facial--garnier'],['Ruby Rose','Máscara Facial Ruby Rose Liftmask Ice Rose 50g','mascara-facial']],
  'shampoo':[['Elseve','Shampoo Elseve Reparação Total 5 Química 400ml','shampoo'],['Pantene','Shampoo Pantene Bambu Nutre e Cresce 400ml','shampoo--pantene'],['Seda','Shampoo Seda Ceramidas 325ml','shampoo--seda'],['Haskell','Shampoo Haskell Murumuru 300ml','shampoo--haskell'],['Bio Extratus','Shampoo Bio Extratus Equilíbrio 250ml','shampoo--bio-extratus']],
  'condicionador':[['Elseve','Condicionador Elseve Reparação Total 5 Química 200ml','condicionador'],['Pantene','Condicionador Pantene Pro-V Hidratação 175ml','condicionador--pantene'],['Seda','Condicionador Seda Ceramidas 325ml','condicionador--seda'],['Bio Extratus','Condicionador Bio Extratus Tutano 250ml','condicionador--bio-extratus']],
  'mascara-capilar':[['Haskell','Máscara Capilar Haskell Quina Rosa 300g','mascara-capilar'],['Bio Extratus','Máscara Capilar Bio Extratus Tutano Ceramidas 1kg','mascara-capilar--bio-extratus'],['Salon Line','Máscara Salon Line Meu Liso Antifrizz 300g','mascara-capilar--salon-line'],['Skala','Máscara Capilar Skala Brasil Reconstrução 450g','mascara-capilar--skala']],
  'creme-pentear':[['Salon Line','Creme de Pentear Salon Line Hidratação Profunda 1kg','creme-pentear'],['Skala','Creme de Pentear Skala 3 em 1 Uva 500g','creme-pentear--skala'],['Seda','Creme para Pentear Seda Toque de Seda 300ml','creme-pentear--seda']],
  'finalizador':[['Elseve','Óleo Extraordinário Elseve 100ml','finalizador'],['Haskell','Óleo Nutritivo Haskell Infusão de Óleos 100ml','finalizador--haskell'],['Salon Line','Óleo Salon Line Multy Milagres Maracujá e Argan 50ml','finalizador--salon-line']],
  'coloracao':[['Koleston','Coloração Koleston 77 Marrom Dourado','coloracao'],['L’Oréal Paris','Coloração Imédia Excellence 6.0 Louro Escuro','coloracao--l-oreal-paris'],['Garnier','Coloração Garnier Nutrisse 366 Ameixa','coloracao--garnier']],
  'escova':[['Marco Boni','Escova de Cabelo Oval Marco Boni','escova']],
  'perfume-f':[['Eudora','Deo Colônia Velvet Cristal Eudora 100ml','perfume-f'],['O Boticário','Perfume Feminino O Boticário Liz Flora 100ml','perfume-f--o-boticario'],['Natura','Perfume Feminino Natura Luna Clássico 75ml','perfume-f--natura'],['Avon','Perfume Feminino Avon Candid 50ml','perfume-f--avon']],
  'perfume-m':[['Eudora','Deo Colônia Pulse Action Eudora 100ml','perfume-m'],['O Boticário','Perfume Masculino O Boticário Coffee Addictive 100ml','perfume-m--o-boticario'],['Natura','Deo Parfum Natura Essencial Clássico Masculino 100ml','perfume-m--natura'],['Avon','Perfume Masculino Avon Perceive 100ml','perfume-m--avon']],
  'body-splash':[['Eudora','Spray Perfumado Instance Baunilha Eudora 200ml','body-splash'],['O Boticário','Body Splash O Boticário Nativa Spa Lilac 200ml','body-splash--o-boticario']],
  'desodorante':[['Nivea','Desodorante Aerosol Nivea Sem Perfume 150ml','desodorante'],['Dove','Desodorante Dove Stick Original 45g','desodorante--dove'],['Monange','Desodorante Aerosol Monange Anti Invisível 150ml','desodorante--monange']],
  'hidratante-corpo':[['Nivea','Loção Hidratante Nivea Milk Pele Extrasseca 400ml','hidratante-corpo'],['Dove','Sérum Hidratante Corporal Dove Niacinamida 450g','hidratante-corpo--dove'],['Monange','Creme Hidratante Monange Iogurte com Aveia 200ml','hidratante-corpo--monange']],
  'sabonete':[['Dove','Sabonete em Barra Dove Original 90g','sabonete'],['Nivea','Sabonete Nivea Bath Care Aveia 90g','sabonete--nivea'],['Natura','Sabonetes Natura Tododia Camomila e Lavanda','sabonete--natura']],
  'oleo-corpo':[['Natura','Óleo Trifásico Corporal Natura Ekos Castanha 200ml','oleo-corpo--natura'],['Dove','Óleo Sérum Corporal Dove 150ml','oleo-corpo']],
  'esfoliante':[['Nivea','Esfoliante Corporal para o Banho Nivea 200ml','esfoliante']],
  'depilacao':[['Depil Bella','Cera Depilatória Depil Bella Mel e Aloe Vera 100g','depilacao']],
  'esmalte':[['Risqué','Esmalte Cremoso Risqué Gabriela 8ml','esmalte'],['Colorama','Esmalte Cremoso Colorama 8ml','esmalte--colorama'],['Dailus','Esmalte Dailus 8ml','esmalte--dailus']],
  'base-unha':[['Risqué','Base Fortalecedora Risqué Care 8ml','base-unha'],['Colorama','Base Fortalecedora Colorama','base-unha--colorama']],
  'removedor':[['Risqué','Removedor de Esmalte Risqué Care 100ml','removedor']],
  'alicate':[['Mundial','Alicate de Cutícula Mundial Classic 522','alicate']],
  'kit-pronto':[['Eudora','Kit Eudora Club 6 (deo colônia + loção hidratante)','kit-pronto']],
  'kit-montado':[['','Nécessaire com 3 produtos','kit-montado']]
};

/* utilidades */
function $(s,c){return (c||document).querySelector(s)}
function $$(s,c){return [].slice.call((c||document).querySelectorAll(s))}
function wa(t){return 'https://wa.me/'+WA+'?text='+encodeURIComponent(t)}
function el(tag,attrs,kids){var e=document.createElement(tag);for(var k in attrs||{}){if(k==='text')e.textContent=attrs[k];else if(k==='html')e.innerHTML=attrs[k];else e.setAttribute(k,attrs[k])}(kids||[]).forEach(function(c){c&&e.appendChild(c)});return e}
function money(v){return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function catOf(nome){for(var i=0;i<CATS.length;i++)if(CATS[i].nome===nome)return CATS[i];return CATS[0]}
function prod(id){for(var i=0;i<PRODUTOS.length;i++)if(PRODUTOS[i].id===id)return PRODUTOS[i]}
var store={get:function(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* movimento: o botão do rodapé desliga tudo que se mexe sozinho */
function reduced(){return document.documentElement.dataset.motion==='reduce'||matchMedia('(prefers-reduced-motion: reduce)').matches}
if(store.get('ae-motion')==='reduce')document.documentElement.dataset.motion='reduce';
var motionListeners=[];
function onMotion(fn){motionListeners.push(fn)}
$$('.motion-toggle').forEach(function(b){
  function sync(){b.setAttribute('aria-pressed',document.documentElement.dataset.motion==='reduce')}
  sync();
  b.addEventListener('click',function(){
    var on=document.documentElement.dataset.motion!=='reduce';
    if(on)document.documentElement.dataset.motion='reduce';else delete document.documentElement.dataset.motion;
    store.set('ae-motion',on?'reduce':null);sync();motionListeners.forEach(function(f){f()});
  });
});

/* links de WhatsApp */
$$('[data-wa]').forEach(function(a){a.href=wa(a.dataset.wa||'Olá! Vim pelo site da Alta Estima.');a.target='_blank';a.rel='noopener'});

/* menu do celular */
var mb=$('.menu-btn'),nav=$('#nav');
if(mb&&nav){
  mb.addEventListener('click',function(){var o=mb.getAttribute('aria-expanded')!=='true';mb.setAttribute('aria-expanded',o);nav.classList.toggle('open',o)});
  nav.addEventListener('click',function(e){if(e.target.closest('a')){mb.setAttribute('aria-expanded','false');nav.classList.remove('open')}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){mb.setAttribute('aria-expanded','false');nav.classList.remove('open');mb.focus()}});
}

/* ---------- sacola ---------- */
var KEY='ae-sacola-v1';
var bag=(store.get(KEY)||[]).filter(function(i){return prod(i.id)});
function qty(id){for(var i=0;i<bag.length;i++)if(bag[i].id===id)return bag[i].q;return 0}
function setQty(id,q){
  var i;for(i=0;i<bag.length;i++)if(bag[i].id===id)break;
  if(q<=0){if(i<bag.length)bag.splice(i,1)}
  else if(i<bag.length)bag[i].q=Math.min(q,99);
  else{bag.push({id:id,q:1,obs:''});justAdded=id}
  save();
}
var justAdded=null;
function save(){store.set(KEY,bag);paint()}
function totalItems(){return bag.reduce(function(s,i){return s+i.q},0)}

var drawer,scrim,lastFocus,view='list';
function buildDrawer(){
  scrim=el('div',{class:'scrim',hidden:''});
  drawer=el('aside',{class:'bag',id:'sacola',role:'dialog','aria-modal':'true','aria-labelledby':'bag-title',hidden:''});
  drawer.innerHTML='<div class="bag-head"><h2 id="bag-title">Sua sacola</h2><button class="x" type="button" aria-label="Fechar sacola">×</button></div><div class="bag-body"></div><div class="bag-foot"></div>';
  document.body.appendChild(scrim);document.body.appendChild(drawer);
  scrim.addEventListener('click',closeBag);
  $('.x',drawer).addEventListener('click',closeBag);
  drawer.addEventListener('keydown',function(e){
    if(e.key==='Escape'){closeBag();return}
    if(e.key!=='Tab')return;
    var f=$$('button,a[href],input,select,textarea',drawer).filter(function(x){return !x.disabled&&x.offsetParent!==null});
    if(!f.length)return;
    if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f[f.length-1].focus()}
    else if(!e.shiftKey&&document.activeElement===f[f.length-1]){e.preventDefault();f[0].focus()}
  });
}
function openBag(v){
  if(!drawer)buildDrawer();
  view=v||'list';lastFocus=document.activeElement;
  scrim.hidden=false;drawer.hidden=false;renderBag();
  requestAnimationFrame(function(){scrim.classList.add('show');drawer.classList.add('show')});
  document.body.style.overflow='hidden';
  setTimeout(function(){$('.x',drawer).focus()},50);
}
function closeBag(){
  if(!drawer||drawer.hidden)return;
  scrim.classList.remove('show');drawer.classList.remove('show','tear');
  document.body.style.overflow='';
  setTimeout(function(){scrim.hidden=true;drawer.hidden=true},reduced()?0:300);
  if(lastFocus&&lastFocus.focus)lastFocus.focus();
}
$$('[data-open-bag]').forEach(function(b){b.addEventListener('click',function(){openBag()})});

function receiptHead(){
  return '<div class="r-head"><img src="'+ROOT+'assets/logo.svg" alt="Alta Estima" width="120" height="80"><small>Pedido pelo site<br>'+new Date().toLocaleDateString('pt-BR')+'</small></div>';
}
function renderBag(){
  if(!drawer||drawer.hidden)return;
  var body=$('.bag-body',drawer),foot=$('.bag-foot',drawer);
  $('#bag-title').textContent=view==='checkout'?'Finalizar pedido':view==='done'?'Pedido pronto':'Sua sacola';
  if(view==='done'){
    body.innerHTML='<div class="done"><b>Seu pedido abriu no WhatsApp.</b><span class="senha"><small>Senha do pedido</small>'+senha+'</span><p>Confira a mensagem e toque em enviar. A equipe responde por lá com preço, estoque e o combinado da retirada ou entrega.</p></div>';
    foot.innerHTML='';
    foot.appendChild(el('button',{class:'btn block',type:'button',text:'Limpar a sacola'})).onclick=function(){bag=[];save();closeBag()};
    foot.appendChild(el('button',{class:'btn line block',type:'button',text:'Voltar para a sacola'})).onclick=function(){view='list';renderBag()};
    return;
  }
  if(!bag.length){
    body.innerHTML='<div class="empty"><b>A sacola está vazia.</b>Escolha os produtos na loja online e eles aparecem aqui, como num cupom.<br><a class="btn" href="'+ROOT+'loja/">Ir para a loja online</a></div>';
    foot.innerHTML='';return;
  }
  if(view==='checkout'){renderCheckout(body,foot);return}

  var r=el('div',{class:'receipt'});r.innerHTML=receiptHead();
  var ul=el('ul',{class:'r-list'});
  bag.forEach(function(item){
    var p=prod(item.id);
    var li=el('li',{class:'r-item'});
    if(item.id!==justAdded)li.style.animation='none';
    li.innerHTML='<div class="r-row"><span><span class="r-name"></span><br><span class="r-cat"></span></span><span class="r-q"></span></div>'+
      '<label class="sr" for="obs-'+p.id+'">Cor, tom ou marca de '+p.nome+'</label><input class="r-note" id="obs-'+p.id+'" maxlength="80" placeholder="Cor, tom ou marca (opcional)">'+
      '<div class="r-ctrl"><span class="step"><button type="button" aria-label="Tirar um">−</button><output aria-live="polite"></output><button type="button" aria-label="Pôr mais um">+</button></span><button type="button" class="r-del">Remover</button></div>';
    $('.r-name',li).textContent=p.nome;$('.r-cat',li).textContent=p.cat;
    $('.r-q',li).textContent=(p.preco?money(p.preco*item.q):'x'+item.q);
    $('output',li).textContent=item.q;
    var note=$('.r-note',li);note.value=item.obs||'';
    note.addEventListener('input',function(){item.obs=note.value;store.set(KEY,bag)});
    var bs=$$('.step button',li);
    bs[0].onclick=function(){setQty(p.id,item.q-1);focusAfter(p.id,0)};
    bs[1].onclick=function(){setQty(p.id,item.q+1);focusAfter(p.id,1)};
    $('.r-del',li).onclick=function(){setQty(p.id,0);var f=$('.r-note',drawer)||$('.x',drawer);f.focus()};
    ul.appendChild(li);
  });
  justAdded=null;
  r.appendChild(ul);
  var priced=bag.every(function(i){return prod(i.id).preco});
  var tot=el('div',{class:'r-total'});
  tot.innerHTML='<span>'+totalItems()+(totalItems()===1?' item':' itens')+'</span><span>'+(priced?money(bag.reduce(function(s,i){return s+prod(i.id).preco*i.q},0)):'preço no WhatsApp')+'</span>';
  r.appendChild(tot);
  r.appendChild(el('p',{class:'r-foot',html:'Preço, cor e estoque confirmados<br>pela equipe no WhatsApp.'}));
  body.innerHTML='';body.appendChild(r);
  foot.innerHTML='';
  foot.appendChild(el('button',{class:'btn block',type:'button',text:'Continuar o pedido'})).onclick=function(){view='checkout';renderBag();var f=$('input',drawer);f&&f.focus()};
  foot.appendChild(el('a',{class:'btn line block',href:ROOT+'loja/',text:'Escolher mais produtos'}));
}
function focusAfter(id,i){var b=$('#obs-'+id,drawer);if(b){var s=$$('.step button',b.parentNode)[i];s&&s.focus()}else{var f=$('.r-note',drawer)||$('.x',drawer);f.focus()}}

/* checkout: o pedido vira uma mensagem de WhatsApp; nada é gravado fora do aparelho */
var form=store.get('ae-dados')||{},senha='';
function renderCheckout(body,foot){
  body.innerHTML='';
  var f=el('form',{class:'form',novalidate:''});
  f.innerHTML=
    '<button type="button" class="back">← Voltar para a sacola</button>'+
    '<div class="field"><label for="f-nome">Seu nome</label><input id="f-nome" name="nome" autocomplete="name" required maxlength="60"><span class="err" id="e-nome" hidden>Escreva o seu nome.</span></div>'+
    '<fieldset><legend>Como quer receber</legend><div class="opts">'+
      LOJAS.map(function(l){return '<label class="opt"><input type="radio" name="receber" value="'+l.id+'"><span>Retirar na '+l.nome+'<small>'+l.end+' · '+l.hora+'</small></span></label>'}).join('')+
      '<label class="opt"><input type="radio" name="receber" value="entrega"><span>Entrega em casa<small>Toda Governador Valadares · taxa e horário no WhatsApp</small></span></label>'+
    '</div><span class="err" id="e-receber" hidden>Escolha retirada ou entrega.</span></fieldset>'+
    '<div id="f-ender" hidden class="form">'+
      '<div class="field"><label for="f-rua">Rua e número</label><input id="f-rua" name="rua" autocomplete="street-address" maxlength="90"><span class="err" id="e-rua" hidden>Escreva a rua e o número.</span></div>'+
      '<div class="field"><label for="f-bairro">Bairro</label><input id="f-bairro" name="bairro" maxlength="50"><span class="err" id="e-bairro" hidden>Escreva o bairro.</span></div>'+
    '</div>'+
    '<fieldset><legend>Como prefere pagar</legend><div class="opts row">'+
      ['Pix','Cartão','Dinheiro'].map(function(p){return '<label class="opt"><input type="radio" name="pag" value="'+p+'"><span>'+p+'</span></label>'}).join('')+
    '</div></fieldset>'+
    '<div class="field"><label for="f-obs">Observação (opcional)</label><textarea id="f-obs" name="obs" maxlength="300" placeholder="Ex.: é para presente, quero retirar depois das 17h"></textarea></div>'+
    '<p class="lgpd">Seus dados vão só na mensagem para o WhatsApp da loja, para preparar o pedido. O site não envia nada para outro lugar. <a href="'+ROOT+'privacidade/">Como usamos seus dados</a></p>';
  body.appendChild(f);
  // repõe o que a pessoa já tinha digitado (fica só neste aparelho)
  ['nome','rua','bairro','obs'].forEach(function(k){if(form[k])f.elements[k].value=form[k]});
  ['receber','pag'].forEach(function(k){if(form[k]){var r=$('input[name="'+k+'"][value="'+form[k]+'"]',f);r&&(r.checked=true)}});
  function sync(){$('#f-ender',f).hidden=f.elements.receber.value!=='entrega'}
  sync();
  f.addEventListener('change',sync);
  f.addEventListener('input',function(){['nome','rua','bairro','obs','receber','pag'].forEach(function(k){form[k]=f.elements[k].value});store.set('ae-dados',form)});
  $('.back',f).onclick=function(){view='list';renderBag()};
  f.addEventListener('submit',function(e){e.preventDefault();send(f)});

  foot.innerHTML='';
  var b=el('button',{class:'btn wa block',type:'button'});
  b.innerHTML='<svg aria-hidden="true"><use href="#i-wa"/></svg>Enviar pedido pelo WhatsApp';
  b.onclick=function(){send(f)};
  foot.appendChild(b);
  foot.appendChild(el('p',{class:'note',text:'A equipe confirma preço e estoque antes de fechar.'}));
}
function err(f,name,on){var i=f.elements[name],m=$('#e-'+name,f);if(m)m.hidden=!on;if(i&&i.setAttribute)i.setAttribute('aria-invalid',on?'true':'false');return on}
function send(f){
  var v=function(k){return (f.elements[k].value||'').trim()};
  var bad=[];
  if(err(f,'nome',!v('nome')))bad.push('nome');
  var rec=f.elements.receber.value;
  $('#e-receber',f).hidden=!!rec;if(!rec)bad.push('receber');
  if(rec==='entrega'){if(err(f,'rua',!v('rua')))bad.push('rua');if(err(f,'bairro',!v('bairro')))bad.push('bairro')}
  if(bad.length){var first=bad[0]==='receber'?$('input[name="receber"]',f):f.elements[bad[0]];first.focus();return}

  // senha de balcão: letra + hora e minuto do pedido, para a cliente citar na conversa
  var d=new Date();senha='ABCDEFGHJKLMNPRSTUVWXYZ'.charAt(Math.floor(Math.random()*23))+'-'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0');
  var lines=['Olá! Pedido pelo site da Alta Estima (senha '+senha+'):',''];
  bag.forEach(function(i){var p=prod(i.id);lines.push('• '+i.q+'x '+p.nome+(i.obs?' ('+i.obs.trim()+')':''))});
  lines.push('','Nome: '+v('nome'));
  if(rec==='entrega')lines.push('Entrega: '+v('rua')+', '+v('bairro'));
  else LOJAS.forEach(function(l){if(l.id===rec)lines.push('Retirada: '+l.nome+' ('+l.end+')')});
  if(f.elements.pag.value)lines.push('Pagamento: '+f.elements.pag.value);
  if(v('obs'))lines.push('Obs.: '+v('obs'));
  lines.push('','Pode confirmar preço e estoque?');
  var url=wa(lines.join('\n'));

  var w=window.open(url,'_blank','noopener');
  if(!w)location.href=url;
  drawer.classList.add('tear');
  setTimeout(function(){drawer.classList.remove('tear');view='done';renderBag();$('.bag-foot .btn',drawer).focus()},reduced()?0:450);
}

/* contador do cabeçalho + botões dos cartões */
function paint(){
  var n=totalItems();
  $$('.bag-btn .n').forEach(function(c){c.textContent=n;if(n)c.removeAttribute('data-zero');else c.setAttribute('data-zero','')});
  $$('.bag-btn').forEach(function(b){b.setAttribute('aria-label','Sacola, '+n+(n===1?' item':' itens'))});
  $$('.tag[data-id]').forEach(paintTag);
  renderBag();
}
function bump(){$$('.bag-btn').forEach(function(b){b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump')})}

/* fotos das marcas passando: só nos cartões visíveis, um terço por vez a cada segundo,
   para no mouse/foco, depois de um clique na marca e no "Reduzir movimento" */
var galeria=[],vistos=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(function(es){es.forEach(function(e){e.target._vis=e.isIntersecting})}):null;
var tick=0;
setInterval(function(){
  tick++;if(reduced()||document.hidden)return;
  galeria.forEach(function(a,i){
    if(!vistos)a._vis=true;
    if(a._vis&&!a._hold&&!a._over&&!a.hidden&&(tick+i)%3===0)a._go((a._k+1)%a._n);
  });
},1000);
function watch(a){
  if(vistos)vistos.observe(a);
  a.addEventListener('mouseenter',function(){a._over=true});a.addEventListener('mouseleave',function(){a._over=false});
  a.addEventListener('focusin',function(){a._over=true});a.addEventListener('focusout',function(){a._over=false});
}

/* etiqueta de prateleira */
function tag(p){
  var c=catOf(p.cat);
  var a=el('article',{class:'tag','data-id':p.id,style:'--tc:var(--cat-'+c.cor+')'});
  var f=FOTOS[p.id]||[];
  a.innerHTML=(f.length?'<div class="ph"><span class="who" aria-hidden="true"></span></div>':'')+'<div class="top"><span class="cat"></span><h3></h3></div>'+
    '<div class="body"><p></p>'+(p.marcas.length?'<span class="brands"><b>Marcas:</b> </span>':'')+(f.length?'<span class="ex" aria-live="polite"></span>':'')+
    '<div class="foot"><span class="price"></span><span class="act"></span></div></div>';
  $('.cat',a).textContent=p.cat;$('h3',a).textContent=p.nome;$('p',a).textContent=p.desc;
  // marcas com foto viram botões que trocam a foto; as outras ficam só no texto
  var br=$('.brands',a),btns=[];
  p.marcas.forEach(function(m,i){
    if(i)br.appendChild(document.createTextNode(', '));
    var k=-1;f.forEach(function(x,j){if(x[0]===m.replace("'",'’'))k=j});
    if(k<0){br.appendChild(document.createTextNode(m));return}
    var b=el('button',{type:'button',class:'mk','aria-pressed':'false',text:m,'aria-label':'Ver foto de '+p.nome+' '+m});
    b.onclick=function(){a._go(k,true)};btns[k]=b;br.appendChild(b);
  });
  if(f.length){
    var ph=$('.ph',a),imgs=f.map(function(x){var im=el('img',{loading:'lazy',width:'480',height:'360',alt:x[1],src:ROOT+'assets/produtos/'+x[2]+'.webp'});ph.appendChild(im);return im});
    a._n=f.length;
    a._go=function(k,user){
      if(user)a._hold=true;
      imgs.forEach(function(im,j){im.classList.toggle('on',j===k)});
      btns.forEach(function(b,j){b&&b.setAttribute('aria-pressed',j===k)});
      $('.who',a).textContent=f[k][0];$('.ex',a).textContent='Na foto: '+f[k][1];a._k=k;
    };
    a._go(0);
    if(f.length>1){galeria.push(a);watch(a)}
  }
  $('.price',a).innerHTML=p.preco?'<b>'+money(p.preco)+'</b>à vista na loja':'Preço<b>no WhatsApp</b>';
  paintTag(a);
  return a;
}
function paintTag(a){
  var id=a.dataset.id,p=prod(id),q=qty(id),act=$('.act',a);
  var had=act.firstChild&&act.contains(document.activeElement)?document.activeElement:null,wasStep=had&&had.closest('.step');
  act.innerHTML='';
  if(!q){
    var b=el('button',{class:'add',type:'button',text:'Adicionar','aria-label':'Adicionar '+p.nome+' à sacola'});
    b.onclick=function(){setQty(id,1);bump();var s=$('.step button:last-child',a);s&&s.focus()};
    act.appendChild(b);
    if(had)b.focus();
  }else{
    var s=el('span',{class:'step'});
    s.innerHTML='<button type="button" aria-label="Tirar um '+p.nome+'">−</button><output aria-live="polite"></output><button type="button" aria-label="Pôr mais um '+p.nome+'">+</button>';
    $('output',s).textContent=q;
    var bs=$$('button',s);
    bs[0].onclick=function(){setQty(id,q-1);var n=$('.act button',a);n&&n.focus()};
    bs[1].onclick=function(){setQty(id,q+1);bump();var n=$('.step button:last-child',a);n&&n.focus()};
    act.appendChild(s);
    if(had&&!wasStep)bs[1].focus();
  }
}

/* ---------- início ---------- */
// prateleiras da página inicial: a foto de clima e depois os produtos daquela prateleira passando
// data-vitrine="id" usa a 1ª foto do produto; "id*" usa as fotos de todas as marcas
$$('.cats a[data-vitrine]').forEach(function(a){
  var fotos=[];
  a.dataset.vitrine.split(',').forEach(function(t){
    var todas=t.slice(-1)==='*',id=todas?t.slice(0,-1):t,f=FOTOS[id]||[];
    (todas?f:f.slice(0,1)).forEach(function(x){fotos.push(x)});
  });
  var imgs=[$('img',a)];
  fotos.forEach(function(x){
    var im=el('img',{class:'pk',loading:'lazy',width:'480',height:'360',alt:'',src:ROOT+'assets/produtos/'+x[2]+'.webp'});
    a.insertBefore(im,$('span',a));imgs.push(im);
  });
  imgs[0].classList.add('on');
  a._n=imgs.length;a._k=0;
  a._go=function(k){imgs.forEach(function(im,j){im.classList.toggle('on',j===k)});a._k=k};
  if(a._n>1){galeria.push(a);watch(a)}
});

var shelf=$('#prateleira');
if(shelf)PRODUTOS.filter(function(p){return p.destaque}).slice(0,8).forEach(function(p){shelf.appendChild(tag(p))});

var track=$('#track');
if(track)[0,1].forEach(function(copy){MARCAS.forEach(function(m){
  var a=el('a',{href:wa('Olá! Vi no site: vocês têm produtos '+m+'?'),target:'_blank',rel:'noopener',text:m});
  if(copy){a.setAttribute('aria-hidden','true');a.tabIndex=-1}
  track.appendChild(a);
})});

var stage=$('#stage');
if(stage){
  var imgs=$$('img',stage),cap=$('#stage-cap'),dots=$('#dots'),cur=0,timer=null;
  imgs.forEach(function(im,i){
    var b=el('button',{type:'button','aria-label':'Ver foto '+(i+1)+' de '+imgs.length});
    b.onclick=function(){stop();show(i)};dots.appendChild(b);
  });
  function show(i){imgs[cur].classList.remove('on');dots.children[cur].removeAttribute('aria-current');cur=i;imgs[i].classList.add('on');dots.children[i].setAttribute('aria-current','true');cap.textContent=imgs[i].dataset.cap}
  function stop(){clearInterval(timer);timer=null}
  function start(){stop();if(!reduced())timer=setInterval(function(){show((cur+1)%imgs.length)},5000)}
  show(0);start();onMotion(start);
  document.addEventListener('visibilitychange',function(){document.hidden?stop():start()});
}

/* ---------- loja online ---------- */
var grid=$('#grade');
if(grid){
  var chips=$('#chips'),q=$('#busca'),count=$('#contagem'),none=$('#nada');
  var params=new URLSearchParams(location.search);
  var active=params.get('cat')||'';
  if(active&&!CATS.some(function(c){return c.nome===active}))active='';
  [''].concat(CATS.map(function(c){return c.nome})).forEach(function(n){
    var b=el('button',{type:'button',class:'chip','aria-pressed':String(n===active),text:n||'Tudo'});
    b.onclick=function(){active=n;$$('.chip',chips).forEach(function(c){c.setAttribute('aria-pressed',c===b)});run(true)};
    chips.appendChild(b);
  });
  if(params.get('q'))q.value=params.get('q');
  var tags={};PRODUTOS.forEach(function(p){tags[p.id]=tag(p);grid.appendChild(tags[p.id])});
  function norm(s){return s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()}
  function run(push){
    var t=norm(q.value.trim()),n=0;
    PRODUTOS.forEach(function(p){
      var ok=(!active||p.cat===active)&&(!t||norm(p.nome+' '+p.cat+' '+p.desc+' '+p.marcas.join(' ')).indexOf(t)>-1);
      tags[p.id].hidden=!ok;if(ok)n++;
    });
    count.textContent=n+(n===1?' produto':' produtos')+(active?' em '+active:'')+(t?' para "'+q.value.trim()+'"':'');
    none.hidden=n>0;
    if(push){var u=new URL(location.href);active?u.searchParams.set('cat',active):u.searchParams.delete('cat');t?u.searchParams.set('q',q.value.trim()):u.searchParams.delete('q');history.replaceState(null,'',u)}
    var w=$('#nada-wa');if(w)w.href=wa('Olá! Procurei no site e não achei: '+(q.value.trim()||active)+'. Vocês têm?');
  }
  q.addEventListener('input',function(){run(true)});
  run(false);
  if(location.hash==='#sacola')openBag();
}

paint();
})();
