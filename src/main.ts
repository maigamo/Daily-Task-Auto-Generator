import { Plugin, addIcon } from 'obsidian';
import { AutoGenerateMode } from './models/settings';
import { DailyTaskSettingTab, SettingsManager } from './settings/settings';
import { getTranslation, setCurrentLanguage } from './i18n/i18n';
import { isWorkday } from './utils/dateUtils';
import { TaskGenerator } from './taskGenerator';
import { DAILY_TASK_ICON } from './ui/icons';

/**
 * 每日任务自动生成器插件主类
 */
export default class DailyTaskPlugin extends Plugin {
    // 设置管理器
    settingsManager: SettingsManager;
    
    // 任务生成器
    taskGenerator: TaskGenerator;

    /**
     * 插件加载时调用
     */
    async onload() {
        // 添加插件图标
        addIcon('daily-task', DAILY_TASK_ICON);
        
        // 初始化设置管理器
        this.settingsManager = new SettingsManager(this);
        await this.settingsManager.loadSettings();
        
        // 初始化任务生成器
        this.taskGenerator = new TaskGenerator(this.app, this.settingsManager);
        
        // 设置语言
        setCurrentLanguage(this.settingsManager.getCurrentLanguage());
        
        // 添加设置标签页
        this.addSettingTab(new DailyTaskSettingTab(this.app, this));
        
        // 添加手动生成任务命令
        this.addCommand({
            id: 'add-daily-task',
            name: getTranslation('commands.addDailyTask'),
            callback: async () => {
                await this.taskGenerator.addTaskManually();
            }
        });
        
        // 延迟10秒后检查是否需要自动生成任务
        // 这样可以确保Obsidian完全加载，避免与启动过程冲突
        setTimeout(async () => {
            await this.checkAutoGenerate();
        }, 10000);
    }
    
    /**
     * 插件卸载时调用
     */
    onunload() {
        // 插件卸载清理工作
    }
    
    /**
     * 检查是否需要自动生成任务
     */
    private async checkAutoGenerate() {
        const settings = this.settingsManager.getSettings();
        
        switch (settings.autoGenerateMode) {
            case AutoGenerateMode.DAILY:
                // 每天自动生成（静默模式，不打开文件）
                await this.taskGenerator.generateDailyTask(false, true);
                break;
                
            case AutoGenerateMode.WORKDAY:
                // 工作日自动生成（静默模式，不打开文件）
                if (isWorkday()) {
                    await this.taskGenerator.generateDailyTask(false, true);
                }
                break;
                
            case AutoGenerateMode.NONE:
            default:
                // 不自动生成
                break;
        }
    }
} 