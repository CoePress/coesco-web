from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/test', methods=['GET'])
def test_endpoint():
    return jsonify({
        "message": "API is working!",
        "status": "success"
    })

@app.route('/sample', methods=['GET'])
def sample_endpoint():
    return jsonify({
        "message": "Sample API is working!",
        "status": "success"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)