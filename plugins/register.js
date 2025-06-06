exports.run = {
   usage: ['daftar', 'register'],
   category: 'main',
   async: async (m, {
      client,
      text,
      isRegister,
      Func,
      env
   }) => {
      try {
         // Cari pengguna di database
         let user = global.db.users.find(v => v.jid === m.sender)
         
         // Jika sudah terdaftar
         if (isRegister) {
            const registeredInfo = `
📌 *Profil Terdaftar* 📌
            
👤 *Nama*: ${user.nama}
🎂 *Umur*: ${user.age} tahun
🔑 *Token*: ${user.token}
📅 *Tanggal Daftar*: ${user.regTime}
💰 *Saldo*: ${await Func.toRupiah(user.saldo)}
`.trim()
            return m.reply(registeredInfo)
         }

         // Validasi format input
         if (!text) return m.reply(formatHelp())
         const teks = text.split('|')
         if (teks.length < 2) return m.reply(formatHelp())

         const [nama, umur] = teks.map(v => v.trim())
         
         // Validasi input
         if (!nama) return m.reply('❌ Nama tidak boleh kosong!')
         if (nama.length > 30) return m.reply('❌ Nama terlalu panjang (maks 30 karakter)')
         if (!umur || isNaN(umur)) return m.reply('❌ Umur harus berupa angka!')
         if (umur < 5 || umur > 100) return m.reply('❌ Umur harus antara 5-100 tahun!')

         // Buat user baru jika belum ada
         if (!user) {
            user = { 
               jid: m.sender,
               saldo: 0, // Bonus saldo awal
               limit: 10, // Bonus limit awal
               premium: false
            }
            global.db.users.push(user)
         }

         // Update data user
         user.nama = nama
         user.age = parseInt(umur)
         user.token = Func.uuid()
         user.limit += 25
         user.saldo = 25000
         user.register = true
         user.regTime = new Date().toLocaleString('id-ID', { timeZone: env.Timezone });

         // Response sukses
         const successMsg = `
🎉 *Pendaftaran Berhasil!* 🎉

👤 *Nama*: ${user.nama}
🎂 *Umur*: ${user.age} tahun
🔑 *Token*: ${user.token}
💰 *Bonus Saldo*: Rp 25.000,00
🎁 *Bonus Limit*: 25 limit

Gunakan token untuk verifikasi penting.
Simpan baik-baik ya!
`.trim()
         m.reply(successMsg)

         // Kirim pesan selamat datang
         setTimeout(() => {
            client.sendMessage(m.sender, {
               text: `Halo ${user.nama}! 👋\nSelamat datang di bot kami. Ketik *.menu* untuk melihat daftar perintah.`
            })
         }, 2000)

      } catch (error) {
         console.error('Register error:', error)
         m.reply('⚠️ Terjadi kesalahan saat pendaftaran. Silakan coba lagi atau hubungi admin.')
      }
   },
   error: false,
   private: true,
   cache: true,
   location: __filename
}

// Fungsi bantuan untuk format
function formatHelp() {
   return `
❌ *Format Salah* ❌

Contoh penggunaan:
.daftar Nama Lengkap|Umur

Contoh:
.daftar Budi Santoso|17

Pastikan menggunakan tanda pipa (|) sebagai pemisah.
`.trim()
}