import urllib.request
import json
import re

links_dict = {
    2: "https://doi.org/10.1016/j.apenergy.2023.121916",
    3: "https://link.springer.com/article/10.1186/s43067-023-00081-6",
    4: "https://doi.org/10.1016/j.procs.2019.04.118",
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

import urllib.request
import json
import re

def extract_doi(url):
    match = re.search(r'10\.\d{4,9}/[-._;()/:A-Z0-9a-z]+', url)
    if match:
        return match.group(0)
    return None

def get_crossref_metadata(doi):
    url = f"https://api.crossref.org/works/{doi}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data['message']
    except Exception as e:
        return None

results = []
for idx, link in links_dict.items():
    doi = extract_doi(link)
    if doi:
        meta = get_crossref_metadata(doi)
        if meta:
            title = meta.get('title', ['Unknown Title'])[0]
            authors = [a.get('family', '') + ', ' + a.get('given', '') for a in meta.get('author', [])]
            if not authors: authors = ["Unknown Author"]
            year = meta.get('published-print', {}).get('date-parts', [[None]])[0][0]
            if not year:
                year = meta.get('published-online', {}).get('date-parts', [[None]])[0][0]
            container = meta.get('container-title', [''])[0]
            author_str = ", ".join(authors) if len(authors) < 3 else authors[0] + " et al."
            
            res = f"{idx}. {author_str} ({year}). {title}. *{container}*. [Link]({link})"
            results.append((idx, res))
            print(f"Index: {idx} - Found: {title}")
        else:
            print(f"Index: {idx} - DOI not found in crossref: {doi}")
            results.append((idx, f"{idx}. Unknown entry for {link}. [Link]({link})"))
    else:
        print(f"Index: {idx} - No DOI in URL: {link}")
        results.append((idx, f"{idx}. Unknown manual entry for {link}. [Link]({link})"))

with open('generated_links.txt', 'w') as f:
    for r in results:
        f.write(r[1] + "\n")
