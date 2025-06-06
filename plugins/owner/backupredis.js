const { redis } = require('../../lib/system/redis')
const moment = require('moment-timezone')  // <-- Gunakan moment-timezone
const fs = require('fs')
const { sizeFormatter } = require('human-readable')
const path = require('path')

exports.run = {
   usage: ['backupredis'],
   hidden: ['redisdb'],
   category: 'owner',
   async: async (m, { client, Func }) => {
      try {
         // Set timezone default ke Asia/Jakarta (WIB)
         const timezone = process.env.TZ
         
         // Tampilkan indikator proses
         await client.sendReact(m.chat, '⏳', m.key)
         
         // Buat folder temp jika belum ada
         const tempDir = './temp'
         if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
         }

         // Ambil semua keys dari Redis
         const keys = await redis.keys('store:*')
         if (!keys || keys.length === 0) {
            return client.reply(m.chat, '❌ Tidak ada data yang ditemukan di Redis.', m)
         }

         // Format waktu dengan timezone Jakarta
         const timestamp = moment().tz(timezone).format('YYYY-MM-DD_HH-mm-ss')
         const filename = `backup-redis-${timestamp}.json`
         const filepath = path.join(tempDir, filename)

         // Proses backup data
         const backupData = {}
         let totalRecords = 0
         
         for (const key of keys) {
            const rawData = await redis.get(key)
            if (rawData) {
               backupData[key] = JSON.parse(rawData)
               totalRecords++
            }
         }

         // Simpan ke file
         const jsonData = JSON.stringify(backupData, null, 2)
         fs.writeFileSync(filepath, jsonData, 'utf-8')

         // Dapatkan info file
         const stats = fs.statSync(filepath)
         const fileSize = sizeFormatter()(stats.size)

         // Format pesan dengan waktu local
         const successMessage = `💾 *BACKUP REDIS BERHASIL* 💾\n\n` +
                               `📁 Nama File: ${filename}\n` +
                               `📊 Total Data: ${totalRecords} records\n` +
                               `📦 Ukuran: ${fileSize}\n` +
                               `🕒 Waktu (WIB): ${moment().tz(timezone).format('DD/MM/YYYY HH:mm:ss')}\n\n` +
                               `✅ Data Redis berhasil disimpan!`

         // Kirim file backup
         await client.sendFile(
            m.chat,
            fs.readFileSync(filepath),
            filename,
            successMessage,
            m,
            {
               document: true,
               mimetype: 'application/json'
            }
         )

         // Hapus file temporary
         fs.unlinkSync(filepath)

      } catch (err) {
         console.error('[REDIS BACKUP ERROR]', err)
         await client.reply(
            m.chat,
            `❌ *GAGAL MEMBUAT BACKUP REDIS*\n\n` +
            `Error: ${err.message}\n\n` +
            `Silakan coba lagi atau periksa koneksi Redis.`,
            m
         )
      }
   },
   owner: true
}