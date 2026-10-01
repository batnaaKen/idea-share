const {createClient}=supabase;
const db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const type=document.getElementById("type"),fileArea=document.getElementById("fileArea"),urlArea=document.getElementById("urlArea");
type.addEventListener("change",()=>{const f=type.value==="file";fileArea.hidden=!f;urlArea.hidden=f});
document.getElementById("postForm").addEventListener("submit",async e=>{
 e.preventDefault();const msg=document.getElementById("message");msg.textContent="投稿中...";
 const author=document.getElementById("author").value.trim(),title=document.getElementById("title").value.trim(),description=document.getElementById("description").value.trim();
 const tags=document.getElementById("tags").value.split(",").map(x=>x.trim()).filter(Boolean);
 let file_url=null,external_url=null;
 try{
  if(type.value==="file"){
   const file=document.getElementById("file").files[0];if(!file)throw Error("Wordファイルを選択してください。");
   if(!/\.docx?$/.test(file.name.toLowerCase()))throw Error("Wordファイル（.doc / .docx）のみ投稿できます。");
   const path=crypto.randomUUID()+"_"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
   const r=await db.storage.from("documents").upload(path,file);if(r.error)throw r.error;
   file_url=db.storage.from("documents").getPublicUrl(path).data.publicUrl;
  }else{external_url=document.getElementById("url").value.trim();if(!external_url)throw Error("URLを入力してください。");}
  const r=await db.from("posts").insert({author,title,description,tags,file_url,external_url});if(r.error)throw r.error;
  msg.textContent="投稿しました。";e.target.reset();fileArea.hidden=false;urlArea.hidden=true;
 }catch(err){msg.textContent="投稿できませんでした: "+err.message;}
});