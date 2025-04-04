import path from "node:path";
import express from "express";
import { cors } from "./cors.js";
import dotenv from "dotenv";
import qrcode from "qrcode";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

// Load environment variables
dotenv.config();

const PORT = process?.env?.PORT || 3000;

// Store connection details
let connectionStatus = "disconnected";
let qrCodeData = null;

// Token authentication middleware
const authenticateToken = (req, res, next) => {
  // Get token from request headers
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication token is required" });
  }

  // Validate token
  if (token !== process.env.API_TOKEN) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }

  // If token is valid, proceed
  next();
};

// Criando o cliente com headless: false para visualizar o navegador
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
      headless: true, // Alterado para false para visualizar o navegador
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(cors);
const downloadsPath = path.resolve("./public/");
app.use("/downloads", express.static(downloadsPath));

// Generate QR code for authentication
client.on("qr", (qr) => {
  console.log("QR Code received, scan to authenticate:");
  qrCodeData = qr;
  connectionStatus = "require_qr_scan";

  // qrcode.generate(qr, { small: true });

  // Notify webhook about new QR code if configured
  // const webhookUrl = process.env.WEBHOOK_URL;
  // if (webhookUrl) {
  //   axios.post(webhookUrl, {
  //     event: "qr_code_updated",
  //     status: connectionStatus,
  //     timestamp: new Date().toISOString()
  //   }).catch(err => {
  //     console.error("Failed to notify webhook about QR code update:", err.message);
  //   });
  // }
});

// Client is ready
client.on("ready", () => {
  console.log("WhatsApp client is ready!");
  connectionStatus = "connected";
  qrCodeData = null;

  // Notify webhook about connection success
  // const webhookUrl = process.env.WEBHOOK_URL;
  // if (webhookUrl) {
  //   axios.post(webhookUrl, {
  //     event: "client_connected",
  //     status: connectionStatus,
  //     timestamp: new Date().toISOString()
  //   }).catch(err => {
  //     console.error("Failed to notify webhook about connection success:", err.message);
  //   });
  // }
});

// Handle disconnection
client.on("disconnected", (reason) => {
  console.log("WhatsApp client disconnected:", reason);
  connectionStatus = "disconnected";
  qrCodeData = null;

  // Notify webhook about disconnection
  // const webhookUrl = process.env.WEBHOOK_URL;
  // if (webhookUrl) {
  //   axios.post(webhookUrl, {
  //     event: "client_disconnected",
  //     status: connectionStatus,
  //     reason: reason,
  //     timestamp: new Date().toISOString()
  //   }).catch(err => {
  //     console.error("Failed to notify webhook about disconnection:", err.message);
  //   });
  // }
});

// Handle incoming messages
client.on("message", async (message) => {
  console.log(`New message received: ${message.body}`);

  // Send message to webhook if configured
  // const webhookUrl = process.env.WEBHOOK_URL;
  // if (webhookUrl) {
  //   try {
  //     await axios.post(webhookUrl, {
  //       from: message.from,
  //       body: message.body,
  //       timestamp: message.timestamp,
  //       hasMedia: message.hasMedia,
  //       type: message.type,
  //     });
  //     console.log("Message forwarded to webhook");
  //   } catch (error) {
  //     console.error("Failed to send message to webhook:", error.message);
  //   }
  // }
});

// Initialize WhatsApp client
client.initialize();

// API Routes

// Health check endpoint - no auth required
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    clientReady: client.info ? true : false,
    connectionStatus
  });
});

// Connection status and QR code endpoint - requires authentication
app.get("/connection", authenticateToken, (req, res) => {
  // let qrCodeBase64 = null;

  // Convert QR code to base64 if available
  if (qrCodeData) {
    try {
      // Generate QR code as base64 data URL
      qrcode.toDataURL(qrCodeData, (err, url) => {
        if (err) {
          console.error("Error generating QR code:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to generate QR code",
            connectionStatus,
            error: err.message
          });
        }

        // qrCodeBase64 = qrCodeData;

        // Return connection status and QR code
        res.status(200).json({
          success: true,
          connectionStatus,
          qrCode: url, // This is already in base64 format (data URL)
          timestamp: new Date().toISOString()
        });
      });
    } catch (error) {
      console.error("Error processing QR code:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to process QR code",
        connectionStatus,
        error: error.message
      });
    }
  } else {
    // Return just the connection status if no QR code is available
    res.status(200).json({
      success: true,
      connectionStatus,
      qrCode: null,
      timestamp: new Date().toISOString()
    });
  }
});

// Manually initialize/restart connection - requires authentication
app.post("/connection/restart", authenticateToken, (req, res) => {
  try {
    // Force logout if currently connected
    if (connectionStatus === "connected") {
      client.logout()
        .then(() => {
          console.log("Logged out successfully");
        })
        .catch(err => {
          console.error("Error during logout:", err);
        });
    }

    // Reinitialize client
    connectionStatus = "initializing";
    client.initialize();

    res.status(200).json({
      success: true,
      message: "Connection restart initiated",
      connectionStatus
    });
  } catch (error) {
    console.error("Error restarting connection:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restart connection",
      error: error.message
    });
  }
});

// Send message endpoint - requires authentication
app.post("/send-message", authenticateToken, async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, message: "Missing required parameters: to, message" });
    }

    // Ensure the number is in the correct format (with @c.us suffix)
    const formattedNumber = to.includes("@c.us") ? to : `${to}@c.us`;

    const sentMessage = await client.sendMessage(formattedNumber, message);
    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      messageId: sentMessage.id
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, message: "Failed to send message", error: error.message });
  }
});

// Get chat history endpoint - requires authentication
app.get("/chat/:number", authenticateToken, async (req, res) => {
  try {
    const number = req.params.number;
    const formattedNumber = number.includes("@c.us") ? number : `${number}@c.us`;

    const chat = await client.getChatById(formattedNumber);
    const messages = await chat.fetchMessages({ limit: 50 });

    res.status(200).json({
      success: true,
      contact: chat.name || chat.id.user,
      messages: messages.map(msg => ({
        from: msg.from,
        body: msg.body,
        timestamp: msg.timestamp,
        fromMe: msg.fromMe,
      }))
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chat", error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
})

// Garantir que conexões sejam fechadas corretamente ao encerrar o servidor
process.on("SIGINT", async () => {
  console.log("Encerrando servidor...");
  // await redis.quit();
  process.exit(0);
});
