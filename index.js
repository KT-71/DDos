// webdriver
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
// fs
const fs = require('fs');
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

    console.log('findElementsByText', filter.value, `Array(${elements.length})`, text || '');
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
        if (text.constructor?.name == 'String') { return rawText.includes(text) ? element : null; }
        if (text.constructor?.name == 'RegExp') { return text.test(rawText) ? element : null; }
    }
    return null;
}

// bot logic
const initBotChrome = async (login, targets, realUsername) => {
    const delay = 350;

    // 非正常終止程式會殘留記錄檔, 強制清除
    {
        const TEMP = process.env.TMP || process.env.TEMP;
        for (let dir of fs.readdirSync(TEMP)) {
            if (!dir.startsWith(`scoped_dir`) || !fs.lstatSync(`${TEMP}\\${dir}`).isDirectory()) { continue; }

            fs.rmdirSync(`${TEMP}\\${dir}`, { recursive: true, force: true });
        }
    }

    // chrome
    let chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--window-size=1024,768');
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
    let target = null, doneList = [];

    let elements = [], loginStatus = 0;
    while (1) {
        let url = await driver.getCurrentUrl().catch(() => { });

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

                elements = await findElementsByText(driver, By.css(`span`), /^下一步$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);
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

                elements = await findElementsByText(driver, By.css(`span`), /^下一步$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
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

                elements = await findElementsByText(driver, By.css(`span`), `登入`);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(600);
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

        // idle...
        if (target == null && waitList.length > 0 &&
            loginStatus == 2 && url != `https://twitter.com/i/flow/login`) {
            // pop target url
            target = waitList.pop();
            if (target) { await driver.get(target); }
        }

        // all done
        if (target == null && waitList.length == 0) {
            console.clear();
            console.log(`批次檢舉已完成, 本次檢舉內容: `)
            for (let done of doneList) {
                console.log(done);
            }
            console.log(`請按 ENTER 鍵結束 . . .`);

            // wait key
            let stdin = process.stdin;
            stdin.resume();
            await new Promise((resolve) => {
                stdin.on('data', resolve);
            })

            await driver.quit();
            process.exit();
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
                elements = await findElementsByText(driver, By.css(`span`), `檢舉 @`);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), /(帳戶已停用)|(此帳戶不存在)/);
                if (!elements[0]) { return; }

                await sleep(delay);

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
                elements = await findElementsByText(driver, By.css(`span`), `檢舉推文`);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), /(此頁面不存在)|(你已檢舉此推文)/);
                if (!elements[0]) { return; }

                await sleep(delay);

                // doneList.push(target);
                target = null;
            })();
        }

        // report page
        if (loginStatus == 2 && url == `https://twitter.com/i/safety/report_story_start`) {
            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), /^開始檢舉$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), /^其他人或特定群體$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);

                elements = await findElementsByText(driver, By.css(`span`), /^下一步$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);
            })();

            await (async () => {
                regex = [/^遭受垃圾訊息攻擊$/, /^他們遭人冒充或顯示假身分$/][parseInt(Math.random() * 2)]
                elements = await findElementsByText(driver, By.css(`span`), regex);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);

                elements = await findElementsByText(driver, By.css(`span`), /^下一步$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), /^假裝成他們$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);

                elements = await findElementsByText(driver, By.css(`span`), /^下一步$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), `告訴我們某人身分遭到冒用的相關資訊`);
                if (!elements[0]) { return; }

                elements = await findElementsByText(driver, By.css(`input[data-testid='ocfTypeaheadInput']`));
                if (!elements[0]) { return; }

                if (await elements[0].getAttribute('value') != realUsername) {
                    await sleep(delay);
                    await elements[0].clear().catch(() => { });
                    await elements[0].sendKeys(realUsername);
                    await sleep(600);
                }

                elements = await findElementsByText(driver, By.css(`span`), `@${realUsername}`);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);

                elements = await findElementsByText(driver, By.css(`span`), /^下一步$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), `你是否代表`);
                if (!elements[0]) { return; }

                elements = await findElementsByText(driver, By.css(`span`), /^否$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), /^冒充他人$/);
                if (!elements[0]) { return; }

                elements = await findElementsByText(driver, By.css(`span`), /繼續$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), /^我們來確定這項檢舉正確無誤$/);
                if (!elements[0]) { return; }

                elements = await findElementsByText(driver, By.css(`span`), /^提交$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), `感謝你協助我們為每個人提供更好的`);
                if (!elements[0]) { return; }

                elements = await findElementsByText(driver, By.css(`span`), /^完成$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);

                doneList.push(target);
                target = null;
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), /^濫用推標/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);

                elements = await findElementsByText(driver, By.css(`span`), /^下一步$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);
            })();

            await (async () => {
                elements = await findElementsByText(driver, By.css(`span`), /^你似乎想要因違反/);
                if (!elements[0]) { return; }

                elements = await findElementsByText(driver, By.css(`span`), /繼續$/);
                if (!elements[0]) { return; }

                await sleep(delay);
                await elements[0].click().catch(console.log);
                await sleep(delay);
            })();
        }

        await sleep(delay);
    }
}

const main = async () => {

    // main var
    let { logins } = require(`./config/login.js`);
    let { targets, realUsername } = require(`./config/targets.js`);
    for (let login of logins) {
        await initBotChrome(login, targets, realUsername);
    }

}; main();
