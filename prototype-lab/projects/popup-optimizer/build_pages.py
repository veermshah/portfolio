"""Rebuild fully interactive GitHub Pages assets from the local Python UI/data."""
import json
from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parent
out=ROOT/'docs';out.mkdir(exist_ok=True)
html=(ROOT/'index.html').read_text()
start=html.index('async function update(')
end=html.index('</script>',start)
html=html[:start]+'''function update(e){
 if(e)e.preventDefault();$('error').textContent='';
 try {
  const form=new FormData($('controls'));
  render(PopUpOptimizer.optimize(POPUP_DATA,form.get('service'),Number(form.get('stops')),Number(form.get('minutes'))));
 }catch(error){$('error').textContent=error.message}
}
$('controls').addEventListener('submit',update);
update();
'''+html[end:]
html=html.replace('<title>', '<link rel="icon" href="data:,"><title>', 1)
html=html.replace('<script>','<script src="./data.js"></script><script src="./optimizer.js"></script><script>',1)
(out/'index.html').write_text(html)
(out/'data.js').write_text('window.POPUP_DATA='+json.dumps(json.loads((ROOT/'data.json').read_text()),ensure_ascii=False)+';\n')
shutil.copyfile(ROOT/'optimizer.js',out/'optimizer.js')
(out/'.nojekyll').write_text('')
print('Built docs/: interactive static UI, bundled synthetic data, browser optimizer; no backend/API.')
