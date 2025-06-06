const fs = require('fs')
const moment = require('moment-timezone') 
const { sizeFormatter } = require('human-readable')

exports.run = {
   usage: ['backup'],
   category: 'owner',
   async: async (m, {
      client,
      env,
      database,
      Func
   }) => {
      try {
         // Tampilkan indikator proses
         await client.sendReact(m.chat, '⏳', m.key)
         const timezone = process.env.TZ
         // Format waktu untuk nama file
         const timestamp = moment().tz(timezone).format('YYYY-MM-DD_HH-mm-ss')
         const backupFileName = `backup_${timestamp}.json`
         
         // Simpan database
         await database.save(global.db)
         
         // Buat file backup
         fs.writeFileSync(backupFileName, JSON.stringify(global.db, null, 2), 'utf-8')
         
         // Dapatkan info file
         const stats = fs.statSync(backupFileName)
         const fileSize = sizeFormatter()(stats.size)
         
         // Format pesan yang menarik
         const successMessage = `💾 *BACKUP BERHASIL* 💾\n\n` +
                               `📁 Nama File: ${backupFileName}\n` +
                               `📊 Ukuran: ${fileSize}\n` +
                               `🕒 Waktu: ${moment().format('DD/MM/YYYY HH:mm:ss')}\n\n` +
                               `✅ Database berhasil disimpan!`
         
         // Kirim file backup dengan caption
         await client.sendFile(
            m.chat, 
            fs.readFileSync(backupFileName), 
            backupFileName, 
            successMessage, 
            m,
            {
               document: true,
               mimetype: 'application/json'
            }
         )
         
         // Hapus file backup lokal setelah dikirim
         fs.unlinkSync(backupFileName)
         
      } catch (e) {
         console.error('Backup Error:', e)
         await client.reply(m.chat, 
            `❌ *GAGAL MEMBUAT BACKUP*\n\n` +
            `Pesan Error: ${e.message}\n\n` +
            `Silakan coba lagi atau periksa log server.`, 
            m
         )
      }
   },
   owner: true,
   cache: true,
   location: __filename
}