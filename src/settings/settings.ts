import { App, ButtonComponent, DropdownComponent, Notice, Plugin, PluginSettingTab, Setting, TextAreaComponent, TextComponent, ToggleComponent } from 'obsidian';
import { AutoGenerateMode, DEFAULT_SETTINGS, DEFAULT_TEMPLATE_EN, DEFAULT_TEMPLATE_ZH, DailyTaskSettings, Language } from '../models/settings';
import { getTranslation, setCurrentLanguage } from '../i18n/i18n';
import { renderTemplate } from '../utils/templateEngine';
import { TaskGenerator } from '../taskGenerator';

// 前向声明，避免循环导入
declare class DailyTaskPlugin {
    saveData(data: any): Promise<void>;
    loadData(): Promise<any>;
    app: App;
}

// CSS 相关常量（class名称）
const SettingsSectionCSS = "daily-task-settings-section";
const ButtonCSS = "daily-task-button";
const PreviewButtonCSS = "daily-task-preview-button";
const ResetButtonCSS = "daily-task-reset-button";
const EditorCSS = "daily-task-editor";
const VerticalStackCSS = "daily-task-vertical-stack";
const TextRightCSS = "daily-task-text-right";
const TextCenterCSS = "daily-task-text-center";
const ScrollbarSlimCSS = "daily-task-slim-scrollbar";
const SaveIndicatorCSS = "daily-task-save-indicator";
const SuccessIconCSS = "daily-task-success-icon";
const SettingTopSpaceCSS = "daily-task-setting-top-space";
const InputContainerCSS = "daily-task-input-container";
const InputCSS = "daily-task-input";

/**
 * 添加插件自定义样式
 * 注意：样式内容现在已移至外部CSS文件
 */
function addCustomStyles() {
    // 样式已移至src/styles.css，无需在此处添加内联样式
    // 插件加载时会自动加载styles.css文件
}

/**
 * 插件设置标签页
 */
export class DailyTaskSettingTab extends PluginSettingTab {
    plugin: Plugin;
    settingsManager: SettingsManager;
    taskGenerator: TaskGenerator;
    previewEl: HTMLElement | null = null;
    addTaskButton: ButtonComponent | null = null;
    
    // 目录输入框
    rootDirInput: TextComponent | null = null;
    
    // 标记设置是否已修改但未保存
    dirtySettings: boolean = false;
    
    // 自动保存目录的方法
    autoSaveRootDir: (value: string) => Promise<void>;

    constructor(app: App, plugin: Plugin) {
        super(app, plugin);
        this.plugin = plugin;
        
        // 获取父插件中的设置管理器引用
        this.settingsManager = (plugin as any).settingsManager;
        
        // 创建任务生成器
        this.taskGenerator = new TaskGenerator(app, this.settingsManager);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.classList.add('daily-task-setting-tab');
        
        const settings = this.settingsManager.getSettings();
        
        // 添加顶部间距（增加间距以改善界面美观）
        const topSpacing = containerEl.createEl('div');
        topSpacing.classList.add(SettingTopSpaceCSS);
        
        // 根目录设置
        const rootDirSetting = new Setting(containerEl)
            .setName(getTranslation('settings.rootDir'))
            .setDesc(getTranslation('settings.rootDir.desc'));
            
        // 创建输入框容器，使其可以包含额外元素
        const inputContainer = document.createElement('div');
        inputContainer.classList.add(InputContainerCSS);
        rootDirSetting.controlEl.appendChild(inputContainer);
        
        this.rootDirInput = new TextComponent(inputContainer)
            .setValue(settings.rootDir)
            .onChange(async (value) => {
                if (value.trim() !== '') {
                    // 设置已更改，准备自动保存
                    this.dirtySettings = true;
                    
                    // 启动自动保存定时器
                    this.autoSaveRootDir(value);
                }
            });
        
        // 给input元素设置类和placeholder属性
        if (this.rootDirInput && this.rootDirInput.inputEl) {
            this.rootDirInput.inputEl.classList.add(InputCSS);
            this.rootDirInput.inputEl.placeholder = 'DailyTasks';
        }
        
        // 添加自动保存指示器
        const saveIndicator = document.createElement('div');
        saveIndicator.classList.add(SaveIndicatorCSS);
        inputContainer.appendChild(saveIndicator);
        
        // 创建保存成功图标
        const saveSuccessIcon = createSpan({cls: `svg-icon lucide-check ${SuccessIconCSS}`});
        saveIndicator.appendChild(saveSuccessIcon);

        // 记录自动保存定时器
        let autoSaveTimer: NodeJS.Timeout | null = null;
        
        // 自动保存方法
        this.autoSaveRootDir = async (value: string) => {
            // 清除之前的定时器
            if (autoSaveTimer !== null) {
                clearTimeout(autoSaveTimer);
            }
            
            // 设置新的定时器，延迟800ms保存（在用户停止输入后）
            autoSaveTimer = setTimeout(async () => {
                let pathToSave = value.trim();
                if (pathToSave === '') {
                    pathToSave = 'DailyTasks'; // 默认存放目录
                }
                
                // 实际保存设置
                await this.settingsManager.updateSettings({ rootDir: pathToSave });
                this.dirtySettings = false;
                
                // 显示保存成功的视觉反馈
                saveIndicator.style.opacity = '1';
                setTimeout(() => {
                    saveIndicator.style.opacity = '0';
                }, 1500);
                
            }, 800);
        };
        
        // 自动生成模式
        const autoGenSetting = new Setting(containerEl)
            .setName(getTranslation('settings.autoGenerate'))
            .setDesc(getTranslation('settings.autoGenerate.desc'));
            
        // 自定义三选滑块
        const toggleContainer = document.createElement('div');
        toggleContainer.classList.add('mode-toggle-container');
        toggleContainer.style.width = '20%'; // 缩短滑动条长度为原来的20%
        toggleContainer.style.marginLeft = 'auto'; // 靠右显示
        
        const modes = [
            { value: AutoGenerateMode.NONE, label: getTranslation('settings.mode.none') },
            { value: AutoGenerateMode.DAILY, label: getTranslation('settings.mode.daily') },
            { value: AutoGenerateMode.WORKDAY, label: getTranslation('settings.mode.workday') }
        ];
        
        // 滑块指示器
        const slider = document.createElement('div');
        slider.classList.add('mode-toggle-slider');
        toggleContainer.appendChild(slider);
        
        // 更新滑块位置
        const updateSlider = (index: number) => {
            slider.style.left = `${index * 33.33}%`;
        };
        
        // 设置默认模式为仅工作日生成（WorkDay）
        let currentModeIndex = modes.findIndex(mode => mode.value === settings.autoGenerateMode);
        if (currentModeIndex === -1) {
            // 如果没有找到有效的模式，设置为工作日模式
            currentModeIndex = modes.findIndex(mode => mode.value === AutoGenerateMode.WORKDAY);
            // 更新设置到工作日模式
            this.settingsManager.updateSettings({ autoGenerateMode: AutoGenerateMode.WORKDAY });
        }
        updateSlider(currentModeIndex);
        
        // 创建选项
        modes.forEach((mode, index) => {
            const option = document.createElement('div');
            option.classList.add('mode-toggle-option');
            option.textContent = mode.label;
            
            if (mode.value === settings.autoGenerateMode) {
                option.classList.add('active');
            }
            
            option.addEventListener('click', async () => {
                // 更新视觉状态
                toggleContainer.querySelectorAll('.mode-toggle-option').forEach(el => {
                    el.classList.remove('active');
                });
                option.classList.add('active');
                
                // 更新滑块位置
                updateSlider(index);
                
                // 保存设置
                await this.settingsManager.updateSettings({ autoGenerateMode: mode.value });
            });
            
            toggleContainer.appendChild(option);
        });
        
        autoGenSetting.controlEl.appendChild(toggleContainer);
        
        // 语言设置
        new Setting(containerEl)
            .setName(getTranslation('settings.language'))
            .setDesc(getTranslation('settings.language.desc'))
            .addDropdown(dropdown => {
                dropdown
                    .addOption(Language.AUTO, getTranslation('settings.language.auto'))
                    .addOption(Language.ZH, getTranslation('settings.language.zh'))
                    .addOption(Language.EN, getTranslation('settings.language.en'))
                    .setValue(settings.language)
                    .onChange(async (value) => {
                        await this.settingsManager.updateSettings({ language: value as Language });
                        // 需要重新加载设置页面以更新翻译
                        this.display();
                    });
            });
        
        // 通知显示时间
        new Setting(containerEl)
            .setName(getTranslation('settings.notificationDuration'))
            .setDesc(getTranslation('settings.notificationDuration.desc'))
            .addText(text => {
                const component = text
                    .setValue(settings.successNotificationDuration.toString())
                    .onChange(async (value) => {
                        const duration = parseInt(value);
                        if (!isNaN(duration) && duration > 0) {
                            await this.settingsManager.updateSettings({ successNotificationDuration: duration });
                        }
                    });
                
                // 直接设置placeholder属性
                component.inputEl.placeholder = '3000';
                
                return component;
            });
        
        // 任务统计功能开关
        new Setting(containerEl)
            .setName(getTranslation('settings.taskStatistics'))
            .setDesc(getTranslation('settings.taskStatistics.desc'))
            .addToggle((toggle) => {
                // 设置开关样式
                const toggleEl = toggle
                    .setValue(settings.taskStatistics)
                    .onChange(async (value) => {
                        await this.settingsManager.updateSettings({ taskStatistics: value });
                    });
                    
                // 自定义开关样式 - 使用DOM元素访问
                // @ts-ignore - 添加这行来忽略TypeScript警告
                const toggleControl = toggle.toggleEl || toggle.containerEl.querySelector('.checkbox-container');
                if (toggleControl) {
                    toggleControl.classList.add('task-statistics-toggle');
                    
                    // 添加图标 - 使用DOM父元素访问
                    const toggleContainer = toggleControl.parentElement;
                    if (toggleContainer) {
                        const iconEl = createSpan({cls: 'svg-icon lucide-bar-chart-2'});
                        iconEl.style.marginRight = '8px';
                        iconEl.style.color = 'var(--text-accent)';
                        toggleContainer.prepend(iconEl);
                        
                        // 添加过渡效果
                        toggleContainer.style.transition = 'all 0.3s ease';
                        toggleControl.style.transition = 'all 0.3s ease';
                    }
                }
                
                return toggleEl;
            });
        
        // 模板设置
        containerEl.createEl('h3', { text: getTranslation('settings.template') });
        
        // 添加模板使用逻辑说明
        const templateDescription = containerEl.createEl('p', { 
            text: this.settingsManager.getCurrentLanguage() === 'zh' ?
                '注意：默认模板会根据当前语言环境自动选择对应语言的内容。如果您自定义模板，将在所有语言环境中使用您的自定义内容。' :
                'Note: Default template automatically adapts to your language environment. If you customize the template, your content will be used in all language environments.'
        });
        templateDescription.style.fontSize = '0.85em';
        templateDescription.style.opacity = '0.8';
        templateDescription.style.marginBottom = '15px';
        
        // 添加模板变量说明
        const templateVariablesEl = containerEl.createEl('p');
        templateVariablesEl.innerHTML = this.settingsManager.getCurrentLanguage() === 'zh' ?
            '<strong>可用变量：</strong> {{date}} - 日期, {{dateWithIcon}} - 带图标的日期, {{weekday}} - 星期几, {{yearProgress}} - 年进度, {{monthProgress}} - 月进度, {{time}} - 当前时间' :
            '<strong>Available variables:</strong> {{date}} - Date, {{dateWithIcon}} - Date with icon, {{weekday}} - Day of week, {{yearProgress}} - Year progress, {{monthProgress}} - Month progress, {{time}} - Current time';
        templateVariablesEl.style.fontSize = '0.85em';
        templateVariablesEl.style.marginBottom = '10px';
        
        // 单一模板设置
        const templateSetting = new Setting(containerEl)
            .setName(getTranslation('settings.template'))
            .setClass('template-setting');
        
        const templateContainer = document.createElement('div');
        templateContainer.style.width = '100%';
        
        // 获取当前模板内容
        const currentTemplate = this.settingsManager.hasCustomTemplate() ? 
            this.settingsManager.getSettings().customTemplate : 
            this.settingsManager.getTemplateByLanguage();
        
        const textarea = new TextAreaComponent(templateContainer)
            .setValue(currentTemplate)
            .setPlaceholder(this.settingsManager.getCurrentLanguage() === 'zh' ? 
                '在此处输入任务模板...' : 
                'Enter task template here...')
            .onChange(async (value) => {
                // 更新为自定义模板
                await this.settingsManager.updateSettings({ 
                    customTemplate: value,
                    hasCustomTemplate: true
                });
                this.updatePreview(this.previewEl, value);
            });
        
        // 改进TextArea样式
        textarea.inputEl.classList.add('template-editor');
        textarea.inputEl.style.height = '200px';
        textarea.inputEl.style.border = '1px solid var(--background-modifier-border-hover)';
        textarea.inputEl.style.borderRadius = '4px';
        textarea.inputEl.style.padding = '12px';
        textarea.inputEl.style.lineHeight = '1.5';
        textarea.inputEl.style.fontSize = '14px';
        textarea.inputEl.style.fontFamily = 'var(--font-monospace)';
        textarea.inputEl.style.transition = 'all 0.2s ease';
        textarea.inputEl.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.1)';
        textarea.inputEl.style.backgroundColor = 'var(--background-primary)';
        textarea.inputEl.style.color = 'var(--text-normal)';
        textarea.inputEl.style.resize = 'vertical';
        
        // 当获取焦点时改变边框样式
        textarea.inputEl.addEventListener('focus', () => {
            textarea.inputEl.style.border = '1px solid var(--interactive-accent)';
            textarea.inputEl.style.boxShadow = '0 0 0 2px rgba(var(--interactive-accent-rgb), 0.2), inset 0 1px 3px rgba(0, 0, 0, 0.1)';
            textarea.inputEl.style.outline = 'none';
        });
        
        // 失去焦点时恢复原来的边框样式
        textarea.inputEl.addEventListener('blur', () => {
            textarea.inputEl.style.border = '1px solid var(--background-modifier-border-hover)';
            textarea.inputEl.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.1)';
        });
        
        // 预览标题，使用flex布局居中
        const previewHeader = document.createElement('div');
        previewHeader.classList.add('template-preview-header');
        previewHeader.style.display = 'flex';
        previewHeader.style.justifyContent = 'space-between'; // 改为两端对齐
        previewHeader.style.marginTop = '15px';
        previewHeader.style.marginBottom = '10px';
        previewHeader.style.width = '100%';
        
        // 预览按钮容器 - 左侧
        const previewBtnContainer = document.createElement('div');
        previewBtnContainer.style.display = 'flex';
        previewBtnContainer.style.alignItems = 'center';
        
        // 重置按钮容器 - 右侧
        const resetBtnContainer = document.createElement('div');
        resetBtnContainer.style.display = 'flex';
        resetBtnContainer.style.alignItems = 'center';
        
        // 预览按钮 - 改进样式
        const toggleButton = new ButtonComponent(previewBtnContainer)
            .setButtonText(getTranslation('settings.template.preview'));
        
        // 添加样式类
        toggleButton.buttonEl.addClass(TextCenterCSS);
        toggleButton.buttonEl.style.textAlign = 'center';
        toggleButton.buttonEl.style.display = 'flex';
        toggleButton.buttonEl.style.alignItems = 'center';
        toggleButton.buttonEl.style.justifyContent = 'center';
        toggleButton.buttonEl.style.width = '130px';
        toggleButton.buttonEl.style.borderRadius = '4px';
        toggleButton.buttonEl.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        toggleButton.buttonEl.style.transition = 'all 0.2s ease';
        
        // 手动添加眼睛图标
        const eyeIcon = createSpan({cls: 'svg-icon lucide-eye'});
        eyeIcon.style.marginRight = '6px';
        toggleButton.buttonEl.prepend(eyeIcon);
        
        // 预览区域
        this.previewEl = document.createElement('div');
        this.previewEl.classList.add('template-preview');
        this.previewEl.style.marginTop = '15px';
        this.previewEl.style.padding = '15px';
        this.previewEl.style.border = '1px dashed var(--background-modifier-border)';
        this.previewEl.style.borderRadius = '8px';
        this.previewEl.style.backgroundColor = 'var(--background-secondary)';
        this.previewEl.style.display = 'none';
        this.previewEl.style.maxHeight = '200px';
        this.previewEl.style.overflow = 'auto';
        this.previewEl.style.boxShadow = 'inset 0 0 5px rgba(0,0,0,0.1)';
        this.updatePreview(this.previewEl, currentTemplate);
        templateContainer.appendChild(this.previewEl);
        
        toggleButton.onClick(() => {
            this.togglePreview(this.previewEl);
            // 切换图标和按钮文本
            if (this.previewEl && this.previewEl.classList.contains('visible')) {
                eyeIcon.className = 'svg-icon lucide-eye-off';
                toggleButton.setButtonText(getTranslation('settings.template.hide'));
                toggleButton.buttonEl.style.backgroundColor = 'var(--background-modifier-success)';
            } else {
                eyeIcon.className = 'svg-icon lucide-eye';
                toggleButton.setButtonText(getTranslation('settings.template.preview'));
                toggleButton.buttonEl.style.backgroundColor = '';
            }
        });
        
        // 重置按钮 - 改进样式
        const resetBtn = new ButtonComponent(resetBtnContainer)
            .setButtonText(getTranslation('settings.resetDefault'));
        
        // 添加样式类
        resetBtn.buttonEl.addClass(TextCenterCSS);
        resetBtn.buttonEl.style.textAlign = 'center';
        resetBtn.buttonEl.style.display = 'flex';
        resetBtn.buttonEl.style.alignItems = 'center';
        resetBtn.buttonEl.style.justifyContent = 'center';
        resetBtn.buttonEl.style.width = '150px';
        resetBtn.buttonEl.style.borderRadius = '4px';
        resetBtn.buttonEl.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        resetBtn.buttonEl.style.transition = 'all 0.2s ease';
        
        // 添加重置图标
        const resetIcon = createSpan({cls: 'svg-icon lucide-refresh-cw'});
        resetIcon.style.marginRight = '6px';
        resetBtn.buttonEl.prepend(resetIcon);
        
        // 添加重置事件
        resetBtn.onClick(async () => {
            // 将自定义模板设置为空，回到使用默认模板
            await this.settingsManager.updateSettings({ 
                customTemplate: '',
                hasCustomTemplate: false
            });
            
            // 获取当前语言的默认模板
            const defaultTemplate = this.settingsManager.getTemplateByLanguage();
            
            // 更新输入框和预览
            textarea.setValue(defaultTemplate);
            this.updatePreview(this.previewEl, defaultTemplate);
            
            // 显示成功提示动画
            resetBtn.buttonEl.style.backgroundColor = 'var(--background-modifier-success)';
            setTimeout(() => {
                resetBtn.buttonEl.style.backgroundColor = '';
            }, 1000);
        });
        
        // 将按钮添加到各自的容器
        previewHeader.appendChild(previewBtnContainer);
        previewHeader.appendChild(resetBtnContainer);
        templateContainer.appendChild(previewHeader);
        
        templateSetting.controlEl.appendChild(templateContainer);
        
        // 恢复默认设置 - 创建容器让按钮右对齐
        const resetContainer = document.createElement('div');
        resetContainer.style.display = 'flex';
        resetContainer.style.justifyContent = 'flex-end'; // 确保右对齐
        resetContainer.style.marginTop = '20px';
        resetContainer.style.marginBottom = '10px';
        containerEl.appendChild(resetContainer);
        
        // 恢复默认设置按钮
        const resetDefaultBtn = new ButtonComponent(resetContainer)
            .setButtonText(getTranslation('settings.resetToDefault'));

        // 添加样式类
        resetDefaultBtn.buttonEl.addClass(TextCenterCSS);
        resetDefaultBtn.buttonEl.addClass('danger-button');
        resetDefaultBtn.buttonEl.style.textAlign = 'center';
        resetDefaultBtn.buttonEl.style.display = 'flex';
        resetDefaultBtn.buttonEl.style.alignItems = 'center';
        resetDefaultBtn.buttonEl.style.justifyContent = 'center';
        resetDefaultBtn.buttonEl.style.width = '150px';
        
        // 添加重置图标和危险按钮样式
        resetDefaultBtn.buttonEl.prepend(createSpan({cls: 'svg-icon lucide-refresh-cw'}));
        
        // 为全局重置按钮添加事件处理
        resetDefaultBtn.onClick(async () => {
            await this.settingsManager.resetToDefaults();
            this.display();
        });
        
        // 手动添加今日任务按钮 - 右对齐显示
        const addTaskContainer = document.createElement('div');
        addTaskContainer.style.display = 'flex';
        addTaskContainer.style.justifyContent = 'flex-end'; // 确保右对齐
        addTaskContainer.style.marginTop = '20px';
        containerEl.appendChild(addTaskContainer);
        
        this.addTaskButton = new ButtonComponent(addTaskContainer)
            .setButtonText(getTranslation('settings.addTaskButton'))
            .setCta();

        // 添加样式类 - 确保按钮文字居中
        if (this.addTaskButton && this.addTaskButton.buttonEl) {
            this.addTaskButton.buttonEl.addClass(TextCenterCSS);
            this.addTaskButton.buttonEl.style.textAlign = 'center';
            this.addTaskButton.buttonEl.style.display = 'flex';
            this.addTaskButton.buttonEl.style.alignItems = 'center';
            this.addTaskButton.buttonEl.style.justifyContent = 'center';
        }

        // 手动添加任务按钮事件处理
        this.addTaskButton.onClick(async () => {
            // 检查目录设置
            const rootDir = this.settingsManager.getSettings().rootDir;
            
            // 添加loading状态
            if (this.addTaskButton && this.addTaskButton.buttonEl) {
                this.addTaskButton.buttonEl.classList.add('loading');
            }
            this.addTaskButton?.setDisabled(true);
            
            try {
                // 添加任务
                await this.taskGenerator.addTaskManually();
            } catch (e) {
                console.error("添加任务出错:", e);
                new Notice(`添加任务失败: ${e.message || e}`);
            } finally {
                // 移除loading状态
                setTimeout(() => {
                    if (this.addTaskButton && this.addTaskButton.buttonEl) {
                        this.addTaskButton.buttonEl.classList.remove('loading');
                    }
                    this.addTaskButton?.setDisabled(false);
                }, 500);
            }
        });

        // 添加图标
        this.addTaskButton.buttonEl.prepend(createSpan({cls: 'svg-icon lucide-calendar-plus'}));
    }
    
    /**
     * 更新模板预览
     */
    private updatePreview(previewEl: HTMLElement | null, template: string): void {
        if (!previewEl) return;
        
        const renderedContent = renderTemplate(template);
        // 使用MarkdownRenderer需要导入相关组件
        previewEl.innerHTML = renderedContent.replace(/\n/g, '<br>');
    }
    
    /**
     * 切换预览的显示/隐藏
     */
    private togglePreview(previewEl: HTMLElement | null): void {
        if (!previewEl) return;
        
        if (previewEl.style.display === 'none') {
            previewEl.style.display = 'block';
            previewEl.classList.add('visible');
        } else {
            previewEl.style.display = 'none';
            previewEl.classList.remove('visible');
        }
    }
}

/**
 * 设置管理器
 * 负责加载、保存和提供设置访问接口
 */
export class SettingsManager {
    private plugin: Plugin;
    private settings: DailyTaskSettings;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.settings = Object.assign({}, DEFAULT_SETTINGS);
    }

    /**
     * 获取当前设置
     */
    getSettings(): DailyTaskSettings {
        return this.settings;
    }

    /**
     * 更新设置并保存
     * @param settings 要更新的设置
     */
    async updateSettings(settings: Partial<DailyTaskSettings>): Promise<void> {
        this.settings = {
            ...this.settings,
            ...settings
        };
        await this.saveSettings();
        
        // 更新当前语言
        this.updateCurrentLanguage();
    }

    /**
     * 保存设置到数据存储
     */
    async saveSettings(): Promise<void> {
        await this.plugin.saveData(this.settings);
    }

    /**
     * 加载设置
     */
    async loadSettings(): Promise<void> {
        const loadedData = await this.plugin.loadData();
        if (loadedData) {
            // 合并默认设置和已保存的设置
            this.settings = {
                ...DEFAULT_SETTINGS,
                ...loadedData
            };
            
            // 确保在升级插件后，新增的设置项也有默认值
            this.ensureSettingsCompleteness();
        } else {
            // 如果没有加载到数据，使用默认设置但将自动生成模式改为工作日
            this.settings = {
                ...DEFAULT_SETTINGS,
                autoGenerateMode: AutoGenerateMode.WORKDAY
            };
        }
        
        // 更新当前语言
        this.updateCurrentLanguage();
    }

    /**
     * 确保设置完整性，为新增的设置项提供默认值
     */
    private ensureSettingsCompleteness(): void {
        const defaultKeys = Object.keys(DEFAULT_SETTINGS);
        defaultKeys.forEach(key => {
            // 如果当前设置中缺少某个默认设置项，添加默认值
            if (!(key in this.settings)) {
                (this.settings as any)[key] = (DEFAULT_SETTINGS as any)[key];
            }
        });
    }

    /**
     * 恢复默认设置
     */
    async resetToDefaults(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS);
        await this.saveSettings();
        
        // 更新当前语言
        this.updateCurrentLanguage();
    }

    /**
     * 根据语言获取当前使用的模板
     * 如果当前模板不是默认模板，则不再区分语言
     */
    getCurrentTemplate(): string {
        const language = this.getCurrentLanguage();
        
        // 中文环境
        if (language === 'zh') {
            // 如果中文模板已被修改（不等于默认模板），使用中文模板
            if (this.settings.templateZh !== DEFAULT_TEMPLATE_ZH) {
                return this.settings.templateZh;
            }
            // 如果英文模板已被修改，使用英文模板
            if (this.settings.templateEn !== DEFAULT_TEMPLATE_EN) {
                return this.settings.templateEn;
            }
            // 如果都是默认模板，使用中文默认模板
            return this.settings.templateZh;
        } 
        // 英文环境
        else {
            // 如果英文模板已被修改（不等于默认模板），使用英文模板
            if (this.settings.templateEn !== DEFAULT_TEMPLATE_EN) {
                return this.settings.templateEn;
            }
            // 如果中文模板已被修改，使用中文模板
            if (this.settings.templateZh !== DEFAULT_TEMPLATE_ZH) {
                return this.settings.templateZh;
            }
            // 如果都是默认模板，使用英文默认模板
            return this.settings.templateEn;
        }
    }
    
    /**
     * 获取当前语言设置
     */
    getCurrentLanguage(): string {
        if (this.settings.language === Language.AUTO) {
            // 自动检测系统语言
            const systemLanguage = window.navigator.language.toLowerCase();
            return systemLanguage.startsWith('zh') ? 'zh' : 'en';
        }
        return this.settings.language;
    }
    
    /**
     * 更新当前语言
     */
    private updateCurrentLanguage(): void {
        const language = this.getCurrentLanguage();
        setCurrentLanguage(language);
    }

    /**
     * 获取当前语言的模板
     */
    getTemplateByLanguage(): string {
        const language = this.getCurrentLanguage();
        
        // 中文环境
        if (language === 'zh') {
            // 如果中文模板已被修改（不等于默认模板），使用中文模板
            if (this.settings.templateZh !== DEFAULT_TEMPLATE_ZH) {
                return this.settings.templateZh;
            }
            // 如果英文模板已被修改，使用英文模板
            if (this.settings.templateEn !== DEFAULT_TEMPLATE_EN) {
                return this.settings.templateEn;
            }
            // 如果都是默认模板，使用中文默认模板
            return this.settings.templateZh;
        } 
        // 英文环境
        else {
            // 如果英文模板已被修改（不等于默认模板），使用英文模板
            if (this.settings.templateEn !== DEFAULT_TEMPLATE_EN) {
                return this.settings.templateEn;
            }
            // 如果中文模板已被修改，使用中文模板
            if (this.settings.templateZh !== DEFAULT_TEMPLATE_ZH) {
                return this.settings.templateZh;
            }
            // 如果都是默认模板，使用英文默认模板
            return this.settings.templateEn;
        }
    }

    /**
     * 检查是否存在自定义模板
     */
    hasCustomTemplate(): boolean {
        return !!this.settings.customTemplate;
    }
} 