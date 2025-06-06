const fs = require('fs')
const path = require('path')

exports.run = {
   usage: ['tovideo'],
   hidden: ['tovid', 'tomp4'],
   use: 'balas stiker gif',
   category: 'converter',
   async: async (m, { client, Func }) => {
      try {
         // Validasi pesan yang dibalas
         if (!m.quoted) return client.reply(m.chat, Func.texted('bold', '🚩 Balas stiker gif dulu.'), m)

         const q = m.quoted
         const mime = (q.msg || q).mimetype || ''
         
         // Validasi tipe media
         if (!/webp/.test(mime)) {
            return client.reply(m.chat, Func.texted('bold', '🚩 Yang lo balas harus stiker gif webp.'), m)
         }

         // Kirim reaksi sebagai indikator proses
         await client.sendReact(m.chat, '🕒', m.key)

         // Buat folder temp jika belum ada
         const tempDir = './temp'
         if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir)
         }

         // Download file stiker
         const mediaPath = await q.download()
         
         // Validasi file yang didownload
         if (!fs.existsSync(mediaPath)) {
            throw new Error('File tidak berhasil didownload')
         }

         // Convert webp ke mp4
         const convertResult = await Func.webp2mp4File(mediaPath)
         
         // Hapus file sementara
         fs.unlinkSync(mediaPath)

         // Handle hasil konversi
         if (!convertResult?.status || !convertResult.result) {
            return client.reply(m.chat, Func.texted('bold', '🚩 Gagal convert stiker ke video.'), m)
         }

         // Kirim video hasil convert dengan timeout
         await client.sendMessage(m.chat, { 
            video: { 
               url: convertResult.result,
               caption: '🎞️ Konversi WebP ke Video berhasil!',
               mimetype: 'video/mp4'
            } 
         }, { 
            quoted: m,
            ephemeralExpiration: 24 * 60 * 60 // 24 jam
         })

      } catch (e) {
         console.error('[TOVIDEO ERROR]', e)
         
         // Coba hapus file sementara jika ada
         try {
            if (mediaPath && fs.existsSync(mediaPath)) {
               fs.unlinkSync(mediaPath)
            }
         } catch (cleanupError) {
            console.error('[CLEANUP ERROR]', cleanupError)
         }
         
         return client.reply(m.chat, 
            Func.texted('bold', `🚩 Ada error saat convert stikernya: ${e.message}`), 
            m
         )
      }
   },
   error: false,
   limit: true,
   cache: true,
   location: __filename
}