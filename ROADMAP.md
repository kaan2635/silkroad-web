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

## Faz 5 — Çok Oyunculu Altyapı
- [ ] Node.js + WebSocket sunucusu, sunucu otoriteli hareket ve savaş
- [ ] Hesap/giriş, karakter oluşturma ve kaydetme
- [ ] Diğer oyuncuları görme, sohbet (genel/yerel/fısıltı)

## Faz 6 — Silkroad'a Özgü Sistemler
- [ ] Üç sınıf: savaşçı, büyücü, okçu; yetenek ağaçları
- [ ] Ticaret kervanı (trade route) ve haydutlar (PvP riskli)
- [ ] Parti sistemi, lonca, takas (trade) penceresi
- [ ] Alchemy: eşya yükseltme ve elementler
- [ ] Binek (at/deve)

## Faz 7 — Cila ve Yayın
- [ ] Gerçek 3D modeller, animasyonlar, ses ve müzik
- [ ] Performans (LOD, chunk yükleme), gamepad desteği
- [ ] Sunucu yayını (VPS), yedekleme, anti-hile kontrolleri
