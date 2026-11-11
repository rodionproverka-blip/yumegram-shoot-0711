(() => {
  if (['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) return;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'migration-export'; button.textContent = 'Перенести отметки в CRM';
  button.style.cssText = 'padding:10px 14px;border:1px solid #afa0d5;border-radius:12px;background:#fff;color:#55368b;font:inherit;cursor:pointer';
  button.addEventListener('click', () => {
    const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
    const prefix = 'yumegram-shoot-0711-shared-v2-op-'; const pending = [];
    for (let i=0; i<localStorage.length; i++) { const key=localStorage.key(i); if(key.startsWith(prefix)) {const op=read(key,null); if(op) pending.push(op);} }
    pending.sort((a,b)=>(a.at||0)-(b.at||0)||a.id.localeCompare(b.id));
    const data={format:'yumegram-shoot-checklists-export-v1',source:'yumegram-shoot-0711',exportedAt:new Date().toISOString(),legacyChecked:read('yumegram-shoot-0711-checklist-v1',[]),snapshot:read('yumegram-shoot-0711-shared-v2',null),pending};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})); const a=document.createElement('a'); a.href=url; a.download='yumegram-shoot-0711-checklists-'+Date.now()+'.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),30000);
    button.textContent='Файл скачан — импортируйте в CRM → История';
  });
  (document.querySelector('footer')||document.body).append(button);
})();
