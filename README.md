# WhatsApp Web API

A RESTful API service that enables programmatic access to WhatsApp Web functionality using Node.js and whatsapp-web.js.

## Features

- WhatsApp Web client integration
- QR code authentication
- Send messages programmatically
- Fetch chat history
- Connection status monitoring
- Token-based authentication
- CORS support

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A WhatsApp account
- Modern web browser

## Installation

1. Clone the repository:
```bash
git clone https://github.com/alobato/whatsapp-api.git
cd whatsapp-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
API_TOKEN=your_secure_token_here
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```
Checks the API and WhatsApp client status. No authentication required.

### Connection Status
```
GET /connection
```
Returns the current connection status and QR code (if available).

### Restart Connection
```
POST /connection/restart
```
Manually reinitialize the WhatsApp connection.

### Send Message
```
POST /send-message
```
Send a WhatsApp message to a specified number.

Request body:
```json
{
  "to": "1234567890",
  "message": "Hello, World!"
}
```

### Get Chat History
```
GET /chat/:number
```
Retrieve chat history with a specific contact.

## Authentication

All endpoints (except `/health`) require authentication using a Bearer token:

```
Authorization: Bearer your_api_token
```

## Error Handling

The API returns appropriate HTTP status codes and JSON responses:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 500: Internal Server Error

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp Web API
- [Express.js](https://expressjs.com/) - Web framework
- [qrcode](https://github.com/soldair/node-qrcode) - QR code generation

## Disclaimer

This project is not affiliated with WhatsApp or Meta. Use at your own risk and ensure compliance with WhatsApp's terms of service.
