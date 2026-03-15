# Magistr Dissertasiyasının Yazılması və Tədqiqat Planı 

Bu sənəd Azərbaycan Texniki Universitetinin (AzTU) magistrlik dissertasiyası üçün təqdim edilən metodiki göstərişlər, verilmiş real dissertasiya nümunəsi və ilkin mövzu strukturu əsasında xüsusi olaraq formalaşdırılmışdır.

## 1. Ümumi Tələblər və Formatlama
- **Həcm:** Minimum 35, maksimum 75 səhifə (əlavələrlə birlikdə).
- **Şrift və Ölçü:** Times New Roman, 14 pt. 
- **Sətirarası məsafə:** 1.5 interval.
- **Kənarlar:** Sol – 30 mm, Sağ – 10 mm, Yuxarı və Aşağı – 20 mm.
- **İstinad və Ədəbiyyat:** APA 7 standartlarına uyğun olaraq (Zotero və ya Mendeley istifadəsi tövsiyə olunur). Ən azı 30-35 adda mənbə (son 3-5 ilin ədəbiyyatına üstünlük verilməklə).

## 2. Dissertasiyanın Qeydiyyat və İdeya Binası
- **Mövzu:** Şəhər nəqliyyat sistemlərində hərəkət axınlarının kompüterli modelləşdirilməsi və veb-əsaslı simulyasiya mühitinin işlənməsi (Bakı şəhəri nümunəsində).
- **Tədqiqatın Obyekti:** Bakı şəhərinin nəqliyyat sistemi və bu sistemdə müşahidə olunan hərəkət axınları.
- **Tədqiqatın Predmeti:** Nəqliyyat axınlarının kompüter mühitində (Python vasitəsilə) modelləşdirilməsi və onların veb-əsaslı (JavaScript/Frontend) interaktiv simulyasiya platformasında realizasiyası.
- **Məqsəd:** Nəqliyyat axınlarını modelləşdirmək və veb-əsaslı "rəqəmsal əkiz" (dashboard) yaradaraq idarəetmə ssenarilərini (məs. işıqfor optimizasiyası) sınaqdan keçirmək.

## 3. Dissertasiyanın İdeal Strukturu

Aşağıdakı struktur tam olaraq AzTU metodiki göstərişlərinə və nümunə dissertasiyaya uyğunlaşdırılmışdır:

### Titul hissəsi
1. **Titul vərəqi** (Standart formada).
2. **Tapşırıq** və **Magistrantın andı**.
3. **Mündəricat**.
4. **İxtisarların siyahısı** (Gərəkdirsə).

### GİRİŞ
Giriş hissəsində mütləq olaraq alt-başlıqlarla aşağıdakılar öz əksini tapmalıdır:
- Mövzunun aktuallığı
- Tədqiqatın məqsədi və vəzifələri
- Tədqiqatın predmeti və obyekti
- Tədqiqat metodları (empirik, nəzəri, modelləşdirmə)
- Tədqiqatın elmi yeniliyi
- Praktiki əhəmiyyət və həllər
- Müdafiəyə təqdim edilən nəticələr (vəzifələr)
- Nəticələrin aprobasiyası (əgər hər hansı konfransda və ya elmi jurnalda çap olunacaqsa).

### FƏSİL I. ƏDƏBİYYAT İCMALI (NƏZƏRİ ƏSASLAR)
*Bu fəsildə əsasən ədəbiyyat icmalı və dünya təcrübəsi təhlil olunur.*
**1.1. Mövzunun nəzəri əsasları:** Nəqliyyat tıxacları, "Ağıllı Şəhər" (Smart City), "Rəqəmsal Əkiz" (Digital Twin), "Edge-Cloud Continuum" və makro/mezoskoçik/mikroskopik modelləşdirmə qavramları.
**1.2. Mövzu üzrə aparılmış əvvəlki tədqiqatlar:** Mövcud simulyasiya proqramlarının analizi (SUMO, VISSIM, CityFlow), AI intellekt modellərinin tətbiqi və elmi bazaların (Scopus, Web of Science) göstəriciləri əsasında yanaşmalar.
**1.3. Mövcud problemlər və tədqiqat boşluqları:** Masaüstü lokal mühitlərin limitləri, idarəetmədə çevikliyin olmaması və bulud/veb-əsaslı interaktiv sistemlərə (Dashboard) olan ehtiyacın qiymətləndirilməsi.
**1.4. Fəsil üzrə nəticə:** İcmalın qısa xülasəsi və arxitektura fəslinə keçid.

### FƏSİL II. SİSTEM ARXİTEKTURASI VƏ MODELLƏŞDİRİLMƏ ALQORİTMLƏRİNİN İŞLƏNMƏSİ (Elmi-Nəzəri və Eksperimental hissə)
*Bu fəsil birbaşa arxitekturanın və backend/simulyasiya məntiqinin qurulmasını əhatə edir.*
**2.1.** Bakı şəhəri yol infrastrukturunun analizi və xəritə-data (OpenStreetMap - OSM) bazasının çıxarılması.
**2.2.** Nəqliyyat axınlarının simulyasiya modelinin (məs: Intelligent Driver Model - IDM) seçilməsi və Python-da alqoritmləşdirilməsi.
**2.3.** İşıqfor idarəetmə məntiqinin və avtomobillərin kəsişmələrdə davranış qaydalarının riyazi əsasları.
**2.4.** Backend arxitekturası: Python simulyasiyasının API vasitəsilə veb platformaya məlumat ötürmə mexanizmləri.

### FƏSİL III. VEB-ƏSASLI SİMULYASİYA MÜHİTİNİN (RƏQƏMSAL ƏKİZİN) QURULMASI VƏ PRAKTİKİ TƏTBİQİ (Tətbiqi hissə)
*Bu fəsil frontend interfeysinin yazılması və proqramın test edilməsinə həsr olunur. Nümunədə olduğu kimi proqram kodlarından və interfeys şəkillərindən istifadə olunmalıdır.*
**3.1.** Veb interfeysin dizaynı qaydaları və istifadə olunan texnologiyalar (məs: React.js/Next.js).
**3.2.** Brauzer daxilində xəritə vizuallaşdırması (D3.js və ya WebGL/Mapbox) və real-time animasiyanın təşkili.
**3.3.** Bakı şəhərinin konkret bir seqmenti (məs. Tbilisi prospekti və ya kəsişmə) üzərində simulyatorun tətbiqi və test ssenariləri (Məsələn: pik saatı, yaşıl dalğa tətbiqi).
**3.4.** Əldə olunan nəticələrin qrafik analizləri və performansın dəyərləndirilməsi.

### NƏTİCƏ
Bütün tədqiqat zamanı əldə edilən uğurlar, yığılan sistemin üstünlükləri və gələcəkdə "Smart City" konsepsiyası üçün verə biləcəyi faydalara dair yekun, konkret fikirlər.

### İSTİFADƏ EDİLMİŞ ƏDƏBİYYAT SİYAHISI
Minimum 35 ədəd azərbaycan, ingilis və rus dillərində mənbələr.

### ƏLAVƏLƏR
Yazılan proqramın bəzi ağır kod blokları, konfiqurasiya faylları (məs: docker file, və s.) və ya böyük cədvəllər.

## 4. Referat
Dissertasiya yekunlaşdıqdan sonra 4 səhifə (A5 formatında) həcmində mövzunun tam xülasəsini əks etdirən referat hazırlanacaq.

---
## Təklif olunan Sonrakı Addım:
1. Əgər siz bu strukturu təsdiqləyirsinizsə, işə birbaşa **Giriş (Mövzunun aktuallığı və hədəflər)** bölməsini yazmaqla başlaya bilərik. 
2. Yaxud, birinci növbədə sistemin **texniki kodlaşdırma / proqramlaşdırma** (Backend və Frontend şablonlarının çıxarılması, layihənin kod arxitekturasının yaradılması) hissəsini qurub işlək vəziyyətə gətirmək istəyirsinizsə, biz kod yazmağa da başlaya bilərik. Məsləhətdir ki, kod və mətn paralel olaraq aparılsın.
