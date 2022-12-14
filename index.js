// webdriver
const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
// fs
const fs = require('fs');
const child_process = require('child_process');
// sleep
global.sleep = (ms) => { return new Promise(resolve => setTimeout(resolve, ms + parseInt(Math.random() * 500))); }

// API
const findElementsByText = async (driver, filter, text) => {
    // find Element
    let elements = (await driver.findElements(filter).catch(() => { })) || [];

    // check text if defined
    if (elements.length > 0 && text) {
        elements = await filterElementsByText(elements, text);
    }

    if (elements.length) {
        console.log('findElementsByText', filter.value, `Array(${elements.length})`, text || '');
    }
    return elements;
}

const filterElementsByText = async (elements, text) => {
    let result = [];
    for (ele of elements) {
        if (await filterElementByText(ele, text)) {
            result.push(ele);
        }
    }
    return result;
}

const filterElementByText = async (element, text) => {
    let rawText = (await element.getText().catch(() => { })) || null;
    if (rawText) {
        rawText = rawText.trim();
        if (text.constructor?.name == 'String') { return rawText.includes(text) ? element : null; }
        if (text.constructor?.name == 'RegExp') { return text.test(rawText) ? element : null; }
    }
    return null;
}

const clickElement = async (element) => {
    try {
        await element.click().catch(() => { })
    } catch (e) {
        console.log(e.message);
    }
}

const randomPick = (items) => {
    return items[Math.floor(Math.random() * items.length)];
}

// bot logic
const initBotChrome = async (login, targets, realUsername) => {
    const delay = 350;

    // chrome
    let chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--window-size=800,600');
    // chromeOptions.addArguments('User-Agent=Mozilla/5.0 (Linux; U; Android 8.1.0; zh-cn; BLA-AL00 Build/HUAWEIBLA-AL00) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.132 MQQBrowser/8.9 Mobile Safari/537.36')

    // tab page
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();
    // login page
    await sleep(delay);
    await driver.get(`https://twitter.com/i/flow/login`);
    await sleep(delay);

    // set target list
    let waitList = targets.filter(() => true);
    let target = null, doneList = [], dieList = [];

    let elements = [], loginStatus = 0, refresh = 0;
    while (1) {
        let url = await driver.getCurrentUrl().catch(() => { }) || 'null';

        console.log(`${doneList.length}/${targets.length}`);

        await (async () => {
            elements = await findElementsByText(driver, By.css(`span`), /^????????????$/);
            if (!elements[0]) { return; }

            elements = await findElementsByText(driver, By.css(`span`), /^????????????$/);
            if (!elements[0]) { return; }

            await sleep(delay);
            await clickElement(elements[0]);
            await sleep(delay);
        })();

        await (async () => {
            elements = await findElementsByText(driver, By.css(`span`), `??????????????????`);
            if (!elements[0]) { return; }

            elements = await findElementsByText(driver, By.css(`span`), /^??????$/);
            if (!elements[0]) { return; }

            await sleep(delay);
            await clickElement(elements[0]);
            await sleep(delay);
        })();

        // login page
        if (url == `https://twitter.com/i/flow/login`) {
            loginStatus = loginStatus || 1;

            // type in email
            await (async () => {
                if (!login.email) { return; }

                elements = await findElementsByText(driver, By.css(`input[autocomplete='username']`));
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].clear().catch(() => { });
                await elements[0].sendKeys(login.email).catch(() => { });
                await sleep(delay);

                elements = await findElementsByText(driver, By.css(`span`), /^?????????$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);
            })();

            // type in password
            await (async () => {
                if (!login.password) { return; }

                elements = await findElementsByText(driver, By.css(`input[autocomplete='current-password']`));
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].clear().catch(() => { });
                await elements[0].sendKeys(login.password).catch(() => { });
                await sleep(delay);

                elements = await findElementsByText(driver, By.css(`span`), `??????`);
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(600);
            })();

            // type in username (for twitter login check)
            await (async () => {
                if (!login.username) { return; }

                elements = await findElementsByText(driver, By.css(`input[data-testid='ocfEnterTextTextInput']`));
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].clear().catch(() => { });
                await elements[0].sendKeys(login.username).catch(() => { });
                await sleep(delay);

                elements = await findElementsByText(driver, By.css(`span`), /^?????????$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);
            })();
        }

        // home
        if (url == `https://twitter.com/home`) {
            await (async () => {
                await sleep(delay);

                elements = await findElementsByText(driver, By.css(`a[data-testid='AppTabBar_Home_Link']`));
                if (!elements[0]) { return; }

                // login done
                if (loginStatus == 1) { loginStatus = 2; }
            })();
        }

        // logout
        if (url == `https://twitter.com/logout`) {
            elements = await findElementsByText(driver, By.css(`span`), /^??????$/);
            if (!elements[0]) { return; }

            await sleep(delay);
            await clickElement(elements[0]);
            await sleep(5000);

            await driver.quit();
            return { doneList, dieList };
        }

        // idle...
        if (target == null && waitList.length > 0 &&
            loginStatus == 2 && url != `https://twitter.com/i/flow/login`) {
            // pop target url
            // target = waitList.shift().trim();
            target = waitList.pop().trim();
            if (target) { await driver.get(target); }
        }

        // all done
        if (target == null && waitList.length == 0) {
            await driver.get(`https://twitter.com/logout`);
        }

        // fake user
        if (loginStatus == 2 && url == target && /https:\/\/twitter\.com\/\S+$/.test(url)) {
            await (async () => {
                elements = await findElementsByText(driver, By.css(`div[data-testid='userActions']`));
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(() => { });
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), `?????? @`);
                if (!elements[0]) { ++refresh; return; }
                refresh = 0;

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), /(???????????????)|(??????????????????)/);
                if (!elements[0]) { return; }

                await sleep(delay);

                dieList.push(target);
                doneList.push(target);
                target = null;
            })();
        }

        // annoying tweet
        if (loginStatus == 2 && url == target && /https:\/\/twitter\.com\/\S+\/status\/\d+/.test(url)) {
            await (async () => {
                elements = await findElementsByText(driver, By.css(`div[data-testid='caret']`));
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(() => { });
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), `????????????`);
                if (!elements[0]) { ++refresh; return; }
                refresh = 0;

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), `?????????????????????`);
                if (!elements[0]) { return; }

                if (Math.random() > 0.2) {  // 80% skpi
                    await sleep(delay);

                    doneList.push(target);
                    target = null;
                    return;
                }

                elements = await findElementsByText(driver, By.css(`span`), `??????`);
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), /(??????????????????)|(????????????????????????????????????)/);
                if (!elements[0]) { return; }

                await sleep(delay);

                // doneList.push(target);
                dieList.push(target);
                target = null;
            })();
        }

        // refresh page if login bug
        if (loginStatus == 2 && refresh > 5) {
            await driver.navigate().refresh();
            refresh = 0;
        }

        // refresh page if username wrong
        if (loginStatus == 2 && url != target && target && /https:\/\/twitter\.com\/\S+\/status\/\d+/.test(url)) {
            let match1 = url.match(/https:\/\/twitter\.com\/\S+\/status\/(\d+)/i);
            let match2 = target.match(/https:\/\/twitter\.com\/\S+\/status\/(\d+)/i);
            if (!!match1 && !!match2 &&
                match1[1] == match2[1]) {
                target = url;
            }
        }

        // report page
        if (loginStatus == 2 && url == `https://twitter.com/i/safety/report_story_start`) {
            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), /^????????????$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);
            })();

            await (async () => {

                elements = await findElementsByText(driver, By.css(`span`), randomPick([/????????????????????????/, /???????????????/]));
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);

                elements = await findElementsByText(driver, By.css(`span`), /^?????????$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);
            })();

            await (async () => {
                regex = /^????????????????????????$/;
                // regex = [/^????????????????????????$/, /?????????????????????/][parseInt(Math.random() * 2)];
                // regex = [/^????????????????????????$/, /^????????????????????????????????????$/, /?????????????????????/][parseInt(Math.random() * 2)];
                elements = await findElementsByText(driver, By.css(`span`), regex);
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);

                elements = await findElementsByText(driver, By.css(`span`), /^?????????$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), /????????????/);
                // elements = await findElementsByText(driver, By.css(`span`), /(????????????)|(????????????)/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);

                elements = await findElementsByText(driver, By.css(`span`), /^?????????$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);
            })();

            // await (async () => {
            //     elements = await findElementsByText(driver, By.css(`span`), /???????????????/);
            //     if (!elements[0]) { return; }

            //     await sleep(delay);
            //     await clickElement(elements[0]);
            //     await sleep(delay);

            //     elements = await findElementsByText(driver, By.css(`span`), /^?????????$/);
            //     if (!elements[0]) { return; }

            //     await sleep(delay);
            //     await clickElement(elements[0]);
            //     await sleep(delay);
            // })();

            // await (async () => {
            //     elements = await findElementsByText(driver, By.css(`span`), `???????????????????????????????????????????????????`);
            //     if (!elements[0]) { return; }

            //     elements = await findElementsByText(driver, By.css(`input[data-testid='ocfTypeaheadInput']`));
            //     if (!elements[0]) { return; }

            //     if (await elements[0].getAttribute('value') != realUsername) {
            //         await sleep(delay);
            //         await elements[0].clear().catch(() => { });
            //         await elements[0].sendKeys(realUsername);
            //         await sleep(600);
            //     }

            //     elements = await findElementsByText(driver, By.css(`span`), `@${realUsername}`);
            //     if (!elements[0]) { return; }

            //     await sleep(delay);
            //     await clickElement(elements[0]);
            //     await sleep(delay);

            //     elements = await findElementsByText(driver, By.css(`span`), /^?????????$/);
            //     if (!elements[0]) { return; }

            //     await sleep(delay);
            //     await clickElement(elements[0]);
            //     await sleep(delay);
            // })();

            // await (async () => {
            //     // elements = await findElementsByText(driver, By.css(`span`), `???????????????`);
            //     // if (!elements[0]) { return; }

            //     elements = await findElementsByText(driver, By.css(`span`), /^???$/);
            //     if (!elements[0]) { return; }

            //     await sleep(delay);
            //     await clickElement(elements[0]);
            //     await sleep(delay);
            // })();

            await (async () => {
                // elements = await findElementsByText(driver, By.css(`span`), /????????????/);
                // if (!elements[0]) { return; }

                elements = await findElementsByText(driver, By.css(`span`), /????????????/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);
            })();

            await (async () => {
                // elements = await findElementsByText(driver, By.css(`span`), /^????????????????????????/);
                // if (!elements[0]) { return; }

                elements = await findElementsByText(driver, By.css(`span`), /??????$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);
            })();

            await (async () => {
                // elements = await findElementsByText(driver, By.css(`span`), /^???????????????????????????????????????$/);
                // if (!elements[0]) { return; }

                elements = await findElementsByText(driver, By.css(`span`), /^??????$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);
            })();

            await (async () => {
                // elements = await findElementsByText(driver, By.css(`span`), `????????????????????????????????????????????????`);
                // if (!elements[0]) { return; }

                elements = await findElementsByText(driver, By.css(`span`), /^??????$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await clickElement(elements[0]);
                await sleep(delay);

                doneList.push(target);
                target = null;
            })();
        }

        await sleep(delay);
    }
}

const main = async () => {
    // ??????????????????
    const loginPath = `./config/login.js`;
    if (!fs.existsSync(loginPath)) {
        fs.writeFileSync(loginPath, [
            `module.exports = {`, `    logins: [`, `        {`,
            `            email: '',         // ???????????????`,
            `            password: '',      // ???????????????, ????????????????????????????????????`,
            `            username: ''       // ????????????????????? twitter ?????????????????????, ??????????????????????????????`,
            `        },`, `    ]`, `}`,].join('\r\n'));

        child_process.execSync(`notepad.exe ${loginPath}`).toString();
    }

    // ???????????????????????????????????????, ????????????
    {
        const TEMP = process.env.TMP || process.env.TEMP;
        for (let dir of fs.readdirSync(TEMP)) {
            if (!dir.startsWith(`scoped_dir`) || !fs.lstatSync(`${TEMP}\\${dir}`).isDirectory()) { continue; }

            fs.rmdirSync(`${TEMP}\\${dir}`, { recursive: true, force: true });
        }
    }

    // test run for check chrome version
    const chromeOptions = new chrome.Options(); chromeOptions.headless();
    let driver = await new Builder().forBrowser('chrome')
        .setChromeOptions(chromeOptions).build()
        .catch((e) => (e));
    if (driver.constructor?.name == `SessionNotCreatedError`) {
        // error message
        let message = driver.message;
        let match = message.match(/Current browser version is (\d+)\./i);
        let url = null;
        if (match) {
            let [, version] = match; version = parseInt(version);
            url = version == 107 ? `107.0.5304.62` :
                version == 106 ? `106.0.5249.61` : null
        }

        // download right version chromedriver
        if (url) {
            url = `https://chromedriver.storage.googleapis.com/${url}/chromedriver_win32.zip`;

            let batch = [
                `@echo off`, `setlocal`,
                `del chromedriver.exe`, `del chromedriver_win32.zip`,
                `wget.exe ${url}`,
                `Call :UnZipFile "%~dp0" "%~dp0chromedriver_win32.zip"`,
                `del chromedriver_win32.zip`, `exit /b`,
                `:UnZipFile <ExtractTo> <newzipfile>`,
                `set vbs="%temp%\\_.vbs"`,
                `if exist %vbs% del /f /q %vbs%`,
                `>%vbs%  echo Set fso = CreateObject("Scripting.FileSystemObject")`,
                `>>%vbs% echo If NOT fso.FolderExists(%1) Then`,
                `>>%vbs% echo fso.CreateFolder(%1)`,
                `>>%vbs% echo End If`,
                `>>%vbs% echo set objShell = CreateObject("Shell.Application")`,
                `>>%vbs% echo set FilesInZip=objShell.NameSpace(%2).items`,
                `>>%vbs% echo objShell.NameSpace(%1).CopyHere(FilesInZip)`,
                `>>%vbs% echo Set fso = Nothing`,
                `>>%vbs% echo Set objShell = Nothing`,
                `cscript //nologo %vbs%`,
                `if exist %vbs% del /f /q %vbs%`
            ].join('\n');

            try {
                fs.writeFileSync(`./temp.bat`, batch);
                child_process.execSync(`temp.bat`).toString();
                fs.unlinkSync(`./temp.bat`)
            } catch (e) {
                console.log(e);
            }

        } else { console.log(message) }

    } else {
        await driver.quit();
    }

    // check login config
    if (!fs.existsSync(`./config/login.js`)) {
        fs.writeFileSync(`./config/login.js`, [
            `module.exports = {`, `    logins: [`, `        {`,
            `            email: '',	        // ???????????????`,
            `            password: '',		// ???????????????, ????????????????????????????????????`,
            `            username: ''	    // ????????????????????? twitter ?????????????????????, ??????????????????????????????`,
            `        },`, `    ]`, `}`
        ].join('\r\n'));
    }

    // main var
    const { logins } = require(`./config/login.js`);
    const { targets, realUsername } = require(`./config/targets.js`);
    let doneList = [], dieList = [];
    for (let login of logins) {
        let lists = await initBotChrome(login, targets, realUsername);
        doneList = doneList.concat(lists.doneList);
        dieList = dieList.concat(lists.dieList);
        doneList = doneList.filter((ele, i) => (doneList.indexOf(ele) === i));
        dieList = dieList.filter((ele, i) => (dieList.indexOf(ele) === i));
    }

    console.clear();
    console.log(`?????????????????????, ??????????????????: `)
    for (let done of doneList) {
        console.log(done);
    }
    console.log(`?????????????????????: `)
    for (let done of dieList) {
        console.log(done);
    }
    console.log(`?????? ENTER ????????? . . .`);

    // wait key
    let stdin = process.stdin;
    stdin.resume();
    await new Promise((resolve) => {
        stdin.on('data', resolve);
    })
    process.exit();

}; main();
