/**
 * 自动生成模式枚举
 */
export var AutoGenerateMode;
(function (AutoGenerateMode) {
    AutoGenerateMode["NONE"] = "none";
    AutoGenerateMode["DAILY"] = "daily";
    AutoGenerateMode["WORKDAY"] = "workday"; // 仅工作日自动生成
})(AutoGenerateMode || (AutoGenerateMode = {}));
/**
 * 设置界面语言
 */
export var Language;
(function (Language) {
    Language["AUTO"] = "auto";
    Language["ZH"] = "zh";
    Language["EN"] = "en";
})(Language || (Language = {}));
/**
 * 默认中文模板
 */
export const DEFAULT_TEMPLATE_ZH = `## {{dateWithIcon}}（{{weekday}}）

### 🧘 今日计划
---

- [ ] 冥想 10 分钟  
- [ ] 复盘前一日计划  
- [ ] 阅读 20 页书

### 📝 工作任务
---

- [ ] 整理今日工作计划
- [ ] 完成重要项目进度
`;
/**
 * 默认英文模板
 */
export const DEFAULT_TEMPLATE_EN = `## {{dateWithIcon}} ({{weekday}})

### 🧘 Today's Plan
---

- [ ] Meditate for 10 minutes  
- [ ] Review yesterday's plan  
- [ ] Read 20 pages

### 📝 Work Tasks
---

- [ ] Organize today's work schedule
- [ ] Progress on important projects
`;
/**
 * 默认设置
 */
export const DEFAULT_SETTINGS = {
    rootDir: 'DailyTasks',
    autoGenerateMode: AutoGenerateMode.WORKDAY,
    language: Language.AUTO,
    templateZh: DEFAULT_TEMPLATE_ZH,
    templateEn: DEFAULT_TEMPLATE_EN,
    customTemplate: '',
    hasCustomTemplate: false,
    taskStatistics: false,
    successNotificationDuration: 3000
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZXR0aW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUNILE1BQU0sQ0FBTixJQUFZLGdCQUlYO0FBSkQsV0FBWSxnQkFBZ0I7SUFDeEIsaUNBQWEsQ0FBQTtJQUNiLG1DQUFlLENBQUE7SUFDZix1Q0FBbUIsQ0FBQSxDQUFDLFdBQVc7QUFDbkMsQ0FBQyxFQUpXLGdCQUFnQixLQUFoQixnQkFBZ0IsUUFJM0I7QUFFRDs7R0FFRztBQUNILE1BQU0sQ0FBTixJQUFZLFFBSVg7QUFKRCxXQUFZLFFBQVE7SUFDaEIseUJBQWEsQ0FBQTtJQUNiLHFCQUFTLENBQUE7SUFDVCxxQkFBUyxDQUFBO0FBQ2IsQ0FBQyxFQUpXLFFBQVEsS0FBUixRQUFRLFFBSW5CO0FBNEJEOztHQUVHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sbUJBQW1CLEdBQUc7Ozs7Ozs7Ozs7Ozs7O0NBY2xDLENBQUM7QUFFRjs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLG1CQUFtQixHQUFHOzs7Ozs7Ozs7Ozs7OztDQWNsQyxDQUFDO0FBRUY7O0dBRUc7QUFDSCxNQUFNLENBQUMsTUFBTSxnQkFBZ0IsR0FBc0I7SUFDL0MsT0FBTyxFQUFFLFlBQVk7SUFDckIsZ0JBQWdCLEVBQUUsZ0JBQWdCLENBQUMsT0FBTztJQUMxQyxRQUFRLEVBQUUsUUFBUSxDQUFDLElBQUk7SUFDdkIsVUFBVSxFQUFFLG1CQUFtQjtJQUMvQixVQUFVLEVBQUUsbUJBQW1CO0lBQy9CLGNBQWMsRUFBRSxFQUFFO0lBQ2xCLGlCQUFpQixFQUFFLEtBQUs7SUFDeEIsY0FBYyxFQUFFLEtBQUs7SUFDckIsMkJBQTJCLEVBQUUsSUFBSTtDQUNwQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDoh6rliqjnlJ/miJDmqKHlvI/mnprkuL5cbiAqL1xuZXhwb3J0IGVudW0gQXV0b0dlbmVyYXRlTW9kZSB7XG4gICAgTk9ORSA9ICdub25lJywgICAgIC8vIOWFs+mXreiHquWKqOeUn+aIkFxuICAgIERBSUxZID0gJ2RhaWx5JywgICAvLyDmr4/ml6Xoh6rliqjnlJ/miJBcbiAgICBXT1JLREFZID0gJ3dvcmtkYXknIC8vIOS7heW3peS9nOaXpeiHquWKqOeUn+aIkFxufVxuXG4vKipcbiAqIOiuvue9rueVjOmdouivreiogFxuICovXG5leHBvcnQgZW51bSBMYW5ndWFnZSB7XG4gICAgQVVUTyA9ICdhdXRvJyxcbiAgICBaSCA9ICd6aCcsXG4gICAgRU4gPSAnZW4nXG59XG5cbi8qKlxuICog5o+S5Lu26K6+572u5o6l5Y+jXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGFpbHlUYXNrU2V0dGluZ3Mge1xuICAgIC8vIOWfuuehgOmFjee9rlxuICAgIHJvb3REaXI6IHN0cmluZzsgICAgICAgICAgICAgICAvLyDku7vliqHmlofku7blrZjmlL7nmoTmoLnnm67lvZVcbiAgICBhdXRvR2VuZXJhdGVNb2RlOiBBdXRvR2VuZXJhdGVNb2RlOyAvLyDoh6rliqjnlJ/miJDmqKHlvI9cbiAgICBsYW5ndWFnZTogc3RyaW5nOyAgICAgICAgICAgIC8vIOeVjOmdouivreiogFxuXG4gICAgLy8g5qih5p2/6YWN572uXG4gICAgdGVtcGxhdGVaaDogc3RyaW5nOyAgICAgICAgICAgIC8vIOS4reaWh+S7u+WKoeaooeadv1xuICAgIHRlbXBsYXRlRW46IHN0cmluZzsgICAgICAgICAgICAvLyDoi7Hmlofku7vliqHmqKHmnb9cblxuICAgIC8vIOaWsOWinu+8mueUqOaIt+iHquWumuS5ieaooeadv1xuICAgIGN1c3RvbVRlbXBsYXRlOiBzdHJpbmc7XG5cbiAgICAvLyDmlrDlop7vvJrmoIforrDmmK/lkKbkvb/nlKjoh6rlrprkuYnmqKHmnb9cbiAgICBoYXNDdXN0b21UZW1wbGF0ZTogYm9vbGVhbjtcblxuICAgIC8vIOaWsOWinu+8muaYr+WQpuW8gOWQr+S7u+WKoee7n+iuoeWKn+iDvVxuICAgIHRhc2tTdGF0aXN0aWNzOiBib29sZWFuO1xuXG4gICAgLy8gVUnphY3nva5cbiAgICBzdWNjZXNzTm90aWZpY2F0aW9uRHVyYXRpb246IG51bWJlcjsgLy8g5oiQ5Yqf6YCa55+l5pi+56S65pe26Ze0KOavq+enkilcbn1cblxuLyoqXG4gKiDpu5jorqTkuK3mlofmqKHmnb9cbiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfVEVNUExBVEVfWkggPSBgIyMge3tkYXRlV2l0aEljb259fe+8iHt7d2Vla2RheX1977yJXG5cbiMjIyDwn6eYIOS7iuaXpeiuoeWIklxuLS0tXG5cbi0gWyBdIOWGpeaDsyAxMCDliIbpkp8gIFxuLSBbIF0g5aSN55uY5YmN5LiA5pel6K6h5YiSICBcbi0gWyBdIOmYheivuyAyMCDpobXkuaZcblxuIyMjIPCfk50g5bel5L2c5Lu75YqhXG4tLS1cblxuLSBbIF0g5pW055CG5LuK5pel5bel5L2c6K6h5YiSXG4tIFsgXSDlrozmiJDph43opoHpobnnm67ov5vluqZcbmA7XG5cbi8qKlxuICog6buY6K6k6Iux5paH5qih5p2/XG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX1RFTVBMQVRFX0VOID0gYCMjIHt7ZGF0ZVdpdGhJY29ufX0gKHt7d2Vla2RheX19KVxuXG4jIyMg8J+nmCBUb2RheSdzIFBsYW5cbi0tLVxuXG4tIFsgXSBNZWRpdGF0ZSBmb3IgMTAgbWludXRlcyAgXG4tIFsgXSBSZXZpZXcgeWVzdGVyZGF5J3MgcGxhbiAgXG4tIFsgXSBSZWFkIDIwIHBhZ2VzXG5cbiMjIyDwn5OdIFdvcmsgVGFza3Ncbi0tLVxuXG4tIFsgXSBPcmdhbml6ZSB0b2RheSdzIHdvcmsgc2NoZWR1bGVcbi0gWyBdIFByb2dyZXNzIG9uIGltcG9ydGFudCBwcm9qZWN0c1xuYDtcblxuLyoqXG4gKiDpu5jorqTorr7nva5cbiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IERhaWx5VGFza1NldHRpbmdzID0ge1xuICAgIHJvb3REaXI6ICdEYWlseVRhc2tzJyxcbiAgICBhdXRvR2VuZXJhdGVNb2RlOiBBdXRvR2VuZXJhdGVNb2RlLldPUktEQVksXG4gICAgbGFuZ3VhZ2U6IExhbmd1YWdlLkFVVE8sXG4gICAgdGVtcGxhdGVaaDogREVGQVVMVF9URU1QTEFURV9aSCxcbiAgICB0ZW1wbGF0ZUVuOiBERUZBVUxUX1RFTVBMQVRFX0VOLFxuICAgIGN1c3RvbVRlbXBsYXRlOiAnJywgLy8g6buY6K6k5Li656m677yM6KGo56S65L2/55So6K+t6KiA55u45YWz55qE6buY6K6k5qih5p2/XG4gICAgaGFzQ3VzdG9tVGVtcGxhdGU6IGZhbHNlLCAvLyDpu5jorqTkuI3kvb/nlKjoh6rlrprkuYnmqKHmnb9cbiAgICB0YXNrU3RhdGlzdGljczogZmFsc2UsIC8vIOm7mOiupOWFs+mXreS7u+WKoee7n+iuoeWKn+iDvVxuICAgIHN1Y2Nlc3NOb3RpZmljYXRpb25EdXJhdGlvbjogMzAwMFxufTsgIl19