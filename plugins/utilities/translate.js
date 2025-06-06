const translate = require('translate-google-api')

const supportedLangs = {
    'af': 'Afrikaans',
    'sq': 'Albanian',
    'am': 'Amharic',
    'ar': 'Arabic',
    'hy': 'Armenian',
    'az': 'Azerbaijani',
    'eu': 'Basque',
    'be': 'Belarusian',
    'bn': 'Bengali',
    'bs': 'Bosnian',
    'bg': 'Bulgarian',
    'ca': 'Catalan',
    'ceb': 'Cebuano',
    'ny': 'Chichewa',
    'zh-cn': 'Chinese Simplified',
    'zh-tw': 'Chinese Traditional',
    'co': 'Corsican',
    'hr': 'Croatian',
    'cs': 'Czech',
    'da': 'Danish',
    'nl': 'Dutch',
    'en': 'English',
    'eo': 'Esperanto',
    'et': 'Estonian',
    'tl': 'Filipino',
    'fi': 'Finnish',
    'fr': 'French',
    'fy': 'Frisian',
    'gl': 'Galician',
    'ka': 'Georgian',
    'de': 'German',
    'el': 'Greek',
    'gu': 'Gujarati',
    'ht': 'Haitian Creole',
    'ha': 'Hausa',
    'haw': 'Hawaiian',
    'iw': 'Hebrew',
    'hi': 'Hindi',
    'hmn': 'Hmong',
    'hu': 'Hungarian',
    'is': 'Icelandic',
    'ig': 'Igbo',
    'id': 'Indonesian',
    'ga': 'Irish',
    'it': 'Italian',
    'ja': 'Japanese',
    'jw': 'Javanese',
    'kn': 'Kannada',
    'kk': 'Kazakh',
    'km': 'Khmer',
    'ko': 'Korean',
    'ku': 'Kurdish (Kurmanji)',
    'ky': 'Kyrgyz',
    'lo': 'Lao',
    'la': 'Latin',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'lb': 'Luxembourgish',
    'mk': 'Macedonian',
    'mg': 'Malagasy',
    'ms': 'Malay',
    'ml': 'Malayalam',
    'mt': 'Maltese',
    'mi': 'Maori',
    'mr': 'Marathi',
    'mn': 'Mongolian',
    'my': 'Myanmar (Burmese)',
    'ne': 'Nepali',
    'no': 'Norwegian',
    'ps': 'Pashto',
    'fa': 'Persian',
    'pl': 'Polish',
    'pt': 'Portuguese',
    'ma': 'Punjabi',
    'ro': 'Romanian',
    'ru': 'Russian',
    'sm': 'Samoan',
    'gd': 'Scots Gaelic',
    'sr': 'Serbian',
    'st': 'Sesotho',
    'sn': 'Shona',
    'sd': 'Sindhi',
    'si': 'Sinhala',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'so': 'Somali',
    'es': 'Spanish',
    'su': 'Sundanese',
    'sw': 'Swahili',
    'sv': 'Swedish',
    'tg': 'Tajik',
    'ta': 'Tamil',
    'te': 'Telugu',
    'th': 'Thai',
    'tr': 'Turkish',
    'uk': 'Ukrainian',
    'ur': 'Urdu',
    'uz': 'Uzbek',
    'vi': 'Vietnamese',
    'cy': 'Welsh',
    'xh': 'Xhosa',
    'yi': 'Yiddish',
    'yo': 'Yoruba',
    'zu': 'Zulu'
}

exports.run = {
   usage: ['translate'],
   hidden: ['tr'],
   use: '[lang] [text] / reply + .tr [lang]',
   category: 'utilities',
   async: async (m, { client, text, isPrefix, command, Func }) => {
      if (!text && !m.quoted) return client.reply(m.chat, Func.example(isPrefix, command, 'id i love you'), m)

      if (text.toLowerCase() === 'lang') {
         let listLang = Object.entries(supportedLangs)
            .map(([code, name]) => `• ${code} = ${name}`).join('\n')
         return client.reply(m.chat, Func.texted('bold', `✦ Daftar Kode Bahasa:\n\n${listLang}`), m)
      }

      let lang = null
      let data = null

      if (m.quoted && m.quoted.text) {
         if (text) {
            const split = text.split(' ')
            if (split[0].length === 2 && supportedLangs[split[0]]) {
               lang = split[0]
            } else {
               data = text
            }
         }
         data = data || m.quoted.text
      } else {
         const split = text.trim().split(' ')
         if (split[0].length === 2 && supportedLangs[split[0]]) {
            lang = split[0]
            data = split.slice(1).join(' ')
         } else {
            data = text
         }
      }

      if (!data) return client.reply(m.chat, Func.texted('bold', '🚩 Mana teks yang mau diterjemahin?'), m)

      try {
         // Deteksi otomatis
         if (!lang) {
            const detect = await translate(data)
            const from = detect[1].language
            lang = (from === 'id') ? 'en' : 'id'
         }

         const result = await translate(data, { to: lang })
         client.reply(m.chat, `🌐 *Terjemahan [${lang}]*\n\n${result[0]}`, m)
      } catch (e) {
         console.log(e)
         return client.reply(m.chat, Func.texted('bold', `🚩 Error atau kode bahasa gak didukung.`), m)
      }
   },
   error: false,
   cache: true,
   location: __filename
}