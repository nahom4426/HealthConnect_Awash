// Ethiopian regions
export const ethiopianRegions = [
  "Addis Ababa",
  "Afar",
  "Amhara",
  "Benishangul-Gumuz",
  "Dire Dawa",
  "Gambela",
  "Harari",
  "Oromia",
  "Sidama",
  "Somali",
  "South West Ethiopia",
  "Southern Nations, Nationalities, and Peoples",
  "Tigray"
];

// Cities by region (expanded with more cities)
export const citiesByRegion: Record<string, string[]> = {
  "Addis Ababa": ["Addis Ababa"],
  
  "Afar": [
    "Semera", "Dubti", "Asaita", "Awash", "Gewane", 
    "Chifra", "Mille", "Aysaita", "Logia", "Abala",
    "Erebti", "Teru", "Yalo", "Gulina", "Dewe"
  ],
  
  "Amhara": [
    "Bahir Dar", "Gondar", "Dessie", "Debre Birhan", "Debre Markos", 
    "Kombolcha", "Woldiya", "Lalibela", "Finote Selam", "Debre Tabor",
    "Injibara", "Sekota", "Kemise", "Metema", "Bati",
    "Dangila", "Motta", "Nefas Mewcha", "Adet", "Merawi"
  ],
  
  "Oromia": [
    "Adama", "Jimma", "Nekemte", "Bishoftu", "Shashamane", 
    "Bale Robe", "Asella", "Ambo", "Burayu", "Sebeta",
    "Meki", "Ziway", "Metehara", "Fiche", "Negele Borena",
    "Batu", "Bedele", "Gimbi", "Dodola", "Yabelo",
    "Holeta", "Weliso", "Chiro", "Goba", "Mojo"
  ],
  
  "Tigray": [
    "Mekelle", "Adigrat", "Axum", "Shire", "Adwa",
    "Wukro", "Maychew", "Humera", "Korem", "Alamata",
    "Abiy Adi", "Enticho", "Hawzen", "Abiyi Adi", "Sheraro"
  ],
  
  "Dire Dawa": ["Dire Dawa"],
  
  "Harari": ["Harar"],
  
  "Somali": [
    "Jijiga", "Gode", "Degehabur", "Kebri Dahar", "Werder",
    "Kelafo", "Shilabo", "Ferfer", "Shinile", "Aysha",
    "Aware", "Fik", "Hamero", "Erer", "Afdem"
  ],
  
  "Sidama": [
    "Hawassa", "Yirgalem", "Wondo Genet", "Aleta Wendo", "Leku",
    "Bensa", "Daye", "Chuko", "Hula", "Arbegona"
  ],
  
  "Benishangul-Gumuz": [
    "Assosa", "Bambasi", "Menge", "Kurmuk", "Sherkole",
    "Kamashi", "Debate", "Bullen", "Mandura", "Pawi"
  ],
  
  "Gambela": [
    "Gambela", "Itang", "Abobo", "Jikawo", "Lare",
    "Godere", "Mengesh", "Wantawo", "Gog", "Akobo"
  ],
  
  "Southern Nations, Nationalities, and Peoples": [
    "Arba Minch", "Sodo", "Dilla", "Hosaena", "Butajira",
    "Durame", "Mizan Teferi", "Jinka", "Sawla", "Bonga",
    "Welkite", "Worabe", "Boditi", "Alaba Kulito", "Yirgacheffe"
  ],
  
  "South West Ethiopia": [
    "Bonga", "Tepi", "Mizan Teferi", "Masha", "Chena",
    "Gesha", "Guraferda", "Decha", "Shey Bench", "Yeki"
  ]
};

// Sub-cities by city (expanded with comprehensive sub-cities)
export const subCitiesByCity: Record<string, string[]> = {
  // Addis Ababa sub-cities
  "Addis Ababa": [
    "Addis Ketema", "Akaky Kaliti", "Arada", "Bole", "Gullele", 
    "Kirkos", "Kolfe Keranio", "Lideta", "Nifas Silk-Lafto", "Yeka"
  ],
  
  // Afar region cities
  "Semera": ["Semera Town", "Administrative Area", "Industrial Zone", "Residential Area", "Commercial District"],
  "Dubti": ["Dubti Town", "Dubti Center", "Dubti North", "Dubti South", "Dubti East"],
  "Asaita": ["Asaita Town", "Asaita Center", "Asaita North", "Asaita South", "Old Asaita"],
  "Awash": ["Awash Town", "Awash Sebat", "Awash Arba", "Awash Center", "Awash Station"],
  "Gewane": ["Gewane Town", "Gewane Center", "Gewane North", "Gewane South"],
  "Chifra": ["Chifra Town", "Chifra Center", "Chifra North", "Chifra South"],
  "Mille": ["Mille Town", "Mille Center", "Mille North", "Mille South"],
  "Aysaita": ["Aysaita Town", "Aysaita Center", "Aysaita North", "Aysaita South"],
  "Logia": ["Logia Town", "Logia Center", "Logia North", "Logia South"],
  "Abala": ["Abala Town", "Abala Center", "Abala North", "Abala South"],
  "Erebti": ["Erebti Town", "Erebti Center", "Erebti North", "Erebti South"],
  "Teru": ["Teru Town", "Teru Center", "Teru North", "Teru South"],
  "Yalo": ["Yalo Town", "Yalo Center", "Yalo North", "Yalo South"],
  "Gulina": ["Gulina Town", "Gulina Center", "Gulina North", "Gulina South"],
  "Dewe": ["Dewe Town", "Dewe Center", "Dewe North", "Dewe South"],
  
  // Amhara region cities
  "Bahir Dar": [
    "Fasilo", "Belay Zeleke", "Hidar 11", "Shum Abo", "Gish Abay",
    "Tana", "Shimbit", "Sefene Selam", "Dagmawi Minilik", "Ginbot 20",
    "Abay Mado", "Dimisal", "Kebele 11", "Kebele 13", "Kebele 14"
  ],
  
  "Gondar": [
    "Arada", "Kebele 18", "Maraki", "Azezo", "Kebele 16",
    "Kebele 17", "Kebele 14", "Kebele 15", "Kebele 19", "Kebele 20",
    "Medhanialem", "Lideta", "Cherkos", "Abun Bet", "Fasil Gimb"
  ],
  
  "Dessie": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10",
    "Kebele 11", "Kebele 12", "Kebele 13", "Kebele 14", "Kebele 15"
  ],
  
  "Debre Birhan": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10",
    "Kebele 11", "Kebele 12", "Kebele 13"
  ],
  
  "Debre Markos": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Kombolcha": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Woldiya": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Lalibela": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Meskel Area", "Church Area", "Tourist Area", "Residential Area"
  ],
  
  "Finote Selam": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07"
  ],
  
  "Debre Tabor": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08"
  ],
  
  "Injibara": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Sekota": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Kemise": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Metema": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Bati": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Dangila": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Motta": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Nefas Mewcha": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Adet": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Merawi": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  // Tigray region cities
  "Mekelle": [
    "Hawelti", "Ayder", "Semien", "Hadnet", "Quiha",
    "Kedamay Weyane", "Adi Haqi", "Adiha", "Debub", "Enda Gabir",
    "May Weyni", "Kebele 11", "Kebele 12", "Kebele 13", "Kebele 14"
  ],
  
  "Adigrat": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Axum": [
    "Hawelti", "Kindeya", "Hayelom", "Mesfin", "Ezana",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Shire": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Adwa": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Wukro": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08"
  ],
  
  "Maychew": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Humera": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07"
  ],
  
  "Korem": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Alamata": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07"
  ],
  
  "Abiy Adi": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Enticho": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Hawzen": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Sheraro": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  // Oromia region cities
  "Adama": [
    "Dabe", "Boku", "Lugo", "Dembela", "Kebele 01",
    "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Hawassa": [
    "Bahil Adarash", "Misrak", "Menaharia", "Tabor", "Hayk Dar",
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Jimma": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Nekemte": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Bishoftu": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Shashamane": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Bale Robe": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Asella": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Ambo": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Burayu": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Sebeta": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Meki": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Ziway": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Metehara": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Fiche": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Negele Borena": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Batu": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Bedele": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Gimbi": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Dodola": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Yabelo": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Holeta": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Weliso": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Chiro": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Goba": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  "Mojo": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05"
  ],
  
  // Somaliland region cities
  "Jijiga": [
    "Jijiga Town", "Jijiga Center", "Jijiga North", "Jijiga South",
    "Jijiga East", "Jijiga West", "Jijiga Industrial Area"
  ],
  
  "Gode": [
    "Gode Town", "Gode Center", "Gode North", "Gode South",
    "Gode East", "Gode West", "Gode Industrial Area"
  ],
  
  "Degehabur": [
    "Degehabur Town", "Degehabur Center", "Degehabur North", "Degehabur South",
    "Degehabur East", "Degehabur West", "Degehabur Industrial Area"
  ],
  
  "Kebri Dahar": [
    "Kebri Dahar Town", "Kebri Dahar Center", "Kebri Dahar North", "Kebri Dahar South",
    "Kebri Dahar East", "Kebri Dahar West", "Kebri Dahar Industrial Area"
  ],
  
  "Werder": [
    "Werder Town", "Werder Center", "Werder North", "Werder South",
    "Werder East", "Werder West", "Werder Industrial Area"
  ],
  
  "Kelafo": [
    "Kelafo Town", "Kelafo Center", "Kelafo North", "Kelafo South",
    "Kelafo East", "Kelafo West", "Kelafo Industrial Area"
  ],
  
  "Shilabo": [
    "Shilabo Town", "Shilabo Center", "Shilabo North", "Shilabo South",
    "Shilabo East", "Shilabo West", "Shilabo Industrial Area"
  ],
  
  "Ferfer": [
    "Ferfer Town", "Ferfer Center", "Ferfer North", "Ferfer South",
    "Ferfer East", "Ferfer West", "Ferfer Industrial Area"
  ],
  
  "Shinile": [
    "Shinile Town", "Shinile Center", "Shinile North", "Shinile South",
    "Shinile East", "Shinile West", "Shinile Industrial Area"
  ],
  
  "Aysha": [
    "Aysha Town", "Aysha Center", "Aysha North", "Aysha South",
    "Aysha East", "Aysha West", "Aysha Industrial Area"
  ],
  
  "Aware": [
    "Aware Town", "Aware Center", "Aware North", "Aware South",
    "Aware East", "Aware West", "Aware Industrial Area"
  ],
  
  "Fik": [
    "Fik Town", "Fik Center", "Fik North", "Fik South",
    "Fik East", "Fik West", "Fik Industrial Area"
  ],
  
  "Hamero": [
    "Hamero Town", "Hamero Center", "Hamero North", "Hamero South",
    "Hamero East", "Hamero West", "Hamero Industrial Area"
  ],
  
  "Erer": [
    "Erer Town", "Erer Center", "Erer North", "Erer South",
    "Erer East", "Erer West", "Erer Industrial Area"
  ],
  
  "Afdem": [
    "Afdem Town", "Afdem Center", "Afdem North", "Afdem South",
    "Afdem East", "Afdem West", "Afdem Industrial Area"
  ],
  
  
  
  "Yirgalem": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Wondo Genet": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Aleta Wendo": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Leku": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Bensa": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Daye": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Chuko": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Hula": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Arbegona": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  // Benishangul-Gumuz region cities
  "Assosa": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Bambasi": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Menge": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Kurmuk": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Sherkole": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Kamashi": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Debate": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Bullen": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Mandura": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Pawi": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  // Gambela region cities
  "Gambela": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Itang": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Abobo": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Jikawo": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Lare": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Godere": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Mengesh": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Wantawo": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Gog": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Akobo": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  // Southern Nations, Nationalities, and Peoples region cities
  "Arba Minch": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Sodo": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Dilla": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Hosaena": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Butajira": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Durame": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Mizan Teferi": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Jinka": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Sawla": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Bonga": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Welkite": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Worabe": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Boditi": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Alaba Kulito": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Yirgacheffe": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
 
  
  "Tepi": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
 
  
  "Masha": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Chena": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Gesha": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Guraferda": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Decha": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Shey Bench": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ],
  
  "Yeki": [
    "Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Kebele 05",
    "Kebele 06", "Kebele 07", "Kebele 08", "Kebele 09", "Kebele 10"
  ]
};

// address1s by sub-city (simplified example - expand as needed)
export const address1sBySubCity: Record<string, string[]> = {
  "Addis Ketema": ["address1 1", "address1 2", "address1 3", "address1 4", "address1 5"],
  "Bole": ["address1 1", "address1 2", "address1 3", "address1 4", "address1 5", "address1 6"],
  "Kirkos": ["address1 1", "address1 2", "address1 3", "address1 4", "address1 5"],
  "Yeka": ["address1 1", "address1 2", "address1 3", "address1 4", "address1 5", "address1 6"],
  // Add more as needed
};

// Helper function to get cities based on region
export function getCitiesByRegion(region: string): string[] {
  console.log('Getting cities for region:', region);
  console.log('Available regions:', Object.keys(citiesByRegion));
  return citiesByRegion[region] || [];
}

// Helper function to get sub-cities based on city
export function getSubCitiesByCity(city: string): string[] {
  console.log('Getting sub-cities for city:', city);
  console.log('Available cities:', Object.keys(subCitiesByCity));
  return subCitiesByCity[city] || [];
}

// Helper function to get address1s based on sub-city
export function getaddress1sBySubCity(subCity: string): string[] {
  return address1sBySubCity[subCity] || [];
}

