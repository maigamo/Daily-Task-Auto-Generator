import { normalizePath, TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import { getCurrentDate, getCurrentMonth, getCurrentYear, getLocalizedMonthName, isEnglishEnvironment } from "./dateUtils";
import { getTranslation, TranslationKey } from '../i18n/i18n';
import { Notice } from 'obsidian';
import { DEFAULT_SETTINGS } from '../settings/index';

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
        // 确保路径以/结尾，便于处理
        path = path.endsWith('/') ? path : path + '/';

        // 逐级创建目录
        const folders = path.split('/').filter(p => p.length > 0);
        let currentPath = '';
        
        for (const folder of folders) {
            // 更新当前路径
            if (currentPath) {
                currentPath += '/' + folder;
            } else {
                currentPath = folder;
            }
            
            // 检查路径是否存在
            console.log(`检查目录: ${currentPath}`);
            const existingItem = vault.getAbstractFileByPath(currentPath);
            
            if (!existingItem) {
                // 路径不存在，创建文件夹
                console.log(`目录不存在，正在创建: ${currentPath}`);
                try {
                    await vault.createFolder(currentPath);
                    console.log(`目录创建成功: ${currentPath}`);
                } catch (e) {
                    // 捕获可能的"文件夹已存在"错误，但继续执行
                    // 这里处理可能的竞态条件：检查不存在但创建时已存在的情况
                    console.log(`创建目录时出现异常，可能已被其他进程创建: ${e}`);
                    // 再次检查目录是否存在
                    const folderAfterError = vault.getAbstractFileByPath(currentPath);
                    if (!folderAfterError || !(folderAfterError instanceof TFolder)) {
                        console.error(`目录创建失败，且无法确认目录已存在: ${currentPath}`);
                        return false;
                    }
                }
            } else if (!(existingItem instanceof TFolder)) {
                // 路径存在但不是文件夹（可能是同名文件）
                console.error(`路径 ${currentPath} 已存在但不是文件夹，而是: ${existingItem.constructor.name}`);
                return false;
            } else {
                // 文件夹已存在，继续检查下一级
                console.log(`目录已存在，无需创建: ${currentPath}`);
            }
        }
        
        return true;
    } catch (error) {
        console.error(`创建目录时出现未预期错误(${path}):`, error);
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
        // 先检查这个路径是否有文件或目录
        const existingItem = vault.getAbstractFileByPath(path);
        
        // 如果已存在
        if (existingItem) {
            // 检查是否为文件而不是文件夹
            if (existingItem instanceof TFile) {
                console.log(`文件已存在，无需创建: ${path}`);
                return true; // 文件已存在，跳过创建
            } else {
                // 存在但不是文件（可能是同名文件夹）
                console.error(`路径 ${path} 存在但不是文件，无法创建文件，可能是同名目录`);
                return false;
            }
        }
        
        // 文件不存在，检查父文件夹是否存在
        const lastSlashIndex = path.lastIndexOf('/');
        if (lastSlashIndex > 0) {
            const parentPath = path.substring(0, lastSlashIndex);
            console.log(`检查文件父目录: ${parentPath}`);
            const parentExists = await ensureFolderExists(vault, parentPath);
            if (!parentExists) {
                console.error(`无法确保父目录存在: ${parentPath}`);
                return false;
            }
        }

        // 创建文件
        try {
            console.log(`开始创建文件: ${path}`);
            await vault.create(path, content);
            console.log(`文件创建成功: ${path}`);
            return true;
        } catch (e) {
            // 如果创建时报错，再次检查文件是否已被创建
            // 这可能是由于竞态条件或其他进程同时创建了该文件
            console.log(`创建文件时出现异常: ${e}`);
            
            // 再次检查文件是否存在
            const fileAfterError = vault.getAbstractFileByPath(path);
            if (fileAfterError && fileAfterError instanceof TFile) {
                console.log(`尽管出现异常，但文件已存在，可能被其他进程创建: ${path}`);
                return true;
            }
            
            console.error(`文件创建最终失败: ${path}`);
            return false;
        }
    } catch (error) {
        console.error(`创建文件时出现未预期错误(${path}):`, error);
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
        const file = vault.getAbstractFileByPath(path);
        if (file && file instanceof TFile) {
            // 文件存在，追加内容
            try {
                const currentContent = await vault.read(file);
                await vault.modify(file, currentContent + "\n\n" + content);
                return true;
            } catch (e) {
                console.error(`读取或修改文件时出错: ${e}`);
                return false;
            }
        } else {
            // 文件不存在，创建文件并写入内容
            console.log(`文件不存在，尝试创建: ${path}`);
            return await ensureFileExists(vault, path, content);
        }
    } catch (error) {
        console.error(`Error appending to file at ${path}:`, error);
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
        const abstractFile = vault.getAbstractFileByPath(path);
        if (abstractFile && abstractFile instanceof TFile) {
            try {
                const currentContent = await vault.read(abstractFile);
                return currentContent.includes(content);
            } catch (e) {
                console.error(`读取文件内容时出错: ${e}`);
                return false;
            }
        }
        // 文件不存在，显然不包含指定内容
        console.log(`文件不存在，无法检查内容: ${path}`);
        return false;
    } catch (error) {
        console.error(`Error checking file content at ${path}:`, error);
        return false;
    }
}

/**
 * 根据当前日期生成任务文件路径
 * @param rootDir 根目录
 * @returns 任务文件路径
 */
export function getTaskFilePath(rootDir: string): string {
    const year = getCurrentYear();
    
    // 根据环境选择不同的月份命名方式
    const isEnglish = isEnglishEnvironment();
    const monthName = getLocalizedMonthName(isEnglish);
    
    // 使用本地化的月份名称生成文件路径
    return normalizePath(`${rootDir}/${year}/${monthName}.md`);
}

/**
 * 检查今日任务是否已存在
 * @param vault Obsidian文件系统
 * @param rootDir 根目录
 * @returns 是否已存在
 */
export async function todayTaskExists(vault: Vault, rootDir: string): Promise<boolean> {
    try {
        const date = getCurrentDate();
        const filePath = getTaskFilePath(rootDir);
        
        // 获取文件
        const abstractFile = vault.getAbstractFileByPath(filePath);
        if (!abstractFile || !(abstractFile instanceof TFile)) {
            return false; // 文件不存在
        }
        
        // 读取文件内容
        const content = await vault.read(abstractFile);
        
        // 更改检查方式：不仅检查纯日期，也检查带图标的日期格式
        const dateRegex = new RegExp(`## [^\\n]*${date}[^\\n]*\\n`);
        return dateRegex.test(content);
    } catch (error) {
        console.error("Error checking if today's task exists:", error);
        return false;
    }
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
    const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
    const day = yesterday.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * 获取前一天的任务文件路径
 * @param rootDir 根目录
 * @returns 前一天任务文件的路径
 */
export function getYesterdayTaskFilePath(rootDir: string): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const year = yesterday.getFullYear().toString();
    const isEnglish = isEnglishEnvironment();
    
    // 获取本地化的月份名称
    const month = new Date().getMonth();
    const yesterdayMonth = yesterday.getMonth();
    
    // 创建一个临时Date对象用于获取前一天的月份
    const tempDate = new Date();
    tempDate.setMonth(yesterdayMonth);
    
    // 判断是否为英文环境，获取对应的月份名称
    const monthName = isEnglish ? 
        getMonthNameEN(yesterdayMonth) : 
        getMonthNameZH(yesterdayMonth);
    
    return normalizePath(`${rootDir}/${year}/${monthName}.md`);
}

/**
 * 获取中文月份名称
 * @param monthIndex 月份索引（0-11）
 * @returns 中文月份名称
 */
function getMonthNameZH(monthIndex: number): string {
    const months = [
        "1月", "2月", "3月", "4月", "5月", "6月",
        "7月", "8月", "9月", "10月", "11月", "12月"
    ];
    return months[monthIndex];
}

/**
 * 获取英文月份名称
 * @param monthIndex 月份索引（0-11）
 * @returns 英文月份名称
 */
function getMonthNameEN(monthIndex: number): string {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return months[monthIndex];
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
        // 获取文件
        const abstractFile = vault.getAbstractFileByPath(filePath);
        if (!abstractFile || !(abstractFile instanceof TFile)) {
            return null; // 文件不存在
        }

        // 读取文件内容
        const content = await vault.read(abstractFile);
        
        // 找到日期标题行的位置
        const dateRegex = new RegExp(`## [^\\n]*${date}[^\\n]*\\n`);
        const match = content.match(dateRegex);
        
        if (!match || match.index === undefined) {
            return null; // 找不到日期
        }
        
        // 找到本日期部分的结束位置（下一个二级标题或文件结尾）
        const startPos = match.index;
        const nextHeadingMatch = content.slice(startPos + match[0].length).match(/\n## /);
        let endPos: number;
        
        if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
            endPos = startPos + match[0].length + nextHeadingMatch.index;
        } else {
            endPos = content.length;
        }
        
        // 提取任务部分，包括标题
        return content.slice(startPos, endPos).trim();
        
    } catch (error) {
        console.error(`Error extracting tasks for date ${date}:`, error);
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
    // 默认返回结果
    const result = {
        totalTasks: 0,
        completedTasks: 0,
        unfinishedTasksList: [] as string[]
    };
    
    if (!taskContent) {
        return result;
    }
    
    // 匹配所有任务行（包括已完成和未完成）
    const allTasksRegex = /- \[([ x])\] (.+)$/gm;
    const completedTasksRegex = /- \[x\] (.+)$/gm;
    const unfinishedTasksRegex = /- \[ \] (.+)$/gm;
    
    // 统计总任务数
    const allTasksMatches = [...taskContent.matchAll(allTasksRegex)];
    result.totalTasks = allTasksMatches.length;
    
    // 统计已完成任务数
    const completedTasksMatches = [...taskContent.matchAll(completedTasksRegex)];
    result.completedTasks = completedTasksMatches.length;
    
    // 提取未完成任务内容
    const unfinishedTasksMatches = [...taskContent.matchAll(unfinishedTasksRegex)];
    result.unfinishedTasksList = unfinishedTasksMatches.map(match => match[1].trim());
    
    return result;
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
        // 获取文件
        const abstractFile = vault.getAbstractFileByPath(filePath);
        if (!abstractFile || !(abstractFile instanceof TFile)) {
            return false; // 文件不存在
        }

        // 读取文件内容
        const content = await vault.read(abstractFile);
        
        // 检查是否包含昨日统计标记
        const yesterdayDate = getYesterdayDate();
        const statsTitle = getTranslation('statistics.title');
        const statsRegex = new RegExp(`## [^\\n]*${date}[^\\n]*[\\s\\S]*?${statsTitle}`);
        
        return statsRegex.test(content);
    } catch (error) {
        console.error(`Error checking if yesterday statistics exists:`, error);
        return false; // 出错时假设不存在
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
    let totalTasks: number;
    let completedTasks: number;
    let unfinishedTasks: { task: string }[] = [];
    
    // 检查输入类型
    if (Array.isArray(tasks)) {
        // 如果是任务列表数组
        totalTasks = tasks.length;
        completedTasks = tasks.filter(task => task.isCompleted).length;
        unfinishedTasks = tasks.filter(task => !task.isCompleted).map(task => ({ task: task.task }));
    } else {
        // 如果是统计对象
        totalTasks = tasks.totalTasks;
        completedTasks = tasks.completedTasks;
        unfinishedTasks = tasks.unfinishedTasksList.map(task => ({ task }));
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