/* global Monogatari, monogatari, GK, MENTORS, RARITY_CONFIG */
'use strict';

// ============================================================================
//  自定义 Action：gk —— 让 Choice.Do 能用「字符串」执行任意游戏逻辑
//  Monogatari v2 的 Choice.Do 只接受字符串（被 run() 解析），
//  而引擎没有内联 JS 语句。故注册一个 gk action，匹配形如：
//     'gk set province beijing'
//     'gk enroll beijing 物理组'
//     'gk rollscore 0'
//     'gk pullmentor'
//     'gk setvision coder'
//     'gk interest logic'
//     'gk answermbti 0 A'
//     'gk buildwishlist'
//     'gk peekmentor yuan'
//     'gk chat 我有点紧张'
//  执行后返回 { advance: false }，由调用方在自己的标签里推进。
//  为支持「执行完跳转」，再注册 gkjump：'gkjump LabelName'。
// ============================================================================

// 通用：解析 gk 语句参数（去掉前缀 'gk' 后按空格切分，但某些值含空格——
// 我们用「最后一个 token 是跳转目标」的约定：'gk <op> <arg> -> <label>'
// 简化：op 与 arg 不含空格；跳转用独立 gkjump。
function parseArgs(statement) {
	// statement 可能是数组（matchString 拆分）或字符串
	const arr = Array.isArray(statement) ? statement
		: String(statement).split(/\s+/);
	return arr.filter(Boolean);
}

class GKAction extends Monogatari.Action {
	static id = 'GKAction';
	static matchString (args) {
		const kw = Array.isArray(args) ? args[0] : (typeof args === 'string' ? args.split(/\s+/)[0] : undefined);
		return kw === 'gk';
	}
	static matchObject () { return false; }

	constructor (statement) {
		super();
		this._raw = statement;
		this._args = parseArgs(statement); // ['gk', op, ...rest]
	}

	async apply () {
		const a = this._args;
		// 支持 'gk <op> ...args then <label>' —— 执行后自动跳转
		let thenIdx = a.indexOf('then');
		let thenLabel = null;
		const args = a.slice();
		if (thenIdx >= 0) {
			thenLabel = a.slice(thenIdx + 1).join(' ');
			args.splice(thenIdx); // 去掉 then 及之后
		}
		const op = args[1];
		try {
			switch (op) {
				case 'set': {
					const key = args[2];
					const val = args.slice(3).join(' ');
					const patch = {}; patch[key] = val;
					GK.set(patch);
					break;
				}
				case 'enroll': {
					// gk enroll <province> <group>
					GK.enroll({ name: GK.get().name || '', province: args[2], group: args.slice(3).join(' ') });
					break;
				}
				case 'rollscore': {
					GK.rollScore(args[2] === '1');
					break;
				}
				case 'pullmentor': {
					GK.pullMentor();
					break;
				}
				case 'setvision': {
					GK.setVision(args[2]);
					break;
				}
				case 'interest': {
					GK.toggleInterest(args[2]);
					break;
				}
				case 'answermbti': {
					const idx = parseInt(args[2], 10);
					GK.answerMbti(idx, args[3]);
					break;
				}
				case 'buildwishlist': {
					GK.buildWishlist();
					break;
				}
				case 'peekmentor': {
					GK.set({ _peekMentor: args[2] });
					break;
				}
				case 'pickmentor': {
					// gk pickmentor <id>  —— 固化为出战导师
					const m = MENTORS.find(x => x.id === args[2]) || MENTORS[0];
					const rc = RARITY_CONFIG[m.rarity];
					GK.set({ mentorObj: m, mentor: m.id, mentorName: m.name, mentorRarity: m.rarity, mentorColor: m.color, mentorEmoji: m.emoji, mentorTitle: m.title, mentorElement: m.element, mentorTagline: m.tagline, mentorGreet: m.greet, mentorSkill: m.skill, mentorPassive: m.passive.label, mentorRarityLabel: rc.label });
					break;
				}
				case 'chat': {
					const text = args.slice(2).join(' ');
					const r = GK.agentRespond(text);
					GK.set({ _chatReply: r.text });
					break;
				}
				case 'resetmbti': {
					GK.resetMbti();
					break;
				}
				case 'computembti': {
					GK.computeMbti();
					break;
				}
				case 'sfx': {
					GK.sfx(args[2]);
					break;
				}
				default:
					// noop
			}
		} catch (e) { /* swallow to avoid breaking flow */ }
		this._thenLabel = thenLabel;
		return Promise.resolve();
	}

	async didApply () {
		// 如果带 then <label>，执行跳转
		if (this._thenLabel) {
			try { monogatari.run('jump ' + this._thenLabel); } catch (e) {}
		}
		return Promise.resolve({ advance: true });
	}

	async revert () { return Promise.resolve(); }
	async didRevert () { return Promise.resolve({ advance: true, step: true }); }
}

// gkjump：纯跳转辅助（其实 jump 已存在，这里只是为了语义清晰，可省略）
monogatari.registerAction (GKAction);
