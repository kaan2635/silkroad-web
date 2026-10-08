// Bölgeler (haritalar): Jangan (Sv. 1–20) → Donwhang (20–40) → Hotan (40–80).
// Her bölge ayrı bir haritadır; geçişte kayıt yapılır ve sayfa yükleme ekranıyla yeniden kurulur (Silkroad'daki gibi).
// Yol kuzey ucu (z−) batıdaki sonraki şehre, güney ucu (z+) doğudaki önceki şehre çıkar.

// Bölgeler (haritalar). iSRO sırası (yol kuzeyi = next):
// Jangan (1–20) → Donwhang (20–40) → Hotan (40–80) → Semerkant (75–95) → Küçük Asya (30–55) → Konstantinopolis (1–30, Avrupa başlangıcı)
// Işınlanma / gemi ile: İskenderiye (101–120), Şambala Kıyısı (131–140).
// Zindanlar (kind: 'dungeon'): Taş Mağara, Qin-Shi Mezarı (2 kat), Kutsal Su Tapınağı, Jüpiter Tapınağı, Buz / Ateş Tapınağı, Unutulmuş Dünya.
// Her bölge ayrı bir haritadır; geçişte kayıt yapılır ve sayfa yükleme ekranıyla yeniden kurulur (Silkroad'daki gibi).

const ZONES = {
  jangan: {
    id: 'jangan', name: 'Jangan', town: 'Jangan Şehri', lv: 'Sv. 1–20', next: 'donwhang', prev: null, seed: 0, amp: 1,
    ponds: [{ x: -90, z: 60 }, { x: 120, z: -80 }, { x: 80, z: 150 }, { x: -130, z: -120 }, { x: 170, z: 110 }],
    pondNames: ['Yeşim Vahası', 'Ejder Gölü', 'Gümüş Vaha', 'Kervan Vahası', 'Gün Batımı Vahası'],
    ruins: [{ x: 55, z: -75 }, { x: -75, z: -45 }, { x: -20, z: 110 }], ruinName: 'Haydut Harabeleri', ruinLv: 'Sv. 8–13',
    rings: [{ r: 110, name: 'Kurt Vadisi', lv: 'Sv. 1–5' }, { r: 195, name: 'Akrep Çölü', lv: 'Sv. 5–11' }, { r: 9999, name: 'Kaplan Dağları', lv: 'Sv. 13–20' }],
    spawns: [['wolf', 14, 40, 105, 1, 5], ['boar', 9, 50, 105, 2, 6], ['scorpion', 14, 100, 190, 5, 10], ['tiger', 10, 200, 270, 13, 17], ['golem', 8, 215, 275, 16, 20], ['rat', 14, 25, 80, 1, 3], ['mangyang', 12, 60, 130, 3, 7], ['frog', 10, 90, 160, 6, 10], ['glub', 10, 130, 210, 9, 13], ['barcher', 10, 160, 230, 11, 15]],
    ruinMob: ['bandit', 8, 13],
    uniques: [{ id: 'u_tiger', level: 20, x: 150, z: 205, every: 600 }],
    shop: [1, 2, 3], tele: [{ zone: 'donwhang', cost: 500 }, { zone: 'tomb1', cost: 0, dungeon: true, min: 90 }],
    col: { sand: 0xdcbf86, dark: 0xc29a5c, rock: 0xa88a62, grass: 0x7d9a52, road: 0x9a8260, outer: 0xc9a468, mount: 0xb89868, skyH: 0xf0d9a8, skyZ: 0x5fa4e0 },
    flora: { palms: 50, cacti: 90, rocks: 130, pines: 0, crypts: 0, bushes: 130 }, tint: null,
    npc: { merchant: 'Şifacı Ali', smith: 'Demirci Wen', armor: 'Zırhçı Mei', acc: 'Takıcı Su', storage: 'Depocu Lin', captain: 'Kaptan Lee', tele: 'Işınlayıcı Bao', job: 'Lonca Ustası Fu', stable: 'Seyis Tan', special: 'Ticaret Ustası Hu', den: 'Hırsız Simsarı Kara', market: 'Pazar Ağası Wang' }
  },
  donwhang: {
    id: 'donwhang', name: 'Donwhang', town: 'Donwhang Şehri', lv: 'Sv. 20–40', weather: 'sand', next: 'hotan', prev: 'jangan', seed: 1.7, amp: 0.85,
    ponds: [{ x: -60, z: -120 }, { x: 140, z: 40 }, { x: -150, z: 150 }],
    pondNames: ['Hilal Gölü', 'Deve Vahası', 'Kayıp Vaha'],
    ruins: [{ x: 90, z: -60 }, { x: -110, z: 30 }, { x: 40, z: 140 }], ruinName: 'Haydut Kalesi', ruinLv: 'Sv. 28–33',
    rings: [{ r: 110, name: 'Çakal Ovası', lv: 'Sv. 20–26' }, { r: 195, name: 'Yılan Kanyonu', lv: 'Sv. 25–32' }, { r: 9999, name: 'Mumya Çölü', lv: 'Sv. 32–40' }],
    spawns: [['jackal', 14, 40, 105, 20, 24], ['sandscorp', 10, 50, 105, 21, 26], ['snake', 14, 100, 190, 25, 31], ['mummy', 10, 200, 270, 32, 37], ['skeleton', 9, 210, 275, 34, 39], ['sandwolf', 14, 30, 100, 20, 24], ['cactoro', 10, 100, 170, 26, 30], ['fgoleling', 12, 150, 220, 29, 34], ['darkmage', 10, 215, 275, 35, 39]],
    ruinMob: ['dbandit', 28, 33],
    uniques: [{ id: 'u_uruchi', level: 40, x: -190, z: -180, every: 720 }],
    shop: [3, 4, 5], tele: [{ zone: 'jangan', cost: 500 }, { zone: 'hotan', cost: 1500 }, { zone: 'dwcave', cost: 0, dungeon: true, min: 45 }],
    col: { sand: 0xe6c886, dark: 0xcfa45a, rock: 0xb08a5a, grass: 0x8a9a52, road: 0xa08460, outer: 0xd8b070, mount: 0xc8a068, skyH: 0xf5dfae, skyZ: 0x6aa8dc },
    flora: { palms: 25, cacti: 70, rocks: 150, pines: 0, crypts: 16, bushes: 80 }, tint: 0xfff0d0,
    npc: { merchant: 'Şifacı Mo', smith: 'Demirci Chang', armor: 'Zırhçı Ling', acc: 'Takıcı Yun', storage: 'Depocu Han', captain: 'Komutan Zhao', tele: 'Işınlayıcı Wei', job: 'Lonca Ustası Ma', stable: 'Seyis Bo', special: 'Ticaret Ustası Jin', den: 'Hırsız Simsarı Sinsi', market: 'Pazar Ağası Sun' }
  },
  hotan: {
    id: 'hotan', name: 'Hotan', town: 'Hotan Şehri', lv: 'Sv. 40–80', weather: 'snow', next: 'samarkand', prev: 'donwhang', seed: 3.3, amp: 1.55,
    ponds: [{ x: 70, z: 95 }, { x: -120, z: -40 }, { x: 160, z: -150 }, { x: -70, z: 185 }, { x: 125, z: 10 }, { x: -170, z: 110 }],
    pondNames: ['Yeşim Nehri', 'Buzlu Göl', 'Kunlun Pınarı', 'Ak Su', 'Kara Su', 'Ay Gölü'],
    ruins: [{ x: -80, z: -140 }, { x: 150, z: 170 }], ruinName: 'Tepe Haydutları', ruinLv: 'Sv. 50–56',
    rings: [{ r: 110, name: 'Buzul Eteği', lv: 'Sv. 40–48' }, { r: 195, name: 'Hayalet Ormanı', lv: 'Sv. 48–58' }, { r: 250, name: 'Kunlun Geçidi', lv: 'Sv. 58–70' }, { r: 9999, name: 'Taklamakan', lv: 'Sv. 70–80' }],
    spawns: [['icewolf', 13, 40, 105, 40, 45], ['bear', 10, 50, 108, 43, 48], ['ghost', 14, 110, 190, 48, 56], ['stonegolem', 10, 200, 248, 58, 66], ['demon', 10, 252, 280, 70, 79], ['blackwolf', 14, 30, 100, 41, 46], ['bigyeti', 10, 110, 180, 50, 55], ['goleling', 12, 180, 235, 60, 66], ['bluedemon', 10, 240, 280, 72, 78]],
    ruinMob: ['hbandit', 50, 56],
    uniques: [{ id: 'u_isyutaru', level: 60, x: 210, z: -40, every: 900 }, { id: 'u_yarkan', level: 80, x: -250, z: 250, every: 1200 }],
    shop: [6, 7, 8], tele: [{ zone: 'donwhang', cost: 1500 }, { zone: 'jangan', cost: 2000 }, { zone: 'samarkand', cost: 3000 }, { zone: 'shambhala', cost: 6000, min: 131 }],
    col: { sand: 0xc8b48a, dark: 0xa89870, rock: 0xd8d8dc, grass: 0x6a9a4a, road: 0x8a7a62, outer: 0xb8a888, mount: 0xe8eef4, skyH: 0xe8ecf0, skyZ: 0x4a8ad0 },
    flora: { palms: 8, cacti: 0, rocks: 170, pines: 140, crypts: 0, bushes: 150, trees: 40 }, tint: 0xe8f0ff,
    npc: { merchant: 'Şifacı Aysu', smith: 'Demirci Tarık', armor: 'Zırhçı Ilgın', acc: 'Takıcı Nur', storage: 'Depocu Emre', captain: 'Bey Arslan', tele: 'Işınlayıcı Kaya', job: 'Lonca Ustası Oğuz', stable: 'Seyis Batu', special: 'Ticaret Ustası Kerim', den: 'Hırsız Simsarı Gölge', market: 'Pazar Ağası Yusuf' }
  },
  samarkand: {
    id: 'samarkand', name: 'Semerkant', town: 'Semerkant', lv: 'Sv. 75–95', next: 'asiaminor', prev: 'hotan', seed: 4.6, amp: 1.7,
    ponds: [{ x: -110, z: 70 }, { x: 140, z: -60 }, { x: 60, z: 170 }, { x: -160, z: -150 }],
    pondNames: ['Zerafşan Pınarı', 'Kervan Kuyusu', 'Yeşil Vaha', 'Bozkır Gölü'],
    ruins: [{ x: 95, z: 60 }, { x: -90, z: -95 }], ruinName: 'Bozkır Haydutları', ruinLv: 'Sv. 80–85',
    rings: [{ r: 105, name: 'Semerkant Bozkırı', lv: 'Sv. 75–82' }, { r: 170, name: 'Kalp Zirvesi', lv: 'Sv. 82–88' }, { r: 230, name: 'Pençe Zirvesi', lv: 'Sv. 88–92' }, { r: 9999, name: 'Kanat Zirvesi', lv: 'Sv. 92–95' }],
    spawns: [['raptor2', 13, 40, 105, 75, 80], ['tribal', 11, 50, 108, 78, 83], ['ninja', 13, 110, 170, 82, 88], ['rocbat', 12, 175, 230, 88, 92], ['flydemon', 10, 232, 280, 92, 95], ['bigtribal', 12, 30, 110, 75, 80], ['raptorv', 12, 110, 170, 81, 86], ['bigorcskull', 10, 170, 230, 87, 92], ['dragonling', 10, 230, 280, 92, 95]],
    ruinMob: ['sbandit', 80, 85],
    uniques: [{ id: 'u_shaitan', level: 90, x: 150, z: -150, every: 1200 }, { id: 'u_roc', level: 95, x: -230, z: 210, every: 1500 }],
    shop: [8, 9, 10], tele: [{ zone: 'hotan', cost: 3000 }, { zone: 'asiaminor', cost: 2500 }, { zone: 'constantinople', cost: 4000 }, { zone: 'jangan', cost: 5000 }],
    col: { sand: 0xc8b480, dark: 0x9a8a5a, rock: 0xd8d8e0, grass: 0x7a9a4a, road: 0x9a8262, outer: 0xb8a878, mount: 0xeef2f8, skyH: 0xe8e4d8, skyZ: 0x4a86cc },
    flora: { palms: 6, cacti: 10, rocks: 190, pines: 90, crypts: 0, bushes: 140, trees: 30 }, tint: 0xfff4e0, weather: 'snow',
    npc: { merchant: 'Şifacı Zülfiye', smith: 'Demirci Timur', armor: 'Zırhçı Bahadır', acc: 'Takıcı Gülnar', storage: 'Depocu Uluğ', captain: 'Emir Aksungur', tele: 'Işınlayıcı Nasreddin', job: 'Lonca Ustası Rüstem', stable: 'Seyis Barlas', special: 'Ticaret Ustası Ferhat', den: 'Hırsız Simsarı Karakuş', market: 'Pazar Ağası Hüsrev' }
  },
  asiaminor: {
    id: 'asiaminor', name: 'Küçük Asya', town: 'Küçük Asya Köyü', lv: 'Sv. 30–55', next: 'constantinople', prev: 'samarkand', seed: 6.1, amp: 1.25,
    ponds: [{ x: -80, z: 110 }, { x: 130, z: 40 }, { x: -150, z: -60 }, { x: 70, z: -170 }],
    pondNames: ['Zeytin Pınarı', 'Mermer Havuz', 'Gölgeli Göl', 'Liman Koyu'],
    ruins: [{ x: 85, z: -80 }, { x: -100, z: 20 }, { x: 30, z: 150 }], ruinName: 'Korsan Mağarası', ruinLv: 'Sv. 40–45',
    rings: [{ r: 105, name: 'Kleopatra Kapısı', lv: 'Sv. 30–38' }, { r: 190, name: 'Amfitiyatro', lv: 'Sv. 38–46' }, { r: 9999, name: 'Haran Kulesi', lv: 'Sv. 46–55' }],
    spawns: [['spider', 14, 40, 105, 30, 35], ['wasp', 11, 50, 108, 33, 38], ['raptor', 14, 110, 190, 38, 44], ['mushroom', 10, 120, 195, 42, 47], ['darkorc', 12, 200, 275, 48, 54], ['donkeyw', 12, 30, 100, 30, 34], ['mushking', 10, 100, 165, 40, 45], ['bigorc', 10, 160, 225, 46, 50], ['skelarcher', 10, 210, 275, 50, 55]],
    ruinMob: ['abandit', 40, 45],
    uniques: [{ id: 'u_ivy', level: 45, x: -200, z: -190, every: 900 }],
    shop: [4, 5, 6], tele: [{ zone: 'constantinople', cost: 800 }, { zone: 'samarkand', cost: 2500 }, { zone: 'alexandria', cost: 8000, ship: true }],
    col: { sand: 0xb8b078, dark: 0x8a8a52, rock: 0xbab0a0, grass: 0x6a9a3a, road: 0xa89072, outer: 0x9aa064, mount: 0xa8a090, skyH: 0xe6e8dc, skyZ: 0x5a96d8 },
    flora: { palms: 10, cacti: 0, rocks: 140, pines: 60, crypts: 0, bushes: 200, trees: 70 }, tint: 0xfff8f0, weather: 'rain',
    npc: { merchant: 'Şifacı Irene', smith: 'Demirci Basil', armor: 'Zırhçı Helena', acc: 'Takıcı Zoe', storage: 'Depocu Petros', captain: 'Yüzbaşı Markos', tele: 'Işınlayıcı Kostas', job: 'Lonca Ustası Yorgo', stable: 'Seyis Stelyo', special: 'Ticaret Ustası Lefter', den: 'Hırsız Simsarı Kızılbaş', market: 'Pazar Ağası Pavlos' }
  },
  constantinople: {
    id: 'constantinople', name: 'Konstantinopolis', town: 'Konstantinopolis', lv: 'Sv. 1–30', next: null, prev: 'asiaminor', seed: 7.4, amp: 1.05, europe: true,
    ponds: [{ x: -100, z: 70 }, { x: 110, z: -100 }, { x: 80, z: 140 }, { x: -140, z: -130 }, { x: 170, z: 60 }],
    pondNames: ['Boğaz Pınarı', 'Kraliçe Havuzu', 'Söğütlü Göl', 'Sisli Göl', 'Altın Boynuz'],
    ruins: [{ x: 60, z: -70 }, { x: -80, z: -40 }, { x: -15, z: 115 }], ruinName: 'Kanun Kaçakları', ruinLv: 'Sv. 15–20',
    rings: [{ r: 105, name: 'Desperado Tepesi', lv: 'Sv. 1–10' }, { r: 190, name: 'Alacakaranlık Ormanı', lv: 'Sv. 10–20' }, { r: 9999, name: 'Tanrılar Bahçesi', lv: 'Sv. 20–30' }],
    spawns: [['gwolf', 14, 40, 105, 1, 5], ['stag', 9, 50, 105, 3, 8], ['goblin', 14, 110, 190, 10, 15], ['hound', 10, 120, 190, 13, 19], ['orc', 12, 200, 275, 21, 26], ['ewarrior', 8, 215, 275, 25, 30], ['rat', 14, 25, 80, 1, 3], ['deerw', 10, 60, 115, 4, 8], ['frog', 10, 100, 150, 8, 12], ['bull2', 10, 140, 205, 14, 19], ['knightfallen', 10, 220, 275, 27, 30]],
    ruinMob: ['ebandit', 15, 20],
    uniques: [{ id: 'u_cerberus', level: 24, x: 190, z: 200, every: 600 }],
    shop: [1, 2, 3], tele: [{ zone: 'asiaminor', cost: 800 }, { zone: 'samarkand', cost: 4000 }, { zone: 'alexandria', cost: 9000, ship: true }],
    col: { sand: 0x9aa868, dark: 0x6e8040, rock: 0xa8a49a, grass: 0x5a9a32, road: 0xa89878, outer: 0x84984e, mount: 0x8a9a7a, skyH: 0xe0e8ec, skyZ: 0x5a90d8 },
    flora: { palms: 0, cacti: 0, rocks: 110, pines: 170, crypts: 6, bushes: 220, trees: 110 }, tint: 0xf4f4f8, weather: 'rain',
    npc: { merchant: 'Şifacı Elena', smith: 'Demirci Marco', armor: 'Zırhçı Sofia', acc: 'Takıcı Lucia', storage: 'Depocu Andreas', captain: 'Kaptan Leon', tele: 'Işınlayıcı Theo', job: 'Lonca Ustası Nikos', stable: 'Seyis Dimitri', special: 'Ticaret Ustası Alexios', den: 'Hırsız Simsarı Vlad', market: 'Pazar Ağası Konstantin' }
  },
  alexandria: {
    id: 'alexandria', name: 'İskenderiye', town: 'İskenderiye', lv: 'Sv. 101–120', next: null, prev: null, seed: 8.8, amp: 1.1,
    ponds: [{ x: -120, z: 40 }, { x: -110, z: 130 }, { x: -130, z: -70 }, { x: -100, z: -170 }],
    pondNames: ['Nil Kıyısı', 'Papirüs Sazlığı', 'Kutsal Göl', 'Timsah Koyu'],
    ruins: [{ x: 110, z: -60 }, { x: 60, z: 150 }], ruinName: 'Mezar Yağmacıları', ruinLv: 'Sv. 105–110',
    rings: [{ r: 105, name: 'Nil Deltası', lv: 'Sv. 101–106' }, { r: 190, name: 'Krallar Vadisi', lv: 'Sv. 106–113' }, { r: 9999, name: 'Firavun Çölü', lv: 'Sv. 113–120' }],
    spawns: [['mummy2', 14, 40, 105, 101, 105], ['scarab', 11, 50, 108, 103, 108], ['anubisw', 14, 110, 190, 107, 112], ['sandgolem', 10, 200, 275, 113, 117], ['kingscorp', 10, 210, 280, 116, 120], ['raptorv', 12, 30, 100, 101, 104], ['cactoro', 10, 100, 165, 106, 110], ['bigdemon', 10, 200, 260, 113, 118], ['darkmage', 10, 230, 280, 117, 120]],
    ruinMob: ['egbandit', 105, 110],
    uniques: [{ id: 'u_sphinx', level: 118, x: 200, z: 190, every: 1800 }],
    shop: [11, 12], tele: [{ zone: 'constantinople', cost: 9000, ship: true }, { zone: 'asiaminor', cost: 8000, ship: true }, { zone: 'holywater', cost: 0, dungeon: true, min: 110 }, { zone: 'jupiter', cost: 0, dungeon: true, min: 120 }],
    col: { sand: 0xe8cc8a, dark: 0xd0a85a, rock: 0xc89a62, grass: 0x6a9a3a, road: 0xb89a68, outer: 0xe0c07a, mount: 0xe2c482, skyH: 0xf8e6b8, skyZ: 0x5a9ad8 },
    flora: { palms: 60, cacti: 30, rocks: 90, pines: 0, crypts: 10, bushes: 60, trees: 0 }, tint: 0xfff0c8, weather: 'sand', pyramids: true,
    npc: { merchant: 'Şifacı Nefertari', smith: 'Demirci Imhotep', armor: 'Zırhçı Merit', acc: 'Takıcı Tiye', storage: 'Depocu Amenhotep', captain: 'Komutan Ramses', tele: 'Kaptan Horemheb', job: 'Lonca Ustası Kha', stable: 'Seyis Senmut', special: 'Ticaret Ustası Ptah', den: 'Hırsız Simsarı Akrep', market: 'Pazar Ağası Hapu' }
  },
  shambhala: {
    id: 'shambhala', name: 'Şambala Kıyısı', town: 'Şambala Kampı', lv: 'Sv. 131–140', next: null, prev: null, seed: 9.9, amp: 1.6,
    ponds: [{ x: -90, z: 90 }, { x: 120, z: -110 }, { x: 140, z: 130 }],
    pondNames: ['Donmuş Göl', 'Ruh Pınarı', 'Ay Aynası'],
    ruins: [{ x: -110, z: -90 }], ruinName: 'Sürgün Rahipler', ruinLv: 'Sv. 133–136',
    rings: [{ r: 105, name: 'Donmuş Kıyı', lv: 'Sv. 131–134' }, { r: 190, name: 'Buz Tapınağı Yolu', lv: 'Sv. 134–137' }, { r: 9999, name: 'Kızıl Kayalar', lv: 'Sv. 137–140' }],
    spawns: [['frostwolf', 13, 40, 105, 131, 133], ['iceyeti', 11, 50, 108, 132, 135], ['icegolem', 12, 110, 190, 134, 137], ['lavademon', 11, 200, 275, 136, 139], ['firedragon', 8, 215, 280, 138, 140], ['voidspawn', 12, 30, 110, 131, 134], ['bigyeti', 10, 100, 170, 133, 136], ['dragonling', 10, 200, 260, 137, 140], ['bluedemon', 10, 230, 280, 138, 140]],
    ruinMob: ['monk', 133, 136],
    uniques: [{ id: 'u_shadowyarkan', level: 138, x: 210, z: -200, every: 2400 }],
    shop: [13, 14], tele: [{ zone: 'hotan', cost: 6000 }, { zone: 'icetemple', cost: 0, dungeon: true, min: 131 }, { zone: 'firetemple', cost: 0, dungeon: true, min: 136 }],
    col: { sand: 0xe4ecf2, dark: 0xb8c8d8, rock: 0x8a8e9a, grass: 0x8aa8b8, road: 0x9a9aa4, outer: 0xd8e2ea, mount: 0xf4f8fc, skyH: 0xdce6f0, skyZ: 0x3a6ac0 },
    flora: { palms: 0, cacti: 0, rocks: 200, pines: 140, crypts: 0, bushes: 60, trees: 0 }, tint: 0xe8f4ff, weather: 'snow',
    npc: { merchant: 'Şifacı Pema', smith: 'Demirci Tenzin', armor: 'Zırhçı Dawa', acc: 'Takıcı Yangchen', storage: 'Depocu Norbu', captain: 'Bekçi Sonam', tele: 'Kahin Rahip', job: 'Lonca Ustası Lobsang', stable: 'Seyis Karma', special: 'Ticaret Ustası Jampa', den: 'Hırsız Simsarı Gölge', market: 'Pazar Ağası Dorje' }
  },

  // ---------- Zindanlar ----------
  dwcave: {
    id: 'dwcave', kind: 'dungeon', name: 'Taş Mağara', town: 'Donwhang Taş Mağarası', lv: 'Sv. 45–55', parent: 'donwhang', seed: 11.1, amp: 0, dark: 0x2a2018,
    rooms: 4, floorCol: 0x6a5a48, wallCol: '#7a6a52', light: 0xffb060,
    rings: [{ r: 60, name: 'Mağara Girişi', lv: 'Sv. 45–48' }, { r: 120, name: 'Yarasa Galerisi', lv: 'Sv. 48–52' }, { r: 9999, name: 'Kemik Odası', lv: 'Sv. 52–55' }],
    spawns: [['cavebat', 16, 25, 90, 45, 49], ['slime', 14, 30, 110, 46, 50], ['skelminion', 16, 80, 160, 49, 53], ['skelmage', 12, 100, 170, 51, 55], ['glub', 10, 60, 150, 47, 51], ['skelarcher', 8, 120, 170, 52, 55]],
    uniques: [{ id: 'u_bonelord', level: 55, room: 'boss', every: 900 }],
    shop: [6, 7], tele: [{ zone: 'donwhang', cost: 0 }],
    npc: { tele: 'Mağara Bekçisi Lao', merchant: 'Gezgin Şifacı Fen' }
  },
  tomb1: {
    id: 'tomb1', kind: 'dungeon', name: 'Qin-Shi Mezarı 1', town: 'Qin-Shi Mezarı · 1. Kat', lv: 'Sv. 90–97', parent: 'jangan', next: 'tomb2', seed: 12.2, amp: 0, dark: 0x1a1410,
    rooms: 5, floorCol: 0x5a4a3a, wallCol: '#8a6a4a', light: 0xff9a4a,
    rings: [{ r: 60, name: 'Mezar Kapısı', lv: 'Sv. 90–92' }, { r: 130, name: 'Toprak Ordu', lv: 'Sv. 92–95' }, { r: 9999, name: 'Kraliyet Koridoru', lv: 'Sv. 95–97' }],
    spawns: [['terracotta', 18, 25, 120, 90, 94], ['tombspirit', 14, 50, 150, 92, 96], ['jiangshi', 14, 100, 190, 94, 97], ['skelarcher', 10, 60, 160, 91, 95], ['bigninja', 8, 120, 190, 94, 97]],
    uniques: [], shop: [9, 10], tele: [{ zone: 'jangan', cost: 0 }, { zone: 'tomb2', cost: 0, dungeon: true, min: 97 }],
    npc: { tele: 'Mezar Bekçisi Meng', merchant: 'Gezgin Şifacı Bai' }
  },
  tomb2: {
    id: 'tomb2', kind: 'dungeon', name: 'Qin-Shi Mezarı 2', town: 'Qin-Shi Mezarı · 2. Kat', lv: 'Sv. 97–105', parent: 'jangan', prev: 'tomb1', seed: 12.9, amp: 0, dark: 0x140c10,
    rooms: 5, floorCol: 0x4a3a3a, wallCol: '#7a5a4a', light: 0xff6a3a,
    rings: [{ r: 60, name: 'Alt Kapı', lv: 'Sv. 97–99' }, { r: 130, name: 'Yılan Salonu', lv: 'Sv. 99–102' }, { r: 9999, name: 'Medusa\'nın Odası', lv: 'Sv. 102–105' }],
    spawns: [['terracotta2', 16, 25, 120, 97, 100], ['tombsnake', 14, 50, 150, 99, 103], ['jiangshi2', 14, 100, 190, 101, 105], ['darkmage', 10, 60, 160, 98, 102], ['bigorcskull', 8, 120, 190, 101, 105]],
    uniques: [{ id: 'u_medusa', level: 105, room: 'boss', every: 1800 }], shop: [10, 11], tele: [{ zone: 'tomb1', cost: 0 }, { zone: 'jangan', cost: 0 }],
    npc: { tele: 'Mezar Bekçisi Zhou', merchant: 'Gezgin Şifacı Qiu' }
  },
  holywater: {
    id: 'holywater', kind: 'dungeon', name: 'Kutsal Su Tapınağı', town: 'Kutsal Su Tapınağı', lv: 'Sv. 110–120', parent: 'alexandria', seed: 13.7, amp: 0, dark: 0x1a1608,
    rooms: 5, floorCol: 0x9a8458, wallCol: '#c8a868', light: 0x7ad8ff,
    rings: [{ r: 60, name: 'Arınma Avlusu', lv: 'Sv. 110–113' }, { r: 130, name: 'Tanrılar Salonu', lv: 'Sv. 113–117' }, { r: 9999, name: 'Kutsal Su Odası', lv: 'Sv. 117–120' }],
    spawns: [['templeguard', 16, 25, 120, 110, 114], ['priestess', 12, 50, 150, 112, 116], ['scarab2', 14, 90, 190, 115, 120], ['bigdemon', 10, 60, 160, 112, 117], ['cactoro', 8, 100, 190, 114, 119]],
    uniques: [{ id: 'u_isis', level: 112, room: 1, every: 900 }, { id: 'u_anubis', level: 115, room: 2, every: 900 }, { id: 'u_haroeris', level: 117, room: 3, every: 1200 }, { id: 'u_seth', level: 120, room: 'boss', every: 1500 }],
    shop: [11, 12], tele: [{ zone: 'alexandria', cost: 0 }],
    npc: { tele: 'Tapınak Rahibi Neb', merchant: 'Gezgin Şifacı Ankh' }
  },
  jupiter: {
    id: 'jupiter', kind: 'dungeon', name: 'Jüpiter Tapınağı', town: 'Jüpiter Tapınağı', lv: 'Sv. 120–130', parent: 'alexandria', seed: 14.3, amp: 0, dark: 0x101420,
    rooms: 5, floorCol: 0xa8a8b0, wallCol: '#d8d4cc', light: 0xc8d8ff,
    rings: [{ r: 60, name: 'Mermer Avlu', lv: 'Sv. 120–123' }, { r: 130, name: 'Gladyatör Salonu', lv: 'Sv. 123–127' }, { r: 9999, name: 'Tanrılar Tahtı', lv: 'Sv. 127–130' }],
    spawns: [['gladiator', 16, 25, 120, 120, 124], ['harpy', 12, 50, 150, 122, 126], ['minotaur', 12, 90, 190, 125, 130], ['bigtribal', 10, 50, 150, 121, 125], ['bigorc', 8, 100, 190, 125, 129]],
    uniques: [{ id: 'u_yuno', level: 125, room: 2, every: 1200 }, { id: 'u_jupiter', level: 130, room: 'boss', every: 2400 }],
    shop: [12, 13], tele: [{ zone: 'alexandria', cost: 0 }],
    npc: { tele: 'Tapınak Bekçisi Cassius', merchant: 'Gezgin Şifacı Livia' }
  },
  icetemple: {
    id: 'icetemple', kind: 'dungeon', name: 'Buz Tapınağı', town: 'Buz Tapınağı', lv: 'Sv. 131–135', parent: 'shambhala', seed: 15.5, amp: 0, dark: 0x0c1420,
    rooms: 4, floorCol: 0xb8d0e0, wallCol: '#d8ecf8', light: 0x8ad8ff,
    rings: [{ r: 60, name: 'Buz Kapısı', lv: 'Sv. 131–132' }, { r: 130, name: 'Kristal Koridor', lv: 'Sv. 132–134' }, { r: 9999, name: 'Kraliçe Salonu', lv: 'Sv. 134–135' }],
    spawns: [['frostwolf', 14, 25, 120, 131, 133], ['icewraith', 14, 50, 150, 132, 134], ['icegolem', 10, 90, 190, 133, 135], ['bluedemon', 10, 60, 160, 132, 135], ['bigyeti', 8, 100, 190, 133, 135]],
    uniques: [{ id: 'u_frostqueen', level: 135, room: 'boss', every: 1500 }], shop: [13, 14], tele: [{ zone: 'shambhala', cost: 0 }],
    npc: { tele: 'Buz Rahibi Tashi', merchant: 'Gezgin Şifacı Lhamo' }
  },
  firetemple: {
    id: 'firetemple', kind: 'dungeon', name: 'Ateş Tapınağı', town: 'Ateş Tapınağı', lv: 'Sv. 136–140', parent: 'shambhala', seed: 16.6, amp: 0, dark: 0x200806,
    rooms: 4, floorCol: 0x5a2a1a, wallCol: '#8a3a22', light: 0xff5a1a,
    rings: [{ r: 60, name: 'Kor Kapı', lv: 'Sv. 136–137' }, { r: 130, name: 'Lav Nehri', lv: 'Sv. 137–139' }, { r: 9999, name: 'Alev Tahtı', lv: 'Sv. 139–140' }],
    spawns: [['lavademon', 14, 25, 120, 136, 138], ['lavagolem', 12, 50, 150, 137, 139], ['firedragon', 10, 90, 190, 138, 140], ['dragonling', 10, 60, 160, 137, 140], ['bigdemon', 8, 100, 190, 137, 140]],
    uniques: [{ id: 'u_flamelord', level: 140, room: 'boss', every: 1800 }], shop: [14], tele: [{ zone: 'shambhala', cost: 0 }],
    npc: { tele: 'Ateş Rahibi Wangdu', merchant: 'Gezgin Şifacı Yeshe' }
  },
  forgotten: {
    id: 'forgotten', kind: 'dungeon', instance: true, name: 'Unutulmuş Dünya', town: 'Unutulmuş Dünya', lv: 'Davetiyeyle', parent: 'jangan', seed: 17.7, amp: 0, dark: 0x140a20,
    rooms: 4, floorCol: 0x4a3a5a, wallCol: '#6a5a8a', light: 0xc86aff,
    rings: [{ r: 60, name: 'Rüya Kapısı', lv: '' }, { r: 130, name: 'Kayıp Koridorlar', lv: '' }, { r: 9999, name: 'Unutulmuş Taht', lv: '' }],
    spawns: [], uniques: [{ id: 'u_fwboss', level: 1, room: 'boss', every: 99999 }], shop: [], tele: [{ zone: 'jangan', cost: 0 }],
    npc: { tele: 'Rüya Bekçisi' }
  },
  // --- Etkinlik alanları (arenalar ve Kale Savaşı): girişte güvenli bekleme odası, doğuda savaş alanı ---
  arena: {
    id: 'arena', kind: 'dungeon', layout: 'arena', event: 'arena', instance: true, name: 'Savaş Arenası', town: 'Savaş Arenası', lv: 'Takım savaşı', parent: 'jangan', seed: 21.1, amp: 0, dark: 0x1a120a,
    floorCol: 0xb89a6a, wallCol: '#a88a5a', light: 0xffd8a0, rings: [{ r: 9999, name: 'Arena', lv: '' }], spawns: [], uniques: [], shop: [], tele: [{ zone: 'jangan', cost: 0 }], npc: { tele: 'Arena Görevlisi' }
  },
  ctf: {
    id: 'ctf', kind: 'dungeon', layout: 'arena', event: 'ctf', instance: true, name: 'Bayrak Kapmaca', town: 'Bayrak Kapmaca Alanı', lv: 'Takım savaşı', parent: 'jangan', seed: 22.3, amp: 0, dark: 0x0e1a10,
    floorCol: 0x6a8a4a, wallCol: '#5a7a3a', light: 0xd8ffc0, rings: [{ r: 9999, name: 'Bayrak Alanı', lv: '' }], spawns: [], uniques: [], shop: [], tele: [{ zone: 'jangan', cost: 0 }], npc: { tele: 'Bayrak Hakemi' }
  },
  survival: {
    id: 'survival', kind: 'dungeon', layout: 'arena', event: 'survival', instance: true, name: 'Hayatta Kalma Arenası', town: 'Hayatta Kalma Arenası', lv: 'Tek kişilik', parent: 'jangan', seed: 23.9, amp: 0, dark: 0x1a0808,
    floorCol: 0x7a5a4a, wallCol: '#6a3a2a', light: 0xff9a6a, rings: [{ r: 9999, name: 'Kum Çukuru', lv: '' }], spawns: [], uniques: [], shop: [], tele: [{ zone: 'jangan', cost: 0 }], npc: { tele: 'Arena Ustası' }
  },
  fortress: {
    id: 'fortress', kind: 'dungeon', layout: 'arena', event: 'fortress', instance: true, name: 'Kale Savaşı', town: 'Kale Avlusu', lv: 'Lonca savaşı', parent: 'jangan', seed: 24.7, amp: 0, dark: 0x101418,
    floorCol: 0x8a8a84, wallCol: '#9a9488', light: 0xc8d8ff, rings: [{ r: 9999, name: 'Kale Avlusu', lv: '' }], spawns: [], uniques: [], shop: [], tele: [{ zone: 'jangan', cost: 0 }], npc: { tele: 'Kuşatma Komutanı' }
  }
};

// Mevcut bölge kayıttan okunur (yeni karakter Jangan'da başlar)
const CUR_ZONE_ID = (() => {
  try { const s = JSON.parse(localStorage.getItem('silkroad-web-save')); if (s && s.zone && ZONES[s.zone]) return s.zone; } catch (e) { /* yok */ }
  return 'jangan';
})();
const ZONE = ZONES[CUR_ZONE_ID];
ZONE.kind = ZONE.kind || 'field';
const IS_DUNGEON = ZONE.kind === 'dungeon';
// Unutulmuş Dünya: davetiyenin seviyesi ve yıldızına göre kurulur (sessionStorage)
if (ZONE.id === 'forgotten') {
  let fw = null; try { fw = JSON.parse(sessionStorage.getItem('srw-fw')); } catch (e) { fw = null; }
  fw = fw || { lvl: 20, star: 1 };
  const L = fw.lvl, mix = L < 30 ? ['goblin', 'hound', 'skelminion', 'cavebat'] : L < 60 ? ['spider', 'raptor', 'skelmage', 'darkorc'] : L < 90 ? ['ninja', 'tribal', 'tombspirit', 'flydemon'] : L < 115 ? ['jiangshi', 'anubisw', 'scarab2', 'templeguard'] : ['gladiator', 'icewraith', 'lavademon', 'minotaur'];
  ZONE.spawns = mix.map((t, i) => [t, 12 + fw.star * 2, 25 + i * 20, 110 + i * 20, L, L + 4]);
  ZONE.uniques[0].level = L + 5; ZONE.fw = fw; ZONE.lv = 'Sv. ' + L + '–' + (L + 5) + ' · ' + '★'.repeat(fw.star);
}
// Etkinlik alanı: dönüş noktası ve etkinlik bilgisi (sessionStorage)
if (ZONE.event) {
  let ev = null; try { ev = JSON.parse(sessionStorage.getItem('srw-ev')); } catch (e) { ev = null; }
  ZONE.ev = ev && ev.type === ZONE.event ? ev : null;
  const from = ZONE.ev && ZONES[ZONE.ev.from] && !ZONES[ZONE.ev.from].event ? ZONE.ev.from : 'jangan';
  ZONE.parent = from; ZONE.tele = [{ zone: from, cost: 0 }];
}
if (IS_DUNGEON) { ZONE.ponds = []; ZONE.pondNames = []; ZONE.ruins = []; ZONE.ruinMob = null; ZONE.col = ZONE.col || { sand: ZONE.floorCol, dark: ZONE.floorCol, rock: ZONE.floorCol, grass: ZONE.floorCol, road: ZONE.floorCol, outer: 0x000000, mount: 0x000000, skyH: ZONE.dark, skyZ: 0x000000 }; ZONE.flora = { palms: 0, cacti: 0, rocks: 0, pines: 0, crypts: 0, bushes: 0, trees: 0 }; ZONE.npc = ZONE.npc || {}; }
CONFIG.sky.horizon = ZONE.col.skyH; CONFIG.sky.zenith = ZONE.col.skyZ;

// Unique zamanlayıcıları (gerçek zaman, ms) — bölge geçişlerinde korunur
const UniqueClock = {
  KEY: 'silkroad-web-uniques',
  get() { try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { return {}; } },
  set(id, t) { const d = this.get(); d[id] = t; try { localStorage.setItem(this.KEY, JSON.stringify(d)); } catch (e) { /* yoksay */ } }
};
