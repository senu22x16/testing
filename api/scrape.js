import chrome from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
    const searchQuery = req.query.q || "AL ICT"; // Default query

    try {
        const browser = await puppeteer.launch({
            args: chrome.args,
            executablePath: await chrome.executablePath,
            headless: true
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const searchURL = `https://pastpapers.wiki/?s=${encodeURIComponent(searchQuery)}`;
        await page.goto(searchURL, { waitUntil: 'networkidle2' });

        const papers = await page.evaluate(() => {
            return [...document.querySelectorAll('.jeg_post')].map(element => ({
                title: element.querySelector('.jeg_post_title a')?.innerText.trim() || "No title",
                link: element.querySelector('.jeg_post_title a')?.href || "No link",
                imageUrl: element.querySelector('.jeg_thumb img')?.src || "No image"
            }));
        });

        await browser.close();

        res.status(200).json({ success: true, data: papers });
    } catch (error) {
        console.error("Scraping error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}
