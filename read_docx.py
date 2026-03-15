import zipfile
import xml.etree.ElementTree as ET

def read_docx(path):
    try:
        with zipfile.ZipFile(path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            paragraphs = tree.findall('.//w:p', namespaces)
            for p in paragraphs:
                texts = [t.text for t in p.findall('.//w:t', namespaces) if t.text]
                if texts:
                    print(''.join(texts))
    except Exception as e:
        print(f"Error reading docx: {e}")

read_docx(r"c:\Users\Professional\Desktop\root\master_final\Dissertasiya işi-I Fəsil.docx")
