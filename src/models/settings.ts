/**
 * 自动生成模式枚举
 */
export enum AutoGenerateMode {
    NONE = 'none',     // 关闭自动生成
    DAILY = 'daily',   // 每日自动生成
    WORKDAY = 'workday' // 仅工作日自动生成
}

/**
 * 设置界面语言
 */
export enum Language {
    AUTO = 'auto',
    ZH = 'zh',
    EN = 'en'
}

/**
 * 插件设置接口
 */
export interface DailyTaskSettings {
    // 基础配置
    rootDir: string;               // 任务文件存放的根目录
    autoGenerateMode: AutoGenerateMode; // 自动生成模式
    language: string;            // 界面语言

    // 模板配置
    templateZh: string;            // 中文任务模板
    templateEn: string;            // 英文任务模板

    // 新增：用户自定义模板
    customTemplate: string;

    // 新增：标记是否使用自定义模板
    hasCustomTemplate: boolean;

    // 新增：是否开启任务统计功能
    taskStatistics: boolean;

    // UI配置
    successNotificationDuration: number; // 成功通知显示时间(毫秒)
}

/**
 * 默认中文模板
 */
export const DEFAULT_TEMPLATE_ZH = `## {{dateWithIcon}}（{{weekday}}）

### 🧘 今日计划
---

- [ ] 冥想 10 分钟  
- [ ] 复盘前一日计划  
- [ ] 阅读 20 页书

### 📝 工作任务
---

- [ ] 整理今日工作计划
- [ ] 完成重要项目进度
`;

/**
 * 默认英文模板
 */
export const DEFAULT_TEMPLATE_EN = `## {{dateWithIcon}} ({{weekday}})

### 🧘 Today's Plan
---

- [ ] Meditate for 10 minutes  
- [ ] Review yesterday's plan  
- [ ] Read 20 pages

### 📝 Work Tasks
---

- [ ] Organize today's work schedule
- [ ] Progress on important projects
`;

/**
 * 默认设置
 */
export const DEFAULT_SETTINGS: DailyTaskSettings = {
    rootDir: 'DailyTasks',
    autoGenerateMode: AutoGenerateMode.WORKDAY,
    language: Language.AUTO,
    templateZh: DEFAULT_TEMPLATE_ZH,
    templateEn: DEFAULT_TEMPLATE_EN,
    customTemplate: '', // 默认为空，表示使用语言相关的默认模板
    hasCustomTemplate: false, // 默认不使用自定义模板
    taskStatistics: false, // 默认关闭任务统计功能
    successNotificationDuration: 3000
}; 