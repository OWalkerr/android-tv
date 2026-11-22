---
name: balon-ucusu
description: Use when working on the Balon Uçuşu balloon multiplier game (balon-ucusu/index.html) - file map, rendering pipeline (lit sprites, rope physics, clouds), gameplay tuning constants, headless bot playtest, and how to republish the artifact.
---

# Balon Uçuşu geliştirme rehberi

Tek dosyalık HTML5 canvas oyunu: `balon-ucusu/index.html`. Dış bağımlılık yok (yalnızca Google Fonts). Kullanıcı Türkçe konuşur; arayüz metinleri Türkçedir.

## Yayın
- Claude artifact olarak yayınlanır: https://claude.ai/artifact/HokXQoZLMLcn8Kpbas6CqK
- Güncellemek için `Artifact` aracıyla aynı `file_path` (`balon-ucusu/index.html`) yayınlanır; bu oturumda yayınlanmadıysa `url` verilir ve önce `action:"read"` yapılır. `icon` yeniden verilmez.
- Değişiklikler `claude/...` dalına commit edilip push edilir.

## Dosya haritası (index.html içindeki bölüm başlıkları)
| İşaretçi | İçerik |
|---|---|
| `KAYIT` | localStorage şeması (`balon-ucusu-v2`), yükseltmeler `UPS`, görünümler `BALS`/`BASS` |
| `DÜNYALAR` | 5 dünya (`WORLDS`), `wIdx`, `isChase` (her 5. bölüm kaçış) |
| `SES` | WebAudio efektleri + adım sıralayıcılı müzik (`mstep`) |
| `OYUN DURUMU` | `G` durumu, `makeObs`, `genLevel` (kapı değerleri beklenen balon sayısına `en` göre ölçeklenir) |
| `AKIŞ` / `GİRDİ` / `FİZİK` | bölüm başlatma, klavye/dokunma/kumanda, sepet ve balon fiziği |
| `GÜNCELLEME` | kapı geçişi `passGate`, engel çarpışmaları, final pompası, sonuç |
| `ÇİZİM` | tüm görsel katman (aşağıda) |
| `DÖNGÜ` | sabit 120 Hz fizik adımı, ağır çekim, uyarlanabilir çözünürlük (`QDPR`), final kamera zoom'u |

## Görsel boru hattı
- **Koordinatlar:** dünya y yukarı; `sx()/sy()` ekrana çevirir. `S` = ölçek (finalde zoom ile değişir), `SB` = temel ölçek. Sprite önbelleği `SPR` her zaman `SB*DPR` ile üretilir.
- **`litSprite(key,w,h,{draw,height?,spec,gloss,amb,round,depth,post})`:** renkli vektör çizimden alfa → yükseklik haritası (bulanıklaştırma) → normal → yayınık + parlama + fresnel ışık. Yeni nesneler bununla yapılır, düz vektör çizilmez. `drawLit(c,w,h,X,Y,ox,oy,ölçek,ters,dönüş,ölçekY)` ile çizilir.
- **Balonlar:** `balSprite` piksel başına lateks ışığı (ışık geçirgenliği + pencere parlaması). Şekiller: klasik, kalp, yıldız, kedi.
- **Bulutlar:** `cloudSprite(v,tint)` fbm yoğunluk + ışık yönünde örnekleme; `cloudBlur` önplan için. Tint: 0 gün, 1 gece, 2 fırtına, 3 kar, 4 pembe.
- **İpler:** `ropeStep` verlet (RN=4 parça, yerçekimi), `drawRopes` çift geçişli (gölge + ip).
- **Parçacıklar:** `P({k})` türleri: `sq`, `shard`, `conf`, `ring`, `spark`, `smoke`, `fire`. `emitFx` sürekli yayıcılar (meteor, roket, kum).
- **Günün saati:** `TODS`/`todOf(L)`: her dünyanın 3. bölümü altın saat, 4. gün batımı, 5. fırtına (yağmur). Gece Şehri hariç. `soft-light` renk derecelendirmesi.
- Performans: her karede yeni gradient/shadowBlur'u sınırlı tut; ağır işi sprite önbelleğine taşı. `PERF` 45 FPS altında çözünürlüğü düşürür.

## Oynanış ayarları
`LIFT=120`, `G0=600`, `BM`, `BAGM` (safra kütlesi), `HS` (atmosfer ölçeği), `ZH` (çarpan katmanı yüksekliği), yıldız eşikleri `showResult` içinde (2★ ≥ x5, 3★ ≥ x8). Kaçış kartalı hızı `genLevel` sonunda.

## Test
```bash
node balon-ucusu/tools/playtest.js 1 5 13 22 --shots /tmp/balon-shots   # --dpr 2 yüksek çözünürlük
```
Araç geçici bir kopyaya `window.__bal` / `window.__start` kancası ekler (asıl dosyaya ekleme yapma), botla oynatır, sonuç/FPS/hata yazar. Görsel değişiklikten sonra ekran görüntülerine `Read` ile bak. Bot mükemmel pompaladığı için final çarpanları gerçek oyuncudan yüksek çıkar.

## Kurallar
- Tek dosya kalır; harici görsel yok, her şey prosedürel.
- Kumanda (ok tuşları + Enter + geri) her ekranda çalışmalı.
- `[hidden]` ile göster/gizle; `alert/confirm` kullanma.
- Oyun içinde marka/gerçek oyun kopyası yok.
