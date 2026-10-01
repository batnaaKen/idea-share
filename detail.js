const {createClient}=supabase;
const db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const id=new URLSearchParams(location.search).get("id");

async function load(){
  if(!id)return;
  const r=await db.from("posts").select("*").eq("id",id).single();
  if(r.error){
    document.getElementById("detail").textContent="投稿が見つかりません。";
    return;
  }

  const p=r.data;
  const source=p.file_url
    ? `<a class="button primary" href="${esc(p.file_url)}" target="_blank" rel="noopener">Wordファイルを開く</a>`
    : `<a class="button primary" href="${esc(p.external_url)}" target="_blank" rel="noopener">アイデアを見る</a>`;

  document.getElementById("detail").innerHTML=
    `<article class="card">
      <h1>${esc(p.title)}</h1>
      <div class="meta">${esc(p.author)} ・ ${new Date(p.created_at).toLocaleDateString("ja-JP")}</div>
      <p class="summary">${esc(p.description)}</p>
      <div class="tags">${(p.tags||[]).map(t=>'<span class="tag">'+esc(t)+'</span>').join("")}</div>
      <p>${source}</p>
    </article>`;

  document.getElementById("postActions").innerHTML=
    `<p>
      <a class="button secondary" href="post.html?id=${encodeURIComponent(id)}">編集</a>
      <button class="button danger" id="deleteButton" type="button">削除</button>
    </p>`;

  document.getElementById("deleteButton").addEventListener("click",deletePost);
  loadComments();
}

async function deletePost(){
  if(!confirm("この投稿を削除しますか？"))return;

  const r=await db.from("posts").delete().eq("id",id);
  if(r.error){
    alert("削除できませんでした: "+r.error.message);
    return;
  }
  location.href="ideas.html";
}

async function loadComments(){
  const r=await db.from("comments").select("*").eq("post_id",id).order("created_at",{ascending:true});
  document.getElementById("comments").innerHTML=
    (r.data||[]).map(c=>`<div class="comment"><div class="meta">${esc(c.author)} ・ ${new Date(c.created_at).toLocaleDateString("ja-JP")}</div><div>${esc(c.content)}</div></div>`).join("")
    ||"<p>まだコメントはありません。</p>";
}

document.getElementById("commentForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const m=document.getElementById("commentMessage");
  m.textContent="投稿中...";
  const r=await db.from("comments").insert({
    post_id:id,
    author:document.getElementById("commentAuthor").value.trim(),
    content:document.getElementById("commentContent").value.trim()
  });
  if(r.error)m.textContent="投稿できませんでした: "+r.error.message;
  else{m.textContent="";e.target.reset();loadComments();}
});

function esc(s){
  return String(s).replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[c]));
}
load();
