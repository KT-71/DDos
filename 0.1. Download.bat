@echo off
setlocal

rd /s /q .\node-v16.17.1-win-x86
del node-v16.17.1-win-x86.zip

echo Start download
wget.exe https://nodejs.org/download/release/v16.17.1/node-v16.17.1-win-x86.zip
Call :UnZipFile "%~dp0" "%~dp0node-v16.17.1-win-x86.zip"

del node-v16.17.1-win-x86.zip

.\node-v16.17.1-win-x86\npm install selenium-webdriver

pause
exit /b


:UnZipFile <ExtractTo> <newzipfile>
set vbs="%temp%\_.vbs"
if exist %vbs% del /f /q %vbs%
>%vbs%  echo Set fso = CreateObject("Scripting.FileSystemObject")
>>%vbs% echo If NOT fso.FolderExists(%1) Then
>>%vbs% echo fso.CreateFolder(%1)
>>%vbs% echo End If
>>%vbs% echo set objShell = CreateObject("Shell.Application")
>>%vbs% echo set FilesInZip=objShell.NameSpace(%2).items
>>%vbs% echo objShell.NameSpace(%1).CopyHere(FilesInZip)
>>%vbs% echo Set fso = Nothing
>>%vbs% echo Set objShell = Nothing
cscript //nologo %vbs%
if exist %vbs% del /f /q %vbs%