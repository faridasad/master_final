# FƏSİL I. ŞƏHƏR NƏQLİYYAT SİSTEMLƏRİ VƏ MODELLƏŞDİRİLMƏNİN NƏZƏRİ ƏSASLARI (ƏDƏBİYYAT İCMALI)

XXI əsrin əvvəllərindən etibarən qlobal miqyasda müşahidə olunan ən mühüm demoqrafik proseslərdən biri intensiv urbanizasiyadır. İnsanlar iqtisadi, mədəni və sosial ehtiyaclarını daha effektiv təmin etmək məqsədilə iri şəhər mərkəzlərinə cəmləşmişlər. Xüsusən inkişaf etməkdə olan ölkələrdə meqapolislərin (məsələn, Bakı, Mumbay, İstanbul, Mexiko və s.) hüdudsuz genişlənməsi şəhər infrastrukturunun, xüsusən də nəqliyyat tutumunun ehtiyaclarının dəfələrlə çoxalmasına səbəb olmuşdur. Lakin bu müsbət iqtisadi dinamika, özü ilə bərabər həyati əhəmiyyət daşıyan şəhər qan damarlarında – nəqliyyat sistemlərində misli görünməmiş gərginliklər və böhranlar (fasiləsiz tıxaclar) yaratmışdır. Aşağıdakı alt-fəsillərdə, bu ümumbəşəri problemin nəzəri kökləri, əvvəlki dövrlərin tədqiqatçıları tərəfindən tətbiq olunmuş həllər, müasir Rəqəmsal Əkiz (Digital Twin) texnologiyalarının təhlili, məlumat toplama sensorikası və nəhayət riyazi modelləşdirmə üsulları (xüsusən mikroskopik hərəkət tənlikləri) çoxşaxəli, hibrid şəkildə analiz edilmişdir.

## 1.1 Müasir şəhərlərdə nəqliyyat tıxacları problemi, iqtisadi və ekoloji təsirlər

Şəhər tıxacları təkcə yolda keçirilən passiv zaman itkisi deyildir; o həmçinin işçi qüvvəsinin səmərəliliyinə zərbə vuran, cəmiyyətin psixoloji rifahını aşağı salan, avtomobillərin daxili yanma mühərriklərindən (İCE - Internal Combustion Engines) çıxan karbon qazı ($CO_2$) və azot oksidi ($NO_x$) səviyyəsinin kəskin artmasına, eləcə də şəhər tədarük zəncirlərinin gecikməsinə səbəb olan ciddi, strukturlaşdırılmış böhrandır. Tarixən dövlət planlaşdırıcıları tıxacların həlli yolu kimi daim köhnə yanaşmalardan – yeni, daha enli yolların çəkilməsindən, alternativ tunellərin və çoxmərtəbəli beton estakadaların inşasından istifadə etmişlər.  
Lakin, nəqliyyat axınının təməl dinamikası [1] və müasir urbanizm tədqiqatlarına [31] əsasən, bu cür əlavə zolaqların tikintisi yalnız müvəqqəti və "aldadıcı sakitlik" gətirir. Tədqiqatlar göstərir ki, hər hansı inşası bitmiş, asanlaşdırılmış yeni yol təbii olaraq (induksiyalanmış tələb forması kimi) həmin yola daxil olan daha çox yeni avtomobil qüvvəsini cəlb edir. Beləliklə, rəqəmsal adaptasiya və innovativ idarəetmə olmadan sırf fiziki infrastrukturun böyüdülməsi qısa bir müddət ərzində eyni düyünlərin yenidən təkrarlanmasına gətirib çıxarır [31, 32]. 

Tıxacların qlobal iqtisadiyyata vurduğu ziyanlar bir neçə parametr əsasında qiymətləndirilir:
*   Yanmayan (boşa xərclənən) yanacaq itkisi.
*   İnsanların iş saatlarında istehsal edə biləcəkləri itirilmiş gəlirlər.
*   Logistika və yük daşımalarının ləngiməsindən yaranan tarif artımları.
Amerika Birləşmiş Ştatlarında INRIX məlumatlarına əsasən böyük şəhərlərdəki adi bir sürücü ildə təqribən 99 saatını məhz tıxacda itirir və bu, milli iqtisadiyyata milyardlarla dollar "məhsuldarlıq cəriməsi" kəsir. Deməli, infrastrukturun betonla böyüdülməsi həll deyilsə, onu *intellektlə*, *rəqəmsallaşdırma ilə* və *optimizasiya ilə* böyütmək yeganə mühəndislik həllidir.

## 1.2 "Ağıllı Şəhər" (Smart City) konsepsiyası və Nəqliyyat İdarəetməsi

"Ağıllı Şəhər" 2000-ci illərin ortalarında (xüsusilə nəhəng texnologiya konserni IBM tərəfindən irəli sürülən "Smarter Planet" konsepsiyasından inkişaf taparaq) akademik aləmə daxil olmuş inqilabi bir şəhərsalma fəlsəfəsidir [31, 33]. Şəhərin komponentlərinin – nəqliyyat axınlarının, küçə işıqlandırılmasının, su təchizatının – bir-biriylə ünsiyyət quran İnformasiya və Kommunikasiya Texnologiyaları (İKT), eləcə də Əşyalar İnterneti (IoT) şəbəkəsi vasitəsilə mərkəzləşdirilmiş şəkildə idarə edilməsi Smart City-nin təməlidir. 

Smart City konsepsiyasını müxtəlif alimlər 6 əsas komponentə bölmüşdür: Smart Mobility (Ağıllı Hərəkətlilik), Smart Environment (Ağıllı Çevrə), Smart Governance (Ağıllı Dövlət idarəçiliyi), Smart Living (Ağıllı Yaşam), Smart Economy (Ağıllı İqtisadiyyat) və Smart People. Bu altı böyük şaxənin mərkəzi generatoru məhz **Smart Mobility - İntellektual Nəqliyyat Sistemləridir (İNS)**.
İNS mürəkkəb riyazi alqoritmlərə sahib prosessorlar toplusu olub, işıqforları statik deyil, yoldakı fərdlərin (avtomobillərin) sıxlığına avtomatik uyğunlaşdırır (Adaptiv Traffic Signal Control). Covid-19 pandemiyası (qapanmalar və idarəetmə sıxıntıları) zamanı məlumat paylaşım standartlarının xüsusilə Smart City konsepsiyasını necə cəlbedici etdiyi və şəhərsalma problemlərini azaltdığı aydın olmuşdur [32]. 

```mermaid
graph TD
    A[Şəhər Tıxacları və Zərərlər] -->|Ənənəvi, qısa-müddətli yanaşma| B[Yeni çox-zolaqlı yolların inşası]
    B -->|İnduksiyalanmış tələb qanunu| C[Yenidən yol tutumunun bitməsi və böhran]
    A -->|Rəqəmsal, davamlı yanaşma| D[Ağıllı Şəhər - Smart City]
    D --> E[İntellektual Nəqliyyat Sistemi və IoT]
    E --> F[Veb Əsaslı Rəqəmsal Əkiz Simulyasiyası]
    F --> G[Svetofor və Qovşaqların Real-Zamanlı Optimizasiyası]
    G --> H[Davamlı və Təhlükəsiz Şəhər Mühiti]
```
**Şəkil 1.1:** *Ənənəvi nəqliyyat inşasından fərqli olaraq Smart City arxitekturasına (Rəqəmsal Əkiz) keçidin qrafik məntiqi.*

## 1.3 Nəqliyyat Sistemlərində Məlumat Toplama (Data Acquisition) Mexanizmləri

Simulyasiya, o cümlədən İntellektual Sistemlərin ən əsas "yanacağı" düzgün, dəqiq və kəsilməz yerdən (Local nodes) gələn datadır. Rəqəmsal bir sistem reallıqdakı (Physical System) maşın sayını oxuya bilmirsə, heç bir xəritə və hesablama fayda verməz. Buna görə də "Ağıllı Şəhərlərdə" sensorlar böyük texnoloji töhfə verir. Aşağıda ən geniş yayılmış 4 əsas məlumat toplama texnologiyası təhlil edilmişdir:

**1. İnduktiv İlmələr (Inductive Loop Detectors)**
Yer altı (asfalt qatı daxilinə) çəkilmiş xüsusi maqnit yaradan metal kabellərdən ibarətdir. Yuxarıdan metal kütlə (avtomobil) keçdiyi zaman asılı qalan dalğa tezliyi (induktivlik) kəskin dəyişir. Bu dəyişiklik mikrokontrollerə impuls olaraq göndərilir və 1 avtomobil kimi qeydə alınır. Ən ucuz standart həlldir, lakin asfaltın erroziyasından tez-tez xarab olur və sadəcə 0-1 (üstümdə maşın var və ya yoxdur) məntiqi verir, növünü ayıra bilmir.

**2. Kameralar və Kompüter Görməsi (Computer Vision / AI Video Detection)**
Qovşaqların üstündə asılan İP kameralar real zamanlı yüksək kadr (FPS) ötürür. Bulud texnologiyasındakı AI neyron şəbəkələri (məs. YOLO - You Only Look Once və ya Haar Cascades) kadrdakı hər bir bloku analiz edərək həm maşını sayır, həm onun növünü (avtobus, qür qaldıran avadanlıq, sedan), həm də vektor sürətini təyin edir. Hazırda dünyada dominant texnologiyaya çevrilməkdədir, lakin yağışlı və dumanlı hava şəraitində işıq qırılması səbəbindən ani korluq (algoritmik xəta) yaşaya bilirlər.

**3. Üzən Avtomobil Məlumatları (Floating Car Data - FCD və GPS)**
Bu texnologiya ümumiyyətlə heç bir küçə infrastrukturuna ehtiyac duymur. İqlimdən asılılığı yoxdur. Sürücünün özünün istifadə etdiyi Google Maps, Yandex və ya GPS modulları vasitəsilə 2-3 saniyədən bir peykə öz coğrafi koordinatını $(X, Y, Speed)$ göndərir. Əgər eyni küçədən peykə gələn 50 ayrı telefonun hərəkət sürəti saatda 5 km-dirsə, mərkəzi server (Edge / Cloud) ani qərar verir ki, o küçədə dəhşətli sıxlıq var və həmin küçəni xəritədə "qırmızı" xətlə rəngləyir. Lakin bu yanaşma avtomobili bir "nöqtə" kimi görür, qovşağa çatan insanın saniyəlik manevr izləməsini verə bilmir.

**4. LiDAR, Radar və İnfraqırmızı (IR) Sensorlar**
Xüsusilə qəza qeydiyyatları üçün və pis hava şəraitində işıqforları dəyişmək üçün 3D lazer (LiDAR) tətbiq olunur. Nəqliyyat tədqiqatlarında LiDAR hərəkət edən obyektin bulud nöqtəsini (Point Cloud) çıxarır. Radarlar approaches vasitəsilə sürət kameralarının əsasıdır (Doppler effekti). Bu datchiklər xüsusən mikro-simulyasiya üçün ən təmiz "Gap" (ara məsafəsi) məlumatlarını təchiz edirlər. Rəqəmsal Əkiz modellərində sistem daim sensorlardan alınan bu 4 müxtəlif hibri dataya inteqrasiya yaratmağa məcburdur [28].

## 1.4 "Rəqəmsal Əkiz" (Digital Twin) Texnologiyası və Edge-Cloud Arxitekturası

Rəqəmsal Əkizin tam riyazi işləməsi əslində fiziki aləmlə kompüter aləminin əbədi güzgüsüdür. Rəqəmsal Əkiz orijinal olaraq aerokosmik sənayedən və mürəkkəb istehsalat sferasından (xüsusən NASA Apollon uçuşlarında simulyasiya təhtəlşüuru kimi) gələrək [23], dövrümüzdə mürəkkəb real dünya sistemlərinin – şəhərin məkan şəbəkəsinin virtual surətinə tətbiqini tapmışdır. Professor Grieves tərəfindən iddia edildiyi kimi "Fiziki, Virtual və onlar arasındakı Əlaqə" Digital Twin-in yeganə qaydasıdır. 
Bu obyektlər (məsələn, svetoforlar, kəsişmələr, istiqamətləndirici lövhələr) üzərində böyük maliyyə itkiləri olmadan, virtual mühitdə 100 illik ehtimalları cəmi saniyələr içərisində yoxlamağı mümkün edir. 

**Nəqliyyatda "Edge-Cloud Continuum" (Kənar-Bulud Birləşməsi)**
Şəhər mühitində 100 000-dən artıq avtomobilin eyni anda kordinatını, tormozlamasını simulyasiya etmək qeyri-adi dərəcədə böyük CPU (hesablama) resursu tələb edir. Əgər hər sensordan gələn bütün milyonlarla məlumat Mərkəzi dövlət serverinə qədər birbaşa axarsa, şəbəkələrdə (Latency - Gecikmə) dözülməz darboğaz (Bottleneck) yaşanar. Müasir elmi mənbələr, o cümlədən Chen et al. (2024) və Yu et al. (2023) "Edge-cloud continuum" anlayışını gündəmə gətirərək, bu kütlənin mərkəzi şəbəkələri bloklamasının qarşısını almağı təklif etmişlər [5, 25].
Bu arxitekturaya əsasən hesablamalar 3 böyük topoloji qat (Layer) üzrə paylanır:

1.  **Cihaz və ya IoT qatı (Sensors/Actuators):** Küçələrdə olan fiziki kameralar (Edge xüsusiyyəti olmayan) fasiləsiz video kadrlarını yaxınlıqdakı qutuya ötürür.
2.  **Kənar (Edge) qatı (Fog/Edge Computing):** Təsəvvür edək ki, hər 4 qovşaqdan bir yol kənarında kiçik qutu (məs: NVIDIA Jetson və ya kiçik Raspberry Serveri) qoyulub. Bu kompüterlər böyük video datanı deşifrə edib ancaq "Say və Sürət" nəticəsini mətn kimi alır. Yəni videonun (Geqabaytlarla ölçülə bilən datanın) Mərkəzə getməsinin qarşısını alıb onu kiçik (Bir neçə Kilobayt) həcmlə Mərkəzə yönləndirir. 
3.  **Bulud (Cloud / Backend) qatı:** Mərkəzi server məhz yüngülləşmiş dataları yığır, Rəqəmsal Əkizin Python mühərriklərini hərəkətə keçirir, riyazi fərziyyələr yaradır, marşrutları dəyişdirir və IDM mikroskopik simulyasiyasına tabe etdirir.
4.  **Veb İnterfeys (Frontend Dashboard):** Yekun istifadəçinin brauzeri vasitəsilə 2D/3D (WebGL) animasiya ilə mərkəzdən çəkdiyi dataları qüsursuz işlədir.

```mermaid
sequenceDiagram
    participant IoT as Şəhər Sensorları (Kameralar)
    participant Edge as Edge Processor (Qovşaq Qutusu)
    participant Cloud as Cloud Engine (Python / SUMO)
    participant Frontend as Veb Dashboard (React/Canvas)
    
    IoT->>Edge: Fasiləsiz 1080p Video Axını (Böyük həcm)
    Note over Edge: YOLO AI ilə avtomobillərin tanınması
    Edge-->>Edge: Məlumat kiçildirilir (Kilobaytla Matrix)
    Edge->>Cloud: Təmiz koordinat + Sıxlıq hesabatı
    Cloud-->>Cloud: İntellektual Sürücü Modeli hesablaması
    Cloud->>Frontend: WebSocket ilə real-zamanlı (C=X,Y) frame
    Frontend-->>Frontend: 60 FPS Animasiya və Qrafiklər
    Frontend->>Cloud: Rəhbərin svetoforu dəyişmə komandası
    Cloud->>IoT: Svetofor fazası dəyişdirilir (Real həyat)
```
**Şəkil 1.2:**  *Kənar-Bulud (Edge-Cloud) Rəqəmsal Əkiz arxitekturasının məlumat axını və qərar qəbuletmə mexanizminin sinxron iş prinsipləri.*

## 1.5 Nəqliyyat axınlarının riyazi və kompüter modelləşdirilməsi metodları

Kompüter daxilində şəhər küçələrindəki nəqliyyat qanunauyğunluqlarının formalaşdırılması çoxistiqamətli funksiyalara əsaslanır və kəsrli asimptotik riyazi tənliklərlə ifadə olunur [3]. Elm dünyasında trafik simulyasiyası abstraksiya dərəcəsinə (insanat bənzəmə böyüklüyünə) görə üç makro-kateqoriyaya bölünür [1, 7]:

### 1.5.1 Makroskopik Modellər

Nəqliyyat axınına sanki borudan axan maye (hidro-dinamika qanunları) kütləsi kimi yanaşır. Hər bir avtomobil, onun sürücüsünün manevri, markası, yaşı və sürətlənmə anı nəzərə alınmır. Yol daha çox ümumi intensivlik ($q$ - saniyədən keçən maşın sayı), sıxlıq ($k$ - kilometrə düşən maşın kütləsi) və məkan-orta sürəti ($v$) meyarları üzrə böyük şəbəkə miqyasında ölşülür. Lighthill-Whitham-Richards (LWR modeli) adlanan 1950-ci illərin elmi əsası bu sahənin konstitusiyası hesab edilir. Bu qanun sırf kütlənin saxlanması (Conservation of Mass) nəzəriyyəsidir:
$$\frac{\partial k}{\partial t} + \frac{\partial q(k,x,t)}{\partial x} = 0$$

Burada, yolun hər hansı elementindən gələn maşın mütləq şəkildə yoxa çıxa bilməz (təbii ki avropa ssenarisidir, tətbiqdə "source" və "sink" - giriş və çıxış nöqtələri təyin olunmalıdır). Lakin Makroskopik model kəsişmədə fərdin dayandığını ehtiva etmir deyə, dəqiq "Ağıllı Şəhər" təhlili aparmaq üçün demək olar ki praktik korluluq yaşadır [11].

### 1.5.2 Mezoskopik Modellər

Makroskopik modelin böyüklüyü ilə, mikroskopik modelin nöqtəvi dəqiqliyini balanslaşdırmağa çalışan model fəlsəfəsidir. Obyektlərə baxış fərdi yox, maşın "paketləri" (Platoon) yaxud "karvanları" formatındadır [4]. Məsələn, 5 maşınlıq bir kolonna bir hüceyrə sayılır və riyazi ehtimal hesablamaları yalnız bu "hüceyrə qrupuna" aid edilir. Mezoskopik modellər böyük fəza diapazonlarında logistik marşrutlandırma (Routing System) qərarlarının verilməsində çox sürətli çalışırlar. Ancaq bu sistem real Dashboard simulyasiyasına və ya oyuna (avtomobillərin konkret künclərdən dönmə animasiyasına) heç bir vizual zəmin yaratmır.

## 1.6 Mikroskopik Modellər: İntellektual Sürücü Modeli (IDM)

Dövrümüzün ən geniş istifadə olunan, mikroskopik yanaşmadır. Burada obyekt qrup şəklində yox, fərd səviyyəsində sistemin mərkəzində dayanır. Hər bir avtomobil (Agent) öz uzunluğuna (məsələn, yük maşını $15m$, yüngül maşın $4,5m$), mühərrik növünə, aqressivlik indeksinə malikdir. Bu fərdlər Newton mexanikasına uyğun olaraq məkan və zaman ($x(t), v(t)$) ölçülərində hərəkət edir. Şəhər tıxaclarını həll edəcək vizuallıq və qovşaq (svetofor) sıxlıqlarını hesablamaq yalnız bu modellə mümkündür. 

Lakin sistemdə yüzlərlə sərbəst agentin hərəkət etməsi "Virtual Toqquşmalara" gətirib çıxara bilər. Ona görə də cəmiyyətdə təhlükəsizlik əsaslı "Avtomobil-izləmə" (Car-Following) prinsipindən istifadə olunur. Elm dünyasında toqquşma ehtimalını riyazi olaraq "0"-a endirən, insan tormozlama hissini mükəmməl təsvir edən qanun **İntellektual Sürücü Modelidir (IDM - Intelligent Driver Model)** [2]. M. Treiber tərəfindən inkişaf etdirilən bu formul, sürücünün önündəki maneəyə görə saniyəbəsaniyə qərar verdiyi mənfi/müsbət təcili izah edir. 

Model aşağıdakı diferensial bərabərliyi ehtiva edir (Hər *n*-ci avtomaşına xas olan anlıq sürətlənmə tənliyi):
$$ \frac{dv_n}{dt} = a \left[ 1 - \left( \frac{v_n}{v_0} \right)^\delta - \left( \frac{s^*(v_n, \Delta v_n)}{s_n} \right)^2 \right] $$

Burada ən həyati hesablamanı "dinamik arzuolunan minimal təhlükəsizlik məsafəsi" ($s^*$) düsturu təşkil edir. O, önündəki $n-1$ nömrəli maşınla olan sürət fərqinə ($\Delta v_n / approaching rate$) əsasən sıxılmanı anından yaradır:
$$ s^*(v, \Delta v) = s_0 + v T + \frac{v \Delta v}{2\sqrt{ab}} $$

İzahlı şəkildə asılılıqların və kəmiyyətlərin parametrik (insani) analizi:
1.  **$v_0$ (Hədəf və ya arzuolunan sürət):** Əgər sürücünün qarşısı tamamilə açıqdırsa ($s_n \to \infty$) çatmaq istədiyi hədəf sürət həddi.
2.  **$T$ (Təhlükəsiz zaman buferi):** Qabaqdakı avtomobillə idarəolunan təhlükəsiz anlıq məsafə saniyəsi. Adi psixologiyada bu, reaksiyanın 1-1.5 saniyə gecikməsini kopiyalasın diyə daxil edilir. Yüksək sürətdə təhlükəsiz aralıq məsafəsi dinamik artır.
3.  **$s_0$ (Statik minimum qapalı məsafə):** Qırmızı işıqda və ya tam dayanan (Tıxac) avtomobillər arasında qorunan məcburi bamper məsafəsi (adətən 2.0 metr stuxnasiya zonası).
4.  **$a$ (Maksimal müsbət sürətlənmə):** Qaz pedalının sərt sıxılmasını göstərir. Tıxac bitdiyi an verilən reaksiya.
5.  **$b$ (Rahat yavaşlama - deceleration):** Əyləc pedalının sıxılmasındakı normal, qorxutmayan yavaşlama limiti. IDM yalnız son çarə kimi bu limiti keçir (toqquşmamaq üçün böyük ehtiratsızlıq olanda zəncirvari sınma baş verir).
6.  **$\delta$ (Sürətləndirmə üstlüyü əmsalı):** Adətən rəqəmi $\delta=4$ götürülür. Mənası odur ki, avtomobil arzulanan sürətin ($v_0$) yalnız tam 90%-nə çatdıqdan sonra yumşalmağa və axarına qovuşmağa ($v \approx v_0$) başlama ehtiyacı hiss edir. 

Eyni zamanda, bu sistem yalnız qaz/əyləcdən deyil, idarəetmədən (ruldan - Steer) əmələ alan dəyişimlər tələb etdiyi üçün, MOBİL adlandırılan fəza-zolaq dəyişmə modelindən də ayrılmaz hissə kimi yararlanır [9, 13].

## 1.7 Nəqliyyat Simulyasiyalarında Marşrutlandırma (Routing) Alqoritmləri

Rəqəmsal bir maşın yalnız avtomatik olaraq digərini izləmir (Car-Following), eyni zamanda şəhər xəritəsində qovşaqdan qovşağa hansı istiqamətlə gedəcəyini də öncədən və ya mütəmadi təyin etməlidir. Buna **Routing** (Marşrutlandırma) problemi deyilir. Qraf nəzəriyyəsində hər bir kəsişmə bir Nöqtə (Node / Vertex), küçələr isə Kənar (Edge) hesab olunur. Tıxacı modelləşdirmək üçün 2 fərqli qərar qəbul etmə alqoritmləri işə salınır:

**Dijkstra və A* (A-Star) Algoritmləri:** Klassik naviqasiyaların (köhnə pleyerlərin) ən qəddar metodlarıdır. Dijkstra, "A" nöqtəsindən "B"-yə olan ən qısa kənar-ağırlığını ($w(u,v)$) tapmaq üçün sistemdəki bütün yollarda potensial qiymət hesablayır. Çox vaxt və resurs çəkir. A* (A-star) isə Hevristika ($h(x)$) funksiyasından istifadə edərək yalnız və yalnız hədəf bünövrəyə (B) yaxınlaşan yollara baxır, yəni əks yolları hesablamadan kənara atır, buna görə minlərlə dəfə daha sürətlidir. 

**Dinamik (DOD - Dynamic Open Data) və Stoxastik Marşrutlandırma:** Rəqəmsal Əkiz olanda əliyalın A* (A-star) kifayət eləmir. Çünki, şəbəkə dinamikdir - küçə 5 dəqiqə əvvəl boş ola bilər, ancaq qəfləti qəza nəticəsində "ağırlıq əmsalı" sonsuzluğa doğru artar. Rəqəmsal simulyasiyalar *Yenidən qərarlama (Rerouting)* addımlarını tsikl ilə tətbiq edir ki, avtomobillər sıxlıq gördükdə ssenarinin ortasında sükanlarını digər prospektlərə qıvıra bilsinlər. Bu da simulyasiyada əsl xaos mexanikasını canlandırmağa səbəb olur.

## 1.8 Mövzu üzrə aparılmış əvvəlki tədqiqatlar və Simulyasiya Platformalarının analizi

Dunya miqyaslı bazalarda (Scopus) edilən qlobal tədqiqat icmalları nəqliyyat simulyatorları sahəsində mövcud proqramların necə nəhəng olduğunu, lakin eyni dərəcədə aydın "mənfəət boşluqları" verdiyini nümayiş edir [5, 19]. Kommersiya və tədqiqat sferasında mütləq üstünlüyə malik klassik alətlər əsasən aşağıdakılardır:

- **SUMO (Simulation of Urban MObility):** Almaniya Aerokosmik Mərkəzi (DLR) tərəfindən idarə olunan (2001-dən bəri) tam açıq mənbəli mühərrikdir. Böyük fəza, şəhər xəritələrini (OpenStreetMap) mükəmməl tanıyır. Pleyeri var, lakin o qədər ağır və C++ ssenari tipli komanda xətti (CLI) quruluşuna sahibdir ki, təsadüfi bir ziyarətçinin onu Veb kimi istifadə etməsi qeyri-mümkündür. Modifikasiya etmək üçün Python TraCI (Traffic Control Interface) paketindən istifadə olunur [16, 18]. Lakin bu bağlantı Socket arxitekturasında güclü ləngimələr və CPU (Local Server) yükü yaradır.

- **PTV VISSIM:** İqtisadi cəhətdən kommersiya lisenziyaları ilə məhdudlaşdırılan, çox səliqəli və "Windows-UI" xüsusiyyətinə malik, heyrətamiz hesablamalı mikroskopik həlldir. Akademik tədqiqatlarda ən etibarlı real göstərici verən tətbiqlərdəndir [11]. Lakin maliyyə tələbləri, böyük qurğular və lokal asılılıq səbəbindən "şəbəkə rəhbərinin qaput altında anında girib baxa bilməsi" anlayışına dəyər qatmır.

**Süni İntellektlə (AI) Tıxac Simulyasiyalarında "Yeni Qat"**
Son illərdə məsələ klassik fiziki düsturlardan daha da irəliyə gedib. Sayed et al. və Chen et al. kimi tədqiqatçıların 2023 və 2024-cü illərdə (AI hype-ı fonunda) etdiyi innovativ hesabatlar aydınlaşdırır ki, Simulyasiya Mühərriklərinin üstünə bir də "Neyron Şəbəkələri" (Neural Networks) Agentləri qoyulmalıdır [3, 5]. Yəni işıqfor fazasını artıq riyaziyyatın saniyə sayğacı deyil, Gücləndirməli Öyrənmə (Reinforcement Learning (RL) - məsələn Q-Learning) təyin edir. RL agenti minlərlə virtual toqquşma ehtimalını öz cərimə funksiyasına (Penalty) çevirərək elə bir yaşıl işıq dalğası açır ki, adi riyaziyyat ondan aciz qalır [6].

## 1.9 Veb-əsaslı (WebGIS) Mühitlərə olan Zəruri Ehtiyac (Problem Qoyuluşı)

Mövcud akademik irəliləyişlərə rəğmən cəmiyyətdə intellektual idarəetmə sistemlərinin kütləvi cəlb olunması yönündə əhəmiyyətli dərəcədə praktik pərvəzlənmə yerləri və tədqiqat boşluqları qalmaqdadır:

1.  **Masaüstü (Desktop) Qəfəsi və Miqyaslanma Darboğazı:** Yuxarıdakı fəsillərdən məlum olduğu üzrə, cəmiyyətin istifadə etdiyi alətlərin böyük mütləqiyyəti cihaz asılılıqlı (OS-Native) lokal proqramlardır. İdarəçi qovşağı izləmək üçün "Exe" icrası ilə VISSIM/SUMO platformasını notbukunda açmalı, dəqiqələrlə hesablama aparmalıdır [30]. Xəritədəki agent sayı on minlərlə olduqda (Bakı kimi meqapolislərin qaçılmaz ehtiyacları olan böyük məlumat bazası) FPS (saniyədə vizual kadr sayı) çökür və istifadəçi ekranı tam donur.
2.  **Dashboard İnsan/Texnika Uçurumu:** Dövlət nümayəndələrinə, mer idarələrinə vacib olan şey "TraCI C++ klasslaşdırması" və ya XML faylları kodlamaq deyil. Onlara zəruri olan tək tablodur: *Dashboard*. Dünyanın hər yerindən smartfon və ya adi ofis kompüteri vasitəsi ilə daxil olunacaq Brauzer daxilində (Chrome/Safari) tam anlaşıqlı rəngli xəritə, "Svetoforlara Toxun və İdarə et" modulları və real-zamanlı simulyasiya görüntüsü. Buna WebGIS təkəliyi deyilir.

**WebSocket və WebGL Cavabı:** Bu tədqiqat boşluğunu ləğv etmək məqsədi daşıyan Rəqəmsal Əkiz layihəmiz, Backend mühərrikində (buludda) olan bütün böyük fiziki tənliklərin nəticəsini Veb Brauzerə fasiləsiz gətirmək üçün Event-Driven (Hadisə İdarəli) WebSocket kanallarından istifadə edir. Veb mühitində, Brauzer daxilində şəkil (Kadr) xəritəsini isə HTML5 Canvas-ı deyil, birbaşa Qrafik Kartdan (GPU) faydalanan WebGL (2D/3D interfeys) və React arxitekturası təşkil edəcək [25, 26, 30]. Bu, müasir elmdə heç bir ağır masaüstü avadanlıq olmadan minlərlə avtomobili Brauzerdə hamar uçurda bilən mükəmməl asanlıq və inqilab hesab olunur.

## 1.10 Dünya Təcrübəsindən Rəqəmsal Əkiz Nümunələri (Case Studies)

Təsadüfi deyil ki, Web və Rəqəmsal Əkiz inteqrasiyası dövlətlərin ən böyük gələcək vizyonlarıdır [24, 28]. Dünya miqyasında "Veb Dashboard" əsaslı Şəhər izləmələrinə ən fundamental iki nümunə mövcuddur:
*   **Virtual Sinqapur (Virtual Singapore):** Dassault Systèmes tərəfindən proqramlaşdırılıb dövlətə verilmiş layihə. Şəhərin təkcə həndəsi quruluşunu deyil, real vizual nəqliyyat qovşaqlarını özündə əks etdirərək dövlət memarlarına və Nəqliyyat İdarəsinə Web mühitindən daxil olmağa fürsət tanıyır. Təsadüfi hava şəraiti, kütləvi izdiham hadisələri zamanı avtomobil böhranını idarə edir.
*   **London "Tıxac Bölgəsi" (Congestion Charge Zone):** Londondakı kameraların böyük Məlumat Mərkəzləri ilə fasiləsiz kommunikasiyası, şəhərin fərqli bölgələrinə rəqəmsal ödəniş zonaları ayırmış və simulyator hesabına "haraya nizamlanmış nəzarət qoyulacaq" qərarlarını sadə planlama monitorundan təmin edir. Bütün rəhbərlər Web ekranla anbaan şəhərə axan stoxastik naxışları (Pattern) incələyə bilirlər.

## 1.11 Fəsil üzrə Nəticə

Yekun olaraq vurğulamaq lazımdır ki, şəhər tıxacları probleminin iqtisadi, psixoloji və ekoloji divarlarını yıxacaq ən ideal və rasional həll yolu Rəqəmsal Əkiz anlayışından bəhrələnən "Ağıllı Şəhər / İNS" modelidir. Xronoloji ədəbiyyat icmalı onu bir daha riyazi olaraq təsdiqləyir ki, hesablamalarda fərdlərin hərəkət qaydaları - İntellektual Sürücü Modeli (IDM) fizikanın ən doğru yanaşmasıdır. Lakin mövcud proqram paketlərinin hamısı universitet tədqiqatlarına və ağır mühəndis laboratoriyalarına daxili kod kimi bağlanmışdır. İnformasiya əsrinin əsl rəqabəti - Rəqəmsal Əkizlərin bulud vasitəsilə Backend serverə atılması, hər hansı bir sənəd yükləməsi və ya 3D oyun resursu qurulması tələb etmədən xəritə interfeysini dərhal adi istifadəçi və dövlət rəhbərləri üçün "Veb Dashboard/Frontend" formatında canlandırmasıdır. Mövcud tədqiqat layihəsinin əsas mühəndis hədəfi məhz sadalanan əskiklikləri Rəqəmsal asanlıqla (Python-React konfiqurasiyası ilə) örtərək praktik obyekti mühərrik səviyyəsində işləyib hazırlamağa zəmin yaradır.

## İSTİFADƏ EDİLMİŞ ƏDƏBİYYAT SİYAHISI

## 1. Nəqliyyat Axınlarının Nəzəriyyəsi və Modelləşdirilməsi (Mikroskopik, Makroskopik, Mezoskopik)
1. Treiber, M., & Kesting, A. (2013). *Traffic Flow Dynamics: Data, Models and Simulation*. Springer. [Google Scholar](https://scholar.google.com/scholar?q=%2ATraffic%20Flow%20Dynamics%3A%20Data%2C%20Models%20and%20Simulation%2A)
2. Shang, Wen-Long et al. (2023). Estimation of traffic energy consumption based on macro-micro modelling with sparse data from Connected and Automated Vehicles. *Applied Energy*. [Link](https://doi.org/10.1016/j.apenergy.2023.121916)
3. Sayed, Sayed A. et al. (2023). Artificial intelligence-based traffic flow prediction: a comprehensive review. *Journal of Electrical Systems and Information Technology*. [Link](https://link.springer.com/article/10.1186/s43067-023-00081-6)
4. Souza, Felipe de et al. (2019). Mesoscopic Traffic Flow Model for Agent-Based Simulation. *Procedia Computer Science*. [Link](https://doi.org/10.1016/j.procs.2019.04.118)
5. Chen, Di et al. (2024). Data-Driven Traffic Simulation: A Comprehensive Review. *IEEE Transactions on Intelligent Vehicles*. [Link](https://doi.org/10.1109/TIV.2024.3367919)
6. Yao, Z. et al. (2022). CTM-based traffic signal optimization of mixed traffic flow with connected automated vehicles and human-driven vehicles. *Physica A: Statistical Mechanics and its Applications*. [Link](https://doi.org/10.1016/j.physa.2022.127708)
7. Al-Jameel, H. A. E. (2014). Microscopic and Macroscopic Traffic Flow Models. *Journal of Engineering and Applied Sciences*. [Link](https://www.academia.edu/download/82193169/jeas_1014_1254.pdf)

## 2. İntellektual Sürücü Modeli (Intelligent Driver Model - IDM) və Python Tətbiqləri
8. Treiber, Martin et al. (2000). Congested traffic states in empirical observations and microscopic simulations. *Physical Review E*. [Link](https://doi.org/10.1103/PhysRevE.62.1805)
9. Kesting, A., Treiber, M. (2013). Traffic Flow Dynamics: Data, Models and Simulation. *JRC Publications*. [Link](https://dx.doi.org/10.2788/7975)
10. Author, A. (2014). Traffic Flow Analysis. *IJRET*. [Link](https://www.academia.edu/download/73634076/ijret.2014.pdf)
11. Algherbal, Eman A., Ratrout, Nedal T. (2025). A Comparative Analysis of Currently Used Microscopic, Macroscopic, and Mesoscopic Traffic Simulation Software. *Transportation Research Procedia*. [Link](https://doi.org/10.1016/j.trpro.2025.03.101)
12. Liebner, Martin et al. (2012). Driver intent inference at urban intersections using the intelligent driver model. *2012 IEEE Intelligent Vehicles Symposium*. [Link](https://doi.org/10.1109/IVS.2012.6232131)
13. Liu, Pengfei, Fan, Wei (David) (2020). Exploring the impact of connected and autonomous vehicles on freeway capacity using a revised Intelligent Driver Model. *Transportation Planning and Technology*. [Link](https://doi.org/10.1080/03081060.2020.1735746)

## 3. Yol Şəbəkələrinin Çıxarılması və Simulyasiya Proqramları (OSM, SUMO)
14. Lopez, Pablo Alvarez et al. (2018). Microscopic Traffic Simulation using SUMO. *2018 21st International Conference on Intelligent Transportation Systems (ITSC)*. [Link](https://doi.org/10.1109/ITSC.2018.8569938)
15. Haklay, M., Weber, P. (2008). OpenStreetMap: User-Generated Street Maps. *IEEE Pervasive Computing*. [Link](https://doi.org/10.1109/MPRV.2008.80)
16. Behrisch, M. et al. (2011). SUMO - Simulation of Urban MObility: An Overview. *DLR*. [Link](https://elib.dlr.de/71460/)
17. Boeing, Geoff (2017). OSMnx: New methods for acquiring, constructing, analyzing, and visualizing complex street networks. *Computers, Environment and Urban Systems*. [Link](https://doi.org/10.1016/j.compenvurbsys.2017.05.004)
18. Wegener, Axel et al. (2008). TraCI. *Proceedings of the 11th communications and networking simulation symposium*. [Link](https://doi.org/10.1145/1400713.1400740)
19. Mahmud, S.M. Sohel et al. (2019). Micro-simulation modelling for traffic safety: A review and potential application to heterogeneous traffic environment. *IATSS Research*. [Link](https://doi.org/10.1016/j.iatssr.2018.07.002)
20. Macioszek, Elżbieta (2018). First and Last Mile Delivery – Problems and Issues. *Advances in Intelligent Systems and Computing*. [Link](https://link.springer.com/chapter/10.1007/978-3-319-62316-0_12)

## 4. Veb-Əsaslı Simulyasiya, Rəqəmsal Əkizlər (Digital Twin) və Vizualizasiya
21. Batty, Michael (2018). Digital twins. *Environment and Planning B: Urban Analytics and City Science*. [Link](https://doi.org/10.1177/2399808318796416)
22. Tao, Fei et al. (2019). Digital Twin in Industry: State-of-the-Art. *IEEE Transactions on Industrial Informatics*. [Link](https://doi.org/10.1109/TII.2018.2873186)
23. Grieves, Michael, Vickers, John (2017). Digital Twin: Mitigating Unpredictable, Undesirable Emergent Behavior in Complex Systems. *Transdisciplinary Perspectives on Complex Systems*. [Link](https://link.springer.com/chapter/10.1007/978-3-319-38756-7_4)
24. Dembski, Fabian et al. (2020). Urban Digital Twins for Smart Cities and Citizens: The Case Study of Herrenberg, Germany. *Sustainability*. [Link](https://doi.org/10.3390/su12062307)
25. Yu, Qing et al. (2023). Web-based spatio-temporal data visualization technology for urban digital twin. *Handbook of Mobility Data Mining*. [Link](https://doi.org/10.1016/B978-0-443-18428-4.00002-5)
26. Krämer, Michel, Gutbell, Ralf (2015). A case study on 3D geospatial applications in the web using state-of-the-art WebGL frameworks. *Proceedings of the 20th International Conference on 3D Web Technology*. [Link](https://doi.org/10.1145/2775292.2775303)
27. Tucker, C. S. et al. (2017). Special Issue: Data-Driven Design (D3). *Journal of Mechanical Design*. [Link](https://doi.org/10.1115/1.4037943)
28. White, Gary et al. (2021). A digital twin smart city for citizen feedback. *Cities*. [Link](https://doi.org/10.1016/j.cities.2020.103064)
29. Agostinelli, Sofia et al. (2021). Cyber-Physical Systems Improving Building Energy Management: Digital Twin and Artificial Intelligence. *Energies*. [Link](https://doi.org/10.3390/en14082338)
30. Xu, Haowen et al. (2022). Interactive Web Application for Traffic Simulation Data Management and Visualization. *Transportation Research Record: Journal of the Transportation Research Board*. [Link](https://doi.org/10.1177/03611981211035760)

## 5. Cəmiyyət, İqtisadiyyat, Ağıllı Şəhər (Smart City) və Digər Aspektlər (Bakı nümunəsi üçün istinad edilə bilər)
31. Kitchin, Rob (2014). The real-time city? Big data and smart urbanism. *GeoJournal*. [Link](https://link.springer.com/article/10.1007/S10708-013-9516-8)
32. Allam, Zaheer, Jones, David S. (2021). Future (post-COVID) digital, smart and sustainable cities in the wake of 6G: Digital twins, immersive realities and new urban economies. *Land Use Policy*. [Link](https://doi.org/10.1016/j.landusepol.2020.105201)
33. Neirotti, Paolo et al. (2014). Current trends in Smart City initiatives: Some stylised facts. *Cities*. [Link](https://doi.org/10.1016/j.cities.2013.12.010)
34. Aliyev, E. R., Ahmadov, I. M., Almasov, A. S., Ahmadov, E. A. (2023). Integrated approach to the development of the transport system in the urban agglomeration of Baku using digital technologies. *Problems of Information Society*. [Link](http://doi.org/10.25045/jpis.v14.i2.04)
35. Babayev, N., Bəxtiyarova, N. (2024). Kiçik şəhərin küçə - yol şəbəkəsində intellektual nəqliyyat sisteminin tətbiqi perspektivlərinin müəyyən edilməsi. *AzTU Library Repository*. [Link](http://openaccess.aztu.edu.az/xmlui/handle/123456789/463)
