exports.run = {
  usage: ['scraper', 'testscraper'],
  category: 'utility',
  async: async (m, { client, text, Func, args }) => {
    try {
      if (!text) return m.reply('❌ Mohon sertakan kode scraper yang ingin diuji.\n\nContoh: .scraper await fetch("https://example.com")');

      // Konfigurasi keamanan
      const ALLOWED_MODULES = ['axios', 'node-fetch', 'cheerio', 'url'];
      const BLACKLIST_KEYWORDS = ['child_process', 'fs', 'process.env', 'eval', 'Function', 'require'];

      // Validasi keamanan
      const blacklistRegex = new RegExp(BLACKLIST_KEYWORDS.join('|'), 'gi');
      if (blacklistRegex.test(text)) {
        return m.reply('❌ Kode scraper mengandung kata kunci yang dilarang!');
      }

      await client.sendReact(m.chat, '🕒', m.key);

      // Buat context khusus untuk scraper
      const createScraperContext = () => {
        const context = {
          console: {
            log: (...args) => client.sendMessage(m.chat, { 
              text: Func.texted('monospace', util.format(...args)) 
            }),
            error: (...args) => client.sendMessage(m.chat, { 
              text: `❌ ${Func.texted('monospace', util.format(...args))}` 
            })
          },
          require: (mod) => {
            if (!ALLOWED_MODULES.includes(mod)) {
              throw new Error(`Module ${mod} tidak diizinkan untuk scraper`);
            }
            return require(mod);
          },
          fetch: require('node-fetch'),
          axios: require('axios'),
          cheerio: require('cheerio'),
          URLSearchParams: require('url').URLSearchParams,
          setTimeout,
          clearTimeout,
          Buffer
        };
        return vm.createContext(context);
      };

      // Handle special case for function definition
      const isFunctionDefinition = text.includes('function') || text.includes('=>') || text.includes('return');
      const hasReturnCall = text.includes('return') && text.includes('(') && text.includes(')');

      // Jalankan kode scraper
      const runScraper = async (code) => {
        const context = createScraperContext();
        
        let scriptCode;
        if (isFunctionDefinition && hasReturnCall) {
          scriptCode = `(async () => {
            ${code}
          })()`;
        } else if (isFunctionDefinition) {
          scriptCode = `(async () => {
            ${code}
            return typeof ${code.split('=')[0].trim()} === 'function' ? 
                   ${code.split('=')[0].trim()}(${args.slice(1).join(' ') || '""'}) : 
                   ${code.split('=')[0].trim()};
          })()`;
        } else {
          scriptCode = `(async () => {
            try {
              const result = ${code};
              return typeof result === 'object' ? JSON.stringify(result, null, 2) : result;
            } catch (e) {
              console.error('Scraper Error:', e);
              return null;
            }
          })()`;
        }

        const script = new vm.Script(scriptCode, { 
          timeout: 30000,
          filename: 'scraper.js'
        });

        return await script.runInContext(context);
      };

      // Eksekusi dan kirim hasil
      const result = await runScraper(text);
      
      if (result === null) {
        return m.reply('❌ Gagal menjalankan scraper. Cek error di console.');
      }

      // Format hasil
      const formattedResult = typeof result === 'string' ? result : util.inspect(result, { 
        depth: 3,
        colors: false,
        maxArrayLength: 10
      });

      const chunks = Func.chunkString(formattedResult, 1500);
      for (const chunk of chunks) {
        await m.reply(Func.texted('monospace', chunk));
      }

    } catch (e) {
      console.error('Scraper Error:', e);
      m.reply(`❌ Error: ${e.message}\n\n💡 Tips: Pastikan kode scraper valid dan tidak mengakses resource terlarang.`);
    }
  },
  error: false,
  limit: true,
  owner: true,
  premium: false,
  cache: true,
  location: __filename
};