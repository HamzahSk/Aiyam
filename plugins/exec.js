
const { exec } = require('child_process');
const syntax = require('syntax-error');
const util = require('util');
const { redis, redisConnected } = require('../lib/system/redis');
const vm = require('vm');
const os = require('os');

exports.run = {
  async: async (m, allArgs) => {
      const { client, Func, isOwner, users, body } = allArgs;
      if (typeof body !== 'string') return;
      
      // Cek status pengguna
      const sender = m.sender;
      const isAllowedUser = users.allowedAccess ?? false;
      if (!isOwner && !isAllowedUser) return;

      const lines = body.trim().split('\n');
      const command = lines[0].split(' ')[0];
      const text = lines[0].split(' ').slice(1).join(' ') + '\n' + lines.slice(1).join('\n');
      const cleanText = text.trim();
      if (!cleanText) return;

      // Konfigurasi akses terbatas
      const ALLOWED_SHELL_COMMANDS = ['git pull', 'npm install', 'ls', 'ping'];
      const RESTRICTED_MODULES = ['child_process', 'fs', 'os', 'vm'];
      const USER_ALLOWED_MODULES = ['path', 'util', 'buffer', 'node-fetch'];

      // Fungsi validasi shell command
      const validateShellCommand = (cmd) => {
        return ALLOWED_SHELL_COMMANDS.some(allowedCmd => 
          cmd.trim().startsWith(allowedCmd)
        );
      };

      // Fungsi untuk menangani error dengan lebih informatif
      const replyError = async (code, err) => {
         const syntaxErr = syntax(code);
         if (syntaxErr) {
            return m.reply(Func.texted('monospace', syntaxErr));
         }

         let errMsg = `❌ *${err.name || 'Error'}* : \`${err.message}\`\n\n`;
         const matchLine = err.stack?.match(/(\d+):(\d+)/);
         
         if (matchLine) {
            errMsg += `📍 *Lokasi error:* Baris ${matchLine[1]}, Kolom ${matchLine[2]}\n`;
            
            // Menampilkan kode sekitar error
            const errorLine = parseInt(matchLine[1]);
            const codeLines = code.split('\n');
            const start = Math.max(0, errorLine - 2);
            const end = Math.min(codeLines.length, errorLine + 1);
            
            errMsg += `\n📝 *Kode sekitar error:*\n\`\`\`\n`;
            for (let i = start; i < end; i++) {
               errMsg += `${i === errorLine - 1 ? '>> ' : '   '}${codeLines[i]}\n`;
            }
            errMsg += `\`\`\`\n`;
         }

         // Saran spesifik untuk error umum
         if (err instanceof ReferenceError) {
            const notDefined = err.message.split(' ')[0];
            errMsg += `💡 *Saran Perbaikan:*\n`;
            errMsg += `- Variabel \`${notDefined}\` belum didefinisikan\n`;
            errMsg += `- Pastikan variabel tersebut tersedia di context evaluasi\n`;
         } 
         else if (err instanceof TypeError) {
            errMsg += `💡 *Saran Perbaikan:*\n`;
            errMsg += `- Cek tipe data yang digunakan\n`;
            errMsg += `- Pastikan method/properti yang diakses ada\n`;
         }

         return m.reply(errMsg.trim());
      };

      const createContext = () => {
         const context = {
            ...allArgs,
            m,
            util,
            global,
            
            console: {
               log: (...args) => client.sendMessage(m.chat, { 
                  text: Func.texted('monospace', util.format(...args)) 
               }),
               error: (...args) => client.sendMessage(m.chat, { 
                  text: `❌ ${Func.texted('monospace', util.format(...args))}` 
               }),
               warn: (...args) => client.sendMessage(m.chat, { 
                  text: `⚠️ ${Func.texted('monospace', util.format(...args))}` 
               })
            },
            
            require: (mod) => {
              if (!isOwner) {
                if (RESTRICTED_MODULES.includes(mod) || 
                    !USER_ALLOWED_MODULES.includes(mod)) {
                  throw new Error(`Module ${mod} tidak diizinkan`);
                }
              }
              return require(mod);
            },
            
process: {
  env: isOwner ? process.env : {}, // Restrict environment variables
  cwd: isOwner ? () => process.cwd() : () => '/restricted',
  platform: isOwner ? process.platform : 'restricted',
  uptime: isOwner ? process.uptime : () => 0,
  memoryUsage: isOwner ? process.memoryUsage : () => ({})
},
            
            // Batasi akses fungsi untuk non-owner
            Buffer: isOwner ? Buffer : null,
            setTimeout: isOwner ? setTimeout : null,
            setInterval: isOwner ? setInterval : null
         };
         return vm.createContext(context);
      };

      const runEval = async (code, returnResult = true) => {    
         if (!isOwner) {
            const blacklistRegex = /(process\.|child_process|fs\.|eval\(|Function\(|require\(|\.exit)/gi;
            if (blacklistRegex.test(code)) {
               throw new Error('Akses ke fungsi berbahaya dilarang!');
            }
         }
         const context = createContext();
         const script = new vm.Script(
            returnResult ? `(async () => { return ${code} })()` : code,
            { 
               timeout: 5000,
               filename: 'eval.js'
            }
         );
         return script.runInContext(context);
      };
      
      const runExec = async (command) => {
         if (!isOwner && !validateShellCommand(command)) {
            throw new Error('Perintah shell tidak diizinkan!');
         }
         await client.sendReact(m.chat, '🕒', m.key);
         
         return new Promise((resolve) => {
            const child = exec(command, { 
               timeout: 30000,
               maxBuffer: 1024 * 1024 
            });

            let output = '';
            let errorOutput = '';

            child.stdout.on('data', (data) => {
               output += data;
               if (output.length > 500) {
                  client.sendMessage(m.chat, { 
                     text: `📥 Output:\n\`\`\`\n${output.slice(-500)}\n\`\`\`` 
                  });
                  output = '';
               }
            });
            
            

            child.stderr.on('data', (data) => {
               errorOutput += data;
            });

            child.on('close', (code) => {
               if (output) {
                  client.sendMessage(m.chat, { 
                     text: `📦 Final Output:\n\`\`\`\n${output}\n\`\`\`` 
                  });
               }
               if (errorOutput) {
                  client.sendMessage(m.chat, { 
                     text: `⚠️ Error:\n\`\`\`\n${errorOutput}\n\`\`\`` 
                  });
               }
               client.sendMessage(m.chat, { 
                  text: `✅ Process exited with code ${code}` 
               });
               resolve();
            });
         });
      };

      try {
         switch (command) {
            case '=>': {
               if (!isOwner) {
                  throw new Error('Evaluasi kode hanya untuk owner!');
               }
               const result = await runEval(cleanText, true);
               const formatted = util.inspect(result, { 
                  depth: 3,
                  colors: false,
                  maxArrayLength: 10
               });
               return m.reply(Func.texted('monospace', formatted));
            }
            
case '>': {
  if (!isOwner) {
    const safeRegex = /console\.(log|warn|error)/gi;
    if (!safeRegex.test(cleanText)) {
      throw new Error('Hanya operasi console yang diizinkan!');
    }
  }
  await runEval(cleanText, false);
  return m.reply('✅ Eksekusi selesai');
}
            
            case '$': {
               await runExec(cleanText);
               break;
            }
         }
      } catch (e) {
         await replyError(cleanText, e);
      }
   },
   error: false,
   cache: true,
   location: __filename
};
