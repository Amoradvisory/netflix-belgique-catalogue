
const M = window.MOVIES || [];
const E = id => document.getElementById(id);
const S = {limit:120, fav:false, seen:false, compact:false};
const F = new Set(JSON.parse(localStorage.getItem("nfbe_favorites") || "[]"));
const V = new Set(JSON.parse(localStorage.getItem("nfbe_seen") || "[]"));

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}
function uniq(a){ return [...new Set(a)].sort((a,b)=>String(a).localeCompare(String(b),"fr")); }
function save(){
  localStorage.setItem("nfbe_favorites", JSON.stringify([...F]));
  localStorage.setItem("nfbe_seen", JSON.stringify([...V]));
  E("favCount").textContent = F.size;
  E("seenCount").textContent = V.size;
}
function filtered(){
  const q=E("q").value.trim().toLowerCase(), g=E("group").value, t=E("theme").value, y=E("year").value;
  let a=M.filter(m=>{
    if(g && m.group!==g) return false;
    if(t && m.theme!==t) return false;
    if(y && String(m.year)!==y) return false;
    if(S.fav && !F.has(m.id)) return false;
    if(S.seen && !V.has(m.id)) return false;
    if(q){
      const hay=(m.title+" "+m.group+" "+m.theme+" "+m.genres.join(" ")+" "+(m.year||"")+" "+m.mini).toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
  const s=E("sort").value;
  a.sort((a,b)=>{
    if(s==="yearDesc") return (b.year||0)-(a.year||0)||a.title.localeCompare(b.title,"fr");
    if(s==="yearAsc") return (a.year||9999)-(b.year||9999)||a.title.localeCompare(b.title,"fr");
    if(s==="title") return a.title.localeCompare(b.title,"fr");
    if(s==="imdb") return (b.imdb||0)-(a.imdb||0)||a.title.localeCompare(b.title,"fr");
    return a.group.localeCompare(b.group,"fr")||a.theme.localeCompare(b.theme,"fr")||(b.year||0)-(a.year||0)||a.title.localeCompare(b.title,"fr");
  });
  return a;
}
function card(m){
  const genres=m.genres.slice(0,3).map(g=>"<span>"+esc(g)+"</span>").join(" • ");
  return '<article class="card">'+
    '<div class="poster">'+(m.poster?'<img loading="lazy" src="'+esc(m.poster)+'" alt="">':'<div class="noimg">🎬</div>')+'</div>'+
    '<div class="body"><div class="title">'+esc(m.title)+'</div>'+
    '<div class="meta"><span class="pill">'+esc(m.year||"?")+'</span>'+(m.runtime?'<span class="pill">'+m.runtime+' min</span>':'')+(m.imdb?'<span class="pill">IMDb '+m.imdb+'</span>':'')+'</div>'+
    '<div class="theme">'+esc(m.theme)+'</div><div class="meta">'+genres+'</div>'+
    '<div class="mini">'+esc(m.mini)+'</div>'+
    '<div class="actions">'+(m.netflix?'<a class="nf" target="_blank" rel="noopener" href="'+esc(m.netflix)+'">Netflix</a>':'')+
    '<a target="_blank" rel="noopener" href="'+esc(m.justwatch)+'">Détails</a>'+
    '<button data-fav="'+esc(m.id)+'" class="'+(F.has(m.id)?"favOn":"")+'">★ '+(F.has(m.id)?"Favori":"À voir")+'</button>'+
    '<button data-seen="'+esc(m.id)+'" class="'+(V.has(m.id)?"seenOn":"")+'">✓ '+(V.has(m.id)?"Vu":"Marquer vu")+'</button></div></div></article>';
}
function renderThemes(base){
  const c={}; base.forEach(m=>c[m.theme]=(c[m.theme]||0)+1);
  E("themes").innerHTML=Object.keys(c).sort((a,b)=>a.localeCompare(b,"fr")).map(t=>
    '<button class="themeBtn '+(E("theme").value===t?"active":"")+'" data-theme="'+esc(t)+'"><span>'+esc(t)+'</span><b>'+c[t]+'</b></button>'
  ).join("");
  document.querySelectorAll(".themeBtn").forEach(b=>b.onclick=()=>{ E("theme").value=b.dataset.theme; S.limit=120; render(); window.scrollTo({top:0,behavior:"smooth"}); });
}
function render(){
  const a=filtered(), shown=a.slice(0,S.limit);
  E("count").textContent=a.length.toLocaleString("fr-BE");
  E("heading").textContent=E("theme").value||E("group").value||(S.fav?"Mes favoris":S.seen?"Déjà vus":"Tous les films");
  let h="", last="";
  for(const m of shown){
    if(E("sort").value==="theme"){
      const key=m.theme+"|"+m.year;
      if(key!==last){ h+='<div class="yearHead">'+esc(m.theme)+' — '+esc(m.year||"Année inconnue")+'</div>'; last=key; }
    }
    h+=card(m);
  }
  E("grid").innerHTML=h||'<div class="empty">Aucun film ne correspond à ces filtres.</div>';
  E("more").style.display=a.length>S.limit?"block":"none";
  E("more").textContent="Afficher 120 films de plus"+(a.length>S.limit?" ("+(a.length-S.limit)+" restants)":"");
  document.body.classList.toggle("compact",S.compact);
  renderThemes(E("group").value?M.filter(m=>m.group===E("group").value):M);
  document.querySelectorAll("[data-fav]").forEach(b=>b.onclick=()=>{const id=b.dataset.fav;F.has(id)?F.delete(id):F.add(id);save();render();});
  document.querySelectorAll("[data-seen]").forEach(b=>b.onclick=()=>{const id=b.dataset.seen;V.has(id)?V.delete(id):V.add(id);save();render();});
}
function init(){
  uniq(M.map(m=>m.group)).forEach(v=>E("group").add(new Option(v,v)));
  uniq(M.map(m=>m.theme)).forEach(v=>E("theme").add(new Option(v,v)));
  uniq(M.map(m=>m.year).filter(Boolean)).sort((a,b)=>b-a).forEach(v=>E("year").add(new Option(v,v)));
  E("themeCount").textContent=uniq(M.map(m=>m.theme)).length;
  save(); render();
}
["q","group","theme","year","sort"].forEach(id=>{
  E(id).addEventListener(id==="q"?"input":"change",()=>{
    if(id==="group") E("theme").value="";
    S.limit=120; render();
  });
});
E("more").onclick=()=>{S.limit+=120;render();};
E("favoritesOnly").onclick=()=>{S.fav=!S.fav;S.seen=false;S.limit=120;render();};
E("seenOnly").onclick=()=>{S.seen=!S.seen;S.fav=false;S.limit=120;render();};
E("viewMode").onclick=function(){S.compact=!S.compact;this.textContent=S.compact?"▦ Vue cartes":"☷ Vue compacte";render();};
E("surprise").onclick=()=>{const a=filtered();if(!a.length)return;const m=a[Math.floor(Math.random()*a.length)];E("q").value=m.title;S.limit=120;render();window.scrollTo({top:0,behavior:"smooth"});};
E("reset").onclick=()=>{E("q").value="";E("group").value="";E("theme").value="";E("year").value="";E("sort").value="theme";S.fav=false;S.seen=false;S.limit=120;render();};
E("csv").onclick=()=>{
  const rows=[["Titre","Année","Famille","Thème","Genres","Mini-résumé","Netflix","JustWatch"]].concat(filtered().map(m=>[m.title,m.year||"",m.group,m.theme,m.genres.join(" / "),m.mini,m.netflix,m.justwatch]));
  const csv=rows.map(r=>r.map(v=>'"'+String(v||"").replace(/"/g,'""')+'"').join(";")).join("\r\n");
  const u=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");a.href=u;a.download="Netflix_Belgique_filtre.csv";a.click();URL.revokeObjectURL(u);
};
init();
