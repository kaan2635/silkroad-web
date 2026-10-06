# Silkroad Web — Yol Haritası

Tarayıcıda çalışan, Silkroad Online tarzı (ipek yolu temalı, tıkla-yürü, sabit açılı 3. şahıs kamera, hotbar, seviye/EXP) bir MMORPG.

**Teknoloji:** Three.js (3D), vanilla JS (ES modules), Node.js + WebSocket (çok oyunculu için), SQLite/JSON kayıt.

## Faz 1 — Oynanabilir Çekirdek (TAMAM)
- [x] 3D dünya: zemin, ağaçlar, kayalar, kum tepeleri, gün ışığı
- [x] Karakter (placeholder model) ve tıkla-yürü hareketi
- [x] Silkroad tarzı kamera: sağ tık sürükle ile döndür, tekerlekle yakınlaştır
- [x] HUD: HP/MP/EXP çubukları, seviye, mini harita, hotbar iskeleti
- [x] Proje yapısı, modüler kod

## Faz 2 — Savaş ve Canavarlar
- [ ] Canavar spawn sistemi (kurt, akrep, bandit), AI (dolaşma, saldırma, takip)
- [ ] Hedef seçme (tıkla), otomatik saldırı, hasar sayıları
- [ ] Hotbar'dan yetenek kullanma (1–8), bekleme süreleri (cooldown)
- [ ] Ölüm, yeniden doğma, EXP ve seviye atlama

## Faz 3 — Eşyalar ve Envanter
- [ ] Canavarlardan loot düşmesi, yerden alma
- [ ] Envanter penceresi (sürükle-bırak), ekipman slotları
- [ ] Silah/zırh statları, eşya nadirlik seviyeleri (+ yükseltme sistemi)
- [ ] Altın ve basit NPC dükkânı

## Faz 4 — Dünya ve NPC'ler
- [ ] Şehir (Jangan benzeri), kervan yolu, birden çok bölge
- [ ] NPC'ler: tüccar, demirci, görev verici
- [ ] Görev sistemi (öldür, topla, teslim et)
- [ ] Gün/gece döngüsü, mini harita ve dünya haritası

## Faz 5 — Çok Oyunculu Altyapı
- [ ] Node.js + WebSocket sunucusu, sunucu otoriteli hareket
- [ ] Hesap/giriş, karakter oluşturma ve kaydetme
- [ ] Diğer oyuncuları görme, sohbet (genel/yerel/fısıltı)
- [ ] Canavarların ve savaşın sunucuda işlenmesi

## Faz 6 — Silkroad'a Özgü Sistemler
- [ ] Üç ırk/sınıf: savaşçı, büyücü, okçu; yetenek ağaçları
- [ ] Ticaret kervanı (trade route) ve haydutlar (PvP riskli)
- [ ] Parti sistemi, lonca, takas (trade) penceresi
- [ ] Alchemy: eşya yükseltme ve elementler
- [ ] Binek (at/deve)

## Faz 7 — Cila ve Yayın
- [ ] Gerçek 3D modeller, animasyonlar, ses ve müzik
- [ ] Performans (LOD, chunk yükleme), mobil/gamepad desteği
- [ ] Sunucu yayını (VPS), yedekleme, anti-hile kontrolleri
