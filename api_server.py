from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# Load model
MODEL_PATH = os.environ.get("MODEL_PATH", "/opt/model")
model = joblib.load(MODEL_PATH)
print(f"Model loaded: {type(model).__name__}")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        temperature = float(data["temperature"])
        vacuum = float(data["vacuum"])
        pressure = float(data["pressure"])
        humidity = float(data["humidity"])

        features = np.array([[temperature, vacuum, pressure, humidity]])
        prediction = model.predict(features)[0]

        return jsonify({
            "energy_output": round(float(prediction), 2),
            "inputs": {
                "temperature": temperature,
                "vacuum": vacuum,
                "pressure": pressure,
                "humidity": humidity,
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": type(model).__name__})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
