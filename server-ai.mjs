// ============================================================================
//  server-ai.mjs —— AI 代理服务器（大模型现实路线）
//  功能：接收浏览器请求 → 调用大模型 API → 返回志愿建议
//
//  用法：
//    1. 在项目根目录创建 .env 文件，写入：
//         AI_API_KEY=你的API密钥
//         AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4  (智谱GLM)
//         AI_MODEL=glm-4-flash
//    2. node server-ai.mjs  (默认 8001 端口)
//
//  浏览器调用：
//    POST http://localhost:8001/api/analyze
//    body: { province, group, score, total, subjects }
//    返回: { rank, advice, tier }
// ============================================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 8001;

// 读 .env
function loadEnv () {
	const envPath = path.join(process.cwd(), '.env');
	if (!fs.existsSync(envPath)) return {};
	const txt = fs.readFileSync(envPath, 'utf-8');
	const env = {};
	for (const line of txt.split('\n')) {
		const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/);
		if (m) env[m[1]] = m[2].trim();
	}
	return env;
}
const ENV = loadEnv();
const API_KEY = ENV.AI_API_KEY || '';
const BASE_URL = ENV.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
const MODEL = ENV.AI_MODEL || 'glm-4-flash';

// 简易一分一段表估算（基于公开数据近似公式）
function estimateRank (score, total, province) {
	if (!score || !total) return null;
	const ratio = score / total;
	// 近似：各省一本线约 70-80% 满分，位次随分数指数递减
	const base = 500000; // 省考生基数近似
	const rank = Math.round(base * Math.pow(1 - ratio, 3) + base * 0.05);
	return Math.max(1, Math.min(base, rank));
}

// 调用大模型
async function callAI (prompt) {
	if (!API_KEY) {
		// 无 Key 时返回本地估算
		return { error: 'NO_API_KEY', message: '未配置 AI_API_KEY，使用本地估算' };
	}
	try {
		const resp = await fetch(`${BASE_URL}/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
			body: JSON.stringify({
				model: MODEL,
				messages: [
					{ role: 'system', content: '你是一位专业的高考志愿填报顾问。根据用户的省份、选科、分数，给出简洁的位次估算和志愿建议。回复用 JSON 格式：{"rank":"估算位次","tier":"冲/稳/保","advice":"建议"}' },
					{ role: 'user', content: prompt },
				],
				temperature: 0.7,
				max_tokens: 500,
			}),
		});
		const data = await resp.json();
		const text = data.choices?.[0]?.message?.content || '';
		// 尝试解析 JSON
		try {
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (jsonMatch) return JSON.parse(jsonMatch[0]);
		} catch (e) {}
		return { advice: text };
	} catch (e) {
		return { error: e.message };
	}
}

const server = http.createServer(async (req, res) => {
	// CORS
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

	if (req.method === 'POST' && req.url === '/api/analyze') {
		let body = '';
		req.on('data', c => body += c);
		req.on('end', async () => {
			try {
				const { province, group, score, total, subjects } = JSON.parse(body);
				// 本地位次估算
				const localRank = estimateRank(score, total, province);
				// 调大模型（如果有 Key）
				const prompt = `省份：${province}，选科：${group}，分数：${score}（满分${total}）。请估算全省位次，并给出冲、稳、保三档建议。`;
				const aiResult = await callAI(prompt);
				res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
				res.end(JSON.stringify({
					localRank,
					ai: aiResult,
					hasAI: !!API_KEY,
				}));
			} catch (e) {
				res.writeHead(400); res.end(JSON.stringify({ error: e.message }));
			}
		});
		return;
	}

	// 状态检查
	if (req.url === '/api/status') {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ ok: true, hasKey: !!API_KEY, model: MODEL }));
		return;
	}

	res.writeHead(404); res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
	console.log(`\n  ┌──────────────────────────────────────────┐`);
	console.log(`  │  AI 代理服务器                            │`);
	console.log(`  │  🌐 http://localhost:${PORT}              │`);
	console.log(`  │  📱 手机: http://你的IP:${PORT}           │`);
	console.log(`  │                                          │`);
	console.log(`  │  ${API_KEY ? '✅ API Key 已配置 (' + MODEL + ')' : '⚠️ 未配置 API Key（本地估算模式）'}`);
	console.log(`  │  配置：在 .env 写 AI_API_KEY=xxx          │`);
	console.log(`  └──────────────────────────────────────────┘\n`);
});
