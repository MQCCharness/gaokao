// ============================================================================
//  开发用静态服务器 —— 强制禁用缓存
//  解决「第一次打开用旧缓存、必须 Ctrl+Shift+R 才更新」的问题。
//  所有响应都带 Cache-Control: no-cache,每次打开都拿最新文件。
//
//  用法：node serve.mjs [端口]   （默认 8000）
//  访问：http://localhost:8000/
// ============================================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PORT = Number(process.argv[2]) || 8000;
const ROOT = process.cwd();

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js':   'application/javascript; charset=utf-8',
	'.mjs':  'application/javascript; charset=utf-8',
	'.css':  'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg':  'image/svg+xml',
	'.png':  'image/png',
	'.jpg':  'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif':  'image/gif',
	'.webp': 'image/webp',
	'.ico':  'image/x-icon',
	'.woff': 'font/woff',
	'.woff2':'font/woff2',
	'.ttf':  'font/ttf',
	'.mp3':  'audio/mpeg',
	'.wav':  'audio/wav',
	'.ogg':  'audio/ogg',
	'.mp4':  'video/mp4',
	'.webm': 'video/webm',
	'.map':  'application/json',
	'.txt':  'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
	try {
		let urlPath = decodeURIComponent(req.url.split('?')[0]);
		if (urlPath === '/') urlPath = '/index.html';

		// 防目录穿越
		const filePath = path.join(ROOT, urlPath);
		if (!filePath.startsWith(ROOT)) {
			res.writeHead(403); res.end('Forbidden'); return;
		}

		fs.stat(filePath, (err, stat) => {
			if (err || !stat.isFile()) {
				res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
				res.end('404 Not Found: ' + urlPath);
				return;
			}
			const ext = path.extname(filePath).toLowerCase();
			const type = MIME[ext] || 'application/octet-stream';

			// ★ 关键1：支持 Range 请求（音频/视频流式播放，边下边播，不用等整首下载）
			// 浏览器 <audio> 会发 Range: bytes=0- 请求分块，服务器必须返回 206 Partial Content。
			const range = req.headers.range;
			if (range) {
				const m = /bytes=(\d*)-(\d*)/.exec(range);
				let start = m && m[1] ? parseInt(m[1], 10) : 0;
				let end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
				if (start >= stat.size) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); res.end(); return; }
				end = Math.min(end, stat.size - 1);
				res.writeHead(206, {
					'Content-Type': type,
					// 音频流式资源允许缓存（同一次会话内不重复下载），开发时 Ctrl+Shift+R 仍可强制刷新
					'Cache-Control': 'no-cache',
					'Accept-Ranges': 'bytes',
					'Content-Range': `bytes ${start}-${end}/${stat.size}`,
					'Content-Length': end - start + 1,
				});
				fs.createReadStream(filePath, { start, end }).pipe(res);
				return;
			}

			// 非 Range 请求：正常返回整文件（强制禁缓存，开发时改完代码直接刷新）
			res.writeHead(200, {
				'Content-Type': type,
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Pragma': 'no-cache',
				'Expires': '0',
				'Accept-Ranges': 'bytes',
				'Content-Length': stat.size,
			});
			fs.createReadStream(filePath).pipe(res);
		});
	} catch (e) {
		res.writeHead(500); res.end('500 ' + e.message);
	}
});

// 绑定 0.0.0.0 → 允许局域网（手机/平板）访问
server.listen(PORT, '0.0.0.0', () => {
	// 尝试获取本机局域网 IP
	let lanIP = '';
	try {
		const nets = os.networkInterfaces();
		for (const name of Object.keys(nets)) {
			for (const net of nets[name] || []) {
				if (net.family === 'IPv4' && !net.internal && net.address.startsWith('192.168.')) {
					lanIP = net.address; break;
				}
			}
			if (lanIP) break;
		}
	} catch (e) {}

	console.log(`\n  ┌──────────────────────────────────────────────────┐`);
	console.log(`  │  高考志愿 · 静态服务器（禁缓存 · 局域网开放）    │`);
	console.log(`  │                                                  │`);
	console.log(`  │  🖥  本机:  http://localhost:${PORT}${' '.repeat(23 - String(PORT).length)}│`);
	if (lanIP) {
		const lanUrl = `http://${lanIP}:${PORT}`;
		console.log(`  │  📱 手机:  ${lanUrl}${' '.repeat(Math.max(1, 34 - lanUrl.length))}│`);
		console.log(`  │     （手机连同一 WiFi，浏览器输入上面地址）      │`);
	} else {
		console.log(`  │  📱 手机:  http://你的电脑IP:${PORT}${' '.repeat(18)}│`);
	}
	console.log(`  │                                                  │`);
	console.log(`  │  所有文件强制 no-cache，改完代码直接刷新即可     │`);
	console.log(`  │  Ctrl+C 停止                                     │`);
	console.log(`  └──────────────────────────────────────────────────┘\n`);
});
