# 🔄 Daily Task Auto Generator - User Guide

## 📖 Introduction

Daily Task Auto Generator is an Obsidian plugin that helps you automatically generate daily task files with customizable templates. This plugin provides a convenient way to create, organize, and manage your daily tasks, suitable for both personal task tracking and work progress recording.

## ✨ Features

- **🔄 Automatic Task Generation**: Creates task files automatically each day, or only on workdays based on your settings
- **📝 Customizable Templates**: Design your own task templates with variables like date, time, and progress indicators
- **📁 Smart File Organization**: Automatically organizes files by year folders and month files
- **🌏 Month Name Localization**: Supports month names in both Chinese and English
- **🔤 Dual Language Interface**: Full support for both Chinese and English interfaces

## 💾 Installation

### ☁️ Automatic Installation (Coming Soon)

1. Open Obsidian
2. Go to Settings > Community Plugins
3. Turn off "Safe Mode"
4. Click "Browse" and search for "Daily Task Auto Generator"
5. Click "Install"
6. After installation, enable the plugin by toggling it on

### 📥 Manual Installation

1. Download the latest release from the [GitHub repository](https://github.com/maigamo/Daily-Task-Auto-Generator/releases)
2. Extract the downloaded zip file
3. Move the extracted folder to your Obsidian vault's `.obsidian/plugins/` directory
4. Restart Obsidian
5. Go to Settings > Community Plugins and enable "Daily Task Auto Generator"

## ⚙️ Configuration

1. After enabling the plugin, go to Settings and find "Daily Task Auto Generator"
2. Configure the following settings:
   - **📂 Root Directory**: Set the directory where task files will be stored (e.g., "DailyTasks")
   - **🕒 Generation Mode**: Choose between:
     - 🚫 Off: No automatic generation
     - 📆 Daily: Generate tasks every day
     - 💼 Workdays Only: Generate tasks only on Monday through Friday
   - **🔤 Language**: Select your preferred interface language (Chinese or English)
   - **📋 Task Template**: Customize the template for your daily task files
   - **✨ Animation Effects**: Enable or disable UI animations

## 🔍 Usage

### 🤖 Automatic Task Generation

Based on your configuration, the plugin will automatically generate task files when you open Obsidian. Files are organized as follows:
- Root Directory (e.g., "DailyTasks")
  - Year Folder (e.g., "2023")
    - Month File (e.g., "10-October.md")

Each month file contains multiple daily task entries, with the latest entry at the top of the file.

### 👆 Manual Task Generation

If automatic generation is disabled or you need to recreate today's task:

1. Go to the plugin settings page and click "Add Today's Task Manually"
2. Or use the command palette (Ctrl+P) and search for "Add Today's Task"

### 📑 Task Format

Tasks are created using your custom template. You can use these variables:
- `{{date}}`: Current date (YYYY-MM-DD format)
- `{{weekday}}`: Current day of the week
- `{{yearProgress}}`: Percentage of year completed
- `{{monthProgress}}`: Percentage of month completed
- `{{time}}`: Current time

## 📋 Template Examples

### 📓 Simple Daily Log
```markdown
## {{date}} ({{weekday}})

### Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

### Notes

```

### 💼 Work Progress Tracker
```markdown
# {{date}} Work Log

Year progress: {{yearProgress}}
Month progress: {{monthProgress}}

## Today's Objectives
- [ ] 

## Meetings
- 

## Notes
- 

## Tomorrow's Plan
- 
```

## ❓ Troubleshooting

### 🚫 Task Not Generated Automatically
- Check if the plugin is enabled
- Verify your generation mode setting
- Ensure Obsidian has the necessary file permissions

### 🔠 Template Variables Not Working
- Make sure variables are in the correct format: `{{variableName}}`
- Check for typos in variable names

### 📁 File Structure Issues
- Verify that your root directory exists
- Check if you have write permissions to the directory

## 🆘 Support

If you encounter any issues or have suggestions:
- Check the [GitHub repository](https://github.com/maigamo/Daily-Task-Auto-Generator) for known issues
- Submit a new issue if your problem is not already reported
- Join the discussion on the [Obsidian Forum](https://forum.obsidian.md)

---

🙏 Thank you for using Daily Task Auto Generator! We hope this plugin helps improve your productivity and task management. 
