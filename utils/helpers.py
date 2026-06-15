import os
from datetime import datetime

LOG_FILE = "logs/app.log"

def write_log(message):

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    log_message = f"[{timestamp}] {message}\n"

    os.makedirs("logs", exist_ok=True)

    with open(LOG_FILE, "a", encoding="utf-8") as file:

        file.write(log_message)