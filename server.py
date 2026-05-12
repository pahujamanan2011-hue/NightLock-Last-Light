from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8000

server = HTTPServer(("localhost", PORT), SimpleHTTPRequestHandler)

print(f"Running on http://localhost:{PORT}")

server.serve_forever()