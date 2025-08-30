import os
import subprocess
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Configure the app to serve static files from the parent directory
app = Flask(__name__, static_folder='..', static_url_path='')
CORS(app)

@app.route('/')
def serve_index():
    return send_from_directory('..', 'index.html')

# Mapping of language names to execution commands and file extensions
LANG_CONFIG = {
    "python": {"extension": ".py", "command": ["python"]},
    "javascript": {"extension": ".js", "command": ["node"]},
    "php": {"extension": ".php", "command": ["php"]},
    "bash": {"extension": ".sh", "command": ["bash"]},
    "kotlin": {"extension": ".kt", "command": ["kotlinc", "-script"]},
}

@app.route('/execute', methods=['POST'])
def execute_code():
    data = request.get_json()
    language = data.get('language', '').lower()
    code = data.get('code', '')

    if not language or not code:
        return jsonify({"error": "Language and code must be provided."}), 400

    if language not in LANG_CONFIG:
        return jsonify({"error": f"Language '{language}' is not supported."}), 400

    config = LANG_CONFIG[language]
    # Create a unique, temporary filename to avoid conflicts
    temp_filename = f"temp_{uuid.uuid4()}{config['extension']}"
    temp_filepath = os.path.join(os.getcwd(), temp_filename)

    try:
        # Write the user's code to the temporary file
        with open(temp_filepath, 'w', encoding='utf-8') as f:
            f.write(code)

        # Build the execution command
        command = config['command'] + [temp_filepath]

        # Execute the command in a subprocess
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=10 # Add a timeout to prevent long-running scripts
        )

        # Combine stdout and stderr for the response
        output = result.stdout
        if result.stderr:
            output += f"\n--- STDERR ---\n{result.stderr}"

        return jsonify({"output": output})

    except subprocess.TimeoutExpired:
        return jsonify({"error": "Execution timed out after 10 seconds."}), 408
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)

if __name__ == '__main__':
    # Using port 8080 to avoid potential conflicts with other services.
    app.run(host='0.0.0.0', port=8080)
