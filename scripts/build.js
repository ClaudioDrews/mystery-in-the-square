/* Build a self-contained, bilingual HTML file for offline use and GitHub Pages. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const catalogs = Object.fromEntries(['pt-BR', 'en'].map(lang => [lang, JSON.parse(read(`locales/${lang}.json`))]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const script = value => `<script>\n${value.replace(/<\/script/gi,'<\\/script')}\n</script>`;
const layout = read('src/layout.html');
const [head, rest] = layout.split('<body>');
const body = rest.split('</body>')[0];
const css = read('src/style.css');
const shell = head.replace('{{language}}', 'pt-BR').replace(/<title>.*?<\/title>/s,'<title>Mistério na Praça / Mystery in the Square</title>').replace(/<style[^>]*><\/style>/, `<style>\n${css}\nhtml[lang=en] .card.key .m::after{content:" ★ trade"}\n</style>`);
const boot = `const {language,t}=window.Localization;\n`+
`document.documentElement.lang=language;document.title=t('layout.mystery_in_the_square_0');\n`+
`const escapeHTML=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));\n`+
`document.body.innerHTML=${json(body)}.replace(/\\{\\{([^}]+)\\}\\}/g,(_,k)=>escapeHTML(t(k)));\n`+
`const manifest=document.createElement('link');manifest.rel='manifest';manifest.href='data:application/manifest+json,'+encodeURIComponent(JSON.stringify({name:document.title,short_name:language==='en'?'Mystery':'Mistério',display:'standalone',orientation:'portrait',background_color:'#000000',theme_color:'#000000',start_url:location.pathname+location.hash}));document.head.append(manifest);\n`+
`for(const a of document.querySelectorAll('[data-language]')){a.setAttribute('aria-current',String(a.dataset.language===language));a.addEventListener('click',e=>{e.preventDefault();if(a.dataset.language===language)return;const active=!document.getElementById('ovIntro').classList.contains('on')&&!document.getElementById('ovEnd').classList.contains('on');if(active&&!confirm(language==='en'?'Changing language starts a new game. Continue?':'Alterar o idioma inicia uma nova partida. Continuar?'))return;location.hash=a.dataset.language;location.reload();});}\n`;
const html = shell + '<body>\n' + script('window.GameLocales='+json(catalogs)+';') + script(read('src/localization.js')) + script(boot) + ['engine','game','ui'].map(n=>script(read('src/'+n+'.js'))).join('\n')+'\n</body></html>\n';
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Built index.html:', Buffer.byteLength(html), 'bytes');
