import { Plugin, addIcon } from 'obsidian';
import { AutoGenerateMode } from './models/settings';
import { DailyTaskSettingTab, SettingsManager } from './settings/settings';
import { setCurrentLanguage } from './i18n/i18n';
import { isWorkday } from './utils/dateUtils';
import { TaskGenerator } from './taskGenerator';

// 定义插件图标
const ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
</svg>`;

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
        console.log('Loading Daily Task Auto Generator plugin');
        
        // 添加插件图标
        addIcon('daily-task', ICON);
        
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
            name: '手动添加今日任务',
            callback: async () => {
                await this.taskGenerator.addTaskManually();
            }
        });
        
        // 延迟10秒后检查是否需要自动生成任务
        // 这样可以确保Obsidian完全加载，避免与启动过程冲突
        console.log('计划在10秒后检查是否需要自动生成任务');
        setTimeout(async () => {
            console.log('开始检查是否需要自动生成任务');
            await this.checkAutoGenerate();
        }, 10000);
    }
    
    /**
     * 插件卸载时调用
     */
    onunload() {
        console.log('Unloading Daily Task Auto Generator plugin');
    }
    
    /**
     * 检查是否需要自动生成任务
     */
    private async checkAutoGenerate() {
        const settings = this.settingsManager.getSettings();
        
        switch (settings.autoGenerateMode) {
            case AutoGenerateMode.DAILY:
                // 每天自动生成（静默模式，不打开文件，减少日志）
                console.log('根据设置，每天自动生成任务（静默模式）');
                await this.taskGenerator.generateDailyTask(false, true);
                break;
                
            case AutoGenerateMode.WORKDAY:
                // 工作日自动生成（静默模式，不打开文件，减少日志）
                if (isWorkday()) {
                    console.log('根据设置，工作日自动生成任务（静默模式）');
                    await this.taskGenerator.generateDailyTask(false, true);
                } else {
                    console.log('今天不是工作日，跳过自动生成任务');
                }
                break;
                
            case AutoGenerateMode.NONE:
            default:
                // 不自动生成
                console.log('已禁用自动生成任务功能');
                break;
        }
    }
} 