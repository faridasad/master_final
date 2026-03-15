# FƏSİL I. ƏDƏBİYYAT İCMALI (NƏZƏRİ ƏSASLAR)

XXI əsrin əvvəllərindən etibarən qlobal miqyasda müşahidə olunan ən mühüm demoqrafik proseslərdən biri intensiv urbanizasiyadır. İnsanların iqtisadi və sosial ehtiyaclarını daha effektiv təmin etmək məqsədilə iri şəhər mərkəzlərinə cəmləşməsi şəhər infrastrukturunun dəfələrlə böyüməsinə səbəb olmuşdur. Lakin bu müsbət dinamika nəqliyyat sistemlərində misli görünməmiş gərginliklər və böhranlar (tıxaclar) yaratmışdır. Aşağılıdakı bölmələrdə bu problemin nəzəri əsasları, əvvəlki tədqiqatlar və mövcud platformaların (simulyatorların) vəziyyəti təhlil edilir.

## 1.1 Mövzunun nəzəri əsasları

Qlobal və lokal nəqliyyat tıxacları probleminin ənənəvi həlli yolu kimi yeni yolların çəkilməsi, çoxmərtəbəli yol qovşaqlarının inşası təklif edilsə də, əslində bu cür yanaşmalar cəmiyyətdə "induksiyalanmış tələb" (induced demand) prinsipi ilə nəticələnir və bir müddət sonra yenidən daha sıx tıxacların yaranmasına gətirib çıxarır [34, 35]. Buna görə də, müasir dövrdə nəqliyyat problemlərinin əsas, davamlı və yeganə həlli yolu infrastrukturun rəqəmsallaşdırılmasından və ağıllı idarəetmədən keçir.

**Ağıllı Şəhər (Smart City) və İntellektual Nəqliyyat Sistemləri (İNS)**
"Ağıllı Şəhər" konsepsiyası şəhər infrastrukturunun idarə edilməsini İnformasiya və Kommunikasiya Texnologiyaları (İKT) və Əşyalar İnterneti (IoT) şəbəkəsi vasitəsilə optimallaşdırır [31, 33]. Smart City-nin ən mühüm qanadlarından biri İNS-dir; bu sistemlər daxil olan mürəkkəb (Big Data) sensor məlumatlarını emal edir və nəqliyyat iştirakçılarını yönləndirir [32]. 

**Rəqəmsal Əkiz (Digital Twin) və "Edge-Cloud Continuum"**
Müasir nəqliyyat innovasiyalarının əsas paradiqması isə "Rəqəmsal Əkiz" (Digital Twin) yanaşmasıdır. Rəqəmsal Əkiz, mövcud qəliz bir şəhər şəbəkəsinin və oradakı hərəkət edən avtomobillərin dəqiq riyazi prinsiplərə tabe olan interaktiv, virtual kopyasının (simulyasiyasının) yaradılmasıdır [21, 23, 24]. İnkişaf etmiş arxitekturalarda lokal cihazların (Edge) və güclü mərkəzi serverlərin (Cloud) birgə hesablamalarını təmin edən "Edge-Cloud Continuum" məntiqi Rəqəmsal Əkiz konsepsiyasına misilsiz miqyaslanma imkanı verir. Bu xüsusiyyət sayəsində, İcra Hakimiyyətləri böyük investisiyalar daxil etmədən əvvəl (məsələn yeni bir svetoforun qoyulması və ya təkistiqamətli yol rejimi), ehtimal ssenarilərini virtual olaraq Rəqəmsal Əkiz üzərində tam təhlükəsizliklə test edə bilərlər [29, 30].

**Modelləşdirmənin Növləri: Makroskopik, Mezoskopik, Mikroskopik**
Nəqliyyat simulyasiyaları öz təbiətinə görə asimptotik funksiyalarla, differensial tənliklərlə idarə olunur və üç sub-kateqoriyaya ayrılır [7]:
- *Makroskopik modellər:* Nəqliyyat axınına sanki hidro-dinamika qanunlarına (maye və qaz kütləsi) tabe olan sadə bir vahid kimi yanaşır; detallar qeyzə alınmır [1, 14].
- *Mezoskopik modellər:* Avtomobilləri fərdi şəkildə deyil, spesifik "paketlər" şəklində stoxastik olaraq idarə edir [4, 11].
- *Mikroskopik modellər:* Bu tədqiqat işinin də əsasını təşkil etdiyi kimi, fərdi səviyyədə avtomobil-izləmə (Car-Following) prinsipini izləyir. Cəmiyyətdə ən qəbulolunan mikroskopik tənlik İntellektual Sürücü Modelidir (IDM - Intelligent Driver Model) [8]. IDM asimptotik riyazi yanaşma ilə hər saniyə təhlükəsizlik tənliyini icra edir və heç vaxt virtual toqquşmaya izin vermir [12, 13].

## 1.2 Mövzu üzrə aparılmış əvvəlki tədqiqatlar

Müasir elmi bazalar olan Scopus, Web of Science kimi qlobal repozitoriyalarda aparılan geniş axtarışlar və indekslənmiş məqalələr göstərir ki, şəhər hərəkətliliyinin (Urban Mobility) simulyasiyası istiqamətində zəngin beynəlxalq təcrübələr və platformalar mövcuddur.

Alimlərin bir qismi sırf açıq-mənbəli və ya kommersiya xarakterli nəqliyyat mühərriklərinin kəmiyyət və keyfiyyət müqayisələrini (performance benchmark) təhlil etmişlər. Tədqiqatlarda ən çox müzakirə olunan simulyatorlar aşağıdakılardır [16, 25]:
- **SUMO (Simulation of Urban MObility):** Almaniya Aerokosmik Mərkəzi (DLR) tərəfindən idarə olunan ən populyar açıq mənbəli mühərrikdir [14, 16]. SUMO-nun OpenStreetMap konvertasiyası rahat olsa da, qeyri-texniki rəhbərlər üçün tamamilə anlaşılmaz CLI (Command Line Interface) mühitinə sahibdir.
- **PTV VISSIM:** İqtisadi cəhətdən kommersiya lisenziyaları ilə məhdudlaşdırılan lakin güclü məkan və 3D arxitektura vizuallığı təklif edən qapalı kommersiya mühərrikidir. Akademik tədqiqatlarda dəyəri böyük olsa da büdcə baxımından istifadəsi zəifdir.
- **CityFlow və Aimsun:** Digər paralel yanaşmalardır. CityFlow daha çox RL (Reinforcement Learning) tətbiqləri üçün uyğunlaşdırılmış mikro-simulyatordur.

Digər vacib tədqiqat sektoru **Süni İntellektin (AI) və Maşın Öyrənməsinin (ML)** nəqliyyata daxil edilməsidir. 2023-2024-cü illərdə (məsələn, Chen et al. və Sayed et al.) aparılan intensiv elmi araşdırmalar göstərir ki, rəqəmsal əkiz məlumatlarını (qovşaq sıxlıqlarını, kameralardan toplanan tıxac datalarını) Qıvrımlı Neyron Şəbəkələri (CNN) və Qapalı Təkrarlanan Vahidlər (GRU) kimi Dərin Öyrənmə (Deep Learning) alqoritmlərinə yükləməklə adaptiv svetofor idarəetmələrində yüksək dəqiqlik əldə etmək mümkündür. Süni intellekt rəqəmsal əkizi yalnız izləyici olmaqdan çıxarır və proaktiv qərarlar verən adaptiv arxitekturaya (Predictive Analytics) çevirir. 

## 1.3 Mövcud problemlər və tədqiqat boşluqları

Mövcud akademik təkmilləşdirmələrə və həm açıq mənbəli, həm də kommersial mühərriklərin uğurlarına rəğmən, nəqliyyat idarəçiləri arasında sistemlərin sürətli və asan tətbiqi sahəsində əhəmiyyətli problemlər yaşanır.

1. **Masaüstü (Desktop) Asılılığı və Miqyaslanma Problemi:** SUMO, VISSIM kimi sənaye standartlarında mövcud qrafik alətlər və daxili simulyasiyalar bütünlüklə lokal kompüter resurslarına (CPU, GPU) əsaslanır. Ağır modelləşdirmələr tədqiqatçıları xüsusi quraşdırılmış güclü laboratoriya maşınlarına bağlı saxlayır [26, 30]. Bu sistemlər mürəkkəb XML konfiqurasiyaları tələb edir və şəbəkə şəhər rəhbərləri, yol polisləri kimi təcili proaktiv qərar verməli olan peşəkarlar tərəfindən dərhal mənimsənilə bilmir [30]. 

2. **Veb-Əsaslı İnterfeyslərə (Dashboard) Olan Elmi Ehtiyac:** Tədqiqat boşluğu məhz bu amildə yatır; sənaye və dövlət planlayıcılarına uzaqdan qoşulmaq, dərhal işə salmaq və xüsusi kodlama və ya yükləmə etmədən sadəcə Veb-URL (brauzer) vasitəsilə 3D WebGIS formatında izləmə, svetofora müdaxilə və "Dashboard" statistikasını çıxarma şansı verən sistemlər kifayət qədər məhduddur [25]. Sistemlərin ağır mexanizmlərini Backend (Cloud) bölməsinə ataraq yüngülləşdirilmiş Frontend (Web Dashboard) üzərindən canlı hərəkət izlənməsi və simulyasiya yaradılması son illərin "Ağıllı Şəhər" konsepsiyası üçün ən ciddi çağırışlardandır [26, 27].

Təqdim edilən bu elmi tədqiqat və qurduğumuz praktiki layihə, mövcud araşdırmalardakı göstərilmiş "Veb asılılığı / Uzaqdan idarə olunan asan Dashboard interfeysi" boşluğunu qismən örtmək məqsədi ilə irəli sürülür.

## 1.4 Fəsil üzrə nəticə

Yekun olaraq qeyd etmək lazımdır ki, şəhər tıxacları probleminin ən effektiv və optimal əlacı Rəqəmsal Əkiz anlayışından bəhrələnən "Ağıllı Şəhər" həlləridir. Ədəbiyyat icmalı və mövcud texnologiyaların müqayisəli analizi onu göstərir ki, elmdə mikroskopik hərəkət qaydaları (IDM) tam formalaşsa və süni intellekt rüşeymləri cücərsə də, nəqliyyat modellərinin gündəlik "bulud və brauzer" istifadəsinə – hər yerdən asan inteqrasiya imkanlarına hələ də kəskin tələbat var. Bu ehtiyac, dissertasiyanın növbəti fəslinin əsasını yəni Python arxa-planında hesablanan və Veb-Frontend mühitinə vizual şəkildə çıxarılan yeni, fərdi rəqəmsal simulyasiya arxitekturasının layihələndirilməsini əsaslandırır.
