"""Create a standalone static snapshot for environments without socket permission."""
import json
from app import ROOT, optimize
html=(ROOT/'index.html').read_text()
html=html.replace('<script>','<script>window.OFFLINE_DEMO='+json.dumps(optimize())+';</script><script>',1)
(ROOT/'offline-demo.html').write_text(html)
print('Created offline-demo.html; open directly in your browser. Static default snapshot; use app.py for interactive controls.')
