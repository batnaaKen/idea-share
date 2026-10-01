const {createClient}=supabase;
const db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let all=[];
let selected="";

async function load(){
  const r=await db.from("posts").select("*").order("created_at",{ascending:false});
  if(r.error){
    document.getElementById("list").textContent=r.error.message;
    return;
  }
  all=r.data||[];
  renderTags();
  render();
}

function renderTags(){
  const set=[...new Set(all.flatMap(x=>x.tags||[]))].filter(Boolean).sort();
  const box=document.getElementById("tags");
  box.innerHTML="";

  const allButton=document.createElement("button");
  allButton.type="button";
  allButton.className="tag filter-tag"+(!selected?" active":"");
  allButton.textContent="すべて";
  allButton.addEventListener("click",()=>setTag(""));
  box.appendChild(allButton);

  set.forEach(t=>{
    const b=document.createElement("button");
    b.type="button";
    b.className="tag filter-tag"+(selected===t?" active":"");
    b.textContent=t;
    b.addEventListener("click",()=>setTag(t));
    box.appendChild(b);
  });
}

function setTag(t){
  selected=t;
  renderTags();
  render();
}

function render(){
  let arr=all.filter(x=>!selected||(x.tags||[]).includes(selected));
  if(document.getElementById("sort").value==="old")arr=[...arr].reverse();

  document.getElementById("list").innerHTML=arr.length
    ?arr.map(x=>
      '<article class="idea">'+
        '<h2><a href="detail.html?id='+encodeURIComponent(x.id)+'">'+escapeHtml(x.title)+'</a></h2>'+
        '<div class="meta">'+escapeHtml(x.author)+' ・ '+new Date(x.created_at).toLocaleDateString("ja-JP")+'</div>'+
        '<div class="summary">'+escapeHtml(x.description)+'</div>'+
        '<div class="tags">'+(x.tags||[]).map(t=>'<span class="tag">'+escapeHtml(t)+'</span>').join("")+'</div>'+
      '</article>'
    ).join("")
    :"<p>投稿はありません。</p>";
}

function escapeHtml(s){
  return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

document.getElementById("sort").addEventListener("change",render);
load();
