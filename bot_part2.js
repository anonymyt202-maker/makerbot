/**
 * TELEGRAM BOT - 2-QIS'M
 * Tavsifi: Callback query handler'lari va xizmat boshqaruvi
 * Manba: @education_coders
 */

const {
    bot,
    Files,
    ADMIN,
    sendMessage,
    editMessage,
    deleteMessage,
    answerCallback,
    getUserBalance,
    setUserBalance,
    addBalance,
    getTopBalance,
    getTopReferrals
} = require('./bot_part1');

// ============================================
// ADMIN MENYUSI VA CALLBACK HANDLER'LARI
// ============================================

/**
 * Admin asosiy menyusini ko'rsatish
 */
async function showAdminMenu(chatId, messageId = null) {
    const text = `<b>👨‍💼 Admin Paneli</b>

Quyidagilardan birini tanlang:`;

    const markup = JSON.stringify({
        inline_keyboard: [
            [{ text: "📊 Statistika", callback_data: "admin_stats" }],
            [{ text: "👥 Foydalanuvchilar", callback_data: "admin_users" }],
            [{ text: "💬 Broadcast", callback_data: "admin_broadcast" }],
            [{ text: "*⃣ Birlamchi sozlamalar", callback_data: "admin_settings" }],
            [{ text: "📋 Kanallar boshqarish", callback_data: "admin_channels" }],
            [{ text: "🛠 Xizmatlar", callback_data: "admin_services" }]
        ]
    });

    if (messageId) {
        await editMessage(chatId, messageId, text, { reply_markup: markup });
    } else {
        await sendMessage(chatId, text, { reply_markup: markup });
    }
}

/**
 * Statistika ko'rsatish
 */
async function showStatistics(chatId, messageId) {
    const userCount = getTotalUsers();
    const totalBalance = getTotalBalance();
    
    const text = `<b>📊 Statistika</b>

👥 Jami foydalanuvchilar: <code>${userCount}</code>
💰 Jami balans: <code>${totalBalance}</code> so'm

🔝 TOP10 Balans:
${getTopBalance()}

🔝 TOP10 Referallar:
${getTopReferrals()}`;

    const markup = JSON.stringify({
        inline_keyboard: [
            [{ text: "◀️ Orqaga", callback_data: "admin_menu" }]
        ]
    });

    await editMessage(chatId, messageId, text, { reply_markup: markup });
}

// Yordamchi funksiyalar
function getTotalUsers() {
    const fs = require('fs');
    const usersDir = "foydalanuvchi/hisob";
    if (!fs.existsSync(usersDir)) return 0;
    return fs.readdirSync(usersDir).filter(f => f.endsWith('.txt')).length;
}

function getTotalBalance() {
    const fs = require('fs');
    const path = require('path');
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
 * Xizmatlar bo'limini boshqarish
 */
async function handleServices(chatId, messageId, data) {
    if (!data) {
        // Asosiy xizmatlar menyu
        const text = "<b>🛠 Xizmatlar boshqaruvi</b>\n\nQanday qilmoqchisiz?";
        
        const markup = JSON.stringify({
            inline_keyboard: [
                [{ text: "➕ Xizmat qo'shish", callback_data: "service_add" }],
                [{ text: "📝 Xizmatlarni ko'rish", callback_data: "service_list" }],
                [{ text: "🗑 Xizmatni o'chirish", callback_data: "service_delete" }],
                [{ text: "◀️ Orqaga", callback_data: "admin_menu" }]
            ]
        });

        await editMessage(chatId, messageId, text, { reply_markup: markup });
    } else if (data === "service_add") {
        const text = "<b>➕ Yangi xizmat qo'shish</b>\n\nXizmat nomini yuboring:";
        
        const markup = JSON.stringify({
            inline_keyboard: [
                [{ text: "◀️ Orqaga", callback_data: "admin_services" }]
            ]
        });

        await editMessage(chatId, messageId, text, { reply_markup: markup });
        
        // Foydalanuvchi input kutish uchun step
        const step_path = `step/${chatId}.service_add`;
        Files.write(step_path, "waiting");
    } else if (data === "service_list") {
        const servicesDir = "sozlamalar/xizmatlar";
        let services = "";

        if (Files.list(servicesDir).length > 0) {
            const items = Files.list(servicesDir);
            items.forEach((item, index) => {
                services += `${index + 1}. ${item}\n`;
            });
        } else {
            services = "Xizmatlar mavjud emas";
        }

        const text = `<b>📝 Mavjud xizmatlar</b>\n\n${services}`;
        
        const markup = JSON.stringify({
            inline_keyboard: [
                [{ text: "◀️ Orqaga", callback_data: "admin_services" }]
            ]
        });

        await editMessage(chatId, messageId, text, { reply_markup: markup });
    }
}

/**
 * Kanal boshqaruvi
 */
async function handleChannels(chatId, messageId, action = null) {
    if (!action) {
        const text = "<b>🔗 Kanallar boshqaruvi</b>\n\nQanday qilmoqchisiz?";
        
        const markup = JSON.stringify({
            inline_keyboard: [
                [{ text: "➕ Kanal qo'shish", callback_data: "channel_add" }],
                [{ text: "📝 Kanallarni ko'rish", callback_data: "channel_list" }],
                [{ text: "🗑 Kanalni o'chirish", callback_data: "channel_delete" }],
                [{ text: "◀️ Orqaga", callback_data: "admin_menu" }]
            ]
        });

        await editMessage(chatId, messageId, text, { reply_markup: markup });
    } else if (action === "list") {
        const channelsFile = "sozlamalar/kanal/ch.txt";
        const channels = Files.read(channelsFile, "").split('\n').filter(c => c.trim());

        let text = "<b>📝 Mavjud kanallar</b>\n\n";
        if (channels.length > 0) {
            channels.forEach((channel, index) => {
                text += `${index + 1}. ${channel}\n`;
            });
        } else {
            text += "Kanallar mavjud emas";
        }

        const markup = JSON.stringify({
            inline_keyboard: [
                [{ text: "◀️ Orqaga", callback_data: "admin_channels" }]
            ]
        });

        await editMessage(chatId, messageId, text, { reply_markup: markup });
    } else if (action === "add") {
        const text = "<b>➕ Kanal qo'shish</b>\n\nKanal username'ini yuboring (masalan: @mychannel):";
        
        const markup = JSON.stringify({
            inline_keyboard: [
                [{ text: "◀️ Orqaga", callback_data: "admin_channels" }]
            ]
        });

        await editMessage(chatId, messageId, text, { reply_markup: markup });
        Files.write(`step/${chatId}.channel_add`, "waiting");
    }
}

/**
 * Sozlamalar boshqaruvi
 */
async function handleSettings(chatId, messageId, setting = null) {
    if (!setting) {
        const taklifpul = Files.read("sozlamalar/pul/referal.txt", "100");
        const valyuta = Files.read("sozlamalar/pul/valyuta.txt", "so'm");
        const adminuser = Files.read("admin.user", "");

        const text = `<b>⚙️ Birlamchi sozlamalar</b>

Hozirgi sozlamalar:
🔗 Taklif narxi - ${taklifpul}
💶 Valyuta nomi - ${valyuta}
👨‍💻 Admin useri - ${adminuser}`;

        const markup = JSON.stringify({
            inline_keyboard: [
                [{ text: "🔗 Taklif narxi", callback_data: "setting_referal" }],
                [{ text: "💶 Valyuta nomi", callback_data: "setting_currency" }],
                [{ text: "👨‍💻 Admin useri", callback_data: "setting_admin_user" }],
                [{ text: "◀️ Orqaga", callback_data: "admin_menu" }]
            ]
        });

        await editMessage(chatId, messageId, text, { reply_markup: markup });
    } else if (setting === "referal") {
        const text = "<b>🔗 Taklif narxini o'zgartirish</b>\n\nYangi narxni yuboring (raqam):";
        
        const markup = JSON.stringify({
            inline_keyboard: [
                [{ text: "◀️ Orqaga", callback_data: "admin_settings" }]
            ]
        });

        await editMessage(chatId, messageId, text, { reply_markup: markup });
        Files.write(`step/${chatId}.setting_referal`, "waiting");
    } else if (setting === "currency") {
        const text = "<b>💶 Valyuta nomini o'zgartirish</b>\n\nYangi nomni yuboring (masalan: so'm, donn):";
        
        const markup = JSON.stringify({
            inline_keyboard: [
                [{ text: "◀️ Orqaga", callback_data: "admin_settings" }]
            ]
        });

        await editMessage(chatId, messageId, text, { reply_markup: markup });
        Files.write(`step/${chatId}.setting_currency`, "waiting");
    } else if (setting === "admin_user") {
        const text = "<b>👨‍💻 Admin userini o'zgartirish</b>\n\nYangi username yuboring:";
        
        const markup = JSON.stringify({
            inline_keyboard: [
                [{ text: "◀️ Orqaga", callback_data: "admin_settings" }]
            ]
        });

        await editMessage(chatId, messageId, text, { reply_markup: markup });
        Files.write(`step/${chatId}.setting_admin_user`, "waiting");
    }
}

// ============================================
// FOYDALANUVCHI MENU
// ============================================

/**
 * Kabinet menyu
 */
async function showCabinet(chatId, userId) {
    const balance = getUserBalance(userId);
    const referrals = getReferralCount(userId);

    const text = `<b>🗄 Kabinet</b>

💰 Balans: <code>${balance}</code> so'm
👥 Do'stlar: <code>${referrals}</code> ta
🔗 Taklif havola: tg://user?id=${userId}`;

    const markup = JSON.stringify({
        resize_keyboard: true,
        keyboard: [
            [{ text: "💵 Pul ishlash" }, { text: "🤖 Botlarni boshqarish" }],
            [{ text: "☎️ Murojaat" }, { text: "🔗 Taklifnoma" }]
        ]
    });

    await sendMessage(chatId, text, { reply_markup: markup });
}

// Yordamchi funksiya
function getReferralCount(userId) {
    const referralPath = `foydalanuvchi/referal/${userId}.txt`;
    return parseInt(Files.read(referralPath, '0')) || 0;
}

/**
 * Pul ishlash menyu
 */
async function showEarningMenu(chatId) {
    const text = `<b>💵 Pul ishlash</b>

Pul ishlashning turli usullari:`;

    const markup = JSON.stringify({
        inline_keyboard: [
            [{ text: "🤖 Botni yaratish", callback_data: "create_bot" }],
            [{ text: "📝 Xizmat qo'shish", callback_data: "add_service" }],
            [{ text: "💳 To'lovni qabul qilish", callback_data: "payment" }],
            [{ text: "◀️ Orqaga", callback_data: "back_menu" }]
        ]
    });

    await sendMessage(chatId, text, { reply_markup: markup });
}

/**
 * Murojaat (contact us) menyu
 */
async function showContactMenu(chatId, admin) {
    const text = `<b>☎️ Murojaat</b>

Bizga quyidagi usullar orqali murojaat qilishingiz mumkin:

📧 Email: support@example.com
💬 Telegram: @support_bot
🌐 Vebsayt: https://example.com/support`;

    const markup = JSON.stringify({
        resize_keyboard: true,
        keyboard: [
            [{ text: "📝 Xabar yuborish" }],
            [{ text: "🤖 Botlarni boshqarish" }, { text: "🗄 Kabinet" }]
        ]
    });

    await sendMessage(chatId, text, { reply_markup: markup });
}

/**
 * Taklifnoma (referral) menyu
 */
async function showReferralMenu(chatId, userId) {
    const taklifnarx = Files.read("sozlamalar/pul/referal.txt", "100");
    const pul = Files.read("sozlamalar/pul/valyuta.txt", "so'm");

    const text = `<b>🔗 Taklifnoma</b>

Do'stlaringizni taklif qiling va pul ishlang!

💰 Har bir do'st uchun: <code>${taklifnarx}</code> ${pul}
👥 Shu kungi do'stlar: <code>${getReferralCount(userId)}</code>

🔗 Sizning taklif havola:
<code>https://t.me/YourBotUsername?start=${userId}</code>

Havola orqali shunga yuborish:
• Telegram: Suhbatga nusxa qilib yuboring
• Ijtimoiy tarmoq: Postga qo'shing
• Email: Yuboring`;

    const markup = JSON.stringify({
        resize_keyboard: true,
        keyboard: [
            [{ text: "📋 Taklif havolani nusxa qil" }],
            [{ text: "🤖 Botlarni boshqarish" }, { text: "🗄 Kabinet" }]
        ]
    });

    await sendMessage(chatId, text, { reply_markup: markup });
}

// ============================================
// BOTNI BOSHQARISH
// ============================================

/**
 * Foydalanuvchi botlarini boshqarish menyu
 */
async function showBotManagement(chatId, userId) {
    const text = `<b>🤖 Botlarni boshqarish</b>

Qanday qilmoqchisiz?`;

    const markup = JSON.stringify({
        inline_keyboard: [
            [{ text: "➕ Yangi bot qo'shish", callback_data: "bot_create" }],
            [{ text: "📝 Botlarni ko'rish", callback_data: "bot_list" }],
            [{ text: "⚙️ Sozlamalar", callback_data: "bot_settings" }],
            [{ text: "◀️ Orqaga", callback_data: "main_menu" }]
        ]
    });

    await sendMessage(chatId, text, { reply_markup: markup });
}

/**
 * Yangi bot yaratish
 */
async function createNewBot(chatId, userId, messageId) {
    const text = `<b>➕ Yangi bot yaratish</b>

Botning nomini yuboring:`;

    const markup = JSON.stringify({
        inline_keyboard: [
            [{ text: "◀️ Orqaga", callback_data: "bot_management" }]
        ]
    });

    if (messageId) {
        await editMessage(chatId, messageId, text, { reply_markup: markup });
    } else {
        await sendMessage(chatId, text, { reply_markup: markup });
    }

    Files.write(`step/${chatId}.create_bot`, "waiting_name");
}

/**
 * Botlarni ko'rish
 */
async function listUserBots(chatId, userId, messageId) {
    const botsDir = `foydalanuvchi/bot/${userId}`;
    let botList = "<b>📝 Sizning botlaringiz</b>\n\n";

    if (Files.list(botsDir).length > 0) {
        const bots = Files.list(botsDir);
        bots.forEach((bot, index) => {
            botList += `${index + 1}. ${bot}\n`;
        });
    } else {
        botList += "Botlar mavjud emas";
    }

    const markup = JSON.stringify({
        inline_keyboard: [
            [{ text: "➕ Yangi bot qo'shish", callback_data: "bot_create" }],
            [{ text: "◀️ Orqaga", callback_data: "bot_management" }]
        ]
    });

    await editMessage(chatId, messageId, botList, { reply_markup: markup });
}

// ============================================
// TRANSFER/HAMYON
// ============================================

/**
 * Hamyon (wallet) menyu
 */
async function showWallet(chatId, userId, messageId) {
    const balance = getUserBalance(userId);
    const earned = Files.read(`foydalanuvchi/sarhisob/${userId}.kiritgan`, '0');
    const spent = Files.read(`foydalanuvchi/sarhisob/${userId}.chiqargan`, '0');
    const pul = Files.read("sozlamalar/pul/valyuta.txt", "so'm");

    const text = `<b>💰 Hamyon</b>

Hozirgi balans: <code>${balance}</code> ${pul}
Kiritilgan: <code>${earned}</code> ${pul}
Chiqarilgan: <code>${spent}</code> ${pul}`;

    const markup = JSON.stringify({
        inline_keyboard: [
            [{ text: "➕ Pul kiritish", callback_data: "wallet_deposit" }],
            [{ text: "➖ Pul chiqarish", callback_data: "wallet_withdraw" }],
            [{ text: "📋 Tarixni ko'rish", callback_data: "wallet_history" }],
            [{ text: "◀️ Orqaga", callback_data: "main_menu" }]
        ]
    });

    if (messageId) {
        await editMessage(chatId, messageId, text, { reply_markup: markup });
    } else {
        await sendMessage(chatId, text, { reply_markup: markup });
    }
}

/**
 * Pul kiritish
 */
async function depositMoney(chatId, userId, messageId) {
    const text = `<b>➕ Pul kiritish</b>

Quyidagi usullardan birini tanlang:`;

    const markup = JSON.stringify({
        inline_keyboard: [
            [{ text: "Click", callback_data: "deposit_click" }],
            [{ text: "Payme", callback_data: "deposit_payme" }],
            [{ text: "Bank Transfer", callback_data: "deposit_bank" }],
            [{ text: "◀️ Orqaga", callback_data: "wallet_menu" }]
        ]
    });

    if (messageId) {
        await editMessage(chatId, messageId, text, { reply_markup: markup });
    } else {
        await sendMessage(chatId, text, { reply_markup: markup });
    }
}

/**
 * Pul chiqarish
 */
async function withdrawMoney(chatId, userId, messageId) {
    const text = `<b>➖ Pul chiqarish</b>

Quyidagi usullardan birini tanlang:`;

    const markup = JSON.stringify({
        inline_keyboard: [
            [{ text: "Humo Card", callback_data: "withdraw_humo" }],
            [{ text: "UzCard", callback_data: "withdraw_uzcard" }],
            [{ text: "Click", callback_data: "withdraw_click" }],
            [{ text: "◀️ Orqaga", callback_data: "wallet_menu" }]
        ]
    });

    if (messageId) {
        await editMessage(chatId, messageId, text, { reply_markup: markup });
    } else {
        await sendMessage(chatId, text, { reply_markup: markup });
    }
}

// ============================================
// EKSPORT
// ============================================

module.exports = {
    // Admin
    showAdminMenu,
    showStatistics,
    handleServices,
    handleChannels,
    handleSettings,

    // Foydalanuvchi
    showCabinet,
    showEarningMenu,
    showContactMenu,
    showReferralMenu,

    // Bot boshqarish
    showBotManagement,
    createNewBot,
    listUserBots,

    // Hamyon
    showWallet,
    depositMoney,
    withdrawMoney,

    // Yordamchi
    getTopBalance,
    getTopReferrals,
    getTotalUsers,
    getTotalBalance,
    getReferralCount
};
