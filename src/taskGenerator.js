import { Notice, TFile } from "obsidian";
import { getTranslation } from "./i18n/i18n";
import { appendToFile, ensureFileExists, ensureFolderExists, getTaskFilePath, todayTaskExists, fileContains, getYesterdayDate, getYesterdayTaskFilePath, extractTasksForDate, analyzeTaskCompletion, yesterdayStatisticsExists, generateStatisticsContent } from "./utils/fileUtils";
import { renderTemplate } from "./utils/templateEngine";
import { getCurrentDate } from "./utils/dateUtils";
/**
 * 任务生成器
 * 负责创建任务文件和添加任务内容
 */
export class TaskGenerator {
    constructor(app, settingsManager) {
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
    async generateDailyTask(openFile = true, quietMode = false) {
        try {
            const settings = this.settingsManager.getSettings();
            const rootDir = settings.rootDir.trim() || 'DailyTasks'; // 使用默认目录
            // 获取任务文件路径
            const filePath = getTaskFilePath(rootDir);
            if (!quietMode)
                console.log(`生成任务文件路径: ${filePath}`);
            // 解析年份和月份
            const pathParts = filePath.split('/');
            const year = pathParts.length > 1 ? pathParts[1] : '';
            const monthName = pathParts.length > 2 ? pathParts[2].replace('.md', '') : '';
            const yearFolder = `${rootDir}/${year}`;
            // 确保根目录存在
            if (!quietMode)
                console.log(`正在确保根目录存在: ${rootDir}`);
            const rootCreated = await ensureFolderExists(this.vault, rootDir);
            if (!rootCreated) {
                console.error(`无法访问或创建根目录: ${rootDir}`);
                throw new Error(`无法访问根目录: ${rootDir}，可能是存在同名文件或权限问题`);
            }
            if (!quietMode)
                console.log(`根目录确认: ${rootDir}`);
            // 确保年份目录存在
            if (!quietMode)
                console.log(`正在确保年份目录存在: ${yearFolder}`);
            const yearCreated = await ensureFolderExists(this.vault, yearFolder);
            if (!yearCreated) {
                console.error(`无法访问或创建年份目录: ${yearFolder}`);
                throw new Error(`无法访问年份目录: ${yearFolder}，可能是存在同名文件或权限问题`);
            }
            if (!quietMode)
                console.log(`年份目录确认: ${yearFolder}`);
            // 确保月份文件存在
            if (!quietMode)
                console.log(`正在确保月份文件存在: ${filePath} (${monthName})`);
            const fileCreated = await ensureFileExists(this.vault, filePath);
            if (!fileCreated) {
                console.error(`无法访问或创建月份文件: ${filePath}`);
                throw new Error(`无法访问月份文件: ${filePath}，请检查是否存在同名目录或权限问题`);
            }
            if (!quietMode)
                console.log(`月份文件确认: ${filePath}`);
            // 检查今日任务是否已存在
            const date = getCurrentDate();
            // 更改检查方式：不仅检查纯日期，也检查带图标的日期格式
            const dateRegex = new RegExp(`## [^\\n]*${date}[^\\n]*\\n`);
            const fileContent = await this.vault.read(this.vault.getAbstractFileByPath(filePath));
            const existingTaskCheck = dateRegex.test(fileContent);
            
            if (existingTaskCheck) {
                console.log(`今日(${date})任务已存在于文件中，跳过创建`);
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
            }
            else {
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
            if (!quietMode)
                console.log(`正在向文件追加内容`);
            const success = await appendToFile(this.vault, filePath, fullContent);
            if (success) {
                console.log(`✅ 任务内容追加成功 ${date}`);
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
                    }
                    else {
                        throw new Error(`文件创建成功但无法打开: ${filePath}`);
                    }
                }
                else {
                    // 静默模式，只在控制台记录
                    console.log(`✨ 今日(${date})任务已静默添加，无需打开文件`);
                }
            }
            else {
                throw new Error(`无法向文件追加内容: ${filePath}`);
            }
            return success;
        }
        catch (error) {
            console.error("Error generating daily task:", error);
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
    async generateYesterdayStatistics(rootDir, todayDate, quietMode = false) {
        try {
            // 获取昨天的日期和文件路径
            const yesterdayDate = getYesterdayDate();
            const yesterdayFilePath = getYesterdayTaskFilePath(rootDir);
            
            if (!quietMode) console.log(`正在获取昨日(${yesterdayDate})任务统计，文件路径: ${yesterdayFilePath}`);
            
            // 检查今日的内容中是否已经包含昨日统计
            const todayFilePath = getTaskFilePath(rootDir);
            const statsExists = await yesterdayStatisticsExists(this.vault, todayFilePath, todayDate);
            
            if (statsExists) {
                if (!quietMode) console.log('昨日统计信息已存在，跳过生成');
                return '';
            }
            
            // 提取昨日任务内容
            const yesterdayContent = await extractTasksForDate(this.vault, yesterdayFilePath, yesterdayDate);
            
            // 如果找不到昨日任务内容
            if (!yesterdayContent) {
                if (!quietMode) console.log(`找不到昨日(${yesterdayDate})任务内容，跳过统计`);
                return '';
            }
            
            // 分析任务完成情况
            const taskStats = analyzeTaskCompletion(yesterdayContent);
            
            if (!quietMode) {
                console.log(`昨日任务统计: 总数=${taskStats.totalTasks}, 已完成=${taskStats.completedTasks}`);
                console.log(`未完成任务: ${taskStats.unfinishedTasksList.length}个`);
            }
            
            // 如果没有任务，不生成统计信息
            if (taskStats.totalTasks === 0) {
                if (!quietMode) console.log('昨日没有任务，跳过统计');
                return '';
            }
            
            // 确保在所有语言环境下都调用generateStatisticsContent并传递getTranslation函数
            return generateStatisticsContent(taskStats, getTranslation);
            
        } catch (error) {
            console.error(`生成昨日统计信息时出错:`, error);
            return ''; // 出错时返回空字符串，不影响今日任务生成
        }
    }
    /**
     * 手动添加今日任务
     * @returns 成功或失败
     */
    async addTaskManually() {
        try {
            const settings = this.settingsManager.getSettings();
            const rootDir = settings.rootDir.trim() || 'DailyTasks'; // 使用默认目录
            // 检查今日任务是否已存在
            const exists = await todayTaskExists(this.vault, rootDir);
            if (exists) {
                // 任务已存在，显示提示
                this.showWarningNotice(`📌 ${getTranslation('notification.taskExists')}`);
                return false;
            }
            // 生成任务
            return await this.generateDailyTask();
        }
        catch (error) {
            console.error("Error adding task manually:", error);
            // 显示错误通知
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.showErrorNotice(`${getTranslation('notification.error')} ${errorMsg}`);
            return false;
        }
    }
    /**
     * 显示成功通知
     * @param message 通知内容
     */
    showSuccessNotice(message) {
        const notice = new Notice(message, this.settingsManager.getSettings().successNotificationDuration);
        // 添加成功样式
        if (notice.noticeEl) {
            notice.noticeEl.addClass('daily-task-success-notice');
        }
    }
    /**
     * 显示警告通知
     * @param message 通知内容
     */
    showWarningNotice(message) {
        const notice = new Notice(message, this.settingsManager.getSettings().successNotificationDuration);
        // 添加警告样式
        if (notice.noticeEl) {
            notice.noticeEl.addClass('daily-task-warning-notice');
        }
    }
    /**
     * 显示错误通知
     * @param message 通知内容
     */
    showErrorNotice(message) {
        const notice = new Notice(message, this.settingsManager.getSettings().successNotificationDuration);
        // 添加错误样式
        if (notice.noticeEl) {
            notice.noticeEl.addClass('daily-task-error-notice');
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza0dlbmVyYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRhc2tHZW5lcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFPLE1BQU0sRUFBRSxLQUFLLEVBQVMsTUFBTSxVQUFVLENBQUM7QUFDckQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUU3QyxPQUFPLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixFQUFFLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixFQUFFLHdCQUF3QixFQUFFLG1CQUFtQixFQUFFLHFCQUFxQixFQUFFLHlCQUF5QixFQUFFLHlCQUF5QixFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDclIsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQ3hELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUVuRDs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sYUFBYTtJQUt0QixZQUFZLEdBQVEsRUFBRSxlQUFnQztRQUNsRCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztRQUN2QixJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztJQUMzQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsaUJBQWlCLENBQUMsV0FBb0IsSUFBSSxFQUFFLFlBQXFCLEtBQUs7UUFDeEUsSUFBSTtZQUNBLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDcEQsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxZQUFZLENBQUMsQ0FBQyxTQUFTO1lBRWxFLFdBQVc7WUFDWCxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsT0FBTyxD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Q3pEO0lBQ0wsQ0FBQztJQUVEOzs7T0FHRztJQUNLLGVBQWUsQ0FBQyxPQUFlO1FBQ25DLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUNyQixPQUFPLEVBQ1AsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsQ0FBQywyQkFBMkIsQ0FDakUsQ0FBQztRQUVGLFNBQVM7UUFDVCxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDakIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMseUJBQXlCLENBQUMsQ0FBQztTQUN2RDtJQUNMLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcCwgTm90aWNlLCBURmlsZSwgVmF1bHQgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IGdldFRyYW5zbGF0aW9uIH0gZnJvbSBcIi4vaTE4bi9pMThuXCI7XG5pbXBvcnQgeyBTZXR0aW5nc01hbmFnZXIgfSBmcm9tIFwiLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgYXBwZW5kVG9GaWxlLCBlbnN1cmVGaWxlRXhpc3RzLCBlbnN1cmVGb2xkZXJFeGlzdHMsIGdldFRhc2tGaWxlUGF0aCwgdG9kYXlUYXNrRXhpc3RzLCBmaWxlQ29udGFpbnMsIGdldFllc3RlcmRheURhdGUsIGdldFllc3RlcmRheVRhc2tGaWxlUGF0aCwgZXh0cmFjdFRhc2tzRm9yRGF0ZSwgYW5hbHl6ZVRhc2tDb21wbGV0aW9uLCB5ZXN0ZXJkYXlTdGF0aXN0aWNzRXhpc3RzLCBnZW5lcmF0ZVN0YXRpc3RpY3NDb250ZW50IH0gZnJvbSBcIi4vdXRpbHMvZmlsZVV0aWxzXCI7XG5pbXBvcnQgeyByZW5kZXJUZW1wbGF0ZSB9IGZyb20gXCIuL3V0aWxzL3RlbXBsYXRlRW5naW5lXCI7XG5pbXBvcnQgeyBnZXRDdXJyZW50RGF0ZSB9IGZyb20gXCIuL3V0aWxzL2RhdGVVdGlsc1wiO1xuXG4vKipcbiAqIOS7u+WKoeeUn+aIkOWZqFxuICog6LSf6LSj5Yib5bu65Lu75Yqh5paH5Lu25ZKM5re75Yqg5Lu75Yqh5YaF5a65XG4gKi9cbmV4cG9ydCBjbGFzcyBUYXNrR2VuZXJhdG9yIHtcbiAgICBwcml2YXRlIGFwcDogQXBwO1xuICAgIHByaXZhdGUgdmF1bHQ6IFZhdWx0O1xuICAgIHByaXZhdGUgc2V0dGluZ3NNYW5hZ2VyOiBTZXR0aW5nc01hbmFnZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgc2V0dGluZ3NNYW5hZ2VyOiBTZXR0aW5nc01hbmFnZXIpIHtcbiAgICAgICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgICAgIHRoaXMudmF1bHQgPSBhcHAudmF1bHQ7XG4gICAgICAgIHRoaXMuc2V0dGluZ3NNYW5hZ2VyID0gc2V0dGluZ3NNYW5hZ2VyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOeUn+aIkOavj+aXpeS7u+WKoVxuICAgICAqIEBwYXJhbSBvcGVuRmlsZSDmmK/lkKbmiZPlvIDmlofku7ZcbiAgICAgKiBAcGFyYW0gcXVpZXRNb2RlIOmdmem7mOaooeW8j++8jOWHj+WwkeaXpeW/l+i+k+WHulxuICAgICAqIEByZXR1cm5zIOaIkOWKn+aIluWksei0pVxuICAgICAqL1xuICAgIGFzeW5jIGdlbmVyYXRlRGFpbHlUYXNrKG9wZW5GaWxlOiBib29sZWFuID0gdHJ1ZSwgcXVpZXRNb2RlOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc01hbmFnZXIuZ2V0U2V0dGluZ3MoKTtcbiAgICAgICAgICAgIGNvbnN0IHJvb3REaXIgPSBzZXR0aW5ncy5yb290RGlyLnRyaW0oKSB8fCAnRGFpbHlUYXNrcyc7IC8vIOS9v+eUqOm7mOiupOebruW9lVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDojrflj5bku7vliqHmlofku7bot6/lvoRcbiAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0VGFza0ZpbGVQYXRoKHJvb3REaXIpO1xuICAgICAgICAgICAgaWYgKCFxdWlldE1vZGUpIGNvbnNvbGUubG9nKGDnlJ/miJDku7vliqHmlofku7bot6/lvoQ6ICR7ZmlsZVBhdGh9YCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOino+aekOW5tOS7veWSjOaciOS7vVxuICAgICAgICAgICAgY29uc3QgcGF0aFBhcnRzID0gZmlsZVBhdGguc3BsaXQoJy8nKTtcbiAgICAgICAgICAgIGNvbnN0IHllYXIgPSBwYXRoUGFydHMubGVuZ3RoID4gMSA/IHBhdGhQYXJ0c1sxXSA6ICcnO1xuICAgICAgICAgICAgY29uc3QgbW9udGhOYW1lID0gcGF0aFBhcnRzLmxlbmd0aCA+IDIgPyBwYXRoUGFydHNbMl0ucmVwbGFjZSgnLm1kJywgJycpIDogJyc7XG4gICAgICAgICAgICBjb25zdCB5ZWFyRm9sZGVyID0gYCR7cm9vdERpcn0vJHt5ZWFyfWA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOehruS/neagueebruW9leWtmOWcqFxuICAgICAgICAgICAgaWYgKCFxdWlldE1vZGUpIGNvbnNvbGUubG9nKGDmraPlnKjnoa7kv53moLnnm67lvZXlrZjlnKg6ICR7cm9vdERpcn1gKTtcbiAgICAgICAgICAgIGNvbnN0IHJvb3RDcmVhdGVkID0gYXdhaXQgZW5zdXJlRm9sZGVyRXhpc3RzKHRoaXMudmF1bHQsIHJvb3REaXIpO1xuICAgICAgICAgICAgaWYgKCFyb290Q3JlYXRlZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOaXoOazleiuv+mXruaIluWIm+W7uuagueebruW9lTogJHtyb290RGlyfWApO1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5peg5rOV6K6/6Zeu5qC555uu5b2VOiAke3Jvb3REaXJ977yM5Y+v6IO95piv5a2Y5Zyo5ZCM5ZCN5paH5Lu25oiW5p2D6ZmQ6Zeu6aKYYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXF1aWV0TW9kZSkgY29uc29sZS5sb2coYOagueebruW9leehruiupDogJHtyb290RGlyfWApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDnoa7kv53lubTku73nm67lvZXlrZjlnKhcbiAgICAgICAgICAgIGlmICghcXVpZXRNb2RlKSBjb25zb2xlLmxvZyhg5q2j5Zyo56Gu5L+d5bm05Lu955uu5b2V5a2Y5ZyoOiAke3llYXJGb2xkZXJ9YCk7XG4gICAgICAgICAgICBjb25zdCB5ZWFyQ3JlYXRlZCA9IGF3YWl0IGVuc3VyZUZvbGRlckV4aXN0cyh0aGlzLnZhdWx0LCB5ZWFyRm9sZGVyKTtcbiAgICAgICAgICAgIGlmICgheWVhckNyZWF0ZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGDml6Dms5Xorr/pl67miJbliJvlu7rlubTku73nm67lvZU6ICR7eWVhckZvbGRlcn1gKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOaXoOazleiuv+mXruW5tOS7veebruW9lTogJHt5ZWFyRm9sZGVyfe+8jOWPr+iDveaYr+WtmOWcqOWQjOWQjeaWh+S7tuaIluadg+mZkOmXrumimGApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFxdWlldE1vZGUpIGNvbnNvbGUubG9nKGDlubTku73nm67lvZXnoa7orqQ6ICR7eWVhckZvbGRlcn1gKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g56Gu5L+d5pyI5Lu95paH5Lu25a2Y5ZyoXG4gICAgICAgICAgICBpZiAoIXF1aWV0TW9kZSkgY29uc29sZS5sb2coYOato+WcqOehruS/neaciOS7veaWh+S7tuWtmOWcqDogJHtmaWxlUGF0aH0gKCR7bW9udGhOYW1lfSlgKTtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVDcmVhdGVkID0gYXdhaXQgZW5zdXJlRmlsZUV4aXN0cyh0aGlzLnZhdWx0LCBmaWxlUGF0aCk7XG4gICAgICAgICAgICBpZiAoIWZpbGVDcmVhdGVkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihg5peg5rOV6K6/6Zeu5oiW5Yib5bu65pyI5Lu95paH5Lu2OiAke2ZpbGVQYXRofWApO1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5peg5rOV6K6/6Zeu5pyI5Lu95paH5Lu2OiAke2ZpbGVQYXRofe+8jOivt+ajgOafpeaYr+WQpuWtmOWcqOWQjOWQjeebruW9leaIluadg+mZkOmXrumimGApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFxdWlldE1vZGUpIGNvbnNvbGUubG9nKGDmnIjku73mlofku7bnoa7orqQ6ICR7ZmlsZVBhdGh9YCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOajgOafpeS7iuaXpeS7u+WKoeaYr+WQpuW3suWtmOWcqFxuICAgICAgICAgICAgY29uc3QgZGF0ZSA9IGdldEN1cnJlbnREYXRlKCk7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ1Rhc2tDaGVjayA9IGF3YWl0IGZpbGVDb250YWlucyh0aGlzLnZhdWx0LCBmaWxlUGF0aCwgYCMjICR7ZGF0ZX1gKTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ1Rhc2tDaGVjaykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDku4rml6UoJHtkYXRlfSnku7vliqHlt7LlrZjlnKjkuo7mlofku7bkuK3vvIzot7Pov4fliJvlu7pgKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzpnIDopoHmiZPlvIDmlofku7ZcbiAgICAgICAgICAgICAgICBpZiAob3BlbkZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5pi+56S65o+Q56S65bm25omT5byA5paH5Lu2XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd1dhcm5pbmdOb3RpY2UoYPCfk4wgJHtnZXRUcmFuc2xhdGlvbignbm90aWZpY2F0aW9uLnRhc2tFeGlzdHMnKX1gKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZpbGVQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGUgJiYgZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIOS7u+WKoeW3suWtmOWcqO+8jOinhuS4uuaIkOWKn1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlpoLmnpzlvIDlkK/kuobku7vliqHnu5/orqHlip/og73vvIzlnKjmt7vliqDku4rml6Xku7vliqHliY3mt7vliqDmmKjml6Xnu5/orqFcbiAgICAgICAgICAgIGxldCBzdGF0aXN0aWNzQ29udGVudCA9ICcnO1xuICAgICAgICAgICAgaWYgKHNldHRpbmdzLnRhc2tTdGF0aXN0aWNzKSB7XG4gICAgICAgICAgICAgICAgc3RhdGlzdGljc0NvbnRlbnQgPSBhd2FpdCB0aGlzLmdlbmVyYXRlWWVzdGVyZGF5U3RhdGlzdGljcyhyb290RGlyLCBkYXRlLCBxdWlldE1vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDojrflj5bku7vliqHmqKHmnb8gLSDkvb/nlKjmlrDnmoTmqKHmnb/pgLvovpFcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZSA9ICcnO1xuICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3NNYW5hZ2VyLmhhc0N1c3RvbVRlbXBsYXRlKCkpIHtcbiAgICAgICAgICAgICAgICAvLyDkvb/nlKjnlKjmiLfoh6rlrprkuYnmqKHmnb9cbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZSA9IHRoaXMuc2V0dGluZ3NNYW5hZ2VyLmdldFNldHRpbmdzKCkuY3VzdG9tVGVtcGxhdGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOS9v+eUqOivreiogOebuOWFs+eahOm7mOiupOaooeadv1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlID0gdGhpcy5zZXR0aW5nc01hbmFnZXIuZ2V0VGVtcGxhdGVCeUxhbmd1YWdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOa4suafk+aooeadv1xuICAgICAgICAgICAgY29uc3QgcmVuZGVyZWRDb250ZW50ID0gcmVuZGVyVGVtcGxhdGUodGVtcGxhdGUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlkIjlubbnu5/orqHkv6Hmga/lkozku4rml6Xku7vliqHlhoXlrrlcbiAgICAgICAgICAgIGNvbnN0IGZ1bGxDb250ZW50ID0gc3RhdGlzdGljc0NvbnRlbnQgXG4gICAgICAgICAgICAgICAgPyBgJHtyZW5kZXJlZENvbnRlbnR9XFxuXFxuJHtzdGF0aXN0aWNzQ29udGVudH1gXG4gICAgICAgICAgICAgICAgOiByZW5kZXJlZENvbnRlbnQ7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOi/veWKoOWIsOaWh+S7tlxuICAgICAgICAgICAgaWYgKCFxdWlldE1vZGUpIGNvbnNvbGUubG9nKGDmraPlnKjlkJHmlofku7bov73liqDlhoXlrrlgKTtcbiAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCBhcHBlbmRUb0ZpbGUodGhpcy52YXVsdCwgZmlsZVBhdGgsIGZ1bGxDb250ZW50KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg4pyFIOS7u+WKoeWGheWuuei/veWKoOaIkOWKnyAke2RhdGV9YCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c6ZyA6KaB5omT5byA5paH5Lu2XG4gICAgICAgICAgICAgICAgaWYgKG9wZW5GaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOaJk+W8gOWIm+W7uueahOaWh+S7tlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gdGhpcy52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZmlsZVBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZSAmJiBmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbGVhZi5vcGVuRmlsZShmaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5bu26L+f5LiA5LiL5YaN5pi+56S66YCa55+l77yM56Gu5L+d5paH5Lu25bey57uP5omT5byAXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dTdWNjZXNzTm90aWNlKGDinKggJHtnZXRUcmFuc2xhdGlvbignbm90aWZpY2F0aW9uLnRhc2tBZGRlZCcpfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5paH5Lu25Yib5bu65oiQ5Yqf5L2G5peg5rOV5omT5byAOiAke2ZpbGVQYXRofWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g6Z2Z6buY5qih5byP77yM5Y+q5Zyo5o6n5Yi25Y+w6K6w5b2VXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDinKgg5LuK5pelKCR7ZGF0ZX0p5Lu75Yqh5bey6Z2Z6buY5re75Yqg77yM5peg6ZyA5omT5byA5paH5Lu2YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOaXoOazleWQkeaWh+S7tui/veWKoOWGheWuuTogJHtmaWxlUGF0aH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3M7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZ2VuZXJhdGluZyBkYWlseSB0YXNrOlwiLCBlcnJvcik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOaYvuekuumUmeivr+mAmuefpVxuICAgICAgICAgICAgY29uc3QgZXJyb3JNc2cgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICAgICAgICB0aGlzLnNob3dFcnJvck5vdGljZShgJHtnZXRUcmFuc2xhdGlvbignbm90aWZpY2F0aW9uLmVycm9yJyl9ICR7ZXJyb3JNc2d9YCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiDnlJ/miJDmmKjml6Xku7vliqHnu5/orqHkv6Hmga9cbiAgICAgKiBAcGFyYW0gcm9vdERpciDmoLnnm67lvZVcbiAgICAgKiBAcGFyYW0gdG9kYXlEYXRlIOS7iuaXpeaXpeacn++8iOeUqOS6juajgOafpeaYr+WQpuW3suWtmOWcqOe7n+iuoe+8iVxuICAgICAqIEBwYXJhbSBxdWlldE1vZGUg6Z2Z6buY5qih5byPXG4gICAgICogQHJldHVybnMg57uf6K6h5L+h5oGv5YaF5a655oiW56m65a2X56ym5LiyXG4gICAgICovXG4gICAgYXN5bmMgZ2VuZXJhdGVZZXN0ZXJkYXlTdGF0aXN0aWNzKHJvb3REaXI6IHN0cmluZywgdG9kYXlEYXRlOiBzdHJpbmcsIHF1aWV0TW9kZTogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOiOt+WPluaYqOWkqeeahOaXpeacn+WSjOaWh+S7tui3r+W+hFxuICAgICAgICAgICAgY29uc3QgeWVzdGVyZGF5RGF0ZSA9IGdldFllc3RlcmRheURhdGUoKTtcbiAgICAgICAgICAgIGNvbnN0IHllc3RlcmRheUZpbGVQYXRoID0gZ2V0WWVzdGVyZGF5VGFza0ZpbGVQYXRoKHJvb3REaXIpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIXF1aWV0TW9kZSkgY29uc29sZS5sb2coYOato+WcqOiOt+WPluaYqOaXpSgke3llc3RlcmRheURhdGV9KeS7u+WKoee7n+iuoe+8jOaWh+S7tui3r+W+hDogJHt5ZXN0ZXJkYXlGaWxlUGF0aH1gKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5qOA5p+l5LuK5pel55qE5YaF5a655Lit5piv5ZCm5bey57uP5YyF5ZCr5pio5pel57uf6K6hXG4gICAgICAgICAgICBjb25zdCB0b2RheUZpbGVQYXRoID0gZ2V0VGFza0ZpbGVQYXRoKHJvb3REaXIpO1xuICAgICAgICAgICAgY29uc3Qgc3RhdHNFeGlzdHMgPSBhd2FpdCB5ZXN0ZXJkYXlTdGF0aXN0aWNzRXhpc3RzKHRoaXMudmF1bHQsIHRvZGF5RmlsZVBhdGgsIHRvZGF5RGF0ZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChzdGF0c0V4aXN0cykge1xuICAgICAgICAgICAgICAgIGlmICghcXVpZXRNb2RlKSBjb25zb2xlLmxvZygn5pio5pel57uf6K6h5L+h5oGv5bey5a2Y5Zyo77yM6Lez6L+H55Sf5oiQJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmj5Dlj5bmmKjml6Xku7vliqHlhoXlrrlcbiAgICAgICAgICAgIGNvbnN0IHllc3RlcmRheUNvbnRlbnQgPSBhd2FpdCBleHRyYWN0VGFza3NGb3JEYXRlKHRoaXMudmF1bHQsIHllc3RlcmRheUZpbGVQYXRoLCB5ZXN0ZXJkYXlEYXRlKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5aaC5p6c5om+5LiN5Yiw5pio5pel5Lu75Yqh5YaF5a65XG4gICAgICAgICAgICBpZiAoIXllc3RlcmRheUNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXF1aWV0TW9kZSkgY29uc29sZS5sb2coYOaJvuS4jeWIsOaYqOaXpSgke3llc3RlcmRheURhdGV9KeS7u+WKoeWGheWuue+8jOi3s+i/h+e7n+iuoWApO1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5YiG5p6Q5Lu75Yqh5a6M5oiQ5oOF5Ya1XG4gICAgICAgICAgICBjb25zdCB0YXNrU3RhdHMgPSBhbmFseXplVGFza0NvbXBsZXRpb24oeWVzdGVyZGF5Q29udGVudCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICghcXVpZXRNb2RlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOaYqOaXpeS7u+WKoee7n+iuoTog5oC75pWwPSR7dGFza1N0YXRzLnRvdGFsVGFza3N9LCDlt7LlrozmiJA9JHt0YXNrU3RhdHMuY29tcGxldGVkVGFza3N9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOacquWujOaIkOS7u+WKoTogJHt0YXNrU3RhdHMudW5maW5pc2hlZFRhc2tzTGlzdC5sZW5ndGh95LiqYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWmguaenOayoeacieS7u+WKoe+8jOS4jeeUn+aIkOe7n+iuoeS/oeaBr1xuICAgICAgICAgICAgaWYgKHRhc2tTdGF0cy50b3RhbFRhc2tzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFxdWlldE1vZGUpIGNvbnNvbGUubG9nKCfmmKjml6XmsqHmnInku7vliqHvvIzot7Pov4fnu5/orqEnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOeUn+aIkOe7n+iuoeS/oeaBr+WGheWuuVxuICAgICAgICAgICAgcmV0dXJuIGdlbmVyYXRlU3RhdGlzdGljc0NvbnRlbnQodGFza1N0YXRzKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihg55Sf5oiQ5pio5pel57uf6K6h5L+h5oGv5YaF5a655oiW56m65a2X56ym5Liy77yM5LiN5b2x5ZON5LuK5pel5Lu75Yqh55Sf5oiQXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICog5omL5Yqo5re75Yqg5LuK5pel5Lu75YqhXG4gICAgICogQHJldHVybnMg5oiQ5Yqf5oiW5aSx6LSlXG4gICAgICovXG4gICAgYXN5bmMgYWRkVGFza01hbnVhbGx5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzTWFuYWdlci5nZXRTZXR0aW5ncygpO1xuICAgICAgICAgICAgY29uc3Qgcm9vdERpciA9IHNldHRpbmdzLnJvb3REaXIudHJpbSgpIHx8ICdEYWlseVRhc2tzJzsgLy8g5L2/55So6buY6K6k55uu5b2VXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOajgOafpeS7iuaXpeS7u+WKoeaYr+WQpuW3suWtmOWcqFxuICAgICAgICAgICAgY29uc3QgZXhpc3RzID0gYXdhaXQgdG9kYXlUYXNrRXhpc3RzKHRoaXMudmF1bHQsIHJvb3REaXIpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoZXhpc3RzKSB7XG4gICAgICAgICAgICAgICAgLy8g5Lu75Yqh5bey5a2Y5Zyo77yM5pi+56S65o+Q56S6XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93V2FybmluZ05vdGljZShg8J+TjCAke2dldFRyYW5zbGF0aW9uKCdub3RpZmljYXRpb24udGFza0V4aXN0cycpfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g55Sf5oiQ5Lu75YqhXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZW5lcmF0ZURhaWx5VGFzaygpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGFkZGluZyB0YXNrIG1hbnVhbGx5OlwiLCBlcnJvcik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOaYvuekuumUmeivr+mAmuefpVxuICAgICAgICAgICAgY29uc3QgZXJyb3JNc2cgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICAgICAgICB0aGlzLnNob3dFcnJvck5vdGljZShgJHtnZXRUcmFuc2xhdGlvbignbm90aWZpY2F0aW9uLmVycm9yJyl9ICR7ZXJyb3JNc2d9YCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiDmmL7npLrmiJDlip/pgJrnn6VcbiAgICAgKiBAcGFyYW0gbWVzc2FnZSDpgJrnn6XlhoXlrrlcbiAgICAgKi9cbiAgICBwcml2YXRlIHNob3dTdWNjZXNzTm90aWNlKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBjb25zdCBub3RpY2UgPSBuZXcgTm90aWNlKFxuICAgICAgICAgICAgbWVzc2FnZSwgXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzTWFuYWdlci5nZXRTZXR0aW5ncygpLnN1Y2Nlc3NOb3RpZmljYXRpb25EdXJhdGlvblxuICAgICAgICApO1xuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5oiQ5Yqf5qC35byPXG4gICAgICAgIGlmIChub3RpY2Uubm90aWNlRWwpIHtcbiAgICAgICAgICAgIG5vdGljZS5ub3RpY2VFbC5hZGRDbGFzcygnZGFpbHktdGFzay1zdWNjZXNzLW5vdGljZScpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIOaYvuekuuitpuWRiumAmuefpVxuICAgICAqIEBwYXJhbSBtZXNzYWdlIOmAmuefpeWGheWuuVxuICAgICAqL1xuICAgIHByaXZhdGUgc2hvd1dhcm5pbmdOb3RpY2UobWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG5vdGljZSA9IG5ldyBOb3RpY2UoXG4gICAgICAgICAgICBtZXNzYWdlLCBcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3NNYW5hZ2VyLmdldFNldHRpbmdzKCkuc3VjY2Vzc05vdGlmaWNhdGlvbkR1cmF0aW9uXG4gICAgICAgICk7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDplJnor6/moLflvI9cbiAgICAgICAgaWYgKG5vdGljZS5ub3RpY2VFbCkge1xuICAgICAgICAgICAgbm90aWNlLm5vdGljZUVsLmFkZENsYXNzKCdkYWlseS10YXNrLXdhcm5pbmctbm90aWNlJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICog5pi+56S66ZSZ6K+v6YCa55+lXG4gICAgICogQHBhcmFtIG1lc3NhZ2Ug6YCa55+l5YaF5a65XG4gICAgICovXG4gICAgcHJpdmF0ZSBzaG93RXJyb3JOb3RpY2UobWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG5vdGljZSA9IG5ldyBOb3RpY2UoXG4gICAgICAgICAgICBtZXNzYWdlLCBcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3NNYW5hZ2VyLmdldFNldHRpbmdzKCkuc3VjY2Vzc05vdGlmaWNhdGlvbkR1cmF0aW9uXG4gICAgICAgICk7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDplJnor6/moLflvI9cbiAgICAgICAgaWYgKG5vdGljZS5ub3RpY2VFbCkge1xuICAgICAgICAgICAgbm90aWNlLm5vdGljZUVsLmFkZENsYXNzKCdkYWlseS10YXNrLWVycm9yLW5vdGljZScpO1xuICAgICAgICB9XG4gICAgfVxufSJdfQ==