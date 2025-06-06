exports.run = {
  usage: ['menfess'],
  use: '(nomor target) (nama samaran)',
  category: 'special',
  async: async (m, { client, text, isPrefix }) => {
    try {
      global.db.menfess = global.db.menfess || {};
      global.db._menfessConfirm = global.db._menfessConfirm || {};

      const sender = m.sender;
      const args = text.trim().split(/\s+/);

      if (args.length < 2) return client.reply(m.chat,
        `❌ Format salah!\nContoh: *${isPrefix}menfess 6281234567890 Nama*`, m);

      const [targetInput, ...aliasParts] = args;
      const alias = aliasParts.join(' ').slice(0, 20);

      // ✨ Bersihin & ubah nomor
      let rawNumber = targetInput.replace(/[^0-9+]/g, '');
      if (rawNumber.startsWith('+')) rawNumber = rawNumber.slice(1);
      else if (rawNumber.startsWith('0')) rawNumber = '62' + rawNumber.slice(1);
      else if (rawNumber.startsWith('8')) rawNumber = '62' + rawNumber;

      const targetJid = rawNumber + '@s.whatsapp.net';

      // 🚫 Jangan kirim ke diri sendiri
      if (targetJid === sender)
        return client.reply(m.chat, '❌ Tidak bisa mengirim ke diri sendiri!', m);

      // ✅ Cek beneran nomor WA atau enggak
      const exists = await client.onWhatsApp(targetJid);
      if (!exists || !exists[0]?.exists) {
        return client.reply(m.chat, '❌ Nomor tidak ditemukan di WhatsApp!', m);
      }

      // 🚫 Cek sesi aktif
      if (global.db.menfess[sender] || global.db.menfess[targetJid])
        return client.reply(m.chat, '❌ Masih ada sesi aktif! Gunakan *!endmenfess* dulu.', m);

      // 📩 Simpan konfirmasi
      global.db._menfessConfirm[sender] = {
        target: targetJid,
        alias,
        expiresAt: Date.now() + 180000
      };

      await client.reply(m.chat,
        `📩 *KONFIRMASI MENFESS*\n\n• Target: ${targetInput}\n• Nama: "${alias}"\n\nBalas *Y* untuk lanjut / *N* untuk batal (3 menit)`, m);

      // ⏱ Timer konfirmasi
      setTimeout(() => {
        if (global.db._menfessConfirm[sender]) {
          delete global.db._menfessConfirm[sender];
          client.reply(m.chat, '❌ Waktu konfirmasi habis.', m).catch(console.error);
        }
      }, 180000);

    } catch (e) {
      console.error(e);
      client.reply(m.chat, '❌ Error sistem. Coba lagi nanti.', m);
    }
  },
  error: false,
  limit: 5,
  cooldown: 3600,
  location: __filename
};