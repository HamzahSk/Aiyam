exports.run = {
   usage: ['tempmail'],
   category: 'utilities',
   async: async (m, { client, Func }) => {
      try {
         client.sendReact(m.chat, '🕐', m.key)

         let res = await Func.fetchJson('https://apis.davidcyriltech.my.id/temp-mail')
         if (!res.success || !res.email) {
            await client.sendReact(m.chat, '❌', m.key)
            return client.reply(m.chat, Func.texted('bold', `❌ Gagal dapetin email sementara!`), m)
         }

         let teks = `📩 *Temporary Email Berhasil Dibuat!*\n\n`
         teks += `◦ Email: ${res.email}\n`
         teks += `◦ Session ID: ${res.session_id}\n`
         teks += `◦ Expired: ${res.expires_at.replace('T', ' ').replace('+00:00', ' (UTC)')}\n\n`
         teks += `✅ Gunakan email ini untuk verifikasi atau keperluan lainnya dalam waktu terbatas.`

         await client.sendReact(m.chat, '✅', m.key)
         client.reply(m.chat, teks, m)

      } catch (e) {
         console.log(e)
         await client.sendReact(m.chat, '❌', m.key)
         client.reply(m.chat, Func.texted('mono', `Error:\n${e.message}`), m)
      }
   },
   error: false,
   cache: true,
   limit: 3,
   register: true,
   location: __filename
}