exports.run = {
  usage: ['apakah', 'benarkah', 'bukankah'],
  use: 'teks',
  category: 'fun',
  async: async (m, { client, text }) => {
    const responses = [
      // Fun & Random
      "Iya banget, segitu doang nanyanya? 😆",
      "Gak gitu juga kalii 😜",
      "Tergantung cuaca sih... ☁️",
      "Wah bisa bisa, siapa yang tau? 👀",
      "Kayaknya sih... iya... tapi enggak juga 🥴",
      "Lu nanya? Gua jawab: GATAU 😝",
      "Gua robot, bukan cenayang 😶",
      "99% iya, 1% nya salah ketik 😌",
      "Mending jangan mikirin itu deh 😅",
      "Gua ngantuk, tanya besok aja 😴",

      // Formal & Bijak
      "Berdasarkan analisa dan logika, jawabannya adalah ya.",
      "Tidak dapat dipastikan tanpa data yang valid.",
      "Pertanyaan yang menarik. Namun, mari kita renungkan bersama...",
      "Secara teori, hal itu memungkinkan.",
      "Sebaiknya kamu pertimbangkan dari berbagai sudut pandang.",

      // Dark 😈
      "Iya... dan lu bakal nyesel. 🕳️",
      "Pertanyaan itu... membawa malapetaka 😈",
      "Lebih baik kamu gak tau jawabannya ☠️",
      "Udah terlambat untuk bertanya... semuanya udah ditentukan. 💀",
      "Hati-hati... ada yang ngawasin kamu sekarang. 👁️",

      // Deep & Sad
      "Kadang hidup gak sejelas itu 😔",
      "Iya... tapi apa gunanya kalau dia gak peduli? 😢",
      "Benar, tapi sayangnya bukan untukmu. 💔",
      "Semuanya udah berubah, termasuk jawabannya...",
      "Terkadang kita nanya karena udah tau jawabannya, tapi gak siap nerima 😞",

      // Bucin
      "Kalau itu demi dia, jawabannya selalu iya 🥹",
      "Asal dia senyum, gua rela apa aja 😭",
      "Iya, dan itu semua karena rasa ini 😭❤️",
      "Benar... seperti cintaku padanya yang gak ada logika.",
      "Gak usah nanya, langsung aja chat dia! 🫣",

      // Absurd
      "Iya, dan kucing bisa jadi presiden 🐱",
      "Bukannya itu kejadian di mimpi elu tadi malem? 😳",
      "Tentu saja! Seperti semangka di kulkas.",
      "Coba nanya ke pohon, mungkin dia tau 🌳",
      "Kalau nasi uduk bisa terbang, jawabannya iya.",

      // Jujur & Blunt
      "Gak sih. Lo kegeeran doang 😐",
      "Yaaa... elu udah tau jawabannya, cuma butuh validasi doang kan? 😑",
      "Gua jawab jujur nih ya, enggak.",
      "Iya. Tapi itu gak berarti apa-apa 😶",
      "Enggak. Dan stop nanya hal bodoh 😒",

      // Supportive
      "Iya dong! Kamu pasti bisa 💪",
      "Percaya diri aja, jawabannya selalu iya buat kamu 😎",
      "Benar! Jangan ragu buat jalan terus 🚀",
      "Kamu udah di jalur yang bener kok 😇",
      "Gua dukung jawabanmu 100%! 🔥",

      // Troll
      "Gua jawab iya, biar cepet 😈",
      "Kalo gua bilang enggak, lu sedih gak? 😝",
      "Iya, tapi boong~ 😛",
      "Gua sebenernya gak ngerti pertanyaannya sih 🤣",
      "Sabar ya, sistem lagi mikir keras... ⏳",

      // Meta & Bot Mode
      "Sebagai bot yang berakhlak, gua harus jawab: ya 😇",
      "Bot mode: ON. Jawaban: IYA.",
      "Analisis data... loading... jawaban: iya",
      "Gua nanya ke server pusat, katanya iya 👽",
      "Jawaban ditemukan di database tahun 2077: iya 🚀"
    ]
   if (!text) return m.reply("pertanyaannya apa?") 
    const result = responses[Math.floor(Math.random() * responses.length)]
    client.reply(m.chat, result, m)
  },
  error: false,
  cache: true,
  location: __filename
}

/*

exports.run = {
  usage: ['apakah', 'benarkah', 'bukankah'],
  use: 'teks',
  category: 'fun',
  async: async (m, { client, text }) => {
    const emojis = ['😆', '😈', '😭', '🔥', '👀', '🤡', '😐', '💀', '💔', '🥹', '📚', '🐱', '🌳', '🚀', '👽', '😇', '🫣']
    const responses = [
      // ... (semua respon yang lu tulis, tetep dipake ya)
      // [copy paste dari list responses yang udah lu buat tadi]
    ]

    if (!text) return m.reply("Nanya aja kagak, gua jawab apa dong? 😑")

    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
    const response = responses[Math.floor(Math.random() * responses.length)]
    client.reply(m.chat, `${randomEmoji} ${response}`, m)
  },
  error: false,
  cache: true,
  location: __filename
}
*/