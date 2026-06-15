import os
from datetime import datetime

from flask import Flask, render_template, request
from markdown import markdown
from werkzeug.utils import secure_filename
from flask import Response
from config import UPLOAD_FOLDER

from utils.validators import allowed_file, generate_file_hash
from utils.pdf_reader import extract_text_from_pdf
from utils.text_cleaner import clean_text
from utils.text_splitter import split_text
from utils.helpers import write_log
from utils.vector_store import create_vector_store
from utils.rag_pipeline import ask_question
from flask import jsonify
from flask import redirect, url_for

app = Flask(__name__)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

uploaded_files = []
chat_history = []

@app.route("/")
def home():

    return render_template(
        "index.html",
        uploaded_files=uploaded_files,
        chat_history=chat_history
    )


@app.route("/upload", methods=["POST"])
def upload_pdf():

    # Ensure required folders exist
    os.makedirs("cache", exist_ok=True)
    os.makedirs("uploads", exist_ok=True)

    if "pdf_file" not in request.files:
        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["pdf_file"]

    if file.filename == "":
        return jsonify({
            "error": "No selected file"
        }), 400

    if not allowed_file(file.filename):
        return jsonify({
            "error": "Only PDF files are allowed"
        }), 400

    # Generate file hash
    file_hash = generate_file_hash(file)

    # Ensure hash file exists
    hash_file_path = "cache/uploaded_hashes.txt"

    if not os.path.exists(hash_file_path):
        open(hash_file_path, "w").close()

    # Check duplicates
    with open(hash_file_path, "r") as hash_file:
        existing_hashes = hash_file.read().splitlines()

    if file_hash in existing_hashes:
        return jsonify({
            "error": "Duplicate PDF detected. This file was already uploaded."
        }), 400

    # Save new hash
    with open(hash_file_path, "a") as hash_file:
        hash_file.write(file_hash + "\n")

    filename = secure_filename(file.filename)

    pdf_path = os.path.join(
        app.config["UPLOAD_FOLDER"],
        filename
    )

    file.save(pdf_path)

    write_log(f"Uploaded PDF: {filename}")

    # Extract text
    pdf_data = extract_text_from_pdf(pdf_path)

    if not pdf_data:
        return jsonify({
            "error": "Unable to process PDF. The file may be corrupted."
        }), 400

    extracted_text = pdf_data["text"]
    total_pages = pdf_data["pages"]

    if len(extracted_text.strip()) == 0:
        return jsonify({
            "error": "This PDF does not contain readable text."
        }), 400

    pages_data = pdf_data["pages_data"]

    for page in pages_data:
        page["text"] = clean_text(page["text"])

    chunks = split_text(
        pages_data,
        filename
    )

    create_vector_store(chunks)

    file_size = round(
        os.path.getsize(pdf_path) / (1024 * 1024),
        2
    )

    metadata = {
        "filename": filename,
        "pages": total_pages,
        "size_mb": file_size,
        "uploaded_at": datetime.now().strftime("%Y-%m-%d %H:%M")
    }

    uploaded_files.append(metadata)

    write_log(
        f"""
        Processed PDF:
        {filename}
        Pages: {total_pages}
        Chunks: {len(chunks)}
        """
    )

    return jsonify({
        "success": True,
        "filename": filename,
        "pages": total_pages,
        "size_mb": file_size,
        "chunks": len(chunks)
    })
@app.route("/ask", methods=["POST"])
def ask():

    data = request.get_json()
    question = data.get("question")

    if not question:
        return jsonify({
            "error": "Question is required"
        }), 400

    raw_answer = ask_question(
        question,
        chat_history
    )

    

    chat_history.append({
        "user": question,
        "bot": raw_answer,
        "raw_bot": raw_answer
    })

    return jsonify({
    "answer": raw_answer
})

@app.route("/download_chat")
def download_chat():

    content = ""

    for chat in chat_history:

        content += f"User: {chat['user']}\n\n"

        content += f"AI:\n{chat.get('raw_bot', '')}\n\n"

        content += "-" * 60 + "\n\n"

    return Response(
        content,
        mimetype="text/plain",
        headers={
            "Content-Disposition":
            "attachment; filename=chat_history.txt"
        }
    )

@app.route("/clear_chat")
def clear_chat():

    chat_history.clear()

    return redirect(url_for("home"))


if __name__ == "__main__":

    app.run(debug=True)
