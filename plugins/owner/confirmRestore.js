const fs = require('fs')
const path = require('path')

exports.run = {
   async: async (m, { client, body, Func, setting, env, database }) => {
      try {
         const text = body.trim().toLowerCase();
         const sender = m.sender;
         global.db._confirm = global.db._confirm || {};

         const conf = global.db._confirm[sender];
         if (!conf || conf.type !== 'restore') return;

         if (text === 'y') {
            // Proses restore
            await client.reply(m.chat, Func.texted('bold', '🔄 Memulai proses restore...'), m);

            // Restore database
            global.db = conf.backupData;
            await database.save(conf.backupData);
            
            // Hapus file temporary
            fs.unlinkSync(conf.filePath);
            
            // Waktu restore pakai Asia/Jakarta
            const jakartaTime = new Date().toLocaleString('id-ID', { timeZone: env.Timezone });
            setting.lastRestore = new Date().getTime();

            // Simpan histori restore
            const logRestore = env.log_restore || 10;
            if (!global.db.Logs) global.db.Logs = {};
            if (!global.db.Logs.restore) global.db.Logs.restore = [];
            global.db.Logs.restore.push({
               date: jakartaTime,
               totalUsers: conf.backupData.users.length,
               by: sender
            });
            if (global.db.Logs.restore.length > logRestore) {
               global.db.Logs.restore.shift();
            }

            // Kirim laporan
            const successMsg = `
✅ *DATABASE BERHASIL DIPULIHKAN*

• Total user: ${global.db.users.length}
• Pengaturan: ${Object.keys(global.db.setting).length} item
• Terakhir update: ${jakartaTime}

📝 *Catatan*: 
Semua data sebelumnya telah diganti dengan data dari backup.
            `.trim();

            await client.reply(m.chat, successMsg, m);

            await client.sendMessage(m.chat, { delete: { remoteJid: m.chat, id: conf.processingMsg.id } });
            console.log(`[RESTORE] Database dipulihkan oleh ${sender} dengan ${conf.backupData.users.length} user`);
         }

         if (text === 'n') {
            // Batalkan proses
            fs.unlinkSync(conf.filePath);
            await client.reply(m.chat, 
               Func.texted('bold', '🚩 Proses restore dibatalkan.'), 
               m
            );
            await client.sendMessage(m.chat, {delete: { remoteJid: m.chat, id: conf.processingMsg.id }});
         }

         // Hapus konfirmasi
         delete global.db._confirm[sender];

      } catch (e) {
         console.error('[ERROR] Gagal memproses konfirmasi restore:', e);
         return client.reply(m.chat, 
            Func.texted('bold', `🚩 Gagal memproses restore: ${e.message}`), 
            m
         );
      }
   },
   error: false,
   cache: true,
   location: __filename
};