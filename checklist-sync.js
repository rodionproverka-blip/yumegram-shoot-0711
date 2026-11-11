'use strict';

window.createChecklistSync = function createChecklistSync(keys, onUpdate) {
  const preview = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  const endpoint = 'https://yumegram-shoot-0711-checklists.rodionproverka393682.chatgpt.site/api/checklists';
  const legacyKey = 'yumegram-shoot-0711-checklist-v1';
  const cacheKey = preview ? 'yumegram-shoot-0711-preview' : 'yumegram-shoot-0711-shared-v2';
  const importedKey = cacheKey + '-imported';
  const opPrefix = cacheKey + '-op-';
  const memoryOps = new Map();
  let imported = new Set(read(importedKey, []));
  let cache = read(cacheKey, {revision: -1, checked: []});
  let running = false;
  let lastTime = 0;
  let status = preview ? 'preview' : 'connecting';

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch {}
  }
  function pending() {
    const ops = new Map(memoryOps);
    try {
      for (const storageKey of Object.keys(localStorage)) {
        if (!storageKey.startsWith(opPrefix)) continue;
        const op = read(storageKey, null);
        if (op && keys.has(op.key)) ops.set(op.id, op);
      }
    } catch {}
    return [...ops.values()].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  }
  function legacyToImport() {
    if (preview) return [];
    for (const key of read(importedKey, [])) imported.add(key);
    return read(legacyKey, []).filter(key => keys.has(key) && !imported.has(key));
  }
  function current() {
    const checked = new Set([...cache.checked, ...legacyToImport()]);
    for (const op of pending()) {
      if (op.checked) checked.add(op.key);
      else checked.delete(op.key);
    }
    return checked;
  }
  function paint() {
    onUpdate(current(), status, pending().length);
  }
  function loadNewerCache() {
    const stored = read(cacheKey, cache);
    if (stored.revision > cache.revision) cache = stored;
  }
  async function sync() {
    if (preview || running) return;
    running = true;
    const legacy = legacyToImport();
    const edits = pending().slice(0, 100);
    try {
      const options = {cache: 'no-store', signal: AbortSignal.timeout(8000)};
      if (legacy.length || edits.length) {
        options.method = 'POST';
        options.headers = {'Content-Type': 'application/json'};
        options.body = JSON.stringify({legacy, edits});
      }
      const response = await fetch(endpoint, options);
      if (!response.ok) throw new Error('Checklist HTTP ' + response.status);
      const snapshot = await response.json();
      if (!Number.isSafeInteger(snapshot.revision) || !Array.isArray(snapshot.checked)) throw new Error('Checklist response');
      loadNewerCache();
      if (snapshot.revision >= cache.revision) {
        cache = {revision: snapshot.revision, checked: snapshot.checked.filter(key => keys.has(key))};
        write(cacheKey, cache);
      }
      for (const key of read(importedKey, [])) imported.add(key);
      for (const key of legacy) imported.add(key);
      if (legacy.length) write(importedKey, [...imported]);
      for (const op of edits) {
        memoryOps.delete(op.id);
        remove(opPrefix + op.id);
      }
      status = 'synced';
    } catch {
      status = 'offline';
    } finally {
      running = false;
      paint();
    }
    if (status === 'synced' && (pending().length || legacyToImport().length)) void sync();
  }
  function set(key, checked) {
    if (!keys.has(key)) return;
    lastTime = Math.max(lastTime + 1, Date.now());
    const op = {id: crypto.randomUUID(), key, checked, at: lastTime};
    memoryOps.set(op.id, op);
    write(opPrefix + op.id, op);
    paint();
    void sync();
  }
  function start() {
    paint();
    void sync();
    window.addEventListener('online', sync);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) void sync();
    });
    window.addEventListener('storage', event => {
      if (event.key === cacheKey) loadNewerCache();
      if (event.key === legacyKey || event.key?.startsWith(cacheKey)) paint();
      if (event.key === legacyKey || (event.key?.startsWith(opPrefix) && event.newValue)) void sync();
    });
    setInterval(() => {
      if (!document.hidden || pending().length) void sync();
    }, 5000);
  }
  return {current, set, start};
};
