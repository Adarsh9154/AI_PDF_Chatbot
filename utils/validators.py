import hashlib
from config import ALLOWED_EXTENSIONS

def allowed_file(filename):

    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def generate_file_hash(file):

    hasher = hashlib.md5()

    file.seek(0)

    buffer = file.read()

    hasher.update(buffer)

    file.seek(0)

    return hasher.hexdigest()