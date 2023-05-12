import puppeteer from "puppeteer";
import {writeFileSync} from "fs";
import {parse} from 'json2csv';

const saveAsCSV = (csvData) => {
    const csv = parse(csvData)
    writeFileSync('result.csv', csv);
}

const getQuotes = async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C://chrome-win/chrome.exe',
        headless: false,
        defaultViewport: null,
    });

    // Open a new page
    const page = await browser.newPage();

    // await page.setDefaultNavigationTimeout(0)
    await page.goto("https://www.engadget.com/news/", { waitUntil: "load", timeout: 0 });

    let results = [];
    let data = [];
    let lastPageNumber = 5;

    await page.waitForTimeout(50000);
    for (let index = 0; index < lastPageNumber; index++) {
        await page.click('li.loadmore-parent button');
        await page.waitForTimeout(5000);
    }

    results = results.concat(await extractedEvaluateCall(page));

    for (let i = 0; i < results.length; i++) {
        console.log(results[i].url);
        if (results[i].url && results[i].title && results[i].content) {
            await page.goto(results[i].url, { waitUntil: "load", timeout: 0 });
            const article = await getArticles(page);

            const insertData = {
                title: results[i].title,
                content: results[i].content,
                articles: article.article,
                url: results[i].url
            }
            data.push(insertData)
        }
    }

    // Close the browser
    await browser.close();

    saveAsCSV(data);
};

async function extractedEvaluateCall(page) {
    // Get page data
    const quotes = await page.evaluate(() => {
        const quoteList = document.querySelectorAll("article[data-component='PostCard']");

        return Array.from(quoteList).map((quote) => {
            let url = '', title = '', content = '';
            try {
                url = quote.querySelector("a").href;
            } catch (e) {

            }

            try {
                title = quote.querySelector("h2 a").innerText;
            } catch (e) {

            }

            try {
                content = quote.querySelector("div.serif").innerText;
            } catch (e) {

            }

            return { url, title, content };
        });
    });

    return quotes;
}

async function getArticles(page) {
    await page.waitForSelector('section[data-component="ArticleContainer"]')

    let article = '';

    try {
        article = await page.$eval("section[data-component='ArticleContainer']", el => el.innerText);
    } catch (e) {

    }

    return { article }
}

// Start the scraping
getQuotes();