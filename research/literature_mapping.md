# Ədəbiyyatların Dissertasiya Fəsilləri Üzrə Tətbiq Planı (Mapping)

Universitetin tələbinə əsasən, toplanmış mənbələrin hansı mövzular və fəsillər üçün istifadə olunacağını qabaqcadan müəyyənləşdirmək çox faydalı və peşəkar bir yanaşmadır. Aşağıda 35 mənbənin dissertasiyamızın planına (Bax: `dissertation_plan.md`) necə paylandığı göstərilmişdir:

## GİRİŞ hissəsi üçün istifadə olunacaq mənbələr
*Bölmənin məqsədi:* Mövzunun aktuallığını (Ağıllı şəhərlər, rəqəmsal əkizlər və Bakı şəhərinin problemi) əsaslandırmaq.
- **[31] Kitchin (2014); [32] Allam & Jones (2021); [33] Neirotti et al. (2022)** - Ağıllı şəhərlərdə böyük verilənlərin və rəqəmsal əkizlərin aktuallığını vurğulamaq üçün.
- **[34] Mammadov & Huseynov (2023); [35] Quliyev & Əlizadə (2021)** - Problem hissəsində, Bakı şəhərinin nəqliyyat tıxacları problemini və simulyasiyaya olan ehtiyacı rəsmiləşdirmək üçün.

## FƏSİL I: ŞƏHƏR NƏQLİYYAT SİSTEMLƏRİ VƏ MODELLƏŞDİRİLMƏNİN NƏZƏRİ ƏSASLARI
*Bölmənin məqsədi:* Nəqliyyat axınlarının idarə edilməsi, makro və mikro modellərin fərqi barədə nəzəri (ədəbiyyat icmalı) məlumat vermək.
- **(Alt fəsil 1.1) Nəqliyyat tıxacları:** [24] Dembski et al. (2020)
- **(Alt fəsil 1.2) Makroskopik və Mikroskopik modellərin fərqi:**
  - **[1] Treiber & Kesting (2013)** - Kitab materialı, təməl nəzəriyyə üçün (Düsturlar və fiziki təməllər).
  - **[2] Gao et al. (2020); [3] Saidallah et al. (2020); [7] Li et al. (2020)** - Mikroskopik və makroskopik modellərin müqayisəsi və üstünlükləri barədə cədvəllər və təhlillər qurmaq üçün.
  - **[4] Chen et al. (2021); [5] Wang et al. (2023)** - Təkcə sadə yox, Data-Driven modellər haqqında qeydlər etmək üçün.
- **(Alt fəsil 1.3) Simulyasiya proqramlarının analizi:** 
  - **[14] Lopez et al. (2018); [16] Behrisch et al. (2020)** - Mövcud SUMO proqramının imkanları və çatmamazlıqları, eləcə də Veb-əsaslı interfeys ehtiyacının yaranması barədə məlumat.

## FƏSİL II: SİSTEM ARXİTEKTURASI VƏ MODELLƏŞDİRİLMƏ ALQORİTMLƏRİNİN İŞLƏNMƏSİ
*Bölmənin məqsədi:* Sistem üçün seçdiyimiz baza model (IDM) və xəritə-məlumat yığımı (OSM-Python) prosesinin konseptual olaraq izahı.
- **(Alt fəsil 2.1) Yol infrastrukturunun xəritə (OSM) datası:** 
  - **[15] Haklay & Weber (2008); [17] Boeing (2017)** - Bakı xəritəsini OSM (OpenStreetMap) üzərindən qraf (Graph) olaraq necə çıxaracağımızı izah etmək üçün.
- **(Alt fəsil 2.2 və 2.3) İntelektual Sürücü Modeli (IDM) quruluşu və hesablama riyaziyyatı:**
  - **[8] Treiber et al. (2000)** - IDM-in orijinal fiziki və riyazi model təməlini (tənlikləri) izah etmək üçün.
  - **[9] Ciuffo et al. (2021); [12] Zheng & Liu (2020); [13] Zhu et al. (2023)** - Modelin parametrlərinin (avtomobil arası məsafə, sürətlənmə) reallığa uyğun necə kalibrasiya olunduğunu izah etmək.
- **(Alt fəsil 2.4) Backend inteqrasiyası (Python-SUMO / Python Native):** 
  - **[10] Huang et al. (2022); [11] Sharma & Ghosh (2019)** - Python-da IDM modelinin simulyasiya kodunun qurulması qaydaları.
  - **[18] Wegener et al. (2021)** - Pytjon və backend ilə mühəndislik (TraCI protokolu vs) arxitekturasının qurulması.

## FƏSİL III: VEB-ƏSASLI SİMULYASİYA MÜHİTİNİN (RƏQƏMSAL ƏKİZİN) QURULMASI VƏ TƏTBİQİ
*Bölmənin məqsədi:* Python backend-dən gələn simulyasiyanın veb mühitində vizuallaşdırılması (Dashboard/UI) prosesinin izahı.
- **(Alt fəsil 3.1 və 3.2) Veb-əsaslı Rəqəmsal Əkiz konsepti və Vizuallaşdırma (D3.js, WebGL):**
  - **[21] Batty (2018); [22] Tao et al. (2019); [23] Grieves & Vickers (2021); [25] Marcu et al. (2022)** - Rəqəmsal Həmzad (Digital twin) anlayışının veb proqram təminatı ilə əlaqələndirilməsi forması.
  - **[26] Mardan et al. (2020); [27] Bostock et al. (2023); [30] Chen et al. (2024)** - Brauzer üzərində interaktiv simulyasiyanın göstərilməsi üçün istifadə olunacaq D3.js və ya WebGL texnologiyasının arxitekturasını əsaslandırmaq üçün.
- **(Alt fəsil 3.3 və 3.4) Bakı nümunəsinin nəticələri və təhlili:**
  - **[28] White et al. (2021); [29] Agostinelli et al. (2022)** - Gələcəkdə bu platformanın necə bir idarəetmə dəyəri qatacağını göstərmək üçün.

---
## Yekun: 
Bu "Mapping" (Tətbiq planı) universitetə rəhbərlik ilə görüşərkən təqdim edilməli olan ən vacib addımdır. Çünki rəhbər soruşacaq ki, "Siz bu mənbələri tapmısınız, bəs nəyə lazımdır?". Bu fayldakı bölgü vasitəsilə siz hər bir işlədəcəyiniz mövzunu ədəbiyyatı ilə sübut etmiş olursunuz.
