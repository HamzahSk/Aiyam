const { Component } = require('@neoxr/wb')
const { Converter } = new Component
const fs = require('fs')
const { exec } = require('child_process')

exports.run = {
   usage: ['bass', 'blown', 'chipmunk', 'deep', 'earrape', 'fast', 'fat', 'nightcore', 'reverse', 'robot', 'slow', 'smooth'],
   use: 'balas audio',
   category: 'pengubah suara',
   async: async (m, {
      client,
      command,
      Func
   }) => {
      try {
         if (!m.quoted) return client.reply(m.chat, Func.texted('bold', `🚩 Balas audio yang mau diubah.`), m)

         let mime = ((m.quoted ? m.quoted : m.msg).mimetype || '')
         let set

         switch (command) {
            case 'bass': set = '-af equalizer=f=94:width_type=o:width=2:g=30'; break
            case 'blown': set = '-af acrusher=.1:1:64:0:log'; break
            case 'deep': set = '-af atempo=4/4,asetrate=44500*2/3'; break
            case 'earrape': set = '-af volume=12'; break
            case 'fast': set = '-filter:a "atempo=1.63,asetrate=44100"'; break
            case 'fat': set = '-filter:a "atempo=1.6,asetrate=22100"'; break
            case 'nightcore': set = '-filter:a atempo=1.06,asetrate=44100*1.25'; break
            case 'reverse': set = '-filter_complex "areverse"'; break
            case 'robot': set = '-filter_complex "afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=512:overlap=0.75"'; break
            case 'slow': set = '-filter:a "atempo=0.7,asetrate=44100"'; break
            case 'smooth': set = '-filter:v "minterpolate=\'mi_mode=mci:mc_mode=aobmc:vsbmc=1:fps=120\'"'; break
            case 'chipmunk': set = '-filter:a "atempo=0.5,asetrate=65100"'; break
         }

         if (/audio/.test(mime)) {
            client.sendReact(m.chat, '🕒', m.key)

            const buffer = await Converter.toAudio(await m.quoted.download(), 'mp3')
            const parse = await Func.getFile(buffer)
            const namaFile = Func.filename('mp3')

            exec(`ffmpeg -i ${parse.file} ${set} ${namaFile}`, async (err) => {
               fs.unlinkSync(parse.file)
               if (err) return client.reply(m.chat, Func.texted('bold', `🚩 Gagal mengubah audio.`), m)

               const hasil = fs.readFileSync(namaFile)

               if (m.quoted.ptt) {
                  await client.sendFile(m.chat, hasil, 'audio.mp3', '', m, { ptt: true })
               } else {
                  await client.sendFile(m.chat, hasil, 'audio.mp3', '', m)
               }

               fs.unlinkSync(namaFile)
            })
         } else {
            client.reply(m.chat, Func.texted('bold', `🚩 Balas audio yang mau diubah.`), m)
         }
      } catch (e) {
         console.log(e)
         return client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   error: false,
   limit: true,
   cache: true,
   location: __filename
}