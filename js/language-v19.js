/* Local, reversible translations. State, IDs, scientific data and event handlers stay intact. */
(() => {
  'use strict';
  const storageKey = 'aerosense-language';
  const root = document.documentElement;
  const dictionaries = window.AeroSenseTranslations || [];
  const catalog = Object.assign(Object.create(null), ...dictionaries);
  const texts = new WeakMap();
  const attributes = new WeakMap();
  const ranges = new Set();
  const rangeText = new WeakSet();
  const skip = 'script,style,noscript,code:not([data-language-label-text]),pre,math,canvas,textarea,[contenteditable="true"],[translate="no"],.home-wordmark__type,.brand__name,.lp-note blockquote';
  const attributeNames = ['aria-label', 'aria-valuetext', 'aria-description', 'placeholder', 'title', 'alt'];
  const attributeSelector = attributeNames.map(name => '[' + name + ']').join(',');
  const dirtyNodes = new Set(), dirtyAttributes = new Set();
  const fallbackCache = new Map();
  const catalogKeys = Object.keys(catalog);
  let fullScanRequested = false, rangeCleanupRequested = false;
  let language = 'en', observer, scheduled = false, active = false;
  const normalize = value => String(value).replace(/\s+/g, ' ').trim();
  const preservedSpace = (source, value) => (source.match(/^\s*/)?.[0] || '') + value + (source.match(/\s*$/)?.[0] || '');
  const validLanguage = value => value === 'zh-Hant' ? value : 'en';
  function lookup(value, depth = 0) {
    const key = normalize(value);
    if (Object.hasOwn(catalog, key)) return catalog[key];
    if (depth === 0 && fallbackCache.has(key)) return fallbackCache.get(key);
    const translated = lookupFallback(key, depth);
    if (depth === 0) {
      // Live counters may create many distinct strings during a long visit.
      if (fallbackCache.size >= 2048) fallbackCache.clear();
      fallbackCache.set(key, translated);
    }
    return translated;
  }
  function lookupFallback(key, depth) {
    if (depth > 4) return null;
    const part = text => lookup(text, depth + 1) || text;
    let match = /^(Figure|Table|Reference)\s+(\d+)([.:]?)$/.exec(key);
    if (match) return ({Figure:'圖',Table:'表',Reference:'參考文獻'})[match[1]] + ' ' + match[2] + match[3];
    match=/^Reference \[(\d+)\]$/.exec(key);
    if(match)return '參考文獻 ['+match[1]+']';
    match=/^Reading now: (.+)$/.exec(key);
    if(match)return '目前閱讀：'+part(match[1]);
    match=/^(.+) \(opens in a new tab\)$/.exec(key);
    if(match)return part(match[1])+'（於新分頁開啟）';
    match = /^(\d+) results?$/.exec(key);
    if (match) return match[1] + ' 筆結果';
    match = /^(\d+) of (\d+) definitions$/.exec(key);
    if(match)return '顯示 '+match[1]+'／'+match[2]+' 個詞彙';
    match = /^(Living sensors|Reading light|Decoding|People & impact) \/ (\d+)$/.exec(key);
    if(match)return (lookup(match[1])||match[1])+' / '+match[2];
    match = /^(January|February|March|April|May|June|July|August|September|October|November|December)(?: (\d{4}))?$/.exec(key);
    if(match){const month=['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(match[1])+1;return(match[2]?match[2]+' 年 ':'')+month+' 月';}
    match = /^(\d{4}-\d{2}-\d{2}) · (wetlab|drylab|hardware|model|hp|team)$/.exec(key);
    if(match)return match[1]+' · '+({wetlab:'濕實驗',drylab:'乾實驗',hardware:'硬體',model:'模型',hp:'人類實踐',team:'團隊'})[match[2]];
    match=/^Question (\d+) \/ (\d+)$/.exec(key);
    if(match)return '第 '+match[1]+' 題／共 '+match[2]+' 題';
    match=/^([+−-]?\d+(?:\.\d+)?) percentage points$/.exec(key);
    if(match)return match[1]+' 個百分點';
    match=/^(\d+) \/ 5 completed$/.exec(key);
    if(match)return '已完成 '+match[1]+'／5';
    match=/^(\d+) of 5$/.exec(key);
    if(match)return match[1]+'／5';
    match=/^(Section|Module|Channel) (\d+)$/.exec(key);
    if(match)return ({Section:'章節',Module:'模組',Channel:'通道'})[match[1]]+' '+match[2];
    match=/^Records matching filters: (\d+)$/.exec(key);
    if(match)return '符合篩選的紀錄：'+match[1];
    match=/^(\d+) secondary engagements shown\.$/.exec(key);
    if(match)return '顯示 '+match[1]+' 項其他交流紀錄。';
    match=/^(\d+) items? in (.+)\.$/.exec(key);
    if(match)return part(match[2])+'：'+match[1]+' 項';
    match=/^Showing all (\d+) entries$/.exec(key);
    if(match)return '顯示全部 '+match[1]+' 筆紀錄';
    match=/^Showing (\d+) · filter: (.+)$/.exec(key);
    if(match)return '顯示 '+match[1]+' 筆 · 篩選：'+part(match[2]);
    match=/^Showing detail: (.+)\.$/.exec(key);
    if(match)return '目前顯示：'+part(match[1])+'。';
    match=/^Selected feature: (.+)\.$/.exec(key);
    if(match)return '已選取元件：'+part(match[1])+'。';
    match=/^Autopilot continues in (\d+)s\. Turn it off to keep reading\.$/.exec(key);
    if(match)return '自動導覽將於 '+match[1]+' 秒後繼續；關閉後可停留閱讀。';
    match=/^GAME SCORE · (\d+)$/.exec(key);
    if(match)return '遊戲分數 · '+match[1];
    match=/^Journey complete\. Your final score is (\d+)\.$/.exec(key);
    if(match)return '旅程完成。最終分數為 '+match[1]+'。';
    match=/^Loading (\d+)$/.exec(key);
    if(match)return '正在載入 '+match[1];
    match=/^Stage (\d+) could not load from disk\. A simplified stand-in is in use\. The conceptual path can continue\.$/.exec(key);
    if(match)return '無法載入第 '+match[1]+' 階段，目前使用簡化示意物件，概念導覽仍可繼續。';
    match=/^Waypoint reached\. (.+)$/.exec(key);
    if(match)return '已抵達導覽節點。'+part(match[1]);
    match=/^Showing (\d+) of (\d+) records\.(.*)$/.exec(key);
    if(match)return '顯示 '+match[1]+'／'+match[2]+' 筆紀錄。'+part(match[3].trim());
    match=/^Includes (\d+) verified official milestone\(s\)\.$/.exec(key);
    if(match)return '包含 '+match[1]+' 項已核對的官方里程碑。';
    match=/^(\d+) (days?|weeks?|months?)$/.exec(key);
    if(match)return match[1]+(/day/.test(match[2])?' 天':/week/.test(match[2])?' 週':' 個月');
    match=/^Selected: (.+) · illustrative pattern$/.exec(key);
    if(match)return '已選取：'+part(match[1])+' · 示意模式';
    match=/^(.+) after (no preprocessing|contrast only|contrast \+ sparse)\. (Closest teaching reference: .+)\.$/.exec(key);
    if(match)return part(match[1])+'，'+part(match[2])+'。'+part(match[3])+'。';
    match=/^(.+) You chose “(.+)\.” (.+)$/.exec(key);
    if(match)return part(match[1])+' 你選擇了「'+part(match[2])+'」。'+part(match[3]);
    match=/^(.+) Tap a zone to place it\.$/.exec(key);
    if(match)return part(match[1])+' 點選一個區域以放置。';
    match=/^Choose an action for (.+)\.$/.exec(key);
    if(match)return '請為以下案例選擇行動：'+match[1]+'。';
    match=/^No parts match in this view\.\s*(.*?)(?:\.)?$/.exec(key);
    if(match)return '此檢視沒有符合的元件。'+match[1].split('; ').map(s=>{const hint=/^(\d+) in (.+)$/.exec(s);return hint?part(hint[2])+'：'+hint[1]+' 個':part(s);}).join('；');
    // Calendar dates retain every supplied number and the recorded timezone.
    const months={Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
    match=/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/.exec(key);
    if(match)return match[2]+' 年 '+months[match[1]]+' 月';
    match=/^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?) (\d{1,2})(?:, (\d{4}))?$/.exec(key);
    if(match)return (match[3]?match[3]+' 年 ':'')+months[match[1].slice(0,3)]+' 月 '+match[2]+' 日';
    if(key.includes(' · ')){
      const pieces=key.split(' · '),translated=pieces.map(part);
      if(translated.some((s,i)=>s!==pieces[i]))return translated.join(' · ');
    }
    if(/\s[–—]\s/.test(key)&&key.length<160){
      const pieces=key.split(/\s([–—])\s/),translated=pieces.map(part);
      if(translated.some((s,i)=>s!==pieces[i]))return translated.join(' ');
    }
    if(key.endsWith('…')&&key.length>24){
      const prefix=key.slice(0,-1),matches=catalogKeys.filter(s=>s.startsWith(prefix));
      if(matches.length===1)return catalog[matches[0]];
    }
    return null;
  }
  function excluded(el) {
    // Inline diagram labels use the same authored catalog. SVG geometry,
    // numeric attributes, source images and canvas pixels remain untouched.
    // Preserve bibliography records while translating their navigation controls.
    return !!el.closest(skip) || (!!el.closest('.ref-list') && !el.closest('.ref-return-tools, .ref-highlights, .ref-source-control'));
  }
  function ignored(node) { return !node.parentElement || excluded(node.parentElement); }
  function translateText(node) {
    if (ignored(node) || rangeText.has(node)) return;
    const old = texts.get(node);
    let original = old && node.data === old.rendered ? old.original : node.data;
    const translated = language === 'zh-Hant' ? lookup(original) : null;
    const rendered = translated === null ? original : preservedSpace(original, translated);
    if (node.data !== rendered) node.data = rendered;
    texts.set(node, {original, rendered});
  }
  function translateAttributes(el) {
    if (excluded(el)) return;
    const record = attributes.get(el) || {};
    attributeNames.forEach(name => {
      if (!el.hasAttribute(name)) return;
      const value = el.getAttribute(name), old = record[name];
      const original = old && value === old.rendered ? old.original : value;
      const translated = language === 'zh-Hant' ? lookup(original) : null;
      const rendered = translated === null ? original : translated;
      if (value !== rendered) el.setAttribute(name, rendered);
      record[name] = {original, rendered};
    });
    attributes.set(el, record);
  }
  function translateRange(range) {
    if (!range.start.isConnected || !range.end.isConnected) { ranges.delete(range); return; }
    const translated = language === 'zh-Hant' ? lookup(range.source) : null;
    const target = translated === null ? 'en' : 'zh-Hant';
    if (target === range.language) return;
    let node = range.start.nextSibling;
    while (node && node !== range.end) { const next=node.nextSibling; node.remove(); node=next; }
    if (target === 'en') range.nodes.forEach(child => range.end.before(child));
    else range.end.before(document.createTextNode(preservedSpace(range.source, translated)));
    range.language = target;
  }
  function updateButtons() {
    document.querySelectorAll('[data-language-toggle]').forEach(button => {
      const chinese = language === 'zh-Hant';
      const label = button.querySelector('[data-language-label]');
      const text = chinese ? 'EN' : 'ZH';
      const accessibleLabel = chinese ? '切換為英文' : 'Switch to Traditional Chinese';
      if (label && label.textContent !== text) label.textContent = text;
      if (button.getAttribute('aria-label') !== accessibleLabel) button.setAttribute('aria-label', accessibleLabel);
      if (button.getAttribute('title') !== accessibleLabel) button.setAttribute('title', accessibleLabel);
      if (button.getAttribute('lang') !== 'en') button.setAttribute('lang', 'en');
      if (button.disabled) button.disabled = false;
    });
  }
  function observe() {
    observer.observe(document.body, {subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributeNames});
  }
  function collect(records) {
    records.forEach(record => {
      if (record.type === 'attributes') dirtyAttributes.add(record.target);
      else if (record.type === 'characterData') dirtyNodes.add(record.target);
      else {
        record.addedNodes.forEach(node => dirtyNodes.add(node));
        if (record.removedNodes.length) rangeCleanupRequested = true;
      }
    });
  }
  function translateSubtree(node) {
    if (!node.isConnected) return;
    if (node.nodeType === Node.TEXT_NODE) { translateText(node); return; }
    if (node.nodeType !== Node.ELEMENT_NODE || excluded(node)) return;
    if (node.matches(attributeSelector)) translateAttributes(node);
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) translateText(walker.currentNode);
    node.querySelectorAll(attributeSelector).forEach(translateAttributes);
  }
  function apply(fullScan = false) {
    scheduled = false;
    if (!active) return;
    // Other observers can edit a component before this microtask runs. Include
    // those records before disconnecting, rather than dropping their updates.
    collect(observer.takeRecords());
    fullScan = fullScan || fullScanRequested;
    fullScanRequested = false;
    if (!fullScan && !dirtyNodes.size && !dirtyAttributes.size && !rangeCleanupRequested) return;
    observer.disconnect();
    ranges.forEach(translateRange);
    if (fullScan) translateSubtree(document.body);
    else {
      // A replaced panel can report both its container and its descendants.
      // Visit the highest dirty subtree once; ordinary counters stay one node.
      dirtyNodes.forEach(node => {
        let parent = node.parentNode;
        while (parent && !dirtyNodes.has(parent)) parent = parent.parentNode;
        if (!parent) translateSubtree(node);
      });
      dirtyAttributes.forEach(el => { if (el.isConnected) translateAttributes(el); });
    }
    dirtyNodes.clear();
    dirtyAttributes.clear();
    rangeCleanupRequested = false;
    if (document.title !== titleState.rendered) titleState.original = document.title;
    titleState.rendered = language === 'zh-Hant' ? lookup(titleState.original) || titleState.original : titleState.original;
    if (document.title !== titleState.rendered) document.title = titleState.rendered;
    if (root.lang !== language) root.lang = language;
    if (root.dataset.language !== language) root.dataset.language = language;
    updateButtons();
    observe();
  }
  const titleState = {original:document.title, rendered:document.title};
  function schedule(records) {
    if (!active) return;
    if (Array.isArray(records)) collect(records);
    else fullScanRequested = true;
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => apply());
  }
  function setLanguage(value, persist = true) {
    language = validLanguage(value);
    if (persist) { try { localStorage.setItem(storageKey, language); } catch (_) {} }
    apply(true);
    document.dispatchEvent(new CustomEvent('aerosense:languagechange', {detail:{language}}));
    window.dispatchEvent(new Event('resize'));
  }
  window.AeroSenseI18n = {
    get language() { return language; },
    setLanguage,
    t(value) { return language === 'zh-Hant' ? lookup(value) || value : value; },
    lookup(value) { return lookup(value) || value; },
    sourceAttribute(element, name) {
      const value=element.getAttribute(name),old=attributes.get(element)?.[name];
      return old&&value===old.rendered?old.original:value;
    },
    // Dynamic UI must copy authored text, not the currently translated display.
    sourceText(element) {
      const starts=new Map([...ranges].map(range=>[range.start,range]));
      function read(parent) {
        let result='';
        for(let node=parent.firstChild;node;node=node.nextSibling){
          const range=starts.get(node);
          if(range){result+=range.source;node=range.end;}
          else if(node.nodeType===3){const old=texts.get(node);result+=old&&node.data===old.rendered?old.original:node.data;}
          else if(node.nodeType===1)result+=node.tagName==='BR'?' ':read(node);
        }
        return result;
      }
      return read(element);
    },
    cloneSource(element) {
      const starts=new Map([...ranges].map(range=>[range.start,range]));
      function clone(node) {
        if(node.nodeType===3){const old=texts.get(node);return document.createTextNode(old&&node.data===old.rendered?old.original:node.data);}
        const copy=node.cloneNode(false);
        if(node.nodeType===1){
          const record=attributes.get(node)||{};
          for(const [name,old] of Object.entries(record))if(node.getAttribute(name)===old.rendered)copy.setAttribute(name,old.original);
        }
        for(let child=node.firstChild;child;child=child.nextSibling){
          const range=starts.get(child);
          if(range){
            const fragment=document.createDocumentFragment();
            range.nodes.forEach(original=>fragment.append(clone(original)));
            window.AeroSenseI18n.registerGlossaryFragment(document.createTextNode(range.source),fragment);
            copy.append(fragment);child=range.end;
          }
          else copy.append(clone(child));
        }
        return copy;
      }
      return clone(element);
    },
    // Glossary inserts markup into a sentence. Keep the original sentence as one
    // translation unit, and retain its original annotated nodes for an exact undo.
    registerGlossaryFragment(original, fragment) {
      if (lookup(original.data) === null) return;
      const start=document.createComment('i18n:start'), end=document.createComment('i18n:end');
      const nodes=[...fragment.childNodes];
      nodes.forEach(node => {
        if (node.nodeType === 3) rangeText.add(node);
        else { const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT); while(walker.nextNode())rangeText.add(walker.currentNode); }
      });
      fragment.prepend(start);fragment.append(end);
      ranges.add({start,end,nodes,source:original.data,language:'en'});
    },
    refresh:schedule
  };
  function init() {
    observer = new MutationObserver(schedule);
    active = true;
    document.querySelectorAll('[data-language-toggle]').forEach(button => {
      button.addEventListener('click', () => setLanguage(language === 'en' ? 'zh-Hant' : 'en'));
    });
    let saved='en';
    try { saved=localStorage.getItem(storageKey) || 'en'; } catch (_) {}
    // Run after all existing DOMContentLoaded handlers have initialized their state.
    queueMicrotask(() => setLanguage(saved, false));
    window.addEventListener('storage', event => { if(event.key===storageKey)setLanguage(event.newValue,false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
