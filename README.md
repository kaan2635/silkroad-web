# Silkroad Web

Tarayıcıda çalışan, **Silkroad Online** tarzı 3D MMORPG. **Masaüstü ve telefonda** oynanır. Şu an **Faz 5 (orijinal Silkroad sistemleri, tek oyunculu)** hazır. Yol haritası için [ROADMAP.md](ROADMAP.md).

## Çalıştırma

Derleme gerekmez, internet gerekmez (Three.js ve modeller depoda). `index.html` dosyasını tarayıcıda aç ya da yerel sunucu kullan:

```bash
python3 -m http.server 8000   # sonra http://localhost:8000
```

**Telefonda oynamak için:** GitHub Pages ile yayınla (Settings → Pages → `main` dalı, kök klasör) ve adresi telefondan aç. Telefonu **yatay** tut. iPhone'da Safari'de "Ana Ekrana Ekle" ile tam ekran çalışır.

## Kontroller

| | Masaüstü | Telefon |
|---|---|---|
| Yürü | Yere sol tık, WASD / oklar | Joystick, yere dokun |
| Saldır | Canavara tıkla, Space | Canavara dokun, 🎯 |
| Kamera | Sağ tık + sürükle, Q / E, tekerlek | Tek parmak kaydır, iki parmak yakınlaş |
| Hotbar | 1–8, Shift+1–8 (2. sayfa), F1/F2 | Sağ alttaki yuvalar, ⇅ sayfa |
| Berserk | Z | Can çubuğunun altındaki 5 küre |
| Envanter / Karakter / Yetenek | I / C / K | 🎒 ve ☰ menüsü |
| Görevler / Harita / Ayarlar | L / M / Esc | ☰ menüsü |

Yetenek veya iksiri hotbara koymak için pencerede **📌**'a bas, sonra bir yuvaya dokun.

## Neler var

**Karakter**
- Karakter oluşturma: başlangıç silahı (Kılıç/Bıçak + kalkan, Mızrak, Pala, Yay) ve zırh türü (Kumaş/Hafif/Ağır)
- GÜÇ (STR) / ZEKÂ (INT): her seviyede +1 / +1 ve 3 serbest puan; can, mana, fiziksel/büyü saldırı ve savunma, kritik, blok
- Seviye sınırı 80, SP sistemi (400 SP-EXP = 1 SP), ölünce EXP kaybı

**Ustalıklar ve yetenekler (Çin ırkı)**
- 7 ustalık: Bicheon (kılıç/bıçak), Heuksal (mızrak/pala), Pacheon (yay), Soğuk, Şimşek, Ateş, Kuvvet. Ustalık karakter seviyesini geçemez, toplam sınır seviye x3
- 38 kademeli yetenek: zincir saldırılar, alan saldırıları, büyüler, aşılama (silaha element ekler), güçlendirmeler, şifa, arınma, Hayalet Adım (ışınlanma), emici kalkan, kalıcı yetenekler
- Durum etkileri: yanma, kanama, zehir, sersemletme, donma, yere serme, yavaşlatma
- Berserk: öldürdükçe dolan 5 küre; 30 sn boyunca saldırı ve hız artar

**Eşyalar ve simya**
- 1.–10. derece ekipman, 12 yuva: silah, kalkan, 6 zırh parçası, küpe, kolye, 2 yüzük
- Nadirlik: normal (mavi statlı olabilir), Yıldız / Ay / Güneş Mührü; mavi statlar (GÜÇ, ZEKÂ, can %, mana %, kritik, dayanıklılık)
- Dayanıklılık ve tamir; kırık eşya gücünü kaybeder
- Simya: Güçlendirme İksiri ile +12'ye kadar; Şans Tozu (+%12), Koruma Taşı (başarısızlıkta sadece -1), Büyü Taşı ile mavi stat ekleme
- Yığınlanan iksirler (5 derece), Evrensel Hap, Dönüş / Ters Dönüş / Hız parşömenleri, oklar, depo (48 yuva), otomatik iksir

**Dünya**
- 3 bölge: **Jangan** (Sv. 1–20), **Donwhang** (20–40), **Hotan** (40–80). Her birinin kendine özgü arazisi, bitki örtüsü, vahaları ve haydut kampları var
- Işınlayıcı NPC (ücretli) veya yolun ucundaki kapılardan yürüyerek geçiş; yükleme ekranı
- 18 canavar türü (kurt, kaplan, akrep, yılan, mumya, iskelet, hayalet, ayı, taş dev, şeytan muhafız…), Şampiyon ve Dev rütbeleri
- **Unique'ler:** Kaplan Kız (20), Uruchi (40), Isyutaru (60), Lord Yarkan (80). Gerçek zamanlı doğarlar, bölgeye duyurulur, alan saldırısı yaparlar ve garantili mühürlü eşya düşürürler
- Her şehirde 10 NPC: Şifacı, Demirci (silah, tamir, simya), Zırhçı, Takıcı, Depocu, Kaptan, Işınlayıcı, Meslek Loncası, Seyis (ahır), Ticaret Ustası; harabede Hırsız Simsarı
- 25 görev (öldür, topla, keşfet, teslim et, Unique avı), gün/gece döngüsü, dünya haritası

**Meslekler, binek ve evcil hayvanlar**
- Sv. 20'de Meslek Loncası: **Tüccar** (şehre özgü mallar, kervan devesi, yolda hırsız baskınları), **Avcı** (kervan koruma görevi), **Hırsız** (kervan soygunu, çalıntı malı simsara satma). 7 meslek seviyesi, meslek pelerini
- At (binek, %70 hız), Toplayıcı Tilki (ganimeti toplar), Savaş Kurdu (hedefine saldırır)

**Diğer**
- Ses ve müzik (WebAudio, dosyasız), ayarlar (ses, kalite, gölge, FPS, kamera hassasiyeti, otomatik iksir, kayıt sıfırlama)
- Tüm ilerleme tarayıcıda kaydedilir (localStorage); eski kayıtlar otomatik taşınır

> **Henüz yok (sunucu gerektirir, Faz 6):** parti, lonca, takas, oyuncu tezgâhı (stall), PvP, Kale Savaşı, sohbet. Avrupa ırkı Faz 7'de.

## Proje yapısı

```
index.html        giriş sayfası, HUD ve pencere iskeleti
css/style.css     arayüz stilleri (masaüstü + mobil)
js/config.js      sabitler, yardımcılar          js/zones.js      bölge tanımları (Jangan/Donwhang/Hotan)
js/audio.js       WebAudio efekt ve müzik         js/settings.js   ayarlar
js/items.js       eşya verileri, simya            js/skills.js     ustalıklar ve 38 yetenek
js/inventory.js   envanter, ekipman, depo         js/input.js      klavye / fare / dokunmatik
js/world.js       arazi, bölgeler, gökyüzü        js/town.js       prosedürel şehir (yedek)
js/daynight.js    gün/gece                        js/assets.js     model yükleyici (Kenney CC0)
js/town3d.js      modelli şehir, dekor, kapılar   js/fx.js         görsel efektler
js/player.js      karakter, statlar, buff'lar     js/npc.js        NPC'ler
js/monsters.js    canavarlar, Unique'ler          js/loot.js       ganimet
js/combat.js      savaş, yetenekler, EXP          js/pets.js       binek ve evcil hayvanlar
js/jobs.js        meslekler ve kervanlar          js/camera.js     kamera
js/hotbar.js      2 sayfalık hotbar               js/hud.js        arayüz, mini harita
js/quests.js      görevler                        js/worldmap.js   dünya haritası
js/ui.js          tüm pencereler                  js/main.js       ana döngü, kayıt, bölge geçişi
tools/pack_assets.py   modelleri seçip js/assetpack.js'e paketler
```

3D modeller: Kenney (CC0), ayrıntı için [CREDITS.md](CREDITS.md).
