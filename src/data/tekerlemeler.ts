export const TEKERLEME_DURATION_SEC = 180;

export interface TekerlemeItem {
  id: string;
  title: string;
  text: string;
  /** Zorluk: tekrarlayan ses / uzun kelime yoğunluğu */
  level: 'kolay' | 'orta' | 'zor';
}

export const TEKERLEMELER: TekerlemeItem[] = [
  {
    id: 'degirmen',
    title: 'Değirmenci Köpek',
    level: 'orta',
    text:
      'değirmene girdi köpek değirmenci vurdu kötek hem kepek yedi köpek hem kötek yedi köpek değirmene girdi köpek değirmenci kovdu köpek değirmenin önünde durdu köpek değirmenci dedi ki bu köpek değirmene girer değirmenin ununu yer değirmenci dedi ki bu köpek değirmenden gitmez değirmenci köpeği kovdu köpek gitmedi köpek değirmenin önünde durdu değirmenci dedi ki bu köpek değirmenci değirmeni değirmen köpeği değirmenci köpeği tekrar kovdu köpek değirmenden uzaklaştı değirmenci değirmenin kapısını kapadı değirmenci dedi ki artık köpek değirmene giremez değirmenci değirmenin önünde durdu köpek değirmene baktı değirmenci köpeğe baktı değirmenci dedi ki bu değirmen benim köpek dedi ki bu kepek benim değirmenci köpeği bir daha kovdu köpek değirmenden uzaklaştı değirmenci değirmene girdi değirmen unu üğüttü değirmenci değirmen unu çuvalladı değirmenci dedi ki değirmenci değirmen değirmen değirmenci köpek dedi ki kepek değirmen değirmen kepek değirmenci köpeği bir daha gördü köpeği bir daha kovdu köpek bir daha geldi köpek bir daha kovuldu değirmenci dedi ki bu köpek değirmene bağlı değirmen köpeğe bağlı köpek kepeğe bağlı kepek değirmene bağlı değirmenci dedi ki yeter artık değirmenden git köpek dedi ki kepeği ver gideyim değirmenci kepeği verdi köpek kepeği aldı köpek değirmenden gitti değirmenci değirmeni kapattı değirmenci evine gitti köpek kepeği yedi değirmenci dedi ki bu değirmen bu köpek bu kepek bu değirmenci hep birbirine bağlı değirmenci değirmen değirmen köpek köpek kepek kepek değirmenci',
  },

  {
    id: 'sasi-sahin',
    title: 'Şaşı Şahin Saatçi',
    level: 'zor',
    text:
      'şu köşe yaz köşesi şu köşe kış köşesi ortada su şişesi şu köşe yaz köşesi şu köşe kış köşesi ortada su şişesi şaşı şahin saatçi saati sayar saatçi şaşı şahine saati satar şaşı şahin saatçinin sattığı saati sayar şaşı şahin saatçi şaşı şahin saatçinin saatini şaşırarak sayar şaşı şahin saatçi şaşı şahinin saatini şaşırmadan sayar şu köşe yaz köşesi şu köşe kış köşesi ortada su şişesi şaşı şahin saatçi saati sattı şaşı şahin saatçi saati satın aldı şaşı şahin saatçi şaşı şahin saatçinin sattığı şaşı saati şaşırarak satın aldı şu köşe yaz köşesi şu köşe kış köşesi ortada su şişesi şaşı şahin saatçi şaşı şahin saatçiye şaşı şahin saatçinin şaşı saatini şaşırmadan sattı şaşı şahin saatçi şaşırarak şaşı saati sattı şaşırarak şaşı saati satın aldı şu köşe yaz köşesi şu köşe kış köşesi ortada su şişesi şaşı şahin saatçi saati şaşırdı saatçi şaşı şahini şaşırdı şaşı şahin saatçinin şaşı saati şaşı şahinin şaşı saatine benzedi şaşı şahin saatçi şaşı şahin saatçiye şaşı saati şaşırmadan verdi saatçi şaşı saati şaşırarak aldı şu köşe yaz köşesi şu köşe kış köşesi ortada su şişesi şaşı şahin saatçi saati sayar şaşı şahin saatçi saati satar şaşı şahin saatçi saati alır şaşı şahin saatçi saati verir şaşı şahin şaşı saatçi şaşı saat şaşı şahin saatçi şaşı şahin saatçiye şaşı saati şaşırmadan sayarak verdi şu köşe yaz köşesi şu köşe kış köşesi ortada su şişesi',
  },

  {
    id: 'pasa-tasi',
    title: 'Paşa Taşıyıcı',
    level: 'orta',
    text:
      'pireli peyniri perhizli pireler tepelerse pireli peynirler de pırtlar pireli peyniri perhizli pireler tepmese pireli peynirler de pırtlamaz paşa taşı taşıyamaz taşı taşımayan paşa paşalıktan istifa eder paşa taşı taşırsa paşalığı sürer paşanın taşı paşaya ağır gelir paşa taşı taşıyana paşa taşıyıcı denir paşa taşıyıcı paşanın taşını taşır paşa taşıyıcının taşıdığı taş paşanın taşıdır pireli peyniri perhizli pireler tepelerse pireli peynirler de pırtlar paşa taşı taşıyamaz taşıyıcı taşır taşıyıcı taşıyamazsa taşı bırakır taş yere düşer taş kırılır kırılan taş tamir edilmez tamir edilmeyen taş atılır atılan taş geri gelmez pireli peyniri perhizli pireler tepelerse pireli peynirler de pırtlar paşa paşalıktan vazgeçer taşıyıcı taşımaktan vazgeçer taş yerde kalır pireli peyniri perhizli pireler tepmese pireli peynirler de pırtlamaz paşanın taşı paşanın taşıyıcısı paşanın paşalığı hep bir arada paşa taşı taşıyamadığında taşıyıcı yardım eder taşıyıcı taşıyamadığında paşa yardım eder ikisi birlikte taşı taşır taşı yerine koyar pireli peynir pırtlamaz perhizli pire tepmez paşa taşı taşır taşıyıcı paşanın yardımcısı olur paşa taşıyıcının destekçisi olur pireli peyniri perhizli pireler tepelerse pireli peynirler de pırtlar pireli peyniri perhizli pireler tepmese pireli peynirler de pırtlamaz paşa taşı taşır taşıyıcı paşayı destekler paşa paşalığını sürdürür taşıyıcı taşıyıcılığını sürdürür taş yerini korur',
  },

  {
    id: 'gemicik',
    title: 'Gemicik Gemici',
    level: 'kolay',
    text:
      'bu yoğurdu sarımsaklasak da mı saklasak sarımsaklamasak da mı saklasak bu yoğurdu sarımsaklasak da mı saklasak sarımsaklamasak da mı saklasak gemicik geminin gemicisidir gemici gemiyi yürütür gemi denizde yüzer deniz gemiyi taşır gemici gemiyi sevdiği için geminin başında durur geminin direği yüksektir geminin yelkeni geniştir geminin gemicisi gemiye baktıkça sevinir gemi gemicisini sevdikçe yürür bu yoğurdu sarımsaklasak da mı saklasak sarımsaklamasak da mı saklasak gemi limana yanaştı gemici gemiden indi gemici limanda dolaştı gemici gemiyi gözden kaçırmadı gemi limanda bekledi gemici geri döndü gemici gemiye bindi gemi tekrar denize açıldı bu yoğurdu sarımsaklasak da mı saklasak sarımsaklamasak da mı saklasak gemi denizde yüzdü gemici gemiyi sevdi gemi gemicisini sevdi deniz gemiyi taşıdı gemicik gemicisi gemi gemici gemi gemicik bu yoğurdu sarımsaklasak da mı saklasak sarımsaklamasak da mı saklasak gemici denize baktı dalga geldi gemi sallandı gemici şaşırmadı gemiyi yönetti gemi düzeldi yoluna devam etti gemi limandan limana gitti gemici limandan limana gitti gemicik gemicisi gemi gemi gemici gemicik bu yoğurdu sarımsaklasak da mı saklasak sarımsaklamasak da mı saklasak gemici akşam evine döndü gemiyi limanda bıraktı gemicik gemiye bekçi oldu gemi geceyi limanda geçirdi sabah gemici geri geldi gemi tekrar yola çıktı',
  },

  {
    id: 'catalca',
    title: 'Çatalca Çatalcı',
    level: 'orta',
    text:
      'çatalca çatalcı çatal yapar çatalcı çatalcıya çatal satar çatalcının çatalı çatalcaya satılır çatalca çatalcı çatal yapar çatalcı çatalcıya çatal satar çatalcının çatalı çatalcaya satılır çatalcının çatalı sağlam çatalcının kaşığı sağlam çatalcının bıçağı sağlam çatalcı çatalca çatallarını çatalcaya gönderir çatalcalılar çatalcının çatallarını alır çatalcalılar çatallarla yemek yer çatalca çatalcı çatal yapar çatalcı çatalcıya çatal satar çatalcının çatalı çatalcaya satılır çatalca çatalı çatalcının çatalcısı çatallar çatalcaya çatallar çatalcının çatalları çatalcaya gider çatallar çatalcı çatalca çatalca çatalcı çatal çatal çatalcı çatalcıya çatal satarken çatalı düşürür çatal yere düşer çatalcı çatalı alır temizler tekrar satar çatalca çatalcı çatal yapar çatalcı çatalcıya çatal satar çatalcının çatalı çatalcaya satılır çatalca çatalca çatalca çatalcı çatalcı çatalcı çatallar çatallar çatallar çatalcının çatalları çatalcanın çatalcılarına çatalcanın çatalcıları çatalcaya çatalcıların çatalları çatalcının çatalcıları çatal çatal çatal çatalca çatalcı çatal çatalcı çatal çatalcı çatal çatalca çatalcı çatal yapar çatalcı çatalcıya çatal satar çatalcının çatalı çatalcaya satılır çatalcının yaptığı çatallar dayanıklıdır çatalcalılar çatalcının çatallarını sever çatalcının dükkanı her gün açık çatalcı her gün çatal yapar her gün çatal satar',
  },

  {
    id: 'kara-kalpakli',
    title: 'Kara Kalpaklı Kahveci',
    level: 'zor',
    text:
      'kara kalpaklı kavaklı kahveci karısı kara kalpaklı kavaklı kahvecinin kara kahvesini karıştırırken kara kalpaklı kavaklı kahveciye karışmadan kahveyi karıştırdı kara kalpaklı kavaklı kahveci karısı kara kalpaklı kavaklı kahvecinin kara kahvesini kavradı kara kalpaklı kavaklı kahvecinin karısı kara kahveyi karaca karıştırdı kara kalpaklı kavaklı kahveci karısına dedi ki kahveyi karıştırma karılma karışmadan dur kara kalpaklı kavaklı kahveci karısı dedi ki karışmıyorum karılmıyorum sadece karıştırıyorum kara kalpaklı kavaklı kahveci kahveyi aldı içti içtikten sonra dedi ki bu kahve çok karışık çok kara çok kuvvetli kara kalpaklı kavaklı kahveci karısı dedi ki ben karıştırdığım için karışık ben karaca karıştırdığım için kara ben kuvvetli karıştırdığım için kuvvetli kara kalpaklı kavaklı kahveci kahveyi bitirdi kalpağını giydi kavaklı yola çıktı kara kalpaklı kavaklı kahveci karısı kahvehanede kaldı kahvehaneyi temizledi kara kalpaklı kavaklı kahvecinin karısı kara kalpaklı kavaklı kahveciye telefon etti dedi ki kahveni unuttun kara kalpaklı kavaklı kahveci geri döndü kahvesini aldı tekrar kavaklı yola çıktı kara kalpaklı kavaklı kahveci karısı arkasından baktı güldü kara kalpaklı kavaklı kahveci karısı kara kalpaklı kavaklı kahvecinin kara kahvesini karıştırırken kara kalpaklı kavaklı kahveciye karışmadan kahveyi karıştırdı kara kalpaklı kavaklı kahveci akşam evine döndü karısını öptü teşekkür etti kahvenin tadına bayıldığını söyledi karısı sevindi yeni bir kahve daha pişirdi',
  },

  {
    id: 'lale-leyla',
    title: 'Lale ile Leyla',
    level: 'orta',
    text:
      'lale ile leyla limonluğa girdiler limonluktan limon kopardılar lalenin kopardığı limon leylanın kopardığı limondan büyüktü leyla laleye dedi ki senin limonun benimkinden büyük lale leylaya dedi ki sen daha küçük bir limon kopardığın için lale ile leyla limonluktan çıktılar limonları yıkadılar limonları kestiler limonlardan limonata yaptılar lalenin limonatası tatlı oldu leylanın limonatası ekşi oldu lale leylaya limon ekledi leyla laleye şeker ekledi sonunda iki limonata da güzel oldu lale ile leyla limonluğa girdiler limonluktan limon kopardılar limonluğun limonları parlaktı limonluğun limonları kokuluydu limonluğun limonları sarıydı lale ile leyla limonluğun limonlarını çok sevdiler limonluğun limoncusu geldi limoncu dedi ki kim koparıyor limonları lale ile leyla utandılar limoncuya özür dilediler limoncu güldü dedi ki alın istediğiniz kadar lale ile leyla sevindiler birkaç limon daha kopardılar limonluktan çıktılar evlerine gittiler evlerinde limonata yaptılar limonatayı içtiler birbirlerine teşekkür ettiler lale ile leyla limonluğa girdiler limonluktan limon kopardılar lale ile leyla limonata yaptılar lale ile leyla limonatayı içtiler lale ile leyla mutlu oldular ertesi gün lale ile leyla yine limonluğa gittiler limoncuya merhaba dediler limoncu onlara taze limonlar verdi',
  },

  {
    id: 'kara-kus',
    title: 'Kara Kuş Kara Dal',
    level: 'kolay',
    text:
      'dal kalkar kartal sarkar kartal kalkar dal sarkar dal kalkar kartal sarkar kartal kalkar dal sarkar kara kuş kara dalda durur kara dal kara kuşu taşır kara kuş kara dalda öter kara dal kara kuşa sallanır kara kuş kara dalı sever kara dal kara kuşu sever ikisi birlikte yaşar dal kalkar kartal sarkar kartal kalkar dal sarkar kara kuş kanat çırpar kara dal yaprak döker kara kuş uçar gider kara dal yerde kalır kara kuş geri döner kara dala konar kara dal kara kuşu karşılar kara kuş kara dala selam verir kara dal kara kuşa cevap verir dal kalkar kartal sarkar kartal kalkar dal sarkar kara kuş kara dalda yuva yapar yuvada yumurta olur yumurtadan yavru çıkar yavru büyür uçar gider kara kuş yine yalnız kalır kara dal yine yaprak döker kara kuş yine öter dal kalkar kartal sarkar kartal kalkar dal sarkar kara kuş kara dal kara kuş kara dal kara kuş kara dal dal kalkar kartal sarkar kartal kalkar dal sarkar kara kuş yağmurda ıslandı kara dal kara kuşu kanatlarıyla korudu yağmur dindi güneş açtı kara kuş kuruyana kadar kara dalda bekledi dal kalkar kartal sarkar kartal kalkar dal sarkar',
  },

  {
    id: 'pul-pul',
    title: 'Pul Pul Pulluk',
    level: 'zor',
    text:
      'pul pul pulluk pulluk pul pul pulluğu pulladım pulluğun pulları pul pul oldu pulladıkça pulluk pullandı pullandıkça pulluk parladı parladıkça pulluk göründü pul pul pulluk pulluk pul pul pulluğu pullayan pullayıcı pullayıcının pulları parlak pullayıcı pulluğu pullarken pul pul pullandı pullandığını gören pullayıcı pullamayı bıraktı pulluk pullandı pullayıcı pullamayı bitirdi pul pul pulluk pulluk pul pul pulluğu pullayan pullayıcı pullamadan duramaz pullamaya devam eder pulladıkça pul olur pul oldukça pulluk parlar pulluk parladıkça pullayıcı sevinir pullayıcı sevindikçe daha çok pullar pul pul pulluk pulluk pul pul pulluğun pulları pulluğa yapışır yapışan pullar düşmez düşmeyen pullar parlar parlayan pullar göz alır göz alan pullar pulluğu güzelleştirir pul pul pulluk pulluk pul pul pullayıcı pulluğu pulladıktan sonra pulluğu tarlaya götürür tarlada pulluk toprağı sürer toprağı sürdükçe pulluk tozlanır tozlanan pulluk pullarını kaybeder pullayıcı tekrar pullar pul pul pulluk pulluk pul pul pulluğu pulladım pulluğun pulları pul pul oldu pulladıkça pulluk pullandı pulluk tarlayı sürdü ekin yetişti pullayıcı sevindi pulluk pullarıyla parladı',
  },

  {
    id: 'serce',
    title: 'Serçe Şarkıcı',
    level: 'kolay',
    text:
      'serçe serçeye söyledi serçe serçeyi dinledi serçe serçeyle şarkı söyledi serçe serçeyle uçtu gitti serçe serçeye söyledi serçe serçeyi dinledi serçeler bahçede oynadı serçeler dalda oturdu serçeler suyu içti serçeler yemini yedi serçeler birbirine baktı serçeler birbirine öttü serçeler birlikte uçtu serçeler birlikte kondu serçe serçeye söyledi serçe serçeyi dinledi bahçenin serçesi en güzel şarkıyı söyledi diğer serçeler ona katıldı bahçe serçelerin sesiyle doldu bahçıvan serçeleri dinledi bahçıvan serçelere yem verdi serçeler yemi yedi serçeler bahçıvana teşekkür etti serçeler şarkı söyleyerek uçtular serçe serçeye söyledi serçe serçeyi dinledi serçeler akşam yuvalarına döndü yuvalarında yavrularını besledi yavrular büyüdükçe uçmayı öğrendi serçeler bahçede toplandı serçeler birlikte şarkı söyledi serçe serçeye söyledi serçe serçeyi dinledi serçe serçe serçe serçe serçe serçe serçe serçe serçe serçe serçeler bahçeyi güzelleştirdi bahçıvan serçelere bayıldı bahçıvan her gün serçelere yem verdi serçeler her gün bahçıvana şarkı söyledi serçe serçeye söyledi serçe serçeyi dinledi serçeler mutlu yaşadı',
  },

  {
    id: 'bakkal',
    title: 'Bakkal Bakraç',
    level: 'orta',
    text:
      'bakkala gittim bakraç istedim bakkal bakraç vermedi bakkala gittim bakraç istedim bakkal bakraç vermedi bakraç almaya başka bakkala gittim oradaki bakkal bana bakır bir bakraç verdi bakırın bakracı parlaktı bakraç ağırdı bakracı eve götürdüm bakraçla su taşıdım bakraçla süt taşıdım bakraçla yoğurt taşıdım bakracım dayandı bakraçım bozulmadı bakkala gittim bakraç istedim bakkal bakraç vermedi başka bakkala gittim o da bakraç vermedi üçüncü bakkala gittim üçüncü bakkal güldü bana bakraç verdi bakracı aldım eve döndüm bakraçla pazara gittim pazarda alışveriş yaptım bakraca meyve sebze koydum bakraç ağırlaştı eve zor getirdim bakkala gittim bakraç istedim bakkal bakraç vermedi bakkal bakkala bakraç bakkalına gönderdi bakkal bakkalı bakraççıya yolladı bakraççı bana bakır bakraç sattı bakkala gittim bakraç istedim bakkal bakraç vermedi bakraç bakkalın değil bakraççının işidir bakraç bakraççıdan alınır bakkaldan alınmaz bakkal bakkaldır bakraççı bakraççıdır herkesin işi ayrıdır bakkala gittim bakraç istedim bakkal bakraç vermedi artık bakkaldan bakraç istemiyorum bakraççıya gidiyorum',
  },

  {
    id: 'cuk-cuk-cikolata',
    title: 'Çikolata Çıtkırıldım',
    level: 'orta',
    text:
      'çıtkırıldım çikolatacı çıtır çıtır çikolata çıkartır çıtkırıldım çikolatacının çıtır çıtır çıkardığı çikolatalar çıtkırıldımdır çıtkırıldım çikolatacı çıtır çıtır çikolata çıkartır çıtkırıldım çikolatacının çıkardığı çikolatalar çocukları çok sevindirir çocuklar çikolatayı çabuk çabuk yer çikolata çabuk biter çıtkırıldım çikolatacı çabuk çabuk çikolata çıkartır çocuklar çabuk çabuk çikolata alır çocuklar çabuk çabuk çikolata yer çıtkırıldım çikolatacı çıtır çıtır çikolata çıkartır çikolatacının dükkanı her gün açık çikolatacı her gün yeni çikolata yapar yeni çikolatalar yeni tatlarla çocukları şaşırtır çocuklar çikolatacıya bayılır çikolatacı çocuklara bayılır çıtkırıldım çikolatacı çıtır çıtır çikolata çıkartır çocuklar çikolatacıya gelir çikolata alır gider çikolatacı tek başına kalır yeni çikolatalar yapar yeni günler bekler çıtkırıldım çikolatacı çıtır çıtır çikolata çıkartır çıtkırıldım çikolatacının çıkardığı çikolatalar şehrin en güzel çikolatalarıdır herkes çikolatacıyı tanır herkes çikolatacıyı sever çıtkırıldım çikolatacı çıtır çıtır çikolata çıkartır çocuklar çabuk çabuk çikolata yer çıtkırıldım çikolatacı mutlu olur',
  },

  {
    id: 'tahta',
    title: 'Tahta Tahtacı',
    level: 'zor',
    text:
      'tahtaya tahta yapıştırma tahta tahta üstüne tahta yapıştırılırsa tahta tahtaya tahta üstüne tahta olur tahtaya tahta yapıştırma tahta tahta üstüne tahta yapıştırılırsa tahtacı tahtayı tahtaya tahta tahta yapıştırır tahtacının tahtası tahta üstüne tahta tahta üstüne tahta olur tahtacı tahtaya tahta çakar çekiçle çakar çiviyle çakar tahta tahtaya yapışır tahta tahtaya sıkı durur tahta tahtaya tahta üstüne tahta tahtaya tahta yapıştırma tahta tahta üstüne tahta yapıştırılırsa tahtacı tahtaları üst üste koydu tahtalar bir duvar oldu duvar tahtadan oldu tahta duvar sağlam oldu tahtacı duvarı bitirdi tahta duvara baktı sevindi tahtaya tahta yapıştırma tahta tahta üstüne tahta yapıştırılırsa tahtacı yeni tahta aldı yeni tahtayı eski tahtaya yapıştırdı tahta tahtaya yapıştı tahta tahtanın üstüne çıktı tahta tahtanın altına indi tahta tahta tahta tahta tahta tahta tahtaya tahta yapıştırma tahta tahta üstüne tahta yapıştırılırsa tahtacı tahta tahtacı tahta tahtacı tahta tahta tahtacı tahta tahtacı tahta tahtacı tahtacı tahta tahta yapıştırdı tahta tahta dayandı tahta tahta uzandı tahta tahta yükseldi tahtaya tahta yapıştırma',
  },

  {
    id: 'kara-kedi',
    title: 'Kara Kedi',
    level: 'kolay',
    text:
      'kara kedi kara kapıda kara kara baktı kara kedi kara kapıyı tırmaladı kara kapı açıldı kara kedi içeri girdi kara kedi karanlıkta kayboldu kara kedi kara kapıda kara kara baktı kara kedi kara kapıyı tırmaladı kara kedinin kara tırnakları kara kapıyı çizdi kara kapı çizildi ama yine de açıldı kara kedi içeri girdi kara kedi süt aradı kara kedi süt buldu kara kedi sütü içti kara kedi mutlu oldu kara kedi kara kapıda kara kara baktı dışarı çıkmak istedi kara kapıyı tekrar tırmaladı kara kapı tekrar açıldı kara kedi dışarı çıktı kara kedi karanlık sokakta kayboldu kara kedi kara duvarın üstüne çıktı kara duvardan kara çatıya atladı kara çatıda kara gökyüzüne baktı kara kedi miyavladı kara gece kara kediyi sardı kara kedi kara kapıda kara kara baktı kara kedi kara köşede oturdu kara kedi kara fareyi gördü kara kedi kara fareyi kovaladı kara fare kaçtı kara kedi yakalayamadı kara kedi kara kapıya geri döndü kara kedi kara kara baktı kara kedi uyudu kara gece geçti sabah oldu kara kedi uyandı yeni bir gün başladı',
  },

  {
    id: 'minareci',
    title: 'Minareci Minare',
    level: 'orta',
    text:
      'minare minarecinin minaresidir minareci minareyi yapar minareyi onarır minareyi süsler minare minarecinin emanetidir minare minarecinin alın teridir minare minarecinin göz bebeğidir minare minarecinin minaresidir minareci her sabah minareye çıkar minareden şehre bakar minareden ezan okunur minareden ses yayılır minare şehrin en yüksek noktasıdır minareyi herkes görür minareyi herkes sever minareci minareye baktıkça gururlanır minare minarecinin minaresidir minareyi minareci yıkayıp temizler minarenin taşları parlar minarenin şerefesi parlar minarenin külahı parlar minare bütünüyle parlar minareci sevinir minareci dua eder minare minarecinin minaresidir minarenin minarecisi minarenin minaresi minareci minare minareci minare minare minareci minareci yıllarca minareye baktı minare yıllarca minareciye dayandı yıllar geçti minareci yaşlandı minare hala dimdik durdu yeni minareci geldi eski minareciye saygı duydu minareye birlikte baktılar minare onları da karşıladı minare minarecinin minaresidir minare minarecinin yadigarıdır minareci minareye değer verir minare minareciye değer verir',
  },
];

export function pickTekerleme(forSeconds = TEKERLEME_DURATION_SEC): { item: TekerlemeItem; text: string } {
  const item = TEKERLEMELER[Math.floor(Math.random() * TEKERLEMELER.length)];
  const neededWords = Math.max(120, Math.ceil((forSeconds / 60) * 52));
  let text = item.text;
  let guard = 0;
  while (text.split(/\s+/).length < neededWords && guard < 40) {
    text += ' ' + item.text;
    guard++;
  }
  return { item, text: text.replace(/\s+/g, ' ').trim() };
}
