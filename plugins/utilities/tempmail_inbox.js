exports.run = {
   usage: ['tempmailinbox'],
   use: 'session_id',
   category: 'utilities',
   async: async (m, { client, text, isPrefix, command, Func }) => {
      if (!text) return client.reply(m.chat, Func.example(isPrefix, command, 'U2Vzc2lvteyuON5LcIenH496pLnl'), m)

      try {
         client.sendReact(m.chat, '🕐', m.key)

         let url = `https://apis.davidcyriltech.my.id/temp-mail/inbox?id=${encodeURIComponent(text)}`
         let res = await Func.fetchJson(url)

         if (!res.success || !Array.isArray(res.messages)) {
            await client.sendReact(m.chat, '❌', m.key)
            return client.reply(m.chat, Func.texted('bold', `❌ Gagal cek inbox! Pastikan session ID-nya bener.`), m)
         }

         if (res.inbox_count === 0 || res.messages.length === 0) {
            await client.sendReact(m.chat, '✅', m.key)
            return client.reply(m.chat, `📭 Inbox kosong, belum ada email masuk.`, m)
         }

         let teks = `📨 *${res.inbox_count} Pesan Ditemukan!*\n\n`
         for (let i = 0; i < res.messages.length; i++) {
            let msg = res.messages[i]
            teks += `📧 *Subject:* ${msg.subject || '(tidak ada)'}\n`
            teks += `✉️ *From:* ${msg.from || '-'}\n`
            teks += `📅 *Date:* ${msg.date || '-'}\n`
            teks += `📝 *Isi:* ${msg.body || '(kosong)'}\n\n`
         }

         await client.sendReact(m.chat, '✅', m.key)
         client.reply(m.chat, teks.trim(), m)

      } catch (e) {
         console.log(e)
         await client.sendReact(m.chat, '❌', m.key)
         client.reply(m.chat, Func.texted('mono', `Error:\n${e.message}`), m)
      }
   },
   error: false,
   cache: true,
   register: true,
   location: __filename
}