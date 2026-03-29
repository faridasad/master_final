import re

with open('02_Fesil_1.md', 'r', encoding='utf-8') as f:
    text = f.read()

# Make strict string replacements based on my mapping:
text = text.replace('gətirir [1].', 'gətirir [1].') 
text = text.replace('qanunauyğunluqlara əsasən', 'qanunauyğunluqlara və qlobal arxitekturaya [1, 31] əsasən')
text = text.replace('səbəb olur [9].', 'səbəb olur [31].')
text = text.replace('fəlsəfəsidir [8, 12].', 'fəlsəfəsidir [31, 33].')
text = text.replace('azaltdığı aydın olmuşdur [19].', 'azaltdığı aydın olmuşdur [32].')
text = text.replace('məcburdur [15].', 'məcburdur [28].')
text = text.replace('gələrək [13]', 'gələrək [23]')

text = text.replace('Zhang et al. (2021) "Edge-cloud continuum"', 'Chen et al. (2024) və Yu et al. (2023) "Edge-cloud continuum"')
text = text.replace('almağı təklif etmişlər [20, 21].', 'almağı təklif etmişlər [5, 25].')

text = text.replace('ifadə olunur [11].', 'ifadə olunur [3].')
text = text.replace('bölünür [7, 18]:', 'bölünür [1, 7]:')
text = text.replace('yaşadır [3].', 'yaşadır [11].')
text = text.replace('formatındadır [4].', 'formatındadır [4].') # mapped to 4 Souza
text = text.replace('Model) [2].', 'Model) [8].')
text = text.replace('yararlanır [5, 14].', 'yararlanır [9, 13].')
text = text.replace('verdiyini nümayiş edir [6, 18].', 'verdiyini nümayiş edir [5, 19].')
text = text.replace('olunur [10].', 'olunur [16, 18].')
text = text.replace('tətbiqlərdəndir [7].', 'tətbiqlərdəndir [11].')

text = text.replace('Chen et al., El Saddik və digər sənaye liderlərinin', 'Sayed et al. və Chen et al. kimi tədqiqatçıların')
text = text.replace('qoyulmalıdır [15, 21].', 'qoyulmalıdır [3, 5].')
text = text.replace('aciz qalır [22].', 'aciz qalır [6].')
text = text.replace('aparmalıdır [20].', 'aparmalıdır [30].')
text = text.replace('təşkil edəcək [18].', 'təşkil edəcək [25, 26, 30].')
text = text.replace('vizyonlarıdır [13, 17].', 'vizyonlarıdır [24, 28].')

with open('02_Fesil_1.md', 'w', encoding='utf-8') as f:
    f.write(text)
