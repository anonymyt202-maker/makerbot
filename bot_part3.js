/**
 * TELEGRAM BOT - 3-QIS'M (OXIRGI)
 * Tavsifi: Webhook handler, message processing, va callback query logic
 * Manba: @education_coders
 */

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const botPart1 = require('./bot_part1');
const botPart2 = require('./bot_part2');

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
    subtractBalance,
    initializeDirectories,
    initializeSettings,
    initializeUserFiles,
    checkChannelMembership,
    getTopBalance,
    getTopReferrals
} = botPart1;

const {
    showAdminMenu,
    showStatistics,
    handleServices,
    handleChannels,
    handleSettings,
    showCabinet,
    showEarningMenu,
    showContactMenu,
    showReferralMenu,
    showBotManagement,
    createNewBot,
    listUserBots,
    showWallet,
    depositMoney,
    withdrawMoney
} = botPart2;

// ============================================
// EXPRESS SERVER SOZLAMASI
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_PATH = `/webhook/${process.env.WEBHOOK_TOKEN || 'token123'}`;

app.use(bodyParser.json());

// ============================================
// WEBHOOK ENDPOINT
// ============================================

app.post(WEBHOOK_PATH, async (req, res) => {
    try {
        const update = req.body;
        
        // Initialize directories va settings
        initializeDirectories();
        initializeSettings();

        // Message processing
        if (update.message) {
            await handleMessage(update.message);
        }

        // Callback query processing
        if (update.callback_query) {
            await handleCallbackQuery(update.callback_query);
        }

        res.json({ ok: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.json({ ok: false, error: error.message });
    }
});

// ============================================
// MESSAGE HANDLER
// ============================================

async function handleMessage(message) {
    const chatId = message.chat.id;
    const userId = message.from.id;
    const firstName = message.from.first_name;
    const text = message.text || '';
    const messageId = message.message_id;

    console.log(`📨 Xabar: [${userId}] ${text}`);

    // Initialize user files
    initializeUserFiles(userId);

    // Check channel membership
    const { notJoined, keyboard } = await checkChannelMembership(userId);
    if (notJoined) {
        await sendMessage(chatId, 
            "<b>⚠️ Botdan foydalanish uchun quyidagi kanalimizga azo bo'ling va /start bosing!</b>",
            { reply_markup: JSON.stringify(keyboard) }
        );
        return;
    }

    // Get user step
    const stepPath = `step/${chatId}.txt`;
    const userStep = Files.read(stepPath, '');

    // ============================================
    // COMMANDS
    // ============================================

    if (text === '/start') {
        await handleStartCommand(chatId, userId, firstName);
    } else if (text === '/admin' && String(userId) === ADMIN) {
        await showAdminMenu(chatId);
    } else if (text === '/help') {
        await sendHelp(chatId);
    }

    // ============================================
    // MAIN MENU BUTTONS
    // ============================================

    else if (text === '🤖 Botlarni boshqarish') {
        await showBotManagement(chatId, userId);
    } else if (text === '🗄 Kabinet') {
        await showCabinet(chatId, userId);
    } else if (text === '💵 Pul ishlash') {
        await showEarningMenu(chatId);
    } else if (text === '☎️ Murojaat') {
        await showContactMenu(chatId, ADMIN);
    } else if (text === '🔗 Taklifnoma') {
        await showReferralMenu(chatId, userId);
    }

    // ============================================
    // USER STEP HANDLERS
    // ============================================

    else if (userStep === 'create_bot') {
        if (text === '🗄 Boshqaruv') {
            Files.delete(stepPath);
            await showBotManagement(chatId, userId);
        } else {
            // Bot nomini saqlash
            Files.write(`foydalanuvchi/bot/${userId}/${text}.txt`, JSON.stringify({
                name: text,
                created: new Date().toISOString(),
                status: 'active'
            }));
            Files.delete(stepPath);
            
            await sendMessage(chatId, 
                `✅ Bot "<b>${text}</b>" muvaffaqiyatli yaratildi!`,
                { 
                    reply_markup: JSON.stringify({
                        resize_keyboard: true,
                        keyboard: [[{ text: "🤖 Botlarni boshqarish" }, { text: "🗄 Kabinet" }]]
                    })
                }
            );
        }
    }

    else if (userStep === 'waiting_contact') {
        if (text === '🗄 Boshqaruv') {
            Files.delete(stepPath);
        } else {
            // Murojaat xabarini adminiga yuborish
            await sendMessage(ADMIN, 
                `📧 Yangi murojaat\n\n👤 Foydalanuvchi: ${userId}\n\n📝 Xabar:\n<code>${text}</code>`,
                { parse_mode: 'html' }
            );
            
            await sendMessage(chatId, "✅ Sizning xabaringiz adminlarga yuborildi!");
            Files.delete(stepPath);
        }
    }

    else if (userStep === 'setting_referal') {
        if (text === '🗄 Boshqaruv') {
            Files.delete(stepPath);
        } else if (!isNaN(text) && String(userId) === ADMIN) {
            Files.write("sozlamalar/pul/referal.txt", text);
            await sendMessage(chatId, "✅ Taklif narxi o'zgartirildi!");
            Files.delete(stepPath);
        }
    }

    else if (userStep === 'setting_currency') {
        if (text === '🗄 Boshqaruv') {
            Files.delete(stepPath);
        } else if (String(userId) === ADMIN) {
            Files.write("sozlamalar/pul/valyuta.txt", text);
            await sendMessage(chatId, "✅ Valyuta nomi o'zgartirildi!");
            Files.delete(stepPath);
        }
    }

    else if (userStep === 'setting_admin_user') {
        if (text === '🗄 Boshqaruv') {
            Files.delete(stepPath);
        } else if (String(userId) === ADMIN) {
            Files.write("admin.user", text);
            await sendMessage(chatId, "✅ Admin useri o'zgartirildi!");
            Files.delete(stepPath);
        }
    }

    else if (userStep === 'channel_add') {
        if (text === '🗄 Boshqaruv') {
            Files.delete(stepPath);
        } else if (String(userId) === ADMIN) {
            const currentChannels = Files.read("sozlamalar/kanal/ch.txt", "");
            const newChannels = currentChannels + "\n" + text;
            Files.write("sozlamalar/kanal/ch.txt", newChannels);
            await sendMessage(chatId, `✅ Kanal ${text} qo'shildi!`);
            Files.delete(stepPath);
        }
    }

    // ============================================
    // ADMIN STEP HANDLERS
    // ============================================

    else if (userStep === 'waiting_broadcast' && String(userId) === ADMIN) {
        if (text === '🗄 Boshqaruv') {
            Files.delete(stepPath);
        } else {
            // Barcha foydalanuvchilarga xabar yuborish
            await broadcastMessage(text);
            await sendMessage(chatId, "✅ Xabar barcha foydalanuvchilarga yuborildi!");
            Files.delete(stepPath);
        }
    }

    else {
        // Default javob
        const markup = JSON.stringify({
            resize_keyboard: true,
            keyboard: [
                [{ text: '🤖 Botlarni boshqarish' }, { text: '🗄 Kabinet' }],
                [{ text: '💵 Pul ishlash' }, { text: '☎️ Murojaat' }],
                [{ text: '🔗 Taklifnoma' }]
            ]
        });

        await sendMessage(chatId, 
            "Iltimos, menyudan birini tanlang:",
            { reply_markup: markup }
        );
    }
}

// ============================================
// CALLBACK QUERY HANDLER
// ============================================

async function handleCallbackQuery(callbackQuery) {
    const callbackId = callbackQuery.id;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    console.log(`🔘 Callback: [${userId}] ${data}`);

    // Initialize user files
    initializeUserFiles(userId);

    // ============================================
    // ADMIN CALLBACKS
    // ============================================

    if (data === 'admin_menu' && String(userId) === ADMIN) {
        await showAdminMenu(chatId, messageId);
    }

    else if (data === 'admin_stats' && String(userId) === ADMIN) {
        await showStatistics(chatId, messageId);
    }

    else if (data === 'admin_settings' && String(userId) === ADMIN) {
        await handleSettings(chatId, messageId);
    }

    else if (data.startsWith('setting_')) {
        const setting = data.replace('setting_', '');
        await handleSettings(chatId, messageId, setting);
    }

    else if (data === 'admin_services' && String(userId) === ADMIN) {
        await handleServices(chatId, messageId);
    }

    else if (data.startsWith('service_')) {
        const action = data.replace('service_', '');
        await handleServices(chatId, messageId, action);
    }

    else if (data === 'admin_channels' && String(userId) === ADMIN) {
        await handleChannels(chatId, messageId);
    }

    else if (data === 'channel_list') {
        await handleChannels(chatId, messageId, 'list');
    }

    else if (data === 'channel_add') {
        await handleChannels(chatId, messageId, 'add');
    }

    else if (data === 'admin_broadcast' && String(userId) === ADMIN) {
        await editMessage(chatId, messageId, 
            "<b>📢 Broadcast yuborish</b>\n\nXabar matni yuboring:");
        
        Files.write(`step/${chatId}.broadcast`, 'waiting_broadcast');
    }

    // ============================================
    // USER CALLBACKS
    // ============================================

    else if (data === 'bot_management') {
        await showBotManagement(chatId, userId);
    }

    else if (data === 'bot_create') {
        await createNewBot(chatId, userId, messageId);
    }

    else if (data === 'bot_list') {
        await listUserBots(chatId, userId, messageId);
    }

    else if (data === 'wallet_menu') {
        await showWallet(chatId, userId, messageId);
    }

    else if (data === 'wallet_deposit') {
        await depositMoney(chatId, userId, messageId);
    }

    else if (data === 'wallet_withdraw') {
        await withdrawMoney(chatId, userId, messageId);
    }

    else if (data === 'back_menu') {
        const markup = JSON.stringify({
            resize_keyboard: true,
            keyboard: [
                [{ text: '🤖 Botlarni boshqarish' }, { text: '🗄 Kabinet' }],
                [{ text: '💵 Pul ishlash' }, { text: '☎️ Murojaat' }],
                [{ text: '🔗 Taklifnoma' }]
            ]
        });

        await editMessage(chatId, messageId, 
            "Menyuga qaytdingiz:", 
            { reply_markup: markup }
        );
    }

    else if (data === 'back') {
        const markup = JSON.stringify({
            resize_keyboard: true,
            keyboard: [
                [{ text: '🤖 Botlarni boshqarish' }, { text: '🗄 Kabinet' }],
                [{ text: '💵 Pul ishlash' }, { text: '☎️ Murojaat' }],
                [{ text: '🔗 Taklifnoma' }]
            ]
        });

        await deleteMessage(chatId, messageId);
        await sendMessage(chatId, "Bosh menyuga qaytdingiz.", { reply_markup: markup });
    }

    // Answer callback notification
    await answerCallback(callbackId, "✅");
}

// ============================================
// START COMMAND
// ============================================

async function handleStartCommand(chatId, userId, firstName) {
    const pul = Files.read("sozlamalar/pul/valyuta.txt", "so'm");
    
    const text = `Assalamu alaikum, <b>${firstName}!</b> 👋

<b>🤖 Telegram Bot Management Platformasiga xush kelibsiz!</b>

Ushbu platforma orqali siz:
✅ Telegram botlarini osonlik bilan yaratishi mumkin
✅ Xizmatlar bilan pul ishlashi mumkin
✅ Referallar orqali qo'shimcha daromad olishi mumkin

<b>💡 Boshlash uchun:</b>
1️⃣ Menyudan biror option tanlang
2️⃣ Bot yarating yoki xizmat qo'shing
3️⃣ Pul ishlang! 💰

<b>❓ Savollaringiz bo'lsa:</b>
☎️ Murojaat qismiga o'ting yoki @support_bot ga yozing

<i>Sizning ID: <code>${userId}</code></i>`;

    const markup = JSON.stringify({
        resize_keyboard: true,
        keyboard: [
            [{ text: '🤖 Botlarni boshqarish' }, { text: '🗄 Kabinet' }],
            [{ text: '💵 Pul ishlash' }, { text: '☎️ Murojaat' }],
            [{ text: '🔗 Taklifnoma' }]
        ]
    });

    await sendMessage(chatId, text, { reply_markup: markup });

    // Log user
    const allUsersFile = "baza/all.users.txt";
    const existingUsers = Files.read(allUsersFile, "");
    
    if (!existingUsers.includes(String(userId))) {
        const newContent = existingUsers + (existingUsers ? "\n" : "") + userId;
        Files.write(allUsersFile, newContent);
    }
}

// ============================================
// HELP COMMAND
// ============================================

async function sendHelp(chatId) {
    const text = `<b>📚 Yordam</b>

<b>Menyular:</b>
🤖 <b>Botlarni boshqarish</b> - Telegram botlarini yaratish va boshqarish
🗄 <b>Kabinet</b> - Sizning profil va statistika
💵 <b>Pul ishlash</b> - Turli pul ishlash usullari
☎️ <b>Murojaat</b> - Bizga bog'lanish
🔗 <b>Taklifnoma</b> - Do'stlaringizni taklif qiling

<b>Foydali buyruqlar:</b>
/start - Botni qayta boshlash
/admin - Admin panel (adminlar uchun)
/help - Bu yordam

<b>Savollaringiz bo'lsa:</b>
Murojaat qismiga o'ting yoki @support_bot ga yozing`;

    const markup = JSON.stringify({
        resize_keyboard: true,
        keyboard: [
            [{ text: '🤖 Botlarni boshqarish' }, { text: '🗄 Kabinet' }],
            [{ text: '💵 Pul ishlash' }, { text: '☎️ Murojaat' }],
            [{ text: '🔗 Taklifnoma' }]
        ]
    });

    await sendMessage(chatId, text, { reply_markup: markup });
}

// ============================================
// BROADCAST MESSAGE
// ============================================

async function broadcastMessage(message) {
    try {
        const usersFile = "baza/all.users.txt";
        const users = Files.read(usersFile, "").split('\n').filter(u => u.trim());

        for (const userId of users) {
            if (userId) {
                await sendMessage(userId, 
                    `<b>📢 Yangi e'lon</b>\n\n${message}`,
                    { parse_mode: 'html' }
                );
                // Rate limit
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log(`✅ Broadcast yuborildi ${users.length} ta foydalanuvchiga`);
    } catch (error) {
        console.error('Broadcast error:', error);
    }
}

// ============================================
// HTTP ENDPOINTS
// ============================================

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Bot is running' });
});

// Admin stats endpoint (optional)
app.get('/api/stats', (req, res) => {
    const token = req.query.token;
    
    // Simple token validation (optional)
    if (token !== process.env.API_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const usersDir = "foydalanuvchi/hisob";
    const userCount = fs.existsSync(usersDir) 
        ? fs.readdirSync(usersDir).filter(f => f.endsWith('.txt')).length 
        : 0;

    let totalBalance = 0;
    if (fs.existsSync(usersDir)) {
        fs.readdirSync(usersDir).forEach(file => {
            const balance = parseInt(Files.read(path.join(usersDir, file), '0')) || 0;
            totalBalance += balance;
        });
    }

    res.json({
        users: userCount,
        totalBalance: totalBalance,
        timestamp: new Date().toISOString()
    });
});

// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🤖 Telegram Bot Server Started`);
    console.log(`========================================`);
    console.log(`✅ Port: ${PORT}`);
    console.log(`✅ Webhook: ${WEBHOOK_PATH}`);
    console.log(`✅ Admin ID: ${ADMIN}`);
    console.log(`========================================\n`);

    // Initialize
    initializeDirectories();
    initializeSettings();

    console.log(`📁 Direktorialari yaratildi`);
    console.log(`⚙️ Sozlamalar o'rnatildi`);
    console.log(`\n✨ Bot tayyor! Xabar kutmoqda...\n`);
});

// ============================================
// ERROR HANDLING
// ============================================

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
    app,
    handleMessage,
    handleCallbackQuery,
    handleStartCommand,
    broadcastMessage
};
