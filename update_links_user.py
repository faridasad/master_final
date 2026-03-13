import re

# Read the contents of the file
with open('/home/farid/.gemini/antigravity/brain/4363e8df-b9bd-4141-bdcd-84fe9297fc7b/literature_sources.md', 'r') as f:
    text = f.read()

# Define the dictionary of links based on user input
links_dict = {
    2: "https://doi.org/10.1016/j.apenergy.2023.121916",
    3: "https://link.springer.com/article/10.1186/s43067-023-00081-6",
    4: "https://link.springer.com/chapter/10.1007/978-3-319-75961-6_5",
    5: "https://doi.org/10.1109/TIV.2024.3367919",
    6: "https://doi.org/10.1016/j.physa.2022.127708",
    7: "https://www.academia.edu/download/82193169/jeas_1014_1254.pdf",
    8: "https://doi.org/10.1103/PhysRevE.62.1805",
    9: "https://dx.doi.org/10.2788/7975",
    10: "https://www.academia.edu/download/73634076/ijret.2014.pdf",
    11: "https://doi.org/10.1016/j.trpro.2025.03.101",
    12: "https://doi.org/10.1109/IVS.2012.6232131",
    13: "https://doi.org/10.1080/03081060.2020.1735746",
    14: "https://doi.org/10.1109/ITSC.2018.8569938",
    15: "https://doi.org/10.1109/MPRV.2008.80",
    16: "https://elib.dlr.de/71460/",
    17: "https://doi.org/10.1016/j.compenvurbsys.2017.05.004",
    18: "https://doi.org/10.1145/1400713.1400740",
    19: "https://doi.org/10.1016/j.iatssr.2018.07.002",
    20: "https://link.springer.com/chapter/10.1007/978-3-319-62316-0_12",
    21: "https://doi.org/10.1177/2399808318796416",
    22: "https://doi.org/10.1109/TII.2018.2873186",
    23: "https://link.springer.com/chapter/10.1007/978-3-319-38756-7_4",
    24: "https://doi.org/10.3390/su12062307",
    25: "https://doi.org/10.1016/B978-0-443-18428-4.00002-5",
    26: "https://doi.org/10.1145/2775292.2775303",
    27: "https://doi.org/10.1115/1.4037943",
    28: "https://doi.org/10.1016/j.cities.2020.103064",
    29: "https://doi.org/10.3390/en14082338",
    30: "https://doi.org/10.1177/03611981211035760",
    31: "https://link.springer.com/article/10.1007/S10708-013-9516-8",
    32: "https://doi.org/10.1016/j.landusepol.2020.105201",
    33: "https://doi.org/10.1016/j.cities.2013.12.010",
    34: "http://doi.org/10.25045/jpis.v14.i2.04",
    35: "http://openaccess.aztu.edu.az/xmlui/handle/123456789/463"
}

def replace_link(match):
    full_text = match.group(0)
    num_str = match.group(1)
    
    try:
        num = int(num_str)
        if num in links_dict:
            new_url = links_dict[num]
            # Replace whatever is inside [](...) with the new url
            return re.sub(r'\[Google Scholar\]\(.*?\)', f'[Link]({new_url})', full_text)
    except ValueError:
        pass
        
    return full_text

# Replace lines starting with number. 
lines = text.split('\n')
new_lines = []
for line in lines:
    match = re.search(r'^(\d+)\.\s+', line)
    if match and '[Google Scholar]' in line:
        num = int(match.group(1))
        if num in links_dict:
            new_url = links_dict[num]
            line = re.sub(r'\[Google Scholar\]\([^)]+\)', f'[Link]({new_url})', line)
    new_lines.append(line)

new_text = '\n'.join(new_lines)

with open('/home/farid/.gemini/antigravity/brain/4363e8df-b9bd-4141-bdcd-84fe9297fc7b/literature_sources.md', 'w') as f:
    f.write(new_text)

with open('/home/farid/Desktop/university/final work/research/literature_sources.md', 'w') as f:
    f.write(new_text)

print("User links updated successfully.")
