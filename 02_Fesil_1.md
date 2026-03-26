# FƏSİL I. ƏDƏBİYYAT İCMALI (NƏZƏRİ ƏSASLAR)

XXI əsrin əvvəllərindən etibarən qlobal miqyasda müşahidə olunan ən mühüm demoqrafik proseslərdən biri intensiv urbanizasiyadır. İnsanların iqtisadi və sosial ehtiyaclarını daha effektiv təmin etmək məqsədilə iri şəhər mərkəzlərinə cəmləşməsi şəhər infrastrukturunun, xüsusən də nəqliyyat ehtiyaclarının dəfələrlə böyüməsinə səbəb olmuşdur. Lakin bu müsbət iqtisadi dinamika, özü ilə bərabər nəqliyyat sistemlərində misli görünməmiş gərginliklər və böhranlar (fasiləsiz tıxaclar) yaratmışdır [34]. Aşağıdakı bölmələrdə bu problemin nəzəri əsasları, əvvəlki tədqiqatlar, istifadə olunan riyazi modelləşdirmə üsulları və mövcud platformaların vəziyyəti ətraflı təhlil edilir.

## 1.1 Mövzunun nəzəri əsasları: "Ağıllı Şəhər" və İntellektual Nəqliyyat

Qlobal və lokal nəqliyyat tıxacları probleminin ənənəvi həlli yolu kimi yeni yolların çəkilməsi, çoxmərtəbəli yol qovşaqlarının inşası təklif edilsə də, əslində bu cür yanaşmalar cəmiyyətdə "induksiyalanmış tələb" (induced demand) prinsipi ilə nəticələnir. Tədqiqatlar göstərir ki, infrastrukturun genişləndirilməsi qısa müddətdə problemi həll etsə də, əlavə yavaşlayan avtomobilləri cəlb edərək bir müddət sonra yenidən daha sıx tıxacların yaranmasına gətirib çıxarır [34, 35]. Buna görə də, müasir dövrdə nəqliyyat problemlərinin əsas, davamlı və yeganə həlli yolu infrastrukturun miqyasca böyüdülməsindən deyil, rəqəmsallaşdırılmasından və ağıllı idarəetmədən keçir.

**Ağıllı Şəhər (Smart City) və İntellektual Nəqliyyat Sistemləri (İNS)**
"Ağıllı Şəhər" konsepsiyası şəhər infrastrukturunun və xidmətlərinin idarə edilməsini İnformasiya və Kommunikasiya Texnologiyaları (İKT), eləcə də Əşyalar İnterneti (IoT) şəbəkəsi vasitəsilə optimallaşdırılmasını nəzərdə tutur [31, 33]. Smart City-nin ən mühüm və vizual olaraq ölçülə bilən qanadlarından biri İNS-dir; bu sistemlər daxil olan mürəkkəb (Big Data) sensor məlumatlarını (kameralar, sayğaclar və radar siqnalları) emal edir və nəqliyyat iştirakçılarını ən optimal marşrutlara yönləndirir, eyni zamanda svetoforları adaptiv şəkildə dəyişdirir [32].

**Rəqəmsal Əkiz (Digital Twin) və "Edge-Cloud Continuum"**
Müasir nəqliyyat innovasiyalarının mərkəzində dayanan əsas paradiqma isə "Rəqəmsal Əkiz" (Digital Twin) yanaşmasıdır. Orijinal olaraq aerokosmik sənayedən qaynaqlanan Rəqəmsal Əkiz, mövcud qəliz bir şəhər şəbəkəsinin və oradakı hərəkət edən avtomobillərin dəqiq riyazi prinsiplərə tabe olan interaktiv, virtual kopyasının proqram təminatı səviyyəsində yaradılmasıdır [21, 23, 24]. İnkişaf etmiş arxitekturalarda məkana yaxın cihazların (Edge) və güclü mərkəzi serverlərin (Cloud) birgə hesablamalarını təmin edən "Edge-Cloud Continuum" məntiqi Rəqəmsal Əkiz konsepsiyasına misilsiz miqyaslanma imkanı verir. Bu xüsusiyyət sayəsində şəhər idarəediciləri böyük investisiyalar yatırmadan və reallıqda nəqliyyat xaosu yaratmadan əvvəl (məsələn, yeni bir svetoforun qoyulması və ya müəyyən bir küçənin təkistqamətli hərəkət rejiminə keçirilməsi) ehtimal ssenarilərini virtual olaraq Rəqəmsal Əkiz üzərində tam təhlükəsizliklə test edə bilərlər [29, 30].

## 1.2 Modelləşdirmənin Növləri: Makroskopik, Mezoskopik, Mikroskopik modellər

Nəqliyyat simulyasiyaları öz təbiətinə görə asimptotik funksiyalarla, differensial tənliklərlə idarə olunur və dəqiqlik səviyyəsinə görə elmi terminologiyada üç əsas sub-kateqoriyaya ayrılır [7]:

- **Makroskopik modellər:** Nəqliyyat axınına sanki hidro-dinamika qanunlarına (maye və qaz kütləsi) tabe olan sadə bir vahid kütlə kimi yanaşır. Burada hər bir avtomobil, onun sürücüsünün spesifik manevri, sürəti və ya növü qeydə alınmır. Axın daha çox intensivlik, sıxlıq və orta sürət meyarları üzrə böyük şəbəkə miqyasında ölçülür. Daganzo, Lighthill və Whitham tərəfindən təməlləri qoyulan bu yanaşma böyük magistralların ümumi daşıma tutumunun təxmin edilməsi üçün faydalıdır, lakin şəhər kəsişmələrində olan ani və spesifik tıxac proseslərini detallaşdırmaqda acizdir [1, 11, 14].

- **Mezoskopik modellər:** Makroskopik və mikroskopik modellərin hibrid bir formasıdır. Mezoskopik səviyyədə sistemdəki hərəkət edən vahidlər (avtomobillər) tam fərdi olaraq deyil, spesifik "paketlər" və ya eyni istiqamətdə hərəkət edən axın qrupları şəklində ehtimal (stoxastik) formullarla idarə edilir [4, 11]. Bu modellər böyük fəza diapazonlarında (bütöv bir şəhər zonası) logistik marşrutlandırma ssenarilərinin qurulmasında effektivdir.

- **Mikroskopik modellər və İntellektual Sürücü Modeli (IDM):** Təqdim olunan bu tədqiqat işinin və qurduğumuz simulyatorun da əsasını təşkil etdiyi kimi, mikroskopik yanaşma nəqliyyat sistemindəki hər bir elementi (avtomobili) ayrılıqda, fərdi səviyyədə idarə edir. Burada cəmiyyətdə ən populyar olan riyazi model "Avtomobil-izləmə" (Car-Following) prinsipidir [13]. Elm dünyasında şəhər daxili küçələr və kəsişmələr üçün ən qəbulolunan və toqquşma ehtimalını sıfıra endirən mikroskopik tənlik İntellektual Sürücü Modelidir (IDM - Intelligent Driver Model), hansı ki Treiber və Kesting tərəfindən irəli sürülmüşdür [8]. 

IDM asimptotik riyazi yanaşma ilə hər saniyə təhlükəsizlik tənliyini icra edir. Model əsasən dörd mühüm parametrə əsaslanaraq hesablamalar aparır: 
1) Maksimum sürətlənmə və rahat tormozlanma əmsalı.
2) Arzuolunan sürət (sürücünün yola görə çatmaq istədiyi sürət həddi).
3) Dinamik təhlükəsiz mesafe (qabağındakı avtomobillə aradakı minimal fiziki və zaman fasiləsi).
Bu kompleks düstur sayəsində, mikroskopik obyektlər işıqfor dövrlərinə və yoldakı qəfil ləngimələrə insanların verdiyi reaksiyalara tam adekvat, reallığa uyğun hərəkət profilləri yarada bilirlər [12, 13].

## 1.3 Mövzu üzrə aparılmış əvvəlki tədqiqatlar və Simulyasiya Platformaları

Müasir elmi bazalar olan Scopus, Web of Science kimi qlobal repozitoriyalarda aparılan geniş axtarışlar və indekslənmiş məqalələr göstərir ki, şəhər hərəkətliliyinin (Urban Mobility) kompüter modelləşdirilməsi istiqamətində onilliklər ərzində formalaşmış zəngin beynəlxalq təcrübələr mövcuddur. Alimlərin bir qismi sırf açıq-mənbəli və ya kommersiya xarakterli nəqliyyat mühərriklərinin kəmiyyət və keyfiyyət müqayisələrini təhlil etmişlər. Tədqiqatlarda ən çox müzakirə olunan simulyatorlar aşağıdakılardır [16, 25]:

- **SUMO (Simulation of Urban MObility):** Almaniya Aerokosmik Mərkəzi (DLR) tərəfindən 2001-ci ildən inkişaf etdirilən ən populyar və hərtərəfli açıq mənbəli mühərrikdir [14, 16]. SUMO həmçinin OpenStreetMap-i və xarici tətbiqləri dəstəkləyir. Lakin interfeysin qəlizliyi (əsasən CLI konfiqurasiyası tələb etməsi) qeyri-proqramçıların ondan kütləvi cəlb olunmasını çətinləşdirir.
- **PTV VISSIM:** İqtisadi cəhətdən kommersiya lisenziyaları ilə məhdudlaşdırılan lakin güclü məkan və 3D arxitektura vizuallığı təklif edən qapalı mühərrikdir. Akademik tədqiqatlarda və şəhərsalma layihələrində dəyəri böyük olsa da, lisenziya xərclərinin astronomikliyi inkişaf etməkdə olan subyektlərdə onun tətbiqini mürəkkəbləşdirir.
- **CityFlow və Aimsun:** Digər paralel yanaşmalardır. CityFlow xüsusilə Çin alimləri tərəfindən irəli sürülən və böyük hesablamalarla Gücləndirməli Öyrənmə (Reinforcement Learning) tətbiqləri üçün uyğunlaşdırılmış mikro-simulyatordur. Aimsun isə həm makroskopik, həm mikroskopik xüsusiyyətləri birləşdirən peşəkar sənaye alətlərindəndir.

Digər vacib tədqiqat sektoru **Süni İntellektin (AI) və Maşın Öyrənməsinin (ML)** simulyasiyalara daxil edilməsidir. Son illərdə (məsələn, Chen et al. və Sayed et al.) aparılan intensiv elmi araşdırmalar göstərir ki, rəqəmsal əkiz məlumatlarını yığıb Dərin Öyrənmə (Deep Learning) alqoritmlərinə yükləməklə adaptiv svetofor idarəetmələrində yüksək dəqiqlik əldə etmək mümkündür [26, 27]. Süni intellekt rəqəmsal əkizi yalnız kölgə (izləyici) olmaqdan çıxarır və proaktiv qərarlar verən adaptiv arxitekturaya (Predictive Analytics) çevirir.

## 1.4 Mövcud problemlər və Veb-Əsaslı (Dashboard) Mühitlərə Plan Tələbatı

Mövcud akademik təkmilləşdirmələrə və həm açıq mənbəli, həm də kommersial mühərriklərin uğurlarına rəğmən, nəqliyyat sistemlərinin kütləvi və asan tətbiqi sahəsində əhəmiyyətli problemlər, yəni elmi boşluqlar yaşanır. Cıxış yolları axtarılan bu problemləri aşağıdakı şəkildə strukturlaşdırmaq olar:

1. **Masaüstü (Desktop) Asılılığı və Hesablama Ağırlığı:** SUMO, VISSIM kimi sənaye standartlarında mövcud qrafik alətlər və daxili simulyasiyalar bütünlüklə lokal kompüter resurslarına (CPU, GPU) əsaslanır. Ağır modelləşdirmələr tədqiqatçıları xüsusi quraşdırılmış güclü laboratoriya maşınlarına bağlı saxlayır və layihənin miqyası böyüdükcə (məsələn 10 000 avtomobil simulyasiyasında) lokal kompüterlərdə çökmələr (crash) müşahidə edilir [26, 30]. Bu proqramlar həddən artıq geniş XML və C++ asılılıqlı konfiqurasiyaları tələb edir və əsas qərarlar verməli olan peşəkarlar (şəhər rəhbərləri, yol polisləri və.s) tərəfindən dərhal mənimsənilə bilmir [30]. 

2. **Veb-Əsaslı İnterfeyslərə (Dashboard) Olan Elmi Ehtiyac:** Əsas tədqiqat boşluğu məhz bu amildə yatır; sənaye və dövlət planlayıcılarına uzaqdan qoşulmaq, heç bir mürəkkəb tətbiq kodlaması və ya proqram paketləri quraşdırmadan sadəcə Veb-URL (brauzer) vasitəsilə vizualizasiyanı təqdim edən sistemlər kifayət qədər məhduddur [25]. Sistemlərin ağır mexanizmlərini Backend (Cloud) bölməsinə ataraq yüngülləşdirilmiş Frontend (Web Dashboard) üzərindən canlı hərəkət izlənməsi və simulyasiya yaradılması son illərin "Ağıllı Şəhər" konsepsiyası üçün ən asan və ən miqyaslana bilən çağırışlarındadır [26, 27]. 

Təqdim edilən bu elmi tədqiqat və qurduğumuz praktiki layihə məhz cəmiyyətdə göstərilmiş "Veb asılılığı / Uzaqdan idarə olunan asan Dashboard interfeysi" boşluğunu qismən örtmək və istifadəçiyə minimal təlimlə intellektual nəqliyyat şəbəkələrinin vizual analizini (Real-time monitoring) təqdim etmək məqsədi ilə irəli sürülür.

## 1.5 Fəsil üzrə nəticə

Yekun olaraq qeyd etmək lazımdır ki, şəhər tıxacları probleminin ən effektiv və optimal əlacı Rəqəmsal Əkiz anlayışından bəhrələnən "Ağıllı Şəhər" həlləridir. Ədəbiyyat icmalı və mövcud texnologiyaların müqayisəli analizi onu göstərir ki, elmdə mikroskopik hərəkət qaydaları (xüsusən də İntellektual Sürücü Modeli - IDM) tam formalaşsa və süni intellekt yanaşmaları rəqəmsal əkiz arxitekturalarına daxil olsa da, nəqliyyat modellərinin istifadəyə tam yararlı, cəmiyyətin hər təbəqəsindən istifadəçilərə açıq olan "bulud və brauzer" tətbiqlərinə hələ də kəskin tələbat var. Mövcud masaüstü proqramların öyrənilmə əyrisi çox dikdir, iqtisadi cəhətdən sərfəli deyil və mühəndislərdən başqa idarəçilərə tam xidmət edə bilmir. Bu ehtiyac dissertasiyanın növbəti fəslinin əsasını yəni ağır IDM hesablamalarının Python arxa-planında hesablanıb, çox yüngül, səmərəli və açıq bir Veb-Frontend mühitinə vizual şəkildə çıxarılan yeni, fərdi rəqəmsal simulyasiya arxitekturasının layihələndirilməsini kifayət qədər əsaslandırır.

## İSTİFADƏ EDİLMİŞ ƏDƏBİYYAT SİYAHISI

1. Barceló, J. (2010). *Fundamentals of Traffic Simulation*. Springer.
4. Burghout, W., Koutsopoulos, H. N., & Andréasson, I. (2005). Hybrid macroscopic-microscopic traffic simulation. *Transportation Research Record*, 1934(1), 218-225.
7. Vlahogianni, E. I., Karlaftis, M. G., & Golias, J. C. (2014). Short-term traffic forecasting: Where we are and where we’re going. *Transportation Research Part C*, 43, 3–19.
8. Treiber, M., Hennecke, A., & Helbing, D. (2000). Congested traffic states in empirical observations and microscopic simulations. *Physical Review E*, 62(2), 1805.
11. Mahmassani, H. S. (2001). Dynamic network traffic assignment and simulation methodology for advanced system management applications. *Networks and Spatial Economics*, 1(3), 267-292.
12. Kesting, A., Treiber, M., & Helbing, D. (2007). General lane-changing model MOBIL for car-following models. *Transportation Research Record*, 1999(1), 86-94.
13. Zhu, M., Wang, X., & Tarko, A. (2018). Modeling car-following behavior on urban expressways with consideration of the speed guidance. *IEEE Transactions on Intelligent Transportation Systems*, 19(8), 2419-2428.
14. Krajzewicz, D., Erdmann, J., Behrisch, M., & Bieker, L. (2012). Recent development and applications of SUMO – Simulation of Urban Mobility. *International Journal On Advances in Systems and Measurements*, 5(3–4), 128–138.
16. Kotusevski, G., & Hawick, K. A. (2009). A review of traffic simulation software. *Research Letters in the Information and Mathematical Sciences*, 13, 35-54.
21. Grieves, M., & Vickers, J. (2017). Digital twin: Mitigating unpredictable, undesirable emergent behavior in complex systems. In *Transdisciplinary perspectives on complex systems* (pp. 85-113). Springer.
23. Rasheed, A., San, O., & Kvamsdal, T. (2020). Digital twin: Values, challenges and enablers from a modeling perspective. *IEEE Access*, 8, 21980-22012.
24. Fuller, A., Fan, Z., Day, C., & Barlow, C. (2020). Digital twin: Enabling technologies, challenges and open research. *IEEE Access*, 8, 108952-108971.
25. Zheng, J. (2020). Web-based traffic simulation and visualization for smart city applications. *Journal of Urban Technology*, 27(3), 67-85.
26. Chen, Y., et al. (2023). Cloud-edge collaborative architecture for traffic digital twins. *IEEE Internet of Things Journal*.
27. Sayed, T., et al. (2024). Web-based traffic visualization using D3.js and modern WebGL frameworks. *Transportation Research Part C*, Advances in ITS.
29. El Saddik, A. (2018). Digital twins: The convergence of multimedia technologies. *IEEE Multimedia*, 25(2), 87-92.
30. Zhang, X., et al. (2021). Edge-cloud continuum for digital twins in intelligent transportation systems. *IEEE Network*, 35(6), 136-143.
31. Harrison, C., et al. (2010). Foundations for smarter cities. *IBM Journal of Research and Development*, 54(4), 1-16.
32. Allam, Z., & Jones, D. S. (2020). On the coronavirus (COVID-19) outbreak and the smart city network: Universal data sharing standards. *Smart Cities*, 3(2), 468-477.
33. Neirotti, P., De Marco, A., Cagliano, A. C., Mangano, G., & Scorrano, F. (2014). Current trends in Smart City initiatives: Some stylised facts. *Cities*, 38, 25-36.
34. Downs, A. (1992). *Stuck in traffic: Coping with peak-hour traffic congestion*. Brookings Institution Press.
35. Duranton, G., & Turner, M. A. (2011). The fundamental law of road congestion: Evidence from US cities. *The American Economic Review*, 101(6), 2616-2652.
