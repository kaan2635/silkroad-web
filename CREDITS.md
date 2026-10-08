# Krediler / Credits

- **3D modeller:** [Kenney](https://kenney.nl) — Fantasy Town Kit, Castle Kit, Survival Kit, Nature Kit, Graveyard Kit (iskelet, hayalet, zombi, vampir karakterleri ve mezarlık dekoru). Lisans: **CC0 1.0** (kamu malı). Dosyalar GitHub'daki `shorepine/kenney` yansısından alındı; renk paleti oyunun temasına göre `tools/pack_assets.py` ile yeniden boyandı ve `js/assetpack.js` içine paketlendi.
- **Animasyonlu canavar ve binek modelleri** (`assets/models/*.glb`, kullanılmayan animasyonlar ayıklandı, renkler oyunda değiştirilir) — hepsi **CC0 1.0**:
  - [Quaternius](https://quaternius.com): Ultimate Animated Animals (kurt, tilki, husky, boğa, at), Easy Enemy (yılan), Ultimate Monsters (hayalet, şeytanlar, ejder, yeti, ork, yengeç), Zombie, Giant.
  - [KayKit — Kay Lousberg](https://kaylousberg.com): Character Pack Skeletons (iskelet savaşçı, büyücü, er, haydut) ve Character Pack Adventurers (haydutlar, muhafızlar, büyücü).
  - Quaternius: geyik, örümcek, eşekarısı, velociraptor, T-rex, goblin, yarasa, balçık, mantar, kurukafa hayalet.
- **Three.js r128**, GLTFLoader ve SkeletonUtils — MIT lisansı (`js/lib/`).
- **Ses ve müzik:** dosya yok; tamamı WebAudio ile oyun içinde üretilir (`js/audio.js`).
- **Arayüz ikonları:** [game-icons.net](https://game-icons.net) — Lorc, Delapouite, sbed, Skoll, Caro Asercion ve diğer katkıcılar. Lisans: **CC BY 3.0**. SVG yolları `js/iconpack.js` içinde; Silkroad tarzı boyalı zemin ve renkler `js/icons.js` ile çalışma anında ekleniyor.
- **Yazı tipleri:** [Cinzel](https://github.com/NDISCOVER/Cinzel) (Natanael Gama) ve [Alegreya Sans](https://github.com/huertatipografica/Alegreya-Sans) (Huerta Tipográfica) — **SIL Open Font License 1.1** (`assets/fonts/OFL-*.txt`). Türkçe karakterler için alt kümelendi.
- **Büyü efektleri:** rün çemberi, parıltı, kılıç izi ve şok dalgası dokuları dosya olmadan canvas ile üretilir (`js/fx.js`).

- Boyalı ikonlar, canavar portreleri ve logo: proje sahibinin hazırlattığı varlık sayfası (`tools/asset_sheet.png`), `tools/slice_sheet.py` ile `assets/ui/` atlaslarına bölünür.
