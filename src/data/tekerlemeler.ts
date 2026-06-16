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
  {
    id: 'bilmece-kalem',
    title: 'Kalem Bilmecesi',
    level: 'kolay',
    text:
      'ince uzun bir yolcudur kağıdın üstünde gezer gezerken siyah iz bırakır sesi yoktur ama düşünceyi konuşturur öğrencinin elinde çalışır katibin parmağında hızlanır ucu kırılırsa yeniden açılır yanlış yaparsa silgi yardım ister çantada saklanır masada bekler yazdıkça kısalır ama anlattıkları uzar mektup olur dilekçe olur not olur cevap olur herkes onu tutar fakat o kimseyi tutmaz bu sessiz yazıcı nedir satırlar onunla düzenlenir kelimeler onunla yarışır sınavda hız isteyen eller onu sıkıca kavrar doğru tuş gibi doğru çizgi arar cevabı bilen kalem der',
  },
  {
    id: 'bilmece-saat',
    title: 'Saat Bilmecesi',
    level: 'orta',
    text:
      'duvarda durur ama evi beklemez kolunda gezer ama yorulmaz tik tak der konuşmaz zamanı gösterir fakat zamanı durdurmaz yüzü vardır gözü yoktur kolları vardır eli yoktur sabahları insanı kaldırır akşamları dinlenmeye çağırır okulun zilini işe gidişi sınavın başlangıcını o haber verir geç kalanı üzebilir erken geleni sevindirebilir dakikaları sayar saniyeleri saklamaz herkes ona bakar ama o kimseye bakmaz bu düzenli bekçi nedir üç dakikalık yazıda da sessizce çalışır acele eden parmakları görünmeden sınar zaman bitince dur der cevap nedir saat',
  },
  {
    id: 'bilmece-anahtar',
    title: 'Anahtar Bilmecesi',
    level: 'orta',
    text:
      'küçücük gövdesi vardır ama büyük kapıları açar cebinde saklanır kaybolursa evin önü bekleme yerine döner dişleri vardır yemek yemez kilide girer sessizce döner içeride kalan yolu dışarıya bağlar dışarıda kalan yolu içeriye çağırır bazen demirdir bazen renklidir çantada şıngırdar kapının sırrını bilir ama kimseye söylemez doğru yere girerse kapı açılır yanlış yere girerse kapı susar bu küçük çözüm nedir sınav metninde de her kelime bir kilit gibidir doğru yazan aday kapıyı açar yanlış yazan tekrar dener cevap anahtar olur derler',
  },
  {
    id: 'bilmece-ayna',
    title: 'Ayna Bilmecesi',
    level: 'kolay',
    text:
      'karşısına geçeni olduğu gibi gösterir fakat hiç konuşmaz gülersen güler kaşlarını çatarsan çatık görünür duvarda durur çantada taşınır berberde bekler banyoda parlar yüzü vardır ama kendi yüzünü bilmez ışık gelirse canlanır karanlık olursa susar yalan söylemez ama sesi çıkmaz sağını sol eder solunu sağ eder hazırlanan öğrenci de katip adayı da son kez ona bakar bu sessiz gösterici nedir yazı sınavından önce yakayı düzeltir saçı gösterir yüzü toparlatır insana kendini hatırlatır bakınca sen varsın cevap nedir ayna der herkes bilir',
  },
  {
    id: 'bilmece-bulut',
    title: 'Bulut Bilmecesi',
    level: 'kolay',
    text:
      'gökyüzünde yürür ama ayağı yoktur rüzgar nereye çağırırsa oraya gider bazen pamuk gibi beyaz bazen kurşun gibi gridir güneşi saklar tarlaya yağmur taşır dağın başına şapka olur denizin suyunu alır sessizce yukarı çıkar sonra damla damla geri bırakır çocuklar şeklini hayvana benzetir yolcular gölgesinde serinler yakalamak istersin eline gelmez bu gezen su deposu nedir sınav metninde adı geçerse parmaklar hızlanır yağmur kelimesi peşinden gelir havaya bakınca cevabı herkes bulur bulut der geçer sonra yazmaya devam eder katip adayı dikkatle yazar',
  },
  {
    id: 'bilmece-ruzgar',
    title: 'Rüzgar Bilmecesi',
    level: 'orta',
    text:
      'görünmez ama geldiğini herkes anlar yaprağı oynatır perdeyi sallar kapıyı çarpar saçları dağıtır denizde yelkeni şişirir tarlada başakları eğer yazın serinlik getirir kışın üşütür sesi vardır gövdesi yoktur tutulmaz bağlanmaz kovalanmaz ama peşinden toz kaldırır bacadan uğuldar pencereden içeri sızar çocukların uçurtmasını göğe taşır sınav yazısında adı geçince parmaklar hızlı hızlı eser bu görünmez yolcu nedir kimse görmeden gelir kimse tutamadan gider bazen fırtına olur bazen esinti cevap rüzgar diye bilinir aday bunu doğru yazarsa bir kelime daha kazanır hemen',
  },
  {
    id: 'bilmece-kopru',
    title: 'Köprü Bilmecesi',
    level: 'orta',
    text:
      'iki kıyıyı birbirine kavuşturur altında su akar üstünden insanlar geçer arabalar yürür trenler gider köyü kente yolu yola bağlar bazen taştan yapılır bazen demirden bazen tahtadan olur ayrı duran yerleri yakın eder yolcuya vakit kazandırır nehir konuşmaz o üstünden konuşur yüksekten bakan suyu görür karşıya geçen rahat eder sınavda yazan aday kelimeleri de böyle bağlar bu birleştirici yol nedir bir uçtan başlar öbür uçta biter geçmek isteyen ona güvenir şehirleri buluşturur cevap köprü olur herkes bilir yazınca puan artar hemen',
  },
  {
    id: 'bilmece-semsiye',
    title: 'Şemsiye Bilmecesi',
    level: 'kolay',
    text:
      'yağmur başlayınca açılır insanı ıslanmaktan korur güneş yakarsa yine gölge olur sapından tutulur kumaşı gerilir kapanınca ince uzun görünür açılınca renkli bir çiçeğe benzer rüzgar sert eserse ters dönebilir çantada bekler kapı yanında kurur pazarda sahilde okul yolunda işe giderken herkes onu arar damlalar üstüne düşer ama altındaki kuru kalır sınavda bu kelimeyi yazan dikkatli olmalıdır bu koruyucu nedir ıslak havanın dostudur bulut görünce hazırlanır yağmur dinince kapanır cevap şemsiye diye yazılır aday hız kazanır ve metne devam eder hemen',
  },
  {
    id: 'bilmece-kitap',
    title: 'Kitap Bilmecesi',
    level: 'orta',
    text:
      'kapakları vardır ama kapı değildir sayfaları vardır ama ağaçta durmaz içinde bilgi saklar hikaye anlatır masal kurar tarih öğretir sessiz durur fakat okuyanla konuşur rafta bekler çantada taşınır açılınca başka dünyalar görünür öğrenci ondan öğrenir katip adayı ondan kelime tanır eskiyen sayfası bile değer taşır okudukça azalmaz aksine insanın aklını çoğaltır bu sessiz öğretmen nedir sınav metninde adı geçerse parmaklar düzenli yürür çünkü kitap kelimesi kolay görünür ama dikkat ister cevabı bilen kitap der yazmayı sürdürür ve puan toplar hemen',
  },
  {
    id: 'bilmece-golge',
    title: 'Gölge Bilmecesi',
    level: 'zor',
    text:
      'ışık olunca yanında belirir karanlık olunca kaybolur sen yürürsen yürür sen durursan durur bazen önüne düşer bazen arkanda kalır sabah uzun olur öğlen kısalır akşam yine uzar tutulmaz konuşmaz ama seni bırakmaz duvara çıkar yere serilir ağacın altında serinlik verir çocuğun oyununa şekil olur güneş nereye geçerse o da yer değiştirir bu sessiz takipçi nedir sınavda bu bilmece yazılırken aday ışık kelimesini kaçırmaz cevabı gölge diye düşünür doğru yazarsa kelime kazanır üç dakika içinde hızını ölçer dikkatle devam eder hemen',
  },
  {
    id: 'tekerleme-tek',
    title: 'Uzun Tekerleme Metni',
    level: 'zor',
    text:
      'Karakış Karlıdağı karla kavururken kırk kulaklı Kasım kırk kırık küp ve kırk kuzu ile Kırkız Kalesi kapısında kargalarını kızgın kargılarla dağladı Kıyma kıyamayan kırık kollu kasap Keramettin karşıda körkütük kıyma kıyan kasap Kâmil den kokmuş kokoreç aldı Söyle kızım kızına o da söylesin kızının kızına ağlatmasın kızınızın kızı kızımızın kızını Koca kokoz kokainman Kazablankalı kozmonot Kösler e kök kok köken kokoreç köknar köçekçe krematoryum ne diye sormuş Kâni nin kafası Kâbil i kabul etmez Yalancıoğlu Yayla Dağı nın yahnisini yer ama yağlı yoğurdundan vazgeçemez Yitik yerleri yollarda yorgunluktan yürüyerek yakaladılar Bu yapıyı yıkıp yapsak da mı otursak yoksa yapmadan otursak da mı yıkıp yapsak Güneyli Galip Gavurdağı nda güpegündüz Gümüşhane ye gönderildi Çatalcı çatal yapar bakkal bakraç vermez gemici gemiyi yürütür serçe serçeye öter kara kedi kara kapıda bekler bulut gökyüzünde yürür rüzgar görünmez ama eser gölge ışıkla birlikte yürür ayna her şeyi gösterir kitap bilgi taşır kalem yazıyı taşır saat zamanı gösterir anahtar kapıyı açar köprü iki kıyıyı birleştirir şemsiye yağmurdan korur bu metin sınav hız ve dikkat ölçmek için tekrar tekrar okunur kelimeler birbirine karışsa da aday doğru yazmaya çalışır dikkat eden kazanır hızlı yazan süreyi yetiştirir doğru yazan puanı alır'
  },
  {
    id: 'tekerleme-tek',
    title: 'Uzun Tekerleme Metni',
    level: 'zor',
    text:
      'Geçen gece Gemerek ten Gediz e gelen Gebzeli gezginci gizemcilerden gitarist general Genzel gençlere gerçek dışılıkla gerçeklik dışı ilişkiler arasında ne gibi bir geçerlilik gerçekliliği olduğunu sordu Gül dibi bülbül dili gibi gül dibi bülbül dili Galata Kulesi kapısı karşısındaki kuru kahvecinin gıgısı çıkık dişi kırık kurbağa kafalı karakoncoloz kalfası halkı karışıklığa getirip kahveye kavruk kakula kırığı kattı Bu yoğurdu mayalamalı da mı saklamalı mayalamamalı da mı saklamalı Sizin damda var beş boz başlı beş boz ördek bizim damda var beş boz başlı beş boz ördek sizin damdaki beş boz başlı beş boz ördek bizim damdaki beş boz başlı beş boz ördeğe siz de bizcileyin beş boz başlı beş boz ördek misiniz dedi Değirmene girdi köpek değirmenci çaldı kötek hem kepek yedi köpek hem kötek yedi köpek Hahamhanede hahambaşı hahamı homur homur homurdanır görünce hemencecik heyecanlandı hızlandı hoşnutsuz hırçın hırçın giderken birdenbire karşısında beliriveren Hollandalı Helyga ya hah tamam haydi hohla hemen hoh de bakayım dedi'
  },
  {
    id: 'tekerleme-tek',
    title: 'D Harfi Tekerleme Metni',
    level: 'zor',
    text:
      'Dadaylı dayımın Dodurgalı düdük deli dedesi diline doladığı debdebeli dedim dedisiyle dırdırını dilinden düşürüp de bir kez olsun doya doya düden diyemeden düdenin dallara doldurduğunu doyumlu yemişlerden doyasıya yiyemeden dar dünyadan göçüp gitti Dilenci dalları dama düşürdüğü için mi dövüldü dama düşen dalları diline doladığı için mi dövüldü Düşkün düşündeş düşünselde düşçü düşünsellikle düşünceleme düşselliğini düşünden düşüremez düşürürse eğer düşüncelik düşüncesizlikle düşündürücü bir düşünsellik kazanır Vedat ı caddede durdurdum da dedim ki şu dar dünyada delilerle dertli dedeler içinde didindin durdun da kendi derdini döküp dereden tepeden dört çift lakırdı edecek bir hemderdi neden bulamadın Damdan geldim dedem dedim demli çay istiyor Keşmekeşli kekeme Kerim Kendirlili ketenhelvacısına kemik kekik kendir kenevir sattı Karaburunlu kabadayı Kadir kafakâğıdını Kadirlili kapkaççı Kasım la Kahire deki Kalecikliler kahvehanesinde kalamarla kafuru satan kaparozcu Kuzguncuklu Kozmonot Kâzım a kaptırmış Didim didim dit dedim dedeme dom dom konuşma Dum dum kurşunu dum dum değil dom dom patlar Dım dım da dım dım ben bu dımdımdan bıktım'
  },
  {
    id: 'tekerleme-119',
    title: 'Hece ve Kelime Akış Tekerlemesi',
    level: 'kolay',
    text:
      'Kat kat kek al kek ile elma ye yaş kek ile yay al ütü ile eti al ümit iyi kat tut elma ekşi imiş Ali iki maşa et yemiş Tay iyi yem yemiş iki kişi Mete ile alay etmiş iki iyi şiş al Mete şaka ile iki kuş eti yemiş Lale Ali ile alay etmiş Uşak mama ile kek yemiş Umut iyi uyku uyu yay iyi imiş iki kama ile iki mama al yaş keki tek tek al tilki iyi uyumuş aşk tüm işi yaş etmiş Ali taka ile tam iki takla at Ümit takaya elma ile tamek alma Ali iyi nane al Maya iyi tutmuş iyi taş atan anam Muşta iyi nam almış iki kişi Kayayı met etmiş unu nane ile kaynat Anam Muştan iyi elma almış etin iyi yanı yanmış Nalan iki ay matem tuttu namlı meltem yeli ılık ılıktı ışın unu elek ile ele yaş elin ile işe taş atma nalın tam yaştı ninem tın tınmış'
  },
  {
    id: 'tekerleme-120',
    title: 'D ve G Harf Yoğunluk Metni',
    level: 'orta',
    text:
      'Adam demin en sert demiri delik deşik etti iki adım git dur dadım dik yürür cadı kadın dün iki sade oda tuttu gem ata dar geldi dün gemi ile gelen adam senin dayındı gara giren katar giysi ile dolu idi dün yaş günü olan dadım yeniden Gamze adını aldı oyunda ilk golü atan Demir Giyim adlı takım güzel oynadı dayım dün saat ikiye dek gelin ile odada oturdu dadım dün Gani ile saat ikide gara gitti damda yatan kedi ona gaga atan kuşu yedi güz geldi gezme işi sona erdi eğer gemi erken gelirse o adam da takımda oynar sarı tüle demin zam geldi tren gelince insan garda dik yürür Van valisi Hamit Alevdir Veli sorumlu olan kişidir hava ve ova kelimesi v ile yazılır evin hattı dahi yok Hasan Han halkı da avı da sever Hale ivaz vermez Halil ve hakim eve gitti Han ve hamam şu eve yakın ova halkı her gün kova kova su taşır dahi insan hem iyi huylu hem de düzenlidir'
  }
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
