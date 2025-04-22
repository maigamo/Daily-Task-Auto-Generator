/**
 * i18n.ts
 * 国际化支持模块
 */

// 定义翻译键类型
export type TranslationKey = 
    // 设置页面
    | 'settings.title'
    | 'settings.rootDir'
    | 'settings.rootDir.desc'
    | 'settings.rootDir.saved'
    | 'settings.save'
    | 'settings.autoGenerate'
    | 'settings.autoGenerate.desc'
    | 'settings.mode.none'
    | 'settings.mode.daily'
    | 'settings.mode.workday'
    | 'settings.language'
    | 'settings.language.desc'
    | 'settings.language.auto'
    | 'settings.language.zh'
    | 'settings.language.en'
    | 'settings.animations'
    | 'settings.animations.desc'
    | 'settings.template'
    | 'settings.template.zh'
    | 'settings.template.en'
    | 'settings.template.preview'
    | 'settings.template.hide'
    | 'settings.resetDefault'
    | 'settings.addTaskButton'
    | 'settings.resetToDefault'
    | 'settings.notificationDuration'
    | 'settings.notificationDuration.desc'
    | 'settings.preview'
    | 'template.dateWithIcon'
    
    // 通知
    | 'notification.taskAdded'
    | 'notification.taskExists'
    | 'notification.error'
    
    // 星期
    | 'weekday.mon'
    | 'weekday.tue'
    | 'weekday.wed'
    | 'weekday.thu'
    | 'weekday.fri'
    | 'weekday.sat'
    | 'weekday.sun'
    
    // 插件名称和描述
    | 'plugin.name'
    | 'plugin.description'
    
    // 一般按钮和消息
    | 'button.addTask'
    | 'button.save'
    | 'button.cancel'
    | 'button.done'
    
    // 设置
    | 'settings.basicSettings'
    | 'settings.templateSettings'
    | 'settings.rootDir'
    | 'settings.rootDir.desc'
    | 'settings.rootDir.saved'
    | 'settings.save'
    | 'settings.autoGenerate'
    | 'settings.autoGenerate.desc'
    | 'settings.mode.none'
    | 'settings.mode.daily'
    | 'settings.mode.workday'
    | 'settings.language'
    | 'settings.language.desc'
    | 'settings.language.auto'
    | 'settings.language.zh'
    | 'settings.language.en'
    | 'settings.animations'
    | 'settings.animations.desc'
    | 'settings.template'
    | 'settings.template.zh'
    | 'settings.template.en'
    | 'settings.template.preview'
    | 'settings.template.hide'
    | 'settings.resetDefault'
    | 'settings.addTaskButton'
    | 'settings.resetToDefault'
    | 'settings.notificationDuration'
    | 'settings.notificationDuration.desc'
    | 'settings.preview'
    | 'template.dateWithIcon'
    
    // 通知
    | 'notification.taskAdded'
    | 'notification.taskExists'
    | 'notification.error'
    
    // 星期
    | 'weekday.mon'
    | 'weekday.tue'
    | 'weekday.wed'
    | 'weekday.thu'
    | 'weekday.fri'
    | 'weekday.sat'
    | 'weekday.sun'
    
    // 插件名称和描述
    | 'plugin.name'
    | 'plugin.description'
    
    // 一般按钮和消息
    | 'button.addTask'
    | 'button.save'
    | 'button.cancel'
    | 'button.done'
    
    // 添加任务统计相关翻译
    | 'settings.taskStatistics'
    | 'settings.taskStatistics.desc'
    | 'statistics.title'
    | 'statistics.totalTasks'
    | 'statistics.completedTasks'
    | 'statistics.completionRate'
    | 'statistics.unfinishedTasks'
    | 'statistics.suggestions'
    | 'statistics.moreTasks.singular'
    | 'statistics.moreTasks.plural';

// 中文翻译
const translationsZH: Record<TranslationKey, string> = {
    // 设置页面
    'settings.title': '每日任务自动生成器设置',
    'settings.rootDir': '📁 任务文件存放目录',
    'settings.rootDir.desc': '指定保存任务文件的根目录，任务将按"年份/月份.md"格式存储',
    'settings.rootDir.saved': '✓ 目录已保存',
    'settings.save': '💾 保存',
    'settings.autoGenerate': '🔄 自动生成模式',
    'settings.autoGenerate.desc': '选择何时自动生成每日任务',
    'settings.mode.none': '❌ 关闭',
    'settings.mode.daily': '📆 每天',
    'settings.mode.workday': '💼 仅工作日',
    'settings.language': '🔤 界面语言',
    'settings.language.desc': '选择插件界面显示的语言',
    'settings.language.auto': '🔍 自动检测',
    'settings.language.zh': '🇨🇳 中文',
    'settings.language.en': '🇬🇧 英文',
    'settings.animations': '✨ 动画效果',
    'settings.animations.desc': '启用界面动画效果',
    'settings.template': '📝 任务模板',
    'settings.template.zh': '🇨🇳 中文模板',
    'settings.template.en': '🇬🇧 英文模板',
    'settings.template.preview': '👁️ 显示预览',
    'settings.template.hide': '👁️‍🗨️ 隐藏预览',
    'settings.resetToDefault': '🔄 恢复默认设置',
    'settings.addTaskButton': '➕ 手动添加今日任务',
    'settings.notificationDuration': '⏱️ 通知显示时间',
    'settings.notificationDuration.desc': '成功/失败提示显示时间（毫秒）',
    'settings.preview': '预览模板效果',
    'settings.resetDefault': '恢复默认设置',
    'template.dateWithIcon': '带图标的当前日期',
    'settings.basicSettings': '基本设置',
    'settings.templateSettings': '模板设置',
    
    // 通知
    'notification.taskAdded': '今日任务已添加',
    'notification.taskExists': '今日任务已存在',
    'notification.error': '错误：',
    
    // 星期
    'weekday.mon': '星期一',
    'weekday.tue': '星期二',
    'weekday.wed': '星期三',
    'weekday.thu': '星期四',
    'weekday.fri': '星期五',
    'weekday.sat': '星期六',
    'weekday.sun': '星期日',
    
    // 插件名称和描述
    'plugin.name': '每日任务自动生成器',
    'plugin.description': '一个强大的任务自动生成器，帮助你高效地管理日常任务',
    
    // 一般按钮和消息
    'button.addTask': '添加任务',
    'button.save': '保存',
    'button.cancel': '取消',
    'button.done': '完成',
    
    // 添加任务统计相关翻译
    'settings.taskStatistics': '📊 任务完成统计',
    'settings.taskStatistics.desc': '开启后，每日生成任务前会自动统计前一天的任务完成情况',
    'statistics.title': '📊 昨日任务统计',
    'statistics.totalTasks': '任务总数',
    'statistics.completedTasks': '已完成任务',
    'statistics.completionRate': '完成率',
    'statistics.unfinishedTasks': '未完成的任务',
    'statistics.suggestions': '建议今日考虑完成以下任务',
    'statistics.moreTasks.singular': '还有1个未完成任务',
    'statistics.moreTasks.plural': '还有更多未完成任务',
};

// 英文翻译
const translationsEN: Record<TranslationKey, string> = {
    // 设置页面
    'settings.title': 'Daily Task Auto Generator Settings',
    'settings.rootDir': '📁 Task Directory',
    'settings.rootDir.desc': 'Specify the root directory for storing task files, tasks will be stored in "Year/Month.md" format',
    'settings.rootDir.saved': '✓ Directory saved',
    'settings.save': '💾 Save',
    'settings.autoGenerate': '🔄 Auto Generate Mode',
    'settings.autoGenerate.desc': 'Choose when to automatically generate daily tasks',
    'settings.mode.none': '❌ Off',
    'settings.mode.daily': '📆 Daily',
    'settings.mode.workday': '💼 Workdays Only',
    'settings.language': '🔤 Interface Language',
    'settings.language.desc': 'Select the language for the plugin interface',
    'settings.language.auto': '🔍 Auto Detect',
    'settings.language.zh': '🇨🇳 Chinese',
    'settings.language.en': '🇬🇧 English',
    'settings.animations': '✨ Animation Effects',
    'settings.animations.desc': 'Enable interface animation effects',
    'settings.template': '📝 Task Template',
    'settings.template.zh': '🇨🇳 Chinese Template',
    'settings.template.en': '🇬🇧 English Template',
    'settings.template.preview': '👁️ Show Preview',
    'settings.template.hide': '👁️‍🗨️ Hide Preview',
    'settings.resetToDefault': '🔄 Reset to Default',
    'settings.addTaskButton': '➕ Add Today\'s Task Manually',
    'settings.notificationDuration': '⏱️ Notification Duration',
    'settings.notificationDuration.desc': 'Duration to show success/failure notifications (milliseconds)',
    'settings.preview': 'Preview Template',
    'settings.resetDefault': 'Reset to Default',
    'template.dateWithIcon': 'Current date with icon',
    'settings.basicSettings': 'Basic Settings',
    'settings.templateSettings': 'Template Settings',
    
    // 通知
    'notification.taskAdded': 'Today\'s task has been added',
    'notification.taskExists': 'Today\'s task already exists',
    'notification.error': 'Error: ',
    
    // 星期
    'weekday.mon': 'Monday',
    'weekday.tue': 'Tuesday',
    'weekday.wed': 'Wednesday',
    'weekday.thu': 'Thursday',
    'weekday.fri': 'Friday',
    'weekday.sat': 'Saturday',
    'weekday.sun': 'Sunday',
    
    // 插件名称和描述
    'plugin.name': 'Daily Task Auto Generator',
    'plugin.description': 'A powerful task auto generator to help you efficiently manage daily tasks',
    
    // 一般按钮和消息
    'button.addTask': 'Add Task',
    'button.save': 'Save',
    'button.cancel': 'Cancel',
    'button.done': 'Done',
    
    // 添加任务统计相关翻译
    'settings.taskStatistics': '📊 Task Completion Statistics',
    'settings.taskStatistics.desc': 'When enabled, automatically analyze yesterday\'s task completion before generating today\'s tasks',
    'statistics.title': '📊 Yesterday\'s Task Summary',
    'statistics.totalTasks': 'Total Tasks',
    'statistics.completedTasks': 'Completed Tasks',
    'statistics.completionRate': 'Completion Rate',
    'statistics.unfinishedTasks': 'Unfinished Tasks',
    'statistics.suggestions': 'Consider completing the following tasks today',
    'statistics.moreTasks.singular': 'more task',
    'statistics.moreTasks.plural': 'more tasks',
};

// 翻译查找表
const translations: Record<string, Record<TranslationKey, string>> = {
    'zh': translationsZH,
    'en': translationsEN
};

// 当前语言
let currentLanguage = 'en';

/**
 * 设置当前语言
 * @param language 语言代码
 */
export function setCurrentLanguage(language: string): void {
    currentLanguage = language;
}

/**
 * 获取翻译文本
 * @param key 翻译键
 * @param fallbackLanguage 备用语言
 * @returns 翻译后的文本
 */
export function getTranslation(key: TranslationKey, fallbackLanguage?: string): string {
    const language = fallbackLanguage || currentLanguage;
    
    // 获取对应语言的翻译
    const translation = translations[language]?.[key];
    
    // 如果没有找到对应翻译，尝试使用英文，再没有则返回键名
    if (!translation) {
        return translations['en'][key] || key;
    }
    
    return translation;
}

/**
 * 获取星期几的本地化名称
 * @param dayOfWeek 星期几的数字表示 (0-6, 0代表星期日)
 * @returns 本地化的星期名称
 */
export function getLocalizedWeekday(dayOfWeek: number): string {
    const weekdayKeys: TranslationKey[] = [
        'weekday.sun', 'weekday.mon', 'weekday.tue',
        'weekday.wed', 'weekday.thu', 'weekday.fri', 'weekday.sat'
    ];
    
    // 确保dayOfWeek在有效范围内
    const normalizedDayOfWeek = ((dayOfWeek % 7) + 7) % 7;
    return getTranslation(weekdayKeys[normalizedDayOfWeek]);
} 