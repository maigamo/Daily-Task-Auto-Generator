import { normalizePath, TFile, TFolder } from "obsidian";
import { getCurrentDate, getCurrentYear, getLocalizedMonthName, isEnglishEnvironment } from "./dateUtils";
import { getTranslation } from '../i18n/i18n';
/**
 * 文件操作工具函数
 */
/**
 * 确保目录存在，如果不存在则创建
 * @param vault Obsidian文件系统
 * @param path 目录路径
 * @returns 是否成功创建或已存在
 */
export async function ensureFolderExists(vault, path) {
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
            }
            else {
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
                }
                catch (e) {
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
            }
            else if (!(existingItem instanceof TFolder)) {
                // 路径存在但不是文件夹（可能是同名文件）
                console.error(`路径 ${currentPath} 已存在但不是文件夹，而是: ${existingItem.constructor.name}`);
                return false;
            }
            else {
                // 文件夹已存在，继续检查下一级
                console.log(`目录已存在，无需创建: ${currentPath}`);
            }
        }
        return true;
    }
    catch (error) {
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
export async function ensureFileExists(vault, path, content = '') {
    try {
        // 先检查这个路径是否有文件或目录
        const existingItem = vault.getAbstractFileByPath(path);
        // 如果已存在
        if (existingItem) {
            // 检查是否为文件而不是文件夹
            if (existingItem instanceof TFile) {
                console.log(`文件已存在，无需创建: ${path}`);
                return true; // 文件已存在，跳过创建
            }
            else {
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
        }
        catch (e) {
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
    }
    catch (error) {
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
export async function appendToFile(vault, path, content) {
    try {
        const file = vault.getAbstractFileByPath(path);
        if (file && file instanceof TFile) {
            // 文件存在，追加内容
            try {
                const currentContent = await vault.read(file);
                await vault.modify(file, currentContent + "\n\n" + content);
                return true;
            }
            catch (e) {
                console.error(`读取或修改文件时出错: ${e}`);
                return false;
            }
        }
        else {
            // 文件不存在，创建文件并写入内容
            console.log(`文件不存在，尝试创建: ${path}`);
            return await ensureFileExists(vault, path, content);
        }
    }
    catch (error) {
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
export async function fileContains(vault, path, content) {
    try {
        const file = vault.getAbstractFileByPath(path);
        if (file && file instanceof TFile) {
            try {
                const currentContent = await vault.read(file);
                return currentContent.includes(content);
            }
            catch (e) {
                console.error(`读取文件内容时出错: ${e}`);
                return false;
            }
        }
        // 文件不存在，显然不包含指定内容
        console.log(`文件不存在，无法检查内容: ${path}`);
        return false;
    }
    catch (error) {
        console.error(`Error checking file content at ${path}:`, error);
        return false;
    }
}
/**
 * 根据当前日期生成任务文件路径
 * @param rootDir 根目录
 * @returns 任务文件路径
 */
export function getTaskFilePath(rootDir) {
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
export async function todayTaskExists(vault, rootDir) {
    const taskFilePath = getTaskFilePath(rootDir);
    const date = getCurrentDate();
    // 查找文件是否存在以及是否包含今天的日期标题（包括带图标格式）
    try {
        console.log(`检查今日任务是否存在于: ${taskFilePath}`);
        // 更改检查方式：改用正则表达式匹配任何包含当前日期的标题行
        const file = vault.getAbstractFileByPath(taskFilePath);
        if (file && file instanceof TFile) {
            const content = await vault.read(file);
            const dateRegex = new RegExp(`## [^\\n]*${date}[^\\n]*\\n`);
            return dateRegex.test(content);
        }
        return false;
    }
    catch (error) {
        console.error(`检查今日任务时出错:`, error);
        return false;
    }
}
/**
 * 获取前一天的日期
 * @returns 前一天的日期，格式为YYYY-MM-DD
 */
export function getYesterdayDate() {
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
export function getYesterdayTaskFilePath(rootDir) {
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
function getMonthNameZH(monthIndex) {
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
function getMonthNameEN(monthIndex) {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return months[monthIndex];
}
/**
 * 从文件内容中提取特定日期的任务内容
 * @param {Vault} vault Obsidian保险库
 * @param {string} filePath 文件路径
 * @param {string} date 日期（YYYY-MM-DD格式）
 * @returns {Promise<string|null>} 该日期的任务内容或null
 */
async function extractTasksForDate(vault, filePath, date) {
    try {
        // 检查文件是否存在
        const file = vault.getAbstractFileByPath(filePath);
        if (!file || !(file instanceof TFile)) {
            console.log(`找不到文件: ${filePath}`);
            return null;
        }
        
        // 读取文件内容
        const content = await vault.read(file);
        
        // 寻找日期标题，支持带图标格式
        const dateHeaderRegex = new RegExp(`## [^\\n]*${date}[^\\n]*\\n(.*?)(?=\\n## |$)`, 's');
        const match = content.match(dateHeaderRegex);
        
        if (match && match[1]) {
            return match[1].trim();
        }
        
        console.log(`找不到日期 ${date} 的任务内容`);
        return null;
    } catch (error) {
        console.error(`提取任务内容时出错: ${error}`);
        return null;
    }
}
/**
 * 解析任务内容，统计总任务数和已完成任务数
 * @param taskContent 任务内容文本
 * @returns 任务统计结果 {totalTasks, completedTasks, unfinishedTasksList}
 */
export function analyzeTaskCompletion(taskContent) {
    // 默认返回结果
    const result = {
        totalTasks: 0,
        completedTasks: 0,
        unfinishedTasksList: []
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
 * 检查昨日统计信息是否已存在
 * @param vault Obsidian保险库
 * @param filePath 文件路径
 * @param date 今日日期（用于检查昨日统计）
 * @returns 是否存在昨日统计信息
 */
export async function yesterdayStatisticsExists(vault, filePath, date) {
    try {
        // 检查文件是否存在
        const file = vault.getAbstractFileByPath(filePath);
        if (!file || !(file instanceof TFile)) {
            console.log(`找不到文件: ${filePath}`);
            return false;
        }
        // 读取文件内容
        const content = await vault.read(file);
        // 寻找今日日期下的昨日统计标题，支持带图标格式
        const statisticsTitleRegex = new RegExp(`## [^\\n]*${date}[^\\n]*\\n.*?${getTranslation('statistics.title')}`, 's');
        return statisticsTitleRegex.test(content);
    }
    catch (error) {
        console.error(`检查昨日统计信息时出错: ${error}`);
        return false;
    }
}
/**
 * 生成昨日统计信息内容
 * @param tasks 任务统计对象
 * @param t 翻译函数
 * @returns 格式化的统计信息字符串
 */
export function generateStatisticsContent(tasks, t) {
    let totalTasks;
    let completedTasks;
    let unfinishedTasks = [];
    
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZmlsZVV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxhQUFhLEVBQWlCLEtBQUssRUFBRSxPQUFPLEVBQVMsTUFBTSxVQUFVLENBQUM7QUFDL0UsT0FBTyxFQUFFLGNBQWMsRUFBbUIsY0FBYyxFQUFFLHFCQUFxQixFQUFFLG9CQUFvQixFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQzNILE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFFOUM7O0dBRUc7QUFFSDs7Ozs7R0FLRztBQUNILE1BQU0sQ0FBQyxLQUFLLFVBQVUsa0JBQWtCLENBQUMsS0FBWSxFQUFFLElBQVk7SUFDL0QsSUFBSTtRQUNBLGdCQUFnQjtRQUNoQixJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBRTlDLFNBQVM7UUFDVCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDMUQsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO1FBRXJCLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFO1lBQzFCLFNBQVM7WUFDVCxJQUFJLFdBQVcsRUFBRTtnQkFDYixXQUFXLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQzthQUMvQjtpQkFBTTtnQkFDSCxXQUFXLEdBQUcsTUFBTSxDQUFDO2FBQ3hCO1lBRUQsV0FBVztZQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUU5RCxJQUFJLENBQUMsWUFBWSxFQUFFO2dCQUNmLGNBQWM7Z0JBQ2QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLFdBQVcsRUFBRSxDQUFDLENBQUM7Z0JBQzFDLElBQUk7b0JBQ0EsTUFBTSxLQUFLLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsV0FBVyxFQUFFLENBQUMsQ0FBQztpQkFDekM7Z0JBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ1Isd0JBQXdCO29CQUN4Qiw4QkFBOEI7b0JBQzlCLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzFDLGFBQWE7b0JBQ2IsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ2xFLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLENBQUMsZ0JBQWdCLFlBQVksT0FBTyxDQUFDLEVBQUU7d0JBQzdELE9BQU8sQ0FBQyxLQUFLLENBQUMsc0JBQXNCLFdBQVcsRUFBRSxDQUFDLENBQUM7d0JBQ25ELE9BQU8sS0FBSyxDQUFDO3FCQUNoQjtpQkFDSjthQUNKO2lCQUFNLElBQUksQ0FBQyxDQUFDLFlBQVksWUFBWSxPQUFPLENBQUMsRUFBRTtnQkFDM0Msc0JBQXNCO2dCQUN0QixPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sV0FBVyxrQkFBa0IsWUFBWSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRixPQUFPLEtBQUssQ0FBQzthQUNoQjtpQkFBTTtnQkFDSCxpQkFBaUI7Z0JBQ2pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxXQUFXLEVBQUUsQ0FBQyxDQUFDO2FBQzdDO1NBQ0o7UUFFRCxPQUFPLElBQUksQ0FBQztLQUNmO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLGdCQUFnQixJQUFJLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQyxPQUFPLEtBQUssQ0FBQztLQUNoQjtBQUNMLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLENBQUMsS0FBSyxVQUFVLGdCQUFnQixDQUFDLEtBQVksRUFBRSxJQUFZLEVBQUUsVUFBa0IsRUFBRTtJQUNuRixJQUFJO1FBQ0Esa0JBQWtCO1FBQ2xCLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2RCxRQUFRO1FBQ1IsSUFBSSxZQUFZLEVBQUU7WUFDZCxnQkFBZ0I7WUFDaEIsSUFBSSxZQUFZLFlBQVksS0FBSyxFQUFFO2dCQUMvQixPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDbkMsT0FBTyxJQUFJLENBQUMsQ0FBQyxhQUFhO2FBQzdCO2lCQUFNO2dCQUNILG9CQUFvQjtnQkFDcEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUkseUJBQXlCLENBQUMsQ0FBQztnQkFDbkQsT0FBTyxLQUFLLENBQUM7YUFDaEI7U0FDSjtRQUVELG1CQUFtQjtRQUNuQixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdDLElBQUksY0FBYyxHQUFHLENBQUMsRUFBRTtZQUNwQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNyRCxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksVUFBVSxFQUFFLENBQUMsQ0FBQztZQUN0QyxNQUFNLFlBQVksR0FBRyxNQUFNLGtCQUFrQixDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNqRSxJQUFJLENBQUMsWUFBWSxFQUFFO2dCQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsY0FBYyxVQUFVLEVBQUUsQ0FBQyxDQUFDO2dCQUMxQyxPQUFPLEtBQUssQ0FBQzthQUNoQjtTQUNKO1FBRUQsT0FBTztRQUNQLElBQUk7WUFDQSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMvQixNQUFNLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQy9CLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNSLHVCQUF1QjtZQUN2QiwwQkFBMEI7WUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFL0IsYUFBYTtZQUNiLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6RCxJQUFJLGNBQWMsSUFBSSxjQUFjLFlBQVksS0FBSyxFQUFFO2dCQUNuRCxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxPQUFPLElBQUksQ0FBQzthQUNmO1lBRUQsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLElBQUksRUFBRSxDQUFDLENBQUM7WUFDbkMsT0FBTyxLQUFLLENBQUM7U0FDaEI7S0FDSjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDL0MsT0FBTyxLQUFLLENBQUM7S0FDaEI7QUFDTCxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxZQUFZLENBQUMsS0FBWSxFQUFFLElBQVksRUFBRSxPQUFlO0lBQzFFLElBQUk7UUFDQSxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0MsSUFBSSxJQUFJLElBQUksSUFBSSxZQUFZLEtBQUssRUFBRTtZQUMvQixZQUFZO1lBQ1osSUFBSTtnQkFDQSxNQUFNLGNBQWMsR0FBRyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzlDLE1BQU0sS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsY0FBYyxHQUFHLE1BQU0sR0FBRyxPQUFPLENBQUMsQ0FBQztnQkFDNUQsT0FBTyxJQUFJLENBQUM7YUFDZjtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNsQyxPQUFPLEtBQUssQ0FBQzthQUNoQjtTQUNKO2FBQU07WUFDSCxrQkFBa0I7WUFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksRUFBRSxDQUFDLENBQUM7WUFDbkMsT0FBTyxNQUFNLGdCQUFnQixDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDdkQ7S0FDSjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsSUFBSSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDNUQsT0FBTyxLQUFLLENBQUM7S0FDaEI7QUFDTCxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxZQUFZLENBQUMsS0FBWSxFQUFFLElBQVksRUFBRSxPQUFlO0lBQzFFLElBQUk7UUFDQSxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0MsSUFBSSxJQUFJLElBQUksSUFBSSxZQUFZLEtBQUssRUFBRTtZQUMvQixJQUFJO2dCQUNBLE1BQU0sY0FBYyxHQUFHLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUMsT0FBTyxjQUFjLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQzNDO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ1IsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2pDLE9BQU8sS0FBSyxDQUFDO2FBQ2hCO1NBQ0o7UUFDRCxrQkFBa0I7UUFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNyQyxPQUFPLEtBQUssQ0FBQztLQUNoQjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxrQ0FBa0MsSUFBSSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEUsT0FBTyxLQUFLLENBQUM7S0FDaEI7QUFDTCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQUMsT0FBZTtJQUMzQyxNQUFNLElBQUksR0FBRyxjQUFjLEVBQUUsQ0FBQztJQUU5QixrQkFBa0I7SUFDbEIsTUFBTSxTQUFTLEdBQUcsb0JBQW9CLEVBQUUsQ0FBQztJQUN6QyxNQUFNLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUVuRCxtQkFBbUI7SUFDbkIsT0FBTyxhQUFhLENBQUMsR0FBRyxPQUFPLElBQUksSUFBSSxJQUFJLFNBQVMsS0FBSyxDQUFDLENBQUM7QUFDL0QsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxlQUFlLENBQUMsS0FBWSxFQUFFLE9BQWU7SUFDL0QsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLE1BQU0sSUFBSSxHQUFHLGNBQWMsRUFBRSxDQUFDO0lBRTlCLHdCQUF3QjtJQUN4QixJQUFJO1FBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUM1QyxPQUFPLE1BQU0sWUFBWSxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0tBQ2hFO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNuQyxPQUFPLEtBQUssQ0FBQztLQUNoQjtBQUNMLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCO0lBQzVCLE1BQU0sS0FBSyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7SUFDekIsTUFBTSxTQUFTLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFdkMsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3JDLE1BQU0sS0FBSyxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDckUsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFFNUQsT0FBTyxHQUFHLElBQUksSUFBSSxLQUFLLElBQUksR0FBRyxFQUFFLENBQUM7QUFDckMsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsT0FBZTtJQUNwRCxNQUFNLFNBQVMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQzdCLFNBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRTNDLE1BQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNoRCxNQUFNLFNBQVMsR0FBRyxvQkFBb0IsRUFBRSxDQUFDO0lBRXpDLGFBQWE7SUFDYixNQUFNLEtBQUssR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3BDLE1BQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUU1Qyx5QkFBeUI7SUFDekIsTUFBTSxRQUFRLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUM1QixRQUFRLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBRWxDLHNCQUFzQjtJQUN0QixNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsQ0FBQztRQUN6QixjQUFjLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUNoQyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7SUFFbkMsT0FBTyxhQUFhLENBQUMsR0FBRyxPQUFPLElBQUksSUFBSSxJQUFJLFNBQVMsS0FBSyxDQUFDLENBQUM7QUFDL0QsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLGNBQWMsQ0FBQyxVQUFrQjtJQUN0QyxNQUFNLE1BQU0sR0FBRztRQUNYLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSTtRQUNsQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUs7S0FDeEMsQ0FBQztJQUNGLE9BQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlCLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxjQUFjLENBQUMsVUFBa0I7SUFDdEMsTUFBTSxNQUFNLEdBQUc7UUFDWCxTQUFTLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU07UUFDdEQsTUFBTSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxVQUFVO0tBQ25FLENBQUM7SUFDRixPQUFPLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5QixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxtQkFBbUIsQ0FBQyxLQUFZLEVBQUUsUUFBZ0IsRUFBRSxJQUFZO0lBQ2xGLElBQUk7UUFDQSxXQUFXO1FBQ1gsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksWUFBWSxLQUFLLENBQUMsRUFBRTtZQUNuQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNsQyxPQUFPLElBQUksQ0FBQztTQUNmO1FBRUQsU0FBUztRQUNULE1BQU0sT0FBTyxHQUFHLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2QyxTQUFTO1FBQ1QsTUFBTSxlQUFlLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxJQUFJLDBCQUEwQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzlFLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFFN0MsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ25CLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQzFCO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUksUUFBUSxDQUFDLENBQUM7UUFDbkMsT0FBTyxJQUFJLENBQUM7S0FDZjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFjLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDckMsT0FBTyxJQUFJLENBQUM7S0FDZjtBQUNMLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQixDQUFDLFdBQW1CO0lBS3JELFNBQVM7SUFDVCxNQUFNLE1BQU0sR0FBRztRQUNYLFVBQVUsRUFBRSxDQUFDO1FBQ2IsY0FBYyxFQUFFLENBQUM7UUFDakIsbUJBQW1CLEVBQUUsRUFBYztLQUN0QyxDQUFDO0lBRUYsSUFBSSxDQUFDLFdBQVcsRUFBRTtRQUNkLE9BQU8sTUFBTSxDQUFDO0tBQ2pCO0lBRUQscUJBQXFCO0lBQ3JCLE1BQU0sYUFBYSxHQUFHLHNCQUFzQixDQUFDO0lBQzdDLE1BQU0sbUJBQW1CLEdBQUcsaUJBQWlCLENBQUM7SUFDOUMsTUFBTSxvQkFBb0IsR0FBRyxpQkFBaUIsQ0FBQztJQUUvQyxTQUFTO0lBQ1QsTUFBTSxlQUFlLEdBQUcsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUNqRSxNQUFNLENBQUMsVUFBVSxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUM7SUFFM0MsV0FBVztJQUNYLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO0lBQzdFLE1BQU0sQ0FBQyxjQUFjLEdBQUcscUJBQXFCLENBQUMsTUFBTSxDQUFDO0lBRXJELFlBQVk7SUFDWixNQUFNLHNCQUFzQixHQUFHLENBQUMsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztJQUMvRSxNQUFNLENBQUMsbUJBQW1CLEdBQUcsc0JBQXNCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFFbEYsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILE1BQU0sQ0FBQyxLQUFLLFVBQVUseUJBQXlCLENBQUMsS0FBWSxFQUFFLFFBQWdCLEVBQUUsSUFBWTtJQUN4RixJQUFJO1FBQ0EsV0FBVztRQUNYLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLFlBQVksS0FBSyxDQUFDLEVBQUU7WUFDbkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDbEMsT0FBTyxLQUFLLENBQUM7U0FDaEI7UUFFRCxTQUFTO1FBQ1QsTUFBTSxPQUFPLEdBQUcsTUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXZDLGlCQUFpQjtRQUNqQixNQUFNLG9CQUFvQixHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sSUFBSSxjQUFjLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDM0csT0FBTyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDN0M7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDdkMsT0FBTyxLQUFLLENBQUM7S0FDaEI7QUFDTCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxTQUl6QztJQUNHLGlCQUFpQjtJQUNqQixNQUFNLGNBQWMsR0FBRyxTQUFTLENBQUMsVUFBVSxHQUFHLENBQUM7UUFDM0MsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDckUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVSLG9CQUFvQjtJQUNwQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDcEUsTUFBTSxrQkFBa0IsR0FBRyxTQUFTLENBQUMsbUJBQW1CO1NBQ25ELEtBQUssQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDO1NBQ25CLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUM7U0FDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRWhCLFNBQVM7SUFDVCxPQUFPLE9BQU8sY0FBYyxDQUFDLGtCQUFrQixDQUFDOzs7TUFHOUMsY0FBYyxDQUFDLHVCQUF1QixDQUFDLE9BQU8sU0FBUyxDQUFDLFVBQVU7TUFDbEUsY0FBYyxDQUFDLDJCQUEyQixDQUFDLE9BQU8sU0FBUyxDQUFDLGNBQWM7TUFDMUUsY0FBYyxDQUFDLDJCQUEyQixDQUFDLE9BQU8sY0FBYzs7RUFFcEUsU0FBUyxDQUFDLG1CQUFtQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsY0FBYyxDQUFDLHdCQUF3QixDQUFDOzs7RUFHM0Ysa0JBQWtCO0VBQ2xCLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEdBQUcsU0FBUyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUU7Q0FDaEksQ0FBQyxDQUFDLENBQUMsRUFBRTtDQUNMLENBQUM7QUFDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbm9ybWFsaXplUGF0aCwgVEFic3RyYWN0RmlsZSwgVEZpbGUsIFRGb2xkZXIsIFZhdWx0IH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBnZXRDdXJyZW50RGF0ZSwgZ2V0Q3VycmVudE1vbnRoLCBnZXRDdXJyZW50WWVhciwgZ2V0TG9jYWxpemVkTW9udGhOYW1lLCBpc0VuZ2xpc2hFbnZpcm9ubWVudCB9IGZyb20gXCIuL2RhdGVVdGlsc1wiO1xuaW1wb3J0IHsgZ2V0VHJhbnNsYXRpb24gfSBmcm9tICcuLi9pMThuL2kxOG4nO1xuXG4vKipcbiAqIOaWh+S7tuaTjeS9nOW3peWFt+WHveaVsFxuICovXG5cbi8qKlxuICog56Gu5L+d55uu5b2V5a2Y5Zyo77yM5aaC5p6c5LiN5a2Y5Zyo5YiZ5Yib5bu6XG4gKiBAcGFyYW0gdmF1bHQgT2JzaWRpYW7mlofku7bns7vnu59cbiAqIEBwYXJhbSBwYXRoIOebruW9lei3r+W+hFxuICogQHJldHVybnMg5piv5ZCm5oiQ5Yqf5Yib5bu65oiW5bey5a2Y5ZyoXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVGb2xkZXJFeGlzdHModmF1bHQ6IFZhdWx0LCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgICAvLyDnoa7kv53ot6/lvoTku6Uv57uT5bC+77yM5L6/5LqO5aSE55CGXG4gICAgICAgIHBhdGggPSBwYXRoLmVuZHNXaXRoKCcvJykgPyBwYXRoIDogcGF0aCArICcvJztcblxuICAgICAgICAvLyDpgJDnuqfliJvlu7rnm67lvZVcbiAgICAgICAgY29uc3QgZm9sZGVycyA9IHBhdGguc3BsaXQoJy8nKS5maWx0ZXIocCA9PiBwLmxlbmd0aCA+IDApO1xuICAgICAgICBsZXQgY3VycmVudFBhdGggPSAnJztcbiAgICAgICAgXG4gICAgICAgIGZvciAoY29uc3QgZm9sZGVyIG9mIGZvbGRlcnMpIHtcbiAgICAgICAgICAgIC8vIOabtOaWsOW9k+WJjei3r+W+hFxuICAgICAgICAgICAgaWYgKGN1cnJlbnRQYXRoKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFBhdGggKz0gJy8nICsgZm9sZGVyO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UGF0aCA9IGZvbGRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5qOA5p+l6Lev5b6E5piv5ZCm5a2Y5ZyoXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg5qOA5p+l55uu5b2VOiAke2N1cnJlbnRQYXRofWApO1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdJdGVtID0gdmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGN1cnJlbnRQYXRoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCFleGlzdGluZ0l0ZW0pIHtcbiAgICAgICAgICAgICAgICAvLyDot6/lvoTkuI3lrZjlnKjvvIzliJvlu7rmlofku7blpLlcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg55uu5b2V5LiN5a2Y5Zyo77yM5q2j5Zyo5Yib5bu6OiAke2N1cnJlbnRQYXRofWApO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHZhdWx0LmNyZWF0ZUZvbGRlcihjdXJyZW50UGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDnm67lvZXliJvlu7rmiJDlip86ICR7Y3VycmVudFBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyDmjZXojrflj6/og73nmoRcIuaWh+S7tuWkueW3suWtmOWcqFwi6ZSZ6K+v77yM5L2G57un57ut5omn6KGMXG4gICAgICAgICAgICAgICAgICAgIC8vIOi/memHjOWkhOeQhuWPr+iDveeahOernuaAgeadoeS7tu+8muajgOafpeS4jeWtmOWcqOS9huWIm+W7uuaXtuW3suWtmOWcqOeahOaDheWGtVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5Yib5bu655uu5b2V5pe25Ye6546w5byC5bi477yM5Y+v6IO95bey6KKr5YW25LuW6L+b56iL5Yib5bu6OiAke2V9YCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWGjeasoeajgOafpeebruW9leaYr+WQpuWtmOWcqFxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmb2xkZXJBZnRlckVycm9yID0gdmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGN1cnJlbnRQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmb2xkZXJBZnRlckVycm9yIHx8ICEoZm9sZGVyQWZ0ZXJFcnJvciBpbnN0YW5jZW9mIFRGb2xkZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGDnm67lvZXliJvlu7rlpLHotKXvvIzkuJTml6Dms5Xnoa7orqTnm67lvZXlt7LlrZjlnKg6ICR7Y3VycmVudFBhdGh9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCEoZXhpc3RpbmdJdGVtIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcbiAgICAgICAgICAgICAgICAvLyDot6/lvoTlrZjlnKjkvYbkuI3mmK/mlofku7blpLnvvIjlj6/og73mmK/lkIzlkI3mlofku7bvvIlcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGDot6/lvoQgJHtjdXJyZW50UGF0aH0g5bey5a2Y5Zyo5L2G5LiN5piv5paH5Lu25aS577yM6ICM5pivOiAke2V4aXN0aW5nSXRlbS5jb25zdHJ1Y3Rvci5uYW1lfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g5paH5Lu25aS55bey5a2Y5Zyo77yM57un57ut5qOA5p+l5LiL5LiA57qnXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOebruW9leW3suWtmOWcqO+8jOaXoOmcgOWIm+W7ujogJHtjdXJyZW50UGF0aH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihg5Yib5bu655uu5b2V5pe25Ye6546w5pyq6aKE5pyf6ZSZ6K+vKCR7cGF0aH0pOmAsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuLyoqXG4gKiDnoa7kv53mlofku7blrZjlnKjvvIzlpoLmnpzkuI3lrZjlnKjliJnliJvlu7pcbiAqIEBwYXJhbSB2YXVsdCBPYnNpZGlhbuaWh+S7tuezu+e7n1xuICogQHBhcmFtIHBhdGgg5paH5Lu26Lev5b6EXG4gKiBAcGFyYW0gY29udGVudCDmlofku7blhoXlrrlcbiAqIEByZXR1cm5zIOaYr+WQpuaIkOWKn+WIm+W7uuaIluW3suWtmOWcqFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlRmlsZUV4aXN0cyh2YXVsdDogVmF1bHQsIHBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nID0gJycpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgICAvLyDlhYjmo4Dmn6Xov5nkuKrot6/lvoTmmK/lkKbmnInmlofku7bmiJbnm67lvZVcbiAgICAgICAgY29uc3QgZXhpc3RpbmdJdGVtID0gdmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5bey5a2Y5ZyoXG4gICAgICAgIGlmIChleGlzdGluZ0l0ZW0pIHtcbiAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuS4uuaWh+S7tuiAjOS4jeaYr+aWh+S7tuWkuVxuICAgICAgICAgICAgaWYgKGV4aXN0aW5nSXRlbSBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOaWh+S7tuW3suWtmOWcqO+8jOaXoOmcgOWIm+W7ujogJHtwYXRofWApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyDmlofku7blt7LlrZjlnKjvvIzot7Pov4fliJvlu7pcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g5a2Y5Zyo5L2G5LiN5piv5paH5Lu277yI5Y+v6IO95piv5ZCM5ZCN5paH5Lu25aS577yJXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihg6Lev5b6EICR7cGF0aH0g5a2Y5Zyo5L2G5LiN5piv5paH5Lu277yM5peg5rOV5Yib5bu65paH5Lu277yM5Y+v6IO95piv5ZCM5ZCN55uu5b2VYCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmlofku7bkuI3lrZjlnKjvvIzmo4Dmn6XniLbmlofku7blpLnmmK/lkKblrZjlnKhcbiAgICAgICAgY29uc3QgbGFzdFNsYXNoSW5kZXggPSBwYXRoLmxhc3RJbmRleE9mKCcvJyk7XG4gICAgICAgIGlmIChsYXN0U2xhc2hJbmRleCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudFBhdGggPSBwYXRoLnN1YnN0cmluZygwLCBsYXN0U2xhc2hJbmRleCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg5qOA5p+l5paH5Lu254i255uu5b2VOiAke3BhcmVudFBhdGh9YCk7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnRFeGlzdHMgPSBhd2FpdCBlbnN1cmVGb2xkZXJFeGlzdHModmF1bHQsIHBhcmVudFBhdGgpO1xuICAgICAgICAgICAgaWYgKCFwYXJlbnRFeGlzdHMpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGDml6Dms5Xnoa7kv53niLbnm67lvZXlrZjlnKg6ICR7cGFyZW50UGF0aH1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDliJvlu7rmlofku7ZcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDlvIDlp4vliJvlu7rmlofku7Y6ICR7cGF0aH1gKTtcbiAgICAgICAgICAgIGF3YWl0IHZhdWx0LmNyZWF0ZShwYXRoLCBjb250ZW50KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDmlofku7bliJvlu7rmiJDlip86ICR7cGF0aH1gKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyDlpoLmnpzliJvlu7rml7bmiqXplJnvvIzlho3mrKHmo4Dmn6Xmlofku7bmmK/lkKblt7LooqvliJvlu7pcbiAgICAgICAgICAgIC8vIOi/meWPr+iDveaYr+eUseS6juernuaAgeadoeS7tuaIluWFtuS7lui/m+eoi+WQjOaXtuWIm+W7uuS6huivpeaWh+S7tlxuICAgICAgICAgICAgY29uc29sZS5sb2coYOWIm+W7uuaWh+S7tuaXtuWHuueOsOW8guW4uDogJHtlfWApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlho3mrKHmo4Dmn6Xmlofku7bmmK/lkKblrZjlnKhcbiAgICAgICAgICAgIGNvbnN0IGZpbGVBZnRlckVycm9yID0gdmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgICAgICAgICAgaWYgKGZpbGVBZnRlckVycm9yICYmIGZpbGVBZnRlckVycm9yIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5bC9566h5Ye6546w5byC5bi477yM5L2G5paH5Lu25bey5a2Y5Zyo77yM5Y+v6IO96KKr5YW25LuW6L+b56iL5Yib5bu6OiAke3BhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOaWh+S7tuWIm+W7uuacgOe7iOWksei0pTogJHtwYXRofWApO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihg5Yib5bu65paH5Lu25pe25Ye6546w5pyq6aKE5pyf6ZSZ6K+vKCR7cGF0aH0pOmAsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuLyoqXG4gKiDlkJHmlofku7bov73liqDlhoXlrrlcbiAqIEBwYXJhbSB2YXVsdCBPYnNpZGlhbuaWh+S7tuezu+e7n1xuICogQHBhcmFtIHBhdGgg5paH5Lu26Lev5b6EXG4gKiBAcGFyYW0gY29udGVudCDopoHov73liqDnmoTlhoXlrrlcbiAqIEByZXR1cm5zIOaYr+WQpuaIkOWKn+i/veWKoFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXBwZW5kVG9GaWxlKHZhdWx0OiBWYXVsdCwgcGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBmaWxlID0gdmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgICAgICBpZiAoZmlsZSAmJiBmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgICAgICAgIC8vIOaWh+S7tuWtmOWcqO+8jOi/veWKoOWGheWuuVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50Q29udGVudCA9IGF3YWl0IHZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdmF1bHQubW9kaWZ5KGZpbGUsIGN1cnJlbnRDb250ZW50ICsgXCJcXG5cXG5cIiArIGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOivu+WPluaIluS/ruaUueaWh+S7tuaXtuWHuumUmTogJHtlfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOaWh+S7tuS4jeWtmOWcqO+8jOWIm+W7uuaWh+S7tuW5tuWGmeWFpeWGheWuuVxuICAgICAgICAgICAgY29uc29sZS5sb2coYOaWh+S7tuS4jeWtmOWcqO+8jOWwneivleWIm+W7ujogJHtwYXRofWApO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGVuc3VyZUZpbGVFeGlzdHModmF1bHQsIHBhdGgsIGNvbnRlbnQpO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgYXBwZW5kaW5nIHRvIGZpbGUgYXQgJHtwYXRofTpgLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbi8qKlxuICog5qOA5p+l5paH5Lu25Lit5piv5ZCm5YyF5ZCr5oyH5a6a5YaF5a65XG4gKiBAcGFyYW0gdmF1bHQgT2JzaWRpYW7mlofku7bns7vnu59cbiAqIEBwYXJhbSBwYXRoIOaWh+S7tui3r+W+hFxuICogQHBhcmFtIGNvbnRlbnQg6KaB5qOA5p+l55qE5YaF5a65XG4gKiBAcmV0dXJucyDmmK/lkKbljIXlkKvmjIflrprlhoXlrrlcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZpbGVDb250YWlucyh2YXVsdDogVmF1bHQsIHBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcbiAgICAgICAgaWYgKGZpbGUgJiYgZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRDb250ZW50ID0gYXdhaXQgdmF1bHQucmVhZChmaWxlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudENvbnRlbnQuaW5jbHVkZXMoY29udGVudCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihg6K+75Y+W5paH5Lu25YaF5a655pe25Ye66ZSZOiAke2V9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIOaWh+S7tuS4jeWtmOWcqO+8jOaYvueEtuS4jeWMheWQq+aMh+WumuWGheWuuVxuICAgICAgICBjb25zb2xlLmxvZyhg5paH5Lu25LiN5a2Y5Zyo77yM5peg5rOV5qOA5p+l5YaF5a65OiAke3BhdGh9YCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBjaGVja2luZyBmaWxlIGNvbnRlbnQgYXQgJHtwYXRofTpgLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbi8qKlxuICog5qC55o2u5b2T5YmN5pel5pyf55Sf5oiQ5Lu75Yqh5paH5Lu26Lev5b6EXG4gKiBAcGFyYW0gcm9vdERpciDmoLnnm67lvZVcbiAqIEByZXR1cm5zIOS7u+WKoeaWh+S7tui3r+W+hFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGFza0ZpbGVQYXRoKHJvb3REaXI6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgeWVhciA9IGdldEN1cnJlbnRZZWFyKCk7XG4gICAgXG4gICAgLy8g5qC55o2u546v5aKD6YCJ5oup5LiN5ZCM55qE5pyI5Lu95ZG95ZCN5pa55byPXG4gICAgY29uc3QgaXNFbmdsaXNoID0gaXNFbmdsaXNoRW52aXJvbm1lbnQoKTtcbiAgICBjb25zdCBtb250aE5hbWUgPSBnZXRMb2NhbGl6ZWRNb250aE5hbWUoaXNFbmdsaXNoKTtcbiAgICBcbiAgICAvLyDkvb/nlKjmnKzlnLDljJbnmoTmnIjku73lkI3np7DnlJ/miJDmlofku7bot6/lvoRcbiAgICByZXR1cm4gbm9ybWFsaXplUGF0aChgJHtyb290RGlyfS8ke3llYXJ9LyR7bW9udGhOYW1lfS5tZGApO1xufVxuXG4vKipcbiAqIOajgOafpeS7iuaXpeS7u+WKoeaYr+WQpuW3suWtmOWcqFxuICogQHBhcmFtIHZhdWx0IE9ic2lkaWFu5paH5Lu257O757ufXG4gKiBAcGFyYW0gcm9vdERpciDmoLnnm67lvZVcbiAqIEByZXR1cm5zIOaYr+WQpuW3suWtmOWcqFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdG9kYXlUYXNrRXhpc3RzKHZhdWx0OiBWYXVsdCwgcm9vdERpcjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgdGFza0ZpbGVQYXRoID0gZ2V0VGFza0ZpbGVQYXRoKHJvb3REaXIpO1xuICAgIGNvbnN0IGRhdGUgPSBnZXRDdXJyZW50RGF0ZSgpO1xuICAgIFxuICAgIC8vIOafpeaJvuaWh+S7tuaYr+WQpuWtmOWcqOS7peWPiuaYr+WQpuWMheWQq+S7iuWkqeeahOaXpeacn+agh+mimFxuICAgIHRyeSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGDmo4Dmn6Xku4rml6Xku7vliqHmmK/lkKblrZjlnKjkuo46ICR7dGFza0ZpbGVQYXRofWApO1xuICAgICAgICByZXR1cm4gYXdhaXQgZmlsZUNvbnRhaW5zKHZhdWx0LCB0YXNrRmlsZVBhdGgsIGAjIyAke2RhdGV9YCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihg5qOA5p+l5LuK5pel5Lu75Yqh5pe25Ye66ZSZOmAsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuLyoqXG4gKiDojrflj5bliY3kuIDlpKnnmoTml6XmnJ9cbiAqIEByZXR1cm5zIOWJjeS4gOWkqeeahOaXpeacn++8jOagvOW8j+S4ullZWVktTU0tRERcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFllc3RlcmRheURhdGUoKTogc3RyaW5nIHtcbiAgICBjb25zdCB0b2RheSA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgeWVzdGVyZGF5ID0gbmV3IERhdGUodG9kYXkpO1xuICAgIHllc3RlcmRheS5zZXREYXRlKHRvZGF5LmdldERhdGUoKSAtIDEpO1xuICAgIFxuICAgIGNvbnN0IHllYXIgPSB5ZXN0ZXJkYXkuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCBtb250aCA9ICh5ZXN0ZXJkYXkuZ2V0TW9udGgoKSArIDEpLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKTtcbiAgICBjb25zdCBkYXkgPSB5ZXN0ZXJkYXkuZ2V0RGF0ZSgpLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKTtcbiAgICBcbiAgICByZXR1cm4gYCR7eWVhcn0tJHttb250aH0tJHtkYXl9YDtcbn1cblxuLyoqXG4gKiDojrflj5bliY3kuIDlpKnnmoTku7vliqHmlofku7bot6/lvoRcbiAqIEBwYXJhbSByb290RGlyIOagueebruW9lVxuICogQHJldHVybnMg5YmN5LiA5aSp5Lu75Yqh5paH5Lu255qE6Lev5b6EXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRZZXN0ZXJkYXlUYXNrRmlsZVBhdGgocm9vdERpcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCB5ZXN0ZXJkYXkgPSBuZXcgRGF0ZSgpO1xuICAgIHllc3RlcmRheS5zZXREYXRlKHllc3RlcmRheS5nZXREYXRlKCkgLSAxKTtcbiAgICBcbiAgICBjb25zdCB5ZWFyID0geWVzdGVyZGF5LmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKTtcbiAgICBjb25zdCBpc0VuZ2xpc2ggPSBpc0VuZ2xpc2hFbnZpcm9ubWVudCgpO1xuICAgIFxuICAgIC8vIOiOt+WPluacrOWcsOWMlueahOaciOS7veWQjeensFxuICAgIGNvbnN0IG1vbnRoID0gbmV3IERhdGUoKS5nZXRNb250aCgpO1xuICAgIGNvbnN0IHllc3RlcmRheU1vbnRoID0geWVzdGVyZGF5LmdldE1vbnRoKCk7XG4gICAgXG4gICAgLy8g5Yib5bu65LiA5Liq5Li05pe2RGF0ZeWvueixoeeUqOS6juiOt+WPluWJjeS4gOWkqeeahOaciOS7vVxuICAgIGNvbnN0IHRlbXBEYXRlID0gbmV3IERhdGUoKTtcbiAgICB0ZW1wRGF0ZS5zZXRNb250aCh5ZXN0ZXJkYXlNb250aCk7XG4gICAgXG4gICAgLy8g5Yik5pat5piv5ZCm5Li66Iux5paH546v5aKD77yM6I635Y+W5a+55bqU55qE5pyI5Lu95ZCN56ewXG4gICAgY29uc3QgbW9udGhOYW1lID0gaXNFbmdsaXNoID8gXG4gICAgICAgIGdldE1vbnRoTmFtZUVOKHllc3RlcmRheU1vbnRoKSA6IFxuICAgICAgICBnZXRNb250aE5hbWVaSCh5ZXN0ZXJkYXlNb250aCk7XG4gICAgXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVBhdGgoYCR7cm9vdERpcn0vJHt5ZWFyfS8ke21vbnRoTmFtZX0ubWRgKTtcbn1cblxuLyoqXG4gKiDojrflj5bkuK3mlofmnIjku73lkI3np7BcbiAqIEBwYXJhbSBtb250aEluZGV4IOaciOS7vee0ouW8le+8iDAtMTHvvIlcbiAqIEByZXR1cm5zIOS4reaWh+aciOS7veWQjeensFxuICovXG5mdW5jdGlvbiBnZXRNb250aE5hbWVaSChtb250aEluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1vbnRocyA9IFtcbiAgICAgICAgXCIx5pyIXCIsIFwiMuaciFwiLCBcIjPmnIhcIiwgXCI05pyIXCIsIFwiNeaciFwiLCBcIjbmnIhcIixcbiAgICAgICAgXCI35pyIXCIsIFwiOOaciFwiLCBcIjnmnIhcIiwgXCIxMOaciFwiLCBcIjEx5pyIXCIsIFwiMTLmnIhcIlxuICAgIF07XG4gICAgcmV0dXJuIG1vbnRoc1ttb250aEluZGV4XTtcbn1cblxuLyoqXG4gKiDojrflj5boi7HmlofmnIjku73lkI3np7BcbiAqIEBwYXJhbSBtb250aEluZGV4IOaciOS7vee0ouW8le+8iDAtMTHvvIlcbiAqIEByZXR1cm5zIOiLseaWh+aciOS7veWQjeensFxuICovXG5mdW5jdGlvbiBnZXRNb250aE5hbWVFTihtb250aEluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1vbnRocyA9IFtcbiAgICAgICAgXCJKYW51YXJ5XCIsIFwiRmVicnVhcnlcIiwgXCJNYXJjaFwiLCBcIkFwcmlsXCIsIFwiTWF5XCIsIFwiSnVuZVwiLFxuICAgICAgICBcIkp1bHlcIiwgXCJBdWd1c3RcIiwgXCJTZXB0ZW1iZXJcIiwgXCJPY3RvYmVyXCIsIFwiTm92ZW1iZXJcIiwgXCJEZWNlbWJlclwiXG4gICAgXTtcbiAgICByZXR1cm4gbW9udGhzW21vbnRoSW5kZXhdO1xufVxuXG4vKipcbiAqIOS7juaWh+S7tuWGheWuueS4reaPkOWPlueJueWumuaXpeacn+eahOS7u+WKoeWGheWuuVxuICogQHBhcmFtIHZhdWx0IE9ic2lkaWFu5L+d6Zmp5bqTXG4gKiBAcGFyYW0gZmlsZVBhdGgg5paH5Lu26Lev5b6EXG4gKiBAcGFyYW0gZGF0ZSDml6XmnJ/vvIhZWVlZLU1NLURE5qC85byP77yJXG4gKiBAcmV0dXJucyDor6Xml6XmnJ/nmoTku7vliqHlhoXlrrnmiJZudWxsXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHRyYWN0VGFza3NGb3JEYXRlKHZhdWx0OiBWYXVsdCwgZmlsZVBhdGg6IHN0cmluZywgZGF0ZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgdHJ5IHtcbiAgICAgICAgLy8g5qOA5p+l5paH5Lu25piv5ZCm5a2Y5ZyoXG4gICAgICAgIGNvbnN0IGZpbGUgPSB2YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZmlsZVBhdGgpO1xuICAgICAgICBpZiAoIWZpbGUgfHwgIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg5om+5LiN5Yiw5paH5Lu2OiAke2ZpbGVQYXRofWApO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOivu+WPluaWh+S7tuWGheWuuVxuICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdmF1bHQucmVhZChmaWxlKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWvu+aJvuaXpeacn+agh+mimFxuICAgICAgICBjb25zdCBkYXRlSGVhZGVyUmVnZXggPSBuZXcgUmVnRXhwKGAjIyAke2RhdGV9W15cXG5dKlxcbiguKj8pKD89XFxuIyMgfCQpYCwgJ3MnKTtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBjb250ZW50Lm1hdGNoKGRhdGVIZWFkZXJSZWdleCk7XG4gICAgICAgIFxuICAgICAgICBpZiAobWF0Y2ggJiYgbWF0Y2hbMV0pIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaFsxXS50cmltKCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKGDmib7kuI3liLDml6XmnJ8gJHtkYXRlfSDnmoTku7vliqHlhoXlrrlgKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihg5o+Q5Y+W5Lu75Yqh5YaF5a655pe25Ye66ZSZOiAke2Vycm9yfWApO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cbi8qKlxuICog6Kej5p6Q5Lu75Yqh5YaF5a6577yM57uf6K6h5oC75Lu75Yqh5pWw5ZKM5bey5a6M5oiQ5Lu75Yqh5pWwXG4gKiBAcGFyYW0gdGFza0NvbnRlbnQg5Lu75Yqh5YaF5a655paH5pysXG4gKiBAcmV0dXJucyDku7vliqHnu5/orqHnu5Pmnpwge3RvdGFsVGFza3MsIGNvbXBsZXRlZFRhc2tzLCB1bmZpbmlzaGVkVGFza3NMaXN0fVxuICovXG5leHBvcnQgZnVuY3Rpb24gYW5hbHl6ZVRhc2tDb21wbGV0aW9uKHRhc2tDb250ZW50OiBzdHJpbmcpOiB7XG4gICAgdG90YWxUYXNrczogbnVtYmVyO1xuICAgIGNvbXBsZXRlZFRhc2tzOiBudW1iZXI7XG4gICAgdW5maW5pc2hlZFRhc2tzTGlzdDogc3RyaW5nW107XG59IHtcbiAgICAvLyDpu5jorqTov5Tlm57nu5PmnpxcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICAgIHRvdGFsVGFza3M6IDAsXG4gICAgICAgIGNvbXBsZXRlZFRhc2tzOiAwLFxuICAgICAgICB1bmZpbmlzaGVkVGFza3NMaXN0OiBbXSBhcyBzdHJpbmdbXVxuICAgIH07XG4gICAgXG4gICAgaWYgKCF0YXNrQ29udGVudCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBcbiAgICAvLyDljLnphY3miYDmnInku7vliqHooYzvvIjljIXmi6zlt7LlrozmiJDlkozmnKrlrozmiJDvvIlcbiAgICBjb25zdCBhbGxUYXNrc1JlZ2V4ID0gLy0gXFxbKFsgeF0pXFxdICguKykkL2dtO1xuICAgIGNvbnN0IGNvbXBsZXRlZFRhc2tzUmVnZXggPSAvLSBcXFt4XFxdICguKykkL2dtO1xuICAgIGNvbnN0IHVuZmluaXNoZWRUYXNrc1JlZ2V4ID0gLy0gXFxbIFxcXSAoLispJC9nbTtcbiAgICBcbiAgICAvLyDnu5/orqHmgLvku7vliqHmlbBcbiAgICBjb25zdCBhbGxUYXNrc01hdGNoZXMgPSBbLi4udGFza0NvbnRlbnQubWF0Y2hBbGwoYWxsVGFza3NSZWdleCldO1xuICAgIHJlc3VsdC50b3RhbFRhc2tzID0gYWxsVGFza3NNYXRjaGVzLmxlbmd0aDtcbiAgICBcbiAgICAvLyDnu5/orqHlt7LlrozmiJDku7vliqHmlbBcbiAgICBjb25zdCBjb21wbGV0ZWRUYXNrc01hdGNoZXMgPSBbLi4udGFza0NvbnRlbnQubWF0Y2hBbGwoY29tcGxldGVkVGFza3NSZWdleCldO1xuICAgIHJlc3VsdC5jb21wbGV0ZWRUYXNrcyA9IGNvbXBsZXRlZFRhc2tzTWF0Y2hlcy5sZW5ndGg7XG4gICAgXG4gICAgLy8g5o+Q5Y+W5pyq5a6M5oiQ5Lu75Yqh5YaF5a65XG4gICAgY29uc3QgdW5maW5pc2hlZFRhc2tzTWF0Y2hlcyA9IFsuLi50YXNrQ29udGVudC5tYXRjaEFsbCh1bmZpbmlzaGVkVGFza3NSZWdleCldO1xuICAgIHJlc3VsdC51bmZpbmlzaGVkVGFza3NMaXN0ID0gdW5maW5pc2hlZFRhc2tzTWF0Y2hlcy5tYXAobWF0Y2ggPT4gbWF0Y2hbMV0udHJpbSgpKTtcbiAgICBcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIOajgOafpeaYqOaXpee7n+iuoeS/oeaBr+aYr+WQpuW3suWtmOWcqFxuICogQHBhcmFtIHZhdWx0IE9ic2lkaWFu5L+d6Zmp5bqTXG4gKiBAcGFyYW0gZmlsZVBhdGgg5paH5Lu26Lev5b6EXG4gKiBAcGFyYW0gZGF0ZSDku4rml6Xml6XmnJ/vvIjnlKjkuo7mo4Dmn6XmmKjml6Xnu5/orqHvvIlcbiAqIEByZXR1cm5zIOaYr+WQpuWtmOWcqOaYqOaXpee7n+iuoeS/oeaBr1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24geWVzdGVyZGF5U3RhdGlzdGljc0V4aXN0cyh2YXVsdDogVmF1bHQsIGZpbGVQYXRoOiBzdHJpbmcsIGRhdGU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIOajgOafpeaWh+S7tuaYr+WQpuWtmOWcqFxuICAgICAgICBjb25zdCBmaWxlID0gdmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZpbGVQYXRoKTtcbiAgICAgICAgaWYgKCFmaWxlIHx8ICEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYOaJvuS4jeWIsOaWh+S7tjogJHtmaWxlUGF0aH1gKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6K+75Y+W5paH5Lu25YaF5a65XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB2YXVsdC5yZWFkKGZpbGUpO1xuICAgICAgICBcbiAgICAgICAgLy8g5a+75om+5LuK5pel5pel5pyf5LiL55qE5pio5pel57uf6K6h5qCH6aKYXG4gICAgICAgIGNvbnN0IHN0YXRpc3RpY3NUaXRsZVJlZ2V4ID0gbmV3IFJlZ0V4cChgIyMgJHtkYXRlfVteXFxuXSpcXG4uKj8ke2dldFRyYW5zbGF0aW9uKCdzdGF0aXN0aWNzLnRpdGxlJyl9YCwgJ3MnKTtcbiAgICAgICAgcmV0dXJuIHN0YXRpc3RpY3NUaXRsZVJlZ2V4LnRlc3QoY29udGVudCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihg5qOA5p+l5pio5pel57uf6K6h5L+h5oGv5pe25Ye66ZSZOiAke2Vycm9yfWApO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG4vKipcbiAqIOeUn+aIkOaYqOaXpee7n+iuoeS/oeaBr+WGheWuuVxuICogQHBhcmFtIHRhc2tTdGF0cyDku7vliqHnu5/orqHnu5PmnpxcbiAqIEByZXR1cm5zIOagvOW8j+WMlueahOe7n+iuoeS/oeaBr+Wtl+espuS4slxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVTdGF0aXN0aWNzQ29udGVudCh0YXNrU3RhdHM6IHtcbiAgICB0b3RhbFRhc2tzOiBudW1iZXI7XG4gICAgY29tcGxldGVkVGFza3M6IG51bWJlcjtcbiAgICB1bmZpbmlzaGVkVGFza3NMaXN0OiBzdHJpbmdbXTtcbn0pOiBzdHJpbmcge1xuICAgIC8vIOiuoeeul+WujOaIkOeOh++8iOmBv+WFjemZpOS7pembtumUmeivr++8iVxuICAgIGNvbnN0IGNvbXBsZXRpb25SYXRlID0gdGFza1N0YXRzLnRvdGFsVGFza3MgPiAwXG4gICAgICAgID8gTWF0aC5yb3VuZCgodGFza1N0YXRzLmNvbXBsZXRlZFRhc2tzIC8gdGFza1N0YXRzLnRvdGFsVGFza3MpICogMTAwKVxuICAgICAgICA6IDA7XG4gICAgXG4gICAgLy8g5YeG5aSH5pyq5a6M5oiQ5Lu75Yqh5YiX6KGo77yI5pyA5aSa5pi+56S6NeS4qu+8iVxuICAgIGNvbnN0IHNob3dDb3VudCA9IE1hdGgubWluKHRhc2tTdGF0cy51bmZpbmlzaGVkVGFza3NMaXN0Lmxlbmd0aCwgNSk7XG4gICAgY29uc3QgdW5maW5pc2hlZFRhc2tzU3RyID0gdGFza1N0YXRzLnVuZmluaXNoZWRUYXNrc0xpc3RcbiAgICAgICAgLnNsaWNlKDAsIHNob3dDb3VudClcbiAgICAgICAgLm1hcCh0YXNrID0+IGAtIFsgXSAke3Rhc2t9YClcbiAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgIFxuICAgIC8vIOaehOW7uue7n+iuoeWGheWuuVxuICAgIHJldHVybiBgIyMjICR7Z2V0VHJhbnNsYXRpb24oJ3N0YXRpc3RpY3MudGl0bGUnKX1cbi0tLVxuXG4tICoqJHtnZXRUcmFuc2xhdGlvbignc3RhdGlzdGljcy50b3RhbFRhc2tzJyl9OioqICR7dGFza1N0YXRzLnRvdGFsVGFza3N9XG4tICoqJHtnZXRUcmFuc2xhdGlvbignc3RhdGlzdGljcy5jb21wbGV0ZWRUYXNrcycpfToqKiAke3Rhc2tTdGF0cy5jb21wbGV0ZWRUYXNrc31cbi0gKioke2dldFRyYW5zbGF0aW9uKCdzdGF0aXN0aWNzLmNvbXBsZXRpb25SYXRlJyl9OioqICR7Y29tcGxldGlvblJhdGV9JVxuXG4ke3Rhc2tTdGF0cy51bmZpbmlzaGVkVGFza3NMaXN0Lmxlbmd0aCA+IDAgPyBgIyMjIyAke2dldFRyYW5zbGF0aW9uKCdzdGF0aXN0aWNzLnN1Z2dlc3Rpb25zJyl9XG4tLS1cblxuJHt1bmZpbmlzaGVkVGFza3NTdHJ9XG4ke3Rhc2tTdGF0cy51bmZpbmlzaGVkVGFza3NMaXN0Lmxlbmd0aCA+IHNob3dDb3VudCA/IGBcXG5fLi4uJHt0YXNrU3RhdHMudW5maW5pc2hlZFRhc2tzTGlzdC5sZW5ndGggLSBzaG93Q291bnR9IG1vcmUgdGFza3NfYCA6ICcnfVxuYCA6ICcnfVxuYDtcbn0gIl19