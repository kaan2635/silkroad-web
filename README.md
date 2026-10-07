# Silkroad Web

Tarayıcıda çalışan, **Silkroad Online** tarzı 3D MMORPG. **Masaüstü ve telefonda** oynanır. Şu an **Faz 6 (iSRO'nun neredeyse tüm sistemleri, tek oyunculu)** hazır: iki ırk, Sv. 140, 8 bölge, 7 zindan, yapay oyuncularla parti / lonca / PvP / Kale Savaşı. iSRO ile karşılaştırma: [docs/ISRO_KARSILASTIRMA.md](docs/ISRO_KARSILASTIRMA.md). Yol haritası için [ROADMAP.md](ROADMAP.md).

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
| Hotbar | 1–8, Shift+1–8 (sonraki sayfa), F1–F4 | Sağ alttaki yuvalar, sayfa düğmesi |
| Oto av | H | OTO düğmesi |
| Otur / el hareketleri | X · sohbette /selam /dans /eğil /sevin /hayır /ağla | Sohbet penceresi |
| Topluluk / Etkinlik / Sohbet | O / J / Enter | ☰ menüsü |
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
- Her derecede 3 ara kademe (ör. Demir Bıçağı Sv. 17 → Keskin Demir Bıçağı Sv. 20 → Usta İşi Demir Bıçağı Sv. 22); toplam 30 seviye basamağı
- **Seal of Star ★ / Seal of Moon ☾ / Seal of Sun ☀** eşyalar: daha güçlü taban stat ve çok mavi stat; düşünce ekranda duyurulur, Unique'ler garanti düşürür
- Görünüm: silah ve zırhın derecesi, kademesi ve mührü karakterde görünür (renk, boy, miğfer, omuzluk, eldiven, çizme); +4'ten itibaren silah parlar (+6 mavi, +7 mor, +9 kırmızı, +11 altın)
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

**Item Mall (B) ve Silk**
- Silk kazanma: yeni karakter 100, günlük giriş +20, seviye +5, görev +10, Unique +50, Şampiyon/Dev canavarlardan Silk Kesesi
- Premium Bilet, Bereket Parşömeni, Diriliş Parşömeni, Tamir Çekici, Ölümsüz Taş, Koruma Taşı, Şans Tozu, iksir ve büyü taşı paketleri, Stat/Ustalık sıfırlama, envanter (96'ya kadar) ve depo (120'ye kadar) genişletme
- Avatarlar: şapka, giysi, sırt süsü (taç, kanat, sancak, hale…) karakter görünümünü değiştirir, küçük statlar verir
- Altın Sincap (premium toplayıcı), Savaş Atı

**Evcil hayvanlar (P)**
- Toplayıcı Tilki (yeni karakterle gelir) ve Altın Sincap yerdeki ganimeti toplar; filtre (hepsi / eşya / ekipman / altın), envanter dolarsa evcil çantası (16 / 32 yuva)

**Görünüm**
- Animasyonlu canavarlar (Quaternius / KayKit CC0), Çin tarzı şehirler, dükkân önlerinde NPC'ler ve dolaşan halk
- Profilden çekilmiş silahlar, plakalı zırhlar, yerdeki ganimetin kendi modeli

**Ekonomi (Pazar Ağası)**
- Saatlik değişen talep endeksi, şehir vergisi, günün indirimi, çok satınca düşen NPC fiyatı, geri alım
- Emanet Pazarı: eşyanı fiyat koyup ilana çıkar (oyun kapalıyken de satılır), diğer tüccarların ilanlarından al; hesap defteri

**Arayüz ve efektler**
- Silkroad tarzı pencereler ve boyalı ikonlar; ekrana göre otomatik ölçek ve ayarlardan arayüz boyutu; pencereler masaüstünde sürüklenir, yerini hatırlar
- Buff ikonlarında kalan süre halkası, ipuçları, yatay yetenek ağacı, yetenekleri ve iksirleri hotbara sürükleyip bırakma
- Element büyü efektleri: ateş izi ve göktaşı, buz dikenleri, dallı yıldırım, rün çemberleri, aşılanmış silah parıltısı, berserk alevi

**Diğer**
- Ses ve müzik (WebAudio, dosyasız), ayarlar (ses, kalite, gölge, FPS, kamera hassasiyeti, otomatik iksir, kayıt sıfırlama)
- Tüm ilerleme tarayıcıda kaydedilir (localStorage); eski kayıtlar otomatik taşınır

> Çok oyunculu sunucu henüz yok: parti, lonca, PvP ve etkinlikler yapay oyuncularla oynanır (Faz 7'de gerçek oyuncular).

## Faz 6 — iSRO kapsamı

**İki ırk ve Sv. 140**
- **Çin:** 7 ustalık, 78 yetenek (iSRO adlarıyla yüksek kademeler: Kesik Bıçak, Tayfun Kılıç Dansı, Kurt Isırığı Mızrağı, Uçan Ejder, Şeytan Kovan Yay, Ruh Oku, Don Novası, Gök Gürültüsü Gücü, Anka Kuşu, Diriliş…). Toplam ustalık sınırı seviye ×3
- **Avrupa:** Savaşçı, Haydut, Büyücü, Lanetçi, Rahip, Ozan; en çok iki sınıf (ana + yan), toplam sınır seviye ×2. Tek el / çift el kılıç, çift balta, arbalet, hançer, asa, kara asa, rahip asası, arp; cüppe / deri / plaka zırh. Konstantinopolis'te başlar
- 14 derece, Seal of Star / Moon / Sun / **Nova**, iksirler 7 kademe

**Dünya ve zindanlar**
- 8 bölge: Jangan, Donwhang, Hotan, Semerkant, Küçük Asya, Konstantinopolis, İskenderiye (gemiyle), Şambala Kıyısı; kar, yağmur ve kum fırtınası
- 7 zindan: Qin-Shi Mezarı (2 kat), Taş Mağara, Kutsal Su Tapınağı, Jüpiter Tapınağı, Buz ve Ateş tapınakları, Unutulmuş Dünya (davetiye, 1–5 yıldız)
- Rütbeler: Güçlü, Şampiyon, Elit, Dev, Parti; Gölge Unique'ler; 21 Unique

**Yapay oyuncular ve topluluk (O)**
- Dünyada avlanan, tezgâh açan, sohbet eden 180 kişilik oyuncu kadrosu; gerçek zamanla seviye atlarlar
- Sohbet kanalları: Genel, Parti, Lonca, Birlik, Fısıltı, Küresel (parşömenle)
- Parti (8 kişi, EXP bonusu, şifacı üyeler) ve parti eşleştirme; lonca (seviye, GP bağışı, depo, unvan, birlik); arkadaşlar; akademi
- Oyuncu tezgâhı (sen dururken satar), bot tezgâhları, takas
- PvP pelerini (pusular), düello, cinayet ve katil cezası; onur puanı ve Hwan unvanları; sıralamalar

**Etkinlikler (J)**
- Savaş Arenası (4'e 4), Bayrak Kapmaca, Hayatta Kalma Arenası (10 dalga), Kale Savaşı (kuleler + Kale Kalbi, günlük vergi)
- Gold Time, 28 günlük giriş ödülü takvimi, Magic POP, Arena Jetonu mağazası, Cadılar Bayramı / Kış Şenliği

**Simya**
- Beyaz statlar ve Özellik Taşları; direnç (donma, şok, yanma, zehir), Şans, Sabit, Astral mavi statları
- Gelişmiş İksir (kalıcı +2), Kanıt Taşı, söküm (öz + tablet) ve sentez; mühür seti bonusları; Şeytan Ruhu; meslek kıyafetleri

**Kolaylıklar**
- Oto av (H), oturarak hızlı yenilenme (X), el hareketleri, 4 hotbar sayfası
- Saldırı evcilleri seviye ve tokluk kazanır (Savaş Kurdu, Kaplan Yavrusu, Ejder Yavrusu); öküz arabası ve ticaret arabası
- Günlük ve tekrarlanabilir görevler, ad değiştirme

## Proje yapısı

```
index.html        giriş sayfası, HUD ve pencere iskeleti
css/style.css     arayüz stilleri (masaüstü + mobil)
js/config.js      sabitler, yardımcılar          js/zones.js      bölgeler, zindanlar, etkinlik alanları
js/audio.js       WebAudio efekt ve müzik         js/settings.js   ayarlar
js/items.js       eşya verileri, simya            js/skills.js     13 ustalık, 144 yetenek (iki ırk)
js/inventory.js   envanter, ekipman, depo         js/input.js      klavye / fare / dokunmatik
js/world.js       arazi, bölgeler, gökyüzü        js/town.js       prosedürel şehir (yedek)
js/daynight.js    gün/gece                        js/assets.js     model yükleyici (Kenney CC0)
js/town3d.js      modelli şehir, dekor, kapılar   js/fx.js         görsel efektler
js/player.js      karakter, statlar, buff'lar     js/npc.js        NPC'ler
js/monsters.js    canavarlar, Unique'ler          js/loot.js       ganimet
js/combat.js      savaş, yetenekler, EXP          js/pets.js       binek ve evcil hayvanlar
js/jobs.js        meslekler ve kervanlar          js/camera.js     kamera
js/hotbar.js      4 sayfalık hotbar               js/hud.js        arayüz, mini harita
js/dungeon.js     zindan ve arena haritaları      js/weather.js    hava durumu
js/autohunt.js    oto av                          js/economy.js    piyasa ve Emanet Pazarı
js/social.js      yapay oyuncular, parti, lonca, PvP   js/socialui.js   topluluk ve sohbet pencereleri
js/events.js      arenalar, Kale Savaşı, takvim   js/eventsui.js   etkinlik penceresi
js/quests.js      görevler                        js/worldmap.js   dünya haritası
js/ui.js          tüm pencereler                  js/main.js       ana döngü, kayıt, bölge geçişi
tools/pack_assets.py   modelleri seçip js/assetpack.js'e paketler
```

3D modeller: Kenney (CC0), ayrıntı için [CREDITS.md](CREDITS.md).
