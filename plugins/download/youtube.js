const DY_SCRAP = require('@dark-yasiya/scrap');
const dy_scrap = new DY_SCRAP();
const axios = require('axios');
const fs = require('fs');
const { join } = require('path');

exports.run = {
   usage: ['ytmp3', 'ytmp4'],
   hidden: ['yta', 'ytv'],
   use: 'link',
   category: 'downloader',
   async: async (m, { client, args, command, Func, users, env }) => {
      try {
         if (!args[0]) return client.reply(m.chat, Func.example(command, '', 'https://youtu.be/0nTo4A2yofc'), m);

         let url = args[0];
         const isMP3 = command.includes('mp3');

         client.sendReact(m.chat, '🕒', m.key);

         const data = isMP3 ? await dy_scrap.ytmp3(url) : await dy_scrap.ytmp4_v2(url, 360);
         if (!data.status) throw new Error('Gagal mengambil data video.');

         const info = data.result.data;
         const downloadUrl = data.result.download.url;
         const ext = isMP3 ? 'mp3' : 'mp4';
         const fileName = `${info.title.substring(0, 64).replace(/[^a-z0-9]/gi, '_')}.${ext}`;

         // Buat folder temp kalau belum ada
         const savePath = join(__dirname, 'temp');
         if (!fs.existsSync(savePath)) fs.mkdirSync(savePath);

         const tempFile = join(savePath, fileName);

         await client.sendReact(m.chat, '⏳', m.key);

         // Download file
         const response = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream'
         });

         const writer = fs.createWriteStream(tempFile);
         response.data.pipe(writer);

         await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
         });

         // Kirim file
         await client.sendFile(m.chat, tempFile, fileName, isMP3 ? '' : `*${info.title}*\n`, m, {}, {
            jpegThumbnail: await Func.createThumb(info.thumbnail)
         });

         // Hapus file abis dikirim
         fs.unlinkSync(tempFile);

         // Info tambahan
         await client.sendMessage(m.chat, {
            text: `乂  *Y O U T U B E - ${isMP3 ? 'A U D I O' : 'V I D E O'}*\n\n` +
                  `◦  *Judul* : ${info.title}\n` +
                  `◦  *Durasi* : ${info.seconds} detik\n` +
                  `◦  *Channel* : ${info.author.name}\n\n` +
                  global.footer,
            contextInfo: {
               externalAdReply: {
                  title: info.title.substring(0, 64),
                  body: `YouTube ${isMP3 ? 'Audio' : 'Video'} Success!`,
                  thumbnailUrl: info.thumbnail,
                  sourceUrl: url,
                  mediaType: 1
               }
            }
         }, { quoted: m });

         await client.sendReact(m.chat, '✅', m.key);

      } catch (e) {
         console.error(e);
         client.reply(m.chat, `Error: ${e.message}`, m);
         client.sendReact(m.chat, '❌', m.key);
      }
   },
   error: false,
   limit: true,
   cache: true,
   location: __filename
};