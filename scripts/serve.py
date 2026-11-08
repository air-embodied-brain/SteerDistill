"""Local static preview with enough connection backlog for image-rich replays."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=18775)
args = parser.parse_args()
class Server(ThreadingHTTPServer):
    request_queue_size = 128
handler = partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).resolve().parents[1]))
with Server(('127.0.0.1', args.port), handler) as server:
    print(f'Preview: http://127.0.0.1:{args.port}/', flush=True)
    server.serve_forever()
