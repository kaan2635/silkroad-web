# Silkroad Web — Yol Haritası

Tarayıcıda çalışan, Silkroad Online tarzı (ipek yolu temalı, tıkla-yürü, sabit açılı 3. şahıs kamera, hotbar, seviye/EXP) bir MMORPG. **Telefondan da oynanabilir.**

**Teknoloji:** Three.js (3D), vanilla JS, Node.js + WebSocket (çok oyunculu için), SQLite/JSON kayıt.

## Faz 1 — Oynanabilir Çekirdek (TAMAM)
- [x] 3D dünya: zemin, ağaçlar, kayalar, kum tepeleri, gün ışığı
- [x] Karakter (placeholder model) ve tıkla-yürü hareketi
- [x] Silkroad tarzı kamera: sağ tık sürükle ile döndür, tekerlekle yakınlaştır
- [x] HUD: HP/MP/EXP çubukları, seviye, mini harita, hotbar iskeleti
- [x] Proje yapısı, modüler kod

## Mobil Destek (TAMAM)
- [x] Dokun-yürü, tek parmak kaydır = kamera, iki parmak = yakınlaştır
- [x] Sanal joystick, mobil HUD yerleşimi (yatay mod), 🎯 hedef butonu
- [x] Mobil performans ayarları (düşük gölge çözünürlüğü, sınırlı piksel oranı)

## Faz 2 — Savaş ve Canavarlar (TAMAM)
- [x] Canavar spawn sistemi: Kurt, Dev Akrep, Haydut (harabelerde kamplar), seviye bölgeleri
- [x] Canavar AI: dolaşma, tetikleme, kovalama, saldırı, yuvaya dönüş, yeniden doğma
- [x] Hedef seçme (tıkla / dokun / Tab), otomatik saldırı, hasar sayıları, kritik vuruş
- [x] 8 slotluk hotbar: Temel Saldırı, Hızlı Adım, Ateş Darbesi, Buz Kalkanı, Çifte Kesik, 2 iksir, Şehre Dönüş
- [x] Bekleme süreleri (cooldown), mana maliyeti, büyü çubuğu
- [x] Ölüm, şehirde yeniden doğma, EXP ve seviye atlama, güvenli bölge
- [x] Seviye ve iksirler tarayıcıda kaydedilir

## Faz 3 — Eşyalar ve Envanter (TAMAM)
- [x] Canavarlardan loot: altın, eşya, iksir, Yükseltme Taşı; yerde ışık hüzmesi, yaklaşınca otomatik toplanır
- [x] Envanter (24 slot) ve ekipman (silah, miğfer, zırh, çizme, yüzük), seviye şartı
- [x] 20 eşya, 4 nadirlik (Sıradan, Güzel, Nadir, Destansı), eşya statları savaşa etki eder
- [x] Tüccar: iksir/taş/ekipman al, eşya sat
- [x] Demirci: eşyayı +7'ye kadar yükselt (taş + altın, başarı şansı düşer)
- [x] Envanter, altın ve ekipman tarayıcıda kaydedilir

## Faz 4 — Dünya ve NPC'ler (TAMAM)
- [x] Surlu şehir (Jangan benzeri), kervan yolu (vagonlar, mil taşları), 5 bölge + isimli vahalar, Kum Devi canavarı
- [x] NPC'ler: Tüccar, Demirci ve görev verici Kaptan Lee; ! / ? işaretleri
- [x] Görev sistemi: öldür, topla, keşfet, teslim et; zincirli 9 görev, ödüller, takipçi, görev günlüğü (L)
- [x] Gün/gece döngüsü (14 dk), dünya haritası (M), bölge afişleri

## ✅ Faz 4.5 — Asset & UI/UX
- [x] Kenney CC0 modeller, ses/müzik, ayarlar penceresi, yükleme ekranı

## Faz 5 — Orijinal Silkroad Sistemleri (tek oyunculu)
**5A — Karakter ve Ustalık (TAMAM)**
- [x] Karakter oluşturma: başlangıç silahı (kılıç/bıçak+kalkan, mızrak, pala, yay) ve zırh türü
- [x] GÜÇ/ZEKÂ statları: seviye başına +1/+1 ve 3 serbest puan; türetilmiş can, mana, fiziksel/büyü saldırı-savunma, kritik, blok
- [x] SP (400 SP-EXP = 1 SP), 7 Çin ustalığı (Bicheon, Heuksal, Pacheon, Soğuk, Şimşek, Ateş, Kuvvet), ustalık sınırı = seviye x3
- [x] 38 kademeli yetenek: saldırı, alan, büyü, buff, aşılama (imbue), şifa, arınma, ışınlanma, emici kalkan, kalıcı yetenekler
- [x] Durum etkileri: yanma, kanama, zehir, sersemletme, donma, yere serme, yavaşlatma (canavarda ve oyuncuda)
- [x] Berserk (5 küre), 2 sayfalık özelleştirilebilir hotbar, Karakter (C) ve Yetenek (K) pencereleri, otomatik iksir
- [x] Şampiyon ve Dev canavarlar
**5B — Eşya ve Simya (TAMAM)**
- [x] 1.–10. derece eşyalar, 5 silah türü + kalkan, 6 parça zırh (kumaş/hafif/ağır), küpe/kolye/2 yüzük
- [x] Yıldız/Ay/Güneş mühürleri, mavi statlar, dayanıklılık ve tamir
- [x] Simya: güçlendirme iksiri ile +12, şans tozu, koruma taşı, büyü taşları
- [x] Yığınlanan iksirler (5 derece), evrensel hap, dönüş / ters dönüş / hız parşömenleri, oklar, depo (48 yuva)
- [x] Zırhçı, Takıcı, Depocu NPC'leri; dükkân filtreleri; eski kayıtların otomatik taşınması
**5C — Dünya (TAMAM)**
- [x] 3 bölge: Jangan (Sv. 1–20), Donwhang (20–40), Hotan (40–80); her birinde tam NPC seti, bölgeye özel arazi, renk, bitki örtüsü
- [x] Işınlayıcı NPC (ücretli) ve yolun iki ucundaki geçiş kapıları; yükleme ekranıyla bölge geçişi
- [x] 18 canavar türü + meslek NPC'leri (Kenney mezarlık kitinden iskelet, hayalet, mumya, şeytan modelleri dahil), Sv. 1–80
- [x] Unique'ler: Kaplan Kız (20), Uruchi (40), Isyutaru (60), Lord Yarkan (80) — gerçek zamanlı doğma, duyuru, alan saldırısı, garantili mühürlü eşya
- [x] Bölge başına yeni görev zincirleri (toplam 25 görev), bölge dükkânlarında 1–8. derece eşyalar
**5D — Meslekler ve Binekler (TAMAM)**
- [x] Meslek Loncası (Sv. 20+): Tüccar / Avcı / Hırsız, 7 meslek seviyesi, meslek pelerini
- [x] Tüccar: şehre özgü ticaret malları (İpek, Baharat, Yeşim), uzaklığa göre fiyat, kervan devesi, yolda hırsız baskınları; mallarla teleport/parşömen yasak
- [x] Avcı: kervan koruma görevi (3 hırsız dalgası); Hırsız: muhafızlı kervan soygunu, çalıntı malı harabelerdeki simsara satma
- [x] Ahır: At (binek, %70 hız), Toplayıcı Tilki (ganimeti toplar), Savaş Kurdu (hedefe saldırır), evcil can iksiri

**5E — Eşya derinliği, görünüm, Item Mall (TAMAM)**
- [x] Derece başına 3 ara kademe, Seal of Star / Moon / Sun eşyalar ve duyuruları
- [x] Ekipmanın derecesi, kademesi, mührü ve +seviyesi karakterde görünür; silah parlaması
- [x] Toplayıcı evcil hayvan: filtre, evcil çantası, evcil çubuğu ve penceresi
- [x] Item Mall ve Silk: premium, simya, evcil/binek, parşömen, avatar, genişletme

**5F — Arayüz yenilemesi (TAMAM)**
- [x] Silkroad tarzı lake/bronz pencere çerçeveleri, Cinzel + Alegreya Sans yazı tipleri, emoji yerine boyalı SVG ikonlar (game-icons.net, CC BY 3.0)
- [x] Ekrana göre otomatik ölçek + ayarlardan "Arayüz boyutu"; pencereler ekrandan taşmaz, masaüstünde sürüklenir ve yerini hatırlar
- [x] Buff/durum ikonlarında dairesel kalan süre, son saniyelerde yanıp sönme, ayrıntılı ipuçları
- [x] Yatay yetenek ağacı (ustalık seviyesine göre basamaklar, kademe noktaları, ayrıntı paneli), sürükle-bırak hotbar
- [x] Büyü efektleri: parçacık sistemi, element izli mermiler, buz dikenleri, dallı yıldırım, göktaşı, rün çemberi, aşılanmış silah parıltısı, berserk alevi, vuruş kıvılcımları

**5G — Şehir, NPC, eşya ve ekonomi (TAMAM)**
- [x] Çin mimarisi: kıvrık saçaklı salonlar, pagoda, takı kapılar, kuleler; bölgeye göre üslup; dükkân tabelaları
- [x] NPC'ler dükkânlarının önünde, rol eşyaları ve hareketleriyle; dolaşan halk; F / dokun ile konuşma düğmesi
- [x] Eşya ikon çeşitleri (derece, zırh türü, kademe çerçevesi), 3D ganimet modelleri
- [x] Ekonomi: talep endeksi, vergi, doygunluk, geri alım, Emanet Pazarı, hesap defteri

**5H — Gerçekçi modeller ve kolay kullanım (TAMAM)**
- [x] İskeletli, animasyonlu canavar modelleri (bekleme, yürüme, koşma, saldırı, darbe, ölüm) ve at
- [x] Profilden çekilmiş silahlar (jian, dao, mızrak, guandao, kompozit yay), metal parlaklığı; yeni zırh parçaları ve gövde
- [x] Tıklayınca binaların etrafından dolaşan yol bulma (A*), takılma kurtarma
- [x] Sade ekran: yakındaki / hedef canavar adları, kısa günlük ve tekrar sayacı, en çok iki pencere

## Faz 6 — Çok Oyunculu Altyapı
- [ ] Node.js + WebSocket sunucusu, sunucu otoriteli hareket ve savaş
- [ ] Hesap/giriş, karakter kaydı sunucuda
- [ ] Diğer oyuncuları görme, sohbet (genel/yerel/fısıltı)
- [ ] Parti, lonca, takas, oyuncu tezgâhı (stall), PvP (pelerin), Kale Savaşı, meslek PvP'si

## Faz 7 — Avrupa ve Yayın
- [ ] Avrupa ırkı ve ustalıkları, Konstantinopolis
- [ ] Performans (LOD, chunk yükleme), gamepad desteği
- [ ] Sunucu yayını (VPS), yedekleme, anti-hile kontrolleri
