import pdfplumber

def extract_text_from_pdf(pdf_path):

    extracted_text = ""
    pages_data = []
    total_pages = 0

    try:

        with pdfplumber.open(pdf_path) as pdf:

            total_pages = len(pdf.pages)

            for page_number, page in enumerate(pdf.pages):

                text = page.extract_text()

                if text:

                    extracted_text += text + "\n"
                    pages_data.append({
            "page": page_number + 1,
            "text": text
        })

        return {
            "text": extracted_text,
            "pages": total_pages,
    "pages_data": pages_data
        }

    except Exception as e:

        print(f"PDF Extraction Error: {e}")

        return None