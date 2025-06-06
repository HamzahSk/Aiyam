const Jimp = require('jimp')
const fs = require('fs')
const path = require('path')

exports.run = {
   usage: ['setcover'],
   hidden: ['cover'],
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
         
         // Cek dan simpan status pemakaian pertama kali
         let ownerData = global.db.users.find(u => u.jid === sender)
         if (!ownerData) {
            ownerData = {
               jid: sender,
               limit: env.limit,
               premium: true,
               firstcommand: { hasUsedSetCover: false }
            }
            global.db.users.push(ownerData)
         } else {
            if (!ownerData.firstcommand) ownerData.firstcommand = {}
            if (typeof ownerData.firstcommand.hasUsedSetCover === 'undefined') {
               ownerData.firstcommand.hasUsedSetCover = false
            }
         }

         if (!ownerData.firstcommand.hasUsedSetCover) {
            const tutorial = `
📢 *Panduan Penggunaan .setcover*

• Reply gambar yang ingin dijadikan cover bot
• Gambar akan otomatis di-crop ke rasio 16:9 (landscape)
• Kualitas gambar akan dioptimalkan

⚠️ Catatan:
- Hanya menerima format JPEG/PNG
- Ukuran maksimal 5MB
- Perubahan akan tercatat di logs
            `
            await client.reply(m.chat, tutorial.trim(), m)
            ownerData.firstcommand.hasUsedSetCover = true
            return
         }

         // Validasi gambar
         const q = m.quoted ? m.quoted : m
         const mime = (q.msg || q).mimetype || ''
         
         if (!/image\/(jpe?g|png)/.test(mime)) {
            return client.reply(m.chat, 
               Func.texted('bold', '🚩 Mohon reply gambar (JPEG/PNG) untuk dijadikan cover.'), 
               m
            )
         }

         // Proses pengolahan gambar
         await client.sendReact(m.chat, '⏳', m.key)
         
         const tempPath = path.join(process.cwd(), 'temp', `${Date.now()}.jpg`)
         fs.writeFileSync(tempPath, await q.download())
         
         try {
            const buffer = await processCoverImage(tempPath)
            const jakartaTime = new Date().toLocaleString('id-ID', { timeZone: env.Timezone })
            
            // Simpan cover baru
            setting.cover = buffer.toString('base64')
            setting.coverLastUpdate = new Date() * 1
            
            // Log action
            if (!global.db.Logs) global.db.Logs = {}
            if (!global.db.Logs.setCover) global.db.Logs.setCover = []
            global.db.Logs.setCover.push({
               date: jakartaTime,
               size: `${Math.round(buffer.length / 1024)} KB`,
               by: sender
            })
            
            // Rotasi log jika melebihi limit
            if (global.db.Logs.setCover.length > env.log_limit) {
               global.db.Logs.setCover.shift()
            }

            // Kirim preview
            await client.sendFile(m.chat, buffer, 'cover.jpg', 
               `✅ *Cover berhasil diupdate!*\n\n` +
               `• Ukuran: ${Math.round(buffer.length / 1024)} KB\n` +
               `• Format: Landscape (16:9)\n` +
               `• Update: ${jakartaTime}\n\n` +
               `📝 Logs tersimpan: ${global.db.Logs.setCover.length}/${env.log_limit}`, 
               m
            )
            
         } finally {
            // Bersihkan file temporary
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
         }

      } catch (e) {
         console.error('[SETCOVER ERROR]', e)
         return client.reply(m.chat, 
            Func.texted('bold', `🚩 Gagal memproses cover: ${e.message}`), 
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
 * Proses gambar cover ke format landscape
 */
async function processCoverImage(imagePath) {
   try {
      const image = await Jimp.read(imagePath)
      const { width, height } = image.bitmap
      const targetRatio = 16 / 9
      const currentRatio = width / height

      // Hitung dimensi crop
      let cropWidth, cropHeight
      if (currentRatio > targetRatio) {
         // Potong sisi kiri/kanan
         cropHeight = height
         cropWidth = Math.floor(height * targetRatio)
      } else {
         // Potong atas/bawah
         cropWidth = width
         cropHeight = Math.floor(width / targetRatio)
      }

      // Hitung posisi crop (center)
      const x = Math.floor((width - cropWidth) / 2)
      const y = Math.floor((height - cropHeight) / 2)

      // Proses crop dan resize
      image
         .crop(x, y, cropWidth, cropHeight)
         .quality(85) // Kompresi kualitas
         .contrast(0.1) // Sedikit perbaikan kontras

      // Konversi ke buffer
      return await image.getBufferAsync(Jimp.MIME_JPEG)
      
   } catch (e) {
      console.error('Image processing error:', e)
      throw new Error('Gagal memproses gambar')
   }
}