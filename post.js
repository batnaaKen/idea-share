const {createClient}=supabase;
const db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

const params=new URLSearchParams(location.search);
const editId=params.get("id");
const form=document.getElementById("postForm");
const type=document.getElementById("type");
const fileArea=document.getElementById("fileArea");
const urlArea=document.getElementById("urlArea");
const pageTitle=document.getElementById("pageTitle");
const submitButton=document.getElementById("submitButton");

function updateSourceFields(){
  fileArea.hidden=type.value!=="file";
  urlArea.hidden=type.value!=="url";
}
type.addEventListener("change",updateSourceFields);
updateSourceFields();

async function loadEdit(){
  if(!editId)return;
  pageTitle.textContent="アイデアを編集";
  submitButton.textContent="変更を保存";

  const r=await db.from("posts").select("*").eq("id",editId).single();
  if(r.error){
    document.getElementById("message").textContent="投稿を読み込めませんでした: "+r.error.message;
    submitButton.disabled=true;
    return;
  }

  const p=r.data;
  document.getElementById("author").value=p.author||"";
  document.getElementById("title").value=p.title||"";
  document.getElementById("description").value=p.description||"";
  document.getElementById("tags").value=(p.tags||[]).join(", ");

  if(p.external_url){
    type.value="url";
    document.getElementById("url").value=p.external_url;
  }else if(p.file_url){
    type.value="file";
  }else{
    type.value="";
  }
  updateSourceFields();
}

form.addEventListener("submit",async e=>{
  e.preventDefault();
  const msg=document.getElementById("message");
  msg.textContent=editId?"保存中...":"投稿中...";

  const author=document.getElementById("author").value.trim();
  const title=document.getElementById("title").value.trim();
  const description=document.getElementById("description").value.trim();
  const tags=document.getElementById("tags").value.split(",").map(x=>x.trim()).filter(Boolean);

  try{
    let file_url=null,external_url=null;

    if(type.value==="file"){
      const file=document.getElementById("file").files[0];
      if(editId && !file){
        const old=await db.from("posts").select("file_url").eq("id",editId).single();
        if(old.error)throw old.error;
        file_url=old.data.file_url;
      }else{
        if(!file)throw Error("Wordファイルを選択してください。");
        if(!/\.docx?$/.test(file.name.toLowerCase()))throw Error("Wordファイル（.doc / .docx）のみ投稿できます。");
        const path=crypto.randomUUID()+"_"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
        const r=await db.storage.from("documents").upload(path,file);
        if(r.error)throw r.error;
        file_url=db.storage.from("documents").getPublicUrl(path).data.publicUrl;
      }
    }else if(type.value==="url"){
      external_url=document.getElementById("url").value.trim();
      if(!external_url)throw Error("URLを入力してください。");
    }

    const data={author,title,description,tags,file_url,external_url};

    if(editId){
      const r=await db.from("posts").update(data).eq("id",editId);
      if(r.error)throw r.error;
      msg.textContent="変更を保存しました。";
      setTimeout(()=>location.href="detail.html?id="+encodeURIComponent(editId),300);
    }else{
      const r=await db.from("posts").insert(data);
      if(r.error)throw r.error;
      msg.textContent="投稿しました。";
      form.reset();
      type.value="";
      updateSourceFields();
    }
  }catch(err){
    msg.textContent=(editId?"保存":"投稿")+"できませんでした: "+err.message;
  }
});

loadEdit();
