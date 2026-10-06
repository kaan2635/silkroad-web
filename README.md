# Silkroad Web

Tarayıcıda çalışan, **Silkroad Online** tarzı 3D MMORPG. **Masaüstü ve telefonda** oynanır. Şu an **Faz 3 (eşyalar ve envanter)** hazır. Yol haritası için [ROADMAP.md](ROADMAP.md).

## Çalıştırma

Derleme gerekmez. `index.html` dosyasını tarayıcıda aç. 3D motor (Three.js r128) CDN'den yüklendiği için internet gerekir.

Yerel sunucuyla:

```bash
python3 -m http.server 8000   # sonra http://localhost:8000
```

**Telefonda oynamak için:** projeyi GitHub Pages ile yayınla (Settings → Pages → `main` dalı, kök klasör) ve çıkan adresi telefondan aç. Telefonu **yatay** tut. iPhone'da Safari'de "Ana Ekrana Ekle" ile tam ekran çalışır.

## Kontroller

| | Masaüstü | Telefon |
|---|---|---|
| Yürü | Yere sol tık, WASD / oklar | Joystick, yere dokun |
| Saldır | Canavara tıkla, Space | Canavara dokun, 🎯 butonu |
| Kamera döndür | Sağ tık + sürükle, Q / E | Tek parmak kaydır |
| Yakınlaş | Fare tekerleği | İki parmak aç / kapa |
| Hedef seç | Tab | 🎯 |
| Yetenekler | 1–8 | Sağ alttaki butonlar |
| Envanter | I | 🎒 butonu (sağ üst) |
| NPC ile konuş | NPC'ye tıkla | NPC'ye dokun |
| Ganimet | Üstünden geç / tıkla | Üstünden geç / dokun |

## Yetenekler

| Tuş | Yetenek | Açıklama |
|---|---|---|
| 1 | Temel Saldırı | Hedefe otomatik saldırır |
| 2 | Hızlı Adım | 4 sn hız artışı |
| 3 | Ateş Darbesi | Uzaktan ateş topu (2.4x hasar) |
| 4 | Buz Kalkanı | 8 sn gelen hasarı yarıya indirir |
| 5 | Çifte Kesik | Yakın dövüş, iki vuruş |
| 6 / 7 | Can / Mana İksiri | Başlangıçta 10'ar adet |
| 8 | Şehre Dönüş | 3 sn kıpırdamadan bekle |

## Neler var

- **Dünya:** çöl, ipek yolu, 5 vaha, palmiye/kaktüs/kaya, harabeler, şehir kapısı, uzak dağlar
- **Canavarlar:** Kurt (Sv. 1–3), Dev Akrep (Sv. 3–5), Haydut kampları (Sv. 4–7). Dolaşır, kovalar, yuvasına döner, 18 sn sonra yeniden doğar
- **Güvenli bölge:** şehir kapısı çevresinde canavar saldırmaz
- **Savaş:** hedef çerçevesi, hasar sayıları, kritik vuruş, bekleme süreleri, EXP ve seviye atlama, ölüm ve yeniden doğma
- **Eşyalar:** 20 eşya, 4 nadirlik, ekipman statları (saldırı, savunma, can, mana). Canavarlar altın, eşya, iksir ve Yükseltme Taşı düşürür
- **Envanter:** 24 slot + 5 ekipman slotu. Eşyaya dokun, tekrar dokunursan kuşanır
- **NPC'ler:** şehir kapısının yanında Tüccar Ali (al/sat) ve Demirci Wen (+7'ye kadar yükseltme)
- **Mobil:** joystick, dokunmatik kamera, ayrı mobil arayüz yerleşimi
- Karakter adı, konum, seviye, EXP ve iksirler tarayıcıda kaydedilir (localStorage)

## Proje yapısı

```
index.html        giriş sayfası ve HUD iskeleti
css/style.css     arayüz stilleri (masaüstü + mobil)
js/config.js      sabitler ve yardımcı fonksiyonlar
js/input.js       klavye / fare / dokunmatik giriş, joystick
js/world.js       arazi, nesneler, gökyüzü, ışık
js/player.js      karakter, hareket, çarpışma
js/monsters.js    canavar modelleri, yapay zeka, spawn
js/combat.js      hedefleme, hasar, yetenekler, EXP, ölüm
js/items.js       eşya verileri, nadirlik, düşme tablosu
js/inventory.js   envanter, ekipman, stat hesabı
js/loot.js        yerdeki ganimet
js/npc.js         Tüccar ve Demirci
js/ui.js          envanter ve dükkân pencereleri
js/camera.js      yörünge kamerası
js/hud.js         arayüz, mini harita, hasar yazıları
js/main.js        renderer, ana döngü, başlangıç ekranı
```
