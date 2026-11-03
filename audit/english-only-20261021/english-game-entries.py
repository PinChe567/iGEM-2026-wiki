from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[2]
replacements={
 '嗅覺像素實驗室：觀察二維 LED 氣味編碼，找出它代表的氣味。':'Odor Pixel Lab: observe a two-dimensional LED odor code and identify the odor it represents.',
 'AeroSense：氣味迷宮':'AeroSense: Scentbound Labyrinth',
 '氣味指紋混合器 · Scent Mixer':'Scent Mixer',
 '嗅覺像素實驗室':'Odor Pixel Lab','回到遊戲首頁':'Back to the game home','嗅覺像素':'Odor Pixel',
 '切換音效':'Toggle sound','遊戲說明':'How to play','看見氣味的':'See the','幾何形狀':'shape of odors',
 '每種氣味都藏在一組 LED 編碼裡。觀察亮點、辨認相似性，訓練你的嗅覺模式直覺。':'Each odor has an LED code. Observe the lights and compare similarities to practice recognizing odor patterns.',
 '遊戲特色':'Game features','種矩陣尺寸':'matrix sizes','種隨機挑戰':'random challenges','過關門檻':'pass threshold','氣味編碼遊戲':'Odor pattern game',
 '選擇矩陣尺寸':'Choose a matrix size','開啟氣味圖鑑':'Open the odor atlas','矩陣尺寸':'Matrix size','目前關卡':'Current level',
 '感知初醒':'First impressions','氣味輪廓':'Odor outlines','模式交會':'Pattern intersections','嗅覺迷宮':'Odor maze','神經星圖':'Neural constellation',
 '干擾活化率':'Noise activation rate','隨機加入亮點干擾；比例越高，辨認越有挑戰。':'Random extra lights add noise; higher levels make recognition more challenging.',
 '氣味數量':'Odors','題目數量':'Questions','及格標準':'Pass mark','基礎編碼':'Base pattern','干擾活化':'Noise activation','未活化':'Inactive',
 '氣味不是孤立的點，而是一張彼此相連的地圖。':'Odors form a connected map rather than isolated points.',
 '氣味編碼圖鑑':'Odor pattern atlas','點選任一氣味，觀察它在目前矩陣中的基礎編碼。':'Select an odor to inspect its base pattern in the current matrix.',
 '關閉':'Close','預習六種':'Study six odors','系統隨機抽選 6 種氣味，逐一展示圖片與基礎編碼。':'The game selects 6 odors and shows each image with its base pattern.',
 '觀察題目':'Observe the pattern','挑戰時只顯示編碼；紫色亮點是隨機干擾。':'The challenge shows the pattern; purple lights are random noise.',
 '選出氣味':'Choose the odor','從四張圖片中選出正確答案，共 10 題。':'Choose the correct image from four options across 10 questions.',
 '取得 60%':'Reach 60%','答對至少 6 題即可過關，全對獲得最高 1,000 分。':'Answer at least 6 questions correctly to pass. A perfect run earns 1,000 points.',
 '為什麼相似氣味有相似編碼？':'Why do similar odors have similar patterns?',
 '每個格子都對「果香、花香、清新、烘焙、鹹鮮」等特徵有不同敏感度，氣味特徵越接近，共享的亮點就越多。':'Each cell has different sensitivity to illustrative fruity, floral, fresh, roasted and savory features. Similar feature vectors share more active cells.',
 '知道了，開始探索':'Start exploring',
 '氣味 LED 編碼':'Odor LED pattern',' 乘 ':' by ',
 '本關會從完整的 20 種氣味圖鑑中隨機抽出 6 種。相近的氣味會共享更多亮點，但每一種仍有自己的細微特徵。':'This level selects 6 odors from the full atlas of 20. Similar odors share more active cells, but each retains distinct features.',
 '建議先開啟氣味圖鑑，點選圖片比較編碼，再開始 10 題挑戰。':'Explore the atlas and compare patterns before starting the 10-question challenge.',
 '隨機抽選並預習 6 種':'Select and study 6 odors','測驗前，先記住每個氣味':'Study each odor before the quiz','氣味預習進度':'Odor study progress',
 '查看${item.name}':'View ${item.name}','${odor.name}的基礎編碼':'Base pattern of ${odor.name}',
 '綠色亮點屬於氣味本身；正式測驗中可能加入紫色干擾。':'Green lights form the odor pattern; the quiz may add purple noise.',
 '上一個':'Previous','已看到最後一種氣味':'You have reached the last odor','還有 ${pool.length - state.studyIndex - 1} 種氣味':'${pool.length - state.studyIndex - 1} odors remaining',
 '全部看完，確認開始':'Start the quiz','記住了，下一個':'Next odor',
 '這組編碼是哪個氣味？':'Which odor does this pattern represent?','選出最符合這組 LED 模式的氣味圖片':'Choose the odor image that best matches this LED pattern.',
 '辨識正確！':'Correct!', '正確答案是「${question.answer.name}」':'The correct answer is ${question.answer.name}',
 '${question.answer.name}與${nearest.name}的特徵較接近，因此會共享較多亮點。':'${question.answer.name} and ${nearest.name} share similar features and therefore more active cells.',
 '看結果':'View results','下一題':'Next question','完美辨識':'Perfect recognition','挑戰通過':'Challenge passed','再試一次':'Try again',
 '你的嗅覺地圖很清晰！':'A clear odor map!','成功讀懂氣味編碼！':'You decoded the odor patterns!','已經很接近了！':'Almost there!',
 '十題全數辨識正確，這是本關最高分。':'You identified all ten odors correctly and earned the top score.',
 '你已達到 60% 過關標準，可以前往下一個矩陣尺寸。':'You reached the 60% pass mark and can move to the next matrix size.',
 '先到圖鑑比較相似氣味的共同亮點，再挑戰一次。':'Compare shared active cells in the atlas, then try again.',
 '答對題數':'Correct answers','重新挑戰':'Replay','下一大關':'Next level','複習圖鑑':'Review the atlas',
 '這是 ${level.size} × ${level.size} 模式下的固定基礎編碼。挑戰中的紫色亮點是額外干擾，不屬於原始氣味。':'This is the fixed base pattern in the ${level.size} × ${level.size} matrix. Purple lights in the challenge are added noise, not part of the original odor.',
 '開啟音效':'Enable sound','關閉音效':'Disable sound',
}
paths=[ROOT/'game/index.html',ROOT/'game/app.js',*list((ROOT/'game/apps/wiki-client/games').glob('*/index.html'))]
for p in paths:
    s=p.read_text(encoding='utf-8')
    if p.name=='app.js':s=re.sub(r"name: '[^']+', en: '([^']+)'",r"name: '\1', en: '\1'",s)
    for old,new in sorted(replacements.items(),key=lambda row:len(row[0]),reverse=True):s=s.replace(old,new)
    s=s.replace('${odor.name} · ${odor.en}','${odor.name}')
    if re.search(r'[\u3400-\u9fff]',s):raise RuntimeError('Remaining untranslated entry text: '+str(p))
    p.write_text(s,encoding='utf-8',newline='\n')
print('English static game entries and legacy interface updated; numeric game mechanics preserved.')
