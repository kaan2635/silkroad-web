// Görev sistemi: öldür / topla / ulaş / teslim et. Görev vericiler: Kaptan Lee, Tüccar Ali, Demirci Wen.

// type: 'kill' (target = canavar türü) | 'collect' (target = 'stone') | 'visit' (target = bölge adı) | 'deliver' (to = NPC id)
// type: 'kill' (target = canavar türü) | 'collect' (target = görev eşyası) | 'visit' (target = bölge adı) | 'deliver' (to = NPC id)
// reward: { exp, gold, items: [[base, adet]], gear: { base, rarity } } — base 'WEAPON_d' / 'CHEST_d' oyuncunun silah / zırh türüne göre seçilir
const QUEST_DEFS = [
  { id: 'wolves', name: 'Kurt Sürüsü', giver: 'captain', minLevel: 1, type: 'kill', target: 'wolf', n: 6, noun: 'Kurt',
    desc: 'Vadideki kurtlar kervanlara saldırıyor. Şehrin dışındaki 6 kurdu avla.',
    reward: { exp: 70, gold: 50, items: [['hp1', 10]] } },
  { id: 'fangs', name: 'Kurt Dişleri', giver: 'merchant', minLevel: 1, type: 'collect', target: 'q_fang', n: 5, noun: 'Kurt Dişi',
    desc: 'Şifacılar ilaç için kurt dişi istiyor. Kurtlardan 5 Kurt Dişi topla.',
    reward: { gold: 100, gear: { base: 'necklace_1', rarity: 0 } } },
  { id: 'parcel', name: 'Kaptanın Mektubu', giver: 'captain', minLevel: 2, type: 'deliver', to: 'smith',
    desc: 'Bu mektubu Demirci Wen\'e ulaştır. Kendisi meydanın batısında.',
    reward: { exp: 60, gold: 40, items: [['arrow', 500]] } },
  { id: 'oasis', name: 'Yeşim Vahası', giver: 'merchant', minLevel: 2, type: 'visit', target: 'Yeşim Vahası',
    desc: 'Kervanlar su için Yeşim Vahası\'na uğrar. Yolu keşfet: vahayı bul (şehrin batı-güneybatısı).',
    reward: { exp: 150, gold: 80, items: [['mp1', 10]] } },
  { id: 'scorp', name: 'Çöl Zehri', giver: 'captain', minLevel: 4, after: 'wolves', type: 'kill', target: 'scorpion', n: 8, noun: 'Dev Akrep',
    desc: 'Akrep Çölü\'nde dev akrepler yolu kapattı. 8 akrebi temizle. Zehirlerine karşı Evrensel Hap taşı.',
    reward: { exp: 450, gold: 150, gear: { base: 'WEAPON_1', rarity: 1 } } },
  { id: 'smith', name: 'Ocak İçin İğne', giver: 'smith', minLevel: 4, type: 'collect', target: 'q_tail', n: 5, noun: 'Akrep İğnesi',
    desc: 'Simya iksirlerimde akrep iğnesi kullanıyorum. 5 Akrep İğnesi getir, karşılığında sana güçlendirme iksiri vereyim.',
    reward: { gold: 120, items: [['elx_w', 2], ['elx_a', 3], ['luck', 1]] } },
  { id: 'bandit', name: 'Haydut Kampları', giver: 'captain', minLevel: 6, after: 'scorp', type: 'kill', target: 'bandit', n: 8, noun: 'Haydut',
    desc: 'Harabelerdeki haydutlar kervanları soyuyor. 8 haydutu etkisiz hale getir.',
    reward: { exp: 900, gold: 300, gear: { base: 'CHEST_1', rarity: 2 } } },
  { id: 'caravan', name: 'Kaplan Dağları', giver: 'merchant', minLevel: 8, after: 'oasis', type: 'visit', target: 'Kaplan Dağları',
    desc: 'Şehirden çok uzakta, haritanın kenarında Kaplan Dağları var. Orayı keşfet ve haber getir. Dikkatli ol, kaplanlar çok güçlü!',
    reward: { exp: 1400, gold: 400, items: [['luck', 2], ['elx_a', 3], ['ms_str', 1]] } },
  { id: 'tigers', name: 'Kaplan Avı', giver: 'captain', minLevel: 13, after: 'bandit', type: 'kill', target: 'tiger', n: 10, noun: 'Kaplan',
    desc: 'Kaplan Dağları\'ndan inen kaplanlar çobanları korkutuyor. 10 kaplanı avla.',
    reward: { exp: 6000, gold: 900, items: [['hp2', 20], ['elx_a', 2]] } },
  { id: 'golem', name: 'Kum Devleri', giver: 'captain', minLevel: 15, after: 'tigers', type: 'kill', target: 'golem', n: 8, noun: 'Kum Devi',
    desc: 'Kaplan Dağları\'nın eteklerinde kum devleri uyandı. 8 devi yık; şehrin güvenliği sana emanet.',
    reward: { exp: 9000, gold: 1200, gear: { base: 'WEAPON_2', rarity: 1 }, items: [['astral', 1]] } },
  { id: 'tigergirl', name: 'Kaplan Kız', giver: 'captain', minLevel: 18, after: 'golem', type: 'kill', target: 'u_tiger', n: 1, noun: 'Kaplan Kız',
    desc: 'Dağların efendisi Kaplan Kız ortaya çıktığında bütün bölge titrer. Onu yen ve Jangan\'ın kahramanı ol! (Ortaya çıkınca duyurulur.)',
    reward: { exp: 15000, gold: 3000, gear: { base: 'CHEST_3', rarity: 2 }, items: [['astral', 2]] } },
  // --- Donwhang ---
  { id: 'dw_jackal', zone: 'donwhang', name: 'Çakal Sürüleri', giver: 'captain', minLevel: 20, type: 'kill', target: 'jackal', n: 12, noun: 'Çakal',
    desc: 'Donwhang\'a hoş geldin. Çakallar kervan develerine saldırıyor; 12 çakalı avla.',
    reward: { exp: 7000, gold: 1500, items: [['hp2', 30], ['mp2', 20]] } },
  { id: 'dw_scales', zone: 'donwhang', name: 'Yılan Pulları', giver: 'merchant', minLevel: 24, type: 'collect', target: 'q_scale', n: 8, noun: 'Yılan Pulu',
    desc: 'Yılan Kanyonu\'ndaki dev yılanların pulları iksirlerde kullanılır. 8 Yılan Pulu getir.',
    reward: { gold: 2500, gear: { base: 'WEAPON_4', rarity: 1 } } },
  { id: 'dw_oasis', zone: 'donwhang', name: 'Kayıp Vaha', giver: 'merchant', minLevel: 25, type: 'visit', target: 'Kayıp Vaha',
    desc: 'Eski kervancılar kuzeybatıda bir Kayıp Vaha\'dan söz eder. Bul ve yolu işaretle.',
    reward: { exp: 12000, gold: 1500, items: [['luck', 2]] } },
  { id: 'dw_fort', zone: 'donwhang', name: 'Haydut Kalesi', giver: 'captain', minLevel: 28, after: 'dw_jackal', type: 'kill', target: 'dbandit', n: 12, noun: 'Çöl Haydudu',
    desc: 'Çöl haydutları eski kalelere yerleşti. 12 haydutu yen.',
    reward: { exp: 20000, gold: 3000, items: [['elx_w', 3], ['elx_a', 3]] } },
  { id: 'dw_mummy', zone: 'donwhang', name: 'Uyanan Ölüler', giver: 'captain', minLevel: 32, after: 'dw_fort', type: 'kill', target: 'mummy', n: 12, noun: 'Mumya',
    desc: 'Mumya Çölü\'ndeki mezarlardan ölüler kalktı. 12 mumyayı toprağa geri gönder.',
    reward: { exp: 28000, gold: 3500, gear: { base: 'CHEST_4', rarity: 1 } } },
  { id: 'dw_uruchi', zone: 'donwhang', name: 'Uruchi', giver: 'captain', minLevel: 38, after: 'dw_mummy', type: 'kill', target: 'u_uruchi', n: 1, noun: 'Uruchi',
    desc: 'Kadim iblis Uruchi Mumya Çölü\'nde dolaşıyor. Onu yen!',
    reward: { exp: 60000, gold: 8000, gear: { base: 'WEAPON_5', rarity: 2 }, items: [['astral', 2]] } },
  // --- Hotan ---
  { id: 'ht_wolf', zone: 'hotan', name: 'Buz Kurtları', giver: 'captain', minLevel: 40, type: 'kill', target: 'icewolf', n: 12, noun: 'Buz Kurdu',
    desc: 'Hotan\'a hoş geldin. Buzul eteğindeki buz kurtlarını temizle.',
    reward: { exp: 25000, gold: 4000, items: [['hp4', 30], ['mp4', 20]] } },
  { id: 'ht_fur', zone: 'hotan', name: 'Yeti Postu', giver: 'merchant', minLevel: 43, type: 'collect', target: 'q_fur', n: 8, noun: 'Yeti Postu',
    desc: 'Kışlık kürk için 8 Kar Yetisi postu getir.',
    reward: { gold: 6000, gear: { base: 'CHEST_6', rarity: 1 } } },
  { id: 'ht_ghost', zone: 'hotan', name: 'Hayalet Ormanı', giver: 'captain', minLevel: 48, after: 'ht_wolf', type: 'kill', target: 'ghost', n: 15, noun: 'Hayalet Savaşçı',
    desc: 'Ormanın hayaletleri gece gündüz dolaşıyor. 15 hayalet savaşçıyı yok et.',
    reward: { exp: 45000, gold: 6000, items: [['elx_w', 4], ['elx_a', 4], ['ms_crit', 1]] } },
  { id: 'ht_pass', zone: 'hotan', name: 'Kunlun Geçidi', giver: 'merchant', minLevel: 55, type: 'visit', target: 'Kunlun Geçidi',
    desc: 'Batıya giden kervan yolu Kunlun Geçidi\'nden geçer. Geçide ulaş.',
    reward: { exp: 40000, gold: 5000, items: [['luck', 3]] } },
  { id: 'ht_golem', zone: 'hotan', name: 'Taş Devler', giver: 'captain', minLevel: 58, after: 'ht_ghost', type: 'kill', target: 'stonegolem', n: 12, noun: 'Taş Dev',
    desc: 'Kunlun Geçidi\'nde taş devler yolu kesiyor. 12 devi yık.',
    reward: { exp: 70000, gold: 9000, gear: { base: 'WEAPON_7', rarity: 1 } } },
  { id: 'ht_isyutaru', zone: 'hotan', name: 'Isyutaru', giver: 'captain', minLevel: 60, after: 'ht_golem', type: 'kill', target: 'u_isyutaru', n: 1, noun: 'Isyutaru',
    desc: 'Gölgelerin efendisi Isyutaru uyandı. Onu yen!',
    reward: { exp: 120000, gold: 15000, gear: { base: 'CHEST_8', rarity: 2 }, items: [['astral', 3]] } },
  { id: 'ht_demon', zone: 'hotan', name: 'Taklamakan Muhafızları', giver: 'captain', minLevel: 70, after: 'ht_isyutaru', type: 'kill', target: 'demon', n: 15, noun: 'Şeytan Muhafız',
    desc: 'Taklamakan çölünün kalbinde şeytan muhafızlar bekliyor. 15 muhafızı yen.',
    reward: { exp: 130000, gold: 20000, items: [['elx_w', 6], ['elx_a', 6], ['ms_str', 2], ['ms_int', 2]] } },
  { id: 'ht_yarkan', zone: 'hotan', name: 'Lord Yarkan', giver: 'captain', minLevel: 76, after: 'ht_demon', type: 'kill', target: 'u_yarkan', n: 1, noun: 'Lord Yarkan',
    desc: 'Taklamakan\'ın efendisi Lord Yarkan. İpek Yolu\'nun en büyük tehdidini yen ve efsane ol!',
    reward: { exp: 200000, gold: 50000, gear: { base: 'WEAPON_9', rarity: 3 }, items: [['astral', 5]] } },
  // --- Konstantinopolis (Avrupa başlangıcı) ---
  { id: 'cp_wolf', zone: 'constantinople', name: 'Desperado Kurtları', giver: 'captain', minLevel: 1, type: 'kill', target: 'gwolf', n: 6, noun: 'Gri Kurt',
    desc: 'Konstantinopolis\'e hoş geldin. Tepedeki gri kurtlar yolcuları korkutuyor. 6 tanesini avla.',
    reward: { exp: 70, gold: 60, items: [['hp1', 10]] } },
  { id: 'cp_antler', zone: 'constantinople', name: 'Geyik Boynuzu', giver: 'merchant', minLevel: 3, type: 'collect', target: 'q_antler', n: 5, noun: 'Geyik Boynuzu',
    desc: 'İlaç için 5 yaban geyiği boynuzu getir.',
    reward: { gold: 150, gear: { base: 'necklace_1', rarity: 0 } } },
  { id: 'cp_goblin', zone: 'constantinople', name: 'Alacakaranlık Goblinleri', giver: 'captain', minLevel: 10, after: 'cp_wolf', type: 'kill', target: 'goblin', n: 12, noun: 'Goblin',
    desc: 'Ormandaki goblinler köyleri yağmalıyor. 12 goblini yen.',
    reward: { exp: 2500, gold: 600, gear: { base: 'WEAPON_2', rarity: 0 } } },
  { id: 'cp_visit', zone: 'constantinople', name: 'Tanrılar Bahçesi', giver: 'merchant', minLevel: 18, type: 'visit', target: 'Tanrılar Bahçesi',
    desc: 'Eski tapınakların bahçesine git ve gördüklerini anlat.',
    reward: { exp: 4000, gold: 900, items: [['elx_w', 2]] } },
  { id: 'cp_orc', zone: 'constantinople', name: 'Ork Akını', giver: 'captain', minLevel: 21, after: 'cp_goblin', type: 'kill', target: 'orc', n: 12, noun: 'Ork Savaşçısı',
    desc: 'Orklar Tanrılar Bahçesi\'ni ele geçirdi. 12 ork savaşçısını yen.',
    reward: { exp: 9000, gold: 1800, gear: { base: 'CHEST_3', rarity: 1 } } },
  { id: 'cp_cerberus', zone: 'constantinople', name: 'Cerberus', giver: 'captain', minLevel: 24, after: 'cp_orc', type: 'kill', target: 'u_cerberus', n: 1, noun: 'Cerberus',
    desc: 'Yeraltının bekçisi Cerberus bahçede görüldü. Onu yen!',
    reward: { exp: 15000, gold: 3000, gear: { base: 'WEAPON_4', rarity: 2 } } },
  // --- Küçük Asya ---
  { id: 'am_spider', zone: 'asiaminor', name: 'Örümcek Yuvası', giver: 'captain', minLevel: 30, type: 'kill', target: 'spider', n: 12, noun: 'Dev Örümcek',
    desc: 'Kleopatra Kapısı örümcek ağlarıyla kaplandı. 12 dev örümceği temizle.',
    reward: { exp: 14000, gold: 2400, items: [['hp4', 20]] } },
  { id: 'am_silk', zone: 'asiaminor', name: 'Örümcek İpeği', giver: 'merchant', minLevel: 31, type: 'collect', target: 'q_silk', n: 8, noun: 'Örümcek İpeği',
    desc: 'Terziler sağlam ip istiyor. 8 örümcek ipeği getir.',
    reward: { gold: 3500, gear: { base: 'CHEST_5', rarity: 0 } } },
  { id: 'am_raptor', zone: 'asiaminor', name: 'Amfitiyatro', giver: 'captain', minLevel: 38, after: 'am_spider', type: 'kill', target: 'raptor', n: 14, noun: 'Pençe Kertenkele',
    desc: 'Eski amfitiyatroda pençe kertenkeleler yuva yaptı. 14 tanesini avla.',
    reward: { exp: 26000, gold: 4000, gear: { base: 'WEAPON_5', rarity: 1 } } },
  { id: 'am_ivy', zone: 'asiaminor', name: 'Kaptan Ivy', giver: 'captain', minLevel: 45, after: 'am_raptor', type: 'kill', target: 'u_ivy', n: 1, noun: 'Kaptan Ivy',
    desc: 'Korsanların lideri Kaptan Ivy Haran Kulesi\'nde. Onu durdur!',
    reward: { exp: 60000, gold: 9000, gear: { base: 'CHEST_6', rarity: 2 }, items: [['astral', 2]] } },
  { id: 'am_orc', zone: 'asiaminor', name: 'Kara Orklar', giver: 'captain', minLevel: 48, after: 'am_ivy', type: 'kill', target: 'darkorc', n: 15, noun: 'Kara Ork',
    desc: 'Haran Kulesi\'ndeki kara orklar kervan yolunu kesiyor. 15 tanesini yen.',
    reward: { exp: 55000, gold: 8000, items: [['elx_w', 4], ['elx_a', 4]] } },
  // --- Semerkant ---
  { id: 'sm_raptor', zone: 'samarkand', name: 'Bozkır Kertenkeleleri', giver: 'captain', minLevel: 75, type: 'kill', target: 'raptor2', n: 15, noun: 'Bozkır Kertenkelesi',
    desc: 'Semerkant\'a hoş geldin. Bozkırdaki kertenkeleler kervanlara saldırıyor.',
    reward: { exp: 180000, gold: 24000, items: [['hp6', 30], ['mp6', 20]] } },
  { id: 'sm_feather', zone: 'samarkand', name: 'Roc Tüyü', giver: 'merchant', minLevel: 88, type: 'collect', target: 'q_feather', n: 8, noun: 'Roc Tüyü',
    desc: 'Pençe Zirvesi\'nin kaya yarasaları Roc tüyü taşır. 8 tane getir.',
    reward: { gold: 40000, gear: { base: 'CHEST_9', rarity: 1 } } },
  { id: 'sm_ninja', zone: 'samarkand', name: 'Gölge Suikastçılar', giver: 'captain', minLevel: 82, after: 'sm_raptor', type: 'kill', target: 'ninja', n: 15, noun: 'Gölge Suikastçı',
    desc: 'Kalp Zirvesi\'nde gölge suikastçılar tuzak kuruyor. 15 tanesini yen.',
    reward: { exp: 220000, gold: 32000, gear: { base: 'WEAPON_9', rarity: 1 } } },
  { id: 'sm_shaitan', zone: 'samarkand', name: 'Demon Shaitan', giver: 'captain', minLevel: 90, after: 'sm_ninja', type: 'kill', target: 'u_shaitan', n: 1, noun: 'Demon Shaitan',
    desc: 'Roc Dağı\'nın şeytanı Demon Shaitan uyandı!',
    reward: { exp: 450000, gold: 60000, gear: { base: 'WEAPON_10', rarity: 2 }, items: [['astral', 3]] } },
  { id: 'sm_roc', zone: 'samarkand', name: 'Kanat Zirvesi\'nin Efendisi', giver: 'captain', minLevel: 95, after: 'sm_shaitan', type: 'kill', target: 'u_roc', n: 1, noun: 'Roc',
    desc: 'Dev kuş Roc zirvelerin üstünde dolaşıyor. Onu indir!',
    reward: { exp: 600000, gold: 80000, gear: { base: 'CHEST_10', rarity: 3 } } },
  // --- Qin-Shi Mezarı ---
  { id: 'qs_clay', zone: 'tomb1', name: 'Toprak Ordu', giver: 'tele', minLevel: 90, type: 'collect', target: 'q_clay', n: 10, noun: 'Toprak Asker Parçası',
    desc: 'Mezarın toprak askerleri canlandı. Kırdığın askerlerden 10 parça getir.',
    reward: { exp: 300000, gold: 50000, items: [['elx_w', 6], ['luck', 4]] } },
  { id: 'qs_medusa', zone: 'tomb2', name: 'Medusa', giver: 'tele', minLevel: 103, type: 'kill', target: 'u_medusa', n: 1, noun: 'Medusa',
    desc: 'Mezarın en derin odasında Medusa bekliyor. Gözlerine bakmadan onu yen!',
    reward: { exp: 900000, gold: 150000, gear: { base: 'WEAPON_11', rarity: 3 } } },
  // --- İskenderiye ---
  { id: 'ex_mummy', zone: 'alexandria', name: 'Firavun Muhafızları', giver: 'captain', minLevel: 101, type: 'kill', target: 'mummy2', n: 15, noun: 'Firavun Muhafızı',
    desc: 'İskenderiye\'ye hoş geldin. Nil kıyısında uyanan muhafızları durdur.',
    reward: { exp: 400000, gold: 90000, items: [['hp7', 30], ['mp7', 20]] } },
  { id: 'ex_scarab', zone: 'alexandria', name: 'Bokböceği Kabuğu', giver: 'merchant', minLevel: 104, type: 'collect', target: 'q_scarab', n: 10, noun: 'Bokböceği Kabuğu',
    desc: 'Mücevherciler kutsal bokböceği kabuğu istiyor. 10 tane getir.',
    reward: { gold: 120000, gear: { base: 'CHEST_11', rarity: 1 } } },
  { id: 'ex_anubis', zone: 'alexandria', name: 'Krallar Vadisi', giver: 'captain', minLevel: 108, after: 'ex_mummy', type: 'kill', target: 'anubisw', n: 15, noun: 'Anubis Askeri',
    desc: 'Krallar Vadisi\'ni Anubis askerleri koruyor. 15 tanesini yen.',
    reward: { exp: 600000, gold: 140000, gear: { base: 'WEAPON_11', rarity: 1 } } },
  { id: 'ex_sphinx', zone: 'alexandria', name: 'Sfenks', giver: 'captain', minLevel: 118, after: 'ex_anubis', type: 'kill', target: 'u_sphinx', n: 1, noun: 'Sfenks',
    desc: 'Firavun Çölü\'nün bekçisi Sfenks bilmecesiyle yolcuları yutuyor.',
    reward: { exp: 1200000, gold: 250000, gear: { base: 'WEAPON_12', rarity: 3 } } },
  { id: 'hw_seth', zone: 'holywater', name: 'Kutsal Su', giver: 'tele', minLevel: 118, type: 'kill', target: 'u_seth', n: 1, noun: 'Seth',
    desc: 'Kaos tanrısı Seth tapınağın kutsal suyunu zehirledi. Onu yen!',
    reward: { exp: 1500000, gold: 300000, gear: { base: 'CHEST_12', rarity: 3 }, items: [['immortal', 1]] } },
  { id: 'jp_jupiter', zone: 'jupiter', name: 'Tanrıların Tahtı', giver: 'tele', minLevel: 128, type: 'kill', target: 'u_jupiter', n: 1, noun: 'Jüpiter',
    desc: 'Jüpiter tahtında ölümlüleri bekliyor. Tanrıların kralını yen!',
    reward: { exp: 2000000, gold: 500000, gear: { base: 'WEAPON_13', rarity: 3 } } },
  // --- Şambala ---
  { id: 'sh_wolf', zone: 'shambhala', name: 'Donmuş Kıyı', giver: 'captain', minLevel: 131, type: 'kill', target: 'frostwolf', n: 15, noun: 'Ayaz Kurdu',
    desc: 'Şambala\'ya ulaşan pek az gezgin var. Ayaz kurtlarını temizle.',
    reward: { exp: 1500000, gold: 400000, items: [['hp7', 50], ['mp7', 40]] } },
  { id: 'sh_ember', zone: 'shambhala', name: 'Sönmez Kor', giver: 'merchant', minLevel: 136, type: 'collect', target: 'q_ember', n: 10, noun: 'Sönmez Kor',
    desc: 'Lav şeytanlarının kalbindeki koru topla. 10 tane getir.',
    reward: { gold: 600000, gear: { base: 'CHEST_14', rarity: 2 } } },
  { id: 'sh_queen', zone: 'icetemple', name: 'Buz Kraliçesi', giver: 'tele', minLevel: 135, type: 'kill', target: 'u_frostqueen', n: 1, noun: 'Buz Kraliçesi',
    desc: 'Buz Tapınağı\'nın kraliçesi ebedi kışı getirmek istiyor.',
    reward: { exp: 3000000, gold: 800000, gear: { base: 'WEAPON_14', rarity: 3 } } },
  { id: 'sh_flame', zone: 'firetemple', name: 'Alev Lordu', giver: 'tele', minLevel: 140, type: 'kill', target: 'u_flamelord', n: 1, noun: 'Alev Lordu',
    desc: 'Ateş Tapınağı\'nın lordu Şambala\'yı yakmak üzere. Son savaşa hazır ol!',
    reward: { exp: 0, gold: 1500000, gear: { base: 'CHEST_14', rarity: 4 }, items: [['immortal', 3]] } }
];
QUEST_DEFS.forEach(q => { q.zone = q.zone || 'jangan'; });

class QuestManager {
  constructor(player, hud, world) {
    this.p = player; this.hud = hud; this.world = world;
    this.combat = null;
    this.state = {};          // id -> { s: 'active'|'ready'|'done', p: ilerleme }
    this.region = null;
    this.onChange = null;
    this.defs = QUEST_DEFS;
  }

  def(id) { return this.defs.find(q => q.id === id); }
  _changed() { if (this.onChange) this.onChange(); }

  // none | locked | active | ready | done
  status(q) {
    const st = this.state[q.id];
    if (st) return st.s;
    if (this.p.stats.level < q.minLevel) return 'locked';
    if (q.after && !(this.state[q.after] && this.state[q.after].s === 'done')) return 'locked';
    return 'none';
  }
  lockText(q) {
    if (this.p.stats.level < q.minLevel) return 'Sv. ' + q.minLevel + ' gerekli';
    if (q.after) { const a = this.def(q.after); return 'Önce: ' + a.name; }
    return '';
  }
  progress(q) { const st = this.state[q.id]; return st ? st.p : 0; }
  need(q) { return q.n || 1; }
  turnTo(q) { return q.type === 'deliver' ? q.to : q.giver; }

  accept(id) {
    const q = this.def(id);
    if (!q || this.status(q) !== 'none') return { ok: false, msg: 'Bu görev şu an alınamaz.' };
    this.state[id] = { s: 'active', p: 0 };
    if (q.type === 'deliver') this.state[id] = { s: 'ready', p: 1 };
    this.hud.log('Görev alındı: ' + q.name, 'lvl');
    SFX.play('quest');
    if (q.type === 'visit' && this.region === q.target) this._add(q, 1);   // zaten oradaysa
    if (q.type === 'collect') this._syncCollect();
    this._changed();
    return { ok: true, msg: 'Görev alındı: ' + q.name };
  }

  _add(q, n) {
    const st = this.state[q.id];
    if (!st || st.s !== 'active') return;
    st.p = Math.min(this.need(q), st.p + n);
    if (st.p >= this.need(q)) {
      st.s = 'ready';
      this.hud.log('Görev tamamlandı: ' + q.name + ' — ödül için ' + this._npcName(this.turnTo(q)) + '\'e dön.', 'lvl');
      if (this.hud.banner) this.hud.banner('Görev Tamamlandı', q.name, 'quest');
      SFX.play('questdone');
    } else this.hud.log(q.name + ': ' + st.p + '/' + this.need(q), 'sys', '#ffe08a');
    this._changed();
  }

  _npcName(id, zone = CUR_ZONE_ID) { return (ZONES[zone].npc && ZONES[zone].npc[id]) || id; }

  onKill(typeKey) { for (const q of this.defs) if (q.type === 'kill' && q.target === typeKey) this._add(q, 1); }
  onCollect() { this._syncCollect(); }
  // Toplama görevleri: ilerleme = envanterdeki adet
  _syncCollect() {
    for (const q of this.defs) {
      if (q.type !== 'collect') continue;
      const st = this.state[q.id];
      if (!st || st.s === 'done') continue;
      const c = Math.min(q.n, this.p.inv.count(q.target));
      if (c !== st.p) {
        const was = st.s;
        st.p = c; st.s = c >= q.n ? 'ready' : 'active';
        if (st.s === 'ready' && was !== 'ready') {
          this.hud.log('Görev tamamlandı: ' + q.name + ' — ödül için ' + this._npcName(this.turnTo(q)) + '\'e dön.', 'lvl');
          if (this.hud.banner) this.hud.banner('Görev Tamamlandı', q.name, 'quest');
          SFX.play('questdone');
        } else if (st.s === 'active') this.hud.log(q.name + ': ' + c + '/' + q.n, 'sys', '#ffe08a');
        this._changed();
      }
    }
  }
  onVisit(region) { for (const q of this.defs) if (q.type === 'visit' && q.target === region) this._add(q, 1); }

  // Bu görev eşyasını isteyen aktif görev var mı (düşme için)
  wantsItem(base) {
    return this.defs.some(q => q.type === 'collect' && q.target === base && this.state[q.id] && this.state[q.id].s === 'active');
  }
  // 'WEAPON_d' / 'CHEST_d' → oyuncunun türüne göre gerçek eşya
  _gearBase(base) {
    const m = /^(WEAPON|CHEST)_(\d+)$/.exec(base);
    if (!m) return base;
    if (m[1] === 'WEAPON') return (this.p.inv.weaponType() || 'blade') + '_' + m[2];
    const ch = this.p.inv.equip.chest; return 'chest_' + (ch ? ITEM_BASES[ch.base].atype : 'protector') + '_' + m[2];
  }

  // Ödül metni
  rewardText(q) {
    const r = q.reward, a = [];
    if (r.exp) a.push(r.exp + ' EXP');
    if (r.gold) a.push(r.gold + ' altın');
    for (const [b, n] of r.items || []) a.push(ITEM_BASES[b].name + (n > 1 ? ' x' + n : ''));
    if (r.gear) { const g = this._gearBase(r.gear.base); a.push((r.gear.rarity ? RARITY[r.gear.rarity].name + ' ' : '') + ITEM_BASES[g].name); }
    return a.join(' · ');
  }

  turnIn(id) {
    const q = this.def(id), st = this.state[id];
    if (!q || !st || st.s !== 'ready') return { ok: false, msg: 'Teslim edilecek görev yok.' };
    const r = q.reward, s = this.p.stats, inv = this.p.inv;
    const need = (r.gear ? 1 : 0) + (r.items || []).length;
    if (inv.freeCount() < need) return { ok: false, msg: 'Envanterde ' + need + ' boş yer gerekli.' };
    if (q.type === 'collect' && !inv.take(q.target, q.n)) return { ok: false, msg: 'Görev eşyaları eksik.' };
    st.s = 'done';
    if (r.gold) { s.gold += r.gold; Eco.inc('quest', r.gold); }
    s.silk = (s.silk || 0) + 10;
    for (const [b, n] of r.items || []) inv.add(makeStack(b, n));
    if (r.gear) { const g = this._gearBase(r.gear.base); inv.add(makeItem(g, r.gear.rarity, 0, rollBlues(g, r.gear.rarity))); }
    if (r.exp && this.combat) { this.combat.fx(this.p, '+' + r.exp + ' EXP', 'exp'); this.combat.gainExp(r.exp); }
    SFX.play('levelup');
    this.hud.log('Görev teslim edildi: ' + q.name + ' (' + this.rewardText(q) + ')', 'lvl');
    this._changed();
    return { ok: true, msg: q.name + ' tamamlandı! ' + this.rewardText(q) + ' · 10 Silk' };
  }

  // Bir NPC'nin penceresinde gösterilecek görevler
  forNpc(npcId) {
    const out = [];
    for (const q of this.defs) {
      if (q.zone !== CUR_ZONE_ID) continue;
      const s = this.status(q);
      if (q.giver === npcId && (s === 'none' || s === 'locked' || s === 'active')) out.push({ q, s });
      else if (this.turnTo(q) === npcId && s === 'ready') out.push({ q, s });
    }
    return out;
  }

  // NPC başındaki işaret: '?' teslim edilecek, '!' alınabilir görev
  markerFor(npcId) {
    let m = null;
    for (const q of this.defs) {
      if (q.zone !== CUR_ZONE_ID) continue;
      const s = this.status(q);
      if (s === 'ready' && this.turnTo(q) === npcId) return '?';
      if (s === 'none' && q.giver === npcId) m = '!';
    }
    return m;
  }

  activeList() { return this.defs.filter(q => this.state[q.id] && this.state[q.id].s !== 'done'); }
  activeTargets() { return this.activeList().filter(q => q.type === 'visit' && this.state[q.id].s === 'active').map(q => q.target); }
  doneCount() { return this.defs.filter(q => this.state[q.id] && this.state[q.id].s === 'done').length; }

  objectiveText(q) {
    const st = this.state[q.id];
    if (st.s === 'ready') return 'Tamamlandı — ' + this._npcName(this.turnTo(q), q.zone) + '\'e git';
    if (q.type === 'kill' || q.type === 'collect') return q.noun + ': ' + st.p + '/' + q.n;
    if (q.type === 'visit') return q.target + ' bölgesini keşfet';
    return '';
  }

  trackerHTML() {
    const list = this.activeList().sort((a, b) => (a.zone === CUR_ZONE_ID ? 0 : 1) - (b.zone === CUR_ZONE_ID ? 0 : 1)).slice(0, 4);
    if (!list.length) return '';
    return list.map(q => '<div class="tq' + (this.state[q.id].s === 'ready' ? ' ok' : '') + '"><b>' + q.name + (q.zone !== CUR_ZONE_ID ? ' <small>(' + ZONES[q.zone].name + ')</small>' : '') + '</b><span>' + this.objectiveText(q) + '</span></div>').join('');
  }

  // Her karede: bölge takibi
  update() {
    this._syncT = (this._syncT || 0) + 1;
    if (this._syncT % 20 === 0) this._syncCollect();
    const r = regionAt(this.p.pos.x, this.p.pos.z);
    if (r !== this.region) {
      const first = this.region === null;
      this.region = r;
      if (!first && this.hud.banner) { this.hud.banner(r, REGION_LEVELS[r] || '', 'region'); SFX.play('region'); }
      this.onVisit(r);
    }
  }

  serialize() { return JSON.parse(JSON.stringify(this.state)); }
  load(data) {
    this.state = {};
    if (!data || typeof data !== 'object') return;
    if (data.stones && !data.fangs) data.fangs = data.stones;     // eski kayıt
    for (const q of this.defs) {
      const st = data[q.id];
      if (st && ['active', 'ready', 'done'].includes(st.s)) this.state[q.id] = { s: st.s, p: Math.max(0, st.p | 0) };
    }
    this._changed();
  }
}
