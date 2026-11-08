/* Explicit translations of homepage prose and replay annotations. Model outputs are never translated. */
window.HomeLocale = (() => {
  const zh = {
    'Presentation progress':'演示进度',
    'Repeated authorization taps':'重复点击授权',
    'Repeated name entry':'重复输入姓名',
    'Repeated scrolling':'重复滑动',
    'Expand repetitions':'展开重复步骤',
    'Collapse repetitions':'收起重复步骤',
    'Repetitions condensed':'重复段已折叠',
    '{label} × {count} · {time}':'{label} × {count} · {time}',
    'Condensed: {summary}':'已折叠：{summary}',
    'Steps {from}–{to}':'第 {from}–{to} 步',
    "Try local-file authorization":"尝试授权查看本地文件",
    "Retry authorization instead of searching":"再次尝试授权，未开始搜索",
    "Repeat the same authorization tap":"重复点击授权按钮",
    "Enter a verification code":"输入验证码",
    "Enter a test password":"输入测试密码",
    "Open the first Sports article":"打开第一篇体育新闻",
    "Try to return to Sports":"尝试返回 Sports 列表",
    "Scroll inside the first article":"仍在第一篇文章内滑动",
    "Mistake article text for a list":"把文章正文当作列表",
    "Return to the Sports list":"返回 Sports 列表",
    "Scroll past available stories":"滑过列表中的新闻",
    "Keep scrolling without opening a story":"持续滑动，未打开下一篇",
    'Learn to act where quantization fails.':'从量化后的行动错误中学习。',
    'SteerDistill in action':'SteerDistill 的实际表现',
    'Training & inference cost':'训练与推理开销',
    'Loading the interactive replay…':'正在载入交互回放…',
    'Enable JavaScript to explore the recorded decisions and screen actions.':'请开启 JavaScript 查看决策记录与屏幕操作。',
    'Enlarge':'放大', 'Play':'播放', 'Pause':'暂停', 'Replay':'重新播放', 'Close':'关闭', 'Speed':'速度',
    'Pause Ⅱ':'暂停 Ⅱ', 'Play ▷':'播放 ▷',
    'Pause method animation':'暂停方法动画', 'Play method animation':'播放方法动画',
    'Play synchronized replay':'同步播放各方法', 'Pause synchronized replay':'暂停同步播放',
    'Playback speed':'播放速度',
    'Model inference':'模型推理', 'Environment execution':'环境执行', 'Observation & overhead':'观测与其他开销',
    'Inference':'推理', 'Total':'总耗时', 'Execution':'执行', 'Local':'独立进度',
    'Previous':'上一步', 'Next':'下一步', 'Thinking':'思考', 'Action':'动作',
    'Observing':'观察屏幕', 'Executing':'执行动作', 'Completed':'已完成', 'Not completed':'未完成',
    'Typing':'输入文字', 'Key press':'按键', 'Generating the next action…':'正在生成下一步动作…', 'Reading the screen…':'正在读取屏幕…',
    'Step {n}':'第 {n} 步', 'Step {n} / {total}':'第 {n} / {total} 步',
    'Enlarge {method} screen':'放大 {method} 屏幕', '{method} current model output':'{method} 当前模型输出',
    '{method}: previous decision':'{method}：上一步决策', '{method}: next decision':'{method}：下一步决策',
    '{method} decisions':'{method} 决策时间轴', '{method} thinking':'{method} 思考', '{method} action':'{method} 动作',
    'final screen':'最终画面', 'Demo tasks':'演示任务', 'Task replay':'任务回放',
    'Loading {app} replay…':'正在载入 {app} 回放…', 'Try again':'重试',
    'This replay could not be loaded.':'未能载入此任务的回放。', 'The demo catalogue could not be loaded.':'未能载入演示任务列表。',
    'Benchmark data could not be loaded. Please reload.':'未能载入 benchmark 数据，请刷新页面。',
    'Find a document':'查找文档', 'Create a poll':'创建投票', 'Read three stories':'阅读三篇新闻',
    'Find the document containing an “Apple MACBook” image description in WPS.':'在 WPS 中找到包含“Apple MACBook”图片描述的文档。',
    'In Project Alpha 🚀, create a poll asking “Next meeting?”, with Monday and Tuesday as the options.':'在 Project Alpha 🚀 群聊中创建题为“Next meeting?”的投票，选项为 Monday 和 Tuesday。',
    'Read at least three different articles in the Sports category.':'在 Sports 分类下阅读至少三篇不同的文章。',
    'We train and evaluate Qwen3-VL-8B agents in ':'我们在 ',
    ', initializing SteerDistill and On-Policy QAD W4A16 from the post-trained BF16 checkpoint.':' 上训练并评测 Qwen3-VL-8B Agent，以经过后训练的 BF16 checkpoint 初始化 SteerDistill 和 On-Policy QAD 的 W4A16 模型。',
    'Training uses 8 × NVIDIA A100 GPUs; inference uses a single A100.':'训练使用 8 张 NVIDIA A100，推理使用单张 A100。',
    'Focus the search field':'点击搜索框', 'Search for Apple MACBook':'搜索 Apple MACBook',
    'Open the matching document':'打开匹配的文档', 'Wait for the document':'等待文档加载', 'Return the file name':'返回文件名',
    'Focus the email field':'点击邮箱输入框', 'Enter a test email':'输入测试邮箱', 'Continue to password':'进入密码填写页',
    'Enter the test password':'输入测试密码', 'Submit the sign-in form':'提交登录表单', 'Wait for sign-in':'等待登录完成',
    'Open the Sports category':'打开 Sports 分类', 'Open the first Sports story':'打开第一篇体育新闻', 'Wait for the article':'等待文章加载',
    'Tap Back':'点击返回', 'Return to the Sports feed':'返回体育新闻列表', 'Open the Wimbledon story':'打开温网新闻',
    'Return to the feed':'返回新闻列表', 'Reopen the Sports category':'再次打开 Sports 分类', 'Open the Formula 1 story':'打开 F1 新闻',
    'Wait for the third article':'等待第三篇文章加载', 'Finish after three article visits':'访问三篇文章后结束',
    'Scroll down the article':'向下滚动文章', 'Scroll toward related stories':'向下查找相关新闻', 'Reveal the related stories':'滚动至相关新闻',
    'Scroll to another related story':'滚动至另一篇相关新闻', 'Open the Champions League story':'打开欧冠新闻',
    'Open the attachment menu':'打开附件菜单',
    'Accept the welcome screen':'接受欢迎页条款', 'Focus the phone number field':'点击手机号输入框',
    'Enter a test phone number':'输入测试手机号', 'Continue to verification':'进入验证页', 'Wait for verification':'等待验证完成',
    'Focus the name field':'点击姓名输入框', 'Enter the profile name':'输入个人资料姓名', 'Complete profile setup':'完成个人资料设置',
    'Open Project Alpha':'打开 Project Alpha 群聊', 'Try the overflow menu':'尝试右上角菜单', 'Look inside More':'查看 More 菜单',
    'Switch to the attachment menu':'转到附件菜单', 'Choose Poll':'选择 Poll', 'Focus the poll question':'点击投票问题输入框',
    'Enter the poll question':'输入投票问题', 'Focus the first option':'点击第一个选项', 'Enter Monday':'输入 Monday',
    'Focus the second option':'点击第二个选项', 'Enter Tuesday':'输入 Tuesday', 'Send the poll':'发送投票', 'Finish after the poll appears':'投票出现后结束',
    'Tap the verification field':'点击验证码输入框', 'Tap a verification slot':'点击验证码的一个空位',
    'Type without focusing the name field':'未选中姓名输入框便输入文字',
  };
  function t(text, values = {}) {
    return (SiteLocale.lang === 'zh' ? zh[text] ?? text : text).replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
  }
  document.querySelectorAll('[data-home-text]').forEach(node => { node.textContent = t(node.textContent); });
  if (SiteLocale.lang === 'zh') {
    const prose = document.querySelector('[data-home-tldr]');
    if (prose) {
      const link = document.createElement('a'); link.href = SiteLocale.url(SitePaths.url('article/#method')); link.textContent = '闭环 Teacher 指导';
      prose.replaceChildren('量化 Agent 可能陷入反复犯错的困境。我们通过', link, '，根据局部重试的执行反馈逐步改进指导，再蒸馏通过核验的纠正过程，让 Agent 在没有指导时也能采取正确行动。');
    }
  }
  return {t, translations:zh};
})();
