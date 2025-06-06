const { S_WHATSAPP_NET } = require('@adiwajshing/baileys')
const Jimp = require('jimp')
const fs = require('fs')
const path = require('path')

exports.run = {
   usage: ['aturpp'],
   hidden: ['setpp', 'setprofile'],
   category: 'owner',
   async: async (m, {
      client,
      args,
      setting,
      env,
      Func,
      db
   }) => {
      try {
         const sender = m.sender
         const jakartaTime = new Date().toLocaleString('id-ID', { timeZone: env.Timezone })

         // Cek dan simpan status pemakaian pertama kali
         let ownerData = global.db.users.find(u => u.jid === sender)
         if (!ownerData) {
            ownerData = {
               jid: sender,
               limit: env.limit,
               premium: true,
               firstcommand: { hasUsedSetPP: false }
            }
            global.db.users.push(ownerData)
         } else {
            if (!ownerData.firstcommand) ownerData.firstcommand = {}
            if (typeof ownerData.firstcommand.hasUsedSetPP === 'undefined') {
               ownerData.firstcommand.hasUsedSetPP = false
            }
         }

         if (!ownerData.firstcommand.hasUsedSetPP) {
            const tutorial = `
📢 *Panduan Pengaturan Foto Profil Bot*

• Gunakan command ini dengan membalas gambar/foto
• Format gambar: JPEG atau PNG
• Gambar akan otomatis di-crop menjadi persegi (1:1)
• Kualitas gambar akan dioptimalkan

⚠️ Catatan:
- Ukuran maksimal 5MB
- Perubahan akan tercatat di logs
- Hanya owner yang dapat menggunakan fitur ini
            `
            await client.reply(m.chat, tutorial.trim(), m)
            ownerData.firstcommand.hasUsedSetPP = true
            return
         }

         // Validasi pesan yang dibalas
         const q = m.quoted ? m.quoted : m
         const mime = (q.msg || q).mimetype || ''
         
         if (!/image\/(jpe?g|png)/.test(mime)) {
            return client.reply(m.chat, 
               Func.texted('bold', '🚩 Mohon balas foto yang akan dijadikan profil bot (format JPEG/PNG).'), 
               m
            )
         }

         // Beri indikator proses
         await client.sendReact(m.chat, '⏳', m.key)

         // Buat folder temp jika belum ada
         const tempDir = path.join(process.cwd(), 'temp')
         if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

         // Proses gambar
         const tempPath = path.join(tempDir, `pp-${Date.now()}.jpg`)
         const buffer = await q.download()
         fs.writeFileSync(tempPath, buffer)

         try {
            const { img } = await processProfilePicture(tempPath)
            
            // Update foto profil
            await client.query({
               tag: 'iq',
               attrs: {
                  to: S_WHATSAPP_NET,
                  type: 'set',
                  xmlns: 'w:profile:picture'
               },
               content: [{
                  tag: 'picture',
                  attrs: { type: 'image' },
                  content: img
               }]
            })

            // Simpan sebagai cover default
            setting.cover = buffer.toString('base64')
            setting.ppLastUpdate = new Date() * 1

            // Log action
            if (!global.db.Logs) global.db.Logs = {}
            if (!global.db.Logs.setPP) global.db.Logs.setPP = []
            global.db.Logs.setPP.push({
               date: jakartaTime,
               size: `${Math.round(buffer.length / 1024)} KB`,
               by: sender
            })

            // Rotasi log
            if (global.db.Logs.setPP.length > env.log_limit) {
               global.db.Logs.setPP.shift()
            }

            // Kirim konfirmasi dengan preview
            const successMsg = `
✅ *Foto Profil Berhasil Diubah!*

🖼️ *Detail* :
• Ukuran: ${Math.round(buffer.length / 1024)} KB
• Format: JPEG (1:1)
• Update: ${jakartaTime}

📝 *Logs* : ${global.db.Logs.setPP.length}/${env.log_limit}
            `.trim()

            await client.reply(m.chat, Func.texted('bold', successMsg), m)
            
         } finally {
            // Bersihkan file temporary
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
         }

      } catch (e) {
         console.error('[SETPP ERROR]', e)
         return client.reply(m.chat, 
            Func.texted('bold', `🚩 Gagal mengubah foto profil: ${e.message}`), 
            m
         )
      }
   },
   owner: true,
   error: false,
   cache: true,
   location: __filename
}

/**
 * Proses gambar untuk foto profil
 */
async function processProfilePicture(imagePath) {
   try {
      const jimp = await Jimp.read(imagePath)
      const { width, height } = jimp.bitmap
      
      // Buat gambar persegi (1:1)
      const size = Math.min(width, height)
      const x = (width - size) / 2
      const y = (height - size) / 2
      
      const processed = jimp
         .crop(x, y, size, size) // Crop menjadi persegi
         .quality(85)            // Optimasi kualitas
         .contrast(0.1)          // Sedikit penyesuaian kontras
         .normalize()            // Normalisasi warna
         .cover(720, 720)        // Ukuran standar WhatsApp

      return {
         img: await processed.getBufferAsync(Jimp.MIME_JPEG),
         preview: await processed.getBufferAsync(Jimp.MIME_JPEG)
      }
   } catch (e) {
      console.error('Image processing error:', e)
      throw new Error('Gagal memproses gambar profil')
   }
}