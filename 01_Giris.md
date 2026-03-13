# GİRİŞ

**Mövzunun aktuallığı**
Son illərdə şəhərlərin sürətlə böyüməsi və əhalinin şəhər mərkəzlərinə kütləvi axını şəhər infrastrukturu, xüsusilə də nəqliyyat sistemləri üçün ciddi problemlər yaratmaqdadır. Gündəlik hərəkət intensivliyinin artması nəticəsində yaranan tıxaclar yalnız vaxt itkisinə deyil, həm də ekoloji və iqtisadi zərərlərə gətirib çıxarır. Bakı şəhəri də bu qlobal urbanizasiya prosesinin təsirinə məruz qalan iri meqapolislərdəndir; xüsusən də pik saatlarda mərkəzi küçələrdə və iri kəsişmələrdə nəqliyyat qovşaqlarının yüklənməsi müşahidə olunur [34]. Bu problemin həlli yalnız yolların iqtisadi cəhətdən səmərəsiz şəkildə genişləndirilməsi ilə məhdudlaşa bilməz, çünki fiziki məkan getdikcə azalır. Buna görə də, müasir dövrdə nəqliyyatın idarə edilməsi üçün "Ağıllı Şəhər" (Smart City) texnologiyalarından və mövcud infrastrukturun daha intellektual vasitələrlə optimallaşdırılmasından istifadə olunması aktuallıq kəsb edir [31, 33].

Sistemin intellektual fəaliyyətini təmin edən qabaqcıl üsullardan biri "Rəqəmsal Əkiz" (Digital Twin) texnologiyasının tətbiqidir [21, 24]. Bu texnologiya real obyektlərin (məsələn, kəsişmələrin, işıqforların fəaliyyətinin) kompüter mühitində virtual kopyasının yaradılmasını və hər hansı fiziki risk olmadan sınaqların keçirilməsini və optimal nəticələrin əldə olunmasını təmin edir. Mövcud vəziyyətdə nəqliyyat simulyasiyaları (məs. SUMO, VISSIM) əsasən yalnız ağır masaüstü (desktop) sistemlərdə işləyən və xüsusi dərəcədə peşəkarlıq tələb edən qapalı mühitlərdir [14]. Təqdim olunan dissertasiya işinin aktuallığı bu boşluğu dolduraraq nəqliyyat axınlarının idarəetmə modellərinin şəhər planlayıcıları və tədqiqatçılar üçün əsas fərdi kompüter resurslarını yükləmədən, birbaşa internet brauzeri (veb-mühiti) üzərindən əlçatan olmasını və istifadəçiyə vizual sınaqlar apara bilmə imkanı yaratmasını təmin etməkdir [30]. Belə bir veb-əsaslı yanaşma Bakı şəhərinin nəqliyyat optimizasiyası üçün həm praktik, həm də müasir dövrün tələblərinə cavab verən bir həll modelidir.

**Tədqiqatın məqsədi və vəzifələri**
Tədqiqat işinin əsas məqsədi şəhər nəqliyyat axınlarını modelləşdirmək və veb-brauzer üzərindən işləyən interaktiv "rəqəmsal əkiz" mühiti yaratmaq, həmçinin bu mühitin vizual olaraq rahat və istifadəyə yararlı olmasını təmin etməkdir.
Bu məqsədə çatmaq üçün qarşıya aşağıdakı əsas vəzifələr qoyulmuşdur:
1. Şəhər nəqliyyatını modelləşdirmək üçün istifadə olunan mövcud yanaşmaların (mikroskopik, makroskopik modelləri) və onlara əsaslanan vasitələrin analitik şəkildə araşdırılması.
2. Nəqliyyat vasitələrinin kəsişmələrdəki və yolların davamındakı davranışını (məsələn, tormozlama və distansiya qorunması) riyazi surətdə təqlid edə bilən İntellektual Sürücü Modelinin (IDM) seçilməsi və Python mühitində alqoritmləşdirilməsi.
3. Bakı şəhərinin uyğun yol xəritəsinin (OpenStreetMap vasitəsilə) məlumat bazasından çıxarılması və kodlaşdırılıb kompüter dilinə keçirilməsi.
4. İşıqforların fəaliyyət tsiklini və maşınların kəsişmə qaydalarını idarə edən sistemin arxa plan (backend) məntiqinin formalaşdırılması.
5. Emal olunmuş və hesablanmış bu hərəkət məlumatlarını vizual olaraq əks etdirəcək (maşınların hərəkətini animasiya olaraq izləməyə imkan verən) istiqamətləndirici bir veb interfeysin (frontend) proqramlaşdırılması.
6. Yaradılmış kompleksin Bakının real bir kəsişməsi üzərində eksperimental şəkildə test edilməsi və əldə olunan nəticələrin funksionallığının qiymətləndirilməsi.

**Tədqiqatın predmeti və obyekti**
*Obyekt:* Bakı şəhərinin nəqliyyat şəbəkəsi və bu şəbəkənin daxilində fəaliyyət göstərən avtomobil axınlarıdır.
*Predmet:* Nəqliyyat axınlarının kompüter texnologiyaları vasitəsilə riyazi modelləşdirilməsi və internet brauzerində birbaşa emal olunan vizual simulyasiya platformasının proqramlaşdırılmasıdır.

**Tədqiqat metodları**
Tədqiqat prosesində sistemli analiz, nəqliyyat modelləşdirilməsi nəzəriyyəsi (xüsusən mikroskopik sürücü davranışını əks etdirən IDM modeli), real yolların elektron mühitə adaptasiyası üçün qraf nəzəriyyəsi prinsiplərindən istifadə olunmuşdur. Layihənin proqram təminatı komponenti obyekt-yönlü proqramlaşdırma metodologiyası ilə (Python) işlənmiş, hesablama proseslərinin vizual tərəfi isə müasir veb-texnologiyaların (JavaScript, HTML5 Canvas kimi spesifik qrafik kitabxanaları) köməyi ilə qurulmuşdur. Həmçinin, coğrafi məlumatların emalı mərhələsində Coğrafi İnformasiya Sistemləri (GİS) yanaşmaları tətbiq edilmişdir.

**Tədqiqatın elmi yeniliyi**
Tədqiqat işinin əsas elmi yenilikləri aşağıdakılardan ibarətdir:
- Ənənəvi ağır masaüstü simulyasiya proqramlarına alternativ olaraq, hesablamaların mərkəzi server (backend) səviyyəsində aparılması və yekun strukturlaşmış hərəkətin yüngül şəkildə istifadəçi brauzerində formalaşdırılmasını təmin edən hibrid tipli arxitekturanın tətbiq olunması.
- İntellektual Sürücü Modelinin (IDM) riyazi hədlərinin lokal şəhər şərtlərinə (Xüsusilə Bakıdakı işıqfor dövrlərinə və ya sürücülük vərdişlərinə uyğun olaraq) uyğunlaşdırılmış şəkildə modifikasiya edilməsi.
- Xam coğrafi şəbəkə məlumatlarının (OpenStreetMap formati kimi) heç bir xarici interfeys və ya ağır mühərriklərdən istifadə olunmadan sürətli şəkildə veb-brauzer obyektlərinə dinamik konvertasiyası üçün ayrıca tənzimləmə mexanizminin yaradılması.

**Praktiki əhəmiyyət və həllər**
Layihə çərçivəsində ərsəyə gətirilən tətbiq sadəcə tədqiqat və qeydiyyat aləti kimi deyil, eyni zamanda idarəetmə və qərar qəbuletmə vasitəsi kimi istifadə oluna bilər. Məsələn, aidiyyəti idarəetmə qurumları tərəfindən hər hansı küçədə işıqfor fazasının müddətinin dəyişdirilməsi və ya tıxac intensivliyinin qabaqcadan təyini zamanı dərhal bu platforma üzərindən sınaqlar keçirilə bilər. Dəyişikliyin yollara göstərəcəyi rezonans təsirini virtual qaydada əvvəlcədən görmək, səmərəsiz sərmayə qoyuluşundan yayınmağa və optimizasiya proseslərini daha əhatəli tətbiq etməyə böyük təkan verir.

**Müdafiəyə təqdim edilən nəticələr**
Dissertasiyanın müdafiəsinə aşağıdakı əsas müddəalar və praktiki nəticələr təqdim edilir:
1. Şəhər yollarının simulyasiya mühiti üçün asanlıqla oxuna bilən qraf modelinə (qovşaq və tillərə) formalizasiyası metodu.
2. Avtomobillərin kəsişmələrdəki vəziyyətlərə avtomatik reaksiyalarını tənzimləyən mikroskopik, IDM əsaslı hesablama alqoritmini ehtiva edən sistem modulu.
3. Server hissəsi ilə vizual interfeys hissəsi arasında sinxron məlumat mübadiləsini təmin edən və interaktiv işləyə bilən "Rəqəmsal Əkiz" platformasının ərsəyə gəlmiş forması (prototipi).
4. Yaradılmış prototipin Bakı şəhərindəki müəyyən təşkil olunmuş yol hissəsinin məlumatları əsasında test edilməsi prosesi və oradan alınan konkret nəticələr toplusu.

**Nəticələrin aprobasiyası**
Tədqiqat işinin gedişində əldə edilmiş nəticələr və konseptual müddəalar universitetin müvafiq kafedralarında aparılan elmi-praktik seminarlarda məruzə edilmiş və geniş müzakirələr əsasında fəaliyyət istiqamətləri qiymətləndirilmişdir. (Qeyd: Əgər magistrantın hər hansı konfrans materialı, tezisi və ya elmi məqaləsi nəşr olunubsa (yaxud nəşrə qəbul edilibsə), burada konfransın adı, tarixi və məqalə başlığı qeyd olunacaq).
