exports.run = {
   usage: ['tourl'],
   hidden: ['upload'],
   use: 'kirim / reply foto/video',
   category: 'utilities',
   async: async (m, { client, Func }) => {
      try {
         let q = m.quoted ? m.quoted : m;
         let mime = (q.msg || q).mimetype || '';

         if (!/image\/(jpe?g|png)|video\/mp4/.test(mime)) {
            return client.reply(m.chat, Func.texted('bold', `🚩 Kirim atau reply ke gambar *atau* video (mp4) dulu.`), m);
         }

         client.sendReact(m.chat, '🕒', m.key);

         let mediaBuffer = await q.download();
         if (!mediaBuffer) return client.reply(m.chat, global.status.wrong, m);

         const fs = require('fs');
         const path = require('path');
         const tempDir = path.join(__dirname, '../temp');

         if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

         const ext = mime.includes('image') ? 'jpg' : 'mp4';
         const tempPath = path.join(tempDir, Func.filename(ext));
         fs.writeFileSync(tempPath, mediaBuffer);

         // Upload ke Cloudinary
         const url = await Func.uploadToCloudinary(tempPath, mime.includes('video') ? 'video' : 'image');

         // Hapus file tmp
         try { fs.unlinkSync(tempPath); } catch {}

         if (!url) {
            return client.reply(m.chat, Func.texted('bold', '❌ Gagal upload ke Cloudinary.'), m);
         }

         client.sendMessageModify(m.chat, `🚀 *Sukses Upload!*\n\n📎 *Link:* ${url}`, m, {
            largeThumb: true,
            thumbnail: mime.includes('image') ? mediaBuffer : null
         });

      } catch (e) {
         console.log('[TOURL ERROR]', e);
         client.reply(m.chat, Func.texted('bold', '❌ Terjadi kesalahan saat upload.'), m);
      }
   },
   error: false,
   limit: 10,
   cache: true,
   premium: true,
   location: __filename
}