require('dotenv').config(), require('rootpath')(), console.clear()
const { spawn: spawn } = require('child_process'), path = require('path'), CFonts = require('cfonts'), chalk = require('chalk')

// Tangani penolakan promise yang tidak tertangani
const unhandledRejections = new Map()
process.on('uncaughtException', (err) => {
   if (err.code === 'ENOMEM') {
      console.error('Waduh! Terdeteksi masalah kekurangan memori. Sedang membereskan sisa-sisa...');
      // Lakukan tindakan pemulihan seperti membersihkan cache atau log
   } else {
      console.error('Error Tak Terduga:', err)
   }
})

process.on('unhandledRejection', (reason, promise) => {
   unhandledRejections.set(promise, reason)
   if (reason.code === 'ENOMEM') {
      console.error('Aduh! Kehabisan memori lagi nih. Mencoba memulihkan diri...');
      Object.keys(require.cache).forEach((key) => {
         delete require.cache[key]
      })
   } else {
      console.log('Penolakan Promise yang Tak Tertangani di:', promise, 'alasan:', reason)
   }
})

process.on('rejectionHandled', (promise) => {
   unhandledRejections.delete(promise)
})

process.on('Something went wrong', function (err) {
   console.log('Ups! Ada yang tidak beres nih:', err)
})

process.on('warning', (warning) => {
   if (warning.name === 'MaxListenersExceededWarning') {
      console.warn('Hmm, terindikasi kebocoran memori:', warning.message)
   }
})

function start() {
   let args = [path.join(__dirname, 'client.js'), ...process.argv.slice(2)]
   let p = spawn(process.argv[0], args, { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] })
      .on('message', data => {
         if (data == 'reset') {
            console.log('Mengulang kembali...')
            p.kill()
            delete p
         }
      })
      .on('exit', code => {
         console.error('Keluar dengan kode:', code)
         start()
      })
}

const major = parseInt(process.versions.node.split('.')[0], 10)
if (major < 20) {
   console.error(
      `\n❌ Script ini butuh Node.js versi 20 ke atas biar jalannya mulus!\n` +
      `   Kamu pakai Node.js versi ${process.versions.node} nih.\n` +
      `   Yuk, upgrade dulu ke Node.js 20+ biar bisa lanjut.\n`
   );
   process.exit(1)
}

CFonts.say('AIYAM BOT', {
   font: 'tiny', // Menggunakan font 'tiny' agar lebih kecil
   colors: ['cyan', 'blue'], // Gradasi warna yang menarik
   background: 'transparent'
})

CFonts.say('Skrip Asli: github.com/neoxr/neoxr-bot', {
   font: 'console', // Font konsol yang lebih kecil
   colors: ['green'],
   background: 'transparent'
})

start()