const { Component } = require('@neoxr/wb')
const { Scraper } = new Component

const axios = require('axios');
const cheerio = require('cheerio');
const got = require('got');
const qs = require('qs');
const FormData = require('form-data');

Scraper.spotifyDl = async (url) => {
	try {
		const response = await axios.get('https://spotifymate.com/en', {
			headers: {
				cookie: 'session_data=o8079end5j9oslm5a7bou84rqc;',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
			},
		});

		const $ = cheerio.load(response.data);
		const hiddenInput = $('form#get_video input[type="hidden"]');
		const formData = new FormData();
		formData.append('url', url);
		formData.append(hiddenInput.attr('name') || '', hiddenInput.attr('value') || '');

		const postResponse = await axios.post('https://spotifymate.com/action', formData, {
			headers: {
				origin: 'https://spotifymate.com/en',
				...formData.getHeaders(),
				cookie: 'session_data=o8079end5j9oslm5a7bou84rqc;',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
			},
		});

		if (postResponse.statusText !== 'OK') {
			return {
				status: false,
				msg: 'Fail Fetching.'
			};
		}

		const $post = cheerio.load(postResponse.data);
		const result = {
			title: $post('.dlvideos').find('h3[itemprop="name"]').text().trim(),
			author: $post('.dlvideos').find('.spotifymate-downloader-middle > p > span').text().trim(),
			thumb: $post('.dlvideos').find('img').attr('src') || '',
			music: $post('.dlvideos').find('.spotifymate-downloader-right #none').eq(0).find('a').attr('href') ||
				$post('.dlvideos').find('.spotifymate-downloader-right #pop').eq(0).find('a').attr('href') || ''
		};

		if (result.music === '') {
			return {
				status: false,
				msg: 'No results found.'
			};
		}

		return {
			status: true,
			result
		};

	} catch (e) {
		console.error(e)
		return {
			status: false,
			msg: e.message
		};
	}
}

Scraper.instagramDl = async (url) => {
   try {
      const { data: pageData } = await axios.get('https://www.instagramsave.com/download-instagram-videos.php', {
         headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'cookie': 'PHPSESSID=ugpgvu6fgc4592jh7ht9d18v49; _ga=GA1.2.1126798330.1625045680; _gid=GA1.2.1475525047.1625045680; __gads=ID=92b58ed9ed58d147-221917af11ca0021:T=1625045679:RT=1625045679:S=ALNI_MYnQToDW3kOUClBGEzULNjeyAqOtg'
         }
      });

      const $ = cheerio.load(pageData);
      const token = $('#token').attr('value');

      const config = {
         headers: {
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
            'cookie': 'PHPSESSID=ugpgvu6fgc4592jh7ht9d18v49; _ga=GA1.2.1126798330.1625045680; _gid=GA1.2.1475525047.1625045680; __gads=ID=92b58ed9ed58d147-221917af11ca0021:T=1625045679:RT=1625045679:S=ALNI_MYnQToDW3kOUClBGEzULNjeyAqOtg',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
         },
         data: {
            'url': url,
            'action': 'post',
            'token': token
         }
      };

      const { data: videoData } = await axios.post('https://www.instagramsave.com/system/action.php', qs.stringify(config.data), { headers: config.headers });

      return {
         status: 200,
         videoData
      };

   } catch (e) {
      return {
         status: false,
         message: e.message || e
      };
   }
};

Scraper.mediafireDl = async function(url) {
	return new Promise(async (resolve, reject) => {
		try {
			const res = await fetch('https://r.jina.ai/' + url, {
				headers: {
					'x-return-format': 'html'
				}
			});
			const data = await res.text();
			const $ = cheerio.load(data);

			const link = $('a#downloadButton').attr('href') || '';
			const size = $('a#downloadButton').text().replace('Download', '').replace('(', '').replace(')', '').trim();
			const upload_date = $('.dl-info .details li').last().find('span').text().trim();
			const nameFromAttr = $('div.dl-btn-label').attr('title');
			const nameFromUrl = link ? link.split('/').pop() : 'unknown';
			const name = nameFromAttr || nameFromUrl;
			const type = name.includes('.') ? name.split('.').pop() : '';

			if (!link) return resolve({ status: false, message: 'Link download tidak ditemukan!' });

			resolve({
				status: true,
				name,
				type,
				upload_date,
				size,
				link
			});
		} catch (e) {
			resolve({
				status: false,
				message: e.message
			});
		}
	});
};

Scraper.tiktokDl = async function(url) {
	return new Promise(async (resolve, reject) => {
		try {
			let data = [];
			function formatNumber(integer) {
				return Number(parseInt(integer)).toLocaleString().replace(/,/g, '.');
			}

			function formatDate(n, locale = 'id') {
				let d = new Date(n * 1000); // convert Unix ke ms
				return d.toLocaleDateString(locale, {
					weekday: 'long',
					day: 'numeric',
					month: 'long',
					year: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric'
				});
			}

			let domain = 'https://www.tikwm.com/api/';
			let response = await axios.post(domain, {}, {
				headers: {
					'Accept': 'application/json, text/javascript, */*; q=0.01',
					'Accept-Language': 'id-ID,id;q=0.9',
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					'Origin': 'https://www.tikwm.com',
					'Referer': 'https://www.tikwm.com/',
					'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
					'X-Requested-With': 'XMLHttpRequest'
				},
				params: {
					url: url,
					count: 12,
					cursor: 0,
					web: 1,
					hd: 1
				}
			});

			let res = response.data.data;
			if (!res) return resolve({ status: false, message: 'Gagal ambil data dari Tikwm!' });

			if (res.duration == 0) {
				res.images.forEach(v => data.push({ type: 'photo', url: v }));
			} else {
				data.push(
					{ type: 'watermark', url: 'https://www.tikwm.com' + (res?.wmplay || "/undefined") },
					{ type: 'nowatermark', url: 'https://www.tikwm.com' + (res?.play || "/undefined") },
					{ type: 'nowatermark_hd', url: 'https://www.tikwm.com' + (res?.hdplay || "/undefined") }
				);
			}

			resolve({
				status: true,
				title: res.title,
				taken_at: formatDate(res.create_time),
				region: res.region,
				id: res.id,
				duration: `${res.duration} detik`,
				cover: 'https://www.tikwm.com' + res.cover,
				data,
				music_info: {
					title: res.music_info.title,
					author: res.music_info.author,
					url: 'https://www.tikwm.com' + res.music
				},
				stats: {
					views: formatNumber(res.play_count),
					likes: formatNumber(res.digg_count),
					comment: formatNumber(res.comment_count),
					share: formatNumber(res.share_count),
					download: formatNumber(res.download_count)
				},
				author: {
					id: res.author.id,
					fullname: res.author.unique_id,
					nickname: res.author.nickname,
					avatar: 'https://www.tikwm.com' + res.author.avatar
				}
			});

		} catch (err) {
			resolve({ status: false, message: err.message });
		}
	});
};

Scraper.facebookDl = async function(url) {
	return new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.post('https://getmyfb.com/process', new URLSearchParams({
				id: decodeURIComponent(url),
				locale: 'en',
			}), {
				headers: {
					'hx-current-url': 'https://getmyfb.com/',
					'hx-request': 'true',
					'hx-target': url.includes('share') ? '#private-video-downloader' : '#target',
					'hx-trigger': 'form',
					'hx-post': '/process',
					'hx-swap': 'innerHTML',
				}
			});

			const $ = cheerio.load(data);
			const results = $('.results-list-item').get().map(el => ({
				quality: parseInt($(el).text().trim()) || '',
				type: $(el).text().includes('HD') ? 'HD' : 'SD',
				url: $(el).find('a').attr('href') || '',
			}));

			resolve({
				status: true,
				caption: $('.results-item-text').length > 0 ? $('.results-item-text').text().trim() : '',
				preview: $('.results-item-image').attr('src') || '',
				results
			});
		} catch (e) {
			resolve({ status: false, message: e.message });
		}
	});
};

Scraper.yourScraper1 = async (url) => {
   // Your scraper code here
}

Scraper.yourScraper2 = async (url) => {
   // Your scraper code here
}

// etc ...