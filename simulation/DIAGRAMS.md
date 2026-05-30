# Dissertasiya Sxemləri və Qrafikləri

Bu sənəd simulyasiya layihəsi üçün hazırlanmış bütün diaqram və qrafiklərin master indeksidir. Hər biri prioritet sırası ilə düzülmüşdür.

## Strukturlaşdırma

- **Bölmə A** — Sistem arxitekturası (#01–#10)
- **Bölmə B** — Riyazi/Nəzəri əsaslar (#11–#13)
- **Bölmə C** — Empirik KPI nəticələri (#14–#20)
- **Bölmə D** — Green Wave və koridor analizi (#21)
- **Bölmə E** — Xəritə vizuallaşdırmaları (#22–#24)
- **Bölmə F** — Müqayisəli analiz (#25–#26)
- **Bölmə G** — Frontend DOM strukturu (#27–#31)

---

## A. Sistem Arxitekturası

### 01. Yüksək Səviyyəli Arxitektura

![Architecture](diagrams/01_architecture.png)

İstifadəçi, frontend (React/Leaflet/Recharts), backend (FastAPI), SimulationEngine və daxili modulların əlaqəsi. WebSocket vasitəsilə 10 Hz state broadcast, REST vasitəsilə idarəetmə.

### 02. Simulyasiya Tick Loop

![Tick Loop](diagrams/02_tick_loop.png)

`engine.step(dt)` daxilində bir 20 ms tick-də baş verən hadisələr: spawn → işıqforu addım → adaptive control → IDM yeniləmə → kəsişmə keçidi → KPI qeyd.

### 03. Məlumat Axını

![Data Flow](diagrams/03_data_flow.png)

Girişlər (xəritə, senari, əmrlər) → Emal (5 modul) → Nəticələr (WS state, REST KPI, UI).

### 04. Frontend ↔ Backend Sequence

![Sequence](diagrams/04_sequence.png)

İstifadəçi hərəkəti → REST → engine state dəyişikliyi → WebSocket broadcast → UI render.

### 05. Digital Twin Konsepti

![Digital Twin](diagrams/05_digital_twin.png)

Fiziki dünya ↔ Rəqəmsal model ↔ Qərar qəbulu dövrəsi. Dissertasiyanın giriş fəsli üçün.

### 06. UML Class Diagram

![Class Diagram](diagrams/06_class_diagram.png)

Əsas siniflər: `SimulationEngine`, `Vehicle`, `IntersectionTrafficLight`, 4 controller, `KPICollector` və onların kompozisiya/asılılıq əlaqələri.

### 07. İşıqforu State Diagram

![State Diagram](diagrams/07_state_traffic_light.png)

Fixed, Adaptive və FlashYellow rejimləri arasında keçidlər. Hər rejimdə Green → Yellow → Red dövrü.

### 08. Use Case Diagram

![Use Case](diagrams/08_use_case.png)

9 əsas istifadə halı: trafiki izlə, senari seç, adaptive/green wave yandır, KPI bax, müqayisə apar.

### 09. Deployment Diagram

![Deployment](diagrams/09_deployment.png)

Browser ↔ Node.js (Vite :5173) ↔ Python (Uvicorn/FastAPI :8000) ↔ Fayl sistemi (`baku_map.json`).

### 10. Adaptive Controller Flowchart

![Adaptive Flowchart](diagrams/10_adaptive_flowchart.png)

Hər 30 saniyədə bir növbə-proporsional yaşıl vaxt paylanması alqoritmi.

---

## B. Riyazi/Nəzəri Əsaslar

### 11. IDM Dəyişənlərinin İzahı

![IDM Variables](diagrams/11_idm_gap_explained.png)

Intelligent Driver Model üçün gap (s), istənilən gap (s*), v0, T, s0, a, b parametrlərinin annotasiyalı diaqramı.

### 12. IDM Sürətlənmə Funksiyası

![IDM Accel](diagrams/12_idm_accel_vs_gap.png)

Sürətlənmənin gap-a görə dəyişməsi: iki panel — (a) müxtəlif ego sürətləri ilə dayanmış lider, (b) sabit ego sürəti ilə müxtəlif lider sürətləri.

### 13. Fundamental Diaqram (Greenshields)

![Fundamental](diagrams/13_fundamental_diagram.png)

Trafik axınının üç klassik təsviri: sürət–sıxlıq, axın–sıxlıq, axın–sürət. Literature review fəsli üçün.

---

## C. Empirik KPI Nəticələri

Bütün empirik qrafiklər `simulation/data/*.json` fayllarından oxunur — 600 saniyəlik simulyasiyalar (4 senari × 2 rejim).

### 14. Orta Sürət — Zaman Seriyası

![Speed Timeseries](diagrams/14_speed_timeseries.png)

Hər 4 senari üçün şəbəkə üzrə orta sürətin Fixed vs Adaptive müqayisəsi.

### 15. Gecikmə Box-plot

![Delay Boxplot](diagrams/15_delay_boxplot.png)

Avtomobil başına gecikmənin paylanması (senari × rejim).

### 16. Throughput Bar Chart

![Throughput](diagrams/16_throughput_bar.png)

Kəsişmə keçidlərinin sürəti (avt/dəq) — senari × rejim.

### 17. Növbə Heatmap

![Queue Heatmap](diagrams/17_queue_heatmap.png)

Peak senarisi üçün top-20 ən sıxılan edge-də zaman üzrə növbə uzunluğunun istilik xəritəsi.

### 18. Səfər Vaxtı CDF

![Travel CDF](diagrams/18_travel_time_cdf.png)

Tamamlanmış səfərlərin kumulyativ paylanma funksiyası (peak və stress senariləri).

### 19. Dayanma Sayı Histoqramı

![Stop Hist](diagrams/19_stop_count_hist.png)

Hər avtomobilin neçə dəfə dayandığının paylanması.

### 20. Faza İstifadəsinin Dinamikası

![Phase Util](diagrams/20_phase_utilization.png)

Adaptive rejimdə hər 30 saniyədə yenilənən faza müddətlərinin zaman üzrə dəyişməsi (top-4 ən dəyişkən kəsişmə).

---

## D. Green Wave Analizi

### 21. Zaman–Məsafə Diaqramı

![Green Wave](diagrams/21_greenwave_timespace.png)

Koridor üzrə avtomobil trayektoriyaları — Green Wave söndürülmüş vs yandırılmış. Yandırılan halda eyni meylli xətlər daha az kəsilməni göstərir.

---

## E. Xəritə Vizuallaşdırmaları

### 22. Bakı Şəbəkə Xəritəsi

![Network Map](diagrams/22_network_map.png)

Düyünlər (kiçik nöqtələr) və edge-lər. İşıqforu olan kəsişmələr mavi nişanlı.

### 23. Sıxılma İstilik Xəritəsi

![Congestion Map](diagrams/23_congestion_map.png)

Peak senari, adaptive rejim üzərində hər edge-in orta avtomobil sayına görə rənglənməsi.

### 24. Green Wave Koridorları

![Corridors Map](diagrams/24_corridors_map.png)

Aşkar edilmiş arterial koridorların qırmızı ilə vurğulanması.

---

## F. Müqayisəli Analiz

### 25. Fixed vs Adaptive — 4 Panel

![Fixed vs Adaptive](diagrams/25_fixed_vs_adaptive.png)

Peak senarisində dörd KPI eyni anda: orta sürət, gecikmə, throughput, max növbə.

### 26. Senari Radar Diaqramı

![Scenario Radar](diagrams/26_scenario_radar.png)

5 KPI ölçüsü üzrə normallaşdırılmış radar (daha böyük sahə = daha yaxşı performans).

---

## Yenidən Yaratmaq

Bütün artefaktlar deterministik deyil (random spawn), amma boruxətti təkrarlana bilər:

### 1. Mermaid sxemləri (A bölməsi)

```bash
cd simulation/diagrams
for f in 01_architecture 02_tick_loop 03_data_flow 04_sequence \
         05_digital_twin 06_class_diagram 07_state_traffic_light \
         08_use_case 09_deployment 10_adaptive_flowchart; do
  npx -y -p @mermaid-js/mermaid-cli mmdc -i $f.mmd -o $f.png -b transparent -w 1600
done
```

### 2. Nəzəri qrafiklər (B bölməsi)

```bash
simulation/backend/venv/Scripts/python.exe simulation/scripts/plot_theory.py
```

### 3. Simulyasiya datası (C–F bölmələri üçün lazımdır)

```bash
simulation/backend/venv/Scripts/python.exe simulation/scripts/run_all_experiments.py
```

Bu, `simulation/data/` qovluğunda 9 JSON faylı yaradır (~600s simulyasiya hər biri ≈ 2–9s real-vaxt).

### 4. Empirik qrafiklər (C bölməsi)

```bash
simulation/backend/venv/Scripts/python.exe simulation/scripts/plot_empirical.py
```

### 5. Green Wave + xəritə + müqayisə (D–F bölmələri)

```bash
simulation/backend/venv/Scripts/python.exe simulation/scripts/plot_greenwave_map_compare.py
```

<<<<<<< HEAD
=======
### 6. DOM struktur diaqramları (G bölməsi)

```bash
# Mermaid (27-29)
cd simulation/diagrams
for f in 27_component_tree 28_state_data_flow 29_ws_render_sequence; do
  npx @mermaid-js/mermaid-cli -i $f.mmd -o $f.png -t dark -b '#0f172a' -w 1600 -H 1200
done

# Python (30-31)
source simulation/backend/venv/bin/activate
python simulation/scripts/plot_dom_structure.py
```

---

## G. Frontend DOM Strukturu

### 27. React Komponent Ağacı

![Component Tree](diagrams/27_component_tree.png)

App kök komponentindən başlayaraq bütün uşaq komponentlərə qədər tam iyerarxiya: Header, MapContainer (VehicleLayer · TrafficLightLayer · HeatmapLayer), Sidebar (4 tab × alt komponentlər), Modal (IntersectionCamera3D / Three.js).

### 28. State və Məlumat Axını

![State Data Flow](diagrams/28_state_data_flow.png)

6 `useState` dəyişəninin (`simState`, `theme`, `activeTab`, `heatmapOn`, `selectedTL`, `wsStatus`) hər birinin hansı komponentlərə təsir etdiyi. `simState` mərkəzi hub olaraq WS payload-ı paylayır.

### 29. WebSocket → DOM Render Sequence

![WS Render Sequence](diagrams/29_ws_render_sequence.png)

Backend-dən 10 Hz JSON yayımı → `onmessage` → `setSimState` → React paralel rekonsilyasiyası → hər layer/tab/header-in ayrıca yenilənməsi. Reconnect məntiqi və 3D modal animasiya dövrü də daxildir.

### 30. DOM Yenilənmə Matriksi

![DOM Update Matrix](diagrams/30_dom_update_matrix.png)

WS mesaj sahələri (sütunlar) × React komponentlər (sıralər) cross-reference heatmap. ✓ işarəsi — sahə birbaşa o komponenti yeniləyir.

### 31. Komponent Coupling Qrafı

![Component Coupling](diagrams/31_component_coupling.png)

Yönlü prop-passing / callback asılılıq qrafı. Düyün ölçüsü prop sayına mütənasibdir. Rənglər komponent qrupunu göstərir (map · ui · atom · charts · 3d · overlay).

>>>>>>> 1a0ff1ea19a3f3676d8dc4d5deb49d166f0fb8e9
---

## Bonus: Frontend Ekran Görüntüləri

Dashboard-un canlı görünüşləri üçün:

```bash
# 1. Backend-i başlat
cd simulation/backend && venv/Scripts/python main.py

# 2. Frontend-i başlat
cd simulation/frontend && npm run dev

# 3. Browser-də http://localhost:5173 aç
# 4. Aşağıdakı vəziyyətlərdə screenshot al:
#    - Normal senari, fixed rejim (referans)
#    - Peak senari, adaptive rejim (intensiv)
#    - Green Wave aktiv (koridorlar görünür)
#    - KPI panel hər iki rejimi müqayisə edir
```

---

## Fayllar Cədvəli

| # | Ad | Mənbə | Tip |
|---|-----|-------|-----|
| 01 | Arxitektura | `01_architecture.mmd` | Mermaid |
| 02 | Tick loop | `02_tick_loop.mmd` | Mermaid |
| 03 | Data flow | `03_data_flow.mmd` | Mermaid |
| 04 | Sequence | `04_sequence.mmd` | Mermaid |
| 05 | Digital twin | `05_digital_twin.mmd` | Mermaid |
| 06 | UML class | `06_class_diagram.mmd` | Mermaid |
| 07 | State | `07_state_traffic_light.mmd` | Mermaid |
| 08 | Use case | `08_use_case.mmd` | Mermaid |
| 09 | Deployment | `09_deployment.mmd` | Mermaid |
| 10 | Adaptive flowchart | `10_adaptive_flowchart.mmd` | Mermaid |
| 11 | IDM gap | `plot_theory.py` | matplotlib |
| 12 | IDM accel-gap | `plot_theory.py` | matplotlib |
| 13 | Fundamental | `plot_theory.py` | matplotlib |
| 14 | Speed timeseries | `plot_empirical.py` | matplotlib |
| 15 | Delay box | `plot_empirical.py` | seaborn |
| 16 | Throughput bar | `plot_empirical.py` | seaborn |
| 17 | Queue heatmap | `plot_empirical.py` | matplotlib |
| 18 | Travel CDF | `plot_empirical.py` | matplotlib |
| 19 | Stop hist | `plot_empirical.py` | matplotlib |
| 20 | Phase util | `plot_empirical.py` | matplotlib |
| 21 | GW time-space | `plot_greenwave_map_compare.py` | matplotlib |
| 22 | Network map | `plot_greenwave_map_compare.py` | matplotlib |
| 23 | Congestion map | `plot_greenwave_map_compare.py` | matplotlib |
| 24 | Corridors map | `plot_greenwave_map_compare.py` | matplotlib |
| 25 | Fixed vs adaptive | `plot_greenwave_map_compare.py` | matplotlib |
| 26 | Scenario radar | `plot_greenwave_map_compare.py` | matplotlib |
<<<<<<< HEAD
=======
| 27 | Komponent ağacı | `27_component_tree.mmd` | Mermaid |
| 28 | State / data flow | `28_state_data_flow.mmd` | Mermaid |
| 29 | WS → DOM sequence | `29_ws_render_sequence.mmd` | Mermaid |
| 30 | DOM yenilənmə matriksi | `plot_dom_structure.py` | matplotlib |
| 31 | Komponent coupling qrafı | `plot_dom_structure.py` | networkx + matplotlib |
>>>>>>> 1a0ff1ea19a3f3676d8dc4d5deb49d166f0fb8e9
