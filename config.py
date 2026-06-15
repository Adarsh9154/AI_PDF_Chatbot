import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base Project Directory
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Upload Folder
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

# Allowed File Types
ALLOWED_EXTENSIONS = {"pdf"}

# Maximum Upload Size (20 MB)
MAX_CONTENT_LENGTH = 20 * 1024 * 1024

# Groq API Key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")