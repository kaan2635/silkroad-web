# Silkroad Web

Tarayıcıda çalışan, **Silkroad Online** tarzı 3D MMORPG. Şu an **Faz 1 (oynanabilir çekirdek)** hazır. Yol haritası için [ROADMAP.md](ROADMAP.md).

## Çalıştırma

Derleme gerekmez. `index.html` dosyasını tarayıcıda aç (çift tık yeterli). 3D motor (Three.js r128) CDN'den yüklendiği için internet gerekir.

İstersen yerel sunucuyla da çalıştırabilirsin:

```bash
python3 -m http.server 8000   # sonra http://localhost:8000
```

## Kontroller

| Girdi | İşlev |
|---|---|
| Sol tık (zemin) | Oraya yürü |
| Sağ tık + sürükle (veya sol sürükle) | Kamerayı döndür / eğ |
| Fare tekerleği | Yakınlaştır / uzaklaştır |
| W A S D / oklar | Kameraya göre yürü |
| Q / E | Kamerayı döndür |
| 1–8 | Hotbar (Faz 2'de aktif olacak) |

## Faz 1'de neler var

- Çöl dünyası: tepeler, ipek yolu, 5 vaha, palmiye/kaktüs/kaya, harabe sütunları, şehir kapısı, uzak dağlar
- Karakter modeli (hasır şapkalı savaşçı), yürüme animasyonu, çarpışma
- Silkroad tarzı kamera, tıkla-yürü hareketi, tıklama işaretçisi
- HUD: can/mana/EXP, dönen mini harita, hotbar iskeleti, sistem mesajları
- Karakter adı ve konum tarayıcıda kaydedilir (localStorage)

## Proje yapısı

```
index.html        giriş sayfası ve HUD iskeleti
css/style.css     arayüz stilleri
js/config.js      sabitler ve yardımcı fonksiyonlar
js/input.js       klavye / fare girişi
js/world.js       arazi, nesneler, gökyüzü, ışık
js/player.js      karakter, hareket, çarpışma
js/camera.js      yörünge kamerası
js/hud.js         arayüz ve mini harita
js/main.js        renderer, ana döngü, başlangıç ekranı
```
