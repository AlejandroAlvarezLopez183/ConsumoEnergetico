/* Arranque del panel de administración: exige sesión de administrador y carga los datos desde Supabase. */
(async function(){
  const S=SNRGY,boot=document.getElementById('boot');
  document.getElementById('logout').addEventListener('click',async()=>{await S.logout();location.href='index.html'});
  const fail=()=>{boot.innerHTML='<div style="text-align:center;max-width:380px;padding:20px"><b style="color:#1d1d1f;font-size:17px">No pudimos cargar los datos</b><p style="margin:8px 0 16px">Revisa tu conexión e inténtalo de nuevo.</p><button onclick="location.reload()" style="height:36px;padding:0 16px;border:0;border-radius:8px;background:#00249C;color:#fff;font:inherit;cursor:pointer">Reintentar</button></div>'};
  try{
    const p=await S.require('admin');if(!p)return;
    const data=await S.loadAll();
    window.startAdmin(data);
    boot.remove();
  }catch(e){console.error(e);fail()}
})();
