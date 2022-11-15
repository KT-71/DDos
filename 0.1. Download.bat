@echo off

del chromedriver.exe
del chromedriver_win32.zip
rd /s /q .\node-v16.17.1-win-x86
del node-v16.17.1-win-x86.zip
pause

wget.exe https://chromedriver.storage.googleapis.com/108.0.5359.22/chromedriver_win32.zip
wget.exe https://nodejs.org/download/release/v16.17.1/node-v16.17.1-win-x86.zip

unzip.bat node-v16.17.1-win-x86.zip
unzip.bat chromedriver_win32.zip
pause