import re
import urllib.parse

with open('/home/farid/Desktop/university/final work/research/literature_sources.md', 'r') as f:
    text = f.read()

def replace_link(match):
    full_text = match.group(0)
    # Extract title - usually between the year (YYYY). and the journal name *Journal*
    # e.g., 2. Gao, K. (2020). Review of micro-and... *Journal*
    # Or find the text between "). " and ". *"
    title_match = re.search(r'\(\d{4}\)\.\s+(.*?)\.\s+\*', full_text)
    if not title_match:
        # Try finding text between "). " and ". " if no italics
        title_match = re.search(r'\(\d{4}\)\.\s+(.*?)\.', full_text)
        
    if title_match:
        title = title_match.group(1).strip()
        encoded_title = urllib.parse.quote(title)
        new_link = f"[Google Scholar](https://scholar.google.com/scholar?q={encoded_title})"
        # Replace the old [Link](...) with the new one
        return re.sub(r'\[Link\]\(.*?\)', new_link, full_text)
    return full_text

# Find lines starting with numbers and containing [Link]
new_text = re.sub(r'^\d+\..*?\[Link\]\(.*?\)', replace_link, text, flags=re.MULTILINE)

with open('/home/farid/Desktop/university/final work/research/literature_sources.md', 'w') as f:
    f.write(new_text)

with open('/home/farid/.gemini/antigravity/brain/4363e8df-b9bd-4141-bdcd-84fe9297fc7b/literature_sources.md', 'w') as f:
    f.write(new_text)

print("Links updated successfully.")
