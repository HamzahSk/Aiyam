const { tmpdir } = require('os')
const fs = require('fs')
const path = require('path')

exports.run = {
   usage: ['voiceai'],
   use: 'model | teks',
   category: 'utilities',
   async: async (m, { client, args, Func }) => {
      try {
         if (!args || !args.includes('|')) {
            await client.sendReact(m.chat, '❌', m.key)
            return client.reply(m.chat, Func.texted('bold', `🚩 Format salah!\nContoh: !voiceai goku | Yah sepi`), m)
         }

         let [model, text] = args.join(' ').split('|').map(v => v.trim())

         if (!model || !text) {
            await client.sendReact(m.chat, '❌', m.key)
            return client.reply(m.chat, Func.texted('bold', `❌ Model & teks gak boleh kosong!`), m)
         }

         let availableModels = ['miku', 'nahida', 'nami', 'ana', 'optimus_prime', 'goku', 'taylor_swift', 'elon_musk', 'mickey_mouse', 'kendrick_lamar', 'angela_adkinsh', 'eminem']
         if (!availableModels.includes(model.toLowerCase())) {
            await client.sendReact(m.chat, '❌', m.key)
            return client.reply(m.chat, Func.texted('bold', `❌ Model tidak valid!\nModel yang tersedia:\n${availableModels.join(', ')}`), m)
         }

         client.sendReact(m.chat, '🕒', m.key)

         let api = `https://apis.davidcyriltech.my.id/voiceai?text=${encodeURIComponent(text)}&model=${encodeURIComponent(model)}`
         let res = await Func.fetchJson(api)

         if (!res.success || !res.audio_url) {
            await client.sendReact(m.chat, '❌', m.key)
            return client.reply(m.chat, Func.texted('bold', '❌ Gagal dapetin link audio dari API.'), m)
         }

         let audioBuffer = await Func.fetchBuffer(res.audio_url)
         if (!audioBuffer || audioBuffer.length < 1024) {
            await client.sendReact(m.chat, '❌', m.key)
            return client.reply(m.chat, Func.texted('bold', '❌ Gagal ambil file audio. Coba lagi nanti.'), m)
         }

         let filePath = path.join(tmpdir(), Func.filename('mp3'))
         fs.writeFileSync(filePath, audioBuffer)

         await client.sendFile(m.chat, fs.readFileSync(filePath), 'voiceai.mp3', '', m, {
            mimetype: 'audio/mpeg',
            ptt: true
         })

         fs.unlinkSync(filePath)
         await client.sendReact(m.chat, '✅', m.key)

      } catch (e) {
         console.log(e)
         await client.sendReact(m.chat, '❌', m.key)
         client.reply(m.chat, Func.texted('mono', `Error:\n${e.message}`), m)
      }
   },
   error: false,
   limit: 3,
   cache: false,
   location: __filename
}