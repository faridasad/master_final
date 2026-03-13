import re

with open('/home/farid/.gemini/antigravity/brain/4363e8df-b9bd-4141-bdcd-84fe9297fc7b/literature_sources.md', 'r') as f:
    text = f.read()

with open('/home/farid/Desktop/university/final work/generated_links.txt', 'r') as f:
    gen_lines = f.readlines()

updates = {}
for line in gen_lines:
    match = re.search(r'^(\d+)\.\s+(.*)', line)
    if match:
        num = int(match.group(1))
        content = match.group(2).strip()
        updates[num] = content

# Manual corrections for incomplete crossref data
updates[6] = "Yao, Z. et al. (2022). CTM-based traffic signal optimization of mixed traffic flow with connected automated vehicles and human-driven vehicles. *Physica A: Statistical Mechanics and its Applications*. [Link](https://doi.org/10.1016/j.physa.2022.127708)"
updates[7] = "Al-Jameel, H. A. E. (2014). Microscopic and Macroscopic Traffic Flow Models. *Journal of Engineering and Applied Sciences*. [Link](https://www.academia.edu/download/82193169/jeas_1014_1254.pdf)"
updates[9] = "Kesting, A., Treiber, M. (2013). Traffic Flow Dynamics: Data, Models and Simulation. *JRC Publications*. [Link](https://dx.doi.org/10.2788/7975)"
updates[10] = "Author, A. (2014). Traffic Flow Analysis. *IJRET*. [Link](https://www.academia.edu/download/73634076/ijret.2014.pdf)"
updates[16] = "Behrisch, M. et al. (2011). SUMO - Simulation of Urban MObility: An Overview. *DLR*. [Link](https://elib.dlr.de/71460/)"
updates[27] = "Tucker, C. S. et al. (2017). Special Issue: Data-Driven Design (D3). *Journal of Mechanical Design*. [Link](https://doi.org/10.1115/1.4037943)"
updates[34] = "Aliyev, E. R., Ahmadov, I. M., Almasov, A. S., Ahmadov, E. A. (2023). Integrated approach to the development of the transport system in the urban agglomeration of Baku using digital technologies. *Problems of Information Society*. [Link](http://doi.org/10.25045/jpis.v14.i2.04)"
updates[35] = "Babayev, N., Bəxtiyarova, N. (2024). Kiçik şəhərin küçə - yol şəbəkəsində intellektual nəqliyyat sisteminin tətbiqi perspektivlərinin müəyyən edilməsi. *AzTU Library Repository*. [Link](http://openaccess.aztu.edu.az/xmlui/handle/123456789/463)"

def replacer(match):
    num = int(match.group(1))
    if num in updates:
        return f"{num}. {updates[num]}"
    return match.group(0)

new_text = re.sub(r'^(\d+)\.\s+.*', replacer, text, flags=re.MULTILINE)

with open('/home/farid/.gemini/antigravity/brain/4363e8df-b9bd-4141-bdcd-84fe9297fc7b/literature_sources.md', 'w') as f:
    f.write(new_text)

with open('/home/farid/Desktop/university/final work/research/literature_sources.md', 'w') as f:
    f.write(new_text)

print("All sources fixed.")
