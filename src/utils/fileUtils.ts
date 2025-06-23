import { normalizePath, TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import { getCurrentDate, getCurrentMonth, getCurrentYear, getLocalizedMonthName, isEnglishEnvironment } from "./dateUtils";
import { getTranslation, TranslationKey } from '../i18n/i18n';
import { Notice } from 'obsidian';
import { DEFAULT_SETTINGS } from '../settings/index';
import { FileGenerationMode } from '../models/settings';

/**
 * 文件操作工具函数
 */

/**
 * 确保目录存在，如果不存在则创建
 * @param vault Obsidian文件系统
 * @param path 目录路径
 * @returns 是否成功创建或已存在
 */
export async function ensureFolderExists(vault: Vault, path: string): Promise<boolean> {
    try {
        const folderParts = path.split('/').filter(part => part.trim() !== '');
        let currentPath = '';
        
        for (const part of folderParts) {
            if (currentPath) {
                currentPath += '/' + part;
            } else {
                currentPath = part;
            }
            
            const normalizedPath = normalizePath(currentPath);
            const folder = vault.getAbstractFileByPath(normalizedPath);
            
            if (!folder) {
                await vault.createFolder(normalizedPath);
            }
        }
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * 确保文件存在，如果不存在则创建
 * @param vault Obsidian文件系统
 * @param path 文件路径
 * @param content 文件内容
 * @returns 是否成功创建或已存在
 */
export async function ensureFileExists(vault: Vault, path: string, content: string = ''): Promise<boolean> {
    try {
        // 确保文件夹结构存在
        const normalizedPath = normalizePath(path);
        const folderPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
        
        if (folderPath) {
            const folderExists = await ensureFolderExists(vault, folderPath);
            if (!folderExists) {
                return false;
            }
        }
        
        // 检查文件是否存在
        const file = vault.getAbstractFileByPath(normalizedPath);
        
        if (!file) {
            // 创建文件并写入内容
            await vault.create(normalizedPath, content);
        }
                return true;
    } catch (error) {
        return false;
    }
}

/**
 * 向文件追加内容
 * @param vault Obsidian文件系统
 * @param path 文件路径
 * @param content 要追加的内容
 * @returns 是否成功追加
 */
export async function appendToFile(vault: Vault, path: string, content: string): Promise<boolean> {
    try {
        const normalizedPath = normalizePath(path);
        
        // 确保文件存在
        const fileExists = await ensureFileExists(vault, normalizedPath);
        if (!fileExists) {
                return false;
            }

        // 获取文件对象
        const file = vault.getAbstractFileByPath(normalizedPath);
        if (!(file instanceof TFile)) {
            return false;
        }
        
        // 读取文件当前内容
        const currentContent = await vault.read(file);
        
        // 追加新内容
        const newContent = currentContent + '\n' + content;
        
        // 将合并后的内容写回文件
        await vault.modify(file, newContent);
        
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * 检查文件中是否包含指定内容
 * @param vault Obsidian文件系统
 * @param path 文件路径
 * @param content 要检查的内容
 * @returns 是否包含指定内容
 */
export async function fileContains(vault: Vault, path: string, content: string): Promise<boolean> {
    try {
        const normalizedPath = normalizePath(path);
        
        // 获取文件对象
        const file = vault.getAbstractFileByPath(normalizedPath);
        if (!(file instanceof TFile)) {
                return false;
            }

        // 读取文件内容
        const fileContent = await vault.read(file);
        
        // 检查是否包含指定内容
        return fileContent.includes(content);
    } catch (error) {
        return false;
    }
}

/**
 * 根据当前日期生成任务文件路径
 * @param rootDir 根目录
 * @returns 任务文件路径，格式为：rootDir/year/monthName.md
 */
export function getTaskFilePath(rootDir: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth(); // 0-11
    
    const yearDir = year.toString();
    
    // 根据系统语言确定是否使用英文
    const isEnglish = isEnglishEnvironment();
    
    // 使用本地化的月份名称
    let monthName = '';
    if (isEnglish) {
        // 英文月份名称
        const englishMonths = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        monthName = englishMonths[monthIndex];
    } else {
        // 中文月份名称
        const chineseMonths = [
            "1月", "2月", "3月", "4月", "5月", "6月",
            "7月", "8月", "9月", "10月", "11月", "12月"
        ];
        monthName = chineseMonths[monthIndex];
    }
    
    const monthFile = `${monthName}.md`;
    
    return normalizePath(`${rootDir}/${yearDir}/${monthFile}`);
}

/**
 * 根据文件生成模式和配置生成任务文件路径
 * @param rootDir 根目录
 * @param mode 文件生成模式
 * @param prefix 日度文件前缀（仅日度模式使用）
 * @returns 任务文件路径
 */
export function getTaskFilePathByMode(rootDir: string, mode: FileGenerationMode, prefix: string = ''): string {
    if (mode === FileGenerationMode.MONTHLY) {
        return getTaskFilePath(rootDir);
    } else {
        return getDailyTaskFilePath(rootDir, prefix);
    }
}

/**
 * 根据当前日期生成日度任务文件路径
 * @param rootDir 根目录
 * @param prefix 文件名前缀
 * @returns 日度任务文件路径，格式为：rootDir/year/monthFolder/prefix+date.md
 */
export function getDailyTaskFilePath(rootDir: string, prefix: string = ''): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate();
    
    const yearDir = year.toString();
    // 使用数字格式的月份文件夹，保持两位数格式
    const monthFolder = month.toString().padStart(2, '0');
    
    // 生成日期字符串 YYYY-MM-DD
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // 构建文件名：前缀 + 日期 + .md
    const fileName = prefix.trim() ? `${prefix.trim()}${dateStr}.md` : `${dateStr}.md`;
    
    return normalizePath(`${rootDir}/${yearDir}/${monthFolder}/${fileName}`);
}

/**
 * 获取日度任务文件的年份和月份文件夹路径
 * @param rootDir 根目录
 * @returns 包含年份路径和月份路径的对象
 */
export function getDailyTaskFolderPaths(rootDir: string): { yearPath: string; monthPath: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    
    const yearDir = year.toString();
    const monthFolder = month.toString().padStart(2, '0');
    
    const yearPath = normalizePath(`${rootDir}/${yearDir}`);
    const monthPath = normalizePath(`${rootDir}/${yearDir}/${monthFolder}`);
    
    return { yearPath, monthPath };
}

/**
 * 检查日度任务文件是否已存在
 * @param vault Obsidian文件系统
 * @param rootDir 根目录
 * @param prefix 文件名前缀
 * @returns 是否已存在
 */
export async function dailyTaskFileExists(vault: Vault, rootDir: string, prefix: string = ''): Promise<boolean> {
    const filePath = getDailyTaskFilePath(rootDir, prefix);
    const file = vault.getAbstractFileByPath(filePath);
    return file !== null && file instanceof TFile;
}

/**
 * 创建完整的日度任务文件（不追加内容）
 * @param vault Obsidian文件系统
 * @param filePath 文件路径
 * @param content 文件内容
 * @returns 是否成功创建
 */
export async function createDailyTaskFile(vault: Vault, filePath: string, content: string): Promise<boolean> {
    try {
        const normalizedPath = normalizePath(filePath);
        
        // 确保文件夹结构存在
        const folderPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
        if (folderPath) {
            const folderExists = await ensureFolderExists(vault, folderPath);
            if (!folderExists) {
                return false;
            }
        }
        
        // 检查文件是否已存在
        const existingFile = vault.getAbstractFileByPath(normalizedPath);
        if (existingFile) {
            return false; // 文件已存在，不重复创建
        }
        
        // 创建新文件
        await vault.create(normalizedPath, content);
        
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * 检查今日任务是否已存在
 * @param vault Obsidian文件系统
 * @param rootDir 根目录
 * @returns 是否已存在
 */
export async function todayTaskExists(vault: Vault, rootDir: string): Promise<boolean> {
    const taskFilePath = getTaskFilePath(rootDir);
    return vault.getAbstractFileByPath(taskFilePath) !== null;
}

/**
 * 获取前一天的日期
 * @returns 前一天的日期，格式为YYYY-MM-DD
 */
export function getYesterdayDate(): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const year = yesterday.getFullYear();
    const month = yesterday.getMonth() + 1;
    const day = yesterday.getDate();
    
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/**
 * 获取前一天的任务文件路径
 * @param rootDir 根目录
 * @returns 前一天任务文件的路径
 */
export function getYesterdayTaskFilePath(rootDir: string): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const year = yesterday.getFullYear();
    const monthIndex = yesterday.getMonth(); // 0-11
    
    const yearDir = year.toString();
    
    // 根据系统语言确定是否使用英文
    const isEnglish = isEnglishEnvironment();
    
    // 使用本地化的月份名称
    let monthName = '';
    if (isEnglish) {
        // 英文月份名称
        const englishMonths = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        monthName = englishMonths[monthIndex];
    } else {
        // 中文月份名称
        const chineseMonths = [
            "1月", "2月", "3月", "4月", "5月", "6月",
            "7月", "8月", "9月", "10月", "11月", "12月"
        ];
        monthName = chineseMonths[monthIndex];
    }
    
    const monthFile = `${monthName}.md`;
    
    return normalizePath(`${rootDir}/${yearDir}/${monthFile}`);
}

/**
 * 格式化日期用于显示
 * @param date 日期字符串
 * @param locale 语言区域设置
 * @returns 格式化后的日期字符串
 */
export function formatDateForDisplay(date: string, locale: string = 'en'): string {
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
    }
    
    const [year, month, day] = date.split('-').map(part => parseInt(part, 10));
    const monthIndex = month - 1;
    
    if (locale === 'zh') {
        const monthName = getMonthNameZH(monthIndex);
        return `${year}年${monthName}${day}日`;
    } else {
        const monthName = getMonthNameEN(monthIndex);
        return `${monthName} ${day}, ${year}`;
    }
}

/**
 * 获取中文月份名称
 * @param monthIndex 月份索引（0-11）
 * @returns 中文月份名称
 */
function getMonthNameZH(monthIndex: number): string {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月', 
                   '七月', '八月', '九月', '十月', '十一月', '十二月'];
    return months[monthIndex] || '';
}

/**
 * 获取英文月份名称
 * @param monthIndex 月份索引（0-11）
 * @returns 英文月份名称
 */
function getMonthNameEN(monthIndex: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex] || '';
}

/**
 * 提取特定日期的任务内容
 * @param vault Obsidian文件系统
 * @param filePath 文件路径
 * @param date 日期字符串 (YYYY-MM-DD)
 * @returns 任务内容或null
 */
export async function extractTasksForDate(vault: Vault, filePath: string, date: string): Promise<string | null> {
    try {
        // 检查任务文件是否存在
        const normalizedPath = normalizePath(filePath);
        const file = vault.getAbstractFileByPath(normalizedPath);
        if (!(file instanceof TFile)) {
            return null;
        }

        // 读取任务文件内容
        const fileContent = await vault.read(file);
        
        // 将内容分割成各部分，寻找任务部分
        const sections = fileContent.split(/^##\s+/m);
        let tasksSection: string | null = null;
        
        for (const section of sections) {
            if (section.trim().startsWith('Tasks')) {
                tasksSection = section;
                break;
            }
        }
        
        if (!tasksSection) {
            return null;
        }
        
        // 返回任务部分
        return tasksSection.trim();
    } catch (error) {
        return null;
    }
}

/**
 * 解析任务内容，统计总任务数和已完成任务数
 * @param taskContent 任务内容文本
 * @returns 任务统计结果 {totalTasks, completedTasks, unfinishedTasksList}
 */
export function analyzeTaskCompletion(taskContent: string): {
    totalTasks: number;
    completedTasks: number;
    unfinishedTasksList: string[];
} {
    if (!taskContent) {
        return {
            totalTasks: 0,
            completedTasks: 0,
            unfinishedTasksList: []
        };
    }
    
    // 将内容分割成行
    const lines = taskContent.split('\n');
    
    let totalTasks = 0;
    let completedTasks = 0;
    const unfinishedTasksList: string[] = [];
    
    // 分析每行是否包含任务复选框
    for (const line of lines) {
        // 检查行是否包含任务复选框
        const taskMatch = line.match(/^\s*-\s*\[([ xX])\]\s*(.+)$/);
        if (taskMatch) {
            totalTasks++;
    
            // 检查任务是否已完成
            if (taskMatch[1].toLowerCase() === 'x') {
                completedTasks++;
            } else {
                // 将任务内容添加到未完成任务列表
                unfinishedTasksList.push(taskMatch[2].trim());
            }
        }
    }
    
    return {
        totalTasks,
        completedTasks,
        unfinishedTasksList
    };
}

/**
 * 检查今日文件中是否已包含昨日统计信息
 * @param vault Obsidian文件系统
 * @param filePath 今日任务文件路径
 * @param date 今日日期
 * @returns 是否已包含昨日统计
 */
export async function yesterdayStatisticsExists(vault: Vault, filePath: string, date: string): Promise<boolean> {
    try {
        // 检查今日任务文件是否存在
        const normalizedPath = normalizePath(filePath);
        const file = vault.getAbstractFileByPath(normalizedPath);
        if (!(file instanceof TFile)) {
            return false;
        }

        // 读取今日任务文件内容
        const fileContent = await vault.read(file);
        
        // 检查是否已包含昨日统计信息
        const statisticsHeader = `## ${getTranslation('statistics.title')}`;
        return fileContent.includes(statisticsHeader);
    } catch (error) {
        return false;
    }
}

/**
 * 生成昨日统计信息内容
 * @param tasks 任务统计对象或任务列表
 * @param t 翻译函数
 * @returns 格式化的统计信息字符串
 */
export function generateStatisticsContent(
    tasks: { totalTasks: number; completedTasks: number; unfinishedTasksList: string[] } | { task: string; isCompleted: boolean }[],
    t: (key: TranslationKey) => string
): string {
    let totalTasks = 0;
    let completedTasks = 0;
    let unfinishedTasks: { task: string }[] = [];
    
    if (!Array.isArray(tasks)) {
        totalTasks = tasks.totalTasks;
        completedTasks = tasks.completedTasks;
        unfinishedTasks = tasks.unfinishedTasksList.map(task => ({ task }));
    } else {
        totalTasks = tasks.length;
        completedTasks = tasks.filter(task => task.isCompleted).length;
        unfinishedTasks = tasks.filter(task => !task.isCompleted).map(task => ({ task: task.task }));
    }
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const displayTasks = unfinishedTasks.slice(0, 5);
    
    let content = `## ${t('statistics.title')}\n---\n`;
    content += `- ${t('statistics.totalTasks')}: ${totalTasks}\n`;
    content += `- ${t('statistics.completedTasks')}: ${completedTasks}\n`;
    content += `- ${t('statistics.completionRate')}: ${completionRate}%\n\n`;
    
    if (unfinishedTasks.length > 0) {
        content += `### ${t('statistics.suggestions')}\n---\n`;
        
        displayTasks.forEach(item => {
            content += `- [ ] ${item.task}\n`;
        });
        
        if (unfinishedTasks.length > 5) {
            const remaining = unfinishedTasks.length - 5;
            const moreTasks = remaining === 1 
                ? t('statistics.moreTasks.singular') 
                : `${remaining} ${t('statistics.moreTasks.plural')}`;
            content += `- *${moreTasks}*\n`;
        }
    }
    
    return content;
} 