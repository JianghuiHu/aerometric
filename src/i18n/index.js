import zhCN from './locales/zh-CN.js';
import enUS from './locales/en-US.js';

const resources={'zh-CN':zhCN,'en-US':enUS},fallback='zh-CN',storageKey='aerometric.locale';
function detect(){try{const saved=localStorage.getItem(storageKey);if(resources[saved])return saved;}catch{}return typeof navigator!=='undefined'&&navigator.language?.toLowerCase().startsWith('zh')?'zh-CN':'en-US';}
let locale=detect();
export function t(key,values={}){const value=resources[locale]?.[key]??resources[fallback][key]??key;if(value===key&&typeof console!=='undefined')console.warn(`[i18n] Missing: ${key}`);return value.replace(/\{(\w+)\}/g,(_,name)=>values[name]??`{${name}}`);}
export function getLocale(){return locale;}
export function setLocale(next){locale=resources[next]?next:fallback;try{localStorage.setItem(storageKey,locale);}catch{}globalThis.dispatchEvent?.(new CustomEvent('aerometric:locale',{detail:locale}));return locale;}
export function translatePage(root=document){root.querySelectorAll('[data-i18n]').forEach(node=>node.textContent=t(node.dataset.i18n));root.documentElement?.setAttribute('lang',locale);}
