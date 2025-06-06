const { Component } = require('@neoxr/wb');
const { Converter } = new Component();
const { readFileSync: read, unlinkSync: remove, writeFileSync: create } = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { tmpdir } = require('os');
const util = require('util');

// Promisify exec untuk penggunaan async/await
const execAsync = util.promisify(exec);

exports.run = {
   usage: ['tomp3', 'tovn'],
   hidden: ['toaudio'],
   use: 'balas media (audio/video) atau kirim file audio/video',
   category: 'converter',
   async: async (m, { client, command, Func }) => {
      try {
         // Log awal proses
         console.log(`[CONVERTER] Memulai proses konversi oleh ${m.sender}`);
         client.sendReact(m.chat, '🕒', m.key);

         const q = m.quoted ? m.quoted : m;
         const mime = (q.msg || q).mimetype || '';
         const isPTT = /tovn/.test(command);
         
         // Fungsi helper untuk mengirim hasil konversi
         const sendResult = async (audioBuffer) => {
            const filename = `converted_${Date.now()}.mp3`;
            await client.sendFile(
               m.chat, 
               audioBuffer, 
               filename, 
               '', 
               m, 
               isPTT ? { ptt: true, waveform: [0,99,0,99,0,99,0,99] } : {}
            );
            console.log(`[CONVERTER] Berhasil mengirim hasil konversi ke ${m.sender}`);
         };

         // Fungsi helper untuk konversi dengan ffmpeg
         const convertWithFFmpeg = async (inputPath) => {
            const outputPath = path.join(tmpdir(), Func.filename('mp3'));
            
            try {
               await execAsync(`ffmpeg -i ${inputPath} -vn -ar 44100 -ac 2 -b:a 192k -f mp3 ${outputPath}`);
               const resultBuffer = read(outputPath);
               return resultBuffer;
            } finally {
               try { remove(inputPath); } catch {}
               try { remove(outputPath); } catch {}
            }
         };

         // 1. Handle tombol video (misal dari YouTube downloader)
         if (m.quoted && typeof m.quoted.buttons !== 'undefined' && typeof m.quoted.videoMessage !== 'undefined') {
            console.log('[CONVERTER] Memproses video dari tombol');
            const mediaPath = await client.saveMediaMessage(m.quoted.videoMessage);
            const converted = await convertWithFFmpeg(mediaPath);
            await sendResult(converted);
            return;
         }

         // 2. Handle audio OGG (dari VN/stiker suara)
         if (/ogg/.test(mime)) {
            console.log('[CONVERTER] Memproses audio OGG');
            const buffer = await q.download();
            const tempInput = path.join(tmpdir(), Func.filename('ogg'));
            create(tempInput, buffer);
            
            const converted = await convertWithFFmpeg(tempInput);
            await sendResult(converted);
            return;
         }

         // 3. Handle audio/video umum
         if (/audio|video/.test(mime)) {
            console.log('[CONVERTER] Memproses media umum');
            const buffer = await q.download();
            
            // Coba gunakan Converter terlebih dahulu
            try {
               const converted = await Converter.toAudio(buffer, 'mp3');
               await sendResult(converted);
            } catch (e) {
               console.log('[CONVERTER] Fallback ke FFmpeg');
               const tempInput = path.join(tmpdir(), Func.filename('media'));
               create(tempInput, buffer);
               
               const converted = await convertWithFFmpeg(tempInput);
               await sendResult(converted);
            }
            return;
         }

         // Jika tidak ada media yang valid
         client.reply(m.chat, Func.texted('bold', `🚩 Mohon balas atau kirim file audio/video yang ingin dikonversi ke MP3.`), m);

      } catch (err) {
         console.error('[CONVERTER] Error:', err);
         client.reply(m.chat, Func.texted('bold', `⚠️ Terjadi kesalahan saat konversi. Silakan coba lagi.`), m);
      }
   },
   error: false,
   limit: true,
   premium: true, // Tambahkan opsi premium
   cache: true,
   location: __filename
};