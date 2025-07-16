from flask import Flask, request, jsonify, session
from flask_cors import CORS
import fitz  # PyMuPDF
from ebooklib import epub
import docx
import textract
import pysrt
import re
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import os
import jwt
import datetime
from functools import wraps

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SECRET_KEY'] = 'your_secret_key'  # Change this to a secure secret key
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Allowed file extensions (updated to include .txt)
ALLOWED_EXTENSIONS = {'pdf', 'epub', 'docx', 'mobi', 'srt', 'ass', 'vtt', 'ttml', 'txt'}

# In-memory database for users (use real DB in production)
users = {}
user_data = {}  # {user_id: {lessons: {}, word_metadata: {}, translation_cache: {}, deleted_words: []}}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text(file_path, file_extension):
    try:
        if file_extension == 'pdf':
            doc = fitz.open(file_path)
            text = ''.join(page.get_text() for page in doc)
            doc.close()
        elif file_extension == 'epub':
            book = epub.read_epub(file_path)
            text = ''.join(item.get_content().decode('utf-8') for item in book.get_items() if item.get_type() == 0)
        elif file_extension == 'docx':
            doc = docx.Document(file_path)
            text = '\n'.join(paragraph.text for paragraph in doc.paragraphs)
        elif file_extension == 'mobi':
            text = textract.process(file_path).decode('utf-8')  # Limited support
        elif file_extension in ['srt', 'vtt']:
            subs = pysrt.open(file_path)
            text = '\n'.join(sub.text for sub in subs)
        elif file_extension in ['ass', 'ttml', 'txt']:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                text = content.strip()  # For .txt, read raw content
        else:
            text = "Unsupported format or extraction failed."
        return text.strip()
    except Exception as e:
        return f"Error extracting text: {str(e)}"

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        file_extension = filename.rsplit('.', 1)[1].lower()
        extracted_text = extract_text(file_path, file_extension)
        
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return jsonify({'text': extracted_text})
    return jsonify({'error': 'File type not allowed'}), 400

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            token = token.split(" ")[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data['username']
        except:
            return jsonify({'error': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    if username in users:
        return jsonify({'error': 'Username already exists'}), 400
    users[username] = {
        'email': email,
        'password_hash': generate_password_hash(password)
    }
    user_data[username] = {
        'lessons': {},
        'word_metadata': {},
        'translation_cache': {},
        'deleted_words': []
    }
    return jsonify({'success': True})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = users.get(username)
    if user and check_password_hash(user['password_hash'], password):
        token = jwt.encode({
            'username': username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({'token': token})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/user_data', methods=['GET'])
@token_required
def get_user_data(current_user):
    return jsonify(user_data.get(current_user, {}))

@app.route('/user_data', methods=['POST'])
@token_required
def save_user_data(current_user):
    data = request.get_json()
    user_data[current_user] = data
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)