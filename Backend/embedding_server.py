# embedding_server.py
# Place this in your project root (same folder as backend/ and frontend/)
#
# SETUP (run once in terminal):
#   pip install sentence-transformers flask
#
# START (run this every time before starting Spring Boot):
#   python embedding_server.py
#
# Runs on: http://localhost:5001

from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer

app = Flask(__name__)

print("Loading model... (first time downloads ~90MB, please wait)")
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
print("Model ready! Server starting on http://localhost:5001")


@app.route('/embed', methods=['POST'])
def embed():
    data = request.get_json()
    text = data.get('text', '')
    if not text:
        return jsonify({'error': 'text field is required'}), 400
    vector = model.encode(text).tolist()
    return jsonify({'embedding': vector, 'dimension': len(vector)})


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'all-MiniLM-L6-v2', 'dimension': 384})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
