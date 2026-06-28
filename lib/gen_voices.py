# 关键台词语音生成脚本（edge-tts，免费）
# 用法：python lib/gen_voices.py
# 生成：assets/voices/<char>/<key>.mp3
import asyncio, os, edge_tts

OUT = 'assets/voices'

# 角色音色映射
VOICES = {
    'senior':  'zh-CN-XiaoyiNeural',              # 学姐·温：温柔女声
    'rival':   'zh-CN-XiaoxiaoNeural',            # 学霸·凛：清晰专业女声
    'buddy':   'zh-CN-liaoning-XiaobeiNeural',    # 死党·阿星：活泼东北口音
    'guide':   'zh-CN-YunyangNeural',             # 导师·沈：稳重男声
    'system':  'zh-CN-YunxiNeural',               # 系统：年轻男声
    'lingfeng':'zh-CN-YunjianNeural',             # 凛：低沉冷峻男声
    'zhaoyang':'zh-CN-YunxiaNeural',              # 朝阳：活力男声
    'narrator':'zh-CN-XiaoxiaoNeural',            # 旁白
    'fam_mom': 'zh-CN-XiaoyiNeural',              # 妈妈：温柔女声
    'fam_dad': 'zh-CN-YunyangNeural',             # 爸爸：稳重男声
    'fam_aunt':'zh-CN-XiaoxiaoNeural',            # 小姨：清晰女声
    'tch_lee':'zh-CN-YunxiNeural',                # 李老师：年轻温和男声
    'tch_wang':'zh-CN-YunjianNeural',             # 王主任：精明低沉男声
}

# 关键台词（char, key, text）—— 只给重要节点配音
LINES = [
    # 开场（学姐欢迎）
    ('senior', 'greet', '你好呀。我是温，你的志愿陪伴学姐。接下来这段路，我陪你一起走。查分、识己、选向、落笔，别紧张，无论考了多少分，你都值得被温柔对待。'),
    # 失忆闪回（系统旁白）
    ('system', 'amnesia1', '雨声。很重的雨声。你站在一间灰暗的房间里，桌上是一张皱巴巴的毕业证。'),
    ('system', 'amnesia2', '闪电。世界碎了。当你再次睁眼，你回到了填报志愿的那一夜。只是，你什么都不记得了。'),
    ('system', 'amnesia3', '去那些地方。找回每一块碎片。否则，你会重蹈覆辙。'),
    # 查分（凛）
    ('rival', 'score_intro', '听好了。分数不是终点，但它是你必须面对的第一只BOSS。'),
    ('rival', 'score_high', '稳！这分数漂亮得像你的未来一样亮眼。'),
    ('rival', 'score_low', '别紧张，分数不能定义你。专科本科，条条大路通罗马。'),
    # MBTI（沈）
    ('guide', 'mbti_intro', '人格测试是一面镜子，它不定义你，但能帮你看见自己擅长什么、在意什么。'),
    # 理想（温）
    ('senior', 'vision_intro', '想成为什么样的人，比考多少分更重要。这是你志愿表的灵魂。'),
    # 兴趣（阿星）
    ('buddy', 'interest_intro', '嘿！来食堂坐坐？填志愿太烧脑了，咱先聊点轻松的。你平时最来劲的事儿是啥？'),
    # 导师召唤（系统）
    ('system', 'mentor_intro', '在踏上战场前，先召唤一位导师为你加持吧。抽到谁，将影响你整张志愿表的走向。'),
    # 结局·挚友（温）
    ('senior', 'ending_good', '你做到了。这一次，你真的想清楚了。这张表上的每一个选择，都有你的理由。雨停了，晨光透过窗帘，未来是你的。'),
    # 结局·苦涩（温）
    ('senior', 'ending_bitter', '你走完了流程，但说实话，你敷衍了。这张表，和五年前那张，又有多大区别？'),
    # 家人 NPC
    ('fam_mom', 'intro', '妈不求你考多好，妈只怕你将来怪妈没管你。'),
    ('fam_dad', 'intro', '我吃过的盐比你走过的路多。听爸的，报个计算机，饿不死。'),
    ('fam_aunt', 'intro', '别像我当年一样，别人说什么就报什么，毕业了才发现全是错的。'),
    # 老师 NPC
    ('tch_lee', 'intro', '老师的职责不是告诉你报什么，是帮你想清楚你想要什么。'),
    ('tch_wang', 'intro', '这个学校跟我们有合作关系，你有内部名额优势。错过可就没了。'),
    # 放松场景
    ('senior', 'stargaze', '你看，天上那么多星星。有的亮，有的暗。但每一颗，都在自己的位置上发着光。'),
    ('buddy', 'basketball', '嘿！传一个！来，单挑一局？输的请喝汽水！'),
    ('buddy', 'river', '小时候我跟我爸来这钓鱼。那时候觉得，长大后什么都能搞定。'),
]

async def gen(char, key, text):
    voice = VOICES.get(char, 'zh-CN-XiaoxiaoNeural')
    outdir = os.path.join(OUT, char)
    os.makedirs(outdir, exist_ok=True)
    outfile = os.path.join(outdir, f'{key}.mp3')
    if os.path.exists(outfile) and os.path.getsize(outfile) > 1000:
        print(f'  ✓ {char}/{key} (已有)')
        return
    try:
        comm = edge_tts.Communicate(text, voice)
        await comm.save(outfile)
        size = os.path.getsize(outfile)
        print(f'  ✓ {char}/{key} ({size//1024}KB) [{voice}]')
    except Exception as e:
        print(f'  ✗ {char}/{key}: {e}')

async def main():
    print(f'=== 生成 {len(LINES)} 条关键台词语音 ===')
    ok = 0
    for char, key, text in LINES:
        await gen(char, key, text)
        ok += 1
    print(f'\n完成：{ok}/{len(LINES)} 条')
    print(f'输出目录：{OUT}/')

asyncio.run(main())
