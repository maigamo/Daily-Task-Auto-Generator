import { App, Notice, TAbstractFile, TFile, Vault } from "obsidian";
import { getTranslation } from "./i18n/i18n";
import { SettingsManager } from "./settings/settings";
import { appendToFile, ensureFileExists, ensureFolderExists, getTaskFilePath, todayTaskExists, fileContains, getYesterdayDate, getYesterdayTaskFilePath, extractTasksForDate, analyzeTaskCompletion, yesterdayStatisticsExists, generateStatisticsContent } from "./utils/fileUtils";
import { renderTemplate } from "./utils/templateEngine";
import { getCurrentDate } from "./utils/dateUtils";

/**
 * 任务生成器
 * 负责创建任务文件和添加任务内容
 */
export class TaskGenerator {
    private app: App;
    private vault: Vault;
    private settingsManager: SettingsManager;

    constructor(app: App, settingsManager: SettingsManager) {
        this.app = app;
        this.vault = app.vault;
        this.settingsManager = settingsManager;
    }

    /**
     * 生成每日任务
     * @param openFile 是否打开文件
     * @param quietMode 静默模式，减少日志输出
     * @returns 成功或失败
     */
    async generateDailyTask(openFile: boolean = true, quietMode: boolean = false): Promise<boolean> {
        try {
            const settings = this.settingsManager.getSettings();
            const rootDir = settings.rootDir.trim() || 'DailyTasks'; // 使用默认目录
            
            // 获取任务文件路径 (格式：rootDir/year/month.md)
            const filePath = getTaskFilePath(rootDir);
            
            // 解析年份和月份 - 适应新的路径格式
            const pathParts = filePath.split('/');
            // 现在pathParts数组格式为 [rootDir, year, month.md]
            const year = pathParts.length > 1 ? pathParts[1] : '';
            const monthFile = pathParts.length > 2 ? pathParts[2] : '';
            const yearFolder = `${rootDir}/${year}`;
            
            // 确保根目录存在
            const rootCreated = await ensureFolderExists(this.vault, rootDir);
            if (!rootCreated) {
                throw new Error(`无法访问根目录: ${rootDir}，可能是存在同名文件或权限问题`);
            }
            
            // 确保年份目录存在
            const yearCreated = await ensureFolderExists(this.vault, yearFolder);
            if (!yearCreated) {
                throw new Error(`无法访问年份目录: ${yearFolder}，可能是存在同名文件或权限问题`);
            }
            
            // 确保月份文件存在
            const fileCreated = await ensureFileExists(this.vault, filePath);
            if (!fileCreated) {
                throw new Error(`无法访问月份文件: ${filePath}，请检查是否存在同名目录或权限问题`);
            }
            
            // 检查今日任务是否已存在
            const date = getCurrentDate();
            // 更改检查方式：不仅检查纯日期，也检查带图标的日期格式
            const dateRegex = new RegExp(`## [^\\n]*${date}[^\\n]*\\n`);
            
            // 使用instanceof检查确保文件对象有效
            const abstractFile = this.vault.getAbstractFileByPath(filePath);
            if (!abstractFile || !(abstractFile instanceof TFile)) {
                throw new Error(`找不到有效的文件: ${filePath}`);
            }
            
            const fileContent = await this.vault.read(abstractFile);
            const existingTaskCheck = dateRegex.test(fileContent);
            
            if (existingTaskCheck) {
                // 如果需要打开文件
                if (openFile) {
                    // 显示提示并打开文件
                    this.showWarningNotice(`📌 ${getTranslation('notification.taskExists')}`);
                    const file = this.vault.getAbstractFileByPath(filePath);
                    if (file && file instanceof TFile) {
                        const leaf = this.app.workspace.getLeaf();
                        await leaf.openFile(file);
                    }
                }
                
                return true; // 任务已存在，视为成功
            }
            
            // 如果开启了任务统计功能，在添加今日任务前添加昨日统计
            let statisticsContent = '';
            if (settings.taskStatistics) {
                statisticsContent = await this.generateYesterdayStatistics(rootDir, date, quietMode);
            }
            
            // 获取任务模板 - 使用新的模板逻辑
            let template = '';
            if (this.settingsManager.hasCustomTemplate()) {
                // 使用用户自定义模板
                template = this.settingsManager.getSettings().customTemplate;
            } else {
                // 使用语言相关的默认模板
                template = this.settingsManager.getTemplateByLanguage();
            }
            
            // 渲染模板
            const renderedContent = renderTemplate(template);
            
            // 合并统计信息和今日任务内容
            const fullContent = statisticsContent 
                ? `${renderedContent}\n\n${statisticsContent}`
                : renderedContent;
            
            // 追加到文件
            const success = await appendToFile(this.vault, filePath, fullContent);
            
            if (success) {
                // 如果需要打开文件
                if (openFile) {
                    // 打开创建的文件
                    const file = this.vault.getAbstractFileByPath(filePath);
                    if (file && file instanceof TFile) {
                        const leaf = this.app.workspace.getLeaf();
                        await leaf.openFile(file);
                        
                        // 延迟一下再显示通知，确保文件已经打开
                        setTimeout(() => {
                            this.showSuccessNotice(`✨ ${getTranslation('notification.taskAdded')}`);
                        }, 300);
                    } else {
                        throw new Error(`文件创建成功但无法打开: ${filePath}`);
                    }
                }
            } else {
                throw new Error(`无法向文件追加内容: ${filePath}`);
            }
            
            return success;
        } catch (error) {
            // 显示错误通知
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.showErrorNotice(`${getTranslation('notification.error')} ${errorMsg}`);
            
            return false;
        }
    }
    
    /**
     * 生成昨日任务统计信息
     * @param rootDir 根目录
     * @param todayDate 今日日期（用于检查是否已存在统计）
     * @param quietMode 静默模式
     * @returns 统计信息内容或空字符串
     */
    async generateYesterdayStatistics(rootDir: string, todayDate: string, quietMode: boolean = false): Promise<string> {
        try {
            // 获取昨天的日期和文件路径
            const yesterdayDate = getYesterdayDate();
            const yesterdayFilePath = getYesterdayTaskFilePath(rootDir);
            
            // 检查今日的内容中是否已经包含昨日统计
            const todayFilePath = getTaskFilePath(rootDir);
            const statsExists = await yesterdayStatisticsExists(this.vault, todayFilePath, todayDate);
            
            if (statsExists) {
                return '';
            }
            
            // 提取昨日任务内容
            const yesterdayContent = await extractTasksForDate(this.vault, yesterdayFilePath, yesterdayDate);
            
            // 如果找不到昨日任务内容
            if (!yesterdayContent) {
                return '';
            }
            
            // 分析任务完成情况
            const taskStats = analyzeTaskCompletion(yesterdayContent);
            
            // 生成统计内容
            return generateStatisticsContent(taskStats, getTranslation);
        } catch (error) {
            return '';
        }
    }
    
    /**
     * 手动添加任务（从命令面板或图标调用）
     * @returns 成功或失败
     */
    async addTaskManually(): Promise<boolean> {
        try {
            // 调用任务生成逻辑，打开文件
            return await this.generateDailyTask(true);
        } catch (error) {
            // 显示错误通知
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.showErrorNotice(`${getTranslation('notification.error')} ${errorMsg}`);
            
            return false;
        }
    }
    
    /**
     * 显示成功通知
     */
    private showSuccessNotice(message: string): void {
        const notice = new Notice(message, 4000);
        // 使用CSS类而不是内联样式
        notice.noticeEl.classList.add('daily-task-success-notice');
    }
    
    /**
     * 显示警告通知
     */
    private showWarningNotice(message: string): void {
        const notice = new Notice(message, 3000);
        // 使用CSS类而不是内联样式
        notice.noticeEl.classList.add('daily-task-warning-notice');
    }
    
    /**
     * 显示错误通知
     */
    private showErrorNotice(message: string): void {
        const notice = new Notice(message, 5000);
        // 使用CSS类而不是内联样式
        notice.noticeEl.classList.add('daily-task-error-notice');
    }
}