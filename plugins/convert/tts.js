const gtts = require('node-gtts')
const { tmpdir } = require('os')
const fs = require('fs')
const path = require('path')

// List kode bahasa yang didukung
const supportedLangs = {
   'af': 'Afrikaans',
   'ar': 'Arabic',
   'id': 'Indonesian',
   'en': 'English',
   'ja': 'Japanese',
   'ko': 'Korean',
   'fr': 'French',
   'de': 'German',
   'it': 'Italian',
   'pt': 'Portuguese',
   'es': 'Spanish',
   'ru': 'Russian',
   'tr': 'Turkish',
   'zh': 'Chinese'
}

exports.run = {
   usage: ['tts'],
   use: 'kode_bahasa teks',
   category: 'converter',
   async: async (m, { client, text, isPrefix, command, Func }) => {
      // Kalau gak ada teks atau cuma ketik lang
      if (!text || text.toLowerCase() === 'lang') {
         let listLang = Object.entries(supportedLangs).map(([code, lang]) => `• ${code} = ${lang}`).join('\n')
         return client.reply(m.chat, Func.texted('bold', `✦ List Kode Bahasa:\n\n${listLang}\n\nContoh:\n${isPrefix + command} id aku cinta kamu`), m)
      }

      // Potong 2 huruf pertama buat kode bahasa
      let lang = text.slice(0, 2).toLowerCase()
      let msg = text.substring(2).trim()

      // Kalau bukan kode bahasa valid, fallback ke 'id'
      if (!supportedLangs[lang]) {
         lang = 'id'
         msg = text.trim()
      }

      // Kalau masih gak ada teks, tolak
      if (!msg) return client.reply(m.chat, Func.example(isPrefix, command, 'id aku cinta kamu'), m)

      try {
         let tts = gtts(lang)
         let filePath = path.join(tmpdir(), Func.filename('mp3'))
         tts.save(filePath, msg, async () => {
            client.sendFile(m.chat, await Func.fetchBuffer(filePath), 'tts.mp3', '', m)
            fs.unlinkSync(filePath)
         })
      } catch (e) {
         console.log(e)
         return client.reply(m.chat, Func.texted('bold', `🚩 Kode bahasa *${lang}* tidak didukung.\nKetik *${isPrefix + command} lang* untuk lihat list kode bahasa.`), m)
      }
   },
   error: false,
   limit: true,
   cache: true,
   location: __filename
}