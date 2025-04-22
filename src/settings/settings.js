import { ButtonComponent, Notice, PluginSettingTab, Setting, TextAreaComponent, TextComponent } from 'obsidian';
import { AutoGenerateMode, DEFAULT_SETTINGS, DEFAULT_TEMPLATE_EN, DEFAULT_TEMPLATE_ZH, Language } from '../models/settings';
import { getTranslation, setCurrentLanguage } from '../i18n/i18n';
import { renderTemplate } from '../utils/templateEngine';
import { TaskGenerator } from '../taskGenerator';
// CSS 相关代码
const SettingsSectionCSS = "daily-task-settings-section";
const ButtonCSS = "daily-task-button";
const PreviewButtonCSS = "daily-task-preview-button";
const ResetButtonCSS = "daily-task-reset-button";
const EditorCSS = "daily-task-editor";
const VerticalStackCSS = "daily-task-vertical-stack";
const TextRightCSS = "daily-task-text-right";
const TextCenterCSS = "daily-task-text-center";
const ScrollbarSlimCSS = "daily-task-slim-scrollbar";
/**
 * 添加插件自定义样式
 */
function addCustomStyles() {
    const cssText = `
        .${SettingsSectionCSS} {
            margin-top: 24px;
            margin-bottom: 24px;
            padding: 12px 0;
            border-top: 1px solid var(--background-modifier-border);
        }
        
        .${ButtonCSS} {
            margin-top: 6px;
            margin-bottom: 6px;
        }
        
        .${PreviewButtonCSS}, .${ResetButtonCSS} {
            display: inline-block;
            text-align: center !important;
            width: 100%;
        }
        
        .${EditorCSS} {
            height: 200px;
            margin-top: 12px;
            margin-bottom: 12px;
        }
        
        .${VerticalStackCSS} {
            display: flex;
            flex-direction: column;
        }
        
        .${TextRightCSS} {
            text-align: right;
        }
        
        .${TextCenterCSS} {
            text-align: center !important;
        }
        
        .${ScrollbarSlimCSS} .CodeMirror-vscrollbar {
            width: 20% !important;
        }
        
        /* 自定义通知样式 */
        .daily-task-success-notice {
            background-color: rgba(0, 255, 127, 0.2) !important;
        }
        
        .daily-task-warning-notice {
            background-color: rgba(255, 165, 0, 0.2) !important;
        }
        
        .daily-task-error-notice {
            background-color: rgba(255, 69, 0, 0.2) !important;
        }
    `;
    // 添加自定义样式
    const styleElement = document.createElement('style');
    styleElement.textContent = cssText;
    document.head.appendChild(styleElement);
}
/**
 * 插件设置标签页
 */
export class DailyTaskSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.previewEl = null;
        this.addTaskButton = null;
        // 目录输入框
        this.rootDirInput = null;
        // 标记设置是否已修改但未保存
        this.dirtySettings = false;
        this.plugin = plugin;
        // 获取父插件中的设置管理器引用
        this.settingsManager = plugin.settingsManager;
        // 创建任务生成器
        this.taskGenerator = new TaskGenerator(app, this.settingsManager);
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.classList.add('daily-task-setting-tab');
        const settings = this.settingsManager.getSettings();
        // 添加顶部间距（增加间距以改善界面美观）
        const topSpacing = containerEl.createEl('div');
        topSpacing.style.marginTop = '30px';
        // 根目录设置
        const rootDirSetting = new Setting(containerEl)
            .setName(getTranslation('settings.rootDir'))
            .setDesc(getTranslation('settings.rootDir.desc'));
        // 创建输入框容器，使其可以包含额外元素
        const inputContainer = document.createElement('div');
        inputContainer.style.display = 'flex';
        inputContainer.style.width = '100%';
        inputContainer.style.position = 'relative';
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
        // 给input元素直接设置placeholder属性
        if (this.rootDirInput && this.rootDirInput.inputEl) {
            this.rootDirInput.inputEl.placeholder = 'DailyTasks';
            // 增加宽度
            this.rootDirInput.inputEl.style.width = '100%';
            // 美化输入框样式
            this.rootDirInput.inputEl.style.borderRadius = '4px';
            this.rootDirInput.inputEl.style.padding = '8px 35px 8px 10px';
            this.rootDirInput.inputEl.style.transition = 'all 0.3s ease';
        }
        // 添加自动保存指示器
        const saveIndicator = document.createElement('div');
        saveIndicator.classList.add('save-indicator');
        saveIndicator.style.position = 'absolute';
        saveIndicator.style.right = '10px';
        saveIndicator.style.top = '50%';
        saveIndicator.style.transform = 'translateY(-50%)';
        saveIndicator.style.opacity = '0';
        saveIndicator.style.transition = 'opacity 0.3s ease';
        inputContainer.appendChild(saveIndicator);
        // 创建保存成功图标
        const saveSuccessIcon = createSpan({ cls: 'svg-icon lucide-check' });
        saveSuccessIcon.style.color = '#4CAF50';
        saveSuccessIcon.style.width = '18px';
        saveSuccessIcon.style.height = '18px';
        saveIndicator.appendChild(saveSuccessIcon);
        // 记录自动保存定时器
        let autoSaveTimer = null;
        // 自动保存方法
        this.autoSaveRootDir = async (value) => {
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
                // 保存设置
                await this.settingsManager.updateSettings({ rootDir: pathToSave });
                this.dirtySettings = false;
                // 显示保存成功指示器
                saveIndicator.style.opacity = '1';
                // 3秒后隐藏
                setTimeout(() => {
                    saveIndicator.style.opacity = '0';
                }, 2000);
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
        const updateSlider = (index) => {
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
                await this.settingsManager.updateSettings({ language: value });
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
                    const iconEl = createSpan({ cls: 'svg-icon lucide-bar-chart-2' });
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
        previewHeader.style.justifyContent = 'center';
        previewHeader.style.marginTop = '15px';
        previewHeader.style.gap = '10px';
        // 预览按钮
        const toggleButton = new ButtonComponent(previewHeader)
            .setButtonText(getTranslation('settings.template.preview'));
        // 添加样式类
        toggleButton.buttonEl.addClass(TextCenterCSS);
        toggleButton.buttonEl.style.textAlign = 'center';
        toggleButton.buttonEl.style.display = 'flex';
        toggleButton.buttonEl.style.alignItems = 'center';
        toggleButton.buttonEl.style.justifyContent = 'center';
        toggleButton.buttonEl.style.width = '120px';
        // 手动添加眼睛图标
        const eyeIcon = createSpan({ cls: 'svg-icon lucide-eye' });
        toggleButton.buttonEl.prepend(eyeIcon);
        // 预览区域
        this.previewEl = document.createElement('div');
        this.previewEl.classList.add('template-preview');
        this.previewEl.style.marginTop = '15px';
        this.previewEl.style.padding = '15px';
        this.previewEl.style.border = '1px dashed var(--background-modifier-border)';
        this.previewEl.style.borderRadius = '4px';
        this.previewEl.style.backgroundColor = 'var(--background-secondary)';
        this.previewEl.style.display = 'none';
        this.updatePreview(this.previewEl, currentTemplate);
        templateContainer.appendChild(this.previewEl);
        toggleButton.onClick(() => {
            this.togglePreview(this.previewEl);
            // 切换图标和按钮文本
            if (this.previewEl && this.previewEl.classList.contains('visible')) {
                eyeIcon.className = 'svg-icon lucide-eye-off';
                toggleButton.setButtonText(getTranslation('settings.template.hide'));
            }
            else {
                eyeIcon.className = 'svg-icon lucide-eye';
                toggleButton.setButtonText(getTranslation('settings.template.preview'));
            }
        });
        // 重置按钮
        const resetBtn = new ButtonComponent(previewHeader)
            .setButtonText(getTranslation('settings.resetDefault'));
        // 添加样式类
        resetBtn.buttonEl.addClass(TextCenterCSS);
        resetBtn.buttonEl.style.textAlign = 'center';
        resetBtn.buttonEl.style.display = 'flex';
        resetBtn.buttonEl.style.alignItems = 'center';
        resetBtn.buttonEl.style.justifyContent = 'center';
        resetBtn.buttonEl.style.width = '120px';
        // 添加重置图标
        resetBtn.buttonEl.prepend(createSpan({ cls: 'svg-icon lucide-refresh-cw' }));
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
        });
        // 将按钮添加到标题栏
        previewHeader.appendChild(toggleButton.buttonEl);
        previewHeader.appendChild(resetBtn.buttonEl);
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
        resetDefaultBtn.buttonEl.style.width = '120px';
        // 添加重置图标和危险按钮样式
        resetDefaultBtn.buttonEl.prepend(createSpan({ cls: 'svg-icon lucide-refresh-cw' }));
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
            var _a;
            // 检查目录设置
            const rootDir = this.settingsManager.getSettings().rootDir;
            // 添加loading状态
            if (this.addTaskButton && this.addTaskButton.buttonEl) {
                this.addTaskButton.buttonEl.classList.add('loading');
            }
            (_a = this.addTaskButton) === null || _a === void 0 ? void 0 : _a.setDisabled(true);
            try {
                // 添加任务
                await this.taskGenerator.addTaskManually();
            }
            catch (e) {
                console.error("添加任务出错:", e);
                new Notice(`添加任务失败: ${e.message || e}`);
            }
            finally {
                // 移除loading状态
                setTimeout(() => {
                    var _a;
                    if (this.addTaskButton && this.addTaskButton.buttonEl) {
                        this.addTaskButton.buttonEl.classList.remove('loading');
                    }
                    (_a = this.addTaskButton) === null || _a === void 0 ? void 0 : _a.setDisabled(false);
                }, 500);
            }
        });
        // 添加图标
        this.addTaskButton.buttonEl.prepend(createSpan({ cls: 'svg-icon lucide-calendar-plus' }));
    }
    /**
     * 更新模板预览
     */
    updatePreview(previewEl, template) {
        if (!previewEl)
            return;
        const renderedContent = renderTemplate(template);
        // 使用MarkdownRenderer需要导入相关组件
        previewEl.innerHTML = renderedContent.replace(/\n/g, '<br>');
    }
    /**
     * 切换预览的显示/隐藏
     */
    togglePreview(previewEl) {
        if (!previewEl)
            return;
        if (previewEl.style.display === 'none') {
            previewEl.style.display = 'block';
            previewEl.classList.add('visible');
        }
        else {
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
    constructor(plugin) {
        this.plugin = plugin;
        this.settings = Object.assign({}, DEFAULT_SETTINGS);
    }
    /**
     * 获取当前设置
     */
    getSettings() {
        return this.settings;
    }
    /**
     * 更新设置并保存
     * @param settings 要更新的设置
     */
    async updateSettings(settings) {
        this.settings = Object.assign(Object.assign({}, this.settings), settings);
        await this.saveSettings();
        // 更新当前语言
        this.updateCurrentLanguage();
    }
    /**
     * 保存设置到数据存储
     */
    async saveSettings() {
        await this.plugin.saveData(this.settings);
    }
    /**
     * 加载设置
     */
    async loadSettings() {
        const loadedData = await this.plugin.loadData();
        if (loadedData) {
            // 合并默认设置和已保存的设置
            this.settings = Object.assign(Object.assign({}, DEFAULT_SETTINGS), loadedData);
            // 确保在升级插件后，新增的设置项也有默认值
            this.ensureSettingsCompleteness();
        }
        else {
            // 如果没有加载到数据，使用默认设置但将自动生成模式改为工作日
            this.settings = Object.assign(Object.assign({}, DEFAULT_SETTINGS), { autoGenerateMode: AutoGenerateMode.WORKDAY });
        }
        // 更新当前语言
        this.updateCurrentLanguage();
    }
    /**
     * 确保设置完整性，为新增的设置项提供默认值
     */
    ensureSettingsCompleteness() {
        const defaultKeys = Object.keys(DEFAULT_SETTINGS);
        defaultKeys.forEach(key => {
            // 如果当前设置中缺少某个默认设置项，添加默认值
            if (!(key in this.settings)) {
                this.settings[key] = DEFAULT_SETTINGS[key];
            }
        });
    }
    /**
     * 恢复默认设置
     */
    async resetToDefaults() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS);
        await this.saveSettings();
        // 更新当前语言
        this.updateCurrentLanguage();
    }
    /**
     * 根据语言获取当前使用的模板
     * 如果当前模板不是默认模板，则不再区分语言
     */
    getCurrentTemplate() {
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
    getCurrentLanguage() {
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
    updateCurrentLanguage() {
        const language = this.getCurrentLanguage();
        setCurrentLanguage(language);
    }
    /**
     * 获取当前语言的模板
     */
    getTemplateByLanguage() {
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
    hasCustomTemplate() {
        return !!this.settings.customTemplate;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZXR0aW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQU8sZUFBZSxFQUFxQixNQUFNLEVBQVUsZ0JBQWdCLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBbUIsTUFBTSxVQUFVLENBQUM7QUFDakssT0FBTyxFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLG1CQUFtQixFQUFFLG1CQUFtQixFQUFxQixRQUFRLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUMvSSxPQUFPLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQ2xFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN6RCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFTakQsV0FBVztBQUNYLE1BQU0sa0JBQWtCLEdBQUcsNkJBQTZCLENBQUM7QUFDekQsTUFBTSxTQUFTLEdBQUcsbUJBQW1CLENBQUM7QUFDdEMsTUFBTSxnQkFBZ0IsR0FBRywyQkFBMkIsQ0FBQztBQUNyRCxNQUFNLGNBQWMsR0FBRyx5QkFBeUIsQ0FBQztBQUNqRCxNQUFNLFNBQVMsR0FBRyxtQkFBbUIsQ0FBQztBQUN0QyxNQUFNLGdCQUFnQixHQUFHLDJCQUEyQixDQUFDO0FBQ3JELE1BQU0sWUFBWSxHQUFHLHVCQUF1QixDQUFDO0FBQzdDLE1BQU0sYUFBYSxHQUFHLHdCQUF3QixDQUFDO0FBQy9DLE1BQU0sZ0JBQWdCLEdBQUcsMkJBQTJCLENBQUM7QUFFckQ7O0dBRUc7QUFDSCxTQUFTLGVBQWU7SUFDcEIsTUFBTSxPQUFPLEdBQUc7V0FDVCxrQkFBa0I7Ozs7Ozs7V0FPbEIsU0FBUzs7Ozs7V0FLVCxnQkFBZ0IsTUFBTSxjQUFjOzs7Ozs7V0FNcEMsU0FBUzs7Ozs7O1dBTVQsZ0JBQWdCOzs7OztXQUtoQixZQUFZOzs7O1dBSVos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O1lBQ3BCLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEtBQUssbUJBQW1CLEVBQUU7Z0JBQ2xELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7YUFDbkM7WUFDRCxvQkFBb0I7WUFDcEIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztTQUNuQztRQUNELE9BQU87YUFDRjtZQUNELDZCQUE2QjtZQUM3QixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxLQUFLLG1CQUFtQixFQUFFO2dCQUNsRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO2FBQ25DO1lBQ0Qsb0JBQW9CO1lBQ3BCLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEtBQUssbUJBQW1CLEVBQUU7Z0JBQ2xELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7YUFDbkM7WUFDRCxvQkFBb0I7WUFDcEIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztTQUNuQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNILGlCQUFpQjtRQUNiLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDO0lBQzFDLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcCwgQnV0dG9uQ29tcG9uZW50LCBEcm9wZG93bkNvbXBvbmVudCwgTm90aWNlLCBQbHVnaW4sIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIFRleHRBcmVhQ29tcG9uZW50LCBUZXh0Q29tcG9uZW50LCBUb2dnbGVDb21wb25lbnQgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgeyBBdXRvR2VuZXJhdGVNb2RlLCBERUZBVUxUX1NFVFRJTkdTLCBERUZBVUxUX1RFTVBMQVRFX0VOLCBERUZBVUxUX1RFTVBMQVRFX1pILCBEYWlseVRhc2tTZXR0aW5ncywgTGFuZ3VhZ2UgfSBmcm9tICcuLi9tb2RlbHMvc2V0dGluZ3MnO1xuaW1wb3J0IHsgZ2V0VHJhbnNsYXRpb24sIHNldEN1cnJlbnRMYW5ndWFnZSB9IGZyb20gJy4uL2kxOG4vaTE4bic7XG5pbXBvcnQgeyByZW5kZXJUZW1wbGF0ZSB9IGZyb20gJy4uL3V0aWxzL3RlbXBsYXRlRW5naW5lJztcbmltcG9ydCB7IFRhc2tHZW5lcmF0b3IgfSBmcm9tICcuLi90YXNrR2VuZXJhdG9yJztcblxuLy8g5YmN5ZCR5aOw5piO77yM6YG/5YWN5b6q546v5a+85YWlXG5kZWNsYXJlIGNsYXNzIERhaWx5VGFza1BsdWdpbiB7XG4gICAgc2F2ZURhdGEoZGF0YTogYW55KTogUHJvbWlzZTx2b2lkPjtcbiAgICBsb2FkRGF0YSgpOiBQcm9taXNlPGFueT47XG4gICAgYXBwOiBBcHA7XG59XG5cbi8vIENTUyDnm7jlhbPku6PnoIFcbmNvbnN0IFNldHRpbmdzU2VjdGlvbkNTUyA9IFwiZGFpbHktdGFzay1zZXR0aW5ncy1zZWN0aW9uXCI7XG5jb25zdCBCdXR0b25DU1MgPSBcImRhaWx5LXRhc2stYnV0dG9uXCI7XG5jb25zdCBQcmV2aWV3QnV0dG9uQ1NTID0gXCJkYWlseS10YXNrLXByZXZpZXctYnV0dG9uXCI7XG5jb25zdCBSZXNldEJ1dHRvbkNTUyA9IFwiZGFpbHktdGFzay1yZXNldC1idXR0b25cIjtcbmNvbnN0IEVkaXRvckNTUyA9IFwiZGFpbHktdGFzay1lZGl0b3JcIjtcbmNvbnN0IFZlcnRpY2FsU3RhY2tDU1MgPSBcImRhaWx5LXRhc2stdmVydGljYWwtc3RhY2tcIjtcbmNvbnN0IFRleHRSaWdodENTUyA9IFwiZGFpbHktdGFzay10ZXh0LXJpZ2h0XCI7XG5jb25zdCBUZXh0Q2VudGVyQ1NTID0gXCJkYWlseS10YXNrLXRleHQtY2VudGVyXCI7XG5jb25zdCBTY3JvbGxiYXJTbGltQ1NTID0gXCJkYWlseS10YXNrLXNsaW0tc2Nyb2xsYmFyXCI7XG5cbi8qKlxuICog5re75Yqg5o+S5Lu26Ieq5a6a5LmJ5qC35byPXG4gKi9cbmZ1bmN0aW9uIGFkZEN1c3RvbVN0eWxlcygpIHtcbiAgICBjb25zdCBjc3NUZXh0ID0gYFxuICAgICAgICAuJHtTZXR0aW5nc1NlY3Rpb25DU1N9IHtcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IDI0cHg7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAyNHB4O1xuICAgICAgICAgICAgcGFkZGluZzogMTJweCAwO1xuICAgICAgICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLiR7QnV0dG9uQ1NTfSB7XG4gICAgICAgICAgICBtYXJnaW4tdG9wOiA2cHg7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiA2cHg7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC4ke1ByZXZpZXdCdXR0b25DU1N9LCAuJHtSZXNldEJ1dHRvbkNTU30ge1xuICAgICAgICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLiR7RWRpdG9yQ1NTfSB7XG4gICAgICAgICAgICBoZWlnaHQ6IDIwMHB4O1xuICAgICAgICAgICAgbWFyZ2luLXRvcDogMTJweDtcbiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDEycHg7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC4ke1ZlcnRpY2FsU3RhY2tDU1N9IHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAuJHtUZXh0UmlnaHRDU1N9IHtcbiAgICAgICAgICAgIHRleHQtYWxpZ246IHJpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAuJHtUZXh0Q2VudGVyQ1NTfSB7XG4gICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXIgIWltcG9ydGFudDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLiR7U2Nyb2xsYmFyU2xpbUNTU30gLkNvZGVNaXJyb3ItdnNjcm9sbGJhciB7XG4gICAgICAgICAgICB3aWR0aDogMjAlICFpbXBvcnRhbnQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8qIOiHquWumuS5iemAmuefpeagt+W8jyAqL1xuICAgICAgICAuZGFpbHktdGFzay1zdWNjZXNzLW5vdGljZSB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDAsIDI1NSwgMTI3LCAwLjIpICFpbXBvcnRhbnQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC5kYWlseS10YXNrLXdhcm5pbmctbm90aWNlIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMjU1LCAxNjUsIDAsIDAuMikgIWltcG9ydGFudDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLmRhaWx5LXRhc2stZXJyb3Itbm90aWNlIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMjU1LCA2OSwgMCwgMC4yKSAhaW1wb3J0YW50O1xuICAgICAgICB9XG4gICAgYDtcbiAgICBcbiAgICAvLyDmt7vliqDoh6rlrprkuYnmoLflvI9cbiAgICBjb25zdCBzdHlsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHN0eWxlRWxlbWVudC50ZXh0Q29udGVudCA9IGNzc1RleHQ7XG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZUVsZW1lbnQpO1xufVxuXG4vKipcbiAqIOaPkuS7tuiuvue9ruagh+etvumhtVxuICovXG5leHBvcnQgY2xhc3MgRGFpbHlUYXNrU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICAgIHBsdWdpbjogUGx1Z2luO1xuICAgIHNldHRpbmdzTWFuYWdlcjogU2V0dGluZ3NNYW5hZ2VyO1xuICAgIHRhc2tHZW5lcmF0b3I6IFRhc2tHZW5lcmF0b3I7XG4gICAgcHJldmlld0VsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAgIGFkZFRhc2tCdXR0b246IEJ1dHRvbkNvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICAgIFxuICAgIC8vIOebruW9lei+k+WFpeahhlxuICAgIHJvb3REaXJJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICAgIFxuICAgIC8vIOagh+iusOiuvue9ruaYr+WQpuW3suS/ruaUueS9huacquS/neWtmFxuICAgIGRpcnR5U2V0dGluZ3M6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBcbiAgICAvLyDoh6rliqjkv53lrZjnm67lvZXnmoTmlrnms5VcbiAgICBhdXRvU2F2ZVJvb3REaXI6ICh2YWx1ZTogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+O1xuXG4gICAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogUGx1Z2luKSB7XG4gICAgICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5bniLbmj5Lku7bkuK3nmoTorr7nva7nrqHnkIblmajlvJXnlKhcbiAgICAgICAgdGhpcy5zZXR0aW5nc01hbmFnZXIgPSAocGx1Z2luIGFzIGFueSkuc2V0dGluZ3NNYW5hZ2VyO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65Lu75Yqh55Sf5oiQ5ZmoXG4gICAgICAgIHRoaXMudGFza0dlbmVyYXRvciA9IG5ldyBUYXNrR2VuZXJhdG9yKGFwcCwgdGhpcy5zZXR0aW5nc01hbmFnZXIpO1xuICAgIH1cblxuICAgIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgICAgIGNvbnRhaW5lckVsLmNsYXNzTGlzdC5hZGQoJ2RhaWx5LXRhc2stc2V0dGluZy10YWInKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc01hbmFnZXIuZ2V0U2V0dGluZ3MoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOmhtumDqOmXtOi3ne+8iOWinuWKoOmXtOi3neS7peaUueWWhOeVjOmdoue+juingu+8iVxuICAgICAgICBjb25zdCB0b3BTcGFjaW5nID0gY29udGFpbmVyRWwuY3JlYXRlRWwoJ2RpdicpO1xuICAgICAgICB0b3BTcGFjaW5nLnN0eWxlLm1hcmdpblRvcCA9ICczMHB4JztcbiAgICAgICAgXG4gICAgICAgIC8vIOagueebruW9leiuvue9rlxuICAgICAgICBjb25zdCByb290RGlyU2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoZ2V0VHJhbnNsYXRpb24oJ3NldHRpbmdzLnJvb3REaXInKSlcbiAgICAgICAgICAgIC5zZXREZXNjKGdldFRyYW5zbGF0aW9uKCdzZXR0aW5ncy5yb290RGlyLmRlc2MnKSk7XG4gICAgICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu66L6T5YWl5qGG5a655Zmo77yM5L2/5YW25Y+v5Lul5YyF5ZCr6aKd5aSW5YWD57SgXG4gICAgICAgIGNvbnN0IGlucHV0Q29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGlucHV0Q29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgIGlucHV0Q29udGFpbmVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICAgICAgICBpbnB1dENvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgIHJvb3REaXJTZXR0aW5nLmNvbnRyb2xFbC5hcHBlbmRDaGlsZChpbnB1dENvbnRhaW5lcik7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnJvb3REaXJJbnB1dCA9IG5ldyBUZXh0Q29tcG9uZW50KGlucHV0Q29udGFpbmVyKVxuICAgICAgICAgICAgLnNldFZhbHVlKHNldHRpbmdzLnJvb3REaXIpXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLnRyaW0oKSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g6K6+572u5bey5pu05pS577yM5YeG5aSH6Ieq5Yqo5L+d5a2YXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlydHlTZXR0aW5ncyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDlkK/liqjoh6rliqjkv53lrZjlrprml7blmahcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hdXRvU2F2ZVJvb3REaXIodmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8g57uZaW5wdXTlhYPntKDnm7TmjqXorr7nva5wbGFjZWhvbGRlcuWxnuaAp1xuICAgICAgICBpZiAodGhpcy5yb290RGlySW5wdXQgJiYgdGhpcy5yb290RGlySW5wdXQuaW5wdXRFbCkge1xuICAgICAgICAgICAgdGhpcy5yb290RGlySW5wdXQuaW5wdXRFbC5wbGFjZWhvbGRlciA9ICdEYWlseVRhc2tzJztcbiAgICAgICAgICAgIC8vIOWinuWKoOWuveW6plxuICAgICAgICAgICAgdGhpcy5yb290RGlySW5wdXQuaW5wdXRFbC5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgICAgICAgICAgIC8vIOe+juWMlui+k+WFpeahhuagt+W8j1xuICAgICAgICAgICAgdGhpcy5yb290RGlySW5wdXQuaW5wdXRFbC5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnNHB4JztcbiAgICAgICAgICAgIHRoaXMucm9vdERpcklucHV0LmlucHV0RWwuc3R5bGUucGFkZGluZyA9ICc4cHggMzVweCA4cHggMTBweCc7XG4gICAgICAgICAgICB0aGlzLnJvb3REaXJJbnB1dC5pbnB1dEVsLnN0eWxlLnRyYW5zaXRpb24gPSAnYWxsIDAuM3MgZWFzZSc7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOiHquWKqOS/neWtmOaMh+ekuuWZqFxuICAgICAgICBjb25zdCBzYXZlSW5kaWNhdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHNhdmVJbmRpY2F0b3IuY2xhc3NMaXN0LmFkZCgnc2F2ZS1pbmRpY2F0b3InKTtcbiAgICAgICAgc2F2ZUluZGljYXRvci5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHNhdmVJbmRpY2F0b3Iuc3R5bGUucmlnaHQgPSAnMTBweCc7XG4gICAgICAgIHNhdmVJbmRpY2F0b3Iuc3R5bGUudG9wID0gJzUwJSc7XG4gICAgICAgIHNhdmVJbmRpY2F0b3Iuc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZVkoLTUwJSknO1xuICAgICAgICBzYXZlSW5kaWNhdG9yLnN0eWxlLm9wYWNpdHkgPSAnMCc7XG4gICAgICAgIHNhdmVJbmRpY2F0b3Iuc3R5bGUudHJhbnNpdGlvbiA9ICdvcGFjaXR5IDAuM3MgZWFzZSc7XG4gICAgICAgIGlucHV0Q29udGFpbmVyLmFwcGVuZENoaWxkKHNhdmVJbmRpY2F0b3IpO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65L+d5a2Y5oiQ5Yqf5Zu+5qCHXG4gICAgICAgIGNvbnN0IHNhdmVTdWNjZXNzSWNvbiA9IGNyZWF0ZVNwYW4oe2NsczogJ3N2Zy1pY29uIGx1Y2lkZS1jaGVjayd9KTtcbiAgICAgICAgc2F2ZVN1Y2Nlc3NJY29uLnN0eWxlLmNvbG9yID0gJyM0Q0FGNTAnO1xuICAgICAgICBzYXZlU3VjY2Vzc0ljb24uc3R5bGUud2lkdGggPSAnMThweCc7XG4gICAgICAgIHNhdmVTdWNjZXNzSWNvbi5zdHlsZS5oZWlnaHQgPSAnMThweCc7XG4gICAgICAgIHNhdmVJbmRpY2F0b3IuYXBwZW5kQ2hpbGQoc2F2ZVN1Y2Nlc3NJY29uKTtcblxuICAgICAgICAvLyDorrDlvZXoh6rliqjkv53lrZjlrprml7blmahcbiAgICAgICAgbGV0IGF1dG9TYXZlVGltZXI6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLy8g6Ieq5Yqo5L+d5a2Y5pa55rOVXG4gICAgICAgIHRoaXMuYXV0b1NhdmVSb290RGlyID0gYXN5bmMgKHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIC8vIOa4hemZpOS5i+WJjeeahOWumuaXtuWZqFxuICAgICAgICAgICAgaWYgKGF1dG9TYXZlVGltZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoYXV0b1NhdmVUaW1lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiuvue9ruaWsOeahOWumuaXtuWZqO+8jOW7tui/nzgwMG1z5L+d5a2Y77yI5Zyo55So5oi35YGc5q2i6L6T5YWl5ZCO77yJXG4gICAgICAgICAgICBhdXRvU2F2ZVRpbWVyID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHBhdGhUb1NhdmUgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhUb1NhdmUgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGhUb1NhdmUgPSAnRGFpbHlUYXNrcyc7IC8vIOm7mOiupOWtmOaUvuebruW9lVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDkv53lrZjorr7nva5cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNldHRpbmdzTWFuYWdlci51cGRhdGVTZXR0aW5ncyh7IHJvb3REaXI6IHBhdGhUb1NhdmUgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXJ0eVNldHRpbmdzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5pi+56S65L+d5a2Y5oiQ5Yqf5oyH56S65ZmoXG4gICAgICAgICAgICAgICAgc2F2ZUluZGljYXRvci5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIDPnp5LlkI7pmpDol49cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2F2ZUluZGljYXRvci5zdHlsZS5vcGFjaXR5ID0gJzAnO1xuICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgfSwgODAwKSBhcyB1bmtub3duIGFzIG51bWJlcjtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8vIOiHquWKqOeUn+aIkOaooeW8j1xuICAgICAgICBjb25zdCBhdXRvR2VuU2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoZ2V0VHJhbnNsYXRpb24oJ3NldHRpbmdzLmF1dG9HZW5lcmF0ZScpKVxuICAgICAgICAgICAgLnNldERlc2MoZ2V0VHJhbnNsYXRpb24oJ3NldHRpbmdzLmF1dG9HZW5lcmF0ZS5kZXNjJykpO1xuICAgICAgICAgICAgXG4gICAgICAgIC8vIOiHquWumuS5ieS4iemAiea7keWdl1xuICAgICAgICBjb25zdCB0b2dnbGVDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdG9nZ2xlQ29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ21vZGUtdG9nZ2xlLWNvbnRhaW5lcicpO1xuICAgICAgICB0b2dnbGVDb250YWluZXIuc3R5bGUud2lkdGggPSAnMjAlJzsgLy8g57yp55+t5ruR5Yqo5p2h6ZW/5bqm5Li65Y6f5p2l55qEMjAlXG4gICAgICAgIHRvZ2dsZUNvbnRhaW5lci5zdHlsZS5tYXJnaW5MZWZ0ID0gJ2F1dG8nOyAvLyDpnaDlj7PmmL7npLpcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG1vZGVzID0gW1xuICAgICAgICAgICAgeyB2YWx1ZTogQXV0b0dlbmVyYXRlTW9kZS5OT05FLCBsYWJlbDogZ2V0VHJhbnNsYXRpb24oJ3NldHRpbmdzLm1vZGUubm9uZScpIH0sXG4gICAgICAgICAgICB7IHZhbHVlOiBBdXRvR2VuZXJhdGVNb2RlLkRBSUxZLCBsYWJlbDogZ2V0VHJhbnNsYXRpb24oJ3NldHRpbmdzLm1vZGUuZGFpbHknKSB9LFxuICAgICAgICAgICAgeyB2YWx1ZTogQXV0b0dlbmVyYXRlTW9kZS5XT1JLREFZLCBsYWJlbDogZ2V0VHJhbnNsYXRpb24oJ3NldHRpbmdzLm1vZGUud29ya2RheScpIH1cbiAgICAgICAgXTtcbiAgICAgICAgXG4gICAgICAgIC8vIOa7keWdl+aMh+ekuuWZqFxuICAgICAgICBjb25zdCBzbGlkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgc2xpZGVyLmNsYXNzTGlzdC5hZGQoJ21vZGUtdG9nZ2xlLXNsaWRlcicpO1xuICAgICAgICB0b2dnbGVDb250YWluZXIuYXBwZW5kQ2hpbGQoc2xpZGVyKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOa7keWdl+S9jee9rlxuICAgICAgICBjb25zdCB1cGRhdGVTbGlkZXIgPSAoaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgc2xpZGVyLnN0eWxlLmxlZnQgPSBgJHtpbmRleCAqIDMzLjMzfSVgO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLy8g6K6+572u6buY6K6k5qih5byP5Li65LuF5bel5L2c5pel55Sf5oiQ77yIV29ya0Rhee+8iVxuICAgICAgICBsZXQgY3VycmVudE1vZGVJbmRleCA9IG1vZGVzLmZpbmRJbmRleChtb2RlID0+IG1vZGUudmFsdWUgPT09IHNldHRpbmdzLmF1dG9HZW5lcmF0ZU1vZGUpO1xuICAgICAgICBpZiAoY3VycmVudE1vZGVJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIC8vIOWmguaenOayoeacieaJvuWIsOacieaViOeahOaooeW8j++8jOiuvue9ruS4uuW3peS9nOaXpeaooeW8j1xuICAgICAgICAgICAgY3VycmVudE1vZGVJbmRleCA9IG1vZGVzLmZpbmRJbmRleChtb2RlID0+IG1vZGUudmFsdWUgPT09IEF1dG9HZW5lcmF0ZU1vZGUuV09SS0RBWSk7XG4gICAgICAgICAgICAvLyDmm7TmlrDorr7nva7liLDlt6XkvZzml6XmqKHlvI9cbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3NNYW5hZ2VyLnVwZGF0ZVNldHRpbmdzKHsgYXV0b0dlbmVyYXRlTW9kZTogQXV0b0dlbmVyYXRlTW9kZS5XT1JLREFZIH0pO1xuICAgICAgICB9XG4gICAgICAgIHVwZGF0ZVNsaWRlcihjdXJyZW50TW9kZUluZGV4KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7uumAiemhuVxuICAgICAgICBtb2Rlcy5mb3JFYWNoKChtb2RlLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBvcHRpb24uY2xhc3NMaXN0LmFkZCgnbW9kZS10b2dnbGUtb3B0aW9uJyk7XG4gICAgICAgICAgICBvcHRpb24udGV4dENvbnRlbnQgPSBtb2RlLmxhYmVsO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAobW9kZS52YWx1ZSA9PT0gc2V0dGluZ3MuYXV0b0dlbmVyYXRlTW9kZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbi5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgb3B0aW9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIOabtOaWsOinhuinieeKtuaAgVxuICAgICAgICAgICAgICAgIHRvZ2dsZUNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcubW9kZS10b2dnbGUtb3B0aW9uJykuZm9yRWFjaChlbCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG9wdGlvbi5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDmm7TmlrDmu5HlnZfkvY3nva5cbiAgICAgICAgICAgICAgICB1cGRhdGVTbGlkZXIoaW5kZXgpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOS/neWtmOiuvue9rlxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0dGluZ3NNYW5hZ2VyLnVwZGF0ZVNldHRpbmdzKHsgYXV0b0dlbmVyYXRlTW9kZTogbW9kZS52YWx1ZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0b2dnbGVDb250YWluZXIuYXBwZW5kQ2hpbGQob3B0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBhdXRvR2VuU2V0dGluZy5jb250cm9sRWwuYXBwZW5kQ2hpbGQodG9nZ2xlQ29udGFpbmVyKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOivreiogOiuvue9rlxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKGdldFRyYW5zbGF0aW9uKCdzZXR0aW5ncy5sYW5ndWFnZScpKVxuICAgICAgICAgICAgLnNldERlc2MoZ2V0VHJhbnNsYXRpb24oJ3NldHRpbmdzLmxhbmd1YWdlLmRlc2MnKSlcbiAgICAgICAgICAgIC5hZGREcm9wZG93bihkcm9wZG93biA9PiB7XG4gICAgICAgICAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAgICAgICAgICAgLmFkZE9wdGlvbihMYW5ndWFnZS5BVVRPLCBnZXRUcmFuc2xhdGlvbignc2V0dGluZ3MubGFuZ3VhZ2UuYXV0bycpKVxuICAgICAgICAgICAgICAgICAgICAuYWRkT3B0aW9uKExhbmd1YWdlLlpILCBnZXRUcmFuc2xhdGlvbignc2V0dGluZ3MubGFuZ3VhZ2UuemgnKSlcbiAgICAgICAgICAgICAgICAgICAgLmFkZE9wdGlvbihMYW5ndWFnZS5FTiwgZ2V0VHJhbnNsYXRpb24oJ3NldHRpbmdzLmxhbmd1YWdlLmVuJykpXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShzZXR0aW5ncy5sYW5ndWFnZSlcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXR0aW5nc01hbmFnZXIudXBkYXRlU2V0dGluZ3MoeyBsYW5ndWFnZTogdmFsdWUgYXMgTGFuZ3VhZ2UgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDpnIDopoHph43mlrDliqDovb3orr7nva7pobXpnaLku6Xmm7TmlrDnv7vor5FcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8g6YCa55+l5pi+56S65pe26Ze0XG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoZ2V0VHJhbnNsYXRpb24oJ3NldHRpbmdzLm5vdGlmaWNhdGlvbkR1cmF0aW9uJykpXG4gICAgICAgICAgICAuc2V0RGVzYyhnZXRUcmFuc2xhdGlvbignc2V0dGluZ3Mubm90aWZpY2F0aW9uRHVyYXRpb24uZGVzYycpKVxuICAgICAgICAgICAgLmFkZFRleHQodGV4dCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gdGV4dFxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUoc2V0dGluZ3Muc3VjY2Vzc05vdGlmaWNhdGlvbkR1cmF0aW9uLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGR1cmF0aW9uID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc05hTihkdXJhdGlvbikgJiYgZHVyYXRpb24gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXR0aW5nc01hbmFnZXIudXBkYXRlU2V0dGluZ3MoeyBzdWNjZXNzTm90aWZpY2F0aW9uRHVyYXRpb246IGR1cmF0aW9uIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDnm7TmjqXorr7nva5wbGFjZWhvbGRlcuWxnuaAp1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5pbnB1dEVsLnBsYWNlaG9sZGVyID0gJzMwMDAnO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wb25lbnQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOS7u+WKoee7n+iuoeWKn+iDveW8gOWFs1xuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKGdldFRyYW5zbGF0aW9uKCdzZXR0aW5ncy50YXNrU3RhdGlzdGljcycpKVxuICAgICAgICAgICAgLnNldERlc2MoZ2V0VHJhbnNsYXRpb24oJ3NldHRpbmdzLnRhc2tTdGF0aXN0aWNzLmRlc2MnKSlcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIOiuvue9ruW8gOWFs+agt+W8j1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvZ2dsZUVsID0gdG9nZ2xlXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShzZXR0aW5ncy50YXNrU3RhdGlzdGljcylcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXR0aW5nc01hbmFnZXIudXBkYXRlU2V0dGluZ3MoeyB0YXNrU3RhdGlzdGljczogdmFsdWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDoh6rlrprkuYnlvIDlhbPmoLflvI8gLSDkvb/nlKhET03lhYPntKDorr/pl65cbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIC0g5re75Yqg6L+Z6KGM5p2l5b+955WlVHlwZVNjcmlwdOitpuWRilxuICAgICAgICAgICAgICAgIGNvbnN0IHRvZ2dsZUNvbnRyb2wgPSB0b2dnbGUudG9nZ2xlRWwgfHwgdG9nZ2xlLmNvbnRhaW5lckVsLnF1ZXJ5U2VsZWN0b3IoJy5jaGVja2JveC1jb250YWluZXInKTtcbiAgICAgICAgICAgICAgICBpZiAodG9nZ2xlQ29udHJvbCkge1xuICAgICAgICAgICAgICAgICAgICB0b2dnbGVDb250cm9sLmNsYXNzTGlzdC5hZGQoJ3Rhc2stc3RhdGlzdGljcy10b2dnbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOa3u+WKoOWbvuaghyAtIOS9v+eUqERPTeeItuWFg+e0oOiuv+mXrlxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b2dnbGVDb250YWluZXIgPSB0b2dnbGVDb250cm9sLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b2dnbGVDb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGljb25FbCA9IGNyZWF0ZVNwYW4oe2NsczogJ3N2Zy1pY29uIGx1Y2lkZS1iYXItY2hhcnQtMid9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb25FbC5zdHlsZS5tYXJnaW5SaWdodCA9ICc4cHgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbkVsLnN0eWxlLmNvbG9yID0gJ3ZhcigtLXRleHQtYWNjZW50KSc7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVDb250YWluZXIucHJlcGVuZChpY29uRWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmt7vliqDov4fmuKHmlYjmnpxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZUNvbnRhaW5lci5zdHlsZS50cmFuc2l0aW9uID0gJ2FsbCAwLjNzIGVhc2UnO1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlQ29udHJvbC5zdHlsZS50cmFuc2l0aW9uID0gJ2FsbCAwLjNzIGVhc2UnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiB0b2dnbGVFbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8g5qih5p2/6K6+572uXG4gICAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMycsIHsgdGV4dDogZ2V0VHJhbnNsYXRpb24oJ3NldHRpbmdzLnRlbXBsYXRlJykgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDmqKHmnb/kvb/nlKjpgLvovpHor7TmmI5cbiAgICAgICAgY29uc3QgdGVtcGxhdGVEZXNjcmlwdGlvbiA9IGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdwJywgeyBcbiAgICAgICAgICAgIHRleHQ6IHRoaXMuc2V0dGluZ3NNYW5hZ2VyLmdldEN1cnJlbnRMYW5ndWFnZSgpID09PSAnemgnID9cbiAgICAgICAgICAgICAgICAn5rOo5oSP77ya6buY6K6k5qih5p2/5Lya5qC55o2u5b2T5YmN6K+t6KiA546v5aKD6Ieq5Yqo6YCJ5oup5a+55bqU6K+t6KiA55qE5YaF5a6544CC5aaC5p6c5oKo6Ieq5a6a5LmJ5qih5p2/77yM5bCG5Zyo5omA5pyJ6K+t6KiA546v5aKD5Lit5L2/55So5oKo55qE6Ieq5a6a5LmJ5YaF5a6544CCJyA6XG4gICAgICAgICAgICAgICAgJ05vdGU6IERlZmF1bHQgdGVtcGxhdGUgYXV0b21hdGljYWxseSBhZGFwdHMgdG8geW91ciBsYW5ndWFnZSBlbnZpcm9ubWVudC4gSWYgeW91IGN1c3RvbWl6ZSB0aGUgdGVtcGxhdGUsIHlvdXIgY29udGVudCB3aWxsIGJlIHVzZWQgaW4gYWxsIGxhbmd1YWdlIGVudmlyb25tZW50cy4nXG4gICAgICAgIH0pO1xuICAgICAgICB0ZW1wbGF0ZURlc2NyaXB0aW9uLnN0eWxlLmZvbnRTaXplID0gJzAuODVlbSc7XG4gICAgICAgIHRlbXBsYXRlRGVzY3JpcHRpb24uc3R5bGUub3BhY2l0eSA9ICcwLjgnO1xuICAgICAgICB0ZW1wbGF0ZURlc2NyaXB0aW9uLnN0eWxlLm1hcmdpbkJvdHRvbSA9ICcxNXB4JztcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOaooeadv+WPmOmHj+ivtOaYjlxuICAgICAgICBjb25zdCB0ZW1wbGF0ZVZhcmlhYmxlc0VsID0gY29udGFpbmVyRWwuY3JlYXRlRWwoJ3AnKTtcbiAgICAgICAgdGVtcGxhdGVWYXJpYWJsZXNFbC5pbm5lckhUTUwgPSB0aGlzLnNldHRpbmdzTWFuYWdlci5nZXRDdXJyZW50TGFuZ3VhZ2UoKSA9PT0gJ3poJyA/XG4gICAgICAgICAgICAnPHN0cm9uZz7lj6/nlKjlj5jph4/vvJo8L3N0cm9uZz4ge3tkYXRlfX0gLSDml6XmnJ8sIHt7ZGF0ZVdpdGhJY29ufX0gLSDluKblm77moIfnmoTml6XmnJ8sIHt7d2Vla2RheX19IC0g5pif5pyf5YegLCB7e3llYXJQcm9ncmVzc319IC0g5bm06L+b5bqmLCB7e21vbnRoUHJvZ3Jlc3N9fSAtIOaciOi/m+W6piwge3t0aW1lfX0gLSDlvZPliY3ml7bpl7QnIDpcbiAgICAgICAgICAgICc8c3Ryb25nPkF2YWlsYWJsZSB2YXJpYWJsZXM6PC9zdHJvbmc+IHt7ZGF0ZX19IC0gRGF0ZSwge3tkYXRlV2l0aEljb259fSAtIERhdGUgd2l0aCBpY29uLCB7e3dlZWtkYXl9fSAtIERheSBvZiB3ZWVrLCB7e3llYXJQcm9ncmVzc319IC0gWWVhciBwcm9ncmVzcywge3ttb250aFByb2dyZXNzfX0gLSBNb250aCBwcm9ncmVzcywge3t0aW1lfX0gLSBDdXJyZW50IHRpbWUnO1xuICAgICAgICB0ZW1wbGF0ZVZhcmlhYmxlc0VsLnN0eWxlLmZvbnRTaXplID0gJzAuODVlbSc7XG4gICAgICAgIHRlbXBsYXRlVmFyaWFibGVzRWwuc3R5bGUubWFyZ2luQm90dG9tID0gJzEwcHgnO1xuICAgICAgICBcbiAgICAgICAgLy8g5Y2V5LiA5qih5p2/6K6+572uXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlU2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoZ2V0VHJhbnNsYXRpb24oJ3NldHRpbmdzLnRlbXBsYXRlJykpXG4gICAgICAgICAgICAuc2V0Q2xhc3MoJ3RlbXBsYXRlLXNldHRpbmcnKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRlbXBsYXRlQ29udGFpbmVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W5b2T5YmN5qih5p2/5YaF5a65XG4gICAgICAgIGNvbnN0IGN1cnJlbnRUZW1wbGF0ZSA9IHRoaXMuc2V0dGluZ3NNYW5hZ2VyLmhhc0N1c3RvbVRlbXBsYXRlKCkgPyBcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3NNYW5hZ2VyLmdldFNldHRpbmdzKCkuY3VzdG9tVGVtcGxhdGUgOiBcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3NNYW5hZ2VyLmdldFRlbXBsYXRlQnlMYW5ndWFnZSgpO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgdGV4dGFyZWEgPSBuZXcgVGV4dEFyZWFDb21wb25lbnQodGVtcGxhdGVDb250YWluZXIpXG4gICAgICAgICAgICAuc2V0VmFsdWUoY3VycmVudFRlbXBsYXRlKVxuICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKHRoaXMuc2V0dGluZ3NNYW5hZ2VyLmdldEN1cnJlbnRMYW5ndWFnZSgpID09PSAnemgnID8gXG4gICAgICAgICAgICAgICAgJ+WcqOatpOWkhOi+k+WFpeS7u+WKoeaooeadvy4uLicgOiBcbiAgICAgICAgICAgICAgICAnRW50ZXIgdGFzayB0ZW1wbGF0ZSBoZXJlLi4uJylcbiAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAvLyDmm7TmlrDkuLroh6rlrprkuYnmqKHmnb9cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNldHRpbmdzTWFuYWdlci51cGRhdGVTZXR0aW5ncyh7IFxuICAgICAgICAgICAgICAgICAgICBjdXN0b21UZW1wbGF0ZTogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGhhc0N1c3RvbVRlbXBsYXRlOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVQcmV2aWV3KHRoaXMucHJldmlld0VsLCB2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOaUuei/m1RleHRBcmVh5qC35byPXG4gICAgICAgIHRleHRhcmVhLmlucHV0RWwuY2xhc3NMaXN0LmFkZCgndGVtcGxhdGUtZWRpdG9yJyk7XG4gICAgICAgIHRleHRhcmVhLmlucHV0RWwuc3R5bGUuaGVpZ2h0ID0gJzIwMHB4JztcbiAgICAgICAgdGV4dGFyZWEuaW5wdXRFbC5zdHlsZS5ib3JkZXIgPSAnMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyLWhvdmVyKSc7XG4gICAgICAgIHRleHRhcmVhLmlucHV0RWwuc3R5bGUuYm9yZGVyUmFkaXVzID0gJzRweCc7XG4gICAgICAgIHRleHRhcmVhLmlucHV0RWwuc3R5bGUucGFkZGluZyA9ICcxMnB4JztcbiAgICAgICAgdGV4dGFyZWEuaW5wdXRFbC5zdHlsZS5saW5lSGVpZ2h0ID0gJzEuNSc7XG4gICAgICAgIHRleHRhcmVhLmlucHV0RWwuc3R5bGUuZm9udFNpemUgPSAnMTRweCc7XG4gICAgICAgIHRleHRhcmVhLmlucHV0RWwuc3R5bGUuZm9udEZhbWlseSA9ICd2YXIoLS1mb250LW1vbm9zcGFjZSknO1xuICAgICAgICB0ZXh0YXJlYS5pbnB1dEVsLnN0eWxlLnRyYW5zaXRpb24gPSAnYWxsIDAuMnMgZWFzZSc7XG4gICAgICAgIHRleHRhcmVhLmlucHV0RWwuc3R5bGUuYm94U2hhZG93ID0gJ2luc2V0IDAgMXB4IDNweCByZ2JhKDAsIDAsIDAsIDAuMSknO1xuICAgICAgICB0ZXh0YXJlYS5pbnB1dEVsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICd2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpJztcbiAgICAgICAgdGV4dGFyZWEuaW5wdXRFbC5zdHlsZS5jb2xvciA9ICd2YXIoLS10ZXh0LW5vcm1hbCknO1xuICAgICAgICB0ZXh0YXJlYS5pbnB1dEVsLnN0eWxlLnJlc2l6ZSA9ICd2ZXJ0aWNhbCc7XG4gICAgICAgIFxuICAgICAgICAvLyDlvZPojrflj5bnhKbngrnml7bmlLnlj5jovrnmoYbmoLflvI9cbiAgICAgICAgdGV4dGFyZWEuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsICgpID0+IHtcbiAgICAgICAgICAgIHRleHRhcmVhLmlucHV0RWwuc3R5bGUuYm9yZGVyID0gJzFweCBzb2xpZCB2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpJztcbiAgICAgICAgICAgIHRleHRhcmVhLmlucHV0RWwuc3R5bGUuYm94U2hhZG93ID0gJzAgMCAwIDJweCByZ2JhKHZhcigtLWludGVyYWN0aXZlLWFjY2VudC1yZ2IpLCAwLjIpLCBpbnNldCAwIDFweCAzcHggcmdiYSgwLCAwLCAwLCAwLjEpJztcbiAgICAgICAgICAgIHRleHRhcmVhLmlucHV0RWwuc3R5bGUub3V0bGluZSA9ICdub25lJztcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyDlpLHljrvnhKbngrnml7bmgaLlpI3ljp/mnaXnmoTovrnmoYbmoLflvI9cbiAgICAgICAgdGV4dGFyZWEuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgKCkgPT4ge1xuICAgICAgICAgICAgdGV4dGFyZWEuaW5wdXRFbC5zdHlsZS5ib3JkZXIgPSAnMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyLWhvdmVyKSc7XG4gICAgICAgICAgICB0ZXh0YXJlYS5pbnB1dEVsLnN0eWxlLmJveFNoYWRvdyA9ICdpbnNldCAwIDFweCAzcHggcmdiYSgwLCAwLCAwLCAwLjEpJztcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyDpooTop4jmoIfpopjvvIzkvb/nlKhmbGV45biD5bGA5bGF5LitXG4gICAgICAgIGNvbnN0IHByZXZpZXdIZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgcHJldmlld0hlYWRlci5jbGFzc0xpc3QuYWRkKCd0ZW1wbGF0ZS1wcmV2aWV3LWhlYWRlcicpO1xuICAgICAgICBwcmV2aWV3SGVhZGVyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgIHByZXZpZXdIZWFkZXIuc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnY2VudGVyJztcbiAgICAgICAgcHJldmlld0hlYWRlci5zdHlsZS5tYXJnaW5Ub3AgPSAnMTVweCc7XG4gICAgICAgIHByZXZpZXdIZWFkZXIuc3R5bGUuZ2FwID0gJzEwcHgnO1xuICAgICAgICBcbiAgICAgICAgLy8g6aKE6KeI5oyJ6ZKuXG4gICAgICAgIGNvbnN0IHRvZ2dsZUJ1dHRvbiA9IG5ldyBCdXR0b25Db21wb25lbnQocHJldmlld0hlYWRlcilcbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KGdldFRyYW5zbGF0aW9uKCdzZXR0aW5ncy50ZW1wbGF0ZS5wcmV2aWV3JykpO1xuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5qC35byP57G7XG4gICAgICAgIHRvZ2dsZUJ1dHRvbi5idXR0b25FbC5hZGRDbGFzcyhUZXh0Q2VudGVyQ1NTKTtcbiAgICAgICAgdG9nZ2xlQnV0dG9uLmJ1dHRvbkVsLnN0eWxlLnRleHRBbGlnbiA9ICdjZW50ZXInO1xuICAgICAgICB0b2dnbGVCdXR0b24uYnV0dG9uRWwuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgdG9nZ2xlQnV0dG9uLmJ1dHRvbkVsLnN0eWxlLmFsaWduSXRlbXMgPSAnY2VudGVyJztcbiAgICAgICAgdG9nZ2xlQnV0dG9uLmJ1dHRvbkVsLnN0eWxlLmp1c3RpZnlDb250ZW50ID0gJ2NlbnRlcic7XG4gICAgICAgIHRvZ2dsZUJ1dHRvbi5idXR0b25FbC5zdHlsZS53aWR0aCA9ICcxMjBweCc7XG4gICAgICAgIFxuICAgICAgICAvLyDmiYvliqjmt7vliqDnnLznnZvlm77moIdcbiAgICAgICAgY29uc3QgZXllSWNvbiA9IGNyZWF0ZVNwYW4oe2NsczogJ3N2Zy1pY29uIGx1Y2lkZS1leWUnfSk7XG4gICAgICAgIHRvZ2dsZUJ1dHRvbi5idXR0b25FbC5wcmVwZW5kKGV5ZUljb24pO1xuICAgICAgICBcbiAgICAgICAgLy8g6aKE6KeI5Yy65Z+fXG4gICAgICAgIHRoaXMucHJldmlld0VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMucHJldmlld0VsLmNsYXNzTGlzdC5hZGQoJ3RlbXBsYXRlLXByZXZpZXcnKTtcbiAgICAgICAgdGhpcy5wcmV2aWV3RWwuc3R5bGUubWFyZ2luVG9wID0gJzE1cHgnO1xuICAgICAgICB0aGlzLnByZXZpZXdFbC5zdHlsZS5wYWRkaW5nID0gJzE1cHgnO1xuICAgICAgICB0aGlzLnByZXZpZXdFbC5zdHlsZS5ib3JkZXIgPSAnMXB4IGRhc2hlZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlciknO1xuICAgICAgICB0aGlzLnByZXZpZXdFbC5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnNHB4JztcbiAgICAgICAgdGhpcy5wcmV2aWV3RWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3ZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KSc7XG4gICAgICAgIHRoaXMucHJldmlld0VsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMudXBkYXRlUHJldmlldyh0aGlzLnByZXZpZXdFbCwgY3VycmVudFRlbXBsYXRlKTtcbiAgICAgICAgdGVtcGxhdGVDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5wcmV2aWV3RWwpO1xuICAgICAgICBcbiAgICAgICAgdG9nZ2xlQnV0dG9uLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b2dnbGVQcmV2aWV3KHRoaXMucHJldmlld0VsKTtcbiAgICAgICAgICAgIC8vIOWIh+aNouWbvuagh+WSjOaMiemSruaWh+acrFxuICAgICAgICAgICAgaWYgKHRoaXMucHJldmlld0VsICYmIHRoaXMucHJldmlld0VsLmNsYXNzTGlzdC5jb250YWlucygndmlzaWJsZScpKSB7XG4gICAgICAgICAgICAgICAgZXllSWNvbi5jbGFzc05hbWUgPSAnc3ZnLWljb24gbHVjaWRlLWV5ZS1vZmYnO1xuICAgICAgICAgICAgICAgIHRvZ2dsZUJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFRyYW5zbGF0aW9uKCdzZXR0aW5ncy50ZW1wbGF0ZS5oaWRlJykpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBleWVJY29uLmNsYXNzTmFtZSA9ICdzdmctaWNvbiBsdWNpZGUtZXllJztcbiAgICAgICAgICAgICAgICB0b2dnbGVCdXR0b24uc2V0QnV0dG9uVGV4dChnZXRUcmFuc2xhdGlvbignc2V0dGluZ3MudGVtcGxhdGUucHJldmlldycpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyDph43nva7mjInpkq5cbiAgICAgICAgY29uc3QgcmVzZXRCdG4gPSBuZXcgQnV0dG9uQ29tcG9uZW50KHByZXZpZXdIZWFkZXIpXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChnZXRUcmFuc2xhdGlvbignc2V0dGluZ3MucmVzZXREZWZhdWx0JykpO1xuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5qC35byP57G7XG4gICAgICAgIHJlc2V0QnRuLmJ1dHRvbkVsLmFkZENsYXNzKFRleHRDZW50ZXJDU1MpO1xuICAgICAgICByZXNldEJ0bi5idXR0b25FbC5zdHlsZS50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgICAgICAgcmVzZXRCdG4uYnV0dG9uRWwuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgcmVzZXRCdG4uYnV0dG9uRWwuc3R5bGUuYWxpZ25JdGVtcyA9ICdjZW50ZXInO1xuICAgICAgICByZXNldEJ0bi5idXR0b25FbC5zdHlsZS5qdXN0aWZ5Q29udGVudCA9ICdjZW50ZXInO1xuICAgICAgICByZXNldEJ0bi5idXR0b25FbC5zdHlsZS53aWR0aCA9ICcxMjBweCc7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDph43nva7lm77moIdcbiAgICAgICAgcmVzZXRCdG4uYnV0dG9uRWwucHJlcGVuZChjcmVhdGVTcGFuKHtjbHM6ICdzdmctaWNvbiBsdWNpZGUtcmVmcmVzaC1jdyd9KSk7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDph43nva7kuovku7ZcbiAgICAgICAgcmVzZXRCdG4ub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAvLyDlsIboh6rlrprkuYnmqKHmnb/orr7nva7kuLrnqbrvvIzlm57liLDkvb/nlKjpu5jorqTmqKHmnb9cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0dGluZ3NNYW5hZ2VyLnVwZGF0ZVNldHRpbmdzKHsgXG4gICAgICAgICAgICAgICAgY3VzdG9tVGVtcGxhdGU6ICcnLFxuICAgICAgICAgICAgICAgIGhhc0N1c3RvbVRlbXBsYXRlOiBmYWxzZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiOt+WPluW9k+WJjeivreiogOeahOm7mOiupOaooeadv1xuICAgICAgICAgICAgY29uc3QgZGVmYXVsdFRlbXBsYXRlID0gdGhpcy5zZXR0aW5nc01hbmFnZXIuZ2V0VGVtcGxhdGVCeUxhbmd1YWdlKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOabtOaWsOi+k+WFpeahhuWSjOmihOiniFxuICAgICAgICAgICAgdGV4dGFyZWEuc2V0VmFsdWUoZGVmYXVsdFRlbXBsYXRlKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlUHJldmlldyh0aGlzLnByZXZpZXdFbCwgZGVmYXVsdFRlbXBsYXRlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyDlsIbmjInpkq7mt7vliqDliLDmoIfpopjmoI9cbiAgICAgICAgcHJldmlld0hlYWRlci5hcHBlbmRDaGlsZCh0b2dnbGVCdXR0b24uYnV0dG9uRWwpO1xuICAgICAgICBwcmV2aWV3SGVhZGVyLmFwcGVuZENoaWxkKHJlc2V0QnRuLmJ1dHRvbkVsKTtcbiAgICAgICAgdGVtcGxhdGVDb250YWluZXIuYXBwZW5kQ2hpbGQocHJldmlld0hlYWRlcik7XG4gICAgICAgIFxuICAgICAgICB0ZW1wbGF0ZVNldHRpbmcuY29udHJvbEVsLmFwcGVuZENoaWxkKHRlbXBsYXRlQ29udGFpbmVyKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOaBouWkjem7mOiupOiuvue9riAtIOWIm+W7uuWuueWZqOiuqeaMiemSruWPs+Wvuem9kFxuICAgICAgICBjb25zdCByZXNldENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICByZXNldENvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgICByZXNldENvbnRhaW5lci5zdHlsZS5qdXN0aWZ5Q29udGVudCA9ICdmbGV4LWVuZCc7IC8vIOehruS/neWPs+Wvuem9kFxuICAgICAgICByZXNldENvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSAnMjBweCc7XG4gICAgICAgIHJlc2V0Q29udGFpbmVyLnN0eWxlLm1hcmdpbkJvdHRvbSA9ICcxMHB4JztcbiAgICAgICAgY29udGFpbmVyRWwuYXBwZW5kQ2hpbGQocmVzZXRDb250YWluZXIpO1xuICAgICAgICBcbiAgICAgICAgLy8g5oGi5aSN6buY6K6k6K6+572u5oyJ6ZKuXG4gICAgICAgIGNvbnN0IHJlc2V0RGVmYXVsdEJ0biA9IG5ldyBCdXR0b25Db21wb25lbnQocmVzZXRDb250YWluZXIpXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChnZXRUcmFuc2xhdGlvbignc2V0dGluZ3MucmVzZXRUb0RlZmF1bHQnKSk7XG5cbiAgICAgICAgLy8g5re75Yqg5qC35byP57G7XG4gICAgICAgIHJlc2V0RGVmYXVsdEJ0bi5idXR0b25FbC5hZGRDbGFzcyhUZXh0Q2VudGVyQ1NTKTtcbiAgICAgICAgcmVzZXREZWZhdWx0QnRuLmJ1dHRvbkVsLmFkZENsYXNzKCdkYW5nZXItYnV0dG9uJyk7XG4gICAgICAgIHJlc2V0RGVmYXVsdEJ0bi5idXR0b25FbC5zdHlsZS50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgICAgICAgcmVzZXREZWZhdWx0QnRuLmJ1dHRvbkVsLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgIHJlc2V0RGVmYXVsdEJ0bi5idXR0b25FbC5zdHlsZS5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XG4gICAgICAgIHJlc2V0RGVmYXVsdEJ0bi5idXR0b25FbC5zdHlsZS5qdXN0aWZ5Q29udGVudCA9ICdjZW50ZXInO1xuICAgICAgICByZXNldERlZmF1bHRCdG4uYnV0dG9uRWwuc3R5bGUud2lkdGggPSAnMTIwcHgnO1xuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg6YeN572u5Zu+5qCH5ZKM5Y2x6Zmp5oyJ6ZKu5qC35byPXG4gICAgICAgIHJlc2V0RGVmYXVsdEJ0bi5idXR0b25FbC5wcmVwZW5kKGNyZWF0ZVNwYW4oe2NsczogJ3N2Zy1pY29uIGx1Y2lkZS1yZWZyZXNoLWN3J30pKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOS4uuWFqOWxgOmHjee9ruaMiemSrua3u+WKoOS6i+S7tuWkhOeQhlxuICAgICAgICByZXNldERlZmF1bHRCdG4ub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNldHRpbmdzTWFuYWdlci5yZXNldFRvRGVmYXVsdHMoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOaJi+WKqOa3u+WKoOS7iuaXpeS7u+WKoeaMiemSriAtIOWPs+Wvuem9kOaYvuekulxuICAgICAgICBjb25zdCBhZGRUYXNrQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGFkZFRhc2tDb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgYWRkVGFza0NvbnRhaW5lci5zdHlsZS5qdXN0aWZ5Q29udGVudCA9ICdmbGV4LWVuZCc7IC8vIOehruS/neWPs+Wvuem9kFxuICAgICAgICBhZGRUYXNrQ29udGFpbmVyLnN0eWxlLm1hcmdpblRvcCA9ICcyMHB4JztcbiAgICAgICAgY29udGFpbmVyRWwuYXBwZW5kQ2hpbGQoYWRkVGFza0NvbnRhaW5lcik7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFkZFRhc2tCdXR0b24gPSBuZXcgQnV0dG9uQ29tcG9uZW50KGFkZFRhc2tDb250YWluZXIpXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChnZXRUcmFuc2xhdGlvbignc2V0dGluZ3MuYWRkVGFza0J1dHRvbicpKVxuICAgICAgICAgICAgLnNldEN0YSgpO1xuXG4gICAgICAgIC8vIOa3u+WKoOagt+W8j+exuyAtIOehruS/neaMiemSruaWh+Wtl+WxheS4rVxuICAgICAgICBpZiAodGhpcy5hZGRUYXNrQnV0dG9uICYmIHRoaXMuYWRkVGFza0J1dHRvbi5idXR0b25FbCkge1xuICAgICAgICAgICAgdGhpcy5hZGRUYXNrQnV0dG9uLmJ1dHRvbkVsLmFkZENsYXNzKFRleHRDZW50ZXJDU1MpO1xuICAgICAgICAgICAgdGhpcy5hZGRUYXNrQnV0dG9uLmJ1dHRvbkVsLnN0eWxlLnRleHRBbGlnbiA9ICdjZW50ZXInO1xuICAgICAgICAgICAgdGhpcy5hZGRUYXNrQnV0dG9uLmJ1dHRvbkVsLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgICAgICB0aGlzLmFkZFRhc2tCdXR0b24uYnV0dG9uRWwuc3R5bGUuYWxpZ25JdGVtcyA9ICdjZW50ZXInO1xuICAgICAgICAgICAgdGhpcy5hZGRUYXNrQnV0dG9uLmJ1dHRvbkVsLnN0eWxlLmp1c3RpZnlDb250ZW50ID0gJ2NlbnRlcic7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmiYvliqjmt7vliqDku7vliqHmjInpkq7kuovku7blpITnkIZcbiAgICAgICAgdGhpcy5hZGRUYXNrQnV0dG9uLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgLy8g5qOA5p+l55uu5b2V6K6+572uXG4gICAgICAgICAgICBjb25zdCByb290RGlyID0gdGhpcy5zZXR0aW5nc01hbmFnZXIuZ2V0U2V0dGluZ3MoKS5yb290RGlyO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmt7vliqBsb2FkaW5n54q25oCBXG4gICAgICAgICAgICBpZiAodGhpcy5hZGRUYXNrQnV0dG9uICYmIHRoaXMuYWRkVGFza0J1dHRvbi5idXR0b25FbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkVGFza0J1dHRvbi5idXR0b25FbC5jbGFzc0xpc3QuYWRkKCdsb2FkaW5nJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmFkZFRhc2tCdXR0b24/LnNldERpc2FibGVkKHRydWUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIOa3u+WKoOS7u+WKoVxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudGFza0dlbmVyYXRvci5hZGRUYXNrTWFudWFsbHkoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5re75Yqg5Lu75Yqh5Ye66ZSZOlwiLCBlKTtcbiAgICAgICAgICAgICAgICBuZXcgTm90aWNlKGDmt7vliqDku7vliqHlpLHotKU6ICR7ZS5tZXNzYWdlIHx8IGV9YCk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIC8vIOenu+mZpGxvYWRpbmfnirbmgIFcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuYWRkVGFza0J1dHRvbiAmJiB0aGlzLmFkZFRhc2tCdXR0b24uYnV0dG9uRWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkVGFza0J1dHRvbi5idXR0b25FbC5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRUYXNrQnV0dG9uPy5zZXREaXNhYmxlZChmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5re75Yqg5Zu+5qCHXG4gICAgICAgIHRoaXMuYWRkVGFza0J1dHRvbi5idXR0b25FbC5wcmVwZW5kKGNyZWF0ZVNwYW4oe2NsczogJ3N2Zy1pY29uIGx1Y2lkZS1jYWxlbmRhci1wbHVzJ30pKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICog5pu05paw5qih5p2/6aKE6KeIXG4gICAgICovXG4gICAgcHJpdmF0ZSB1cGRhdGVQcmV2aWV3KHByZXZpZXdFbDogSFRNTEVsZW1lbnQgfCBudWxsLCB0ZW1wbGF0ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGlmICghcHJldmlld0VsKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBjb25zdCByZW5kZXJlZENvbnRlbnQgPSByZW5kZXJUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgICAgIC8vIOS9v+eUqE1hcmtkb3duUmVuZGVyZXLpnIDopoHlr7zlhaXnm7jlhbPnu4Tku7ZcbiAgICAgICAgcHJldmlld0VsLmlubmVySFRNTCA9IHJlbmRlcmVkQ29udGVudC5yZXBsYWNlKC9cXG4vZywgJzxicj4nKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICog5YiH5o2i6aKE6KeI55qE5pi+56S6L+makOiXj1xuICAgICAqL1xuICAgIHByaXZhdGUgdG9nZ2xlUHJldmlldyhwcmV2aWV3RWw6IEhUTUxFbGVtZW50IHwgbnVsbCk6IHZvaWQge1xuICAgICAgICBpZiAoIXByZXZpZXdFbCkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgaWYgKHByZXZpZXdFbC5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZScpIHtcbiAgICAgICAgICAgIHByZXZpZXdFbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIHByZXZpZXdFbC5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcmV2aWV3RWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHByZXZpZXdFbC5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICog6K6+572u566h55CG5ZmoXG4gKiDotJ/otKPliqDovb3jgIHkv53lrZjlkozmj5Dkvpvorr7nva7orr/pl67mjqXlj6NcbiAqL1xuZXhwb3J0IGNsYXNzIFNldHRpbmdzTWFuYWdlciB7XG4gICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbjtcbiAgICBwcml2YXRlIHNldHRpbmdzOiBEYWlseVRhc2tTZXR0aW5ncztcblxuICAgIGNvbnN0cnVjdG9yKHBsdWdpbjogUGx1Z2luKSB7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W5b2T5YmN6K6+572uXG4gICAgICovXG4gICAgZ2V0U2V0dGluZ3MoKTogRGFpbHlUYXNrU2V0dGluZ3Mge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmm7TmlrDorr7nva7lubbkv53lrZhcbiAgICAgKiBAcGFyYW0gc2V0dGluZ3Mg6KaB5pu05paw55qE6K6+572uXG4gICAgICovXG4gICAgYXN5bmMgdXBkYXRlU2V0dGluZ3Moc2V0dGluZ3M6IFBhcnRpYWw8RGFpbHlUYXNrU2V0dGluZ3M+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSB7XG4gICAgICAgICAgICAuLi50aGlzLnNldHRpbmdzLFxuICAgICAgICAgICAgLi4uc2V0dGluZ3NcbiAgICAgICAgfTtcbiAgICAgICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOW9k+WJjeivreiogFxuICAgICAgICB0aGlzLnVwZGF0ZUN1cnJlbnRMYW5ndWFnZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS/neWtmOiuvue9ruWIsOaVsOaNruWtmOWCqFxuICAgICAqL1xuICAgIGFzeW5jIHNhdmVTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yqg6L296K6+572uXG4gICAgICovXG4gICAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBsb2FkZWREYXRhID0gYXdhaXQgdGhpcy5wbHVnaW4ubG9hZERhdGEoKTtcbiAgICAgICAgaWYgKGxvYWRlZERhdGEpIHtcbiAgICAgICAgICAgIC8vIOWQiOW5tum7mOiupOiuvue9ruWSjOW3suS/neWtmOeahOiuvue9rlxuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHtcbiAgICAgICAgICAgICAgICAuLi5ERUZBVUxUX1NFVFRJTkdTLFxuICAgICAgICAgICAgICAgIC4uLmxvYWRlZERhdGFcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOehruS/neWcqOWNh+e6p+aPkuS7tuWQju+8jOaWsOWinueahOiuvue9rumhueS5n+aciem7mOiupOWAvFxuICAgICAgICAgICAgdGhpcy5lbnN1cmVTZXR0aW5nc0NvbXBsZXRlbmVzcygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5aaC5p6c5rKh5pyJ5Yqg6L295Yiw5pWw5o2u77yM5L2/55So6buY6K6k6K6+572u5L2G5bCG6Ieq5Yqo55Sf5oiQ5qih5byP5pS55Li65bel5L2c5pelXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgICAgICAgICAgIC4uLkRFRkFVTFRfU0VUVElOR1MsXG4gICAgICAgICAgICAgICAgYXV0b0dlbmVyYXRlTW9kZTogQXV0b0dlbmVyYXRlTW9kZS5XT1JLREFZXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDlvZPliY3or63oqIBcbiAgICAgICAgdGhpcy51cGRhdGVDdXJyZW50TGFuZ3VhZ2UoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnoa7kv53orr7nva7lrozmlbTmgKfvvIzkuLrmlrDlop7nmoTorr7nva7pobnmj5Dkvpvpu5jorqTlgLxcbiAgICAgKi9cbiAgICBwcml2YXRlIGVuc3VyZVNldHRpbmdzQ29tcGxldGVuZXNzKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBkZWZhdWx0S2V5cyA9IE9iamVjdC5rZXlzKERFRkFVTFRfU0VUVElOR1MpO1xuICAgICAgICBkZWZhdWx0S2V5cy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICAvLyDlpoLmnpzlvZPliY3orr7nva7kuK3nvLrlsJHmn5DkuKrpu5jorqTorr7nva7pobnvvIzmt7vliqDpu5jorqTlgLxcbiAgICAgICAgICAgIGlmICghKGtleSBpbiB0aGlzLnNldHRpbmdzKSkge1xuICAgICAgICAgICAgICAgICh0aGlzLnNldHRpbmdzIGFzIGFueSlba2V5XSA9IChERUZBVUxUX1NFVFRJTkdTIGFzIGFueSlba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5oGi5aSN6buY6K6k6K6+572uXG4gICAgICovXG4gICAgYXN5bmMgcmVzZXRUb0RlZmF1bHRzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUyk7XG4gICAgICAgIGF3YWl0IHRoaXMuc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDlvZPliY3or63oqIBcbiAgICAgICAgdGhpcy51cGRhdGVDdXJyZW50TGFuZ3VhZ2UoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmoLnmja7or63oqIDojrflj5blvZPliY3kvb/nlKjnmoTmqKHmnb9cbiAgICAgKiDlpoLmnpzlvZPliY3mqKHmnb/kuI3mmK/pu5jorqTmqKHmnb/vvIzliJnkuI3lho3ljLrliIbor63oqIBcbiAgICAgKi9cbiAgICBnZXRDdXJyZW50VGVtcGxhdGUoKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgbGFuZ3VhZ2UgPSB0aGlzLmdldEN1cnJlbnRMYW5ndWFnZSgpO1xuICAgICAgICBcbiAgICAgICAgLy8g5Lit5paH546v5aKDXG4gICAgICAgIGlmIChsYW5ndWFnZSA9PT0gJ3poJykge1xuICAgICAgICAgICAgLy8g5aaC5p6c5Lit5paH5qih5p2/5bey6KKr5L+u5pS577yI5LiN562J5LqO6buY6K6k5qih5p2/77yJ77yM5L2/55So5Lit5paH5qih5p2/XG4gICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy50ZW1wbGF0ZVpoICE9PSBERUZBVUxUX1RFTVBMQVRFX1pIKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3MudGVtcGxhdGVaaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOWmguaenOiLseaWh+aooeadv+W3suiiq+S/ruaUue+8jOS9v+eUqOiLseaWh+aooeadv1xuICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudGVtcGxhdGVFbiAhPT0gREVGQVVMVF9URU1QTEFURV9FTikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLnRlbXBsYXRlRW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlpoLmnpzpg73mmK/pu5jorqTmqKHmnb/vvIzkvb/nlKjkuK3mlofpu5jorqTmqKHmnb9cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLnRlbXBsYXRlWmg7XG4gICAgICAgIH0gXG4gICAgICAgIC8vIOiLseaWh+eOr+Wig1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIOWmguaenOiLseaWh+aooeadv+W3suiiq+S/ruaUue+8iOS4jeetieS6jum7mOiupOaooeadv++8ie+8jOS9v+eUqOiLseaWh+aooeadv1xuICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudGVtcGxhdGVFbiAhPT0gREVGQVVMVF9URU1QTEFURV9FTikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLnRlbXBsYXRlRW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlpoLmnpzkuK3mlofmqKHmnb/lt7Looqvkv67mlLnvvIzkvb/nlKjkuK3mlofmqKHmnb9cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRlbXBsYXRlWmggIT09IERFRkFVTFRfVEVNUExBVEVfWkgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy50ZW1wbGF0ZVpoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5aaC5p6c6YO95piv6buY6K6k5qih5p2/77yM5L2/55So6Iux5paH6buY6K6k5qih5p2/XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy50ZW1wbGF0ZUVuO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIOiOt+WPluW9k+WJjeivreiogOiuvue9rlxuICAgICAqL1xuICAgIGdldEN1cnJlbnRMYW5ndWFnZSgpOiBzdHJpbmcge1xuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5sYW5ndWFnZSA9PT0gTGFuZ3VhZ2UuQVVUTykge1xuICAgICAgICAgICAgLy8g6Ieq5Yqo5qOA5rWL57O757uf6K+t6KiAXG4gICAgICAgICAgICBjb25zdCBzeXN0ZW1MYW5ndWFnZSA9IHdpbmRvdy5uYXZpZ2F0b3IubGFuZ3VhZ2UudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHJldHVybiBzeXN0ZW1MYW5ndWFnZS5zdGFydHNXaXRoKCd6aCcpID8gJ3poJyA6ICdlbic7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3MubGFuZ3VhZ2U7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIOabtOaWsOW9k+WJjeivreiogFxuICAgICAqL1xuICAgIHByaXZhdGUgdXBkYXRlQ3VycmVudExhbmd1YWdlKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBsYW5ndWFnZSA9IHRoaXMuZ2V0Q3VycmVudExhbmd1YWdlKCk7XG4gICAgICAgIHNldEN1cnJlbnRMYW5ndWFnZShsYW5ndWFnZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W5b2T5YmN6K+t6KiA55qE5qih5p2/XG4gICAgICovXG4gICAgZ2V0VGVtcGxhdGVCeUxhbmd1YWdlKCk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGxhbmd1YWdlID0gdGhpcy5nZXRDdXJyZW50TGFuZ3VhZ2UoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOS4reaWh+eOr+Wig1xuICAgICAgICBpZiAobGFuZ3VhZ2UgPT09ICd6aCcpIHtcbiAgICAgICAgICAgIC8vIOWmguaenOS4reaWh+aooeadv+W3suiiq+S/ruaUue+8iOS4jeetieS6jum7mOiupOaooeadv++8ie+8jOS9v+eUqOS4reaWh+aooeadv1xuICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudGVtcGxhdGVaaCAhPT0gREVGQVVMVF9URU1QTEFURV9aSCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLnRlbXBsYXRlWmg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlpoLmnpzoi7HmlofmqKHmnb/lt7Looqvkv67mlLnvvIzkvb/nlKjoi7HmlofmqKHmnb9cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRlbXBsYXRlRW4gIT09IERFRkFVTFRfVEVNUExBVEVfRU4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy50ZW1wbGF0ZUVuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5aaC5p6c6YO95piv6buY6K6k5qih5p2/77yM5L2/55So5Lit5paH6buY6K6k5qih5p2/XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy50ZW1wbGF0ZVpoO1xuICAgICAgICB9IFxuICAgICAgICAvLyDoi7Hmlofnjq/looNcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyDlpoLmnpzoi7HmlofmqKHmnb/lt7Looqvkv67mlLnvvIjkuI3nrYnkuo7pu5jorqTmqKHmnb/vvInvvIzkvb/nlKjoi7HmlofmqKHmnb9cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRlbXBsYXRlRW4gIT09IERFRkFVTFRfVEVNUExBVEVfRU4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy50ZW1wbGF0ZUVuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5aaC5p6c5Lit5paH5qih5p2/5bey6KKr5L+u5pS577yM5L2/55So5Lit5paH5qih5p2/XG4gICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy50ZW1wbGF0ZVpoICE9PSBERUZBVUxUX1RFTVBMQVRFX1pIKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3MudGVtcGxhdGVaaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOWmguaenOmDveaYr+m7mOiupOaooeadv++8jOS9v+eUqOiLseaWh+m7mOiupOaooeadv1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3MudGVtcGxhdGVFbjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOajgOafpeaYr+WQpuWtmOWcqOiHquWumuS5ieaooeadv1xuICAgICAqL1xuICAgIGhhc0N1c3RvbVRlbXBsYXRlKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gISF0aGlzLnNldHRpbmdzLmN1c3RvbVRlbXBsYXRlO1xuICAgIH1cbn0gIl19