import { 
    getCurrentDate, 
    getCurrentWeekdayName, 
    getYearProgress, 
    getMonthProgress, 
    getCurrentDateWithIcon 
} from "./dateUtils";

/**
 * 模板变量渲染引擎
 */

/**
 * 获取当前时间
 * @returns 当前时间，如10:30
 */
function getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * 渲染模板内容，替换其中的变量
 * @param template 模板内容
 * @returns 渲染后的内容
 */
export function renderTemplate(template: string): string {
    // 定义变量映射
    const variableMap: Record<string, string | number> = {
        'date': getCurrentDate(),
        'dateWithIcon': getCurrentDateWithIcon(),
        'weekday': getCurrentWeekdayName(),
        'yearProgress': getYearProgress(),
        'monthProgress': getMonthProgress(),
        'time': getCurrentTime()
    };
    
    // 替换模板中的变量
    let renderedContent = template;
    for (const [variable, value] of Object.entries(variableMap)) {
        renderedContent = renderedContent.replace(
            new RegExp(`{{${variable}}}`, 'g'), 
            value.toString()
        );
    }
    
    return renderedContent;
}

/**
 * 获取变量说明
 * @returns 变量说明，包括中英文
 */
export function getTemplateVariables(): Record<string, string> {
    return {
        'date': '当前日期 / Current date (YYYY-MM-DD)',
        'dateWithIcon': '带图标的当前日期 / Current date with daily icon',
        'weekday': '当前星期 / Current weekday',
        'yearProgress': '年度进度百分比 / Year progress percentage',
        'monthProgress': '月度进度百分比 / Month progress percentage',
        'time': '当前时间 / Current time (HH:MM)'
    };
} 