# Daily Task Auto Generator 构建脚本
# 用于生成发布包和准备提交

# 获取版本号
$manifestContent = Get-Content -Path "manifest.json" -Raw | ConvertFrom-Json
$version = $manifestContent.version
Write-Host "准备构建版本: $version" -ForegroundColor Green

# 创建构建目录
$buildDir = "build"
$releaseDir = "release"
if (Test-Path $buildDir) {
    Remove-Item -Path $buildDir -Recurse -Force
}
if (Test-Path $releaseDir) {
    Remove-Item -Path $releaseDir -Recurse -Force
}
New-Item -Path $buildDir -ItemType Directory | Out-Null
New-Item -Path $releaseDir -ItemType Directory | Out-Null

# 运行npm构建
Write-Host "执行npm构建..." -ForegroundColor Yellow
npm run build

# 复制必要文件到构建目录
Write-Host "复制文件到构建目录..." -ForegroundColor Yellow
Copy-Item -Path "main.js" -Destination $buildDir
Copy-Item -Path "manifest.json" -Destination $buildDir
Copy-Item -Path "styles.css" -Destination $buildDir
Copy-Item -Path "README.md" -Destination $buildDir
Copy-Item -Path "CHANGELOG.md" -Destination $buildDir
Copy-Item -Path "LICENSE" -Destination $buildDir

# 创建发布ZIP包
Write-Host "创建发布包..." -ForegroundColor Yellow
$releaseZip = "$releaseDir\daily-task-auto-generator-$version.zip"
Compress-Archive -Path "$buildDir\*" -DestinationPath $releaseZip

# 复制单独的文件到release目录（符合Obsidian发布规范）
Copy-Item -Path "main.js" -Destination $releaseDir
Copy-Item -Path "manifest.json" -Destination $releaseDir
Copy-Item -Path "styles.css" -Destination $releaseDir

# 完成
Write-Host "构建完成! 发布文件位于: $releaseZip" -ForegroundColor Green
Write-Host "单独的文件已复制到: $releaseDir 目录" -ForegroundColor Green
Write-Host "请记得更新GitHub发布版本为: $version（不要加v前缀）" -ForegroundColor Cyan 