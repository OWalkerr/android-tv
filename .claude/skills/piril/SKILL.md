---
name: piril
description: Use when working on "Pırıl ve Ulu Ağaç", the vertical forest platformer in piril/index.html - level chunk format, chapter data, player physics and abilities, enemies and boss, the silhouette+glow rendering pipeline, the reachability test, and how to publish the artifact.
---

# Pırıl ve Ulu Ağaç geliştirme rehberi

Tek dosyalık HTML5 canvas platform oyunu: `piril/index.html`. Dış bağımlılık yok (yalnızca Google Fonts: Fraunces + Nunito). Kullanıcı Türkçe konuşur; tüm metinler Türkçedir. Telefon (dokunmatik düğmeler), klavye ve Android TV kumandası desteklenir.

## Hikâye ve yapı
- Kahraman Pırıl: sincaba benzeyen ama gerçek olmayan bir orman yaratığı (spiral kuyruk, parlayan yaprak kulaklar, süzülme zarı).
- 5 bölüm (`CHAPTERS`): Kökler, Gövde Kovuğu, Rüzgârlı Dallar, Taç, Zirve. Her bölüm: `name`, `sub`, `pal` (renkler + `dark` karanlık, `amb` ortam parçacığı, `rays`, `moon`, `mush`), `chunks` (aşağıdan yukarı), `lore` (anı taşı metinleri, aşağıdan yukarı sırayla), `reward` (`dj`, `glide`, `heart`, null).
- `INTRO` / `OUTRO` hikâye kartları, `REWARDS` yetenek kartları.

## Harita parçaları (`CH_`)
- Her parça 13 karakterlik iç satırlardan oluşur (kenar duvarları otomatik), üst satır önce, genelde 12 satır.
- Lejant: `#` kaya, `=` dal (alttan geçilir, ↓+zıpla ile inilir), `|` sarmaşık, `^` diken, `W` rüzgâr akıntısı, `o` ışık tozu, `S` sürüngen, `B` diken sineği, `F` zehir çiçeği, `M` mantar, `C` ışık taşı (kayıt), `T` anı taşı, `A` ödül tohumu, `P` başlangıç, `X` boss.
- Bağlantı kuralı: parçanın en üst basılabilir yüzeyi 2. satırda (r2), alt satırı (r11) geniş basılabilir yüzey. Böylece her geçiş 3 satırlık (96px) tek zıplamayla aşılır. Tek zıplama ≈113px (3.5 satır), çift zıplama +≈90px, duvar zıplaması 3 genişlikteki bacada çalışır.
- 1. bölüm çift zıplama olmadan geçilebilmeli (ödül END parçasında verilir).

## Kod haritası (bölüm başlıkları)
`KAYIT` (localStorage `piril-v1`), `HARİTA PARÇALARI`, `BÖLÜMLER`, `SES` (ortam drone + efektler), `DURUM`, `GİRDİ` (klavye + dokunmatik çubuk/düğmeler + Gamepad API birleşir; `syncKeys` her kare `keys`'i yeniden kurar, `press()` basış anlarını kuyruklar; `tvMode()`: Enter=zıpla ve otomatik vuruş; ayarlar `save.ctl`/`save.auto`/`save.vib`), `FİZİK` (`stepPlayer`: koyote, zıplama tamponu, değişken yükseklik, duvar kayma/zıplama, sarmaşık, kayma, süzülme, rüzgâr), `DÜŞMANLAR` (`stepEnts`), `BOSS` (`stepBoss`: spore → open → slam → open döngüsü, yarı canda 2. faz), `ÇİZİM` (paralaks `layer`, arazi bölütü `seg` önbelleği, `drawPiril`, `drawEnt`, `drawBoss`, ışık haritası `LM`), `AKIŞ`, `DÖNGÜ` (120 Hz sabit adım, hitstop).

## Kontrol hissi
Koyote 0.12 s, zıplama tamponu 0.15 s, vuruş/kayma tamponu, tepe süzülmesi (basılıyken |vy|<95 yerçekimi ×0.55), hızlı düşüş ×1.15, köşe düzeltme (tavana çarpınca 9 px yana kay), kenar yardımı (8 px yukarı adım), duvara kendiliğinden tutunma, sarmaşığı havada kendiliğinden yakalama. Klavyede ↑ zıplamaz.

## Görsel tarz
Ön planda bölüm renginde koyu siluet arazi + parlayan yosun kenarı (`pal.rim`), arkada sise gömülmüş 3 paralaks katman, karanlık bölümlerde `destination-out` ışık haritası, ateş böcekleri/yaprak/yıldız ortam parçacıkları, bulanık ön plan yaprakları, vinyet. Yeni nesneler bu dili izlemeli: siluet + kenar ışığı + additive parıltı.

## Test
```bash
node piril/tools/reachability.js          # 5 bölümde başlangıçtan çıkışa/boss arenasına yol arar (oyunun kendi fiziğiyle)
node piril/tools/reachability.js 1 3      # belirli bölümler
```
`window.__piril` test kancası (`G`, `keys`, `save`, `sim.stepPlayer` …) oyunda bırakılmıştır; araçlar onu kullanır. Harita parçası değiştiğinde erişilebilirlik testini mutlaka çalıştır. Görsel değişiklikte Playwright ile ekran görüntüsü al (`deviceScaleFactor: 2`) ve bak.

## Yayın
- Artifact: https://claude.ai/artifact/3L1aHa6H1MuyRWE1ePYbR9 . Aynı `file_path` (`piril/index.html`) ile yeniden yayınla; başka oturumdan `url` verip önce `read` yap.
- Önceki oyun `balon-ucusu/` klasöründe durur (ayrı artifact).
