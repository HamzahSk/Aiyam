const yts = require('yt-search');
const got = require('got');
const stream = require('stream');
const { promisify } = require('util');
const { Buffer } = require('buffer');
const DY_SCRAP = require('@dark-yasiya/scrap');
const dy_scrap = new DY_SCRAP();
const pipeline = promisify(stream.pipeline);

exports.run = {
  usage: ['play'],
  use: 'query',
  category: 'downloader',
  async: async (m, { client, text, isPrefix, command, Func }) => {
    try {
      if (!text) return client.reply(m.chat, Func.example(isPrefix, command, 'dear god'), m);
      
      await client.sendReact(m.chat, '🕒', m.key);

      const search = await yts(text);
      if (!search.videos.length) throw new Error('Video tidak ditemukan');
      const video = search.videos[0];

      const data = await dy_scrap.ytmp3(video.url);
      const audioUrl = data.result.download.url;
      if (!audioUrl) throw new Error('Audio URL tidak tersedia');

      const audioBuffer = await (async () => {
        const chunks = [];
        await pipeline(
          got.stream(audioUrl, {
            headers: {
              'user-agent': 'Mozilla/5.0'
            }
          }),
          new stream.Writable({
            write(chunk, enc, cb) {
              chunks.push(chunk);
              cb();
            }
          })
        );
        return Buffer.concat(chunks);
      })();

      await client.sendFile(m.chat, audioBuffer, `${video.title.substring(0, 32)}.mp3`, '', m, {
        document: true,
        mimetype: 'audio/mpeg',
        APIC: await Func.fetchBuffer(video.thumbnail)
      }, {
        jpegThumbnail: await Func.createThumb(video.thumbnail)
      });

      await client.sendMessage(m.chat, {
        text: `乂  *Y T - P L A Y*\n\n` +
              `◦  *Title* : ${video.title}\n` +
              `◦  *Duration* : ${video.timestamp}\n` +
              `◦  *Channel* : ${video.author.name}\n\n` +
              global.footer,
        contextInfo: {
          externalAdReply: {
            title: video.title.substring(0, 64),
            body: "Audio Success!",
            thumbnailUrl: video.thumbnail,
            sourceUrl: video.url,
            mediaType: 1
          }
        }
      }, { quoted: m });

      await client.sendReact(m.chat, '✅', m.key);

    } catch (e) {
      console.error('[YTMP3] Error:', e);
      client.reply(m.chat, `❌ Gagal: ${e.message}`, m);
      client.sendReact(m.chat, '❌', m.key);
    }
  },
  error: false,
  restrict: true,
  cache: true,
  location: __filename
};