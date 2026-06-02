/**
 * TELEGRAM BOT - 1-QIS'M
 * Tavsifi: Telegram boti uchun asosiy API funksiyalari va sozlamalar
 * Manba: @education_coders
 * Dasturchi: @muzadev
 * Tahrichi: @uzder_php
 * 
 * ILTIMOS! Bu kodning manbasini ko'rsating
 * Barcha huquqlar saqlanib qolgan
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ============================================
// SOZLAMALAR
// ============================================

const API_KEY = "8902679441:AAHT0r-V34Vkiq7AVHnfFzIXPneccHOOV5E"; // Token o'rnatish
const ADMIN = "8512512542"; // Admin ID
const API_URL = `https://api.telegram.org/bot${API_KEY}`;

// ============================================
// TELEGRАМ API FUNKSIYALARI
// ============================================

/**
 * Telegramga API so'rovi yuborish
 * @param {string} method - API metodi (sendMessage, editMessage va h.k.)
 * @param {object} data - API parametrlari
 */
async function bot(method, data = {}) {
    try {
        const response = await axios.post(
            `${API_URL}/${method}`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Bot API Xatosi (${method}):`, error.message);
        return null;
    }
}

/**
 * Fayllar/Kataloglarni o'qish va yozish funksiyalari
 */
const Files = {
    // Katalog yaratish
    mkdir: (dirPath) => {
        const dir = path.normalize(dirPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    },

    // Faylni o'qish
    read: (filePath, defaultValue = '') => {
        try {
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf-8').trim();
            }
            return defaultValue;
        } catch (error) {
            console.error(`Fayl o'qishda xato: ${filePath}`, error.message);
            return defaultValue;
        }
    },

    // Faylni yozish
    write: (filePath, content) => {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, content);
            return true;
        } catch (error) {
            console.error(`Fayl yozishda xato: ${filePath}`, error.message);
            return false;
        }
    },

    // Faylni o'chirish
    delete: (filePath) => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Fayl o'chirishda xato: ${filePath}`, error.message);
            return false;
        }
    },

    // Direktori va undagi barcha fayllarni o'chirish
    deleteFolder: (folderPath) => {
        try {
            if (fs.existsSync(folderPath)) {
                fs.rmSync(folderPath, { recursive: true, force: true });
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Direktori o'chirishda xato: ${folderPath}`, error.message);
            return false;
        }
    },

    // Katalogdagi fayllar ro'yxatini olish
    list: (dirPath) => {
        try {
            if (fs.existsSync(dirPath)) {
                return fs.readdirSync(dirPath);
            }
            return [];
        } catch (error) {
            console.error(`Fayllar ro'yxatida xato: ${dirPath}`, error.message);
            return [];
        }
    }
};

// ============================================
// FOYDALANUVCHI MA'LUMOTLARINI BOSHQARISH
// ============================================

/**
 * Foydalanuvchining balansini olish
 * @param {string} userId - Foydalanuvchi ID
 */
function getUserBalance(userId) {
    const balancePath = `foydalanuvchi/hisob/${userId}.txt`;
    return parseInt(Files.read(balancePath, '0')) || 0;
}

/**
 * Foydalanuvchining balansini o'rnatish
 * @param {string} userId - Foydalanuvchi ID
 * @param {number} amount - Yangi balans
 */
function setUserBalance(userId, amount) {
    const balancePath = `foydalanuvchi/hisob/${userId}.txt`;
    Files.write(balancePath, String(amount));
}

/**
 * Foydalanuvchining balansini oshirish
 * @param {string} userId - Foydalanuvchi ID
 * @param {number} amount - Qo'shish miqdori
 */
function addBalance(userId, amount) {
    const currentBalance = getUserBalance(userId);
    setUserBalance(userId, currentBalance + amount);
}

/**
 * Foydalanuvchining balansini kamaytirish
 * @param {string} userId - Foydalanuvchi ID
 * @param {number} amount - Kamaytirish miqdori
 */
function subtractBalance(userId, amount) {
    const currentBalance = getUserBalance(userId);
    const newBalance = Math.max(0, currentBalance - amount);
    setUserBalance(userId, newBalance);
}

/**
 * Referallarning sonini olish
 * @param {string} userId - Foydalanuvchi ID
 */
function getReferralCount(userId) {
    const referralPath = `foydalanuvchi/referal/${userId}.txt`;
    return parseInt(Files.read(referralPath, '0')) || 0;
}

/**
 * Referallarning sonini oshirish
 * @param {string} userId - Foydalanuvchi ID
 */
function addReferral(userId) {
    const count = getReferralCount(userId);
    Files.write(`foydalanuvchi/referal/${userId}.txt`, String(count + 1));
}

// ============================================
// TOP10 MA'LUMOTLARINI BOSHQARISH
// ============================================

/**
 * TOP10 balans jadvalini olish
 */
function getTopBalance() {
    let text = "🏆 TOP10 = Hisoblar\n\n";
    const dataFile = {};
    const reverse = {};

    const hisob_dir = "foydalanuvchi/hisob";
    if (fs.existsSync(hisob_dir)) {
        const files = fs.readdirSync(hisob_dir).filter(f => f.endsWith('.txt'));
        
        files.forEach(file => {
            const userId = file.replace('.txt', '');
            const balance = Files.read(path.join(hisob_dir, file), '0');
            dataFile[balance] = userId;
            reverse[userId] = parseInt(balance) || 0;
        });
    }

    // Sortirovka
    const sorted = Object.entries(reverse)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    sorted.forEach((item, index) => {
        const [userId, balance] = item;
        const order = index + 1;
        text += `<b>${order}</b>. <a href='tg://user?id=${userId}'>${userId}</a> - <code>${balance}</code> <b>so'm</b>\n`;
    });

    return text;
}

/**
 * TOP10 referallar jadvalini olish
 */
function getTopReferrals() {
    let text = "🏆 TOP10 = Do'stlar\n\n";
    const reverse = {};

    const referal_dir = "foydalanuvchi/referal";
    if (fs.existsSync(referal_dir)) {
        const files = fs.readdirSync(referal_dir).filter(f => f.endsWith('.txt'));
        
        files.forEach(file => {
            const userId = file.replace('.txt', '');
            const count = Files.read(path.join(referal_dir, file), '0');
            reverse[userId] = parseInt(count) || 0;
        });
    }

    // Sortirovka
    const sorted = Object.entries(reverse)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    sorted.forEach((item, index) => {
        const [userId, count] = item;
        const order = index + 1;
        text += `<b>${order}</b>. <a href='tg://user?id=${userId}'>${userId}</a> - <code>${count}</code> <b>ta</b>\n`;
    });

    return text;
}

// ============================================
// KANAL TEKSHIRUVI
// ============================================

/**
 * Foydalanuvchi kanalga azo bo'lganligini tekshirish
 * @param {string} userId - Foydalanuvchi ID
 */
async function checkChannelMembership(userId) {
    try {
        const channelsFile = "sozlamalar/kanal/ch.txt";
        const channels = Files.read(channelsFile, "@education_coders").split('\n');
        
        const keyboard = { inline_keyboard: [] };
        let notJoined = false;

        for (let i = 0; i < channels.length; i++) {
            const channel = channels[i].trim();
            if (!channel) continue;

            const channelName = channel.replace('@', '');
            
            try {
                // Kanalni info olish
                const chatInfo = await bot('getChat', { chat_id: `@${channelName}` });
                const chatTitle = chatInfo?.result?.title || channel;

                // Azo bo'lganligini tekshirish
                const memberStatus = await bot('getChatMember', {
                    chat_id: `@${channelName}`,
                    user_id: userId
                });

                const status = memberStatus?.result?.status;
                const isMember = status === 'creator' || status === 'administrator' || status === 'member';

                if (isMember) {
                    keyboard.inline_keyboard.push([{
                        text: `✅ ${chatTitle}`,
                        url: `https://t.me/${channelName}`
                    }]);
                } else {
                    keyboard.inline_keyboard.push([{
                        text: `❌ ${chatTitle}`,
                        url: `https://t.me/${channelName}`
                    }]);
                    notJoined = true;
                }
            } catch (error) {
                console.error(`Kanal tekshiruvida xato: ${channel}`, error.message);
            }
        }

        return { notJoined, keyboard };
    } catch (error) {
        console.error('Kanal tekshiruvida xato:', error.message);
        return { notJoined: true, keyboard: { inline_keyboard: [] } };
    }
}

// ============================================
// SOZLAMALARNI YARATISH VA BOSHLASH
// ============================================

/**
 * Barcha zarur kataloglarni yaratish
 */
function initializeDirectories() {
    const directories = [
        "foydalanuvchi",
        "foydalanuvchi/sarmoya",
        "foydalanuvchi/bot",
        "foydalanuvchi/sarhisob",
        "foydalanuvchi/hisob",
        "foydalanuvchi/referal",
        "sozlamalar",
        "sozlamalar/hamyon",
        "sozlamalar/kanal",
        "sozlamalar/tugma",
        "sozlamalar/xizmat",
        "sozlamalar/xizmatlar",
        "sozlamalar/bot",
        "sozlamalar/pul",
        "statistika",
        "otkazma",
        "botlar",
        "step",
        "baza",
        "ban",
        "nak"
    ];

    directories.forEach(dir => {
        Files.mkdir(dir);
    });
}

/**
 * Sozlamalar fayllarini boshlash
 */
function initializeSettings() {
    const settings = {
        "foydalanuvchi/hisob/default.txt": "0",
        "foydalanuvchi/referal/default.txt": "0",
        "sozlamalar/pul/valyuta.txt": "so'm",
        "sozlamalar/pul/referal.txt": "100",
        "sozlamalar/tugma/tugma1.txt": "🤖 Botlarni boshqarish",
        "sozlamalar/tugma/tugma2.txt": "🗄 Kabinet",
        "sozlamalar/tugma/tugma3.txt": "💵 Pul ishlash",
        "sozlamalar/tugma/tugma4.txt": "☎️ Murojaat",
        "sozlamalar/tugma/tugma5.txt": "@education_codersi",
        "sozlamalar/tugma/tugma6.txt": "muzadev",
        "sozlamalar/tugma/tugma7.txt": "🔗 Taklifnoma",
        "sozlamalar/kanal/ch.txt": "@education_coders",
        "statistika/hammabot.txt": "0",
        "statistika/aktivbot.txt": "0",
        "statistika/obunachi.txt": "0",
        "baza/all.num": "0"
    };

    Object.entries(settings).forEach(([filePath, content]) => {
        if (!fs.existsSync(filePath)) {
            Files.write(filePath, content);
        }
    });
}

/**
 * Foydalanuvchi uchun zarur fayllarni yaratish
 * @param {string} userId - Foydalanuvchi ID
 */
function initializeUserFiles(userId) {
    const userFiles = {
        [`foydalanuvchi/hisob/${userId}.txt`]: "0",
        [`foydalanuvchi/hisob/${userId}.1.txt`]: "0",
        [`foydalanuvchi/hisob/${userId}.1txt`]: "0",
        [`foydalanuvchi/sarhisob/${userId}.kiritgan`]: "0",
        [`foydalanuvchi/sarhisob/${userId}.chiqargan`]: "0",
        [`foydalanuvchi/referal/${userId}.txt`]: "0",
        [`foydalanuvchi/sarmoya/${userId}/sarson.txt`]: "0",
        [`otkazma/${userId}.idraqam`]: "",
        [`otkazma/${userId}.pulraqam`]: ""
    };

    Object.entries(userFiles).forEach(([filePath, content]) => {
        if (!fs.existsSync(filePath)) {
            Files.write(filePath, content);
        }
    });
}

// ============================================
// TUGMALARNI BOSHQARISH
// ============================================

/**
 * Asosiy menyuni yaratish
 * @param {object} buttons - Tugmalar ma'lumotlari
 */
function createMainMenu(buttons = {}) {
    const {
        btn1 = "🤖 Botlarni boshqarish",
        btn2 = "🗄 Kabinet",
        btn3 = "💵 Pul ishlash",
        btn4 = "☎️ Murojaat",
        btn7 = "🔗 Taklifnoma"
    } = buttons;

    return JSON.stringify({
        resize_keyboard: true,
        keyboard: [
            [{ text: btn1 }, { text: btn2 }],
            [{ text: btn3 }, { text: btn4 }],
            [{ text: btn7 }]
        ]
    });
}

/**
 * Orqaga tugmasi bilan menyuni yaratish
 */
function createBackMenu() {
    return JSON.stringify({
        inline_keyboard: [
            [{ text: "◀️ Orqaga", callback_data: "back" }]
        ]
    });
}

// ============================================
// XABAR YUBORISH FUNKSIYALARI
// ============================================

/**
 * Oddiy xabar yuborish
 * @param {string} chatId - Chat ID
 * @param {string} text - Xabar matni
 * @param {object} options - Qo'shimcha parametrlar
 */
async function sendMessage(chatId, text, options = {}) {
    const data = {
        chat_id: chatId,
        text: text,
        parse_mode: 'html',
        ...options
    };

    return await bot('sendMessage', data);
}

/**
 * Xabarni tahrirlash
 * @param {string} chatId - Chat ID
 * @param {string} messageId - Xabar ID
 * @param {string} text - Yangi matni
 * @param {object} options - Qo'shimcha parametrlar
 */
async function editMessage(chatId, messageId, text, options = {}) {
    const data = {
        chat_id: chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'html',
        ...options
    };

    return await bot('editMessageText', data);
}

/**
 * Xabarni o'chirish
 * @param {string} chatId - Chat ID
 * @param {string} messageId - Xabar ID
 */
async function deleteMessage(chatId, messageId) {
    return await bot('deleteMessage', {
        chat_id: chatId,
        message_id: messageId
    });
}

/**
 * Callback query ga javob berish
 * @param {string} callbackQueryId - Callback query ID
 * @param {string} text - Javob matni
 * @param {boolean} showAlert - Alert ko'rsatish
 */
async function answerCallback(callbackQueryId, text, showAlert = false) {
    return await bot('answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: showAlert
    });
}

// ============================================
// STATISTIKA VA HISOBLAR
// ============================================

/**
 * Jami foydalanuvchilar sonini olish
 */
function getTotalUsers() {
    const usersDir = "foydalanuvchi/hisob";
    if (!fs.existsSync(usersDir)) return 0;
    
    return fs.readdirSync(usersDir).filter(f => f.endsWith('.txt')).length;
}

/**
 * Jami pul mo'jassasini olish
 */
function getTotalBalance() {
    const usersDir = "foydalanuvchi/hisob";
    if (!fs.existsSync(usersDir)) return 0;

    let total = 0;
    const files = fs.readdirSync(usersDir).filter(f => f.endsWith('.txt'));
    
    files.forEach(file => {
        const balance = parseInt(Files.read(path.join(usersDir, file), '0')) || 0;
        total += balance;
    });

    return total;
}

/**
 * Foydalanuvchi statistikasi
 */
function getUserStats(userId) {
    return {
        balance: getUserBalance(userId),
        referrals: getReferralCount(userId),
        spent: parseInt(Files.read(`foydalanuvchi/sarhisob/${userId}.chiqargan`, '0')) || 0,
        earned: parseInt(Files.read(`foydalanuvchi/sarhisob/${userId}.kiritgan`, '0')) || 0
    };
}

// ============================================
// EKSPORT
// ============================================

module.exports = {
    // API
    bot,
    API_KEY,
    API_URL,
    ADMIN,

    // Files
    Files,

    // Foydalanuvchi funksiyalari
    getUserBalance,
    setUserBalance,
    addBalance,
    subtractBalance,
    getReferralCount,
    addReferral,
    initializeUserFiles,

    // TOP10
    getTopBalance,
    getTopReferrals,

    // Kanal tekshiruvi
    checkChannelMembership,

    // Sozlamalar
    initializeDirectories,
    initializeSettings,

    // Tugmalar
    createMainMenu,
    createBackMenu,

    // Xabar yuborish
    sendMessage,
    editMessage,
    deleteMessage,
    answerCallback,

    // Statistika
    getTotalUsers,
    getTotalBalance,
    getUserStats
};
