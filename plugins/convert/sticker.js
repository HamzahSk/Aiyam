exports.run = {
   usage: ['sticker'],
   hidden: ['s', 'sk', 'stiker', 'sgif'],
   use: 'query / reply media [packname|author]',
   category: 'converter',
   async: async (m, { client, text, isPrefix, command, Func }) => {
      try {
         // Kirim reaksi sebagai indikator proses
         await client.sendReact(m.chat, '🕒', m.key);
         
         // Ekstrak packname dan author dari text jika ada
         let [packname, ...author] = text.split('|');
         author = (author || []).join('|').trim();
         
         // Gunakan default setting jika tidak ada custom watermark
         const useDefault = !text.includes('|');
         const exif = global.db.setting;
         
         // Fungsi untuk mengirim sticker dengan parameter yang sesuai
         const sendSticker = async (imgBuffer) => {
            const stickerOptions = {
               packname: useDefault ? exif.sk_pack : (packname || ''),
               author: useDefault ? exif.sk_author : (author || '')
            };
            
            await client.sendSticker(m.chat, imgBuffer, m, stickerOptions);
            console.log(`[STICKER] Sticker berhasil dikirim ${useDefault ? 'dengan default watermark' : 'dengan custom watermark'}`);
         };

         // Handle quoted message atau viewOnce
         if (m.quoted ? m.quoted.message : m.msg.viewOnce) {
            const type = m.quoted ? Object.keys(m.quoted.message)[0] : m.mtype;
            const q = m.quoted ? m.quoted.message[type] : m.msg;
            
            // Validasi durasi video
            if (/video/.test(type) && q.seconds > 10) {
               return client.reply(m.chat, Func.texted('bold', '🚩 Durasi video maksimal 10 detik.'), m);
            }
            
            const img = await client.downloadMediaMessage(q);
            await sendSticker(img);
            return;
         }

         // Handle regular message
         const q = m.quoted ? m.quoted : m;
         const mime = (q.msg || q).mimetype || '';
         
         // Handle image
         if (/image\/(jpe?g|png)/.test(mime)) {
            const img = await q.download();
            if (!img) return client.reply(m.chat, global.status.wrong, m);
            await sendSticker(img);
            return;
         }
         
         // Handle video
         if (/video/.test(mime)) {
            if ((q.msg || q).seconds > 10) {
               return client.reply(m.chat, Func.texted('bold', '🚩 Durasi video maksimal 10 detik.'), m);
            }
            const img = await q.download();
            if (!img) return client.reply(m.chat, global.status.wrong, m);
            await sendSticker(img);
            return;
         }

         // Jika tidak ada media yang valid
         const usageInfo = `Contoh penggunaan:\n`
            + `• *${isPrefix + command}* (balas media)\n`
            + `• *${isPrefix + command} Nama Pack|Author* (untuk custom watermark)`;
         client.reply(m.chat, Func.texted('bold', `🚩 Mohon balas atau kirim foto/video untuk dijadikan sticker.\n\n${usageInfo}`), m);

      } catch (e) {
         console.error('[STICKER] Error:', e);
         client.reply(m.chat, Func.texted('bold', '⚠️ Gagal membuat sticker. Silakan coba lagi.'), m);
      }
   },
   error: false,
   limit: true,
   cache: true,
   location: __filename
};