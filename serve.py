from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import argparse
p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8767);p.add_argument('--bind',default='127.0.0.1');a=p.parse_args()
root=Path(__file__).resolve().parent
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(root),**kwargs)
 def end_headers(self):self.send_header('Cache-Control','no-cache');super().end_headers()
print(f'Prototype: http://{a.bind}:{a.port}',flush=True)
ThreadingHTTPServer((a.bind,a.port),Handler).serve_forever()
