exports.run = {
  async: async (m, { client, body, Func }) => {
    try {
      const text = body.trim().toLowerCase();
      const sender = m.sender;
      global.db._confirm = global.db._confirm || {};

      const conf = global.db._confirm[sender];
      if (!conf || conf.type !== 'premium') return;

      if (text === 'y') {
        // Proses ke pembayaran
        const trxId = 'NXR-' + Func.makeId(8);
        const expired = Date.now() + 10 * 60 * 1000; // 10 menit ke depan
        const qrImg = global.db.setting.cover // Ganti ke URL QR asli kalo ada

        // Simpen transaksi ke gateway
        global.db.gateway.push({
          _id: trxId,
          jid: sender,
          state: 'WAITING_PAYMENT',
          amount: conf.price,
          admin: conf.admin,
          package: conf.package,
          created_at: Date.now(),
          expired,
          receipt: '',
          qrid: trxId
        });

        delete global.db._confirm[sender]; // Hapus dari buffer

        let msg = `乂  *Q R I S*\n\n`;
        msg += `“Lakukan pembayaran sebelum 10 menit”\n\n`;
        msg += `➠ *ID* : ${trxId}\n`;
        msg += `➠ *Total* : Rp. ${Func.formatter(conf.total)}\n\n`;
        msg += `*Catatan* :\n`;
        msg += `- Kode QR hanya berlaku untuk 1x transfer dan expired dalam 10 menit.\n`;
        msg += `- Setelah bayar, kirim *check* untuk lihat status pembayaran.\n`;
        msg += `- Kalau ada kendala, hubungi *owner* ya.`;

        return await client.sendFile(m.chat, qrImg, 'qris.jpg', msg, m);
      }

      if (text === 'n') {
        delete global.db._confirm[sender];
        return m.reply('❌ Proses pembelian udah dibatalin. Kalo mau beli lagi ketik *!buyprem* ya.');
      }
    } catch (err) {
      return client.reply(m.chat, Func.jsonFormat(err), m);
    }
  },
  error: false,
  cache: true,
  location: __filename
};