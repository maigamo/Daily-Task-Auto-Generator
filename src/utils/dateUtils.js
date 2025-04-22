import { getLocalizedWeekday, getTranslation } from "../i18n/i18n";
/**
 * 日期处理工具函数
 */
/**
 * 获取当前年份
 * @returns 当前年份，如2025
 */
export function getCurrentYear() {
    return new Date().getFullYear().toString();
}
/**
 * 获取当前月份数字
 * @returns 当前月份，如04
 */
export function getCurrentMonth() {
    const month = (new Date().getMonth() + 1).toString();
    return month.padStart(2, '0');
}
/**
 * 获取当前月份的本地化名称
 * @param isEnglish 是否使用英文
 * @returns 月份名称，如中文环境下的"4月"，英文环境下的"April"
 */
export function getLocalizedMonthName(isEnglish = false) {
    const monthIndex = new Date().getMonth(); // 0-11
    // 中文月份名称
    const chineseMonths = [
        "1月", "2月", "3月", "4月", "5月", "6月",
        "7月", "8月", "9月", "10月", "11月", "12月"
    ];
    // 英文月份名称
    const englishMonths = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return isEnglish ? englishMonths[monthIndex] : chineseMonths[monthIndex];
}
/**
 * 获取当天对应的图标
 * @returns 对应日期的图标
 */
export function getDayIcon() {
    const day = new Date().getDate(); // 1-31
    // 为每天分配一个独特的图标
    const dayIcons = [
        "🌑",
        "🌒",
        "🌓",
        "🌔",
        "🌕",
        "🌖",
        "🌗",
        "🌘",
        "🌟",
        "⭐",
        "🌈",
        "🌞",
        "🌤️",
        "⛅",
        "🌦️",
        "🌧️",
        "⛈️",
        "🌩️",
        "🌪️",
        "🌫️",
        "🌬️",
        "🍀",
        "🌱",
        "🌲",
        "🌳",
        "🌴",
        "🌵",
        "🌺",
        "🌻",
        "🌼",
        "🌸", // 31日
    ];
    // 索引从0开始，天数从1开始，所以减1
    return dayIcons[day - 1] || "📅"; // 如果出现意外，返回默认日历图标
}
/**
 * 判断当前是否为英文环境
 * @returns 是否为英文环境
 */
export function isEnglishEnvironment() {
    // 通过翻译系统中的周一测试当前语言
    // 获取"weekday.mon"的翻译，如果是"Monday"则为英文环境
    const mondayText = getTranslation("weekday.mon");
    return mondayText === "Monday";
}
/**
 * 获取当前日期
 * @returns 当前日期，如16
 */
export function getCurrentDay() {
    const day = new Date().getDate().toString();
    return day.padStart(2, '0');
}
/**
 * 获取当前完整日期
 * @returns 完整日期，如2025-04-16
 */
export function getCurrentDate() {
    return `${getCurrentYear()}-${getCurrentMonth()}-${getCurrentDay()}`;
}
/**
 * 获取当前带图标的完整日期
 * @returns 带图标的完整日期，如🌕 2025-04-16
 */
export function getCurrentDateWithIcon() {
    const icon = getDayIcon();
    return `${icon} ${getCurrentDate()}`;
}
/**
 * 判断当前是否为工作日（周一至周五）
 * @returns 是否为工作日
 */
export function isWorkday() {
    const day = new Date().getDay();
    // 0是周日，1-5是周一至周五，6是周六
    return day >= 1 && day <= 5;
}
/**
 * 获取当前星期几的本地化名称
 * @returns 本地化的星期名称
 */
export function getCurrentWeekdayName() {
    const day = new Date().getDay();
    return getLocalizedWeekday(day);
}
/**
 * 计算当年进度百分比
 * @returns 当年进度百分比
 */
export function getYearProgress() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1); // 当年1月1日
    const end = new Date(now.getFullYear() + 1, 0, 1); // 下一年1月1日
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const passedDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return Math.round((passedDays / totalDays) * 100);
}
/**
 * 计算当月进度百分比
 * @returns 当月进度百分比
 */
export function getMonthProgress() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1); // 当月1日
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1); // 下个月1日
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const passedDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return Math.round((passedDays / totalDays) * 100);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZVV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGF0ZVV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxjQUFjLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFFbkU7O0dBRUc7QUFFSDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsY0FBYztJQUMxQixPQUFPLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDL0MsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxlQUFlO0lBQzNCLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNyRCxPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ2xDLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQixDQUFDLFlBQXFCLEtBQUs7SUFDNUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLE9BQU87SUFFakQsU0FBUztJQUNULE1BQU0sYUFBYSxHQUFHO1FBQ2xCLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSTtRQUNsQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUs7S0FDeEMsQ0FBQztJQUVGLFNBQVM7SUFDVCxNQUFNLGFBQWEsR0FBRztRQUNsQixTQUFTLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU07UUFDdEQsTUFBTSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxVQUFVO0tBQ25FLENBQUM7SUFFRixPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDN0UsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxVQUFVO0lBQ3RCLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPO0lBRXpDLGVBQWU7SUFDZixNQUFNLFFBQVEsR0FBRztRQUNiLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLEdBQUc7UUFDSCxJQUFJO1FBQ0osSUFBSTtRQUNKLEtBQUs7UUFDTCxHQUFHO1FBQ0gsS0FBSztRQUNMLEtBQUs7UUFDTCxJQUFJO1FBQ0osS0FBSztRQUNMLEtBQUs7UUFDTCxLQUFLO1FBQ0wsS0FBSztRQUNMLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUksRUFBRSxNQUFNO0tBQ2YsQ0FBQztJQUVGLHFCQUFxQjtJQUNyQixPQUFPLFFBQVEsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsa0JBQWtCO0FBQ3hELENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsb0JBQW9CO0lBQ2hDLG1CQUFtQjtJQUNuQix1Q0FBdUM7SUFDdkMsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ2pELE9BQU8sVUFBVSxLQUFLLFFBQVEsQ0FBQztBQUNuQyxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGFBQWE7SUFDekIsTUFBTSxHQUFHLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QyxPQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsY0FBYztJQUMxQixPQUFPLEdBQUcsY0FBYyxFQUFFLElBQUksZUFBZSxFQUFFLElBQUksYUFBYSxFQUFFLEVBQUUsQ0FBQztBQUN6RSxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLHNCQUFzQjtJQUNsQyxNQUFNLElBQUksR0FBRyxVQUFVLEVBQUUsQ0FBQztJQUMxQixPQUFPLEdBQUcsSUFBSSxJQUFJLGNBQWMsRUFBRSxFQUFFLENBQUM7QUFDekMsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxTQUFTO0lBQ3JCLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEMsc0JBQXNCO0lBQ3RCLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQ2hDLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUscUJBQXFCO0lBQ2pDLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEMsT0FBTyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGVBQWU7SUFDM0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUN2QixNQUFNLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUztJQUMxRCxNQUFNLEdBQUcsR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVU7SUFFN0QsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztJQUM1RSxNQUFNLFVBQVUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBRTdFLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQjtJQUM1QixNQUFNLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQ3ZCLE1BQU0sS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPO0lBQ3JFLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUTtJQUV4RSxNQUFNLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQzVFLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFFN0UsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ3RELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRMb2NhbGl6ZWRXZWVrZGF5LCBnZXRUcmFuc2xhdGlvbiB9IGZyb20gXCIuLi9pMThuL2kxOG5cIjtcclxuXHJcbi8qKlxyXG4gKiDml6XmnJ/lpITnkIblt6Xlhbflh73mlbBcclxuICovXHJcblxyXG4vKipcclxuICog6I635Y+W5b2T5YmN5bm05Lu9XHJcbiAqIEByZXR1cm5zIOW9k+WJjeW5tOS7ve+8jOWmgjIwMjVcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50WWVhcigpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpO1xyXG59XHJcblxyXG4vKipcclxuICog6I635Y+W5b2T5YmN5pyI5Lu95pWw5a2XXHJcbiAqIEByZXR1cm5zIOW9k+WJjeaciOS7ve+8jOWmgjA0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudE1vbnRoKCk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBtb250aCA9IChuZXcgRGF0ZSgpLmdldE1vbnRoKCkgKyAxKS50b1N0cmluZygpO1xyXG4gICAgcmV0dXJuIG1vbnRoLnBhZFN0YXJ0KDIsICcwJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDojrflj5blvZPliY3mnIjku73nmoTmnKzlnLDljJblkI3np7BcclxuICogQHBhcmFtIGlzRW5nbGlzaCDmmK/lkKbkvb/nlKjoi7HmlodcclxuICogQHJldHVybnMg5pyI5Lu95ZCN56ew77yM5aaC5Lit5paH546v5aKD5LiL55qEXCI05pyIXCLvvIzoi7Hmlofnjq/looPkuIvnmoRcIkFwcmlsXCJcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGl6ZWRNb250aE5hbWUoaXNFbmdsaXNoOiBib29sZWFuID0gZmFsc2UpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgbW9udGhJbmRleCA9IG5ldyBEYXRlKCkuZ2V0TW9udGgoKTsgLy8gMC0xMVxyXG4gICAgXHJcbiAgICAvLyDkuK3mlofmnIjku73lkI3np7BcclxuICAgIGNvbnN0IGNoaW5lc2VNb250aHMgPSBbXHJcbiAgICAgICAgXCIx5pyIXCIsIFwiMuaciFwiLCBcIjPmnIhcIiwgXCI05pyIXCIsIFwiNeaciFwiLCBcIjbmnIhcIixcclxuICAgICAgICBcIjfmnIhcIiwgXCI45pyIXCIsIFwiOeaciFwiLCBcIjEw5pyIXCIsIFwiMTHmnIhcIiwgXCIxMuaciFwiXHJcbiAgICBdO1xyXG4gICAgXHJcbiAgICAvLyDoi7HmlofmnIjku73lkI3np7BcclxuICAgIGNvbnN0IGVuZ2xpc2hNb250aHMgPSBbXHJcbiAgICAgICAgXCJKYW51YXJ5XCIsIFwiRmVicnVhcnlcIiwgXCJNYXJjaFwiLCBcIkFwcmlsXCIsIFwiTWF5XCIsIFwiSnVuZVwiLFxyXG4gICAgICAgIFwiSnVseVwiLCBcIkF1Z3VzdFwiLCBcIlNlcHRlbWJlclwiLCBcIk9jdG9iZXJcIiwgXCJOb3ZlbWJlclwiLCBcIkRlY2VtYmVyXCJcclxuICAgIF07XHJcbiAgICBcclxuICAgIHJldHVybiBpc0VuZ2xpc2ggPyBlbmdsaXNoTW9udGhzW21vbnRoSW5kZXhdIDogY2hpbmVzZU1vbnRoc1ttb250aEluZGV4XTtcclxufVxyXG5cclxuLyoqXHJcbiAqIOiOt+WPluW9k+WkqeWvueW6lOeahOWbvuagh1xyXG4gKiBAcmV0dXJucyDlr7nlupTml6XmnJ/nmoTlm77moIdcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREYXlJY29uKCk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBkYXkgPSBuZXcgRGF0ZSgpLmdldERhdGUoKTsgLy8gMS0zMVxyXG4gICAgXHJcbiAgICAvLyDkuLrmr4/lpKnliIbphY3kuIDkuKrni6znibnnmoTlm77moIdcclxuICAgIGNvbnN0IGRheUljb25zID0gW1xyXG4gICAgICAgIFwi8J+MkVwiLCAvLyAx5pelXHJcbiAgICAgICAgXCLwn4ySXCIsIC8vIDLml6VcclxuICAgICAgICBcIvCfjJNcIiwgLy8gM+aXpVxyXG4gICAgICAgIFwi8J+MlFwiLCAvLyA05pelXHJcbiAgICAgICAgXCLwn4yVXCIsIC8vIDXml6VcclxuICAgICAgICBcIvCfjJZcIiwgLy8gNuaXpVxyXG4gICAgICAgIFwi8J+Ml1wiLCAvLyA35pelXHJcbiAgICAgICAgXCLwn4yYXCIsIC8vIDjml6VcclxuICAgICAgICBcIvCfjJ9cIiwgLy8gOeaXpVxyXG4gICAgICAgIFwi4q2QXCIsIC8vIDEw5pelXHJcbiAgICAgICAgXCLwn4yIXCIsIC8vIDEx5pelXHJcbiAgICAgICAgXCLwn4yeXCIsIC8vIDEy5pelXHJcbiAgICAgICAgXCLwn4yk77iPXCIsIC8vIDEz5pelXHJcbiAgICAgICAgXCLim4VcIiwgLy8gMTTml6VcclxuICAgICAgICBcIvCfjKbvuI9cIiwgLy8gMTXml6VcclxuICAgICAgICBcIvCfjKfvuI9cIiwgLy8gMTbml6VcclxuICAgICAgICBcIuKbiO+4j1wiLCAvLyAxN+aXpVxyXG4gICAgICAgIFwi8J+Mqe+4j1wiLCAvLyAxOOaXpVxyXG4gICAgICAgIFwi8J+Mqu+4j1wiLCAvLyAxOeaXpVxyXG4gICAgICAgIFwi8J+Mq++4j1wiLCAvLyAyMOaXpVxyXG4gICAgICAgIFwi8J+MrO+4j1wiLCAvLyAyMeaXpVxyXG4gICAgICAgIFwi8J+NgFwiLCAvLyAyMuaXpVxyXG4gICAgICAgIFwi8J+MsVwiLCAvLyAyM+aXpVxyXG4gICAgICAgIFwi8J+MslwiLCAvLyAyNOaXpVxyXG4gICAgICAgIFwi8J+Ms1wiLCAvLyAyNeaXpVxyXG4gICAgICAgIFwi8J+MtFwiLCAvLyAyNuaXpVxyXG4gICAgICAgIFwi8J+MtVwiLCAvLyAyN+aXpVxyXG4gICAgICAgIFwi8J+MulwiLCAvLyAyOOaXpVxyXG4gICAgICAgIFwi8J+Mu1wiLCAvLyAyOeaXpVxyXG4gICAgICAgIFwi8J+MvFwiLCAvLyAzMOaXpVxyXG4gICAgICAgIFwi8J+MuFwiLCAvLyAzMeaXpVxyXG4gICAgXTtcclxuICAgIFxyXG4gICAgLy8g57Si5byV5LuOMOW8gOWni++8jOWkqeaVsOS7jjHlvIDlp4vvvIzmiYDku6Xlh48xXHJcbiAgICByZXR1cm4gZGF5SWNvbnNbZGF5IC0gMV0gfHwgXCLwn5OFXCI7IC8vIOWmguaenOWHuueOsOaEj+Wklu+8jOi/lOWbnum7mOiupOaXpeWOhuWbvuagh1xyXG59XHJcblxyXG4vKipcclxuICog5Yik5pat5b2T5YmN5piv5ZCm5Li66Iux5paH546v5aKDXHJcbiAqIEByZXR1cm5zIOaYr+WQpuS4uuiLseaWh+eOr+Wig1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzRW5nbGlzaEVudmlyb25tZW50KCk6IGJvb2xlYW4ge1xyXG4gICAgLy8g6YCa6L+H57+76K+R57O757uf5Lit55qE5ZGo5LiA5rWL6K+V5b2T5YmN6K+t6KiAXHJcbiAgICAvLyDojrflj5ZcIndlZWtkYXkubW9uXCLnmoTnv7vor5HvvIzlpoLmnpzmmK9cIk1vbmRheVwi5YiZ5Li66Iux5paH546v5aKDXHJcbiAgICBjb25zdCBtb25kYXlUZXh0ID0gZ2V0VHJhbnNsYXRpb24oXCJ3ZWVrZGF5Lm1vblwiKTtcclxuICAgIHJldHVybiBtb25kYXlUZXh0ID09PSBcIk1vbmRheVwiO1xyXG59XHJcblxyXG4vKipcclxuICog6I635Y+W5b2T5YmN5pel5pyfXHJcbiAqIEByZXR1cm5zIOW9k+WJjeaXpeacn++8jOWmgjE2XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudERheSgpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgZGF5ID0gbmV3IERhdGUoKS5nZXREYXRlKCkudG9TdHJpbmcoKTtcclxuICAgIHJldHVybiBkYXkucGFkU3RhcnQoMiwgJzAnKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIOiOt+WPluW9k+WJjeWujOaVtOaXpeacn1xyXG4gKiBAcmV0dXJucyDlrozmlbTml6XmnJ/vvIzlpoIyMDI1LTA0LTE2XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudERhdGUoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBgJHtnZXRDdXJyZW50WWVhcigpfS0ke2dldEN1cnJlbnRNb250aCgpfS0ke2dldEN1cnJlbnREYXkoKX1gO1xyXG59XHJcblxyXG4vKipcclxuICog6I635Y+W5b2T5YmN5bim5Zu+5qCH55qE5a6M5pW05pel5pyfXHJcbiAqIEByZXR1cm5zIOW4puWbvuagh+eahOWujOaVtOaXpeacn++8jOWmgvCfjJUgMjAyNS0wNC0xNlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnREYXRlV2l0aEljb24oKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IGljb24gPSBnZXREYXlJY29uKCk7XHJcbiAgICByZXR1cm4gYCR7aWNvbn0gJHtnZXRDdXJyZW50RGF0ZSgpfWA7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDliKTmlq3lvZPliY3mmK/lkKbkuLrlt6XkvZzml6XvvIjlkajkuIDoh7PlkajkupTvvIlcclxuICogQHJldHVybnMg5piv5ZCm5Li65bel5L2c5pelXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNXb3JrZGF5KCk6IGJvb2xlYW4ge1xyXG4gICAgY29uc3QgZGF5ID0gbmV3IERhdGUoKS5nZXREYXkoKTtcclxuICAgIC8vIDDmmK/lkajml6XvvIwxLTXmmK/lkajkuIDoh7PlkajkupTvvIw25piv5ZGo5YWtXHJcbiAgICByZXR1cm4gZGF5ID49IDEgJiYgZGF5IDw9IDU7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDojrflj5blvZPliY3mmJ/mnJ/lh6DnmoTmnKzlnLDljJblkI3np7BcclxuICogQHJldHVybnMg5pys5Zyw5YyW55qE5pif5pyf5ZCN56ewXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFdlZWtkYXlOYW1lKCk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBkYXkgPSBuZXcgRGF0ZSgpLmdldERheSgpO1xyXG4gICAgcmV0dXJuIGdldExvY2FsaXplZFdlZWtkYXkoZGF5KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIOiuoeeul+W9k+W5tOi/m+W6pueZvuWIhuavlFxyXG4gKiBAcmV0dXJucyDlvZPlubTov5vluqbnmb7liIbmr5RcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRZZWFyUHJvZ3Jlc3MoKTogbnVtYmVyIHtcclxuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XHJcbiAgICBjb25zdCBzdGFydCA9IG5ldyBEYXRlKG5vdy5nZXRGdWxsWWVhcigpLCAwLCAxKTsgLy8g5b2T5bm0MeaciDHml6VcclxuICAgIGNvbnN0IGVuZCA9IG5ldyBEYXRlKG5vdy5nZXRGdWxsWWVhcigpICsgMSwgMCwgMSk7IC8vIOS4i+S4gOW5tDHmnIgx5pelXHJcbiAgICBcclxuICAgIGNvbnN0IHRvdGFsRGF5cyA9IChlbmQuZ2V0VGltZSgpIC0gc3RhcnQuZ2V0VGltZSgpKSAvICgxMDAwICogNjAgKiA2MCAqIDI0KTtcclxuICAgIGNvbnN0IHBhc3NlZERheXMgPSAobm93LmdldFRpbWUoKSAtIHN0YXJ0LmdldFRpbWUoKSkgLyAoMTAwMCAqIDYwICogNjAgKiAyNCk7XHJcbiAgICBcclxuICAgIHJldHVybiBNYXRoLnJvdW5kKChwYXNzZWREYXlzIC8gdG90YWxEYXlzKSAqIDEwMCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDorqHnrpflvZPmnIjov5vluqbnmb7liIbmr5RcclxuICogQHJldHVybnMg5b2T5pyI6L+b5bqm55m+5YiG5q+UXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9udGhQcm9ncmVzcygpOiBudW1iZXIge1xyXG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcclxuICAgIGNvbnN0IHN0YXJ0ID0gbmV3IERhdGUobm93LmdldEZ1bGxZZWFyKCksIG5vdy5nZXRNb250aCgpLCAxKTsgLy8g5b2T5pyIMeaXpVxyXG4gICAgY29uc3QgZW5kID0gbmV3IERhdGUobm93LmdldEZ1bGxZZWFyKCksIG5vdy5nZXRNb250aCgpICsgMSwgMSk7IC8vIOS4i+S4quaciDHml6VcclxuICAgIFxyXG4gICAgY29uc3QgdG90YWxEYXlzID0gKGVuZC5nZXRUaW1lKCkgLSBzdGFydC5nZXRUaW1lKCkpIC8gKDEwMDAgKiA2MCAqIDYwICogMjQpO1xyXG4gICAgY29uc3QgcGFzc2VkRGF5cyA9IChub3cuZ2V0VGltZSgpIC0gc3RhcnQuZ2V0VGltZSgpKSAvICgxMDAwICogNjAgKiA2MCAqIDI0KTtcclxuICAgIFxyXG4gICAgcmV0dXJuIE1hdGgucm91bmQoKHBhc3NlZERheXMgLyB0b3RhbERheXMpICogMTAwKTtcclxufSAiXX0=