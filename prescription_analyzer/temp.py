import pytesseract
import cv2

# If on Windows, set path (IMPORTANT)
pytesseract.pytesseract.tesseract_cmd = r"C:/Program Files/Tesseract-OCR/tesseract.exe"

# Load image
image_path = "prescriptions/2.jpg"
img = cv2.imread(image_path)

# Convert to grayscale (important for OCR accuracy)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Optional preprocessing (helps a lot for prescriptions)
# gray = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

# OCR
text = pytesseract.image_to_string(gray)

print("----- OCR OUTPUT -----")
print(text)
