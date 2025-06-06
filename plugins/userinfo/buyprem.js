const PhoneNumber = require('awesome-phonenumber');

exports.run = {
  usage: ['buyprem'],
  category: 'user info',
  async: async (m, { client, text, isPrefix, command, Func }) => {
    try {
      global.db.gateway = global.db.gateway || [];
      global.db._confirm = global.db._confirm || {};
      let user = global.db.users.find(v => v.jid == m.sender)
      const PRICE = 20000;
      const DURATION_DAYS = 30;
      const calculateAdminFee = (amount) => Math.ceil(amount * 0.06); // 6% admin
      const sender = m.sender;
      const userPhone = new PhoneNumber('+' + sender.split('@')[0]).getNumber('international');
      const adminFee = calculateAdminFee(PRICE);
      const total = PRICE + adminFee;

      const pending = global.db.gateway.find(x => x.jid === sender && x.state === 'PENDING');
      const premium = global.db.gateway.find(x => x.jid === sender && x.package === 'PREMIUM');
      if (pending) return m.reply('⚠️ Kamu masih punya transaksi yang belum kelar! Ketik *N* kalo mau batalin.');
      if (user.premium) return m.reply('⭐ Kamu udah jadi premium.');

      // Simpen ke buffer konfirmasi
      global.db._confirm[sender] = {
        type: 'premium',
        price: PRICE,
        admin: adminFee,
        total,
        package: 'PREMIUM',
        created_at: Date.now()
      };

      // Teks invoice
      let caption = `🧾 *Faktur “PREMIUM PLAN”*\n\n`;
      caption += `◦ *Nomor* : ${userPhone}\n`;
      caption += `◦ *Harga* : Rp. ${Func.formatter(PRICE)}\n`;
      caption += `◦ *PPN (6%)* : Rp. ${Func.formatter(adminFee)}\n`;
      caption += `◦ *Total Bayar* : Rp. ${Func.formatter(total)}\n`;
      caption += `◦ *Durasi* : ${DURATION_DAYS} Hari\n\n`;
      caption += `Ketik *Y* untuk *lanjut bayar*, atau *N* untuk *batalin proses ini*.`;

      return m.reply(caption);
    } catch (err) {
      return client.reply(m.chat, Func.jsonFormat(err), m);
    }
  },
  error: false,
};